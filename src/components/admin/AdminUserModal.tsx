import React, { useState, useEffect } from 'react';
import { X, Save, Shield, User, Briefcase, Check, AlertCircle, Loader2, Phone, FileText, Lock } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { createClient } from '@supabase/supabase-js';
import Button from '../ui/Button';
import { UserRole, Permission } from '../../types';

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

export const AdminUserModal: React.FC<AdminUserModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
    const [formData, setFormData] = useState<UserData>({
        email: '',
        full_name: '',
        phone: '',
        job_title: '',
        notes: '',
        role: 'user',
        permissions: [],
        businessIds: []
    });

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

            if (userToEdit) {
                setFormData({
                    id: userToEdit.id,
                    email: userToEdit.email,
                    full_name: userToEdit.full_name,
                    phone: userToEdit.phone || '',
                    job_title: userToEdit.job_title || '',
                    notes: userToEdit.notes || '',
                    role: userToEdit.role,
                    permissions: userToEdit.permissions || [],
                    businessIds: userToEdit.businessIds || []
                });
            } else {
                setFormData({
                    email: '',
                    full_name: '',
                    phone: '',
                    job_title: '',
                    notes: '',
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
            if (!supabase) {
                console.warn("No Supabase client available");
                return;
            }

            // TIMEOUT DE SEGURIDAD: 3 SEGUNDOS
            // Si la BD tarda más, abortamos la carga de proyectos para no bloquear la UI.
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                setTimeout(() => resolve({ timeout: true }), 3000)
            );

            const dbPromise = supabase
                .from('projects')
                .select('id, business_name')
                .order('business_name');

            const result = await Promise.race([dbPromise, timeoutPromise]);

            if ('timeout' in result) {
                console.warn("⚠️ Carga de proyectos excedió el tiempo límite (3s). Se omite lista.");
                // No seteamos proyectos, permitimos al usuario continuar
            } else {
                const { data, error } = result as any;
                if (data) {
                    setProjects(data.map((p: any) => ({
                        id: p.id,
                        name: p.business_name || 'Sin nombre',
                        business_name: p.business_name
                    })));
                } else if (error) {
                    console.error("Error loading projects:", error);
                }
            }
        } catch (e) {
            console.error("Exception loading projects:", e);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!supabase) throw new Error("Sin conexión a base de datos");
            if (!formData.role) throw new Error("Debes asignar un rol al usuario");

            let userId = formData.id;

            // --- FLUSH DE CREACIÓN DIRECTA (SHADOW CLIENT) ---
            if (!userId) {
                // Estamos creando un usuario usuario totalmente nuevo
                if (!password || password.length < 6) {
                    throw new Error("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
                }

                // Storage dummy para evitar conflictos con el cliente principal y advertencias de consola
                const dummyStorage = {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };

                // Cliente temporal aislado
                // INSTANCIADO SOLO AL MOMENTO DE USAR
                const shadowSupabase = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_ANON_KEY,
                    {
                        auth: {
                            persistSession: false,
                            autoRefreshToken: false,
                            detectSessionInUrl: false,
                            storage: dummyStorage
                        }
                    }
                );

                // Wrapper con Timeout para signUp
                const signUpWithTimeout = async () => {
                    const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                        setTimeout(() => resolve({ timeout: true }), 10000)
                    );

                    const signUpPromise = shadowSupabase.auth.signUp({
                        email: formData.email,
                        password: password,
                        options: {
                            data: {
                                full_name: formData.full_name,
                                role: formData.role
                            }
                        }
                    });

                    const result = await Promise.race([signUpPromise, timeoutPromise]);
                    if ('timeout' in result) throw new Error("La creación del usuario excedió el tiempo límite (10s). Revisa tu conexión.");
                    return result;
                };

                // Registrar en Auth
                const { data: authData, error: authError } = await signUpWithTimeout();

                if (authError) throw new Error("Error al crear cuenta: " + authError.message);
                if (!authData.user) throw new Error("No se pudo obtener el ID del nuevo usuario.");

                userId = authData.user.id;
            }

            // --- ACTUALIZACIÓN DE PERFIL ---
            // --- ACTUALIZACIÓN DE PERFIL ---
            const payload = {
                full_name: formData.full_name,
                phone: formData.phone,
                job_title: formData.job_title,
                notes: formData.notes,
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions
                // businessIds van aparte
            };

            // Wrapper con Timeout para UPSERT (evita bucles infinitos por RLS)
            const upsertWithTimeout = async () => {
                const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                    setTimeout(() => resolve({ timeout: true }), 5000)
                );

                const upsertPromise = supabase!
                    .from('usuarios')
                    .upsert({
                        id: userId,
                        ...payload
                    });

                const result = await Promise.race([upsertPromise, timeoutPromise]);
                if ('timeout' in result) throw new Error("Guardar perfil excedió el tiempo límite (5s). Posible bloqueo en Base de Datos (RLS).");
                return result;
            };

            const { error: upsertError } = await upsertWithTimeout() as any;

            if (upsertError) throw upsertError;

            // --- ACTUALIZACIÓN DE MEMBRESÍAS ---
            if (['consultant', 'client', 'manager'].includes(formData.role) && userId) {
                // Limpiar existentes previos
                await supabase.from('business_memberships').delete().eq('user_id', userId);

                if (formData.businessIds && formData.businessIds.length > 0) {
                    const memberships = formData.businessIds.map(bid => ({
                        user_id: userId,
                        business_id: bid,
                        member_role: 'manager'
                    }));

                    const { error: memberError } = await supabase
                        .from('business_memberships')
                        .insert(memberships);

                    if (memberError) throw memberError;
                }
            }

            onSave();
            onClose();

        } catch (err: any) {
            console.error("Error saving user:", err);
            // Mensaje amigable si es por email duplicado
            const msg = err.message || '';
            if (msg.includes('already registered')) {
                setError('Este email ya está registrado. Intenta editar el usuario existente o usar otro email.');
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {userToEdit ? 'Editar Ficha' : 'Alta de Nuevo Colaborador'}
                        </h2>
                        <p className="text-sm text-slate-400">
                            {userToEdit ? 'Modifica los datos y accesos.' : 'Crea un usuario y asígnale contraseña.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1">
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 1. Datos Personales */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#1FB6D5] uppercase tracking-wider flex items-center gap-2">
                            <User size={16} /> Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Email (Usuario)</label>
                                <input
                                    type="email"
                                    required
                                    disabled={!!userToEdit}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-[#1FB6D5] focus:outline-none disabled:opacity-50"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="usuario@ejemplo.com"
                                />
                            </div>

                            {/* CAMPO DE CONTRASEÑA */}
                            {!userToEdit && (
                                <div className="col-span-full md:col-span-2 bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg">
                                    <label className="block text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
                                        <Lock size={12} /> CONTRASEÑA DE ACCESO
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-900 border border-blue-500/30 rounded-lg px-4 py-2 text-white font-mono tracking-wide focus:border-[#1FB6D5] focus:outline-none"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Escribe la contraseña temporal..."
                                    />
                                    <p className="text-[10px] text-blue-300/70 mt-1">
                                        * El usuario usará esta contraseña para ingresar. Podrá cambiarla luego.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input
                                        type="tel"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Cargo / Puesto</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#1FB6D5] focus:outline-none"
                                        value={formData.job_title}
                                        onChange={e => setFormData({ ...formData, job_title: e.target.value })}
                                        placeholder="Ej. Auditor Senior"
                                    />
                                </div>
                            </div>
                            <div className="col-span-full">
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas Internas</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#1FB6D5] focus:outline-none resize-none h-20"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Información adicional..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Rol en la Plataforma */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#1FB6D5] uppercase tracking-wider flex items-center gap-2">
                            <Shield size={16} /> Nivel de Acceso (Rol)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(['user', 'client', 'manager', 'consultant', 'admin'] as UserRole[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: r })}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left flex items-center justify-between ${formData.role === r
                                        ? 'bg-[#1FB6D5]/20 border-[#1FB6D5] text-[#1FB6D5]'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <span>{ROLE_LABELS[r]}</span>
                                    {formData.role === r && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Permisos */}
                    {['manager', 'consultant'].includes(formData.role) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-sm font-bold text-[#1FB6D5] uppercase tracking-wider flex items-center gap-2">
                                <Check size={16} /> Permisos Funcionales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isActive ? 'bg-blue-900/10 border-blue-500/40' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'
                                                }`}>
                                                {isActive && <Check size={10} />}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                                                    {perm.label}
                                                </div>
                                                <div className="text-xs text-slate-500">{perm.description}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. Proyectos */}
                    {['client', 'manager', 'consultant'].includes(formData.role) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-sm font-bold text-[#1FB6D5] uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={16} /> Asignación de Proyectos
                            </h3>
                            {loadingProjects ? (
                                <div className="text-slate-500 text-sm flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={14} /> Cargando proyectos disponibles...
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
                                                className={`px-3 py-2 rounded border cursor-pointer text-sm truncate transition-colors ${isSelected
                                                    ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-300'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                                    }`}
                                                title={proj.name}
                                            >
                                                {proj.name}
                                            </div>
                                        );
                                    })}
                                    {projects.length === 0 && (
                                        <div className="text-slate-500 text-xs col-span-full">No hay proyectos disponibles.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 z-10">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1FB6D5] hover:bg-[#189bb5] text-white">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={16} /> Procesando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={16} />
                                {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
