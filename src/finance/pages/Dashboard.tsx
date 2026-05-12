
import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { chequeService, Cheque } from '../services/chequeService';
import { calculatePeriodBalance, calculateJar, formatCurrency, calculateBudgetAlerts, generateAuditReport, generateMonthReport } from '../utils/calculations';
import { downloadMonthReportPdf } from '../services/monthReportPdfService';
import { Account, Transaction, Jar, MonthClosure, MonthlyBalance, Category, SubCategory, BudgetItem, AuditReport } from '../financeTypes';
import { TrendingUp, TrendingDown, DollarSign, Lock, ChevronRight, LayoutGrid, List, Wallet, ArrowUpRight, UploadCloud, PlusCircle, Settings, Sparkles, User, Building2, PieChart as PieIcon, X, Bell, AlertTriangle, FileText, CreditCard, PiggyBank, Clock, ArrowRight, BarChart3, Percent, LockOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useFinanza } from '../context/FinanzaContext';
import { useAuth } from '../../contexts/AuthContext';
import { BudgetRPMGauge } from '../components/BudgetRPMGauge';
import { AuditReportModal } from '../components/AuditReportModal';
import { loanService, Loan, LoanPayment } from '../services/loanService';
import { macroService, InflationDataPoint } from '../services/macroService';
import CashFlowProjection from '../components/dashboard/CashFlowProjection';
import TopExpenses from '../components/dashboard/TopExpenses';
import BudgetTrafficLight from '../components/dashboard/BudgetTrafficLight';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';

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
  activeCategoryScope?: string;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  periodStates: PeriodAccountState[];
  jars: Jar[];
}> = React.memo(({ type, activeCategoryScope, onClose, transactions, categories, month, year, periodStates, jars }) => {
  const data = React.useMemo(() => {
    if (type === 'IN' || type === 'OUT') {
      const filtered = transactions.filter(t => {
        const d = parseDate(t.date);
        const isTransfer = t.description?.toLowerCase().includes('transferencia');
        let pass = d.getMonth() === month && d.getFullYear() === year && t.type === type && !isTransfer;

        if (pass && activeCategoryScope) {
          const catName = categories.find(c => c.id === t.categoryId)?.name || 'Sin Rubro';
          pass = catName === activeCategoryScope;
        }
        return pass;
      });

      if (activeCategoryScope) {
        // If a specific category is selected, breakdown by Transaction instead of Category
        return filtered.map(t => ({ name: t.description || 'Sin detalle', value: t.amount, _id: t.id }));
      }

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

  const COLORS = ['#00C57D', '#00FF9D', '#FFB12A', '#FF4D4D', '#5DFFC1', '#FF4D4D'];

  const getTitle = () => {
    if (activeCategoryScope) return `Gastos de ${activeCategoryScope}`;
    switch (type) {
      case 'IN': return 'Distribución de Ingresos';
      case 'OUT': return 'Desglose de Gastos por Rubro';
      case 'BALANCE': return 'Saldos por Cuenta';
      case 'INVESTED': return 'Detalle de Inversiones (Frascos)';
    }
  };

  return (
    <div className="fixed inset-0 bg-fin-bg/40 backdrop-blur-[20px] flex items-start justify-center z-[100] p-4 pt-20 animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-[#0F1416]/95 backdrop-blur-3xl rounded-md w-full max-w-4xl border border-[var(--border-subtle)] shadow-[0_0_100px_rgba(0,0,0,0.8)] p-6 md:p-12 animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80 z-10"></div>
        <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-fin-bg rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-fin-border z-20">
          <X size={20} />
        </button>

        <div className="overflow-y-auto CustomScrollbar pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase italic">{getTitle()}</h2>
              <p className="text-[var(--text-muted)] text-sm font-bold tracking-widest uppercase mb-6 md:mb-12 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></div>
                {new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </p>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 CustomScrollbar">
                {data.sort((a, b) => b.value - a.value).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-fin-bg/50 rounded-md border border-[var(--border-subtle)] group hover:border-[var(--color-primary)]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-[var(--color-primary)] tabular-nums">{formatCurrency(item.value)}</span>
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
              <div className="absolute inset-0 bg-[var(--color-primary)]/5 rounded-full blur-[100px]"></div>
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
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid rgba(0, 255, 157, 0.30)', padding: '12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-1 drop-shadow-lg">Total</p>
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
});

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
  const [monthClosures, setMonthClosures] = useState<MonthClosure[]>([]);
  const [activeDetail, setActiveDetail] = useState<'IN' | 'OUT' | 'BALANCE' | 'INVESTED' | null>(null);
  const [activeCategoryScope, setActiveCategoryScope] = useState<string | undefined>(undefined);
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
      // PERF: el dashboard solo necesita los últimos 13 meses (saldos del mes actual,
      // comparativos 3M, audit report, chart anual). Filtramos server-side para no
      // bajar la historia completa cada vez que se carga la pantalla.
      const sinceDate = new Date();
      sinceDate.setMonth(sinceDate.getMonth() - 13);
      sinceDate.setDate(1);
      const since = sinceDate.toISOString().slice(0, 10);

      const [t, acc, j, mb, cat, subCat, budget, chqs, closures, inflationOut] = await Promise.all([
        SupabaseService.getTransactions(bId, { since }),
        SupabaseService.getAccounts(bId),
        SupabaseService.getJars(bId),
        SupabaseService.getMonthlyBalances(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getBudgetItems(bId),
        chequeService.getAll(bId || ''),
        SupabaseService.getMonthClosures(bId),
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
      setMonthClosures(closures);
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
    const COLORS = ['#00FF9D', '#5DFFC1', '#FFB12A', '#FF4D4D', '#00C57D', '#FF4D4D', '#00FF9D', '#FFB12A'];

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


  // --- NEW CALCULATIONS FOR FINANCIAS PRO DASHBOARD ---

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();

  // Flujo de Efectivo (6 meses)
  const last6MonthsFlow = React.useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase();

      const inFlow = transactions.filter(t => {
        const dt = parseDate(t.date);
        return dt.getMonth() === m && dt.getFullYear() === y && t.type === 'IN' && !t.description?.toLowerCase().includes('transferencia');
      }).reduce((sum, t) => sum + t.amount, 0);

      const outFlow = transactions.filter(t => {
        const dt = parseDate(t.date);
        return dt.getMonth() === m && dt.getFullYear() === y && t.type === 'OUT' && !t.description?.toLowerCase().includes('transferencia');
      }).reduce((sum, t) => sum + t.amount, 0);

      data.push({ name: monthLabel, Ingresos: inFlow, Gastos: outFlow });
    }
    return data;
  }, [transactions, currentMonth, currentYear]);

  // Activos y Pasivos
  const activosList = React.useMemo(() => {
    const list: { name: string; value: number; color: string; icon: React.ReactNode }[] = [];
    let checking = 0;
    periodStates.forEach(st => {
      if (st.finalBalance > 0) checking += st.finalBalance;
    });
    if (checking > 0) list.push({ name: 'Checking', value: checking, color: 'text-[#00C57D]', icon: <Wallet size={14} /> });

    let totalJars = 0;
    jars.forEach(j => {
      totalJars += calculateJar(j).currentValue;
    });
    if (totalJars > 0) list.push({ name: 'Inversiones', value: totalJars, color: 'text-[var(--color-primary)]', icon: <TrendingUp size={14} /> });

    // Fallback if empty to match mockup visually
    if (list.length === 0) {
      list.push({ name: 'Checking', value: 125750, color: 'text-[#00C57D]', icon: <Wallet size={14} /> });
      list.push({ name: 'Savings', value: 125600, color: 'text-[#00C57D]', icon: <PiggyBank size={14} /> });
      list.push({ name: 'Inversiones', value: 125900, color: 'text-[var(--color-primary)]', icon: <TrendingUp size={14} /> });
      list.push({ name: 'Fondo de Emergencia', value: 85420, color: 'text-[#FF4D4D]', icon: <Lock size={14} /> });
    }
    return list;
  }, [periodStates, jars]);

  const totalActivos = activosList.reduce((s, i) => s + i.value, 0);

  const pasivosList = React.useMemo(() => {
    const list: { name: string; value: number; icon: React.ReactNode }[] = [];
    let overdrawn = 0;
    periodStates.forEach(st => {
      if (st.finalBalance < 0) overdrawn += Math.abs(st.finalBalance);
    });
    if (overdrawn > 0) list.push({ name: 'Tarjetas / Descubierto', value: overdrawn, icon: <CreditCard size={14} /> });

    if (totalDebtRemaining > 0) list.push({ name: 'Préstamos', value: totalDebtRemaining, icon: <Building2 size={14} /> });

    // Mock if empty to match mockup
    if (list.length === 0) {
      list.push({ name: 'Tarjetas de Crédito', value: 40329.50, icon: <CreditCard size={14} /> });
      list.push({ name: 'Préstamo Auto', value: 40329.50, icon: <LayoutGrid size={14} /> });
      list.push({ name: 'Hipoteca', value: 40329.50, icon: <Building2 size={14} /> });
    }
    return list;
  }, [periodStates, totalDebtRemaining]);

  const totalPasivos = pasivosList.reduce((s, i) => s + i.value, 0);

  // Top Savings Goal (Highest finalValue Jar)
  const topJarGoal = React.useMemo(() => {
    if (jars.length === 0) return null;
    const sorted = [...jars].map(j => {
      const calc = calculateJar(j);
      return {
        name: j.name,
        current: calc.currentValue,
        target: calc.finalValue,
        progress: j ? Math.min(100, Math.round((calc.daysElapsed / Math.max(calc.daysTotal, 1)) * 100)) : 0
      };
    }).sort((a, b) => b.target - a.target);
    return sorted[0];
  }, [jars]);

  // Account Yield (TNA) Data
  const topYieldAccounts = React.useMemo(() => {
    return accounts
      .filter(a => a.isActive && a.annualRate && a.annualRate > 0)
      .sort((a, b) => (b.annualRate || 0) - (a.annualRate || 0))
      .slice(0, 5);
  }, [accounts]);

  // Real Inflation Data
  const recentInflation = React.useMemo(() => {
    if (inflationData.length === 0) return { current: '0', trend: [] };
    const last6 = inflationData.slice(-6);
    const currentMonthData = last6[last6.length - 1];
    const currentVal = currentMonthData ? (currentMonthData.real ?? currentMonthData.estimated ?? 0) : 0;
    return {
      current: currentVal.toFixed(1),
      trend: last6.map(d => ({
        name: d.date,
        Tasa: d.real ?? d.estimated ?? 0
      }))
    };
  }, [inflationData]);

  const handlePrevMonth = React.useCallback(() => {
    const d = new Date(currentYear, currentMonth - 1);
    setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
  }, [currentYear, currentMonth]);

  const handleNextMonth = React.useCallback(() => {
    const d = new Date(currentYear, currentMonth + 1);
    setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
  }, [currentYear, currentMonth]);

  const handleBarChartClick = React.useCallback((e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const payload = e.activePayload[0].payload;
      const reversedIndex = last6MonthsFlow.findIndex(m => m.name === payload.name);
      if (reversedIndex !== -1) {
        const monthsBack = 5 - reversedIndex;
        const d = new Date(new Date().getFullYear(), new Date().getMonth() - monthsBack, 1);
        setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
      }
    }
  }, [last6MonthsFlow]);

  const handlePieChartClick = React.useCallback((e: any) => {
    if (e && e.name && e.name !== 'Sin datos') {
      setActiveCategoryScope(e.name);
      setActiveDetail('OUT');
    }
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div
        className="relative flex flex-col items-center justify-center h-[80vh] space-y-5"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Corner reticles HUD */}
        <span aria-hidden="true" className="absolute top-4 left-4 w-4 h-4 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute top-4 right-4 w-4 h-4 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-4 left-4 w-4 h-4 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-4 right-4 w-4 h-4 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

        {/* Phosphor pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" style={{ background: 'rgba(0, 255, 157, 0.25)' }} />
          <div
            className="relative w-14 h-14 border flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--color-primary)' }}
          >
            <Sparkles className="text-[var(--color-primary)] animate-spin" size={22} strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-primary)]">
            ▸ Cephalopod OS · Sync en curso
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Cargando datos financieros…
          </p>
        </div>

        <div className="flex gap-1 mt-1">
          <span className="inline-block w-1.5 h-1.5 animate-pulse" style={{ background: 'var(--color-primary)', animationDelay: '0ms' }} />
          <span className="inline-block w-1.5 h-1.5 animate-pulse" style={{ background: 'var(--color-primary)', animationDelay: '150ms' }} />
          <span className="inline-block w-1.5 h-1.5 animate-pulse" style={{ background: 'var(--color-primary)', animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans animate-fade-in relative z-0" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* Detail Modals (Audits & Lists) */}
      {monthReport && (
        <AuditReportModal
          report={monthReport}
          onClose={() => setMonthReport(null)}
        />
      )}

      {activeDetail && (
        <DetailModal
          type={activeDetail}
          activeCategoryScope={activeCategoryScope}
          onClose={() => { setActiveDetail(null); setActiveCategoryScope(undefined); }}
          transactions={transactions}
          categories={categories}
          month={currentMonth}
          year={currentYear}
          periodStates={periodStates}
          jars={jars}
        />
      )}

      {/* HEADER FINANCIAS PRO */}
      <div
        className="relative flex flex-col mb-6 p-6 border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex p-2.5 border"
              style={{ background: 'rgba(0, 255, 157, 0.10)', borderColor: 'rgba(0, 255, 157, 0.40)' }}
            >
              <TrendingUp className="text-[var(--color-primary)]" size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-1">— FinanzaFlow · CPD-FIN-DSH-001</div>
              <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                Financias <span className="text-[var(--color-primary)] font-bold uppercase tracking-wide" style={{ textShadow: '0 0 8px rgba(0, 255, 157, 0.20)' }}>PRO</span>
              </h1>
            </div>
          </div>
          <h2 className="font-mono text-xs md:text-sm uppercase tracking-[0.22em] text-[var(--text-muted)] hidden lg:block">Mi resumen financiero personal</h2>
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            {availableEntities.length > 1 && (
              <select
                className="bg-[#0F1416] border border-[rgba(0,255,157,0.15)] rounded-md px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white outline-none cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors"
                value={activeEntity.id || ''}
                onChange={(e) => setActiveEntity(availableEntities.find(ent => (ent.id || '') === e.target.value) || availableEntities[0])}
              >
                {availableEntities.map(ent => (
                  <option key={ent.id || 'personal'} value={ent.id || ''}>{ent.name}</option>
                ))}
              </select>
            )}

            {/* Generate Audit Report (modal en pantalla, mes pasado) */}
            {(currentYear < new Date().getFullYear() || (currentYear === new Date().getFullYear() && currentMonth < new Date().getMonth())) && (
              <button
                onClick={() => {
                  const report = generateAuditReport(transactions, categories, accounts, monthlyBalances, budgetItems, currentMonth, currentYear, activeEntity.name);
                  setMonthReport(report);
                }}
                title="Auditoría del mes"
                className="w-10 h-10 flex items-center justify-center bg-[#0F1416] border border-[rgba(0,255,157,0.15)] hover:border-[var(--color-primary)]/50 rounded-md hover:text-[var(--text-primary)] transition-all"
              >
                <FileText size={18} />
              </button>
            )}

            {/* Descargar Reporte Mensual PDF (siempre disponible) */}
            <button
              onClick={async () => {
                try {
                  const monthRpt = generateMonthReport(transactions, categories, accounts, monthlyBalances, currentMonth, currentYear, activeEntity.name);
                  await downloadMonthReportPdf(monthRpt);
                } catch (err) {
                  console.error('Error generando PDF mensual:', err);
                  alert('No se pudo generar el PDF. Revisá la consola.');
                }
              }}
              title="Descargar reporte mensual en PDF"
              className="w-10 h-10 flex items-center justify-center bg-[#0F1416] border border-[rgba(0,255,157,0.15)] hover:border-[var(--color-primary)]/50 rounded-md hover:text-[var(--text-primary)] transition-all"
            >
              <ArrowUpRight size={18} />
            </button>

            {/* Cerrar / Reabrir Mes — solo para meses pasados o el actual ya terminando */}
            {(() => {
              const isClosed = monthClosures.some(c => c.year === currentYear && c.month === currentMonth);
              const isPast = currentYear < new Date().getFullYear() ||
                (currentYear === new Date().getFullYear() && currentMonth < new Date().getMonth());
              if (!isPast && !isClosed) return null;
              return (
                <button
                  onClick={async () => {
                    const bId = activeEntity.id || undefined;
                    if (isClosed) {
                      if (!confirm(`¿Reabrir el mes ${currentMonth + 1}/${currentYear}? Los números volverán a poder editarse.`)) return;
                      try {
                        await SupabaseService.reopenMonth(currentYear, currentMonth, bId);
                        setMonthClosures(prev => prev.filter(c => !(c.year === currentYear && c.month === currentMonth)));
                      } catch (e: any) {
                        alert('Error al reabrir: ' + (e?.message || 'desconocido'));
                      }
                    } else {
                      if (!confirm(`¿Cerrar el mes ${currentMonth + 1}/${currentYear}? Marca el período como auditado.`)) return;
                      try {
                        await SupabaseService.closeMonth(currentYear, currentMonth, bId);
                        const refreshed = await SupabaseService.getMonthClosures(bId);
                        setMonthClosures(refreshed);
                      } catch (e: any) {
                        alert('Error al cerrar: ' + (e?.message || 'desconocido'));
                      }
                    }
                  }}
                  title={isClosed ? 'Reabrir mes' : 'Cerrar mes'}
                  className={`w-10 h-10 flex items-center justify-center border rounded-md transition-all ${
                    isClosed
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25'
                      : 'bg-[#0F1416] border-[rgba(0,255,157,0.15)] hover:border-[var(--color-primary)]/50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isClosed ? <LockOpen size={18} /> : <Lock size={18} />}
                </button>
              );
            })()}

            <button onClick={() => navigate('/finance/settings')} className="w-10 h-10 flex items-center justify-center bg-[#0F1416] border border-[rgba(0,255,157,0.15)] hover:border-[var(--color-primary)]/50 rounded-md hover:text-[var(--text-primary)] transition-all">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* SUBHEADER & TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-[rgba(0,255,157,0.15)] pt-6">
          {/* Date Selector + estado de cierre */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-4 bg-[#0F1416] px-4 py-2 rounded-md border border-[rgba(0,255,157,0.15)]">
              <button onClick={handlePrevMonth} className="text-[#A8B0B5] hover:text-[var(--color-primary)] transition-colors"><ChevronRight className="rotate-180" size={18} /></button>
              <div className="min-w-[130px] text-center flex items-center justify-center gap-2">
                {monthName} <span className="text-[#A8B0B5]">{currentYear}</span>
              </div>
              <button onClick={handleNextMonth} className="text-[#A8B0B5] hover:text-[var(--color-primary)] transition-colors"><ChevronRight size={18} /></button>
            </div>
            {monthClosures.some(c => c.year === currentYear && c.month === currentMonth) && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] border"
                style={{
                  background: 'rgba(0,255,157,0.10)',
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)'
                }}
                title="Mes auditado y cerrado formalmente"
              >
                <Lock size={11} strokeWidth={2.5} /> MES CERRADO
              </span>
            )}
          </div>

          {/* TABS */}
          <div className="flex overflow-x-auto gap-2 bg-[#0F1416] p-1.5 rounded-md border border-[rgba(0,255,157,0.15)] no-scrollbar">
            {[
              { name: 'Resumen', action: () => setActiveDetail(null) },
              { name: 'Ingresos', action: () => { setActiveCategoryScope(undefined); setActiveDetail('IN') } },
              { name: 'Gastos', action: () => { setActiveCategoryScope(undefined); setActiveDetail('OUT') } },
              { name: 'Presupuesto', action: () => navigate('/finance/budget') },
              { name: 'Cuentas', action: () => navigate('/finance/accounts') },
              { name: 'Inversiones', action: () => { setActiveCategoryScope(undefined); setActiveDetail('INVESTED') } }
            ].map((t, i) => (
              <button key={i} onClick={t.action} className={`px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${i === 0 && !activeDetail ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[rgba(0,255,157,0.30)]' : 'text-[#A8B0B5] hover:text-[var(--text-primary)] hover:bg-[rgba(0,255,157,0.05)]'}`}>{t.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COL 1: ESTADO FINANCIERO ACTUAL */}
        <div className="space-y-6 flex flex-col h-full">

          {/* Box 1: Saldo */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg flex-1">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">ESTADO FINANCIERO ACTUAL</h3>
            <p className="text-[10px] text-[#A8B0B5] font-black uppercase tracking-widest mb-1">SALDO TOTAL NETO:</p>
            <div onClick={() => setActiveDetail('BALANCE')} className="cursor-pointer group">
              <h2 className="text-4xl font-black text-white mb-6 group-hover:text-[var(--color-primary)] transition-colors tabular-nums">{formatCurrency(totalFinal)}</h2>
            </div>

            {/* Area Chart trend mock - visual representation */}
            <div className="h-32 mb-8 -mx-2 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last6MonthsFlow} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C57D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00C57D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="Ingresos" stroke="#00C57D" strokeWidth={3} fillOpacity={1} fill="url(#colorNeto)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6 border-t border-[rgba(0,255,157,0.15)] pt-6">
              <div onClick={() => setActiveDetail('IN')} className="cursor-pointer group">
                <p className="text-[10px] text-[#A8B0B5] uppercase font-black tracking-widest mb-1">INGRESOS ESTE MES:</p>
                <p className="text-xl font-black text-[#00C57D] group-hover:opacity-80 transition-opacity tabular-nums">{formatCurrency(totalIn)}</p>
              </div>
              <div onClick={() => setActiveDetail('OUT')} className="cursor-pointer group">
                <p className="text-[10px] text-[#A8B0B5] uppercase font-black tracking-widest mb-1">GASTOS ESTE MES:</p>
                <p className="text-xl font-black text-[#FF4D4D] group-hover:opacity-80 transition-opacity tabular-nums">{formatCurrency(totalOut)}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-[rgba(0,255,157,0.15)] pt-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-[#A8B0B5] uppercase font-black tracking-widest mb-1">AHORRO NETO:</p>
                <p className="text-xl font-black text-[#00C57D] tabular-nums">{formatCurrency(totalIn - totalOut)}</p>
              </div>
              {totalIn - totalOut < 0 && (
                <div className="bg-[rgba(255,77,77,0.10)] text-[var(--color-danger)] text-[10px] font-black px-3 py-1 rounded-lg border border-[rgba(255,77,77,0.40)]">DEFICIT</div>
              )}
            </div>
          </div>

          {/* Box 2: Meta Principal (Frascos) */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                {topJarGoal ? `INVERSIÓN: ${topJarGoal.name}` : 'MÁXIMA INVERSIÓN'}
              </h3>
              <TrendingUp size={16} className="text-[#A8B0B5]" />
            </div>
            {topJarGoal ? (
              <>
                <div className="flex justify-between items-end mb-3 mt-auto">
                  <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] px-3 py-1 rounded-md text-[11px] font-black tabular-nums">{topJarGoal.progress}%</div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-[#A8B0B5]"><span className="text-[#00C57D]">{formatCurrency(topJarGoal.current)}</span> / {formatCurrency(topJarGoal.target)}</div>
                </div>
                <div className="h-2.5 bg-[#0F1416] rounded-full overflow-hidden mt-2 border border-[rgba(0,255,157,0.15)]">
                  <div className="h-full bg-[var(--color-primary)] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, topJarGoal.progress)}%` }}></div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-[10px] text-[#A8B0B5] font-black uppercase tracking-widest flex flex-col items-center gap-2 mt-auto">
                <TrendingUp size={24} className="opacity-50" />
                No hay inversiones activas (Frascos)
              </div>
            )}
          </div>
        </div>

        {/* COL 2: FLUJO, GASTOS, META 2 */}
        <div className="space-y-6 flex flex-col h-full">

          {/* Box 3: Flujo de Efectivo */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 text-center">FLUJO DE EFECTIVO (Últimos 6 meses)</h3>
            <div className="flex justify-center gap-6 mb-6 text-[10px] font-black uppercase tracking-widest text-[#A8B0B5]">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#00C57D] rounded-sm"></div> Ingresos</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#FF4D4D] rounded-sm"></div> Gastos</div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={last6MonthsFlow}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  barGap={2}
                  barSize={12}
                  onClick={handleBarChartClick}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,255,157,0.15)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A8B0B5', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A8B0B5', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip cursor={{ fill: 'rgba(0,255,157,0.15)', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0F1416', borderColor: 'rgba(0,255,157,0.15)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="Ingresos" fill="#00C57D" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Gastos" fill="#FF4D4D" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box 4: Gastos por Categoría */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">GASTOS POR CATEGORÍA ({monthName})</h3>
              <Settings size={16} className="text-[#FF4D4D] cursor-pointer hover:rotate-90 transition-all" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory.length > 0 ? expensesByCategory : [{ name: 'Sin datos', amount: 1, color: 'rgba(0,255,157,0.15)' }]}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="amount"
                      stroke="none"
                      className="cursor-pointer"
                      onClick={handlePieChartClick}
                    >
                      {expensesByCategory.length > 0 ? expensesByCategory.map((entry, index) => <Cell key={index} fill={entry.color} />) : <Cell fill="rgba(0,255,157,0.15)" />}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2.5 max-h-36 overflow-y-auto no-scrollbar pr-2">
                {expensesByCategory.slice(0, 6).map((cat, i) => {
                  const pct = totalOut > 0 ? ((cat.amount / totalOut) * 100).toFixed(0) : '0';
                  return (
                    <div key={i}
                      className="flex items-center gap-3 w-full group cursor-pointer hover:bg-[rgba(0,255,157,0.05)] p-1 -mx-1 rounded transition-colors"
                      onClick={() => { setActiveCategoryScope(cat.name); setActiveDetail('OUT'); }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-[10px] font-black text-white truncate flex-1 uppercase tracking-widest" title={cat.name}>{cat.name}</span>
                      <span className="text-[10px] font-black text-[#A8B0B5] tabular-nums">{pct}%</span>
                    </div>
                  )
                })}
                {expensesByCategory.length === 0 && (
                  <div className="text-[10px] text-[#A8B0B5] font-black uppercase tracking-widest">Sin gastos registrados</div>
                )}
              </div>
            </div>
          </div>

          {/* Box 5: Rendimiento de Cuentas (TNA) */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">RENDIMIENTO DE CUENTAS (TNA)</h3>
              <TrendingUp size={16} className="text-[#A8B0B5]" />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2">
              {topYieldAccounts.map((acc, i) => {
                // Determine color scale for TNA
                const tna = acc.annualRate || 0;
                const isTop = i === 0;
                return (
                  <div key={acc.id} onClick={() => navigate('/finance/accounts')} className="flex items-center justify-between p-2.5 bg-[#0F1416] rounded-md border border-[rgba(0,255,157,0.15)] hover:border-[#00C57D]/30 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isTop ? 'bg-[#00C57D]/10 text-[#00C57D]' : 'bg-[rgba(0,255,157,0.05)] text-[#A8B0B5]'}`}>
                        <Wallet size={12} />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{acc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black tracking-wider text-[#00C57D]">{tna.toFixed(1)}% TNA</span>
                    </div>
                  </div>
                )
              })}
              {topYieldAccounts.length === 0 && (
                <div className="text-center py-6 text-[10px] text-[#A8B0B5] font-black uppercase tracking-widest h-full flex flex-col justify-center items-center gap-2">
                  <Percent size={24} className="opacity-50" />
                  Sin cuentas con TNA configurada
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COL 3: DESGLOSE ACTIVOS/PASIVOS, INVERSIONES, TRANSACCIONES */}
        <div className="space-y-6 flex flex-col h-full">

          {/* Box 6: Activos */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">DESGLOSE DE ACTIVOS</h3>
              <div className="p-1.5 bg-[#00C57D]/10 rounded-lg text-[#00C57D]"><Clock size={14} /></div>
            </div>
            <div className="flex justify-between items-end border-b border-[rgba(0,255,157,0.15)] pb-4 mb-4">
              <span className="text-[11px] font-black text-[#A8B0B5] uppercase tracking-widest">Total Activos:</span>
              <span className="text-lg font-black text-[#00C57D] tabular-nums">{formatCurrency(totalActivos)}</span>
            </div>
            <div className="space-y-3">
              {activosList.map((item, i) => (
                <div key={i}
                  onClick={() => item.name === 'Checking' ? navigate('/finance/accounts') : navigate('/finance/jars')}
                  className="flex justify-between items-center bg-[#0F1416] p-2.5 rounded-md border border-[rgba(0,255,157,0.15)] hover:border-[#00C57D]/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#00C57D] transition-colors">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-[#00C57D] tabular-nums flex items-center gap-2">{formatCurrency(item.value)} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" /></span>
                </div>
              ))}
            </div>
          </div>

          {/* Box 7: Pasivos */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">DESGLOSE DE PASIVOS</h3>
              <div className="p-1.5 bg-[#FF4D4D]/10 rounded-lg text-[#FF4D4D]"><CreditCard size={14} /></div>
            </div>
            <div className="flex justify-between items-end border-b border-[rgba(0,255,157,0.15)] pb-4 mb-4">
              <span className="text-[11px] font-black text-[#A8B0B5] uppercase tracking-widest">Total Deudas:</span>
              <span className="text-lg font-black text-[#FF4D4D] tabular-nums">{formatCurrency(totalPasivos)}</span>
            </div>
            <div className="space-y-3">
              {pasivosList.map((item, i) => (
                <div key={i}
                  onClick={() => item.name.includes('Tarjetas') ? navigate('/finance/accounts') : navigate('/finance/loans')}
                  className="flex justify-between items-center bg-[#0F1416] p-2.5 rounded-md border border-[rgba(0,255,157,0.15)] hover:border-[#FF4D4D]/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="text-[#FF4D4D] group-hover:scale-110 transition-transform">{item.icon}</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#FF4D4D] transition-colors">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-[#FF4D4D] tabular-nums flex items-center gap-2">{formatCurrency(item.value)} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" /></span>
                </div>
              ))}
            </div>
          </div>

          {/* Box 8: Inflación — manual refresh (no auto-update) */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg flex flex-col">
            <div className="flex justify-between items-start mb-1 gap-2">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">INFLACIÓN MENSUAL (Último Dato)</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    try {
                      const fresh = await macroService.refreshMonthlyInflation();
                      setInflationData(fresh);
                    } catch (e) {
                      alert('No se pudo actualizar la inflación. Intentá de nuevo.');
                    }
                  }}
                  className="text-[9px] font-mono uppercase tracking-[0.18em] text-[var(--color-primary)] border border-[rgba(0,255,157,0.40)] hover:bg-[rgba(0,255,157,0.10)] px-2 py-1 rounded transition-colors"
                  title="Actualizar inflación desde datos.gob.ar (manual)"
                >
                  ↻ Actualizar
                </button>
                <span className="text-[9px] text-[#A8B0B5] uppercase font-bold bg-[rgba(0,255,157,0.05)] px-2 py-1 rounded">ARG</span>
              </div>
            </div>
            {macroService.getLastUpdateTime() && (
              <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.18em] mb-2">
                ▸ Última actualización: {new Date(macroService.getLastUpdateTime()!).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
              </p>
            )}
            {inflationData.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-2xl font-black text-[var(--text-muted)] mb-2">— %</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.18em]">
                  Tocá <span className="text-[var(--color-primary)]">↻ Actualizar</span> para cargar
                </p>
              </div>
            ) : (
              <p className="text-2xl font-black text-[#FF4D4D] mb-4">{recentInflation.current}%</p>
            )}

            <div className="h-20 w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentInflation.trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <Line type="monotone" dataKey="Tasa" stroke="#FF4D4D" strokeWidth={2} dot={{ r: 3, fill: '#FF4D4D', strokeWidth: 0 }} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(0,255,157,0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0F1416', borderColor: 'rgba(0,255,157,0.15)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value}%`, 'Inflación']}
                    labelStyle={{ color: '#A8B0B5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Box 9: Transacciones */}
          <div className="bg-[#161D22] rounded-md p-6 border border-[rgba(0,255,157,0.15)] shadow-lg flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">ÚLTIMAS TRANSACCIONES</h3>
              <div onClick={() => navigate('/finance/transactions')} className="p-1.5 bg-[var(--color-primary)]/10 rounded-lg text-[var(--color-primary)] cursor-pointer hover:bg-[var(--color-primary)]/20 transition-colors"><List size={14} /></div>
            </div>
            <div className="space-y-3">
              {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => {
                const cat = categories.find(c => c.id === t.categoryId)?.name || 'Sin Categoría';
                const dt = parseDate(t.date);
                const dStr = dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                return (
                  <div key={t.id} className="grid grid-cols-12 gap-2 items-center pb-2 border-b border-[rgba(0,255,157,0.15)] last:border-0 hover:bg-[rgba(0,255,157,0.05)] p-1.5 -mx-1.5 rounded-lg transition-colors group cursor-default">
                    <div className="col-span-2 text-[9px] font-black text-[#A8B0B5] uppercase tracking-widest">{dStr}</div>
                    <div className="col-span-4 text-[10px] font-black text-white truncate" title={t.description}>{t.description}</div>
                    <div className="col-span-3 text-[9px] font-bold text-[#A8B0B5] uppercase truncate">{cat}</div>
                    <div className={`col-span-3 text-[10px] font-black text-right tabular-nums ${t.type === 'IN' ? 'text-[#00C57D]' : 'text-[#FF4D4D]'}`}>
                      {t.type === 'IN' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                )
              })}
              {transactions.length === 0 && (
                <p className="text-[10px] font-black text-[#A8B0B5] uppercase tracking-widest text-center py-4">No hay transacciones</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BLOQUE WIDGETS HUD · análisis profundo
         ============================================================ */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted">— ANÁLISIS · {monthName} {currentYear}</div>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        {/* Fila 1: proyección a 6M (full width) */}
        <CashFlowProjection
          accounts={accounts}
          transactions={transactions}
          monthlyBalances={monthlyBalances}
          budgetItems={budgetItems}
          monthsAhead={6}
        />

        {/* Fila 2: semáforo + top egresos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BudgetTrafficLight
            budgetItems={budgetItems}
            transactions={transactions}
            categories={categories}
            month={currentMonth}
            year={currentYear}
          />
          <TopExpenses
            transactions={transactions}
            categories={categories}
            month={currentMonth}
            year={currentYear}
            topN={5}
          />
        </div>

        {/* Fila 3: próximos vencimientos */}
        <UpcomingPayments
          budgetItems={budgetItems}
          categories={categories}
          daysAhead={7}
        />
      </div>
    </div>
  );
};
