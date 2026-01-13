import React from 'react';
import { Presupuesto } from '../types';

interface PresupuestoCardProps {
    presupuesto: Presupuesto | null;
    loading?: boolean;
}

export const PresupuestoCard: React.FC<PresupuestoCardProps> = ({ presupuesto, loading }) => {
    if (loading) return <div className="animate-pulse h-32 bg-gray-800 rounded-xl"></div>;

    if (!presupuesto) {
        return (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-gray-400">Presupuesto</h3>
                <p className="text-gray-500">No hay un presupuesto abierto para este período.</p>
                <button className="mt-4 text-neon-blue text-sm hover:underline">
                    + Abrir Nuevo Presupuesto
                </button>
            </div>
        );
    }

    const porcentaje = Math.min(100, (presupuesto.monto_gastado / presupuesto.monto_limite) * 100);
    const restante = presupuesto.monto_limite - presupuesto.monto_gastado;

    // Color del semáforo
    let barColor = 'bg-green-500';
    if (porcentaje > 75) barColor = 'bg-yellow-500';
    if (porcentaje > 90) barColor = 'bg-red-500';

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Presupuesto Actual (El Gatekeeper)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {new Date(presupuesto.fecha_inicio).toLocaleDateString()} - {new Date(presupuesto.fecha_fin).toLocaleDateString()}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${presupuesto.estado === 'ABIERTO' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {presupuesto.estado}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">
                    ${presupuesto.monto_gastado.toLocaleString()}
                </span>
                <span className="text-gray-500 font-medium">
                    / ${presupuesto.monto_limite.toLocaleString()}
                </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${porcentaje}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Estado: {porcentaje.toFixed(1)}%</span>
                <span className={`font-bold ${restante < 0 ? 'text-red-400' : 'text-neon-blue'}`}>
                    {restante < 0 ? `Excedido: $${Math.abs(restante).toLocaleString()}` : `Disponible: $${restante.toLocaleString()}`}
                </span>
            </div>
        </div>
    );
};
