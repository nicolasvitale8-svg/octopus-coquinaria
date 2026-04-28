import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login — entry HUD/terminal · FASE 3
 * Refactor: paleta phosphor, corner brackets, mono labels, sharp corners.
 */

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setIsGoogleLoading(false);
      setErrorMessage('No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const target = e.currentTarget as HTMLFormElement;
    const email = (target.elements.namedItem('recovery-email') as HTMLInputElement).value;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      setErrorMessage('Error al enviar el email. Verificá que el email sea correcto.');
    } else {
      setSuccessMessage(`Se envió un email a ${email} con instrucciones para recuperar tu contraseña.`);
    }
  };

  // ----- Recovery view -----
  if (isRecoveryMode) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div
            className="relative p-8 border w-full max-w-md"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
            <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

            <button
              onClick={() => { setIsRecoveryMode(false); setErrorMessage(null); setSuccessMessage(null); }}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] text-xs font-mono uppercase tracking-[0.18em] mb-6 transition-colors"
            >
              <ArrowLeft size={14} /> Volver al login
            </button>

            <div className="text-center mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-primary)] mb-2">
                — Sistema · Recovery
              </div>
              <div
                className="w-14 h-14 border flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--color-primary)' }}
              >
                <Mail size={22} strokeWidth={1.75} />
              </div>
              <h1 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Recuperar contraseña
              </h1>
              <p className="font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] mt-2">
                Ingresá tu email y te enviamos un link para resetear.
              </p>
            </div>

            {errorMessage && (
              <div
                className="p-3 border text-xs text-center mb-4 font-mono"
                style={{ background: 'rgba(255, 77, 77, 0.10)', borderColor: 'rgba(255, 77, 77, 0.45)', color: 'var(--color-danger)' }}
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                className="p-4 border text-xs text-center mb-4 font-mono"
                style={{ background: 'rgba(0, 197, 125, 0.12)', borderColor: 'rgba(0, 197, 125, 0.45)', color: 'var(--color-success)' }}
              >
                {successMessage}
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handlePasswordRecovery} className="space-y-4">
                <Input
                  label="Email"
                  name="recovery-email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
                <Button fullWidth variant="primary" type="submit" disabled={isLoading} icon={isLoading ? Loader2 : undefined}>
                  {isLoading ? 'Enviando…' : 'Enviar link de recuperación'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <span>CPD-AUTH-RCV-001</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-1 w-1 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
                Online
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ----- Login view -----
  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div
          className="relative p-8 border w-full max-w-md"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <span aria-hidden="true" className="absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute top-0 right-0 w-3 h-3 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 left-0 w-3 h-3 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

          <div className="text-center mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-primary)] mb-2">
              — Sistema · Login
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Bienvenido de nuevo
            </h1>
            <p className="font-mono text-[11px] text-[var(--text-secondary)] mt-1">
              Ingresá a tu tablero de control.
            </p>
          </div>

          <div className="space-y-5 animate-fade-in">
            {errorMessage && (
              <div
                className="p-3 border text-xs text-center font-mono"
                style={{ background: 'rgba(255, 77, 77, 0.10)', borderColor: 'rgba(255, 77, 77, 0.45)', color: 'var(--color-danger)' }}
              >
                {errorMessage}
              </div>
            )}

            {/* Botón Google — blanco para reconocibilidad de marca */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-medium py-3 px-4 transition-colors border"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Conectando con Google…</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">o con email</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMessage(null);
                const target = e.currentTarget as HTMLFormElement;
                const email = (target.elements.namedItem('email') as HTMLInputElement).value;
                const password = (target.elements.namedItem('password') as HTMLInputElement).value;
                if (!supabase) return;
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                  setErrorMessage('Credenciales inválidas. Intentá nuevamente.');
                } else {
                  navigate('/dashboard');
                }
              }}
              className="space-y-4"
            >
              <Input label="Usuario (Email)" name="email" type="email" placeholder="admin@octopuscoquinaria.com" required />
              <Input label="Contraseña" name="password" type="password" placeholder="••••••••" required />
              <Button fullWidth variant="primary" type="submit">
                Ingresar al sistema
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsRecoveryMode(true)}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
            <span>CPD-AUTH-LGN-001</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-1 w-1 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} />
              Online
            </span>
          </div>

          <p className="mt-6 text-center font-mono text-[11px] text-[var(--text-muted)]">
            ¿No tenés cuenta?{' '}
            <Link to="/quick-diagnostic" className="text-[var(--color-primary)] hover:text-[var(--color-primary-soft)] transition-colors">
              Hacé un diagnóstico primero →
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
