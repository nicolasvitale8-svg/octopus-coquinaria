import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Save, AlertCircle, CheckCircle2, Loader2, Phone, Briefcase, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState(profile?.name || '');
    const [jobTitle, setJobTitle] = useState(profile?.job_title || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.name || '');
            // We need to fetch the extra fields since AuthContext only has basic profile
            fetchExtendedProfile();
        }
    }, [profile]);

    const fetchExtendedProfile = async () => {
        if (!profile?.id || !supabase) return;
        const { data } = await supabase
            .from('usuarios')
            .select('job_title, phone')
            .eq('id', profile.id)
            .single();

        if (data) {
            setJobTitle(data.job_title || '');
            setPhone(data.phone || '');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase || !profile?.id) return;

        setIsSavingProfile(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('usuarios')
                .update({
                    full_name: fullName,
                    job_title: jobTitle,
                    phone: phone
                })
                .eq('id', profile.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente. Recarga la página para ver los cambios en el menú.' });
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setMessage({ type: 'error', text: err.message || 'Error al actualizar el perfil' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        setIsChangingPassword(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: 'success', text: 'Contraseña actualizada con éxito' });
        } catch (err: any) {
            console.error("Error changing password:", err);
            setMessage({ type: 'error', text: err.message || 'Error al cambiar la contraseña' });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative pb-12">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group mb-2"
            >
                <div className="p-2 rounded-full bg-[var(--bg-surface)]/50 group-hover:bg-[var(--bg-surface)]">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Volver</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-[var(--color-primary)]/10 rounded-md border border-[var(--color-primary)]/20">
                    <User className="w-8 h-8 text-[var(--color-primary)]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] font-space tracking-tight">Mi Perfil</h1>
                    <p className="text-[var(--text-muted)]">Gestiona tu información personal y seguridad de cuenta.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-md flex items-center gap-3 border animate-shake ${message.type === 'success'
                    ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]'
                    : 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-3xl p-8 backdrop-blur-sm self-start shadow-xl">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[var(--color-primary)]" /> Información Personal
                    </h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" /> Email (No editable)
                            </label>
                            <div className="w-full bg-[var(--bg-base)]/50 border border-[var(--border-subtle)]/50 text-[var(--text-muted)] rounded-md px-4 py-3 text-sm cursor-not-allowed font-mono">
                                {user?.email}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md pl-12 pr-4 py-3 text-sm focus:border-[var(--color-primary)] outline-none transition-all"
                                    placeholder="Tu nombre completo"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Cargo / Puesto</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md pl-12 pr-4 py-3 text-sm focus:border-[var(--color-primary)] outline-none transition-all"
                                        placeholder="Ej: Auditor"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md pl-12 pr-4 py-3 text-sm focus:border-[var(--color-primary)] outline-none transition-all"
                                        placeholder="+54 9..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center group"
                                disabled={isSavingProfile}
                            >
                                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {isSavingProfile ? 'Guardando...' : 'Guardar Información'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Security Section */}
                <div className="bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] rounded-3xl p-8 backdrop-blur-sm self-start shadow-xl">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[var(--color-primary)]" /> Seguridad
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-5">
                        <div className="bg-[var(--color-primary)]/5 border border-purple-500/10 p-4 rounded-md mb-2">
                            <p className="text-xs text-[var(--color-primary)]/80 leading-relaxed italic">
                                Al cambiar tu contraseña, se cerrarán todas las demás sesiones activas por seguridad.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
                                    placeholder="Repite la contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full justify-center border-[rgba(0,255,157,0.30)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 group"
                                disabled={isChangingPassword || !newPassword}
                            >
                                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 border border-[var(--border-subtle)] rounded-3xl text-center">
                <p className="text-[var(--text-muted)] text-sm">
                    Recuerda que estas credenciales son estrictamente personales. Cephalopod nunca te pedirá tu contraseña por mail o WahtsApp.
                </p>
            </div>
        </div>
    );
};

export default UserProfile;
