import React, { useState, useEffect } from 'react';
import { useGrid } from '../context/GridContext';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Radio,
  AlertTriangle,
  Flame,
  Activity,
  Terminal,
  Server,
  Zap,
  CheckCircle2,
  RefreshCw,
  Ban,
  Eye,
  Sliders,
  Bug
} from 'lucide-react';
import { playAlarmChirp, playBreakerCloseSound, playBreakerTripSound } from '../utils/audioEffects';

export const CyberSecurityCenter = () => {
  const { gridFrequencyHz, substation } = useGrid();

  // Cyber Shield Status
  const [cyberShieldActive, setCyberShieldActive] = useState(false);
  const [activeAttack, setActiveAttack] = useState(null); // 'FDIA_FREQ' | 'SURGE_FDR3' | 'MITM_REPLAY' | 'DDOS'
  const [chiSquareResidual, setChiSquareResidual] = useState(1.42);
  const [quarantinedNodes, setQuarantinedNodes] = useState([]);
  const [cyberAuditLog, setCyberAuditLog] = useState([
    { id: 1, time: '18:24:10', type: 'INFO', msg: 'SCADA TLS 1.3 handshake verified with NRLDC Master Station.' },
    { id: 2, time: '18:26:45', type: 'INFO', msg: 'PMU Stream (Mayur Vihar 66kV) synchronized to GPS clock IEEE C37.118.' }
  ]);

  // Telemetry comparison under attack
  const rawFrequency = activeAttack === 'FDIA_FREQ' ? 48.85 : gridFrequencyHz;
  const verifiedFrequency = cyberShieldActive ? gridFrequencyHz : rawFrequency;

  const rawCurrentFdr3 = activeAttack === 'SURGE_FDR3' ? 1480.0 : 382.4;
  const verifiedCurrentFdr3 = cyberShieldActive ? 382.4 : rawCurrentFdr3;

  // Trigger simulated cyber attack
  const handleLaunchAttack = (attackType) => {
    setActiveAttack(attackType);
    playAlarmChirp();

    let logMsg = '';
    let nodeToQuarantine = '';

    if (attackType === 'FDIA_FREQ') {
      setChiSquareResidual(18.95);
      logMsg = 'ALERT: False Data Injection Attack (FDIA) detected on PMU-MV-01! Ingested frequency artificially depressed to 48.85 Hz.';
      nodeToQuarantine = 'PMU-MV-01 (Mayur Vihar 66kV)';
    } else if (attackType === 'SURGE_FDR3') {
      setChiSquareResidual(24.10);
      logMsg = 'CRITICAL: Synthetic overcurrent injection (1,480A) on RTU-FDR-03 (Hospital/Metro Feed). Attempting rogue breaker trip!';
      nodeToQuarantine = 'RTU-FDR-03 (Metro Critical Bay)';
    } else if (attackType === 'MITM_REPLAY') {
      setChiSquareResidual(9.80);
      logMsg = 'SECURITY WARNING: Man-in-the-Middle (MitM) replay packet intercepted. Counterfeit IEC 60870-5-104 TRIP command blocked.';
      nodeToQuarantine = 'GW-SUB-104 (Ethernet Gateway)';
    } else if (attackType === 'DDOS') {
      setChiSquareResidual(12.40);
      logMsg = 'WARNING: SYN-flood denial of service targeted at Substation SCADA Gateway. Latency spiked to 240ms.';
      nodeToQuarantine = 'FW-INCOMER-01 (External Firewall)';
    }

    setCyberAuditLog(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }), type: 'CRITICAL', msg: logMsg },
      ...prev
    ]);

    if (!cyberShieldActive && nodeToQuarantine) {
      setQuarantinedNodes(prev => [...new Set([...prev, nodeToQuarantine])]);
    }
  };

  // Toggle Cyber Shield (IEC 62351 Encryption & Zero Trust)
  const handleToggleShield = () => {
    if (!cyberShieldActive) {
      playBreakerCloseSound();
      setCyberShieldActive(true);
      setChiSquareResidual(1.15);
      setCyberAuditLog(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }), type: 'SUCCESS', msg: 'IEC 62351 Zero-Trust Cyber Shield ENGAGED. Cryptographic packet signing activated. Adversary payloads neutralized.' },
        ...prev
      ]);
    } else {
      playBreakerTripSound();
      setCyberShieldActive(false);
      setCyberAuditLog(prev => [
        { id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }), type: 'WARNING', msg: 'IEC 62351 Cyber Shield DISENGAGED. SCADA reverted to standard unencrypted broadcast mode.' },
        ...prev
      ]);
    }
  };

  // Clear / Neutralize attack
  const handleNeutralize = () => {
    playBreakerCloseSound();
    setActiveAttack(null);
    setChiSquareResidual(1.35);
    setQuarantinedNodes([]);
    setCyberAuditLog(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString('en-IN', { hour12: false }), type: 'SUCCESS', msg: 'All attack vectors cleared. Ingested telemetry reconverged with State Estimation baseline.' },
      ...prev
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="cyber-security-center">
      {/* 1. Header Threat Banner */}
      <div 
        className="grid-card" 
        style={{ 
          padding: '22px', 
          borderLeft: `4px solid ${activeAttack && !cyberShieldActive ? '#ef4444' : cyberShieldActive ? '#10b981' : '#f59e0b'}`,
          background: cyberShieldActive 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)'
            : activeAttack 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(17, 24, 39, 0.5) 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${cyberShieldActive ? 'badge-success' : activeAttack ? 'badge-danger' : 'badge-warning'}`}>
                {cyberShieldActive ? 'IEC 62351 ACTIVE SHIELD' : activeAttack ? 'UNDER ACTIVE CYBER ATTACK' : 'STANDARD DNP3 / SCADA'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                CERT-In Compliance Standard • Indian Smart Grid Security Architecture
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {cyberShieldActive ? <ShieldCheck size={28} color="#10b981" /> : <ShieldAlert size={28} color={activeAttack ? "#ef4444" : "#f59e0b"} />}
              Cyber-Physical Security & Anti-Spoofing Defense Center
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Physics-Informed State Estimation (PI-SE) and Chi-Square residual monitoring defending RTUs and PMUs against False Data Injection Attacks (FDIA), Man-in-the-Middle command tampering, and sensor spoofing.
            </p>
          </div>

          {/* Master Cyber Shield Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleToggleShield}
              style={{
                background: cyberShieldActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                padding: '11px 22px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                boxShadow: cyberShieldActive ? '0 4px 16px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(59, 130, 246, 0.35)'
              }}
            >
              {cyberShieldActive ? <Lock size={16} /> : <Unlock size={16} />}
              {cyberShieldActive ? 'IEC 62351 Shield Active' : 'Engage Cyber Shield'}
            </button>
            {activeAttack && (
              <button
                className="btn-demo"
                onClick={handleNeutralize}
                style={{ padding: '11px 18px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: '#ef4444' }}
              >
                Clear Attacks
              </button>
            )}
          </div>
        </div>

        {/* Cyber Threat Telemetry Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CHI-SQUARE RESIDUAL (χ²)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 'bold', color: chiSquareResidual > 5.0 ? '#ef4444' : '#10b981' }}>
              {chiSquareResidual.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Normal Limit &lt; 3.84 (95% CI)</div>
          </div>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AUTHENTICATION STATUS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 'bold', color: cyberShieldActive ? '#10b981' : '#f59e0b' }}>
              {cyberShieldActive ? 'HMAC-SHA256' : 'CLEARTEXT'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>IEC 62351-3/5 Standard</div>
          </div>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>QUARANTINED NODES</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 'bold', color: quarantinedNodes.length > 0 ? '#ef4444' : '#10b981' }}>
              {quarantinedNodes.length} Device{quarantinedNodes.length === 1 ? '' : 's'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Zero-Trust Network Isolation</div>
          </div>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PACKET INTEGRITY VERIFIED</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 'bold', color: cyberShieldActive ? '#10b981' : '#38bdf8' }}>
              {cyberShieldActive ? '99.98%' : '88.40%'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Substation Gateway Buffer</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Attack Injection Laboratory */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={18} color="#ef4444" />
              Adversary Attack Simulation Sandbox (CERT-In Drill)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
              Launch cyber-physical attack vectors to test state estimation resilience and anti-spoofing defense mechanisms.
            </p>
          </div>
          <span className="badge badge-purple">LIVE DRILL BENCH</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {/* Attack 1: FDIA Frequency */}
          <div 
            style={{ 
              background: activeAttack === 'FDIA_FREQ' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-stat-box)', 
              border: `1px solid ${activeAttack === 'FDIA_FREQ' ? '#ef4444' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.88rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={15} /> FDIA Frequency Spoof
              </strong>
              {activeAttack === 'FDIA_FREQ' && <span className="badge badge-danger">ACTIVE</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Spoofs PMU telemetry to inject a fake under-frequency dip (48.85 Hz) to deceive SCADA into shedding agricultural feeders.
            </p>
            <button
              className="btn-demo"
              onClick={() => handleLaunchAttack('FDIA_FREQ')}
              disabled={activeAttack === 'FDIA_FREQ'}
              style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            >
              Inject FDIA Frequency Dip (48.85 Hz)
            </button>
          </div>

          {/* Attack 2: Overcurrent Surge on Hospital Feed */}
          <div 
            style={{ 
              background: activeAttack === 'SURGE_FDR3' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-stat-box)', 
              border: `1px solid ${activeAttack === 'SURGE_FDR3' ? '#ef4444' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.88rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} /> Sensor Current Surge Spoof
              </strong>
              {activeAttack === 'SURGE_FDR3' && <span className="badge badge-danger">ACTIVE</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Injects synthetic 1,480A current spike onto Feeder 3 (Hospital / Metro line) to trigger false overcurrent protection trip.
            </p>
            <button
              className="btn-demo"
              onClick={() => handleLaunchAttack('SURGE_FDR3')}
              disabled={activeAttack === 'SURGE_FDR3'}
              style={{ width: '100%', borderColor: '#f59e0b', color: '#f59e0b' }}
            >
              Spoof 1,480A Surge on Hospital Feeder
            </button>
          </div>

          {/* Attack 3: MitM Replay */}
          <div 
            style={{ 
              background: activeAttack === 'MITM_REPLAY' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-stat-box)', 
              border: `1px solid ${activeAttack === 'MITM_REPLAY' ? '#ef4444' : 'var(--border-subtle)'}`,
              borderRadius: '10px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.88rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={15} /> MitM Replay Trip Command
              </strong>
              {activeAttack === 'MITM_REPLAY' && <span className="badge badge-danger">ACTIVE</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Replays recorded SCADA IEC 60870-5-104 trip command packet attempting to open Bus Incomer breaker without operator permit.
            </p>
            <button
              className="btn-demo"
              onClick={() => handleLaunchAttack('MITM_REPLAY')}
              disabled={activeAttack === 'MITM_REPLAY'}
              style={{ width: '100%', borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              Replay Rogue SCADA Trip Packet
            </button>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Telemetry: Raw Ingested vs State Estimated (PI-SE) */}
      <div className="grid-2col" style={{ gap: '20px' }}>
        {/* Raw Ingested Wire Telemetry */}
        <div className="grid-card" style={{ padding: '22px', borderTop: `3px solid ${activeAttack && !cyberShieldActive ? '#ef4444' : 'var(--border-subtle)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="#38bdf8" />
              Raw Ingested Sensor Telemetry (Unfiltered)
            </h4>
            <span className="badge badge-info">PRE-FILTER BUFFER</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Direct edge packets arriving over station bus before physics validation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>INGESTED FREQUENCY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: rawFrequency < 49.5 ? '#ef4444' : '#10b981' }}>
                {rawFrequency.toFixed(2)} Hz
              </div>
              <div style={{ fontSize: '0.68rem', color: rawFrequency < 49.5 ? '#ef4444' : 'var(--text-muted)' }}>
                {rawFrequency < 49.5 ? '⚠️ SPOOFED DIP DETECTED' : 'Nominal Grid Frequency'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>FEEDER 3 (HOSPITAL) CURRENT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: rawCurrentFdr3 > 900 ? '#ef4444' : 'var(--text-primary)' }}>
                {rawCurrentFdr3.toFixed(1)} A
              </div>
              <div style={{ fontSize: '0.68rem', color: rawCurrentFdr3 > 900 ? '#ef4444' : 'var(--text-muted)' }}>
                {rawCurrentFdr3 > 900 ? '⚠️ INGESTED FALSE OVERCURRENT' : 'Balanced Critical Load'}
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographically Verified & State Estimated (PI-SE) */}
        <div className="grid-card" style={{ padding: '22px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#10b981" />
              Verified State Estimation (PI-SE)
            </h4>
            <span className="badge badge-success">IEC 62351 VALIDATED</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Harmonized operating values forwarded to SCADA actuators after Chi-Square test.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DISPATCH FREQUENCY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
                {verifiedFrequency.toFixed(2)} Hz
              </div>
              <div style={{ fontSize: '0.68rem', color: '#10b981' }}>
                {cyberShieldActive && activeAttack === 'FDIA_FREQ' ? '🛡️ Attack Blocked • True 50.00 Hz Preserved' : 'Statutory IEGC Operating Band'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DISPATCH CURRENT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
                {verifiedCurrentFdr3.toFixed(1)} A
              </div>
              <div style={{ fontSize: '0.68rem', color: '#10b981' }}>
                {cyberShieldActive && activeAttack === 'SURGE_FDR3' ? '🛡️ Surge Filtered • Breaker Stayed Closed' : 'Safe Operating Headroom'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quarantined Nodes & CERT-In Incident Stream */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={17} color="#8b5cf6" />
          CERT-In Cyber Incident Audit Trail & Quarantined Edge RTUs
        </h4>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Real-time log of security events, intercepted packet replays, and zero-trust isolated network interfaces.
        </div>

        {quarantinedNodes.length > 0 && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>
              ⚠️ Quarantined Devices: {quarantinedNodes.join(', ')}
            </span>
            <button
              className="btn-demo"
              onClick={() => setQuarantinedNodes([])}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              Restore Node Access
            </button>
          </div>
        )}

        <div style={{ background: 'var(--bg-stat-box)', borderRadius: '8px', padding: '12px 16px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', border: '1px solid var(--border-subtle)' }}>
          {cyberAuditLog.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '6px', color: item.type === 'CRITICAL' ? '#ef4444' : item.type === 'SUCCESS' ? '#10b981' : item.type === 'WARNING' ? '#f59e0b' : 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>[{item.time}]</span>
              <span style={{ fontWeight: 'bold' }}>[{item.type}]</span>
              <span>{item.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
