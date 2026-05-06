import React from 'react';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import { Project } from '../../types';
import ProjectMembersModal from './ProjectMembersModal';

interface ProjectTeamCardProps {
    project: Project;
    onUpdate: () => void;
}

const ProjectTeamCard: React.FC<ProjectTeamCardProps> = ({ project, onUpdate }) => {
    const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);

    return (
        <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-6 shadow-lg flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--color-primary)]" /> Equipo y Roles
                </h2>
                <button
                    onClick={() => setIsMembersModalOpen(true)}
                    className="text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-soft)] uppercase tracking-widest bg-[var(--color-primary)]/10 px-2 py-1 rounded border border-[var(--color-primary)]/20 transition-all"
                >
                    Gestionar
                </button>
            </div>
            <div className="space-y-4 flex-grow">
                <div className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-lg border border-[var(--border-subtle)]">
                    <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-tight">Consultor Líder</p>
                        <p className="text-[var(--text-primary)] font-bold">{project.lead_consultant || 'Sin asignar'}</p>
                    </div>
                    <div className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-[var(--color-primary)]/30">Líder</div>
                </div>

                {/* V4 Team Members */}
                {(project.project_members || project.business_memberships) && (
                    <div className="space-y-2 pt-2">
                        <p className="text-[10px] text-[var(--color-primary)] uppercase font-bold tracking-wider flex items-center gap-1">
                            Equipo Cephalopod
                        </p>
                        {(project.project_members || project.business_memberships || [])
                            .filter((m: any) => m.usuarios?.role !== 'client') // Omit customers from team list
                            .map((m, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-base)]/50 border border-[var(--border-subtle)]/50 rounded-lg hover:border-[var(--border-subtle)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                                            {m.usuarios?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-[var(--text-primary)] text-sm font-medium">{m.usuarios?.full_name || 'Sin nombre'}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{m.role_id || m.usuarios?.role}</span>
                                                {(m.specialties && m.specialties.length > 0) && (
                                                    <span className="w-1 h-1 bg-[var(--bg-surface-soft)] rounded-full" />
                                                )}
                                                <div className="flex gap-1">
                                                    {m.specialties?.map((s: string) => (
                                                        <span key={s} className="text-[8px] text-[var(--color-primary)]/70">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <a href={`mailto:${m.usuarios?.email}`} className="text-[var(--text-muted)] hover:text-[var(--color-primary)]">
                                            <Mail className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    {/* Responsable Principal + Map Link */}
                    <div className="mb-4">
                        <h3 className="text-xs text-[var(--text-muted)] uppercase font-bold mb-3">Responsable en el Cliente</h3>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)]">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[var(--text-primary)] font-medium">{project.team?.client_rep || 'Sin asignar'}</p>
                                <p className="text-[var(--text-muted)] text-xs">Principal punto de contacto</p>
                            </div>
                        </div>
                        {project.team?.client_location && (
                            <a href={project.team.client_location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] text-[var(--text-muted)] text-sm border border-slate-900 hover:border-[var(--border-subtle)] transition w-full">
                                <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                                <span className="truncate">Ver Ubicación</span>
                            </a>
                        )}
                        {project.team?.client_email && (
                            <a href={`mailto:${project.team.client_email}`} className="flex items-center gap-2 p-2 rounded bg-[var(--bg-base)] text-[var(--text-muted)] text-sm border border-slate-900 mt-2 hover:bg-[var(--bg-surface)] transition-colors">
                                <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                                <span className="truncate">{project.team.client_email}</span>
                            </a>
                        )}
                    </div>

                    {/* Assistant List (Detailed) */}
                    {Array.isArray(project.team?.client_contacts) && project.team.client_contacts.length > 0 && (
                        <div>
                            <h3 className="text-xs text-[var(--text-muted)] uppercase font-bold mb-3">Equipo (Contactos)</h3>
                            <div className="space-y-2">
                                {project.team.client_contacts.map((c, i) => (
                                    <div key={i} className="p-2 bg-[var(--bg-base)] rounded border border-slate-900 hover:border-[var(--border-subtle)]">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[var(--text-secondary)] font-bold text-sm">{c.name || 'Sin nombre'}</p>
                                            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 border ${c.is_team_member ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20' : 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-transparent'}`}>
                                                {c.role || 'Rol'}
                                                {c.is_team_member && <span title="Equipo Cephalopod">🐙</span>}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex gap-3 text-xs text-[var(--text-muted)]">
                                            {c.phone && (
                                                <a
                                                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <Phone className="w-3 h-3" /> {c.phone}
                                                </a>
                                            )}
                                            {c.email && (
                                                <a
                                                    href={`mailto:${c.email}`}
                                                    className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                                                    title="Enviar Correo"
                                                >
                                                    <Mail className="w-3 h-3" /> {c.email}
                                                </a>
                                            )}
                                        </div>
                                        {c.notes && <p className="text-xs text-[var(--text-muted)] mt-1 italic">"{c.notes}"</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ProjectMembersModal
                project={project}
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                onUpdate={onUpdate}
            />
        </div>
    );
};

export default ProjectTeamCard;
