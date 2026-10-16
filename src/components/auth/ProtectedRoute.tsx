import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  allowAdmin?: boolean;
  adminOnly?: boolean; // For hospital admin vs hospital staff
}

/**
 * Enterprise Role-Based Access Control (RBAC) Route Guard
 * Strict Invariants:
 * 1. Requires valid authenticated session (NEVER auto-provisions unauthenticated visitors).
 * 2. Unauthenticated requests are immediately redirected to /login with state preservation.
 * 3. Authenticated users with mismatched roles are redirected to /unauthorized (403 Forbidden).
 * 4. Suspended accounts are immediately blocked from protected services.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowAdmin = true,
  adminOnly = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated: Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Suspended Facility or Account Block
  if (user.verificationStatus === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldX className="w-7 h-7" />
          </div>
          <h2 className="font-poppins font-bold text-xl text-slate-900">
            Account Suspended
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your facility access (<strong>{user.orgName}</strong>) has been suspended by state medical administrators pending statutory audit.
          </p>
          <div className="pt-2">
            <a
              href="mailto:compliance@sevasetu.org"
              className="inline-block px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Contact State Health Registry
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Role Authorization
  const hasRoleMatch = allowedRoles.includes(user.role);
  const isAdminPermitted = allowAdmin && user.role === 'admin';

  if (!hasRoleMatch && !isAdminPermitted) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: allowedRoles[0],
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // 4. Hospital Admin-Only Restriction (Staff cannot access /hospital/staff)
  if (adminOnly && user.role === 'hospital_staff') {
    return <Navigate to="/hospital/staff/dashboard" replace />;
  }

  return <>{children}</>;
};
