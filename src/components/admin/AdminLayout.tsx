import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { selectNetworkHealth, selectActiveAlerts, selectPendingVerifications } from '../../store/selectors';
import {
  LayoutDashboard,
  Building2,
  GitPullRequest,
  LineChart,
  History,
  AlertOctagon,
  Activity,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Radio,
  ArrowRightLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, pageTitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout, loginWithDemo } = useAuth();
  const { state } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = `${pageTitle} | SevaSetu Admin`;
  }, [pageTitle]);

  const health = selectNetworkHealth(state);
  const activeAlerts = selectActiveAlerts(state);
  const pendingOrgs = selectPendingVerifications(state);

  const navItems = [
    {
      label: 'Command Center',
      path: '/admin/command-center',
      icon: LayoutDashboard,
      badge: health.status === 'CRITICAL' ? '!' : undefined,
    },
    {
      label: 'Organizations',
      path: '/admin/organizations',
      icon: Building2,
      count: pendingOrgs.length > 0 ? pendingOrgs.length : undefined,
      countColor: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Refill Approvals',
      path: '/admin/refill-requests',
      icon: GitPullRequest,
      count: state.requests.filter((r) => r.status === 'pending_approval' || r.status === 'draft').length || undefined,
      countColor: 'bg-rose-100 text-rose-800',
    },
    {
      label: 'Network Analytics',
      path: '/admin/network-analytics',
      icon: LineChart,
    },
    {
      label: 'Audit Logs',
      path: '/admin/audit-logs',
      icon: History,
      count: state.auditLogs.length,
      countColor: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Critical Alerts',
      path: '/admin/alerts',
      icon: AlertOctagon,
      count: activeAlerts.length,
      countColor: 'bg-rose-500 text-white',
    },
    {
      label: 'Live Activity',
      path: '/admin/activity',
      icon: Activity,
    },
    {
      label: 'Settings & Reset',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  const handleRoleSwitch = (role: 'hospital' | 'admin') => {
    if (role === 'hospital') {
      loginWithDemo('hospital').then(() => {
        navigate('/hospital/dashboard');
      });
    }
  };

  const getHealthPill = () => {
    switch (health.status) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            CRITICAL ({health.score}/100)
          </span>
        );
      case 'HIGH_PRESSURE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            HIGH PRESSURE ({health.score}/100)
          </span>
        );
      case 'MONITOR':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            MONITORING ({health.score}/100)
          </span>
        );
      case 'HEALTHY':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            NETWORK OPTIMAL ({health.score}/100)
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 h-16 flex items-center px-4 sm:px-6 justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden text-slate-500 hover:text-slate-800 p-1"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin/command-center" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-poppins font-bold text-base text-slate-900 leading-none">
                  SevaSetu
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Command Center
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                State Emergency Orchestration OS
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Right header stats */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Subtle Demo Mode Badge (Requirement #90) */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="font-medium">DEMO MODE</span>
          </div>

          {/* Sync Engine Status */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Sync v{state.stateVersion}</span>
          </div>

          {/* Dynamic Network Health Pill */}
          <div className="hidden sm:block">{getHealthPill()}</div>

          {/* Alerts Bell */}
          <Link
            to="/admin/alerts"
            className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Critical Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </Link>

          {/* Admin Identity & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#0F2E5A] text-white flex items-center justify-center text-xs font-mono font-bold">
              AD
            </div>
            <div className="hidden xl:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">State Command Admin</p>
              <p className="text-[10px] text-slate-400 font-mono">{user?.userName || 'Dr. Alhaj Baig'}</p>
            </div>

            <button
              type="button"
              onClick={async () => {
                await authLogout();
                navigate('/login');
              }}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 w-64 bg-white border-r border-slate-200/80 p-4 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 mb-2 font-semibold">
                Network Operations
              </div>

              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/admin/command-center' && location.pathname === '/admin/dashboard');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#C1272D] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[10px] flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && !item.badge && (
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-white/20 text-white' : item.countColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Cross-Role Demo Switcher (Requirement #67) */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1">
                Cross-Role Demo Switcher
              </div>
              <button
                type="button"
                onClick={() => handleRoleSwitch('hospital')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#C1272D]" />
                  <span>Switch to Hospital</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Node</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
