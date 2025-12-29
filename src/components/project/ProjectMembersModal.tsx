import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Star, Trash2, Search, Check } from 'lucide-react';
import { Project, AppUser, Role } from '../../types';
import { memberService } from '../../services/memberService';
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
        const success = await memberService.addOrUpdateMember({
            project_id: project.id,
            user_id: user.id,
            role_id: 'consultant' // Default role
        });
        if (success) {
            await loadData();
            onUpdate();
        }
        setIsSaving(false);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('¿Eliminar a este miembro del proyecto?')) return;
        setIsSaving(true);
        const success = await memberService.removeMember(project.id, userId);
        if (success) {
            await loadData();
            onUpdate();
        }
        setIsSaving(false);
    };

    const handleUpdateRole = async (userId: string, roleId: string) => {
        setIsSaving(true);
        await memberService.addOrUpdateMember({
            project_id: project.id,
            user_id: userId,
            role_id: roleId
        });
        await loadData();
        onUpdate();
        setIsSaving(false);
    };

    if (!isOpen) return null;

    const filteredUsers = availableUsers.filter(u =>
        !members.some(m => m.user_id === u.id) &&
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Gestionar Equipo</h2>
                        <p className="text-slate-500 text-sm">{project.business_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Add Member Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Añadir Nuevo Miembro
                        </h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar usuarios por nombre o email..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {searchQuery && (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-auto divide-y divide-slate-800/50">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAddUser(user)}
                                            className="w-full p-3 flex items-center justify-between hover:bg-slate-900 transition-colors text-left"
                                            disabled={isSaving}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{user.full_name}</p>
                                                    <p className="text-slate-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                            <UserPlus className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-slate-500 text-sm">No se encontraron usuarios disponibles.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Active Members List */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Miembros Actualles ({members.length})</h3>
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="py-8 text-center text-slate-500 animate-pulse">Cargando miembros...</div>
                            ) : members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.user_id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-cyan-400">
                                                {member.usuarios?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-medium">{member.usuarios?.full_name}</p>
                                                    {member.role_id === 'admin' && <Shield className="w-3 h-3 text-orange-400" />}
                                                </div>
                                                <p className="text-slate-500 text-xs">{member.usuarios?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <select
                                                value={member.role_id}
                                                onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-500 transition-all"
                                                disabled={isSaving}
                                            >
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                disabled={isSaving}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-slate-950/30 border border-slate-800 border-dashed rounded-xl">
                                    <p className="text-slate-500 text-sm">Este proyecto no tiene miembros asignados aún.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end">
                    <Button onClick={onClose} variant="secondary">Cerrar</Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectMembersModal;
