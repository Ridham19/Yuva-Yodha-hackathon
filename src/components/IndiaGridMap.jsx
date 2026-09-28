import React, { useEffect, useRef, useState } from 'react';
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
  Crosshair
} from 'lucide-react';

export const IndiaGridMap = ({ onSelectLocalSubstation }) => {
  const {
    nldc,
    regions,
    sources,
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
    flisrLog
  } = useGrid();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'SOURCES' | 'SINKS' | 'CORRIDORS'
  const [mapStyle, setMapStyle] = useState('DARK'); // 'DARK' | 'SATELLITE' | 'STREET'
  const [selectedNode, setSelectedNode] = useState(null);
  const [faultInjectionMode, setFaultInjectionMode] = useState(false);
  const [dispatchSliderVal, setDispatchSliderVal] = useState(1800);
  const baseTileLayerRef = useRef(null);

  // Keep selectedNode synchronized with real-time state changes
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
    }
  }, [corridors, sources, sinks]);

  // Dynamic Basemap Swapper (Dark Canvas, Satellite, Street) - 100% Free & Keyless
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.8, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing basemap
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let newTileLayer;
    if (mapStyle === 'SATELLITE') {
      newTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics | NLDC / POSOCO',
        maxZoom: 17
      });
    } else if (mapStyle === 'STREET') {
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | NLDC / POSOCO',
        maxZoom: 18
      });
    } else {
      // Default: Esri World Dark Gray Canvas (100% Keyless, zero watermarks)
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
  }, [mapStyle]);

  // Leaflet Grid Assets Layer Rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    layers.clearLayers();

    // 1. Draw Transmission Corridors (Power Lines with Live Status & Controls)
    const showCorridors = activeFilter === 'ALL' || activeFilter === 'CORRIDORS';
    if (showCorridors) {
      corridors.forEach(corridor => {
        const isTripped = corridor.status === 'TRIPPED';
        const isRerouted = corridor.status === 'REROUTED';

        const lineColor = isTripped ? '#ef4444' : (isRerouted ? '#06b6d4' : corridor.color);
        const lineWeight = isTripped ? 5 : (isRerouted ? 4.5 : 3.5);
        const lineDash = isTripped ? '6, 8' : (isRerouted ? '12, 6' : '8, 6');
        const lineOpacity = isTripped ? 0.95 : 0.85;

        const polyline = L.polyline([corridor.from, corridor.to], {
          color: lineColor,
          weight: lineWeight,
          opacity: lineOpacity,
          dashArray: lineDash,
          lineCap: 'round',
          className: isTripped ? 'leaflet-corridor-tripped' : ''
        });

        polyline.bindTooltip(`
          <div style="font-family: var(--font-body); font-size: 11px;">
            <strong style="color: ${lineColor}">${corridor.name}</strong><br/>
            Status: <b style="color: ${isTripped ? '#ef4444' : (isRerouted ? '#06b6d4' : '#10b981')}">${corridor.status}</b><br/>
            Flow: <b>${corridor.flowMw} MW</b> / ${corridor.capacityMw} MW (${corridor.voltageKv} kV)<br/>
            <span style="color: #38bdf8; font-size: 10px;">⚡ Click line for SCADA Tele-Control</span>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        polyline.on('click', () => {
          if (faultInjectionMode) {
            controlCorridor(corridor.id, 'TRIP');
            setSelectedNode({ ...corridor, category: 'CORRIDOR', status: 'TRIPPED', flowMw: 0 });
            setFaultInjectionMode(false);
          } else {
            setSelectedNode({ ...corridor, category: 'CORRIDOR' });
          }
        });

        layers.addLayer(polyline);

        if (isTripped) {
          const midLat = (corridor.from[0] + corridor.to[0]) / 2;
          const midLng = (corridor.from[1] + corridor.to[1]) / 2;
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

    // 2. Add Electricity Generation Sources (Hydro Dams, Nuclear, Solar, Thermal, Wind)
    const showSources = activeFilter === 'ALL' || activeFilter === 'SOURCES' || activeFilter === 'HYDRO' || activeFilter === 'NUCLEAR' || activeFilter === 'RENEWABLE' || activeFilter === 'THERMAL';
    if (showSources) {
      sources.forEach(source => {
        if (activeFilter === 'HYDRO' && source.type !== 'HYDRO_DAM' && source.type !== 'HYDRO_PSP') return;
        if (activeFilter === 'NUCLEAR' && source.type !== 'NUCLEAR_BASE') return;
        if (activeFilter === 'RENEWABLE' && source.type !== 'SOLAR_RE' && source.type !== 'WIND_RE' && source.type !== 'HYBRID_RE') return;
        if (activeFilter === 'THERMAL' && source.type !== 'THERMAL_COAL') return;

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
              background: #0f172a;
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
            Gen: <b>${source.currentGenMw} MW</b> / ${source.capacityMw} MW (${source.voltageKv} kV)<br/>
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

    // 3. Add Electricity Demand Sinks (Cities, Heavy Factories, Housing Townships, Transit)
    const showSinks = activeFilter === 'ALL' || activeFilter === 'SINKS' || activeFilter === 'FACTORIES' || activeFilter === 'CITIES' || activeFilter === 'HOUSING' || activeFilter === 'TRANSIT';
    if (showSinks) {
      sinks.forEach(sink => {
        if (activeFilter === 'FACTORIES' && sink.category !== 'FACTORY_HEAVY_INDUSTRY') return;
        if (activeFilter === 'CITIES' && sink.category !== 'CITY_METRO') return;
        if (activeFilter === 'HOUSING' && sink.category !== 'RESIDENTIAL_HOUSING') return;
        if (activeFilter === 'TRANSIT' && sink.category !== 'TRANSIT_CRITICAL_INFRA') return;

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
              background: #0f172a;
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
            Demand: <b>${sink.currentDemandMw} MW</b> (Peak: ${sink.peakDemandMw} MW)<br/>
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

  }, [activeFilter, corridors, sources, sinks, faultInjectionMode]);

  // Aggregate National Overview metrics
  const totalGenMw = sources.reduce((acc, s) => s.status === 'ONLINE' ? acc + s.currentGenMw : acc, 0);
  const totalDemandMw = sinks.reduce((acc, s) => s.status !== 'BLACKOUT' ? acc + s.currentDemandMw : acc, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} id="india-national-grid-view">
      {/* Top Banner: National Grid Overview & Filter Toolbar */}
      <div className="grid-card" style={{ padding: '18px 22px', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-info">OFFICIAL NLDC SCADA TOPOLOGY</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Grid Controller of India (Grid-India) • IEGC Nominal 50.00 Hz
              </span>
              {isBackendConnected && (
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  ● LIVE WS SYNC
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Indian National Power Grid: Geo-Spatial Tele-Control Center
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
              Direct bidirectional actuation for 765kV transmission corridors, mega RE parks (Bhadla, Khavda, Pavagada), peaking hydro, and metro demand centers.
            </p>
          </div>

          {/* Layer Filter Toolbar */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter:
            </span>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: activeFilter === 'ALL' ? '#38bdf8' : 'var(--border-subtle)'
              }}
              onClick={() => setActiveFilter('ALL')}
            >
              All Assets ({sources.length + sinks.length + corridors.length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'HYDRO' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: activeFilter === 'HYDRO' ? '#38bdf8' : 'var(--border-subtle)',
                color: activeFilter === 'HYDRO' ? '#38bdf8' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('HYDRO')}
            >
              💧 Hydro Dams ({sources.filter(s => s.type === 'HYDRO_DAM' || s.type === 'HYDRO_PSP').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'NUCLEAR' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                borderColor: activeFilter === 'NUCLEAR' ? '#a855f7' : 'var(--border-subtle)',
                color: activeFilter === 'NUCLEAR' ? '#c084fc' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('NUCLEAR')}
            >
              ⚛️ Nuclear ({sources.filter(s => s.type === 'NUCLEAR_BASE').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'RENEWABLE' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                borderColor: activeFilter === 'RENEWABLE' ? '#f59e0b' : 'var(--border-subtle)',
                color: activeFilter === 'RENEWABLE' ? '#fbbf24' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('RENEWABLE')}
            >
              ☀️ Solar & Wind ({sources.filter(s => s.type === 'SOLAR_RE' || s.type === 'WIND_RE' || s.type === 'HYBRID_RE').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'FACTORIES' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                borderColor: activeFilter === 'FACTORIES' ? '#f59e0b' : 'var(--border-subtle)',
                color: activeFilter === 'FACTORIES' ? '#fbbf24' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('FACTORIES')}
            >
              🏭 Factories ({sinks.filter(s => s.category === 'FACTORY_HEAVY_INDUSTRY').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'CITIES' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                borderColor: activeFilter === 'CITIES' ? '#10b981' : 'var(--border-subtle)',
                color: activeFilter === 'CITIES' ? '#34d399' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('CITIES')}
            >
              🏙️ Cities ({sinks.filter(s => s.category === 'CITY_METRO').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'HOUSING' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: activeFilter === 'HOUSING' ? '#38bdf8' : 'var(--border-subtle)',
                color: activeFilter === 'HOUSING' ? '#38bdf8' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('HOUSING')}
            >
              🏘️ Houses ({sinks.filter(s => s.category === 'RESIDENTIAL_HOUSING').length})
            </button>
            <button
              className="btn-outline"
              style={{
                fontSize: '0.72rem',
                padding: '5px 10px',
                background: activeFilter === 'CORRIDORS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                borderColor: activeFilter === 'CORRIDORS' ? '#06b6d4' : 'var(--border-subtle)',
                color: activeFilter === 'CORRIDORS' ? '#38bdf8' : 'var(--text-primary)'
              }}
              onClick={() => setActiveFilter('CORRIDORS')}
            >
              ⚡ Corridors ({corridors.length})
            </button>

            {/* Basemap Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Basemap:</span>
              <button
                className="btn-outline"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  background: mapStyle === 'DARK' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  borderColor: mapStyle === 'DARK' ? '#38bdf8' : 'var(--border-subtle)',
                  color: mapStyle === 'DARK' ? '#38bdf8' : 'var(--text-secondary)'
                }}
                onClick={() => setMapStyle('DARK')}
              >
                🌙 Dark Canvas
              </button>
              <button
                className="btn-outline"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  background: mapStyle === 'SATELLITE' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  borderColor: mapStyle === 'SATELLITE' ? '#10b981' : 'var(--border-subtle)',
                  color: mapStyle === 'SATELLITE' ? '#34d399' : 'var(--text-secondary)'
                }}
                onClick={() => setMapStyle('SATELLITE')}
              >
                🛰️ Satellite
              </button>
              <button
                className="btn-outline"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  background: mapStyle === 'STREET' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  borderColor: mapStyle === 'STREET' ? '#f59e0b' : 'var(--border-subtle)',
                  color: mapStyle === 'STREET' ? '#fbbf24' : 'var(--text-secondary)'
                }}
                onClick={() => setMapStyle('STREET')}
              >
                🗺️ Street
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Regional RLDCs Quick Telemetry Bar */}
      <div className="grid-card" style={{ padding: '12px 18px', background: 'rgba(15, 23, 42, 0.65)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="#38bdf8" /> 5 REGIONAL LOAD DESPATCH CENTRES (RLDCs):
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {regions.map(rldc => {
              const isIslanded = rldc.isIslanded;
              return (
                <div 
                  key={rldc.id}
                  style={{
                    background: isIslanded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${isIslanded ? '#ef4444' : 'var(--border-subtle)'}`,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem'
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: isIslanded ? '#ef4444' : '#38bdf8' }}>
                    {rldc.code}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>
                    {(rldc.demandMetMw / 1000).toFixed(1)} GW
                  </span>
                  <button
                    onClick={() => controlRegion(rldc.id, 'ISOLATE')}
                    title={isIslanded ? `Re-synchronize ${rldc.code} to national synchronous grid` : `Engage emergency regional islanding for ${rldc.code}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isIslanded ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      padding: '0 2px',
                      textDecoration: 'underline'
                    }}
                  >
                    {isIslanded ? 'Re-Sync' : 'Isolate'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Map Canvas and Right SCADA Control Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '2.1fr 1.1fr' : '1fr', gap: '20px' }}>
        {/* Leaflet Map Box */}
        <div 
          className="grid-card" 
          style={{ 
            height: '660px', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            position: 'relative',
            border: faultInjectionMode ? '2px dashed #ef4444' : '1px solid var(--border-subtle)',
            cursor: faultInjectionMode ? 'crosshair' : 'default'
          }}
        >
          <div 
            ref={mapContainerRef} 
            style={{ width: '100%', height: '100%', background: '#070b14' }} 
          />

          {/* Fault Injection Mode Notification Banner */}
          {faultInjectionMode && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '24px',
              zIndex: 500,
              fontSize: '0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
              animation: 'fadeIn 200ms ease'
            }}>
              <Crosshair size={18} />
              FAULT INJECTION ACTIVE: Click any line or power station on the map to trigger simulated trip!
              <button 
                onClick={() => setFaultInjectionMode(false)}
                style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', marginLeft: '8px' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Floating National Stats Overlay on Map */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '12px 18px',
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
              REAL-TIME INDIAN GRID AGGREGATE
            </span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Key RE Gen:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {totalGenMw.toLocaleString()} MW
                </div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Metro Demand:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {totalDemandMw.toLocaleString()} MW
                </div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Freq IEGC:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 'bold', color: gridFrequencyHz >= 49.90 && gridFrequencyHz <= 50.05 ? '#10b981' : '#f59e0b' }}>
                  {gridFrequencyHz.toFixed(2)} Hz
                </div>
              </div>
            </div>
          </div>

          {/* Floating SCADA Map Control Dock (HUD) */}
          <div className="map-control-hud">
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
              MAP CONTROLS:
            </span>

            {/* Fault Injection Button */}
            <button 
              className={`map-hud-btn ${faultInjectionMode ? 'active' : ''}`}
              onClick={() => setFaultInjectionMode(!faultInjectionMode)}
              title="Activate crosshairs to click and trip any corridor or station on the map"
            >
              <Crosshair size={14} color={faultInjectionMode ? '#fff' : '#ef4444'} />
              {faultInjectionMode ? "Arm Armed (Click Asset)" : "Inject Line Fault"}
            </button>

            {/* Run Transmission FLISR */}
            <button
              className="map-hud-btn"
              onClick={triggerFLISRSimulation}
              disabled={flisrActive}
              title="Run automated 3-step Fault Location, Isolation & Service Restoration"
            >
              <Flame size={14} color="#f59e0b" />
              {flisrActive ? `FLISR: ${flisrStage}...` : "Execute Auto-FLISR"}
            </button>

            {/* IEGC Frequency Stabilizer (AGC) */}
            <button
              className="map-hud-btn success"
              onClick={stabilizeFrequency}
              title="Command Tehri Hydro & AGC generation to pull grid frequency to exact 50.00 Hz"
            >
              <ShieldCheck size={14} />
              IEGC Stabilize (50.00 Hz)
            </button>

            {/* All-India Demand Response 5% Shave */}
            <button
              className="map-hud-btn"
              onClick={() => {
                sinks.forEach(sink => controlDemand(sink.id, 'SHED', 10));
              }}
              title="Trigger national 10% emergency load reduction across all metropolitan centers"
            >
              <SlidersHorizontal size={14} color="#06b6d4" />
              National 10% Load Shed
            </button>

            {/* Restore All */}
            <button
              className="map-hud-btn"
              onClick={() => {
                sinks.forEach(sink => controlDemand(sink.id, 'SHED', 0));
                corridors.forEach(corr => controlCorridor(corr.id, 'RESTORE'));
                sources.forEach(src => {
                  if (src.status === 'TRIPPED') controlGenerator(src.id, 'TRIP');
                });
              }}
              title="Re-close all tripped corridors and restore normal loads"
            >
              <RefreshCw size={14} />
              Restore All Normal
            </button>
          </div>

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 14px',
            zIndex: 400,
            fontSize: '0.72rem',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }}></span> Solar Park
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }}></span> Wind / Hybrid
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }}></span> Hydro Peaking
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }}></span> Nuclear
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span> Demand Sink
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 16, height: 3, background: '#ef4444' }}></span> Tripped Line
            </span>
          </div>
        </div>

        {/* Selected Asset SCADA Tele-Control Drawer */}
        {selectedNode && (
          <div className="grid-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '660px', overflowY: 'auto' }}>
            {/* Header of Drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge ${selectedNode.category === 'SOURCE' ? 'badge-warning' : (selectedNode.category === 'SINK' ? 'badge-success' : 'badge-info')}`}>
                  {selectedNode.category} • SCADA TELE-CONTROL
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '6px', color: '#f8fafc' }}>
                  {selectedNode.name}
                </h3>
                {selectedNode.state && (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {selectedNode.state} • Region: {selectedNode.region || 'National'}
                  </div>
                )}
              </div>
              <button 
                className="btn-outline" 
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {selectedNode.description}
            </p>

            {/* --- CONTROLS FOR TRANSMISSION CORRIDOR --- */}
            {selectedNode.category === 'CORRIDOR' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POWER FLOW WHEELING</span>
                    <span className={`badge ${selectedNode.status === 'ENERGIZED' ? 'badge-success' : (selectedNode.status === 'REROUTED' ? 'badge-info' : 'badge-danger')}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: selectedNode.status === 'TRIPPED' ? '#ef4444' : selectedNode.color, marginTop: '4px' }}>
                    {selectedNode.flowMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Thermal Transmission Rating: {selectedNode.capacityMw} MW ({selectedNode.voltageKv} kV)
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(100, (selectedNode.flowMw / selectedNode.capacityMw) * 100)}%`,
                        background: selectedNode.status === 'TRIPPED' ? '#ef4444' : selectedNode.color,
                        transition: 'width 0.3s'
                      }} 
                    />
                  </div>
                </div>

                {/* SCADA Actions for Corridor */}
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Power size={15} /> Remote Line Breaker Actuation:
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
              </div>
            )}

            {/* --- CONTROLS FOR GENERATION SOURCE --- */}
            {selectedNode.category === 'SOURCE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT DISPATCH OUTPUT</span>
                    <span className={`badge ${selectedNode.status === 'ONLINE' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: selectedNode.status === 'TRIPPED' ? '#ef4444' : '#f59e0b', marginTop: '4px' }}>
                    {selectedNode.currentGenMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
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

                {/* Real-World Hydro Dam Specifications */}
                {selectedNode.riverBasin && (
                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold' }}>💧 HYDRO DAM & RESERVOIR SPECS</div>
                    <div style={{ fontSize: '0.8rem', color: '#f8fafc', marginTop: '4px' }}>
                      River Basin: <b>{selectedNode.riverBasin}</b>
                    </div>
                    {selectedNode.operatingHeadMeters && (
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                        Operating Head: <b>{selectedNode.operatingHeadMeters} m</b> • Full Reservoir Level: <b>{selectedNode.fullReservoirLevelMeters} m</b>
                      </div>
                    )}
                    {selectedNode.unitDetails && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        Turbine Units: {selectedNode.unitDetails}
                      </div>
                    )}
                    {selectedNode.operator && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                        Plant Operator: {selectedNode.operator}
                      </div>
                    )}
                  </div>
                )}

                {/* Real-World Nuclear Reactor Specifications */}
                {selectedNode.fuelType && (
                  <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 'bold' }}>⚛️ NUCLEAR REACTOR & FUEL CYCLE</div>
                    <div style={{ fontSize: '0.8rem', color: '#f8fafc', marginTop: '4px' }}>
                      Design: <b>{selectedNode.subtype}</b>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                      Fuel Cycle: <b>{selectedNode.fuelType}</b>
                    </div>
                    {selectedNode.unitDetails && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        Reactor Units: {selectedNode.unitDetails}
                      </div>
                    )}
                    {selectedNode.operator && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                        Operator: {selectedNode.operator}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- CONTROLS FOR DEMAND SINK --- */}
            {selectedNode.category === 'SINK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTIVE LOAD DRAW</span>
                    <span className={`badge ${selectedNode.status === 'NORMAL' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                    {selectedNode.currentDemandMw} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
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

                {/* Real-World Anchor Factories & Heavy Industries */}
                {selectedNode.anchorIndustries && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 'bold' }}>🏭 ANCHOR MEGA FACTORIES & INDUSTRIAL PLANTS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
                      {selectedNode.anchorIndustries.map((ind, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: '#fbbf24' }}>•</span> {ind}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-World Housing Townships Demographics */}
                {selectedNode.housingProfile && (
                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold' }}>🏘️ RESIDENTIAL HOUSING DEMOGRAPHICS</div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                      {typeof selectedNode.housingProfile === 'string' ? selectedNode.housingProfile : JSON.stringify(selectedNode.housingProfile)}
                    </div>
                  </div>
                )}

                {/* Real-World Transit & Critical Infrastructure */}
                {selectedNode.tractionDetails && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 'bold' }}>🚆 CRITICAL TRANSIT TRACTION SPECS</div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                      {selectedNode.tractionDetails}
                    </div>
                  </div>
                )}

                {/* Connected Substation Interface drill-down */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONNECTED GRID INTERFACE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
                    {selectedNode.connectedSubstation}
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
          </div>
        )}
      </div>
    </div>
  );
};
