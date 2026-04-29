import React from 'react';
import { Video, FileSpreadsheet, FileText, Lock, ExternalLink, Trash2, Zap, Layout as LayoutIcon, Edit, ClipboardList } from 'lucide-react';
import { AcademyResource } from '../../types';

interface AcademyResourceTableProps {
    resources: AcademyResource[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    onEdit: (resource: AcademyResource) => void;
}

const AcademyResourceTable: React.FC<AcademyResourceTableProps> = ({ resources, isLoading, onDelete, onEdit }) => {

    const getIcon = (format: string) => {
        switch (format) {
            case 'VIDEO': return <Video className="w-5 h-5 text-[var(--color-danger)]" />;
            case 'TEMPLATE': return <FileSpreadsheet className="w-5 h-5 text-[var(--color-success)]" />;
            case 'TIP': return <Zap className="w-5 h-5 text-[var(--color-warning)]" />;
            case 'FORM': return <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />;
            default: return <FileText className="w-5 h-5 text-[var(--color-primary)]" />;
        }
    };

    return (
        <div className="bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg-base)] text-[var(--text-muted)] uppercase tracking-wider font-bold text-xs font-display">
                        <tr>
                            <th className="px-4 py-5 w-16">Fmt</th>
                            <th className="px-4 py-5">Título / Outcome</th>
                            <th className="px-4 py-5 whitespace-nowrap">Categoría</th>
                            <th className="px-4 py-5 whitespace-nowrap">Impacto</th>
                            <th className="px-4 py-5 whitespace-nowrap">Nivel</th>
                            <th className="px-4 py-5 whitespace-nowrap">Acceso</th>
                            <th className="px-4 py-5 text-right whitespace-nowrap">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">Cargando recursos...</td></tr>
                        ) : resources.length > 0 ? (
                            resources.map((resource) => (
                                <tr key={resource.id} className="hover:bg-[var(--bg-base)]/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="bg-[var(--bg-base)] p-2 rounded-md inline-block">
                                            {getIcon(resource.format)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-md">
                                        <div className="font-bold text-[var(--text-primary)] text-sm">{resource.title}</div>
                                        <div className="text-[var(--color-primary)] text-[10px] font-bold uppercase italic mt-1 break-words whitespace-normal">{resource.outcome || 'Sin outcome'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{resource.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold bg-[var(--bg-base)] px-2 py-1 rounded text-[var(--text-muted)] border border-[var(--border-subtle)]">{resource.impactTag}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-[var(--text-muted)]">Lev {resource.level}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {resource.access === 'PRO' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold bg-[rgba(255,177,42,0.10)] text-[var(--color-warning)] border border-[rgba(255,177,42,0.40)]">
                                                <Lock className="w-3 h-3 mr-1" /> PRO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] font-bold bg-[rgba(0,197,125,0.10)] text-[var(--color-success)] border border-[rgba(0,197,125,0.40)]">
                                                FREE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {resource.downloadUrl && (
                                                <a href={resource.downloadUrl} target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors p-2">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => onEdit(resource)}
                                                className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors p-2"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(resource.id)}
                                                className="text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors p-2"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)] italic">No hay recursos cargados aún.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcademyResourceTable;
