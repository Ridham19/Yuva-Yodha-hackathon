import React from 'react';
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
  BatteryCharging
} from 'lucide-react';

export const SelfHealingAutomation = () => {
  const { 
    flisrActive, 
    flisrStage, 
    flisrTimerMs, 
    flisrLog, 
    triggerFLISRSimulation, 
    triggerSolarDipSimulation,
    resetToHealthy 
  } = useGrid();

  const seconds = (flisrTimerMs / 1000).toFixed(2);

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
              Autonomous Self-Healing (FLISR) & Renewable Balancing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '850px', marginTop: '4px' }}>
              When a distribution fault strikes, GridPulse isolates the damaged section and automatically reroutes healthy downstream consumers to adjacent feeders in seconds — slashing restoration from hours to single-digit seconds.
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
          <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: 1.6 }}>
            <li>Consumer phone complaints received</li>
            <li>Field line patrol van dispatched in traffic</li>
            <li>Manual pole-mounted gang switch opening</li>
          </ul>
        </div>

        {/* Outage Time Reduction Metric */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
            Downtime Slashing Factor
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: '800', color: '#10b981', margin: '8px 0' }}>
            99.9%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            From 135 minutes down to &lt; 10 seconds. Direct impact on Indian utility SAIDI indices.
          </div>
        </div>
      </div>

      {/* 3-Stage Visual Self-Healing Pipeline */}
      <div className="grid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} color="var(--accent-cyan)" />
          Autonomous 3-Step FLISR Execution Pipeline
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Step 1: Detection & Trip */}
          <div style={{
            background: flisrStage === 'DETECTION' || flisrStage === 'ISOLATION' || flisrStage === 'RESTORATION' || flisrStage === 'RESTORED' ? 'rgba(14, 165, 233, 0.1)' : 'var(--bg-stat-box)',
            border: flisrStage === 'DETECTION' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-info">STEP 01</span>
              {flisrStage ? <CheckCircle2 size={16} color="#10b981" /> : <Clock size={16} color="#64748b" />}
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Fault Detection & Trip
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Numeric protection relay senses high dI/dt fault surge (1,240A). Substation breaker CB-02 opens in <strong>42 milliseconds</strong> to prevent equipment damage.
            </p>
          </div>

          {/* Step 2: Sectionalizer Isolation */}
          <div style={{
            background: flisrStage === 'ISOLATION' || flisrStage === 'RESTORATION' || flisrStage === 'RESTORED' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-stat-box)',
            border: flisrStage === 'ISOLATION' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-warning">STEP 02</span>
              {(flisrStage === 'RESTORATION' || flisrStage === 'RESTORED') ? <CheckCircle2 size={16} color="#10b981" /> : <Clock size={16} color="#64748b" />}
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Motorized Isolation & Upstream Restore
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Smart sectionalizers SW-2A & SW-2B open, safely isolating damaged Section B. CB-02 re-closes, restoring <strong>1,400 customers on Section A</strong>.
            </p>
          </div>

          {/* Step 3: Tie-Switch Rerouting */}
          <div style={{
            background: flisrStage === 'RESTORED' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-stat-box)',
            border: flisrStage === 'RESTORED' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge badge-purple">STEP 03</span>
              {flisrStage === 'RESTORED' ? <CheckCircle2 size={16} color="#10b981" /> : <Clock size={16} color="#64748b" />}
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
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
