import React from 'react';
import { Key, Users, MapPin, Target, ExternalLink, Clock } from 'lucide-react';
import { Project } from '../../types';

interface ProjectSystemsCardProps {
    project: Project;
}

const ProjectSystemsCard: React.FC<ProjectSystemsCardProps> = ({ project }) => {
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-emerald-400" /> Accesos y Sistemas
            </h2>

            <div className="space-y-3">
                {(!project.external_systems || project.external_systems.length === 0) && (
                    <p className="text-slate-500 italic text-sm">No hay sistemas vinculados.</p>
                )}

                {project.external_systems?.map((sys) => (
                    <div key={sys.id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-slate-800">
                                    {sys.type === 'POS' ? <Users className="w-4 h-4 text-emerald-400" /> :
                                        sys.type === 'Delivery' ? <MapPin className="w-4 h-4 text-orange-400" /> :
                                            <Target className="w-4 h-4 text-blue-400" />}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm leading-tight">{sys.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{sys.type}</p>
                                </div>
                            </div>
                            {sys.url && (
                                <a href={sys.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>

                        {/* Credentials */}
                        <div className="bg-slate-900 rounded p-2 text-xs flex flex-col gap-1.5 border border-slate-800/50">
                            {sys.username && (
                                <div className="flex justify-between items-center group/user">
                                    <span className="text-slate-600">Usuario:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-slate-300 font-mono select-all">{sys.username}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(sys.username || '')}
                                            className="opacity-0 group-hover/user:opacity-100 text-slate-500 hover:text-white transition-opacity"
                                            title="Copiar"
                                        >
                                            <Clock className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {sys.password && (
                                <div className="flex justify-between items-center group/pass">
                                    <span className="text-slate-600">Pass:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-emerald-400/80 font-mono tracking-widest blur-[3px] hover:blur-none transition-all cursor-pointer select-all">
                                            {sys.password}
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(sys.password || '')}
                                            className="opacity-0 group-hover/pass:opacity-100 text-slate-500 hover:text-white transition-opacity"
                                            title="Copiar Contraseña"
                                        >
                                            <Key className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {sys.notes && <p className="text-xs text-slate-600 mt-2 italic px-1">"{sys.notes}"</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectSystemsCard;
