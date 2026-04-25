import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  // Si la cuenta ya fue aprobada (rol distinto de 'user'), redirigir al home.
  useEffect(() => {
    if (!isLoading && profile && profile.role !== 'user') {
      navigate('/', { replace: true });
    }
  }, [isLoading, profile, navigate]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/');
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-amber-400" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Cuenta en revisión</h1>

          <p className="text-slate-400 text-sm mb-2">
            Tu cuenta <span className="text-cyan-400 font-medium">{user?.email}</span> fue creada
            correctamente, pero todavía está esperando la aprobación de un administrador.
          </p>

          <p className="text-slate-500 text-xs mb-8">
            Te vamos a avisar por email cuando puedas acceder al sistema. Si es urgente,
            contactanos por los canales habituales.
          </p>

          <Button fullWidth variant="secondary" onClick={handleLogout} className="text-sm py-3">
            <span className="flex items-center justify-center gap-2">
              <LogOut size={16} /> CERRAR SESIÓN
            </span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default PendingApproval;
