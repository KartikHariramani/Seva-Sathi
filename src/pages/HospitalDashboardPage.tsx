import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHospitalInventory } from '../context/HospitalInventoryContext';
import { useHospitalRequests } from '../hooks/useHospitalRequests';
import { HospitalLayout } from '../components/hospital/HospitalLayout';
import { AttentionBanner } from '../components/hospital/AttentionBanner';
import { HospitalKpiCard } from '../components/hospital/HospitalKpiCard';
import { BloodInventoryTable } from '../components/hospital/BloodInventoryTable';
import { InventoryHealthPanel } from '../components/hospital/InventoryHealthPanel';
import { RecentActivityTimeline } from '../components/hospital/RecentActivityTimeline';
import { InventoryDrawer } from '../components/hospital/InventoryDrawer';
import {
  HospitalDashboardSkeleton,
  HospitalErrorState,
} from '../components/hospital/HospitalSkeletons';
import { usePredictions } from '../hooks/usePredictions';
import { SmartStockoutAlert } from '../components/intelligence/SmartStockoutAlert';
import { ShortageBuzzerBanner } from '../components/alerts/ShortageBuzzerBanner';
import type { HospitalInventoryItem } from '../data/hospitalInventory';
import {
  CheckCircle2,
  Lock,
  AlertOctagon,
  RefreshCw,
  ArrowRight,
  Boxes,
  GitPullRequest,
  Plus,
  Building2,
  Clock,
} from 'lucide-react';

export const HospitalDashboardPage: React.FC = () => {
  const {
    inventory,
    activity,
    summary,
    isLoading,
    error,
    lastUpdatedTime,
    getAttentionItems,
    updateInventory,
    refreshInventory,
  } = useHospitalInventory();
  const { activeRequestsCount } = useHospitalRequests();
  const { criticalPredictions, attentionPredictions } = usePredictions();
  const topAlert = criticalPredictions[0] || attentionPredictions[0] || null;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'details' | 'update'>('details');
  const [selectedGroupItem, setSelectedGroupItem] = useState<HospitalInventoryItem | null>(null);

  const attentionItems = getAttentionItems();
  const criticalItems = inventory.filter((i: HospitalInventoryItem) => i.status === 'critical');

  const handleOpenGroupDetails = (item: HospitalInventoryItem) => {
    setSelectedGroupItem(item);
    setDrawerMode('details');
    setDrawerOpen(true);
  };

  if (error) {
    return (
      <HospitalLayout pageTitle="Hospital Overview">
        <HospitalErrorState onRetry={refreshInventory} />
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout pageTitle="Hospital Overview">
      {isLoading ? (
        <HospitalDashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* 1. GREETING & SUMMARY (Section 8) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-2">
            <div>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                Good morning.
              </h2>
              <p className="text-sm text-[#64748B] mt-0.5 font-normal">
                Here's what needs your attention today.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              <span>Last updated {lastUpdatedTime}</span>
              <button
                type="button"
                onClick={refreshInventory}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0F172A] px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <Link
                to="/hospital/requests/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] px-3 py-1.5 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Request Blood</span>
              </Link>
            </div>
          </div>

          {/* Emergency Shortage Buzzer & Alert Banner */}
          <ShortageBuzzerBanner
            facilityId="HOSP-001"
            onNavigateToReplenish={() => {
              if (criticalItems[0]) handleOpenGroupDetails(criticalItems[0]);
            }}
          />

          {/* 2. LEVEL 1: ATTENTION BANNER (Section 9 & 10) */}
          <AttentionBanner
            criticalItems={criticalItems}
            onReview={handleOpenGroupDetails}
          />

          {/* 3. LEVEL 2: KPI CARDS (Feature One: Database-backed Network Metrics) */}
          <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Link to="/hospital/network" className="block focus:outline-none">
              <HospitalKpiCard
                label="Verified Blood Banks"
                value={4}
                explanation="Connected supply hubs"
                indicatorColor="healthy"
                icon={<Building2 className="w-4 h-4 text-[#1E4C8A]" />}
              />
            </Link>

            <HospitalKpiCard
              label="Available Blood"
              value={summary.availableQuantity.toFixed(1)}
              unit="L"
              explanation="Ready for bedside transfusion"
              indicatorColor="healthy"
              icon={<CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
            />

            <Link to="/hospital/near-expiry" className="block focus:outline-none">
              <HospitalKpiCard
                label="Near-Expiry Rescue"
                value={3}
                unit="Batches"
                explanation="Eligible before expiry"
                indicatorColor="critical"
                icon={<Clock className="w-4 h-4 text-amber-500" />}
              />
            </Link>

            <HospitalKpiCard
              label="Critical Shortages"
              value={criticalItems.length}
              explanation={
                criticalItems.length === 0
                  ? 'All 8 groups in healthy buffer'
                  : `${criticalItems.length} groups below safe threshold`
              }
              indicatorColor={criticalItems.length > 0 ? 'critical' : 'healthy'}
              icon={<AlertOctagon className="w-4 h-4" />}
            />

            <HospitalKpiCard
              label="Pending Reserved"
              value={summary.reservedQuantity.toFixed(1)}
              unit="L"
              explanation="Allocated to ICU requests"
              icon={<Lock className="w-4 h-4" />}
            />

            <Link to="/hospital/requests" className="block focus:outline-none col-span-2 sm:col-span-1">
              <HospitalKpiCard
                label="Active Requests"
                value={activeRequestsCount}
                explanation={
                  activeRequestsCount === 1
                    ? '1 active emergency request'
                    : `${activeRequestsCount} active emergency requests`
                }
                indicatorColor={activeRequestsCount > 0 ? 'healthy' : 'neutral'}
                icon={<GitPullRequest className="w-4 h-4 text-[#1E4C8A]" />}
              />
            </Link>
          </section>

          {/* Step 14: Smart Stockout Alert */}
          {topAlert && <SmartStockoutAlert prediction={topAlert} />}

          {/* 4. LEVEL 3: MAIN CONTENT (65% LEFT / 35% RIGHT) (Section 13, 14, 15, 19, 21) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT SIDE (65% on desktop - col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-card">
                {/* Table Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-poppins font-semibold text-lg text-[#0F172A]">
                      Blood inventory
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Current availability across all blood groups.
                    </p>
                  </div>

                  <Link
                    to="/hospital/inventory"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0F172A] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-center"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Manage inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Scannable Blood Inventory Table */}
                <BloodInventoryTable
                  items={inventory}
                  onSelectGroup={handleOpenGroupDetails}
                  showPrediction={true}
                />
              </div>

              {/* LEVEL 4: RECENT ACTIVITY TIMELINE (Section 22) */}
              <RecentActivityTimeline activities={activity} />
            </div>

            {/* RIGHT SIDE (35% on desktop - col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              <InventoryHealthPanel
                summary={summary}
                attentionItems={attentionItems}
                onSelectGroup={handleOpenGroupDetails}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer for Details & Quick Update */}
      <InventoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedItem={selectedGroupItem}
        mode={drawerMode}
        onModeChange={setDrawerMode}
        activities={activity}
        onSaveUpdate={updateInventory}
      />
    </HospitalLayout>
  );
};
