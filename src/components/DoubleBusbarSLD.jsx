import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { playBreakerCloseSound, playBreakerTripSound } from '../utils/audioEffects';

export const DoubleBusbarSLD = () => {
  const { substation } = useGrid();

  // Bus Coupler & Feeder Bay Switchgear States
  const [busCouplerClosed, setBusCouplerClosed] = useState(false);

  const [feederBays, setFeederBays] = useState({
    'FDR-01': { name: 'Industrial Hub Feeder', isolatorA: true, isolatorB: false, breaker: true, loadMw: 6.20 },
    'FDR-02': { name: 'Residential Metro Feeder', isolatorA: true, isolatorB: false, breaker: true, loadMw: 5.10 },
    'FDR-03': { name: 'Hospital Critical Feeder', isolatorA: true, isolatorB: false, breaker: true, loadMw: 7.10 },
    'FDR-04': { name: 'Agricultural 11kV Feeder', isolatorA: true, isolatorB: false, breaker: true, loadMw: 4.15 },
  });

  const [transferStep, setTransferStep] = useState(0); // 0: Idle, 1: Coupler Closed, 2: Isolator B Closed, 3: Isolator A Opened, 4: Done

  // Toggle individual feeder breaker
  const toggleBreaker = (feederId) => {
    setFeederBays(prev => {
      const current = prev[feederId];
      const nextBreaker = !current.breaker;
      if (nextBreaker) playBreakerCloseSound();
      else playBreakerTripSound();
      return {
        ...prev,
        [feederId]: { ...current, breaker: nextBreaker }
      };
    });
  };

  // Toggle Bus Coupler
  const toggleBusCoupler = () => {
    if (!busCouplerClosed) playBreakerCloseSound();
    else playBreakerTripSound();
    setBusCouplerClosed(prev => !prev);
  };

  // Automated On-Load Bus Transfer Sequence for Feeder 1
  const runOnLoadBusTransfer = () => {
    // Step 1: Close Bus Coupler
    setTransferStep(1);
    setBusCouplerClosed(true);
    playBreakerCloseSound();

    // Step 2: Close Isolator B (parallel)
    setTimeout(() => {
      setTransferStep(2);
      setFeederBays(prev => ({
        ...prev,
        'FDR-01': { ...prev['FDR-01'], isolatorB: true }
      }));
      playBreakerCloseSound();

      // Step 3: Open Isolator A
      setTimeout(() => {
        setTransferStep(3);
        setFeederBays(prev => ({
          ...prev,
          'FDR-01': { ...prev['FDR-01'], isolatorA: false }
        }));
        playBreakerTripSound();

        // Step 4: Open Bus Coupler
        setTimeout(() => {
          setTransferStep(4);
          setBusCouplerClosed(false);
          playBreakerTripSound();

          setTimeout(() => setTransferStep(0), 4000);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="double-busbar-sld-view">
      {/* 1. Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #8b5cf6', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-purple" style={{ fontWeight: 'bold' }}>IEC 61850 SUBSTATION DIGITAL TWIN</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mayur Vihar 66/11kV Bay Topology • Double Busbar Transfer Switchgear
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={26} color="#8b5cf6" />
              Substation Digital Twin: Double-Busbar Single-Line Diagram (SLD)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              High-fidelity single-line bay schematic featuring Main Bus A, Transfer Bus B, Bus Coupler (CB-BC), and motorized selector disconnectors enabling zero-interruption on-load maintenance transfers.
            </p>
          </div>

          {/* Transfer Button */}
          <div>
            <button
              onClick={runOnLoadBusTransfer}
              disabled={transferStep > 0}
              style={{
                background: transferStep > 0 ? 'var(--track-bg)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                padding: '11px 20px',
                borderRadius: '8px',
                cursor: transferStep > 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
              }}
            >
              <ArrowRightLeft size={16} />
              {transferStep > 0 ? `Transfer Step ${transferStep}/4 Executing...` : 'Simulate On-Load Bus Transfer (FDR-01 to Bus B)'}
            </button>
          </div>
        </div>

        {/* Busbar Health Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAIN BUS A VOLTAGE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>11.08 kV</div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>● ENERGIZED (Active Supply)</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>TRANSFER BUS B VOLTAGE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: busCouplerClosed || Object.values(feederBays).some(f => f.isolatorB) ? '#10b981' : '#f59e0b' }}>
              {busCouplerClosed || Object.values(feederBays).some(f => f.isolatorB) ? '11.08 kV' : '0.00 kV'}
            </div>
            <div style={{ fontSize: '0.65rem', color: busCouplerClosed ? '#10b981' : 'var(--text-secondary)' }}>
              {busCouplerClosed ? '● COUPLED & ENERGIZED' : '○ STANDBY RESERVE BUS'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>BUS COUPLER (CB-BC)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: busCouplerClosed ? '#10b981' : '#ef4444' }}>
              {busCouplerClosed ? 'CLOSED' : 'OPEN'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Interlock Protected Tie</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>INTERLOCK STATUS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              VERIFIED
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Mechanical & Electrical Permits OK</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Schematic of Double Busbar */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '8px' }}>
          Interactive 66kV/11kV Switchyard Bay Architecture
        </h4>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Click on any breaker or bus selector isolator to operate switchgear under interlocking rules.
        </div>

        {/* SVG SLD */}
        <div style={{ background: 'var(--bg-stat-box)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
          <svg viewBox="0 0 820 320" style={{ width: '100%', minWidth: '700px', height: 'auto', display: 'block' }}>
            {/* Bus A (Top Red Line) */}
            <line x1="60" y1="50" x2="760" y2="50" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <text x="70" y="40" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="var(--font-mono)">
              MAIN BUS A (11.08 kV)
            </text>

            {/* Bus B (Second Line) */}
            <line 
              x1="60" 
              y1="110" 
              x2="760" 
              y2="110" 
              stroke={busCouplerClosed || Object.values(feederBays).some(f => f.isolatorB) ? '#10b981' : '#f59e0b'} 
              strokeWidth="6" 
              strokeLinecap="round" 
            />
            <text x="70" y="100" fill={busCouplerClosed ? '#10b981' : '#f59e0b'} fontSize="12" fontWeight="bold" fontFamily="var(--font-mono)">
              TRANSFER BUS B (RESERVE)
            </text>

            {/* Bus Coupler Bay (Left: x=180) */}
            <g>
              <line x1="180" y1="50" x2="180" y2="70" stroke="#10b981" strokeWidth="3" />
              {/* Coupler Breaker Box */}
              <rect 
                x="166" 
                y="70" 
                width="28" 
                height="20" 
                fill={busCouplerClosed ? '#10b981' : '#ef4444'} 
                rx="4" 
                cursor="pointer"
                onClick={toggleBusCoupler}
              />
              <text x="180" y="84" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                {busCouplerClosed ? 'CB' : 'CB'}
              </text>
              <line x1="180" y1="90" x2="180" y2="110" stroke={busCouplerClosed ? '#10b981' : '#f59e0b'} strokeWidth="3" />
              <text x="180" y="130" fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                CB-BC (Coupler)
              </text>
            </g>

            {/* 4 Feeder Bays (x = 300, 420, 540, 660) */}
            {Object.entries(feederBays).map(([id, bay], i) => {
              const x = 300 + i * 120;
              const isEnergized = bay.breaker && (bay.isolatorA || (bay.isolatorB && busCouplerClosed));

              return (
                <g key={id}>
                  {/* Selector Isolator A Link */}
                  <line x1={x - 15} y1="50" x2={x - 15} y2="130" stroke={bay.isolatorA ? '#10b981' : 'var(--border-subtle)'} strokeWidth="2.5" />
                  {/* Selector Isolator B Link */}
                  <line x1={x + 15} y1="110" x2={x + 15} y2="130" stroke={bay.isolatorB ? '#10b981' : 'var(--border-subtle)'} strokeWidth="2.5" />

                  {/* Isolator A Switch representation */}
                  <circle cx={x - 15} cy="65" r="4" fill={bay.isolatorA ? '#10b981' : '#ef4444'} />
                  {/* Isolator B Switch representation */}
                  <circle cx={x + 15} cy="120" r="4" fill={bay.isolatorB ? '#10b981' : '#ef4444'} />

                  {/* Junction line down to breaker */}
                  <line x1={x - 15} y1="130" x2={x + 15} y2="130" stroke={bay.isolatorA || bay.isolatorB ? '#10b981' : 'var(--border-subtle)'} strokeWidth="2.5" />
                  <line x1={x} y1="130" x2={x} y2="160" stroke={bay.isolatorA || bay.isolatorB ? '#10b981' : 'var(--border-subtle)'} strokeWidth="2.5" />

                  {/* Feeder Breaker Box */}
                  <rect
                    x={x - 16}
                    y="160"
                    width="32"
                    height="24"
                    fill={bay.breaker ? '#10b981' : '#ef4444'}
                    rx="4"
                    cursor="pointer"
                    onClick={() => toggleBreaker(id)}
                  />
                  <text x={x} y="176" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {bay.breaker ? 'ON' : 'TRIP'}
                  </text>

                  {/* Outgoing Cable Line */}
                  <line x1={x} y1="184" x2={x} y2="230" stroke={isEnergized ? '#10b981' : 'var(--border-subtle)'} strokeWidth="3" />

                  {/* Outgoing Feeder Arrow & Label */}
                  <polygon points={`${x},242 ${x - 6},230 ${x + 6},230`} fill={isEnergized ? '#10b981' : 'var(--border-subtle)'} />
                  <text x={x} y="260" fill="var(--text-primary)" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                    {id}
                  </text>
                  <text x={x} y="275" fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                    {bay.loadMw} MW
                  </text>
                  <text x={x} y="290" fill={bay.isolatorA && !bay.isolatorB ? '#10b981' : bay.isolatorB && !bay.isolatorA ? '#8b5cf6' : '#f59e0b'} fontSize="9" fontWeight="bold" textAnchor="middle">
                    {bay.isolatorA && !bay.isolatorB ? 'Bus A' : bay.isolatorB && !bay.isolatorA ? 'Bus B (Transferred)' : 'Paralleled'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
