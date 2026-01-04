import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Send,
    Shield,
    Eye,
    EyeOff,
    AlertCircle,
    Clock,
    Trash2,
    Filter,
    Calendar as CalendarIcon
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

    const getCategoryStyles = (cat: ProjectNote['category']) => {
        switch (cat) {
            case 'ALERT': return 'border-red-500/30 bg-red-500/5 text-red-400';
            case 'UPDATE': return 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400';
            case 'MEETING': return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400';
            case 'INTERNAL': return 'border-slate-500/30 bg-slate-500/5 text-slate-400';
            default: return 'border-slate-800 bg-slate-900 text-slate-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white">Bitácora de Seguimiento</h3>
                    <p className="text-slate-500 text-sm">Registro histórico de hitos, notas internas y acuerdos.</p>
                </div>
            </div>

            {/* Quick Entry Form */}
            <form onSubmit={handleAddNote} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all resize-none min-h-[80px]"
                    placeholder="Escribe una actualización o nota interna..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold text-slate-400 rounded-lg px-2 py-1.5 outline-none hover:border-slate-700 transition-all font-mono"
                        >
                            <option value="GENERAL">General</option>
                            <option value="UPDATE">Actualización</option>
                            <option value="ALERT">Alerta / Bloqueo</option>
                            <option value="MEETING">Reunión</option>
                            <option value="INTERNAL">Nota Interna</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setVisibility(v => v === 'INTERNAL' ? 'CLIENT_SHARED' : 'INTERNAL')}
                            className={`flex items-center gap-1.5 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border transition-all ${visibility === 'CLIENT_SHARED' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                        >
                            {visibility === 'CLIENT_SHARED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {visibility === 'CLIENT_SHARED' ? 'Visible para Cliente' : 'Solo Interno'}
                        </button>
                    </div>

                    <Button type="submit" size="sm" disabled={isSubmitting || !newNote.trim()}>
                        <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Guardando...' : 'Publicar'}
                    </Button>
                </div>
            </form>

            {/* Timeline List */}
            <div className="relative space-y-4">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-500 animate-pulse">Cargando bitácora...</div>
                ) : notes.length > 0 ? (
                    <div className="space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                        {notes.map(note => (
                            <div key={note.id} className="relative pl-10 group">
                                <div className={`absolute left-[13.5px] top-4 w-2 h-2 rounded-full border-2 border-slate-900 z-10 ${note.category === 'ALERT' ? 'bg-red-500' :
                                    note.category === 'UPDATE' ? 'bg-cyan-500' :
                                        'bg-slate-700'
                                    }`} />

                                <div className={`border rounded-2xl p-5 hover:border-slate-600 transition-all ${getCategoryStyles(note.category)}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold tracking-widest bg-black/30 px-2 py-0.5 rounded border border-white/5 uppercase">
                                                {note.category}
                                            </span>
                                            {note.visibility === 'CLIENT_SHARED' && (
                                                <span className="text-[9px] font-bold flex items-center gap-1 text-cyan-500">
                                                    <Eye className="w-3 h-3" /> COMPARTIDO
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className={`${profile?.role === 'admin' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} p-1.5 text-slate-600 hover:text-red-400 transition-all`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <p className="text-sm leading-relaxed mb-4 text-slate-200">{note.content}</p>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-slate-500 uppercase font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white">
                                                {note.usuarios?.full_name?.charAt(0)}
                                            </div>
                                            <span>{note.usuarios?.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                                            <Clock className="w-3 h-3" />
                                            {new Date(note.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
                        <MessageSquare className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                        <h5 className="text-slate-400 font-medium">La bitácora está vacía</h5>
                        <p className="text-slate-600 text-sm mt-1">Comparte la primera actualización o nota del proyecto.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectBitacora;
