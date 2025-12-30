import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PlusCircle, FileText, TrendingUp, TrendingDown, Target, Zap, Clock, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercent } from '../services/calculations';
import { getDiagnosticHistory, getLastDiagnostic, getMyLeads } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { SemiCircleGauge, MiniProgressRing } from '../components/dashboard/DashboardGauges';

const Dashboard = () => {
  const { user, profile, isAdmin, isConsultant, isLoading: isAuthLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [lastDiagnostic, setLastDiagnostic] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoading) return;

    if (isAdmin || isConsultant) {
      navigate('/admin/leads');
      return;
    }

    const loadData = async () => {
      setIsDataLoading(true);

      // Try LocalStorage first
      const storedHistory = getDiagnosticHistory();
      const storedLast = getLastDiagnostic();

      if (storedHistory && storedHistory.length > 0) {
        mapAndSetHistory(storedHistory);
        if (storedLast) setLastDiagnostic(storedLast);
      }

      // Fetch from Supabase
      if (profile?.email) {
        const remoteLeads = await getMyLeads(profile.email);
        if (remoteLeads && remoteLeads.length > 0) {
          mapAndSetHistory(remoteLeads);
          setLastDiagnostic(remoteLeads[0]);
        }
      }
      setIsDataLoading(false);
    };

    const mapAndSetHistory = (data: any[]) => {
      const mappedHistory = data.map(d => ({
        month: d.date ? new Date(d.date).toLocaleDateString('es-AR', { month: 'short' }) : 'Mes',
        sales: d.monthlyRevenue || d.monthly_revenue || d.totalSales || d.monthly_revenue || 0,
        cogs: d.cogsPercentage || d.cogs_percentage || 0,
        labor: d.laborPercentage || d.labor_percentage || 0,
        result: d.marginPercentage || d.margin_percentage || d.result || 0,
        isReal: true
      }));
      setHistory(mappedHistory.reverse()); // Chronological order
    };

    loadData();
  }, [profile, isAuthLoading, navigate]);

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">

        {/* HERO SECTION / WELCOME */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#1FB6D5] mb-2">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono">Control de Gestión V4 (v4.1.2)</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-space tracking-tight">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{profile?.name || "Gastronómico"}</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg">
              Monitor de salud operativa y financiera de tu negocio en tiempo real.
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/quick-diagnostic">
              <Button variant="outline" className="border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800 font-bold px-6 py-6 h-auto transition-all">
                Nuevo Rápido
              </Button>
            </Link>
            <Link to="/deep-diagnostic">
              <Button className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-black px-8 py-6 h-auto shadow-[0_0_20px_rgba(31,182,213,0.3)] transition-all">
                <PlusCircle className="w-5 h-5 mr-3" /> Cargar Mes
              </Button>
            </Link>
          </div>
        </div>

        {/* MAIN BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto">

          {/* TOP KPI BOX: SALES VOLUME */}
          <div className="md:col-span-4 bg-slate-900/60 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-16 h-16 text-cyan-400" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3 text-cyan-500" /> Volumen de Ventas
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <h2 className="text-4xl font-black text-white font-mono tracking-tighter">
                {lastDiagnostic ? formatCurrency(lastDiagnostic.monthlyRevenue || lastDiagnostic.monthly_revenue || lastDiagnostic.totalSales || lastDiagnostic.amount || 0) : '$ --'}
              </h2>
            </div>
            <div className="mt-8 flex gap-3">
              <MiniProgressRing value={lastDiagnostic?.scoreGlobal || 0} label="Salud Global" color="#1FB6D5" />
            </div>
          </div>

          {/* KPI GAUGE: MARGEN OPERATIVO */}
          <div className="md:col-span-4 bg-[#021019] border border-white/10 p-8 rounded-[2rem] shadow-xl relative group">
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Margen Bruto</p>
              <Target className="w-4 h-4 text-[#1FB6D5]" />
            </div>
            <SemiCircleGauge
              value={lastDiagnostic?.marginPercentage || 0}
              label="Resultado"
              color={lastDiagnostic?.marginPercentage > 15 ? '#1FA77A' : '#F2B350'}
            />
          </div>

          {/* KPI GAUGE: CMV COST */}
          <div className="md:col-span-4 bg-slate-900/60 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md relative">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Costo de Ventas (Insumos)</p>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <SemiCircleGauge
              value={lastDiagnostic?.cogsPercentage || lastDiagnostic?.cogs_percentage || 0}
              label="Costo %"
              color={(lastDiagnostic?.cogsPercentage || lastDiagnostic?.cogs_percentage) > 35 ? '#D64747' : '#1FA77A'}
            />
            <p className="text-[10px] text-slate-600 font-bold mt-4 italic">* El CMV representa el impacto de tus insumos sobre el total vendido.</p>
          </div>

          {/* MIDDLE ROW: MAIN CHART */}
          <div className="md:col-span-8 bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white font-space tracking-tight">Evolución de Costos</h3>
                <p className="text-sm text-slate-500 mt-1">Comparativa de los últimos 6 meses registrados.</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00344F] rounded-full"></div>
                  <span className="text-xs text-slate-400">% Insumos (CMV)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#F2B350] rounded-full"></div>
                  <span className="text-xs text-slate-400">% Mano de Obra</span>
                </div>
              </div>
            </div>
            <div className="h-[550px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                  <XAxis
                    dataKey="month"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#021019', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff' }}
                  />
                  <Bar dataKey="cogs" fill="#00344F" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="labor" fill="#F2B350" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PROJECT SHORTCUT BOX */}
          <div className="md:col-span-4 bg-gradient-to-br from-[#00344F] to-[#021019] border border-[#1FB6D5]/30 p-8 rounded-[2.5rem] flex flex-col justify-between group cursor-pointer relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
              <Briefcase className="w-48 h-48 text-white rotate-12" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1FB6D5] uppercase tracking-[0.2em] mb-4">Módulo de Seguimiento</h4>
              <h3 className="text-2xl font-bold text-white font-space leading-tight pr-4">Tu Proyecto de Gestión Gastronómica</h3>
              <p className="text-slate-400 text-sm mt-4">Consulta el avance de tus hitos, descarga entregables y mira el estado de tus tareas.</p>
            </div>
            <Link to={profile?.businessIds?.[0] ? `/hub/project/${profile.businessIds[0]}` : '#'} className="mt-8">
              <button className="w-full bg-white text-[#021019] hover:bg-[#1FB6D5] hover:text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl">
                IR AL PROYECTO <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {/* HISTORY TABLE BOX */}
          <div className="md:col-span-12 bg-slate-900/30 border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="px-10 py-8 flex justify-between items-center border-b border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white font-space">Historial de Reportes</h3>
                <p className="text-xs text-slate-500 mt-1">Trazabilidad histórica de tus diagnósticos rápidos y profundos.</p>
              </div>
              <Button variant="ghost" className="text-xs text-slate-500 hover:text-[#1FB6D5] font-bold">Descargar Todo (CSV)</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-950/40 text-[10px] uppercase font-black tracking-widest text-slate-500">
                  <tr>
                    <th className="px-10 py-5">Periodo</th>
                    <th className="px-10 py-5">Estado</th>
                    <th className="px-10 py-5 text-right">Fuerza de Venta</th>
                    <th className="px-10 py-5 text-center">Rendimiento (Utilidad)</th>
                    <th className="px-10 py-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-cyan-500/[0.02] transition-colors group">
                      <td className="px-10 py-6 font-bold text-white font-space">{item.month}</td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.result > 15 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
                          <span className="text-slate-400 text-xs font-medium">{item.isReal ? 'Registrado' : 'Proyectado'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right font-mono text-white text-sm font-bold">
                        $ {formatCurrency(item.sales).replace('$', '')}
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-tighter ${item.result > 15 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                          {formatPercent(item.result)}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <button className="p-2 text-slate-500 hover:text-[#1FB6D5] hover:bg-[#1FB6D5]/10 rounded-xl transition-all">
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4 border-t border-white/5 opacity-40">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-slate-500 font-bold uppercase tracking-widest">Sincronización Cloud Activa</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> Reporte Generado hoy {new Date().toLocaleDateString()}</span>
          </div>
        </div>

      </div>
    </Layout>
  );
};

// Internal Import helper
const Briefcase = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

export default Dashboard;