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
        description: '',
        outcome: '',
        category: 'OPERACIONES',
        format: 'VIDEO',
        impactTag: 'HERRAMIENTA',
        level: 1,
        durationMinutes: 5,
        access: 'PUBLIC',
        isPinned: false,
        url: '',
        youtube_id: '',
        actionSteps: [] as string[],
        pilares: [] as string[]
    });

    const [stepsInput, setStepsInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const steps = stepsInput.split('\n').filter(s => s.trim() !== '');
        await onSave({ ...formData, actionSteps: steps });
        onClose();
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título</label>
                            <input
                                type="text" required
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Logro / Resultado (Outcome)</label>
                            <input
                                type="text" required maxLength={120}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-[#1FB6D5] focus:border-[#1FB6D5] focus:outline-none text-sm italic"
                                placeholder="Ej: Dominar los costos de tu plato estrella"
                                value={formData.outcome}
                                onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoría</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="COSTOS">COSTOS</option>
                                <option value="OPERACIONES">OPERACIONES</option>
                                <option value="EQUIPO">EQUIPO</option>
                                <option value="MARKETING">MARKETING</option>
                                <option value="TECNOLOGIA">TECNOLOGIA</option>
                                <option value="CLIENTE">CLIENTE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Formato</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.format}
                                onChange={e => setFormData({ ...formData, format: e.target.value as any })}
                            >
                                <option value="VIDEO">VIDEO</option>
                                <option value="GUIDE">GUIA</option>
                                <option value="TEMPLATE">PLANTILLA</option>
                                <option value="TIP">MICROTIP</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Impacto</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.impactTag}
                                onChange={e => setFormData({ ...formData, impactTag: e.target.value as any })}
                            >
                                <option value="QUICK_WIN">QUICK WIN</option>
                                <option value="HERRAMIENTA">HERRAMIENTA</option>
                                <option value="MARCO">MARCO TEORICO</option>
                                <option value="LECTURA">LECTURA</option>
                                <option value="CASO">CASO DE EXITO</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nivel</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) as any })}
                            >
                                <option value={1}>1 - Básico</option>
                                <option value={2}>2 - Intermedio</option>
                                <option value={3}>3 - Avanzado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Minutos</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Acceso</label>
                            <select
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.access}
                                onChange={e => setFormData({ ...formData, access: e.target.value as any })}
                            >
                                <option value="PUBLIC">PUBLIC (Free)</option>
                                <option value="PRO">PRO (Suscripción)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL / Descarga</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">YouTube ID (opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-xs"
                                value={formData.youtube_id}
                                onChange={e => setFormData({ ...formData, youtube_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none h-20 resize-none text-sm"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Passos de Acción (Uno por línea)</label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none h-20 resize-none text-sm"
                            placeholder="Revisar stock&#10;Hacer pedido&#10;Cargar factura"
                            value={stepsInput}
                            onChange={e => setStepsInput(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="pinned"
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                            checked={formData.isPinned}
                            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                        />
                        <label htmlFor="pinned" className="text-sm text-white cursor-pointer select-none">
                            Fijar arriba (Bloque "Por dónde empezar")
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vincular con Pilares Octopus (O-C-T-O-P-U-S)</label>
                        <div className="flex flex-wrap gap-2">
                            {['orden', 'creatividad', 'tecnologia', 'observacion', 'pragmatismo', 'universalidad', 'sutileza'].map(pilar => (
                                <button
                                    key={pilar}
                                    type="button"
                                    onClick={() => {
                                        const cur = formData.pilares;
                                        setFormData({ ...formData, pilares: cur.includes(pilar) ? cur.filter(x => x !== pilar) : [...cur, pilar] });
                                    }}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${formData.pilares.includes(pilar) ? 'bg-[#1FB6D5] text-[#021019] border-[#1FB6D5]' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                                >
                                    {pilar.charAt(0)}
                                </button>
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
