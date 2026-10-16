import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BloodGroup } from '../../types';
import type { CreateBloodRequestInput, RequestPriority } from '../../types/bloodRequest';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { useRegistration } from '../../context/RegistrationContext';
import { useAuth } from '../../context/AuthContext';
import { validateBloodRequest, validateSingleField } from '../../utils/requestValidation';
import {
  calculateUrgencyDeadline,
  getDefaultClinicalReason,
} from '../../utils/urgencyPolicy';
import { RequestIntelligencePreview } from './RequestIntelligencePreview';
import { Button } from '../common/Button';
import {
  Calendar,
  AlertCircle,
  AlertTriangle,
  Building2,
  MapPin,
  ArrowRight,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RequestFormProps {
  initialValues?: Partial<CreateBloodRequestInput>;
  onSubmit: (data: CreateBloodRequestInput) => Promise<void>;
  onSaveDraft: (data: Partial<CreateBloodRequestInput>) => Promise<void>;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RequestForm: React.FC<RequestFormProps> = ({
  initialValues,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isSavingDraft = false,
}) => {
  const navigate = useNavigate();
  const { getInventoryByBloodGroup } = useHospitalInventory();
  const { data: regData } = useRegistration();
  const { user } = useAuth();

  const orgName = regData.organizationName || user?.orgName || 'XYZ Hospital';
  const orgCity = regData.city ? `${regData.city}, Maharashtra` : 'Nagpur, Maharashtra';

  // Form State
  const initialPriority = initialValues?.priority || 'emergency';
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(initialValues?.bloodGroup || 'O+');
  const [quantity, setQuantity] = useState<string>(
    initialValues?.quantityLitres !== undefined ? initialValues.quantityLitres.toString() : '2.0'
  );
  const [priority, setPriority] = useState<RequestPriority>(initialPriority);
  const [requiredBy, setRequiredBy] = useState<string>(
    initialValues?.requiredBy || calculateUrgencyDeadline(initialPriority)
  );
  const [reason, setReason] = useState<string>(
    initialValues?.reason || getDefaultClinicalReason(initialPriority)
  );

  // Delivery details customization
  const [showCustomDelivery, setShowCustomDelivery] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(
    initialValues?.deliveryLocation || 'Emergency Blood Storage Unit'
  );
  const [department, setDepartment] = useState(initialValues?.department || 'Trauma & Emergency Wing');
  const [contactPhone, setContactPhone] = useState(initialValues?.contactPhone || '+91 712 256 8900');

  // Touched and validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Inventory context lookup (Section 14 & 47)
  const currentStockItem = useMemo(() => {
    if (!bloodGroup) return undefined;
    return getInventoryByBloodGroup(bloodGroup as BloodGroup);
  }, [bloodGroup, getInventoryByBloodGroup]);

  const parsedQty = parseFloat(quantity) || 0;
  const availableStock = currentStockItem ? currentStockItem.availableQuantity : 0;
  const stockGap = Math.max(0, parsedQty - availableStock);

  // Field validation on change or blur
  const validateCurrentForm = () => {
    const res = validateBloodRequest({
      bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
      quantityLitres: parsedQty,
      priority,
      requiredBy: requiredBy || calculateUrgencyDeadline(priority),
      reason: reason.trim() || getDefaultClinicalReason(priority),
    });
    setErrors(res.errors);
    return res.isValid;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateSingleField(
      field as keyof CreateBloodRequestInput,
      field === 'quantityLitres' ? parsedQty : field === 'bloodGroup' ? bloodGroup : priority,
      {
        bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
        quantityLitres: parsedQty,
        priority,
        requiredBy: requiredBy || calculateUrgencyDeadline(priority),
        reason: reason.trim() || getDefaultClinicalReason(priority),
      }
    );
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  /**
   * Automatically calculates and sets the required-by time and clinical protocol reason based on urgency policy:
   * - Emergency: exactly 1 hour from current time
   * - Urgent: 2 hours from current time
   * - Routine: 24 hours standard fulfillment window
   */
  const handlePrioritySelect = (newPriority: RequestPriority) => {
    setPriority(newPriority);
    setIsDirty(true);

    const calculatedDeadline = calculateUrgencyDeadline(newPriority);
    setRequiredBy(calculatedDeadline);
    setReason(getDefaultClinicalReason(newPriority));

    setErrors((prev) => ({
      ...prev,
      priority: undefined,
      requiredBy: undefined,
      reason: undefined,
    }));
  };

  const handleQuantityPreset = (amount: number) => {
    setQuantity(amount.toFixed(1));
    setIsDirty(true);
    setTouched((prev) => ({ ...prev, quantityLitres: true }));
    setErrors((prev) => ({ ...prev, quantityLitres: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      bloodGroup: true,
      quantityLitres: true,
      priority: true,
    });

    if (!validateCurrentForm()) {
      return;
    }

    if (!bloodGroup) return;

    // Emergency deadline automation: ensure fresh deadline strictly conforms to urgency policy
    let finalDeadline = requiredBy || calculateUrgencyDeadline(priority);
    const parsedTarget = new Date(finalDeadline).getTime();
    if (isNaN(parsedTarget) || parsedTarget <= Date.now()) {
      finalDeadline = calculateUrgencyDeadline(priority);
      setRequiredBy(finalDeadline);
    }

    const finalReason = reason.trim() || getDefaultClinicalReason(priority);

    await onSubmit({
      bloodGroup: bloodGroup as BloodGroup,
      quantityLitres: parsedQty,
      priority,
      requiredBy: finalDeadline,
      reason: finalReason,
      deliveryLocation,
      department,
      contactPhone,
      status: 'pending_approval',
    });
  };

  const handleSaveDraftClick = async () => {
    if (!bloodGroup) {
      setErrors((prev) => ({ ...prev, bloodGroup: 'Please select a blood group to save draft.' }));
      return;
    }

    const finalDeadline = requiredBy || calculateUrgencyDeadline(priority);
    const finalReason = reason.trim() || getDefaultClinicalReason(priority);

    await onSaveDraft({
      bloodGroup: bloodGroup as BloodGroup,
      quantityLitres: parsedQty || 1.0,
      priority,
      requiredBy: finalDeadline,
      reason: finalReason,
      deliveryLocation,
      department,
      contactPhone,
      status: 'draft',
    });
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      navigate('/hospital/requests');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* SECTION 1 — Blood Requirement (Section 13) */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C1272D] block mb-0.5">
                Section 01
              </span>
              <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
                What blood do you need?
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Required</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select the required ABO / Rh group and required volume in litres.
          </p>
        </div>

        {/* Blood Group Selectable Cards (Section 13) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
            Select Blood Group
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-2.5">
            {BLOOD_GROUPS.map((group) => {
              const isSelected = bloodGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setBloodGroup(group);
                    setIsDirty(true);
                    setTouched((prev) => ({ ...prev, bloodGroup: true }));
                    setErrors((prev) => ({ ...prev, bloodGroup: undefined }));
                  }}
                  className={`py-3 px-2 rounded-xl text-center border font-mono font-bold text-base sm:text-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/70 border-[#C1272D] text-[#C1272D] shadow-xs ring-2 ring-[#C1272D]/20'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="block">{group}</span>
                </button>
              );
            })}
          </div>
          {touched.bloodGroup && errors.bloodGroup && (
            <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.bloodGroup}</span>
            </p>
          )}
        </div>

        {/* Quantity Field & Stepper (Section 13) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="required-quantity-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Required Quantity (Litres)
            </label>
            <span className="text-xs font-mono text-slate-400">
              1 Unit &asymp; 0.45 &ndash; 0.50 L
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-xs w-full">
              <input
                id="required-quantity-input"
                type="number"
                step="0.1"
                min="0.1"
                max="20"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setIsDirty(true);
                  setTouched((prev) => ({ ...prev, quantityLitres: true }));
                }}
                onBlur={() => handleBlur('quantityLitres')}
                placeholder="2.0"
                className="w-full py-2.5 px-3.5 pr-12 text-sm sm:text-base font-mono font-bold text-[#0F172A] bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400 pointer-events-none">
                Litres
              </span>
            </div>

            {/* Quick clinical presets */}
            <div className="flex items-center gap-1.5">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuantityPreset(preset)}
                  className={`text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                    parsedQty === preset
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{preset} L
                </button>
              ))}
            </div>
          </div>

          {touched.quantityLitres && errors.quantityLitres && (
            <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.quantityLitres}</span>
            </p>
          )}
        </div>

        {/* INVENTORY CONTEXT PANEL (Section 14 & 47) */}
        {bloodGroup && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 uppercase tracking-wide text-[11px]">
                Current Hospital Stock Context ({bloodGroup})
              </span>
              <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.2 rounded">
                Live Node Ledger
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">HOSPITAL STOCK</span>
                <span className="font-bold text-[#0F172A] text-sm sm:text-base">
                  {availableStock.toFixed(1)} L
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">REQUESTED</span>
                <span className="font-bold text-[#0F172A] text-sm sm:text-base">
                  {parsedQty > 0 ? `${parsedQty.toFixed(1)} L` : '—'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">PROJECTED GAP</span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    stockGap > 0 ? 'text-[#C1272D]' : 'text-emerald-700'
                  }`}
                >
                  {stockGap > 0 ? `−${stockGap.toFixed(1)} L` : 'Covered'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block mb-0.5">STOCK STATUS</span>
                <span className="font-semibold text-slate-800 text-xs sm:text-sm capitalize block mt-0.5">
                  {currentStockItem?.status || 'Active'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 font-inter">
              * This context panel reflects your verified local cold storage ledger. It helps justify network requisition volume.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2 — Priority (Section 15) */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C1272D] block mb-0.5">
                Section 02
              </span>
              <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
                How urgent is this request?
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Required</span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Urgency determines automated routing, alert priority, and dispatch queue position.
          </p>
        </div>

        {/* 3 Priority Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Routine */}
          <button
            type="button"
            onClick={() => handlePrioritySelect('routine')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              priority === 'routine'
                ? 'bg-blue-50/60 border-[#1E4C8A] shadow-xs ring-2 ring-[#1E4C8A]/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  priority === 'routine' ? 'bg-[#1E4C8A] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="font-poppins font-semibold text-sm text-[#0F172A]">Routine</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Planned requirement</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Elective surgeries or scheduled therapeutic transfusions (24h fulfillment).
            </p>
          </button>

          {/* Urgent */}
          <button
            type="button"
            onClick={() => handlePrioritySelect('urgent')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              priority === 'urgent'
                ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  priority === 'urgent' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="font-poppins font-semibold text-sm text-[#0F172A]">Urgent</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Needed soon</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Active surgical cases or acute inpatient stabilization within 2 hrs.
            </p>
          </button>

          {/* Emergency */}
          <button
            type="button"
            onClick={() => handlePrioritySelect('emergency')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              priority === 'emergency'
                ? 'bg-rose-50/70 border-[#C1272D] shadow-xs ring-2 ring-[#C1272D]/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  priority === 'emergency' ? 'bg-[#C1272D] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="font-poppins font-semibold text-sm text-[#0F172A]">Emergency</span>
            </div>
            <p className="text-xs font-semibold text-[#C1272D] mb-1">Immediate requirement</p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Massive hemorrhage, trauma resuscitation, required within exactly 1 hr.
            </p>
          </button>
        </div>

        {/* Urgency Policy SLA Banner */}
        {priority === 'emergency' && (
          <div className="mt-3.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50/90 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-md bg-[#C1272D] text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-poppins font-semibold text-xs text-[#C1272D]">
                  Emergency request: required within 1 hour.
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-200/80 text-rose-800 rounded font-bold uppercase tracking-wider">
                  SLA Enforced
                </span>
              </div>
              <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                The arrival deadline is automatically computed for exactly 1 hour from current time ({new Date(requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Emergency medical couriers and dispatchers prioritize this requisition instantly upon submission.
              </p>
            </div>
          </div>
        )}

        {priority === 'urgent' && (
          <div className="mt-3.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50/90 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-poppins font-semibold text-xs text-amber-900">
                  Urgent request: required within 2 hours.
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200/80 text-amber-800 rounded font-bold uppercase tracking-wider">
                  2-Hour Window
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                The arrival deadline is automatically populated for 2 hours from current time ({new Date(requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
              </p>
            </div>
          </div>
        )}

        {priority === 'routine' && (
          <div className="mt-3.5 p-3.5 rounded-xl border border-blue-200 bg-blue-50/90 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-md bg-[#1E4C8A] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-poppins font-semibold text-xs text-[#1E4C8A]">
                  Routine request: standard fulfillment window (24 hours).
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-200/80 text-blue-800 rounded font-bold uppercase tracking-wider">
                  24-Hour Queue
                </span>
              </div>
              <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                Standard fulfillment window configured for scheduled cold-chain delivery ({new Date(requiredBy).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
              </p>
            </div>
          </div>
        )}

        {touched.priority && errors.priority && (
          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-inter">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.priority}</span>
          </p>
        )}
      </section>

      {/* SECTION 3 — Contact & Delivery Information */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C1272D] block mb-0.5">
              Section 03
            </span>
            <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
              Delivery Destination
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomDelivery(!showCustomDelivery)}
            className="text-xs font-medium text-[#1E4C8A] hover:text-[#0F2E5A] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{showCustomDelivery ? 'Hide details' : 'Edit unit / contact'}</span>
            {showCustomDelivery ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Read-only Hospital Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Hospital Node</span>
              <span className="font-bold text-[#0F172A]">{orgName}</span>
              <span className="text-slate-500 text-[11px] block">{orgCity}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Storage Intake Point</span>
              <span className="font-semibold text-slate-800">{deliveryLocation}</span>
              <span className="text-slate-500 text-[11px] block">{department}</span>
            </div>
          </div>
        </div>

        {/* Optional Customization Fields */}
        {showCustomDelivery && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label htmlFor="custom-delivery-point" className="block text-[11px] font-medium text-slate-600 mb-1">
                Specific Intake Point
              </label>
              <input
                id="custom-delivery-point"
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="custom-department" className="block text-[11px] font-medium text-slate-600 mb-1">
                Department / Ward
              </label>
              <input
                id="custom-department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="custom-contact-phone" className="block text-[11px] font-medium text-slate-600 mb-1">
                Duty Contact Number
              </label>
              <input
                id="custom-contact-phone"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5 — Future AI Preview (Section 48) */}
      <RequestIntelligencePreview />

      {/* SECTION 6 — Request Pre-Submission Summary & Bottom Actions (Section 18 & 19) */}
      <div className="sticky bottom-4 z-20 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-premium-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick parameter confirmation */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
            <span className="font-semibold text-slate-400 uppercase text-[10px]">Summary:</span>
            <span className="font-bold text-sm text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {bloodGroup || '—'}
            </span>
            <span className="font-bold text-[#0F172A]">
              {parsedQty > 0 ? `${parsedQty.toFixed(1)} L` : '—'}
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="capitalize font-medium text-slate-800">{priority}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500">
              {orgName}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isSubmitting || isSavingDraft}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              isLoading={isSavingDraft}
              onClick={handleSaveDraftClick}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Draft
            </Button>

            <Button
              type="submit"
              variant="accent"
              size="md"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit Blood Request
            </Button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal (Section 36) */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-premium-lg border border-slate-200 animate-in zoom-in-95 duration-150">
            <h4 className="font-poppins font-semibold text-base text-[#0F172A] mb-1">
              Leave without saving?
            </h4>
            <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
              You have unsaved changes to this blood requisition. If you leave now, these modifications will be discarded.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowUnsavedModal(false)}
              >
                Stay
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  setShowUnsavedModal(false);
                  navigate('/hospital/requests');
                }}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
