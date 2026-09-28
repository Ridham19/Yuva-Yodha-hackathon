import React from 'react';
import { useGrid } from '../context/GridContext';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause,
  Sun,
  Flame,
  Radio,
  Compass,
  Volume2,
  VolumeX
} from 'lucide-react';

export const Header = ({ activeTab, setActiveTab }) => {
  const {
    nldc,
    substation,
    gridFrequencyHz,
    totalDemandMw,
    totalGenerationMw,
    isBackendConnected,
    alarms,
    flisrActive,
    isLiveStreamActive,
    setIsLiveStreamActive,
    triggerFLISRSimulation,
    triggerSolarDipSimulation,
    triggerPeakLoadADRSimulation,
    resetToHealthy,
    soundMuted,
    toggleSound
  } = useGrid();

  const unackAlarmsCount = alarms.filter(a => !a.acknowledged).length;

  // Grid frequency health indicator
  const freqDeviation = +(gridFrequencyHz - 50.0).toFixed(2);
  const isFreqSafe = Math.abs(freqDeviation) <= 0.05; // Tight IEGC band
  const isFreqWarning = Math.abs(freqDeviation) > 0.05 && Math.abs(freqDeviation) <= 0.15;

  return (
    <header className="header-container" id="gridpulse-header">
      <div className="header-inner">
        {/* Brand identity */}
        <div className="brand-wrapper">
          <div className="brand-logo-badge">
            <Zap size={24} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">
              GridPulse
              <span className="brand-tag">v2.4 Live</span>
              <span 
                style={{ 
                  fontSize: '0.7rem', 
                  color: isBackendConnected ? '#10b981' : '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  background: isBackendConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: isBackendConnected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                }}
                title={isBackendConnected ? "Real-time Node.js + WebSocket Server active on Port 5000" : "Standalone in-browser simulator"}
              >
                <span className={`status-dot ${isBackendConnected ? 'normal' : 'warning'}`}></span> 
                {isBackendConnected ? "Backend Live :5000 (ws)" : "Standalone Simulator"}
              </span>
            </div>
            <div className="brand-subtitle">
              Official Indian Power Grid SCADA (NLDC / CEA) • {substation.name}
            </div>
          </div>
        </div>

        {/* Live Telemetry KPI Pills */}
        <div className="telemetry-pills">
          {/* Indian Grid Frequency */}
          <div className="kpi-pill" title="Indian Grid Code Band: 49.90 - 50.05 Hz">
            <div className={`status-dot ${isFreqSafe ? 'normal' : isFreqWarning ? 'warning' : 'critical'}`}></div>
            <div>
              <div className="kpi-label">Grid Frequency</div>
              <div className="kpi-val" style={{ color: isFreqSafe ? '#10b981' : isFreqWarning ? '#f59e0b' : '#ef4444' }}>
                {gridFrequencyHz.toFixed(2)} Hz
                <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.8 }}>
                  ({freqDeviation >= 0 ? `+${freqDeviation}` : freqDeviation})
                </span>
              </div>
            </div>
          </div>

          {/* All-India NLDC Demand Met */}
          {nldc && (
            <div className="kpi-pill" title="Official Grid-India NLDC All-India Real-Time Demand Met">
              <Activity size={16} color="#06b6d4" />
              <div>
                <div className="kpi-label">All-India Demand</div>
                <div className="kpi-val" style={{ color: '#06b6d4' }}>
                  {(nldc.nationalDemandMetMw / 1000).toFixed(1)} GW
                  <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.8, color: '#94a3b8' }}>
                    (NLDC)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Local Feeder Demand vs Gen */}
          <div className="kpi-pill">
            <Radio size={16} color="#38bdf8" />
            <div>
              <div className="kpi-label">Substation Load</div>
              <div className="kpi-val">
                <span style={{ color: '#38bdf8' }}>{totalDemandMw} MW</span>
                <span style={{ color: '#64748b', margin: '0 4px' }}>/</span>
                <span style={{ color: '#10b981' }}>{totalGenerationMw} MW</span>
              </div>
            </div>
          </div>

          {/* Substation Health */}
          <div className="kpi-pill">
            <ShieldCheck size={16} color="#10b981" />
            <div>
              <div className="kpi-label">Asset Health</div>
              <div className="kpi-val" style={{ color: '#34d399' }}>
                {substation.transformerHealthIndex}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Triggers & Demo Presets */}
        <div className="demo-actions">
          {/* Pause / Resume Live Tick */}
          <button 
            className="btn-demo"
            id="btn-stream-toggle"
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            title={isLiveStreamActive ? "Pause simulated real-time stream" : "Resume real-time telemetry stream"}
          >
            {isLiveStreamActive ? <Pause size={14} /> : <Play size={14} color="#10b981" />}
            {isLiveStreamActive ? "Stream On" : "Paused"}
          </button>

          {/* Quick Scenario 1: FLISR Fault Simulation */}
          <button
            className={`btn-demo ${flisrActive ? 'active' : ''}`}
            id="btn-trigger-flisr"
            onClick={triggerFLISRSimulation}
            disabled={flisrActive}
            title="Inject simulated 11kV fault to trigger autonomous Self-Healing (FLISR)"
          >
            <Flame size={14} color={flisrActive ? '#ef4444' : '#f59e0b'} />
            {flisrActive ? "FLISR In Progress..." : "Simulate Fault (FLISR)"}
          </button>

          {/* Quick Scenario 2: Solar Dip */}
          <button
            className="btn-demo"
            id="btn-trigger-solar"
            onClick={triggerSolarDipSimulation}
            title="Simulate sudden cloud drop & BESS frequency stabilization"
          >
            <Sun size={14} color="#38bdf8" />
            Solar Dip & BESS
          </button>

          {/* Quick Scenario 3: Peak Load ADR Shedding */}
          <button
            className="btn-demo"
            id="btn-trigger-peak-adr"
            onClick={triggerPeakLoadADRSimulation}
            title="Simulate sudden industrial surge and autonomous ADR frequency protection"
          >
            <Zap size={14} color="#f59e0b" />
            Peak ADR Shed
          </button>

          {/* Sound FX Toggle */}
          <button
            className="btn-demo"
            id="btn-toggle-sound"
            onClick={toggleSound}
            style={{ padding: '6px 10px' }}
            title={soundMuted ? "Unmute SCADA switchgear audio effects" : "Mute SCADA audio effects"}
          >
            {soundMuted ? <VolumeX size={14} color="#94a3b8" /> : <Volume2 size={14} color="#10b981" />}
          </button>

          {/* Reset System */}
          <button
            className="btn-demo restore"
            id="btn-reset-grid"
            onClick={resetToHealthy}
            title="Reset grid feeders and breaker states to baseline"
          >
            <RefreshCw size={14} />
            Reset Baseline
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="nav-tabs-wrapper" aria-label="Dashboard Views">
        <button
          className={`nav-tab-btn ${activeTab === 'india-map' ? 'active' : ''}`}
          onClick={() => setActiveTab('india-map')}
          id="tab-india-map"
        >
          <Compass size={16} />
          India National Grid (Sources & Sinks)
          <span className="nav-tab-badge" style={{ background: '#06b6d4', color: '#070b14', fontWeight: 'bold' }}>REAL MAP</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
          id="tab-topology"
        >
          <Zap size={16} />
          Local Substation GIS (11kV)
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'feeders' ? 'active' : ''}`}
          onClick={() => setActiveTab('feeders')}
          id="tab-feeders"
        >
          <Activity size={16} />
          Feeder Telemetry
          <span className="nav-tab-badge">4 Feeders</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
          id="tab-control"
        >
          <ShieldCheck size={16} />
          Switchgear & Controls
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'flisr' ? 'active' : ''}`}
          onClick={() => setActiveTab('flisr')}
          id="tab-flisr"
        >
          <RefreshCw size={16} />
          Self-Healing & Automation
          {flisrActive && <span className="nav-tab-badge" style={{ background: '#ef4444', color: '#fff' }}>ACTIVE</span>}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'predictive' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictive')}
          id="tab-predictive"
        >
          <AlertTriangle size={16} />
          Predictive Maintenance
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
          id="tab-impact"
        >
          <Zap size={16} />
          Hackathon Impact (ROI)
        </button>
      </nav>
    </header>
  );
};
