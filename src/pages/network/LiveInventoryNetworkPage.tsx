import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  GitPullRequest,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useHospitalInventory } from '../../context/HospitalInventoryContext';
import type { BloodGroup } from '../../types';
import type { BloodComponent } from '../../types/nearExpiry';
import type { Organization } from '../../types/organization';
import { INITIAL_ORGANIZATIONS } from '../../persistence/seedManager';
import { calculateHaversineDistance } from '../../lib/supabase';
import { LeafletFacilityMap } from '../../components/network/LeafletFacilityMap';

export type SyncIntegrityStatus =
  | 'LIVE_INTEGRATED'
  | 'RECENTLY_SYNCED'
  | 'MANUALLY_REPORTED'
  | 'STALE_UNAVAILABLE';

interface BloodBankInventoryCard {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  distanceKm: number;
  syncStatus: SyncIntegrityStatus;
  lastUpdatedMinutesAgo: number;
  verified: boolean;
  inventory: Record<BloodGroup, number>;
  componentsAvailable: BloodComponent[];
  shelfLifeDaysAvg: number;
  activeReservations: number;
  coordinates: { lat: number; lng: number };
}

export const LiveInventoryNetworkPage: React.FC = () => {
  const { lastUpdatedTime, refreshInventory } = useHospitalInventory();

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('O+');
  const [selectedComponent, setSelectedComponent] = useState<string>('ALL');
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  const bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const componentOptions: BloodComponent[] = [
    'Whole Blood',
    'Packed Red Blood Cells (PRBC)',
    'Platelet Concentrate',
    'Fresh Frozen Plasma (FFP)',
    'Cryoprecipitate',
  ];

  // Base Blood Banks from Seeded Database
  const [banksList, setBanksList] = useState<BloodBankInventoryCard[]>([]);

  useEffect(() => {
    const userLat = 21.128;
    const userLng = 79.098;

    const bloodBanks = INITIAL_ORGANIZATIONS.filter((o: Organization) => o.type === 'blood_bank');

    const mapped: BloodBankInventoryCard[] = bloodBanks.map((b: Organization, idx: number) => {
      const dist = calculateHaversineDistance(
        userLat,
        userLng,
        b.location.coordinates.lat || 21.1458,
        b.location.coordinates.lng || 79.0882
      );

      // Realistic inventory distributions across groups
      const inv: Record<BloodGroup, number> = {
        'A+': 12 + idx * 2,
        'A-': 3 + idx,
        'B+': 18 + idx * 3,
        'B-': 4 + idx,
        'AB+': 8 + idx,
        'AB-': 2,
        'O+': idx === 0 ? 14 : idx === 1 ? 6 : 9,
        'O-': idx === 0 ? 3 : 1,
      };

      const syncStatuses: SyncIntegrityStatus[] = [
        'LIVE_INTEGRATED',
        'RECENTLY_SYNCED',
        'MANUALLY_REPORTED',
      ];

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        city: b.location.city,
        address: b.location.address,
        phone: b.contact.primaryPhone,
        distanceKm: dist,
        syncStatus: syncStatuses[idx % syncStatuses.length],
        lastUpdatedMinutesAgo: idx * 8 + 4,
        verified: b.status === 'VERIFIED',
        inventory: inv,
        componentsAvailable: [
          'Whole Blood',
          'Packed Red Blood Cells (PRBC)',
          'Platelet Concentrate',
          'Fresh Frozen Plasma (FFP)',
        ],
        shelfLifeDaysAvg: 26 - idx * 4,
        activeReservations: idx + 1,
        coordinates: b.location.coordinates,
      };
    });

    setBanksList(mapped);
  }, []);

  // Filter Logic
  const filteredBanks = banksList.filter((bank) => {
    if (onlyVerified && !bank.verified) return false;
    if (selectedCity !== 'ALL' && bank.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (bank.distanceKm > maxDistance) return false;

    if (selectedGroup !== 'ALL') {
      const available = bank.inventory[selectedGroup as BloodGroup] || 0;
      if (available < minQuantity) return false;
    }

    if (
      selectedComponent !== 'ALL' &&
      !bank.componentsAvailable.includes(selectedComponent as BloodComponent)
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = bank.name.toLowerCase().includes(q);
      const matchCity = bank.city.toLowerCase().includes(q);
      const matchCode = bank.code.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchCode) return false;
    }

    return true;
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const getSyncBadge = (status: SyncIntegrityStatus) => {
    switch (status) {
      case 'LIVE_INTEGRATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Integrated Feed
          </span>
        );
      case 'RECENTLY_SYNCED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-2.5 h-2.5" />
            Synced &lt; 1h ago
          </span>
        );
      case 'MANUALLY_REPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Manually Reported
          </span>
        );
      case 'STALE_UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            Stale / Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              Live Regional Blood-Bank Network
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Verified Feeds
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Search authorized blood-bank repositories across Maharashtra with cryptographically synchronized stock counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshInventory}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refreshed {lastUpdatedTime}</span>
          </button>

          <Link
            to="/hospital/requests/new"
            className="px-4 py-2 rounded-lg bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Create Emergency Request</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search blood banks by name, city, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C1272D] bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded text-[#C1272D] focus:ring-[#C1272D]"
              />
              <span>Verified Institutions Only</span>
            </label>
          </div>
        </div>

        {/* Detailed Criteria Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Blood Group */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Required Blood Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-[#C1272D] bg-slate-50"
            >
              <option value="ALL">Any Compatible Group</option>
              {bloodGroupOptions.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Component */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Blood Component
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 bg-slate-50 truncate"
            >
              <option value="ALL">All Components</option>
              {componentOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Min Units Needed: {minQuantity}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value, 10))}
              className="w-full accent-[#C1272D] mt-2 cursor-pointer"
            />
          </div>

          {/* Distance */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Max Distance: {maxDistance} km
            </label>
            <input
              type="range"
              min="5"
              max="150"
              step="5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value, 10))}
              className="w-full accent-[#1E4C8A] mt-2 cursor-pointer"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              District / City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 bg-slate-50"
            >
              <option value="ALL">All Districts</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Wardha">Wardha</option>
              <option value="Bhandara">Bhandara</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Switcher & Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-slate-600 font-mono flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {filteredBanks.length} Facilities
          </span>
          <span>with usable stock</span>
          <span className="text-slate-400">| Reference: Nagpur Apex (21.128, 79.098)</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'both' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map + List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'map' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map Only
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'list' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List Only
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Geographic Map View */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <LeafletFacilityMap
          facilities={[
            ...filteredBanks.map((b) => ({
              id: b.id,
              name: b.name,
              code: b.code,
              type: 'blood_bank' as const,
              city: b.city,
              address: b.address,
              phone: b.phone,
              coordinates: b.coordinates,
              verified: b.verified,
              distanceKm: b.distanceKm,
              availableStock: selectedGroup !== 'ALL' ? b.inventory[selectedGroup as BloodGroup] || 0 : Object.values(b.inventory).reduce((x, y) => x + y, 0),
              syncStatus: b.syncStatus,
              lastUpdatedMinutesAgo: b.lastUpdatedMinutesAgo,
            })),
            ...INITIAL_ORGANIZATIONS.filter((o) => o.type === 'hospital').map((h, idx) => ({
              id: h.id,
              name: h.name,
              code: h.code,
              type: 'hospital' as const,
              city: h.location.city,
              address: h.location.address,
              phone: h.contact.primaryPhone,
              coordinates: h.location.coordinates,
              verified: h.status === 'VERIFIED',
              distanceKm: calculateHaversineDistance(
                21.128,
                79.098,
                h.location.coordinates?.lat || 21.1458,
                h.location.coordinates?.lng || 79.0882
              ),
              availableStock: Math.round(h.stats.totalInventoryUnits),
              syncStatus: 'LIVE_INTEGRATED',
              lastUpdatedMinutesAgo: idx * 6 + 3,
            })),
          ]}
          selectedGroup={selectedGroup}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={(fac) => setSelectedFacilityId(fac.id)}
        />
      )}

      {/* Blood Bank Cards Grid (Synchronized List View) */}
      {(viewMode === 'both' || viewMode === 'list') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanks.map((bank) => {
          const isSelected = selectedFacilityId === bank.id;
          const groupStock =
            selectedGroup !== 'ALL'
              ? bank.inventory[selectedGroup as BloodGroup] || 0
              : Object.values(bank.inventory).reduce((a, b) => a + b, 0);

          return (
            <div
              key={bank.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isSelected ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Header with Sync Badge */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/40">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{bank.name}</h3>
                      {bank.verified && (
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{bank.code} • {bank.city}</p>
                  </div>
                  {getSyncBadge(bank.syncStatus)}
                </div>

                {/* Stock Highlight */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between bg-red-50/60 p-3 rounded-xl border border-red-100">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Available {selectedGroup !== 'ALL' ? `Group ${selectedGroup}` : 'Total Units'}
                      </span>
                      <div className="text-2xl font-bold font-poppins text-[#C1272D]">
                        {groupStock} Units
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono text-slate-600">
                      <div className="font-bold text-slate-900">{bank.distanceKm} km away</div>
                      <div className="text-[10px] text-slate-500">
                        ~{Math.round(bank.distanceKm * 2 + 10)} min transit
                      </div>
                    </div>
                  </div>

                  {/* 8-Group Micro Grid */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 mb-1.5 block">
                      Full Blood Group Inventory:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                      {bloodGroupOptions.map((bg) => (
                        <div
                          key={bg}
                          className={`p-1 rounded border text-[11px] ${
                            bg === selectedGroup
                              ? 'border-[#C1272D] bg-red-50 text-[#C1272D] font-bold'
                              : 'border-slate-100 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-[9px] text-slate-400">{bg}</div>
                          <div className="font-semibold">{bank.inventory[bg]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{bank.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Avg Shelf Life: {bank.shelfLifeDaysAvg} days</span>
                      <span>Active Reservations: {bank.activeReservations}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 pt-0">
                <Link
                  to={`/hospital/requests/new?bloodGroup=${selectedGroup !== 'ALL' ? selectedGroup : 'O+'}&preferredBankId=${bank.id}&neededUnits=${minQuantity}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <span>Request Units from this Blood Bank</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
