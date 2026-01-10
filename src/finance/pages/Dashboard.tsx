
import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { calculatePeriodBalance, calculateJar, formatCurrency, calculateBudgetAlerts } from '../utils/calculations';
import { Account, Transaction, Jar, MonthlyBalance, Category, SubCategory, BudgetItem } from '../financeTypes';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X, Bell, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useFinanza } from '../context/FinanzaContext';
import { useAuth } from '../../contexts/AuthContext';

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
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === month && d.getFullYear() === year && t.type === type && !isTransfer;
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
    <div className="fixed inset-0 bg-fin-bg/40 backdrop-blur-[20px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-[#0b1221]/95 backdrop-blur-3xl rounded-[40px] w-full max-w-4xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-6 md:p-12 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col my-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80 z-10"></div>
        <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-fin-bg rounded-2xl text-fin-muted hover:text-white transition-all border border-fin-border z-20">
          <X size={20} />
        </button>

        <div className="overflow-y-auto CustomScrollbar pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase italic">{getTitle()}</h2>
              <p className="text-fin-muted text-sm font-bold tracking-widest uppercase mb-6 md:mb-12 flex items-center gap-2">
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

            <div className="h-[300px] md:h-[400px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-brand/5 rounded-full blur-[100px]"></div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
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
                <p className="text-xl md:text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
                  {formatCurrency(data.reduce((s, i) => s + i.value, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeEntity, setActiveEntity, availableEntities, setAlertCount, isLoading: isContextLoading } = useFinanza();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);

  // Auto-selection is now handled by FinanzaContext initialization

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jars, setJars] = useState<Jar[]>([]);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [periodStates, setPeriodStates] = useState<PeriodAccountState[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);

  useEffect(() => { loadData(); }, [activeEntity]);
  useEffect(() => { calculateDashboardData(); }, [currentMonth, currentYear, transactions, monthlyBalances, accounts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;
      const [t, acc, j, mb, cat, subCat, budget] = await Promise.all([
        SupabaseService.getTransactions(bId),
        SupabaseService.getAccounts(bId),
        SupabaseService.getJars(bId),
        SupabaseService.getMonthlyBalances(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getBudgetItems(bId)
      ]);

      setTransactions(t);
      setAccounts(acc);
      setJars(j);
      setMonthlyBalances(mb);
      setCategories(cat);
      setSubCategories(subCat);
      setBudgetItems(budget);
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

  // Totales excluyendo transferencias entre cuentas (para el resumen global)
  const totalIn = React.useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'IN' && !isTransfer;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth, currentYear]);

  const totalOut = React.useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'OUT' && !isTransfer;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth, currentYear]);

  const totalFinal = periodStates.reduce((s, st) => s + st.finalBalance, 0);
  const totalInJars = jars.map(calculateJar).reduce((acc, j) => acc + j.currentValue, 0);

  const chartData = [
    { name: 'Entradas', amount: totalIn, color: '#10B981' },
    { name: 'Salidas', amount: totalOut, color: '#EF4444' },
    { name: 'Neto', amount: totalIn - totalOut, color: '#3B82F6' },
  ];

  // Logic for Alerts (V2 Phase 1)
  const alerts = React.useMemo(() => {
    return calculateBudgetAlerts(budgetItems, transactions, currentMonth, currentYear);
  }, [budgetItems, transactions, currentMonth, currentYear]);

  // Sync alert count with context
  useEffect(() => {
    setAlertCount(alerts.length);
  }, [alerts.length]);

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
          <div className="flex bg-fin-card/50 p-1 rounded-2xl border border-fin-border w-fit max-w-full overflow-x-auto scrollbar-hide">
            {availableEntities.map(entity => (
              <button
                key={entity.id || 'personal'}
                onClick={() => setActiveEntity(entity)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeEntity.id === entity.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-fin-muted hover:text-white'}`}
              >
                {entity.type === 'personal' ? <User size={14} /> : <Building2 size={14} />}
                {entity.name}
              </button>
            ))}
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
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white tabular-nums tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(card.value)}>
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
        </div>
      </div>

      {/* Sidebar right side */}
      <div className="lg:col-span-1 space-y-10">
        {/* Alerts Section (V2 Phase 1) */}
        {alerts.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-xl text-red-500 animate-pulse">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Pendientes de {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long' })}</h3>
                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-tighter">Acciones requeridas ({alerts.length})</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {alerts.slice(0, 5).map((alert, i) => {
                const cat = categories.find(c => c.id === alert.categoryId);
                const sub = subCategories.find(s => s.id === alert.subCategoryId);
                const isPast = (alert.plannedDate || 1) < new Date().getDate();

                return (
                  <div key={i} className="bg-[#0b1221]/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPast ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {alert.type === 'OUT' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{alert.label}</p>
                        <p className="text-[9px] font-bold text-fin-muted uppercase truncate">{cat?.name} {sub ? `• ${sub.name}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-white">{formatCurrency(alert.plannedAmount)}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest ${isPast ? 'text-red-500' : 'text-amber-500'}`}>
                        {isPast ? 'Atrasado' : `Día ${alert.plannedDate}`}
                      </p>
                    </div>
                  </div>
                );
              })}
              {alerts.length > 5 && (
                <button
                  onClick={() => navigate('/finance/budget')}
                  className="bg-white/5 border border-dashed border-white/10 p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-fin-muted hover:text-white transition-all"
                >
                  Ver {alerts.length - 5} más <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero Stats / Recientes */}
        <div className="bg-fin-card rounded-[32px] border border-fin-border shadow-2xl overflow-hidden flex flex-col h-fit">
          <div className="px-10 py-8 border-b border-fin-border flex items-center justify-between bg-fin-bg/20">
            <h3 className="font-black text-xl flex items-center gap-4">
              <List size={20} className="text-brand" /> Recientes
            </h3>
            <button onClick={() => navigate('/finance/transactions')} className="p-2.5 bg-fin-bg rounded-xl border border-fin-border hover:text-brand transition-all">
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="divide-y divide-fin-border/30 scrollbar-hide">
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
              <div className="flex flex-col items-center justify-center p-12 text-center text-fin-muted space-y-4">
                <LayoutGrid size={40} className="opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest italic opacity-40">Sin movimientos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
