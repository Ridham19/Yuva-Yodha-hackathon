import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  Activity, 
  Zap, 
  Power, 
  Sun, 
  Wind, 
  BatteryCharging, 
  Users, 
  Gauge, 
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Thermometer,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const FeederMonitoring = () => {
  const { feeders, renewables, thresholds, toggleBreaker } = useGrid();

  // Dynamic Line Rating (DLR) Weather State
  const [dlrPreset, setDlrPreset] = useState('HEATWAVE'); // 'HEATWAVE' | 'MONSOON' | 'WINTER'
  const [customTemp, setCustomTemp] = useState(42.0);
  const [customWindSpeed, setCustomWindSpeed] = useState(3.2);

  // IEEE 738 Conductor Ampacity Model (Simplified for Wolf/Dog 11kV ACSR)
  const calculateDlr = (temp, wind) => {
    const baseAmpacity = 400.0; // Static Nominal Ampacity
    const tempDelta = 75.0 - temp; // Conductor max temperature rating 75°C
    const windCooling = 1.0 + (Math.sqrt(Math.max(0.5, wind)) * 0.18);
    const tempFactor = Math.sqrt(Math.max(0.2, tempDelta / 35.0));
    const dynamicAmpacity = Math.round(baseAmpacity * tempFactor * windCooling);
    const capacityDeltaPct = Math.round(((dynamicAmpacity - baseAmpacity) / baseAmpacity) * 100);
    return { dynamicAmpacity, capacityDeltaPct };
  };

  const currentDlr = calculateDlr(customTemp, customWindSpeed);

  const handleApplyPreset = (preset) => {
    setDlrPreset(preset);
    if (preset === 'HEATWAVE') {
      setCustomTemp(45.0);
      setCustomWindSpeed(2.1);
    } else if (preset === 'MONSOON') {
      setCustomTemp(28.0);
      setCustomWindSpeed(8.5);
    } else if (preset === 'WINTER') {
      setCustomTemp(16.0);
      setCustomWindSpeed(4.8);
    }
  };

  const getFeederBadge = (feeder) => {
    if (feeder.breakerState === 'TRIPPED') {
      return <span className="badge badge-danger">TRIPPED / OPEN</span>;
    }
    if (feeder.status === 'FAULTED') {
      return <span className="badge badge-danger">FAULT SURGE</span>;
    }
    if (feeder.status === 'ISOLATED') {
      return <span className="badge badge-warning">SECTION ISOLATED</span>;
    }
    if (feeder.status === 'RESTORED') {
      return <span className="badge badge-purple">TIE RESTORED</span>;
    }
    if (feeder.currentA > currentDlr.dynamicAmpacity) {
      return <span className="badge badge-danger">DLR THERMAL LIMIT</span>;
    }
    if (feeder.currentA > thresholds.feederCurrentMaxA) {
      return <span className="badge badge-warning">OVERLOAD</span>;
    }
    return <span className="badge badge-success">ENERGIZED</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="feeder-monitoring-view">
      {/* Renewable Injection & BESS Header Bar */}
      <div className="grid-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sun size={20} color="#f59e0b" />
              Renewable Generation & BESS Storage Dispatch
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Real-time distributed solar & wind farm telemetry with fast-acting battery storage support.
            </p>
          </div>
          <span className="badge badge-info">
            Weather: {renewables.weatherCondition === 'CLEAR' ? '☀️ Clear Sky (Optimal)' : '☁️ Heavy Cloud Cover (Intermittent)'}
          </span>
        </div>

        <div className="grid-3col">
          {/* Solar Farm Card */}
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={16} /> Solar Park (Sector 72)
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {renewables.solarIrradianceWm2} W/m²
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
              {renewables.solarOutputMw} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {renewables.solarCapacityMw} MW</span>
            </div>
            <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', width: `${(renewables.solarOutputMw / renewables.solarCapacityMw) * 100}%`, height: '100%', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Wind Farm Card */}
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wind size={16} /> Ridge Wind Turbines
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Wind: 7.8 m/s
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
              {renewables.windOutputMw} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {renewables.windCapacityMw} MW</span>
            </div>
            <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #0284c7, #38bdf8)', width: `${(renewables.windOutputMw / renewables.windCapacityMw) * 100}%`, height: '100%', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* BESS Storage Card */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BatteryCharging size={16} /> 20 MWh Grid BESS
              </span>
              <span className={`badge ${renewables.bessOutputMw > 0 ? 'badge-warning' : 'badge-success'}`}>
                {renewables.bessOutputMw > 0 ? `DISCHARGING (+${renewables.bessOutputMw} MW)` : 'STANDBY'}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
              {renewables.bessCurrentSoCPct}% <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>State of Charge</span>
            </div>
            <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, #10b981, #34d399)', width: `${renewables.bessCurrentSoCPct}%`, height: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* IEEE 738 Dynamic Line Rating (DLR) Panel */}
      <div className="grid-card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', fontWeight: 'bold' }}>
                CEA MANDATED GRID TECH
              </span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#06b6d4" />
                IEEE 738 Dynamic Line Rating (DLR) & Weather Ampacity Engine
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '3px' }}>
              Calculates real-time conductor thermal ampacity based on atmospheric cooling, unlocking hidden transmission headroom for renewable evacuation without building new physical lines.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleApplyPreset('HEATWAVE')}
              className={`btn-demo ${dlrPreset === 'HEATWAVE' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              🔥 Heatwave (45°C)
            </button>
            <button
              onClick={() => handleApplyPreset('MONSOON')}
              className={`btn-demo ${dlrPreset === 'MONSOON' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              🌧️ Monsoon Wind (28°C)
            </button>
            <button
              onClick={() => handleApplyPreset('WINTER')}
              className={`btn-demo ${dlrPreset === 'WINTER' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              ❄️ Winter Optimal (16°C)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ambient Temperature</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: customTemp > 40 ? '#ef4444' : '#06b6d4', marginTop: '4px' }}>
              {customTemp.toFixed(1)} °C
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conductor limit 75.0°C</div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Crosswind Cooling Speed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
              {customWindSpeed.toFixed(1)} m/s
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Forced convective dissipation</div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Static Rating vs DLR Dynamic</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: currentDlr.capacityDeltaPct >= 0 ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
              {currentDlr.dynamicAmpacity} A
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>/ 400A Static</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: currentDlr.capacityDeltaPct >= 0 ? '#10b981' : '#ef4444' }}>
              {currentDlr.capacityDeltaPct >= 0 ? `+${currentDlr.capacityDeltaPct}% extra capacity` : `${currentDlr.capacityDeltaPct}% derating penalty`}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Renewable Hosting Uplift</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
              +{Math.max(0, currentDlr.capacityDeltaPct * 0.12).toFixed(1)} MW
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prevents solar/wind curtailment</div>
          </div>
        </div>
      </div>

      {/* 4 Feeder Live Telemetry Cards */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--text-accent)" />
          11 kV Distribution Feeder Telemetry
        </h3>

        <div className="grid-2col">
          {feeders.map(feeder => {
            const isOverloaded = feeder.currentA > thresholds.feederCurrentMaxA;
            const isDlrBreached = feeder.currentA > currentDlr.dynamicAmpacity;
            const isTripped = feeder.breakerState === 'TRIPPED';

            return (
              <div 
                key={feeder.id} 
                className="grid-card" 
                style={{ 
                  padding: '20px', 
                  borderLeft: `4px solid ${isTripped ? '#ef4444' : (isDlrBreached ? '#ef4444' : (isOverloaded ? '#f59e0b' : '#10b981'))}` 
                }}
              >
                {/* Header of Feeder Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 'bold' }}>
                        {feeder.id}
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                        {feeder.name}
                      </h4>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {feeder.zone} • {feeder.lengthKm} km line • DLR Limit: {currentDlr.dynamicAmpacity}A
                    </div>
                  </div>
                  <div>
                    {getFeederBadge(feeder)}
                  </div>
                </div>

                {/* Main Metrics 4-Box Grid */}
                <div className="grid-4col" style={{ gap: '10px', marginBottom: '16px' }}>
                  {/* Voltage */}
                  <div className="stat-box">
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voltage (kV)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {feeder.voltageKv.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Nominal 11.0</div>
                  </div>

                  {/* Current */}
                  <div className="stat-box">
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current (Amps)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: '700', color: isDlrBreached ? '#ef4444' : (isOverloaded ? '#f59e0b' : 'var(--text-primary)') }}>
                      {feeder.currentA.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isDlrBreached ? '#ef4444' : 'var(--text-muted)' }}>
                      DLR {currentDlr.dynamicAmpacity}A
                    </div>
                  </div>

                  {/* Active Power */}
                  <div className="stat-box">
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active (MW)</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-accent)' }}>
                      {feeder.activePowerMw.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {feeder.reactivePowerMvar.toFixed(1)} MVAR
                    </div>
                  </div>

                  {/* Power Factor */}
                  <div className="stat-box">
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Power Factor</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: '700', color: '#10b981' }}>
                      {feeder.powerFactor}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Lagging</div>
                  </div>
                </div>

                {/* Footer with Consumer Count & Quick Breaker Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Users size={14} />
                    <span>{feeder.consumerCount.toLocaleString()} Connected Consumers</span>
                  </div>

                  <button
                    className={isTripped ? "btn-primary" : "btn-danger"}
                    style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                    onClick={() => toggleBreaker(feeder.id)}
                  >
                    <Power size={13} />
                    {isTripped ? "Reclose Breaker" : "Manual Trip"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

