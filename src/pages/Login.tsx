
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

          <div className="space-y-6 animate-fade-in">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {errorMessage}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage(null);
              const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
              const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
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

            <div className="text-center pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">¿Primera vez?</p>
              <button type="button" onClick={async () => {
                const email = prompt("Ingrese email para Alta de Admin:");
                const password = prompt("Ingrese contraseña deseada:");
                if (email && password && supabase) {
                  const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                      data: { full_name: 'Admin Inicial' } // Metadata básica
                    }
                  });
                  if (error) alert("Error: " + error.message);
                  else alert("Usuario creado. Por favor confirme su email si es necesario, o intente loguearse.");
                }
              }} className="text-xs text-[#1FB6D5] hover:text-white underline">
                Alta de Usuario (Solo Setup)
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
