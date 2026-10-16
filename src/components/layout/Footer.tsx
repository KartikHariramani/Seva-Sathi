import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Left Brand Column */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C1272D]" />
              <span className="font-poppins font-bold text-xl tracking-tight text-[#0F172A]">
                SevaSetu
              </span>
            </div>
            <p className="text-sm font-medium text-[#64748B]">
              AI-powered blood inventory intelligence.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Predict. Balance. Protect.
            </p>
          </div>

          {/* Right Links Column */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-[#64748B]">
            <Link to="/" className="hover:text-[#0F172A] transition-colors">
              Product
            </Link>
            <Link to="/how-it-works" className="hover:text-[#0F172A] transition-colors">
              How It Works
            </Link>
            <Link to="/network" className="hover:text-[#0F172A] transition-colors">
              Network
            </Link>
            <Link to="/about" className="hover:text-[#0F172A] transition-colors">
              About
            </Link>
            <Link to="/login" className="hover:text-[#0F172A] transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-[#C1272D] transition-colors">
              Register
            </Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            © 2026 SevaSetu. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-600">Built for healthcare coordination.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
