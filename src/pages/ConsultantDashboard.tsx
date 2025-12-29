import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProjectTask, Project } from '../types';
import { taskService } from '../services/taskService';
import { getAllProjects } from '../services/projectService';
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Briefcase,
    ChevronRight,
    MessageSquare,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import AddTaskModal from '../components/project/AddTaskModal';
import { Plus } from 'lucide-react';

const ConsultantDashboard = () => {
    const { profile } = useAuth();
    const [myTasks, setMyTasks] = useState<ProjectTask[]>([]);
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    useEffect(() => {
        if (profile?.id) {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // In V4, we fetch projects where the user is a member
            const projects = await getAllProjects(profile?.businessIds);
            setMyProjects(projects);

            // Mock/Initial tasks fetch (logic will evolve with real API)
            // For now, we'll try to get tasks for all their projects
            const allTasks: ProjectTask[] = [];
            for (const p of projects) {
                const tasks = await taskService.getTasksByProject(p.id);
                allTasks.push(...tasks.filter(t => t.assigned_to === profile?.id));
            }
            setMyTasks(allTasks);
        } catch (e) {
            console.error("Error loading consultant data:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const pendingTasks = myTasks.filter(t => t.status !== 'DONE' && t.status !== 'APPROVED');
    const criticalTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2 font-space">
                    Hola, {profile?.name || 'Consultor'} 🐙
                </h1>
                <p className="text-slate-400">Aquí tienes el resumen de tus tareas y proyectos activos.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Tareas Pendientes</h3>
                    </div>
                    <p className="text-4xl font-bold text-white font-space">{pendingTasks.length}</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Proyectos Activos</h3>
                    </div>
                    <p className="text-4xl font-bold text-white font-space">{myProjects.length}</p>
                </div>

                <div className="bg-slate-900/50 border border-red-500/20 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-red-500/10 p-3 rounded-xl text-red-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Urgentes / Críticos</h3>
                    </div>
                    <p className="text-4xl font-bold text-white font-space">{criticalTasks.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Tasks List */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Mis Tareas Próximas
                        </h2>
                        <Link to="/admin/projects" className="text-xs text-cyan-400 hover:underline">Ver todas</Link>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-500 animate-pulse">Cargando tareas...</div>
                        ) : pendingTasks.length > 0 ? (
                            pendingTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="p-4 hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">{task.title}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" /> {task.due_date || 'Sin fecha'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> {task.comments_count || 0}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-slate-500 italic">No tienes tareas pendientes. ¡Buen trabajo! 🐙</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* My Projects */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-cyan-400" /> Mis Proyectos Asignados
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {myProjects.map(project => (
                            <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/50 transition-all group overflow-hidden">
                                <div className="p-5 flex justify-between items-center">
                                    <Link to={`/admin/projects/${project.id}`} className="flex-1">
                                        <h3 className="text-white font-bold mb-1 group-hover:text-cyan-400">{project.business_name}</h3>
                                        <p className="text-xs text-slate-500">{project.phase} • {project.status.toUpperCase()}</p>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setIsAddTaskModalOpen(true);
                                            }}
                                            className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all flex items-center gap-1.5"
                                            title="Nueva Tarea"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase hidden md:inline">Tarea</span>
                                        </button>
                                        <Link
                                            to={`/admin/projects/${project.id}`}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {isAddTaskModalOpen && selectedProject && (
                <AddTaskModal
                    project={selectedProject}
                    onClose={() => {
                        setIsAddTaskModalOpen(false);
                        setSelectedProject(null);
                    }}
                    onSuccess={() => {
                        fetchData();
                        setIsAddTaskModalOpen(false);
                        setSelectedProject(null);
                    }}
                />
            )}
        </div>
    );
};

export default ConsultantDashboard;
