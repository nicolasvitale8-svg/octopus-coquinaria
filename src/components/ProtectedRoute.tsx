import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Email del administrador
const ADMIN_EMAIL = 'nicolasvitale8@gmail.com';

interface ProtectedRouteProps {
  allowedEmails?: string[];
  requireAdmin?: boolean;
  requirePrivileged?: boolean;
  /**
   * Bloquea usuarios autenticados que todavia no tienen un rol valido
   * (admin / consultant / manager / client). Los manda a /pending-approval.
   * El owner (ADMIN_EMAIL) pasa siempre por su isAdmin hardcoded.
   */
  requireApproved?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute = ({
  allowedEmails,
  requireAdmin,
  requirePrivileged,
  requireApproved,
  children,
}: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin, isConsultant, isManager, isClient, isPrivileged } = useAuth();
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

  // Gate "cuenta aprobada": user autenticado sin rol valido -> pending-approval
  if (requireApproved) {
    const hasValidRole = isAdmin || isConsultant || isManager || isClient;
    if (!hasValidRole) {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // Role Check - Admin only
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Role Check - Admin or Consultant
  if (requirePrivileged && !isPrivileged) {
    return <Navigate to="/" replace />;
  }

  if (allowedEmails && allowedEmails.length > 0) {
    if (!allowedEmails.includes(user.email || '')) {
      return <Navigate to="/login" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
