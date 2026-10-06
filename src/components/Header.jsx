import React, { useState, useEffect, useRef } from 'react';
import { useGrid } from '../context/GridContext';
import { PowerPlantCsvModal } from './PowerPlantCsvModal';
import { SinkCsvModal } from './SinkCsvModal';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause,
  Sun,
  Moon,
  Flame,
  Radio,
  Compass,
  Volume2,
  VolumeX,
  Clock,
  ChevronDown,
  Database,
  Building2,
  Cpu,
  ShieldAlert,
  Coins,
  Car,
  Layers,
  Leaf,
  FolderDown,
  Award,
  Boxes,
  BellRing,
  SlidersHorizontal,
  Settings,
  Sparkles
} from 'lucide-react';

export const Header = ({ 
  activeTab, 
  setActiveTab, 
  onOpenPitchDeck,
  onToggleAlarms,
  isAlarmsOpen
}) => {
  const {
    substation,
    gridFrequencyHz,
    totalDemandMw,
    totalGenerationMw,
    isBackendConnected,
    flisrActive,
    isLiveStreamActive,
    setIsLiveStreamActive,
    triggerFLISRSimulation,
    triggerSolarDipSimulation,
    triggerPeakLoadADRSimulation,
    resetToHealthy,
    soundMuted,
    toggleSound,
    theme,
    toggleTheme,
    sources,
    sinks,
    alarms
  } = useGrid();

  const [currentTime, setCurrentTime] = useState('');
  const [showDrillsMenu, setShowDrillsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSinkCsvModal, setShowSinkCsvModal] = useState(false);

  const drillsRef = useRef(null);
  const toolsRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (drillsRef.current && !drillsRef.current.contains(e.target)) {
        setShowDrillsMenu(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active primary category
  const getCategory = () => {
    if (['topology', 'busbar-sld', 'feeders', 'control', 'flisr', 'ecostruxure'].includes(activeTab)) return 'substation';
    if (['ml-studio', 'cyber', 'predictive'].includes(activeTab)) return 'ai-cyber';
    if (['market', 'v2g', 'database', 'carbon', 'impact'].includes(activeTab)) return 'markets';
    return 'national-grid';
  };

  const activeCategory = getCategory();

  // Grid frequency status calculations
  const freqDeviation = +(gridFrequencyHz - 50.0).toFixed(2);
  const isFreqSafe = Math.abs(freqDeviation) <= 0.05;
  const isFreqWarning = Math.abs(freqDeviation) > 0.05 && Math.abs(freqDeviation) <= 0.15;

  const unackAlarmsCount = alarms ? alarms.filter(a => !a.acknowledged).length : 0;

  return (
    <header className="header-container" id="gridpulse-header">
      <div className="header-inner">
        {/* Left: Brand Identity & Location */}
        <div className="brand-wrapper">
          <div className="brand-logo-badge">
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">
              GridPulse
              <span className="brand-tag">SCADA</span>
              <span 
                style={{ 
                  fontSize: '0.68rem', 
                  color: isBackendConnected ? 'var(--status-normal)' : 'var(--status-warning)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  background: isBackendConnected ? 'var(--badge-bg-success)' : 'var(--badge-bg-warning)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: isBackendConnected ? '1px solid var(--badge-border-success)' : '1px solid var(--badge-border-warning)',
                  fontWeight: 600
                }}
                title={isBackendConnected ? "Real-time Node.js + WebSocket Server active on Port 5000" : "In-browser simulation active"}
              >
                <span className={`status-dot ${isBackendConnected ? 'normal' : 'warning'}`}></span> 
                {isBackendConnected ? ":5000" : "Sim"}
              </span>
            </div>
            <div className="brand-subtitle">
              <span>{substation.name}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <Clock size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                {currentTime || 'Live IST'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: 4 Modern Primary Tabs */}
        <nav className="nav-tabs-wrapper" style={{ margin: 0, padding: 0 }} aria-label="Primary SCADA Modules">
          <button
            className={`nav-tab-btn ${activeCategory === 'national-grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('india-map')}
            id="tab-india-map"
          >
            <Compass size={15} />
            <span>National Grid</span>
          </button>

          <button
            className={`nav-tab-btn ${activeCategory === 'substation' ? 'active' : ''}`}
            onClick={() => setActiveTab('topology')}
            id="tab-substation"
          >
            <Zap size={15} />
            <span>Substation SCADA</span>
            {flisrActive && (
              <span className="nav-tab-badge" style={{ background: 'var(--status-critical)', color: '#fff' }}>
                FAULT
              </span>
            )}
          </button>

          <button
            className={`nav-tab-btn ${activeCategory === 'ai-cyber' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml-studio')}
            id="tab-ai-cyber"
          >
            <Cpu size={15} />
            <span>AI & Cyber</span>
            <span className="nav-tab-badge" style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc' }}>
              ML
            </span>
          </button>

          <button
            className={`nav-tab-btn ${activeCategory === 'markets' ? 'active' : ''}`}
            onClick={() => setActiveTab('market')}
            id="tab-markets"
          >
            <Coins size={15} />
            <span>Markets & Ops</span>
          </button>
        </nav>

        {/* Right: Telemetry Capsule + Human-Friendly Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Calm, Consolidated Live Telemetry Capsule */}
          <div 
            className="kpi-pill"
            style={{ padding: '5px 12px', gap: '10px' }}
            title={`IEGC Grid Frequency: ${gridFrequencyHz.toFixed(2)} Hz | Demand: ${totalDemandMw} MW / Gen: ${totalGenerationMw} MW`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className={`status-dot ${isFreqSafe ? 'normal' : isFreqWarning ? 'warning' : 'critical'}`}></div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: isFreqSafe ? 'var(--status-normal)' : isFreqWarning ? 'var(--status-warning)' : 'var(--status-critical)' }}>
                {gridFrequencyHz.toFixed(2)} Hz
              </span>
            </div>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{totalDemandMw} MW</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>load</span>
            </div>
          </div>

          {/* Alarms Drawer Bell Trigger */}
          <button
            className={`btn-demo ${isAlarmsOpen ? 'active' : ''}`}
            id="btn-header-alarms"
            onClick={onToggleAlarms}
            style={{ position: 'relative', padding: '6px 10px' }}
            title={unackAlarmsCount > 0 ? `${unackAlarmsCount} unacknowledged alarms` : "Open SCADA Alarms Drawer"}
          >
            <BellRing size={15} color={unackAlarmsCount > 0 ? 'var(--status-critical)' : 'var(--text-secondary)'} />
            {unackAlarmsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--status-critical)',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '1px 5px',
                lineHeight: 1
              }}>
                {unackAlarmsCount}
              </span>
            )}
          </button>

          {/* Operational Drills Dropdown */}
          <div style={{ position: 'relative' }} ref={drillsRef}>
            <button 
              className={`btn-demo ${flisrActive ? 'active' : ''}`}
              id="btn-drills-menu"
              onClick={() => setShowDrillsMenu(!showDrillsMenu)}
              title="Inject demo operational drills"
            >
              <Flame size={14} color={flisrActive ? 'var(--status-critical)' : '#f59e0b'} />
              <span>{flisrActive ? "Drill Running..." : "Drills"}</span>
              <ChevronDown size={12} style={{ transform: showDrillsMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showDrillsMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 200,
                  minWidth: '230px'
                }}
                onClick={() => setShowDrillsMenu(false)}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', fontWeight: 700 }}>
                  Inject Operational Drill
                </div>
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { setActiveTab('flisr'); triggerFLISRSimulation(); }}
                  disabled={flisrActive}
                >
                  <Flame size={14} color="var(--status-critical)" />
                  FLISR Fault & Healing
                </button>
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={triggerSolarDipSimulation}
                >
                  <Sun size={14} color="var(--status-warning)" />
                  Solar Dip & BESS Buffer
                </button>
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={triggerPeakLoadADRSimulation}
                >
                  <Zap size={14} color="var(--status-info)" />
                  Peak ADR Load Shedding
                </button>
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}
                  onClick={() => setActiveTab('ml-studio')}
                >
                  <Cpu size={14} color="#a855f7" />
                  Neural AI Fault & Theft Scan
                </button>
              </div>
            )}
          </div>

          {/* Yuva Yodha Grand Finale Pitch Deck Button */}
          {onOpenPitchDeck && (
            <button
              className="btn-demo"
              id="btn-pitch-deck"
              onClick={onOpenPitchDeck}
              style={{
                borderColor: 'var(--status-normal)',
                color: 'var(--status-normal)',
                fontWeight: '600'
              }}
              title="Open Yuva Yodha Grand Finale Pitch Deck [P]"
            >
              <Award size={14} color="var(--status-normal)" />
              <span>Pitch Deck</span>
              <span style={{ fontSize: '0.62rem', opacity: 0.85, background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>P</span>
            </button>
          )}

          {/* Quick Tools & Settings Dropdown */}
          <div style={{ position: 'relative' }} ref={toolsRef}>
            <button
              className="btn-demo"
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              title="Tools & Settings"
              style={{ padding: '6px 9px' }}
            >
              <SlidersHorizontal size={14} color="var(--text-secondary)" />
            </button>

            {showToolsMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 200,
                  minWidth: '210px'
                }}
                onClick={() => setShowToolsMenu(false)}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', fontWeight: 700 }}>
                  SCADA Operations & Data
                </div>

                {/* Pause/Resume Live Stream */}
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
                >
                  {isLiveStreamActive ? <Pause size={13} /> : <Play size={13} color="var(--status-normal)" />}
                  <span>{isLiveStreamActive ? "Pause Stream (Space)" : "Resume Stream (Space)"}</span>
                </button>

                {/* Sound FX Toggle */}
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={toggleSound}
                >
                  {soundMuted ? <VolumeX size={13} color="var(--text-muted)" /> : <Volume2 size={13} color="var(--status-normal)" />}
                  <span>{soundMuted ? "Unmute SCADA Audio [M]" : "Mute Audio [M]"}</span>
                </button>

                {/* CSV Power Plants */}
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setShowCsvModal(true)}
                >
                  <Database size={13} color="var(--accent-cyan)" />
                  <span>Power Plants ({sources.length})</span>
                </button>

                {/* CSV Demand Sinks */}
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setShowSinkCsvModal(true)}
                >
                  <Building2 size={13} color="var(--status-normal)" />
                  <span>Demand Sinks ({sinks.length})</span>
                </button>

                {/* Reset Grid Baseline */}
                <button
                  className="btn-demo restore"
                  style={{ width: '100%', justifyContent: 'flex-start', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}
                  onClick={resetToHealthy}
                >
                  <RefreshCw size={13} />
                  <span>Reset All to Baseline</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Day / Night Mode) */}
          <button
            className="theme-toggle-btn"
            id="btn-toggle-theme"
            onClick={toggleTheme}
            style={{ padding: '6px 10px' }}
            title={theme === 'dark' ? "Switch to Light Theme [T]" : "Switch to Dark Theme [T]"}
          >
            {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#0284c7" />}
          </button>
        </div>
      </div>

      {/* Clean Secondary Segmented Bar for the Active Category */}
      {activeCategory === 'substation' && (
        <div className="subnav-segmented-wrapper">
          <div className="subnav-segmented-bar">
            <button 
              className={`subnav-segmented-btn ${activeTab === 'topology' ? 'active' : ''}`}
              onClick={() => setActiveTab('topology')}
            >
              <Zap size={13} />
              Single-Line Diagram
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'busbar-sld' ? 'active' : ''}`}
              onClick={() => setActiveTab('busbar-sld')}
            >
              <Layers size={13} />
              Double Busbar Twin
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'feeders' ? 'active' : ''}`}
              onClick={() => setActiveTab('feeders')}
            >
              <Activity size={13} />
              Feeder Telemetry
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'control' ? 'active' : ''}`}
              onClick={() => setActiveTab('control')}
            >
              <ShieldCheck size={13} />
              Switchgear Controls
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'flisr' ? 'active' : ''}`}
              onClick={() => setActiveTab('flisr')}
              style={{ color: flisrActive ? '#fca5a5' : undefined }}
            >
              <RefreshCw size={13} />
              Self-Healing FLISR
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'ecostruxure' ? 'active' : ''}`}
              onClick={() => setActiveTab('ecostruxure')}
            >
              <Boxes size={13} />
              Schneider EcoStruxure™
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'ai-cyber' && (
        <div className="subnav-segmented-wrapper">
          <div className="subnav-segmented-bar">
            <button 
              className={`subnav-segmented-btn ${activeTab === 'ml-studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('ml-studio')}
            >
              <Cpu size={13} />
              Neural ML Studio
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'cyber' ? 'active' : ''}`}
              onClick={() => setActiveTab('cyber')}
            >
              <ShieldAlert size={13} />
              Zero-Trust Cyber Shield (IEC 62351)
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'predictive' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictive')}
            >
              <AlertTriangle size={13} />
              Predictive Maintenance
            </button>
          </div>
        </div>
      )}

      {activeCategory === 'markets' && (
        <div className="subnav-segmented-wrapper">
          <div className="subnav-segmented-bar">
            <button 
              className={`subnav-segmented-btn ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              <Coins size={13} />
              IEX Energy Market
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'v2g' ? 'active' : ''}`}
              onClick={() => setActiveTab('v2g')}
            >
              <Car size={13} />
              EV Fleet & V2G
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => setActiveTab('database')}
            >
              <Database size={13} />
              SQL Database Explorer
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'carbon' ? 'active' : ''}`}
              onClick={() => setActiveTab('carbon')}
            >
              <Leaf size={13} />
              ESG Carbon Reports
            </button>
            <button 
              className={`subnav-segmented-btn ${activeTab === 'impact' ? 'active' : ''}`}
              onClick={() => setActiveTab('impact')}
            >
              <Activity size={13} />
              Reliability & ROI
            </button>
          </div>
        </div>
      )}

      {/* Power Plant CSV Database Manager Modal */}
      <PowerPlantCsvModal 
        isOpen={showCsvModal} 
        onClose={() => setShowCsvModal(false)} 
      />

      {/* Demand Sinks CSV Database Manager Modal */}
      <SinkCsvModal 
        isOpen={showSinkCsvModal} 
        onClose={() => setShowSinkCsvModal(false)} 
      />
    </header>
  );
};
