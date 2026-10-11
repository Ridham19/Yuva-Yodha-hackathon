import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGrid } from '../context/GridContext';
import { 
  MapPin, 
  Sun, 
  Wind, 
  Zap, 
  Radio, 
  TrendingUp, 
  Building2, 
  Layers, 
  Compass, 
  ArrowRight, 
  Filter, 
  Power, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Sliders, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  SlidersHorizontal, 
  Activity, 
  Unplug, 
  Crosshair, 
  Database,
  Search,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Clock,
  CloudSun,
  CloudLightning,
  Thermometer,
  Eye,
  ArrowUpRight,
  BarChart2,
  HelpCircle,
  Gauge
} from 'lucide-react';
import { PowerPlantCsvModal } from './PowerPlantCsvModal';
import { SinkCsvModal } from './SinkCsvModal';
import {
  SOLAR_RE_ZONES,
  WIND_RESOURCE_ZONES,
  GRID_WEATHER_HAZARDS,
  INTER_REGIONAL_TRANSFERS,
  REGIONAL_CENTERS_BOUNDS
} from '../data/indiaGridData';

export const IndiaGridMap = ({ onSelectLocalSubstation }) => {
  const {
    nldc,
    regions,
    sources,
    substations,
    sinks,
    corridors,
    gridFrequencyHz,
    isBackendConnected,
    controlCorridor,
    controlGenerator,
    controlDemand,
    controlRegion,
    stabilizeFrequency,
    triggerFLISRSimulation,
    flisrActive,
    flisrStage,
    theme
  } = useGrid();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const baseTileLayerRef = useRef(null);

  // Core Map State
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CORRIDORS' | 'RENEWABLE' | 'BASELOAD' | 'SINKS'
  const [mapStyle, setMapStyle] = useState('DARK'); // 'DARK' | 'LIGHT' | 'SATELLITE'
  const [selectedNode, setSelectedNode] = useState(null);
  const [faultInjectionMode, setFaultInjectionMode] = useState(false);
  const [dispatchSliderVal, setDispatchSliderVal] = useState(1800);
  const [showMapCsvModal, setShowMapCsvModal] = useState(false);
  const [showMapSinkCsvModal, setShowMapSinkCsvModal] = useState(false);
  const [showRldcs, setShowRldcs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ lat: 22.8, lng: 79.5 });

  // Toggleable Geospatial SCADA Overlays
  const [overlays, setOverlays] = useState({
    solarAura: true,
    windAura: true,
    weatherHazards: true,
    interRegionalTies: true,
    flowParticles: true
  });
  const [showOverlaysMenu, setShowOverlaysMenu] = useState(false);

  // 24-Hour Diurnal Duck Curve Time Scrubber State
  const [timeSliderHour, setTimeSliderHour] = useState(null); // null = Live Real-Time
  const [isTimePlaying, setIsTimePlaying] = useState(false);

  // N-1 Contingency Analysis in Drawer
  const [n1Running, setN1Running] = useState(false);
  const [n1Results, setN1Results] = useState(null);

  // Synchronize selectedNode with real-time state updates
  useEffect(() => {
    if (!selectedNode) return;
    if (selectedNode.category === 'CORRIDOR') {
      const updated = corridors.find(c => c.id === selectedNode.id);
      if (updated) setSelectedNode(prev => ({ ...prev, ...updated }));
    } else if (selectedNode.category === 'SOURCE') {
      const updated = sources.find(s => s.id === selectedNode.id);
      if (updated) {
        setSelectedNode(prev => ({ ...prev, ...updated }));
        setDispatchSliderVal(updated.currentGenMw);
      }
    } else if (selectedNode.category === 'SINK') {
      const updated = sinks.find(s => s.id === selectedNode.id);
      if (updated) setSelectedNode(prev => ({ ...prev, ...updated }));
    } else if (selectedNode.category === 'SUBSTATION') {
      const updated = substations?.find(s => s.id === selectedNode.id);
      if (updated) setSelectedNode(prev => ({ ...prev, ...updated }));
    }
  }, [corridors, sources, sinks, substations]);

  // Automated 24-Hour Diurnal Playback loop
  useEffect(() => {
    let timer;
    if (isTimePlaying) {
      timer = setInterval(() => {
        setTimeSliderHour(prev => {
          const next = (prev === null ? 0 : prev + 1);
          return next > 23 ? 0 : next;
        });
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isTimePlaying]);

  // Compute Time-of-Day Multipliers for Duck Curve Simulation
  const diurnalModifiers = useMemo(() => {
    if (timeSliderHour === null) return null;
    const h = timeSliderHour;

    // Solar curve: zero before 6am and after 6pm, peaks at 12pm
    let solarFactor = 0;
    if (h >= 6 && h <= 18) {
      solarFactor = Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 2);
    }

    // Wind curve: stronger at night and late evening
    const windFactor = (h < 6 || h > 19) ? 0.88 : (0.45 + 0.25 * Math.cos((Math.PI * h) / 12));

    // National Demand curve (India duck curve: morning bump, afternoon dip, evening surge)
    let demandFactor = 0.72; // night baseline
    if (h >= 6 && h < 10) demandFactor = 0.88; // morning ramp
    else if (h >= 10 && h < 16) demandFactor = 0.94; // industrial daylight
    else if (h >= 17 && h <= 21) demandFactor = 1.14; // evening peak duck curve (up to 252 GW)
    else if (h > 21) demandFactor = 0.84; // wind down

    // IEX Market Price (₹/kWh)
    let spotPrice = 4.20;
    if (h >= 11 && h <= 15) spotPrice = 2.15; // solar surplus low
    else if (h >= 18 && h <= 21) spotPrice = 9.85; // peak evening high

    return { hour: h, solarFactor, windFactor, demandFactor, spotPrice };
  }, [timeSliderHour]);

  // Effective Sources & Sinks adjusted for 24-Hour simulation if active
  const effectiveSources = useMemo(() => {
    if (!diurnalModifiers) return sources;
    return sources.map(src => {
      let simulatedGen = src.currentGenMw;
      if (src.type === 'SOLAR_RE') {
        simulatedGen = Math.round(src.capacityMw * diurnalModifiers.solarFactor);
      } else if (src.type === 'WIND_RE') {
        simulatedGen = Math.round(src.capacityMw * diurnalModifiers.windFactor);
      } else if (src.type === 'HYDRO_DAM' || src.type === 'HYDRO_PSP') {
        // Hydro units ramp up to meet evening peak
        const hydroBoost = (diurnalModifiers.hour >= 18 && diurnalModifiers.hour <= 22) ? 1.25 : 0.85;
        simulatedGen = Math.min(src.capacityMw, Math.round(src.currentGenMw * hydroBoost));
      }
      return { ...src, currentGenMw: src.status === 'TRIPPED' ? 0 : simulatedGen };
    });
  }, [sources, diurnalModifiers]);

  const effectiveSinks = useMemo(() => {
    if (!diurnalModifiers) return sinks;
    return sinks.map(sink => {
      const simulatedDemand = Math.round(sink.peakDemandMw * diurnalModifiers.demandFactor * (1 - (sink.loadShedPct || 0) / 100));
      return { ...sink, currentDemandMw: sink.status === 'BLACKOUT' ? 0 : simulatedDemand };
    });
  }, [sinks, diurnalModifiers]);

  // Effective Corridors power flows adjusted for diurnal solar / demand swings
  const effectiveCorridors = useMemo(() => {
    if (!diurnalModifiers) return corridors;
    return corridors.map(corr => {
      let flow = corr.flowMw;
      if (corr.type === 'GREEN_ENERGY_CORRIDOR') {
        flow = Math.round(corr.capacityMw * (diurnalModifiers.solarFactor * 0.9 + 0.1));
      } else if (corr.type === 'WIND_CORRIDOR') {
        flow = Math.round(corr.capacityMw * (diurnalModifiers.windFactor * 0.85 + 0.15));
      } else if (corr.type === 'HVDC_BASELOAD' || corr.type === 'UHVDC_INTERREGIONAL') {
        // High utilization during evening peak
        const eveningBoost = (diurnalModifiers.hour >= 18 && diurnalModifiers.hour <= 22) ? 1.2 : 0.88;
        flow = Math.min(corr.capacityMw, Math.round(corr.flowMw * eveningBoost));
      }
      return { ...corr, flowMw: corr.status === 'TRIPPED' ? 0 : flow };
    });
  }, [corridors, diurnalModifiers]);

  // Search Results Filter
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];

    effectiveSources.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.state.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)) {
        results.push({ ...s, category: 'SOURCE', label: `${s.name} (${s.type})` });
      }
    });

    effectiveSinks.forEach(s => {
      if (s.name.toLowerCase().includes(q) || (s.city && s.city.toLowerCase().includes(q)) || s.state.toLowerCase().includes(q)) {
        results.push({ ...s, category: 'SINK', label: `${s.name} (Demand Sink)` });
      }
    });

    effectiveCorridors.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.voltageKv.toString().includes(q)) {
        results.push({ ...c, category: 'CORRIDOR', label: `${c.name} (${c.voltageKv}kV)` });
      }
    });

    (substations || []).forEach(sub => {
      if (!sub || !sub.name) return;
      const vStr = String(sub.voltageKv ? `${sub.voltageKv}kV` : (sub.voltageLevel || '400kV'));
      const sName = String(sub.name || '');
      const sState = String(sub.state || '');
      const sOp = String(sub.operator || '');
      if (
        sName.toLowerCase().includes(q) ||
        sState.toLowerCase().includes(q) ||
        vStr.toLowerCase().includes(q) ||
        sOp.toLowerCase().includes(q)
      ) {
        results.push({ ...sub, category: 'SUBSTATION', label: `${sName} (${vStr} Substation)` });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, effectiveSources, effectiveSinks, effectiveCorridors, substations]);

  // Initialize & Update Leaflet Map and Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 11,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Track cursor coordinates for SCADA HUD
      map.on('mousemove', (e) => {
        setMouseCoords({
          lat: +e.latlng.lat.toFixed(2),
          lng: +e.latlng.lng.toFixed(2)
        });
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let newTileLayer;
    if (mapStyle === 'SATELLITE') {
      newTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics | NLDC / POSOCO',
        maxZoom: 17
      });
    } else if (mapStyle === 'LIGHT' || (mapStyle === 'DARK' && theme === 'light')) {
      const lightGroup = L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri, OpenStreetMap contributors | NLDC / POSOCO',
          maxZoom: 16
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 16,
          opacity: 0.7
        })
      ]);
      newTileLayer = lightGroup;
    } else {
      // Default: Esri World Dark Gray Canvas
      const darkGroup = L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; Esri, OpenStreetMap contributors | NLDC / POSOCO',
          maxZoom: 16
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 16,
          opacity: 0.6
        })
      ]);
      newTileLayer = darkGroup;
    }

    newTileLayer.addTo(map);
    baseTileLayerRef.current = newTileLayer;
  }, [mapStyle, theme]);

  // Leaflet Grid Asset & Overlay Layer Rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    layers.clearLayers();

    // =========================================================================
    // LAYER 1: SOLAR & WIND RESOURCE AURA OVERLAYS (GEOSPATIAL ENERGY POTENTIAL)
    // =========================================================================
    if (overlays.solarAura) {
      SOLAR_RE_ZONES.forEach(zone => {
        const circle = L.circle(zone.center, {
          radius: zone.radiusKm,
          color: '#f59e0b',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#f59e0b',
          fillOpacity: 0.08,
          dashArray: '4, 6'
        });

        circle.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: #f59e0b">☀️ ${zone.name}</strong><br/>
            DNI Solar Insolation: <b>${zone.dniKwhM2} kWh/m²/day</b><br/>
            Clean Energy Potential: <b>${zone.potentialMw.toLocaleString()} MW</b><br/>
            <span style="color: #cbd5e1; font-size: 10px;">${zone.description}</span>
          </div>
        `, { sticky: true });

        layers.addLayer(circle);
      });
    }

    if (overlays.windAura) {
      WIND_RESOURCE_ZONES.forEach(zone => {
        const circle = L.circle(zone.center, {
          radius: zone.radiusKm,
          color: '#10b981',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#10b981',
          fillOpacity: 0.08,
          dashArray: '4, 6'
        });

        circle.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: #10b981">💨 ${zone.name}</strong><br/>
            Average Wind Speed: <b>${zone.avgSpeedMs} m/s</b><br/>
            Capacity Factor: <b>${zone.capacityFactorPct}%</b><br/>
            <span style="color: #cbd5e1; font-size: 10px;">${zone.description}</span>
          </div>
        `, { sticky: true });

        layers.addLayer(circle);
      });
    }

    // =========================================================================
    // LAYER 2: METEOROLOGICAL & SEVERE WEATHER HAZARDS (IEEE 738 DLR IMPACT)
    // =========================================================================
    if (overlays.weatherHazards) {
      GRID_WEATHER_HAZARDS.forEach(haz => {
        const hazColor = haz.severity === 'CRITICAL' ? '#ef4444' : (haz.severity === 'WARNING' ? '#f59e0b' : '#38bdf8');
        const hazIcon = haz.type === 'HEATWAVE' ? '🌡️' : (haz.type === 'LIGHTNING' ? '⚡' : '💨');

        const markerIcon = L.divIcon({
          className: 'map-hazard-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: ${hazColor};
              border: 2px solid #ffffff;
              box-shadow: 0 0 16px ${hazColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              cursor: pointer;
            ">
              ${hazIcon}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker(haz.location, { icon: markerIcon });
        marker.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${hazColor}">METEOROLOGICAL EVENT: ${haz.name}</strong><br/>
            Severity: <b>${haz.severity}</b> • Dynamic Ampacity Delta: <b>${haz.ampacityDeltaPct > 0 ? '+' : ''}${haz.ampacityDeltaPct}%</b><br/>
            <span style="color: #cbd5e1; font-size: 10px;">${haz.impact}</span>
          </div>
        `, { sticky: true });

        layers.addLayer(marker);
      });
    }

    // =========================================================================
    // LAYER 3: INTER-REGIONAL TRANSFER TIES (ATC / TTC MONITOR)
    // =========================================================================
    if (overlays.interRegionalTies) {
      INTER_REGIONAL_TRANSFERS.forEach(tie => {
        const tieIcon = L.divIcon({
          className: 'custom-tie-marker',
          html: `
            <div style="
              background: rgba(15, 23, 42, 0.92);
              border: 1px solid #38bdf8;
              border-radius: 6px;
              padding: 2px 7px;
              color: #38bdf8;
              font-family: var(--font-mono);
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
            ">
              <span>${tie.direction}</span>
              <span style="color: #10b981;">${tie.currentFlowMw} MW</span>
            </div>
          `,
          iconSize: [110, 22],
          iconAnchor: [55, 11]
        });

        const tieMarker = L.marker(tie.center, { icon: tieIcon });
        tieMarker.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: #38bdf8">${tie.name}</strong><br/>
            Current Transfer: <b>${tie.currentFlowMw} MW</b> / ${tie.totalCapacityMw} MW<br/>
            Total Transfer Capability (TTC): <b>${tie.ttcMw} MW</b><br/>
            Available Transfer Headroom (ATC): <b style="color: #10b981">${tie.atcMw} MW</b>
          </div>
        `, { sticky: true });

        layers.addLayer(tieMarker);
      });
    }

    // =========================================================================
    // LAYER 4: TRANSMISSION CORRIDORS (POWER LINES WITH DYNAMIC FLOW ANIMATION)
    // =========================================================================
    const showCorridors = activeFilter === 'ALL' || activeFilter === 'CORRIDORS';
    if (showCorridors) {
      effectiveCorridors.forEach(corridor => {
        const isTripped = corridor.status === 'TRIPPED';
        const isRerouted = corridor.status === 'REROUTED';
        const loadPct = Math.round((corridor.flowMw / corridor.capacityMw) * 100);

        const lineColor = isTripped ? '#ef4444' : (isRerouted ? '#06b6d4' : corridor.color);
        const lineWeight = isTripped ? 5 : (corridor.voltageKv >= 765 ? 4.5 : 3.5);
        const lineDash = isTripped ? '6, 8' : '8, 6';

        // Dynamic SVG stroke flow animation class
        let flowClass = 'leaflet-corridor-flow';
        if (isTripped) {
          flowClass = 'leaflet-corridor-tripped';
        } else if (loadPct > 80) {
          flowClass = 'leaflet-corridor-congested';
        } else if (loadPct > 55) {
          flowClass = 'leaflet-corridor-flow-fast';
        }

        // 1. Ambient Neon Under-Glow Line for 765kV and UHVDC Corridors
        const glowLine = L.polyline([corridor.from, corridor.to], {
          color: lineColor,
          weight: corridor.voltageKv >= 765 ? 9 : 6,
          opacity: isTripped ? 0.35 : 0.22,
          lineCap: 'round',
          interactive: false
        });
        layers.addLayer(glowLine);

        // 2. Main Animated Power Flow Polyline
        const polyline = L.polyline([corridor.from, corridor.to], {
          color: lineColor,
          weight: lineWeight,
          opacity: isTripped ? 0.95 : 0.88,
          dashArray: lineDash,
          lineCap: 'round',
          className: overlays.flowParticles ? flowClass : ''
        });

        polyline.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${lineColor}">${corridor.name}</strong><br/>
            Status: <b style="color: ${isTripped ? '#ef4444' : (isRerouted ? '#06b6d4' : '#10b981')}">${corridor.status}</b><br/>
            Wheeling Flow: <b>${corridor.flowMw} MW</b> / ${corridor.capacityMw} MW (${corridor.voltageKv} kV)<br/>
            Conductor: <b>${corridor.conductorType || 'ACSR Moose'}</b> (${corridor.lengthKm || 300} km)<br/>
            Line Loading: <b style="color: ${loadPct > 80 ? '#ef4444' : (loadPct > 55 ? '#f59e0b' : '#10b981')}">${loadPct}%</b><br/>
            <span style="color: #38bdf8; font-size: 10px;">⚡ Click line for SCADA Tele-Control & N-1 Contingency Analysis</span>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        polyline.on('click', () => {
          if (faultInjectionMode) {
            controlCorridor(corridor.id, 'TRIP');
            setSelectedNode({ ...corridor, category: 'CORRIDOR', status: 'TRIPPED', flowMw: 0 });
            setFaultInjectionMode(false);
          } else {
            setSelectedNode({ ...corridor, category: 'CORRIDOR' });
            setN1Results(null);
          }
        });

        layers.addLayer(polyline);

        // 3. Mid-Point Flow Marker or Trip Warning
        const midLat = (corridor.from[0] + corridor.to[0]) / 2;
        const midLng = (corridor.from[1] + corridor.to[1]) / 2;

        if (isTripped) {
          const faultIcon = L.divIcon({
            className: 'custom-fault-marker',
            html: `
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #ef4444;
                border: 2px solid #ffffff;
                box-shadow: 0 0 16px #ef4444;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                cursor: pointer;
                animation: corridorPulse 1s infinite;
              ">
                ⚡
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const midMarker = L.marker([midLat, midLng], { icon: faultIcon });
          midMarker.bindTooltip(`<span style="color: #ef4444; font-weight:bold;">LINE OUTAGE: ${corridor.name}</span>`);
          midMarker.on('click', () => setSelectedNode({ ...corridor, category: 'CORRIDOR' }));
          layers.addLayer(midMarker);
        }
      });
    }

    // =========================================================================
    // LAYER 5: GENERATION SOURCES (HYDRO, NUCLEAR, SOLAR, WIND, THERMAL)
    // =========================================================================
    const showSources = activeFilter === 'ALL' || activeFilter === 'RENEWABLE' || activeFilter === 'BASELOAD';
    if (showSources) {
      effectiveSources.forEach(source => {
        if (activeFilter === 'RENEWABLE' && source.type !== 'SOLAR_RE' && source.type !== 'WIND_RE' && source.type !== 'HYBRID_RE' && source.type !== 'HYDRO_DAM' && source.type !== 'HYDRO_PSP') return;
        if (activeFilter === 'BASELOAD' && source.type !== 'THERMAL_COAL' && source.type !== 'NUCLEAR_BASE') return;

        const isTripped = source.status === 'TRIPPED';
        const isCurtailed = source.curtailed;

        let markerColor = '#38bdf8';
        let iconSymbol = '💧';

        if (source.type === 'NUCLEAR_BASE') {
          markerColor = '#a855f7';
          iconSymbol = '⚛️';
        } else if (source.type === 'SOLAR_RE') {
          markerColor = '#f59e0b';
          iconSymbol = '☀️';
        } else if (source.type === 'WIND_RE') {
          markerColor = '#10b981';
          iconSymbol = '💨';
        } else if (source.type === 'HYBRID_RE') {
          markerColor = '#06b6d4';
          iconSymbol = '🌤️';
        } else if (source.type === 'THERMAL_COAL') {
          markerColor = '#8b5cf6';
          iconSymbol = '🏭';
        }

        if (isTripped) {
          markerColor = '#ef4444';
          iconSymbol = '❌';
        }

        const customIcon = L.divIcon({
          className: 'custom-grid-marker',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: ${theme === 'light' ? '#ffffff' : '#0f172a'};
              border: 2px solid ${markerColor};
              box-shadow: 0 0 ${isTripped ? '18px #ef4444' : '14px ' + markerColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              cursor: pointer;
              transition: transform 0.2s ease;
              position: relative;
            ">
              ${iconSymbol}
              ${isCurtailed ? '<span style="position:absolute; bottom:-3px; right:-3px; background:#f59e0b; color:#000; font-size:9px; font-weight:bold; border-radius:50%; width:14px; height:14px; display:flex; align-items:center; justify-content:center;">C</span>' : ''}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker(source.coordinates, { icon: customIcon });
        marker.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${markerColor}">${source.name}</strong><br/>
            Type: <b>${source.subtype || source.type}</b> • ${source.state}<br/>
            Gen Output: <b>${source.currentGenMw} MW</b> / ${source.capacityMw} MW (${source.voltageKv} kV)<br/>
            Status: <b style="color: ${isTripped ? '#ef4444' : '#10b981'}">${source.status}</b>${isCurtailed ? ' (CURTAILED)' : ''}<br/>
            <span style="color: #38bdf8; font-size: 10px;">⚡ Click to Open Tele-Control & Turbine Specs</span>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        marker.on('click', () => {
          if (faultInjectionMode) {
            controlGenerator(source.id, 'TRIP');
            setSelectedNode({ ...source, category: 'SOURCE', status: 'TRIPPED', currentGenMw: 0 });
            setFaultInjectionMode(false);
          } else {
            setSelectedNode({ ...source, category: 'SOURCE' });
            setDispatchSliderVal(source.currentGenMw);
            map.flyTo(source.coordinates, 8, { duration: 1 });
          }
        });

        layers.addLayer(marker);
      });
    }

    // =========================================================================
    // LAYER 6: ELECTRICITY DEMAND SINKS (METROS, INDUSTRY, TRANSIT)
    // =========================================================================
    const showSinks = activeFilter === 'ALL' || activeFilter === 'SINKS';
    if (showSinks) {
      effectiveSinks.forEach(sink => {
        const isShed = sink.loadShedPct > 0;
        const isBlackout = sink.status === 'BLACKOUT';

        let borderColor = '#10b981';
        let sinkIcon = '🏙️';

        if (sink.category === 'FACTORY_HEAVY_INDUSTRY') {
          borderColor = '#f59e0b';
          sinkIcon = '🏭';
        } else if (sink.category === 'RESIDENTIAL_HOUSING') {
          borderColor = '#38bdf8';
          sinkIcon = '🏘️';
        } else if (sink.category === 'TRANSIT_CRITICAL_INFRA') {
          borderColor = '#ef4444';
          sinkIcon = '🚆';
        }

        if (isBlackout) borderColor = '#ef4444';
        else if (isShed) borderColor = '#f59e0b';

        const customIcon = L.divIcon({
          className: 'custom-grid-marker',
          html: `
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${theme === 'light' ? '#ffffff' : '#0f172a'};
              border: 2px solid ${borderColor};
              box-shadow: 0 0 16px ${isShed ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.7)'};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              position: relative;
            ">
              <span style="font-size: 14px;">${sinkIcon}</span>
              ${sink.drActive ? '<span style="position:absolute; top:-4px; right:-4px; background:#06b6d4; color:#000; font-size:8px; font-weight:bold; border-radius:4px; padding:0 3px;">DR</span>' : ''}
              ${isShed ? `<span style="position:absolute; bottom:-6px; background:#f59e0b; color:#000; font-size:8px; font-weight:bold; border-radius:3px; padding:0 3px;">-${sink.loadShedPct}%</span>` : ''}
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker(sink.coordinates, { icon: customIcon });
        marker.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${borderColor}">${sink.name}</strong><br/>
            Type: <b>${sink.category.replace(/_/g, ' ')}</b> • ${sink.city || sink.state}<br/>
            Demand Load: <b>${sink.currentDemandMw} MW</b> (Peak: ${sink.peakDemandMw} MW)<br/>
            Status: <b style="color: ${borderColor}">${sink.status}</b>${sink.drActive ? ' (DR Active)' : ''}<br/>
            <span style="color: #38bdf8; font-size: 10px;">⚡ Click for SCADA Shedding & Consumer Profile</span>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        marker.on('click', () => {
          setSelectedNode({ ...sink, category: 'SINK' });
          map.flyTo(sink.coordinates, 8, { duration: 1 });
        });

        layers.addLayer(marker);
      });
    }

    // =========================================================================
    // LAYER 7: 765 kV / 400 kV GRID SUBSTATIONS & POOLING STATIONS (PGCIL / CTUIL)
    // =========================================================================
    const showSubstations = activeFilter === 'ALL' || activeFilter === 'SUBSTATIONS';
    if (showSubstations && Array.isArray(substations)) {
      substations.forEach(sub => {
        if (!sub || !sub.coordinates) return;
        const vLevelStr = String(sub.voltageKv ? `${sub.voltageKv}kV` : (sub.voltageLevel || '400kV'));
        const isHvdc = sub.substationType === 'HVDC_TERMINAL' || sub.type === 'HVDC_TERMINAL' || vLevelStr.includes('800') || vLevelStr.includes('500');
        const is765 = sub.voltageKv === 765 || vLevelStr.includes('765');
        
        const markerColor = isHvdc ? '#ec4899' : (is765 ? '#f59e0b' : '#38bdf8');
        const symbol = isHvdc ? '🎛️' : (is765 ? '⚡' : '🏢');
        const vBadge = vLevelStr.split('/')[0] || '400kV';
        const mvaCap = sub.transformationCapacityMva || sub.transformationMva || 4000;
        const hasStatcom = Boolean(sub.statcomInstalled || (sub.statcomMvar && sub.statcomMvar > 0));

        const customIcon = L.divIcon({
          className: 'custom-grid-marker custom-substation-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: ${theme === 'light' ? '#ffffff' : '#0f172a'};
              border: 2px solid ${markerColor};
              box-shadow: 0 0 12px ${markerColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              cursor: pointer;
              transition: transform 0.2s ease;
              position: relative;
            ">
              ${symbol}
              <span style="
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: ${markerColor};
                color: #000;
                font-size: 7px;
                font-weight: 800;
                border-radius: 3px;
                padding: 0 2px;
                font-family: var(--font-mono);
              ">
                ${vBadge}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker(sub.coordinates, { icon: customIcon });
        marker.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${markerColor}">${sub.name}</strong><br/>
            Voltage: <b>${vLevelStr}</b> • Region: <b>${sub.region || 'National'}</b> (${sub.state || 'India'})<br/>
            Transformation Capacity: <b>${mvaCap.toLocaleString()} MVA</b><br/>
            Operator: <b>${sub.operator || 'POWERGRID'}</b><br/>
            ${hasStatcom ? `<span style="color:#10b981;">● STATCOM Active Reactive Compensation</span><br/>` : ''}
            <span style="color: #38bdf8; font-size: 10px;">⚡ Click for Substation Bay SCADA & SLD</span>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        marker.on('click', () => {
          setSelectedNode({ ...sub, category: 'SUBSTATION' });
          map.flyTo(sub.coordinates, 8, { duration: 1 });
        });

        layers.addLayer(marker);
      });
    }

  }, [activeFilter, effectiveCorridors, effectiveSources, effectiveSinks, substations, faultInjectionMode, overlays, theme]);

  // Aggregate National Overview metrics
  const totalGenMw = effectiveSources.reduce((acc, s) => s.status === 'ONLINE' ? acc + s.currentGenMw : acc, 0);
  const totalDemandMw = effectiveSinks.reduce((acc, s) => s.status !== 'BLACKOUT' ? acc + s.currentDemandMw : acc, 0);

  // Quick Regional FlyTo Handler
  const handleRegionJump = (regionKey) => {
    const target = REGIONAL_CENTERS_BOUNDS[regionKey];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(target.center, target.zoom, { duration: 1.1 });
    }
  };

  // Run N-1 Contingency Analysis on the selected corridor
  const handleRunN1Analysis = () => {
    if (!selectedNode || selectedNode.category !== 'CORRIDOR') return;
    setN1Running(true);

    setTimeout(() => {
      const trippedFlow = selectedNode.flowMw;
      const parallelCandidates = effectiveCorridors.filter(c => c.id !== selectedNode.id && c.status === 'ENERGIZED');
      
      // Distribute power to parallel links proportionally to their available capacity
      const impactList = parallelCandidates.map(c => {
        const availableHeadroom = Math.max(0, c.capacityMw - c.flowMw);
        const addedFlow = Math.round(trippedFlow * 0.35); // simulated shift
        const newFlow = c.flowMw + addedFlow;
        const newLoadPct = Math.round((newFlow / c.capacityMw) * 100);
        return {
          id: c.id,
          name: c.name,
          oldFlow: c.flowMw,
          newFlow: newFlow,
          capacity: c.capacityMw,
          newLoadPct: newLoadPct,
          isOverloaded: newLoadPct > 100
        };
      });

      const hasViolations = impactList.some(item => item.isOverloaded);

      setN1Results({
        trippedLineName: selectedNode.name,
        transferredMw: trippedFlow,
        impactList: impactList.slice(0, 3),
        hasViolations: hasViolations,
        rasRecommendation: hasViolations 
          ? "CRITICAL: Trigger Remedial Action Scheme (RAS) - Curtail upstream RE generation by 450 MW or shed Tier-2 industrial demand." 
          : "N-1 COMPLIANT: Grid remains stable within statutory thermal limits."
      });
      setN1Running(false);
    }, 700);
  };

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} 
      id="india-national-grid-view"
      className={isFullscreen ? 'map-container-fullscreen' : ''}
    >
      {/* Sleek Top Command Bar */}
      <div className="grid-card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Compass size={18} color="var(--accent-cyan)" />
                National Power Grid Tele-Control
              </h2>
              <span className="badge badge-info">IEGC 50.00 Hz</span>
              {isBackendConnected && (
                <span className="badge badge-success">● LIVE WS</span>
              )}
              {diurnalModifiers && (
                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> 24H SIM: {String(diurnalModifiers.hour).padStart(2, '0')}:00 IST
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
              All-India synchronous interconnection: 765kV corridors, mega RE parks & metro demand sinks
            </div>
          </div>

          {/* Regional Quick-Zoom Jump Pills */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-stat-box)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {Object.keys(REGIONAL_CENTERS_BOUNDS).map(rKey => (
              <button
                key={rKey}
                onClick={() => handleRegionJump(rKey)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '3px 7px',
                  borderRadius: '5px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                title={`Jump to ${REGIONAL_CENTERS_BOUNDS[rKey].label}`}
              >
                {rKey}
              </button>
            ))}
          </div>
        </div>

        {/* Right Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Smart Search Bar on Map */}
          <div className="map-search-container">
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="map-search-input"
              placeholder="Search station, city, corridor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
            />
            {isSearchFocused && filteredSearchResults.length > 0 && (
              <div className="map-search-dropdown" onMouseLeave={() => setIsSearchFocused(false)}>
                {filteredSearchResults.map((res, i) => (
                  <div
                    key={i}
                    className="map-search-item"
                    onClick={() => {
                      setSelectedNode(res);
                      if (res.coordinates && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(res.coordinates, 8, { duration: 1 });
                      } else if (res.from && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(res.from, 7, { duration: 1 });
                      }
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                  >
                    <span>{res.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>Jump ➔</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* National Metrics Capsule */}
          <div className="kpi-pill" style={{ padding: '4px 12px', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.67rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>RE Gen: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>{totalGenMw.toLocaleString()} MW</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
            <div>
              <span style={{ fontSize: '0.67rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Demand: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>{totalDemandMw.toLocaleString()} MW</span>
            </div>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
            <div>
              <span style={{ fontSize: '0.67rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>Freq: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: gridFrequencyHz >= 49.90 && gridFrequencyHz <= 50.05 ? 'var(--status-normal)' : 'var(--status-warning)' }}>
                {gridFrequencyHz.toFixed(2)} Hz
              </span>
            </div>
          </div>

          {/* Toggle Regional RLDCs */}
          <button
            className="btn-outline"
            onClick={() => setShowRldcs(!showRldcs)}
            style={{ padding: '5px 10px', fontSize: '0.74rem', gap: '5px' }}
            title="Toggle Regional Load Despatch Centres (RLDCs) ribbon"
          >
            <Activity size={13} color="var(--text-accent)" />
            <span>RLDCs ({regions.length})</span>
          </button>

          {/* Fullscreen Map Toggle */}
          <button
            className="btn-outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ padding: '5px 8px' }}
            title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen SCADA Map"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Collapsible RLDCs Strip */}
      {showRldcs && (
        <div className="grid-card" style={{ padding: '10px 16px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            5 REGIONAL LOAD DESPATCH CENTRES (RLDCs):
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {regions.map(rldc => (
              <div key={rldc.id} style={{
                background: rldc.isIslanded ? 'var(--badge-bg-danger)' : 'var(--bg-stat-box)',
                border: `1px solid ${rldc.isIslanded ? 'var(--status-critical)' : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                padding: '3px 9px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.72rem'
              }}>
                <strong style={{ color: rldc.isIslanded ? 'var(--status-critical)' : 'var(--text-accent)' }}>{rldc.code}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{(rldc.demandMetMw / 1000).toFixed(1)} GW</span>
                <button
                  onClick={() => controlRegion(rldc.id, 'ISOLATE')}
                  style={{ background: 'none', border: 'none', color: rldc.isIslanded ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.68rem', textDecoration: 'underline' }}
                >
                  {rldc.isIslanded ? 'Re-Sync' : 'Isolate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Map Box and Right SCADA Control Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '2.05fr 1.15fr' : '1fr', gap: '18px' }}>
        {/* Leaflet Map Box */}
        <div 
          className="grid-card" 
          style={{ 
            height: isFullscreen ? '100vh' : 'calc(100vh - 125px)', 
            minHeight: '620px',
            maxHeight: isFullscreen ? 'none' : '790px',
            borderRadius: isFullscreen ? 0 : '12px', 
            overflow: 'hidden', 
            position: 'relative',
            border: faultInjectionMode ? '2px dashed #ef4444' : '1px solid var(--border-subtle)',
            cursor: faultInjectionMode ? 'crosshair' : 'default'
          }}
        >
          <div 
            ref={mapContainerRef} 
            style={{ width: '100%', height: '100%', background: 'var(--bg-primary)' }} 
          />

          {/* Fault Injection Mode Notification Banner */}
          {faultInjectionMode && (
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              padding: '6px 18px',
              borderRadius: '24px',
              zIndex: 500,
              fontSize: '0.78rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
              animation: 'fadeIn 200ms ease'
            }}>
              <Crosshair size={16} />
              FAULT INJECTION ACTIVE: Click any line or power station on map to trip!
              <button 
                onClick={() => setFaultInjectionMode(false)}
                style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '12px', padding: '2px 8px', fontSize: '0.68rem', cursor: 'pointer', marginLeft: '6px' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Floating Top-Left Primary Layer Filters */}
          <div style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '3px',
            zIndex: 400,
            display: 'flex',
            gap: '3px',
            boxShadow: 'var(--shadow-md)'
          }}>
            {[
              { id: 'ALL', label: `All (${sources.length + sinks.length + corridors.length + (substations?.length || 0)})` },
              { id: 'SUBSTATIONS', label: `🏢 Substations (${substations?.length || 0})` },
              { id: 'CORRIDORS', label: `⚡ Corridors (${corridors.length})` },
              { id: 'RENEWABLE', label: `☀️ Clean RE (${sources.filter(s => s.type === 'SOLAR_RE' || s.type === 'WIND_RE' || s.type === 'HYBRID_RE' || s.type === 'HYDRO_DAM' || s.type === 'HYDRO_PSP').length})` },
              { id: 'BASELOAD', label: `🏭 Baseload (${sources.filter(s => s.type === 'THERMAL_COAL' || s.type === 'NUCLEAR_BASE').length})` },
              { id: 'SINKS', label: `🏙️ Demand (${sinks.length})` }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveFilter(item.id)}
                style={{
                  background: activeFilter === item.id ? 'var(--border-active)' : 'transparent',
                  color: activeFilter === item.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: activeFilter === item.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Floating Top-Right Basemap & Advanced SCADA Overlays */}
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '3px 8px',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* Basemap switcher */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => setMapStyle('DARK')}
                style={{
                  background: (mapStyle === 'DARK' && theme === 'dark') ? 'var(--bg-subtle)' : 'transparent',
                  border: (mapStyle === 'DARK' && theme === 'dark') ? '1px solid var(--border-active)' : '1px solid transparent',
                  color: (mapStyle === 'DARK' && theme === 'dark') ? 'var(--text-accent)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
                title="Dark Canvas"
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setMapStyle('LIGHT')}
                style={{
                  background: (mapStyle === 'LIGHT' || (mapStyle === 'DARK' && theme === 'light')) ? 'var(--bg-subtle)' : 'transparent',
                  border: (mapStyle === 'LIGHT' || (mapStyle === 'DARK' && theme === 'light')) ? '1px solid var(--border-active)' : '1px solid transparent',
                  color: (mapStyle === 'LIGHT' || (mapStyle === 'DARK' && theme === 'light')) ? 'var(--text-accent)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
                title="Light Canvas"
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setMapStyle('SATELLITE')}
                style={{
                  background: mapStyle === 'SATELLITE' ? 'var(--bg-subtle)' : 'transparent',
                  border: mapStyle === 'SATELLITE' ? '1px solid var(--status-normal)' : '1px solid transparent',
                  color: mapStyle === 'SATELLITE' ? 'var(--status-normal)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
                title="Satellite Imagery"
              >
                🛰️ Sat
              </button>
            </div>

            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

            {/* Overlays Drawer Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOverlaysMenu(!showOverlaysMenu)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Toggle GIS Overlays: Solar Irradiance, Wind Corridors, Weather Hazards, Inter-Regional Ties"
              >
                <Layers size={12} /> Overlays ▾
              </button>

              {showOverlaysMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 500,
                  minWidth: '200px'
                }}
                onMouseLeave={() => setShowOverlaysMenu(false)}
                >
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Geospatial GIS Overlays
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overlays.solarAura}
                      onChange={(e) => setOverlays({ ...overlays, solarAura: e.target.checked })}
                    />
                    ☀️ Solar DNI Resource Basin
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overlays.windAura}
                      onChange={(e) => setOverlays({ ...overlays, windAura: e.target.checked })}
                    />
                    💨 Wind Velocity Corridors
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overlays.weatherHazards}
                      onChange={(e) => setOverlays({ ...overlays, weatherHazards: e.target.checked })}
                    />
                    🌦️ Extreme Weather & DLR
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overlays.interRegionalTies}
                      onChange={(e) => setOverlays({ ...overlays, interRegionalTies: e.target.checked })}
                    />
                    🌐 Inter-Regional Ties (ATC/TTC)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={overlays.flowParticles}
                      onChange={(e) => setOverlays({ ...overlays, flowParticles: e.target.checked })}
                    />
                    ⚡ Animated Power Flow
                  </label>
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

            <button
              onClick={() => setShowMapCsvModal(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.7rem', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Open Power Plants CSV Data"
            >
              <Database size={12} /> Plants ({sources.length})
            </button>
            <button
              onClick={() => setShowMapSinkCsvModal(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--status-normal)', fontSize: '0.7rem', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Open Demand Sinks CSV Data"
            >
              <Building2 size={12} /> Sinks ({sinks.length})
            </button>
          </div>

          {/* 24-Hour Duck Curve Time Scrubber Dock (Floating bottom-middle) */}
          <div className="map-time-scrubber-dock">
            <button
              className="map-hud-btn"
              onClick={() => setIsTimePlaying(!isTimePlaying)}
              style={{ padding: '4px 8px' }}
              title={isTimePlaying ? "Pause 24h diurnal simulation" : "Play 24h diurnal duck curve simulation"}
            >
              {isTimePlaying ? <Pause size={12} /> : <Play size={12} color="var(--status-normal)" />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '95px' }}>
              <Clock size={13} color="var(--accent-cyan)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {timeSliderHour !== null ? `${String(timeSliderHour).padStart(2, '0')}:00 IST` : "Live IST"}
              </span>
            </div>

            <input
              type="range"
              className="time-range-slider"
              min={0}
              max={23}
              step={1}
              value={timeSliderHour !== null ? timeSliderHour : 12}
              onChange={(e) => {
                setTimeSliderHour(Number(e.target.value));
                setIsTimePlaying(false);
              }}
            />

            {timeSliderHour !== null && (
              <button
                className="btn-outline"
                style={{ padding: '2px 8px', fontSize: '0.68rem' }}
                onClick={() => {
                  setTimeSliderHour(null);
                  setIsTimePlaying(false);
                }}
                title="Return to real-time grid stream"
              >
                Reset Live
              </button>
            )}

            {diurnalModifiers && (
              <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                ₹{diurnalModifiers.spotPrice.toFixed(2)}/u
              </span>
            )}
          </div>

          {/* Floating SCADA Map Action Dock (Bottom Center) */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            padding: '5px 10px',
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button 
              className={`map-hud-btn ${faultInjectionMode ? 'active' : ''}`}
              onClick={() => setFaultInjectionMode(!faultInjectionMode)}
              title="Click any line or station to trip"
            >
              <Crosshair size={13} color={faultInjectionMode ? '#fff' : 'var(--status-critical)'} />
              <span>{faultInjectionMode ? "Arm Armed (Click Line)" : "Inject Fault"}</span>
            </button>

            <button
              className="map-hud-btn"
              onClick={triggerFLISRSimulation}
              disabled={flisrActive}
              title="Execute automated FLISR self-healing"
            >
              <Flame size={13} color="#f59e0b" />
              <span>{flisrActive ? `FLISR: ${flisrStage}...` : "Auto-FLISR"}</span>
            </button>

            <button
              className="map-hud-btn success"
              onClick={stabilizeFrequency}
              title="Stabilize Indian grid frequency to 50.00 Hz"
            >
              <ShieldCheck size={13} />
              <span>Stabilize 50 Hz</span>
            </button>

            <button
              className="map-hud-btn"
              onClick={() => {
                sinks.forEach(sink => controlDemand(sink.id, 'SHED', 0));
                corridors.forEach(corr => controlCorridor(corr.id, 'RESTORE'));
                sources.forEach(src => {
                  if (src.status === 'TRIPPED') controlGenerator(src.id, 'TRIP');
                });
                setTimeSliderHour(null);
                setIsTimePlaying(false);
              }}
              title="Reset all lines and stations to normal"
            >
              <RefreshCw size={13} />
              <span>Restore All</span>
            </button>
          </div>

          {/* Floating Map Legend & Telemetry Readout */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(14px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '6px 12px',
            zIndex: 400,
            fontSize: '0.7rem',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            color: 'var(--text-primary)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Solar/Wind
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} /> Hydro
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} /> Nuclear
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Demand
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 14, height: 3, background: '#ef4444' }} /> Tripped Line
            </span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.66rem' }}>
              Lat: {mouseCoords.lat}°N Lng: {mouseCoords.lng}°E
            </span>
          </div>
        </div>

        {/* Selected Asset SCADA Tele-Control Drawer */}
        {selectedNode && (
          <div className="grid-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '720px', overflowY: 'auto' }}>
            {/* Header of Drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge ${selectedNode.category === 'SOURCE' ? 'badge-warning' : (selectedNode.category === 'SINK' ? 'badge-success' : 'badge-info')}`}>
                  {selectedNode.category} • SCADA TELE-CONTROL
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '6px', color: 'var(--text-primary)' }}>
                  {selectedNode.name}
                </h3>
                {selectedNode.state && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {selectedNode.state} • Region: {selectedNode.region || 'National'}
                  </div>
                )}
              </div>
              <button 
                className="btn-outline" 
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => { setSelectedNode(null); setN1Results(null); }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedNode.description || "Synchronous transmission interconnector with automated distance protection relaying."}
            </p>

            {/* =========================================================================
                CONTROLS & ENGINEERING SPECS FOR TRANSMISSION CORRIDORS
               ========================================================================= */}
            {selectedNode.category === 'CORRIDOR' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POWER FLOW WHEELING</span>
                    <span className={`badge ${selectedNode.status === 'ENERGIZED' ? 'badge-success' : (selectedNode.status === 'REROUTED' ? 'badge-info' : 'badge-danger')}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: selectedNode.status === 'TRIPPED' ? '#ef4444' : selectedNode.color, marginTop: '4px' }}>
                    {selectedNode.flowMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Thermal Transmission Rating: {selectedNode.capacityMw} MW ({selectedNode.voltageKv} kV)
                  </div>
                  <div style={{ height: '6px', background: 'var(--track-bg)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(100, (selectedNode.flowMw / selectedNode.capacityMw) * 100)}%`,
                        background: selectedNode.status === 'TRIPPED' ? '#ef4444' : (selectedNode.flowMw / selectedNode.capacityMw > 0.8 ? '#ef4444' : selectedNode.color),
                        transition: 'width 0.3s'
                      }} 
                    />
                  </div>
                </div>

                {/* Conductor & Technical Ampacity Specs */}
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={13} /> POWERGRID CONDUCTOR & AMPACITY SPECS (IEEE 738)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Conductor:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.conductorType || 'Quad ACSR Bersimis'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Length:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.lengthKm || 450} km</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Rated Ampacity:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.nominalCurrentA || 2800} A</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>SIL Rating:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.silMw || 1800} MW</div>
                    </div>
                  </div>

                  {/* Real-Time Technical Losses */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Conductor I²R Losses:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#f59e0b' }}>
                      {((selectedNode.flowMw * 0.018)).toFixed(1)} MW (₹{(selectedNode.flowMw * 0.018 * 4.2 * 24 / 100).toFixed(2)} Lakhs/day)
                    </span>
                  </div>
                </div>

                {/* SCADA Line Switching Actions */}
                <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.82rem', color: '#f87171', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Power size={14} /> Remote Line Breaker Actuation:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedNode.status === 'ENERGIZED' ? (
                      <button
                        className="btn-danger"
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => controlCorridor(selectedNode.id, 'TRIP')}
                      >
                        <Power size={14} />
                        Trip Corridor (Open Circuit Breaker)
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => controlCorridor(selectedNode.id, 'RESTORE')}
                      >
                        <ShieldCheck size={14} />
                        Re-Close Breakers & Synchronize Line
                      </button>
                    )}

                    {selectedNode.status !== 'REROUTED' ? (
                      <button
                        className="btn-outline"
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center', borderColor: '#06b6d4', color: '#38bdf8' }}
                        onClick={() => controlCorridor(selectedNode.id, 'REROUTE')}
                      >
                        <RefreshCw size={14} />
                        Auto-Reroute via Alternate Link
                      </button>
                    ) : (
                      <button
                        className="btn-outline"
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => controlCorridor(selectedNode.id, 'RESTORE')}
                      >
                        Restore Primary Route
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic N-1 Contingency Analysis Module */}
                <div style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gauge size={14} /> N-1 Dynamic Contingency Security Scan
                    </div>
                    <button
                      className="btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.7rem', borderColor: '#c084fc', color: '#c084fc' }}
                      onClick={handleRunN1Analysis}
                      disabled={n1Running || selectedNode.status === 'TRIPPED'}
                    >
                      {n1Running ? "Computing..." : "Simulate Outage"}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                    Simulates sudden loss of this corridor and evaluates thermal overload redistribution on parallel links.
                  </p>

                  {n1Results && (
                    <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: n1Results.hasViolations ? 'var(--status-critical)' : 'var(--status-normal)' }}>
                        {n1Results.hasViolations ? "⚠️ N-1 CRITICAL VIOLATION DETECTED" : "✅ N-1 CRITERION SATISFIED"}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Transferred Load: <b>{n1Results.transferredMw} MW</b>
                      </div>
                      {n1Results.impactList.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.69rem', padding: '2px 0' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: item.isOverloaded ? '#ef4444' : '#34d399' }}>
                            {item.newFlow} MW ({item.newLoadPct}%)
                          </span>
                        </div>
                      ))}
                      <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                        {n1Results.rasRecommendation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                CONTROLS & SPECIFICATIONS FOR GENERATION SOURCES
               ========================================================================= */}
            {selectedNode.category === 'SOURCE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT DISPATCH OUTPUT</span>
                    <span className={`badge ${selectedNode.status === 'ONLINE' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: selectedNode.status === 'TRIPPED' ? '#ef4444' : '#f59e0b', marginTop: '4px' }}>
                    {selectedNode.currentGenMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Installed Capacity: {selectedNode.capacityMw} MW ({selectedNode.voltageKv} kV Interconnector)
                  </div>
                </div>

                {/* Dispatch MW Slider Control */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={15} /> Real-Time Dispatch Control:
                    </h4>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 'bold' }}>
                      {dispatchSliderVal} MW
                    </span>
                  </div>

                  <input
                    type="range"
                    className="dispatch-slider"
                    min={selectedNode.minDispatchMw || 0}
                    max={selectedNode.maxDispatchMw || selectedNode.capacityMw}
                    step={10}
                    value={dispatchSliderVal}
                    disabled={selectedNode.status === 'TRIPPED'}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDispatchSliderVal(val);
                      controlGenerator(selectedNode.id, 'DISPATCH', val);
                    }}
                  />

                  {/* Preset quick buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '12px' }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px', fontSize: '0.72rem' }}
                      disabled={selectedNode.status === 'TRIPPED'}
                      onClick={() => {
                        const target = Math.round(selectedNode.capacityMw * 0.5);
                        setDispatchSliderVal(target);
                        controlGenerator(selectedNode.id, 'DISPATCH', target);
                      }}
                    >
                      50% Base
                    </button>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px', fontSize: '0.72rem' }}
                      disabled={selectedNode.status === 'TRIPPED'}
                      onClick={() => {
                        const target = Math.round(selectedNode.capacityMw * 0.8);
                        setDispatchSliderVal(target);
                        controlGenerator(selectedNode.id, 'DISPATCH', target);
                      }}
                    >
                      80% Rated
                    </button>
                    <button
                      className="btn-outline"
                      style={{ padding: '4px', fontSize: '0.72rem' }}
                      disabled={selectedNode.status === 'TRIPPED'}
                      onClick={() => {
                        const target = selectedNode.capacityMw;
                        setDispatchSliderVal(target);
                        controlGenerator(selectedNode.id, 'DISPATCH', target);
                      }}
                    >
                      100% Max
                    </button>
                  </div>

                  {/* Curtailment & Trip actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      className={`btn-outline ${selectedNode.curtailed ? 'active' : ''}`}
                      style={{ flex: 1, padding: '6px', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#fbbf24' }}
                      disabled={selectedNode.status === 'TRIPPED'}
                      onClick={() => controlGenerator(selectedNode.id, 'CURTAIL')}
                    >
                      {selectedNode.curtailed ? "Disable Curtailment" : "Curtail Output (50%)"}
                    </button>
                    <button
                      className={selectedNode.status === 'ONLINE' ? 'btn-danger' : 'btn-primary'}
                      style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                      onClick={() => controlGenerator(selectedNode.id, 'TRIP')}
                    >
                      {selectedNode.status === 'ONLINE' ? "Trip Generator" : "Re-Sync Unit"}
                    </button>
                  </div>
                </div>

                {/* Merit Order Despatch & Emission Specs */}
                <div style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-accent)', fontWeight: 'bold' }}>⚡ MERIT ORDER DESPATCH & ESG SPECS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Variable Cost:</span>
                      <div style={{ fontWeight: 600, color: '#34d399' }}>
                        {selectedNode.type === 'SOLAR_RE' ? '₹2.40/kWh' : (selectedNode.type === 'WIND_RE' ? '₹2.85/kWh' : (selectedNode.type.includes('HYDRO') ? '₹3.10/kWh' : '₹4.35/kWh'))}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Carbon Intensity:</span>
                      <div style={{ fontWeight: 600, color: selectedNode.type === 'THERMAL_COAL' ? '#ef4444' : '#10b981' }}>
                        {selectedNode.type === 'THERMAL_COAL' ? '880 g CO₂/kWh' : '0 g CO₂/kWh'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hydro Dam Details if Applicable */}
                {selectedNode.riverBasin && (
                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold' }}>💧 HYDRO DAM & RESERVOIR SPECS</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                      River Basin: <b>{selectedNode.riverBasin}</b>
                    </div>
                    {selectedNode.operatingHeadMeters && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Operating Head: <b>{selectedNode.operatingHeadMeters} m</b> • Full Reservoir Level: <b>{selectedNode.fullReservoirLevelMeters} m</b>
                      </div>
                    )}
                    {selectedNode.unitDetails && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Turbine Units: {selectedNode.unitDetails}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                CONTROLS & SPECIFICATIONS FOR DEMAND SINKS
               ========================================================================= */}
            {selectedNode.category === 'SINK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTIVE LOAD DRAW</span>
                    <span className={`badge ${selectedNode.status === 'NORMAL' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                    {selectedNode.currentDemandMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    All-Time Peak: {selectedNode.peakDemandMw} MW • Voltage: {selectedNode.voltageLevelKv || 66} kV • Shed: {selectedNode.loadShedPct}%
                  </div>
                </div>

                {/* Emergency Load Shedding Selector */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SlidersHorizontal size={15} /> Emergency Load Shedding & Demand Response:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                    {[0, 15, 30, 50].map(pct => (
                      <button
                        key={pct}
                        className="btn-outline"
                        style={{
                          padding: '6px 4px',
                          fontSize: '0.72rem',
                          background: selectedNode.loadShedPct === pct ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                          borderColor: selectedNode.loadShedPct === pct ? '#10b981' : 'var(--border-subtle)',
                          color: selectedNode.loadShedPct === pct ? '#34d399' : 'var(--text-primary)'
                        }}
                        onClick={() => controlDemand(selectedNode.id, 'SHED', pct)}
                      >
                        {pct === 0 ? "Normal (0%)" : `Shed ${pct}%`}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn-outline"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '0.76rem',
                      borderColor: '#06b6d4',
                      color: '#38bdf8',
                      background: selectedNode.drActive ? 'rgba(6, 182, 212, 0.2)' : 'transparent'
                    }}
                    onClick={() => controlDemand(selectedNode.id, 'DR_TOGGLE')}
                  >
                    <Radio size={14} />
                    {selectedNode.drActive ? "Deactivate Demand Response" : "Dispatch Automated DR (12% Shaved)"}
                  </button>
                </div>

                {/* Connected Substation Interface drill-down */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONNECTED GRID INTERFACE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
                    {selectedNode.connectedSubstation || '220/66kV Regional Grid Ring'}
                  </div>
                </div>

                {/* If Delhi, offer quick zoom into local Mayur Vihar substation distribution */}
                {selectedNode.id === 'SNK-DELHI' && (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '6px' }}
                    onClick={() => {
                      if (onSelectLocalSubstation) onSelectLocalSubstation();
                    }}
                  >
                    <Zap size={16} />
                    Open Mayur Vihar 66/11kV Substation Switchgear
                  </button>
                )}
              </div>
            )}

            {/* =========================================================================
                CONTROLS & SPECIFICATIONS FOR 765kV / 400kV SUBSTATIONS
               ========================================================================= */}
            {selectedNode.category === 'SUBSTATION' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRANSFORMATION CAPACITY</span>
                    <span className="badge badge-success">
                      {selectedNode.status || 'OPERATIONAL'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                    {(selectedNode.transformationCapacityMva || selectedNode.transformationMva || 6000).toLocaleString()} MVA
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Voltage Class: {selectedNode.voltageKv ? `${selectedNode.voltageKv} kV` : (selectedNode.voltageLevel || '400 kV')} • Bay Architecture: Breaker-and-a-Half
                  </div>
                  <div style={{ height: '6px', background: 'var(--track-bg)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: '68%',
                        background: '#f59e0b'
                      }} 
                    />
                  </div>
                </div>

                {/* Grid Operator & Reactive Compensation */}
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} /> POWERGRID / CTUIL ASSET ARCHITECTURE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Operator:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.operator || 'POWERGRID (PGCIL)'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Region:</span>
                      <div style={{ fontWeight: 600 }}>{selectedNode.region || 'National'} Grid ({selectedNode.state || 'India'})</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>STATCOM / Condenser:</span>
                      <div style={{ fontWeight: 600, color: (selectedNode.statcomInstalled || selectedNode.statcomMvar > 0) ? '#10b981' : 'var(--text-secondary)' }}>
                        {selectedNode.statcomInstalled ? '±300 MVAR STATCOM Installed' : (selectedNode.statcomMvar > 0 ? `±${selectedNode.statcomMvar} MVAR STATCOM` : 'Standard Shunt Reactor')}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Bus Telemetry:</span>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>
                        1.002 p.u. (50.01 Hz)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Corridors & Outgoing Bays */}
                {(selectedNode.connectedCorridors || selectedNode.connectedCorridor) && (
                  <div style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-accent)', fontWeight: 'bold', marginBottom: '6px' }}>
                      ⚡ CONNECTED TRANSMISSION LINES & OUTGOING BAYS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(Array.isArray(selectedNode.connectedCorridors) ? selectedNode.connectedCorridors : [selectedNode.connectedCorridor]).filter(Boolean).map((cId, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{cId}</span>
                          <span style={{ color: '#38bdf8', fontSize: '0.68rem' }}>765/400kV Synchronized</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Substation Control & SCADA Diagnostics */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.82rem', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} /> Tele-Control & Bay Diagnostics:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className="btn-outline"
                      style={{ width: '100%', padding: '8px', fontSize: '0.78rem', justifyContent: 'center', borderColor: '#f59e0b', color: '#fbbf24' }}
                      onClick={() => alert(`Substation ${selectedNode.name} GIS diagnostic: All 765kV circuit breakers healthy, SF6 gas pressure normal (6.2 bar), DGA hydrogen < 15 ppm.`)}
                    >
                      <Activity size={14} /> Run SF6 Gas & DGA Health Diagnostic
                    </button>
                    {onSelectLocalSubstation && (
                      <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '0.78rem', justifyContent: 'center' }}
                        onClick={() => onSelectLocalSubstation()}
                      >
                        <Zap size={14} /> Open High-Voltage SLD Single Line Diagram
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Power Plant CSV Database Manager Modal */}
      <PowerPlantCsvModal 
        isOpen={showMapCsvModal} 
        onClose={() => setShowMapCsvModal(false)} 
      />

      {/* Demand Sinks CSV Database Manager Modal */}
      <SinkCsvModal 
        isOpen={showMapSinkCsvModal} 
        onClose={() => setShowMapSinkCsvModal(false)} 
      />
    </div>
  );
};
