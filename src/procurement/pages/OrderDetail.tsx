import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { procurementService } from '../services/procurementService';
import { Pedido, DetallePedido } from '../types';

export const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [items, setItems] = useState<DetallePedido[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (orderId: string) => {
        try {
            // Fetch pedido and items in parallel
            const [fetchedPedido, fetchedItems] = await Promise.all([
                procurementService.getPedidoById(orderId),
                procurementService.getDetallesPedido(orderId)
            ]);

            setPedido(fetchedPedido);
            setItems(fetchedItems);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async () => {
        if (!id) return;
        if (!window.confirm("¿Confirmar recepción? Esto aumentará el stock.")) return;

        try {
            await procurementService.recibirPedido(id);
            alert("Pedido recibido y stock actualizado.");
            navigate('/admin/procurement');
        } catch (e) {
            console.error(e);
            alert("Error al recibir pedido.");
        }
    };

    if (loading) return <div className="p-8 text-white">Cargando detalles...</div>;
    if (!pedido) return <div className="p-8 text-white">Pedido no encontrado</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <button onClick={() => navigate('/admin/procurement')} className="text-gray-400 hover:text-white mb-2">
                        ← Volver
                    </button>
                    <h1 className="text-3xl font-bold text-white">Pedido #{pedido.id.slice(0, 8)}</h1>
                    <p className="text-gray-400">{new Date(pedido.fecha).toLocaleDateString()} — {pedido.proveedor}</p>
                </div>
                <div className="text-right">
                    <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-bold border border-gray-600">
                        {pedido.estado}
                    </span>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-gray-400">
                    <thead className="bg-gray-800 text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Insumo</th>
                            <th className="px-6 py-3 text-center">Cantidad</th>
                            <th className="px-6 py-3 text-center">Unidad</th>
                            <th className="px-6 py-3 text-right">Costo Unit.</th>
                            <th className="px-6 py-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 text-white font-medium">{item.insumo?.nombre}</td>
                                <td className="px-6 py-4 text-center">{item.cantidad_real}</td>
                                <td className="px-6 py-4 text-center text-sm">{item.unidad}</td>
                                <td className="px-6 py-4 text-right">${item.precio_unitario?.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-white font-mono">${(item.cantidad_real * item.precio_unitario).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-800/50">
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-right font-bold text-white">TOTAL</td>
                            <td className="px-6 py-4 text-right font-mono text-brand text-lg font-bold">
                                ${items.reduce((sum, i) => sum + (i.cantidad_real * i.precio_unitario), 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                {pedido.estado === 'BORRADOR' && (
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold">
                        Enviar a Proveedor
                    </button>
                )}
                {(pedido.estado === 'ENVIADO' || pedido.estado === 'CONFIRMADO') && (
                    <button
                        onClick={handleReceive}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20"
                    >
                        Marcar como Recibido (Ingresar Stock)
                    </button>
                )}
            </div>
        </div>
    );
};
