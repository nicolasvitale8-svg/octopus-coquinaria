import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Calendar, User, Shield, Plus } from 'lucide-react';
import { Project, ProjectTask, TaskType, TaskPriority, TaskVisibility } from '../../types';
import { taskService } from '../../services/taskService';
import { memberService } from '../../services/memberService';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AddTaskModalProps {
    project: Project;
    onClose: () => void;
    onSuccess: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ project, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<TaskType>('INTERNAL');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [visibility, setVisibility] = useState<TaskVisibility>('SHARED');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
    }, [project.id]);

    const fetchMembers = async () => {
        setIsLoadingMembers(true);
        try {
            // 1. Obtener miembros específicos del proyecto
            const projectMembers = await memberService.getProjectMembers(project.id);

            // 2. Obtener colaboradores globales (Admins y Consultores) como respaldo
            const globalAdmins = await memberService.getGlobalCollaborators();

            // 3. Unificar y Deduplicar (por ID de usuario)
            const map = new Map();

            // Primero metemos a los globales
            globalAdmins.forEach(u => {
                map.set(u.id, {
                    user_id: u.id,
                    full_name: u.full_name,
                    role_name: 'Consultor/Admin'
                });
            });

            // Luego los del proyecto (sobreescriben si hay duplicados, con info más específica)
            projectMembers.forEach(m => {
                if (m.usuarios) {
                    map.set(m.user_id, {
                        user_id: m.user_id,
                        full_name: m.usuarios.full_name,
                        role_name: m.roles?.name || 'Miembro'
                    });
                }
            });

            setMembers(Array.from(map.values()));
        } catch (err) {
            console.error("Error combined members:", err);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const newTask = await taskService.createTask({
                project_id: project.id,
                title,
                description,
                type,
                priority,
                visibility,
                due_date: dueDate || undefined,
                assigned_to: assignedTo || undefined,
                status: 'TODO'
            });

            if (newTask) {
                onSuccess();
                onClose();
            } else {
                setError('No se pudo crear la tarea. Verifica tus permisos.');
            }
        } catch (err) {
            console.error("Error creating task:", err);
            setError('Error de conexión con el servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-cyan-400" /> Nueva Tarea
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">Proyecto: {project.business_name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-shake">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <Input
                        label="Título de la tarea"
                        placeholder="Ej: Revisar costos de materia prima"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción (Opcional)</label>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none transition-all resize-none min-h-[80px]"
                            placeholder="Detalles adicionales..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                            >
                                <option value="INTERNAL">Interna (Equipo)</option>
                                <option value="CLIENT">Para el Cliente</option>
                                <option value="APPROVAL">Aprobación</option>
                                <option value="REQUEST">Pedido de Info</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prioridad</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <User className="w-3 h-3 text-cyan-400" /> Asignar a
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                                disabled={isLoadingMembers}
                            >
                                <option value="">Sin asignar (Libre)</option>
                                {members.map(m => (
                                    <option key={m.user_id} value={m.user_id}>
                                        {m.full_name} ({m.role_name})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-purple-400" /> Fecha Límite
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500 h-[42px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-indigo-400" /> Visibilidad
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-cyan-500"
                            >
                                <option value="SHARED">Compartido (Equipo + Cliente)</option>
                                <option value="INTERNAL_ONLY">Solo Equipo Interno</option>
                                <option value="CLIENT_ONLY">Solo para el Cliente</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? 'Creando...' : 'Crear Tarea'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
