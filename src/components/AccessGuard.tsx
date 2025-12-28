import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';

interface AccessGuardProps {
    permission?: Permission;
    role?: string;
    requireAdmin?: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const AccessGuard: React.FC<AccessGuardProps> = ({
    permission,
    role,
    requireAdmin,
    children,
    fallback = null
}) => {
    const { user, profile, hasPermission, isAdmin } = useAuth();

    if (!user) return <>{fallback}</>;

    // 1. Admin Override
    if (isAdmin) return <>{children}</>;

    // 2. Specific Role Check
    if (requireAdmin && !isAdmin) return <>{fallback}</>;
    if (role && profile?.role !== role) return <>{fallback}</>;

    // 3. Granular Permission Check
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default AccessGuard;
