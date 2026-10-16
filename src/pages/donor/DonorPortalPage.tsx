import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Users,
  ArrowRight,
  QrCode,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DonorLayout } from '../../components/donor/DonorLayout';
import { campaignService } from '../../services/campaignService';
import { donorService } from '../../services/donorService';
import { useAuth } from '../../context/AuthContext';
import type { BloodCampaign, CampaignRegistration } from '../../types/campaign';
import type { DonorProfile } from '../../types/donor';
import { localEventBus } from '../../sync/localEventBus';

export const DonorPortalPage: React.FC = () => {
  const { user } = useAuth();

  const getActiveDonor = (): DonorProfile => {
    const all = donorService.getDonors();
    if (user?.orgId) {
      const match = all.find((d) => d.id === user.orgId);
      if (match) return match;
    }
    if (user?.email) {
      const match = all.find((d) => d.email.toLowerCase() === user.email.toLowerCase());
      if (match) return match;
    }
    return all[0];
  };

  const donor = getActiveDonor();
  const [campaigns, setCampaigns] = useState<BloodCampaign[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<CampaignRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'OPEN_ONLY'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time slot selection modal state
  const [selectedCampaignForSlot, setSelectedCampaignForSlot] = useState<BloodCampaign | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('09:30 - 10:30');
  const [isRegistering, setIsRegistering] = useState(false);

  const loadData = () => {
    const allCamps = campaignService.getCampaigns();
    setCampaigns(allCamps);
    const regs = campaignService.getRegistrationsByDonor(donor.id);
    setMyRegistrations(regs);
  };

  useEffect(() => {
    loadData();
    const unsub1 = localEventBus.on('campaign.registered', loadData);
    const unsub2 = localEventBus.on('campaign.checked_in', loadData);
    const unsub3 = localEventBus.on('campaign.cancelled', loadData);
    const unsub4 = localEventBus.on('campaign.created', loadData);
    const unsub5 = localEventBus.on('campaign.updated', loadData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [donor.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Distinct cities list
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set);
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = cityFilter === 'ALL' || c.city.toLowerCase() === cityFilter.toLowerCase();
      const matchesAvailability =
        availabilityFilter === 'ALL' || c.registeredCount < c.capacityTarget;

      return matchesSearch && matchesCity && matchesAvailability;
    });
  }, [campaigns, searchQuery, cityFilter, availabilityFilter]);

  const handleOpenSlotModal = (camp: BloodCampaign) => {
    setSelectedCampaignForSlot(camp);
    setSelectedSlotTime('09:30 - 10:30');
  };

  const handleConfirmRegistration = () => {
    if (!selectedCampaignForSlot) return;
    setIsRegistering(true);

    try {
      const res = campaignService.registerDonor({
        campaignId: selectedCampaignForSlot.id,
        donorId: donor.id,
        donorName: donor.fullName,
        donorPhone: donor.phone,
        donorEmail: donor.email,
        bloodGroup: donor.bloodGroup,
        timeSlot: selectedSlotTime,
        priorDonationsCount: donor.totalDonations,
        distanceKm: 4.0,
      });

      if (res.success && res.registration) {
        loadData();
        setSelectedCampaignForSlot(null);
        showToast(
          res.isWaitlisted
            ? 'Capacity reached: You have been placed on the priority waitlist.'
            : `Reservation confirmed for slot ${selectedSlotTime}! Digital QR Pass issued.`
        );
      } else {
        showToast(res.error || 'Failed to complete registration.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <DonorLayout pageTitle="Browse Voluntary Blood Drives">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-mono tracking-wider text-red-400 font-bold uppercase bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800/80 inline-block">
              VOLUNTARY BLOOD MOBILIZATION
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins tracking-tight">
              Find &amp; Join Community Blood Drives
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Browse verified drives organized by regional NGOs, universities, and hospitals. Reserve your preferred time slot and receive your official digital pass instantly.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <Link
              to="/donor/registrations"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold font-poppins flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <QrCode className="w-4 h-4 text-red-600" />
              <span>My Passes ({myRegistrations.length})</span>
            </Link>

            <Link
              to="/donor/notifications"
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Sync</span>
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs font-semibold text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by drive title, venue, organizer, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C1272D]/20 focus:border-[#C1272D]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* City Dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Availability Toggle */}
            <button
              type="button"
              onClick={() => setAvailabilityFilter(availabilityFilter === 'ALL' ? 'OPEN_ONLY' : 'ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                availabilityFilter === 'OPEN_ONLY'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{availabilityFilter === 'OPEN_ONLY' ? 'Open Slots Only' : 'All Capacities'}</span>
            </button>
          </div>
        </div>

        {/* Drives Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {filteredCampaigns.length} verified blood drives</span>
            <span>Eligibility: {donor.bloodGroup} Voluntary Donor</span>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No matching drives found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active donation drives match your search filters. Try clearing your search query or city selection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((camp) => {
                const isRegistered = myRegistrations.some(
                  (r) => r.campaignId === camp.id && r.status !== 'CANCELLED'
                );
                const percentFull = Math.min(100, Math.round((camp.registeredCount / camp.capacityTarget) * 100));
                const isFull = camp.registeredCount >= camp.capacityTarget;

                return (
                  <div
                    key={camp.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                      isRegistered ? 'border-emerald-300 bg-emerald-50/10 ring-1 ring-emerald-100' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {camp.city}
                        </span>

                        {isRegistered ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            REGISTERED
                          </span>
                        ) : isFull ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            WAITLIST ONLY
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            SLOTS AVAILABLE
                          </span>
                        )}
                      </div>

                      {/* Title & Host */}
                      <div>
                        <h3 className="font-bold font-poppins text-base text-slate-900 leading-snug line-clamp-2">
                          {camp.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{camp.organizerName}</span>
                        </p>
                      </div>

                      {/* Location & Time */}
                      <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">
                            {camp.venueName}, {camp.venueAddress}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{camp.startDate}</span>
                          <span>&bull;</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{camp.startTime} - {camp.endTime}</span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">Reserved Units:</span>
                          <span className="font-bold text-slate-800">
                            {camp.registeredCount} / {camp.capacityTarget}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentFull >= 90 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percentFull}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isRegistered ? (
                        <Link
                          to="/donor/registrations"
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Digital Pass</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSlotModal(camp)}
                          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                            isFull
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-[#C1272D] hover:bg-[#A01F24] text-white'
                          }`}
                        >
                          <span>{isFull ? 'Join Priority Waitlist' : 'Select Time Slot & Register'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Time Slot Picker Modal */}
        {selectedCampaignForSlot && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Slot Reservation
                  </span>
                  <h3 className="font-bold font-poppins text-lg text-slate-900 mt-1">
                    {selectedCampaignForSlot.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCampaignForSlot.venueName} &bull; {selectedCampaignForSlot.startDate}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCampaignForSlot(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              {/* Slot Selection Radio Matrix */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Select Preferred Donation Window:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    '09:00 - 10:00',
                    '10:00 - 11:00',
                    '11:00 - 12:00',
                    '13:00 - 14:00',
                    '14:00 - 15:00',
                    '15:00 - 16:00',
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      className={`p-3 rounded-xl border text-xs font-mono font-bold text-left transition-all cursor-pointer ${
                        selectedSlotTime === slot
                          ? 'border-[#C1272D] bg-red-50/60 text-[#C1272D] shadow-xs ring-1 ring-red-200'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-[11px] font-sans text-slate-400 font-normal">Session</span>
                      <span>{slot}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor Summary Pill */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registered Volunteer:</span>
                  <span className="font-bold text-slate-800">{donor.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-bold text-red-600">{donor.bloodGroup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Delivery Channel:</span>
                  <span className="font-mono text-emerald-700 font-semibold">{donor.preferredChannel}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForSlot(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRegistration}
                  disabled={isRegistering}
                  className="px-5 py-2.5 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRegistering ? 'Confirming...' : 'Confirm Reservation'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  );
};
