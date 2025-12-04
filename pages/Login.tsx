
import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '../services/supabase';

const Login = () => {
  const navigate = useNavigate();

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

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={async () => {
                if (!supabase) {
                  alert("Error: Supabase no está configurado correctamente.");
                  return;
                }
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/dashboard`
                  }
                });
                if (error) alert(error.message);
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
              onClick={() => navigate('/admin/leads')}
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
