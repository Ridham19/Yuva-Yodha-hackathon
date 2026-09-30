import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Car,
  Zap,
  BatteryCharging,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Coins,
  CheckCircle2,
  Sliders,
  Bus,
  Truck,
  Bike
} from 'lucide-react';
import { playBreakerCloseSound, playAlarmChirp } from '../utils/audioEffects';

export const EVFleetV2G = () => {
  const { substation } = useGrid();

  // V2G Mode: 'G2V_CHARGING' (Consuming Power) | 'V2G_DISCHARGING' (Injecting Power to Grid) | 'SMART_VPP_IDLE'
  const [v2gActive, setV2gActive] = useState(false);
  const [injectionMw, setInjectionMw] = useState(4.5);

  const toggleV2G = () => {
    playBreakerCloseSound();
    setV2gActive(prev => !prev);
  };

  // Fleet Hubs Breakdown
  const fleetHubs = [
    {
      id: 'HUB-DTC-01',
      name: 'Mayur Vihar DTC Bus Terminal Depot',
      type: 'BUS',
      icon: Bus,
      totalVehicles: 320,
      connectedVehicles: 285,
      capacityMwh: 8.2,
      currentSocPct: 88,
      status: v2gActive ? 'INJECTING_V2G' : 'G2V_CHARGING',
      powerFlowMw: v2gActive ? -2.2 : 3.4
    },
    {
      id: 'HUB-OKHLA-02',
      name: 'Okhla Logistics Commercial Fleet Depot',
      type: 'TRUCK',
      icon: Truck,
      totalVehicles: 480,
      connectedVehicles: 412,
      capacityMwh: 5.1,
      currentSocPct: 82,
      status: v2gActive ? 'INJECTING_V2G' : 'G2V_CHARGING',
      powerFlowMw: v2gActive ? -1.5 : 2.1
    },
    {
      id: 'HUB-ANAND-03',
      name: 'Anand Vihar Swappable Battery Station',
      type: 'BIKE',
      icon: Bike,
      totalVehicles: 720,
      connectedVehicles: 690,
      capacityMwh: 5.2,
      currentSocPct: 94,
      status: v2gActive ? 'INJECTING_V2G' : 'G2V_CHARGING',
      powerFlowMw: v2gActive ? -0.8 : 1.8
    }
  ];

  // Daily Fleet Revenue Metrics
  const dailyDiscomSavingsInr = v2gActive ? 186000 : 42000;
  const driverCreditsEarnedInr = v2gActive ? 94500 : 18200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="ev-fleet-v2g-view">
      {/* 1. Header Banner */}
      <div 
        className="grid-card" 
        style={{ 
          padding: '22px', 
          borderLeft: `4px solid ${v2gActive ? '#10b981' : '#06b6d4'}`,
          background: v2gActive 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(17, 24, 39, 0.5) 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${v2gActive ? 'badge-success' : 'badge-info'}`}>
                {v2gActive ? 'V2G ACTIVE • REVERSE POWER INJECTION' : 'VPP AGGREGATOR • G2V SMART CHARGE'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Delhi EV Policy 2024 • Virtual Power Plant (VPP) Aggregation Protocol
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Car size={26} color={v2gActive ? "#10b981" : "#06b6d4"} />
              EV Smart Fleet V2G Aggregator & Virtual Power Plant
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Aggregating 1,520 connected Delhi electric transit buses, commercial delivery vans, and swappable battery depots to provide fast frequency response (FFR) and shave evening duck-curve peaks.
            </p>
          </div>

          {/* V2G Master Mode Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleV2G}
              style={{
                background: v2gActive 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
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
                boxShadow: v2gActive ? '0 4px 16px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(6, 182, 212, 0.35)'
              }}
            >
              <Zap size={16} />
              {v2gActive ? 'V2G Active (+4.5 MW To Grid)' : 'Activate V2G Peak Shaving'}
            </button>
          </div>
        </div>

        {/* Aggregate VPP Fleet KPI Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AGGREGATED EV FLEET</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
              1,387 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 1,520 EVs</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>91.2% Grid Connected Rate</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>VPP STORAGE CAPACITY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7' }}>
              18.5 MWh
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Avg Fleet State of Charge: 87%</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>INSTANTANEOUS FLOW</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: v2gActive ? '#10b981' : '#f59e0b' }}>
              {v2gActive ? '+4.5 MW (INJECTING)' : '-7.3 MW (CHARGING)'}
            </div>
            <div style={{ fontSize: '0.65rem', color: v2gActive ? '#10b981' : 'var(--text-secondary)' }}>
              {v2gActive ? 'Discharging to 11kV Substation Bus' : 'Smart Off-Peak Charging Mode'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DRIVER INCENTIVE PAYOUT</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              ₹{driverCreditsEarnedInr.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Time-of-Day (ToD) Payout Credits</div>
          </div>
        </div>
      </div>

      {/* 2. Three Fleet Hub Cards */}
      <div className="grid-3col" style={{ gap: '18px' }}>
        {fleetHubs.map(hub => {
          const IconComp = hub.icon;
          const isInjecting = hub.powerFlowMw < 0;

          return (
            <div key={hub.id} className="grid-card" style={{ padding: '20px', borderTop: `3px solid ${isInjecting ? '#10b981' : '#38bdf8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '8px', borderRadius: '8px' }}>
                    <IconComp size={20} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>{hub.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{hub.id}</span>
                  </div>
                </div>
                <span className={`badge ${isInjecting ? 'badge-success' : 'badge-info'}`}>
                  {isInjecting ? 'V2G INJECTION' : 'CHARGING'}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CONNECTED / TOTAL</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {hub.connectedVehicles} / {hub.totalVehicles}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STATE OF CHARGE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1rem', color: '#10b981' }}>
                    {hub.currentSocPct}% SoC
                  </div>
                </div>
              </div>

              {/* Power Flow Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Bus Flow Rate:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isInjecting ? '#10b981' : '#f59e0b' }}>
                    {hub.powerFlowMw > 0 ? `+${hub.powerFlowMw} MW (Consuming)` : `${hub.powerFlowMw} MW (Supplying)`}
                  </span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ background: isInjecting ? '#10b981' : '#38bdf8', width: `${hub.currentSocPct}%`, height: '100%' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
