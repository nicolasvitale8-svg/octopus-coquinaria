import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User, Briefcase, Check, AlertCircle, Loader2, Phone, FileText, Lock } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { createClient } from '@supabase/supabase-js';
import Button from '../ui/Button';
import AvatarUploader from '../ui/AvatarUploader';
import { uploadAvatar, saveAvatarUrl } from '../../services/avatarService';
import { useToast } from '../../contexts/ToastContext';
import { JOB_TITLES, isCanonicalJobTitle } from '../../constants/jobTitles';
import { UserRole, Permission } from '../../types';

/**
 * AdminUserModal — modal HUD de alta/edición de colaborador.
 * - Avatar uploader integrado.
 * - Cargo/Puesto como dropdown (mismas opciones que /hub/profile).
 * - Toast de éxito al guardar.
 * - Datos sincronizados con la misma tabla `usuarios`, mismas columnas que
 *   edita el propio usuario en su perfil.
 */

interface ProjectOption {
    id: string;
    name: string;
    business_name: string;
}

interface UserData {
    id?: string;
    email: string;
    full_name: string;
    phone?: string;
    job_title?: string;
    notes?: string;
    avatar_url?: string | null;
    role: UserRole;
    permissions?: string[];
    businessIds?: string[];
}

interface AdminUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    userToEdit?: UserData | null;
}

const AVAILABLE_PERMISSIONS: { id: Permission; label: string; description: string }[] = [
    { id: 'view_dashboard', label: 'Ver Dashboard', description: 'Acceso a métricas generales.' },
    { id: 'view_calendar', label: 'Ver Calendario', description: 'Lectura de eventos.' },
    { id: 'edit_calendar', label: 'Gestión Calendario', description: 'Crear y editar eventos.' },
    { id: 'view_finance_basic', label: 'Ver Finanzas', description: 'Acceso a costos y márgenes.' },
    { id: 'create_tasks', label: 'Crear Tareas', description: 'Asignar tareas al equipo.' },
    { id: 'edit_settings', label: 'Configuración', description: 'Modificar ajustes del negocio.' },
];

const ROLE_LABELS: Record<UserRole, string> = {
    'admin': 'Administrador',
    'consultant': 'Colaborador (Auditor/Esp.)',
    'manager': 'Gerente de Local',
    'client': 'Cliente (Dueño)',
    'user': 'En Espera (Lead)'
};

const inputBase =
    "w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors font-mono";

const labelBase =
    "block font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] mb-1.5";

