import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Save, AlertCircle, CheckCircle2, Loader2, Phone, Briefcase, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';

const UserProfile = () => {
    const { profile, user } = useAuth();
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
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                    <User className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white font-space tracking-tight">Mi Perfil</h1>
                    <p className="text-slate-400">Gestiona tu información personal y seguridad de cuenta.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border animate-shake ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm self-start shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-cyan-400" /> Información Personal
                    </h3>

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" /> Email (No editable)
                            </label>
                            <div className="w-full bg-slate-950/50 border border-slate-800/50 text-slate-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed font-mono">
                                {user?.email}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                                    placeholder="Tu nombre completo"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo / Puesto</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                                        placeholder="Ej: Auditor"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
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
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm self-start shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-purple-400" /> Seguridad
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-5">
                        <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl mb-2">
                            <p className="text-xs text-purple-300/80 leading-relaxed italic">
                                Al cambiar tu contraseña, se cerrarán todas las demás sesiones activas por seguridad.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
                                    placeholder="Repite la contraseña"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full justify-center border-purple-500/30 text-purple-400 hover:bg-purple-500/10 group"
                                disabled={isChangingPassword || !newPassword}
                            >
                                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                {isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="p-8 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-3xl text-center">
                <p className="text-slate-500 text-sm">
                    Recuerda que estas credenciales son estrictamente personales. Octopus Coquinaria nunca te pedirá tu contraseña por mail o WahtsApp.
                </p>
            </div>
        </div>
    );
};

export default UserProfile;
