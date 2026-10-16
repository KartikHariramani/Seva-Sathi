import React from 'react';
import { ProtectedRoute } from '../auth/ProtectedRoute';

interface DonorRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard for Donor Portal
 * Grants access to registered blood donors and system administrators.
 * Rejects unauthenticated users and redirects to /login.
 */
export const DonorRouteGuard: React.FC<DonorRouteGuardProps> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['donor']} allowAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};
