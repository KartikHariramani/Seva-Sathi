import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  AlertCircle, 
  Layers, 
  RotateCcw
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

interface LeafletFacilityMapProps {
  facilities: MapFacility[];
  selectedGroup: BloodGroup | string;
  selectedFacilityId?: string | null;
  onSelectFacility: (facility: MapFacility) => void;
}

export const LeafletFacilityMap: React.FC<LeafletFacilityMapProps> = ({
  facilities,
  selectedGroup,
  selectedFacilityId,
  onSelectFacility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileProvider, setTileProvider] = useState<'osm' | 'carto'>('osm');
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [showRings, setShowRings] = useState(true);

  // Default regional center: Nagpur / Central Maharashtra
  const defaultCenter: [number, number] = [21.1458, 79.0882];
  const defaultZoom = 11;

  const validFacilities = useMemo(
    () => facilities.filter((f) => f.coordinates && typeof f.coordinates.lat === 'number' && typeof f.coordinates.lng === 'number'),
    [facilities]
  );

  const missingCoordsCount = facilities.length - validFacilities.length;

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Layer Groups
      const circlesLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      circlesLayerRef.current = circlesLayer;
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
      setMapReady(true);
    } catch (err) {
      console.error('[LeafletMap] Failed to initialize map:', err);
      setTileError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Provider & Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileUrl =
      tileProvider === 'osm'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const attribution =
      tileProvider === 'osm'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        : '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
      subdomains: tileProvider === 'osm' ? 'abc' : 'abcd',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
      // Auto-fallback to Carto if OSM fails
      if (tileProvider === 'osm') {
        console.warn('[LeafletMap] OSM tile error. Switching to CartoDB Voyager fallback...');
        setTileProvider('carto');
      }
    });

    tileLayer.addTo(map);
    currentTileLayerRef.current = tileLayer;
    setTileError(false);
  }, [tileProvider, mapReady]);

  // Render Range Corridor Rings (20km, 40km, 60km)
  useEffect(() => {
    const circlesLayer = circlesLayerRef.current;
    if (!circlesLayer) return;

    circlesLayer.clearLayers();

    if (!showRings) return;

    // 20km Corridor Ring (Cyan)
    L.circle(defaultCenter, {
      radius: 20000,
      color: '#0284C7',
      fillColor: '#0284C7',
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: '6, 6',
    })
      .bindTooltip('20 KM Immediate Corridor', { permanent: false, direction: 'top' })
      .addTo(circlesLayer);

    // 40km Regional Ring (Indigo)
    L.circle(defaultCenter, {
      radius: 40000,
      color: '#6366F1',
      fillColor: '#6366F1',
      fillOpacity: 0.03,
      weight: 1.5,
      dashArray: '6, 6',
    })
      .bindTooltip('40 KM District Range', { permanent: false, direction: 'top' })
      .addTo(circlesLayer);

    // 60km Expanded Ring (Rose)
    L.circle(defaultCenter, {
      radius: 60000,
      color: '#E11D48',
      fillColor: '#E11D48',
      fillOpacity: 0.02,
      weight: 1.5,
      dashArray: '6, 6',
    })
      .bindTooltip('60 KM Regional Emergency Expansion', { permanent: false, direction: 'top' })
      .addTo(circlesLayer);
  }, [showRings, mapReady]);

  // Render Facility Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    validFacilities.forEach((facility) => {
      const { lat, lng } = facility.coordinates!;
      const isSelected = selectedFacilityId === facility.id;
      const isBank = facility.type === 'blood_bank';
      const pinColor = isBank ? '#EF4444' : '#2563EB';
      const bgLight = isBank ? '#FEF2F2' : '#EFF6FF';

      // Custom HTML Marker Pin
      const iconHtml = `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-125 cursor-pointer">
          ${isSelected ? `<span class="absolute w-12 h-12 rounded-full animate-ping opacity-75" style="background-color: ${pinColor};"></span>` : ''}
          <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white" style="background-color: ${pinColor};">
            ${isBank ? `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
            ` : `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            `}
          </div>
          ${facility.availableStock > 0 ? `
            <span class="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white text-slate-800 shadow-sm border border-slate-200 font-mono">
              ${facility.availableStock}
            </span>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Build rich informative popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 font-sans max-w-xs text-slate-800';
      popupContent.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style="background-color: ${bgLight}; color: ${pinColor};">
            ${isBank ? 'Blood Bank' : 'Hospital'}
          </span>
          ${facility.verified ? `
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          ` : ''}
        </div>
        <h4 class="font-bold text-sm text-slate-900 leading-snug">${facility.name}</h4>
        <p class="text-xs text-slate-500 mt-0.5">${facility.city} • ${facility.distanceKm.toFixed(1)} km away</p>
        <p class="text-[11px] text-slate-600 mt-1">${facility.address}</p>
        
        <div class="my-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <span class="text-slate-500 font-medium">${selectedGroup} Units Available:</span>
          <span class="font-mono font-bold text-slate-900 text-sm">${facility.availableStock} Units</span>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>Synced: ${facility.syncStatus}</span>
          <span>Updated ${facility.lastUpdatedMinutesAgo}m ago</span>
        </div>

        <button id="inspect-facility-${facility.id}" class="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1 shadow-xs" style="background-color: ${pinColor};">
          Inspect Facility & Inventory &rarr;
        </button>
      `;

      // Wire up button click inside popup
      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-facility-${facility.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectFacility(facility);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectFacility(facility);
      });

      marker.addTo(markersLayer);

      // Auto-open popup if selected
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [validFacilities, selectedFacilityId, selectedGroup, onSelectFacility, mapReady]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, defaultZoom);
    }
  };

  const handleToggleTileProvider = () => {
    setTileProvider((prev) => (prev === 'osm' ? 'carto' : 'osm'));
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md">
      {/* Top Map Control & Legend Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs text-slate-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Live Geospatial Network</span>
          <span className="text-slate-400 font-mono text-[11px]">({validFacilities.length} Mapped)</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs text-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
            <span className="font-medium">Blood Bank</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
            <span className="font-medium">Hospital</span>
          </div>
        </div>

        {missingCoordsCount > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{missingCoordsCount} facility missing GPS coordinates</span>
          </div>
        )}
      </div>

      {/* Floating Action Buttons (Reset, Tile Switch, Rings) */}
      <div className="absolute top-3 right-14 z-[1000] flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={handleToggleTileProvider}
          title={`Switch Tile Layer (Currently ${tileProvider === 'osm' ? 'OpenStreetMap' : 'CartoDB'})`}
          className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline font-mono uppercase text-[10px]">{tileProvider}</span>
        </button>

        <button
          onClick={() => setShowRings((prev) => !prev)}
          title="Toggle 20km/40km/60km Range Rings"
          className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 ${
            showRings
              ? 'bg-blue-50/95 border-blue-200 text-blue-800'
              : 'bg-white/95 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="hidden md:inline text-[11px]">Corridor Rings</span>
          <span className="text-[10px] font-bold font-mono">{showRings ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleResetView}
          title="Reset Map View"
          className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Fallback Banner if tiles fail */}
      {tileError && (
        <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-md flex items-center gap-2 pointer-events-auto">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Tile network provider hiccup detected. Using fallback tile mirrors.</span>
          <button
            onClick={() => {
              setTileError(false);
              setTileProvider((prev) => (prev === 'osm' ? 'carto' : 'osm'));
            }}
            className="font-bold underline ml-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} aria-label="Interactive Geographic Blood Facility Map" />
    </div>
  );
};
