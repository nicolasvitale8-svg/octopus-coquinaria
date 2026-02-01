import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseService } from '../services/supabaseService';
import { calculateYearSummary, formatCurrency } from '../utils/calculations';
import { Transaction, Category, YearSummary, MonthSummary } from '../financeTypes';
import { useFinanza } from '../context/FinanzaContext';
import {
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    ArrowUpRight,
    Sparkles,
    Trophy,
    AlertTriangle,
    FileText
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    Area,
    AreaChart
} from 'recharts';

const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MONTH_FULL_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const AnnualSummary: React.FC = () => {
    const navigate = useNavigate();
    const { activeEntity } = useFinanza();
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [yearSummary, setYearSummary] = useState<YearSummary | null>(null);

    useEffect(() => {
        loadData();
    }, [activeEntity, currentYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const bId = activeEntity.id || undefined;
            const [t, cat] = await Promise.all([
                SupabaseService.getTransactions(bId),
                SupabaseService.getCategories(bId)
            ]);
            setTransactions(t);
            setCategories(cat);

            const summary = calculateYearSummary(t, cat, currentYear);
            setYearSummary(summary);
        } catch (error) {
            console.error('Error loading annual data:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!yearSummary) return [];
        return yearSummary.months.map((m, idx) => ({
            name: MONTH_NAMES[idx],
            month: idx,
            ingresos: m.totalIn,
            egresos: m.totalOut,
            balance: m.netBalance,
            hasData: m.transactionCount > 0
        }));
    }, [yearSummary]);

    const handleMonthClick = (month: number) => {
        // Navigate to dashboard and set the month
        navigate(`/finance?year=${currentYear}&month=${month}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
                    <Sparkles className="text-brand animate-spin" size={24} />
                </div>
                <p className="text-fin-muted font-bold uppercase tracking-widest text-[10px]">Cargando datos anuales...</p>
            </div>
        );
    }

    if (!yearSummary) return null;

    return (
        <div className="space-y-10 animate-fade-in pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                        <Calendar className="text-brand" size={32} />
                        Resumen Anual
                    </h1>
                    <p className="text-fin-muted text-sm font-bold mt-2 uppercase tracking-widest">
                        Vista consolidada de {currentYear}
                    </p>
                </div>

                {/* Year Selector */}
                <div className="flex bg-fin-card rounded-2xl border border-fin-border p-1 shadow-xl">
                    <button
                        onClick={() => setCurrentYear(y => y - 1)}
                        className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="px-8 flex items-center justify-center font-black text-xl uppercase tracking-widest text-white min-w-[100px]">
                        {currentYear}
                    </div>
                    <button
                        onClick={() => setCurrentYear(y => y + 1)}
                        disabled={currentYear >= new Date().getFullYear()}
                        className="p-3 hover:bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0b1221]/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Total Ingresos</span>
                    </div>
                    <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(yearSummary.totalIn)}</p>
                    <p className="text-xs text-fin-muted mt-1">Promedio: {formatCurrency(yearSummary.averageMonthlyIn)}/mes</p>
                </div>

                <div className="bg-[#0b1221]/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Total Egresos</span>
                    </div>
                    <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(yearSummary.totalOut)}</p>
                    <p className="text-xs text-fin-muted mt-1">Promedio: {formatCurrency(yearSummary.averageMonthlyOut)}/mes</p>
                </div>

                <div className="bg-[#0b1221]/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-brand/10 text-brand">
                            <BarChart3 size={20} />
                        </div>
                        <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Balance Neto</span>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${yearSummary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(yearSummary.netBalance)}
                    </p>
                    <p className="text-xs text-fin-muted mt-1">Acumulado del año</p>
                </div>

                <div className="bg-[#0b1221]/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                            <Trophy size={20} />
                        </div>
                        <span className="text-[10px] font-black text-fin-muted uppercase tracking-widest">Mejor Mes</span>
                    </div>
                    {yearSummary.bestMonth ? (
                        <>
                            <p className="text-2xl font-black text-white">{MONTH_FULL_NAMES[yearSummary.bestMonth.month]}</p>
                            <p className="text-xs text-emerald-400 mt-1">+{formatCurrency(yearSummary.bestMonth.netBalance)}</p>
                        </>
                    ) : (
                        <p className="text-fin-muted text-sm">Sin datos</p>
                    )}
                </div>
            </div>

            {/* Monthly Grid */}
            <div className="bg-fin-card rounded-[40px] border border-fin-border p-8 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <Calendar size={22} className="text-brand" />
                    Vista Mensual
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {yearSummary.months.map((month, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleMonthClick(idx)}
                            className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left ${month.transactionCount > 0
                                    ? 'bg-[#0b1221]/80 border-white/10 hover:border-brand/50'
                                    : 'bg-fin-bg/30 border-white/5 opacity-50'
                                } ${month.isClosed ? '' : 'ring-2 ring-brand/30'}`}
                        >
                            {/* Month Label */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">
                                    {MONTH_NAMES[idx]}
                                </span>
                                {month.isClosed && month.transactionCount > 0 && (
                                    <FileText size={12} className="text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                {!month.isClosed && (
                                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                )}
                            </div>

                            {month.transactionCount > 0 ? (
                                <>
                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={10} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-400 tabular-nums">
                                                +{formatCurrency(month.totalIn)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingDown size={10} className="text-red-500" />
                                            <span className="text-[10px] font-bold text-red-400 tabular-nums">
                                                -{formatCurrency(month.totalOut)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-white/5">
                                        <span className={`text-sm font-black tabular-nums ${month.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {month.netBalance >= 0 ? '+' : ''}{formatCurrency(month.netBalance)}
                                        </span>
                                    </div>

                                    {/* Hover Indicator */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight size={14} className="text-brand" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-[10px] font-bold text-fin-muted uppercase">Sin datos</p>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart - Income vs Expenses */}
                <div className="bg-fin-card rounded-[40px] border border-fin-border p-8 shadow-2xl">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                        <BarChart3 size={20} className="text-brand" />
                        Ingresos vs Egresos
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0b1221',
                                        borderRadius: '16px',
                                        border: '1px solid #1F2937',
                                        padding: '12px 16px'
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                    labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                                />
                                <Bar dataKey="ingresos" fill="#10B981" radius={[8, 8, 0, 0]} name="Ingresos" />
                                <Bar dataKey="egresos" fill="#EF4444" radius={[8, 8, 0, 0]} name="Egresos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Area Chart - Balance Evolution */}
                <div className="bg-fin-card rounded-[40px] border border-fin-border p-8 shadow-2xl">
                    <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                        <TrendingUp size={20} className="text-brand" />
                        Evolución del Balance
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0b1221',
                                        borderRadius: '16px',
                                        border: '1px solid #1F2937',
                                        padding: '12px 16px'
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                    labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#06B6D4"
                                    strokeWidth={3}
                                    fill="url(#colorBalance)"
                                    name="Balance"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Stats */}
            {yearSummary.worstMonth && yearSummary.worstMonth.netBalance < 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white uppercase tracking-wide">Atención: Mes con balance negativo</p>
                        <p className="text-xs text-red-400 mt-1">
                            {MONTH_FULL_NAMES[yearSummary.worstMonth.month]} tuvo un balance de {formatCurrency(yearSummary.worstMonth.netBalance)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnualSummary;
