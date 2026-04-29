import React from 'react';
import { X } from 'lucide-react';
import { Category, TransactionType } from '../financeTypes';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCategory: Partial<Category> | null;
    setEditingCategory: (cat: Partial<Category> | null) => void;
    onSave: (e: React.FormEvent) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    editingCategory,
    setEditingCategory,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
            <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-fin-border shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-[var(--text-primary)]/50 hover:text-[var(--text-primary)] bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
                    title="Cerrar (Esc)"
                >
                    <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-10 uppercase tracking-tight">
                    {editingCategory?.id ? 'Editar Rubro' : 'Nuevo Rubro'}
                </h2>
                <form onSubmit={onSave} className="space-y-6 relative z-10 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre del Rubro</label>
                        <input
                            type="text"
                            value={editingCategory?.name || ''}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="w-full bg-[#020b14] border border-white/10 rounded-md p-4 text-[var(--text-primary)] font-bold outline-none focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--text-primary)]/20"
                            placeholder="Ej: Servicios Públicos"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Tipo de Flujo</label>
                        <select
                            value={editingCategory?.type || ''}
                            onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value as TransactionType })}
                            className="w-full bg-[#020b14] border border-white/10 rounded-md p-4 text-[var(--text-primary)] text-xs font-black uppercase tracking-widest outline-none focus:border-[var(--color-primary)] appearance-none cursor-pointer"
                            required
                        >
                            <option value="IN">Ingresos</option>
                            <option value="OUT">Gastos</option>
                            <option value="MIX">Mixto (Ambos)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-5 bg-[var(--color-primary)] text-[#020b14] rounded-md font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[rgba(0,255,157,0.30)] active:scale-95 transition-all"
                    >
                        Guardar Rubro
                    </button>
                </form>
            </div>
        </div>
    );
};
