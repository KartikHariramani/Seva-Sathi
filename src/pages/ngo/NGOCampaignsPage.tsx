import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  QrCode,
  Megaphone,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BloodCampaign, CampaignRegistration } from '../../types/campaign';
import { campaignService } from '../../services/campaignService';
import { VolunteerQRScannerModal } from '../../components/campaign/VolunteerQRScannerModal';
import { CampaignAnnouncementModal } from '../../components/campaign/CampaignAnnouncementModal';
import { localEventBus } from '../../sync/localEventBus';

export const NGOCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<BloodCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<BloodCampaign | null>(null);
  const [registrations, setRegistrations] = useState<CampaignRegistration[]>([]);

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Campaign Form State
  const [newTitle, setNewTitle] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const newAddress = '';
  const [newCity, setNewCity] = useState('Nagpur');
  const [newDate, setNewDate] = useState('2026-11-05');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('16:00');
  const [newCapacity, setNewCapacity] = useState(100);
  const [newPhone, setNewPhone] = useState('+91 712 255 1090');

  const loadData = () => {
    const list = campaignService.getCampaigns();
    setCampaigns(list);
    if (!selectedCampaign && list.length > 0) {
      setSelectedCampaign(list[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = localEventBus.on('campaign.created', loadData);
    const unsub2 = localEventBus.on('campaign.registered', loadData);
    const unsub3 = localEventBus.on('campaign.checked_in', loadData);
    const unsub4 = localEventBus.on('campaign.cancelled', loadData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      const regs = campaignService.getRegistrations(selectedCampaign.id);
      setRegistrations(regs);
    }
  }, [selectedCampaign, campaigns]);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVenue.trim()) return;

    const created = campaignService.createCampaign({
      title: newTitle.trim(),
      organizerId: 'ORG-NGO-01',
      organizerName: 'LifeStream Red Cross NGO Alliance',
      venueName: newVenue.trim(),
      venueAddress: newAddress.trim() || `${newVenue}, ${newCity}`,
      city: newCity,
      state: 'Maharashtra',
      pincode: '440010',
      coordinates: { lat: 21.1458, lng: 79.0882 },
      startDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      capacityTarget: newCapacity,
      status: 'SCHEDULED',
      eligibilityCriteria: 'Age 18-65, Weight > 45kg, Hemoglobin > 12.5 g/dL. No donation in past 90 days.',
      contactPhone: newPhone,
      contactEmail: 'coordinator@sevasathi.org',
      qrCodeSecret: `SS-QR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });

    setIsCreateOpen(false);
    setSelectedCampaign(created);
    loadData();
  };

  const totalRegistered = campaigns.reduce((acc, c) => acc + c.registeredCount, 0);
  const totalAttended = campaigns.reduce((acc, c) => acc + c.attendedCount, 0);
  const totalCapacity = campaigns.reduce((acc, c) => acc + c.capacityTarget, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-poppins text-slate-900 tracking-tight">
              NGO Campaign Coordination Portal
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              LifeStream Alliance
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Organize voluntary blood donation drives, coordinate donor RSVPs, conduct QR ticket attendance, and broadcast alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/organizer/telemetry"
            className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Live Telemetry</span>
          </Link>

          <button
            onClick={() => setIsCheckInOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>QR Attendance Desk</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Drive</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Active Campaigns</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
          <span className="text-[11px] text-blue-600 font-medium">Regional coverage</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Target Blood Units</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCapacity}</p>
          <span className="text-[11px] text-slate-500 font-medium">Across all scheduled venues</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total RSVPs Registered</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalRegistered}</p>
          <span className="text-[11px] text-emerald-600 font-medium font-mono">
            {Math.round((totalRegistered / Math.max(1, totalCapacity)) * 100)}% capacity filled
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Verified Donors Attended</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAttended}</p>
          <span className="text-[11px] text-slate-500 font-medium">Validated via QR Phlebotomy scan</span>
        </div>
      </div>

      {/* Main Campaign Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Campaigns */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Scheduled Drives</h2>
          <div className="space-y-3">
            {campaigns.map((camp) => {
              const isSelected = selectedCampaign?.id === camp.id;
              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaign(camp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#C1272D] bg-red-50/20 shadow-md ring-1 ring-[#C1272D]'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {camp.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{camp.city}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{camp.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{camp.venueName}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Target</span>
                      <p className="font-semibold text-slate-700">{camp.capacityTarget}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">RSVPs</span>
                      <p className="font-semibold text-blue-600">{camp.registeredCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Attended</span>
                      <p className="font-semibold text-emerald-600">{camp.attendedCount}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center / Right Selected Campaign Details */}
        {selectedCampaign && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Drive Code: {selectedCampaign.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1.5">{selectedCampaign.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCampaign.venueAddress}</p>
                </div>

                <button
                  onClick={() => setIsAnnouncementOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
                >
                  <Megaphone className="w-4 h-4 text-purple-600" />
                  <span>Send Broadcast</span>
                </button>
              </div>

              {/* Campaign Schedule Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" /> Date:
                  </span>
                  <p className="font-bold text-slate-800 mt-1">{selectedCampaign.startDate}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5" /> Timing:
                  </span>
                  <p className="font-bold text-slate-800 mt-1">{selectedCampaign.startTime} - {selectedCampaign.endTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5" /> Capacity:
                  </span>
                  <p className="font-bold text-slate-800 mt-1">{selectedCampaign.registeredCount} / {selectedCampaign.capacityTarget}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Confirmed:
                  </span>
                  <p className="font-bold text-emerald-600 mt-1">{selectedCampaign.confirmedCount} RSVPs</p>
                </div>
              </div>

              {/* Registrations & ML Turnout Predictions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span>Attendee Roster & Turnout Probability</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      ML Logistic Scored
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {registrations.length} donor{registrations.length === 1 ? '' : 's'} registered
                  </span>
                </div>

                {registrations.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                    No registrations logged yet for this campaign.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Donor Name</th>
                          <th className="py-2.5 px-3">Blood Group</th>
                          <th className="py-2.5 px-3">Slot</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Turnout Forecast</th>
                          <th className="py-2.5 px-3">Ticket Token</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{reg.donorName}</td>
                            <td className="py-2.5 px-3 font-bold text-[#C1272D]">{reg.bloodGroup}</td>
                            <td className="py-2.5 px-3 text-slate-600">{reg.timeSlot}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  reg.status === 'ATTENDED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : reg.status === 'CONFIRMED'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {reg.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-purple-700">
                              {Math.round((reg.turnoutProbability || 0.65) * 100)}%
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{reg.qrTicketToken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Schedule Blood Donation Drive</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Ramdaspeth Community Blood Donation Camp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue Name:</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Rotary Club Hall"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / District:</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time:</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity Target (Units):</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white font-semibold shadow-sm"
                >
                  Confirm & Schedule Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Volunteer Camera QR Check-In Modal */}
      <VolunteerQRScannerModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        campaignTitle={selectedCampaign?.title || 'Central Vidarbha Voluntary Blood Drive'}
        onCheckInSuccess={() => loadData()}
      />

      {/* Campaign Announcement Broadcast Modal */}
      {selectedCampaign && (
        <CampaignAnnouncementModal
          campaign={selectedCampaign}
          isOpen={isAnnouncementOpen}
          onClose={() => setIsAnnouncementOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
