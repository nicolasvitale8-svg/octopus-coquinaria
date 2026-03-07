import React, { useMemo } from 'react';
import { BudgetItem, Account, Jar, TransactionType } from '../financeTypes';
import { formatCurrency } from '../utils/calculations';
import { Sparkles, Calendar, Plus, TrendingUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface JarSuggestionsProps {
    budgetItems: BudgetItem[];
    accounts: Account[];
    currentMonth: number;
    currentYear: number;
    onCreateJar: (jar: Partial<Jar>) => void;
}

interface Suggestion {
    term: 7 | 14 | 28;
    amount: number;
    startDate: string;
    endDate: string;
    items: BudgetItem[];
    estimatedInterest: number;
    tna: number;
}

export const JarSuggestions: React.FC<JarSuggestionsProps> = ({
    budgetItems,
    accounts,
    currentMonth,
    currentYear,
    onCreateJar
}) => {
    const PAYDAY = 5;
    const DEFAULT_TNA = 40; // TNA promedio

    const [expandedSuggestions, setExpandedSuggestions] = useState<Record<number, boolean>>({});

    const toggleExpand = (idx: number) => {
        setExpandedSuggestions(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const suggestions = useMemo(() => {
        // Filtrar gastos presupuestados del mes actual
        const currentExpenses = budgetItems.filter(
            i => i.month === currentMonth &&
                i.year === currentYear &&
                i.type === TransactionType.OUT &&
                i.plannedDate &&
                i.plannedDate > PAYDAY + 7 // Mínimo 7 días de diferencia
        );

        // Agrupar gastos por plazos posibles desde el día de cobro
        const groupedByTerm = currentExpenses.reduce((acc, item) => {
            const daysAvailable = item.plannedDate! - PAYDAY;

            let term: 7 | 14 | 28 | null = null;
            if (daysAvailable >= 28) term = 28;
            else if (daysAvailable >= 14) term = 14;
            else if (daysAvailable >= 7) term = 7;

            if (term) {
                if (!acc[term]) acc[term] = { items: [], totalAmount: 0 };
                acc[term].items.push(item);
                acc[term].totalAmount += item.plannedAmount;
            }
            return acc;
        }, {} as Record<number, { items: BudgetItem[], totalAmount: number }>);

        const result: Suggestion[] = [];
        const baseDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

        // Crear sugerencias consolidadas por plazo
        Object.entries(groupedByTerm).forEach(([termStr, data]) => {
            const term = Number(termStr) as 7 | 14 | 28;
            if (data.totalAmount <= 0) return;

            const tna = term === 28 ? 40 : term === 14 ? 38 : 36; // Ligeramente menor para plazos cortos
            const dailyRate = (tna / 100) / 365;
            const estimatedInterest = data.totalAmount * Math.pow(1 + dailyRate, term) - data.totalAmount;

            const startDate = `${baseDateStr}-${String(PAYDAY).padStart(2, '0')}`;
            const endDate = `${baseDateStr}-${String(PAYDAY + term).padStart(2, '0')}`;

            result.push({
                term,
                amount: data.totalAmount,
                startDate,
                endDate,
                items: data.items,
                estimatedInterest,
                tna
            });
        });

        // Ordenar por mayor monto primero
        return result.sort((a, b) => b.amount - a.amount);
    }, [budgetItems, currentMonth, currentYear]);

    if (suggestions.length === 0) return null;

    // Buscar si hay una cuenta Naranja X
    const suggestedAccount = accounts.find(a => a.name.toLowerCase().includes('naranja')) || accounts[0];

    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest">Oportunidades de Inversión</h3>
                    <p className="text-[10px] text-fin-muted font-bold uppercase tracking-widest mt-0.5">Basado en tus gastos planificados post-cobro (Día {PAYDAY})</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((sug, idx) => (
                    <div key={idx} className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden group hover:bg-amber-500/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-black text-amber-400 uppercase tracking-widest text-sm mb-1">Frasco {sug.term} Días</h4>
                                <span className="text-[9px] font-black text-fin-muted uppercase tracking-widest bg-fin-bg px-2 py-1 rounded-lg border border-fin-border">
                                    {sug.items.length} Gastos agrupados
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-white tabular-nums tracking-tighter">{formatCurrency(sug.amount)}</p>
                                <p className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">Capital Estimado</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-[10px] bg-fin-bg/50 p-2.5 rounded-xl border border-white/5">
                                <span className="text-fin-muted font-bold">FECHAS</span>
                                <div className="flex items-center gap-2 font-black text-white">
                                    <span>{sug.startDate.slice(-2)}/{sug.startDate.slice(5, 7)}</span>
                                    <TrendingUp size={10} className="text-amber-500" />
                                    <span>{sug.endDate.slice(-2)}/{sug.endDate.slice(5, 7)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                <span className="text-emerald-500/80 font-bold">Rendimiento Estimado (TNA {sug.tna}%)</span>
                                <span className="text-emerald-400 font-black tabular-nums">+{formatCurrency(sug.estimatedInterest)}</span>
                            </div>
                        </div>

                        {/* DESPLEGABLE DE GASTOS */}
                        <div className="mb-4">
                            <button
                                onClick={() => toggleExpand(idx)}
                                className="w-full flex items-center justify-between text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/5 hover:bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 transition-colors"
                            >
                                <span>Ver detalle de gastos ({sug.items.length})</span>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${expandedSuggestions[idx] ? 'rotate-180' : ''}`} />
                            </button>

                            {/* LISTA EXPANDIBLE */}
                            <div className={`overflow-hidden transition-all duration-300 ${expandedSuggestions[idx] ? 'max-h-60 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="space-y-1.5 p-1 custom-scrollbar overflow-y-auto max-h-56">
                                    {sug.items.sort((a, b) => (a.plannedDate || 0) - (b.plannedDate || 0)).map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-[#050f1a] p-2 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-white/40 tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                                                    DÍA {item.plannedDate}
                                                </span>
                                                <span className="text-[10px] font-bold text-white truncate max-w-[120px]" title={item.label}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-black text-fin-muted tabular-nums">
                                                {formatCurrency(item.plannedAmount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onCreateJar({
                                name: `Reserva Gastos (${sug.term}d)`,
                                accountId: suggestedAccount?.id,
                                principal: sug.amount,
                                startDate: sug.startDate,
                                endDate: sug.endDate,
                                annualRate: sug.tna
                            })}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-amber-950 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            <Plus size={14} /> Aplicar Sugerencia
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
