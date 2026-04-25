import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { logger } from '../services/logger';

/**
 * Banner de bienvenida que se muestra UNA VEZ después de que un admin aprueba
 * la cuenta de un usuario (le cambia el rol de 'user' a otro).
 *
 * Lógica:
 *  - Si profile.role === 'user' → la cuenta sigue pendiente, no mostrar nada.
 *  - Si welcomed_at !== null → ya lo vio, no mostrar nada.
 *  - Si welcomed_at === null y role !== 'user' → primer login post-aprobación, mostrar banner.
 *  - Al dismiss (o al montar exitoso): UPDATE usuarios SET welcomed_at = now() WHERE id = profile.id.
 */
const WelcomeBanner: React.FC = () => {
    const { profile } = useAuth();
    const [show, setShow] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!supabase || !profile?.id) {
                setChecking(false);
                return;
            }
            // Si el rol es 'user' (pendiente), el ProtectedRoute ya redirige a /pending-approval,
            // así que en teoría nunca llegamos acá con role='user'. Igual chequeamos por defensa.
            if (profile.role === 'user') {
                setChecking(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('welcomed_at')
                    .eq('id', profile.id)
                    .single();

                if (cancelled) return;

                if (error) {
                    logger.warn('No se pudo leer welcomed_at', { context: 'WelcomeBanner', data: error });
                    setChecking(false);
                    return;
                }

                if (data && data.welcomed_at === null) {
                    setShow(true);
                }
            } catch (err) {
                logger.warn('Error consultando welcomed_at', { context: 'WelcomeBanner', data: err });
            } finally {
                if (!cancelled) setChecking(false);
            }
        };

        check();
        return () => { cancelled = true; };
    }, [profile?.id, profile?.role]);

    const dismiss = async () => {
        setShow(false);
        if (!supabase || !profile?.id) return;
        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ welcomed_at: new Date().toISOString() })
                .eq('id', profile.id);
            if (error) {
                logger.warn('No se pudo marcar welcomed_at', { context: 'WelcomeBanner', data: error });
            }
        } catch (err) {
            logger.warn('Error actualizando welcomed_at', { context: 'WelcomeBanner', data: err });
        }
    };

    if (checking || !show || !profile) return null;

    const firstName = (profile.name || '').split(' ')[0] || 'Bienvenido';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div
                role="status"
                className="relative bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/40 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-emerald-500/5"
            >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex-grow min-w-0 pr-8">
                    <h3 className="text-emerald-200 font-semibold text-base mb-1">
                        ¡Bienvenido a Octopus Coquinaria, {firstName}!
                    </h3>
                    <p className="text-sm text-emerald-100/80 leading-relaxed">
                        Tu cuenta ya fue activada. Ya tenés acceso al sistema según tu rol asignado.
                        Si tenés dudas, contactanos por los canales habituales.
                    </p>
                </div>
                <button
                    onClick={dismiss}
                    aria-label="Cerrar mensaje de bienvenida"
                    className="absolute top-3 right-3 p-1 rounded-md text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeBanner;
