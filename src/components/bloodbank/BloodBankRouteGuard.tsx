import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface BloodBankRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Strict Route Guard for Blood Bank Operations
 * Strict Invariant:
 * Only users authenticated with 'blood_bank' (or 'admin') may access.
 * Unauthenticated users are redirected to /login.
 * Users with other roles (hospital, donor, ngo) are redirected to /unauthorized.
 */
export const BloodBankRouteGuard: React.FC<BloodBankRouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated: Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Suspended Facility Check
  if (user.verificationStatus === 'SUSPENDED') {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: 'blood_bank',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // 3. Role Check: Strictly blood_bank or admin
  if (user.role !== 'blood_bank' && user.role !== 'admin') {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: 'blood_bank',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};
