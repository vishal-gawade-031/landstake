'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Crosshair,
  Maximize2,
  RotateCcw,
  Ruler,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Compass,
  FileBadge,
  Sparkles,
} from 'lucide-react';
import { calculateArea, measureDistance, detectBoundaryOverlap } from '@/lib/turfAnalysis';
import { RiskEngine } from '@/services/riskEngine';

interface LandMapProps {
  initialUlpin?: string;
  onParcelSelect?: (parcel: any) => void;
}

export default function LandMap({ initialUlpin, onParcelSelect }: LandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const measureMarkersRef = useRef<any[]>([]);
  const measureLineRef = useRef<any>(null);

  // Data states
  const [parcelsGeoJson, setParcelsGeoJson] = useState<any>(null);
  const [restrictionsGeoJson, setRestrictionsGeoJson] = useState<any>(null);
  const [infrastructureGeoJson, setInfrastructureGeoJson] = useState<any>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedLandUseFilter, setSelectedLandUseFilter] = useState('ALL');

  // Layer Toggles
  const [activeLayers, setActiveLayers] = useState({
    parcels: true,
    landUse: true,
    boundaries: true,
    restrictions: true,
    risk: false,
    roads: true,
    utilities: true,
  });

  // Tools & measurement states
  const [measurementMode, setMeasurementMode] = useState<'NONE' | 'DISTANCE' | 'AREA'>('NONE');
  const [measuredDistance, setMeasuredDistance] = useState<{ meters: number; km: number } | null>(null);
  const [distancePoints, setDistancePoints] = useState<[number, number][]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Land use color palette
  const getLandUseColor = (landUse: string) => {
    switch (landUse) {
      case 'Residential':
        return '#38bdf8'; // light blue
      case 'Agricultural':
        return '#4ade80'; // light green
      case 'Commercial':
        return '#fb923c'; // orange
      case 'Industrial':
        return '#c084fc'; // purple
      case 'Institutional':
        return '#facc15'; // yellow
      case 'Mixed Use':
      default:
        return '#94a3b8'; // grey
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#ef4444'; // red
      case 'HIGH':
        return '#f97316'; // orange
      case 'MEDIUM':
        return '#eab308'; // yellow
      case 'LOW':
      default:
        return '#10b981'; // green
    }
  };

  // 1. Fetch GeoJSON Data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [parcelsRes, restRes, infraRes] = await Promise.all([
          fetch('/api/geojson?layer=parcels'),
          fetch('/api/geojson?layer=restrictions'),
          fetch('/api/geojson?layer=infrastructure'),
        ]);

        if (parcelsRes.ok) {
          const pData = await parcelsRes.json();
          setParcelsGeoJson(pData);
        }
        if (restRes.ok) {
          const rData = await restRes.json();
          setRestrictionsGeoJson(rData);
        }
        if (infraRes.ok) {
          const iData = await infraRes.json();
          setInfrastructureGeoJson(iData);
        }
      } catch (err) {
        console.error('Failed to load GIS data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

    let L: any;
    import('leaflet').then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      // Fix default marker icon paths in Leaflet with Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Default center: Belagavi District (lat: 15.852, lng: 74.502)
      const map = L.map(mapContainerRef.current, {
        center: [15.852, 74.502],
        zoom: 15,
        zoomControl: false,
      });

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add OpenStreetMap tiles with required attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | LANDSTACK Demo',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click handler on map for measurement tools
      map.on('click', (e: any) => {
        // Measurement distance tool handler
        const { lat, lng } = e.latlng;
        // handled in dedicated effect
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Render Layers whenever activeLayers, data, or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !parcelsGeoJson) return;

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;

      // Clean existing layers
      Object.keys(layersRef.current).forEach((key) => {
        if (layersRef.current[key]) {
          map.removeLayer(layersRef.current[key]);
        }
      });
      layersRef.current = {};

      // A. Restrictions Layer
      if (activeLayers.restrictions && restrictionsGeoJson) {
        const restLayer = L.geoJSON(restrictionsGeoJson, {
          style: (feature: any) => {
            const isFlood = feature.properties?.type === 'Flood Zone';
            const isHeritage = feature.properties?.type === 'Heritage Zone';
            return {
              color: isFlood ? '#ef4444' : isHeritage ? '#eab308' : '#3b82f6',
              weight: 2,
              dashArray: '6, 6',
              fillColor: isFlood ? '#ef4444' : isHeritage ? '#eab308' : '#3b82f6',
              fillOpacity: 0.22,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            layer.bindPopup(`
              <div class="p-3 text-xs font-sans min-w-[200px]">
                <div class="flex items-center gap-1.5 font-bold text-red-600 mb-1">
                  <span class="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                  ${feature.properties?.type || 'Statutory Restriction'}
                </div>
                <div class="font-semibold text-slate-800">${feature.properties?.name}</div>
                <div class="text-[11px] text-slate-500 mt-1">${feature.properties?.regulation}</div>
                <div class="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 p-1 rounded">
                  Status: ${feature.properties?.status}
                </div>
              </div>
            `);
          },
        });
        restLayer.addTo(map);
        layersRef.current.restrictions = restLayer;
      }

      // B. Infrastructure Lines (Roads & Utilities)
      if ((activeLayers.roads || activeLayers.utilities) && infrastructureGeoJson) {
        const infraLayer = L.geoJSON(infrastructureGeoJson, {
          style: (feature: any) => {
            const isUtility = feature.properties?.type === 'Utilities';
            return {
              color: isUtility ? '#9333ea' : '#f97316',
              weight: isUtility ? 3 : 4,
              dashArray: isUtility ? '4, 4' : undefined,
              opacity: 0.85,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            layer.bindPopup(`
              <div class="p-2 text-xs font-sans">
                <span class="font-bold text-slate-900">${feature.properties?.name}</span>
                <p class="text-slate-500 text-[11px]">${feature.properties?.category} (${feature.properties?.status})</p>
              </div>
            `);
          },
        });
        infraLayer.addTo(map);
        layersRef.current.infrastructure = infraLayer;
      }

      // C. Parcels Layer
      if (activeLayers.parcels && parcelsGeoJson) {
        // Filter features by district & land use
        const filteredFeatures = parcelsGeoJson.features.filter((f: any) => {
          if (selectedDistrict !== 'ALL' && f.properties?.district !== selectedDistrict) return false;
          if (selectedLandUseFilter !== 'ALL' && f.properties?.landUse !== selectedLandUseFilter) return false;
          return true;
        });

        const parcelsLayer = L.geoJSON(
          { type: 'FeatureCollection', features: filteredFeatures } as any,
          {
            style: (feature: any) => {
              const props = feature.properties || {};
              const isSelected = selectedParcel?.ulpin === props.ulpin;

              // Color based on active mode: Risk map vs Land Use map
              let fillColor = getLandUseColor(props.landUse);
              if (activeLayers.risk) {
                fillColor = getRiskColor(props.riskLevel);
              }

              // Boundary overlap special styling
              if (props.overlap) {
                fillColor = '#ef4444'; // Red highlight for boundary conflict
              }

              return {
                color: isSelected ? '#1e40af' : (activeLayers.boundaries ? '#334155' : 'transparent'),
                weight: isSelected ? 3.5 : 1.5,
                fillColor,
                fillOpacity: isSelected ? 0.75 : 0.45,
                dashArray: props.overlap ? '3, 3' : undefined,
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              const props = feature.properties || {};

              // Popup layout
              const popupContent = `
                <div class="p-3 text-xs font-sans min-w-[220px]">
                  <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span class="font-extrabold text-blue-900 text-sm tracking-tight">${props.ulpin}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      props.riskLevel === 'CRITICAL' || props.riskLevel === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }">${props.status || 'Verified'}</span>
                  </div>
                  <div class="py-2 space-y-1 text-slate-600 text-[11px]">
                    <div class="flex justify-between">
                      <span class="text-slate-400">Survey No:</span>
                      <span class="font-semibold text-slate-800">${props.surveyNo}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Village:</span>
                      <span class="font-semibold text-slate-800">${props.village} (${props.district})</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Area:</span>
                      <span class="font-semibold text-slate-800">${props.area} Acres</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Land Use:</span>
                      <span class="font-semibold text-slate-800">${props.landUse}</span>
                    </div>
                    ${
                      props.overlap
                        ? `<div class="bg-red-50 text-red-700 p-1.5 rounded text-[10px] font-bold border border-red-200 mt-1">
                             ⚠️ Potential Boundary Conflict Detected (~12.5 sq.m overlap)
                           </div>`
                        : ''
                    }
                    ${
                      props.areaMismatch
                        ? `<div class="bg-amber-50 text-amber-700 p-1.5 rounded text-[10px] font-bold border border-amber-200 mt-1">
                             ⚠️ Potential Area Mismatch: GIS (${props.gisArea} A) vs Recorded (${props.area} A)
                           </div>`
                        : ''
                    }
                  </div>
                  <div class="pt-2 border-t border-slate-100">
                    <a
                      href="/parcels/${props.ulpin}"
                      class="block w-full text-center py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm text-xs transition-colors"
                    >
                      View Parcel 360 &rarr;
                    </a>
                  </div>
                </div>
              `;

              layer.bindPopup(popupContent);

              layer.on({
                click: () => {
                  handleSelectParcel(props, feature);
                },
                mouseover: (e: any) => {
                  const target = e.target;
                  target.setStyle({ fillOpacity: 0.75, weight: 2.5 });
                },
                mouseout: (e: any) => {
                  parcelsLayer.resetStyle(e.target);
                },
              });
            },
          }
        );

        parcelsLayer.addTo(map);
        layersRef.current.parcels = parcelsLayer;

        // If initialUlpin provided or present in URL query, zoom to it immediately
        const targetUlpin = initialUlpin || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ulpin') : null);
        if (targetUlpin) {
          const match = filteredFeatures.find(
            (f: any) => f.properties?.ulpin?.toLowerCase() === targetUlpin.toLowerCase()
          );
          if (match) {
            handleSelectParcel(match.properties, match);
            setSidebarOpen(true);
          }
        }
      }
    });
  }, [
    parcelsGeoJson,
    restrictionsGeoJson,
    infrastructureGeoJson,
    activeLayers,
    selectedDistrict,
    selectedLandUseFilter,
    selectedParcel?.ulpin,
  ]);

  // Handle parcel selection
  const handleSelectParcel = (properties: any, feature: any) => {
    setSelectedParcel(properties);
    if (onParcelSelect) onParcelSelect(properties);

    if (mapInstanceRef.current && feature) {
      import('leaflet').then((L) => {
        const leaflet = L.default || L;
        const geoLayer = leaflet.geoJSON(feature);
        mapInstanceRef.current.fitBounds(geoLayer.getBounds(), {
          padding: [50, 50],
          maxZoom: 18,
          animate: true,
        });
      });
    }
  };

  // 4. Map Search Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !parcelsGeoJson) return;

    const query = searchQuery.trim().toLowerCase();
    const found = parcelsGeoJson.features.find((f: any) => {
      const p = f.properties || {};
      return (
        p.ulpin?.toLowerCase().includes(query) ||
        p.surveyNo?.toLowerCase().includes(query) ||
        p.village?.toLowerCase().includes(query) ||
        p.owner?.toLowerCase().includes(query)
      );
    });

    if (found) {
      handleSelectParcel(found.properties, found);
    } else {
      alert(`No parcel matching "${searchQuery}" found.`);
    }
  };

  // 5. Geolocation ("My Location")
  const handleMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { animate: true });

          import('leaflet').then((L) => {
            const leaflet = L.default || L;
            leaflet
              .circleMarker([latitude, longitude], {
                radius: 8,
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                weight: 2,
              })
              .addTo(mapInstanceRef.current)
              .bindPopup('<b>Your Approximate Location</b><br>(Temporary demo centering)')
              .openPopup();
          });
        }
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location access permission was denied.';
        setGeoError(msg);
      },
      { timeout: 8000 }
    );
  };

  // 6. Measurement Tools
  const toggleMeasurement = (mode: 'DISTANCE' | 'AREA') => {
    if (measurementMode === mode) {
      setMeasurementMode('NONE');
      clearMeasurementArtifacts();
    } else {
      setMeasurementMode(mode);
      clearMeasurementArtifacts();
    }
  };

  const clearMeasurementArtifacts = () => {
    setMeasuredDistance(null);
    setDistancePoints([]);
    if (mapInstanceRef.current) {
      measureMarkersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
      measureMarkersRef.current = [];
      if (measureLineRef.current) {
        mapInstanceRef.current.removeLayer(measureLineRef.current);
        measureLineRef.current = null;
      }
    }
  };

  // Effect for measurement clicks on map
  useEffect(() => {
    if (!mapInstanceRef.current || measurementMode === 'NONE') return;

    const map = mapInstanceRef.current;
    const clickHandler = (e: any) => {
      const { lat, lng } = e.latlng;
      import('leaflet').then((L) => {
        const leaflet = L.default || L;

        if (measurementMode === 'DISTANCE') {
          const newPts: [number, number][] = [...distancePoints, [lat, lng]];
          setDistancePoints(newPts);

          const marker = leaflet
            .circleMarker([lat, lng], { radius: 5, color: '#dc2626', fillOpacity: 0.9 })
            .addTo(map);
          measureMarkersRef.current.push(marker);

          if (newPts.length >= 2) {
            const ptA = newPts[newPts.length - 2];
            const ptB = newPts[newPts.length - 1];
            const result = measureDistance(ptA, ptB);
            setMeasuredDistance({ meters: result.meters, km: result.kilometers });

            if (measureLineRef.current) map.removeLayer(measureLineRef.current);
            measureLineRef.current = leaflet
              .polyline(newPts, { color: '#dc2626', weight: 3, dashArray: '5, 5' })
              .addTo(map);
          }
        }
      });
    };

    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [measurementMode, distancePoints]);

  // Reset Map View
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([15.852, 74.502], 15);
      setSelectedParcel(null);
    }
  };

  // Zoom to District
  const handleZoomDistrict = (district: string) => {
    setSelectedDistrict(district);
    if (!mapInstanceRef.current) return;
    if (district === 'Belagavi') mapInstanceRef.current.flyTo([15.8497, 74.4977], 15);
    else if (district === 'Mysuru') mapInstanceRef.current.flyTo([12.2958, 76.6394], 15);
    else if (district === 'Dharwad') mapInstanceRef.current.flyTo([15.4589, 75.0078], 15);
    else mapInstanceRef.current.flyTo([14.5, 75.5], 7);
  };

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] flex flex-col md:flex-row overflow-hidden bg-slate-900">
      {/* 1. LEFT SIDEBAR: Search, Filters, and Parcel Inspector (~320px) */}
      <div
        className={`${
          sidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-0 hidden md:block md:w-0'
        } transition-all duration-300 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 shadow-xl overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm tracking-wide">GIS Spatial Inspector</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>

        {/* Search Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ULPIN, Survey #, Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Quick District Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2">
            {['Belagavi', 'Mysuru', 'Dharwad', 'ALL'].map((d) => (
              <button
                key={d}
                onClick={() => handleZoomDistrict(d)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  selectedDistrict === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Parcel Detail Card / Default State */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedParcel ? (
            <div className="space-y-4">
              {/* Parcel Header Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                    {selectedParcel.ulpin}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedParcel.riskLevel === 'CRITICAL' || selectedParcel.riskLevel === 'HIGH'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}
                  >
                    {selectedParcel.status || 'Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400">Survey Number</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedParcel.surveyNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Land Use</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getLandUseColor(selectedParcel.landUse) }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedParcel.landUse}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Village & Taluk</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedParcel.village}, {selectedParcel.taluk}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">District</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedParcel.district}</p>
                  </div>
                </div>

                {/* Area Comparison (GIS vs Cadastral) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Recorded Area:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedParcel.area} Acres</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="text-slate-500">GIS Calculated Area:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {selectedParcel.gisArea || selectedParcel.area} Acres
                    </span>
                  </div>
                  {selectedParcel.areaMismatch && (
                    <div className="mt-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-2 rounded text-[11px] font-semibold flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span>Potential Area Mismatch detected. Variance exceeds ±0.20 Acres.</span>
                      </div>
                    </div>
                  )}
                  {selectedParcel.overlap && (
                    <div className="mt-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 p-2 rounded text-[11px] font-semibold flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <span>Potential Boundary Conflict: Overlap of ~12.5 sq.m with contiguous survey polygon.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risk Score Indicator */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">Risk Assessment:</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedParcel.riskScore || 15} / 100 ({selectedParcel.riskLevel || 'LOW'})
                    </p>
                  </div>
                  <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedParcel.riskScore || 15}%`,
                        backgroundColor: getRiskColor(selectedParcel.riskLevel || 'LOW'),
                      }}
                    />
                  </div>
                </div>

                {/* Direct Action Link */}
                <Link
                  href={`/parcels/${selectedParcel.ulpin}`}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                >
                  <span>Open Parcel 360 View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Crosshair className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Select a Cadastral Parcel</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Click on any parcel boundary polygon on the interactive GIS map or search by ULPIN to inspect title,
                measurements, risk factors, and land records.
              </p>
            </div>
          )}

          {/* Map Legend */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {activeLayers.risk ? 'Risk Level Legend' : 'Land Use Legend'}
            </h4>
            {activeLayers.risk ? (
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span>Low (0–25)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-500" />
                  <span>Medium (26–50)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-orange-500" />
                  <span>High (51–75)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500" />
                  <span>Critical (76–100)</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#38bdf8' }} />
                  <span>Residential</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#4ade80' }} />
                  <span>Agricultural</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#fb923c' }} />
                  <span>Commercial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#c084fc' }} />
                  <span>Industrial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#facc15' }} />
                  <span>Institutional</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#94a3b8' }} />
                  <span>Mixed Use</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAP CANVAS (Right / Remaining Screen) */}
      <div className="flex-1 relative h-full">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Loading 110 Cadastral Polygons & Spatial Layers...</p>
            </div>
          </div>
        )}

        {/* Map Container Ref */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Left: Toggle Sidebar Button (Mobile) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Open Inspector</span>
          </button>
        )}

        {/* Floating Top Right: GIS Layer Switcher & Tools */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
          {/* Layer Control Card */}
          <div className="glass-panel dark:glass-panel-dark rounded-xl p-2.5 shadow-xl text-xs space-y-1.5 min-w-[170px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                GIS Layers
              </span>
            </div>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500">
              <span>Parcels</span>
              <input
                type="checkbox"
                checked={activeLayers.parcels}
                onChange={(e) => setActiveLayers({ ...activeLayers, parcels: e.target.checked })}
                className="rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500">
              <span>Restrictions</span>
              <input
                type="checkbox"
                checked={activeLayers.restrictions}
                onChange={(e) => setActiveLayers({ ...activeLayers, restrictions: e.target.checked })}
                className="rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500">
              <span>Roads</span>
              <input
                type="checkbox"
                checked={activeLayers.roads}
                onChange={(e) => setActiveLayers({ ...activeLayers, roads: e.target.checked })}
                className="rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500">
              <span>Utilities</span>
              <input
                type="checkbox"
                checked={activeLayers.utilities}
                onChange={(e) => setActiveLayers({ ...activeLayers, utilities: e.target.checked })}
                className="rounded text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-500 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Risk Map Mode</span>
              <input
                type="checkbox"
                checked={activeLayers.risk}
                onChange={(e) => setActiveLayers({ ...activeLayers, risk: e.target.checked })}
                className="rounded text-amber-600"
              />
            </label>
          </div>

          {/* Quick Floating Action Tools */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs">
            {/* Geolocation Button */}
            <button
              onClick={handleMyLocation}
              title="Locate My Position"
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Crosshair className="w-4 h-4 text-blue-600" />
            </button>

            {/* Distance Measurement */}
            <button
              onClick={() => toggleMeasurement('DISTANCE')}
              title="Measure Distance (Click points)"
              className={`p-2 rounded transition-colors ${
                measurementMode === 'DISTANCE'
                  ? 'bg-red-500 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </button>

            {/* Reset Map View */}
            <button
              onClick={handleResetMap}
              title="Reset Map View"
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Measurement Floating Feedback Box */}
          {measurementMode === 'DISTANCE' && (
            <div className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" />
                Distance Tool Active
              </p>
              <p className="text-[11px] text-red-100">Click any two points on the map to measure.</p>
              {measuredDistance && (
                <div className="bg-red-700/80 p-1.5 rounded text-xs font-mono font-bold">
                  {measuredDistance.meters} meters ({measuredDistance.km} km)
                </div>
              )}
            </div>
          )}

          {geoError && (
            <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold">
              {geoError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
