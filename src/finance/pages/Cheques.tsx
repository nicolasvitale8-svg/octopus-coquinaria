import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Calendar, DollarSign, Briefcase, Building2, User, Wallet, Trash2, Edit2, XCircle
} from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';
import { formatCurrency } from '../utils/calculations';
import { chequeService, Cheque, CreateChequeDTO } from '../services/chequeService';
import { SupabaseService } from '../services/supabaseService';
import { Account } from '../financeTypes';

export const Cheques = () => {
    const { activeEntity } = useFinanza();
    const [cheques, setCheques] = useState<Cheque[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'TERCERO' | 'PROPIO'>('TERCERO');
    const [showModal, setShowModal] = useState(false);
    const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateChequeDTO>({
        cheque_number: '',
        bank_name: '',
        amount: 0,
        issue_date: new Date().toISOString().split('T')[0],
        payment_date: new Date().toISOString().split('T')[0],
        type: 'TERCERO',
        status: 'PENDIENTE',
        recipient_sender: '',
        description: ''
    });

    useEffect(() => {
        if (activeEntity?.id) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [activeEntity]);

    const loadData = async () => {
        if (!activeEntity?.id) return;
        try {
            setLoading(true);
            const [chequesData, accountsData] = await Promise.all([
                chequeService.getAll(activeEntity.id),
                SupabaseService.getAccounts(activeEntity.id)
            ]);
            setCheques(chequesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCheques = async () => {
        if (!activeEntity?.id) return;
        try {
            const data = await chequeService.getAll(activeEntity.id);
            setCheques(data);
        } catch (error) {
            console.error('Error loading cheques:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEntity?.id) return;

        try {
            // Ensure type matches active tab context if created from there, or use form value
            const payload = { ...formData, type: activeTab };

            if (editingCheque) {
                await chequeService.update(editingCheque.id, payload);
            } else {
                await chequeService.create(activeEntity.id, payload);
            }
            setShowModal(false);
            setEditingCheque(null);
            resetForm();
            loadCheques();
        } catch (error) {
            console.error('Error saving cheque:', error);
            alert('Error al guardar el cheque');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cheque?')) return;
        try {
            await chequeService.delete(id);
            loadCheques();
        } catch (error) {
            console.error('Error deleting cheque:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            cheque_number: '',
            bank_name: '',
            amount: 0,
            issue_date: new Date().toISOString().split('T')[0],
            payment_date: new Date().toISOString().split('T')[0],
            type: activeTab, // default to current tab
            status: 'PENDIENTE',
            recipient_sender: '',
            description: ''
        });
    };

    const handleEdit = (cheque: Cheque) => {
        setEditingCheque(cheque);
        setFormData({
            cheque_number: cheque.cheque_number,
            bank_name: cheque.bank_name,
            amount: cheque.amount,
            issue_date: cheque.issue_date.split('T')[0],
            payment_date: cheque.payment_date.split('T')[0],
            type: cheque.type,
            status: cheque.status,
            recipient_sender: cheque.recipient_sender,
            description: cheque.description || ''
        });
        setActiveTab(cheque.type); // Switch to the correct tab for editing
        setShowModal(true);
    };

    const filteredCheques = cheques.filter(c => c.type === activeTab);
    const totalAmount = filteredCheques.reduce((sum, c) => sum + c.amount, 0);

    // Calculate Weekly Expirations
    const weeklyExpirationsAmount = React.useMemo(() => {
        return filteredCheques
            .filter(c => {
                if (c.status !== 'PENDIENTE') return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const paymentDate = new Date(c.payment_date);
                paymentDate.setHours(0, 0, 0, 0);
                const diffTime = paymentDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            })
            .reduce((sum, c) => sum + c.amount, 0);
    }, [filteredCheques]);


    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">Libro de Cheques</h1>
                    <p className="text-fin-muted mt-3 text-sm font-medium">Gestión de E-Cheqs y Valores Físicos</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-brand text-[#020b14] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-brand/20 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={16} strokeWidth={3} /> Nuevo Cheque
                </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-[#020b14] p-1.5 rounded-2xl border border-fin-border w-full max-w-md mx-auto relative cursor-pointer">
                {/* Background Slider */}
                <div
                    className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-fin-card rounded-xl shadow-lg transition-transform duration-300 ease-out border border-fin-border ${activeTab === 'PROPIO' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                        }`}
                />

                <button
                    onClick={() => setActiveTab('TERCERO')}
                    className={`flex-1 relative z-10 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'TERCERO' ? 'text-brand' : 'text-fin-muted hover:text-white'
                        }`}
                >
                    <Briefcase size={14} /> Cartera (Terceros)
                </button>
                <button
                    onClick={() => setActiveTab('PROPIO')}
                    className={`flex-1 relative z-10 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'PROPIO' ? 'text-brand' : 'text-fin-muted hover:text-white'
                        }`}
                >
                    <Wallet size={14} /> Chequera (Propios)
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-fin-card p-6 rounded-3xl border border-fin-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted mb-2">Total {activeTab === 'TERCERO' ? 'en Cartera' : 'a Pagar'}</p>
                    <p className="text-3xl font-black text-white tabular-nums">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-fin-card p-6 rounded-3xl border border-fin-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted mb-2">Vencimientos esta semana</p>
                    <p className="text-3xl font-black text-white tabular-nums">{formatCurrency(weeklyExpirationsAmount)}</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando cheques...</div>
                ) : filteredCheques.length === 0 ? (
                    <div className="text-center py-20 text-fin-muted opacity-50">
                        <p className="text-sm font-medium">No hay cheques registrados en esta sección.</p>
                    </div>
                ) : (
                    filteredCheques.map(cheque => (
                        <div key={cheque.id} className="bg-fin-card p-6 rounded-2xl border border-fin-border flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-brand/30 transition-all">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cheque.type === 'PROPIO' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-white text-lg">{cheque.recipient_sender}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${cheque.status === 'COBRADO' || cheque.status === 'DEPOSITADO' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                                            cheque.status === 'PENDIENTE' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
                                                'border-red-500/30 text-red-500 bg-red-500/5'
                                            }`}>
                                            {cheque.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-fin-muted font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={12} />
                                            <span>{cheque.bank_name}</span>
                                        </div>
                                        <div className="w-1 h-1 bg-fin-border rounded-full" />
                                        <span>#{cheque.cheque_number}</span>
                                        <div className="w-1 h-1 bg-fin-border rounded-full" />
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            <span>Pago: {new Date(cheque.payment_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <span className={`text-xl font-black tabular-nums ${cheque.type === 'PROPIO' ? 'text-red-400' : 'text-emerald-400'
                                    }`}>
                                    {cheque.type === 'PROPIO' ? '-' : '+'}{formatCurrency(cheque.amount)}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(cheque)}
                                        className="p-2 text-fin-muted hover:text-white bg-fin-bg hover:bg-fin-border rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cheque.id)}
                                        className="p-2 text-fin-muted hover:text-red-500 bg-fin-bg hover:bg-fin-border rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-fin-card w-full max-w-2xl rounded-3xl border border-fin-border shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-fin-border flex justify-between items-center bg-[#020b14]/50">
                            <h2 className="text-xl font-black text-white">
                                {editingCheque ? 'Editar Cheque' : `Nuevo Cheque (${activeTab === 'PROPIO' ? 'Propio' : 'Tercero'})`}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-fin-muted hover:text-white transition-colors">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Banco</label>
                                    {activeTab === 'PROPIO' ? (
                                        <select
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Selecciona tu Cuenta Bancaria...</option>
                                            {accounts.filter(a => a.isActive).map(acc => (
                                                <option key={acc.id} value={acc.name}>
                                                    {acc.name} ({acc.currency})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-fin-muted/50"
                                            placeholder="Ej: Galicia"
                                            required
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">N° Cheque</label>
                                    <input
                                        type="text"
                                        value={formData.cheque_number}
                                        onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                                        className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-fin-muted/50"
                                        placeholder="00012345"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Importe</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-fin-muted/50"
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="ENTREGADO">ENTREGADO</option>
                                        <option value="DEPOSITADO">DEPOSITADO</option>
                                        <option value="COBRADO">COBRADO</option>
                                        <option value="RECHAZADO">RECHAZADO</option>
                                        <option value="ANULADO">ANULADO</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Fecha Emisión</label>
                                    <input
                                        type="date"
                                        value={formData.issue_date}
                                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                        className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Destinatario / Proveedor</label>
                                <input
                                    type="text"
                                    value={formData.recipient_sender}
                                    onChange={(e) => setFormData({ ...formData, recipient_sender: e.target.value })}
                                    className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-fin-muted/50"
                                    placeholder="Nombre de la persona/empresa"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Notas</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#020b14] border border-fin-border rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-fin-muted/50 h-24 resize-none"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-xl font-bold text-fin-muted hover:text-white hover:bg-fin-border transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-brand text-[#020b14] rounded-xl font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-white transition-all active:scale-95"
                                >
                                    {editingCheque ? 'Guardar Cambios' : 'Crear Cheque'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
