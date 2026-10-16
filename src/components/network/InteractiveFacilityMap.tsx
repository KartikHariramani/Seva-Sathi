import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import type { BloodGroup } from '../../types';

export interface MapFacility {
  id: string;
  name: string;
  code: string;
  type: 'hospital' | 'blood_bank' | 'ngo';
  city: string;
  address: string;
  phone: string;
  coordinates?: { lat: number; lng: number };
  verified: boolean;
  distanceKm: number;
  availableStock: number;
  syncStatus: string;
  lastUpdatedMinutesAgo: number;
}

interface InteractiveFacilityMapProps {
  facilities: MapFacility[];
  selectedGroup: BloodGroup | string;
  selectedFacilityId?: string | null;
  onSelectFacility: (facility: MapFacility) => void;
}

export const InteractiveFacilityMap: React.FC<InteractiveFacilityMapProps> = ({
  facilities,
  selectedGroup,
  selectedFacilityId,
  onSelectFacility,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredFacility, setHoveredFacility] = useState<MapFacility | null>(null);

  // Geographic bounds around Central Maharashtra / Nagpur metropolitan region
  const centerLat = 21.1458;
  const centerLng = 79.0882;
  const latSpan = 0.45;
  const lngSpan = 0.55;

  const validFacilities = useMemo(
    () => facilities.filter((f) => f.coordinates && f.coordinates.lat && f.coordinates.lng),
    [facilities]
  );

  const missingCoordsCount = facilities.length - validFacilities.length;

  // Project lat/lng into SVG 800x500 viewport
  const projectCoordinates = (lat: number, lng: number) => {
    const x = ((lng - (centerLng - lngSpan / 2)) / lngSpan) * 800;
    // Invert Y because latitude increases northward while SVG Y increases downward
    const y = (((centerLat + latSpan / 2) - lat) / latSpan) * 500;
    return { x, y };
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.8));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[480px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl select-none">
      {/* Top Map Status Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-200 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Live Geospatial Network</span>
          <span className="text-slate-400 font-mono text-[11px]">({validFacilities.length} Mapped)</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white" />
            <span>Blood Bank</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
            <span>Hospital</span>
          </div>
        </div>

        {missingCoordsCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{missingCoordsCount} facility pending GPS verification</span>
          </div>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Map Canvas with Grid and Markers */}
      <svg
        viewBox="0 0 800 500"
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <defs>
          {/* Grid pattern for high-tech spatial feel */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          </pattern>

          {/* Radial Corridor Ring */}
          <radialGradient id="corridorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C1272D" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#1E4C8A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Grid Background */}
        <rect width="800" height="500" fill="url(#grid)" />

        {/* 20km, 40km, 60km Range Distance Rings centered at regional apex hospital */}
        <circle cx="400" cy="250" r="90" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.35" />
        <text x="405" y="165" fill="#38BDF8" fontSize="10" opacity="0.6" fontFamily="monospace">20 KM CORRIDOR</text>

        <circle cx="400" cy="250" r="170" fill="none" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.30" />
        <text x="405" y="85" fill="#818CF8" fontSize="10" opacity="0.6" fontFamily="monospace">40 KM REGIONAL</text>

        <circle cx="400" cy="250" r="240" fill="none" stroke="#F43F5E" strokeWidth="1" strokeDasharray="6,6" opacity="0.25" />
        <text x="405" y="20" fill="#F43F5E" fontSize="10" opacity="0.5" fontFamily="monospace">60 KM EXPANDED</text>

        {/* Facility Markers */}
        {validFacilities.map((facility) => {
          const { x, y } = projectCoordinates(facility.coordinates!.lat, facility.coordinates!.lng);
          const isSelected = selectedFacilityId === facility.id;
          const isBank = facility.type === 'blood_bank';
          const pinColor = isBank ? '#EF4444' : '#3B82F6';

          return (
            <g
              key={facility.id}
              className="cursor-pointer group"
              onClick={() => onSelectFacility(facility)}
              onMouseEnter={() => setHoveredFacility(facility)}
              onMouseLeave={() => setHoveredFacility(null)}
              transform={`translate(${x}, ${y})`}
            >
              {/* Highlight Pulse Ring when selected */}
              {isSelected && (
                <circle
                  r="24"
                  fill="none"
                  stroke={pinColor}
                  strokeWidth="2"
                  className="animate-ping"
                  opacity="0.6"
                />
              )}

              {/* Pin Base Circle */}
              <circle
                r={isSelected ? 16 : 12}
                fill={pinColor}
                stroke="#FFFFFF"
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200 group-hover:scale-125 shadow-lg drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
              />

              {/* Icon inside pin */}
              {isBank ? (
                <path
                  d="M0 -5 C-3 0, -4 4, 0 6 C4 4, 3 0, 0 -5 Z"
                  fill="#FFFFFF"
                  transform="scale(0.85)"
                />
              ) : (
                <path
                  d="M-4 -1 L4 -1 L4 1 L-4 1 Z M-1 -4 L1 -4 L1 4 L-1 4 Z"
                  fill="#FFFFFF"
                  transform="scale(1.1)"
                />
              )}

              {/* Facility Name Label */}
              <text
                y={isSelected ? 26 : 22}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize={isSelected ? "11" : "9"}
                fontWeight={isSelected ? "bold" : "medium"}
                className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              >
                {facility.name.length > 20 ? facility.name.substring(0, 18) + '...' : facility.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Facility Preview Modal Card */}
      {hoveredFacility && (
        <div className="absolute bottom-4 left-4 z-20 w-80 p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white shadow-2xl transition-all">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  hoveredFacility.type === 'blood_bank'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {hoveredFacility.type === 'blood_bank' ? 'Regional Blood Bank' : 'Trauma Hospital'}
              </span>
              <h4 className="font-bold text-sm text-slate-100 mt-1">{hoveredFacility.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{hoveredFacility.address}</p>
            </div>
            {hoveredFacility.verified && (
              <span title="State Verified Institution">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Distance:</span>
              <p className="font-semibold text-slate-200">{hoveredFacility.distanceKm.toFixed(1)} km</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">{selectedGroup} Units:</span>
              <p className="font-semibold text-emerald-400">{hoveredFacility.availableStock} Units Usable</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Sync {hoveredFacility.lastUpdatedMinutesAgo}m ago
            </span>
            <button
              onClick={() => onSelectFacility(hoveredFacility)}
              className="text-xs text-[#38BDF8] hover:underline font-semibold flex items-center gap-1"
            >
              Select Facility &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
