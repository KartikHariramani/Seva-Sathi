import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getRoleDashboardRoute = (role?: string) => {
    switch (role) {
      case 'donor':
        return '/donor/portal';
      case 'hospital':
        return '/hospital/dashboard';
      case 'hospital_staff':
        return '/hospital/staff/dashboard';
      case 'blood_bank':
        return '/blood-bank/dashboard';
      case 'ngo':
        return '/ngo/campaigns';
      case 'admin':
        return '/admin/command-center';
      default:
        return '/';
    }
  };

  const getNavLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { label: 'How It Works', path: '/how-it-works' },
        { label: 'Live Network', path: '/network' },
        { label: 'Blood Drives', path: '/campaigns' },
        { label: 'About', path: '/about' },
      ];
    }

    switch (user.role) {
      case 'donor':
        return [
          { label: 'Browse Drives', path: '/donor/portal' },
          { label: 'My Registrations', path: '/donor/registrations' },
          { label: 'Telegram & Alerts', path: '/donor/notifications' },
          { label: 'Live Network', path: '/network' },
        ];
      case 'hospital':
      case 'hospital_staff':
        return [
          { label: 'Hospital Overview', path: '/hospital/dashboard' },
          { label: 'Blood Requisitions', path: '/hospital/requests' },
          { label: '+ New Request', path: '/hospital/requests/new' },
          { label: 'Live Network', path: '/hospital/network' },
        ];
      case 'blood_bank':
        return [
          { label: 'Blood Bank Portal', path: '/blood-bank/dashboard' },
          { label: 'Near-Expiry Rescue', path: '/blood-bank/near-expiry' },
          { label: 'Inventory', path: '/blood-bank/inventory' },
        ];
      case 'ngo':
        return [
          { label: 'Campaign Management', path: '/ngo/campaigns' },
          { label: 'Turnout Telemetry', path: '/organizer/telemetry' },
        ];
      case 'admin':
        return [
          { label: 'Command Center', path: '/admin/command-center' },
          { label: 'Organizations', path: '/admin/organizations' },
          { label: 'Audit Logs', path: '/admin/audit-logs' },
          { label: 'Governance & Diagnostics', path: '/admin/settings' },
        ];
      default:
        return [
          { label: 'How It Works', path: '/how-it-works' },
          { label: 'Live Network', path: '/network' },
          { label: 'Blood Drives', path: '/campaigns' },
          { label: 'About', path: '/about' },
        ];
    }
  };

  const navLinks = getNavLinks();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-2.5 bg-white/85 backdrop-blur-md border-b border-[#E2E8F0] shadow-subtle'
          : 'py-4 bg-white/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* LEFT: Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D] rounded-md py-1"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#C1272D] text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
              {/* Minimal Blood Drop + Connected Nodes icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4.5 h-4.5"
              >
                <path
                  d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                  fill="currentColor"
                />
                <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
                <circle cx="9" cy="17" r="1.2" fill="#FFFFFF" fillOpacity="0.8" />
                <circle cx="15" cy="17" r="1.2" fill="#FFFFFF" fillOpacity="0.8" />
                <line x1="10.8" y1="14.8" x2="9.5" y2="16.2" stroke="#FFFFFF" strokeWidth="0.8" />
                <line x1="13.2" y1="14.8" x2="14.5" y2="16.2" stroke="#FFFFFF" strokeWidth="0.8" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-poppins font-bold text-lg tracking-tight text-[#0F172A] leading-tight flex items-center gap-1.5">
                SevaSetu
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 text-[#1E4C8A] bg-blue-50 border border-blue-200/60 rounded">
                  Healthcare
                </span>
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors relative py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#1E4C8A] rounded ${
                  isActive(link.path)
                    ? 'text-[#C1272D]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C1272D] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Auth & CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getRoleDashboardRoute(user?.role)}
                  className="flex items-center gap-2 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3 py-1.5 rounded border border-slate-200 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>{user?.orgName || user?.email || 'Authorized Portal'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors px-2 py-1"
                >
                  Log out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] px-3 py-1.5 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-medium bg-[#0F172A] text-white hover:bg-[#1E293B] px-4 py-2 rounded-md transition-all shadow-sm hover:shadow flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <span>Get Started</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Clean, compact, no giant drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 pt-3 pb-5 mt-2 transition-all">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'bg-red-50 text-[#C1272D]'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard-preview"
                    className="text-sm font-medium px-3 py-2 rounded-md bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span>{user?.orgName || 'Workspace'}</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </Link>
                  <button
                    onClick={logout}
                    className="text-left text-sm text-slate-500 px-3 py-1.5"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-md"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium text-center bg-[#0F172A] text-white py-2.5 rounded-md hover:bg-[#1E293B]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
