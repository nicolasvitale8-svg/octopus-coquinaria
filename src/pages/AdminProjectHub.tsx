import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectById, updateProject } from '../services/projectService';
import { Project } from '../types';
import { Activity, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Imported Components
import ProjectHeader from '../components/project/ProjectHeader';
import ProjectSummaryCard from '../components/project/ProjectSummaryCard';
import ProjectTeamCard from '../components/project/ProjectTeamCard';
import ProjectMilestonesCard from '../components/project/ProjectMilestonesCard';
import ProjectActivityCard from '../components/project/ProjectActivityCard';
import ProjectSystemsCard from '../components/project/ProjectSystemsCard';
import ProjectEditModal from '../components/project/ProjectEditModal';
import ProjectTasks from '../components/project/ProjectTasks';
import ProjectDeliverables from '../components/project/ProjectDeliverables';
import ProjectBitacora from '../components/project/ProjectBitacora';
import ClientProjectView from '../components/project/ClientProjectView';

type ProjectHubTab = 'overview' | 'tasks' | 'deliverables' | 'journal';

const AdminProjectHub = () => {
    const { profile, user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProjectHubTab>('overview');

    useEffect(() => {
        if (id) fetchProject(id);
    }, [id]);

    const fetchProject = async (projectId: string) => {
        setIsLoading(true);

        // VERIFICACIÓN SIMPLIFICADA: Solo admins ven todo, el resto confía en que la URL es correcta
        const data = await getProjectById(projectId);

        if (!data) {
            console.warn("Proyecto no encontrado:", projectId);
            setIsLoading(false);
            setProject(null);
            return;
        }

        setProject(data);
        setIsLoading(false);
    };

    const handleSaveUpdates = async (updatedProject: Project) => {
        try {
            const result = await updateProject(updatedProject);
            if (result) {
                setProject(result);
            } else {
                throw new Error("Failed to update project");
            }
        } catch (error) {
            console.error("Error updating project:", error);
            alert("Error al guardar el proyecto.");
            throw error; // Re-throw so modal knows it failed
        }
    };

    if (isLoading) return <div className="p-8 text-center text-[var(--text-muted)]">Cargando Hub...</div>;
    if (!project) return <div className="p-8 text-center text-[var(--color-danger)]">Proyecto no encontrado.</div>;

    // --- PORTAL CLIENTE (VIEW REDIRECT) ---
    if (profile?.role === 'client') {
        return <ClientProjectView project={project} />;
    }
    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Nav Context / Back Button */}
            <button
                onClick={() => navigate('/admin/projects')}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
            >
                <div className="p-2 rounded-full bg-[var(--bg-surface)]/50 group-hover:bg-[var(--bg-surface)]">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Listado de Proyectos</span>
            </button>

            <ProjectHeader
                project={project}
                userRole={profile?.role}
                onEdit={() => setIsEditModalOpen(true)}
            />

            {/* Tabs Navigation */}
            <div className="flex border-b border-[var(--border-subtle)] gap-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'overview' ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                    Resumen Geral
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'tasks' ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                    Tareas y Colaboración
                    <span className="ml-2 bg-[var(--bg-surface)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>
                    {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('deliverables')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'deliverables' ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                    Entregables
                    {activeTab === 'deliverables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('journal')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'journal' ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                    Bitácora
                    {activeTab === 'journal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />}
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ProjectSummaryCard project={project} />
                        <ProjectTeamCard project={project} onUpdate={() => fetchProject(id!)} />
                        <ProjectMilestonesCard project={project} />
                        <ProjectActivityCard project={project} />
                    </div>

                    <ProjectSystemsCard project={project} />
                </>
            ) : activeTab === 'tasks' ? (
                <ProjectTasks project={project} />
            ) : activeTab === 'deliverables' ? (
                <ProjectDeliverables project={project} />
            ) : (
                <ProjectBitacora project={project} />
            )}

            <ProjectEditModal
                project={project}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveUpdates}
            />
        </div>
    );
};

// --- ERROR BOUNDARY PARA DEBUGGING ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null, errorInfo: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("ErrorBoundary caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-12 bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen flex flex-col items-center justify-center font-mono">
                    <div className="bg-[var(--bg-base)] border border-[var(--color-danger)]/50 rounded-md p-8 max-w-2xl w-full shadow-2xl">
                        <Activity className="w-12 h-12 text-[var(--color-danger)] mb-4" />
                        <h1 className="text-2xl text-[var(--color-danger)] font-bold mb-4">¡Ups! Algo se rompió.</h1>
                        <p className="text-[var(--text-muted)] mb-6">Se ha producido un error crítico al renderizar este componente. Por favor comparte esta captura:</p>

                        <div className="bg-black/50 p-4 rounded-lg border border-[var(--border-subtle)] overflow-auto max-h-64 text-xs text-[var(--color-danger)] mb-4">
                            <strong>{this.state.error?.toString()}</strong>
                            <pre className="mt-2 text-[var(--text-muted)]">{this.state.errorInfo?.componentStack}</pre>
                        </div>

                        <Button onClick={() => window.location.reload()}>
                            Recargar Página
                        </Button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const AdminProjectHubWithBoundary = () => (
    <ErrorBoundary>
        <AdminProjectHub />
    </ErrorBoundary>
);

export default AdminProjectHubWithBoundary;
