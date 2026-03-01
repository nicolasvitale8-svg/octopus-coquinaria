import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, ChevronDown, ChevronUp, DollarSign, CreditCard, Receipt, Users,
    Trash2, Edit2, CheckCircle, XCircle, Calendar, Percent, Hash, AlertTriangle, Undo2
} from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';
import { formatCurrency } from '../utils/calculations';
import {
    loanService, Loan, LoanPayment, CreateLoanDTO, LoanDirection, generateInstallments
} from '../services/loanService';
import { Category, SubCategory, TransactionType, Account } from '../financeTypes';

// ======== CONSTANTS ========

const DIRECTION_LABELS: Record<LoanDirection, string> = {
    TAKEN: 'Préstamo Recibido',
    GIVEN: 'Préstamo Otorgado',
    CREDIT_CARD: 'Cuotas Tarjeta',
};

const DIRECTION_COLORS: Record<LoanDirection, string> = {
    TAKEN: 'text-red-400',
    GIVEN: 'text-emerald-400',
    CREDIT_CARD: 'text-purple-400',
};

const DIRECTION_BG: Record<LoanDirection, string> = {
    TAKEN: 'bg-red-500/10 border-red-500/20',
    GIVEN: 'bg-emerald-500/10 border-emerald-500/20',
    CREDIT_CARD: 'bg-purple-500/10 border-purple-500/20',
};

const TAB_ICONS: Record<LoanDirection, React.ReactNode> = {
    TAKEN: <Receipt size={16} />,
    GIVEN: <Users size={16} />,
    CREDIT_CARD: <CreditCard size={16} />,
};

const SUBCATEGORY_MAP: Record<LoanDirection, string> = {
    TAKEN: 'Cuota Préstamo Recibido',
    GIVEN: 'Cobro Préstamo Otorgado',
    CREDIT_CARD: 'Cuota Tarjeta',
};

const CATEGORY_NAME = 'Préstamos';

// ======== COMPONENT ========

