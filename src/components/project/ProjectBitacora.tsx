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
            if (part.startsWith('#')) return <span key={i} className="text-cyan-400 font-bold bg-cyan-400/10 px-1.5 py-0.5 rounded shadow-sm">{part}</span>;
            if (part === 'TODO:') return <span key={i} className="text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded shadow-sm">{part}</span>;
            return <span key={i}>{part}</span>;
        });
    };

    const getCategoryStyles = (cat: ProjectNote['category']) => {
        switch (cat) {
            case 'ALERT': return 'border-red-500/30 bg-red-500/5 text-red-400';
            case 'UPDATE': return 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400';
            case 'MEETING': return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400';
            case 'INTERNAL': return 'border-slate-500/30 bg-slate-500/5 text-slate-400';
            default: return 'border-slate-800 bg-slate-900 text-slate-300';
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
                    <h3 className="text-lg font-bold text-white">Bitácora de Seguimiento</h3>
                    <p className="text-slate-500 text-sm">Registro histórico de hitos, notas internas y acuerdos.</p>
                </div>

                {/* 1-Click Filters */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('CLIENT')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${filter === 'CLIENT' ? 'bg-cyan-500/20 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Eye className="w-3 h-3" /> Cliente
                    </button>
                    <button
                        onClick={() => setFilter('ALERT')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${filter === 'ALERT' ? 'bg-red-500/20 text-red-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <AlertTriangle className="w-3 h-3" /> Alertas
                    </button>
                </div>
            </div>

            {/* Smart Quick Entry Form */}
            <form onSubmit={handleAddNote} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                {/* Smart Templates */}
                <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                    <span className="text-xs text-slate-500 font-medium py-1 mr-2 flex items-center"><Zap className="w-3 h-3 text-yellow-500 mr-1" /> Plantillas:</span>
                    <button type="button" onClick={() => applyTemplate('MEETING')} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full hover:bg-indigo-500/20 transition-colors whitespace-nowrap">
                        🤝 Reunión
                    </button>
                    <button type="button" onClick={() => applyTemplate('UPDATE')} className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full hover:bg-cyan-500/20 transition-colors whitespace-nowrap">
                        ✅ Actualización
                    </button>
                    <button type="button" onClick={() => applyTemplate('ALERT')} className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full hover:bg-red-500/20 transition-colors whitespace-nowrap">
                        🚨 Bloqueo/Alerta
                    </button>
                </div>

                <div className="p-4">
                    <textarea
                        className="w-full bg-transparent border-none text-sm text-white focus:ring-0 outline-none resize-none min-h-[80px]"
                        placeholder="Escribe el log... usa #tags para resaltar información."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold text-slate-400 rounded-lg px-2 py-1.5 outline-none hover:border-slate-700 transition-all font-mono"
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
                                className={`flex items-center gap-1.5 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border transition-all ${visibility === 'CLIENT_SHARED' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
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
                    <div className="py-20 text-center text-slate-500 animate-pulse">Sincronizando feed de bitácora...</div>
                ) : filteredNotes.length > 0 ? (
                    <div className="space-y-6 before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800/80">
                        {filteredNotes.map(note => (
                            <div key={note.id} className="relative pl-14 group">
                                {/* Profile Avatar / Timeline Node */}
                                <div className={`absolute left-0 top-1.5 w-11 h-11 rounded-full border-4 border-[#0a0f1c] bg-slate-800 flex items-center justify-center font-bold text-lg text-white z-10 shadow-xl ${note.category === 'ALERT' ? 'text-red-400 ring-1 ring-red-500/50' : note.category === 'UPDATE' ? 'text-cyan-400 ring-1 ring-cyan-500/50' : ''}`}>
                                    {note.usuarios?.full_name?.charAt(0) || '?'}
                                </div>

                                {/* Content Bubble */}
                                <div className={`border rounded-xl rounded-tl-none p-5 shadow-lg transition-all ${getCategoryStyles(note.category)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white text-sm">
                                                {note.usuarios?.full_name || 'Desconocido'}
                                            </span>
                                            <span className="text-[10px] font-black tracking-widest bg-black/40 px-2 py-0.5 rounded uppercase">
                                                {note.category}
                                            </span>
                                            {note.visibility === 'CLIENT_SHARED' && (
                                                <span className="text-[9px] font-bold flex items-center gap-1 text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                                                    <Eye className="w-3 h-3" /> COMPARTIDO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold flex items-center gap-1 text-slate-500 uppercase">
                                                <Clock className="w-3 h-3" />
                                                {new Date(note.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className={`${profile?.role === 'admin' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} p-1 text-slate-600 hover:text-red-400 transition-all`}
                                                title="Eliminar Note"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Rich Text Enabled Content */}
                                    <p className="text-sm leading-relaxed text-slate-300 mt-2 font-medium whitespace-pre-wrap">
                                        {renderRichText(note.content)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl mt-8">
                        <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h5 className="text-slate-300 font-bold text-lg">Timeline Vacío</h5>
                        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                            Comienza a registrar la evolución del proyecto. Usa las plantillas rápidas para estructurar mejor la información.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectBitacora;
