import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import type { BloodGroup } from '../../types';
import {
  Building2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  LogOut,
  Radio,
  UploadCloud,
} from 'lucide-react';
import { ALL_BLOOD_GROUPS } from '../../store/selectors';
import { SmartInventoryImportPage } from '../inventory/SmartInventoryImportPage';
import { NearExpiryRescuePage } from '../nearexpiry/NearExpiryRescuePage';
import { ShortageBuzzerBanner } from '../../components/alerts/ShortageBuzzerBanner';
import { bloodRequestRepository } from '../../services/bloodRequestRepository';
import { bloodBankService } from '../../services/bloodBankService';
import { syncEngine } from '../../sync/broadcastSync';

export const BloodBankDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { state, mutate } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'INVENTORY' | 'REQUESTS' | 'TRANSFERS' | 'SMART_IMPORT' | 'NEAR_EXPIRY'
  >('INVENTORY');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const bankId = user?.orgId || 'ORG-BANK-01';
  const bankName = user?.orgName || 'Central City Blood Bank & Apheresis Depot';

  // Bank inventory from store
  const currentBank = state.bloodBanks.find((b) => b.id === bankId || b.id === 'bank-central-city') || state.bloodBanks[0];
  const inventories = currentBank?.inventories || {};

  let totalPhysical = 0;
  let totalReserved = 0;
  let totalAvailable = 0;

  ALL_BLOOD_GROUPS.forEach((bg) => {
    const inv = inventories[bg];
    if (inv) {
      totalPhysical += inv.physicalStock;
      totalReserved += inv.reservedStock;
      totalAvailable += inv.availableStock;
    }
  });

  // Incoming hospital requests
  const incomingRequests = state.requests.filter(
    (r) =>
      r.status === 'approved' ||
      r.status === 'searching' ||
      r.status === 'matched' ||
      r.status === 'reserved'
  );

  // Active reservations for this bank
  const activeReservations = state.reservations.filter((r) => r.status === 'ACTIVE');

  // Transfers dispatched or scheduled
  const transfers = state.transfers.filter((t) => t.fromOrganizationId === bankId || t.status === 'IN_TRANSIT');

  // Handle Accept & Reserve (Requirement #41)
  const handleAcceptAndReserve = (reqId: string, bloodGroup: string, quantity: number) => {
    mutate((draft) => {
      const targetReq = draft.requests.find((r) => r.id === reqId);
      if (targetReq) {
        targetReq.status = 'reserved';
        targetReq.matchedBloodBankId = bankId;
        targetReq.matchedBloodBankName = bankName;
      }

      // Decrement available stock by increasing reserved stock
      const bank = draft.bloodBanks.find((b) => b.id === bankId || b.id === 'bank-central-city') || draft.bloodBanks[0];
      const targetInv = bank?.inventories[bloodGroup as BloodGroup];
      if (targetInv) {
        targetInv.reservedStock += quantity;
      }

      // Add to reservations
      const resId = 'RES-' + Date.now().toString().slice(-6);
      draft.reservations.unshift({
        id: 'res_' + Math.random().toString(36).substring(2),
        reservationId: resId,
        requestId: reqId,
        bloodBankId: bankId,
        bloodBankName: bankName,
        hospitalId: targetReq?.hospitalId || 'ORG-HOSP-01',
        hospitalName: targetReq?.hospitalName || 'Metropolitan Trauma Hospital',
        bloodGroup: bloodGroup as BloodGroup,
        quantityLitres: quantity,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.userName || 'Blood Bank Officer',
      });

      // Audit log
      draft.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorId: user?.email || 'bloodbank-manager',
        actorName: user?.userName || 'Blood Bank Officer',
        actorRole: 'blood_bank',
        organizationId: bankId,
        organizationName: bankName,
        action: 'RESERVATION_CREATED',
        entityType: 'RESERVATION',
        entityId: resId,
        severity: 'NOTICE',
        reason: `Reserved ${quantity} L of ${bloodGroup} for ${targetReq?.hospitalName || 'Hospital'}`,
      });
    }, 'RESERVATION_CREATED');

    // Authoritatively synchronize bloodRequestRepository & bloodBankService across dashboards
    bloodRequestRepository.updateRequest(reqId, {
      status: 'reserved',
      matchedBloodBankId: bankId,
      matchedBloodBankName: bankName,
    }).catch((err) => console.warn('Sync to request repo failed:', err));

    bloodBankService.reserveStockAtBank(bankId, bloodGroup as BloodGroup, quantity)
      .catch((err) => console.warn('Sync to blood bank service failed:', err));

    syncEngine.broadcast('REQUEST_UPDATED', Date.now(), { reqId, status: 'reserved' });
    syncEngine.broadcast('INVENTORY_UPDATED', Date.now(), { bankId, bloodGroup });

    setActionSuccessMsg(`Reserved ${quantity} L of ${bloodGroup} successfully. Ready for cold-chain dispatch.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Handle Dispatch Transfer (Requirement #42)
  const handleDispatch = (resId: string, reqId: string, bloodGroup: string, quantity: number, hospName: string) => {
    mutate((draft) => {
      // Update reservation
      const res = draft.reservations.find((r) => r.reservationId === resId);
      if (res) res.status = 'FULFILLED';

      // Update request
      const req = draft.requests.find((r) => r.id === reqId);
      if (req) req.status = 'in_transit';

      // Deduct physical stock
      const bank = draft.bloodBanks.find((b) => b.id === bankId || b.id === 'bank-central-city') || draft.bloodBanks[0];
      const targetInv = bank?.inventories[bloodGroup as BloodGroup];
      if (targetInv) {
        targetInv.physicalStock -= quantity;
        targetInv.reservedStock = Math.max(0, targetInv.reservedStock - quantity);
      }

      // Create Transfer
      const transferId = 'TR-' + Date.now().toString().slice(-5);
      draft.transfers.unshift({
        id: 'tr_' + Math.random().toString(36).substring(2),
        transferId,
        reservationId: resId,
        requestId: reqId,
        fromOrganizationId: bankId,
        fromOrganizationName: bankName,
        toOrganizationId: 'ORG-HOSP-01',
        toOrganizationName: hospName,
        bloodGroup: bloodGroup as BloodGroup,
        quantityUnits: quantity,
        status: 'IN_TRANSIT',
        urgency: 'CRITICAL',
        dispatchedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Audit Log
      draft.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(),
        timestamp: new Date().toISOString(),
        actorId: user?.email || 'bloodbank-manager',
        actorName: user?.userName || 'Blood Bank Officer',
        actorRole: 'blood_bank',
        organizationId: bankId,
        organizationName: bankName,
        action: 'TRANSFER_DISPATCHED',
        entityType: 'TRANSFER',
        entityId: transferId,
        severity: 'NOTICE',
        reason: `Cold-chain courier dispatched: ${quantity} L of ${bloodGroup} to ${hospName}`,
      });
    }, 'TRANSFER_UPDATED');

    // Authoritatively synchronize bloodRequestRepository & bloodBankService
    bloodRequestRepository.updateRequest(reqId, {
      status: 'in_transit',
    }).catch((err) => console.warn('Sync to request repo failed:', err));

    bloodBankService.fulfillOrReleaseBankStock(bankId, bloodGroup as BloodGroup, quantity, 'fulfill')
      .catch((err) => console.warn('Sync to blood bank stock failed:', err));

    syncEngine.broadcast('REQUEST_UPDATED', Date.now(), { reqId, status: 'in_transit' });
    syncEngine.broadcast('INVENTORY_UPDATED', Date.now(), { bankId, bloodGroup });

    setActionSuccessMsg(`Transfer dispatched to ${hospName}. Cold-chain courier in transit.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 h-16 flex items-center px-4 sm:px-6 justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F2E5A] flex items-center justify-center text-white font-bold shadow-xs">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-poppins font-bold text-base text-slate-900 leading-none">
                {bankName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Depot
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Regional Blood Depot &bull; Apheresis Facility
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Realtime Network Active</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Realtime Shortage Buzzer & Alert Banner */}
        <ShortageBuzzerBanner
          onNavigateToReplenish={() => setActiveTab('INVENTORY')}
        />

        {actionSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Physical Inventory
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-slate-900">
                {totalPhysical.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">Litres</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">In cold refrigeration</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Reserved for Hospitals
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-amber-600">
                {totalReserved.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">Litres</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono block mt-1">Locked for pending dispatch</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Available for Allocation
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-emerald-600">
                {totalAvailable.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">Litres</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-mono block mt-1">Ready for network match</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Incoming Hospital Demands
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-[#C1272D]">
                {incomingRequests.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">Requisitions</span>
            </div>
            <span className="text-[10px] text-rose-600 font-mono block mt-1">Requiring allocation</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Active In-Transit
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-blue-600">
                {transfers.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">Consignments</span>
            </div>
            <span className="text-[10px] text-blue-700 font-mono block mt-1">Cold-chain in route</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'INVENTORY'
                ? 'border-[#0F2E5A] text-[#0F2E5A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Live Blood Inventory Pool
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'REQUESTS'
                ? 'border-[#0F2E5A] text-[#0F2E5A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Incoming Hospital Requisitions</span>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
              {incomingRequests.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRANSFERS')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'TRANSFERS'
                ? 'border-[#0F2E5A] text-[#0F2E5A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Active Reservations & Dispatches</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
              {activeReservations.length + transfers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SMART_IMPORT')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SMART_IMPORT'
                ? 'border-[#0F2E5A] text-[#0F2E5A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Ingestion (CSV / OCR)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NEAR_EXPIRY')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'NEAR_EXPIRY'
                ? 'border-[#0F2E5A] text-[#0F2E5A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>Near-Expiry Rescue Alerts</span>
          </button>
        </div>

        {/* TAB 1: INVENTORY MATRIX */}
        {activeTab === 'INVENTORY' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80">
              <h2 className="font-poppins font-bold text-base text-slate-900">
                Blood Group Stock Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Physical units, allocated hospital reservations, and net allocatable stock.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4 text-right">Physical Stock</th>
                    <th className="py-3 px-4 text-right">Reserved Stock</th>
                    <th className="py-3 px-4 text-right">Available for Allocation</th>
                    <th className="py-3 px-4 text-right">Predicted 24h Demand</th>
                    <th className="py-3 px-4 text-center">Shortage Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ALL_BLOOD_GROUPS.map((bg) => {
                    const inv = inventories[bg] || {
                      bloodGroup: bg,
                      physicalStock: 12.0,
                      reservedStock: 1.0,
                      availableStock: 11.0,
                      predictedDemand24h: 3.0,
                      shortageRisk: 'low',
                    };

                    return (
                      <tr key={bg} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-poppins font-bold text-slate-900 text-sm">
                          {bg}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">
                          {inv.physicalStock.toFixed(1)} L
                        </td>
                        <td className="py-3 px-4 text-right text-amber-600 font-semibold">
                          {inv.reservedStock.toFixed(1)} L
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold text-sm">
                          {inv.availableStock.toFixed(1)} L
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          ~{inv.predictedDemand24h.toFixed(1)} L
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              inv.shortageRisk === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : inv.shortageRisk === 'monitor'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inv.shortageRisk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INCOMING HOSPITAL REQUESTS */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                No active hospital blood requisitions pending allocation.
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F2E5A] text-white flex items-center justify-center font-poppins font-bold text-base">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-poppins font-bold text-slate-900 text-sm">
                            {req.hospitalName}
                          </h3>
                          <span
                            className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                              req.priority === 'emergency'
                                ? 'bg-rose-100 text-rose-800'
                                : req.priority === 'urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          Requisition: {req.displayId} &bull; City: {req.hospitalCity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-poppins font-bold text-xl text-slate-900">
                        {req.quantityLitres.toFixed(1)} <span className="text-xs font-normal text-slate-500">L requested</span>
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Needed by: {new Date(req.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-mono">
                      Clinical Justification: <span className="text-slate-800">{req.reason}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {req.status !== 'reserved' ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptAndReserve(req.id, req.bloodGroup, req.quantityLitres)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept & Lock Reservation</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Reserved for this Hospital</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: RESERVATIONS & DISPATCHES */}
        {activeTab === 'TRANSFERS' && (
          <div className="space-y-4">
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Active Supply Locks & Dispatches
            </h2>

            <div className="space-y-3">
              {activeReservations.length === 0 && transfers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  No active reservations or cold-chain dispatches in flight.
                </div>
              ) : (
                <>
                  {activeReservations.map((res) => (
                    <div
                      key={res.id}
                      className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {res.reservationId}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            LOCKED SUPPLY
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-slate-800">
                          {res.bloodGroup} × {res.quantityLitres.toFixed(1)} L for {res.hospitalName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          Expires in:{' '}
                          {Math.max(
                            0,
                            Math.round(
                              (new Date(res.expiresAt).getTime() - Date.now()) / (3600 * 1000)
                            )
                          )}{' '}
                          hours
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDispatch(
                            res.reservationId,
                            res.requestId,
                            res.bloodGroup,
                            res.quantityLitres,
                            res.hospitalName
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2E5A] hover:bg-[#1E4C8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <Send className="w-4 h-4" />
                        <span>Dispatch Cold-Chain Transfer</span>
                      </button>
                    </div>
                  ))}

                  {transfers.map((tr) => (
                    <div
                      key={tr.id}
                      className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {tr.transferId}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            IN TRANSIT
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-slate-800">
                          {tr.bloodGroup} × {tr.quantityUnits.toFixed(1)} L &rarr; {tr.toOrganizationName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          Dispatched:{' '}
                          {tr.dispatchedAt
                            ? new Date(tr.dispatchedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        <Truck className="w-4 h-4 animate-bounce" />
                        <span>Awaiting Hospital Delivery Receipt</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SMART INVENTORY IMPORT (CSV / EXCEL / OCR) */}
        {activeTab === 'SMART_IMPORT' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
            <SmartInventoryImportPage />
          </div>
        )}

        {/* TAB 5: NEAR-EXPIRY RESCUE ALERTS */}
        {activeTab === 'NEAR_EXPIRY' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
            <NearExpiryRescuePage />
          </div>
        )}
      </main>
    </div>
  );
};
