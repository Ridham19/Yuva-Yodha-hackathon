import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Trash2, 
  BellRing,
  AlertOctagon,
  Info
} from 'lucide-react';

export const AlarmsDrawer = () => {
  const { alarms, acknowledgeAlarm, clearAcknowledgedAlarms } = useGrid();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'

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
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 90,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-lg)',
      transition: 'all 0.3s ease'
    }}>
      {/* Alarm Bar Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <BellRing size={18} color={unackCount > 0 ? '#ef4444' : '#0284c7'} />
            {unackCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -8,
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '10px',
                padding: '1px 5px'
              }}>
                {unackCount}
              </span>
            )}
          </div>

          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Real-Time SCADA Alarms & Event Dispatch Log
          </span>

          {unackCount > 0 && (
            <span className="badge badge-danger">
              {unackCount} Unacknowledged Event{unackCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isOpen ? 'Click to collapse' : 'Click to expand alarm stream'}
          </span>
          {isOpen ? <ChevronDown size={18} color="var(--text-secondary)" /> : <ChevronUp size={18} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Expanded Alarms Body */}
      {isOpen && (
        <div style={{ padding: '0 24px 16px 24px', maxHeight: '280px', overflowY: 'auto' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(sev => (
                <button
                  key={sev}
                  onClick={(e) => { e.stopPropagation(); setFilter(sev); }}
                  className="btn-outline"
                  style={{
                    padding: '3px 10px',
                    fontSize: '0.7rem',
                    background: filter === sev ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    borderColor: filter === sev ? 'var(--accent-cyan)' : 'var(--border-subtle)'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); clearAcknowledgedAlarms(); }}
              className="btn-outline"
              style={{ padding: '3px 10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}
            >
              <Trash2 size={12} /> Clear Acknowledged
            </button>
          </div>

          {/* Alarm Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredAlarms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No active alarms for selected filter.
              </div>
            ) : (
              filteredAlarms.map(alarm => (
                <div
                  key={alarm.id}
                  style={{
                    background: alarm.acknowledged ? 'var(--bg-stat-box)' : 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: alarm.acknowledged ? 0.65 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {alarm.timestamp}
                    </span>
                    {getSeverityBadge(alarm.severity)}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                      [{alarm.source}]
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {alarm.message}
                    </span>
                  </div>

                  <div>
                    {!alarm.acknowledged && (
                      <button
                        onClick={(e) => { e.stopPropagation(); acknowledgeAlarm(alarm.id); }}
                        className="btn-outline"
                        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      >
                        <CheckCircle2 size={12} color="#10b981" /> ACK
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
