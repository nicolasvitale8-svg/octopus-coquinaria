import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Project, Deliverable } from '../../types';
import { deliverableService } from '../../services/deliverableService';
import Button from '../ui/Button';

interface AddDeliverableModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddDeliverableModal: React.FC<AddDeliverableModalProps> = ({ project, isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [version, setVersion] = useState('1.0');
    const [internalNotes, setInternalNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState<'link' | 'upload'>('link');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setIsSaving(true);
        try {
            const newDeliverable: Partial<Deliverable> = {
                project_id: project.id,
                title,
                file_url: fileUrl,
                version,
                internal_notes: internalNotes,
                status: 'IN_REVIEW' // Default to in review when uploaded by consultant
            };

            const result = await deliverableService.saveDeliverable(newDeliverable);
            if (result) {
                onSuccess();
                onClose();
                // Reset form
                setTitle('');
                setFileUrl('');
                setVersion('1.0');
                setInternalNotes('');
            }
        } catch (error) {
            console.error("Error saving deliverable:", error);
            alert("Error al guardar el entregable");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Nuevo Entregable</h2>
                        <p className="text-slate-500 text-sm">Sube reportes o documentos finales.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título del Entregable</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Reporte de Costos Mensual"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Versión</label>
                            <input
                                type="text"
                                placeholder="1.0"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:border-cyan-500 outline-none transition-all font-mono"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Método</label>
                            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('link')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'link' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}
                                >
                                    Link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('upload')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'upload' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}
                                >
                                    Archivo
                                </button>
                            </div>
                        </div>
                    </div>

                    {mode === 'link' ? (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL del Documento (Drive/Sharepoint)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/30 hover:bg-slate-950/50 hover:border-slate-700 transition-all cursor-pointer">
                            <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 text-xs italic">La subida directa de archivos requiere configuración de Supabase Storage. <br /> Por ahora te recomiendo usar <strong>Link</strong>.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notas Internas</label>
                        <textarea
                            rows={3}
                            placeholder="Comentarios adicionales para revisión..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:border-cyan-500 outline-none transition-all resize-none"
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 px-8"
                            disabled={isSaving || !title}
                        >
                            {isSaving ? 'Guardando...' : 'Crear Entregable'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeliverableModal;
