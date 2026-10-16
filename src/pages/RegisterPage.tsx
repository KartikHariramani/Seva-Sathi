import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegistration } from '../context/RegistrationContext';
import type { OrganizationType } from '../types';
import { Button } from '../components/common/Button';
import {
  Building2,
  HeartPulse,
  ArrowRight,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateOrganizationData } = useRegistration();

  const [orgType, setOrgType] = useState<OrganizationType>(data.organizationType || 'hospital');
  const [orgName, setOrgName] = useState(data.organizationName || '');
  const [orgId, setOrgId] = useState(data.organizationId || '');
  const [address, setAddress] = useState(data.address || '');
  const [city, setCity] = useState(data.city || '');
  const [contactNumber, setContactNumber] = useState(data.contactNumber || '');
  const [adminName, setAdminName] = useState(data.adminName || '');
  const [email, setEmail] = useState(data.email || '');
  const [password, setPassword] = useState(data.password || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!orgName.trim()) errs.orgName = 'Organization name is required';
    if (!orgId.trim()) errs.orgId = 'Organization ID is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    if (!adminName.trim()) errs.adminName = 'Administrator name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!password || password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateOrganizationData({
      organizationType: orgType,
      organizationName: orgName,
      organizationId: orgId,
      address,
      city,
      contactNumber,
      adminName,
      email,
      password,
    });

    navigate('/setup-inventory');
  };

  const fillSampleData = (type: OrganizationType) => {
    setOrgType(type);
    if (type === 'hospital') {
      setOrgName('St. Jude Apex Trauma Center');
      setOrgId('HOSP-IND-9021');
      setAddress('742 Healthcare Boulevard, Sector 12');
      setCity('New Delhi');
      setContactNumber('+91 11 2890 4400');
      setAdminName('Dr. Aris Thorne, MD');
      setEmail('aris.thorne@apextrauma.org');
      setPassword('securePass2026');
    } else {
      setOrgName('National Red Cross Blood Center');
      setOrgId('BANK-DEL-401');
      setAddress('18 Blood Transfusion Road');
      setCity('New Delhi');
      setContactNumber('+91 11 2341 8900');
      setAdminName('Suresh Raman, Operations Head');
      setEmail('s.raman@redcrossregional.org');
      setPassword('securePass2026');
    }
    setErrors({});
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Progress Steps Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
          <span className="font-semibold text-[#C1272D]">STEP 01 OF 02</span>
          <span>ORGANIZATION DETAILS</span>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-[#C1272D] rounded-full" />
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Register your organization
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Join the SevaSetu predictive blood network to coordinate inventory and prevent shortages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fillSampleData('hospital')}
              className="text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Fill Sample Hospital
            </button>
            <button
              type="button"
              onClick={() => fillSampleData('blood_bank')}
              className="text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Fill Sample Bank
            </button>
          </div>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          {/* Organization Type Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
              Organization Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                  orgType === 'hospital'
                    ? 'border-[#C1272D] bg-red-50/20 ring-1 ring-[#C1272D]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="orgType"
                  value="hospital"
                  checked={orgType === 'hospital'}
                  onChange={() => setOrgType('hospital')}
                  className="mt-1 text-[#C1272D] focus:ring-[#C1272D]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-[#0F172A]">
                    <Building2 className="w-4 h-4 text-[#C1272D]" />
                    <span>Hospital / Trauma Center</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Consumes blood products, reports demand surges, requests emergency stock.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                  orgType === 'blood_bank'
                    ? 'border-[#1E4C8A] bg-blue-50/20 ring-1 ring-[#1E4C8A]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="orgType"
                  value="blood_bank"
                  checked={orgType === 'blood_bank'}
                  onChange={() => setOrgType('blood_bank')}
                  className="mt-1 text-[#1E4C8A] focus:ring-[#1E4C8A]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-[#0F172A]">
                    <HeartPulse className="w-4 h-4 text-[#1E4C8A]" />
                    <span>Certified Blood Bank</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Collects donations, holds reserve inventory, supplies regional networks.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Org Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-name"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Apex Trauma Center"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.orgName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.orgName && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.orgName}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="org-id"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Organization ID / Registration Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-id"
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="e.g. HOSP-IND-9021"
                className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.orgId ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.orgId && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.orgId}</span>
              )}
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="org-address"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Facility Address
              </label>
              <input
                id="org-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Healthcare Boulevard"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
              />
            </div>

            <div>
              <label
                htmlFor="org-city"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                City / Region <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.city ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.city && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.city}</span>
              )}
            </div>
          </div>

          {/* Contact & Admin Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-contact"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Emergency Dispatch Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-contact"
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 11 2890 4400"
                className={`w-full px-3 py-2 text-sm font-mono bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.contactNumber ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.contactNumber && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.contactNumber}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="org-admin"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Administrator / Medical Superintendent Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-admin"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Dr. Aris Thorne"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.adminName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.adminName && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.adminName}</span>
              )}
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="org-email"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Official Organization Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hospital.org"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.email && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.email}</span>
              )}
            </div>

            <div>
              <label
                htmlFor="org-password"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-md focus:bg-white focus:outline-none focus:ring-1 text-[#0F172A] ${
                  errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-[#1E4C8A]'
                }`}
              />
              {errors.password && (
                <span className="text-[11px] text-rose-600 mt-1 block">{errors.password}</span>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-[#C1272D] font-semibold hover:underline">
                Login here
              </Link>
            </span>

            <Button
              type="submit"
              variant="accent"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Inventory Setup
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
