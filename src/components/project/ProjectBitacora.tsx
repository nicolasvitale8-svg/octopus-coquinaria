import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Send,
    Eye,
    EyeOff,
    Clock,
    Trash2,
    Calendar as CalendarIcon,
    Zap,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { Project, ProjectNote } from '../../types';
import { noteService } from '../../services/noteService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface ProjectBitacoraProps {
    project: Project;
}

const ProjectBitacora: React.FC<ProjectBitacoraProps> = ({ project }) => {
    const { profile } = useAuth();
    const [notes, setNotes] = useState<ProjectNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [category, setCategory] = useState<ProjectNote['category']>('GENERAL');
    const [visibility, setVisibility] = useState<ProjectNote['visibility']>('INTERNAL');
    const [filter, setFilter] = useState<'ALL' | 'CLIENT' | 'ALERT'>('ALL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchNotes();
    }, [project.id]);

    const fetchNotes = async () => {
        setIsLoading(true);
        const data = await noteService.getProjectNotes(project.id);
        setNotes(data);
        setIsLoading(false);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsSubmitting(true);
        const success = await noteService.addNote({
            project_id: project.id,
            content: newNote,
            category,
            visibility
        });

        if (success) {
            setNewNote('');
            setCategory('GENERAL');
            setVisibility('INTERNAL');
            fetchNotes();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta nota de la bitácora?')) return;
        const success = await noteService.deleteNote(id);
        if (success) fetchNotes();
    };

    const applyTemplate = (type: 'MEETING' | 'ALERT' | 'UPDATE') => {
        if (type === 'MEETING') {
            setNewNote('🤝 RESUMEN DE REUNIÓN\\n- Temas tratados:\\n- \\n\\n🎯 NEXT STEPS:\\n- ');
            setCategory('MEETING');
        } else if (type === 'ALERT') {
            setNewNote('🚨 BLOQUEO / ALERTA:\\n#urgente\\n- Motivo:\\n- Impacto:\\n- Se requiere acción de: ');
            setCategory('ALERT');
        } else if (type === 'UPDATE') {
            setNewNote('✅ ACTUALIZACIÓN:\\n- Progreso:\\n- ');
            setCategory('UPDATE');
        }
    };

    const renderRichText = (text: string) => {
        const parts = text.split(/(\n|#[\wáéíóú]+|TODO:)/gi);
        return parts.map((part, i) => {
            if (part === '\\n') return <br key={i} />;
            if (part.startsWith('#')) return <span key={i} className="text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded shadow-sm">{part}</span>;
            if (part === 'TODO:') return <span key={i} className="text-[var(--color-warning)] font-bold bg-[var(--color-warning)]/10 px-1.5 py-0.5 rounded shadow-sm">{part}</span>;
            return <span key={i}>{part}</span>;
        });
    };

    const getCategoryStyles = (cat: ProjectNote['category']) => {
        switch (cat) {
            case 'ALERT': return 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]';
            case 'UPDATE': return 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)]';
            case 'MEETING': return 'border-indigo-500/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)]';
            case 'INTERNAL': return 'border-slate-500/30 bg-[var(--text-muted)]/5 text-[var(--text-muted)]';
            default: return 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)]';
        }
    };

    const filteredNotes = notes.filter(n => {
        if (filter === 'CLIENT') return n.visibility === 'CLIENT_SHARED';
        if (filter === 'ALERT') return n.category === 'ALERT';
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Bitácora de Seguimiento</h3>
                    <p className="text-[var(--text-muted)] text-sm">Registro histórico de hitos, notas internas y acuerdos.</p>
                </div>

                {/* 1-Click Filters */}
                <div className="flex bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border-subtle)]">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-[var(--bg-surface-soft)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('CLIENT')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${filter === 'CLIENT' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                    >
                        <Eye className="w-3 h-3" /> Cliente
                    </button>
                    <button
                        onClick={() => setFilter('ALERT')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${filter === 'ALERT' ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                    >
                        <AlertTriangle className="w-3 h-3" /> Alertas
                    </button>
                </div>
            </div>

            {/* Smart Quick Entry Form */}
            <form onSubmit={handleAddNote} className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md shadow-xl overflow-hidden focus-within:border-[var(--color-primary)]/50 transition-colors">
                {/* Smart Templates */}
                <div className="bg-[var(--bg-base)]/50 border-b border-[var(--border-subtle)] px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                    <span className="text-xs text-[var(--text-muted)] font-medium py-1 mr-2 flex items-center"><Zap className="w-3 h-3 text-[var(--color-warning)] mr-1" /> Plantillas:</span>
                    <button type="button" onClick={() => applyTemplate('MEETING')} className="text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-indigo-500/30 px-2.5 py-1 rounded-full hover:bg-[var(--color-primary)]/20 transition-colors whitespace-nowrap">
                        🤝 Reunión
                    </button>
                    <button type="button" onClick={() => applyTemplate('UPDATE')} className="text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 px-2.5 py-1 rounded-full hover:bg-[var(--color-primary)]/20 transition-colors whitespace-nowrap">
                        ✅ Actualización
                    </button>
                    <button type="button" onClick={() => applyTemplate('ALERT')} className="text-[10px] font-bold bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30 px-2.5 py-1 rounded-full hover:bg-[var(--color-danger)]/20 transition-colors whitespace-nowrap">
                        🚨 Bloqueo/Alerta
                    </button>
                </div>

                <div className="p-4">
                    <textarea
                        className="w-full bg-transparent border-none text-sm text-[var(--text-primary)] focus:ring-0 outline-none resize-none min-h-[80px]"
                        placeholder="Escribe el log... usa #tags para resaltar información."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold text-[var(--text-muted)] rounded-lg px-2 py-1.5 outline-none hover:border-[var(--border-subtle)] transition-all font-mono"
                            >
                                <option value="GENERAL">General</option>
                                <option value="UPDATE">Actualización</option>
                                <option value="ALERT">Alerta</option>
                                <option value="MEETING">Reunión</option>
                                <option value="INTERNAL">Nota Interna</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => setVisibility(v => v === 'INTERNAL' ? 'CLIENT_SHARED' : 'INTERNAL')}
                                className={`flex items-center gap-1.5 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border transition-all ${visibility === 'CLIENT_SHARED' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}
                            >
                                {visibility === 'CLIENT_SHARED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {visibility === 'CLIENT_SHARED' ? 'Público: Cliente' : 'Solo Interno'}
                            </button>
                        </div>

                        <Button type="submit" size="sm" disabled={isSubmitting || !newNote.trim()}>
                            <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Guardando...' : 'Publicar Log'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Social Timeline List */}
            <div className="relative space-y-4">
                {isLoading ? (
                    <div className="py-20 text-center text-[var(--text-muted)] animate-pulse">Sincronizando feed de bitácora...</div>
                ) : filteredNotes.length > 0 ? (
                    <div className="space-y-6 before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[var(--bg-surface)]/80">
                        {filteredNotes.map(note => (
                            <div key={note.id} className="relative pl-14 group">
                                {/* Profile Avatar / Timeline Node */}
                                <div className={`absolute left-0 top-1.5 w-11 h-11 rounded-full border-4 border-[#0a0f1c] bg-[var(--bg-surface)] flex items-center justify-center font-bold text-lg text-[var(--text-primary)] z-10 shadow-xl ${note.category === 'ALERT' ? 'text-[var(--color-danger)] ring-1 ring-red-500/50' : note.category === 'UPDATE' ? 'text-[var(--color-primary)] ring-1 ring-cyan-500/50' : ''}`}>
                                    {note.usuarios?.full_name?.charAt(0) || '?'}
                                </div>

                                {/* Content Bubble */}
                                <div className={`border rounded-md rounded-tl-none p-5 shadow-lg transition-all ${getCategoryStyles(note.category)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-[var(--text-primary)] text-sm">
                                                {note.usuarios?.full_name || 'Desconocido'}
                                            </span>
                                            <span className="text-[10px] font-black tracking-widest bg-black/40 px-2 py-0.5 rounded uppercase">
                                                {note.category}
                                            </span>
                                            {note.visibility === 'CLIENT_SHARED' && (
                                                <span className="text-[9px] font-bold flex items-center gap-1 text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">
                                                    <Eye className="w-3 h-3" /> COMPARTIDO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold flex items-center gap-1 text-[var(--text-muted)] uppercase">
                                                <Clock className="w-3 h-3" />
                                                {new Date(note.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className={`${profile?.role === 'admin' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-all`}
                                                title="Eliminar Note"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rich Text Enabled Content */}
                                    <p className="text-sm leading-relaxed text-[var(--text-secondary)] mt-2 font-medium whitespace-pre-wrap">
                                        {renderRichText(note.content)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-[var(--bg-base)]/40 border border-[var(--border-subtle)] border-dashed rounded-3xl mt-8">
                        <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h5 className="text-[var(--text-secondary)] font-bold text-lg">Timeline Vacío</h5>
                        <p className="text-[var(--text-muted)] text-sm mt-2 max-w-sm mx-auto">
                            Comienza a registrar la evolución del proyecto. Usa las plantillas rápidas para estructurar mejor la información.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectBitacora;
