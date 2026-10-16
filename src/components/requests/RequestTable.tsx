import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { BloodRequest } from '../../types/bloodRequest';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { ArrowRight, Inbox, SearchX, Plus } from 'lucide-react';

interface RequestTableProps {
  requests: BloodRequest[];
  hasFiltersApplied: boolean;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  hasFiltersApplied,
  onResetFilters,
  onCreateNew,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (requestId: string) => {
    navigate(`/hospital/requests/${requestId}`);
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // 1. Empty state: No search results
  if (requests.length === 0 && hasFiltersApplied) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="font-poppins font-semibold text-base text-[#0F172A]">
          No requests found
        </h4>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
          No blood requests match your current filters or search terms. Try loosening your criteria.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4C8A] hover:text-[#0F2E5A] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  // 2. Empty state: No blood requests in system yet
  if (requests.length === 0 && !hasFiltersApplied) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-card">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#C1272D] flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="font-poppins font-semibold text-base text-[#0F172A]">
          No blood requests yet
        </h4>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
          Create your first request to coordinate blood inventory with connected banks across the SevaSetu network.
        </p>
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#C1272D] hover:bg-[#A61E24] px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Blood Request</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-card overflow-hidden">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 font-mono text-[11px] uppercase tracking-wider text-[#64748B] bg-slate-50/50">
              <th className="py-3 px-4 font-semibold">Request</th>
              <th className="py-3 px-4 font-semibold">Blood Group</th>
              <th className="py-3 px-4 font-semibold text-right">Quantity</th>
              <th className="py-3 px-4 font-semibold">Priority</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Created</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {requests.map((req) => (
              <tr
                key={req.id}
                onClick={() => handleRowClick(req.id)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Request Display ID */}
                <td className="py-3.5 px-4 font-mono font-medium text-[#0F172A] group-hover:text-[#1E4C8A] transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span>{req.displayId}</span>
                  </div>
                </td>

                {/* Blood Group */}
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-xs text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {req.bloodGroup}
                  </span>
                </td>

                {/* Quantity */}
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] tabular-nums">
                  {req.quantityLitres.toFixed(1)} L
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4">
                  <RequestPriorityBadge priority={req.priority} size="sm" />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <RequestStatusBadge status={req.status} size="sm" />
                </td>

                {/* Created Timestamp */}
                <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {formatRelativeTime(req.createdAt)}
                </td>

                {/* Action CTA */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(req.id);
                    }}
                    className="text-xs font-semibold text-slate-500 group-hover:text-[#1E4C8A] inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE STACKED CARDS VIEW */}
      <div className="md:hidden divide-y divide-slate-100">
        {requests.map((req) => (
          <div
            key={req.id}
            onClick={() => handleRowClick(req.id)}
            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-sm text-[#0F172A]">
                {req.displayId}
              </span>
              <RequestStatusBadge status={req.status} size="sm" />
            </div>

            <div className="flex items-center gap-3 my-2 text-xs">
              <span className="font-mono font-bold text-base text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {req.bloodGroup}
              </span>
              <span className="font-mono font-bold text-sm text-slate-700">
                {req.quantityLitres.toFixed(1)} L
              </span>
              <RequestPriorityBadge priority={req.priority} size="sm" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-2 font-mono">
              <span>{formatRelativeTime(req.createdAt)}</span>
              <span className="text-[#1E4C8A] font-medium flex items-center gap-1">
                View details <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
