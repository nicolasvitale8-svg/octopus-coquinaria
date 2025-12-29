import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        criticalLeads: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (!supabase) {
                    setLoading(false);
                    return;
                }

                // Fetch leads count
                const { count: total, error: errTotal } = await supabase
                    .from('diagnosticos_express')
                    .select('*', { count: 'exact', head: true });

                // Fetch new leads (last 7 days)
                const { count: recent, error: errRecent } = await supabase
                    .from('diagnosticos_express')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

                // Fetch critical leads (red status)
                const { count: critical, error: errCritical } = await supabase
                    .from('diagnosticos_express')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Rojo');

                if (!errTotal && !errRecent && !errCritical) {
                    setStats({
                        totalLeads: total || 0,
                        newLeads: recent || 0,
                        criticalLeads: critical || 0
                    });
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="text-slate-400">Cargando métricas...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Panel de Control</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <Link to="/admin/leads" className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded">Total</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalLeads}</p>
                    <p className="text-sm text-slate-400 mt-1">Diagnósticos realizados</p>
                </Link>

                {/* Card 2 */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded">Semana</span>
                    </div>
                    <p className="text-3xl font-bold text-white">+{stats.newLeads}</p>
                    <p className="text-sm text-slate-400 mt-1">Nuevos prospectos</p>
                </div>

                {/* Card 3 - Critical */}
                <Link
                    to="/admin/leads"
                    state={{ filterStatus: 'Rojo' }}
                    className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-red-500/50 transition-colors group cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded">Acción</span>
                    </div>
                    <div className="flex items-baseline">
                        <p className="text-3xl font-bold text-white">{stats.criticalLeads}</p>
                        <span className="ml-2 text-sm text-slate-400">críticos</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 font-medium group-hover:text-red-400 transition-colors flex items-center gap-1">
                        Requieren atención <TrendingUp size={14} className="rotate-45" />
                    </p>
                </Link>
            </div>

            {/* Quick Actions / Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-lg font-semibold text-white mb-4">Accesos Rápidos</h2>
                    <div className="space-y-3">
                        <Link to="/admin/leads" className="block p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700 transition flex items-center justify-between group">
                            <span className="text-slate-200">Ver Base de Datos Completa</span>
                            <Users size={18} className="text-slate-400 group-hover:text-cyan-400" />
                        </Link>
                        <Link to="/admin/calendar" className="block p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700 transition flex items-center justify-between group">
                            <span className="text-slate-200">Gestionar Eventos del Calendario</span>
                            <CheckCircle size={18} className="text-slate-400 group-hover:text-cyan-400" />
                        </Link>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
                    <p className="text-slate-400 mb-2">Estado del Sistema</p>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-medium">Operativo</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">v1.1.0 - Módulo Consultor Activo</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
