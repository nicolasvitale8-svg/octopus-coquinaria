import React from 'react';
import { Video, FileSpreadsheet, FileText, Lock, ExternalLink, Trash2, Zap, Edit, ClipboardList } from 'lucide-react';
import { AcademyResource } from '../../types';

/**
 * AcademyResourceTable — tabla HUD para /admin/academy.
 * Estética CEPHALOPOD: marcos rectos, esquinas con brackets, tokens phosphor,
 * monospace en datos, doc-code en header, divisores subtle.
 */

interface AcademyResourceTableProps {
    resources: AcademyResource[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    onEdit: (resource: AcademyResource) => void;
}

const AcademyResourceTable: React.FC<AcademyResourceTableProps> = ({ resources, isLoading, onDelete, onEdit }) => {

    const getIcon = (format: string) => {
        switch (format) {
            case 'VIDEO': return <Video className="w-4 h-4 text-[var(--color-danger)]" strokeWidth={1.75} />;
            case 'TEMPLATE': return <FileSpreadsheet className="w-4 h-4 text-[var(--color-success)]" strokeWidth={1.75} />;
            case 'TIP': return <Zap className="w-4 h-4 text-[var(--color-warning)]" strokeWidth={1.75} />;
            case 'FORM': return <ClipboardList className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.75} />;
            default: return <FileText className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={1.75} />;
        }
    };

    return (
        <div
            className="relative border overflow-hidden"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
            {/* Brackets HUD */}
            <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-l border-t z-10" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b z-10" style={{ borderColor: 'var(--color-primary)' }} />

            {/* Doc-code stripe */}
            <div
                className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] border-b flex items-center justify-between"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
                <span>— CPD-ADM-ACA-TBL-001</span>
                <span style={{ color: 'var(--color-primary)' }}>{isLoading ? 'CARGANDO…' : `${resources.length} REGISTROS`}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <th className="px-4 py-3 w-16">FMT</th>
                            <th className="px-4 py-3">TÍTULO / OUTCOME</th>
                            <th className="px-4 py-3 whitespace-nowrap">CATEGORÍA</th>
                            <th className="px-4 py-3 whitespace-nowrap">IMPACTO</th>
                            <th className="px-4 py-3 whitespace-nowrap">NIVEL</th>
                            <th className="px-4 py-3 whitespace-nowrap">ACCESO</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
                                    [ CARGANDO RECURSOS ]
                                </td>
                            </tr>
                        ) : resources.length > 0 ? (
                            resources.map((resource) => (
                                <tr
                                    key={resource.id}
                                    className="transition-colors hover:bg-[var(--bg-base)]/60"
                                    style={{ borderColor: 'var(--border-subtle)' }}
                                >
                                    <td className="px-4 py-4">
                                        <div
                                            className="inline-flex items-center justify-center w-9 h-9 border"
                                            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                                        >
                                            {getIcon(resource.format)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-md">
                                        <div className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {resource.title}
                                        </div>
                                        <div
                                            className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] mt-1 break-words whitespace-normal"
                                            style={{ color: 'var(--color-primary)' }}
                                        >
                                            › {resource.outcome || 'Sin outcome'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-secondary)' }}>
                                            {resource.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span
                                            className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 border"
                                            style={{
                                                background: 'var(--bg-base)',
                                                borderColor: 'var(--border-subtle)',
                                                color: 'var(--text-muted)'
                                            }}
                                        >
                                            {resource.impactTag}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                            LV·{resource.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {resource.access === 'PRO' ? (
                                            <span className="inline-flex items-center px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] border bg-[rgba(255,177,42,0.10)] text-[var(--color-warning)] border-[rgba(255,177,42,0.40)]">
                                                <Lock className="w-3 h-3 mr-1" strokeWidth={2} /> PRO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] border bg-[rgba(0,255,157,0.08)] text-[var(--color-primary)] border-[rgba(0,255,157,0.40)]">
                                                FREE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            {resource.downloadUrl && (
                                                <a
                                                    href={resource.downloadUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 transition-colors hover:text-[var(--color-primary)]"
                                                    style={{ color: 'var(--text-muted)' }}
                                                    title="Abrir URL"
                                                >
                                                    <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => onEdit(resource)}
                                                className="p-2 transition-colors hover:text-[var(--color-primary)]"
                                                style={{ color: 'var(--text-muted)' }}
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" strokeWidth={1.75} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(resource.id)}
                                                className="p-2 transition-colors hover:text-[var(--color-danger)]"
                                                style={{ color: 'var(--text-muted)' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center font-mono text-[11px] uppercase tracking-[0.22em] italic" style={{ color: 'var(--text-muted)' }}>
                                    [ SIN RECURSOS · CARGAR EL PRIMERO ]
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcademyResourceTable;
