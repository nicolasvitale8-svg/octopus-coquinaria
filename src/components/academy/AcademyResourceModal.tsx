import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

interface AcademyResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const AcademyResourceModal: React.FC<AcademyResourceModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'video' as 'video' | 'plantilla' | 'guia',
        url: '',
        descripcion: '',
        es_premium: false,
        topics: [] as string[],
        pilares: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        // Reset form handled by parent or here? keeping it simple here for now
        setFormData({
            titulo: '',
            tipo: 'video',
            url: '',
            descripcion: '',
            es_premium: false,
            topics: [],
            pilares: []
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white">Nuevo Recurso</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                            placeholder="Ej: Plantilla de Costos 2024"
                            value={formData.titulo}
                            onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                            >
                                <option value="video">Desafío (Video)</option>
                                <option value="plantilla">Herramienta (Excel)</option>
                                <option value="guia">Documento (PDF/Guía)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL del Recurso</label>
                            <input
                                type="url"
                                required
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none placeholder-slate-600"
                                placeholder="https://..."
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción corta</label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none h-20 resize-none"
                            placeholder="¿De qué trata este recurso?"
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="premium"
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                            checked={formData.es_premium}
                            onChange={e => setFormData({ ...formData, es_premium: e.target.checked })}
                        />
                        <label htmlFor="premium" className="text-sm text-white cursor-pointer select-none">
                            Marcar como contenido <strong>Premium</strong> (solo clientes)
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pilar(es) Metodología 7P (Se vincula con web)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'orden', label: 'O - Orden' },
                                { id: 'creatividad', label: 'C - Creatividad' },
                                { id: 'tecnologia', label: 'T - Tecnología' },
                                { id: 'observacion', label: 'O - Observación' },
                                { id: 'pragmatismo', label: 'P - Pragmatismo' },
                                { id: 'universalidad', label: 'U - Universalidad' },
                                { id: 'sutileza', label: 'S - Sutileza' }
                            ].map((pilar) => (
                                <label key={pilar.id} className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-800 cursor-pointer hover:border-[#1FB6D5]/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-700 bg-slate-900 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                                        checked={formData.pilares?.includes(pilar.id) || false}
                                        onChange={(e) => {
                                            const current = formData.pilares || [];
                                            const updated = e.target.checked
                                                ? [...current, pilar.id]
                                                : current.filter(p => p !== pilar.id);
                                            setFormData({ ...formData, pilares: updated });
                                        }}
                                    />
                                    <span className="text-xs text-slate-300 font-bold">{pilar.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rubros / Categorías</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['finanzas', 'operaciones', 'equipo', 'marketing', 'tecnologia', 'cliente'].map((topic) => (
                                <label key={topic} className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-800 cursor-pointer hover:border-slate-600">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-700 bg-slate-900 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                                        checked={formData.topics?.includes(topic) || false}
                                        onChange={(e) => {
                                            const currentTopics = formData.topics || [];
                                            const newTopics = e.target.checked
                                                ? [...currentTopics, topic]
                                                : currentTopics.filter(t => t !== topic);
                                            setFormData({ ...formData, topics: newTopics });
                                        }}
                                    />
                                    <span className="text-sm text-slate-300 capitalize">{topic}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-[#1FB6D5] text-[#021019] font-bold hover:bg-white">
                            Guardar Recurso
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AcademyResourceModal;
