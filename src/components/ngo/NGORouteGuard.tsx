import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NGORouteGuardProps {
  children: React.ReactNode;
}

/**
 * Strict Route Guard for NSS Organization & Volunteer Coordinators
 * Strict Invariant:
 * Only users authenticated with 'ngo' (or 'admin') may access.
 * Unauthenticated users are redirected to /login.
 * Users with other roles (donor, hospital, blood_bank) are redirected to /unauthorized.
 */
export const NGORouteGuard: React.FC<NGORouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated: Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Check: Strictly ngo or admin
  if (user.role !== 'ngo' && user.role !== 'admin') {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: 'ngo',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};
