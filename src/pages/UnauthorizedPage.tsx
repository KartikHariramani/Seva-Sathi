import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract attempted URL and required role from location state if provided
  const state = (location.state as { from?: { pathname?: string }; requiredRole?: string; attemptedPath?: string }) || {};
  const attemptedPath = state.attemptedPath || state.from?.pathname || location.pathname;
  const requiredRole = state.requiredRole;

  const getAuthorizedHome = (role?: UserRole): string => {
    switch (role) {
      case 'hospital':
        return '/hospital/dashboard';
      case 'hospital_staff':
        return '/hospital/staff/dashboard';
      case 'blood_bank':
        return '/blood-bank/dashboard';
      case 'admin':
        return '/admin/command-center';
      case 'ngo':
        return '/ngo/campaigns';
      case 'donor':
        return '/donor/portal';
      default:
        return '/login';
    }
  };

  const getRoleDisplayName = (role?: string): string => {
    switch (role) {
      case 'hospital':
        return 'Hospital Administrator';
      case 'hospital_staff':
        return 'Hospital Staff Officer';
      case 'blood_bank':
        return 'Blood Bank Operations';
      case 'admin':
        return 'State Medical Administrator';
      case 'ngo':
        return 'NSS Organization Coordinator';
      case 'donor':
        return 'Registered Blood Donor';
      default:
        return 'Unauthenticated User';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 font-inter">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Heading & Subheading */}
        <div>
          <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-[#C1272D] uppercase px-2.5 py-1 rounded bg-rose-50 border border-rose-200 mb-2">
            403 FORBIDDEN — RBAC VIOLATION
          </span>
          <h1 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight">
            Restricted Service Access
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your current account credentials do not grant authorization to view this protected resource.
          </p>
        </div>

        {/* Security Context Ledger */}
        <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">YOUR ROLE:</span>
            <span className="font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
              {user ? getRoleDisplayName(user.role) : 'ANONYMOUS'}
            </span>
          </div>

          {requiredRole && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">REQUIRED ROLE:</span>
              <span className="font-bold text-rose-700 uppercase px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                {getRoleDisplayName(requiredRole)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500">REQUESTED URL:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={attemptedPath}>
              {attemptedPath}
            </span>
          </div>
        </div>

        {/* Safety Note */}
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-left flex items-start gap-2.5 text-[11px] text-blue-900">
          <Lock className="w-4 h-4 text-[#1E4C8A] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            SevaSetu enforces strict multi-tenant role isolation. Sensitive blood stock reserves and clinical patient requisitions remain isolated to authorized facilities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {user ? (
            <Link
              to={getAuthorizedHome(user.role)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Your Authorized Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <span>Log In with Authorized Account</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )}

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-500 pt-1">
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
            <span>&bull;</span>
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Public Homepage
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
