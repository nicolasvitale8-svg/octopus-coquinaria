import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Users, Shield, UserCheck, Search, AlertCircle } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'consultant' | 'user';
    created_at: string;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        if (!supabase) return;

        // Fetch de la tabla publica usuarios
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setUsers(data as UserData[]);
        } else if (error) {
            console.error("Error fetching users:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleRole = async (userId: string, currentRole: string) => {
        if (!supabase) return;

        // Logic: Toggle between 'user' and 'consultant'. Admin is protected usually.
        const newRole = currentRole === 'consultant' ? 'user' : 'consultant';

        if (currentRole === 'admin') {
            alert("No se puede cambiar el rol del Administrador principal desde aquí.");
            return;
        }

        const { error } = await supabase
            .from('usuarios')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            fetchUsers(); // Refresh
        } else {
            alert("Error al actualizar rol: " + error.message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#1FB6D5]" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-400 text-sm">Administra permisos y roles de acceso.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
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
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Rol Actual</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center flex flex-col items-center gap-2">
                                        <AlertCircle className="w-8 h-8 text-slate-600" />
                                        <p>No se encontraron usuarios.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {user.full_name || 'Sin Nombre'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin'
                                                    ? 'bg-purple-900/30 text-purple-400 border-purple-500/30'
                                                    : user.role === 'consultant'
                                                        ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => toggleRole(user.id, user.role)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded transition-all border ${user.role === 'consultant'
                                                            ? 'border-red-500/30 text-red-400 hover:bg-red-900/20'
                                                            : 'border-[#1FB6D5]/30 text-[#1FB6D5] hover:bg-[#1FB6D5]/10'
                                                        }`}
                                                >
                                                    {user.role === 'consultant' ? 'Quitar Permiso' : 'Hacer Consultor'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
