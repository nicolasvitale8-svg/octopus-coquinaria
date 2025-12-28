import React, { useState } from 'react';
import { ExternalSystemAccess } from '../types';
import { Plus, Trash2, Eye, EyeOff, Copy, Globe, Terminal, Server, ShoppingBag, Shield } from 'lucide-react';

interface Props {
    systems: ExternalSystemAccess[];
    onChange: (systems: ExternalSystemAccess[]) => void;
}

const SYSTEM_TYPES = [
    { value: 'POS', label: 'POS / Punto de Venta', icon: ShoppingBag },
    { value: 'Delivery', label: 'Delivery App', icon: Globe },
    { value: 'ERP', label: 'ERP / Gestión', icon: Server },
    { value: 'Backoffice', label: 'Backoffice Web', icon: Terminal },
    { value: 'Web', label: 'Sitio Web', icon: Globe },
    { value: 'Cámaras', label: 'Cámaras / Seguridad', icon: Shield },
    { value: 'Otro', label: 'Otro Sistema', icon: Server },
];

const SystemAccessManager: React.FC<Props> = ({ systems, onChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    // New Item State
    const [newItem, setNewItem] = useState<Partial<ExternalSystemAccess>>({
        type: 'POS',
        name: '',
        url: '',
        username: '',
        password: '',
        notes: ''
    });

    const handleAdd = () => {
        if (!newItem.name) return alert("El nombre es obligatorio");

        // Add new system
        const system: ExternalSystemAccess = {
            id: crypto.randomUUID(),
            name: newItem.name,
            type: newItem.type as any || 'Otro',
            url: newItem.url || '',
            username: newItem.username || '',
            password: newItem.password || '',
            notes: newItem.notes || ''
        };

        onChange([...(systems || []), system]);

        // Reset form
        setNewItem({ type: 'POS', name: '', url: '', username: '', password: '', notes: '' });
        setIsAdding(false);
    };

    const removeSystem = (id: string) => {
        if (confirm("¿Eliminar este acceso?")) {
            onChange(systems.filter(s => s.id !== id));
        }
    };

    const togglePassword = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    const SystemIcon = (type: string) => {
        const found = SYSTEM_TYPES.find(t => t.value === type);
        const Icon = found?.icon || Server;
        return <Icon className="w-4 h-4 text-[#1FB6D5]" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Accesos y Sistemas ({systems?.length || 0})
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs flex items-center gap-1 text-[#1FB6D5] hover:text-white transition-colors"
                >
                    <Plus className="w-3 h-3" /> Agregar Acceso
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {systems?.map((sys) => (
                    <div key={sys.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-slate-600 transition-colors group">
                        <div className="flex flex-col md:flex-row justify-between gap-4">

                            {/* Header Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {SystemIcon(sys.type)}
                                    <span className="font-bold text-white">{sys.name}</span>
                                    <span className="text-xs bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full border border-slate-800">
                                        {sys.type}
                                    </span>
                                </div>

                                {sys.url && (
                                    <a href={sys.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1FB6D5] hover:underline truncate block max-w-xs mb-2">
                                        {sys.url}
                                    </a>
                                )}

                                {sys.notes && (
                                    <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-2 mt-2">
                                        {sys.notes}
                                    </p>
                                )}
                            </div>

                            {/* Credentials Box */}
                            <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm space-y-2 min-w-[200px]">
                                {sys.username && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 text-xs">Usuario:</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-slate-200">{sys.username}</code>
                                            <button onClick={() => copyToClipboard(sys.username!)} title="Copiar Usuario" className="text-slate-600 hover:text-white">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {sys.password && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 text-xs">Password:</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-[#1FB6D5]">
                                                {visiblePasswords[sys.id] ? sys.password : '••••••••'}
                                            </code>
                                            <button onClick={() => togglePassword(sys.id)} className="text-slate-600 hover:text-white">
                                                {visiblePasswords[sys.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                            <button onClick={() => copyToClipboard(sys.password!)} title="Copiar Password" className="text-slate-600 hover:text-white">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center">
                                <button onClick={() => removeSystem(sys.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    </div>
                ))}

                {(!systems || systems.length === 0) && !isAdding && (
                    <div className="text-center p-6 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
                        No hay sistemas registrados.
                    </div>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-slate-800 border border-[#1FB6D5]/30 p-4 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="text-white font-bold mb-4 text-sm">Nuevo Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Nombre Sistema *</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="Ej: Fudo, Maxirest, PedidosYa"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                            >
                                {SYSTEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">URL Acceso</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="https://..."
                                value={newItem.url}
                                onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Usuario</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="admin"
                                value={newItem.username}
                                onChange={e => setNewItem({ ...newItem, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Contraseña / Link a Vault</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="•••••••"
                                type="text" // Text to allow "See 1Password" notes
                                value={newItem.password}
                                onChange={e => setNewItem({ ...newItem, password: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 block mb-1">Notas Adicionales</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="Ej: Solo usar en horario laboral. 2FA activo."
                                value={newItem.notes}
                                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-slate-400 hover:text-white text-sm">Cancelar</button>
                        <button onClick={handleAdd} className="px-3 py-1 bg-[#1FB6D5] text-[#021019] rounded font-bold text-sm hover:bg-white transition-colors">Guardar Sistema</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemAccessManager;
