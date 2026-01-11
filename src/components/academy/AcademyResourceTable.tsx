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
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'TEMPLATE': return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
            case 'TIP': return <Zap className="w-5 h-5 text-amber-500" />;
            case 'FORM': return <ClipboardList className="w-5 h-5 text-blue-400" />;
            default: return <FileText className="w-5 h-5 text-[#1FB6D5]" />;
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider font-bold text-xs font-space">
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
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Cargando recursos...</td></tr>
                        ) : resources.length > 0 ? (
                            resources.map((resource) => (
                                <tr key={resource.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="bg-slate-800 p-2 rounded-lg inline-block">
                                            {getIcon(resource.format)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 max-w-md">
                                        <div className="font-bold text-white text-sm">{resource.title}</div>
                                        <div className="text-[#1FB6D5] text-[10px] font-bold uppercase italic mt-1 break-words whitespace-normal">{resource.outcome || 'Sin outcome'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-300 uppercase">{resource.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-500 border border-slate-700">{resource.impactTag}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-400">Lev {resource.level}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {resource.access === 'PRO' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                <Lock className="w-3 h-3 mr-1" /> PRO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                                FREE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {resource.downloadUrl && (
                                                <a href={resource.downloadUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#1FB6D5] transition-colors p-2">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => onEdit(resource)}
                                                className="text-slate-500 hover:text-[#1FB6D5] transition-colors p-2"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(resource.id)}
                                                className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">No hay recursos cargados aún.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcademyResourceTable;
