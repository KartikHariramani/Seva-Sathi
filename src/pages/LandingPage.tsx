import React from 'react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/common/SectionHeading';
import { Button } from '../components/common/Button';
import { HeroNetworkVisual } from '../components/network/HeroNetworkVisual';
import { ProblemComparison } from '../components/landing/ProblemComparison';
import { HowItWorksTimeline } from '../components/landing/HowItWorksTimeline';
import { IntelligenceSection } from '../components/landing/IntelligenceSection';
import { NetworkMapDiagram } from '../components/network/NetworkMapDiagram';
import { ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const scrollToProblem = () => {
    const el = document.getElementById('problem-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-100 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-[#C1272D] uppercase font-inter">
              AI-POWERED BLOOD NETWORK
            </span>
          </div>

          {/* Hero Statement */}
          <h1 className="font-poppins font-bold text-4xl sm:text-6xl lg:text-7xl text-[#0F172A] tracking-tight leading-[1.08] text-balance mb-6">
            Prevent blood shortages
            <br />
            <span className="text-[#C1272D]">before they happen.</span>
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-[#64748B] font-normal leading-relaxed text-balance mb-8">
            SevaSetu predicts demand, detects stockout risk and intelligently coordinates blood inventory across connected hospitals and blood banks.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
            <Button
              variant="accent"
              size="lg"
              onClick={scrollToProblem}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore SevaSetu
            </Button>
            <Link to="/how-it-works">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Micro Hero Network Visualization */}
          <HeroNetworkVisual />
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section
        id="problem-section"
        className="py-18 lg:py-28 px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-[#F8FAFC]"
      >
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            eyebrow="THE CRITICAL CHALLENGE"
            title={
              <>
                Blood doesn't always run out.
                <br />
                <span className="text-slate-500 font-normal">Sometimes it just isn't where it's needed.</span>
              </>
            }
            description="While emergency centers face life-threatening deficits, regional storage repositories frequently discard units nearing expiration. The issue is coordination, not absolute volume."
            align="center"
          />

          <ProblemComparison />
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="CONTINUOUS COORDINATION"
            title="How SevaSetu Works"
            description="A four-stage predictive pipeline transforming static blood banks into a synchronized, resilient grid."
            align="center"
          />

          <HowItWorksTimeline />

          <div className="text-center mt-10">
            <Link to="/how-it-works">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Deep Dive: Complete Technical Workflow
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. INTELLIGENCE SECTION (DARK) */}
      <IntelligenceSection />

      {/* 5. NETWORK SECTION */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="INFRASTRUCTURE TOPOLOGY"
            title="A connected blood network."
            description="Live simulated telemetry demonstrating real-time matching between healthcare facilities and certified blood repositories."
            align="center"
          />

          <NetworkMapDiagram interactive={true} />

          <div className="text-center mt-8">
            <Link to="/network">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Explore Full Interactive Network
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. IMPACT SECTION */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="SYSTEM OUTCOMES"
            title="Clinical Impact"
            description="Qualitative transformation across connected healthcare providers."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            {/* Impact 1 */}
            <div className="p-8 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-[#C1272D] uppercase block mb-3">
                  SHORTAGES
                </span>
                <h3 className="font-poppins font-semibold text-2xl text-[#0F172A] mb-3">
                  Prevented
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Anticipated 24 to 48 hours prior to surgical procedures through multi-facility predictive alerts, eliminating emergency scramble.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200/60 text-xs font-mono text-slate-400">
                PROACTIVE DISPATCH PROTOCOL
              </div>
            </div>

            {/* Impact 2 */}
            <div className="p-8 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-[#10B981] uppercase block mb-3">
                  WASTAGE
                </span>
                <h3 className="font-poppins font-semibold text-2xl text-[#0F172A] mb-3">
                  Reduced
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Systematically lowered through expiry-aware redistribution, prioritizing units nearing viability limits for immediate clinical matches.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200/60 text-xs font-mono text-slate-400">
                VIABILITY-FIRST ALLOCATION
              </div>
            </div>

            {/* Impact 3 */}
            <div className="p-8 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-[#1E4C8A] uppercase block mb-3">
                  RESPONSE
                </span>
                <h3 className="font-poppins font-semibold text-2xl text-[#0F172A] mb-3">
                  Accelerated
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Sub-second identification of compatible units across regional repositories, replacing manual phone calls with coordinated digital locks.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-200/60 text-xs font-mono text-slate-400">
                DIGITAL AUDIT TRAIL
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-mono font-semibold tracking-widest text-[#C1272D] uppercase mb-4">
            JOIN THE ECOSYSTEM
          </span>
          <h2 className="font-poppins font-semibold text-4xl sm:text-5xl lg:text-6xl text-[#0F172A] tracking-tight mb-6">
            Build a safer blood network.
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-[#64748B] mb-10 leading-relaxed text-balance">
            Connect your hospital or blood bank to SevaSetu.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="accent" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
            <Link to="/network">
              <Button variant="secondary" size="lg">
                Explore the Network
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
