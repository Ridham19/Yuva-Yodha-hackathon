import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  RefreshCw, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertOctagon, 
  ArrowRight, 
  TrendingDown, 
  SunMedium, 
  BatteryCharging,
  Wind,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { playBreakerCloseSound, playBreakerTripSound, playAlarmChirp } from '../utils/audioEffects';

export const SelfHealingAutomation = () => {
  const { 
    flisrActive, 
    flisrStage, 
    flisrTimerMs, 
    flisrLog, 
    triggerFLISRSimulation, 
    triggerSolarDipSimulation,
    triggerPeakLoadADRSimulation,
    resetToHealthy,
    gridFrequencyHz
  } = useGrid();

  const [activeDrill, setActiveDrill] = useState('FLISR');
  const [cycloneDrillActive, setCycloneDrillActive] = useState(false);
  const [islandDrillActive, setIslandDrillActive] = useState(false);
  const [drillMessage, setDrillMessage] = useState('');

  const seconds = (flisrTimerMs / 1000).toFixed(2);

  // Trigger Cyclone Coastal Transmission Trip & Reroute Drill
  const handleTriggerCycloneDrill = () => {
    setActiveDrill('CYCLONE');
    setCycloneDrillActive(true);
    playAlarmChirp();
    setDrillMessage('🌪️ Cyclone Biparjoy Alert: 140 km/h wind shear detected. Northern 765kV Corridor C-01 tripped! Dynamic Line Rating re-routing power through Southern Corridor C-04. Islanded microgrids synchronized.');

    setTimeout(() => {
      playBreakerCloseSound();
      setDrillMessage('✅ Dynamic re-routing completed in 4.2 seconds. All coastal loads maintained via BESS and hydro dam back-feed.');
      setCycloneDrillActive(false);
    }, 4500);
  };

  // Trigger Microgrid Islanding & Blackstart Drill
  const handleTriggerIslandDrill = () => {
    setActiveDrill('ISLAND');
    setIslandDrillActive(true);
    playBreakerTripSound();
    setDrillMessage('⚡ Grid Disconnection: Main Incomer 33kV Breaker tripped. Substation seamlessly transitioned to autonomous Islanded Microgrid mode.');

    setTimeout(() => {
      playBreakerCloseSound();
      setDrillMessage('✅ BESS Grid-Forming Inverter active. Voltage 11.0 kV and 50.00 Hz frequency synthesized locally without interruption.');
      setIslandDrillActive(false);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="flisr-automation-view">
      {/* Top Banner: Core Differentiator Highlight */}
      <div className="grid-card" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success">CORE DIFFERENTIATOR</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Yuva Yodha Grid Reliability Track</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginTop: '6px' }}>
              Autonomous Self-Healing (FLISR) & Multi-Hazard Disaster Sandbox
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '850px', marginTop: '4px' }}>
              When a distribution fault or extreme weather anomaly strikes, GridPulse isolates the damaged section and automatically reroutes healthy downstream consumers to adjacent feeders in seconds — slashing restoration from hours to single-digit seconds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-danger"
              onClick={triggerFLISRSimulation}
              disabled={flisrActive}
              id="flisr-trigger-btn"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
            >
              <Flame size={18} />
              {flisrActive ? "Simulation Running..." : "Trigger Feeder Fault (FLISR)"}
            </button>
            <button
              className="btn-outline"
              onClick={resetToHealthy}
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
            >
              <RefreshCw size={16} />
              Reset System
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Hazard Drill Scenario Switcher Bar */}
      <div className="grid-card" style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>
          Select Operational Disaster Drill (5 High-Impact Scenarios)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => { setActiveDrill('FLISR'); triggerFLISRSimulation(); }}
            disabled={flisrActive}
            className={`btn-demo ${activeDrill === 'FLISR' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Flame size={14} color="#ef4444" />
            1. Sub-10s FLISR Fault Reroute
          </button>
          <button
            onClick={() => { setActiveDrill('SOLAR'); triggerSolarDipSimulation(); }}
            className={`btn-demo ${activeDrill === 'SOLAR' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <SunMedium size={14} color="#f59e0b" />
            2. Solar Cloud Dip & BESS FFR
          </button>
          <button
            onClick={() => { setActiveDrill('ADR'); triggerPeakLoadADRSimulation(); }}
            className={`btn-demo ${activeDrill === 'ADR' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Zap size={14} color="#06b6d4" />
            3. Peak Demand-Response Shedding
          </button>
          <button
            onClick={handleTriggerCycloneDrill}
            disabled={cycloneDrillActive}
            className={`btn-demo ${activeDrill === 'CYCLONE' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Wind size={14} color="#38bdf8" />
            4. Cyclone 140km/h Line Trip & DLR
          </button>
          <button
            onClick={handleTriggerIslandDrill}
            disabled={islandDrillActive}
            className={`btn-demo ${activeDrill === 'ISLAND' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Radio size={14} color="#a855f7" />
            5. Microgrid Islanding & Blackstart
          </button>
        </div>

        {drillMessage && (
          <div style={{ marginTop: '14px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {drillMessage}
          </div>
        )}
      </div>

      {/* Restoration Stopwatch & Head-to-Head Comparison */}
      <div className="grid-3col">
        {/* Active FLISR Stopwatch */}
        <div className="grid-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GridPulse Automated Restoration Timer
          </div>
          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '3.2rem', 
            fontWeight: '800', 
            color: flisrStage === 'RESTORED' ? '#10b981' : (flisrActive ? 'var(--accent-cyan)' : 'var(--text-muted)'),
            margin: '8px 0',
            textShadow: flisrActive ? '0 0 20px rgba(14, 165, 233, 0.3)' : 'none'
          }}>
            {seconds}s
          </div>
          <div style={{ fontSize: '0.8rem', color: flisrStage === 'RESTORED' ? '#10b981' : 'var(--text-muted)' }}>
            {flisrStage === 'RESTORED' ? '✅ Full Loop Restored in 6.82s' : (flisrActive ? `Stage: ${flisrStage}` : 'Awaiting Fault Event')}
          </div>
        </div>

        {/* Traditional Manual Restoration Comparison */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
            Traditional SCADA-Lite / Manual Process
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '700', color: '#ef4444', margin: '8px 0' }}>
            ~2h 15m
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Customer call centers → Patrol vehicles dispatched → Manual line sectionalizing.
          </div>
        </div>

        {/* Net Reliability Benefit */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
            Net Outage Time Slashed
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '700', color: '#10b981', margin: '8px 0' }}>
            -99.9%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Restoration latency reduced from 8,100 seconds to 6.82 seconds. Zero manual hazard.
          </div>
        </div>
      </div>

      {/* 3-Step Animated Visual Sequence Breakdown */}
      <div className="grid-card" style={{ padding: '20px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '16px' }}>
          Autonomous 3-Stage Fault Resolution Sequence
        </h4>

        <div className="grid-3col">
          {/* Step 1 */}
          <div style={{ 
            background: flisrStage === 'FAULT_DETECTED' || flisrStage === 'ISOLATING' || flisrStage === 'RESTORED' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-stat-box)', 
            border: flisrStage === 'FAULT_DETECTED' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-danger">STAGE 1 (42ms)</span>
              <AlertOctagon size={18} color="#ef4444" />
            </div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
              Digital Overcurrent Trip
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Easergy numerical relay detects cable short circuit on Feeder 2. Main substation circuit breaker <strong>CB-02 trips in 42ms</strong> to clear the high fault energy.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ 
            background: flisrStage === 'ISOLATING' || flisrStage === 'RESTORED' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-stat-box)', 
            border: flisrStage === 'ISOLATING' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-warning">STAGE 2 (3.45s)</span>
              <ShieldCheck size={18} color="#f59e0b" />
            </div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
              Automated Section Isolation
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Smart sectionalizers SW-2A and SW-2B open to isolate the damaged Section B cable. CB-02 safely re-closes to restore upstream <strong>1,850 consumers on Section A</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ 
            background: flisrStage === 'RESTORED' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-stat-box)', 
            border: flisrStage === 'RESTORED' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-success">STAGE 3 (6.82s)</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
              Tie-Switch Power Reroute
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              GridPulse checks reserve capacity on Feeder 1 and commands Tie-Switch TS-1-2 to close. Downstream <strong>2,100 customers on Section C back-fed</strong> and restored!
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time FLISR Event Log */}
      <div className="grid-card" style={{ padding: '20px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--accent-cyan)" />
          Sub-Second Automation Event Log
        </h4>

        {flisrLog.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No active self-healing sequence in memory. Click "Trigger Feeder Fault (FLISR)" above to run the live sequence.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {flisrLog.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--bg-stat-box)', 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)', minWidth: '55px', fontWeight: 'bold' }}>
                  {log.time}
                </span>
                <span className="badge badge-info" style={{ minWidth: '150px' }}>
                  {log.stage}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {log.detail}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renewable Balancing / BESS Frequency Response Section */}
      <div className="grid-card" style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SunMedium size={18} color="#f59e0b" />
              Renewable Intermittency Balancing & BESS Storage
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Simulates sudden cloud cover dropping solar generation and automated Fast Frequency Response (FFR) battery injection.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            onClick={triggerSolarDipSimulation}
          >
            <BatteryCharging size={16} />
            Simulate Solar Dip & BESS Stabilization
          </button>
        </div>
      </div>
    </div>
  );
};
