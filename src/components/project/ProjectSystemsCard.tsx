import React from 'react';
import { Key, Users, MapPin, Target, ExternalLink, Clock } from 'lucide-react';
import { Project } from '../../types';

interface ProjectSystemsCardProps {
    project: Project;
}

const ProjectSystemsCard: React.FC<ProjectSystemsCardProps> = ({ project }) => {
    return (
        <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-6 shadow-lg flex flex-col md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-[var(--color-success)]" /> Accesos y Sistemas
            </h2>

            <div className="space-y-3">
                {(!project.external_systems || project.external_systems.length === 0) && (
                    <p className="text-[var(--text-muted)] italic text-sm">No hay sistemas vinculados.</p>
                )}

                {project.external_systems?.map((sys) => (
                    <div key={sys.id} className="bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-lg p-4 hover:border-[var(--border-subtle)] transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-[var(--bg-base)] flex items-center justify-center border border-[var(--border-subtle)]">
                                    {sys.type === 'POS' ? <Users className="w-4 h-4 text-[var(--color-success)]" /> :
                                        sys.type === 'Delivery' ? <MapPin className="w-4 h-4 text-[var(--color-warning)]" /> :
                                            <Target className="w-4 h-4 text-[var(--color-primary)]" />}
                                </div>
                                <div>
                                    <p className="text-[var(--text-primary)] font-bold text-sm leading-tight">{sys.name}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{sys.type}</p>
                                </div>
                            </div>
                            {sys.url && (
                                <a href={sys.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>

                        {/* Credentials */}
                        <div className="bg-[var(--bg-base)] rounded p-2 text-xs flex flex-col gap-1.5 border border-[var(--border-subtle)]/50">
                            {sys.username && (
                                <div className="flex justify-between items-center group/user">
                                    <span className="text-[var(--text-muted)]">Usuario:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[var(--text-secondary)] font-mono select-all">{sys.username}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(sys.username || '')}
                                            className="opacity-0 group-hover/user:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity"
                                            title="Copiar"
                                        >
                                            <Clock className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {sys.password && (
                                <div className="flex justify-between items-center group/pass">
                                    <span className="text-[var(--text-muted)]">Pass:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-[var(--color-success)]/80 font-mono tracking-widest blur-[3px] hover:blur-none transition-all cursor-pointer select-all">
                                            {sys.password}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(sys.password || '')}
                                            className="opacity-0 group-hover/pass:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity"
                                            title="Copiar Contraseña"
                                        >
                                            <Key className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {sys.notes && <p className="text-xs text-[var(--text-muted)] mt-2 italic px-1">"{sys.notes}"</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectSystemsCard;
