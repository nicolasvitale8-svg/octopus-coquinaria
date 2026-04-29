import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, Shield, Star, Trash2, Search, Check } from 'lucide-react';
import { Project, AppUser, Role } from '../../types';
import { memberService } from '../../services/memberService';
import { logger } from '../../services/logger';
import Button from '../ui/Button';

interface ProjectMembersModalProps {
    project: Project;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({ project, isOpen, onClose, onUpdate }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<Partial<AppUser>[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, project.id]);

    const loadData = async () => {
        setIsLoading(true);
        const [projMembers, allUsers, allRoles] = await Promise.all([
            memberService.getProjectMembers(project.id),
            memberService.getAllUsers(),
            memberService.getAvailableRoles()
        ]);
        setMembers(projMembers);
        setAvailableUsers(allUsers);
        setRoles(allRoles);
        setIsLoading(false);
    };

    const handleAddUser = async (user: Partial<AppUser>) => {
        setIsSaving(true);
        logger.debug('Adding user to project', { context: 'ProjectMembersModal', data: { userId: user.id, projectId: project.id } });
        const success = await memberService.addOrUpdateMember({
            project_id: project.id,
            user_id: user.id,
            role_id: 'consultant' // Default role
        });
        if (success) {
            await loadData();
            onUpdate();
        } else {
            alert("❌ Error al agregar miembro. Revisá la consola para más detalles.");
        }
        setIsSaving(false);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('¿Eliminar a este miembro del proyecto?')) return;
        setIsSaving(true);
        logger.debug('Removing user from project', { context: 'ProjectMembersModal', data: { userId, projectId: project.id } });
        const success = await memberService.removeMember(project.id, userId);
        if (success) {
            await loadData();
            onUpdate();
        } else {
            alert("❌ Error al eliminar miembro. Revisá la consola para más detalles.");
        }
        setIsSaving(false);
    };

    const handleUpdateRole = async (userId: string, roleId: string) => {
        setIsSaving(true);
        logger.debug('Updating role', { context: 'ProjectMembersModal', data: { userId, projectId: project.id, roleId } });
        const success = await memberService.addOrUpdateMember({
            project_id: project.id,
            user_id: userId,
            role_id: roleId
        });
        if (success) {
            await loadData();
            onUpdate();
        } else {
            alert("❌ Error al actualizar el rol. Revisá la consola para más detalles.");
        }
        setIsSaving(false);
    };

    if (!isOpen) return null;

    const filteredUsers = availableUsers.filter(u =>
        !members.some(m => m.user_id === u.id) &&
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Debugging Roles
    logger.debug('Available Roles', { context: 'ProjectMembersModal', data: roles });

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-base)]/50">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Gestionar Equipo</h2>
                        <p className="text-[var(--text-muted)] text-sm">{project.business_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Add Member Section */}
                    <div>
                        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Añadir Nuevo Miembro
                        </h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Buscar usuarios por nombre o email..."
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery && (
                            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md max-h-48 overflow-auto divide-y divide-[var(--border-subtle)]/50">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAddUser(user)}
                                            className="w-full p-3 flex items-center justify-between hover:bg-[var(--bg-base)] transition-colors text-left"
                                            disabled={isSaving}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[var(--text-primary)] text-sm font-medium">{user.full_name}</p>
                                                    <p className="text-[var(--text-muted)] text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                            <UserPlus className="w-4 h-4 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-[var(--text-muted)] text-sm">No se encontraron usuarios disponibles.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Active Members List */}
                    <div>
                        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Miembros Actualles ({members.length})</h3>
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="py-8 text-center text-[var(--text-muted)] animate-pulse">Cargando miembros...</div>
                            ) : members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.user_id} className="bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-md p-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                                                {member.usuarios?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[var(--text-primary)] font-medium">{member.usuarios?.full_name}</p>
                                                    {member.role_id === 'admin' && <Shield className="w-3 h-3 text-[var(--color-warning)]" />}
                                                </div>
                                                <p className="text-[var(--text-muted)] text-xs">{member.usuarios?.email}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">ID Role: {member.role_id}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <select
                                                value={member.role_id}
                                                onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                className="bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs rounded-lg px-2 py-1 outline-none focus:border-[var(--color-primary)] transition-all"
                                                disabled={isSaving}
                                            >
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-all"
                                                disabled={isSaving}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-[var(--bg-base)]/30 border border-[var(--border-subtle)] border-dashed rounded-md">
                                    <p className="text-[var(--text-muted)] text-sm">Este proyecto no tiene miembros asignados aún.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end">
                    <Button onClick={onClose} variant="secondary">Cerrar</Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProjectMembersModal;
