import React from 'react';
import { X } from 'lucide-react';
import { SubCategory } from '../financeTypes';

interface SubCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSubCategory: Partial<SubCategory> | null;
    setEditingSubCategory: (sub: Partial<SubCategory> | null) => void;
    onSave: (e: React.FormEvent) => void;
}

export const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
    isOpen,
    onClose,
    editingSubCategory,
    setEditingSubCategory,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-fin-bg/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
            <div className="bg-fin-card rounded-[40px] w-full max-w-md border border-fin-border shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[60]"
                    title="Cerrar (Esc)"
                >
                    <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">Nuevo Sub-Rubro</h2>
                <form onSubmit={onSave} className="space-y-6 relative z-10 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1 tracking-widest">Nombre Detallado</label>
                        <input
                            type="text"
                            value={editingSubCategory?.name || ''}
                            onChange={e => setEditingSubCategory({ ...editingSubCategory, name: e.target.value })}
                            className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500 transition-all placeholder:text-white/20"
                            placeholder="Ej: Luz Edesur"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-5 bg-cyan-500 text-[#020b14] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                    >
                        Añadir Sub-Rubro
                    </button>
                </form>
            </div>
        </div>
    );
};
