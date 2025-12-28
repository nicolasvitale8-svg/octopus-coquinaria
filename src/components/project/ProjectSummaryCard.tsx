import React from 'react';
import { ExternalLink, MessageSquare, Target, Activity } from 'lucide-react';
import Button from '../ui/Button';
import { Project } from '../../types';

interface ProjectSummaryCardProps {
    project: Project;
}

const ProjectSummaryCard: React.FC<ProjectSummaryCardProps> = ({ project }) => {
    return (
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
    );
};

export default ProjectSummaryCard;
