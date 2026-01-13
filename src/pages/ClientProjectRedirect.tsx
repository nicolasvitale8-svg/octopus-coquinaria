import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import { MessageCircle, Rocket, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { logger } from '../services/logger';

const ClientProjectRedirect = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState<{ count: number, projects: any[] }>({ count: 0, projects: [] });

    useEffect(() => {
        const findProject = async () => {
            if (!supabase || !user) return;

            try {
                // First, try to find project via project_members (preferred method)
                const { data: memberships, error: memberError } = await supabase
                    .from('project_members')
                    .select('project_id, projects(*)')
                    .eq('user_id', user.id);

                if (!memberError && memberships && memberships.length > 0) {
                    // User has project membership - redirect to first project
                    const firstProject = memberships[0]?.projects;
                    if (firstProject) {
                        logger.debug('Found project via membership', { context: 'ClientProjectRedirect', data: firstProject });
                        navigate(`/hub/projects/${(firstProject as any).id}`);
                        return;
                    }
                }

                // Fallback: Legacy search via team.client_email field
                const { data: projects, error } = await supabase
                    .from('projects')
                    .select('*');

                if (error) throw error;

                setDebugInfo({
                    count: projects?.length || 0,
                    projects: projects || []
                });

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
                    navigate(`/hub/projects/${myProject.id}`);
                } else {
                    setError('PENDING_PROJECT');
                }

            } catch (err: unknown) {
                const error = err as Error;
                logger.error('Error finding project', { context: 'ClientProjectRedirect', data: error });
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        findProject();
    }, [user, navigate]);

    const getWhatsappLink = () => {
        const message = `Hola Octopus 🐙. Soy ${profile?.name || user?.email}.\n\n` +
            `Ya registré mi cuenta en la plataforma y me gustaría saber cómo activar mi proyecto personalizado y comenzar la consultoría.`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#021019] flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-[#1FB6D5] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium animate-pulse">Buscando tu proyecto personalizado...</p>
        </div>
    );

    if (error === 'PENDING_PROJECT') return (
        <div className="min-h-screen bg-[#021019] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-8 animate-fade-in">

                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-cyan-950/30 text-cyan-400 mb-2">
                    <Rocket className="w-10 h-10" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-white font-space">¡Hola {profile?.name || 'Gastronómico'}!</h2>
                    <p className="text-lg text-slate-400 max-w-sm mx-auto">
                        Tu proyecto se activará una vez que comiences tu ciclo de consultoría profesional con <span className="text-white font-bold">Octopus Coquinaria</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-left bg-slate-950/50 p-6 rounded-xl border border-slate-800/80">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-white">Módulo Exclusivo</p>
                            <p className="text-xs text-slate-500">Acceso a hitos, cronograma, archivos críticos y comunicación directa con tu consultor.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <a href={getWhatsappLink()} target="_blank" rel="noreferrer" className="w-full">
                        <Button className="w-full justify-center py-4 bg-[#1FA77A] hover:bg-[#15805d] text-white font-bold text-lg shadow-xl shadow-green-900/10 border-0">
                            <MessageCircle className="w-5 h-5 mr-2" /> Quiero activar mi proyecto
                        </Button>
                    </a>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium py-2"
                    >
                        Volver al Tablero <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return null;
};

export default ClientProjectRedirect;
