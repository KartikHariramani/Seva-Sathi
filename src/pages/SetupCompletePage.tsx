import React from 'react';
import { Link } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';
import { Button } from '../components/common/Button';
import { Check, ArrowRight } from 'lucide-react';

export const SetupCompletePage: React.FC = () => {
  const { data } = useRegistration();

  const orgName = data.organizationName || 'Metropolitan Health Center';
  const orgType = data.organizationType === 'blood_bank' ? 'Regional Blood Bank' : 'Hospital Node';

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto text-center">
        {/* Large Minimal Confirmation Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
        </div>

        {/* Heading */}
        <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-3">
          Your organization is ready.
        </h1>

        {/* Small Text */}
        <p className="text-base text-[#64748B] mb-8 font-normal">
          Your SevaSetu workspace has been created.
        </p>

        {/* Summary Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-left shadow-subtle mb-8 space-y-3 font-mono text-xs">
          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-400">ORGANIZATION:</span>
            <span className="font-bold text-[#0F172A]">{orgName}</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-400">TYPE:</span>
            <span className="text-slate-800">{orgType}</span>
          </div>

          <div className="flex justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-400">ID / NODE:</span>
            <span className="text-[#1E4C8A] font-semibold">{data.organizationId || 'HOSP-IND-9021'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">NETWORK STATUS:</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PEER CONNECTED
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link to="/hospital/dashboard">
            <Button variant="accent" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Go to Hospital Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
