
import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '../services/supabase';

const Login = () => {
  const navigate = useNavigate();
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
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/dashboard`
                  }
                });
                if (error) setErrorMessage(error.message);
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.696  c0-3.159,2.702-5.696,6.033-5.696c1.482,0,2.615,0.699,3.561,1.584L18.845,5.49C17.151,3.972,14.93,3,12.545,3  c-5.186,0-9.39,4.204-9.39,9.39s4.204,9.39,9.39,9.39c4.953,0,8.73-3.489,8.73-8.875c0-0.729-0.081-1.397-0.18-2.022H12.545z" /></svg>
              Continuar con Google
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <Button
              variant="ghost"
              fullWidth
              className="text-xs text-slate-500 hover:text-cyan-400"
              onClick={async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                  navigate('/admin/leads');
                } else {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/#/admin/leads`  // Hash router support might need explicit hash, or Supabase handles origin. Safe with origin for strict redirect match, but let's try direct path or just origin + hash if supported. Ideally just origin/admin/leads if no hash router, but we have HashRouter..
                      // Supabase redirect URLs are strict. Usually just origin is whitelisted.
                      // Strategy: Redirect to dashboard (default) then let app route, OR redirect to a specific URL.
                      // If I put explicit redirect, it must be in Supabase allowed list.
                      // Safer bet: Redirect to origin (root) and use a query param 'next', or simply login to dashboard and let them click again.
                      // BETTER UX: Just start Google Login pointing to dashboard, assuming they are the admin.
                      // Actually, let's keep it simple: Trigger Login flow exactly like the main button but with intent.
                      // Since we can't easily valid dynamic redirects without config, let's just trigger the SAME login flow 
                      // but maybe show a message "Iniciá sesión con tu cuenta de Google".
                    }
                  });
                  // WAIT. If I use the exact same redirect as main logic (dashboard), they go to dashboard.
                  // If I want them to go to admin/leads, I need that URL allowed in Supabase.
                  // The user previously said redirect URLs were site URL.

                  // Let's TRY using the standard login flow but explain it.
                  // OR: Just call signInWithOAuth with redirectTo window.location.href (which is login? no).

                  // Let's use the same redirect as Dashboard for safety, but check user session first.
                  // If they are not logged in, we MUST log them in. 

                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}` } // Redirect to root, App checks auth -> Dashboard.
                  });
                }
              }}
            >
              <Shield className="w-3 h-3 mr-2" />
              Acceso Consultor
            </Button>
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
