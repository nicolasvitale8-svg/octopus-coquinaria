import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Users, Shield, UserCheck, Search, AlertCircle, Trash2, Crown, Briefcase, Lock, X, Check } from 'lucide-react';
import Button from '../components/ui/Button';

// Tipos alineados con AuthContext y DB
interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'consultant' | 'client' | 'manager' | 'user';
    created_at: string;
    permissions?: string[]; // Array de permisos
}

const AVAILABLE_PERMISSIONS = [
    { id: 'view_dashboard', label: 'Ver Dashboard Proyectos' },
    { id: 'view_calendar', label: 'Ver Calendario' },
    { id: 'edit_calendar', label: 'Crear/Editar Eventos' },
    { id: 'view_finance', label: 'Ver Finanzas/Costos', danger: true },
    { id: 'view_ticker', label: 'Ver Ticker (Tendencias)' },
];

const AdminUsers = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

    const fetchUsers = async () => {
        // 1. Load Local
        const localData = localStorage.getItem('octopus_users_cache');
        if (localData) {
            setUsers(JSON.parse(localData));
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        if (!supabase) return;

        // 2. Fetch Remote
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            // Mapeo de legacy 'premium' a 'client' si fuera necesario, o limpieza
            const cleanedData = data.map((u: any) => ({
                ...u,
                role: u.role === 'premium' ? 'client' : u.role // Normalizar a 'client'
            }));
            setUsers(cleanedData as UserData[]);
            localStorage.setItem('octopus_users_cache', JSON.stringify(cleanedData));
        } else if (error) {
            console.error("Error fetching users:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleRole = async (userId: string, currentRole: string, targetRole: UserData['role']) => {
        if (currentRole === 'admin') {
            alert("No se puede cambiar el rol del Administrador principal.");
            return;
        }

        const newRole = currentRole === targetRole ? 'user' : targetRole;

        // Optimistic
        const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u) as UserData[];
        setUsers(updatedUsers);
        localStorage.setItem('octopus_users_cache', JSON.stringify(updatedUsers));

        if (supabase) {
            const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', userId);
            if (error) {
                console.error("Role update failed:", error);
                fetchUsers(); // Revert on error
                alert("Error al actualizar rol: " + error.message);
            }
        }
    };

    const deleteUser = async (userId: string, userName: string) => {
        if (!confirm(`¿Eliminar usuario "${userName}"?`)) return;

        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        localStorage.setItem('octopus_users_cache', JSON.stringify(updatedUsers));

        if (supabase) {
            const { error } = await supabase.from('usuarios').delete().eq('id', userId);
            if (error) alert("Error al eliminar: " + error.message);
        }
    }

    const openPermissionModal = (user: UserData) => {
        setEditingUser(user);
        setTempPermissions(user.permissions || []);
        setIsPermissionModalOpen(true);
    };

    const savePermissions = async () => {
        if (!editingUser) return;

        // Optimistic
        const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, permissions: tempPermissions } : u);
        setUsers(updatedUsers);
        localStorage.setItem('octopus_users_cache', JSON.stringify(updatedUsers));
        setIsPermissionModalOpen(false);

        if (supabase) {
            const { error } = await supabase
                .from('usuarios')
                .update({ permissions: tempPermissions })
                .eq('id', editingUser.id);

            if (error) {
                console.error("Error saving permissions", error);
                alert("Error guardando permisos");
                fetchUsers();
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#1FB6D5]" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-400 text-sm">Roles, permisos y accesos.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#1FB6D5] focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={3} className="p-8 text-center">Cargando...</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{user.full_name || 'Sin Nombre'}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase
                                            ${user.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                                                user.role === 'manager' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                                                    user.role === 'client' ? 'bg-amber-900/30 text-amber-500 border-amber-500/30' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.role !== 'admin' && (
                                            <div className="flex justify-center gap-2 flex-wrap">
                                                {/* Role Toggles */}
                                                <button onClick={() => toggleRole(user.id, user.role, 'client')}
                                                    className={`px-2 py-1 rounded text-xs border ${user.role === 'client' ? 'border-amber-500 text-amber-500' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                                                    Cliente
                                                </button>
                                                <button onClick={() => toggleRole(user.id, user.role, 'manager')}
                                                    className={`px-2 py-1 rounded text-xs border ${user.role === 'manager' ? 'border-orange-500 text-orange-500' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                                                    Gerente
                                                </button>

                                                {/* Permission Edit (Only for Managers) */}
                                                {user.role === 'manager' && (
                                                    <button onClick={() => openPermissionModal(user)}
                                                        className="px-2 py-1 rounded text-xs border border-blue-500/50 text-blue-400 hover:bg-blue-900/20 flex items-center">
                                                        <Lock className="w-3 h-3 mr-1" /> Permisos
                                                    </button>
                                                )}

                                                <button onClick={() => deleteUser(user.id, user.full_name)} className="p-1 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Permission Editor Modal */}
            {isPermissionModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setIsPermissionModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-1">Permisos de Gerente</h3>
                        <p className="text-sm text-slate-400 mb-6">Editando a: <span className="text-orange-400">{editingUser.full_name}</span></p>

                        <div className="space-y-3">
                            {AVAILABLE_PERMISSIONS.map(perm => {
                                const isChecked = tempPermissions.includes(perm.id);
                                return (
                                    <label key={perm.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                        ${isChecked ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}
                                    `}>
                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3
                                                ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'}
                                            `}>
                                                {isChecked && <Check className="w-3 h-3" />}
                                            </div>
                                            <span className={`${perm.danger ? 'text-red-300' : 'text-slate-200'}`}>
                                                {perm.label} {perm.danger && '⚠️'}
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={() => {
                                                if (isChecked) setTempPermissions(prev => prev.filter(p => p !== perm.id));
                                                else setTempPermissions(prev => [...prev, perm.id]);
                                            }}
                                        />
                                    </label>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <Button variant="ghost" onClick={() => setIsPermissionModalOpen(false)}>Cancelar</Button>
                            <Button onClick={savePermissions} className="bg-blue-600 hover:bg-blue-500 text-white">
                                Guardar Permisos
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
