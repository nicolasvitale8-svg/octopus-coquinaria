import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Project } from '../../types';

interface ProjectHeaderProps {
    project: Project;
    userRole?: string;
    onEdit: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, userRole, onEdit }) => {

    const StatusDot = ({ status }: { status: string }) => {
        const colors: any = { 'verde': 'bg-green-500', 'amarillo': 'bg-yellow-500', 'rojo': 'bg-red-500' };
        return <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-slate-500'} shadow-[0_0_10px_currentColor]`} />;
    };

    return (
        <div className="flex flex-col gap-4">
            {userRole !== 'client' && (
                <Link to="/admin/projects" className="text-slate-500 hover:text-white flex items-center gap-2 text-sm w-fit">
                    <ArrowLeft className="w-4 h-4" /> Volver a lista
                </Link>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>

                <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                    <div className="w-16 h-16 bg-[#00344F] rounded-xl flex items-center justify-center text-3xl font-bold text-[#1FB6D5] border border-[#1FB6D5]/30 shadow-lg flex-shrink-0">
                        {project.business_name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white font-space tracking-tight">{project.business_name}</h1>
                            {userRole !== 'client' && (
                                <button onClick={onEdit} className="text-slate-500 hover:text-cyan-400 Transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
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
    );
};

export default ProjectHeader;
