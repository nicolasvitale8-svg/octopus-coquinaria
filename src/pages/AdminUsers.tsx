import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Users, Search, AlertCircle, Trash2, Edit2, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import { AdminUserModal } from '../components/admin/AdminUserModal';
import { UserRole } from '../types';
import { logger } from '../services/logger';

// Tipos alineados con AuthContext y DB
interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    created_at: string;
    permissions?: string[];
    businessIds?: string[]; // Mapped from project_members for modal
    phone?: string;
    job_title?: string;
    notes?: string;
    // memberships con nombre de proyecto (V4)
    project_members?: {
        projects: {
            business_name: string;
            id: string;
        }
    }[];
}

const AdminUsers = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        if (!supabase) return;

        try {
            // Fetch users with project information
            const { data, error } = await supabase
                .from('usuarios')
                .select(`
                    *,
                    project_members (
                        projects (
                            id,
                            business_name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (data) {
                setUsers(data as UserData[]);
            } else if (error) {
                logger.error('Error fetching users', { context: 'AdminUsers', data: error });
                setError(error.message);
            }
        } catch (err: unknown) {
            const error = err as Error;
            logger.error('Unexpected error fetching users', { context: 'AdminUsers', data: error });
            setError(error.message || 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const deleteUser = async (userId: string, userName: string) => {
        if (!confirm(`¿Eliminar usuario "${userName}"? Esto borrará sus accesos y es irreversible.`)) return;

        // Optimistic UI update
        setUsers(users.filter(u => u.id !== userId));

        if (supabase) {
            const { error } = await supabase.from('usuarios').delete().eq('id', userId);
            if (error) {
                alert("Error al eliminar: " + error.message);
                fetchUsers(); // Revert
            }
        }
    };

    const handleEdit = (user: UserData) => {
        // Map project_members to businessIds array
        const mappedUser: UserData = {
            ...user,
            businessIds: user.project_members
                ?.map((pm: any) => pm.projects?.id || pm.project_id)
                .filter(Boolean) || []
        };
        logger.debug('Editing user with mapped businessIds', { context: 'AdminUsers', data: mappedUser.businessIds });
        setSelectedUser(mappedUser);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        // Recargar lista tras guardar
        fetchUsers();
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
                        Gestión de Colaboradores
                    </h1>
                    <p className="text-slate-400 text-sm">Administra tu equipo, roles y accesos a proyectos.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar colaboradores..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-[#1FB6D5] focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreate} className="bg-[#1FB6D5] hover:bg-[#189bb5] text-white whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-2" /> Agregar
                    </Button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Colaborador</th>
                                <th className="px-6 py-4">Rol & Accesos</th>
                                <th className="px-6 py-4">Proyectos</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-blue-400">Cargando fichas...</td></tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-red-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="w-6 h-6" />
                                            <p className="font-bold">Error al cargar datos:</p>
                                            <p className="text-sm font-mono bg-red-900/20 p-2 rounded">{error}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No se encontraron colaboradores.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-[#1FB6D5]">
                                                {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.full_name || 'Sin Nombre'}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wide
                                                ${user.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' :
                                                    user.role === 'consultant' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                                                        user.role === 'manager' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                                                            user.role === 'client' ? 'bg-amber-900/30 text-amber-500 border-amber-500/30' :
                                                                'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                {user.role}
                                            </span>
                                            {user.permissions && user.permissions.length > 0 && (
                                                <span className="text-[10px] text-slate-500">
                                                    +{user.permissions.length} Permisos esp.
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'admin' ? (
                                            <span className="text-purple-500 text-xs font-medium">✨ Acceso Total</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {user.project_members && user.project_members.length > 0 ? (
                                                    user.project_members.map((m, idx) => (
                                                        <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700 whitespace-nowrap">
                                                            {m.projects?.business_name || 'Proyecto'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-600 text-[10px] italic">Sin proyectos</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                                title="Editar Ficha"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>

                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => deleteUser(user.id, user.full_name)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                userToEdit={selectedUser}
            />
        </div>
    );
};

export default AdminUsers;
