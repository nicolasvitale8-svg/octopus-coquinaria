import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if we have a valid recovery session
        const checkSession = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
        };
        checkSession();

        // Listen for auth changes (recovery link triggers this)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        setIsLoading(false);

        if (error) {
            setError('Error al actualizar la contraseña. Intentá nuevamente.');
        } else {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
    };

    if (isValidSession === null) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                </div>
            </Layout>
        );
    }

    if (!isValidSession) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center px-4">
                    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-400" size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Link Inválido o Expirado</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            El link de recuperación ha expirado o no es válido. Por favor solicitá uno nuevo.
                        </p>
                        <Button onClick={() => navigate('/login')} variant="primary" fullWidth>
                            Volver al Login
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (success) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center px-4">
                    <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-emerald-400" size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">¡Contraseña Actualizada!</h1>
                        <p className="text-slate-400 text-sm mb-4">
                            Tu contraseña fue cambiada exitosamente. Redirigiendo al login...
                        </p>
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-cyan-400" size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
                        <p className="text-slate-400 text-sm mt-2">Elegí una contraseña segura para tu cuenta.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="bg-slate-950 border-slate-700 focus:border-[#1FB6D5]"
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="bg-slate-950 border-slate-700 focus:border-[#1FB6D5]"
                        />
                        <Button
                            fullWidth
                            variant="primary"
                            type="submit"
                            disabled={isLoading}
                            className="text-sm py-3 font-bold shadow-lg shadow-[#1FB6D5]/20"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={16} /> Guardando...
                                </span>
                            ) : (
                                'GUARDAR NUEVA CONTRASEÑA'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default ResetPassword;
