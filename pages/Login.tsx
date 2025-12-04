
import React from 'react';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
            <p className="text-slate-400 text-sm">Ingresá a tu tablero de control.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="tu@email.com" />
            <Input label="Contraseña" type="password" placeholder="••••••••" />
            
            <Button type="submit" fullWidth className="mt-4">Ingresar</Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">O continuar con</span>
              </div>
            </div>

            <Button type="button" variant="outline" fullWidth onClick={() => navigate('/dashboard')}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.696  c0-3.159,2.702-5.696,6.033-5.696c1.482,0,2.615,0.699,3.561,1.584L18.845,5.49C17.151,3.972,14.93,3,12.545,3  c-5.186,0-9.39,4.204-9.39,9.39s4.204,9.39,9.39,9.39c4.953,0,8.73-3.489,8.73-8.875c0-0.729-0.081-1.397-0.18-2.022H12.545z"/></svg>
              Google
            </Button>
          </form>

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
