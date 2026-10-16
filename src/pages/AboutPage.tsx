import React from 'react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Eyebrow and Main Heading */}
      <div className="text-center mb-16 sm:mb-20">
        <span className="text-xs font-mono font-semibold tracking-widest text-[#C1272D] uppercase block mb-3">
          MISSION &amp; PHILOSOPHY
        </span>
        <h1 className="font-poppins font-bold text-4xl sm:text-5xl lg:text-6xl text-[#0F172A] tracking-tight leading-[1.1] mb-6 text-balance">
          Technology that connects what already exists.
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed text-balance">
          SevaSetu was conceived as a silent, intelligent digital spine for the healthcare sector—coordinating life-saving blood logistics before critical deficits emerge.
        </p>
      </div>

      {/* 3 Short Core Sections */}
      <div className="space-y-12">
        {/* Section 1: The Problem */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs font-bold text-[#E11D48] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              01 // THE CHALLENGE
            </span>
            <h2 className="font-poppins font-semibold text-2xl text-[#0F172A]">
              The Problem
            </h2>
          </div>
          <p className="text-base text-[#0F172A] font-medium mb-3 leading-relaxed">
            Blood inventory is distributed across multiple facilities while demand changes continuously.
          </p>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Blood components have rigid shelf lives: red blood cells last approximately 35 to 42 days, while platelets expire in just 5 days. Hospitals and blood banks operate as isolated information silos. When an emergency strikes, staff rely on frantic phone calls while neighboring facilities may be forced to discard expiring units.
          </p>
        </div>

        {/* Section 2: The Approach */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs font-bold text-[#1E4C8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              02 // THE METHODOLOGY
            </span>
            <h2 className="font-poppins font-semibold text-2xl text-[#0F172A]">
              The Approach
            </h2>
          </div>
          <p className="text-base text-[#0F172A] font-medium mb-3 leading-relaxed">
            SevaSetu combines inventory monitoring, prediction and intelligent matching.
          </p>
          <p className="text-sm text-[#64748B] leading-relaxed">
            We don’t ask blood banks to change their clinical storage practices. Instead, SevaSetu creates a lightweight digital layer over their current management systems. Machine learning models continuously ingest surgical schedules, historical emergency patterns, and shelf-life timelines to recommend proactive transfers with zero bureaucratic friction.
          </p>
        </div>

        {/* Section 3: The Goal */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-subtle hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              03 // THE OBJECTIVE
            </span>
            <h2 className="font-poppins font-semibold text-2xl text-[#0F172A]">
              The Goal
            </h2>
          </div>
          <p className="text-base text-[#0F172A] font-medium mb-3 leading-relaxed">
            Reduce avoidable shortages, reduce wastage and improve coordination.
          </p>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Our sole benchmark is human life preserved through timely access to blood products. By achieving regional equilibrium, every donated drop achieves maximum therapeutic impact, emergency waiting times fall, and healthcare workers focus on saving patients rather than hunting for supplies.
          </p>
        </div>
      </div>

      {/* Core Design Principles */}
      <div className="mt-16 pt-12 border-t border-slate-200">
        <h3 className="font-poppins font-semibold text-xl text-[#0F172A] mb-6 text-center">
          Our Operational Commitments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-50/60 rounded-lg border border-slate-200/80 text-center">
            <span className="font-mono text-xs font-semibold text-slate-500 uppercase block mb-1">
              CLINICAL PRIVACY
            </span>
            <h4 className="font-poppins font-semibold text-sm text-[#0F172A] mb-1">
              Zero Patient PII
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              Telemetric models only process batch IDs, volume units, and blood compatibility data.
            </p>
          </div>

          <div className="p-5 bg-slate-50/60 rounded-lg border border-slate-200/80 text-center">
            <span className="font-mono text-xs font-semibold text-slate-500 uppercase block mb-1">
              INFRASTRUCTURE FIRST
            </span>
            <h4 className="font-poppins font-semibold text-sm text-[#0F172A] mb-1">
              High Availability
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              Engineered for sub-50ms failover so critical requests route reliably during crises.
            </p>
          </div>

          <div className="p-5 bg-slate-50/60 rounded-lg border border-slate-200/80 text-center">
            <span className="font-mono text-xs font-semibold text-slate-500 uppercase block mb-1">
              TRANSPARENCY
            </span>
            <h4 className="font-poppins font-semibold text-sm text-[#0F172A] mb-1">
              Verifiable Audits
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              Every matched transfer preserves a cryptographic chain-of-custody for compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Final Action */}
      <div className="mt-16 text-center">
        <Link to="/register">
          <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Connect Your Organization
          </Button>
        </Link>
      </div>
    </div>
  );
};
