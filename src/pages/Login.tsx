
import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

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
