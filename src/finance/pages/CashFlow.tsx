import React, { useState, useEffect, useMemo } from 'react';
import { useFinanza } from '../context/FinanzaContext';
import { formatCurrency, calculatePeriodBalance } from '../utils/calculations';
import { SupabaseService } from '../services/supabaseService';
import { cashFlowService, DailyFlow } from '../services/cashFlowService';
import { chequeService, Cheque } from '../services/chequeService';
import { Account, Transaction, MonthlyBalance, BudgetItem, AccountType } from '../financeTypes';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const CashFlow = () => {
    const { activeEntity } = useFinanza();
    const [loading, setLoading] = useState(true);
    const [daysToProject, setDaysToProject] = useState(30);

    // Data State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>([]);
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
    const [cheques, setCheques] = useState<Cheque[]>([]);
    const [projection, setProjection] = useState<DailyFlow[]>([]);
    const [initialLiquidity, setInitialLiquidity] = useState(0);

    useEffect(() => {
        if (activeEntity?.id) loadData();
    }, [activeEntity, daysToProject]);

    const loadData = async () => {
        if (!activeEntity?.id) return;
        setLoading(true);
        try {
            const bId = activeEntity.id;
            const today = new Date();

            // 1. Fetch all necessary data
            // We need accounts and their balances to start
            const [
                accData,
                typesData,
                txData,
                mbData,
                budgetData,
                chequesData
            ] = await Promise.all([
                SupabaseService.getAccounts(bId),
                SupabaseService.getAccountTypes(), // Need this to filter liquidity
                SupabaseService.getTransactions(bId),
                SupabaseService.getMonthlyBalances(bId),
                SupabaseService.getBudgetItems(bId),
                chequeService.getAll(bId)
            ]);

            setAccounts(accData);
            setAccountTypes(typesData);
            setTransactions(txData);
            setMonthlyBalances(mbData);
            setBudgetItems(budgetData);
            setCheques(chequesData);

            // 2. Calculate Initial Liquidity (Today's Balance of Liquidity Accounts)
            // Filter accounts that are "includeInCashflow"
            const liquidityTypeIds = typesData.filter(t => t.includeInCashflow && t.isActive).map(t => t.id);
            const liquidityAccounts = accData.filter(a => a.isActive && liquidityTypeIds.includes(a.accountTypeId));

            let currentTotal = 0;
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            liquidityAccounts.forEach(acc => {
                const state = calculatePeriodBalance(acc, txData, mbData, currentMonth, currentYear);
                currentTotal += state.finalBalance;
            });

            setInitialLiquidity(currentTotal);

            // 3. Generar Proyección
            const proj = cashFlowService.generateProjection(
                today,
                daysToProject,
                currentTotal,
                chequesData,
                budgetData
            );
            setProjection(proj);

        } catch (error) {
            console.error('Error loading Cash Flow data:', error);
        } finally {
            setLoading(false);
        }
    };

    const minBalance = useMemo(() => Math.min(...projection.map(p => p.finalBalance), 0), [projection]);
    const maxBalance = useMemo(() => Math.max(...projection.map(p => p.finalBalance), initialLiquidity * 1.2), [projection, initialLiquidity]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Cash Flow</h1>
                    <p className="text-fin-muted mt-3 text-sm font-medium">Proyección de liquidez a {daysToProject} días</p>
                </div>
                <div className="flex items-center gap-4 bg-[#020b14] p-1.5 rounded-2xl border border-fin-border">
                    {[30, 60, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setDaysToProject(d)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${daysToProject === d ? 'bg-brand text-[#020b14]' : 'text-fin-muted hover:text-white'
                                }`}
                        >
                            {d} Días
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-fin-card p-6 rounded-3xl border border-fin-border group hover:border-brand/30 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted mb-2">Liquidez Actual (Hoy)</p>
                    <p className="text-3xl font-black text-white tabular-nums">{formatCurrency(initialLiquidity)}</p>
                </div>
                <div className="bg-fin-card p-6 rounded-3xl border border-fin-border group hover:border-emerald-500/30 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted mb-2">Ingresos Proyectados</p>
                    <p className="text-3xl font-black text-emerald-400 tabular-nums">
                        {formatCurrency(projection.reduce((sum, p) => sum + p.inflow, 0))}
                    </p>
                </div>
                <div className="bg-fin-card p-6 rounded-3xl border border-fin-border group hover:border-red-500/30 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted mb-2">Egresos Proyectados</p>
                    <p className="text-3xl font-black text-red-400 tabular-nums">
                        {formatCurrency(projection.reduce((sum, p) => sum + p.outflow, 0))}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-fin-card p-8 rounded-[40px] border border-fin-border h-[400px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projection} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1FB6D5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#1FB6D5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            tickMargin={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                            domain={[minBalance, maxBalance]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#020b14', borderRadius: '16px', border: '1px solid #1e293b' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="finalBalance"
                            name="Saldo Proyectado"
                            stroke="#1FB6D5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed List */}
            <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden">
                <div className="p-8 border-b border-fin-border bg-[#020b14]/30 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <CalendarIcon size={20} className="text-brand" /> Detalle Diario
                    </h3>
                </div>
                <div className="divide-y divide-fin-border/30">
                    {projection.map((day) => (
                        <div key={day.date} className="p-6 hover:bg-fin-bg/30 transition-colors group">
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg font-black text-xs uppercase tracking-widest border ${day.net >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                    </div>
                                    <span className="text-sm font-bold text-fin-muted">Saldo Final: <span className="text-white">{formatCurrency(day.finalBalance)}</span></span>
                                </div>
                                <div className="flex gap-4 text-xs font-bold tabular-nums">
                                    {day.inflow > 0 && <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> {formatCurrency(day.inflow)}</span>}
                                    {day.outflow > 0 && <span className="text-red-400 flex items-center gap-1"><TrendingDown size={12} /> -{formatCurrency(day.outflow)}</span>}
                                </div>
                            </div>

                            {/* Events */}
                            <div className="space-y-2 pl-4 border-l-2 border-fin-border">
                                {day.events.length === 0 ? (
                                    <p className="text-[10px] text-fin-muted italic">Sin movimientos proyectados</p>
                                ) : (
                                    day.events.map(event => (
                                        <div key={event.id} className="flex items-center justify-between py-1">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${event.type === 'CHEQUE' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                <span className="text-xs text-white truncate max-w-[200px] md:max-w-md" title={event.description}>
                                                    {event.description}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-fin-bg text-fin-muted border border-fin-border uppercase tracking-wide hidden md:inline-block">
                                                    {event.type}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-bold tabular-nums ${event.flow === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {event.flow === 'IN' ? '+' : '-'}{formatCurrency(event.amount)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
