import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';
import { useAuth } from '../context/AuthContext';
import { ALL_BLOOD_GROUPS, DEFAULT_INVENTORY_PRESET } from '../data/mockData';
import { BloodGroupCard } from '../components/common/BloodGroupCard';
import { Button } from '../components/common/Button';
import {
  ArrowRight,
  Database,
  Cpu,
  Truck,
  RotateCcw,
} from 'lucide-react';

export const DashboardPreviewPage: React.FC = () => {
  const { data, resetRegistration } = useRegistration();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const orgName = data.organizationName || user?.orgName || 'Metropolitan General Hospital';
  const orgId = data.organizationId || user?.orgId || 'HOSP-IND-9021';
  const orgType = data.organizationType || user?.role || 'hospital';
  const inventory = data.inventory || DEFAULT_INVENTORY_PRESET;

  const totalUnits = ALL_BLOOD_GROUPS.reduce((acc, g) => acc + (inventory[g] || 0), 0);

  const handleReset = () => {
    resetRegistration();
    logout();
    navigate('/');
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Notice Banner */}
      <div className="mb-8 p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-poppins font-semibold text-sm block">
              Phase 1 Milestone Complete
            </span>
            <p className="text-xs text-slate-300">
              Frontend design system, navigation routes, and data architecture are active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/network">
            <button className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer">
              View Network Map
            </button>
          </Link>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-mono bg-rose-950/60 hover:bg-rose-900 text-rose-200 rounded border border-rose-800/60 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Flow</span>
          </button>
        </div>
      </div>

      {/* Main Announcement Card */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-xs font-mono font-semibold tracking-widest text-[#C1272D] uppercase block mb-3">
          WORKSPACE STAGING
        </span>
        <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-4">
          Your SevaSetu dashboard is coming next.
        </h1>
        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed text-balance">
          The Phase 1 foundation is complete. In Phase 2, this workspace connects directly to the live PostgreSQL / Supabase cluster, machine learning forecast engine, and inter-hospital exchange protocol.
        </p>
      </div>

      {/* Active Node Workspace Snapshot */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-subtle mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-semibold text-xl text-[#0F172A]">
                {orgName}
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                NODE ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 font-mono">
              SYSTEM IDENTIFIER: {orgId} &bull; ROLE: {orgType.toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">REGISTERED STOCK</span>
              <span className="font-bold text-lg text-[#0F172A]">{totalUnits} units</span>
            </div>
          </div>
        </div>

        {/* Starting Inventory Grid (From User Input in Step 2) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-500 uppercase font-semibold">
              INITIAL INVENTORY LEDGER (8 GROUPS)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Synced from Step 2 onboarding
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_BLOOD_GROUPS.map((group) => (
              <BloodGroupCard
                key={group}
                group={group}
                units={inventory[group] || 0}
                interactive={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Coming Next in Phase 2 Preview Modules */}
      <div className="mb-12">
        <h3 className="font-poppins font-semibold text-lg text-[#0F172A] mb-4">
          Upcoming Phase 2 Capabilities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-100/60 text-[#1E4C8A] flex items-center justify-center mb-3">
                <Database className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-poppins font-semibold text-base text-[#0F172A] mb-2">
                Supabase &amp; PostgreSQL Cluster
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Persistent row-level security (RLS), real-time inventory change streams, and audited multi-tenant access control.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono text-slate-400 uppercase">
              STATUS: ARCHITECTED FOR PHASE 2
            </span>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-red-100/60 text-[#C1272D] flex items-center justify-center mb-3">
                <Cpu className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-poppins font-semibold text-base text-[#0F172A] mb-2">
                Predictive ML Inference Engine
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automated demand time-series forecasting, cold-chain shelf-life optimization, and early deficit triggers.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono text-slate-400 uppercase">
              STATUS: PIPELINE READY
            </span>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center mb-3">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-poppins font-semibold text-base text-[#0F172A] mb-2">
                Live Dispatch &amp; Cold-Chain Tracking
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Inter-facility courier routing, cryptographic unit reservation locks, and delivery temperature verification.
              </p>
            </div>
            <span className="mt-4 text-[10px] font-mono text-slate-400 uppercase">
              STATUS: TELEMETRY PLANNED
            </span>
          </div>
        </div>
      </div>

      {/* Return Links */}
      <div className="text-center pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/">
          <Button variant="secondary" size="md">
            Back to SevaSetu Homepage
          </Button>
        </Link>
        <Link to="/hospital/dashboard">
          <Button variant="accent" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Open Hospital Command Center
          </Button>
        </Link>
        <Link to="/network">
          <Button variant="secondary" size="md">
            Explore Simulated Network
          </Button>
        </Link>
      </div>
    </div>
  );
};
