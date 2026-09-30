import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  ShieldCheck, 
  Power, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock,
  Radio,
  Clock,
  ZapOff,
  UserCheck,
  FileText,
  Terminal,
  Activity
} from 'lucide-react';

const OPERATORS = [
  { id: "DISCOM-ENG-402", label: "DISCOM-ENG-402 (Senior Dispatcher)", role: "Senior Dispatcher" },
  { id: "SCADA-OPS-109", label: "SCADA-OPS-109 (Protection Engineer)", role: "Protection Engineer" },
  { id: "FIELD-OFFICER-55", label: "FIELD-OFFICER-55 (Substation Lead)", role: "Substation Lead" },
  { id: "AUTONOMOUS-FLISR", label: "AUTONOMOUS-FLISR (AI Agent Core)", role: "SCADA Automation Core" }
];

export const ControlCenter = () => {
  const { 
    feeders, 
    thresholds, 
    updateThreshold, 
    toggleBreaker, 
    toggleTieSwitch, 
    toggleDemandResponse,
    alarms,
    breakerOperationLog,
    isAutoAdrArmed,
    setIsAutoAdrArmed
  } = useGrid();

  // Safety Confirmation Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { feederId, targetState, name }
  const [selectedOperatorId, setSelectedOperatorId] = useState("DISCOM-ENG-402");
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  const selectedOperator = OPERATORS.find(o => o.id === selectedOperatorId) || OPERATORS[0];

  const f1 = feeders.find(f => f.id === 'FDR-01');
  const f4 = feeders.find(f => f.id === 'FDR-04');
  const isTieClosed = f1?.tieSwitchState === 'CLOSED';

  const initiateBreakerAction = (feeder) => {
    const nextState = feeder.breakerState === 'CLOSED' ? 'TRIP' : 'CLOSE';
    setPendingAction({
      feederId: feeder.id,
      feederName: feeder.name,
      currentState: feeder.breakerState,
      targetState: nextState
    });
    setSafetyConfirmed(false);
    setModalOpen(true);
  };

  const confirmBreakerAction = () => {
    if (!safetyConfirmed || !pendingAction) return;
    toggleBreaker(pendingAction.feederId, selectedOperator.id, selectedOperator.role);
    setModalOpen(false);
    setPendingAction(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="control-center-view">
      {/* Top Banner: Supervisory Remote Tele-Control */}
      <div className="grid-card" style={{ padding: '20px', borderLeft: '4px solid #38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} color="#38bdf8" />
              Substation Tele-Control & Switchgear Interlocks
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              IEC 61850 compliant remote breaker switching with role-based safety confirmations and automatic interlock validations.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-stat-box)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <UserCheck size={16} color="var(--text-accent)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator:</span>
              <select 
                value={selectedOperatorId} 
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                style={{ background: 'transparent', color: 'var(--text-accent)', border: 'none', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
              >
                {OPERATORS.map(op => (
                  <option key={op.id} value={op.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> Interlocks Armed & Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        {/* Left Column: Remote Breaker Switching Panel */}
        <div className="grid-card" style={{ padding: '20px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Power size={18} color="#10b981" />
            11 kV Circuit Breaker Actuation (CB-01 to CB-04)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feeders.map(feeder => {
              const isClosed = feeder.breakerState === 'CLOSED';
              return (
                <div 
                  key={feeder.id}
                  style={{
                    background: 'var(--bg-stat-box)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 'bold' }}>
                        {feeder.id}
                      </span>
                      <strong style={{ fontSize: '0.9rem' }}>{feeder.name}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Status: <span style={{ color: isClosed ? '#10b981' : '#ef4444', fontWeight: '600' }}>{feeder.breakerState}</span> • Load: {feeder.activePowerMw} MW
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${isClosed ? 'badge-success' : 'badge-danger'}`}>
                      {isClosed ? 'ENERGIZED' : 'OPEN / SAFE'}
                    </span>
                    <button
                      className={isClosed ? 'btn-danger' : 'btn-primary'}
                      style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      onClick={() => initiateBreakerAction(feeder)}
                    >
                      <Power size={13} />
                      {isClosed ? 'Trip CB' : 'Close CB'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Motorized Tie-Switch & Demand Response Section */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Auxiliary Switchgear & Demand Response
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Tie-Switch TS-1-2 */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#c4b5fd' }}>
                    Motorized Tie-Switch (TS-1-2)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Interconnects Feeder 1 & Feeder 2 for outage rerouting
                  </div>
                </div>
                <button
                  className="btn-outline"
                  style={{ borderColor: '#8b5cf6', color: '#c4b5fd', fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => toggleTieSwitch('TS-1-2')}
                >
                  {isTieClosed ? 'Open Tie-Switch' : 'Close Tie-Switch'}
                </button>
              </div>

              {/* Automatic Demand Response (ADR) Toggle on Feeder 4 */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fbbf24' }}>
                    Automatic Demand Response (ADR)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Feeder 4 (Agri/EV) shed status: {f4?.isDemandResponseActive ? 'ACTIVATED (4.15 MW Shed)' : 'INACTIVE'}
                  </div>
                </div>
                <button
                  className={f4?.isDemandResponseActive ? 'btn-primary' : 'btn-danger'}
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => toggleDemandResponse('FDR-04', selectedOperator.id)}
                >
                  {f4?.isDemandResponseActive ? 'Restore Load' : 'Shed 4.15 MW'}
                </button>
              </div>

              {/* Auto-ADR Autonomous Frequency Guard Armed Switch */}
              <div style={{ background: isAutoAdrArmed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-stat-box)', border: isAutoAdrArmed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isAutoAdrArmed ? '#34d399' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> Autonomous ADR Frequency Guard
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Auto-sheds Agri Feeder if grid frequency dips below {thresholds.freqLowHz} Hz.
                  </div>
                </div>
                <button
                  className={isAutoAdrArmed ? "btn-primary" : "btn-outline"}
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => setIsAutoAdrArmed(!isAutoAdrArmed)}
                >
                  {isAutoAdrArmed ? "ARMED (Active)" : "DISARMED"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configurable Protection Thresholds */}
        <div className="grid-card" style={{ padding: '20px' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#38bdf8" />
            Configurable Protection Thresholds
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Automated trip and alarm setpoints calibrated for Indian Grid Code compliance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Frequency Low Threshold */}
            <div style={{ background: 'var(--bg-stat-box)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Under-Frequency Alarm Limit (Hz)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#f59e0b' }}>
                  {thresholds.freqLowHz} Hz
                </span>
              </div>
              <input 
                type="range" 
                min="49.50" 
                max="49.95" 
                step="0.05" 
                value={thresholds.freqLowHz} 
                onChange={(e) => updateThreshold('freqLowHz', e.target.value)}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>49.50 Hz</span>
                <span>Default: 49.85 Hz</span>
                <span>49.95 Hz</span>
              </div>
            </div>

            {/* Frequency High Threshold */}
            <div style={{ background: 'var(--bg-stat-box)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Over-Frequency Alarm Limit (Hz)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-accent)' }}>
                  {thresholds.freqHighHz} Hz
                </span>
              </div>
              <input 
                type="range" 
                min="50.05" 
                max="50.50" 
                step="0.05" 
                value={thresholds.freqHighHz} 
                onChange={(e) => updateThreshold('freqHighHz', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--text-accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>50.05 Hz</span>
                <span>Default: 50.20 Hz</span>
                <span>50.50 Hz</span>
              </div>
            </div>

            {/* Overcurrent Max (Amps) */}
            <div style={{ background: 'var(--bg-stat-box)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Feeder Overcurrent Trip Ceiling (A)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#ef4444' }}>
                  {thresholds.feederCurrentMaxA} A
                </span>
              </div>
              <input 
                type="range" 
                min="300" 
                max="500" 
                step="10" 
                value={thresholds.feederCurrentMaxA} 
                onChange={(e) => updateThreshold('feederCurrentMaxA', e.target.value)}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>300 A</span>
                <span>Standard 11kV limit: 420 A</span>
                <span>500 A</span>
              </div>
            </div>

            {/* Voltage Tolerance Slider */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voltage Tolerance Band (±%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#10b981' }}>
                  ±{thresholds.voltageTolerancePct}%
                </span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="10" 
                step="1" 
                value={thresholds.voltageTolerancePct} 
                onChange={(e) => updateThreshold('voltageTolerancePct', e.target.value)}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                <span>±3% (Tight)</span>
                <span>DISCOM Standard: ±6%</span>
                <span>±10% (Permissive)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breaker Operation & Interlock Audit Log (IEC 61850-7-4) */}
      <div className="grid-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#38bdf8" />
              Breaker Operation & Tele-Control Audit Log (IEC 61850-7-4)
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
              Supervisory switching trail recording operator credentials, mechanical interlock clearance, and tele-control dispatches.
            </p>
          </div>
          <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            {breakerOperationLog.length} Records In Memory
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Log ID</th>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Asset / Feeder</th>
                <th style={{ padding: '10px 12px' }}>Operation</th>
                <th style={{ padding: '10px 12px' }}>Operator ID & Role</th>
                <th style={{ padding: '10px 12px' }}>Interlock Status</th>
                <th style={{ padding: '10px 12px' }}>Protocol</th>
                <th style={{ padding: '10px 12px' }}>Telemetry</th>
              </tr>
            </thead>
            <tbody>
              {breakerOperationLog.slice(0, 10).map((log, idx) => {
                const isTrip = log.action === 'TRIP' || log.action === 'ADR_SHED' || log.action === 'ADR_AUTOSHED' || log.action === 'OPEN';
                return (
                  <tr 
                    key={log.id || idx} 
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'var(--bg-subtle)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{log.id}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>{log.timestamp}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>
                      {log.feederId} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.75rem' }}>({log.feederName})</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${isTrip ? 'badge-danger' : 'badge-success'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: '600' }}>{log.operator}</span>
                      {log.role && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.role}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#10b981', fontSize: '0.75rem' }}>
                      ✓ {log.interlockStatus || 'CLEAR & VALIDATED'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#8b5cf6' }}>
                      {log.protocol || 'IEC 61850 GOOSE'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>EXECUTED</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {modalOpen && pendingAction && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>
                High-Voltage Switchgear Actuation
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              You are issuing a direct remote command to <strong>{pendingAction.targetState}</strong> Circuit Breaker <strong>{pendingAction.feederId} ({pendingAction.feederName})</strong> on the live 11 kV bus.
            </p>

            <div style={{ background: 'var(--bg-stat-box)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}>
              <div><strong>Operator ID:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>{operatorId}</span></div>
              <div style={{ marginTop: '4px' }}><strong>Target Action:</strong> <span style={{ color: pendingAction.targetState === 'TRIP' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{pendingAction.targetState} BREAKER</span></div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '20px' }}>
              <input 
                type="checkbox" 
                checked={safetyConfirmed} 
                onChange={(e) => setSafetyConfirmed(e.target.checked)} 
                style={{ width: 16, height: 16, accentColor: '#ef4444' }}
              />
              I confirm that downstream line permits are verified and safety clearance is approved.
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn-outline" 
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className={pendingAction.targetState === 'TRIP' ? 'btn-danger' : 'btn-primary'}
                disabled={!safetyConfirmed}
                style={{ opacity: safetyConfirmed ? 1 : 0.4, cursor: safetyConfirmed ? 'pointer' : 'not-allowed' }}
                onClick={confirmBreakerAction}
              >
                Execute {pendingAction.targetState}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
