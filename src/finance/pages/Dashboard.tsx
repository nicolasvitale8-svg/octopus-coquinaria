
import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { calculatePeriodBalance, calculateJar, formatCurrency } from '../utils/calculations';
import { Account, Transaction, Jar, MonthlyBalance, Category, SubCategory } from '../financeTypes';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useFinanza } from '../context/FinanzaContext';

interface PeriodAccountState {
  account: Account;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  finalBalance: number;
  hasOpeningRecord: boolean;
}

const DetailModal: React.FC<{
  type: 'IN' | 'OUT' | 'BALANCE' | 'INVESTED';
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  periodStates: PeriodAccountState[];
  jars: Jar[];
}> = ({ type, onClose, transactions, categories, month, year, periodStates, jars }) => {
  const data = React.useMemo(() => {
    if (type === 'IN' || type === 'OUT') {
      const filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year && t.type === type;
      });

      const byCat = filtered.reduce((acc, t) => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sin Rubro';
        acc[catName] = (acc[catName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(byCat).map(([name, value]) => ({ name, value }));
    } else if (type === 'BALANCE') {
      return periodStates.map(st => ({ name: st.account.name, value: st.finalBalance }));
    } else {
      return jars.map(j => {
        const calcs = calculateJar(j);
        return { name: j.name, value: calcs.currentValue };
      });
    }
  }, [type, transactions, categories, month, year, periodStates, jars]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getTitle = () => {
    switch (type) {
      case 'IN': return 'Distribución de Ingresos';
      case 'OUT': return 'Desglose de Gastos por Rubro';
      case 'BALANCE': return 'Saldos por Cuenta';
      case 'INVESTED': return 'Detalle de Inversiones (Frascos)';
    }
  };

  return (
    <div className="fixed inset-0 bg-fin-bg/40 backdrop-blur-[20px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
      <div className="bg-[#0b1221]/90 backdrop-blur-3xl rounded-[40px] w-full max-w-4xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-12 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80"></div>
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-fin-bg rounded-2xl text-fin-muted hover:text-white transition-all border border-fin-border">
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic">{getTitle()}</h2>
            <p className="text-fin-muted text-sm font-bold tracking-widest uppercase mb-12 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
              {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 CustomScrollbar">
              {data.sort((a, b) => b.value - a.value).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-fin-bg/50 rounded-2xl border border-white/5 group hover:border-brand/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-brand tabular-nums">{formatCurrency(item.value)}</span>
                </div>
              ))}
              {data.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <LayoutGrid size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin datos registrados</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-[400px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-brand/5 rounded-full blur-[100px]"></div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={150}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141C2F', borderRadius: '24px', border: '1px solid #1F2937', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-[10px] font-black text-fin-muted uppercase tracking-[0.4em] mb-1 drop-shadow-lg">Total</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
                {formatCurrency(data.reduce((s, i) => s + i.value, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { context, setContext, businessId } = useFinanza();
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(10); // Noviembre
  const [currentYear, setCurrentYear] = useState(2025);
  const [periodStates, setPeriodStates] = useState<PeriodAccountState[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);

  useEffect(() => { loadData(); }, [context, businessId]);
  useEffect(() => { calculateDashboardData(); }, [currentMonth, currentYear, transactions, monthlyBalances, accounts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = context === 'octopus' ? businessId : undefined;
      const [t, acc, j, mb, cat, subCat] = await Promise.all([
        SupabaseService.getTransactions(bId),
        SupabaseService.getAccounts(bId),
        SupabaseService.getJars(bId),
        SupabaseService.getMonthlyBalances(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId)
      ]);

      setTransactions(t);
      setAccounts(acc);
      setJars(j);
      setMonthlyBalances(mb);
      setCategories(cat);
      setSubCategories(subCat);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardData = () => {
    const states = accounts.filter(a => a.isActive).map(acc =>
      calculatePeriodBalance(acc, transactions, monthlyBalances, currentMonth, currentYear)
    );
    setPeriodStates(states);
  };

  const totalIn = periodStates.reduce((s, st) => s + st.totalIn, 0);
  const totalOut = periodStates.reduce((s, st) => s + st.totalOut, 0);
  const totalFinal = periodStates.reduce((s, st) => s + st.finalBalance, 0);
  const totalInJars = jars.map(calculateJar).reduce((acc, j) => acc + j.currentValue, 0);

  const chartData = [
    { name: 'Entradas', amount: totalIn, color: '#10B981' },
    { name: 'Salidas', amount: totalOut, color: '#EF4444' },
    { name: 'Neto', amount: totalFinal, color: '#3B82F6' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
          <Sparkles className="text-brand animate-spin" size={24} />
        </div>
        <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Sincronizando con Octopus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* Welcome & Context Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-[0.3em]">
            <Sparkles size={12} /> {context === 'personal' ? 'Caja Personal' : 'Caja Octopus'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">{getGreeting()}, Usuario.</h1>

          {/* Context Selector Toggle */}
          <div className="flex bg-fin-card/50 p-1 rounded-2xl border border-fin-border w-fit">
            <button
              onClick={() => setContext('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${context === 'personal' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted hover:text-white'}`}
            >
              <User size={14} /> Personal
            </button>
            <button
              onClick={() => setContext('octopus')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${context === 'octopus' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted hover:text-white'}`}
            >
              <Building2 size={14} /> Octopus
            </button>
          </div>
        </div>

        <div className="flex bg-fin-card rounded-2xl border border-fin-border p-1 shadow-xl">
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth - 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <div className="px-6 flex items-center justify-center font-black text-[11px] uppercase tracking-widest text-white min-w-[140px]">
            {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => {
            const d = new Date(currentYear, currentMonth + 1);
            setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
          }} className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={() => navigate('/finance/settings')}
          className="p-4 bg-fin-card border border-fin-border rounded-2xl text-fin-muted hover:text-brand hover:border-brand/40 transition-all shadow-xl group"
          title="Configurar Respaldo"
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: 'Importar con OCR', icon: <UploadCloud />, path: '/finance/import', color: 'bg-brand/10 text-brand border-brand/20' },
          { label: 'Nueva Operación', icon: <PlusCircle />, path: '/finance/transactions', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className={`flex items-center justify-between p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95 group ${action.color}`}
          >
            <div className="flex items-center gap-4">
              <span className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest">{action.label}</span>
            </div>
            <ChevronRight size={16} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'IN', label: 'Ingresos', value: totalIn, icon: <TrendingUp />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { id: 'OUT', label: 'Salidas', value: totalOut, icon: <TrendingDown />, color: 'text-red-500', bg: 'bg-red-500/10' },
          { id: 'BALANCE', label: 'Saldo Neto', value: totalFinal, icon: <DollarSign />, color: 'text-brand', bg: 'bg-brand/10' },
          { id: 'INVESTED', label: 'Invested Capital', value: totalInJars, icon: <Lock />, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDetail(card.id as any)}
            className="bg-fin-card p-8 rounded-[32px] border border-fin-border shadow-sm group hover:border-brand/40 hover:-translate-y-1 transition-all text-left relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-all ${card.color}`}>
              <PieIcon size={14} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className="text-[9px] font-black text-fin-muted uppercase tracking-[0.2em]">{card.label}</span>
            </div>
            <h2 className="text-3xl font-black text-white tabular-nums tracking-tighter">
              {formatCurrency(card.value)}
            </h2>
          </button>
        ))}
      </div>

      {activeDetail && (
        <DetailModal
          type={activeDetail}
          onClose={() => setActiveDetail(null)}
          transactions={transactions}
          categories={categories}
          month={currentMonth}
          year={currentYear}
          periodStates={periodStates}
          jars={jars}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Chart Section */}
          <div className="bg-fin-card p-10 rounded-[32px] border border-fin-border">
            <div className="flex items-center justify-between mb-12">
              <h3 className="font-black text-xl flex items-center gap-4">
                <LayoutGrid size={20} className="text-brand" /> Distribución Mensual
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} dy={15} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#141C2F', borderRadius: '24px', border: '1px solid #1F2937', padding: '16px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={56}>
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accounts Summary */}
          <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
            <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Wallet size={20} className="text-brand" />
                <h3 className="font-black text-xl">Saldos Disponibles</h3>
              </div>
              <button onClick={() => navigate('/finance/accounts')} className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline">Gestionar</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest bg-fin-bg/40">
                    <th className="px-10 py-5">Cuenta</th>
                    <th className="px-10 py-5 text-right">Balance de Periodo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fin-border/30">
                  {periodStates.map(st => (
                    <tr key={st.account.id} className="hover:bg-fin-bg/30 transition-colors group">
                      <td className="px-10 py-6 font-bold text-white uppercase tracking-tight text-xs flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${st.finalBalance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {st.account.name}
                      </td>
                      <td className={`px-10 py-6 text-right font-black tabular-nums text-lg ${st.finalBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {formatCurrency(st.finalBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-fin-card rounded-[32px] border border-fin-border h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between bg-fin-bg/20">
              <h3 className="font-black text-xl flex items-center gap-4">
                <List size={20} className="text-brand" /> Recientes
              </h3>
              <button onClick={() => navigate('/finance/transactions')} className="p-2.5 bg-fin-bg rounded-xl border border-fin-border hover:text-brand transition-all">
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-fin-border/30 scrollbar-hide">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(t => (
                  <div key={t.id} className="p-8 hover:bg-fin-bg/30 transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[14px] font-bold text-white group-hover:text-brand transition-colors leading-tight">{t.description}</p>
                      <span className={`text-[14px] font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                        {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-fin-muted font-black uppercase tracking-[0.2em]">{t.date}</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-fin-border group-hover:bg-brand transition-colors"></div>
                    </div>
                  </div>
                ))}
              {transactions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-fin-muted space-y-4">
                  <LayoutGrid size={40} className="opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest italic opacity-40">Sin movimientos registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
