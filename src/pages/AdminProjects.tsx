import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAllProjects, createProject, deleteProject } from '../services/projectService';
import { Project } from '../types';
import { Search, Briefcase, Plus, AlertCircle, Calendar, ArrowRight, X, Trash2, FileText, CheckSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    const { profile, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (profile) {
            fetchProjects();
        }
    }, [profile]);

    const fetchProjects = async () => {
        // 1. FAST: Load from LocalStorage immediately to avoid blocking UI
        const localData = localStorage.getItem('octopus_projects_local');
        if (localData) {
            const parsed = JSON.parse(localData);
            // If not admin, filter local data too
            if (!isAdmin && profile?.businessIds) {
                setProjects(parsed.filter((p: any) => profile.businessIds.includes(p.id)));
            } else {
                setProjects(parsed);
            }
            setIsLoading(false); // Show UI instantly
        }

        // 2. SLOW: Fetch from Supabase in background
        if (!localData) setIsLoading(true);

        // API Call: Only pass filterIds if NOT admin
        const filterIds = isAdmin ? undefined : (profile?.businessIds || []);

        const data = await getAllProjects(filterIds);
        setProjects(data);
        setIsLoading(false);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        setProcessingAction('Creando Proyecto...');

        // Optimistic UI: Instant response
        // await new Promise(r => setTimeout(r, 800)); // Removed for speed

        const newProject = await createProject({
            business_name: newProjectName,
            phase: 'Onboarding',
            status: 'amarillo', // Default warn until setup
            team: {},
            summary: {},
            milestones: [],
            activity_log: []
        });

        if (newProject) {
            setNewProjectName('');
            setIsModalOpen(false);
            fetchProjects(); // Refresh list (local + server)
        }
        setIsCreating(false);
        setProcessingAction(null);
    };

    const handleDeleteProject = async (id: string, businessName?: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el proyecto "${businessName || 'seleccionado'}"?`)) return;

        // Optimistic UI: Remove from list immediately
        setProjects(prev => prev.filter(p => p.id !== id));

        // Call service (start background process)
        await deleteProject(id);

        // No need to reload or wait, it's gone.
    };


    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'verde': 'bg-green-500/20 text-green-400 border-green-500/50',
            'amarillo': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            'rojo': 'bg-red-500/20 text-red-400 border-red-500/50'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.verde} uppercase`}>
                {status}
            </span>
        );
    };

    const PhaseBadge = ({ phase }: { phase: string }) => {
        return (
            <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">
                {phase}
            </span>
        );
    };

    const filteredProjects = projects.filter(p =>
        p.business_name.toLowerCase().includes(filter.toLowerCase()) ||
        p.lead_consultant?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hub de Proyectos</h1>
                    <p className="text-slate-400">Gestión centralizada de clientes y consultoría.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Proyecto
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                    <div className="bg-cyan-900/30 p-3 rounded-lg text-cyan-400">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Activos</p>
                        <p className="text-2xl font-bold text-white">{projects.filter(p => p.phase !== 'Cerrado' && p.phase !== 'Lead').length}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center">
                    <Search className="w-5 h-5 text-slate-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o consultor..."
                        className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-600"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Cliente / Negocio</th>
                                <th className="px-6 py-4 text-center">Ir</th>
                                <th className="px-6 py-4">Servicio</th>
                                <th className="px-6 py-4">Líder</th>
                                <th className="px-6 py-4">Fase</th>
                                <th className="px-6 py-4">Próxima Acción</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Cargando proyectos...</td></tr>
                            ) : filteredProjects.map(project => (
                                <tr key={project.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        {project.business_name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/admin/projects/${project.id}`}>
                                                <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 py-1 px-3 text-xs h-auto">
                                                    Hub <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>

                                            {/* V4 Indicators */}
                                            <div className="flex flex-col gap-1 items-start min-w-[60px]">
                                                {project.deliverables?.some(d => d.status === 'IN_REVIEW' || d.status === 'PENDING') && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20" title="Entregables para revisión">
                                                        <FileText className="w-2.5 h-2.5" />
                                                        {project.deliverables.filter(d => d.status === 'IN_REVIEW' || d.status === 'PENDING').length}
                                                    </div>
                                                )}
                                                {project.tasks?.some(t => t.priority === 'urgent' && t.status !== 'DONE') && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse" title="Tareas urgentes">
                                                        <CheckSquare className="w-2.5 h-2.5" />
                                                        URGENTE
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 whitespace-normal max-w-[180px] leading-tight">
                                        {project.main_service || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 italic">
                                        {project.lead_consultant || 'Sin asignar'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <PhaseBadge phase={project.phase} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.next_action ? (
                                            <div className="flex flex-col">
                                                <span className="text-white text-xs truncate max-w-[150px]" title={project.next_action}>{project.next_action}</span>
                                                <span className="text-slate-500 text-[10px] flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {project.next_action_date || '-'}
                                                </span>
                                            </div>
                                        ) : <span className="text-slate-600">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteProject(project.id, project.business_name)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Eliminar Proyecto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filteredProjects.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No hay proyectos encontrados (Intenta crear uno).</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-1">Nuevo Proyecto</h2>
                        <p className="text-slate-400 text-sm mb-6">Comienza a gestionar un nuevo cliente.</p>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <Input
                                label="Nombre del Negocio / Cliente"
                                placeholder="Ej: Restaurante El Faro"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                autoFocus
                                required
                            />

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isCreating || !newProjectName.trim()}
                                >
                                    {isCreating ? 'Creando...' : 'Crear Proyecto'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <LoadingOverlay isVisible={!!processingAction} text={processingAction || ''} />
        </div>
    );
};

export default AdminProjects;
