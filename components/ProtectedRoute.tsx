import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Email del administrador
const ADMIN_EMAIL = 'nicolasvitale8@gmail.com';

interface ProtectedRouteProps {
    allowedEmails?: string[];
}

const ProtectedRoute = ({ allowedEmails }: ProtectedRouteProps) => {
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const checkUser = async () => {
            if (!supabase) return;
            const { data } = await supabase.auth.getSession();
            const user = data?.session?.user;

            if (user) {
                if (allowedEmails && allowedEmails.length > 0) {
                    setIsAllowed(allowedEmails.includes(user.email || ''));
                } else {
                    setIsAllowed(true);
                }
            } else {
                setIsAllowed(false);
            }
            setLoading(false);
        };

        checkUser();

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user;
            if (user) {
                if (allowedEmails && allowedEmails.length > 0) {
                    setIsAllowed(allowedEmails.includes(user.email || ''));
                } else {
                    setIsAllowed(true);
                }
            } else {
                setIsAllowed(false);
            }
            setLoading(false);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    }

    return isAllowed ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
