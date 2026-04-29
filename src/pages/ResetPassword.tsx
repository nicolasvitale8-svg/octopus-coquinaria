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
                    <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
                </div>
            </Layout>
        );
    }

    if (!isValidSession) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center px-4">
                    <div className="bg-[var(--bg-base)] p-8 rounded-md border border-[var(--border-subtle)] shadow-2xl w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-[var(--color-danger)]" size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Link Inválido o Expirado</h1>
                        <p className="text-[var(--text-muted)] text-sm mb-6">
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
                    <div className="bg-[var(--bg-base)] p-8 rounded-md border border-[var(--border-subtle)] shadow-2xl w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-[var(--color-success)]" size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Contraseña Actualizada!</h1>
                        <p className="text-[var(--text-muted)] text-sm mb-4">
                            Tu contraseña fue cambiada exitosamente. Redirigiendo al login...
                        </p>
                        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="bg-[var(--bg-base)] p-8 rounded-md border border-[var(--border-subtle)] shadow-2xl w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-[var(--color-primary)]" size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nueva Contraseña</h1>
                        <p className="text-[var(--text-muted)] text-sm mt-2">Elegí una contraseña segura para tu cuenta.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 rounded-lg text-[var(--color-danger)] text-sm text-center mb-4">
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
                            className="bg-[var(--bg-base)] border-[var(--border-subtle)] focus:border-[var(--color-primary)]"
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="bg-[var(--bg-base)] border-[var(--border-subtle)] focus:border-[var(--color-primary)]"
                        />
                        <Button
                            fullWidth
                            variant="primary"
                            type="submit"
                            disabled={isLoading}
                            className="text-sm py-3 font-bold shadow-lg shadow-[var(--color-primary)]/20"
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
