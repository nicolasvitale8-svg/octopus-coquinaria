import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

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
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setIsGoogleLoading(false);
      setErrorMessage('No se pudo iniciar sesión con Google. Intentá de nuevo.');
    }
    // Si no hay error, el browser redirige a Google y esta página se descarta.
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

  if (isRecoveryMode) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
            <button
              onClick={() => { setIsRecoveryMode(false); setErrorMessage(null); setSuccessMessage(null); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft size={16} /> Volver al login
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-cyan-400" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
              <p className="text-slate-400 text-sm mt-2">Ingresá tu email y te enviamos un link para resetear tu contraseña.</p>
            </div>
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center mb-4">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm text-center mb-4">
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
                      <Loader2 className="animate-spin" size={16} /> Enviando...
                    </span>
                  ) : (
                    'ENVIAR LINK DE RECUPERACIÓN'
                  )}
                </Button>
              </form>
            )}
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
            <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
            <p className="text-slate-400 text-sm">Ingresá a tu tablero de control.</p>
          </div>

          <div className="space-y-6 animate-fade-in">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {errorMessage}
              </div>
            )}

            {/* Botón Continuar con Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Conectando con Google...</span>
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
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-xs">o con email</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage(null);
              const target = e.currentTarget as HTMLFormElement;
              const email = (target.elements.namedItem('email') as HTMLInputElement).value;
              const password = (target.elements.namedItem('password') as HTMLInputElement).value;

              if (!supabase) return;

              const { error } = await supabase.auth.signInWithPassword({ email, password });

              if (error) {
                setErrorMessage("Credenciales inválidas. Intente nuevamente.");
              } else {
                navigate('/dashboard');
              }
            }} className="space-y-4">
              <Input
                label="Usuario (Email)"
                name="email"
                type="email"
                placeholder="admin@octopus.com"
                required
                className="bg-slate-950 border-slate-700 focus:border-[#1FB6D5]"
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-slate-950 border-slate-700 focus:border-[#1FB6D5]"
              />
              <Button fullWidth variant="primary" type="submit" className="text-sm py-3 font-bold shadow-lg shadow-[#1FB6D5]/20">
                INGRESAR AL SISTEMA
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsRecoveryMode(true)}
                className="text-cyan-400 hover:text-cyan-300 text-sm hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-400">
            ¿No tenés cuenta? <Link to="/quick-diagnostic" className="text-cyan-400 hover:underline">Hacé un diagnóstico primero</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
