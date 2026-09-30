import React from 'react';
import { useGrid } from '../context/GridContext';
import { Activity, ShieldCheck, Keyboard } from 'lucide-react';

export const MissionControlBar = () => {
  const { gridFrequencyHz, isBackendConnected, isLiveStreamActive, soundMuted } = useGrid();

  const freqDeviation = Math.abs(gridFrequencyHz - 50.0).toFixed(2);
  const isFrequencyNormal = freqDeviation <= 0.05;

  return (
    <footer className="mission-control-bar" id="mission-control-hud">
      <div className="mission-bar-inner">
        {/* Left: Real-time Synchronized Pulse */}
        <div className="mission-bar-left">
          <div className="mission-badge">
            <span className="live-radar-dot"></span>
            <span>TELEMETRY SYNC</span>
          </div>

          <div className="mission-metric-item">
            <Activity size={12} color={isFrequencyNormal ? "var(--status-normal)" : "var(--status-warning)"} />
            <span className="mission-metric-label">IEGC Frequency:</span>
            <span className={`mission-metric-value ${isFrequencyNormal ? 'nominal' : 'warning'}`}>
              {gridFrequencyHz.toFixed(2)} Hz
            </span>
          </div>

          <div className="mission-metric-divider"></div>

          <div className="mission-metric-item">
            <ShieldCheck size={12} color="var(--status-normal)" />
            <span className="mission-metric-label">Protection:</span>
            <span className="mission-metric-value nominal">IEC 61850 GOOSE Active</span>
          </div>
        </div>

        {/* Right: Operational Status & Shortcuts */}
        <div className="mission-bar-right">
          <div className="mission-shortcuts-pill">
            <Keyboard size={11} color="var(--text-muted)" />
            <span><kbd>T</kbd> Theme</span>
            <span><kbd>Space</kbd> {isLiveStreamActive ? 'Live' : 'Paused'}</span>
            <span><kbd>M</kbd> {soundMuted ? 'Muted' : 'Sound'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
