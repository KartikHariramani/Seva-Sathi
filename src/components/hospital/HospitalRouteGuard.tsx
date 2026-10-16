import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock } from 'lucide-react';

interface HospitalRouteGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Role-aware route guard for Hospital Portal routes
 * Strict Invariant:
 * Requires authenticated session. Redirects unauthenticated visitors to /login.
 * Restricts cross-role access: only hospital and hospital_staff accounts permitted.
 */
export const HospitalRouteGuard: React.FC<HospitalRouteGuardProps> = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated: Redirect to login immediately
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
          requiredRole: 'hospital',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // 3. Role Authorization: must be hospital or hospital_staff (or admin)
  const isHospitalRole = user.role === 'hospital' || user.role === 'hospital_staff';
  const isAdmin = user.role === 'admin';

  if (!isHospitalRole && !isAdmin) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          requiredRole: 'hospital',
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // 4. Staff restriction: staff cannot access admin-only hospital routes (e.g., /hospital/staff)
  if (adminOnly && user.role === 'hospital_staff') {
    return <Navigate to="/hospital/staff/dashboard" replace />;
  }

  // 5. Unverified hospital restriction: cannot create network blood requests
  if (location.pathname === '/hospital/requests/new' && user.verificationStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-2xl p-6 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="font-poppins font-bold text-lg text-slate-900">
            Network Blood Requisitions Restricted
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your hospital facility is currently <strong>PENDING ADMINISTRATIVE VERIFICATION</strong>.
            State network administrators must verify your statutory license before you can place external blood requisitions.
          </p>
          <a
            href="/hospital/dashboard"
            className="inline-block text-xs font-semibold text-[#1E4C8A] hover:underline"
          >
            &larr; Return to Hospital Command Center
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
