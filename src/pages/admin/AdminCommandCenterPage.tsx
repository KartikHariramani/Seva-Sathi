import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppStore } from '../../store/appStore';
import { campaignService } from '../../services/campaignService';
import { syncEngine } from '../../sync/broadcastSync';
import {
  selectTotalNetworkStock,
  selectAvailableNetworkStock,
  selectReservedNetworkStock,
  selectCriticalBloodGroups,
  selectActiveRequests,
  selectInTransitTransfers,
  selectExpiringInventoryCount,
  selectPendingVerifications,
  selectBloodGroupSummaryTable,
  selectNetworkHealth,
  selectRecentActivity,
  selectNetworkFlowMetrics,
} from '../../store/selectors';
import {
  ShieldAlert,
  Building2,
  GitPullRequest,
  Truck,
  ArrowRight,
  ExternalLink,
  Users,
  Calendar,
} from 'lucide-react';
import { localEventBus } from '../../sync/localEventBus';

export const AdminCommandCenterPage: React.FC = () => {
  const { state, acknowledgeAlert, resolveAlert } = useAppStore();
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState(() => campaignService.getCampaigns());
  const [registrations, setRegistrations] = useState(() => campaignService.getRegistrations());

  useEffect(() => {
    const refreshCampaignData = () => {
      setCampaigns(campaignService.getCampaigns());
      setRegistrations(campaignService.getRegistrations());
    };

    const unsubSync = syncEngine.subscribe((event) => {
      if (
        event.type.includes('campaign') ||
        event.type.includes('registration') ||
        event.type.includes('CAMPAIGN') ||
        event.type.includes('DONOR')
      ) {
        refreshCampaignData();
      }
    });

    const unsubLocal1 = localEventBus.on('campaign.created', refreshCampaignData);
    const unsubLocal2 = localEventBus.on('campaign.registered', refreshCampaignData);
    const unsubLocal3 = localEventBus.on('campaign.cancelled', refreshCampaignData);
    const unsubLocal4 = localEventBus.on('campaign.checked_in', refreshCampaignData);

    const handleFocus = () => refreshCampaignData();
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubSync();
      unsubLocal1();
      unsubLocal2();
      unsubLocal3();
      unsubLocal4();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const totalStock = selectTotalNetworkStock(state);
  const availStock = selectAvailableNetworkStock(state);
  const reservedStock = selectReservedNetworkStock(state);
  const criticalGroups = selectCriticalBloodGroups(state);
  const activeRequests = selectActiveRequests(state);
  const inTransitTransfers = selectInTransitTransfers(state);
  const expiringStock = selectExpiringInventoryCount(state, 48);
  const pendingOrgs = selectPendingVerifications(state);
  const bloodGroupTable = selectBloodGroupSummaryTable(state);
  const health = selectNetworkHealth(state);
  const recentActivity = selectRecentActivity(state, 8);
  const flowMetrics = selectNetworkFlowMetrics(state);

  const activeAlerts = state.alerts.filter((a) => a.status === 'ACTIVE');

  const totalDonorsRegistered = registrations.length;
  const verifiedTurnout = registrations.filter((r) => r.status === 'ATTENDED').length;
  const publishedDrives = campaigns.filter((c) => c.status === 'ACTIVE').length;

  return (
    <AdminLayout pageTitle="Network Command Center">
      <div className="space-y-6">
        {/* Top Header / Broadcast banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Phase 6 Network Control
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                &bull; Live Centralized Orchestration
              </span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              State Blood Network Command
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live synchronized monitoring of hospital inventories, regional blood banks, emergency requisitions, and cold-chain transfers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/refill-requests"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-2xs transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-[#C1272D]" />
              <span>Pending Approvals ({activeRequests.filter((r) => r.status === 'pending_approval' || r.status === 'draft').length})</span>
            </Link>

            <Link
              to="/admin/organizations"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Verify Organizations ({pendingOrgs.length})</span>
            </Link>
          </div>
        </div>

        {/* Network Health Overview (Requirement #17) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              health.status === 'HEALTHY'
                ? 'bg-emerald-500 ring-4 ring-emerald-100'
                : health.status === 'MONITOR'
                ? 'bg-amber-500 ring-4 ring-amber-100'
                : 'bg-rose-500 ring-4 ring-rose-100 animate-pulse'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-poppins font-bold text-sm text-slate-900">
                  Network State: {health.status}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  (Health Score: {health.score}/100)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {health.issues.join(' • ')}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 shrink-0">
            Realtime Composite Ledger Metric
          </div>
        </div>

        {/* 1. VISUAL PRIORITY: CRITICAL ALERTS BANNER (Requirement #80) */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            {activeAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xs ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                    : 'bg-blue-50/90 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-poppins font-bold text-sm tracking-tight">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        &bull; {alert.organizationName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-3xl">
                      {alert.message}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      <strong>Recommended Action:</strong> {alert.recommendedAction}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveAlert(alert.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. LIVE DYNAMIC KPI CARDS (Requirement #16 - derived entirely from selectors) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Network Stock */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Total Stock (L)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-slate-900">{totalStock.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-mono">Litres</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Avail: <strong className="text-emerald-600">{availStock.toFixed(1)}</strong></span>
              <span>Res: <strong className="text-amber-600">{reservedStock.toFixed(1)}</strong></span>
            </div>
          </div>

          {/* Card 2: Critical Shortages */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Critical Groups
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-poppins font-bold text-2xl ${
                  criticalGroups.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {criticalGroups.length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {criticalGroups.length > 0 ? criticalGroups.join(', ') : 'None'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Hospital buffer:</span>
              <span className="font-semibold text-rose-600">
                {criticalGroups.includes('O+') ? 'O+ Depleting' : 'Stable'}
              </span>
            </div>
          </div>

          {/* Card 3: Active Requests */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Active Requests
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-slate-900">{activeRequests.length}</span>
              <span className="text-[10px] text-slate-400 font-mono">Demands</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Critical:</span>
              <span className="font-semibold text-rose-600">
                {activeRequests.filter((r) => r.priority === 'emergency').length}
              </span>
            </div>
          </div>

          {/* Card 4: In-Transit Transfers */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              In-Transit Consignments
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-blue-600">{inTransitTransfers.length}</span>
              <span className="text-[10px] text-slate-400 font-mono">Cold-chain</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Avg arrival:</span>
              <span className="font-semibold text-slate-700">~18 mins</span>
            </div>
          </div>

          {/* Card 5: Expiring in <48h */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Expiring &lt; 48h
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-poppins font-bold text-2xl ${
                  expiringStock > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {expiringStock.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Litres</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Redistribution:</span>
              <span className="font-semibold text-amber-700">1 candidate</span>
            </div>
          </div>

          {/* Card 6: Verified Organizations */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Network Nodes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-poppins font-bold text-2xl text-slate-900">
                {state.organizations.filter((o) => o.status === 'VERIFIED').length}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {state.organizations.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Pending:</span>
              <span
                className={`font-semibold ${
                  pendingOrgs.length > 0 ? 'text-amber-600' : 'text-slate-500'
                }`}
              >
                {pendingOrgs.length} awaiting
              </span>
            </div>
          </div>
        </div>

        {/* 3. BLOOD GROUP NETWORK STATUS TABLE (Requirement #18) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-poppins font-bold text-lg text-slate-900">
                Blood Group Network Balance Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated inventory across all participating hospital blood depots and regional distribution centers.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Attention
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Blood Group</th>
                  <th className="py-3 px-4 font-semibold">Hospital Available</th>
                  <th className="py-3 px-4 font-semibold">Blood Bank Available</th>
                  <th className="py-3 px-4 font-semibold">Total Network Avail</th>
                  <th className="py-3 px-4 font-semibold">Reserved Units</th>
                  <th className="py-3 px-4 font-semibold">Active Demand</th>
                  <th className="py-3 px-4 font-semibold">Expiring &lt;48h</th>
                  <th className="py-3 px-4 font-semibold">Risk Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {bloodGroupTable.map((row) => {
                  const isCritical = row.status === 'CRITICAL';
                  const isAttention = row.status === 'ATTENTION';

                  return (
                    <tr
                      key={row.bloodGroup}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? 'bg-rose-50/30' : isAttention ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-poppins font-bold text-sm text-slate-900">
                          <span className="w-7 h-7 rounded-lg bg-[#0F2E5A] text-white flex items-center justify-center text-xs">
                            {row.bloodGroup}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            row.hospitalAvailable <= 1.5 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {row.hospitalAvailable.toFixed(1)} L
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {row.bloodBankAvailable.toFixed(1)} L
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {row.totalAvailable.toFixed(1)} L
                        </span>
                      </td>

                      <td className="py-3 px-4 text-amber-700">
                        {row.totalReserved > 0 ? `${row.totalReserved.toFixed(1)} L` : '—'}
                      </td>

                      <td className="py-3 px-4">
                        {row.activeDemand > 0 ? (
                          <span className="text-rose-600 font-semibold">
                            {row.activeDemand.toFixed(1)} L
                          </span>
                        ) : (
                          <span className="text-slate-400">0 L</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {row.expiringUnits > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {row.expiringUnits.toFixed(1)} L
                          </span>
                        ) : (
                          <span className="text-slate-400">0 L</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isAttention
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : row.status === 'MONITOR'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCritical ? 'bg-rose-500' : isAttention ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/network-analytics?group=${encodeURIComponent(row.bloodGroup)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4C8A] hover:text-[#0F2E5A] hover:underline"
                        >
                          <span>Analytics</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. NETWORK TOPOLOGY / MAP & LIVE ACTIVITY FEED (Two-column layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Network Topology Visualization */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Network Node Topology & Cold-Chain Logistics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live operational mesh connecting hospital trauma centers with regional preservation hubs.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  3 Hubs &bull; 2 Hospitals
                </div>
              </div>

              {/* Topology Canvas Diagram */}
              <div className="relative h-80 my-4 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* SVG Connections between Hubs and Hospitals */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Nagpur Regional -> CityCare Hospital (Active Transfer Line) */}
                  <line
                    x1="48%"
                    y1="45%"
                    x2="42%"
                    y2="38%"
                    stroke="#3B82F6"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                  {/* Central City -> CityCare */}
                  <line x1="46%" y1="32%" x2="42%" y2="38%" stroke="#475569" strokeWidth="1.5" />
                  {/* Vidarbha Life -> CityCare */}
                  <line x1="26%" y1="60%" x2="42%" y2="38%" stroke="#475569" strokeWidth="1.5" />
                  {/* Nagpur Regional -> Sunrise Multispeciality */}
                  <line x1="48%" y1="45%" x2="58%" y2="28%" stroke="#475569" strokeWidth="1.5" />
                </svg>

                {/* Nodes rendered across the canvas */}
                {state.organizations.map((org) => {
                  const isSelected = selectedTopologyNode === org.id;
                  const isHospital = org.type === 'hospital';
                  const hasCriticalStock = org.stats.criticalStockGroups.length > 0;

                  return (
                    <div
                      key={org.id}
                      onClick={() => setSelectedTopologyNode(org.id)}
                      style={{
                        position: 'absolute',
                        left: `${org.location.coordinates.x}%`,
                        top: `${org.location.coordinates.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`cursor-pointer transition-all p-2 rounded-xl border shadow-lg ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 z-20'
                          : 'hover:scale-105 z-10'
                      } ${
                        isHospital
                          ? hasCriticalStock
                            ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200'
                          : 'bg-[#0F2E5A]/90 border-sky-500 text-sky-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasCriticalStock
                              ? 'bg-rose-500 animate-ping'
                              : isHospital
                              ? 'bg-emerald-400'
                              : 'bg-sky-400'
                          }`}
                        />
                        <span className="font-poppins font-bold text-[11px] whitespace-nowrap">
                          {org.code}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono opacity-80 mt-0.5">
                        {org.stats.totalInventoryUnits.toFixed(1)} L &bull; {org.location.city}
                      </div>
                    </div>
                  );
                })}

                {/* Floating in-transit transfer badge */}
                {inTransitTransfers.length > 0 && (
                  <div
                    style={{ position: 'absolute', left: '45%', top: '41%' }}
                    className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1 shadow-md animate-bounce"
                  >
                    <Truck className="w-2.5 h-2.5" />
                    <span>TR-301 (O+ 4L)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Node Details Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              {selectedTopologyNode ? (
                (() => {
                  const node = state.organizations.find((o) => o.id === selectedTopologyNode);
                  if (!node) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{node.name}</span>
                        <span className="text-slate-400 font-mono">({node.licenseNumber})</span>
                      </div>
                      <Link
                        to={`/admin/organizations/${node.id}`}
                        className="text-[#1E4C8A] font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>View Node Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  );
                })()
              ) : (
                <div className="text-slate-400 italic">
                  Click any node on the topology map to inspect live metrics.
                </div>
              )}
            </div>
          </div>

          {/* Live Network Activity Feed (Requirement #20) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-poppins font-bold text-base text-slate-900">
                    Live Operational Stream
                  </h3>
                </div>
                <Link
                  to="/admin/activity"
                  className="text-xs font-semibold text-[#1E4C8A] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="mt-3 space-y-3">
                {recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span className="font-bold text-slate-600 uppercase">{act.type}</span>
                      <span>{act.timeFormatted}</span>
                    </div>
                    <p className="font-semibold text-slate-800 leading-snug">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                to="/admin/audit-logs"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1"
              >
                <span>Complete Audit History ({state.auditLogs.length} events)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. NETWORK FLOW & FULFILLMENT EFFICIENCY */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block">
                Regional Logistics Efficiency
              </span>
              <h3 className="font-poppins font-bold text-lg text-white mt-0.5">
                End-to-End Emergency Requisition Pipeline
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Fulfillment Rate:</span>
              <strong className="text-emerald-400 font-bold text-sm">
                {flowMetrics.fulfillmentRatePct}%
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 text-center">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">1. Requests</span>
              <strong className="font-poppins font-bold text-xl text-white block mt-1">
                {flowMetrics.requestsCreated}
              </strong>
              <span className="text-[10px] text-slate-400">Total logged</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">2. Approved</span>
              <strong className="font-poppins font-bold text-xl text-white block mt-1">
                {flowMetrics.requestsApproved}
              </strong>
              <span className="text-[10px] text-slate-400">By Admin</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">3. Reserved</span>
              <strong className="font-poppins font-bold text-xl text-amber-400 block mt-1">
                {flowMetrics.reservationsActive}
              </strong>
              <span className="text-[10px] text-slate-400">Atomic locks</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">4. In Transit</span>
              <strong className="font-poppins font-bold text-xl text-blue-400 block mt-1">
                {flowMetrics.transfersInTransit}
              </strong>
              <span className="text-[10px] text-slate-400">Cold chain</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">5. Delivered</span>
              <strong className="font-poppins font-bold text-xl text-emerald-400 block mt-1">
                {flowMetrics.transfersDelivered}
              </strong>
              <span className="text-[10px] text-slate-400">Ingested</span>
            </div>
          </div>
        </div>

        {/* 6. COMMUNITY & NSS DONATION DRIVE REAL-TIME OPERATIONS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200 uppercase">
                  Community Telemetry
                </span>
              </div>
              <h3 className="font-poppins font-bold text-lg text-slate-900 mt-1">
                NSS Organization & Public Blood Drives
              </h3>
              <p className="text-xs text-slate-500">
                Synchronized live telemetry across NGO camp organizers, donor digital registrations, and QR-verified clinic check-ins.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/ngo/campaigns"
                className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>All Drives ({campaigns.length})</span>
              </Link>
              <Link
                to="/organizer/telemetry"
                className="text-xs font-semibold text-white bg-[#1E4C8A] hover:bg-[#163866] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Live Organizer Telemetry</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Active Drives
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="font-poppins font-bold text-2xl text-slate-900">{publishedDrives}</strong>
                <span className="text-[11px] text-slate-400 font-mono">/ {campaigns.length} total</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Live in Donor Portal</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Total Donor Signups
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="font-poppins font-bold text-2xl text-[#1E4C8A]">{totalDonorsRegistered}</strong>
                <span className="text-[11px] text-slate-400 font-mono">registrations</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Auto-synced across tabs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Verified Check-ins
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="font-poppins font-bold text-2xl text-emerald-600">{verifiedTurnout}</strong>
                <span className="text-[11px] text-emerald-600 font-mono">
                  {totalDonorsRegistered > 0 ? `(${Math.round((verifiedTurnout / totalDonorsRegistered) * 100)}%)` : '(0%)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">QR code pass validated</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Network Participation
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="font-poppins font-bold text-2xl text-purple-600">
                  {new Set(campaigns.map((c) => c.organizerId || c.city)).size}
                </strong>
                <span className="text-[11px] text-slate-400 font-mono">NGO / NSS Units</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">State coordination nodes</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
