import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { MOCK_HISTORY } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PlusCircle, FileText, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPercent } from '../services/calculations';
import { getDiagnosticHistory, getLastDiagnostic } from '../services/storage';

import { supabase } from '../services/supabase';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>(MOCK_HISTORY);
  const [lastDiagnostic, setLastDiagnostic] = useState<any>(null);

  useEffect(() => {
    const storedHistory = getDiagnosticHistory();
    const storedLast = getLastDiagnostic();

    if (storedHistory && storedHistory.length > 0) {
      const mappedHistory = storedHistory.map(d => ({
        month: new Date(d.date).toLocaleDateString('es-AR', { month: 'short' }),
        sales: d.monthlyRevenue || 0,
        cogs: d.cogsPercentage || 0,
        labor: d.laborPercentage || 0,
        result: d.marginPercentage || 0,
        isReal: true
      }));
      setHistory(mappedHistory);
    }

    if (storedLast) {
      setLastDiagnostic(storedLast);
    }

    const getUser = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

    // Listen for auth changes to catch session updates that happen after mount
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    }) || { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <Layout user={user}>
      {/* DEBUG BANNER - ELIMINAR LUEGO */}
      <div className="bg-yellow-200 text-black p-2 text-center text-xs font-mono mb-4">
        DEBUG INFO: User State check.
        Is User Null?: {user ? "NO" : "YES"}.
        Email: {user?.email || "No Email"}.
        ID: {user?.id || "No ID"}.
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-space">Hola, {user?.user_metadata?.full_name || user?.email || "Gastronómico"}</h1>
            <p className="text-slate-400">Acá está la salud de tu negocio en tiempo real.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/quick-diagnostic">
              <Button variant="outline" className="text-sm border-slate-600 text-slate-300">Nuevo Rápido</Button>
            </Link>
            <Link to="/deep-diagnostic">
              <Button className="flex items-center bg-[#1FB6D5] text-[#021019] hover:bg-white"><PlusCircle className="w-4 h-4 mr-2" /> Cargar Mes (Profundo)</Button>
            </Link>
          </div>
        </div>

        {/* Real Diagnostic Alert / Summary */}
        {lastDiagnostic && (
          <div className="mb-8 bg-slate-900 border-l-4 border-[#1FB6D5] p-6 rounded-r-xl shadow-lg shadow-slate-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-white font-bold text-lg mb-1 font-space">Último Diagnóstico: <span className="text-[#1FB6D5]">{lastDiagnostic.profileName}</span></h3>
                <p className="text-slate-400 text-sm">{lastDiagnostic.profileDescription}</p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase">CMV</p>
                  <p className={`font-bold font-mono ${lastDiagnostic.cogsPercentage > 35 ? 'text-[#D64747]' : 'text-[#1FA77A]'}`}>
                    {formatPercent(lastDiagnostic.cogsPercentage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Margen</p>
                  <p className={`font-bold font-mono ${lastDiagnostic.marginPercentage < 10 ? 'text-[#D64747]' : 'text-[#1FA77A]'}`}>
                    {formatPercent(lastDiagnostic.marginPercentage)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards - Dark */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Última Venta</p>
            <p className="text-2xl font-bold text-white mt-2 font-mono">
              {lastDiagnostic ? formatCurrency(lastDiagnostic.monthlyRevenue || 0) : '$ --'}
            </p>
            <span className="text-xs text-slate-600 mt-2 inline-block">Registrada en diagnóstico</span>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Costo Mercadería</p>
            <p className={`text-2xl font-bold mt-2 font-mono ${lastDiagnostic && lastDiagnostic.cogsPercentage > 35 ? 'text-[#D64747]' : 'text-[#1FA77A]'}`}>
              {lastDiagnostic ? formatPercent(lastDiagnostic.cogsPercentage) : '--%'}
            </p>
            <span className="text-xs text-slate-600 mt-2 inline-block">Meta: 30-35%</span>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Mano de Obra</p>
            <p className={`text-2xl font-bold mt-2 font-mono ${lastDiagnostic && lastDiagnostic.laborPercentage > 30 ? 'text-[#F2B350]' : 'text-[#1FA77A]'}`}>
              {lastDiagnostic ? formatPercent(lastDiagnostic.laborPercentage) : '--%'}
            </p>
            <span className="text-xs text-slate-600 mt-2 inline-block">Meta: 25%</span>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estado</p>
            <p className="text-lg font-bold text-slate-200 mt-2 truncate font-space">
              {lastDiagnostic ? lastDiagnostic.status : 'Pendiente'}
            </p>
            <span className="text-xs text-slate-600 mt-2 inline-block">Salud General</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6 font-space">Evolución Costos vs Ventas</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#021019', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="cogs" name="% Mercadería" fill="#00344F" />
                  <Bar dataKey="labor" name="% Mano de Obra" fill="#F2B350" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6 font-space">Resultado Operativo (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#021019', borderColor: '#334155', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="result" name="% Utilidad" stroke="#1FA77A" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Diagnostics Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <h3 className="text-lg font-bold text-white font-space">Historial de Reportes</h3>
            <Button variant="ghost" className="text-xs text-slate-400 hover:text-white">Ver todos</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-wider border-b border-slate-800 bg-slate-900 text-slate-500 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-3">Fecha/Mes</th>
                  <th scope="col" className="px-6 py-3">Tipo</th>
                  <th scope="col" className="px-6 py-3">Ventas</th>
                  <th scope="col" className="px-6 py-3">Resultado</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{item.month}</td>
                    <td className="px-6 py-4 text-slate-500">{item.isReal ? 'Rápido' : 'Simulado'}</td>
                    <td className="px-6 py-4 text-slate-200 font-mono">$ {formatCurrency(item.sales).replace('$', '')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.result > 15 ? 'bg-[#1FA77A]/10 text-[#1FA77A]' : 'bg-[#F2B350]/10 text-[#F2B350]'}`}>
                        {formatPercent(item.result)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <button className="text-[#1FB6D5] hover:text-white flex items-center gap-1 font-bold">
                        <FileText className="w-4 h-4" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;