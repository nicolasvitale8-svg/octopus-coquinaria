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

    if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando Hub...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Proyecto no encontrado.</div>;

    // --- PORTAL CLIENTE (VIEW REDIRECT) ---
    // if (profile?.role === 'client') {
    //    return <ClientProjectView project={project} />;
    // }
    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Nav Context / Back Button */}
            <button
                onClick={() => navigate('/admin/projects')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-slate-800">
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
            <div className="flex border-b border-slate-800 gap-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'overview' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Resumen Geral
                    {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'tasks' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Tareas y Colaboración
                    <span className="ml-2 bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full">Pro</span>
                    {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('deliverables')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'deliverables' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Entregables
                    {activeTab === 'deliverables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('journal')}
                    className={`pb-4 text-sm font-bold transition-all px-2 relative ${activeTab === 'journal' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Bitácora
                    {activeTab === 'journal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />}
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
                <div className="p-12 bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center font-mono">
                    <div className="bg-slate-900 border border-red-500/50 rounded-xl p-8 max-w-2xl w-full shadow-2xl">
                        <Activity className="w-12 h-12 text-red-500 mb-4" />
                        <h1 className="text-2xl text-red-400 font-bold mb-4">¡Ups! Algo se rompió.</h1>
                        <p className="text-slate-400 mb-6">Se ha producido un error crítico al renderizar este componente. Por favor comparte esta captura:</p>

                        <div className="bg-black/50 p-4 rounded-lg border border-slate-800 overflow-auto max-h-64 text-xs text-red-300 mb-4">
                            <strong>{this.state.error?.toString()}</strong>
                            <pre className="mt-2 text-slate-500">{this.state.errorInfo?.componentStack}</pre>
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
