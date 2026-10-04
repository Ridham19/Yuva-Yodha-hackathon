import React, { useState, useEffect } from 'react';
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
  Boxes
} from 'lucide-react';

export const Header = ({ activeTab, setActiveTab, onOpenPitchDeck }) => {
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
    sinks
  } = useGrid();

  const [currentTime, setCurrentTime] = useState('');
  const [showDrillsMenu, setShowDrillsMenu] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSinkCsvModal, setShowSinkCsvModal] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine which of the 4 main categories is active
  const getCategory = () => {
    if (['topology', 'busbar-sld', 'feeders', 'control', 'flisr', 'ecostruxure'].includes(activeTab)) return 'substation';
    if (['ml-studio', 'cyber', 'predictive'].includes(activeTab)) return 'ai-cyber';
    if (['market', 'v2g', 'database', 'carbon', 'impact'].includes(activeTab)) return 'markets';
    return 'national-grid';
  };

  const activeCategory = getCategory();

  // Grid frequency health indicator
  const freqDeviation = +(gridFrequencyHz - 50.0).toFixed(2);
  const isFreqSafe = Math.abs(freqDeviation) <= 0.05;
  const isFreqWarning = Math.abs(freqDeviation) > 0.05 && Math.abs(freqDeviation) <= 0.15;

  return (
    <header className="header-container" id="gridpulse-header">
      <div className="header-inner">
        {/* Brand Identity & Location */}
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
                  border: isBackendConnected ? '1px solid var(--badge-border-success)' : '1px solid var(--badge-border-warning)'
                }}
                title={isBackendConnected ? "Real-time Node.js + WebSocket Server active on Port 5000" : "Standalone simulator"}
              >
                <span className={`status-dot ${isBackendConnected ? 'normal' : 'warning'}`}></span> 
                {isBackendConnected ? ":5000" : "Offline"}
              </span>
            </div>
            <div className="brand-subtitle">
              <span>{substation.name}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <Clock size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                {currentTime || 'Live Clock'}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Clean Essential Telemetry Indicators */}
        <div className="telemetry-pills">
          {/* Grid Frequency */}
          <div className="kpi-pill" title="Indian Electricity Grid Code: Nominal 50.00 Hz">
            <div className={`status-dot ${isFreqSafe ? 'normal' : isFreqWarning ? 'warning' : 'critical'}`}></div>
            <div>
              <div className="kpi-label">Grid Frequency</div>
              <div className="kpi-val" style={{ color: isFreqSafe ? 'var(--status-normal)' : isFreqWarning ? 'var(--status-warning)' : 'var(--status-critical)' }}>
                {gridFrequencyHz.toFixed(2)} Hz
                <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.8, color: 'var(--text-muted)' }}>
                  ({freqDeviation >= 0 ? `+${freqDeviation}` : freqDeviation})
                </span>
              </div>
            </div>
          </div>

          {/* Substation Power */}
          <div className="kpi-pill" title="Substation Active Demand / Generation Capacity">
            <Radio size={14} color="var(--text-accent)" />
            <div>
              <div className="kpi-label">Substation Load</div>
              <div className="kpi-val">
                <span style={{ color: 'var(--text-accent)' }}>{totalDemandMw} MW</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px', fontSize: '0.75rem' }}>/</span>
                <span style={{ color: 'var(--status-normal)' }}>{totalGenerationMw} MW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Action Controls */}
        <div className="header-actions">
          {/* Yuva Yodha Grand Finale Pitch Deck Button */}
          {onOpenPitchDeck && (
            <button
              className="btn-demo"
              id="btn-pitch-deck"
              onClick={onOpenPitchDeck}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.22) 100%)',
                borderColor: '#10b981',
                color: '#10b981',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)'
              }}
              title="Open Yuva Yodha Grand Finale Pitch Deck [P]"
            >
              <Award size={14} color="#10b981" />
              <span>Jury Pitch Deck</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.85, background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>P</span>
            </button>
          )}

          {/* Scenarios Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className={`btn-demo ${flisrActive ? 'active' : ''}`}
              id="btn-drills-menu"
              onClick={() => setShowDrillsMenu(!showDrillsMenu)}
              title="Inject demo operational scenarios"
            >
              <Flame size={14} color={flisrActive ? 'var(--status-critical)' : 'var(--status-warning)'} />
              <span>{flisrActive ? "Fault Running..." : "Scenarios"}</span>
              <ChevronDown size={11} style={{ transform: showDrillsMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                  minWidth: '220px'
                }}
                onClick={() => setShowDrillsMenu(false)}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', fontWeight: 700 }}>
                  Inject Scenario Drill
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

          {/* Pause / Resume Stream */}
          <button 
            className="btn-demo"
            id="btn-stream-toggle"
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            title={isLiveStreamActive ? "Pause live simulation [Space]" : "Resume live simulation [Space]"}
          >
            {isLiveStreamActive ? <Pause size={13} /> : <Play size={13} color="var(--status-normal)" />}
            <span>{isLiveStreamActive ? "Live" : "Paused"}</span>
          </button>

          {/* Grid CSV Data Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-demo"
              onClick={() => setShowDataMenu(!showDataMenu)}
              title="Manage CSV Power Plants & Sinks Data"
            >
              <FolderDown size={13} color="var(--text-accent)" />
              <span>CSV Data</span>
            </button>
            {showDataMenu && (
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
                  minWidth: '200px'
                }}
                onClick={() => setShowDataMenu(false)}
              >
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setShowCsvModal(true)}
                >
                  <Database size={13} color="var(--accent-cyan)" />
                  Power Plants ({sources.length})
                </button>
                <button
                  className="btn-demo"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => setShowSinkCsvModal(true)}
                >
                  <Building2 size={13} color="var(--status-normal)" />
                  Demand Sinks ({sinks.length})
                </button>
              </div>
            )}
          </div>

          {/* Sound FX Toggle */}
          <button
            className="btn-demo"
            id="btn-toggle-sound"
            onClick={toggleSound}
            style={{ padding: '6px 9px' }}
            title={soundMuted ? "Unmute SCADA audio [M]" : "Mute audio [M]"}
          >
            {soundMuted ? <VolumeX size={13} color="var(--text-muted)" /> : <Volume2 size={13} color="var(--status-normal)" />}
          </button>

          {/* Theme Toggle */}
          <button
            className="theme-toggle-btn"
            id="btn-toggle-theme"
            onClick={toggleTheme}
            style={{ padding: '6px 10px' }}
            title={theme === 'dark' ? "Switch to Light Theme [T]" : "Switch to Dark Theme [T]"}
          >
            {theme === 'dark' ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#0284c7" />}
          </button>

          {/* Reset Baseline */}
          <button
            className="btn-demo restore"
            id="btn-reset-grid"
            onClick={resetToHealthy}
            title="Reset to baseline"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 4 Clean Primary Section Tabs */}
      <nav className="nav-tabs-wrapper" aria-label="Primary SCADA Modules">
        {/* Module 1: National Grid */}
        <button
          className={`nav-tab-btn ${activeCategory === 'national-grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('india-map')}
          id="tab-india-map"
        >
          <Compass size={15} />
          National Grid GIS
        </button>

        {/* Module 2: Substation SCADA */}
        <button
          className={`nav-tab-btn ${activeCategory === 'substation' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
          id="tab-substation"
        >
          <Zap size={15} />
          Substation SCADA
          {flisrActive && (
            <span className="nav-tab-badge" style={{ background: 'var(--status-critical)', color: '#fff' }}>
              FAULT
            </span>
          )}
        </button>

        {/* Module 3: AI & Cyber Defense */}
        <button
          className={`nav-tab-btn ${activeCategory === 'ai-cyber' ? 'active' : ''}`}
          onClick={() => setActiveTab('ml-studio')}
          id="tab-ai-cyber"
        >
          <Cpu size={15} />
          AI & Cyber Defense
          <span className="nav-tab-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
            ML CORE
          </span>
        </button>

        {/* Module 4: Energy Markets & DB */}
        <button
          className={`nav-tab-btn ${activeCategory === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
          id="tab-markets"
        >
          <Coins size={15} />
          Markets & Database
        </button>
      </nav>

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
              style={{ color: activeTab === 'ecostruxure' ? '#10b981' : undefined }}
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