export const Loans: React.FC = () => {
    const { activeEntity, service } = useFinanza();
    const projectId = activeEntity.id;

    // Data
    const [loans, setLoans] = useState<Loan[]>([]);
    const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({});
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

    // UI
    const [activeTab, setActiveTab] = useState<LoanDirection>('TAKEN');
    const [showModal, setShowModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form
    const [form, setForm] = useState<Partial<CreateLoanDTO>>({
        direction: 'TAKEN',
        counterparty: '',
        total_amount: 0,
        total_installments: 1,
        installment_amount: 0,
        interest_rate: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVO',
        description: '',
        account_id: '',
    });

    // ======== LOAD DATA ========

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load accounts, categories, subcategories (these always work)
            const [accs, cats, subs] = await Promise.all([
                service.getAccounts(projectId ?? undefined),
                service.getCategories(projectId ?? undefined),
                service.getAllSubCategories(projectId ?? undefined),
            ]);
            setAccounts(accs);
            setCategories(cats);
            setSubCategories(subs);

            // Load loans separately (may fail if table/column doesn't exist yet)
            try {
                const loansData = await loanService.getAll(projectId);
                setLoans(loansData);

                if (loansData.length > 0) {
                    const allPayments = await loanService.getAllPayments(loansData.map(l => l.id));
                    const grouped: Record<string, LoanPayment[]> = {};
                    allPayments.forEach(p => {
                        if (!grouped[p.loan_id]) grouped[p.loan_id] = [];
                        grouped[p.loan_id].push(p);
                    });
                    setPayments(grouped);
                }
            } catch (loanErr) {
                console.warn('Error loading loans (table may not exist yet):', loanErr);
                setLoans([]);
                setPayments({});
            }
        } catch (err) {
            console.error('Error loading finance data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ======== AUTO-CREATE CATEGORY ========

    const ensureLoanCategory = async (): Promise<{ categoryId: string; subcategoryId: string }> => {
        let cat = categories.find(c => c.name === CATEGORY_NAME);
        if (!cat) {
            cat = await service.addCategory({ name: CATEGORY_NAME, type: 'MIX', isActive: true }, projectId ?? undefined);
            setCategories(prev => [...prev, cat!]);
        }

        const subName = SUBCATEGORY_MAP[form.direction as LoanDirection] || 'Cuota Préstamo';
        let sub = subCategories.find(s => s.categoryId === cat!.id && s.name === subName);
        if (!sub) {
            sub = await service.addSubCategory({ categoryId: cat.id, name: subName, isActive: true }, projectId ?? undefined);
            setSubCategories(prev => [...prev, sub!]);
        }

        return { categoryId: cat.id, subcategoryId: sub.id };
    };

    // ======== FORM HANDLERS ========

    const recalculateInstallment = (totalAmount: number, totalInstallments: number, interestRate: number) => {
        if (totalInstallments <= 0) return 0;
        if (interestRate > 0) {
            const monthlyRate = interestRate / 100 / 12;
            return Math.round((totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalInstallments)) /
                (Math.pow(1 + monthlyRate, totalInstallments) - 1)) * 100) / 100;
        }
        return Math.round((totalAmount / totalInstallments) * 100) / 100;
    };

    const handleFormChange = (field: string, value: any) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            // Auto-recalculate installment amount
            if (['total_amount', 'total_installments', 'interest_rate'].includes(field)) {
                const ta = field === 'total_amount' ? Number(value) : Number(updated.total_amount || 0);
                const ti = field === 'total_installments' ? Number(value) : Number(updated.total_installments || 1);
                const ir = field === 'interest_rate' ? Number(value) : Number(updated.interest_rate || 0);
                updated.installment_amount = recalculateInstallment(ta, ti, ir);
            }
            return updated;
        });
    };

    const resetForm = () => {
        setForm({
            direction: activeTab,
            counterparty: '',
            total_amount: 0,
            total_installments: 1,
            installment_amount: 0,
            interest_rate: 0,
            start_date: new Date().toISOString().split('T')[0],
            status: 'ACTIVO',
            description: '',
            account_id: '',
        });
        setEditingLoan(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError(null);

        try {
            // Auto-create category
            const { categoryId, subcategoryId } = await ensureLoanCategory();

            const loanData: CreateLoanDTO = {
                direction: form.direction as LoanDirection,
                counterparty: form.counterparty || '',
                total_amount: Number(form.total_amount) || 0,
                total_installments: Number(form.total_installments) || 1,
                installment_amount: Number(form.installment_amount) || 0,
                interest_rate: Number(form.interest_rate) || 0,
                start_date: form.start_date || new Date().toISOString().split('T')[0],
                status: 'ACTIVO',
                description: form.description,
                account_id: form.account_id || undefined,
                category_id: categoryId,
                subcategory_id: subcategoryId,
            };

            if (editingLoan) {
                await loanService.update(editingLoan.id, loanData);
            } else {
                await loanService.create(projectId, loanData);
            }

            await loadData();
            setShowModal(false);
            resetForm();
        } catch (err: any) {
            console.error('Error saving loan:', err);
            setError(err?.message || 'Error al guardar el préstamo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este préstamo y todas sus cuotas?')) return;
        try {
            await loanService.delete(id);
            await loadData();
        } catch (err) {
            console.error('Error deleting loan:', err);
        }
    };

    const handleRecordPayment = async (paymentId: string) => {
        try {
            await loanService.recordPayment(paymentId, new Date().toISOString().split('T')[0]);
            await loadData();
        } catch (err) {
            console.error('Error recording payment:', err);
        }
    };

    const handleUndoPayment = async (paymentId: string) => {
        try {
            await loanService.undoPayment(paymentId);
            await loadData();
        } catch (err) {
            console.error('Error undoing payment:', err);
        }
    };

    const handleEdit = (loan: Loan) => {
        setEditingLoan(loan);
        setForm({
            direction: loan.direction,
            counterparty: loan.counterparty,
            total_amount: loan.total_amount,
            total_installments: loan.total_installments,
            installment_amount: loan.installment_amount,
            interest_rate: loan.interest_rate,
            start_date: loan.start_date,
            status: loan.status,
            description: loan.description,
            account_id: loan.account_id,
        });
        setShowModal(true);
    };

    // ======== COMPUTED ========

    const filteredLoans = useMemo(() => {
        return loans
            .filter(l => l.direction === activeTab)
            .filter(l => {
                if (!searchTerm) return true;
                const s = searchTerm.toLowerCase();
                return l.counterparty.toLowerCase().includes(s) ||
                    (l.description || '').toLowerCase().includes(s);
            });
    }, [loans, activeTab, searchTerm]);

    const summary = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = today.substring(0, 7); // YYYY-MM

        const activeLoans = loans.filter(l => l.status === 'ACTIVO');

        const totalDebt = activeLoans
            .filter(l => l.direction === 'TAKEN' || l.direction === 'CREDIT_CARD')
            .reduce((sum, l) => {
                const paid = (payments[l.id] || []).filter(p => p.status === 'PAGADA').reduce((s, p) => s + p.amount, 0);
                return sum + (l.total_amount - paid);
            }, 0);

        const totalReceivable = activeLoans
            .filter(l => l.direction === 'GIVEN')
            .reduce((sum, l) => {
                const collected = (payments[l.id] || []).filter(p => p.status === 'PAGADA').reduce((s, p) => s + p.amount, 0);
                return sum + (l.total_amount - collected);
            }, 0);

        // Cuotas pendientes este mes
        let pendingThisMonth = 0;
        Object.values(payments).flat().forEach(p => {
            if (p.status === 'PENDIENTE' && p.due_date.substring(0, 7) === currentMonth) {
                pendingThisMonth += p.amount;
            }
        });

        // Cuotas vencidas
        let overdue = 0;
        Object.values(payments).flat().forEach(p => {
            if (p.status === 'PENDIENTE' && p.due_date < today) {
                overdue++;
            }
        });

        return { totalDebt, totalReceivable, pendingThisMonth, overdue };
    }, [loans, payments]);

    const getAccountName = (accountId?: string) => {
        if (!accountId) return '—';
        return accounts.find(a => a.id === accountId)?.name || '—';
    };

    const getPaidCount = (loanId: string) => {
        return (payments[loanId] || []).filter(p => p.status === 'PAGADA').length;
    };

    const getProgress = (loan: Loan) => {
        const paid = getPaidCount(loan.id);
        return Math.round((paid / loan.total_installments) * 100);
    };

    // ======== RENDER ========

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        Préstamos & Cuotas
                    </h1>
                    <p className="text-sm text-white/40 mt-1">Gestión de deudas, préstamos y compras en cuotas</p>
                </div>
                <button
                    onClick={() => { resetForm(); setForm(prev => ({ ...prev, direction: activeTab })); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:scale-105"
                >
                    <Plus size={18} />
                    <span>Nuevo</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    icon={<DollarSign size={20} />}
                    label="Total Adeudado"
                    value={formatCurrency(summary.totalDebt)}
                    color="text-red-400"
                    bg="bg-red-500/10 border-red-500/20"
                />
                <SummaryCard
                    icon={<Users size={20} />}
                    label="Total a Cobrar"
                    value={formatCurrency(summary.totalReceivable)}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10 border-emerald-500/20"
                />
                <SummaryCard
                    icon={<Calendar size={20} />}
                    label="Cuotas Este Mes"
                    value={formatCurrency(summary.pendingThisMonth)}
                    color="text-cyan-400"
                    bg="bg-cyan-500/10 border-cyan-500/20"
                />
                <SummaryCard
                    icon={<AlertTriangle size={20} />}
                    label="Cuotas Vencidas"
                    value={String(summary.overdue)}
                    color={summary.overdue > 0 ? 'text-amber-400' : 'text-white/40'}
                    bg={summary.overdue > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'}
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                {(['TAKEN', 'GIVEN', 'CREDIT_CARD'] as LoanDirection[]).map(dir => (
                    <button
                        key={dir}
                        onClick={() => setActiveTab(dir)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${activeTab === dir
                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {TAB_ICONS[dir]}
                        <span className="hidden sm:inline">{DIRECTION_LABELS[dir]}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, descripción..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
            </div>

            {/* Loans List */}
            {filteredLoans.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                    <Receipt size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-bold">No hay {DIRECTION_LABELS[activeTab].toLowerCase()}</p>
                    <p className="text-sm mt-1">Creá uno nuevo con el botón de arriba</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLoans.map(loan => (
                        <LoanCard
                            key={loan.id}
                            loan={loan}
                            payments={payments[loan.id] || []}
                            expanded={expandedLoan === loan.id}
                            onToggle={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                            onEdit={() => handleEdit(loan)}
                            onDelete={() => handleDelete(loan.id)}
                            onPayment={handleRecordPayment}
                            onUndoPayment={handleUndoPayment}
                            accountName={getAccountName(loan.account_id)}
                            paidCount={getPaidCount(loan.id)}
                            progress={getProgress(loan)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <LoanModal
                    form={form}
                    accounts={accounts}
                    editing={!!editingLoan}
                    saving={saving}
                    error={error}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowModal(false); resetForm(); setError(null); }}
                />
            )}
        </div>
    );
};

// ======== SUB-COMPONENTS ========

const SummaryCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    bg: string;
}> = ({ icon, label, value, color, bg }) => (
    <div className={`p-5 rounded-2xl border ${bg} transition-all hover:scale-[1.02]`}>
        <div className={`${color} mb-3`}>{icon}</div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
    </div>
);

const LoanCard: React.FC<{
    loan: Loan;
    payments: LoanPayment[];
    expanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPayment: (id: string) => void;
    onUndoPayment: (id: string) => void;
    accountName: string;
    paidCount: number;
    progress: number;
}> = ({ loan, payments, expanded, onToggle, onEdit, onDelete, onPayment, onUndoPayment, accountName, paidCount, progress }) => {
    const isOverdue = payments.some(p => p.status === 'PENDIENTE' && p.due_date < new Date().toISOString().split('T')[0]);

    return (
        <div className={`rounded-2xl border transition-all ${loan.status !== 'ACTIVO'
            ? 'bg-white/[0.02] border-white/5 opacity-60'
            : isOverdue
                ? 'bg-amber-500/5 border-amber-500/20'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}>
            {/* Header Row */}
            <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={onToggle}>
                <div className={`p-2.5 rounded-xl ${DIRECTION_BG[loan.direction]}`}>
                    {TAB_ICONS[loan.direction]}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white truncate">{loan.counterparty}</h3>
                        {loan.status !== 'ACTIVO' && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${loan.status === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>{loan.status}</span>
                        )}
                        {isOverdue && loan.status === 'ACTIVO' && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400">
                                VENCIDA
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span>{accountName}</span>
                        <span>•</span>
                        <span>{paidCount}/{loan.total_installments} cuotas</span>
                        {loan.interest_rate > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Percent size={10} />{loan.interest_rate}% anual</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="text-right hidden sm:block">
                    <p className={`text-lg font-black ${DIRECTION_COLORS[loan.direction]}`}>
                        {formatCurrency(loan.total_amount)}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                        Cuota: {formatCurrency(loan.installment_amount)}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-16 hidden md:block">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-white/40 text-center mt-1">{progress}%</p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                    </button>
                    <div className={`transition-transform duration-200 text-white/40 ${expanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} />
                    </div>
                </div>
            </div>

            {/* Description */}
            {loan.description && (
                <div className="px-5 pb-2 -mt-2">
                    <p className="text-xs text-white/30 italic">{loan.description}</p>
                </div>
            )}

            {/* Expanded: Payment Schedule */}
            {expanded && (
                <div className="border-t border-white/5 p-5">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                        Cronograma de Cuotas
                    </h4>
                    <div className="space-y-2">
                        {payments.map(payment => {
                            const isOverduePayment = payment.status === 'PENDIENTE' && payment.due_date < new Date().toISOString().split('T')[0];
                            return (
                                <div
                                    key={payment.id}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${payment.status === 'PAGADA'
                                        ? 'bg-emerald-500/5 border border-emerald-500/10'
                                        : isOverduePayment
                                            ? 'bg-amber-500/5 border border-amber-500/20'
                                            : 'bg-white/[0.02] border border-white/5'
                                        }`}
                                >
                                    <span className="text-xs font-mono text-white/30 w-8">
                                        #{payment.installment_number}
                                    </span>

                                    <div className="flex-1 flex items-center gap-3">
                                        <span className="text-xs text-white/60">
                                            {new Date(payment.due_date + 'T12:00:00').toLocaleDateString('es-AR', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                        {isOverduePayment && (
                                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                VENCIDA
                                            </span>
                                        )}
                                        {payment.paid_date && (
                                            <span className="text-[9px] text-emerald-400/60">
                                                Pagada {new Date(payment.paid_date + 'T12:00:00').toLocaleDateString('es-AR')}
                                            </span>
                                        )}
                                    </div>

                                    <span className={`text-sm font-bold ${payment.status === 'PAGADA' ? 'text-emerald-400 line-through opacity-60' : 'text-white'
                                        }`}>
                                        {formatCurrency(payment.amount)}
                                    </span>

                                    {payment.status === 'PENDIENTE' ? (
                                        <button
                                            onClick={() => onPayment(payment.id)}
                                            className="p-1.5 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                            title="Marcar como pagada"
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onUndoPayment(payment.id)}
                                            className="p-1.5 text-emerald-400/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                                            title="Deshacer pago"
                                        >
                                            <Undo2 size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const LoanModal: React.FC<{
    form: Partial<CreateLoanDTO>;
    accounts: Account[];
    editing: boolean;
    saving: boolean;
    error: string | null;
    onChange: (field: string, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}> = ({ form, accounts, editing, saving, error, onChange, onSubmit, onClose }) => {
    const totalWithInterest = (form.installment_amount || 0) * (form.total_installments || 1);
    const interestTotal = totalWithInterest - (form.total_amount || 0);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-[#0b1221] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-black text-white">
                        {editing ? 'Editar Préstamo' : 'Nuevo Préstamo'}
                    </h2>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    {/* Direction */}
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['TAKEN', 'GIVEN', 'CREDIT_CARD'] as LoanDirection[]).map(dir => (
                                <button
                                    key={dir}
                                    type="button"
                                    onClick={() => onChange('direction', dir)}
                                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${form.direction === dir
                                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                        }`}
                                >
                                    {DIRECTION_LABELS[dir]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Counterparty */}
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">
                            {form.direction === 'CREDIT_CARD' ? 'Comercio / Descripción' : form.direction === 'GIVEN' ? 'A quién' : 'Entidad / Banco'}
                        </label>
                        <input
                            type="text"
                            value={form.counterparty || ''}
                            onChange={e => onChange('counterparty', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                            placeholder="Ej: Banco Nación, Juan Pérez, Mercado Libre..."
                            required
                        />
                    </div>

                    {/* Amount + Installments Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Monto Total</label>
                            <input
                                type="number"
                                value={form.total_amount || ''}
                                onChange={e => onChange('total_amount', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Cuotas</label>
                            <input
                                type="number"
                                value={form.total_installments || ''}
                                onChange={e => onChange('total_installments', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="12"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    {/* Interest + Start Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Tasa Anual %</label>
                            <input
                                type="number"
                                value={form.interest_rate ?? ''}
                                onChange={e => onChange('interest_rate', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                                placeholder="0"
                                min="0"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Fecha Inicio</label>
                            <input
                                type="date"
                                value={form.start_date || ''}
                                onChange={e => onChange('start_date', e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all [color-scheme:dark]"
                                required
                            />
                        </div>
                    </div>

                    {/* Account */}
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Cuenta / Tarjeta (opcional)</label>
                        {accounts.length > 0 ? (
                            <select
                                value={form.account_id || ''}
                                onChange={e => onChange('account_id', e.target.value)}
                                className="w-full px-4 py-3 bg-[#0b1221] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                            >
                                <option value="" style={{ background: '#0b1221', color: '#fff' }}>Sin asociar</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id} style={{ background: '#0b1221', color: '#fff' }}>{a.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-xs text-white/30 py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                No hay cuentas cargadas. Podés crearlas desde <span className="text-cyan-400">Administración</span>.
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Descripción (opcional)</label>
                        <input
                            type="text"
                            value={form.description || ''}
                            onChange={e => onChange('description', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all"
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {/* Calculation Preview */}
                    {(form.total_amount ?? 0) > 0 && (form.total_installments ?? 0) > 0 && (
                        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 space-y-2">
                            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Vista Previa</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Valor cuota:</span>
                                <span className="text-white font-bold">{formatCurrency(form.installment_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Total a pagar:</span>
                                <span className="text-white font-bold">{formatCurrency(totalWithInterest)}</span>
                            </div>
                            {interestTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/50">Intereses:</span>
                                    <span className="text-amber-400 font-bold">{formatCurrency(interestTotal)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Préstamo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
