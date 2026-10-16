import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  Volume2, 
  MessageSquare, 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye
} from 'lucide-react';
import type { BloodCampaign, AnnouncementChannel } from '../../types/campaign';
import { campaignService } from '../../services/campaignService';
import { voiceService } from '../../services/voiceService';

interface CampaignAnnouncementModalProps {
  campaign: BloodCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CampaignAnnouncementModal: React.FC<CampaignAnnouncementModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [channel, setChannel] = useState<AnnouncementChannel>('IN_APP');
  const [title, setTitle] = useState(`Blood Donation Drive: ${campaign.title}`);
  const [message, setMessage] = useState(
    `SevaSetu Notice: ${campaign.organizerName} is hosting an urgent blood drive on ${campaign.startDate} from ${campaign.startTime} to ${campaign.endTime} at ${campaign.venueName}, ${campaign.city}. All eligible donors welcome! Register: https://sevasetu.org/campaigns/${campaign.id}`
  );
  const [targetAudience] = useState<'CITY_DONORS' | 'ALL_REGISTERED'>('CITY_DONORS');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  if (!isOpen) return null;

  const handleTestVoiceAnnouncement = () => {
    setIsPreviewingVoice(true);
    voiceService.speak(
      `Attention. ${campaign.title} is scheduled at ${campaign.venueName}. Voluntary donors are requested to register.`,
      {
        onEnd: () => setIsPreviewingVoice(false),
      }
    );
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = campaignService.dispatchAnnouncement({
      campaignId: campaign.id,
      channel,
      title,
      messageBody: message,
      targetAudience,
      targetCity: campaign.city,
      recipientsCount: targetAudience === 'CITY_DONORS' ? 142 : campaign.registeredCount,
      sentBy: 'NGO Coordinator',
    });

    if (res.success && res.announcement) {
      setStatusMessage({
        type: 'success',
        text: `Success! Announcement transmitted via ${channel} to ${res.announcement.recipientsCount} verified recipients. Idempotency Key: ${res.announcement.idempotencyKey.substring(0, 20)}...`,
      });
      // Also speak if browser voice selected
      if (channel === 'BROWSER_VOICE') {
        handleTestVoiceAnnouncement();
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to dispatch announcement.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E4C8A] flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Broadcast Campaign Announcement</h3>
            <p className="text-xs text-slate-500">Dispatch alerts to verified donors across regional channels</p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleDispatch} className="space-y-4">
          {/* Channel Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Distribution Channel:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setChannel('IN_APP')}
                className={`p-2.5 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                  channel === 'IN_APP'
                    ? 'border-[#C1272D] bg-red-50/50 text-[#C1272D] font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>In-App Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('TELEGRAM')}
                className={`p-2.5 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                  channel === 'TELEGRAM'
                    ? 'border-[#0088cc] bg-sky-50/50 text-[#0088cc] font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Telegram Bot</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('BROWSER_VOICE')}
                className={`p-2.5 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                  channel === 'BROWSER_VOICE'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Voice Audio</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`p-2.5 rounded-xl border text-center font-medium flex flex-col items-center gap-1 transition-all ${
                  channel === 'SMS'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>SMS Relay</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Announcement Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C1272D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Content:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C1272D]"
              required
            />
          </div>

          {/* Channel Preview Card */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Eye className="w-3.5 h-3.5" />
                Channel Preview: {channel}
              </span>
              <span>Audience: ~142 {campaign.city} Donors</span>
            </div>

            {channel === 'TELEGRAM' && (
              <div className="bg-white p-2.5 rounded-lg border border-sky-200 font-mono text-[11px] text-slate-800">
                <p className="font-bold text-[#0088cc]">🩸 SevaSetu Bot</p>
                <p className="mt-1">{message}</p>
              </div>
            )}

            {channel === 'BROWSER_VOICE' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 text-[11px]">Test speech voice synthesizer:</span>
                <button
                  type="button"
                  onClick={handleTestVoiceAnnouncement}
                  disabled={isPreviewingVoice}
                  className="px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-[11px] flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPreviewingVoice ? 'Speaking...' : 'Play Audio Preview'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
