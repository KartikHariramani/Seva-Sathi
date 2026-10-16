import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  GitMerge,
  CheckCircle,
  Lock,
  Truck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  tagline: string;
  description: string;
  technicalDetails: string[];
  icon: React.ReactNode;
}

export const HowItWorksPage: React.FC = () => {
  const [activeSimulationStep, setActiveSimulationStep] = useState(1);

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Real-Time Inventory Synchronization',
      tagline: 'Continuous digital twin of all cold-storage reserves',
      description:
        'Hospitals and certified blood banks maintain a cryptographically synchronized inventory ledger. Every donation unit, plasma pouch, and platelet pack is tracked with temperature history, donor batch, and exact expiration timestamp.',
      technicalDetails: [
        'Sub-second telemetry sync via REST & WebSocket feeds',
        'ISO-compliant ISBT 128 barcode standardization',
        'Cold-chain temperature threshold monitoring (2°C - 6°C)',
      ],
      icon: <Activity className="w-5 h-5 text-[#1E4C8A]" />,
    },
    {
      id: 2,
      title: 'Demand Prediction & Surge Modeling',
      tagline: 'Anticipating shortages before orders are placed',
      description:
        'Instead of waiting for an emergency code red, machine-learning models analyze elective surgical schedules, ICU occupancy, regional trauma history, and environmental factors to project blood consumption 24 to 72 hours into the future.',
      technicalDetails: [
        'Cross-validation with electronic health record surgical schedules',
        'Surge clustering during high-traffic holidays and severe weather',
        'Dynamic safety margin calculations per hospital tier',
      ],
      icon: <TrendingUp className="w-5 h-5 text-[#C1272D]" />,
    },
    {
      id: 3,
      title: 'Stockout Detection & Early Warning',
      tagline: 'Automated deficit threshold notifications',
      description:
        'When an organization’s projected consumption surpasses safe reserve velocity, SevaSetu raises a predictive stockout alert. Medical directors receive automated risk warnings with hours of lead time.',
      technicalDetails: [
        'Configurable critical reserve thresholds (e.g. < 4 hours of O-)',
        'Deficit velocity scoring to eliminate false alarm fatigue',
        'Automatic elevation to regional coordination group',
      ],
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
    },
    {
      id: 4,
      title: 'Intelligent Multi-Factor Matching',
      tagline: 'Algorithmic optimization across the entire network',
      description:
        'SevaSetu evaluates all connected blood repositories simultaneously to locate optimal supply. The heuristic balancing engine accounts for ABO/Rh-D compatibility, physical distance, traffic conditions, and imminent expiration.',
      technicalDetails: [
        'Universal compatibility matrix (O- universal red cells, AB universal plasma)',
        'Expiry-first sorting (units expiring within 48h prioritized to prevent waste)',
        'Route distance and real-time transit time optimization',
      ],
      icon: <GitMerge className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 5,
      title: 'Administrative Approval & Clinical Sign-off',
      tagline: 'Human oversight with zero bureaucratic latency',
      description:
        'Both participating facilities review the automated transfer proposal with complete clinical visibility. Blood bank transfusion specialists confirm release with a single verified authorization.',
      technicalDetails: [
        'Role-based approval for licensed medical superintendents',
        'Immediate crossmatch pre-validation checks',
        'Audit-ready electronic compliance signature log',
      ],
      icon: <CheckCircle className="w-5 h-5 text-[#1E4C8A]" />,
    },
    {
      id: 6,
      title: 'Cryptographic Reservation Lock',
      tagline: 'Guaranteed inventory allocation without double-booking',
      description:
        'Upon approval, matched blood units are instantly placed into an atomic reservation lock. The units cannot be allocated to another facility, eliminating inventory race conditions during transit.',
      technicalDetails: [
        'Atomic database lock prevent concurrent allocation',
        'Time-to-live (TTL) expiration window for pending pickups',
        'Real-time status broadcast to the broader network ledger',
      ],
      icon: <Lock className="w-5 h-5 text-amber-600" />,
    },
    {
      id: 7,
      title: 'Cold-Chain Redistribution & Logistics',
      tagline: 'Monitored physical transfer from bank to recipient',
      description:
        'Designated emergency medical couriers or authorized hospital transport services receive dispatch routing instructions with cold-storage verification protocols and GPS tracking.',
      technicalDetails: [
        'Validated insulated transport container compliance',
        'Estimated time of arrival (ETA) continuous telemetry',
        'Chain-of-custody transfer handover confirmation',
      ],
      icon: <Truck className="w-5 h-5 text-slate-700" />,
    },
    {
      id: 8,
      title: 'Real-Time Network Telemetry Updates',
      tagline: 'Instant network rebalancing upon delivery',
      description:
        'Once units are scanned into the receiving hospital’s blood bank, the delivery is verified, reserves are updated instantly, and the network’s predictive load balance settles into equilibrium.',
      technicalDetails: [
        'Instant stock re-indexing across regional dashboards',
        'Automated post-event model training feedback loop',
        'Wastage-prevented index metric increment',
      ],
      icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
        <span className="text-xs font-mono font-semibold tracking-widest text-[#C1272D] uppercase block mb-3">
          SYSTEM ARCHITECTURE
        </span>
        <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-[#0F172A] tracking-tight leading-[1.1] mb-6">
          How SevaSetu Solves The Blood Distribution Problem
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] leading-relaxed text-balance">
          An eight-stage closed-loop architecture designed to replace disconnected phone calls and fragmented spreadsheets with automated, predictive intelligence.
        </p>
      </div>

      {/* Interactive Simulation Walkthrough Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 mb-16 shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#1E4C8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                SCENARIO SIMULATION
              </span>
              <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
                Trauma Center O- Negative Deficit Response
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Follow how an incoming ICU surge triggers predictive reallocation across 3 connected institutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((stepIdx) => (
              <button
                key={stepIdx}
                onClick={() => setActiveSimulationStep(stepIdx)}
                className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                  activeSimulationStep === stepIdx
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Step {stepIdx}
              </button>
            ))}
          </div>
        </div>

        {/* Active Simulation Step View */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            {activeSimulationStep === 1 && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-rose-600 font-bold uppercase tracking-wider">
                  Phase 1 // Anomaly Detected
                </span>
                <h4 className="font-poppins font-semibold text-xl text-[#0F172A]">
                  Apex Trauma Center: O- reserve drops to 2 units
                </h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  A high-velocity intake of trauma patients decreases the safe buffer below the 4-hour critical mark. SevaSetu detects the anomaly at 11:02 AM without manual nurse intervention.
                </p>
              </div>
            )}
            {activeSimulationStep === 2 && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">
                  Phase 2 // Multi-Factor Match
                </span>
                <h4 className="font-poppins font-semibold text-xl text-[#0F172A]">
                  SevaSetu matches 4 units at Red Cross Regional (6.2 km)
                </h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  The algorithm identifies 4 units expiring in 48 hours at Red Cross Regional Center. Allocating these units prevents upcoming spoilage while replenishing the emergency room.
                </p>
              </div>
            )}
            {activeSimulationStep === 3 && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-amber-600 font-bold uppercase tracking-wider">
                  Phase 3 // Atomic Lock &amp; Authorization
                </span>
                <h4 className="font-poppins font-semibold text-xl text-[#0F172A]">
                  Both administrators approve in 38 seconds
                </h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Digital sign-offs are registered. The units are cryptographically locked in the storage repository and packed in temperature-verified transport containers.
                </p>
              </div>
            )}
            {activeSimulationStep === 4 && (
              <div className="space-y-2">
                <span className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-wider">
                  Phase 4 // Safe Handover &amp; Ledger Rebalance
                </span>
                <h4 className="font-poppins font-semibold text-xl text-[#0F172A]">
                  Delivery confirmed in 19 minutes; network balanced
                </h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Courier handover is scanned at the ICU entrance. Apex Trauma reserves are restored to 6 units. Network status returns to optimal equilibrium.
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>LATENCY:</span>
              <span className="font-bold text-slate-900">42ms</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>UNITS MOVED:</span>
              <span className="font-bold text-[#C1272D]">4x O- (450mL)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>WASTE PREVENTED:</span>
              <span className="font-bold text-emerald-600">Yes (48h expiry)</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>DISPATCH ETA:</span>
              <span className="font-bold text-slate-900">19 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Numbered Technical Architecture Sections */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C1272D]" />
          <h2 className="font-poppins font-semibold text-2xl text-[#0F172A]">
            8-Step Architectural Protocol
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    PHASE 0{step.id}
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-500 uppercase tracking-wide block mb-1">
                  {step.tagline}
                </span>

                <h3 className="font-poppins font-semibold text-xl text-[#0F172A] mb-3">
                  {step.title}
                </h3>

                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-mono font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Technical Specifications
                </span>
                <ul className="space-y-1.5">
                  {step.technicalDetails.map((detail, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-600 flex items-start gap-2 font-inter"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#1E4C8A] mt-2 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-20 p-8 sm:p-12 bg-white rounded-xl border border-slate-200/90 text-center shadow-subtle max-w-4xl mx-auto">
        <h3 className="font-poppins font-semibold text-2xl sm:text-3xl text-[#0F172A] mb-3">
          Ready to coordinate your blood inventory?
        </h3>
        <p className="text-sm sm:text-base text-[#64748B] mb-8 max-w-xl mx-auto leading-relaxed">
          Connect your organization to the SevaSetu predictive network and eliminate stockout risks before they impact patient care.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Register Organization
            </Button>
          </Link>
          <Link to="/network">
            <Button variant="secondary" size="lg">
              View Network Telemetry
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
