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
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-2"
            >
                <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-slate-800">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Volver al Tablero</span>
            </button>

            {/* Header simplified for client */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CheckSquare className="w-32 h-32 text-cyan-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2 font-space">{project.business_name}</h1>
                    <p className="text-slate-400">Portal de Seguimiento y Colaboración 🐙</p>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado Proyecto</p>
                            <p className="text-white font-bold">{project.phase}</p>
                        </div>
                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center min-w-[100px]">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mis Pendientes</p>
                            <p className="text-cyan-400 font-bold">{clientTasks.filter(t => t.status !== 'DONE').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                    onClick={() => setActiveTab('checklist')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'checklist' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <CheckSquare className="w-4 h-4" /> Checklist
                </button>
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'approvals' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <FileText className="w-4 h-4" /> Aprobaciones
                    {pendingApprovals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'documents' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Download className="w-4 h-4" /> Entregables
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[400px]">
                {activeTab === 'checklist' && (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Mi Checklist de Trabajo</h2>
                            <p className="text-xs text-slate-500">Tareas necesarias para avanzar.</p>
                        </div>

                        <div className="space-y-3">
                            {clientTasks.length > 0 ? clientTasks.map(task => (
                                <div key={task.id} className="bg-slate-950 border border-slate-900 p-5 rounded-xl flex items-start gap-4 hover:border-slate-700 transition-all">
                                    <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'}`}>
                                        {task.status === 'DONE' && <CheckCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold ${task.status === 'DONE' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{task.description || 'Sin descripción adicional.'}</p>
                                        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Máximo: {task.due_date || 'TBD'}</span>
                                            {task.type === 'REQUEST' && <span className="text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded">Requiere Información</span>}
                                        </div>
                                    </div>
                                    {task.status !== 'DONE' && (
                                        <Button size="sm" variant="outline" className="shrink-0 text-xs">Marcar Hecho</Button>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <Info className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">No tienes tareas pendientes por el momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <div className="p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white mb-6">Documentos Pendientes de Firma/Aprobación</h2>
                        {pendingApprovals.length > 0 ? pendingApprovals.map(doc => (
                            <div key={doc.id} className="bg-slate-950 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{doc.title}</h4>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Versión {doc.version} • Enviado el {new Date(doc.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                        <XCircle className="w-4 h-4 mr-2" /> Rechazar
                                    </Button>
                                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20">
                                        <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20">
                                <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">Todo al día. No hay aprobaciones pendientes.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="p-6 space-y-6 text-center py-20">
                        <Download className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium italic">Sección Próximamente: Repositorio central de archivos aprobados.</p>
                    </div>
                )}
            </div>

            {/* Footer / Contact */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">¿Dudas o Bloqueos?</p>
                        <p className="text-xs text-slate-500">Contacta a tu consultor líder vía WhatsApp.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline">Ir al Chat del Proyecto</Button>
            </div>
        </div>
    );
};

export default ClientProjectView;
