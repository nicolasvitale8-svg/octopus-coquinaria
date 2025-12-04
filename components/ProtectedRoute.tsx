import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

// TODO: REEMPLAZAR CON TU EMAIL REAL
const ALLOWED_EMAILS = ['nicolasvitale8@gmail.com'];

const ProtectedRoute = () => {
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
            const email = data?.session?.user?.email;

            if (email && ALLOWED_EMAILS.includes(email)) {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
            }
            setLoading(false);
        };

        checkUser();

        if (!supabase) return;

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            const email = session?.user?.email;
            if (email && ALLOWED_EMAILS.includes(email)) {
                setIsAllowed(true);
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
