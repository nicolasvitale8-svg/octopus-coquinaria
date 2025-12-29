import React, { useState, useEffect } from 'react';
import {
    Plus,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    MoreVertical,
    Download,
    Eye,
    MessageSquare,
    Trash2
} from 'lucide-react';
import { Project, Deliverable } from '../../types';
import { deliverableService } from '../../services/deliverableService';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import AddDeliverableModal from './AddDeliverableModal';

interface ProjectDeliverablesProps {
    project: Project;
}

const ProjectDeliverables: React.FC<ProjectDeliverablesProps> = ({ project }) => {
    const { profile, isAdmin } = useAuth();
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        fetchDeliverables();
    }, [project.id]);

    const fetchDeliverables = async () => {
        setIsLoading(true);
        const data = await deliverableService.getProjectDeliverables(project.id);
        setDeliverables(data);
        setIsLoading(false);
    };

    const getStatusStyles = (status: Deliverable['status']) => {
        switch (status) {
            case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'IN_REVIEW': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-800 border-slate-700';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este entregable?')) return;
        const success = await deliverableService.deleteDeliverable(id);
        if (success) fetchDeliverables();
    };

    const handleStatusUpdate = async (id: string, status: Deliverable['status']) => {
        const success = await deliverableService.updateStatus(id, status);
        if (success) fetchDeliverables();
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white">Entregables y Documentación</h3>
                    <p className="text-slate-500 text-sm">Gestión de archivos, revisiones y aprobaciones finales.</p>
                </div>
                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Nuevo Entregable
                </Button>
            </div>

            {/* Grid of Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-slate-500 animate-pulse">Cargando entregables...</div>
                ) : deliverables.length > 0 ? (
                    deliverables.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Versión {item.version || '1.0'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusStyles(item.status)}`}>
                                        {item.status}
                                    </span>
                                    <button className="p-1 text-slate-500 hover:text-white transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <button
                                        onClick={() => item.file_url && window.open(item.file_url, '_blank')}
                                        className={`flex items-center gap-1.5 text-xs transition-colors ${item.file_url ? 'hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                                        disabled={!item.file_url}
                                    >
                                        <Download className="w-3.5 h-3.5" /> Descargar
                                    </button>
                                    <button
                                        onClick={() => item.file_url && window.open(item.file_url, '_blank')}
                                        className={`flex items-center gap-1.5 text-xs transition-colors ${item.file_url ? 'hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
                                        disabled={!item.file_url}
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Ver
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    {item.status === 'IN_REVIEW' && (isAdmin || profile?.role === 'admin') && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                                className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                                                title="Aprobar"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Rechazar"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                        <FileText className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                        <h5 className="text-slate-400 font-medium">Aún no hay entregables</h5>
                        <p className="text-slate-600 text-sm mt-1">Sube el primer archivo o reporte para este proyecto.</p>
                        <Button variant="ghost" size="sm" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Entregable
                        </Button>
                    </div>
                )}
            </div>

            <AddDeliverableModal
                project={project}
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchDeliverables}
            />
        </div>
    );
};

export default ProjectDeliverables;
