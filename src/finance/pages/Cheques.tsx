import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Filter, Calendar, DollarSign,
    ArrowUpRight, ArrowDownLeft, MoreVertical, Trash2, Edit2, CheckCircle, XCircle
} from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';
import { chequeService, Cheque, CreateChequeDTO } from '../services/chequeService';

export const Cheques = () => {
    const { activeEntity } = useFinanza();
    const [cheques, setCheques] = useState<Cheque[]>([]);
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
            loadCheques();
        } else {
            setLoading(false);
        }
    }, [activeEntity]);

    const loadCheques = async () => {
        if (!activeEntity?.id) return;
        try {
            setLoading(true);
            const data = await chequeService.getAll(activeEntity.id);
            setCheques(data);
        } catch (error) {
            console.error('Error loading cheques:', error);
        } finally {
            setLoading(false);
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

    const openNewModal = () => {
        setEditingCheque(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (cheque: Cheque) => {
        setEditingCheque(cheque);
        setFormData({
            ...cheque,
            // Ensure dates are formatted for input date (YYYY-MM-DD)
            issue_date: cheque.issue_date.split('T')[0],
            payment_date: cheque.payment_date.split('T')[0],
        });
        setShowModal(true);
    };

    const filteredCheques = cheques.filter(c => c.type === activeTab);

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        const colors: any = {
            'PENDIENTE': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            'ENTREGADO': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'DEPOSITADO': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            'COBRADO': 'bg-green-500/10 text-green-500 border-green-500/20',
            'RECHAZADO': 'bg-red-500/10 text-red-500 border-red-500/20',
            'ANULADO': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        };
        return (
            <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border ${colors[status] || colors['PENDIENTE']}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white font-space">Libro de Cheques</h1>
                    <p className="text-slate-400">Gestión de E-Cheqs y Valores Físicos</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={openNewModal}
                        className="bg-[#1FB6D5] text-[#021019] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white transition-all"
                    >
                        <Plus size={20} /> Nuevo Cheque
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('TERCERO')}
                    className={`px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'TERCERO'
                        ? 'border-[#1FB6D5] text-[#1FB6D5]'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <ArrowDownLeft size={18} /> Cartera (Terceros)
                </button>
                <button
                    onClick={() => setActiveTab('PROPIO')}
                    className={`px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PROPIO'
                        ? 'border-[#1FB6D5] text-[#1FB6D5]'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <ArrowUpRight size={18} /> Chequera (Propios)
                </button>
            </div>

            {/* Stats Summary (Optional for later, just placeholder/simple calc) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase font-bold">Total Pendiente Acreditación</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        ${filteredCheques
                            .filter(c => ['PENDIENTE', 'DEPOSITADO', 'ENTREGADO'].includes(c.status))
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toLocaleString('es-AR')}
                    </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase font-bold">Vencimientos esta semana</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {/* Logic to filter this week's checks could go here */}
                        -
                    </p>
                </div>
            </div>


            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando cheques...</div>
                ) : filteredCheques.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <DollarSign size={48} className="mb-4 opacity-20" />
                        <p>No hay cheques registrados en esta categoría.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#021019] text-xs uppercase text-slate-400 font-mono">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">F. Pago (Vto)</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Banco / N°</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">
                                        {activeTab === 'TERCERO' ? 'Emisor / Cliente' : 'Destinatario / Prov.'}
                                    </th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Importe</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm">
                                {filteredCheques.map(cheque => (
                                    <tr key={cheque.id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-white">
                                            {new Date(cheque.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{cheque.bank_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">#{cheque.cheque_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {cheque.recipient_sender || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white font-mono">
                                            ${cheque.amount.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(cheque.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(cheque)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cheque.id)} className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-900/10 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {editingCheque ? 'Editar Cheque' : 'Nuevo Cheque'} {activeTab === 'TERCERO' ? '(Cartera)' : '(Propio)'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><XCircle size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Banco</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                        placeholder="Ej: Galicia"
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">N° Cheque</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                        placeholder="00012345"
                                        value={formData.cheque_number}
                                        onChange={e => setFormData({ ...formData, cheque_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Importe</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-3 text-slate-500" />
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 p-2 text-white focus:border-[#1FB6D5] outline-none"
                                            placeholder="0.00"
                                            value={formData.amount || ''}
                                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Estado</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="ENTREGADO">ENTREGADO</option>
                                        <option value="DEPOSITADO">DEPOSITADO</option>
                                        <option value="COBRADO">COBRADO</option>
                                        <option value="RECHAZADO">RECHAZADO</option>
                                        <option value="ANULADO">ANULADO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Fecha Emisión</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                        value={formData.issue_date}
                                        onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 mb-1 font-bold text-[#1FB6D5]">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                        value={formData.payment_date}
                                        onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">
                                    {activeTab === 'TERCERO' ? 'Emisor / Cliente' : 'Destinatario / Proveedor'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none"
                                    placeholder="Nombre de la persona/empresa"
                                    value={formData.recipient_sender}
                                    onChange={e => setFormData({ ...formData, recipient_sender: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Notas</label>
                                <textarea
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-[#1FB6D5] outline-none resize-none"
                                    placeholder="Detalles adicionales..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold"
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
