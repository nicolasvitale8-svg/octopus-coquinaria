
import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { chequeService, Cheque } from '../services/chequeService';
import { calculatePeriodBalance, calculateJar, formatCurrency, calculateBudgetAlerts, generateAuditReport } from '../utils/calculations';
import { Account, Transaction, Jar, MonthlyBalance, Category, SubCategory, BudgetItem, AuditReport } from '../financeTypes';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X, Bell, AlertTriangle, FileText, CreditCard, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useFinanza } from '../context/FinanzaContext';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetRPMGauge } from '../components/BudgetRPMGauge';
import { AuditReportModal } from '../components/AuditReportModal';
import { loanService, Loan, LoanPayment } from '../services/loanService';
import { macroService, InflationDataPoint } from '../services/macroService';

interface PeriodAccountState {
  account: Account;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  finalBalance: number;
  hasOpeningRecord: boolean;
}

// Helper para parsear fechas string "YYYY-MM-DD" en local sin timezone shift
const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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
        const d = parseDate(t.date);
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
    <div className="fixed inset-0 bg-fin-bg/40 backdrop-blur-[20px] flex items-start justify-center z-[100] p-4 pt-20 animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-[#0b1221]/95 backdrop-blur-3xl rounded-[40px] w-full max-w-4xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] p-6 md:p-12 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col">
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
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);
  const [monthReport, setMonthReport] = useState<AuditReport | null>(null);
  const [loansList, setLoansList] = useState<Loan[]>([]);
  const [loanPaymentsMap, setLoanPaymentsMap] = useState<Record<string, LoanPayment[]>>({});
  const [inflationData, setInflationData] = useState<InflationDataPoint[]>([]);

  useEffect(() => { loadData(); }, [activeEntity]);
  useEffect(() => { calculateDashboardData(); }, [currentMonth, currentYear, transactions, monthlyBalances, accounts]);


  const loadData = async () => {
    setLoading(true);
    // Limpiar estados para evitar mostrar datos del contexto anterior
    setTransactions([]);
    setAccounts([]);
    setJars([]);
    setMonthlyBalances([]);
    setCategories([]);
    setSubCategories([]);
    setBudgetItems([]);

    try {
      const bId = activeEntity.id || undefined;
      const [t, acc, j, mb, cat, subCat, budget, chqs, inflationOut] = await Promise.all([
        SupabaseService.getTransactions(bId),
        SupabaseService.getAccounts(bId),
        SupabaseService.getJars(bId),
        SupabaseService.getMonthlyBalances(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getBudgetItems(bId),
        chequeService.getAll(bId || ''),
        macroService.getMonthlyInflation()
      ]);

      setTransactions(t);
      setAccounts(acc);
      setJars(j);
      setMonthlyBalances(mb);
      setCategories(cat);
      setSubCategories(subCat);
      setBudgetItems(budget);
      setCheques(chqs);
      setInflationData(inflationOut);

      // Cargar préstamos
      try {
        const loans = await loanService.getAll(bId);
        setLoansList(loans);
        if (loans.length > 0) {
          const payMap: Record<string, LoanPayment[]> = {};
          const ids = loans.map(l => l.id);
          const allPay = await loanService.getAllPayments(ids);
          allPay.forEach(p => {
            if (!payMap[p.loan_id]) payMap[p.loan_id] = [];
            payMap[p.loan_id].push(p);
          });
          setLoanPaymentsMap(payMap);
        }
      } catch (e) {
        console.warn('Loans not available:', e);
      }
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
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'IN' && !isTransfer;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth, currentYear]);

  const totalOut = React.useMemo(() => {
    return transactions
      .filter(t => {
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'OUT' && !isTransfer;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth, currentYear]);

  const totalFinal = periodStates.reduce((s, st) => s + st.finalBalance, 0);
  const totalInJars = jars.map(calculateJar).reduce((acc, j) => acc + j.currentValue, 0);

  const totalBudgeted = React.useMemo(() => {
    return budgetItems
      .filter(item => item.month === currentMonth && item.year === currentYear && item.type === 'OUT')
      .reduce((sum, item) => sum + item.plannedAmount, 0);
  }, [budgetItems, currentMonth, currentYear]);

  // Distribución de gastos por categoría para el Donut
  const expensesByCategory = React.useMemo(() => {
    const categoryMap: Record<string, { name: string; amount: number; color: string }> = {};
    const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#f97316'];

    transactions
      .filter(t => {
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'OUT' && !isTransfer;
      })
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat?.name || 'Sin Categoría';
        if (!categoryMap[catName]) {
          const colorIndex = Object.keys(categoryMap).length % COLORS.length;
          categoryMap[catName] = { name: catName, amount: 0, color: COLORS[colorIndex] };
        }
        categoryMap[catName].amount += t.amount;
      });

    return Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, currentMonth, currentYear]);

  // Budget vs Actual per category
  const budgetVsActual = React.useMemo(() => {
    const currentItems = budgetItems.filter(
      i => i.month === currentMonth && i.year === currentYear && i.type === 'OUT'
    );

    // Group by category
    const catMap: Record<string, { name: string; budgeted: number; actual: number }> = {};
    currentItems.forEach(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      const catName = cat?.name || 'Sin Categoría';
      if (!catMap[catName]) catMap[catName] = { name: catName, budgeted: 0, actual: 0 };
      catMap[catName].budgeted += item.plannedAmount;
    });

    // Match actuals from transactions
    transactions
      .filter(t => {
        const d = parseDate(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'OUT';
      })
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat?.name || 'Sin Categoría';
        if (!catMap[catName]) catMap[catName] = { name: catName, budgeted: 0, actual: 0 };
        catMap[catName].actual += t.amount;
      });

    return Object.values(catMap)
      .filter(c => c.budgeted > 0 || c.actual > 0)
      .sort((a, b) => b.budgeted - a.budgeted);
  }, [budgetItems, transactions, categories, currentMonth, currentYear]);

  const totalBudgetedOut = budgetVsActual.reduce((s, c) => s + c.budgeted, 0);
  const totalActualOut = budgetVsActual.reduce((s, c) => s + c.actual, 0);

  // Logic for Alerts (V2 Phase 1)
  const alerts = React.useMemo(() => {
    return calculateBudgetAlerts(budgetItems, transactions, currentMonth, currentYear);
  }, [budgetItems, transactions, currentMonth, currentYear]);

  // Upcoming Cheques Logic
  const upcomingCheques = React.useMemo(() => {
    return cheques
      .filter(c => {
        if (c.status !== 'PENDIENTE' || c.type !== 'PROPIO') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentDate = new Date(c.payment_date);
        paymentDate.setHours(0, 0, 0, 0);
        const diffTime = paymentDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
  }, [cheques]);

  // Upcoming Loan Installments
  const upcomingInstallments = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 2);
    const limit = nextMonth.toISOString().split('T')[0];

    const items: { loan: Loan; payment: LoanPayment; isOverdue: boolean }[] = [];

    loansList.filter(l => l.status === 'ACTIVO' && l.direction !== 'GIVEN').forEach(loan => {
      const payments = loanPaymentsMap[loan.id] || [];
      payments
        .filter(p => p.status === 'PENDIENTE' && p.due_date <= limit)
        .forEach(p => {
          items.push({ loan, payment: p, isOverdue: p.due_date < today });
        });
    });

    return items.sort((a, b) => a.payment.due_date.localeCompare(b.payment.due_date));
  }, [loansList, loanPaymentsMap]);

  const totalDebtRemaining = React.useMemo(() => {
    return loansList
      .filter(l => l.status === 'ACTIVO' && l.direction !== 'GIVEN')
      .reduce((sum, l) => {
        const paid = (loanPaymentsMap[l.id] || []).filter(p => p.status === 'PAGADA').reduce((s, p) => s + p.amount, 0);
        return sum + (l.total_amount - paid);
      }, 0);
  }, [loansList, loanPaymentsMap]);

  // Jar Performance
  const jarPerformance = React.useMemo(() => {
    return jars.map(j => {
      const calc = calculateJar(j);
      return { ...calc, progressPct: j ? Math.min(100, (calc.daysElapsed / Math.max(calc.daysTotal, 1)) * 100) : 0 };
    });
  }, [jars]);

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

        {/* Generate Report Button - Only for past months */}
        {(currentYear < new Date().getFullYear() || (currentYear === new Date().getFullYear() && currentMonth < new Date().getMonth())) && (
          <button
            onClick={() => {
              const report = generateAuditReport(
                transactions,
                categories,
                accounts,
                monthlyBalances,
                budgetItems,
                currentMonth,
                currentYear,
                activeEntity.name
              );
              setMonthReport(report);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-brand/10 border border-brand/30 rounded-2xl text-brand hover:bg-brand/20 transition-all shadow-xl group"
            title="Generar Informe del Mes"
          >
            <FileText size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Informe</span>
          </button>
        )}

        <button
          onClick={() => navigate('/finance/settings')}
          className="p-4 bg-fin-card border border-fin-border rounded-2xl text-fin-muted hover:text-brand hover:border-brand/40 transition-all shadow-xl group"
          title="Configurar Respaldo"
        >
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      {/* Monthly Report Modal */}
      {monthReport && (
        <AuditReportModal
          report={monthReport}
          onClose={() => setMonthReport(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'IN', label: 'Ingresos', value: totalIn, icon: <TrendingUp />, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'hover:border-emerald-500/50' },
          { id: 'OUT', label: 'Salidas', value: totalOut, icon: <TrendingDown />, color: 'text-red-400', bg: 'bg-red-500/5', border: 'hover:border-red-500/50' },
          { id: 'BALANCE', label: 'Saldo Neto', value: totalFinal, icon: <DollarSign />, color: 'text-brand', bg: 'bg-brand/5', border: 'hover:border-brand/50' },
          { id: 'INVESTED', label: 'Invested Capital', value: totalInJars, icon: <Lock />, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'hover:border-amber-500/50' }
        ].map((card, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDetail(card.id as any)}
            className={`bg-[#0b1221]/60 backdrop-blur-xl p-8 rounded-[40px] border border-white/5 shadow-2xl group ${card.border} hover:-translate-y-2 transition-all duration-500 text-left relative overflow-hidden`}
          >
            <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-all duration-700 group-hover:scale-150 ${card.bg.replace('5/', '20/')}`}></div>
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-black text-fin-muted uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity">{card.label}</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tighter" title={formatCurrency(card.value)}>
                {formatCurrency(card.value)}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`h-1 rounded-full ${card.bg.replace('5/', '30/')} flex-1 overflow-hidden`}>
                  <div className={`h-full ${card.color.replace('text-', 'bg-')} w-2/3 opacity-50`}></div>
                </div>
              </div>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section - Donut de Distribución */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-fin-card p-10 rounded-[40px] border border-fin-border relative overflow-hidden group h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand/40 to-transparent"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="font-black text-xl flex items-center gap-3 text-white">
                  <PieIcon size={22} className="text-brand" /> Distribución de Gastos
                </h3>
                <p className="text-[10px] font-black text-fin-muted uppercase tracking-[0.2em] mt-1">¿En qué estás gastando este mes?</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Total Egresos</p>
                <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(totalOut)}</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Donut Chart */}
              <div className="h-[280px] w-[280px] relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory.length > 0 ? expensesByCategory : [{ name: 'Sin Datos', amount: 1, color: '#1F2937' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="amount"
                      strokeWidth={0}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b1221',
                        borderRadius: '16px',
                        border: '1px solid #1F2937',
                        padding: '12px 16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                      itemStyle={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Categorías</p>
                  <p className="text-3xl font-black text-white">{expensesByCategory.length}</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-h-[280px] overflow-y-auto scrollbar-hide">
                {expensesByCategory.slice(0, 8).map((cat, i) => {
                  const percentage = totalOut > 0 ? ((cat.amount / totalOut) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: cat.color }}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate" title={cat.name}>{cat.name}</p>
                        <p className="text-xs font-semibold text-slate-300 tabular-nums">{formatCurrency(cat.amount)}</p>
                      </div>
                      <span className="text-sm font-black text-cyan-400 tabular-nums">{percentage}%</span>
                    </div>
                  );
                })}
                {expensesByCategory.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center">
                    <LayoutGrid size={32} className="text-slate-600 mb-3" />
                    <p className="text-sm font-bold text-slate-500">Sin egresos registrados este mes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Health Column */}
        <div className="lg:col-span-1 space-y-6">
          <BudgetRPMGauge spent={totalOut} budgeted={totalBudgeted} />

          {/* Budget vs Actual Breakdown */}
          {budgetVsActual.length > 0 && (
            <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={16} className="text-violet-400" /> Presupuesto vs Real
                </h3>
                <button
                  onClick={() => navigate('/finance/budget')}
                  className="text-[9px] font-black text-fin-muted hover:text-violet-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  Ver <ChevronRight size={12} />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                {budgetVsActual.map((cat, i) => {
                  const pct = cat.budgeted > 0 ? Math.min((cat.actual / cat.budgeted) * 100, 150) : (cat.actual > 0 ? 100 : 0);
                  const isOver = cat.actual > cat.budgeted && cat.budgeted > 0;
                  return (
                    <div key={i} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-white/80 truncate max-w-[100px]" title={cat.name}>{cat.name}</span>
                        <div className="flex gap-2 items-center">
                          <span className={`text-[10px] font-black tabular-nums ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formatCurrency(cat.actual)}
                          </span>
                          <span className="text-[9px] text-fin-muted font-bold">/ {formatCurrency(cat.budgeted)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-violet-500 to-cyan-400'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest">Presupuestado</p>
                  <p className="text-sm font-black text-white tabular-nums">{formatCurrency(totalBudgetedOut)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest">Gastado</p>
                  <p className={`text-sm font-black tabular-nums ${totalActualOut > totalBudgetedOut ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(totalActualOut)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loans & Jars Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upcoming Installments Widget */}
        {(upcomingInstallments.length > 0 || totalDebtRemaining > 0) && (
          <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] -mr-8 -mt-8 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-cyan-400" /> Próximas Cuotas
                </h3>
                <p className="text-[10px] font-bold text-fin-muted uppercase tracking-widest mt-1">Deuda total: {formatCurrency(totalDebtRemaining)}</p>
              </div>
              <button
                onClick={() => navigate('/finance/loans')}
                className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
              >
                Ver <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              {upcomingInstallments.slice(0, 5).map((item, i) => {
                const dueDate = new Date(item.payment.due_date + 'T12:00:00');
                const dayStr = dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                return (
                  <div key={i} className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${item.isOverdue ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-[#0b1221]/80 border-white/5 hover:border-cyan-500/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black ${item.isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {item.payment.installment_number}/{item.loan.total_installments}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[140px]">{item.loan.counterparty}</p>
                        <p className="text-[9px] text-fin-muted font-bold uppercase tracking-wider">{dayStr}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black tabular-nums ${item.isOverdue ? 'text-red-400' : 'text-white'}`}>
                        {formatCurrency(item.payment.amount)}
                      </p>
                      {item.isOverdue && <p className="text-[8px] font-black text-red-500 uppercase animate-pulse">Vencida</p>}
                    </div>
                  </div>
                );
              })}
              {upcomingInstallments.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-xs font-bold text-fin-muted/60">Sin cuotas pendientes próximas</p>
                </div>
              )}
              {upcomingInstallments.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Total próximo</span>
                  <span className="text-sm font-black text-cyan-400 tabular-nums">
                    {formatCurrency(upcomingInstallments.slice(0, 5).reduce((s, i) => s + i.payment.amount, 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jar Performance Widget */}
        {jarPerformance.length > 0 && (
          <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] -mr-8 -mt-8 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <PiggyBank size={18} className="text-amber-400" /> Rendimiento de Frascos
                </h3>
                <p className="text-[10px] font-bold text-fin-muted uppercase tracking-widest mt-1">
                  Ganancia total: <span className="text-emerald-400">{formatCurrency(jarPerformance.reduce((s, j) => s + j.interestAccrued, 0))}</span>
                </p>
              </div>
              <button
                onClick={() => navigate('/finance/jars')}
                className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
              >
                Ver <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              {jarPerformance.map((jp, i) => (
                <div key={i} className="p-3 bg-[#0b1221]/80 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Sparkles size={16} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{jp.jar.name}</p>
                        <p className="text-[9px] text-fin-muted font-bold">{jp.jar.annualRate}% anual • {jp.daysRemaining}d restantes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white tabular-nums">{formatCurrency(jp.currentValue)}</p>
                      <p className="text-[9px] font-black text-emerald-400">+{formatCurrency(jp.interestAccrued)}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${jp.progressPct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Capital Invertido</span>
                <span className="text-sm font-black text-amber-400 tabular-nums">
                  {formatCurrency(jars.reduce((s, j) => s + j.principal, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Spending Alerts */}
        {(() => {
          // Compare current month spending by category with previous month
          const prevDate = new Date(currentYear, currentMonth - 1, 1);
          const pm = prevDate.getMonth();
          const py = prevDate.getFullYear();

          const getSpendByCategory = (m: number, y: number) => {
            const map: Record<string, { name: string; amount: number }> = {};
            transactions.filter(t => {
              const d = new Date(t.date.split('T')[0] + 'T12:00:00');
              return d.getMonth() === m && d.getFullYear() === y && t.type === 'OUT';
            }).forEach(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              const n = cat?.name || 'Otro';
              if (!map[n]) map[n] = { name: n, amount: 0 };
              map[n].amount += t.amount;
            });
            return map;
          };

          const current = getSpendByCategory(currentMonth, currentYear);
          const prev = getSpendByCategory(pm, py);

          const insights: { text: string; type: 'warn' | 'good' }[] = [];

          Object.entries(current).forEach(([name, { amount }]) => {
            const prevAmt = prev[name]?.amount || 0;
            if (prevAmt > 0) {
              const change = ((amount - prevAmt) / prevAmt) * 100;
              if (change > 25) {
                insights.push({ text: `${name}: +${Math.round(change)}% vs mes anterior`, type: 'warn' });
              } else if (change < -20) {
                insights.push({ text: `${name}: ${Math.round(change)}% vs mes anterior`, type: 'good' });
              }
            }
          });

          // Savings rate
          const savingsRate = totalIn > 0 ? ((totalIn - totalOut) / totalIn * 100) : 0;
          if (savingsRate > 0) {
            insights.push({ text: `Tasa de ahorro: ${savingsRate.toFixed(0)}% de tus ingresos`, type: 'good' });
          } else if (totalIn > 0) {
            insights.push({ text: `Gastaste ${Math.abs(savingsRate).toFixed(0)}% más de lo que ingresaste`, type: 'warn' });
          }

          if (insights.length === 0) return null;

          return (
            <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-violet-400" /> Inteligencia Financiera
              </h3>
              <div className="space-y-2">
                {insights.slice(0, 6).map((ins, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${ins.type === 'warn' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ins.type === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                    <p className="text-[11px] font-bold text-white/80">{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Cash Flow Projection - 3 months */}
        {(() => {
          const projMonths: { label: string; ingresos: number; egresos: number; cuotas: number }[] = [];

          for (let i = 1; i <= 3; i++) {
            const futureDate = new Date(currentYear, currentMonth + i, 1);
            const fm = futureDate.getMonth();
            const fy = futureDate.getFullYear();
            const label = futureDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

            // Recurring budget items
            const recurringIn = budgetItems
              .filter(b => b.isRecurring && b.type === 'IN' && b.month === currentMonth && b.year === currentYear)
              .reduce((s, b) => s + b.plannedAmount, 0);
            const recurringOut = budgetItems
              .filter(b => b.isRecurring && b.type === 'OUT' && b.month === currentMonth && b.year === currentYear)
              .reduce((s, b) => s + b.plannedAmount, 0);

            // Loan installments for that month
            let loanTotal = 0;
            const futureStart = `${fy}-${String(fm + 1).padStart(2, '0')}-01`;
            const futureEnd = `${fy}-${String(fm + 1).padStart(2, '0')}-31`;
            loansList.filter(l => l.status === 'ACTIVO' && l.direction !== 'GIVEN').forEach(loan => {
              (loanPaymentsMap[loan.id] || [])
                .filter(p => p.status === 'PENDIENTE' && p.due_date >= futureStart && p.due_date <= futureEnd)
                .forEach(p => { loanTotal += p.amount; });
            });

            projMonths.push({
              label,
              ingresos: recurringIn,
              egresos: recurringOut + loanTotal,
              cuotas: loanTotal
            });
          }

          const maxVal = Math.max(...projMonths.map(p => Math.max(p.ingresos, p.egresos)), 1);

          return (
            <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-cyan-400" /> Proyección 3 Meses
              </h3>
              <div className="space-y-4">
                {projMonths.map((pm, i) => {
                  const neto = pm.ingresos - pm.egresos;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{pm.label}</span>
                        <span className={`text-[10px] font-black tabular-nums ${neto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {neto >= 0 ? '+' : ''}{formatCurrency(neto)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-4">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-700"
                          style={{ width: `${(pm.ingresos / maxVal) * 100}%` }}
                          title={`Ingreso: ${formatCurrency(pm.ingresos)}`}
                        ></div>
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-400 rounded-r-full transition-all duration-700"
                          style={{ width: `${(pm.egresos / maxVal) * 100}%` }}
                          title={`Egreso: ${formatCurrency(pm.egresos)}`}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-emerald-500/60 font-bold">{formatCurrency(pm.ingresos)}</span>
                        <span className="text-[9px] text-red-500/60 font-bold">-{formatCurrency(pm.egresos)}{pm.cuotas > 0 ? ` (${formatCurrency(pm.cuotas)} cuotas)` : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Savings Rate & Top Spending */}
        {(() => {
          const savingsRate = totalIn > 0 ? ((totalIn - totalOut) / totalIn * 100) : 0;
          const topCats = expensesByCategory.slice(0, 3);

          return (
            <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

              {/* Savings Rate Gauge */}
              <div className="text-center mb-5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
                  <PiggyBank size={16} className="text-emerald-400" /> Tasa de Ahorro
                </h3>
                <div className="relative w-24 h-24 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none"
                      stroke={savingsRate >= 20 ? '#10B981' : savingsRate >= 0 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="8"
                      strokeDasharray={`${Math.max(0, Math.min(savingsRate, 100)) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-black ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {savingsRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-fin-muted mt-1">
                  {savingsRate >= 20 ? 'Excelente' : savingsRate >= 10 ? 'Bueno' : savingsRate >= 0 ? 'Puede mejorar' : 'Deficit'}
                </p>
              </div>

              {/* Top 3 Spending */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-[9px] font-black text-fin-muted uppercase tracking-widest mb-3">Top Gastos del Mes</p>
                <div className="space-y-2">
                  {topCats.map((cat, i) => {
                    const pct = totalOut > 0 ? (cat.amount / totalOut * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white/40 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[10px] font-bold text-white truncate max-w-[90px]">{cat.name}</span>
                            <span className="text-[10px] font-black text-white/60 tabular-nums">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topCats.length === 0 && (
                    <p className="text-[10px] text-fin-muted/50 text-center py-2">Sin gastos registrados</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sidebar right side */}
      <div className="lg:col-span-1 space-y-10">

        {/* Cheques Expirations Section */}
        {upcomingCheques.length > 0 && (
          <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-[40px] -mr-8 -mt-8 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Wallet size={18} className="text-red-500" /> Vencimientos
                </h3>
                <p className="text-[10px] font-bold text-fin-muted uppercase tracking-widest mt-1">Próximos 7 días</p>
              </div>
              <div className="bg-red-500/10 px-3 py-1 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                {upcomingCheques.length} Cheques
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {upcomingCheques.slice(0, 4).map((cheque) => {
                const daysLeft = Math.ceil((new Date(cheque.payment_date).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={cheque.id} className="p-4 bg-[#0b1221]/80 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all flex items-center justify-between group/item">
                    <div>
                      <p className="text-white font-bold text-sm truncate max-w-[120px]" title={cheque.recipient_sender}>{cheque.recipient_sender}</p>
                      <p className="text-[10px] text-fin-muted font-black uppercase tracking-widest">{cheque.bank_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-extrabold tabular-nums text-sm">-{formatCurrency(cheque.amount)}</p>
                      <p className={`text-[9px] font-black uppercase tracking-wider ${daysLeft === 0 ? 'text-red-500 animate-pulse' : 'text-fin-muted'}`}>
                        {daysLeft === 0 ? 'Vence Hoy' : `${daysLeft} días`}
                      </p>
                    </div>
                  </div>
                )
              })}
              {upcomingCheques.length > 4 && (
                <button onClick={() => navigate('/finance/cheques')} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-fin-muted hover:text-white transition-colors flex items-center justify-center gap-2 border-t border-white/5 mt-2">
                  Ver Todos <ChevronRight size={14} />
                </button>
              )}
              <div className="pt-2 border-t border-white/5 flex justify-between items-center mt-2">
                <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Total a Pagar</span>
                <span className="text-sm font-black text-white tabular-nums">
                  {formatCurrency(upcomingCheques.reduce((sum, c) => sum + c.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* Macro Economy Widget */}
        {inflationData.length > 0 && (
          <div className="bg-fin-card border border-fin-border rounded-[32px] p-6 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] -mr-8 -mt-8 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                  <TrendingUp size={16} className="text-indigo-400" /> Monitoreo Macro
                </h3>
                <p className="text-[10px] font-bold text-fin-muted mt-1 flex items-center gap-2">
                  INFLACIÓN NACIONAL (IPC INDEC)
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white tabular-nums drop-shadow-lg">
                  {inflationData[inflationData.length - 1].percentage}%
                </span>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mt-0.5">Último reporte</p>
              </div>
            </div>

            <div className="h-[140px] mt-4 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inflationData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 9, fontWeight: 900 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0b1221', borderRadius: '12px', border: '1px solid #1F2937', padding: '8px 12px' }}
                    labelStyle={{ color: '#94A3B8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                    formatter={(value: number) => [`${value}%`, 'Inflación']}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {inflationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === inflationData.length - 1 ? '#818CF8' : '#334155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Context Message */}
            {totalOut > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-3">
                <AlertTriangle size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-[9px] font-bold text-fin-muted/80 leading-relaxed">
                  Con una inflación reciente intermensual del <strong className="text-white">{inflationData[inflationData.length - 1].percentage}%</strong>, procurar que el incremento de tus Egresos este próximo mes se mantenga dentro o por debajo de esta banda estadística.
                </p>
              </div>
            )}
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
              .map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const sub = subCategories.find(s => s.id === t.subCategoryId);
                return (
                  <div key={t.id} className="p-8 hover:bg-fin-bg/30 transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <p className="text-[14px] font-bold text-white group-hover:text-brand transition-colors leading-tight">{t.description}</p>
                        <p className="text-[10px] text-fin-muted font-bold uppercase tracking-wide">
                          {cat?.name} {sub ? <span className="text-fin-muted/60">• {sub.name}</span> : ''}
                        </p>
                      </div>
                      <span className={`text-[14px] font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                        {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[9px] text-fin-muted font-black uppercase tracking-[0.2em]">{t.date}</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-fin-border group-hover:bg-brand transition-colors"></div>
                    </div>
                  </div>
                );
              })}
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
