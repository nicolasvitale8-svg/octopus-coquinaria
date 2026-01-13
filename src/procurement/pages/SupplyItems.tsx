
import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { Insumo } from '../types';
import { Plus, Search, Upload, AlertCircle, Save, X, ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../finance/utils/calculations';

export const SupplyItemsPage: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<Insumo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isImportMode, setIsImportMode] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState<Partial<Insumo>>({});

    // Import State
    const [importText, setImportText] = useState('');
    const [previewItems, setPreviewItems] = useState<Partial<Insumo>[]>([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await procurementService.getInsumos();
            setItems(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (newItem.id) {
                await procurementService.updateInsumo(newItem.id, newItem);
            } else {
                await procurementService.createInsumo(newItem);
            }
            await loadData();
            setIsEditing(false);
            setNewItem({});
        } catch (e) {
            alert('Error al guardar');
        }
    };

    const parseImportText = () => {
        if (!importText) return;

        // Supone formato: Nombre | Unidad | Precio | Categoría
        const lines = importText.split('\n');
        const parsed: Partial<Insumo>[] = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');

            if (parts.length >= 2) {
                parsed.push({
                    nombre: parts[0]?.trim(),
                    unidad_medida: (parts[1]?.trim() || 'Un') as any, // Cast loose
                    precio_ultimo: parseFloat(parts[2]?.trim() || '0'),
                    categoria: (parts[3]?.trim() || 'Varios') as any,
                });
            }
        });
        setPreviewItems(parsed);
    };

    const confirmImport = async () => {
        try {
            // Basic limit check to avoid freezing browser on massive copy paste
            if (previewItems.length > 500) {
                if (!confirm(`Vas a importar ${previewItems.length} ítems. Esto puede tardar unos segundos. ¿Continuar?`)) return;
            }

            for (const item of previewItems) {
                await procurementService.createInsumo(item);
            }
            await loadData();
            setIsImportMode(false);
            setImportText('');
            setPreviewItems([]);
        } catch (e) {
            console.error(e);
            alert("Error importando algunos ítems.");
        }
    };

    const filteredItems = items.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.categoria && i.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-white flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div></div>;

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {/* Header Improved */}
            <div className="flex flex-col gap-6">
                <div>
                    <button
                        onClick={() => navigate('/admin/procurement')}
                        className="flex items-center text-gray-400 hover:text-brand transition-colors mb-4 group"
                    >
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Volver al Dashboard
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-space flex items-center gap-3">
                                <Package className="text-brand" size={32} />
                                Base de Insumos
                            </h1>
                            <p className="text-fin-muted font-bold uppercase tracking-widest text-xs mt-2 pl-1">
                                Gestión de catálogo y precios vigentes
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportMode(true)}
                                className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 border border-white/5 transition-all hover:border-brand/30"
                            >
                                <Upload size={16} /> Importar Masivo
                            </button>
                            <button
                                onClick={() => { setIsEditing(true); setNewItem({}); }}
                                className="bg-brand hover:bg-brand-hover text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-all transform hover:-translate-y-1"
                            >
                                <Plus size={16} /> Nuevo Ítem
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar - Premium Look */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative flex items-center bg-[#050f1a] rounded-2xl">
                        <Search className="absolute left-4 text-gray-500 group-hover:text-brand transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar insumo por nombre, categoría o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-white font-bold outline-none placeholder-gray-600"
                        />
                    </div>
                </div>
            </div>

            {/* Modal de Importación (Premium Dark UI) */}
            {isImportMode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0b1221] border border-white/10 w-full max-w-5xl h-[85vh] rounded-3xl p-8 shadow-2xl relative flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <Upload size={24} className="text-brand" /> Importación Masiva
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Copia y pega desde Excel</p>
                            </div>
                            <button onClick={() => setIsImportMode(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
                            {/* Input Section */}
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand">1. Pegar Datos (Sin Cabeceras)</label>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-200 mb-2">
                                    Format: <b>Nombre</b> | <b>Unidad</b> | <b>Precio</b> | <b>Categoría</b>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-black/30 border border-gray-700 rounded-xl p-4 font-mono text-xs text-gray-300 resize-none outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                    placeholder={`Pan Brioche\tUn\t450\tPanificados\nCarne Picada\tKg\t5000\tCarnes...`}
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                    onBlur={parseImportText}
                                />
                                <button
                                    onClick={parseImportText}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-xs border border-white/5 transition-all"
                                >
                                    Procesar Texto
                                </button>
                            </div>

                            {/* Preview Section */}
                            <div className="flex-1 flex flex-col gap-2 border-l border-white/5 pl-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand">2. Vista Previa ({previewItems.length})</label>
                                <div className="flex-1 bg-black/20 overflow-y-auto p-2 rounded-xl border border-gray-800 custom-scrollbar">
                                    {previewItems.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
                                            <Upload size={32} />
                                            <span className="text-xs">Esperando datos...</span>
                                        </div>
                                    )}
                                    {previewItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 mb-2 bg-[#050f1a] rounded-lg border border-white/5 hover:border-brand/30 transition-colors group">
                                            <div>
                                                <div className="font-bold text-white text-sm">{item.nombre}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{item.categoria}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-brand font-bold">${item.precio_ultimo}</div>
                                                <div className="text-[10px] text-gray-500">{item.unidad_medida}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={confirmImport}
                                    disabled={previewItems.length === 0}
                                    className="w-full py-4 bg-brand hover:bg-brand-hover disabled:bg-gray-800 disabled:text-gray-600 text-black rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-brand/20 transition-all transform active:scale-95"
                                >
                                    Confirmar Importación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#0b1221] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight font-space">
                            {newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Nombre del Producto</label>
                                <input
                                    required
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none transition-colors"
                                    value={newItem.nombre || ''}
                                    onChange={e => setNewItem({ ...newItem, nombre: e.target.value })}
                                    placeholder="Ej. Ojo de Bife"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Unidad</label>
                                    <select
                                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none transition-colors appearance-none"
                                        value={newItem.unidad_medida || 'Kg'}
                                        onChange={e => setNewItem({ ...newItem, unidad_medida: e.target.value as any })}
                                    >
                                        <option value="Kg">Kg</option>
                                        <option value="Lt">Lt</option>
                                        <option value="Un">Unidad</option>
                                        <option value="Paquete">Paquete</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Precio Actual</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 pl-6 text-white font-bold focus:border-brand outline-none transition-colors"
                                            value={newItem.precio_ultimo || ''}
                                            onChange={e => setNewItem({ ...newItem, precio_ultimo: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1 mb-1 block">Categoría</label>
                                <input
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-brand outline-none transition-colors"
                                    value={newItem.categoria || ''}
                                    onChange={e => setNewItem({ ...newItem, categoria: e.target.value as any })}
                                    placeholder="Ej. Carnes"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 font-bold uppercase text-xs">Cancelar</button>
                                <button type="submit" className="flex-1 bg-brand hover:bg-brand-hover text-black rounded-xl py-3 font-black uppercase text-xs tracking-widest shadow-lg shadow-brand/20">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grid Items - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-[#050f1a] border border-white/5 rounded-2xl p-5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-brand/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-brand/10 transition-colors"></div>

                        <button
                            onClick={() => { setNewItem(item); setIsEditing(true); }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/50 p-1 rounded-lg backdrop-blur-sm"
                        >
                            <AlertCircle size={18} />
                        </button>

                        <div className="relative z-0">
                            <div className="inline-block px-2 py-1 bg-white/5 rounded-md mb-2 border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-fin-muted group-hover:text-white transition-colors">
                                    {item.categoria || 'GENERAL'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-4 group-hover:text-brand transition-colors line-clamp-2 h-14">
                                {item.nombre}
                            </h3>

                            <div className="flex justify-between items-end pt-4 border-t border-white/5 mt-auto">
                                <div>
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">Precio Ref.</div>
                                    <div className="font-mono font-bold text-white text-xl">
                                        {formatCurrency(item.precio_ultimo || 0)}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-gray-400 bg-black/30 px-2 py-1 rounded border border-white/5">
                                    {item.unidad_medida}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && !loading && (
                <div className="text-center py-20 opacity-50">
                    <Package size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-xl font-bold text-gray-500">No se encontraron insumos</p>
                    <p className="text-sm text-gray-600">Intenta importar masivamente o crear uno nuevo</p>
                </div>
            )}
        </div>
    );
};
