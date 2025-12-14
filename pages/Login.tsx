
import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { devLogin } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
            <p className="text-slate-400 text-sm">Ingresá a tu tablero de control.</p>
          </div>

          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm mb-4">
                El acceso administrativo está restringido a usuarios autorizados.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {errorMessage}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={async () => {
                setErrorMessage(null);
                if (!supabase) {
                  setErrorMessage("Error: Supabase no está configurado correctamente (Verificar constants.ts).");
                  return;
                }
                const { error } = await supabase!.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.protocol}//${window.location.host}/dashboard` // Ensure exact match
                  }
                });
                if (error) setErrorMessage(error.message);
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.696  c0-3.159,2.702-5.696,6.033-5.696c1.482,0,2.615,0.699,3.561,1.584L18.845,5.49C17.151,3.972,14.93,3,12.545,3  c-5.186,0-9.39,4.204-9.39,9.39s4.204,9.39,9.39,9.39c4.953,0,8.73-3.489,8.73-8.875c0-0.729-0.081-1.397-0.18-2.022H12.545z" /></svg>
              Continuar con Google
            </Button>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-white list-none flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Acceso con Credenciales
              </summary>
              <div className="mt-4 space-y-3 animate-fade-in">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setErrorMessage(null);
                  const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                  const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
                  if (!supabase) return;

                  const { error } = await supabase.auth.signInWithPassword({ email, password });
                  if (error) {
                    // Si falla login, intentamos registro (dev convenience)
                    if (error.message.includes("Invalid login")) {
                      setErrorMessage("Credenciales inválidas.");
                    } else {
                      setErrorMessage(error.message);
                    }
                  } else {
                    navigate('/dashboard');
                  }
                }} className="space-y-2">
                  <Input label="Email" name="email" type="email" placeholder="admin@octopus.com" required className="bg-slate-950" />
                  <Input label="Contraseña" name="password" type="password" placeholder="••••••••" required className="bg-slate-950" />
                  <Button fullWidth variant="primary" type="submit" className="text-sm py-2">
                    Ingresar
                  </Button>

                  {/* DEV MODE BYPASS - Always visible now for debugging */}

                  <div className="text-center">
                    <button type="button" onClick={async () => {
                      const email = prompt("Email para registro:");
                      const password = prompt("Password para registro:");
                      if (email && password && supabase) {
                        const { error } = await supabase.auth.signUp({ email, password });
                        if (error) alert(error.message);
                        else alert("Usuario creado! Revisa tu email o intenta loguearte (si auto-confirm off).");
                      }
                    }} className="text-[10px] text-slate-600 hover:text-slate-400 underline">
                      Crear cuenta (Dev)
                    </button>
                  </div>
                </form>
              </div>
            </details>
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
