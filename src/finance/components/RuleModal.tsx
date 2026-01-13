import React from 'react';
import { X } from 'lucide-react';
import { TextCategoryRule, Category, SubCategory } from '../financeTypes';

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingRule: Partial<TextCategoryRule> | null;
    setEditingRule: (rule: Partial<TextCategoryRule> | null) => void;
    categories: Category[];
    subCategories: SubCategory[];
    onSave: (e: React.FormEvent) => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({
    isOpen,
    onClose,
    editingRule,
    setEditingRule,
    categories,
    subCategories,
    onSave
}) => {
    if (!isOpen) return null;

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
                <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">Nueva Regla Inteligente</h2>
                <form onSubmit={onSave} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Palabra Clave (Pattern)</label>
                        <input
                            type="text"
                            value={editingRule?.pattern || ''}
                            onChange={e => setEditingRule({ ...editingRule, pattern: e.target.value })}
                            className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white font-bold"
                            placeholder="Ej: Carcor, Netflix, Sueldo"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Asignar Rubro</label>
                        <select
                            value={editingRule?.categoryId || ''}
                            onChange={e => setEditingRule({ ...editingRule, categoryId: e.target.value, subCategoryId: undefined })}
                            className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold"
                            required
                        >
                            <option value="">Seleccionar rubro...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-fin-muted ml-1">Sub-Rubro (Opcional)</label>
                        <select
                            value={editingRule?.subCategoryId || ''}
                            onChange={e => setEditingRule({ ...editingRule, subCategoryId: e.target.value || undefined })}
                            className="w-full bg-fin-bg border border-fin-border rounded-xl p-4 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={!editingRule?.categoryId}
                        >
                            <option value="">Sin sub-rubro específico</option>
                            {subCategories
                                .filter(s => s.categoryId === editingRule?.categoryId)
                                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-brand text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20"
                    >
                        Crear Regla
                    </button>
                </form>
            </div>
        </div>
    );
};
