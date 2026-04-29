import React, { useState } from 'react';
import {
    CheckSquare,
    FileText,
    Calendar,
    MessageSquare,
    Download,
    CheckCircle,
    XCircle,
    Info,
    ArrowLeft
} from 'lucide-react';
import { Project, ProjectTask, Deliverable } from '../../types';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface ClientProjectViewProps {
    project: Project;
}

const ClientProjectView: React.FC<ClientProjectViewProps> = ({ project }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'checklist' | 'approvals' | 'documents'>('checklist');

    // Filter tasks for client (only those with type CLIENT or specifically assigned to them)
    // and visibility SHARED or CLIENT_ONLY
    const clientTasks = (project.tasks || []).filter(t =>
        (t.type === 'CLIENT' || t.visibility === 'CLIENT_ONLY' || t.visibility === 'SHARED') &&
        t.visibility !== 'INTERNAL_ONLY'
    );

    const pendingApprovals = (project.deliverables || []).filter(d => d.status === 'PENDING' || d.status === 'IN_REVIEW');
    const documents = (project.deliverables || []).filter(d => d.status === 'APPROVED');

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative pb-12">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group mb-2"
            >
                <div className="p-2 rounded-full bg-[var(--bg-surface)]/50 group-hover:bg-[var(--bg-surface)]">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Volver al Tablero</span>
            </button>

            {/* Header simplified for client */}
            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-8 rounded-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CheckSquare className="w-32 h-32 text-[var(--color-primary)]" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 font-space">{project.business_name}</h1>
                    <p className="text-[var(--text-muted)]">Portal de Seguimiento y Colaboración 🐙</p>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="bg-[var(--bg-base)] px-4 py-2 rounded-md border border-[var(--border-subtle)]">
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Estado Proyecto</p>
                            <p className="text-[var(--text-primary)] font-bold">{project.phase}</p>
                        </div>
                        <div className="bg-[var(--bg-base)] px-4 py-2 rounded-md border border-[var(--border-subtle)] text-center min-w-[100px]">
                            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Mis Pendientes</p>
                            <p className="text-[var(--color-primary)] font-bold">{clientTasks.filter(t => t.status !== 'DONE').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[var(--bg-base)] p-1 rounded-md border border-[var(--border-subtle)]">
                <button
                    onClick={() => setActiveTab('checklist')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'checklist' ? 'bg-[var(--color-primary)] text-[var(--text-primary)] shadow-lg shadow-[rgba(0,255,157,0.30)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <CheckSquare className="w-4 h-4" /> Checklist
                </button>
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'approvals' ? 'bg-[var(--color-primary)] text-[var(--text-primary)] shadow-lg shadow-[rgba(0,255,157,0.30)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <FileText className="w-4 h-4" /> Aprobaciones
                    {pendingApprovals.length > 0 && <span className="bg-[var(--color-danger)] text-[var(--text-primary)] text-[10px] px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'documents' ? 'bg-[var(--color-primary)] text-[var(--text-primary)] shadow-lg shadow-[rgba(0,255,157,0.30)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                    <Download className="w-4 h-4" /> Entregables
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md overflow-hidden min-h-[400px]">
                {activeTab === 'checklist' && (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Mi Checklist de Trabajo</h2>
                            <p className="text-xs text-[var(--text-muted)]">Tareas necesarias para avanzar.</p>
                        </div>

                        <div className="space-y-3">
                            {clientTasks.length > 0 ? clientTasks.map(task => (
                                <div key={task.id} className="bg-[var(--bg-base)] border border-slate-900 p-5 rounded-md flex items-start gap-4 hover:border-[var(--border-subtle)] transition-all">
                                    <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'DONE' ? 'bg-[var(--color-success)] border-[var(--color-success)] text-[var(--text-primary)]' : 'border-[var(--border-subtle)]'}`}>
                                        {task.status === 'DONE' && <CheckCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold ${task.status === 'DONE' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>{task.title}</h4>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">{task.description || 'Sin descripción adicional.'}</p>
                                        <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Máximo: {task.due_date || 'TBD'}</span>
                                            {task.type === 'REQUEST' && <span className="text-[var(--color-warning)] px-2 py-0.5 bg-[var(--color-warning)]/10 rounded">Requiere Información</span>}
                                        </div>
                                    </div>
                                    {task.status !== 'DONE' && (
                                        <Button size="sm" variant="outline" className="shrink-0 text-xs">Marcar Hecho</Button>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <Info className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-[var(--text-muted)] font-medium">No tienes tareas pendientes por el momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="p-6 space-y-6">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Documentos Pendientes de Firma/Aprobación</h2>
                        {pendingApprovals.length > 0 ? pendingApprovals.map(doc => (
                            <div key={doc.id} className="bg-[var(--bg-base)] border border-slate-900 p-6 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[var(--color-primary)]/10 p-3 rounded-md text-[var(--color-primary)]">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-[var(--text-primary)] font-bold">{doc.title}</h4>
                                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Versión {doc.version} • Enviado el {new Date(doc.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10">
                                        <XCircle className="w-4 h-4 mr-2" /> Rechazar
                                    </Button>
                                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-[var(--color-success)] shadow-lg shadow-emerald-600/20">
                                        <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20">
                                <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                <p className="text-[var(--text-muted)] font-medium">Todo al día. No hay aprobaciones pendientes.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="p-6 space-y-6 text-center py-20">
                        <Download className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-[var(--text-muted)] font-medium italic">Sección Próximamente: Repositorio central de archivos aprobados.</p>
                    </div>
                )}
            </div>

            {/* Footer / Contact */}
            <div className="bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] p-6 rounded-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--color-primary)]">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[var(--text-primary)] font-bold text-sm">¿Dudas o Bloqueos?</p>
                        <p className="text-xs text-[var(--text-muted)]">Contacta a tu consultor líder vía WhatsApp.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline">Ir al Chat del Proyecto</Button>
            </div>
        </div>
    );
};

export default ClientProjectView;
