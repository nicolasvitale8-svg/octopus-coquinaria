import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { procurementService } from '../services/procurementService';
import { Insumo, Presupuesto, DetallePedido } from '../types';
import { calcularSugerido, validarPresupuesto } from '../utils/calculations';
import { PresupuestoCard } from '../components/PresupuestoCard';

export const OrderForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Si editamos

    // Data State
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
    const [items, setItems] = useState<Partial<DetallePedido>[]>([]);

    // Form State
    const [proveedor, setProveedor] = useState('');
    const [nota, setNota] = useState('');
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        const init = async () => {
            try {
                const [fetchedInsumos, fetchedPresupuesto] = await Promise.all([
                    procurementService.getInsumos(),
                    procurementService.getPresupuestoActual()
                ]);
                setInsumos(fetchedInsumos);
                setPresupuesto(fetchedPresupuesto);

                // TODO: Si es edit, cargar pedido y detalles (no implementado en V1 para brevedad)
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    // Calculations
    const totalEstimado = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    }, [items]);

    const presupCheck = useMemo(() => {
        if (!presupuesto) return { excedido: false, nuevoRestante: 0 };
        return validarPresupuesto(totalEstimado, presupuesto.monto_gastado, presupuesto.monto_limite);
    }, [totalEstimado, presupuesto]);

    // Handlers
    const handleAddItem = (insumoId: string) => {
        const insumo = insumos.find(i => i.id === insumoId);
        if (!insumo) return;

        // Calcular sugerido inicial (Mock values para consumo/pendiente por ahora)
        const consumoDiario = 1; // TODO: Fetch real history
        const pendiente = 0; // TODO: Fetch real pending

        const sugerido = calcularSugerido(
            insumo.stock_max,
            insumo.stock_min,
            insumo.stock_actual,
            consumoDiario,
            insumo.lead_time_dias,
            pendiente,
            insumo.pack_proveedor
        );

        const newItem: Partial<DetallePedido> = {
            insumo_id: insumo.id,
            insumo, // Save ref for UI
            cantidad_sugerida: sugerido,
            cantidad_real: sugerido, // Default to suggested
            unidad: insumo.unidad_medida,
            precio_unitario: insumo.precio_ultimo,
            subtotal: sugerido * insumo.precio_ultimo,
            // Snapshots
            consumo_promedio_diario: consumoDiario,
            stock_actual_snapshot: insumo.stock_actual,
            pendiente_recibir_snapshot: pendiente
        };

        setItems([...items, newItem]);
    };

    const handleUpdateItem = (index: number, field: keyof DetallePedido, value: number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        // @ts-ignore
        item[field] = value;

        if (field === 'cantidad_real' || field === 'precio_unitario') {
            item.subtotal = (item.cantidad_real || 0) * (item.precio_unitario || 0);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handeRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!presupuesto) {
            alert("No hay presupuesto activo.");
            return;
        }

        try {
            // 1. Create Order
            const newOrder = await procurementService.createPedido({
                presupuesto_id: presupuesto.id,
                fecha: new Date().toISOString(),
                proveedor,
                estado: 'BORRADOR', // Siempre nace como borrador
                total_estimado: totalEstimado,
                nota
            });

            // 2. Create Items
            for (const item of items) {
                await procurementService.upsertDetalle({
                    ...item,
                    pedido_id: newOrder.id,
                    insumo: undefined // Remove helper prop
                });
            }

            navigate('/admin/procurement');
        } catch (e) {
            console.error(e);
            alert("Error guardando el pedido");
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Nuevo Pedido</h1>
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">Cancelar</button>
            </div>

            {/* Gatekeeper Check */}
            <div className={`p-4 rounded-xl border ${presupCheck.excedido ? 'bg-red-900/20 border-red-500' : 'bg-green-900/20 border-green-500'}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className={`font-bold ${presupCheck.excedido ? 'text-red-400' : 'text-green-400'}`}>
                            {presupCheck.excedido ? '⚠️ ALERTA: Presupuesto Excedido' : '✅ Dentro del Presupuesto'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            Monto del Pedido: <span className="text-white font-mono font-bold">${totalEstimado.toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Saldo Post-Compra</p>
                        <p className={`font-mono font-bold ${presupCheck.nuevoRestante < 0 ? 'text-red-500' : 'text-neon-blue'}`}>
                            ${presupCheck.nuevoRestante.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-gray-400 text-sm mb-2">Proveedor</label>
                    <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-brand outline-none"
                        value={proveedor}
                        onChange={e => setProveedor(e.target.value)}
                        placeholder="Ej. Distribuidora Central"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-sm mb-2">Nota</label>
                    <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-brand outline-none"
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                        placeholder="Nota interna..."
                    />
                </div>
            </div>

            {/* Items Section */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="font-bold text-white">Detalle de Productos</h2>
                    <select
                        className="bg-gray-800 text-sm text-white border border-gray-600 rounded-lg p-2"
                        onChange={(e) => {
                            if (e.target.value) {
                                handleAddItem(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    >
                        <option value="">+ Agregar Producto...</option>
                        {insumos.map(i => (
                            <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.stock_actual})</option>
                        ))}
                    </select>
                </div>

                <table className="w-full text-left text-gray-400 text-sm">
                    <thead className="bg-gray-900/50 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3">Insumo</th>
                            <th className="px-4 py-3 w-32 bg-blue-900/20 text-blue-300 text-center">Sugerido</th>
                            <th className="px-4 py-3 w-32 bg-brand/10 text-brand text-center">A Pedir</th>
                            <th className="px-4 py-3 w-24">Unidad</th>
                            <th className="px-4 py-3 w-32">Precio Ref.</th>
                            <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-800/30">
                                <td className="px-4 py-3 font-medium text-white">
                                    {item.insumo?.nombre}
                                </td>
                                <td className="px-4 py-3 text-center bg-blue-900/10 font-mono text-blue-300">
                                    {item.cantidad_sugerida}
                                </td>
                                <td className="px-4 py-3 bg-neon-blue/5">
                                    <input
                                        type="number"
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-center text-brand font-bold focus:border-brand outline-none"
                                        value={item.cantidad_real}
                                        onChange={e => handleUpdateItem(index, 'cantidad_real', parseFloat(e.target.value))}
                                    />
                                </td>
                                <td className="px-4 py-3">{item.unidad}</td>
                                <td className="px-4 py-3">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1">$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent pl-4 border-b border-gray-700 focus:border-brand outline-none"
                                            value={item.precio_unitario}
                                            onChange={e => handleUpdateItem(index, 'precio_unitario', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-white">
                                    ${item.subtotal?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => handeRemoveItem(index)} className="text-red-500 hover:text-red-400">
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">
                        Agrega productos usando el selector superior.
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
                <button
                    className="px-6 py-3 rounded-lg text-gray-400 hover:text-white font-semibold"
                    onClick={() => navigate('/admin/procurement')}
                >
                    Guardar como Borrador
                </button>
                <button
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${presupCheck.excedido
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                        : 'bg-brand hover:bg-brand-hover text-black shadow-brand/20'
                        }`}
                >
                    {presupCheck.excedido ? 'Confirmar (Excede Presupuesto)' : 'Generar Pedido'}
                </button>
            </div>
        </div>
    );
};
