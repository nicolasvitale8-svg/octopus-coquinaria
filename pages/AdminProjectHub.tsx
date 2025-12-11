import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getProjectById, updateProject } from '../services/projectService';
import { Project, ProjectMilestone, ProjectActivity, ClientContact } from '../types';
import { ArrowLeft, ExternalLink, Calendar, CheckCircle, Circle, Clock, MessageSquare, PieChart, Users, Target, Activity, Edit2, X, Save, MapPin, Phone, Trash, Mail, User, Briefcase, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const AdminProjectHub = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Project>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) fetchProject(id);
    }, [id]);

    const fetchProject = async (projectId: string) => {
        setIsLoading(true);
        const data = await getProjectById(projectId);
        setProject(data);
        setIsLoading(false);
    };

    const handleEditClick = () => {
        if (!project) return;
        // Ensure arrays are initialized
        setEditForm({
            ...project,
            summary: { ...project.summary },
            team: {
                ...project.team,
                client_contacts: project.team?.client_contacts || [] // Ensure array with safe access
            },
            milestones: project.milestones ? [...project.milestones] : []
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!project || !id) return;
        setIsSaving(true);

        try {
            // Merge carefully to match Project type
            const updatedProject: Project = {
                ...project,
                ...editForm,
                // Ensure nested objects are merged correctly
                summary: {
                    ...project.summary,
                    ...(editForm.summary || {})
                },
                team: {
                    ...project.team,
                    ...(editForm.team || {}),
                    ...(editForm.team || {}),
                    // Explicitly handle client_contacts AND filter out empties to prevent "ghost" slots
                    client_contacts: (editForm.team?.client_contacts || project.team.client_contacts || [])
                        .filter(c => c.name.trim() !== '' || c.role.trim() !== '') // Only keep if it has content
                },
                milestones: editForm.milestones || project.milestones || [],
                // Ensure other potential undefined arrays are handled if they exist in editForm
                activity_log: project.activity_log
            };

            console.log("Saving project payload:", updatedProject);
            const result = await updateProject(updatedProject);

            if (result) {
                setProject(result);
                setIsEditModalOpen(false);
                console.log("Save successful");
            } else {
                throw new Error("La operación de guardado no retornó el proyecto actualizado.");
            }
        } catch (error: any) {
            console.error("Save error details:", error);
            const errorMsg = error.message || JSON.stringify(error) || 'Error desconocido';
            alert(`Error al guardar: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Helpers for Milestones ---
    const addMilestone = () => {
        const newM: ProjectMilestone = { name: 'Nuevo Hito', date: '2025-01-01', status: 'pending' };
        setEditForm(prev => ({ ...prev, milestones: [...(prev.milestones || []), newM] }));
    };

    const updateMilestone = (index: number, field: keyof ProjectMilestone, value: string) => {
        setEditForm(prev => {
            const ms = [...(prev.milestones || [])];
            ms[index] = { ...ms[index], [field]: value };
            return { ...prev, milestones: ms };
        });
    };

    const removeMilestone = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            milestones: (prev.milestones || []).filter((_, i) => i !== index)
        }));
    };

    // --- Helpers for Client Contacts ---
    const addContact = () => {
        const newC: ClientContact = { name: '', role: '', email: '', phone: '', notes: '' };
        setEditForm(prev => ({
            ...prev,
            team: {
                ...prev.team,
                client_contacts: [...(prev.team?.client_contacts || []), newC]
            }
        }));
    };

    const updateContact = (index: number, field: keyof ClientContact, value: string) => {
        setEditForm(prev => {
            const contacts = [...(prev.team?.client_contacts || [])];
            contacts[index] = { ...contacts[index], [field]: value };
            return {
                ...prev,
                team: { ...prev.team, client_contacts: contacts }
            };
        });
    };

    const removeContact = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            team: {
                ...prev.team,
                client_contacts: (prev.team?.client_contacts || []).filter((_, i) => i !== index)
            }
        }));
    };


    if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando Hub...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Proyecto no encontrado.</div>;

    const StatusDot = ({ status }: { status: string }) => {
        const colors: any = { 'verde': 'bg-green-500', 'amarillo': 'bg-yellow-500', 'rojo': 'bg-red-500' };
        return <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-slate-500'} shadow-[0_0_10px_currentColor]`} />;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link to="/admin/projects" className="text-slate-500 hover:text-white flex items-center gap-2 text-sm w-fit">
                    <ArrowLeft className="w-4 h-4" /> Volver a lista
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>

                    <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                        <div className="w-16 h-16 bg-[#00344F] rounded-xl flex items-center justify-center text-3xl font-bold text-[#1FB6D5] border border-[#1FB6D5]/30 shadow-lg flex-shrink-0">
                            {project.business_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white font-space tracking-tight">{project.business_name}</h1>
                                <button onClick={handleEditClick} className="text-slate-500 hover:text-cyan-400 Transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-3 text-sm text-slate-400 mt-1">
                                <span>{project.main_service || 'Sin servicio'}</span>
                                <span className="text-slate-700">•</span>
                                <span className="text-cyan-400">{project.lead_consultant || 'Sin Asignar'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 z-10">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Estado</p>
                            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                <StatusDot status={project.status} />
                                <span className="text-sm font-bold capitalize text-slate-200">{project.status}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Fase</p>
                            <span className="text-lg font-bold text-white">{project.phase}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BLOQUE 1: RESUMEN (Objective, Pillars, Notion) */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-cyan-400" /> Resumen Estratégico
                        </h2>
                        {project.notion_url && (
                            <a href={project.notion_url} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:border-white hover:text-white">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Notion
                                </Button>
                            </a>
                        )}
                        {project.chatgpt_url && (
                            <a href={project.chatgpt_url} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-400">
                                    <MessageSquare className="w-3 h-3 mr-2" /> Chat GPT
                                </Button>
                            </a>
                        )}
                        {project.drive_url && (
                            <a href={project.drive_url} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400">
                                    <ExternalLink className="w-3 h-3 mr-2" /> Drive
                                </Button>
                            </a>
                        )}
                    </div>

                    <div className="space-y-6 flex-grow">
                        <div>
                            <h3 className="text-xs text-slate-500 uppercase font-bold mb-2">Objetivo Principal</h3>
                            <p className="text-slate-200 text-lg leading-relaxed">
                                {project.summary?.objective || "Sin objetivo definido."}
                            </p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/50">
                            <h3 className="text-xs text-red-400 uppercase font-bold mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Problema Central
                            </h3>
                            <p className="text-slate-400 italic">"{project.summary?.problem || '...'}"</p>
                        </div>

                        <div>
                            {/* Pillars */}
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(project.summary?.pillars) && project.summary.pillars.map((p, i) => (
                                    <span key={i} className="px-3 py-1 bg-[#00344F] text-[#1FB6D5] text-xs font-bold rounded-full border border-[#1FB6D5]/20">
                                        {p}
                                    </span>
                                ))}
                                {(!Array.isArray(project.summary?.pillars) || project.summary.pillars.length === 0) && (
                                    <span className="text-slate-600 text-sm">Sin pilares.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: EQUIPO (Roles) */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col h-full">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-indigo-400" /> Equipo y Roles
                    </h2>
                    <div className="space-y-4 flex-grow">
                        <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div>
                                <p className="text-xs text-slate-500">Consultor Líder</p>
                                <p className="text-white font-bold">{project.lead_consultant || 'Sin asignar'}</p>
                            </div>
                            <div className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-bold">Líder</div>
                        </div>

                        {Array.isArray(project.team?.consultants) && project.team.consultants.map((c, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-800/30 rounded-lg transition-colors border-b border-transparent hover:border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500">Consultor</p>
                                    <p className="text-slate-300">{c}</p>
                                </div>
                            </div>
                        ))}

                        <div className="mt-4 pt-4 border-t border-slate-800">
                            {/* Responsable Principal + Map Link */}
                            <div className="mb-4">
                                <h3 className="text-xs text-slate-500 uppercase font-bold mb-3">Responsable en el Cliente</h3>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{project.team?.client_rep || 'Sin asignar'}</p>
                                        <p className="text-slate-500 text-xs">Principal punto de contacto</p>
                                    </div>
                                </div>
                                {project.team?.client_location && (
                                    <a href={project.team.client_location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 text-sm border border-slate-900 hover:border-slate-700 transition w-full">
                                        <MapPin className="w-4 h-4 text-cyan-500" />
                                        <span className="truncate">Ver Ubicación</span>
                                    </a>
                                )}
                                {project.team?.client_email && (
                                    <a href={`mailto:${project.team.client_email}`} className="flex items-center gap-2 p-2 rounded bg-slate-950 text-slate-400 text-sm border border-slate-900 mt-2 hover:bg-slate-800 transition-colors">
                                        <Mail className="w-4 h-4 text-cyan-500" />
                                        <span className="truncate">{project.team.client_email}</span>
                                    </a>
                                )}
                            </div>

                            {/* Assistant List (Detailed) */}
                            {Array.isArray(project.team?.client_contacts) && project.team.client_contacts.length > 0 && (
                                <div>
                                    <h3 className="text-xs text-slate-500 uppercase font-bold mb-3">Equipo (Contactos)</h3>
                                    <div className="space-y-2">
                                        {project.team.client_contacts.map((c, i) => (
                                            <div key={i} className="p-2 bg-slate-950 rounded border border-slate-900 hover:border-slate-700">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-slate-300 font-bold text-sm">{c.name || 'Sin nombre'}</p>
                                                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{c.role || 'Rol'}</span>
                                                </div>
                                                <div className="mt-1 flex gap-3 text-xs text-slate-500">
                                                    {c.phone && (
                                                        <a
                                                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                                            title="Abrir WhatsApp"
                                                        >
                                                            <Phone className="w-3 h-3" /> {c.phone}
                                                        </a>
                                                    )}
                                                    {c.email && (
                                                        <a
                                                            href={`mailto:${c.email}`}
                                                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                                            title="Enviar Correo"
                                                        >
                                                            <Mail className="w-3 h-3" /> {c.email}
                                                        </a>
                                                    )}
                                                </div>
                                                {c.notes && <p className="text-xs text-slate-600 mt-1 italic">"{c.notes}"</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BLOQUE 3: PLAN DE ACCIÓN (Milestones) */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-purple-400" /> Roadmap
                        </h2>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <ExternalLink className="w-3 h-3 mr-2" /> Google Calendar
                        </Button>
                    </div>

                    <div className="space-y-0 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-800 z-0"></div>

                        {Array.isArray(project.milestones) && project.milestones.map((m: ProjectMilestone, i: number) => (
                            <div key={i} className="relative z-10 flex gap-4 pb-6 last:pb-0 items-start group">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 ${m.status === 'done' ? 'bg-green-500 text-slate-900' :
                                    m.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {m.status === 'done' ? <CheckCircle className="w-5 h-5" /> :
                                        m.status === 'in_progress' ? <Clock className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
                                </div>
                                <div className="flex-grow pt-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${m.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>{m.name}</h3>
                                        <span className="text-xs font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded bg-slate-950">
                                            {m.date}
                                        </span>
                                    </div>
                                    {m.note && <p className="text-sm text-slate-500 mt-1 bg-slate-800/30 p-2 rounded">{m.note}</p>}
                                </div>
                            </div>
                        ))}
                        {(!Array.isArray(project.milestones) || project.milestones.length === 0) && (
                            <p className="text-slate-500 italic text-sm pl-14">Sin hitos definidos.</p>
                        )}
                    </div>
                </div>

                {/* BLOQUE 4: ACTIVIDAD Y PRÓXIMA ACCIÓN */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <MessageSquare className="w-5 h-5 text-orange-400" /> Próxima Acción & Actividad
                    </h2>

                    {/* Next Action Highlight */}
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 relative overflow-hidden">
                        <div className="flex items-start gap-3 relative z-10">
                            <Clock className="w-5 h-5 text-orange-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-orange-300 font-bold uppercase mb-1">Lo que sigue</p>
                                <p className="text-white font-bold text-lg mb-1">{project.next_action || 'Sin acciones pendientes'}</p>
                                <p className="text-sm text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> para el {project.next_action_date || '...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        <h3 className="text-xs text-slate-500 font-bold uppercase mb-2">Historial Reciente</h3>
                        {Array.isArray(project.activity_log) && project.activity_log.map((act: ProjectActivity, i) => (
                            <div key={i} className="flex gap-3 items-start text-sm">
                                <span className="text-slate-500 font-mono text-xs w-10 pt-0.5 flex-shrink-0">{act.date}</span>
                                <div>
                                    <p className="text-slate-300">{act.text}</p>
                                    <p className="text-slate-600 text-xs mt-0.5">{act.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">Editar Proyecto</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                            {/* SECCIÓN 1: DATOS GLOBALES */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase border-b border-slate-800 pb-2">Información General</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre del Negocio"
                                        value={editForm.business_name}
                                        onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                    />
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                        >
                                            <option value="verde">Verde (OK)</option>
                                            <option value="amarillo">Amarillo (Alerta)</option>
                                            <option value="rojo">Rojo (Crítico)</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Servicio Principal"
                                        value={editForm.main_service || ''}
                                        onChange={(e) => setEditForm({ ...editForm, main_service: e.target.value })}
                                    />
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fase</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none"
                                            value={editForm.phase}
                                            onChange={(e) => setEditForm({ ...editForm, phase: e.target.value as any })}
                                        >
                                            <option value="Lead">Lead</option>
                                            <option value="Onboarding">Onboarding</option>
                                            <option value="Diagnóstico">Diagnóstico</option>
                                            <option value="Implementación">Implementación</option>
                                            <option value="Seguimiento">Seguimiento</option>
                                            <option value="Cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: DATOS DEL CLIENTE Y EQ */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase border-b border-slate-800 pb-2">Equipo y Cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Consultor Líder"
                                        value={editForm.lead_consultant || ''}
                                        onChange={(e) => setEditForm({ ...editForm, lead_consultant: e.target.value })}
                                    />
                                    <Input
                                        label="Responsable (Cliente)"
                                        value={editForm.team?.client_rep || ''}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            team: { ...editForm.team, client_rep: e.target.value }
                                        })}
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Link Maps (Ubicación)"
                                            placeholder="https://maps.google.com/..."
                                            value={editForm.team?.client_location || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                team: { ...editForm.team, client_location: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Link Drive (Archivos)"
                                            placeholder="https://drive.google.com/..."
                                            value={editForm.drive_url || ''}
                                            onChange={(e) => setEditForm({ ...editForm, drive_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Link Notion (Gestión)"
                                            placeholder="https://notion.so/..."
                                            value={editForm.notion_url || ''}
                                            onChange={(e) => setEditForm({ ...editForm, notion_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Link Chat GPT (Contexto)"
                                            placeholder="https://chatgpt.com/..."
                                            value={editForm.chatgpt_url || ''}
                                            onChange={(e) => setEditForm({ ...editForm, chatgpt_url: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Email Principal (Contacto)"
                                            placeholder="cliente@email.com"
                                            value={editForm.team?.client_email || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                team: { ...editForm.team, client_email: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>

                                {/* CONTACTOS DINÁMICOS */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contactos / Asistentes</label>
                                        <Button size="sm" variant="outline" onClick={addContact} className="text-xs py-1 h-auto">
                                            <Plus className="w-3 h-3 mr-1" /> Agregar
                                        </Button>
                                    </div>

                                    {(!Array.isArray(editForm.team?.client_contacts) || editForm.team!.client_contacts!.length === 0) && (
                                        <p className="text-slate-600 text-xs italic">No hay contactos adicionales registrados.</p>
                                    )}

                                    {Array.isArray(editForm.team?.client_contacts) && editForm.team.client_contacts.map((c, i) => (
                                        <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-lg relative group">
                                            <button onClick={() => removeContact(i)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-6">
                                                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                    <input
                                                        className="bg-transparent outline-none text-slate-200 text-sm w-full placeholder-slate-600"
                                                        placeholder="Nombre"
                                                        value={c.name}
                                                        onChange={(e) => updateContact(i, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                                                    <Briefcase className="w-4 h-4 text-slate-500" />
                                                    <input
                                                        className="bg-transparent outline-none text-slate-200 text-sm w-full placeholder-slate-600"
                                                        placeholder="Puesto / Rol"
                                                        value={c.role}
                                                        onChange={(e) => updateContact(i, 'role', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                                                    <Mail className="w-4 h-4 text-slate-500" />
                                                    <input
                                                        className="bg-transparent outline-none text-slate-200 text-sm w-full placeholder-slate-600"
                                                        placeholder="Email"
                                                        value={c.email}
                                                        onChange={(e) => updateContact(i, 'email', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                                                    <Phone className="w-4 h-4 text-slate-500" />
                                                    <input
                                                        className="bg-transparent outline-none text-slate-200 text-sm w-full placeholder-slate-600"
                                                        placeholder="Teléfono"
                                                        value={c.phone}
                                                        onChange={(e) => updateContact(i, 'phone', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                                                    <input
                                                        className="bg-transparent outline-none text-slate-400 text-xs w-full italic placeholder-slate-700"
                                                        placeholder="Observaciones adicionales..."
                                                        value={c.notes || ''}
                                                        onChange={(e) => updateContact(i, 'notes', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECCIÓN 3: ESTRATEGIA (Próx Acción) */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase border-b border-slate-800 pb-2">Estrategia y Próximos Pasos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Próxima Acción (Lo que sigue)"
                                        placeholder="Ej: Enviar reporte..."
                                        value={editForm.next_action || ''}
                                        onChange={(e) => setEditForm({ ...editForm, next_action: e.target.value })}
                                    />
                                    <Input
                                        label="Fecha Próx. Acción"
                                        type="date"
                                        value={editForm.next_action_date || ''}
                                        onChange={(e) => setEditForm({ ...editForm, next_action_date: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Objetivo Principal</label>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 text-sm outline-none min-h-[80px]"
                                            value={editForm.summary?.objective || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                summary: { ...editForm.summary, objective: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Problema Central</label>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 text-sm outline-none min-h-[80px]"
                                            value={editForm.summary?.problem || ''}
                                            onChange={(e) => setEditForm({
                                                ...editForm,
                                                summary: { ...editForm.summary, problem: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 4: ROADMAP / HITOS */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase">Roadmap (Hitos)</h3>
                                    <Button size="sm" variant="outline" onClick={addMilestone}>+ Agregar Hito</Button>
                                </div>

                                {Array.isArray(editForm.milestones) && editForm.milestones.map((m, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-slate-950 p-3 rounded-lg border border-slate-800">
                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <input
                                                className="bg-transparent text-white text-sm border-b border-slate-700 outline-none p-1"
                                                value={m.name}
                                                onChange={(e) => updateMilestone(i, 'name', e.target.value)}
                                                placeholder="Nombre del Hito"
                                            />
                                            <input
                                                type="date"
                                                className="bg-transparent text-slate-400 text-sm border-b border-slate-700 outline-none p-1"
                                                value={m.date}
                                                onChange={(e) => updateMilestone(i, 'date', e.target.value)}
                                            />
                                            <select
                                                className="bg-slate-900 text-slate-300 text-sm border border-slate-700 rounded p-1 outline-none"
                                                value={m.status}
                                                onChange={(e) => updateMilestone(i, 'status', e.target.value)}
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="in_progress">En Curso</option>
                                                <option value="done">Completado</option>
                                            </select>
                                        </div>
                                        <button onClick={() => removeMilestone(i)} className="text-red-500 hover:text-red-400 p-1">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveEdit} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
