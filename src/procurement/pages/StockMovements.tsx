import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { Insumo, MovimientoStock } from '../types';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Plus, X, History, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StockMovements: React.FC = () => {
    const navigate = useNavigate();
    const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [filtroInsumo, setFiltroInsumo] = useState<string>('');

    // Nuevo movimiento
    const [nuevoMov, setNuevoMov] = useState<Partial<MovimientoStock>>({
        tipo: 'ENTRADA',
        origen: 'AJUSTE',
        cantidad: 0
    });

    useEffect(() => { loadData(); }, [filtroTipo, filtroInsumo]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedMovimientos, fetchedInsumos] = await Promise.all([
                procurementService.getMovimientos({
                    tipo: filtroTipo || undefined,
                    insumo_id: filtroInsumo || undefined
                }),
                procurementService.getInsumos()
            ]);
            setMovimientos(fetchedMovimientos);
            setInsumos(fetchedInsumos);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoMov.insumo_id || !nuevoMov.cantidad) {
            alert('Complete todos los campos');
            return;
        }

        try {
            await procurementService.createMovimiento(nuevoMov);
            await loadData();
            setIsModalOpen(false);
            setNuevoMov({ tipo: 'ENTRADA', origen: 'AJUSTE', cantidad: 0 });
        } catch (e) {
            console.error(e);
            alert('Error al guardar movimiento');
        }
    };

    const getInsumoNombre = (id: string) => {
        return insumos.find(i => i.id === id)?.nombre || 'Desconocido';
    };

    const getOrigenLabel = (origen: string) => {
        const labels: Record<string, string> = {
            COMPRA: '🛒 Compra',
            VENTA: '💰 Venta',
            RECETA: '🍳 Receta',
            AJUSTE: '📝 Ajuste',
            MERMA: '📉 Merma',
            INICIAL: '📦 Inicial'
        };
        return labels[origen] || origen;
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/admin/procurement')}
                    className="flex items-center text-gray-400 hover:text-brand transition-colors mb-4 group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-space flex items-center gap-3">
                            <History className="text-brand" size={32} />
                            Movimientos de Stock
                        </h1>
                        <p className="text-fin-muted font-bold uppercase tracking-widest text-xs mt-2 pl-1">
                            Registro de entradas y salidas
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand hover:bg-brand-hover text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20"
                    >
                        <Plus size={16} />
                        Nuevo Movimiento
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
                <select
                    value={filtroTipo}
                    onChange={e => setFiltroTipo(e.target.value)}
                    className="bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                >
                    <option value="">Todos los tipos</option>
                    <option value="ENTRADA">Solo Entradas</option>
                    <option value="SALIDA">Solo Salidas</option>
                </select>
                <select
                    value={filtroInsumo}
                    onChange={e => setFiltroInsumo(e.target.value)}
                    className="bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none min-w-[200px]"
                >
                    <option value="">Todos los insumos</option>
                    {insumos.map(i => (
                        <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Tabla de Movimientos */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando movimientos...</div>
                ) : movimientos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">No hay movimientos registrados</p>
                        <p className="text-sm">Registra una entrada o salida de stock</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-gray-400">
                        <thead className="text-xs uppercase bg-gray-800/50 text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Insumo</th>
                                <th className="px-6 py-4">Origen</th>
                                <th className="px-6 py-4 text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {movimientos.map(mov => (
                                <tr key={mov.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(mov.fecha).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {mov.tipo === 'ENTRADA' ? (
                                            <span className="flex items-center gap-2 text-green-400 font-bold">
                                                <ArrowDownCircle size={18} /> Entrada
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-red-400 font-bold">
                                                <ArrowUpCircle size={18} /> Salida
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">
                                        {getInsumoNombre(mov.insumo_id)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {getOrigenLabel(mov.origen)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold text-lg ${mov.tipo === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                                        {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Nuevo Movimiento */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0b1221] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight font-space">
                            Nuevo Movimiento
                        </h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Insumo</label>
                                <select
                                    required
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                    value={nuevoMov.insumo_id || ''}
                                    onChange={e => setNuevoMov({ ...nuevoMov, insumo_id: e.target.value })}
                                >
                                    <option value="">Seleccionar insumo...</option>
                                    {insumos.map(i => (
                                        <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.stock_actual})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Tipo</label>
                                    <select
                                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                        value={nuevoMov.tipo}
                                        onChange={e => setNuevoMov({ ...nuevoMov, tipo: e.target.value as 'ENTRADA' | 'SALIDA' })}
                                    >
                                        <option value="ENTRADA">Entrada</option>
                                        <option value="SALIDA">Salida</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Origen</label>
                                    <select
                                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                        value={nuevoMov.origen}
                                        onChange={e => setNuevoMov({ ...nuevoMov, origen: e.target.value as any })}
                                    >
                                        <option value="COMPRA">Compra</option>
                                        <option value="VENTA">Venta</option>
                                        <option value="RECETA">Receta</option>
                                        <option value="AJUSTE">Ajuste</option>
                                        <option value="MERMA">Merma</option>
                                        <option value="INICIAL">Inicial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Cantidad</label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    min="0.1"
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                    value={nuevoMov.cantidad || ''}
                                    onChange={e => setNuevoMov({ ...nuevoMov, cantidad: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 font-bold uppercase text-xs">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-brand hover:bg-brand-hover text-black rounded-xl py-3 font-black uppercase text-xs tracking-widest shadow-lg shadow-brand/20">
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
