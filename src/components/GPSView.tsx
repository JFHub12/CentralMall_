import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { 
  Navigation, ArrowLeft, MapPin, Search, Compass, Clock, Info, Layers, 
  Crosshair, X, Building as BuildingIcon, ChevronRight, Bus, Shield, 
  Activity, Zap, Sparkles, CheckCircle2, RotateCcw, Radio, Footprints,
  ArrowRight, CornerUpRight, Play, Pause, ChevronLeft, LocateFixed, RefreshCw,
  Eye, EyeOff, Stethoscope, Coffee, ZoomIn, ZoomOut, Maximize2,
  Sliders, AlertCircle, Compass as CompassIcon, SlidersHorizontal
} from 'lucide-react';
import { CENTRAL_BUILDINGS } from '../data/campusData';
import { Building, BuildingCategory, LiveGPSUser, CampusRouteResult } from '../types';
import { useTheme, ThemeToggle } from '../context/ThemeContext';
import { ActionTooltip } from './ActionTooltip';

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
    name: 'Google Roadmap (Clear Streets)',
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
    '📍 Live Campus Map Active • Central University Miotso'
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

  return (
    <div className={`relative min-h-screen z-10 flex flex-col px-4 py-6 max-w-7xl mx-auto transition-colors duration-300 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Top Header Bar */}
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5 p-3.5 sm:p-4 lg:p-5 rounded-3xl backdrop-blur-md shadow-lg border transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-black/40 text-white' 
          : 'bg-white/95 border-red-200/80 shadow-red-100/50 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <ActionTooltip label="Back to Campus Portal">
            <button
              onClick={onBackToDashboard}
              id="back-to-dashboard-from-gps"
              aria-label="Back to Campus Portal"
              className={`w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 shrink-0 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-[#CE1126]'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </ActionTooltip>
          <div>
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <Navigation className="w-6 h-6 text-[#CE1126]" />
              Miotso Campus Live Navigator
            </h1>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Google Satellite & Roads • Campus Landmarks & Live Directory
            </p>
          </div>
        </div>

        {/* Streamlined Minimalist Horizontal Action Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 max-w-full justify-start lg:justify-end">
          {/* Theme Toggle */}
          <ActionTooltip label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <ThemeToggle className="w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] flex items-center justify-center p-0 shrink-0" />
          </ActionTooltip>

          {/* CLEAR ROAD VIEW TOGGLE (Pure Icon Symbol + Tooltip) */}
          <ActionTooltip label={isCleanRoadView ? 'Clear Road View Active: Labels docked away' : 'Toggle Clear Road View: Dock labels away'}>
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
              aria-label={isCleanRoadView ? 'Clear Road View Active' : 'Toggle Clear Road View'}
              className={`w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 shrink-0 ${
                isCleanRoadView
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isCleanRoadView ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </ActionTooltip>

          {/* Map Tile Switcher (Pure Emoji Symbols + Tooltips) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <ActionTooltip label="Google Hybrid (Satellite + Roads & Labels)">
              <button
                onClick={() => {
                  setActiveTileKey('google_hybrid');
                  setGpsMessage('📍 Google Hybrid Active: High-Res Satellite + Roads + Place Labels');
                }}
                aria-label="Google Hybrid Satellite"
                className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] rounded-full flex items-center justify-center text-base sm:text-lg transition-all cursor-pointer ${
                  activeTileKey === 'google_hybrid'
                    ? 'bg-[#CE1126] text-white shadow-sm scale-105'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                🛰️
              </button>
            </ActionTooltip>

            <ActionTooltip label="Google Streets (Clear Pathways & Roads)">
              <button
                onClick={() => {
                  setActiveTileKey('google_streets');
                  setGpsMessage('📍 Google Streets Active: Clear Streets & Campus Pathways');
                }}
                aria-label="Google Streets"
                className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] rounded-full flex items-center justify-center text-base sm:text-lg transition-all cursor-pointer ${
                  activeTileKey === 'google_streets'
                    ? 'bg-[#CE1126] text-white shadow-sm scale-105'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                🛣️
              </button>
            </ActionTooltip>

            <ActionTooltip label="Standard Vector Map">
              <button
                onClick={() => {
                  setActiveTileKey('osm_standard');
                  setGpsMessage('📍 Vector Map Active: Standard Vector Map View');
                }}
                aria-label="Standard Vector Map"
                className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] rounded-full flex items-center justify-center text-base sm:text-lg transition-all cursor-pointer ${
                  activeTileKey === 'osm_standard'
                    ? 'bg-[#CE1126] text-white shadow-sm scale-105'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                🗺️
              </button>
            </ActionTooltip>
          </div>

          {/* Center on You (Pure Icon Symbol + Tooltip) */}
          <ActionTooltip label="Center on You (GPS Location)">
            <button
              onClick={() => {
                if (mapInstanceRef.current && userLivePos) {
                  mapInstanceRef.current.setView([userLivePos.lat, userLivePos.lng], 17, { animate: true });
                  setGpsMessage(`📍 Map centered on 'You are here'`);
                }
              }}
              id="locate-me-button"
              aria-label="Center view on your GPS location"
              className="w-10 h-10 lg:w-11 lg:h-11 min-w-[40px] min-h-[40px] lg:min-w-[44px] lg:min-h-[44px] rounded-full flex items-center justify-center bg-[#CE1126] hover:bg-[#A00D1D] text-white shadow-md shadow-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <Crosshair className="w-5 h-5 text-white" />
            </button>
          </ActionTooltip>
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
        {/* LEFT PANEL: CAMPUS DIRECTORY & LANDMARKS */}
        <div className="space-y-5">
          {/* CAMPUS DIRECTORY SEARCH */}
          <div className={`p-5 rounded-3xl shadow-xl border flex flex-col h-full min-h-[580px] space-y-3 ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 shadow-black/50' 
              : 'bg-white border-red-100 shadow-red-100/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <BuildingIcon className="w-4 h-4 text-[#CE1126]" />
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

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[380px] max-h-[500px]">
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
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([activeBuilding.lat, activeBuilding.lng], 18, { animate: true });
                    }
                    setActiveBuilding(null);
                  }}
                  id={`center-landmark-${activeBuilding.id}`}
                  className="flex-1 py-3 bg-[#002147] hover:bg-[#001835] text-white font-black text-xs rounded-full shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Center on Map</span>
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
