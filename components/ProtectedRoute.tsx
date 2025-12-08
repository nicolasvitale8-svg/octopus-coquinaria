import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Email del administrador
const ADMIN_EMAIL = 'nicolasvitale8@gmail.com';

interface ProtectedRouteProps {
    allowedEmails?: string[];
}

const ProtectedRoute = ({ allowedEmails }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const [isTimeout, setIsTimeout] = useState(false);

    // Timeout safety for AuthContext loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) setIsTimeout(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    if (isLoading && !isTimeout) {
        return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedEmails && allowedEmails.length > 0) {
        if (!allowedEmails.includes(user.email || '')) {
            return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
