import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import {
  Building2,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import type { Organization } from '../../types/organization';

export const HospitalRegisterPage: React.FC = () => {
  const { mutate } = useAppStore();

  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationNumber: '',
    licenseNumber: '',
    email: '',
    phone: '',
    address: '',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440010',
    latitude: 21.1458,
    longitude: 79.0882,
    contactPerson: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredOrg, setRegisteredOrg] = useState<Organization | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalName || !formData.email || !formData.licenseNumber) {
      setErrorMsg('Please complete all required statutory fields.');
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const newOrgId = 'ORG-HOSP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newOrg: Organization = {
      id: newOrgId,
      name: formData.hospitalName,
      code: 'HOSP-' + formData.hospitalName.slice(0, 5).toUpperCase().replace(/\s/g, ''),
      type: 'hospital',
      status: 'PENDING', // Requirement #9: status = PENDING
      licenseNumber: formData.licenseNumber,
      joinCode: 'HOSP-' + Math.floor(1000 + Math.random() * 9000),
      location: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        coordinates: {
          lat: Number(formData.latitude) || 21.1458,
          lng: Number(formData.longitude) || 79.0882,
          x: 45,
          y: 50,
        },
      },
      contact: {
        primaryPhone: formData.phone,
        email: formData.email,
      },
      registeredAt: new Date().toISOString(),
      stats: {
        totalInventoryUnits: 0,
        criticalStockGroups: [],
        activeRequestsCount: 0,
        completedTransfersCount: 0,
        lastActiveAt: new Date().toISOString(),
      },
      notes: `Self-registered hospital application by ${formData.contactPerson}`,
    };

    // Commit to state and audit log
    mutate((draft) => {
      draft.organizations.unshift(newOrg);
      draft.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorId: formData.email,
        actorName: formData.contactPerson || formData.hospitalName,
        actorRole: 'hospital',
        organizationId: newOrgId,
        organizationName: formData.hospitalName,
        action: 'ORGANIZATION_REGISTERED',
        entityType: 'ORGANIZATION',
        entityId: newOrgId,
        severity: 'NOTICE',
        reason: 'New hospital organization application registered. Pending state verification.',
        newState: newOrg,
      });
    }, 'ORGANIZATION_UPDATED');

    setIsSubmitting(false);
    setRegisteredOrg(newOrg);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-poppins font-bold text-xl text-[#0F172A] tracking-tight">
              SevaSetu
            </span>
          </Link>

          <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Hospital Network Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register your healthcare facility to participate in predictive blood load balancing.
          </p>
        </div>

        {/* REGISTRATION SUCCESS BANNER (Requirement #10) */}
        {registeredOrg ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-8 shadow-md space-y-6 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="font-poppins font-bold text-xl text-slate-900">
                Registration Submitted Successfully
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your hospital profile is currently <strong>under administrative verification</strong>.
                An authorized state network administrator must verify your statutory license before you can request network blood reserves or receive consignments.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs font-mono space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Hospital:</span>
                <strong>{registeredOrg.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License Number:</span>
                <strong>{registeredOrg.licenseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  PENDING VERIFICATION
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1E4C8A] hover:bg-[#0F2E5A] text-white text-xs font-semibold text-center transition-colors shadow-xs"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            {errorMsg && (
              <div className="p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Official Hospital Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    placeholder="e.g. Nagpur Institute of Medical Sciences"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Hospital Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g. REG-MH-HOSP-1092"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Statutory License / Authorization <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="e.g. LIC-MH-NGP-2025-9921"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Official Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@hospital.org"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Emergency Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 712 250 0000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Physical Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot / Road, Area, Landmark"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Contact Person / Medical Director
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Dr. Rajesh Verma"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create secure admin password"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Already registered? Sign In
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Registering...' : 'Submit Application'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
