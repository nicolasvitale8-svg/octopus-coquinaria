import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import Button from '../ui/Button';
import { AcademyResource } from '../../types';

/**
 * AcademyResourceModal — modal HUD para alta/edición de recursos.
 * Estética CEPHALOPOD: marcos rectos, brackets, doc-code, font-mono en labels,
 * inputs con borde phosphor en focus, botón guardar con contraste verde→negro.
 */

interface AcademyResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData?: AcademyResource | null;
}

const baseInput =
    "w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none font-mono text-xs transition-colors";

const labelClass =
    "block font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.18em] mb-1";

const AcademyResourceModal: React.FC<AcademyResourceModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        id: '',
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
        learningPath: '',
        url: '',
        url2: '',
        url3: '',
        youtube_id: '',
        actionSteps: [] as string[],
        pilares: [] as string[],
        impactOutcome: '',
        impactFormat: '',
        impactProgram: ''
    });

    const [stepsInput, setStepsInput] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                titulo: initialData.title,
                description: initialData.description,
                outcome: initialData.outcome,
                category: initialData.category,
                format: initialData.format,
                impactTag: initialData.impactTag,
                level: initialData.level,
                durationMinutes: initialData.durationMinutes,
                access: initialData.access,
                isPinned: initialData.isPinned,
                learningPath: initialData.learningPath || '',
                url: initialData.downloadUrl || '',
                url2: initialData.url2 || '',
                url3: initialData.url3 || '',
                youtube_id: initialData.youtubeId || '',
                actionSteps: initialData.actionSteps || [],
                pilares: initialData.pilares || [],
                impactOutcome: initialData.impactOutcome || '',
                impactFormat: initialData.impactFormat || '',
                impactProgram: initialData.impactProgram || ''
            });
            setStepsInput((initialData.actionSteps || []).join('\n'));
        } else {
            setFormData({
                id: '',
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
                learningPath: '',
                url: '',
                url2: '',
                url3: '',
                youtube_id: '',
                actionSteps: [],
                pilares: [],
                impactOutcome: '',
                impactFormat: '',
                impactProgram: ''
            });
            setStepsInput('');
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const steps = stepsInput.split('\n').filter(s => s.trim() !== '');
        await onSave({ ...formData, actionSteps: steps });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div
                className="relative w-full max-w-2xl border shadow-2xl animate-fade-in-up"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
            >
                {/* Brackets HUD */}
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-1">
                            — {formData.id ? 'CPD-ADM-ACA-EDIT' : 'CPD-ADM-ACA-NEW'}
                        </div>
                        <h3 className="font-display text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.75} />
                            {formData.id ? 'Editar Recurso' : 'Nuevo Recurso'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" strokeWidth={1.75} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Título + Outcome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Título</label>
                            <input
                                type="text" required
                                className={baseInput}
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Outcome / Logro</label>
                            <input
                                type="text" required maxLength={120}
                                className={`${baseInput} text-[var(--color-primary)] italic`}
                                placeholder="Ej: Dominar costos del plato estrella"
                                value={formData.outcome}
                                onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Categoría · Formato · Impacto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Categoría</label>
                            <select
                                className={baseInput}
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
                            <label className={labelClass}>Formato</label>
                            <select
                                className={baseInput}
                                value={formData.format}
                                onChange={e => setFormData({ ...formData, format: e.target.value as any })}
                            >
                                <option value="VIDEO">VIDEO</option>
                                <option value="GUIDE">GUIA</option>
                                <option value="TEMPLATE">PLANTILLA</option>
                                <option value="TIP">MICROTIP</option>
                                <option value="PDF">PDF</option>
                                <option value="FORM">FORMULARIO</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Impacto</label>
                            <select
                                className={baseInput}
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

                    {/* Nivel · Minutos · Acceso */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Nivel</label>
                            <select
                                className={baseInput}
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) as any })}
                            >
                                <option value={1}>1 · Básico</option>
                                <option value={2}>2 · Intermedio</option>
                                <option value={3}>3 · Avanzado</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Minutos</label>
                            <input
                                type="number"
                                className={baseInput}
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Acceso</label>
                            <select
                                className={baseInput}
                                value={formData.access}
                                onChange={e => setFormData({ ...formData, access: e.target.value as any })}
                            >
                                <option value="PUBLIC">PUBLIC · Free</option>
                                <option value="PRO">PRO · Suscripción</option>
                            </select>
                        </div>
                    </div>

                    {/* URLs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>URL 1 / Descarga</label>
                            <input
                                type="text"
                                className={baseInput}
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>YouTube ID (opcional)</label>
                            <input
                                type="text"
                                className={baseInput}
                                value={formData.youtube_id}
                                onChange={e => setFormData({ ...formData, youtube_id: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>URL 2 (opcional)</label>
                            <input
                                type="text"
                                className={baseInput}
                                value={formData.url2}
                                onChange={e => setFormData({ ...formData, url2: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>URL 3 (opcional)</label>
                            <input
                                type="text"
                                className={baseInput}
                                value={formData.url3}
                                onChange={e => setFormData({ ...formData, url3: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Sección Impacto */}
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--color-primary)' }}>
                            // SECCIÓN IMPACTO
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Resultado / Impacto</label>
                                <input
                                    type="text"
                                    className={baseInput}
                                    placeholder="Ej: Ahorro de 10hs mensuales"
                                    value={formData.impactOutcome}
                                    onChange={e => setFormData({ ...formData, impactOutcome: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Formato Impacto</label>
                                    <input
                                        type="text"
                                        className={baseInput}
                                        placeholder="Ej: Plan Maestro"
                                        value={formData.impactFormat}
                                        onChange={e => setFormData({ ...formData, impactFormat: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Programa / Ruta / Sprint</label>
                                    <input
                                        type="text"
                                        className={baseInput}
                                        placeholder="Ej: Sprint de Costos"
                                        value={formData.impactProgram}
                                        onChange={e => setFormData({ ...formData, impactProgram: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className={labelClass}>Descripción</label>
                        <textarea
                            className={`${baseInput} h-20 resize-none`}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Pasos de acción */}
                    <div>
                        <label className={labelClass}>Pasos de Acción (uno por línea)</label>
                        <textarea
                            className={`${baseInput} h-20 resize-none`}
                            placeholder="Revisar stock&#10;Hacer pedido&#10;Cargar factura"
                            value={stepsInput}
                            onChange={e => setStepsInput(e.target.value)}
                        />
                    </div>

                    {/* Pinned */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="pinned"
                            className="w-4 h-4 border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            checked={formData.isPinned}
                            onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                        />
                        <label htmlFor="pinned" className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)] cursor-pointer select-none">
                            Fijar en bloque "Por dónde empezar"
                        </label>
                    </div>

                    {/* Ruta de maestría */}
                    <div className="pt-2">
                        <label className="block font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--color-primary)' }}>
                            // RUTA DE MAESTRÍA
                        </label>
                        <input
                            type="text"
                            className={baseInput}
                            placeholder="Ej: Sprint Rentabilidad, Cortes PRO, Orden Operativo"
                            value={formData.learningPath}
                            onChange={e => setFormData({ ...formData, learningPath: e.target.value })}
                        />
                        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1 tracking-[0.06em]">
                            Recursos con la misma ruta se agrupan automáticamente.
                        </p>
                    </div>

                    {/* Pilares O-C-T-O-P-U-S */}
                    <div>
                        <label className={`${labelClass} mb-2`}>Pilares Octopus 7P</label>
                        <div className="flex flex-wrap gap-2">
                            {['orden', 'creatividad', 'tecnologia', 'observacion', 'pragmatismo', 'universalidad', 'sutileza'].map(pilar => {
                                const active = formData.pilares.includes(pilar);
                                return (
                                    <button
                                        key={pilar}
                                        type="button"
                                        onClick={() => {
                                            const cur = formData.pilares;
                                            setFormData({
                                                ...formData,
                                                pilares: cur.includes(pilar) ? cur.filter(x => x !== pilar) : [...cur, pilar]
                                            });
                                        }}
                                        title={pilar.toUpperCase()}
                                        className={`w-9 h-9 font-mono text-[12px] font-bold uppercase border transition-all ${
                                            active
                                                ? 'bg-[var(--color-primary)] text-[#050607] border-[var(--color-primary)]'
                                                : 'bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                                        }`}
                                    >
                                        {pilar.charAt(0)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer acciones */}
                    <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            Guardar Recurso
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AcademyResourceModal;
