import React from 'react';
import { MessageSquare, Clock, Calendar } from 'lucide-react';
import { Project, ProjectActivity } from '../../types';

interface ProjectActivityCardProps {
    project: Project;
}

const ProjectActivityCard: React.FC<ProjectActivityCardProps> = ({ project }) => {
    return (
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
    );
};

export default ProjectActivityCard;
