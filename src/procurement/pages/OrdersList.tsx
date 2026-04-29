import React, { useEffect, useState, useMemo } from 'react';
import { procurementService } from '../services/procurementService';
import { Pedido, Presupuesto } from '../types';
import { PresupuestoCard } from '../components/PresupuestoCard';
import { useNavigate } from 'react-router-dom';

export const OrdersList: React.FC = () => {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState<string>('ALL');

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

    const pedidosFiltrados = useMemo(() => {
        if (filtroEstado === 'ALL') return pedidos;
        return pedidos.filter(p => p.estado === filtroEstado);
    }, [pedidos, filtroEstado]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'BORRADOR': return 'bg-gray-700 text-[var(--text-secondary)]';
            case 'ENVIADO': return 'bg-[rgba(0,255,157,0.10)]/50 text-[var(--color-primary-soft)]';
            case 'CONFIRMADO': return 'bg-[var(--bg-elevated)]/50 text-[var(--color-primary)]';
            case 'RECIBIDO': return 'bg-green-900/50 text-[var(--color-success)]';
            case 'CANCELADO': return 'bg-[rgba(255,77,77,0.12)]/50 text-[var(--color-danger)]';
            default: return 'bg-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        Gestión de Compras
                    </h1>
                    <p className="text-[var(--text-muted)] text-lg">
                        Control de pedidos, proveedores y presupuesto.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={() => navigate('/admin/procurement/new')}
                            className="bg-brand hover:bg-brand-hover text-black font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-brand/50 transition-all"
                        >
                            + Nuevo Pedido
                        </button>
                        <button
                            onClick={() => navigate('/admin/supply')}
                            className="bg-[var(--bg-surface)] hover:bg-gray-700 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg border border-gray-600 transition-all"
                        >
                            Insumos
                        </button>
                        <button
                            onClick={() => navigate('/admin/procurement/alerts')}
                            className="bg-[rgba(255,77,77,0.12)]/30 hover:bg-[rgba(255,77,77,0.12)]/50 text-[var(--color-danger)] font-semibold py-2 px-4 rounded-lg border border-red-800/50 transition-all"
                        >
                            🔔 Alertas Stock
                        </button>
                        <button
                            onClick={() => navigate('/admin/procurement/movements')}
                            className="bg-[var(--bg-surface)] hover:bg-gray-700 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg border border-gray-600 transition-all"
                        >
                            📦 Movimientos
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <PresupuestoCard presupuesto={presupuesto} loading={loading} />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[var(--bg-base)] rounded-md border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[var(--bg-surface)]/50">
                    <h2 className="font-semibold text-[var(--text-primary)]">Historial de Pedidos</h2>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm rounded-lg p-2 focus:border-brand outline-none"
                    >
                        <option value="ALL">Todos los estados</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="ENVIADO">Enviado</option>
                        <option value="CONFIRMADO">Confirmado</option>
                        <option value="RECIBIDO">Recibido</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">Cargando pedidos...</div>
                ) : pedidosFiltrados.length === 0 ? (
                    <div className="p-12 text-center text-[var(--text-muted)]">
                        {filtroEstado === 'ALL'
                            ? 'No hay pedidos registrados. Comienza creando uno nuevo.'
                            : `No hay pedidos con estado "${filtroEstado}".`}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[var(--text-muted)]">
                            <thead className="text-xs uppercase bg-[var(--bg-base)]/50 text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Proveedor</th>
                                    <th className="px-6 py-3">Total Est.</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {pedidosFiltrados.map((pedido) => (
                                    <tr key={pedido.id} className="hover:bg-[var(--bg-surface)]/30 transition-colors">
                                        <td className="px-6 py-4">
                                            {new Date(pedido.fecha).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
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
                                                className="text-brand hover:text-[var(--text-primary)] font-bold text-sm"
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
