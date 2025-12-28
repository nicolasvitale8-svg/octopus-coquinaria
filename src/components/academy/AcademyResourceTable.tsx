import React from 'react';
import { Video, FileSpreadsheet, FileText, Lock, ExternalLink, Trash2 } from 'lucide-react';
import { Resource } from '../../services/academyService';

interface AcademyResourceTableProps {
    resources: Resource[];
    isLoading: boolean;
    onDelete: (id: string) => void;
}

const AcademyResourceTable: React.FC<AcademyResourceTableProps> = ({ resources, isLoading, onDelete }) => {

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'video': return <Video className="w-5 h-5 text-red-400" />;
            case 'plantilla': return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
            default: return <FileText className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Título / Descripción</th>
                            <th className="px-6 py-4">Acceso</th>
                            <th className="px-6 py-4">Enlace</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Cargando recursos...</td></tr>
                        ) : resources.length > 0 ? (
                            resources.map((resource) => (
                                <tr key={resource.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="bg-slate-800 p-2 rounded-lg inline-block">
                                            {getIcon(resource.tipo)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-base">{resource.titulo}</div>
                                        <div className="text-slate-500 text-xs truncate max-w-xs">{resource.descripcion || 'Sin descripción'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {resource.es_premium ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                                <Lock className="w-3 h-3 mr-1" /> Premium
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                                                Gratuito
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={resource.url} target="_blank" rel="noreferrer" className="text-[#1FB6D5] hover:text-white flex items-center gap-1 text-xs">
                                            Ver enlace <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onDelete(resource.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay recursos cargados aún.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AcademyResourceTable;
