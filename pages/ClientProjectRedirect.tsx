import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';

const ClientProjectRedirect = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState({ count: 0 });

    useEffect(() => {
        const findProject = async () => {
            if (!supabase || !user) return;

            try {
                // Fetch all projects accessible to this user
                const { data: projects, error } = await supabase
                    .from('projects')
                    .select('*');

                if (error) throw error;

                setDebugInfo({ count: projects?.length || 0 });

                // Filter logic (Case Insensitive)
                const userEmail = user.email?.toLowerCase().trim() || '';

                const myProject = projects?.find((p: any) => {
                    const clientEmail = (p.team?.client_email || '').toLowerCase().trim();
                    if (clientEmail === userEmail) return true;

                    const contacts = p.team?.client_contacts || [];
                    if (Array.isArray(contacts)) {
                        return contacts.some((c: any) => (c.email || '').toLowerCase().trim() === userEmail);
                    }
                    return false;
                });

                if (myProject) {
                    // Found! Redirect to the Hub view
                    // We can reuse AdminProjectHub path but we need to ensure permissions allow it.
                    // Or we can render the view here. Redirect is cleaner URL-wise if we want deep linking.
                    // But if AdminProjectHub checks 'isAdmin', it will block.
                    // We need to unblock AdminProjectHub first.
                    navigate(`/hub/projects/${myProject.id}`);
                } else {
                    setError('No se encontró un proyecto asociado a tu cuenta. Contacta a tu consultor.');
                }

            } catch (err: any) {
                console.error("Error finding project:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        findProject();
    }, [user, navigate]);

    if (isLoading) return <div className="p-8 text-white text-center">Buscando tu proyecto...</div>;

    if (error) return (
        <div className="p-8 text-center max-w-lg mx-auto">
            <h2 className="text-xl text-red-400 mb-4 font-bold">No encontramos tu proyecto</h2>

            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-left space-y-2 mb-6">
                <p className="text-slate-400 text-xs uppercase font-bold">Diagnóstico:</p>
                <p className="text-slate-300 text-sm">Usuario actual: <span className="text-cyan-400 font-mono">{user?.email}</span></p>
                <p className="text-slate-300 text-sm">Proyectos cargados desde BD: <span className="text-white font-mono">{debugInfo.count}</span></p>
                {debugInfo.count > 0 && <p className="text-emerald-400 text-xs">¡La base de datos devolvió proyectos! (El problema está en el filtrado)</p>}
                {debugInfo.count === 0 && <p className="text-orange-400 text-xs">La base de datos NO devolvió proyectos. (El problema es permisos RLS o el email no coincide en BD)</p>}
            </div>

            <p className="text-slate-400 text-sm mb-6">{error}</p>

            <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded mr-4 transition">
                Reintentar
            </button>
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-300 ml-2">
                Volver al Inicio
            </button>
        </div>
    );

    return null;
};

export default ClientProjectRedirect;
