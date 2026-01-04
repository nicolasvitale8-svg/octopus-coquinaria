import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    User as UserIcon,
    Paperclip,
    MessageSquare,
    Trash2
} from 'lucide-react';
import { Project, ProjectTask, TaskStatus, TaskPriority, TaskType } from '../../types';
import { taskService } from '../../services/taskService';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import AddTaskModal from './AddTaskModal';

interface ProjectTasksProps {
    project: Project;
}

const ProjectTasks: React.FC<ProjectTasksProps> = ({ project }) => {
    const { profile, isAdmin } = useAuth();
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [project.id]);

    const fetchTasks = async () => {
        setIsLoading(true);
        const data = await taskService.getTasksByProject(project.id);
        setTasks(data);
        setIsLoading(false);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('¿Eliminar esta tarea definitivamente?')) return;
        const success = await taskService.deleteTask(taskId);
        if (success) {
            fetchTasks();
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(filter.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'DONE':
            case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'DOING': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case 'BLOCKED':
            case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'IN_REVIEW':
            case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-800 border-slate-700';
        }
    };

    const getPriorityIcon = (priority: TaskPriority) => {
        switch (priority) {
            case 'urgent': return <AlertCircle className="w-3 h-3 text-red-500" />;
            case 'high': return <Clock className="w-3 h-3 text-orange-500" />;
            default: return <Clock className="w-3 h-3 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar tareas..."
                        className="bg-transparent border-none focus:ring-0 text-sm text-white w-full"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">Todos los estados</option>
                        <option value="TODO">Pendiente</option>
                        <option value="DOING">En curso</option>
                        <option value="DONE">Hecho</option>
                        <option value="BLOCKED">Bloqueado</option>
                    </select>
                    <Button size="sm" onClick={() => setIsAddTaskModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Nueva Tarea
                    </Button>
                </div>
            </div>

            {isAddTaskModalOpen && (
                <AddTaskModal
                    project={project}
                    onClose={() => setIsAddTaskModalOpen(false)}
                    onSuccess={fetchTasks}
                />
            )}

            {/* Task List / Kanban View (Simplificada para MVP) */}
            <div className="grid grid-cols-1 gap-3">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-500 animate-pulse">Cargando tareas...</div>
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <button className="mt-1 text-slate-600 hover:text-emerald-400 transition-colors">
                                    <CheckCircle2 className={`w-5 h-5 ${task.status === 'DONE' ? 'text-emerald-500' : ''}`} />
                                </button>
                                <div>
                                    <h4 className="text-white font-medium text-sm mb-1">{task.title}</h4>
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                                        <span className={`px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {getPriorityIcon(task.priority)} {task.priority}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {task.due_date || 'Sin fecha'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded bg-slate-950 border border-slate-800`}>
                                            {task.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                                <div className="flex items-center gap-4 text-slate-500">
                                    {task.attachments && task.attachments.length > 0 && (
                                        <span className="flex items-center gap-1 text-xs">
                                            <Paperclip className="w-3.5 h-3.5" /> {task.attachments.length}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-xs">
                                        <MessageSquare className="w-3.5 h-3.5" /> {task.comments_count || 0}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-cyan-400" title="Asignado a...">
                                            {task.assigned_to ? 'U' : <UserIcon className="w-3 h-3" />}
                                        </div>
                                    </div>
                                    <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {(isAdmin || profile?.role === 'admin') && (
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Eliminar Tarea"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 italic">No se encontraron tareas para este filtro.</p>
                        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStatusFilter('ALL')}>
                            Ver todas
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTasks;
