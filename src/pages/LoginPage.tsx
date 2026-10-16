import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Boxes,
  Users,
  Heart,
  UserCheck,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export type LoginRole = 'hospital' | 'admin' | 'ngo' | 'donor' | 'blood_bank';

interface RoleConfig {
  id: LoginRole;
  targetRole: UserRole;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  subheading: string;
  emailLabel: string;
  emailPlaceholder: string;
  defaultEmail: string;
  defaultPassword: string;
  buttonText: string;
  dashboardRoute: string;
  demoUser: {
    name: string;
    role: UserRole;
    title: string;
    org: string;
    email: string;
    badge: string;
  };
  registerLink?: {
    prompt: string;
    text: string;
    url: string;
  };
}

const ROLE_CONFIGS: Record<LoginRole, RoleConfig> = {
  hospital: {
    id: 'hospital',
    targetRole: 'hospital',
    label: 'Hospital',
    badge: 'Clinical',
    icon: Building2,
    heading: 'Hospital Account Login',
    subheading: 'Clinical blood inventory, emergency requisition & cold-chain intake',
    emailLabel: 'Hospital Administrator Email',
    emailPlaceholder: 'hospital.admin@sevasathi.org',
    defaultEmail: 'hospital.admin@raktsetu.org',
    defaultPassword: 'demoHospitalPass2026!',
    buttonText: 'Sign In as Hospital Administrator',
    dashboardRoute: '/hospital/dashboard',
    demoUser: {
      name: 'Dr. Rajesh Verma',
      role: 'hospital',
      title: 'Chief Medical Officer',
      org: 'Metropolitan Trauma & General Hospital',
      email: 'hospital.admin@raktsetu.org',
      badge: 'Hospital Admin',
    },
    registerLink: {
      prompt: 'New clinical healthcare facility?',
      text: 'Register Facility Application',
      url: '/register/hospital',
    },
  },
  admin: {
    id: 'admin',
    targetRole: 'admin',
    label: 'Admin',
    badge: 'Command',
    icon: ShieldCheck,
    heading: 'Administrator Login',
    subheading: 'State healthcare command center, facility verification & audit oversight',
    emailLabel: 'State Administrator Email',
    emailPlaceholder: 'admin@sevasathi.org',
    defaultEmail: 'admin@raktsetu.org',
    defaultPassword: 'demoAdminPass2026!',
    buttonText: 'Sign In as Administrator',
    dashboardRoute: '/admin/command-center',
    demoUser: {
      name: 'State Medical Administrator',
      role: 'admin',
      title: 'Director of Healthcare Oversight',
      org: 'SevaSetu State Control Center',
      email: 'admin@raktsetu.org',
      badge: 'Super Admin',
    },
    registerLink: {
      prompt: 'Administrative access inquiries?',
      text: 'Contact State Directorate of Health',
      url: '/about',
    },
  },
  ngo: {
    id: 'ngo',
    targetRole: 'ngo',
    label: 'NSS Organization',
    badge: 'Youth & NGO',
    icon: Users,
    heading: 'NSS Organization Coordinator Login',
    subheading: 'Youth donation drives, camp registration & volunteer turnout telemetry',
    emailLabel: 'NSS Unit Coordinator Email',
    emailPlaceholder: 'nss.coordinator@sevasathi.org',
    defaultEmail: 'ngo.coordinator@sevasathi.org',
    defaultPassword: 'demoNgoPass2026!',
    buttonText: 'Sign In as NSS Coordinator',
    dashboardRoute: '/ngo/campaigns',
    demoUser: {
      name: 'Anjali Sharma',
      role: 'ngo',
      title: 'NSS Regional Coordinator',
      org: 'National Service Scheme Youth Alliance',
      email: 'ngo.coordinator@sevasathi.org',
      badge: 'NSS Coordinator',
    },
    registerLink: {
      prompt: 'New NSS unit or blood donation NGO?',
      text: 'Register Youth Organization',
      url: '/register',
    },
  },
  donor: {
    id: 'donor',
    targetRole: 'donor',
    label: 'Donor',
    badge: 'Lifesaver',
    icon: Heart,
    heading: 'Donor Account Login',
    subheading: 'Voluntary blood donor hub, emergency alert matching & digital passes',
    emailLabel: 'Registered Donor Email',
    emailPlaceholder: 'donor@sevasathi.org',
    defaultEmail: 'donor@sevasathi.org',
    defaultPassword: 'demoDonorPass2026!',
    buttonText: 'Sign In to Donor Portal',
    dashboardRoute: '/donor/portal',
    demoUser: {
      name: 'Amitabh Sen',
      role: 'donor',
      title: 'Universal O+ Donor (Tier 3 Hero)',
      org: 'Volunteer Blood Donor Network',
      email: 'donor@sevasathi.org',
      badge: 'Active Donor',
    },
    registerLink: {
      prompt: 'Want to register as a voluntary lifesaver?',
      text: 'Join Volunteer Donor Network',
      url: '/donor/portal',
    },
  },
  blood_bank: {
    id: 'blood_bank',
    targetRole: 'blood_bank',
    label: 'Blood Bank',
    badge: 'Depot',
    icon: Boxes,
    heading: 'Blood Bank Account Login',
    subheading: 'Regional blood component storage, testing labs & apheresis depots',
    emailLabel: 'Blood Bank Officer Email',
    emailPlaceholder: 'bloodbank@sevasathi.org',
    defaultEmail: 'bloodbank@raktsetu.org',
    defaultPassword: 'demoBloodBankPass2026!',
    buttonText: 'Sign In as Blood Bank Officer',
    dashboardRoute: '/blood-bank/dashboard',
    demoUser: {
      name: 'Suresh Nair',
      role: 'blood_bank',
      title: 'Head of Transfusion Services',
      org: 'Central City Blood Depot & Apheresis Unit',
      email: 'bloodbank@raktsetu.org',
      badge: 'Depot Lead',
    },
    registerLink: {
      prompt: 'New blood bank depot or testing lab?',
      text: 'Register Blood Bank Depot',
      url: '/register',
    },
  },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithDemo } = useAuth();

  // Selected role context: exactly five roles
  const [selectedRole, setSelectedRole] = useState<LoginRole>('hospital');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentConfig = ROLE_CONFIGS[selectedRole];

  const [email, setEmail] = useState(currentConfig.defaultEmail);
  const [password, setPassword] = useState(currentConfig.defaultPassword);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleRoleChange = (newRole: LoginRole) => {
    setSelectedRole(newRole);
    setIsStaffLogin(false);
    setError('');
    setPendingNotice(null);

    const targetConfig = ROLE_CONFIGS[newRole];
    setEmail(targetConfig.defaultEmail);
    setPassword(targetConfig.defaultPassword);
  };

  const handleStaffToggle = () => {
    const nextStaff = !isStaffLogin;
    setIsStaffLogin(nextStaff);
    setError('');
    if (nextStaff) {
      setEmail('hospital.staff@raktsetu.org');
      setPassword('demoStaffPass2026!');
    } else {
      setEmail(ROLE_CONFIGS.hospital.defaultEmail);
      setPassword(ROLE_CONFIGS.hospital.defaultPassword);
    }
  };

  const isAuthorizedForPath = (role: UserRole, path: string): boolean => {
    if (path.startsWith('/admin')) return role === 'admin';
    if (path.startsWith('/hospital')) return role === 'hospital' || role === 'hospital_staff';
    if (path.startsWith('/blood-bank') || path.startsWith('/near-expiry') || path.startsWith('/inventory')) return role === 'blood_bank' || role === 'admin';
    if (path.startsWith('/ngo') || path.startsWith('/organizer') || path.startsWith('/telemetry')) return role === 'ngo' || role === 'admin';
    if (path.startsWith('/donor')) return role === 'donor' || role === 'admin';
    return false;
  };

  const handleSuccessfulRedirect = (role: UserRole) => {
    const fromPath = (location.state as any)?.from?.pathname;
    if (fromPath && fromPath !== '/login' && fromPath !== '/unauthorized' && isAuthorizedForPath(role, fromPath)) {
      navigate(fromPath, { replace: true });
      return;
    }

    if (role === 'admin') {
      navigate('/admin/command-center', { replace: true });
    } else if (role === 'blood_bank') {
      navigate('/blood-bank/dashboard', { replace: true });
    } else if (role === 'hospital_staff') {
      navigate('/hospital/staff/dashboard', { replace: true });
    } else if (role === 'ngo') {
      navigate('/ngo/campaigns', { replace: true });
    } else if (role === 'donor') {
      navigate('/donor/portal', { replace: true });
    } else {
      navigate('/hospital/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your registered email and password.');
      return;
    }
    setError('');
    setPendingNotice(null);
    setIsLoading(true);

    const targetRole: UserRole = isStaffLogin ? 'hospital_staff' : currentConfig.targetRole;

    try {
      const session = await login(email, password, targetRole);
      setIsLoading(false);

      if (session.verificationStatus === 'PENDING') {
        setPendingNotice(
          'Your organization profile is currently UNDER VERIFICATION by state administrators. Full blood network requisition is restricted until approved.'
        );
      }

      handleSuccessfulRedirect(session.role);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(msg);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsLoading(true);
    setError('');
    setPendingNotice(null);

    try {
      const session = await loginWithDemo(role);
      setIsLoading(false);
      handleSuccessfulRedirect(session.role);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Demo login failed.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Branding Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#C1272D] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path
                  d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                  fill="currentColor"
                />
                <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
              </svg>
            </div>
            <span className="font-poppins font-bold text-2xl text-slate-900 tracking-tight">
              SevaSetu
            </span>
          </Link>

          <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Intelligent Healthcare Network Access
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Coordinated emergency blood orchestration, regional donation campaigns, and life-saving transfusions.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Section 1: Exactly Five Role Panels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                Select Login Role:
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                5 Authorized Portals
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Select Login Role"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
            >
              {(Object.keys(ROLE_CONFIGS) as LoginRole[]).map((roleKey, idx) => {
                const conf = ROLE_CONFIGS[roleKey];
                const Icon = conf.icon;
                const isSelected = selectedRole === roleKey;
                const isLastOnMobile = idx === 4;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    role="tab"
                    id={`role-tab-${roleKey}`}
                    aria-selected={isSelected}
                    aria-controls={`login-panel-${roleKey}`}
                    tabIndex={0}
                    onClick={() => handleRoleChange(roleKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRoleChange(roleKey);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D] focus-visible:ring-offset-2 ${
                      isLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
                    } ${
                      isSelected
                        ? 'bg-rose-50 border-[#C1272D] text-[#C1272D] ring-2 ring-[#C1272D]/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#C1272D] text-white shadow-xs' : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs leading-tight tracking-tight block ${
                        isSelected ? 'font-bold text-[#C1272D]' : 'font-medium text-slate-700'
                      }`}
                    >
                      {conf.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase tracking-wider font-semibold ${
                        isSelected ? 'bg-rose-200/80 text-rose-900' : 'bg-slate-200/70 text-slate-500'
                      }`}
                    >
                      {conf.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Header Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-poppins">
                {currentConfig.heading}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
                {currentConfig.label} Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {currentConfig.subheading}
            </p>
          </div>

          {/* Hospital Staff Sub-toggle when Hospital selected */}
          {selectedRole === 'hospital' && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-semibold text-slate-800">Hospital Staff Account</span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    For clinical transfusion officers & ward technicians
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStaffToggle}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isStaffLogin
                    ? 'bg-[#C1272D] text-white border-[#C1272D]'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isStaffLogin ? 'Staff Active' : 'Switch to Staff'}
              </button>
            </div>
          )}

          {/* Error Banner with Strict Role Mismatch Explanation */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Access Denied:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Pending Verification Notice */}
          {pendingNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Pending Verification Notice:</span>
                <span>{pendingNotice}</span>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                {isStaffLogin ? 'Staff Member Official Email' : currentConfig.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 font-mono"
                  placeholder={currentConfig.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedRole === 'admin'
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : selectedRole === 'blood_bank'
                  ? 'bg-[#0F2E5A] hover:bg-[#1E4C8A]'
                  : selectedRole === 'donor'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : selectedRole === 'ngo'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-[#C1272D] hover:bg-[#A61E24]'
              }`}
            >
              <span>
                {isLoading
                  ? 'Verifying Credentials...'
                  : isStaffLogin
                  ? 'Sign In as Hospital Staff'
                  : currentConfig.buttonText}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Section 5: One-Click Demo Access Tailored to Selected Role */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                One-Click Demo Access ({currentConfig.label})
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Verified Test Account
              </span>
            </div>

            {/* Primary Demo Card for Active Role */}
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{currentConfig.demoUser.name}</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-white text-rose-700 rounded border border-rose-200">
                    {currentConfig.demoUser.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 truncate">{currentConfig.demoUser.org}</p>
                <p className="text-[10px] font-mono text-slate-400">{currentConfig.demoUser.email}</p>
              </div>

              <button
                type="button"
                onClick={() => handleQuickDemo(currentConfig.targetRole)}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Demo Login &rarr;</span>
              </button>
            </div>

            {/* If Hospital, also offer Hospital Staff shortcut */}
            {selectedRole === 'hospital' && (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Dr. Rahul Sharma</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-white text-slate-700 rounded border border-slate-200">
                      Hospital Staff
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Senior Transfusion Officer &bull; Ward OT</p>
                  <p className="text-[10px] font-mono text-slate-400">hospital.staff@raktsetu.org</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('hospital_staff')}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Staff Login &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role-Contextual Registration Link */}
        {currentConfig.registerLink && (
          <div className="text-center text-xs text-slate-500">
            {currentConfig.registerLink.prompt}{' '}
            <Link
              to={currentConfig.registerLink.url}
              className="font-semibold text-[#1E4C8A] hover:underline"
            >
              {currentConfig.registerLink.text} &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
