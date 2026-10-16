import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HospitalLayout } from '../../components/hospital/HospitalLayout';
import { bloodRequestRepository } from '../../services/bloodRequestRepository';
import { bloodBankService } from '../../services/bloodBankService';
import { reservationService } from '../../services/reservationService';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import { useAppStore } from '../../store/appStore';
import { localEventBus } from '../../sync/localEventBus';
import { syncEngine } from '../../sync/broadcastSync';
import type { BloodRequest } from '../../types/bloodRequest';
import type { MatchingResult, BloodBankMatch } from '../../types/matching';
import type { BloodReservation } from '../../types/reservation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Lock,
  Truck,
  LineChart,
} from 'lucide-react';

export const BloodBankMatchingPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { refreshInventory } = useHospitalInventory();
  const { mutate } = useAppStore();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [activeReservation, setActiveReservation] = useState<BloodReservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedTxnId, setReceivedTxnId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!requestId) return;
    setIsLoading(true);
    setError(null);

    try {
      const req = await bloodRequestRepository.getRequest(requestId);
      if (!req) {
        setError('Blood request not found.');
        return;
      }
      setRequest(req);

      // Check existing reservation
      const res = await reservationService.getReservationByRequestId(req.id);
      setActiveReservation(res);

      // Run matching engine
      const match = await bloodBankService.matchBloodBanks(req);
      setMatchingResult(match);
    } catch (err: unknown) {
      console.error('Failed to load matching data', err);
      setError('Failed to compute network matching.');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();

    const unsub1 = localEventBus.on('INVENTORY_UPDATED', () => loadData());
    const unsub2 = localEventBus.on('REQUEST_UPDATED', () => loadData());
    const unsub3 = localEventBus.on('RESERVATION_CREATED', () => loadData());
    const unsub4 = syncEngine.subscribe((msg) => {
      if (
        msg.type === 'INVENTORY_UPDATED' ||
        msg.type === 'REQUEST_UPDATED' ||
        msg.type === 'RESERVATION_CREATED'
      ) {
        loadData();
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [loadData]);

  // Step 20: Atomic Blood Reservation Action
  const handleReserve = async (match: BloodBankMatch) => {
    if (!request) return;
    setIsReserving(true);
    setError(null);

    try {
      const res = await reservationService.createReservation({
        requestId: request.id,
        bloodBankId: match.bank.id,
        bloodBankName: match.bank.name,
        bloodGroup: request.bloodGroup,
        quantityLitres: match.safeAllocation,
        durationHours: 4,
        createdBy: 'Dr. Rahul Sharma (Clinical Lead)',
        notes: `Smart Load Balancer allocation via ${match.bank.name}`,
      });

      // Synchronize with Canonical Store
      mutate((draft) => {
        const targetReq = draft.requests.find((r) => r.id === request.id);
        if (targetReq) {
          targetReq.status = 'reserved';
          targetReq.matchedBloodBankId = match.bank.id;
          targetReq.matchedBloodBankName = match.bank.name;
        }

        const bank = draft.bloodBanks.find((b) => b.id === match.bank.id);
        if (bank && bank.inventories[request.bloodGroup]) {
          bank.inventories[request.bloodGroup].reservedStock += match.safeAllocation;
        }

        draft.reservations.unshift({
          id: res.id,
          reservationId: res.reservationId,
          requestId: request.id,
          bloodBankId: match.bank.id,
          bloodBankName: match.bank.name,
          hospitalId: request.hospitalId,
          hospitalName: request.hospitalName,
          bloodGroup: request.bloodGroup,
          quantityLitres: match.safeAllocation,
          status: 'ACTIVE',
          expiresAt: res.expiresAt,
          createdAt: res.createdAt,
          updatedAt: res.updatedAt || new Date().toISOString(),
          createdBy: 'Dr. Rahul Sharma',
        });

        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: 'hospital-user',
          actorName: 'Hospital Clinical Team',
          actorRole: 'hospital',
          organizationId: request.hospitalId,
          organizationName: request.hospitalName,
          action: 'RESERVATION_CREATED',
          entityType: 'RESERVATION',
          entityId: res.reservationId,
          severity: 'NOTICE',
          reason: `Reserved ${match.safeAllocation} L of ${request.bloodGroup} from ${match.bank.name}`,
        });
      }, 'RESERVATION_CREATED');

      setActiveReservation(res);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reservation failed.');
    } finally {
      setIsReserving(false);
    }
  };

  // Step 20: Bank Dispatch
  const handleDispatch = async () => {
    if (!activeReservation) return;
    setIsReserving(true);
    try {
      const updated = await reservationService.dispatchReservation(activeReservation.id);

      // Synchronize with Canonical Store
      mutate((draft) => {
        const r = draft.reservations.find((res) => res.id === activeReservation.id);
        if (r) r.status = 'FULFILLED';

        const trId = 'TR-' + Date.now().toString().slice(-5);
        draft.transfers.unshift({
          id: 'tr_' + Math.random().toString(36).substring(2),
          transferId: trId,
          reservationId: activeReservation.reservationId,
          requestId: activeReservation.requestId,
          fromOrganizationId: activeReservation.bloodBankId,
          fromOrganizationName: activeReservation.bloodBankName,
          toOrganizationId: activeReservation.hospitalId,
          toOrganizationName: activeReservation.hospitalName,
          bloodGroup: activeReservation.bloodGroup,
          quantityUnits: activeReservation.quantityLitres,
          status: 'IN_TRANSIT',
          urgency: 'CRITICAL',
          dispatchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: 'blood-bank-dispatch',
          actorName: activeReservation.bloodBankName,
          actorRole: 'blood_bank',
          organizationId: activeReservation.bloodBankId,
          organizationName: activeReservation.bloodBankName,
          action: 'TRANSFER_DISPATCHED',
          entityType: 'TRANSFER',
          entityId: trId,
          severity: 'NOTICE',
          reason: `Cold-chain courier dispatched: ${activeReservation.quantityLitres} L of ${activeReservation.bloodGroup} to ${activeReservation.hospitalName}`,
        });
      }, 'TRANSFER_UPDATED');

      setActiveReservation(updated);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark in transit.');
    } finally {
      setIsReserving(false);
    }
  };

  // Step 20: Confirm Physical Receipt -> Immutable TRANSFERRED_IN Transaction & Inventory Increase!
  const handleConfirmReceipt = async () => {
    if (!activeReservation) return;
    setIsReceiving(true);
    setError(null);

    try {
      const result = await reservationService.confirmReceipt(
        activeReservation.id,
        'Dr. Rahul Sharma (Clinical Lead)'
      );

      // Synchronize with Canonical Store
      mutate((draft) => {
        const hospItem = draft.hospitalInventory.find((i) => i.bloodGroup === activeReservation.bloodGroup);
        if (hospItem) {
          hospItem.availableQuantity = Math.round((hospItem.availableQuantity + activeReservation.quantityLitres) * 10) / 10;
          hospItem.status = hospItem.availableQuantity > 3.0 ? 'healthy' : hospItem.availableQuantity > 1.5 ? 'attention' : 'critical';
        }

        const tr = draft.transfers.find((t) => t.reservationId === activeReservation.reservationId);
        if (tr) {
          tr.status = 'DELIVERED';
          tr.deliveredAt = new Date().toISOString();
        }

        const req = draft.requests.find((r) => r.id === activeReservation.requestId);
        if (req) req.status = 'completed';

        const txnId = result.transactionId;
        draft.transactions.unshift({
          id: 'txn_' + Math.random().toString(36).substring(2),
          transactionId: txnId,
          organizationId: activeReservation.hospitalId,
          hospitalId: activeReservation.hospitalId,
          bloodGroup: activeReservation.bloodGroup,
          transactionType: 'TRANSFERRED_IN',
          quantityLitres: activeReservation.quantityLitres,
          quantityBefore: hospItem ? hospItem.availableQuantity - activeReservation.quantityLitres : 0,
          quantityAfter: hospItem ? hospItem.availableQuantity : activeReservation.quantityLitres,
          referenceType: 'TRANSFER',
          referenceId: activeReservation.reservationId,
          reason: 'Network Refill Delivery Received',
          performedBy: 'Hospital Reception Staff',
          verifiedBy: 'Dr. Rajesh Verma',
          status: 'VERIFIED',
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        draft.auditLogs.unshift({
          id: 'AUD-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          actorId: 'hospital-receiver',
          actorName: 'Hospital Clinical Team',
          actorRole: 'hospital',
          organizationId: activeReservation.hospitalId,
          organizationName: activeReservation.hospitalName,
          action: 'TRANSFER_RECEIVED',
          entityType: 'TRANSFER',
          entityId: txnId,
          severity: 'NOTICE',
          reason: `Confirmed delivery receipt: +${activeReservation.quantityLitres} L of ${activeReservation.bloodGroup}. Hospital inventory incremented.`,
        });
      }, 'TRANSFER_UPDATED');

      setReceivedTxnId(result.transactionId);
      await refreshInventory();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm receipt.');
    } finally {
      setIsReceiving(false);
    }
  };

  if (isLoading) {
    return (
      <HospitalLayout pageTitle="Smart Blood Bank Matching">
        <div className="py-16 text-center text-xs text-slate-400 font-mono animate-pulse">
          Evaluating regional blood bank availability and network load balance...
        </div>
      </HospitalLayout>
    );
  }

  if (error || !request) {
    return (
      <HospitalLayout pageTitle="Smart Blood Bank Matching">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-poppins font-bold text-base text-rose-950">Matching Error</h3>
          <p className="text-xs text-rose-700">{error || 'Unable to load request.'}</p>
          <Link
            to="/hospital/requests"
            className="inline-block text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
          >
            &larr; Back to Requests
          </Link>
        </div>
      </HospitalLayout>
    );
  }

  const primaryMatch = matchingResult?.primaryMatch;
  const alternatives = matchingResult?.alternatives || [];

  return (
    <HospitalLayout pageTitle="Smart Network Match &amp; Load Balancer">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Steps 18–20 Network Allocation
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Network Protection Enforced</span>
            </div>
            <h2 className="font-poppins font-bold text-2xl text-slate-900 tracking-tight mt-1">
              Smart Network Match &amp; Load Balancer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating regional blood banks for optimal sustainability, transit speed, and shortage prevention.
            </p>
          </div>

          <Link
            to={`/hospital/requests/${request.id}`}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto"
          >
            &larr; Request Details
          </Link>
        </div>

        {/* Request Context Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-poppins font-bold text-xl shadow-xs">
              {request.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-rose-400 font-bold">
                  {request.displayId}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {request.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-poppins font-bold text-lg text-white mt-0.5">
                Hospital Refill Requisition: {request.quantityLitres.toFixed(1)} Units of {request.bloodGroup}
              </h3>
              <p className="text-xs text-slate-400">
                Authorized destination: {request.hospitalName} &bull; Delivery Ward: Emergency OR
              </p>
            </div>
          </div>

          <div className="text-left md:text-right font-mono text-xs">
            <span className="text-slate-400 block text-[11px]">PRIORITY</span>
            <span className="font-bold text-rose-400 text-base uppercase">
              {request.priority}
            </span>
          </div>
        </div>

        {/* Successful Physical Receipt Banner (Section 51 & 52) */}
        {receivedTxnId && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 font-mono">
                  Full Pipeline Completed &bull; Step 20 Verification
                </span>
                <h3 className="font-poppins font-bold text-xl text-emerald-950 mt-0.5">
                  Physical blood transfer confirmed and received!
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Verified inbound receipt transaction <strong className="font-mono bg-emerald-100 px-1.5 py-0.2 rounded text-emerald-950">{receivedTxnId}</strong> has been logged to the immutable ledger. Hospital inventory has increased by +{request.quantityLitres} units and predictive stockout risk has returned to healthy levels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/hospital/predictions"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>View Recalculated Predictions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/hospital/transactions"
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50"
              >
                View Ledger Entry
              </Link>
            </div>
          </div>
        )}

        {/* Active Reservation Management Strip */}
        {activeReservation && !receivedTxnId && (
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                      Active Atomic Reservation
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {activeReservation.reservationId}
                    </span>
                  </div>
                  <h4 className="font-poppins font-bold text-base text-slate-900 mt-0.5">
                    {activeReservation.quantityLitres.toFixed(1)} Units Reserved at {activeReservation.bloodBankName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Expires at: {new Date(activeReservation.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Status: {activeReservation.status}
                  </p>
                </div>
              </div>

              {/* Lifecycle Actions: Dispatch or Confirm Receipt */}
              <div className="flex items-center gap-2">
                {request.status === 'reserved' && (
                  <button
                    type="button"
                    onClick={handleDispatch}
                    disabled={isReserving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Simulate Dispatch &rarr; In Transit</span>
                  </button>
                )}

                {request.status === 'in_transit' && (
                  <button
                    type="button"
                    onClick={handleConfirmReceipt}
                    disabled={isReceiving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isReceiving ? 'Verifying Receipt...' : 'Confirm Physical Receipt at Hospital'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 19: Recommended Primary Source Card (Section 46) */}
        {!activeReservation && primaryMatch && (
          <div className="bg-white border-2 border-indigo-600 rounded-2xl p-6 shadow-md space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-xl text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Source ({primaryMatch.matchScore}% Score)</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                  PRIMARY NETWORK SOURCE
                </span>
                <h3 className="font-poppins font-bold text-2xl text-slate-900">
                  {primaryMatch.bank.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{primaryMatch.bank.distanceKm} km away</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{primaryMatch.bank.responseTimeMinutes} mins transit</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{primaryMatch.bank.contactPhone}</span>
                  </span>
                </div>
              </div>

              {/* Allocation Stats */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center gap-4 text-left">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Available Stock
                  </span>
                  <span className="font-mono text-xl font-bold text-slate-900">
                    {primaryMatch.availableStock.toFixed(1)} U
                  </span>
                </div>
                <div className="border-l border-indigo-200 pl-4">
                  <span className="text-[10px] uppercase font-semibold text-indigo-700 block">
                    Safe Allocation
                  </span>
                  <span className="font-mono text-xl font-bold text-indigo-950">
                    {primaryMatch.safeAllocation.toFixed(1)} U
                  </span>
                </div>
              </div>
            </div>

            {/* Why This Bank? (Section 43) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-900 block font-poppins">
                Why this blood bank?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {primaryMatch.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Protection Indicator (Section 45) */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Network Protection Certified:</strong> Allocating {primaryMatch.safeAllocation} units maintains {primaryMatch.bank.name}'s own local emergency buffer above 12 hours.
              </span>
            </div>

            {/* Reserve CTA */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleReserve(primaryMatch)}
                disabled={isReserving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C1272D] hover:bg-[#A61E24] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isReserving ? 'Locking Reservation...' : `Reserve ${primaryMatch.safeAllocation} Units at ${primaryMatch.bank.name}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Alternative Candidate Blood Banks (Section 44) */}
        {!activeReservation && alternatives.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="font-poppins font-bold text-base text-slate-900">
              Alternative Network Candidates ({alternatives.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alternatives.map((alt) => (
                <div
                  key={alt.bank.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-poppins font-bold text-base text-slate-900">
                        {alt.bank.name}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono block">
                        {alt.bank.distanceKm} km away &bull; {alt.bank.responseTimeMinutes} min transit
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      Match: {alt.matchScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                    <span className="text-slate-500">Available Stock:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {alt.availableStock.toFixed(1)} units
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    {alt.riskAssessment}
                  </p>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleReserve(alt)}
                      disabled={isReserving}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Select &amp; Reserve ({alt.safeAllocation} U)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </HospitalLayout>
  );
};
