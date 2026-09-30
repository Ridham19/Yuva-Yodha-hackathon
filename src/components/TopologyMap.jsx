import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  Zap, 
  Sun, 
  Wind, 
  BatteryCharging, 
  Layers, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert,
  Info
} from 'lucide-react';

export const TopologyMap = () => {
  const { 
    substation, 
    feeders, 
    renewables, 
    flisrActive, 
    flisrStage,
    toggleBreaker,
    toggleTieSwitch 
  } = useGrid();

  const [selectedElement, setSelectedElement] = useState(null);

  const f1 = feeders.find(f => f.id === 'FDR-01');
  const f2 = feeders.find(f => f.id === 'FDR-02');
  const f3 = feeders.find(f => f.id === 'FDR-03');
  const f4 = feeders.find(f => f.id === 'FDR-04');

  const isTieClosed = f1?.tieSwitchState === 'CLOSED';
  const isF2Faulted = f2?.status === 'FAULTED';
  const isF2Isolated = f2?.status === 'ISOLATED';
  const isF2Restored = f2?.status === 'RESTORED';

  return (
    <div className="grid-card" style={{ padding: '24px', position: 'relative' }} id="topology-map-view">
      {/* View Title & Quick Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#38bdf8" />
            Substation & Feeder GIS Topology
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Interactive single-line diagram with real-time SCADA switch states and FLISR rerouting vectors.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span> Energized
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span> Faulted Section
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }}></span> Tie-Restored
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06b6d4' }}></span> Solar/Wind Feed
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div style={{ background: '#090e1a', borderRadius: '10px', border: '1px solid var(--border-subtle)', overflow: 'hidden', position: 'relative' }}>
        <svg 
          viewBox="0 0 1000 560" 
          style={{ width: '100%', height: 'auto', display: 'block', minHeight: '440px' }}
        >
          <defs>
            {/* Glow Filters */}
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ef4444" floodOpacity="0.9" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.8" />
            </filter>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.8" />
            </filter>

            {/* Electrical flow animations */}
            <style>{`
              @keyframes dashFlow {
                to { stroke-dashoffset: -40; }
              }
              .power-flow-line {
                stroke-dasharray: 6 4;
                animation: dashFlow 1.2s linear infinite;
              }
              .reverse-flow-line {
                stroke-dasharray: 6 4;
                animation: dashFlow 1.2s linear infinite reverse;
              }
              .fault-pulse {
                animation: faultFlash 0.8s ease-in-out infinite alternate;
              }
              @keyframes faultFlash {
                from { opacity: 0.3; }
                to { opacity: 1; }
              }
            `}</style>
          </defs>

          {/* Grid Background Pattern */}
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
          </pattern>
          <rect width="1000" height="560" fill="url(#grid-pattern)" />

          {/* 1. MAIN 66/11kV SUBSTATION BUSBAR (Center Left) */}
          <g transform="translate(180, 260)" onClick={() => setSelectedElement('SUBSTATION')} style={{ cursor: 'pointer' }}>
            <rect x="-80" y="-120" width="160" height="240" rx="10" fill="var(--bg-card)" stroke="#38bdf8" strokeWidth="2" filter="url(#glow-cyan)" />
            <text x="0" y="-85" textAnchor="middle" fill="#38bdf8" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13">
              MAYUR VIHAR SS
            </text>
            <text x="0" y="-68" textAnchor="middle" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10">
              66/11 kV • 31.5 MVA
            </text>

            {/* Substation Busbars */}
            <line x1="-60" y1="-30" x2="60" y2="-30" stroke="var(--text-primary)" strokeWidth="4" />
            <text x="0" y="-15" textAnchor="middle" fill="var(--text-muted)" fontSize="9">11kV MAIN BUS-A</text>
            <line x1="-60" y1="30" x2="60" y2="30" stroke="var(--text-primary)" strokeWidth="4" />
            <text x="0" y="45" textAnchor="middle" fill="var(--text-muted)" fontSize="9">11kV MAIN BUS-B</text>

            <circle cx="0" cy="80" r="16" fill="var(--bg-stat-box)" stroke="#10b981" strokeWidth="2" />
            <text x="0" y="84" textAnchor="middle" fill="#10b981" fontFamily="var(--font-mono)" fontWeight="700" fontSize="11">
              TR-1/2
            </text>
          </g>

          {/* 2. RENEWABLES & BESS (Top Left) */}
          {/* Solar Plant */}
          <g transform="translate(70, 70)" onClick={() => setSelectedElement('SOLAR')} style={{ cursor: 'pointer' }}>
            <rect x="-50" y="-35" width="100" height="70" rx="8" fill="var(--bg-card)" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="0" cy="-8" r="12" fill="rgba(245, 158, 11, 0.2)" />
            <text x="0" y="-4" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">☀️ SOLAR</text>
            <text x="0" y="16" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600">
              {renewables.solarOutputMw} MW
            </text>
            <path d="M 50 0 L 100 0 L 100 200 L 140 200" fill="none" stroke="#f59e0b" strokeWidth="2" className="power-flow-line" />
          </g>

          {/* Wind Plant */}
          <g transform="translate(70, 460)" onClick={() => setSelectedElement('WIND')} style={{ cursor: 'pointer' }}>
            <rect x="-50" y="-35" width="100" height="70" rx="8" fill="var(--bg-card)" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="0" y="-4" textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="bold">💨 WIND</text>
            <text x="0" y="16" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="600">
              {renewables.windOutputMw} MW
            </text>
            <path d="M 50 0 L 100 0 L 100 -140 L 140 -140" fill="none" stroke="#06b6d4" strokeWidth="2" className="power-flow-line" />
          </g>

          {/* BESS Storage */}
          <g transform="translate(180, 470)" onClick={() => setSelectedElement('BESS')} style={{ cursor: 'pointer' }}>
            <rect x="-65" y="-30" width="130" height="60" rx="8" fill="var(--bg-card)" stroke="#10b981" strokeWidth="1.5" />
            <text x="0" y="-8" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold">🔋 BESS STORAGE</text>
            <text x="0" y="12" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="10">
              {renewables.bessCurrentSoCPct}% SoC • {renewables.bessOutputMw > 0 ? `+${renewables.bessOutputMw} MW` : 'Standby'}
            </text>
            <line x1="0" y1="-30" x2="0" y2="-90" stroke="#10b981" strokeWidth="2" />
          </g>

          {/* ========================================================================= */}
          {/* FEEDER 1: INDUSTRIAL HUB (Runs Across Upper Grid)                         */}
          {/* ========================================================================= */}
          <g onClick={() => setSelectedElement('FDR-01')} style={{ cursor: 'pointer' }}>
            {/* Feeder line from Substation */}
            <path 
              d="M 260 200 L 360 200 L 450 140 L 850 140" 
              fill="none" 
              stroke={f1.breakerState === 'CLOSED' ? '#10b981' : '#64748b'} 
              strokeWidth="4" 
              className={f1.breakerState === 'CLOSED' ? "power-flow-line" : ""}
            />

            {/* Breaker CB-01 */}
            <rect x="330" y="185" width="28" height="30" rx="4" fill={f1.breakerState === 'CLOSED' ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
            <text x="344" y="204" textAnchor="middle" fill="#fff" fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold">CB1</text>

            {/* Industrial Loads */}
            <g transform="translate(620, 140)">
              <rect x="-40" y="-45" width="80" height="35" rx="6" fill="var(--bg-stat-box)" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="-30" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Sector 62 Fab</text>
              <text x="0" y="-16" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="bold">3.4 MW</text>
              <line x1="0" y1="-10" x2="0" y2="0" stroke="#10b981" strokeWidth="2" />
            </g>

            <g transform="translate(800, 140)">
              <rect x="-40" y="-45" width="80" height="35" rx="6" fill="var(--bg-stat-box)" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="-30" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Auto Plant</text>
              <text x="0" y="-16" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="10" fontWeight="bold">3.2 MW</text>
              <line x1="0" y1="-10" x2="0" y2="0" stroke="#10b981" strokeWidth="2" />
            </g>

            <text x="460" y="125" fill="#38bdf8" fontFamily="var(--font-heading)" fontWeight="700" fontSize="12">
              FEEDER 01: INDUSTRIAL HUB ({f1.activePowerMw} MW)
            </text>
          </g>

          {/* ========================================================================= */}
          {/* FEEDER 2: RESIDENTIAL (FLISR Self-Healing Showcase Zone)                  */}
          {/* ========================================================================= */}
          <g onClick={() => setSelectedElement('FDR-02')} style={{ cursor: 'pointer' }}>
            {/* Section A Line (Substation to SW-2A) */}
            <path 
              d="M 260 240 L 360 240 L 450 250 L 520 250" 
              fill="none" 
              stroke={f2.breakerState === 'CLOSED' ? '#10b981' : '#ef4444'} 
              strokeWidth="4" 
              className={f2.breakerState === 'CLOSED' ? "power-flow-line" : ""}
            />

            {/* Breaker CB-02 */}
            <rect x="330" y="225" width="28" height="30" rx="4" fill={f2.breakerState === 'CLOSED' ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
            <text x="344" y="244" textAnchor="middle" fill="#fff" fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold">CB2</text>

            {/* Section A Consumers */}
            <g transform="translate(480, 250)">
              <rect x="-35" y="15" width="70" height="32" rx="4" fill="var(--bg-stat-box)" stroke={f2.sections?.[0]?.status === 'DE_ENERGIZED' ? '#ef4444' : '#10b981'} strokeWidth="1" />
              <text x="0" y="28" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Block A-C</text>
              <text x="0" y="40" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="9">1,400 Users</text>
              <line x1="0" y1="0" x2="0" y2="15" stroke="#10b981" strokeWidth="2" />
            </g>

            {/* Sectionalizer SW-2A */}
            <circle cx="530" cy="250" r="10" fill={isF2Isolated || isF2Restored ? '#ef4444' : '#10b981'} stroke="#fff" strokeWidth="1" />
            <text x="530" y="275" textAnchor="middle" fill="var(--text-muted)" fontSize="9">SW-2A</text>

            {/* Section B Line (FAULTED ZONE) */}
            <path 
              d="M 540 250 L 680 250" 
              fill="none" 
              stroke={isF2Faulted || isF2Isolated || isF2Restored ? '#ef4444' : '#10b981'} 
              strokeWidth={isF2Faulted || isF2Isolated || isF2Restored ? "6" : "4"} 
              strokeDasharray={isF2Faulted ? "6 2" : "none"}
              className={isF2Faulted ? "fault-pulse" : ""}
            />

            {/* Fault Beacon Icon if faulted */}
            {(isF2Faulted || isF2Isolated || isF2Restored) && (
              <g transform="translate(610, 250)">
                <circle cx="0" cy="0" r="18" fill="rgba(239, 68, 68, 0.3)" filter="url(#glow-red)" />
                <polygon points="0,-10 9,6 -9,6" fill="#ef4444" />
                <text x="0" y="24" textAnchor="middle" fill="#ef4444" fontFamily="var(--font-mono)" fontWeight="bold" fontSize="10">
                  ⚡ FAULT ISOLATED
                </text>
              </g>
            )}

            {/* Sectionalizer SW-2B */}
            <circle cx="690" cy="250" r="10" fill={isF2Isolated || isF2Restored ? '#ef4444' : '#10b981'} stroke="#fff" strokeWidth="1" />
            <text x="690" y="275" textAnchor="middle" fill="var(--text-muted)" fontSize="9">SW-2B</text>

            {/* Section C Line (Downstream Residential) */}
            <path 
              d="M 700 250 L 850 250" 
              fill="none" 
              stroke={isF2Restored && isTieClosed ? '#8b5cf6' : (isF2Faulted || isF2Isolated ? '#64748b' : '#10b981')} 
              strokeWidth="4" 
              className={isF2Restored && isTieClosed ? "reverse-flow-line" : ""}
            />

            {/* Section C Consumers */}
            <g transform="translate(780, 250)">
              <rect x="-35" y="15" width="70" height="32" rx="4" fill="var(--bg-stat-box)" stroke={isF2Restored ? '#8b5cf6' : '#64748b'} strokeWidth="1" />
              <text x="0" y="28" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Block D-G</text>
              <text x="0" y="40" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="9">2,100 Users</text>
              <line x1="0" y1="0" x2="0" y2="15" stroke={isF2Restored ? '#8b5cf6' : '#64748b'} strokeWidth="2" />
            </g>

            <text x="460" y="235" fill="var(--text-primary)" fontFamily="var(--font-heading)" fontWeight="700" fontSize="12">
              FEEDER 02: URBAN RESIDENTIAL (FLISR LOOP)
            </text>
          </g>

          {/* ========================================================================= */}
          {/* TIE-SWITCH (TS-1-2) BETWEEN FDR-01 AND FDR-02 SECTION C                   */}
          {/* ========================================================================= */}
          <g transform="translate(850, 195)" onClick={() => toggleTieSwitch('TS-1-2')} style={{ cursor: 'pointer' }}>
            {/* Tie interconnect line */}
            <line 
              x1="0" y1="-55" x2="0" y2="55" 
              stroke={isTieClosed ? '#8b5cf6' : '#64748b'} 
              strokeWidth="4" 
              strokeDasharray={isTieClosed ? "none" : "6 4"}
              className={isTieClosed ? "reverse-flow-line" : ""}
            />
            {/* Tie-Switch Symbol Box */}
            <rect 
              x="-24" y="-18" width="48" height="36" rx="6" 
              fill={isTieClosed ? '#8b5cf6' : 'var(--bg-stat-box)'} 
              stroke={isTieClosed ? '#8b5cf6' : 'var(--border-medium)'} 
              strokeWidth="1.5" 
              filter={isTieClosed ? "url(#glow-purple)" : "none"}
            />
            <text x="0" y="-3" textAnchor="middle" fill={isTieClosed ? '#fff' : 'var(--text-primary)'} fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold">
              TS-1-2
            </text>
            <text x="0" y="10" textAnchor="middle" fill={isTieClosed ? '#fff' : 'var(--text-muted)'} fontSize="8">
              {isTieClosed ? "CLOSED" : "N/O"}
            </text>
            <text x="32" y="3" textAnchor="start" fill={isTieClosed ? '#8b5cf6' : 'var(--text-muted)'} fontFamily="var(--font-mono)" fontSize="9">
              {isTieClosed ? "⚡ Back-feeding F2 from F1" : "Normally Open"}
            </text>
          </g>

          {/* ========================================================================= */}
          {/* FEEDER 3: TECH PARK & HOSPITAL (Critical Load)                            */}
          {/* ========================================================================= */}
          <g onClick={() => setSelectedElement('FDR-03')} style={{ cursor: 'pointer' }}>
            <path 
              d="M 260 280 L 360 280 L 450 350 L 850 350" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="4" 
              className="power-flow-line"
            />
            {/* Breaker CB-03 */}
            <rect x="330" y="265" width="28" height="30" rx="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
            <text x="344" y="284" textAnchor="middle" fill="#fff" fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold">CB3</text>

            <g transform="translate(680, 350)">
              <rect x="-45" y="15" width="90" height="32" rx="4" fill="var(--bg-stat-box)" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="28" textAnchor="middle" fill="var(--text-accent)" fontSize="8">🏥 Metro Hospital</text>
              <text x="0" y="40" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="9">Critical Priority</text>
              <line x1="0" y1="0" x2="0" y2="15" stroke="#10b981" strokeWidth="2" />
            </g>

            <text x="460" y="335" fill="var(--text-accent)" fontFamily="var(--font-heading)" fontWeight="700" fontSize="12">
              FEEDER 03: TECH PARK & HOSPITAL ({f3?.activePowerMw} MW)
            </text>
          </g>

          {/* ========================================================================= */}
          {/* FEEDER 4: AGRI & EV CHARGING (Automatic Demand Response eligible)         */}
          {/* ========================================================================= */}
          <g onClick={() => setSelectedElement('FDR-04')} style={{ cursor: 'pointer' }}>
            <path 
              d="M 260 320 L 360 320 L 450 440 L 850 440" 
              fill="none" 
              stroke={f4?.isDemandResponseActive ? '#ef4444' : (f4?.breakerState === 'CLOSED' ? '#10b981' : '#64748b')} 
              strokeWidth="4" 
              className={!f4?.isDemandResponseActive && f4?.breakerState === 'CLOSED' ? "power-flow-line" : ""}
            />
            {/* Breaker CB-04 */}
            <rect x="330" y="305" width="28" height="30" rx="4" fill={f4?.breakerState === 'CLOSED' ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
            <text x="344" y="324" textAnchor="middle" fill="#fff" fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold">CB4</text>

            <g transform="translate(680, 440)">
              <rect x="-45" y="15" width="90" height="32" rx="4" fill="var(--bg-stat-box)" stroke={f4?.isDemandResponseActive ? '#ef4444' : '#10b981'} strokeWidth="1" />
              <text x="0" y="28" textAnchor="middle" fill={f4?.isDemandResponseActive ? '#ef4444' : 'var(--text-muted)'} fontSize="8">
                {f4?.isDemandResponseActive ? "SHED VIA ADR" : "⚡ EV Fast Hub + Agri"}
              </text>
              <text x="0" y="40" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="9">
                {f4?.isDemandResponseActive ? "0.0 MW" : "4.15 MW"}
              </text>
              <line x1="0" y1="0" x2="0" y2="15" stroke={f4?.isDemandResponseActive ? '#ef4444' : '#10b981'} strokeWidth="2" />
            </g>

            <text x="460" y="425" fill="#f59e0b" fontFamily="var(--font-heading)" fontWeight="700" fontSize="12">
              FEEDER 04: AGRI & EV CHARGING (ADR Eligible: {f4?.isDemandResponseActive ? 'SHED' : 'NORMAL'})
            </text>
          </g>
        </svg>

        {/* Live FLISR Status Floating Banner */}
        {flisrActive && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: 'var(--bg-glass)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '380px',
            animation: 'fadeIn 0.3s ease',
            color: 'var(--text-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
              <AlertOctagon size={18} />
              FLISR Self-Healing Automation Active
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current Stage: <strong style={{ color: 'var(--text-accent)' }}>{flisrStage}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {flisrStage === 'DETECTION' && "Detecting overcurrent surge on Feeder 2 Section B..."}
              {flisrStage === 'ISOLATION' && "Motorized sectionalizers SW-2A & SW-2B opening to isolate faulty zone..."}
              {flisrStage === 'RESTORATION' && "Reclosing CB-02 and initiating tie-switch TS-1-2 transfer..."}
              {flisrStage === 'RESTORED' && "All healthy customer sections fully energized via self-healing loop!"}
            </div>
          </div>
        )}
      </div>

      {/* Selected Element Quick Telemetry Bottom Drawer */}
      {selectedElement && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', color: 'var(--text-primary)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELECTED NODE:</span>{' '}
            <strong style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>{selectedElement}</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {selectedElement.startsWith('FDR') && (
              <button 
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => toggleBreaker(selectedElement)}
              >
                Trip / Close Breaker
              </button>
            )}
            <button 
              className="btn-outline" 
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setSelectedElement(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
