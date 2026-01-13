
import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { Insumo } from '../types';
import { Plus, Search, Upload, AlertCircle, Save, X } from 'lucide-react';

export const SupplyItemsPage: React.FC = () => {
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
        // Mock import for now or minimal bulk insert iteration
        try {
            for (const item of previewItems) {
                await procurementService.createInsumo(item);
            }
            await loadData();
            setIsImportMode(false);
            alert(`Importados ${previewItems.length} ítems`);
        } catch (e) {
            console.error(e);
            alert("Error importando");
        }
    };

    const filteredItems = items.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.categoria && i.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-8 text-white">Cargando Insumos...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Base de Insumos</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Gestión de recursos y precios vigentes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportMode(true)}
                        className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 border border-white/5"
                    >
                        <Upload size={16} /> Importar Masivo
                    </button>
                    <button
                        onClick={() => { setIsEditing(true); setNewItem({}); }}
                        className="bg-neon-blue hover:bg-blue-600 text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2"
                    >
                        <Plus size={16} /> Nuevo Ítem
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar insumo por nombre o categoría..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-neon-blue transition-all"
                />
            </div>

            {/* Modal de Importación (Simplificado UI) */}
            {isImportMode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-4xl h-[80vh] rounded-3xl p-8 shadow-2xl relative flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Upload size={24} className="text-neon-blue" /> Importación Masiva
                            </h2>
                            <button onClick={() => setIsImportMode(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            <textarea
                                className="flex-1 w-full bg-black/30 border border-gray-700 rounded-xl p-4 font-mono text-xs text-white resize-none outline-none focus:border-neon-blue"
                                placeholder={`Ejemplo:\nCarne Picada\tKg\t4500\tCarnes`}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                onBlur={parseImportText}
                            />
                            <div className="h-40 bg-black/20 overflow-y-auto p-4 rounded-xl border border-gray-800">
                                {previewItems.map((item, idx) => (
                                    <div key={idx} className="text-xs text-gray-400 border-b border-gray-800 py-1">
                                        {item.nombre} - {item.unidad_medida} - ${item.precio_ultimo}
                                    </div>
                                ))}
                            </div>
                            <button onClick={confirmImport} className="w-full py-4 bg-neon-blue text-black rounded-xl font-bold uppercase">
                                Confirmar Importación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
                            {newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                                <input
                                    required
                                    className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-neon-blue outline-none"
                                    value={newItem.nombre || ''}
                                    onChange={e => setNewItem({ ...newItem, nombre: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Unidad</label>
                                    <select
                                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-neon-blue outline-none"
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
                                    <label className="text-xs font-bold text-gray-500 uppercase">Precio</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/20 border border-gray-700 rounded-xl p-3 text-white font-bold focus:border-neon-blue outline-none"
                                        value={newItem.precio_ultimo || ''}
                                        onChange={e => setNewItem({ ...newItem, precio_ultimo: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-neon-blue hover:bg-blue-600 text-black rounded-xl py-3 font-bold uppercase">
                                Guardar
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} className="w-full text-gray-500 hover:text-white pt-2 text-sm">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-neon-blue/30 transition-all group relative">
                        <button
                            onClick={() => { setNewItem(item); setIsEditing(true); }}
                            className="absolute top-4 right-4 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <AlertCircle size={18} />
                        </button>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                            {item.categoria || 'General'}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-4 group-hover:text-neon-blue transition-colors">
                            {item.nombre}
                        </h3>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                            <div className="font-mono font-bold text-white text-xl">
                                ${item.precio_ultimo?.toLocaleString()}
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                x {item.unidad_medida}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
