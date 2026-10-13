import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { 
  Navigation, ArrowLeft, MapPin, Search, Compass, Clock, Info, Layers, 
  Crosshair, X, Building as BuildingIcon, ChevronRight, Bus, Shield, 
  Activity, Zap, Sparkles, CheckCircle2, RotateCcw, Radio, Footprints,
  ArrowRight, CornerUpRight, Play, Pause, ChevronLeft, LocateFixed, RefreshCw,
  Eye, Stethoscope, Coffee, ZoomIn, ZoomOut, Maximize2, Code, Copy, Check,
  Sliders, ArrowUpDown, Flame, AlertCircle, Compass as CompassIcon, SlidersHorizontal
} from 'lucide-react';
import { CENTRAL_BUILDINGS } from '../data/campusData';
import { CAMPUS_OSM_DATASET, OSMGeoJSONFeature } from '../data/osmData';
import { Building, BuildingCategory, LiveGPSUser, CampusRouteResult } from '../types';
import { useTheme, ThemeToggle } from '../context/ThemeContext';

interface GPSViewProps {
  onBackToDashboard: () => void;
  initialSearchQuery?: string;
}

// Campus Center at Central University Miotso, Ghana
const MIOTSO_CAMPUS_CENTER: [number, number] = [5.7602, 0.0534];
const DEFAULT_ZOOM = 16;

