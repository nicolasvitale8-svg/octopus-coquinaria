import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectById, updateProject } from '../services/projectService';
import { Project } from '../types';
import { Activity } from 'lucide-react';
import Button from '../components/ui/Button';

// Imported Components
import ProjectHeader from '../components/project/ProjectHeader';
import ProjectSummaryCard from '../components/project/ProjectSummaryCard';
import ProjectTeamCard from '../components/project/ProjectTeamCard';
import ProjectMilestonesCard from '../components/project/ProjectMilestonesCard';
import ProjectActivityCard from '../components/project/ProjectActivityCard';
import ProjectSystemsCard from '../components/project/ProjectSystemsCard';
import ProjectEditModal from '../components/project/ProjectEditModal';

const AdminProjectHub = () => {
    const { profile } = useAuth();
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (id) fetchProject(id);
    }, [id]);

    const fetchProject = async (projectId: string) => {
        setIsLoading(true);

        // --- PROTECCIÓN DE ACCESO ---
        const isSuperAdmin = profile?.role === 'admin';
        const hasAccess = isSuperAdmin || (profile?.businessIds || []).includes(projectId);

        if (!hasAccess) {
            console.warn("🚫 Intento de acceso no autorizado a proyecto:", projectId);
            setIsLoading(false);
            setProject(null); // Esto disparará el mensaje de "Proyecto no encontrado" o podemos poner uno de "Sin Acceso"
            return;
        }

        const data = await getProjectById(projectId);
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

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <ProjectHeader
                project={project}
                userRole={profile?.role}
                onEdit={() => setIsEditModalOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProjectSummaryCard project={project} />
                <ProjectTeamCard project={project} />
                <ProjectMilestonesCard project={project} />
                <ProjectActivityCard project={project} />
            </div>

            <ProjectSystemsCard project={project} />

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
