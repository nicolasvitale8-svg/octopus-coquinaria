import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    BookOpen,
    Video,
    FileText,
    FileSpreadsheet,
    Plus,
    Trash2,
    ExternalLink,
    Lock,
    Search,
    X
} from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingOverlay from '../components/ui/LoadingOverlay';

import { getResources, createResource, deleteResource, Resource } from '../services/academyService';

const AdminAcademy = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'video' as 'video' | 'plantilla' | 'guia',
        url: '',
        descripcion: '',
        es_premium: false,
        topics: [] as string[]
    });

    const fetchResources = async () => {
        // 1. Load Local Fast
        const { getLocalResources } = await import('../services/academyService');
        const local = getLocalResources();
        if (local.length > 0) {
            setResources(local);
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        // 2. Load Remote Background
        const data = await getResources();
        setResources(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessingAction('Guardando Recurso...');

        await createResource({
            ...formData,
            topics: formData.topics
        });

        // Refresh List (Local update is handled inside service, but we reload here to be sure)
        fetchResources();

        setProcessingAction(null);
        setIsModalOpen(false);
        setFormData({
            titulo: '',
            tipo: 'video',
            url: '',
            descripcion: '',
            es_premium: false,
            topics: []
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este recurso?')) return;
        await deleteResource(id);
        fetchResources();
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'video': return <Video className="w-5 h-5 text-red-400" />;
            case 'plantilla': return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
            default: return <FileText className="w-5 h-5 text-blue-400" />;
        }
    };

    const filteredResources = resources.filter(r =>
        r.titulo.toLowerCase().includes(search.toLowerCase()) ||
        r.tipo.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-[#1FB6D5]" />
                        Academia Octopus
                    </h1>
                    <p className="text-slate-400 text-sm">Biblioteca de recursos educativos para tus clientes.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-[#1FB6D5] text-[#021019] font-bold hover:bg-white flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Recurso
                </Button>
            </div>

            {/* Content */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center">
                    <Search className="w-5 h-5 text-slate-500 mr-3" />
                    <input
                        type="text"
                        placeholder="Buscar recursos..."
                        className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

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
                            ) : filteredResources.length > 0 ? (
                                filteredResources.map((resource) => (
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
                                                onClick={() => handleDelete(resource.id)}
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">Nuevo Recurso</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                    placeholder="Ej: Plantilla de Costos 2024"
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                                    >
                                        <option value="video">Desafío (Video)</option>
                                        <option value="plantilla">Herramienta (Excel)</option>
                                        <option value="guia">Documento (PDF/Guía)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL del Recurso</label>
                                    <input
                                        type="url"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none placeholder-slate-600"
                                        placeholder="https://..."
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción corta</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-[#1FB6D5] focus:outline-none h-20 resize-none"
                                    placeholder="¿De qué trata este recurso?"
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="premium"
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                                    checked={formData.es_premium}
                                    onChange={e => setFormData({ ...formData, es_premium: e.target.checked })}
                                />
                                <label htmlFor="premium" className="text-sm text-white cursor-pointer select-none">
                                    Marcar como contenido <strong>Premium</strong> (solo clientes)
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Rubros / Categorías</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['finanzas', 'operaciones', 'equipo', 'marketing', 'tecnologia', 'cliente'].map((topic) => (
                                        <label key={topic} className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-800 cursor-pointer hover:border-slate-600">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-700 bg-slate-900 text-[#1FB6D5] focus:ring-[#1FB6D5]"
                                                checked={formData.topics?.includes(topic) || false}
                                                onChange={(e) => {
                                                    const currentTopics = formData.topics || [];
                                                    const newTopics = e.target.checked
                                                        ? [...currentTopics, topic]
                                                        : currentTopics.filter(t => t !== topic);
                                                    setFormData({ ...formData, topics: newTopics });
                                                }}
                                            />
                                            <span className="text-sm text-slate-300 capitalize">{topic}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-[#1FB6D5] text-[#021019] font-bold hover:bg-white">
                                    Guardar Recurso
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <LoadingOverlay isVisible={!!processingAction} text={processingAction || ''} />
        </div>
    );
};

export default AdminAcademy;
