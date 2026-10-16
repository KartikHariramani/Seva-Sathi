import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRegistration } from '../../context/RegistrationContext';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { useHospitalRequests } from '../../hooks/useHospitalRequests';
import {
  LayoutDashboard,
  Boxes,
  GitPullRequest,
  LineChart,
  PlusCircle,
  FileText,
  Scale,
  Flame,
  Menu,
  X,
  CheckCircle2,
  Bell,
  Users,
  Globe,
  Clock,
  UploadCloud,
} from 'lucide-react';

interface HospitalLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const HospitalLayout: React.FC<HospitalLayoutProps> = ({ children, pageTitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data } = useRegistration();
  const { toast, dismissToast } = useHospitalInventory();
  const { activeRequestsCount } = useHospitalRequests();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active hospital organization name & ID
  const orgName = data.organizationName || user?.orgName || 'XYZ Hospital';
  const orgId = data.organizationId || user?.orgId || 'HSP-00124';
  const isStaff = user?.role === 'hospital_staff';

  const navItems = [
    {
      label: 'Overview',
      path: isStaff ? '/hospital/staff/dashboard' : '/hospital/dashboard',
      icon: LayoutDashboard,
      enabled: true,
    },
    {
      label: 'Live Network',
      path: '/hospital/network',
      icon: Globe,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/network'),
    },
    {
      label: 'Near-Expiry Rescue',
      path: '/hospital/near-expiry',
      icon: Clock,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/near-expiry'),
    },
    {
      label: 'Smart Import',
      path: '/hospital/inventory/import',
      icon: UploadCloud,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/inventory/import'),
    },
    { label: 'Inventory', path: '/hospital/inventory', icon: Boxes, enabled: true },
    {
      label: 'Record Issue',
      path: '/hospital/usage/new',
      icon: PlusCircle,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/usage'),
    },
    {
      label: 'Requests',
      path: '/hospital/requests',
      icon: GitPullRequest,
      enabled: true,
      count: activeRequestsCount,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/requests'),
    },
    {
      label: 'Predictions',
      path: '/hospital/predictions',
      icon: LineChart,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/predictions'),
    },
    {
      label: 'Ledger History',
      path: '/hospital/transactions',
      icon: FileText,
      enabled: true,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/transactions'),
    },
    {
      label: 'Staff Management',
      path: '/hospital/staff',
      icon: Users,
      enabled: !isStaff,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/staff'),
    },
    {
      label: 'Reconciliation',
      path: '/hospital/inventory/reconciliation',
      icon: Scale,
      enabled: !isStaff,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/inventory/reconciliation'),
    },
    {
      label: 'Usage Analytics',
      path: '/hospital/analytics/usage',
      icon: Flame,
      enabled: !isStaff,
      activeMatch: (pathname: string) => pathname.startsWith('/hospital/analytics'),
    },
  ];

  const handleLogout = () => {
    sessionStorage.setItem('raktsetu_explicit_logout', 'true');
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#0F172A] font-inter">
      {/* 1. DESKTOP SIDEBAR (~240px wide per Section 5) */}
      <aside className="hidden md:flex w-60 bg-white border-r border-[#E2E8F0] flex-col justify-between p-4 sticky top-0 h-screen z-20 shrink-0">
        <div>
          {/* Logo & Brand Header */}
          <Link
            to="/"
            className="flex items-center gap-2.5 px-2 py-3 mb-6 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C1272D] rounded"
          >
            <div className="w-7 h-7 rounded-lg bg-[#C1272D] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path
                  d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                  fill="currentColor"
                />
                <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-poppins font-bold text-lg tracking-tight text-[#0F172A] leading-tight flex items-center gap-1.5">
                SevaSetu
              </span>
              <span className="text-[10px] font-mono text-[#1E4C8A]">Coordination Hub</span>
            </div>
          </Link>

          {/* Navigation Items (Section 6) */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.enabled &&
                (item.activeMatch
                  ? item.activeMatch(location.pathname)
                  : location.pathname === item.path);

              if (!item.enabled) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 select-none opacity-60 cursor-not-allowed rounded-md"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-red-50 text-[#C1272D] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C1272D]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-[#C1272D] text-white">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Info (Section 6) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="px-2 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-[#0F172A] truncate max-w-[130px]">
                {orgName}
              </span>
              {user?.verificationStatus === 'PENDING' ? (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-bold">
                  Pending
                </span>
              ) : user?.verificationStatus === 'SUSPENDED' ? (
                <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-bold">
                  Suspended
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-400 block mb-2">
              {orgId}
            </span>

            {/* Small network indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Network connected</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2 text-[11px] text-slate-400">
            <Link to="/" className="hover:text-slate-700">
              Public site &rarr;
            </Link>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP NAVIGATION BAR */}
      <header className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#C1272D] flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <path
                d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="font-poppins font-bold text-base text-[#0F172A]">SevaSetu</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Connected</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-4 space-y-2 z-30 shadow-subtle">
          <div className="pb-2 border-b border-slate-100">
            <span className="font-semibold text-sm text-[#0F172A] block">{orgName}</span>
            <span className="text-xs font-mono text-slate-400">{orgId} &bull; Verified</span>
          </div>

          <nav className="space-y-1 pt-1">
            <Link
              to="/hospital/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/hospital/dashboard'
                  ? 'bg-red-50 text-[#C1272D] font-semibold'
                  : 'text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </Link>

            <Link
              to="/hospital/inventory"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/hospital/inventory'
                  ? 'bg-red-50 text-[#C1272D] font-semibold'
                  : 'text-slate-700'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Inventory</span>
            </Link>

            <Link
              to="/hospital/requests"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname.startsWith('/hospital/requests')
                  ? 'bg-red-50 text-[#C1272D] font-semibold'
                  : 'text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <GitPullRequest className="w-4 h-4" />
                <span>Requests</span>
              </div>
              {activeRequestsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-[#C1272D] text-white">
                  {activeRequestsCount}
                </span>
              )}
            </Link>

            <Link
              to="/hospital/predictions"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname.startsWith('/hospital/predictions')
                  ? 'bg-red-50 text-[#C1272D] font-semibold'
                  : 'text-slate-700'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Predictions</span>
            </Link>
          </nav>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA (max-w-[1400px]) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Section 7) */}
        <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 md:static z-10 shadow-xs">
          <div>
            <h1 className="font-poppins font-semibold text-lg text-[#0F172A]">
              {pageTitle}
            </h1>
            <p className="text-xs text-[#64748B] font-mono">
              {orgName} &bull; {orgId}
            </p>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Network Connected</span>
            </div>

            {/* Notification bell icon */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0F2E5A] text-white flex items-center justify-center text-xs font-mono font-bold">
                {orgName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto space-y-4">
          {/* Pending Verification Notice Banner (Requirement #10 & #16) */}
          {user?.verificationStatus === 'PENDING' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>
                  <strong>Facility Profile Under Verification:</strong> An administrator is reviewing your hospital's statutory license. Internal bedside inventory and usage tracking are active; external blood bank matching will unlock automatically once verified.
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                PENDING APPROVAL
              </span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* 4. TOAST NOTIFICATION CONTAINER (Section 30) */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#0F172A] text-white rounded-xl p-4 shadow-premium-lg border border-slate-800 animate-in slide-in-from-bottom-2 duration-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-poppins font-semibold text-xs text-white">
                {toast.title}
              </h5>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {toast.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss toast"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
