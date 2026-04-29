import React from 'react';
import { PieChart, Clock, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import { Project, ProjectMilestone } from '../../types';

interface ProjectMilestonesCardProps {
    project: Project;
}

const ProjectMilestonesCard: React.FC<ProjectMilestonesCardProps> = ({ project }) => {
    return (
        <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-6 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[var(--color-primary)]" /> Roadmap
                </h2>
                <Button size="sm" variant="ghost" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <ExternalLink className="w-3 h-3 mr-2" /> Google Calendar
                </Button>
            </div>

            <div className="space-y-0 relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-[var(--bg-surface)] z-0"></div>

                {Array.isArray(project.milestones) && project.milestones.map((m: ProjectMilestone, i: number) => (
                    <div key={i} className="relative z-10 flex gap-4 pb-6 last:pb-0 items-start group">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 ${m.status === 'done' ? 'bg-[var(--color-success)] text-slate-900' :
                            m.status === 'in_progress' ? 'bg-[var(--color-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                            }`}>
                            {m.status === 'done' ? <CheckCircle className="w-5 h-5" /> :
                                m.status === 'in_progress' ? <Clock className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
                        </div>
                        <div className="flex-grow pt-1">
                            <div className="flex justify-between items-start">
                                <h3 className={`font-bold ${m.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>{m.name}</h3>
                                <span className="text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] px-2 py-0.5 rounded bg-[var(--bg-base)]">
                                    {m.date}
                                </span>
                            </div>
                            {m.note && <p className="text-sm text-[var(--text-muted)] mt-1 bg-[var(--bg-surface)]/30 p-2 rounded">{m.note}</p>}
                        </div>
                    </div>
                ))}
                {(!Array.isArray(project.milestones) || project.milestones.length === 0) && (
                    <p className="text-[var(--text-muted)] italic text-sm pl-14">Sin hitos definidos.</p>
                )}
            </div>
        </div>
    );
};

export default ProjectMilestonesCard;
