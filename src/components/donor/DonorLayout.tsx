import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  QrCode,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { donorService } from '../../services/donorService';

interface DonorLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const DonorLayout: React.FC<DonorLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getActiveDonor = () => {
    const all = donorService.getDonors();
    if (user?.orgId) {
      const match = all.find((d) => d.id === user.orgId);
      if (match) return match;
    }
    if (user?.email) {
      const match = all.find((d) => d.email.toLowerCase() === user.email.toLowerCase());
      if (match) return match;
    }
    return all[0];
  };

  const donor = getActiveDonor();

  const navItems = [
    {
      label: 'Browse Blood Drives',
      path: '/donor/portal',
      icon: Calendar,
      description: 'Find regional donation camps & reserve time slots',
    },
    {
      label: 'My Registrations & QR Passes',
      path: '/donor/registrations',
      icon: QrCode,
      description: 'Digital entry tickets & attendance passes',
    },
    {
      label: 'Notification & Telegram Hub',
      path: '/donor/notifications',
      icon: Bell,
      description: 'Emergency shortage alerts & channel preferences',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Identifier */}
            <div className="flex items-center gap-3">
              <Link to="/donor/portal" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#C1272D] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <Heart className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-poppins font-bold text-base text-slate-900 tracking-tight">
                      SevaSetu
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      DONOR PORTAL
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Voluntary Blood Donation Network</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile Chip & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80">
                <div className="w-6 h-6 rounded-md bg-[#C1272D] text-white text-[11px] font-bold font-poppins flex items-center justify-center">
                  {donor.bloodGroup}
                </div>
                <div className="text-left text-xs leading-none">
                  <span className="font-bold text-slate-800 block">{donor.fullName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{donor.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign out of Donor Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>SevaSetu Voluntary Blood Donation &amp; Turnout Network</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>24/7 Helpline: 1800-SEVA-SETU</span>
            <span>&bull;</span>
            <span>Nagpur &amp; Maharashtra Healthcare Region</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
