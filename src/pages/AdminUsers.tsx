import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Users, Search, AlertCircle, Trash2, Edit2, Plus, Clock, UserX } from 'lucide-react';
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
  project_members?: { projects: { business_name: string; id: string; } }[];
}

// "5 min", "2 horas", "3 días" desde un timestamp ISO
const formatTimeAgo = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hr / 24);
  return `${days} ${days === 1 ? 'día' : 'días'}`;
};

const isPending = (role: unknown): boolean => String(role) === 'user';

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
      // Fetch users with project information (excluye rechazados)
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
        .is('rejected_at', null)
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

  const rejectUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Rechazar el acceso a "${userName}"? No podrá ingresar a la app. Podés revertirlo desde la base de datos.`)) return;

    // Optimistic UI update
    setUsers(users.filter(u => u.id !== userId));

    if (supabase) {
      const { error } = await supabase
        .from('usuarios')
        .update({ rejected_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) {
        alert("Error al rechazar: " + error.message);
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

  // Pendientes (role='user') primero, los más viejos antes; resto por created_at desc
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aP = isPending(a.role);
    const bP = isPending(b.role);
    if (aP && !bP) return -1;
    if (!aP && bP) return 1;
    if (aP && bP) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingUsers = filteredUsers.filter(u => isPending(u.role));
  const oldestPending = pendingUsers.length > 0
    ? pendingUsers.reduce((acc, u) =>
        new Date(u.created_at).getTime() < new Date(acc.created_at).getTime() ? u : acc,
        pendingUsers[0]
      )
    : null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-space flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-primary)]" />
            Gestión de Colaboradores
          </h1>
          <p className="text-[var(--text-muted)] text-sm">Administra tu equipo, roles y accesos a proyectos.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar colaboradores..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] text-[var(--text-primary)] whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
        </div>
      </div>

      {/* Banner de pendientes de aprobación */}
      {pendingUsers.length > 0 && oldestPending && (
        <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/40 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0" />
          <div className="text-sm">
            <span className="text-[var(--color-warning)] font-semibold">
              {pendingUsers.length === 1
                ? '1 cuenta esperando aprobación'
                : `${pendingUsers.length} cuentas esperando aprobación`}
            </span>
            <span className="text-[var(--color-warning)]/80 ml-2">
              · la más antigua hace {formatTimeAgo(oldestPending.created_at)}
            </span>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-muted)]">
            <thead className="bg-[var(--bg-base)] text-[var(--text-secondary)] uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Rol & Accesos</th>
                <th className="px-6 py-4">Proyectos</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-blue-400">Cargando fichas...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--color-danger)]">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      <p className="font-bold">Error al cargar datos:</p>
                      <p className="text-sm font-mono bg-[rgba(255,77,77,0.12)]/20 p-2 rounded">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">No se encontraron colaboradores.</td></tr>
              ) : sortedUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-[var(--bg-surface)]/50 transition-colors ${isPending(user.role) ? 'bg-[var(--color-warning)]/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{user.full_name || 'Sin Nombre'}</div>
                        <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wide
                        ${user.role === 'admin' ? 'bg-[var(--bg-elevated)]/30 text-[var(--color-primary)] border-[rgba(0,255,157,0.30)]' :
                          user.role === 'consultant' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                          user.role === 'manager' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                          user.role === 'client' ? 'bg-[rgba(255,177,42,0.15)]/30 text-[var(--color-warning)] border-[var(--color-warning)]/30' :
                          isPending(user.role) ? 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/40' :
                          'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]'}`}>
                        {isPending(user.role) ? 'PENDIENTE' : user.role}
                      </span>
                      {isPending(user.role) && (
                        <span className="text-[10px] text-[var(--color-warning)]/80 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Esperando hace {formatTimeAgo(user.created_at)}
                        </span>
                      )}
                      {user.permissions && user.permissions.length > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          +{user.permissions.length} Permisos esp.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="text-[var(--color-primary)] text-xs font-medium">✨ Acceso Total</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.project_members && user.project_members.length > 0 ? (
                          user.project_members.map((m, idx) => (
                            <span key={idx} className="bg-[var(--bg-surface)] text-[var(--text-secondary)] px-2 py-0.5 rounded text-[10px] border border-[var(--border-subtle)] whitespace-nowrap">
                              {m.projects?.business_name || 'Proyecto'}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--text-muted)] text-[10px] italic">Sin proyectos</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] rounded transition-colors"
                        title="Editar Ficha"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isPending(user.role) && (
                        <button
                          onClick={() => rejectUser(user.id, user.full_name || user.email)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-warning)] hover:bg-[rgba(255,177,42,0.15)]/20 rounded transition-colors"
                          title="Rechazar acceso"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id, user.full_name)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[rgba(255,77,77,0.12)]/20 rounded transition-colors"
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
