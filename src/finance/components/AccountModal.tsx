import React from 'react';
import { X, Sparkles, Wallet } from 'lucide-react';
import { Account, AccountType } from '../financeTypes';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAccount: Partial<Account> | null;
    setEditingAccount: (acc: Partial<Account> | null) => void;
    accountTypes: AccountType[];
    onSave: (e: React.FormEvent) => void;
    formatArgNumber: (value: number) => string;
    parseArgNumber: (value: string) => number;
}

export const AccountModal: React.FC<AccountModalProps> = ({
    isOpen,
    onClose,
    editingAccount,
    setEditingAccount,
    accountTypes,
    onSave,
    formatArgNumber,
    parseArgNumber
}) => {
    if (!isOpen) return null;

    const selectedType = accountTypes.find(t => t.id === editingAccount?.accountTypeId);
    const isCreditCard = selectedType?.name?.toLowerCase().includes('crédit') ||
        selectedType?.name?.toLowerCase().includes('credito') ||
        selectedType?.name?.toLowerCase().includes('tarjeta');

    return (
        <div className="fixed inset-0 bg-fin-bg/90 backdrop-blur-xl flex items-center justify-center z-50 p-6">
            <div className="bg-fin-card rounded-[32px] w-full max-w-lg border border-fin-border shadow-2xl p-10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
                    title="Cerrar (Esc)"
                >
                    <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">
                    {editingAccount?.id ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h2>
                <form onSubmit={onSave} className="space-y-6 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre de la Cuenta</label>
                        <input
                            type="text"
                            value={editingAccount?.name || ''}
                            onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                            className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-brand transition-all placeholder:text-white/20"
                            placeholder="Ej: Brubank Personal"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Tipo</label>
                            <select
                                value={editingAccount?.accountTypeId || ''}
                                onChange={e => setEditingAccount({ ...editingAccount, accountTypeId: e.target.value })}
                                className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand cursor-pointer appearance-none"
                                required
                            >
                                <option value="">Seleccionar Tipo...</option>
                                {accountTypes.map(t => <option key={t.id} value={t.id} className="bg-fin-card py-2">{t.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Moneda</label>
                            <select
                                value={editingAccount?.currency || 'ARS'}
                                onChange={e => setEditingAccount({ ...editingAccount, currency: e.target.value })}
                                className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white text-xs font-black uppercase outline-none focus:border-brand cursor-pointer appearance-none"
                            >
                                <option value="ARS">ARS</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>
                    {/* Límite de Crédito - Solo para Tarjetas */}
                    {isCreditCard && (
                        <div className="space-y-2 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20">
                            <label className="text-[10px] font-black uppercase text-orange-400 ml-1 tracking-widest flex items-center gap-2">
                                <Sparkles size={12} /> Límite de Crédito
                            </label>
                            <input
                                type="text"
                                value={(editingAccount as any)?.creditLimit ? formatArgNumber((editingAccount as any).creditLimit) : ''}
                                onChange={e => setEditingAccount({ ...editingAccount, creditLimit: parseArgNumber(e.target.value) } as any)}
                                className="w-full bg-[#020b14] border border-orange-500/30 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500 transition-all placeholder:text-white/20"
                                placeholder="Ej: 500.000,00"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-5 bg-brand text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-brand/20 active:scale-95 transition-all mt-4"
                    >
                        Guardar Cambios
                    </button>
                </form>
            </div>
        </div>
    );
};
