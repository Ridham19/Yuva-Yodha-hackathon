import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  BellRing,
  AlertOctagon,
  Info,
  X
} from 'lucide-react';

export const AlarmsDrawer = ({ isOpen, onClose }) => {
  const { alarms, acknowledgeAlarm, clearAcknowledgedAlarms } = useGrid();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'

  if (!isOpen) return null;

  const unackCount = alarms.filter(a => !a.acknowledged).length;
  const filteredAlarms = alarms.filter(a => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const getSeverityBadge = (severity) => {
    if (severity === 'CRITICAL') return <span className="badge badge-danger">CRITICAL</span>;
    if (severity === 'WARNING') return <span className="badge badge-warning">WARNING</span>;
    return <span className="badge badge-info">INFO</span>;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="alarms-drawer-backdrop" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="alarms-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-stat-box)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <BellRing size={20} color={unackCount > 0 ? 'var(--status-critical)' : 'var(--text-accent)'} />
              {unackCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  background: 'var(--status-critical)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                }}>
                  {unackCount}
                </span>
              )}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                SCADA Alarms & Event Dispatch Log
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {unackCount > 0 ? `${unackCount} unacknowledged event${unackCount > 1 ? 's' : ''}` : 'All system alarms acknowledged'}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
            title="Close Alarms"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-glass)'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className="btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  background: filter === sev ? 'var(--badge-bg-info)' : 'transparent',
                  borderColor: filter === sev ? 'var(--border-active)' : 'var(--border-subtle)',
                  color: filter === sev ? 'var(--text-accent)' : 'var(--text-secondary)'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={clearAcknowledgedAlarms}
            className="btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}
            title="Remove acknowledged alarms from log"
          >
            <Trash2 size={12} /> Clear Acknowledged
          </button>
        </div>

        {/* Alarm List Body */}
        <div style={{ padding: '16px 22px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredAlarms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={32} color="var(--status-normal)" style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.6 }} />
              No active alarms found for selected filter.
            </div>
          ) : (
            filteredAlarms.map(alarm => (
              <div
                key={alarm.id}
                style={{
                  background: alarm.acknowledged ? 'var(--bg-stat-box)' : 'var(--bg-card)',
                  border: `1px solid ${!alarm.acknowledged && alarm.severity === 'CRITICAL' ? 'var(--status-critical)' : 'var(--border-subtle)'}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: alarm.acknowledged ? 0.65 : 1,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {alarm.timestamp}
                    </span>
                    {getSeverityBadge(alarm.severity)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-accent)', fontWeight: 'bold' }}>
                      [{alarm.source}]
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {alarm.message}
                  </div>
                </div>

                <div>
                  {!alarm.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlarm(alarm.id)}
                      className="btn-outline"
                      style={{ padding: '3px 8px', fontSize: '0.7rem', color: 'var(--status-normal)', borderColor: 'var(--border-subtle)' }}
                      title="Acknowledge alarm"
                    >
                      <CheckCircle2 size={12} color="var(--status-normal)" /> ACK
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Acked
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
