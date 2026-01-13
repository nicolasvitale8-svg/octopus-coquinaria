import React, { useEffect, useState } from 'react';
import { procurementService } from '../services/procurementService';
import { Pedido, Presupuesto } from '../types';
import { PresupuestoCard } from '../components/PresupuestoCard';
import { useNavigate } from 'react-router-dom';

export const OrdersList: React.FC = () => {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [fetchedPedidos, fetchedPresupuesto] = await Promise.all([
                procurementService.getPedidos(),
                procurementService.getPresupuestoActual()
            ]);
            setPedidos(fetchedPedidos);
            setPresupuesto(fetchedPresupuesto);
        } catch (error) {
            console.error('Error loading procurement data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'BORRADOR': return 'bg-gray-700 text-gray-300';
            case 'ENVIADO': return 'bg-blue-900/50 text-blue-300';
            case 'CONFIRMADO': return 'bg-purple-900/50 text-purple-300';
            case 'RECIBIDO': return 'bg-green-900/50 text-green-300';
            case 'CANCELADO': return 'bg-red-900/50 text-red-300';
            default: return 'bg-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Gestión de Compras
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Control de pedidos, proveedores y presupuesto.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => navigate('/admin/procurement/new')}
                            className="bg-brand hover:bg-brand-hover text-black font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-brand/50 transition-all"
                        >
                            + Nuevo Pedido
                        </button>
                        <button
                            onClick={() => navigate('/admin/supply')}
                            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg border border-gray-600 transition-all"
                        >
                            Ver Insumos
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <PresupuestoCard presupuesto={presupuesto} loading={loading} />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h2 className="font-semibold text-white">Historial de Pedidos</h2>
                    <select className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg p-2 focus:border-brand outline-none">
                        <option value="ALL">Todos los estados</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="ENVIADO">Enviado</option>
                        <option value="RECIBIDO">Recibido</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
                ) : pedidos.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No hay pedidos registrados. Comienza creando uno nuevo.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-400">
                            <thead className="text-xs uppercase bg-gray-900/50 text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Proveedor</th>
                                    <th className="px-6 py-3">Total Est.</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {pedidos.map((pedido) => (
                                    <tr key={pedido.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            {new Date(pedido.fecha).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {pedido.proveedor || 'Sin proveedor'}
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            ${pedido.total_estimado?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(pedido.estado)}`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/admin/procurement/${pedido.id}`)}
                                                className="text-brand hover:text-white font-bold text-sm"
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
