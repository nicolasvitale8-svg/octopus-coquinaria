import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Link as LinkIcon, MessageCircle, Copy, Check } from 'lucide-react';
import { Project } from '../../types';
import { useState } from 'react';

interface ProjectHeaderProps {
    project: Project;
    userRole?: string;
    onEdit: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, userRole, onEdit }) => {

    const StatusDot = ({ status }: { status: string }) => {
        const colors: any = { 'verde': 'bg-[var(--color-success)]', 'amarillo': 'bg-[var(--color-warning)]', 'rojo': 'bg-[var(--color-danger)]' };
        return <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-[var(--text-muted)]'} shadow-[0_0_10px_currentColor]`} />;
    };

    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/hub/projects/${project.id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const phone = project.team?.client_contacts?.[0]?.phone || '';
        const name = project.team?.client_contacts?.[0]?.name || project.team?.client_rep || 'Equipo';

        let url = 'https://wa.me/';
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            url += cleanPhone;
        }

        const message = encodeURIComponent(`Hola ${name}, te escribo de Cephalopod por el proyecto de consultoría de ${project.business_name}.`);
        url += `?text=${message}`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full">
                {userRole !== 'client' ? (
                    <Link to="/admin/projects" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 text-sm w-fit">
                        <ArrowLeft className="w-4 h-4" /> Volver a lista
                    </Link>
                ) : <div />}

                {/* Communication Quick Actions */}
                {userRole !== 'client' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-soft)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-[var(--border-subtle)] hover:border-[var(--color-primary)]/50"
                            title="Copiar enlace del Portal de Cliente"
                        >
                            {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <LinkIcon className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Portal Cliente'}</span>
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#25D366]/20 hover:border-[#25D366]/50"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] p-6 rounded-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-10"></div>

                <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                    <div className="w-16 h-16 bg-[#0F1416] rounded-md flex items-center justify-center text-3xl font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg flex-shrink-0">
                        {project.business_name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-[var(--text-primary)] font-space tracking-tight">{project.business_name}</h1>
                            {userRole !== 'client' && (
                                <button onClick={onEdit} className="text-[var(--text-muted)] hover:text-[var(--color-primary)] Transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3 text-sm text-[var(--text-muted)] mt-1">
                            <span>{project.main_service || 'Sin servicio'}</span>
                            <span className="text-slate-700">•</span>
                            <span className="text-[var(--color-primary)]">{project.lead_consultant || 'Sin Asignar'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 z-10">
                    <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1">Estado</p>
                        <div className="flex items-center gap-2 bg-[var(--bg-base)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                            <StatusDot status={project.status} />
                            <span className="text-sm font-bold capitalize text-[var(--text-secondary)]">{project.status}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1">Fase</p>
                        <span className="text-lg font-bold text-[var(--text-primary)]">{project.phase}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader;