// Map Tile Providers (Google Hybrid as default high-res satellite + roads)
const TILE_LAYERS = {
  google_hybrid: {
    name: 'Google Hybrid (Satellite + Roads & Labels)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 22
  },
  google_streets: {
    name: 'Google Roadmap (Roads & Lanes)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 22
  },
  google_satellite: {
    name: 'Google Satellite (Pure Aerial)',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 22
  },
  osm_standard: {
    name: 'OpenStreetMap (Standard Vector)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
};

export const GPSView: React.FC<GPSViewProps> = ({ onBackToDashboard, initialSearchQuery = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('All');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeBuilding, setActiveBuilding] = useState<Building | null>(null);

  // Map Tile Selector
  type TileLayerKey = 'google_hybrid' | 'google_streets' | 'google_satellite' | 'osm_standard';
  const [activeTileKey, setActiveTileKey] = useState<TileLayerKey>('google_hybrid');

  // CLEAN MAP VIEW: Overwrite modified labels away from map interface to keep roads and lanes unobstructed
  const [isCleanRoadView, setIsCleanRoadView] = useState<boolean>(true);

  // Auto-Detected Building & Live Location State
  const [detectedBuilding, setDetectedBuilding] = useState<Building | null>(CENTRAL_BUILDINGS[2]); // Trinity Hall default
  const [distanceToBuilding, setDistanceToBuilding] = useState<number>(0);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [detectionMethod, setDetectionMethod] = useState<'gps' | 'network' | 'simulated'>('gps');
  const [showYouAreHereCard, setShowYouAreHereCard] = useState<boolean>(false);

  // Navigator Start & Destination Lists
  const [startType, setStartType] = useState<'gps' | 'building'>('gps');
  const [startBuildingId, setStartBuildingId] = useState<string>('trinity-hall');
  const [destBuildingId, setDestBuildingId] = useState<string>('clinic-1');
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [routeData, setRouteData] = useState<CampusRouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Neon Red Maps Tracker State
  const [isNeonNavigating, setIsNeonNavigating] = useState(false);
  const [neonProgress, setNeonProgress] = useState<number>(0);
  const [telemetry, setTelemetry] = useState({
    speedKmH: 0,
    headingDeg: 45,
    remainingMeters: 0,
    etaMins: 0,
    currentLane: 'Campus Road Network',
    nextTurnInstruction: 'Proceed straight along designated pathway'
  });

  // OSM & Open-Source Places GeoJSON Inspector & Trigger State
  const [showOsmInspector, setShowOsmInspector] = useState(false);
  const [osmFilter, setOsmFilter] = useState<'all' | 'roads' | 'amenities' | 'buildings'>('all');
  const [isQueryingOverpass, setIsQueryingOverpass] = useState(false);
  const [overpassStats, setOverpassStats] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [targetedFeature, setTargetedFeature] = useState<OSMGeoJSONFeature | null>(null);

  // Live GPS Tracking State
  const [liveLocations, setLiveLocations] = useState<LiveGPSUser[]>([]);
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(true);
  const [userLivePos, setUserLivePos] = useState<{ lat: number; lng: number; x: number; y: number; speedKmH: number; headingDeg: number }>({
    lat: 5.7584,
    lng: 0.0552,
    x: 75,
    y: 70,
    speedKmH: 0,
    headingDeg: 45,
  });
  const [gpsMessage, setGpsMessage] = useState<string | null>(
    '⚡ Neon Red Road Navigator Active • Clean Lane View with Zero Map Clutter'
  );

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const buildingMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const liveVehicleGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineGroupRef = useRef<L.LayerGroup | null>(null);
  const targetFocusGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const neonTrackerMarkerRef = useRef<L.Marker | null>(null);
  const neonAnimationRef = useRef<number | null>(null);

  // Helper: Find closest campus building to GPS coords
  const findClosestBuilding = (lat: number, lng: number): { building: Building; distanceMeters: number } => {
    let closest = CENTRAL_BUILDINGS[0];
    let minDistance = Infinity;

    CENTRAL_BUILDINGS.forEach((b) => {
      const dLat = (b.lat - lat) * 111000;
      const dLng = (b.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
      const distMeters = Math.round(Math.hypot(dLat, dLng));
      if (distMeters < minDistance) {
        minDistance = distMeters;
        closest = b;
      }
    });

    return { building: closest, distanceMeters: minDistance };
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MIOTSO_CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 13,
        maxZoom: 22,
        zoomControl: false,
        attributionControl: true,
      });

      // Layer groups
      const buildingGroup = L.layerGroup().addTo(map);
      const vehicleGroup = L.layerGroup().addTo(map);
      const routeGroup = L.layerGroup().addTo(map);
      const focusGroup = L.layerGroup().addTo(map);

      buildingMarkersGroupRef.current = buildingGroup;
      liveVehicleGroupRef.current = vehicleGroup;
      routePolylineGroupRef.current = routeGroup;
      targetFocusGroupRef.current = focusGroup;

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove old tile layer if switching
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfig = TILE_LAYERS[activeTileKey] || TILE_LAYERS.google_hybrid;
    const subdomainsList = (Array.isArray(tileConfig.subdomains) && tileConfig.subdomains.length > 0)
      ? tileConfig.subdomains
      : ['0', '1', '2', '3'];

    const newTileLayer = L.tileLayer(tileConfig.url, {
      subdomains: subdomainsList,
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom || 22,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [activeTileKey]);

  // 2. Render Building Markers (SEAMLESS CLEAN ROAD VIEW: minimal labels away from roads & lanes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = buildingMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    CENTRAL_BUILDINGS.forEach((b) => {
      const isSelected = activeBuilding?.id === b.id;
      const isStart = isNavigating && ((startType === 'building' && startBuildingId === b.id) || (startType === 'gps' && detectedBuilding?.id === b.id));
      const isDest = isNavigating && destBuildingId === b.id;
      const isCurrentDetected = detectedBuilding?.id === b.id;

      // Color accents
      let dotColor = '#dc2626';
      let iconEmoji = '🏛️';
      if (b.category === 'Medical') { dotColor = '#ef4444'; iconEmoji = '🏥'; }
      else if (b.category === 'Hostels') { dotColor = '#8b5cf6'; iconEmoji = '🛏️'; }
      else if (b.category === 'Amenities') { dotColor = '#f59e0b'; iconEmoji = '☕'; }
      else if (b.category === 'Sports') { dotColor = '#10b981'; iconEmoji = '⚽'; }
      else if (b.category === 'Administrative') { dotColor = '#2563eb'; iconEmoji = '🏢'; }

      // If Clean Road View is enabled, render sleek, unobtrusive circular beacons so roads/lanes stay unobstructed
      let customHtml = '';
      if (isCleanRoadView && !isSelected && !isStart && !isDest) {
        customHtml = `
          <div style="transform: translate(-50%, -50%); cursor: pointer; position: relative;" title="${b.name}">
            <div style="width: 16px; height: 16px; border-radius: 999px; background: ${dotColor}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${dotColor}, 0 2px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 8px;">
              <span style="display:inline-block; transform: scale(0.7);">${iconEmoji}</span>
            </div>
            ${isCurrentDetected ? '<div style="position:absolute; inset:-4px; border-radius:999px; border:1.5px solid #10b981; animation:ping 1.8s infinite;"></div>' : ''}
          </div>
        `;
      } else {
        // Detailed or highlighted marker
        let badgeBg = isDark ? '#1e293b' : '#ffffff';
        let textColor = isDark ? '#f8fafc' : '#0f172a';
        let borderColor = dotColor;

        if (isCurrentDetected) {
          badgeBg = '#059669';
          textColor = '#ffffff';
          borderColor = '#10b981';
        } else if (isStart) {
          badgeBg = '#d97706';
          textColor = '#ffffff';
          borderColor = '#f59e0b';
        } else if (isDest) {
          badgeBg = '#dc2626';
          textColor = '#ffffff';
          borderColor = '#ff003b';
        } else if (isSelected) {
          badgeBg = '#dc2626';
          textColor = '#ffffff';
          borderColor = '#ffffff';
        }

        customHtml = `
          <div style="transform: translate(-50%, -100%); cursor: pointer; text-align: center;">
            ${isStart ? '<div style="background:#d97706; color:#fff; font-size:9px; font-weight:900; padding:1px 6px; border-radius:99px; margin-bottom:2px; display:inline-block; border:1px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🟢 START</div>' : ''}
            ${isDest ? '<div style="background:#ff003b; color:#fff; font-size:9px; font-weight:900; padding:1px 6px; border-radius:99px; margin-bottom:2px; display:inline-block; border:1px solid #fff; box-shadow:0 0 10px #ff003b;">🚩 DESTINATION</div>' : ''}
            ${isCurrentDetected && !isStart && !isDest ? '<div style="background:#059669; color:#fff; font-size:9px; font-weight:900; padding:1px 6px; border-radius:99px; margin-bottom:2px; display:inline-block; border:1px solid #fff;">📍 YOU</div>' : ''}
            
            <div style="background: ${badgeBg}; color: ${textColor}; border: 2px solid ${borderColor}; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); white-space: nowrap;">
              <span>${iconEmoji}</span>
              <span>${b.name.split(' (')[0]}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${borderColor}; margin: 0 auto;"></div>
          </div>
        `;
      }

      const divIcon = L.divIcon({
        className: 'custom-campus-marker',
        html: customHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([b.lat, b.lng], { icon: divIcon });
      marker.on('click', () => {
        setActiveBuilding(b);
        map.setView([b.lat, b.lng], Math.max(map.getZoom(), 17), { animate: true });
      });

      group.addLayer(marker);
    });
  }, [activeBuilding, isNavigating, startType, startBuildingId, destBuildingId, detectedBuilding, isCleanRoadView, isDark]);

  // 3. Render Live User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLivePos.lat, userLivePos.lng]);
    } else {
      const userHtml = `
        <div style="transform: translate(-50%, -50%); position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; border-radius: 999px; background: rgba(16, 185, 129, 0.25); border: 2px solid #10b981; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 999px; background: rgba(220, 38, 38, 0.3); border: 1.5px solid #ef4444;"></div>
          <div style="position: relative; width: 18px; height: 18px; border-radius: 999px; background: linear-gradient(135deg, #dc2626, #f59e0b); border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 9px; font-weight: 900;">
            📍
          </div>
          <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); background: #dc2626; color: #ffffff; font-size: 8px; font-weight: 900; padding: 1px 5px; border-radius: 4px; border: 1px solid #fff; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
            YOU
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'user-live-radar-icon',
        html: userHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const userMarker = L.marker([userLivePos.lat, userLivePos.lng], { icon: userIcon, zIndexOffset: 1000 });
      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    }
  }, [userLivePos]);

  // 4. Render Live Campus Vehicles
  useEffect(() => {
    const group = liveVehicleGroupRef.current;
    if (!group) return;

    group.clearLayers();

    liveLocations.forEach((loc) => {
      if (loc.isSelf) return;

      const isShuttle = loc.role.includes('Shuttle');
      const isAmbulance = loc.role.includes('Emergency') || loc.role.includes('Ambulance');
      const isSecurity = loc.role.includes('Security');

      const bg = isShuttle ? '#2563eb' : isAmbulance ? '#dc2626' : isSecurity ? '#9333ea' : '#059669';
      const iconEmoji = isShuttle ? '🚌' : isAmbulance ? '🚑' : isSecurity ? '🛡️' : '🚶';

      const vehicleHtml = `
        <div style="transform: translate(-50%, -50%); text-align: center; cursor: pointer;">
          <div style="width: 24px; height: 24px; border-radius: 999px; background: ${bg}; border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; margin: 0 auto;">
            ${iconEmoji}
          </div>
          <div style="background: rgba(15, 23, 42, 0.88); color: #f8fafc; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; margin-top: 1px;">
            ${loc.name.split(' (')[0]} • ${loc.speedKmH}km/h
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker',
        html: vehicleHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: vehicleIcon, zIndexOffset: 500 });
      group.addLayer(marker);
    });
  }, [liveLocations]);

  // 5. Fetch Route via Open Outer API (OSRM + OpenRouter)
  const fetchCampusRoute = async () => {
    let startLat = userLivePos.lat;
    let startLng = userLivePos.lng;
    let startName = 'My Current GPS Location';
    let startId = 'user-gps';

    if (startType === 'building') {
      const startB = CENTRAL_BUILDINGS.find(b => b.id === startBuildingId);
      if (startB) {
        startLat = startB.lat;
        startLng = startB.lng;
        startName = startB.name;
        startId = startB.id;
      }
    }

    const destB = CENTRAL_BUILDINGS.find(b => b.id === destBuildingId);
    if (!destB) return;

    setIsLoadingRoute(true);
    try {
      const res = await fetch('/api/gps/route-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startId,
          destId: destB.id,
          startName,
          destName: destB.name,
          startLat,
          startLng,
          destLat: destB.lat,
          destLng: destB.lng,
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from route-guide API');
      }
      const data = await res.json();
      if (data.success) {
        setRouteData(data);
        setActiveStepIndex(0);
        setGpsMessage(
          `🛣️ Neon Red Route Active via ${data.primaryRoad}: ${data.distanceMeters}m (${data.walkMinutes} min walk)`
        );
        setTelemetry({
          speedKmH: 0,
          headingDeg: 45,
          remainingMeters: data.distanceMeters,
          etaMins: data.walkMinutes,
          currentLane: data.primaryRoad,
          nextTurnInstruction: data.steps[0] || 'Follow designated pathway'
        });
      }
    } catch (err) {
      console.error('Failed to get route guide', err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (isNavigating) {
      fetchCampusRoute();
    } else {
      setRouteData(null);
      setIsNeonNavigating(false);
      if (neonAnimationRef.current) cancelAnimationFrame(neonAnimationRef.current);
      if (routePolylineGroupRef.current) {
        routePolylineGroupRef.current.clearLayers();
      }
      if (neonTrackerMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(neonTrackerMarkerRef.current);
        neonTrackerMarkerRef.current = null;
      }
    }
  }, [isNavigating, startType, startBuildingId, destBuildingId]);

  // 6. Draw NEON RED ROUTE POLYLINE on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = routePolylineGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!isNavigating || !routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
      return;
    }

    const latLngs: L.LatLngExpression[] = routeData.coordinates.map(c => [c[0], c[1]]);

    // Outer Intense Neon Glow Polyline
    const neonGlowLine = L.polyline(latLngs, {
      color: '#ff003b',
      weight: 10,
      opacity: 0.6,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'neon-glow-polyline'
    });

    // Core Vivid Neon Red Laser Line with white dash pulse
    const neonCoreLine = L.polyline(latLngs, {
      color: '#ff1744',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });

    // Animated dashed laser pulse center
    const laserPulseLine = L.polyline(latLngs, {
      color: '#ffffff',
      weight: 1.8,
      opacity: 0.9,
      dashArray: '10, 10',
      lineCap: 'round',
      lineJoin: 'round',
      className: 'neon-core-laser'
    });

    group.addLayer(neonGlowLine);
    group.addLayer(neonCoreLine);
    group.addLayer(laserPulseLine);

    // Waypoint step markers along road turns
    routeData.coordinates.forEach((coord, idx) => {
      if (idx === 0 || idx === routeData.coordinates.length - 1) return;

      const stepIconHtml = `
        <div style="transform: translate(-50%, -50%); width: 18px; height: 18px; border-radius: 999px; background: #0f172a; color: #ff1744; border: 2px solid #ff003b; box-shadow: 0 0 8px #ff003b; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">
          ${idx}
        </div>
      `;

      const stepMarker = L.marker([coord[0], coord[1]], {
        icon: L.divIcon({
          className: 'step-waypoint-icon',
          html: stepIconHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      });

      group.addLayer(stepMarker);
    });

    // Fit view to route nicely
    map.fitBounds(neonCoreLine.getBounds(), { padding: [60, 60], maxZoom: 18 });
  }, [routeData, isNavigating]);

  // 7. NEON RED INTELLIGENT MAPS TRACKER ANIMATION (Follows exact road network)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isNeonNavigating || !routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
      if (neonAnimationRef.current) cancelAnimationFrame(neonAnimationRef.current);
      if (neonTrackerMarkerRef.current) {
        map.removeLayer(neonTrackerMarkerRef.current);
        neonTrackerMarkerRef.current = null;
      }
      return;
    }

    const coords = routeData.coordinates;
    let segIdx = 0;
    let segProgress = 0;
    const totalDist = routeData.distanceMeters;

    // Create Neon Red Tracker Marker if not present
    if (!neonTrackerMarkerRef.current) {
      const neonHtml = `
        <div style="transform: translate(-50%, -50%); position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 999px; background: rgba(255, 0, 59, 0.35); border: 2px solid #ff003b; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 999px; background: rgba(255, 23, 68, 0.45); box-shadow: 0 0 16px #ff003b;"></div>
          <div style="position: relative; width: 16px; height: 16px; border-radius: 999px; background: #ff003b; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #ff003b; display: flex; align-items: center; justify-content: center;">
            <div style="width: 4px; height: 4px; border-radius: 999px; background: #ffffff;"></div>
          </div>
          <div style="position: absolute; top: -20px; background: #ff003b; color: #fff; font-size: 8px; font-weight: 900; padding: 1px 6px; border-radius: 99px; border: 1px solid #fff; white-space: nowrap; box-shadow: 0 0 8px rgba(255,0,59,0.8);">
            ⚡ NEON TRACKER
          </div>
        </div>
      `;

      const neonIcon = L.divIcon({
        className: 'neon-road-tracker-icon',
        html: neonHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const trackerMarker = L.marker([coords[0][0], coords[0][1]], {
        icon: neonIcon,
        zIndexOffset: 1200
      }).addTo(map);

      neonTrackerMarkerRef.current = trackerMarker;
    }

    const animateRoadTracker = () => {
      segProgress += 0.007; // Smooth speed
      if (segProgress >= 1) {
        segProgress = 0;
        segIdx = (segIdx + 1) % (coords.length - 1);
      }

      const p1 = coords[segIdx];
      const p2 = coords[segIdx + 1];

      const currLat = p1[0] + (p2[0] - p1[0]) * segProgress;
      const currLng = p1[1] + (p2[1] - p1[1]) * segProgress;

      const dLat = p2[0] - p1[0];
      const dLng = p2[1] - p1[1];
      const heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

      // Update marker position
      if (neonTrackerMarkerRef.current) {
        neonTrackerMarkerRef.current.setLatLng([currLat, currLng]);
      }

      // Update user live pos
      updateUserPosition(currLat, currLng, 5.2, heading);

      // Compute remaining distance & steps
      const progressFraction = (segIdx + segProgress) / (coords.length - 1);
      const remaining = Math.max(0, Math.round(totalDist * (1 - progressFraction)));
      const eta = Math.max(1, Math.round(remaining / 75));

      const stepIdx = Math.min(
        routeData.steps.length - 1,
        Math.floor(progressFraction * routeData.steps.length)
      );
      setActiveStepIndex(stepIdx);

      setTelemetry({
        speedKmH: 5.2,
        headingDeg: heading,
        remainingMeters: remaining,
        etaMins: eta,
        currentLane: routeData.primaryRoad,
        nextTurnInstruction: routeData.steps[stepIdx] || 'Arriving at destination'
      });

      neonAnimationRef.current = requestAnimationFrame(animateRoadTracker);
    };

    neonAnimationRef.current = requestAnimationFrame(animateRoadTracker);

    return () => {
      if (neonAnimationRef.current) cancelAnimationFrame(neonAnimationRef.current);
    };
  }, [isNeonNavigating, routeData]);

  // 8. Auto-detect Location & Campus Building
  const runAutoBuildingDetection = (forceCoords?: { lat: number; lng: number; name?: string }) => {
    setIsAutoDetecting(true);

    if (forceCoords) {
      const { building, distanceMeters } = findClosestBuilding(forceCoords.lat, forceCoords.lng);
      setDetectedBuilding(building);
      setDistanceToBuilding(distanceMeters);
      updateUserPosition(forceCoords.lat, forceCoords.lng, 0, 45);
      setDetectionMethod('simulated');
      setIsAutoDetecting(false);
      setGpsMessage(`📍 Campus location locked: ${building.name} (${distanceMeters}m away)`);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const rawLat = pos.coords.latitude;
          const rawLng = pos.coords.longitude;

          const isNearMiotso = Math.abs(rawLat - 5.7602) < 0.08 && Math.abs(rawLng - 0.0534) < 0.08;

          let targetLat = 5.7584;
          let targetLng = 0.0552;

          if (isNearMiotso) {
            targetLat = rawLat;
            targetLng = rawLng;
            setDetectionMethod('gps');
          } else {
            targetLat = 5.7584;
            targetLng = 0.0552;
            setDetectionMethod('network');
          }

          const { building, distanceMeters } = findClosestBuilding(targetLat, targetLng);
          setDetectedBuilding(building);
          setDistanceToBuilding(distanceMeters);
          updateUserPosition(targetLat, targetLng, 0, 45);
          setIsAutoDetecting(false);
          setGpsMessage(`📍 Location detected: ${distanceMeters <= 20 ? 'Inside' : `${distanceMeters}m from`} ${building.name}`);
        },
        () => {
          const fallbackLat = 5.7584;
          const fallbackLng = 0.0552;
          const { building, distanceMeters } = findClosestBuilding(fallbackLat, fallbackLng);
          setDetectedBuilding(building);
          setDistanceToBuilding(distanceMeters);
          updateUserPosition(fallbackLat, fallbackLng, 0, 45);
          setDetectionMethod('network');
          setIsAutoDetecting(false);
          setGpsMessage(`📍 Campus network locked: ${building.name} (${building.code})`);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const fallbackLat = 5.7584;
      const fallbackLng = 0.0552;
      const { building, distanceMeters } = findClosestBuilding(fallbackLat, fallbackLng);
      setDetectedBuilding(building);
      setDistanceToBuilding(distanceMeters);
      updateUserPosition(fallbackLat, fallbackLng, 0, 45);
      setIsAutoDetecting(false);
    }
  };

  useEffect(() => {
    runAutoBuildingDetection();
  }, []);

  // Update user position
  const updateUserPosition = async (lat: number, lng: number, speed = 0, heading = 45) => {
    const x = Math.max(5, Math.min(95, 50 + (lng - 0.0534) * 10000));
    const y = Math.max(5, Math.min(95, 50 - (lat - 5.7602) * 10000));

    setUserLivePos({ lat, lng, x, y, speedKmH: speed, headingDeg: heading });

    try {
      await fetch('/api/gps/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'user-self',
          name: 'Your Live Position',
          role: 'Student (Live GPS)',
          lat,
          lng,
          x,
          y,
          speedKmH: speed,
          headingDeg: heading,
        }),
      });
    } catch (e) {
      // non-fatal
    }
  };

  // Live vehicles poll
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/gps/locations');
        if (!res.ok) return;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        const data = await res.json();
        if (data.locations) setLiveLocations(data.locations);
      } catch (err) {
        // non-fatal
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => clearInterval(interval);
  }, []);

  // 9. TRIGGER MAP FOCUS ON TARGETED ROAD / LANE / PLACE (From OSM JSON Code Inspector)
  const triggerMapFocusOnFeature = (feature: OSMGeoJSONFeature) => {
    const map = mapInstanceRef.current;
    const focusGroup = targetFocusGroupRef.current;
    if (!map || !focusGroup) return;

    focusGroup.clearLayers();
    setTargetedFeature(feature);

    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates as number[][];
      const latLngs: L.LatLngExpression[] = coords.map(c => [c[1], c[0]]); // [lat, lng]

      // Highlight target road with pulsating neon beacon
      const neonRoadHighlight = L.polyline(latLngs, {
        color: '#ff003b',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'neon-glow-polyline'
      });

      focusGroup.addLayer(neonRoadHighlight);

      // Fit map to road
      map.fitBounds(neonRoadHighlight.getBounds(), { padding: [50, 50], maxZoom: 19 });
      setGpsMessage(`🎯 Targeted Road Focus: "${feature.properties.name}" (${feature.properties.highway || 'road'} • ${feature.properties.lengthMeters || ''}m)`);
    } else {
      // Point Feature
      const coord = feature.geometry.coordinates as number[];
      const lat = coord[1];
      const lng = coord[0];

      const focusPulseIcon = L.divIcon({
        className: 'focus-target-beacon',
        html: `
          <div style="transform: translate(-50%, -50%); position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 999px; background: rgba(255, 0, 59, 0.4); border: 2px solid #ff003b; animation: ping 1.2s infinite;"></div>
            <div style="width: 20px; height: 20px; border-radius: 999px; background: #ff003b; border: 2px solid #fff; box-shadow: 0 0 12px #ff003b; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;">🎯</div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const focusMarker = L.marker([lat, lng], { icon: focusPulseIcon, zIndexOffset: 2000 });
      focusGroup.addLayer(focusMarker);

      map.flyTo([lat, lng], 18, { duration: 1.2 });
      setGpsMessage(`🎯 Targeted Place Focus: "${feature.properties.name}" (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
    }
  };

  // Swap Start and Destination
  const handleSwapRoute = () => {
    if (startType === 'gps') {
      setStartType('building');
      setStartBuildingId(destBuildingId);
      setDestBuildingId(detectedBuilding?.id || 'clinic-1');
    } else {
      const temp = startBuildingId;
      setStartBuildingId(destBuildingId);
      setDestBuildingId(temp);
    }
  };

  // Filtered OSM GeoJSON features
  const filteredOsmFeatures = useMemo(() => {
    if (osmFilter === 'all') return CAMPUS_OSM_DATASET.features;
    if (osmFilter === 'roads') return CAMPUS_OSM_DATASET.features.filter(f => f.properties.category === 'road');
    if (osmFilter === 'amenities') return CAMPUS_OSM_DATASET.features.filter(f => f.properties.category === 'amenity');
    return CAMPUS_OSM_DATASET.features.filter(f => f.properties.category === 'building' || f.properties.category === 'gate');
  }, [osmFilter]);

  // Deep Search filter
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const filteredBuildings = CENTRAL_BUILDINGS.filter((b) => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    if (!trimmedSearch) return matchesCategory;

    return (
      matchesCategory &&
      (b.name.toLowerCase().includes(trimmedSearch) ||
        b.code.toLowerCase().includes(trimmedSearch) ||
        b.category.toLowerCase().includes(trimmedSearch) ||
        b.facilities.some(fac => fac.toLowerCase().includes(trimmedSearch)))
    );
  });

  const categories: BuildingCategory[] = ['All', 'Academic', 'Hostels', 'Medical', 'Administrative', 'Amenities', 'Sports'];
  const startBuilding = CENTRAL_BUILDINGS.find(b => b.id === startBuildingId);
  const destBuilding = CENTRAL_BUILDINGS.find(b => b.id === destBuildingId);

  return (
    <div className={`relative min-h-screen z-10 flex flex-col px-4 py-6 max-w-7xl mx-auto transition-colors duration-300 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Top Header Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 mb-5 p-4 rounded-3xl backdrop-blur-md shadow-lg border ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-black/40 text-white' 
          : 'bg-white/95 border-red-200/80 shadow-red-100/50 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            id="back-to-dashboard-from-gps"
            className={`p-2.5 rounded-full transition-colors cursor-pointer border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-[#CE1126]'
            }`}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <Navigation className="w-6 h-6 text-[#CE1126]" />
              Miotso Campus Live Navigator
            </h1>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Google Satellite & Roads • Neon Red Road Tracker • Real OpenStreetMap Routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* CLEAR ROAD VIEW TOGGLE (Seamlessly clears labels from map interface) */}
          <button
            onClick={() => {
              setIsCleanRoadView(!isCleanRoadView);
              setGpsMessage(
                !isCleanRoadView 
                  ? '🛡️ Clear Road View Active: Labels docked away, asphalt & lanes 100% visible' 
                  : '🏷️ Full Labels Active: Landmark badges visible on map'
              );
            }}
            id="toggle-clean-road-view-btn"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer border ${
              isCleanRoadView
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Toggle Clean Road View: Clears bulky labels away to keep road lanes unobstructed"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isCleanRoadView ? 'Clear Road View' : 'Show All Labels'}</span>
          </button>

          {/* OSM & PLACES JSON CODE TRIGGER BUTTON */}
          <button
            onClick={() => setShowOsmInspector(true)}
            id="open-osm-json-inspector-btn"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer border ${
              showOsmInspector
                ? 'bg-[#CE1126] text-white border-[#CE1126]'
                : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
            title="Render JSON code of OSM and open-source places API with map focus trigger"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>OSM Places JSON</span>
          </button>

          {/* Map Tile Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => {
                setActiveTileKey('google_hybrid');
                setGpsMessage('📍 Google Hybrid Active: High-Res Satellite + Roads + Place Labels');
              }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeTileKey === 'google_hybrid'
                  ? 'bg-[#CE1126] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#CE1126]'
              }`}
              title="Google Hybrid (Satellite + Roads & Labels)"
            >
              🛰️ Hybrid
            </button>
            <button
              onClick={() => {
                setActiveTileKey('google_streets');
                setGpsMessage('📍 Google Roads Active: Clear Streets, Campus Pathways & Lanes');
              }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeTileKey === 'google_streets'
                  ? 'bg-[#CE1126] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#CE1126]'
              }`}
              title="Google Roads (Clear Streets & Lanes)"
            >
              🛣️ Roads
            </button>
            <button
              onClick={() => {
                setActiveTileKey('osm_standard');
                setGpsMessage('📍 OpenStreetMap Active: Standard Open-Source Vector Map');
              }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                activeTileKey === 'osm_standard'
                  ? 'bg-[#CE1126] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#CE1126]'
              }`}
              title="OpenStreetMap Standard Vector"
            >
              🗺️ OSM
            </button>
          </div>

          {/* Center on You */}
          <button
            onClick={() => {
              if (mapInstanceRef.current && userLivePos) {
                mapInstanceRef.current.setView([userLivePos.lat, userLivePos.lng], 17, { animate: true });
                setGpsMessage(`📍 Map centered on 'You are here'`);
              }
            }}
            id="locate-me-button"
            className="flex items-center gap-1.5 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs px-3.5 py-2 rounded-full shadow-md shadow-red-500/20 transition-all cursor-pointer"
            title="Center view on your GPS location"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Center You</span>
          </button>
        </div>
      </div>

      {/* GPS Status & Alert Toast */}
      <AnimatePresence>
        {gpsMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-2xl flex items-center justify-between text-xs font-bold border ${
              isDark 
                ? 'bg-red-950/70 border-red-900/80 text-red-200' 
                : 'bg-red-50 border-red-200 text-[#CE1126]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CE1126] shrink-0" />
              <span>{gpsMessage}</span>
            </div>
            <button onClick={() => setGpsMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left Navigation Control Panel & Right Leaflet Map Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT PANEL */}
        <div className="space-y-5">
          
          {/* 🧭 TURN-BY-TURN ROAD NAVIGATOR WITH START & DESTINATION LISTS */}
          <div className={`p-5 rounded-3xl shadow-xl border ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 shadow-black/50' 
              : 'bg-white border-red-100 shadow-red-100/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base font-black flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <Compass className="w-5 h-5 text-[#CE1126]" />
                Roads & Lanes Campus Navigator
              </h2>
              <button
                onClick={handleSwapRoute}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Swap Start and Destination"
              >
                <ArrowUpDown className="w-4 h-4 text-[#CE1126]" />
              </button>
            </div>

            {/* Quick Preset Journey Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              <button
                onClick={() => {
                  setStartType('gps');
                  setDestBuildingId('clinic-1');
                  setIsNavigating(true);
                }}
                className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-[#CE1126] dark:text-red-300 text-[10px] font-extrabold whitespace-nowrap cursor-pointer hover:bg-red-200"
              >
                📍 GPS → 🏥 Clinic
              </button>
              <button
                onClick={() => {
                  setStartType('gps');
                  setDestBuildingId('food-court');
                  setIsNavigating(true);
                }}
                className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold whitespace-nowrap cursor-pointer hover:bg-amber-200"
              >
                📍 GPS → ☕ Food Court
              </button>
              <button
                onClick={() => {
                  setStartType('building');
                  setStartBuildingId('main-gate');
                  setDestBuildingId('library-main');
                  setIsNavigating(true);
                }}
                className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold whitespace-nowrap cursor-pointer hover:bg-blue-200"
              >
                🚪 Gate → 📚 Library
              </button>
            </div>

            {/* START LOCATION SELECTOR LIST */}
            <div className="space-y-3 mb-4">
              <div>
                <label className={`block text-xs font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Start Location</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStartType('gps')}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full cursor-pointer ${
                        startType === 'gps'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Use My GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartType('building')}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full cursor-pointer ${
                        startType === 'building'
                          ? 'bg-[#CE1126] text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Pick Landmark
                    </button>
                  </div>
                </label>

                {startType === 'gps' ? (
                  <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/80 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        📍
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          My Live GPS Location
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Near {detectedBuilding?.name.split(' (')[0] || 'Miotso'} ({distanceToBuilding}m away)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => runAutoBuildingDetection()}
                      className="text-xs text-slate-400 hover:text-emerald-500 cursor-pointer"
                      title="Refresh GPS"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={startBuildingId}
                    onChange={(e) => setStartBuildingId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors focus:outline-none focus:border-[#CE1126] border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  >
                    <optgroup label="Campus Gates & Hubs">
                      <option value="main-gate">🚪 Central University Main Gate (Accra-Aflao Rd)</option>
                      <option value="senate-1">🏢 Senate & Administration Block</option>
                      <option value="sports-complex">⚽ Sports Complex & Stadium</option>
                    </optgroup>
                    <optgroup label="Residential Hostels">
                      <option value="trinity-hall">🛏️ Trinity Hall (Male Hostel)</option>
                      <option value="destiny-hall">🛏️ Destiny Hall (Female Hostel)</option>
                    </optgroup>
                    <optgroup label="Academic & Faculties">
                      <option value="business-school">🎓 Central Business School (CBS)</option>
                      <option value="law-faculty">⚖️ Faculty of Law & Great Hall</option>
                      <option value="engineering-block">📐 School of Architecture & Engineering</option>
                      <option value="library-main">📚 Central University Main Library</option>
                    </optgroup>
                    <optgroup label="Medical & Amenities">
                      <option value="clinic-1">🏥 Central University Clinic</option>
                      <option value="food-court">🍽️ Miotso Cafeteria & Food Court</option>
                    </optgroup>
                  </select>
                )}
              </div>

              {/* DESTINATION LOCATION SELECTOR LIST */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Destination Location
                </label>
                <select
                  value={destBuildingId}
                  onChange={(e) => setDestBuildingId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors focus:outline-none focus:border-[#CE1126] border ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                >
                  <optgroup label="Medical & Urgent Care">
                    <option value="clinic-1">🏥 Central University Clinic (Emergency Triage)</option>
                  </optgroup>
                  <optgroup label="Dining & Amenities">
                    <option value="food-court">🍽️ Miotso Cafeteria & Food Court</option>
                  </optgroup>
                  <optgroup label="Academic & Faculties">
                    <option value="library-main">📚 Central University Main Library</option>
                    <option value="business-school">🎓 Central Business School (CBS)</option>
                    <option value="law-faculty">⚖️ Faculty of Law & Great Hall</option>
                    <option value="engineering-block">📐 School of Architecture & Engineering</option>
                    <option value="senate-1">🏢 Senate & Administration Block</option>
                  </optgroup>
                  <optgroup label="Hostels & Residences">
                    <option value="trinity-hall">🛏️ Trinity Hall (Male Hostel)</option>
                    <option value="destiny-hall">🛏️ Destiny Hall (Female Hostel)</option>
                  </optgroup>
                  <optgroup label="Gates & Transit">
                    <option value="main-gate">🚪 Main Campus Gate (Accra-Aflao Rd)</option>
                    <option value="sports-complex">⚽ Sports Complex & Stadium</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS: Find Route & Start Neon Navigation */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsNavigating(!isNavigating);
                  if (!isLiveGpsActive && !isNavigating) setIsLiveGpsActive(true);
                }}
                id="toggle-navigation-button"
                className={`w-full py-3 font-extrabold text-xs rounded-full shadow-md transition-all cursor-pointer ${
                  isNavigating
                    ? isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-[#CE1126] hover:bg-[#A00D1D] text-white shadow-red-500/20'
                }`}
              >
                {isLoadingRoute ? 'Calculating Road & Lane Path...' : isNavigating ? 'Clear Active Route' : 'Find Best Route & Directions'}
              </button>

              {isNavigating && routeData && (
                <button
                  onClick={() => setIsNeonNavigating(!isNeonNavigating)}
                  id="start-neon-tracker-button"
                  className={`w-full py-2.5 font-black text-xs rounded-full border transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    isNeonNavigating
                      ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                      : 'bg-gradient-to-r from-[#ff003b] to-[#dc2626] text-white border-red-500 shadow-red-600/30'
                  }`}
                >
                  <Flame className="w-4 h-4 text-white" />
                  <span>{isNeonNavigating ? 'Pause Neon Tracker Navigation' : '⚡ Start Neon Red Maps Tracker'}</span>
                </button>
              )}
            </div>

            {/* Calculated Route Details & Live Guidance */}
            {isNavigating && routeData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mt-4 pt-4 border-t space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
              >
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="block text-[10px] font-bold text-slate-400">Road Distance</span>
                    <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {telemetry.remainingMeters > 0 ? telemetry.remainingMeters : routeData.distanceMeters} m
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="block text-[10px] font-bold text-slate-400">Est. Walk Time</span>
                    <span className="text-base font-black text-[#CE1126]">{telemetry.etaMins || routeData.walkMinutes} min</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border text-[11px] ${
                  isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="font-black text-amber-500 mb-0.5">Primary Campus Road:</div>
                  <div className="font-bold">{routeData.primaryRoad}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{routeData.roadSurface}</div>
                </div>

                {/* Turn Guidance */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#CE1126]" />
                      Turn-by-Turn Road Guidance:
                    </span>
                    <span className="text-[9px] font-black bg-red-500/20 text-[#ff003b] px-2 py-0.5 rounded-full border border-red-500/30">
                      Neon OSRM Router
                    </span>
                  </h4>
                  <ol className={`text-xs space-y-1.5 list-decimal list-inside p-3 rounded-2xl border ${
                    isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {routeData.steps.map((step, idx) => (
                      <li key={idx} className={`leading-snug ${activeStepIndex === idx ? 'font-bold text-[#ff003b] dark:text-red-400' : ''}`}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            )}
          </div>

          {/* CAMPUS DIRECTORY SEARCH */}
          <div className={`p-5 rounded-3xl shadow-xl border space-y-3 ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 shadow-black/50' 
              : 'bg-white border-red-100 shadow-red-100/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                Campus Directory
              </span>
              {trimmedSearch && (
                <span className="text-[10px] font-bold bg-red-100 text-[#CE1126] px-2 py-0.5 rounded-full">
                  {filteredBuildings.length} found
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#CE1126]" />
              <input
                type="text"
                placeholder="Search Senate, Clinic, Library, Trinity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-colors focus:outline-none focus:border-[#CE1126] border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                      : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-[#CE1126]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {filteredBuildings.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No campus building matching "{searchQuery}"
                </div>
              ) : (
                filteredBuildings.map((b) => {
                  const isCurrent = detectedBuilding?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBuilding(b);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([b.lat, b.lng], 17, { animate: true });
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group border ${
                        isCurrent
                          ? isDark 
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : isDark
                            ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold group-hover:text-[#CE1126]">{b.name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{b.code} • {b.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#CE1126] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LEAFLET MAP CANVAS */}
        <div className={`lg:col-span-2 p-4 rounded-3xl shadow-xl border relative min-h-[600px] flex flex-col justify-between ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-black/50' 
            : 'bg-white border-red-100 shadow-red-100/50'
        }`}>
          {/* Top Bar above Map */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Layers className="w-4 h-4 text-[#CE1126]" />
                Interactive Campus Map (Miotso)
              </span>

              {isCleanRoadView && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  🛡️ Clear Road View Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-100 dark:bg-red-950/80 text-[#ff003b] dark:text-red-300 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {liveLocations.length} Live Signals
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live GPS Active
              </span>
            </div>
          </div>

          {/* Leaflet Map Canvas Container */}
          <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner min-h-[500px]">
            <div 
              ref={mapContainerRef} 
              id="leaflet-campus-map" 
              className="absolute inset-0 w-full h-full z-0" 
            />

            {/* Floating Zoom & Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-bold text-base"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-bold text-base"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  mapInstanceRef.current?.setView(MIOTSO_CAMPUS_CENTER, DEFAULT_ZOOM, { animate: true });
                }}
                className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 text-[#CE1126] shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-bold text-xs"
                title="Reset Campus View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Floating Live Neon Navigation HUD when route is active */}
            {isNavigating && routeData && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-16 right-4 z-20 bg-slate-900/95 border border-[#ff003b]/60 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff003b] animate-ping" />
                    <span className="text-[11px] font-extrabold text-[#ff1744] flex items-center gap-1 font-mono">
                      ⚡ NEON TRACKER: {telemetry.currentLane}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-red-500/20 text-red-300 font-extrabold px-2.5 py-0.5 rounded-full border border-red-500/30 font-mono">
                      🚶 {telemetry.remainingMeters}m remaining • ~{telemetry.etaMins}m ETA
                    </span>
                    <button
                      onClick={() => setIsNavigating(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Close Directions HUD"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeStepIndex === 0}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-white cursor-pointer transition-colors"
                    title="Previous Step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 text-center px-2">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                      Step {activeStepIndex + 1} of {routeData.steps.length} • {routeData.primaryRoad}
                    </div>
                    <div className="text-xs font-bold text-slate-100 leading-snug">
                      {routeData.steps[activeStepIndex]}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveStepIndex((prev) => Math.min(routeData.steps.length - 1, prev + 1))}
                    disabled={activeStepIndex === routeData.steps.length - 1}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-white cursor-pointer transition-colors"
                    title="Next Step"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Telemetry Bar at bottom of map */}
          {userLivePos && (
            <div className={`mt-3 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-slate-900 border-slate-800 text-white shadow-md'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-amber-300">
                  📍 Spot: <strong className="text-white">{detectedBuilding?.name || 'Miotso Campus'}</strong>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({distanceToBuilding <= 20 ? 'Inside' : `~${distanceToBuilding}m away`})
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
                <span>Speed: <strong className="text-white">{telemetry.speedKmH || userLivePos.speedKmH} km/h</strong></span>
                <span>Heading: <strong className="text-white">{telemetry.headingDeg || userLivePos.headingDeg}°</strong></span>
                <span>GPS: <strong className="text-white">{userLivePos.lat.toFixed(5)}°N, {userLivePos.lng.toFixed(5)}°E</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 OSM & OPEN-SOURCE PLACES GEOJSON CODE INSPECTOR & MAP FOCUS MODAL */}
      <AnimatePresence>
        {showOsmInspector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-4xl max-h-[88vh] rounded-3xl p-6 shadow-2xl relative border flex flex-col ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/90' 
                  : 'bg-white border-red-100 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      OpenStreetMap (OSM) & Places GeoJSON Code Engine
                    </h3>
                    <p className="text-xs text-slate-400">
                      Targeted road labels & lane features with interactive Leaflet map focus triggers
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(CAMPUS_OSM_DATASET, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                    title="Copy GeoJSON"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={() => setShowOsmInspector(false)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Overpass Live Query Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-slate-700/50 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOsmFilter('all')}
                    className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      osmFilter === 'all' ? 'bg-[#CE1126] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Features ({CAMPUS_OSM_DATASET.features.length})
                  </button>
                  <button
                    onClick={() => setOsmFilter('roads')}
                    className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      osmFilter === 'roads' ? 'bg-[#CE1126] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🛣️ Roads & Lanes (8)
                  </button>
                  <button
                    onClick={() => setOsmFilter('amenities')}
                    className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      osmFilter === 'amenities' ? 'bg-[#CE1126] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍽️ Food & Amenities (4)
                  </button>
                  <button
                    onClick={() => setOsmFilter('buildings')}
                    className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      osmFilter === 'buildings' ? 'bg-[#CE1126] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🏛️ Campus Facilities (7)
                  </button>
                </div>

                {/* Overpass Live API query */}
                <button
                  onClick={async () => {
                    setIsQueryingOverpass(true);
                    try {
                      const res = await fetch('/api/gps/osm-features?liveOverpass=true');
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      const ct = res.headers.get('content-type') || '';
                      if (!ct.includes('application/json')) throw new Error('Expected JSON');
                      const data = await res.json();
                      if (data.success) {
                        setOverpassStats(`Live Overpass elements queried successfully from OSM servers!`);
                      }
                    } catch (e) {
                      setOverpassStats('Overpass query routed via cached dataset.');
                    } finally {
                      setIsQueryingOverpass(false);
                    }
                  }}
                  disabled={isQueryingOverpass}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold cursor-pointer hover:bg-emerald-500/30"
                >
                  <RefreshCw className={`w-3 h-3 ${isQueryingOverpass ? 'animate-spin' : ''}`} />
                  <span>{isQueryingOverpass ? 'Querying Overpass...' : 'Query Live Overpass API'}</span>
                </button>
              </div>

              {overpassStats && (
                <div className="py-2 text-[11px] font-bold text-emerald-400">
                  {overpassStats}
                </div>
              )}

              {/* JSON Features Code List with Direct Map Focus Triggers */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-2 scrollbar-thin font-mono text-xs">
                {filteredOsmFeatures.map((f) => {
                  const isRoad = f.geometry.type === 'LineString';
                  return (
                    <div
                      key={f.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isRoad ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isRoad ? '🛣️ WAY / ROAD' : '📍 NODE / PLACE'}
                          </span>
                          <span className="font-bold text-sm text-white font-sans">
                            {f.properties.name}
                          </span>
                        </div>

                        {/* 🎯 TRIGGER MAP FOCUS BUTTON */}
                        <button
                          onClick={() => {
                            triggerMapFocusOnFeature(f);
                            setShowOsmInspector(false);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff003b] hover:bg-[#d00030] text-white font-sans text-xs font-black transition-all cursor-pointer shadow-md shadow-red-600/30"
                          title="Trigger camera to zoom & highlight this targeted road or place"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>🎯 Trigger Map Focus</span>
                        </button>
                      </div>

                      {/* Syntax Highlighted JSON Code Preview */}
                      <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-300 text-[11px] overflow-x-auto border border-slate-800">
{JSON.stringify(f, null, 2)}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BUILDING DETAILS DRAWER / MODAL */}
      <AnimatePresence>
        {activeBuilding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/80' 
                  : 'bg-white border-red-100 text-slate-800'
              }`}
            >
              <button
                onClick={() => setActiveBuilding(null)}
                className={`absolute top-4 right-4 p-2 rounded-full cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 bg-slate-100">
                <img
                  src={activeBuilding.image}
                  alt={activeBuilding.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-[#CE1126] text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                  {activeBuilding.code}
                </div>
              </div>

              <h2 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBuilding.name}</h2>
              <p className="text-xs font-extrabold text-[#CE1126] mb-3">{activeBuilding.category} Facility</p>
              <p className={`text-xs font-medium leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{activeBuilding.description}</p>

              <div className={`rounded-2xl p-3 text-xs space-y-2 mb-6 border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Hours:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeBuilding.openingHours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">GPS Coordinates:</span>
                  <span className="font-mono font-bold text-[#CE1126]">
                    {(activeBuilding.lat ?? 5.7602).toFixed(5)}°N, {(activeBuilding.lng ?? 0.0534).toFixed(5)}°E
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStartType('building');
                    setStartBuildingId(activeBuilding.id);
                    setIsNavigating(true);
                    setActiveBuilding(null);
                  }}
                  id={`set-start-${activeBuilding.id}`}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-full shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Set as Start</span>
                </button>

                <button
                  onClick={() => {
                    setDestBuildingId(activeBuilding.id);
                    setIsNavigating(true);
                    setActiveBuilding(null);
                  }}
                  id={`navigate-to-${activeBuilding.id}`}
                  className="flex-1 py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-full shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate Here</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
