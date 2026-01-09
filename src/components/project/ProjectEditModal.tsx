import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Mail, Phone, Plus, Trash, CheckCircle2 } from 'lucide-react';
import { Project, ProjectMilestone, ClientContact } from '../../types';
import { supabase } from '../../services/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SystemAccessManager from '../SystemAccessManager';

interface ProjectEditModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedProject: Project) => Promise<void>;
}

interface AvailableConsultant {
    id: string;
    full_name: string;
    role: string;
}

const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ project, isOpen, onClose, onSave }) => {
    const [editForm, setEditForm] = useState<Partial<Project>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [availableConsultants, setAvailableConsultants] = useState<AvailableConsultant[]>([]);
    const [selectedConsultants, setSelectedConsultants] = useState<string[]>([]);
    const [isLoadingConsultants, setIsLoadingConsultants] = useState(false);

    useEffect(() => {
        if (project && isOpen) {
            setEditForm({
                ...project,
                summary: { ...project.summary },
                team: {
                    ...project.team,
                    client_contacts: project.team?.client_contacts || []
                },
                milestones: project.milestones ? [...project.milestones] : [],
                external_systems: project.external_systems ? [...project.external_systems] : []
            });

            // Extract current member IDs (Favor project_members V4)
            const currentMembers = project.project_members || project.business_memberships || [];
            const currentMemberIds = currentMembers
                .filter(m => m.usuarios?.role !== 'client')
                .map(m => m.user_id);
            setSelectedConsultants(currentMemberIds);

            // Fetch all consultants
            fetchAvailableConsultants();
        }
    }, [project, isOpen]);

    const fetchAvailableConsultants = async () => {
        setIsLoadingConsultants(true);
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, full_name, role')
                .in('role', ['admin', 'consultant', 'manager']);

            if (data) setAvailableConsultants(data as AvailableConsultant[]);
        } catch (e) {
            console.error("Error fetching consultants:", e);
        } finally {
            setIsLoadingConsultants(false);
        }
    };

    const toggleConsultant = (id: string) => {
        setSelectedConsultants(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Sync Memberships in DB first (Simplified: Wipe and Re-add or Diff)
            // For safety and simplicity, we'll expose a specialized function or handle it here
            if (supabase) {
                // Delete existing non-client memberships for this project
                // (Client membership is usually handled separately or we need to be careful)
                // Let's just use the selected list. 
                // Caution: This is a destructive sync. 

                // Better approach: Identificar quién sobra y quién falta (V4)
                const currentMembers = project.project_members || project.business_memberships || [];
                const currentIds = currentMembers
                    .filter(m => m.usuarios?.role !== 'client')
                    .map(m => m.user_id);

                const toAdd = selectedConsultants.filter(id => !currentIds.includes(id));
                const toRemove = currentIds.filter(id => !selectedConsultants.includes(id));

                if (toRemove.length > 0) {
                    await supabase.from('project_members')
                        .delete()
                        .eq('project_id', project.id)
                        .in('user_id', toRemove);
                }

                if (toAdd.length > 0) {
                    const newRows = toAdd.map(uid => ({
                        project_id: project.id,
                        user_id: uid,
                        role_id: 'consultant' // Default role in V4 schema
                    }));
                    await supabase.from('project_members').insert(newRows);
                }
            }

            const updatedProject: Project = {
                ...project,
                ...editForm,
                summary: {
                    ...project.summary,
                    ...(editForm.summary || {})
                },
                external_systems: editForm.external_systems || [],
                team: {
                    ...project.team,
                    ...(editForm.team || {}),
                    client_contacts: (editForm.team?.client_contacts || project.team.client_contacts || [])
                        .filter(c => c.name.trim() !== '' || c.role.trim() !== '')
                },
                milestones: editForm.milestones || project.milestones || [],
                activity_log: project.activity_log
            };
            await onSave(updatedProject);
            onClose();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar cambios");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Helpers ---
    const addMilestone = () => {
        const newM: ProjectMilestone = { name: 'Nuevo Hito', date: new Date().toISOString().split('T')[0], status: 'pending' };
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
        setEditForm(prev => ({ ...prev, milestones: (prev.milestones || []).filter((_, i) => i !== index) }));
    };

    const addContact = () => {
        const newC: ClientContact = { name: '', role: '', email: '', phone: '', notes: '', is_team_member: false };
        setEditForm(prev => ({
            ...prev,
            team: {
                ...prev.team,
                client_contacts: [...(prev.team?.client_contacts || []), newC]
            }
        }));
    };

    const updateContact = (index: number, field: keyof ClientContact, value: any) => {
        setEditForm(prev => {
            const contacts = [...(prev.team?.client_contacts || [])];
            contacts[index] = { ...contacts[index], [field]: value };
            return { ...prev, team: { ...prev.team, client_contacts: contacts } };
        });
    };

    const removeContact = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            team: { ...prev.team, client_contacts: (prev.team?.client_contacts || []).filter((_, i) => i !== index) }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Editar Proyecto</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
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

                        {/* EQUIPO INTERNO (COLABORADORES) */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Colaboradores Octopus Asignados</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {isLoadingConsultants ? (
                                    <p className="text-xs text-slate-600 animate-pulse">Cargando equipo...</p>
                                ) : (
                                    availableConsultants.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => toggleConsultant(c.id)}
                                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${selectedConsultants.includes(c.id)
                                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 font-bold'
                                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedConsultants.includes(c.id) ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-800'}`} />
                                            <span className="truncate">{c.full_name}</span>
                                            {selectedConsultants.includes(c.id) && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* CONTACTOS DINÁMICOS */}
                        <div className="space-y-3 pt-4 border-t border-slate-800/50">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contactos en el Cliente</label>
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
                                        <div className="md:col-span-2 flex items-center gap-3 pt-1">
                                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    className="accent-emerald-500 w-4 h-4"
                                                    checked={c.is_team_member || false}
                                                    onChange={(e) => updateContact(i, 'is_team_member', e.target.checked)}
                                                />
                                                <span className="text-xs text-emerald-400 font-bold whitespace-nowrap flex gap-1">Es Octopus 🐙</span>
                                            </div>
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

                    <div className="space-y-4">
                        <SystemAccessManager
                            systems={editForm.external_systems || []}
                            onChange={(systems) => setEditForm({ ...editForm, external_systems: systems })}
                        />
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

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-b-xl flex justify-end gap-3 z-10">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectEditModal;