export const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
    const { showToast } = useToast();

    const [formData, setFormData] = useState<UserData>({
        email: '',
        full_name: '',
        phone: '',
        job_title: '',
        notes: '',
        avatar_url: null,
        role: 'user',
        permissions: [],
        businessIds: []
    });

    const [jobTitleSelect, setJobTitleSelect] = useState<string>('');
    const [jobTitleOther, setJobTitleOther] = useState<string>('');

    // File de avatar pendiente (cuando no hay user.id todavía: alta)
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    // Campo de contraseña solo para creación
    const [password, setPassword] = useState('');

    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setPassword('');
            setError(null);
            setPendingAvatarFile(null);

            if (userToEdit) {
                const dbJob = userToEdit.job_title || '';
                if (!dbJob || isCanonicalJobTitle(dbJob)) {
                    setJobTitleSelect(dbJob);
                    setJobTitleOther('');
                } else {
                    setJobTitleSelect('OTRO');
                    setJobTitleOther(dbJob);
                }

                setFormData({
                    id: userToEdit.id,
                    email: userToEdit.email,
                    full_name: userToEdit.full_name,
                    phone: userToEdit.phone || '',
                    job_title: userToEdit.job_title || '',
                    notes: userToEdit.notes || '',
                    avatar_url: userToEdit.avatar_url || null,
                    role: userToEdit.role,
                    permissions: userToEdit.permissions || [],
                    businessIds: userToEdit.businessIds || []
                });
            } else {
                setJobTitleSelect('');
                setJobTitleOther('');
                setFormData({
                    email: '',
                    full_name: '',
                    phone: '',
                    job_title: '',
                    notes: '',
                    avatar_url: null,
                    role: 'user',
                    permissions: [],
                    businessIds: []
                });
            }
        }
    }, [isOpen, userToEdit]);

    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            if (!supabase) return;
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                setTimeout(() => resolve({ timeout: true }), 3000)
            );
            const dbPromise = supabase
                .from('projects')
                .select('id, business_name')
                .order('business_name');
            const result = await Promise.race([dbPromise, timeoutPromise]);
            if (!('timeout' in result)) {
                const { data } = result as any;
                if (data) {
                    setProjects(data.map((p: any) => ({
                        id: p.id,
                        name: p.business_name || 'Sin nombre',
                        business_name: p.business_name
                    })));
                }
            }
        } catch (e) {
            console.error('Exception loading projects:', e);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const finalJobTitle = (): string =>
        jobTitleSelect === 'OTRO' ? jobTitleOther.trim() : jobTitleSelect;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!supabase) throw new Error('Sin conexión a base de datos');
            if (!formData.role) throw new Error('Debes asignar un rol al usuario');

            let userId = formData.id;

            // === ALTA NUEVO USUARIO ===
            if (!userId) {
                if (!password || password.length < 6) {
                    throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
                }

                const dummyStorage = {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };

                const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../../constants');
                const shadowSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                        storage: dummyStorage
                    }
                });

                const signUpWithTimeout = async () => {
                    const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                        setTimeout(() => resolve({ timeout: true }), 10000)
                    );
                    const signUpPromise = shadowSupabase.auth.signUp({
                        email: formData.email,
                        password,
                        options: { data: { full_name: formData.full_name, role: formData.role } }
                    });
                    const result = await Promise.race([signUpPromise, timeoutPromise]);
                    if ('timeout' in result) throw new Error('La creación excedió el tiempo límite (10s).');
                    return result;
                };

                const { data: authData, error: authError } = await signUpWithTimeout();
                if (authError) throw new Error('Error al crear cuenta: ' + authError.message);
                if (!authData.user) throw new Error('No se pudo obtener el ID del nuevo usuario.');
                userId = authData.user.id;
            }

            // === SUBIR AVATAR PENDIENTE (si lo hay y ya tenemos userId) ===
            let finalAvatarUrl = formData.avatar_url;
            if (pendingAvatarFile && userId) {
                try {
                    const { url } = await uploadAvatar(userId, pendingAvatarFile);
                    finalAvatarUrl = url;
                } catch (err: any) {
                    console.warn('Avatar upload falló:', err);
                    showToast('No se pudo subir el avatar, pero el usuario se guardará igual.', 'info');
                }
            }

            // === UPSERT PERFIL ===
            const payload = {
                full_name: formData.full_name,
                phone: formData.phone || null,
                job_title: finalJobTitle() || null,
                notes: formData.notes || null,
                avatar_url: finalAvatarUrl || null,
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions
            };

            const upsertWithTimeout = async () => {
                const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                    setTimeout(() => resolve({ timeout: true }), 5000)
                );
                const upsertPromise = supabase!
                    .from('usuarios')
                    .upsert({ id: userId, ...payload });
                const result = await Promise.race([upsertPromise, timeoutPromise]);
                if ('timeout' in result) throw new Error('Guardar perfil excedió el tiempo límite (5s).');
                return result;
            };

            const { error: upsertError } = await upsertWithTimeout() as any;
            if (upsertError) throw upsertError;

            // === MEMBRESÍAS ===
            if (['consultant', 'client', 'manager'].includes(formData.role) && userId) {
                await supabase.from('project_members').delete().eq('user_id', userId);
                if (formData.businessIds && formData.businessIds.length > 0) {
                    const memberships = formData.businessIds.map(bid => ({
                        user_id: userId,
                        project_id: bid,
                        role_id: 'manager'
                    }));
                    const { error: memberError } = await supabase
                        .from('project_members')
                        .insert(memberships);
                    if (memberError) throw memberError;
                }
            }

            showToast(userToEdit ? 'Cambios guardados correctamente' : 'Colaborador creado correctamente', 'success');
            onSave();
            onClose();
        } catch (err: any) {
            console.error('Error saving user:', err);
            const msg = err.message || '';
            if (msg.includes('already registered')) {
                setError('Este email ya está registrado. Editá el usuario existente o usá otro email.');
            } else {
                setError(msg || 'Error al guardar usuario');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div
                className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto border shadow-2xl animate-fade-in-up flex flex-col"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
            >
                {/* Brackets HUD */}
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t z-20" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-r border-t z-20" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-l border-b z-20" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b z-20" style={{ borderColor: 'var(--color-primary)' }} />

                {/* Header sticky */}
                <div
                    className="p-6 border-b flex justify-between items-start sticky top-0 z-10"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--text-muted)' }}>
                            — {userToEdit ? 'CPD-ADM-USR-EDIT' : 'CPD-ADM-USR-NEW'}
                        </div>
                        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {userToEdit ? 'Editar Ficha' : 'Alta de Nuevo Colaborador'}
                        </h2>
                        <p className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {userToEdit ? 'Modifica los datos y accesos.' : 'Crea un usuario y asignale contraseña.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="transition-colors hover:text-[var(--color-primary)]"
                        style={{ color: 'var(--text-muted)' }}
                        title="Cerrar"
                    >
                        <X size={20} strokeWidth={1.75} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-7 flex-1">
                    {error && (
                        <div
                            className="border p-3 flex items-start gap-2"
                            style={{
                                background: 'rgba(255,77,77,0.10)',
                                borderColor: 'var(--color-danger)',
                                color: 'var(--color-danger)'
                            }}
                        >
                            <AlertCircle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                            <span className="font-mono text-[12px]">{error}</span>
                        </div>
                    )}

                    {/* Avatar */}
                    <div>
                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <User size={14} strokeWidth={2} /> // Foto de Perfil
                        </h3>
                        <AvatarUploader
                            userId={formData.id || null}
                            initialUrl={formData.avatar_url || null}
                            fullName={formData.full_name}
                            size={88}
                            onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                            onPickedFile={(file) => setPendingAvatarFile(file)}
                            onError={(msg) => showToast(msg, 'error')}
                        />
                    </div>

                    {/* Información Personal */}
                    <div className="space-y-4">
                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <User size={14} strokeWidth={2} /> // Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelBase}>Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className={inputBase}
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Email (Usuario)</label>
                                <input
                                    type="email"
                                    required
                                    disabled={!!userToEdit}
                                    className={`${inputBase} disabled:opacity-50`}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="usuario@ejemplo.com"
                                />
                            </div>

                            {!userToEdit && (
                                <div
                                    className="col-span-full border p-4"
                                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--color-primary)' }}
                                >
                                    <label className={`${labelBase} flex items-center gap-2`} style={{ color: 'var(--color-primary)' }}>
                                        <Lock size={11} strokeWidth={2} /> Contraseña de Acceso
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        minLength={6}
                                        className={`${inputBase} tracking-wide`}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Contraseña temporal…"
                                    />
                                    <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                        El usuario podrá cambiarla luego desde su perfil.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className={`${labelBase} flex items-center gap-2`}>
                                    <Phone size={11} strokeWidth={2} /> Teléfono / WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    className={inputBase}
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+54 9 11..."
                                />
                            </div>

                            <div>
                                <label className={`${labelBase} flex items-center gap-2`}>
                                    <Briefcase size={11} strokeWidth={2} /> Cargo / Puesto
                                </label>
                                <select
                                    className={inputBase}
                                    value={jobTitleSelect}
                                    onChange={e => setJobTitleSelect(e.target.value)}
                                >
                                    <option value="">— Seleccioná —</option>
                                    {JOB_TITLES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {jobTitleSelect === 'OTRO' && (
                                    <input
                                        type="text"
                                        className={`${inputBase} mt-2`}
                                        value={jobTitleOther}
                                        onChange={e => setJobTitleOther(e.target.value)}
                                        placeholder="Especificá el cargo…"
                                        maxLength={60}
                                    />
                                )}
                            </div>

                            <div className="col-span-full">
                                <label className={`${labelBase} flex items-center gap-2`}>
                                    <FileText size={11} strokeWidth={2} /> Notas Internas
                                </label>
                                <textarea
                                    className={`${inputBase} resize-none h-20`}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Información adicional (sólo visible para admins)…"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rol */}
                    <div className="space-y-3">
                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                            <Shield size={14} strokeWidth={2} /> // Nivel de Acceso (Rol)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(['user', 'client', 'manager', 'consultant', 'admin'] as UserRole[]).map((r) => {
                                const active = formData.role === r;
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        className="px-3 py-2.5 font-mono text-[12px] uppercase tracking-[0.16em] border transition-all text-left flex items-center justify-between"
                                        style={{
                                            background: active ? 'rgba(0,255,157,0.10)' : 'var(--bg-base)',
                                            color: active ? 'var(--color-primary)' : 'var(--text-muted)',
                                            borderColor: active ? 'var(--color-primary)' : 'var(--border-subtle)'
                                        }}
                                    >
                                        <span>{ROLE_LABELS[r]}</span>
                                        {active && <Check size={14} strokeWidth={2} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Permisos */}
                    {['manager', 'consultant'].includes(formData.role) && (
                        <div className="space-y-3">
                            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                                <Check size={14} strokeWidth={2} /> // Permisos Funcionales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {AVAILABLE_PERMISSIONS.map((perm) => {
                                    const isActive = formData.permissions?.includes(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            onClick={() => {
                                                const newPerms = isActive
                                                    ? formData.permissions?.filter(p => p !== perm.id)
                                                    : [...(formData.permissions || []), perm.id];
                                                setFormData({ ...formData, permissions: newPerms });
                                            }}
                                            className="p-3 border cursor-pointer transition-all flex items-start gap-3"
                                            style={{
                                                background: isActive ? 'rgba(0,255,157,0.08)' : 'var(--bg-base)',
                                                borderColor: isActive ? 'var(--color-primary)' : 'var(--border-subtle)'
                                            }}
                                        >
                                            <div
                                                className="mt-0.5 w-4 h-4 border flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-subtle)',
                                                    color: '#050607'
                                                }}
                                            >
                                                {isActive && <Check size={10} strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <div
                                                    className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]"
                                                    style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                                                >
                                                    {perm.label}
                                                </div>
                                                <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                    {perm.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Proyectos */}
                    {['client', 'manager', 'consultant'].includes(formData.role) && (
                        <div className="space-y-3">
                            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                                <Briefcase size={14} strokeWidth={2} /> // Asignación de Proyectos
                            </h3>
                            {loadingProjects ? (
                                <div className="font-mono text-[12px] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                    <Loader2 className="animate-spin" size={14} /> Cargando proyectos disponibles…
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {projects.map(proj => {
                                        const isSelected = formData.businessIds?.includes(proj.id);
                                        return (
                                            <div
                                                key={proj.id}
                                                onClick={() => {
                                                    const newBids = isSelected
                                                        ? formData.businessIds?.filter(id => id !== proj.id)
                                                        : [...(formData.businessIds || []), proj.id];
                                                    setFormData({ ...formData, businessIds: newBids });
                                                }}
                                                className="px-3 py-2 border cursor-pointer font-mono text-[12px] truncate transition-colors"
                                                style={{
                                                    background: isSelected ? 'rgba(0,255,157,0.08)' : 'var(--bg-base)',
                                                    color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                                                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)'
                                                }}
                                                title={proj.name}
                                            >
                                                {proj.name}
                                            </div>
                                        );
                                    })}
                                    {projects.length === 0 && (
                                        <div className="font-mono text-[11px] col-span-full" style={{ color: 'var(--text-muted)' }}>
                                            No hay proyectos disponibles.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </form>

                {/* Footer sticky */}
                <div
                    className="p-5 border-t flex justify-end gap-3 sticky bottom-0 z-10"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                >
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={14} /> Procesando…
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={14} />
                                {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
