import React, { useState, useEffect } from 'react';
import { Shield, Lock, Save, Loader2, Phone, Briefcase, Mail, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import AvatarUploader from '../components/ui/AvatarUploader';
import { JOB_TITLES, isCanonicalJobTitle } from '../constants/jobTitles';
import { useNavigate } from 'react-router-dom';

/**
 * UserProfile.tsx — /hub/profile · CEPHALOPOD HUD.
 * - Avatar uploader integrado con Supabase Storage.
 * - Cargo/Puesto como dropdown + 'Otro' habilita input libre.
 * - Toast de éxito al guardar (no más mensaje fijo).
 * - Doc-codes, brackets HUD, marcos rectos, tokens phosphor.
 */

const inputBase =
    "w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors font-mono";

const labelBase =
    "block font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.22em] mb-1.5";

const UserProfile = () => {
    const { profile, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
    const [fullName, setFullName] = useState(profile?.full_name || profile?.name || '');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobTitleOther, setJobTitleOther] = useState<string>('');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (profile) {
            setAvatarUrl(profile.avatar_url || null);
            setFullName(profile.full_name || profile.name || '');
            fetchExtendedProfile();
        }
    }, [profile?.id]);

    const fetchExtendedProfile = async () => {
        if (!profile?.id || !supabase) return;
        const { data } = await supabase
            .from('usuarios')
            .select('job_title, phone, avatar_url')
            .eq('id', profile.id)
            .single();

        if (data) {
            const dbJob = data.job_title || '';
            if (!dbJob || isCanonicalJobTitle(dbJob)) {
                setJobTitle(dbJob);
                setJobTitleOther('');
            } else {
                setJobTitle('OTRO');
                setJobTitleOther(dbJob);
            }
            setPhone(data.phone || '');
            setAvatarUrl(data.avatar_url || null);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !profile?.id) return;

        setIsSavingProfile(true);

        // Determinar job_title final: si es OTRO, usar el texto libre; si no, el value canónico
        const finalJobTitle = jobTitle === 'OTRO' ? jobTitleOther.trim() : jobTitle;

        try {
            const { error } = await supabase
                .from('usuarios')
                .update({
                    full_name: fullName,
                    job_title: finalJobTitle || null,
                    phone: phone || null
                })
                .eq('id', profile.id);

            if (error) throw error;

            showToast('Perfil actualizado correctamente', 'success');
        } catch (err: any) {
            console.error("Error updating profile:", err);
            showToast(err.message || 'Error al actualizar el perfil', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        if (newPassword !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setNewPassword('');
            setConfirmPassword('');
            showToast('Contraseña actualizada con éxito', 'success');
        } catch (err: any) {
            console.error("Error changing password:", err);
            showToast(err.message || 'Error al cambiar la contraseña', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Volver */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 group"
                style={{ color: 'var(--text-muted)' }}
            >
                <div className="p-1.5 border transition-all" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] group-hover:text-[var(--color-primary)] transition-colors">
                    Volver
                </span>
            </button>

            {/* Header con avatar */}
            <div
                className="relative border p-6"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <AvatarUploader
                        userId={profile?.id}
                        initialUrl={avatarUrl}
                        fullName={fullName}
                        size={96}
                        onChange={(url) => setAvatarUrl(url)}
                        onError={(msg) => showToast(msg, 'error')}
                    />
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--text-muted)' }}>
                            — CPD-HUB-PRF-001
                        </div>
                        <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            Mi Perfil
                        </h1>
                        <p className="font-mono text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Gestioná tu información personal y seguridad de cuenta.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div
                    className="relative border p-6"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                    <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                        — CPD-HUB-PRF-INFO
                    </div>
                    <h3 className="font-display text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Shield className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                        Información Personal
                    </h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className={`${labelBase} flex items-center gap-2`}>
                                <Mail className="w-3 h-3" strokeWidth={2} /> Email (no editable)
                            </label>
                            <div
                                className="px-3 py-2.5 border font-mono text-sm cursor-not-allowed"
                                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                            >
                                {user?.email}
                            </div>
                        </div>

                        <div>
                            <label className={labelBase}>Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} strokeWidth={1.75} />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className={`${inputBase} pl-9`}
                                    placeholder="Tu nombre completo"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={`${labelBase} flex items-center gap-2`}>
                                    <Briefcase className="w-3 h-3" strokeWidth={2} /> Cargo / Puesto
                                </label>
                                <select
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className={inputBase}
                                >
                                    <option value="">— Seleccioná —</option>
                                    {JOB_TITLES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {jobTitle === 'OTRO' && (
                                    <input
                                        type="text"
                                        value={jobTitleOther}
                                        onChange={(e) => setJobTitleOther(e.target.value)}
                                        className={`${inputBase} mt-2`}
                                        placeholder="Especificá el cargo…"
                                        maxLength={60}
                                    />
                                )}
                            </div>
                            <div>
                                <label className={`${labelBase} flex items-center gap-2`}>
                                    <Phone className="w-3 h-3" strokeWidth={2} /> Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={inputBase}
                                    placeholder="+54 9..."
                                />
                            </div>
                        </div>

                        <div className="pt-3">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={isSavingProfile}
                                icon={isSavingProfile ? undefined : Save}
                            >
                                {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {isSavingProfile ? 'Guardando…' : 'Guardar Información'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Seguridad */}
                <div
                    className="relative border p-6 self-start"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                    <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                        — CPD-HUB-PRF-SEC
                    </div>
                    <h3 className="font-display text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Lock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} strokeWidth={1.75} />
                        Seguridad
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div
                            className="p-3 border-l-2"
                            style={{ background: 'var(--bg-base)', borderColor: 'var(--color-primary)' }}
                        >
                            <p className="font-mono text-[11px] leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                                Al cambiar tu contraseña se cerrarán todas las demás sesiones activas por seguridad.
                            </p>
                        </div>

                        <div>
                            <label className={labelBase}>Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} strokeWidth={1.75} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`${inputBase} pl-9`}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelBase}>Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} strokeWidth={1.75} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`${inputBase} pl-9`}
                                    placeholder="Repetí la contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-3">
                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full justify-center"
                                disabled={isChangingPassword || !newPassword}
                                icon={isChangingPassword ? undefined : Lock}
                            >
                                {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {isChangingPassword ? 'Actualizando…' : 'Cambiar Contraseña'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer info */}
            <div
                className="relative border p-5 text-center"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
                <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
                <p className="font-mono text-[11px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Estas credenciales son estrictamente personales. Cephalopod nunca te pedirá tu contraseña por mail o WhatsApp.
                </p>
            </div>
        </div>
    );
};

export default UserProfile;
