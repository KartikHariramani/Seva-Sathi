import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Strict Route Guard for State Medical Administration Command Center
 * Strict Invariant:
 * Only users authenticated with the 'admin' role may access.
 * Unauthenticated users are redirected to /login.
 * Authenticated users with other roles are redirected to /unauthorized.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { setSession } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === 'admin') {
      setSession('admin', user.email, user.orgName);
    }
  }, [user, setSession]);

  // 1. Unauthenticated: Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Check: Strictly Admin
  if (user.role !== 'admin') {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: 'admin',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};
