import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { NewsBoardItem, NewsBoardItemType } from '../types';
import {
    Plus, Search, Edit2, Trash2, Eye, EyeOff,
    ExternalLink, Calendar, ChevronRight, Filter,
    Megaphone, Clock, CheckCircle, AlertCircle,
    Zap, MessageCircle, Instagram, Youtube, LayoutDashboard, GraduationCap, Calendar as CalendarIcon
} from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { WHATSAPP_NUMBER, INSTAGRAM_URL, YOUTUBE_URL } from '../constants';

const AdminBoard = () => {
    const [items, setItems] = useState<NewsBoardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<NewsBoardItem> | null>(null);

    // URL Presets
    const URL_PRESETS = [
        { label: 'WhatsApp', icon: <MessageCircle size={14} />, cta: 'Hablar por WhatsApp', url: `https://wa.me/${WHATSAPP_NUMBER}` },
        { label: 'Instagram', icon: <Instagram size={14} />, cta: 'Ver Instagram', url: INSTAGRAM_URL },
        { label: 'YouTube', icon: <Youtube size={14} />, cta: 'Ver Video', url: YOUTUBE_URL },
        { label: 'Diagnóstico', icon: <Zap size={14} />, cta: 'Hacer Diagnóstico', url: '/quick-diagnostic' },
        { label: 'Academia', icon: <GraduationCap size={14} />, cta: 'Ver Academia', url: '/resources' },
        { label: 'Calendario', icon: <CalendarIcon size={14} />, cta: 'Ver Calendario', url: '/calendar' },
        { label: 'Metodología', icon: <LayoutDashboard size={14} />, cta: 'Ver 7 Pilares', url: '/methodology' },
    ];

    const applyPreset = (preset: typeof URL_PRESETS[0]) => {
        setEditingItem(prev => ({
            ...prev,
            cta_label: preset.cta,
            cta_url: preset.url
        }));
    };

    const fetchItems = async () => {
        if (!supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('public_board_items')
            .select('*')
            .order('priority', { ascending: true })
            .order('start_date', { ascending: false });

        if (data) setItems(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (id: string) => {
        if (!supabase || !confirm('¿Seguro que deseas eliminar este item?')) return;
        setProcessingAction('Eliminando...');
        try {
            const { error } = await supabase.from('public_board_items').delete().eq('id', id);
            if (error) throw error;
            fetchItems();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        } finally {
            setProcessingAction(null);
        }
    };

    const handleToggleVisibility = async (item: NewsBoardItem) => {
        if (!supabase) return;
        setProcessingAction('Actualizando...');
        try {
            const { error } = await supabase
                .from('public_board_items')
                .update({ is_visible: !item.is_visible })
                .eq('id', item.id);
            if (error) throw error;
            fetchItems();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setProcessingAction('Guardando...');
        try {
            if (editingItem?.id) {
                const { error } = await supabase
                    .from('public_board_items')
                    .update(editingItem)
                    .eq('id', editingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('public_board_items')
                    .insert([editingItem]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchItems();
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setProcessingAction(null);
        }
    };

    const getItemStatus = (item: NewsBoardItem) => {
        const now = new Date().toISOString().split('T')[0];
        if (!item.is_visible) return { label: 'Oculto', color: 'text-slate-500', icon: <EyeOff size={12} /> };
        if (now < item.start_date) return { label: 'Programado', color: 'text-blue-400', icon: <Clock size={12} /> };
        if (now > item.end_date) return { label: 'Vencido', color: 'text-red-400', icon: <AlertCircle size={12} /> };
        return { label: 'Activo', color: 'text-emerald-400', icon: <CheckCircle size={12} /> };
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.summary.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'ALL' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Megaphone className="text-[#1FB6D5]" /> Pizarra de Novedades
                    </h1>
                    <p className="text-slate-400 text-sm">Gestiona los comunicados públicos de la Home.</p>
                </div>
                <Button onClick={() => { setEditingItem({ type: 'TIP', priority: 2, is_visible: true, start_date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                    <Plus size={18} className="mr-2" /> Nueva Novedad
                </Button>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                {/* Filters */}
                <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por título o contenido..."
                            className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-[#1FB6D5]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#1FB6D5]"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="ALL">Todos los tipos</option>
                            <option value="TIP">Tips</option>
                            <option value="DESCUENTO">Descuentos</option>
                            <option value="NOVEDAD_APP">Novedades App</option>
                            <option value="RADAR">Radar</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#0b1120] text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Prioridad</th>
                                <th className="px-6 py-4">Vigencia</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500">Cargando pizarra...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-500">No se encontraron items.</td></tr>
                            ) : filteredItems.map((item) => {
                                const status = getItemStatus(item);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'TIP' ? 'bg-yellow-400/10 text-yellow-400' :
                                                        item.type === 'DESCUENTO' ? 'bg-green-400/10 text-green-400' :
                                                            item.type === 'NOVEDAD_APP' ? 'bg-[#1FB6D5]/10 text-[#1FB6D5]' : 'bg-purple-400/10 text-purple-400'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className="font-bold text-white group-hover:text-[#1FB6D5] transition-colors">{item.title}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 line-clamp-1">{item.summary}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800 text-xs font-medium ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`w-6 h-6 inline-flex items-center justify-center rounded text-[10px] font-bold ${item.priority === 1 ? 'bg-red-500 text-white' :
                                                item.priority === 2 ? 'bg-[#1FB6D5] text-slate-900' : 'bg-slate-700 text-slate-300'
                                                }`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-[11px] text-slate-500 font-mono">
                                                <span>Desde: {item.start_date}</span>
                                                <span>Hasta: {item.end_date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleToggleVisibility(item)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded transition-all">
                                                    {item.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">{editingItem?.id ? 'Editar Novedad' : 'Nueva Novedad'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título (Máx 80)</label>
                                <input
                                    required
                                    maxLength={80}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                    value={editingItem?.title || ''}
                                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                    <select
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.type || 'TIP'}
                                        onChange={e => setEditingItem({ ...editingItem, type: e.target.value as NewsBoardItemType })}
                                    >
                                        <option value="TIP">TIP</option>
                                        <option value="DESCUENTO">DESCUENTO</option>
                                        <option value="NOVEDAD_APP">NOVEDAD APP</option>
                                        <option value="RADAR">RADAR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad (1=Alta)</label>
                                    <select
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.priority || 2}
                                        onChange={e => setEditingItem({ ...editingItem, priority: parseInt(e.target.value) as 1 | 2 | 3 })}
                                    >
                                        <option value={1}>1 - Alta</option>
                                        <option value={2}>2 - Media</option>
                                        <option value={3}>3 - Baja</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resumen (Máx 200)</label>
                                <textarea
                                    required
                                    maxLength={200}
                                    rows={3}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg text-white text-sm"
                                    value={editingItem?.summary || ''}
                                    onChange={e => setEditingItem({ ...editingItem, summary: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inicia</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.start_date || ''}
                                        onChange={e => setEditingItem({ ...editingItem, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vence</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.end_date || ''}
                                        onChange={e => setEditingItem({ ...editingItem, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Etiqueta Botón</label>
                                    <input
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.cta_label || ''}
                                        placeholder="Ej: Ver más"
                                        onChange={e => setEditingItem({ ...editingItem, cta_label: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Botón</label>
                                    <input
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                        value={editingItem?.cta_url || ''}
                                        placeholder="/academy o https://..."
                                        onChange={e => setEditingItem({ ...editingItem, cta_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tag (Opcional)</label>
                                <input
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg text-white"
                                    value={editingItem?.tag || ''}
                                    placeholder="Ej: Verano"
                                    onChange={e => setEditingItem({ ...editingItem, tag: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-[#1FB6D5] text-[#021019] font-bold">Guardar Cambios</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <LoadingOverlay isVisible={!!processingAction} text={processingAction || ''} />
        </div>
    );
};

export default AdminBoard;
