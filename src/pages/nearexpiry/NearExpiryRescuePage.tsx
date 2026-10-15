import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  PlusCircle,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  Filter,
  Check,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { useAppStore } from '../../store/appStore';
import type { BloodGroup } from '../../types';
import type {
  NearExpiryAlert,
  BloodComponent,
  CreateNearExpiryAlertInput,
} from '../../types/nearExpiry';
import { nearExpiryService } from '../../services/nearExpiryService';
import { localEventBus } from '../../sync/localEventBus';

export const NearExpiryRescuePage: React.FC = () => {
  const { user } = useAuth();
  const { mutate } = useAppStore();
  const { getInventoryByBloodGroup, updateInventory } = useHospitalInventory();

  const [alerts, setAlerts] = useState<NearExpiryAlert[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedWindow, setSelectedWindow] = useState<number>(72);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedAlertToClaim, setSelectedAlertToClaim] = useState<NearExpiryAlert | null>(null);

  // Claim Form State
  const [claimDoctor, setClaimDoctor] = useState(user?.userName || 'Dr. Transfusion Officer');
  const [claimIndication, setClaimIndication] = useState('Emergency trauma surgery / critical ICU transfusion');
  const [claimUrgency, setClaimUrgency] = useState<'critical' | 'high' | 'routine'>('critical');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Publish Form State
  const [publishGroup, setPublishGroup] = useState<BloodGroup>('O+');
  const [publishComponent, setPublishComponent] = useState<BloodComponent>('Packed Red Blood Cells (PRBC)');
  const [publishQuantity, setPublishQuantity] = useState<number>(2);
  const [publishBatchId, setPublishBatchId] = useState<string>('PRBC-' + Math.floor(1000 + Math.random() * 9000));
  const [publishExpiry, setPublishExpiry] = useState<string>(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [publishStorage, setPublishStorage] = useState('Cold Vault 2°C - 6°C');
  const [publishConstraints, setPublishConstraints] = useState('Strict cold-chain transit required; dispatch within 3 hours');

  const bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const componentOptions: BloodComponent[] = [
    'Whole Blood',
    'Packed Red Blood Cells (PRBC)',
    'Platelet Concentrate',
    'Fresh Frozen Plasma (FFP)',
    'Cryoprecipitate',
  ];

  const loadAlerts = () => {
    const data = nearExpiryService.getAlerts({
      bloodGroup: selectedGroup !== 'ALL' ? (selectedGroup as BloodGroup) : undefined,
      maxHours: selectedWindow,
      status: statusFilter,
    });
    setAlerts(data);
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // 10s auto-refresh
    const unsubCreated = localEventBus.on('near_expiry.created', loadAlerts);
    const unsubClaimed = localEventBus.on('near_expiry.claimed', loadAlerts);

    return () => {
      clearInterval(interval);
      unsubCreated();
      unsubClaimed();
    };
  }, [selectedGroup, selectedWindow, statusFilter]);

  const handlePublishAlert = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expDate = new Date(publishExpiry).toISOString();
      const input: CreateNearExpiryAlertInput = {
        bloodBankId: user?.orgId || 'ORG-BANK-01',
        bloodBankName: user?.orgName || 'Central City Blood Bank & Apheresis Depot',
        bloodBankCity: 'Nagpur',
        bloodBankContact: '+91 712 2548901',
        coordinates: { lat: 21.1458, lng: 79.0882 },
        bloodGroup: publishGroup,
        component: publishComponent,
        quantityUnits: publishQuantity,
        batchOrUnitId: publishBatchId,
        expiryTimestamp: expDate,
        storageCondition: publishStorage,
        handlingConstraints: publishConstraints,
        responseDeadlineHours: 12,
      };

      nearExpiryService.createAlert(input);
      setIsPublishModalOpen(false);
      loadAlerts();
      alert('Near-expiry rescue alert published successfully to regional healthcare network!');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertToClaim) return;

    const result = nearExpiryService.claimAlert({
      alertId: selectedAlertToClaim.id,
      hospitalId: user?.orgId || 'ORG-HOSP-01',
      hospitalName: user?.orgName || 'Metropolitan Trauma & General Hospital',
      requestedUnits: selectedAlertToClaim.quantityUnits,
      clinicalIndication: claimIndication,
      urgency: claimUrgency,
      transfusionOfficer: claimDoctor,
    });

    if (result.success) {
      const item = getInventoryByBloodGroup(selectedAlertToClaim.bloodGroup);
      const curr = item?.availableQuantity || 0;
      const newQty = curr + selectedAlertToClaim.quantityUnits;
      await updateInventory(
        selectedAlertToClaim.bloodGroup,
        newQty,
        selectedAlertToClaim.expiryTimestamp,
        `Near-Expiry Rescue: ${selectedAlertToClaim.component}`
      );

      const txnId = 'TXN-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 6);
      mutate((draft) => {
        draft.transactions.unshift({
          id: txnId,
          transactionId: txnId,
          organizationId: user?.orgId || 'ORG-HOSP-01',
          hospitalId: user?.orgId || 'ORG-HOSP-01',
          bloodGroup: selectedAlertToClaim.bloodGroup,
          transactionType: 'RECEIVED',
          quantityLitres: selectedAlertToClaim.quantityUnits,
          quantityBefore: curr,
          quantityAfter: newQty,
          referenceType: 'NETWORK_REFILL',
          referenceId: result.reservationId || 'RES-EXP-01',
          reason: `Near-Expiry Rescue Transfer: ${selectedAlertToClaim.bloodBankName}`,
          notes: `Clinical Indication: ${claimIndication}. Component: ${selectedAlertToClaim.component}, Unit ID: ${selectedAlertToClaim.batchOrUnitId}`,
          performedBy: claimDoctor,
          verifiedBy: 'Regional Cold-Chain Dispatch Officer',
          status: 'VERIFIED',
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      });

      setClaimSuccessMessage(
        `Rescue units reserved successfully! Reservation Code: ${result.reservationId}. Cold-chain transit dispatch scheduled.`
      );
      setIsClaimModalOpen(false);
      setSelectedAlertToClaim(null);
      loadAlerts();
    } else {
      alert(result.error || 'Failed to claim units.');
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.status === 'ACTIVE' && a.hoursRemaining <= 24).length;
  const reservedCount = alerts.filter((a) => a.status === 'RESERVED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              Near-Expiry Blood Rescue
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              Zero-Wastage Directive
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Intelligently match, reserve, and transfer eligible blood components before their recorded expiration.
          </p>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#C1272D] hover:bg-[#A01F24] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Near-Expiry Alert</span>
        </button>
      </div>

      {claimSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{claimSuccessMessage}</span>
          </div>
          <button
            onClick={() => setClaimSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">{criticalCount}</div>
            <div className="text-xs text-slate-500 font-medium">Critical (&lt;24h Shelf Life)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">{activeCount}</div>
            <div className="text-xs text-slate-500 font-medium">Active Rescue Opportunities</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">{reservedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Rescued & Allocated Units</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* Blood Group Select */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Blood Groups</option>
            {bloodGroupOptions.map((bg) => (
              <option key={bg} value={bg}>
                Group {bg}
              </option>
            ))}
          </select>

          {/* Window Select */}
          <select
            value={selectedWindow}
            onChange={(e) => setSelectedWindow(parseInt(e.target.value, 10))}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value={24}>Within 24 Hours</option>
            <option value={48}>Within 48 Hours</option>
            <option value={72}>Within 72 Hours</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ACTIVE">Active Available</option>
            <option value="RESERVED">Claimed / Reserved</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {alerts.length} rescue record{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Alerts Grid */}
      {alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">No near-expiry blood alerts match current filters.</p>
          <p className="text-xs text-slate-400">All regional inventory units have healthy shelf-life margins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alerts.map((alert) => {
            const isCritical = alert.hoursRemaining <= 24;
            const isReserved = alert.status === 'RESERVED';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isReserved
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isCritical
                      ? 'border-red-300 ring-1 ring-red-100'
                      : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badge & Time Window */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      isReserved
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isCritical
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{alert.hoursRemaining}h Shelf Life Left</span>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        isReserved
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-white shadow-xs text-slate-800'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold font-poppins text-[#C1272D]">
                            {alert.bloodGroup}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {alert.quantityUnits} Units
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-800 mt-1">
                          {alert.component}
                        </h4>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {alert.batchOrUnitId}
                      </span>
                    </div>

                    {/* Facility Info */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-900 truncate">
                          {alert.bloodBankName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{alert.bloodBankContact}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Expires: {new Date(alert.expiryTimestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Handling Instructions */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-700">Storage & Transit:</div>
                      <div>{alert.storageCondition}</div>
                      <div className="text-slate-500 italic">{alert.handlingConstraints}</div>
                    </div>

                    {isReserved && alert.claimedByHospitalName && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-900 font-mono">
                        <span className="font-bold">Allocated to:</span> {alert.claimedByHospitalName}
                        <div className="text-[10px] text-emerald-800">
                          Reservation ID: {alert.reservationId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="p-4 pt-0">
                  {!isReserved ? (
                    <button
                      onClick={() => {
                        setSelectedAlertToClaim(alert);
                        setIsClaimModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Request Rescue Allocation</span>
                    </button>
                  ) : (
                    <div className="text-center py-1.5 text-xs font-mono text-emerald-700 font-semibold flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Locked & In Transit
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLAIM RESCUE MODAL */}
      {isClaimModalOpen && selectedAlertToClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-poppins">
                  Claim Near-Expiry Rescue Units
                </h3>
                <p className="text-xs text-slate-500">
                  Atomic supply lock for {selectedAlertToClaim.quantityUnits} Units of {selectedAlertToClaim.bloodGroup}
                </p>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receiving Facility
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.orgName || 'Metropolitan Trauma Hospital'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Authorizing Transfusion Officer
                </label>
                <input
                  type="text"
                  required
                  value={claimDoctor}
                  onChange={(e) => setClaimDoctor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1272D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clinical Indication / Emergency Need
                </label>
                <textarea
                  rows={2}
                  required
                  value={claimIndication}
                  onChange={(e) => setClaimIndication(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C1272D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Urgency Priority
                </label>
                <select
                  value={claimUrgency}
                  onChange={(e) => setClaimUrgency(e.target.value as 'critical' | 'high' | 'routine')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="critical">Critical (Immediate surgical/ICU requirement)</option>
                  <option value="high">High (Required within 6 hours)</option>
                  <option value="routine">Routine (Scheduled transfusion)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold">Cold-Chain Protocol:</span>
                <div>
                  This blood component has {selectedAlertToClaim.hoursRemaining} hours of remaining shelf life. By claiming, your facility confirms immediate cold-chain reception capability.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C1272D] hover:bg-[#A01F24] text-white font-medium shadow-sm"
                >
                  Confirm & Reserve Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH ALERT MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-poppins">
                  Publish Near-Expiry Rescue Alert
                </h3>
                <p className="text-xs text-slate-500">
                  Notify regional hospitals to rescue eligible stock before expiry
                </p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAlert} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={publishGroup}
                    onChange={(e) => setPublishGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    {bloodGroupOptions.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Units (Quantity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={publishQuantity}
                    onChange={(e) => setPublishQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Component Type
                </label>
                <select
                  value={publishComponent}
                  onChange={(e) => setPublishComponent(e.target.value as BloodComponent)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  {componentOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit / Batch ID
                  </label>
                  <input
                    type="text"
                    required
                    value={publishBatchId}
                    onChange={(e) => setPublishBatchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={publishExpiry}
                    onChange={(e) => setPublishExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Storage Condition
                </label>
                <input
                  type="text"
                  value={publishStorage}
                  onChange={(e) => setPublishStorage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Handling & Transit Constraints
                </label>
                <textarea
                  rows={2}
                  value={publishConstraints}
                  onChange={(e) => setPublishConstraints(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C1272D] hover:bg-[#A01F24] text-white font-medium shadow-sm"
                >
                  Publish Regional Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
