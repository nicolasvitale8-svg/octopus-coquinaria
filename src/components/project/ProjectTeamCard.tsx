import React from 'react';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import { Project } from '../../types';

interface ProjectTeamCardProps {
    project: Project;
}

const ProjectTeamCard: React.FC<ProjectTeamCardProps> = ({ project }) => {
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-indigo-400" /> Equipo y Roles
            </h2>
            <div className="space-y-4 flex-grow">
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Consultor Líder</p>
                        <p className="text-white font-bold">{project.lead_consultant || 'Sin asignar'}</p>
                    </div>
                    <div className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-cyan-500/30">Líder</div>
                </div>

                {/* Real Team Members from DB */}
                {project.business_memberships && project.business_memberships.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Colaboradores Asignados</p>
                        {project.business_memberships
                            .filter(m => m.usuarios?.role !== 'client') // Omit customers from team list
                            .map((m, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800/50 rounded-lg hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                                            {m.usuarios?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{m.usuarios?.full_name || 'Sin nombre'}</p>
                                            <p className="text-[10px] text-slate-500">{m.usuarios?.job_title || m.usuarios?.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <a href={`mailto:${m.usuarios?.email}`} className="text-slate-500 hover:text-cyan-400">
                                            <Mail className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

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
                                            <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 border ${c.is_team_member ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-transparent'}`}>
                                                {c.role || 'Rol'}
                                                {c.is_team_member && <span title="Equipo Octopus">🐙</span>}
                                            </span>
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
    );
};

export default ProjectTeamCard;
