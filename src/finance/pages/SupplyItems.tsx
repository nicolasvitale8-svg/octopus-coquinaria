
import React, { useState, useEffect } from 'react';
import { ProcurementService, SupplyItem } from '../services/procurementService';
import { formatCurrency } from '../utils/calculations';
import { Plus, Search, Archive, AlertCircle, Save, Upload, X, Check } from 'lucide-react';

export const SupplyItemsPage: React.FC = () => {
    const [items, setItems] = useState<SupplyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isImportMode, setIsImportMode] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState<Partial<SupplyItem>>({});

    // Import State
    const [importText, setImportText] = useState('');
    const [previewItems, setPreviewItems] = useState<Partial<SupplyItem>[]>([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await ProcurementService.getItems();
            setItems(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ProcurementService.saveItem(newItem);
            await loadData();
            setIsEditing(false);
            setNewItem({});
        } catch (e) {
            alert('Error al guardar');
        }
    };

    const parseImportText = () => {
        if (!importText) return;

        // Supone formato: Nombre | Unidad | Precio | Categoría (separado por TAB o coma)
        const lines = importText.split('\n');
        const parsed: Partial<SupplyItem>[] = [];

        lines.forEach(line => {
            if (!line.trim()) return;
            // Intenta separar por Tab o Coma
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');

            if (parts.length >= 2) {
                parsed.push({
                    name: parts[0]?.trim(),
                    unit: parts[1]?.trim() || 'Unid',
                    last_price: parseFloat(parts[2]?.trim() || '0'),
                    category: parts[3]?.trim() || 'General',
                });
            }
        });
        setPreviewItems(parsed);
    };

    const confirmImport = async () => {
        if (previewItems.length === 0) return;
        try {
            setLoading(true);
            await ProcurementService.bulkImportItems(previewItems);
            await loadData();
            setIsImportMode(false);
            setImportText('');
            setPreviewItems([]);
            alert(`Importados ${previewItems.length} ítems correctamente`);
        } catch (e) {
            console.error(e);
            alert('Error al importar ítems');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category && i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Base de Insumos</h1>
                    <p className="text-fin-muted font-bold uppercase tracking-widest text-xs mt-1">Gestión de recursos y precios vigentes</p>
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
                        className="bg-brand hover:bg-brand-hover text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2"
                    >
                        <Plus size={16} /> Nuevo Ítem
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-muted" size={20} />
                <input
                    type="text"
                    placeholder="Buscar insumo por nombre o categoría..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#050f1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-brand transition-all"
                />
            </div>

            {/* Modal de Importación */}
            {isImportMode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b1221] border border-white/10 w-full max-w-4xl h-[80vh] rounded-3xl p-8 shadow-2xl relative flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Upload size={24} className="text-brand" /> Importación Masiva
                            </h2>
                            <button onClick={() => setIsImportMode(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                            {/* Text Input Area */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-200">
                                    <p className="font-bold mb-1">INSTRUCCIONES:</p>
                                    <ol className="list-decimal pl-4 space-y-1">
                                        <li>Copia tus datos desde Excel (Ctrl+C).</li>
                                        <li>Pégalos en el cuadro de abajo (Ctrl+V).</li>
                                        <li>Asegúrate de que el orden sea: <b>Nombre | Unidad | Precio | Categoría</b></li>
                                    </ol>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-xs text-white resize-none outline-none focus:border-brand"
                                    placeholder={`Ejemplo:\nCarne Picada\tKg\t4500\tCarnes\nCebolla\tKg\t1200\tVerduras\n...`}
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                    onBlur={parseImportText}
                                />
                                <button onClick={parseImportText} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase text-xs">
                                    Previsualizar Datos
                                </button>
                            </div>

                            {/* Preview Area */}
                            <div className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <h3 className="font-bold text-white text-xs uppercase tracking-widest">Vista Previa ({previewItems.length} ítems)</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {previewItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-white/20 text-xs italic">
                                            Los datos procesados aparecerán aquí
                                        </div>
                                    ) : (
                                        previewItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-xs border border-white/5">
                                                <div className="font-bold text-white">{item.name}</div>
                                                <div className="text-fin-muted">{item.category} • {item.unit} • ${item.last_price}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 border-t border-white/5">
                                    <button
                                        disabled={previewItems.length === 0}
                                        onClick={confirmImport}
                                        className="w-full py-4 bg-brand hover:bg-brand-hover text-black rounded-xl font-black uppercase text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        <Save size={18} /> Confirmar Importación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edición (Single) */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b1221] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
                            {newItem.id ? 'Editar Insumo' : 'Nuevo Insumo'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Nombre del Insumo</label>
                                <input
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                    value={newItem.name || ''}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Unidad</label>
                                    <select
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                        value={newItem.unit || 'Kg'}
                                        onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option value="Kg">Kg</option>
                                        <option value="Lt">Lt</option>
                                        <option value="Un">Unidad</option>
                                        <option value="Pack">Pack</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Precio Actual</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                        value={newItem.last_price || ''}
                                        onChange={e => setNewItem({ ...newItem, last_price: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted ml-1">Categoría</label>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-brand outline-none"
                                    value={newItem.category || ''}
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    placeholder="Ej: Carnes, Verduras, Limpieza"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 font-bold uppercase text-xs">Cancelar</button>
                                <button type="submit" className="flex-1 bg-brand hover:bg-brand-hover text-black rounded-xl py-3 font-black uppercase text-xs tracking-widest">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grid de Ítems */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-[#050f1a] border border-white/10 rounded-2xl p-5 hover:border-brand/30 transition-all group relative">
                        <button
                            onClick={() => { setNewItem(item); setIsEditing(true); }}
                            className="absolute top-4 right-4 text-fin-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <AlertCircle size={18} />
                        </button>

                        <div className="flex justify-between items-start mb-2">
                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-fin-muted">
                                {item.category || 'General'}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand transition-colors">{item.name}</h3>

                        <div className="flex items-end justify-between mt-4 border-t border-white/5 pt-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Precio Referencia</div>
                                <div className="text-xl font-mono font-bold text-white">{formatCurrency(item.last_price)}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-white/50 bg-white/5 px-2 py-1 rounded-lg">x {item.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
