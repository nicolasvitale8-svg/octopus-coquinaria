import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAllProjects, createProject, deleteProject, updateProject } from '../services/projectService';
import { Project } from '../types';
import { Search, Briefcase, Plus, AlertCircle, Calendar, ArrowRight, X, Trash2, FileText, CheckSquare, DollarSign, LayoutGrid, List } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StatusBadge = React.memo(({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'verde': 'bg-[rgba(0,197,125,0.20)] text-[var(--color-success)] border-[rgba(0,197,125,0.50)]',
        'amarillo': 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[rgba(255,177,42,0.50)]',
        'rojo': 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border-[var(--color-danger)]/50'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.verde} uppercase`}>
            {status}
        </span>
    );
});
StatusBadge.displayName = 'StatusBadge';

const PhaseBadge = React.memo(({ phase }: { phase: string }) => {
    return (
        <span className="px-2 py-1 bg-[var(--bg-surface)] rounded text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {phase}
        </span>
    );
});
PhaseBadge.displayName = 'PhaseBadge';

const AdminProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // View State
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const projectPhases = ['Lead', 'Onboarding', 'Diagnóstico', 'Implementación', 'Seguimiento', 'Cerrado'] as const;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    const { profile, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (profile || isAdmin) {
            fetchProjects();
        }
    }, [profile, isAdmin]);

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

    const handleDeleteProject = React.useCallback(async (id: string, businessName?: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el proyecto "${businessName || 'seleccionado'}"?`)) return;

        // Optimistic UI: Remove from list immediately
        setProjects(prev => prev.filter(p => p.id !== id));

        // Call service (start background process)
        await deleteProject(id);

        // No need to reload or wait, it's gone.
    }, []);

    const filteredProjects = React.useMemo(() => {
        return projects.filter(p =>
            p.business_name.toLowerCase().includes(filter.toLowerCase()) ||
            p.lead_consultant?.toLowerCase().includes(filter.toLowerCase())
        );
    }, [projects, filter]);

    const handleQuickUpdate = async (project: Project, field: 'phase' | 'status', value: string) => {
        const updated = { ...project, [field]: value };
        setProcessingAction(`Actualizando ${field === 'phase' ? 'fase' : 'estado'}...`);
        const result = await updateProject(updated);
        if (result) {
            setProjects(prev => prev.map(p => p.id === project.id ? result : p));
        } else {
            alert('❌ Error al actualizar. Intenta de nuevo.');
        }
        setProcessingAction(null);
    };

    const getHealthScore = (p: Project) => {
        let score = 100;
        if (p.status === 'rojo') score -= 40;
        if (p.status === 'amarillo') score -= 20;
        const urgentTasks = p.tasks?.filter(t => t.priority === 'urgent' && t.status !== 'DONE').length || 0;
        score -= urgentTasks * 5;
        if (score < 0) score = 0;
        return score;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Hub de Proyectos</h1>
                    <p className="text-[var(--text-muted)]">Gestión centralizada de clientes y consultoría.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[var(--bg-surface-soft)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Vista Tabla"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-[var(--bg-surface-soft)] text-[var(--text-primary)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            title="Vista Tablero"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Proyecto
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-base)] p-4 rounded-md border border-[var(--border-subtle)] flex items-center gap-4">
                    <div className="bg-[var(--bg-elevated)]/30 p-3 rounded-lg text-[var(--color-primary)]">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[var(--text-muted)] text-xs font-bold uppercase">Activos</p>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{projects.filter(p => p.phase !== 'Cerrado' && p.phase !== 'Lead').length}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50 flex items-center">
                    <Search className="w-5 h-5 text-[var(--text-muted)] mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o consultor..."
                        className="bg-transparent border-none focus:ring-0 text-[var(--text-primary)] w-full placeholder-[var(--text-muted)]"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--bg-base)]/50 text-[var(--text-muted)] uppercase tracking-wider font-bold text-xs">
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
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">Cargando proyectos...</td></tr>
                            ) : filteredProjects.map(project => (
                                <tr key={project.id} className="hover:bg-[var(--bg-surface)]/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                                        {project.business_name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/admin/projects/${project.id}`}>
                                                <Button size="sm" variant="outline" className="border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)] py-1 px-3 text-xs h-auto">
                                                    Hub <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </Link>

                                            <div className="flex flex-col gap-1 items-start min-w-[60px]">
                                                {/* FinanzaFlow Authorization Toggle */}
                                                <button
                                                    onClick={async () => {
                                                        const updated = { ...project, finanzaflow_enabled: !project.finanzaflow_enabled };
                                                        setProcessingAction('Actualizando Módulos...');
                                                        const result = await updateProject(updated);
                                                        if (result) {
                                                            setProjects(prev => prev.map(p => p.id === project.id ? result : p));
                                                        } else {
                                                            alert('❌ Error al guardar en el servidor. Intenta de nuevo o revisa la consola.');
                                                        }
                                                        setProcessingAction(null);
                                                    }}
                                                    className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border transition-all ${project.finanzaflow_enabled ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/50 hover:bg-[var(--color-success)]/30' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)]'}`}
                                                    title={project.finanzaflow_enabled ? 'Desactivar Finanzas' : 'Activar Finanzas'}
                                                >
                                                    <DollarSign className="w-2.5 h-2.5" />
                                                    FINANZAS {project.finanzaflow_enabled ? 'ON' : 'OFF'}
                                                </button>

                                                {project.deliverables?.some(d => d.status === 'IN_REVIEW' || d.status === 'PENDING') && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/20" title="Entregables para revisión">
                                                        <FileText className="w-2.5 h-2.5" />
                                                        {project.deliverables.filter(d => d.status === 'IN_REVIEW' || d.status === 'PENDING').length}
                                                    </div>
                                                )}
                                                {project.tasks?.some(t => t.priority === 'urgent' && t.status !== 'DONE') && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-danger)] bg-[var(--color-danger)]/10 px-1.5 py-0.5 rounded border border-[var(--color-danger)]/20 animate-pulse" title="Tareas urgentes">
                                                        <CheckSquare className="w-2.5 h-2.5" />
                                                        URGENTE
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-normal max-w-[180px] leading-tight">
                                        {project.main_service || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-muted)] italic">
                                        {project.lead_consultant || 'Sin asignar'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={project.phase}
                                            onChange={(e) => handleQuickUpdate(project, 'phase', e.target.value)}
                                            className="bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded px-2 py-1 focus:outline-none focus:border-[var(--color-primary)]"
                                        >
                                            {projectPhases.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.next_action ? (
                                            <div className="flex flex-col">
                                                <span className="text-[var(--text-primary)] text-xs truncate max-w-[150px]" title={project.next_action}>{project.next_action}</span>
                                                <span className="text-[var(--text-muted)] text-[10px] flex items-center mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {project.next_action_date || '-'}
                                                </span>
                                            </div>
                                        ) : <span className="text-[var(--text-muted)]">-</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={project.status}
                                            onChange={(e) => handleQuickUpdate(project, 'status', e.target.value)}
                                            className={`text-xs font-bold uppercase rounded-full px-2 py-1 border appearance-none text-center cursor-pointer ${project.status === 'verde' ? 'bg-[rgba(0,197,125,0.20)] text-[var(--color-success)] border-[rgba(0,197,125,0.50)]' :
                                                    project.status === 'amarillo' ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[rgba(255,177,42,0.50)]' :
                                                        'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border-[var(--color-danger)]/50'
                                                }`}
                                        >
                                            <option className="bg-[var(--bg-base)] text-[var(--text-primary)]" value="verde">VERDE</option>
                                            <option className="bg-[var(--bg-base)] text-[var(--text-primary)]" value="amarillo">AMARILLO</option>
                                            <option className="bg-[var(--bg-base)] text-[var(--text-primary)]" value="rojo">ROJO</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getHealthScore(project) >= 80 ? 'text-[var(--color-success)] bg-[rgba(0,197,125,0.10)]' : getHealthScore(project) >= 60 ? 'text-[var(--color-warning)] bg-[rgba(255,177,42,0.10)]' : 'text-[var(--color-danger)] bg-[rgba(255,77,77,0.10)]'}`} title="Health Score">
                                            {getHealthScore(project)}%
                                        </div>
                                        <button
                                            onClick={() => handleDeleteProject(project.id, project.business_name)}
                                            className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                                            title="Eliminar Proyecto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && filteredProjects.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">No hay proyectos encontrados (Intenta crear uno).</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* KANBAN RENDER PORTAL (Absolute Override or inline replacement if toggled) */}
            {viewMode === 'kanban' && (
                <div className="absolute inset-x-0 bottom-0 top-[200px] sm:top-[180px] bg-black/95 z-20 pb-6 overflow-hidden flex flex-col pt-4">
                    <div className="px-6 w-full flex-1 overflow-x-auto overflow-y-hidden flex gap-6 pb-4 items-start scrollbar-hide">
                        {projectPhases.map(phase => {
                            const phaseProjects = filteredProjects.filter(p => p.phase === phase);
                            return (
                                <div key={phase} className="min-w-[320px] w-[320px] max-h-full flex flex-col bg-[var(--bg-base)]/60 border border-[var(--border-subtle)] rounded-md overflow-hidden shrink-0">
                                    <div className="p-4 border-b border-[var(--border-subtle)]/80 flex items-center justify-between bg-[var(--bg-base)]/80 backdrop-blur-md sticky top-0">
                                        <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider">{phase}</h3>
                                        <span className="text-xs font-black text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">{phaseProjects.length}</span>
                                    </div>
                                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                        {phaseProjects.map(project => (
                                            <div key={project.id} className="bg-[var(--bg-surface)]/80 hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)]/50 hover:border-[var(--color-primary)]/40 rounded-md p-4 transition-all shadow-lg group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <Link to={`/admin/projects/${project.id}`} className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 pr-2">
                                                        {project.business_name}
                                                    </Link>
                                                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${project.status === 'verde' ? 'bg-[var(--color-success)] shadow-[0_0_8px_#00C57D]' : project.status === 'amarillo' ? 'bg-[var(--color-warning)] shadow-[0_0_8px_#FFB12A]' : 'bg-[var(--color-danger)] shadow-[0_0_8px_#FF4D4D] animate-pulse'}`} title={project.status} />
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-3 line-clamp-1">{project.main_service || 'Sin Servicio'}</p>

                                                <div className="flex items-center gap-2 mt-auto mb-3">
                                                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getHealthScore(project) >= 80 ? 'text-[var(--color-success)] bg-[rgba(0,197,125,0.10)]' : getHealthScore(project) >= 60 ? 'text-[var(--color-warning)] bg-[rgba(255,177,42,0.10)]' : 'text-[var(--color-danger)] bg-[rgba(255,77,77,0.10)]'}`}>
                                                        HS: {getHealthScore(project)}%
                                                    </div>
                                                    <div className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-base)] px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                                                        {project.lead_consultant || 'No asignado'}
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-[var(--border-subtle)]/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <select
                                                        value={project.status}
                                                        onChange={(e) => handleQuickUpdate(project, 'status', e.target.value)}
                                                        className="bg-transparent text-[10px] uppercase font-bold text-[var(--text-secondary)] focus:outline-none cursor-pointer"
                                                    >
                                                        <option className="bg-[var(--bg-base)]" value="verde">🟢 Verde</option>
                                                        <option className="bg-[var(--bg-base)]" value="amarillo">🟡 Amarillo</option>
                                                        <option className="bg-[var(--bg-base)]" value="rojo">🔴 Rojo</option>
                                                    </select>

                                                    <select
                                                        value={project.phase}
                                                        onChange={(e) => handleQuickUpdate(project, 'phase', e.target.value)}
                                                        className="bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold text-[var(--color-primary)] px-2 py-1 rounded focus:outline-none cursor-pointer"
                                                    >
                                                        {projectPhases.map(ph => <option className="bg-[var(--bg-base)] text-[var(--text-primary)]" key={ph} value={ph}>{ph}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] w-full max-w-md shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Nuevo Proyecto</h2>
                        <p className="text-[var(--text-muted)] text-sm mb-6">Comienza a gestionar un nuevo cliente.</p>

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
