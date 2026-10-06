import React from 'react';
import { useGrid } from '../context/GridContext';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  TrendingDown, 
  Thermometer, 
  Activity, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Scale,
  Percent,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Search
} from 'lucide-react';

export const PredictiveMaintenance = () => {
  const { transformers, feeders } = useGrid();

  // Feeder energy loss metrics (MU = Million Units / kWh * 10^6)
  const feederLossData = [
    { id: "FDR-01", name: "Industrial Hub Feeder", inputMu: 48.2, billedMu: 44.25, lossPct: 8.2, risk: "LOW", anomaly: "Normal Balanced" },
    { id: "FDR-02", name: "Commercial Metro Plaza", inputMu: 36.8, billedMu: 32.60, lossPct: 11.4, risk: "LOW", anomaly: "Minor Harmonic Distortion" },
    { id: "FDR-03", name: "Residential High-Rise Belt", inputMu: 34.5, billedMu: 29.12, lossPct: 15.6, risk: "MEDIUM", anomaly: "Phase B Unbalance (18.2%)" },
    { id: "FDR-04", name: "Agricultural Feeder (11kV)", inputMu: 23.1, billedMu: 17.53, lossPct: 24.1, risk: "HIGH", anomaly: "High Unmetered Tube-Well Load" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="predictive-maintenance-view">
      {/* Top Banner */}
      <div className="grid-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Cpu size={22} color="#8b5cf6" />
              Machine Learning Predictive Asset Health & DGA Analytics
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Multi-sensor IoT regression models evaluating Dissolved Gas Analysis (DGA), vibration spectrums, and thermal aging to predict Remaining Useful Life (RUL) before catastrophic breakdown.
            </p>
          </div>
          <span className="badge badge-purple">
            ML Model: XGBoost + Thermal IEEE C57.91
          </span>
        </div>
      </div>

      {/* Transformer Cards Grid */}
      <div className="grid-2col">
        {transformers.map(transformer => {
          const isHealthy = transformer.status === 'NORMAL';

          return (
            <div 
              key={transformer.id}
              className="grid-card"
              style={{
                padding: '24px',
                borderTop: `4px solid ${isHealthy ? '#10b981' : '#f59e0b'}`
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 'bold' }}>
                      {transformer.id}
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                      {transformer.name}
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Rated: 16 MVA • 66/11 kV Step-Down • ONAN/ONAF Cooling
                  </div>
                </div>
                <span className={`badge ${isHealthy ? 'badge-success' : 'badge-warning'}`}>
                  {transformer.status === 'NORMAL' ? 'HEALTHY' : 'PREVENTIVE INSPECTION'}
                </span>
              </div>

              {/* Health Score & RUL Big Gauge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Health Index (THI) */}
                <div style={{ background: 'var(--bg-stat-box)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Transformer Health Index (THI)
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: '800', color: isHealthy ? '#10b981' : '#f59e0b', margin: '4px 0' }}>
                    {transformer.healthIndexPct}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isHealthy ? '#10b981' : '#f59e0b' }}>
                    {isHealthy ? 'Optimal Dielectric Strength' : 'Elevated Thermal Stress'}
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div style={{ background: 'var(--bg-stat-box)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Predicted Remaining Useful Life
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-cyan)', margin: '4px 0' }}>
                    {transformer.predictedRulYears} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Years</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {isHealthy ? 'Next Overhaul: 2040' : 'Recommended Overhaul: 2032'}
                  </div>
                </div>
              </div>

              {/* Temperatures & Loading */}
              <div className="grid-3col" style={{ gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>WINDING TEMP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '700', color: transformer.windingTempC > 75 ? '#f59e0b' : 'var(--text-primary)' }}>
                    {transformer.windingTempC}°C
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Limit: 95°C</div>
                </div>

                <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOP OIL TEMP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {transformer.oilTempC}°C
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Limit: 85°C</div>
                </div>

                <div style={{ background: 'var(--bg-stat-box)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>VIBRATION</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '700', color: transformer.vibrationMmS > 3.0 ? '#f59e0b' : 'var(--text-primary)' }}>
                    {transformer.vibrationMmS} mm/s
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Core RMS</div>
                </div>
              </div>

              {/* Dissolved Gas Analysis (DGA) Indicators */}
              <div style={{ background: 'var(--bg-stat-box)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Online Dissolved Gas Analysis (DGA PPMs)
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {/* Hydrogen */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span>H₂ (Hydrogen)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{transformer.dgaH2Ppm} ppm</span>
                    </div>
                    <div style={{ background: 'var(--track-bg)', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{ background: transformer.dgaH2Ppm > 70 ? '#f59e0b' : '#10b981', width: `${(transformer.dgaH2Ppm / 150) * 100}%`, height: '100%' }} />
                    </div>
                  </div>

                  {/* Methane */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span>CH₄ (Methane)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{transformer.dgaCh4Ppm} ppm</span>
                    </div>
                    <div style={{ background: 'var(--track-bg)', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{ background: transformer.dgaCh4Ppm > 60 ? '#f59e0b' : '#10b981', width: `${(transformer.dgaCh4Ppm / 120) * 100}%`, height: '100%' }} />
                    </div>
                  </div>

                  {/* Ethylene */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span>C₂H₄ (Ethylene)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{transformer.dgaC2h4Ppm} ppm</span>
                    </div>
                    <div style={{ background: 'var(--track-bg)', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{ background: transformer.dgaC2h4Ppm > 40 ? '#f59e0b' : '#10b981', width: `${(transformer.dgaC2h4Ppm / 80) * 100}%`, height: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance AI Recommendation */}
              <div style={{ marginTop: '14px', fontSize: '0.78rem', color: isHealthy ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHealthy ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>
                  {isHealthy 
                    ? "Normal operation. Next scheduled DGA laboratory chromatography in 180 days."
                    : "Winding hot-spot thermal stress detected. Auto-scheduled oil filtration & fan check."}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- AT&C LOSS TRACKER & ENERGY AUDIT BALANCE METER --- */}
      <div className="grid-card" style={{ padding: '24px', borderLeft: '4px solid #06b6d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-info">RDSS / CEA COMPLIANT</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Revamped Distribution Sector Scheme</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={20} color="#06b6d4" />
              Aggregate Technical & Commercial (AT&C) Loss Tracker & Energy Audit Balance
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Substation bus-level energy balancing identifying technical conductor copper losses versus non-technical commercial theft leakage.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Savings Realized:</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>
              ₹11.84 Crores
            </div>
          </div>
        </div>

        {/* 3 Top Gauges */}
        <div className="grid-3col" style={{ marginBottom: '24px' }}>
          {/* Current AT&C Loss */}
          <div style={{ background: 'var(--bg-stat-box)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Substation AT&C Loss
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.6rem', fontWeight: '800', color: 'var(--accent-cyan)', margin: '4px 0' }}>
              14.80%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <TrendingDown size={14} /> Down from 21.40% baseline (-6.60%)
            </div>
          </div>

          {/* National Benchmark vs Target */}
          <div style={{ background: 'var(--bg-stat-box)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CEA National Benchmark
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.6rem', fontWeight: '800', color: '#f59e0b', margin: '4px 0' }}>
              16.50%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              GridPulse is <strong>1.70% below</strong> national average
            </div>
          </div>

          {/* RDSS UDAY Target */}
          <div style={{ background: 'var(--bg-stat-box)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Statutory RDSS Target
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.6rem', fontWeight: '800', color: '#10b981', margin: '4px 0' }}>
              &lt; 12.00%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              Trajectory on track for Q4 compliance
            </div>
          </div>
        </div>

        {/* Technical vs Non-Technical Loss Breakdown Grid */}
        <div className="grid-2col" style={{ gap: '20px', marginBottom: '24px' }}>
          {/* Technical Losses */}
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} /> Technical Losses (9.70%)
              </span>
              <span className="badge badge-info">PHYSICAL DISSIPATION</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Conductor I2R */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Conductor I²R Line Heating</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>5.40%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#06b6d4', width: '55.6%', height: '100%' }} />
                </div>
              </div>

              {/* Transformer Core & Copper */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Distribution Transformer (DT) Core & Copper Loss</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>3.20%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--accent-cyan)', width: '33.0%', height: '100%' }} />
                </div>
              </div>

              {/* Phase Unbalance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Phase Unbalance Neutral Current Dissipation</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>1.10%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#818cf8', width: '11.4%', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Non-Technical / Commercial Losses */}
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={18} /> Commercial / Non-Technical (5.10%)
              </span>
              <span className="badge badge-warning">THEFT & UNMETERED</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Unmetered Agricultural */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Unmetered Agricultural Pump Sets</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>3.00%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#f59e0b', width: '58.8%', height: '100%' }} />
                </div>
              </div>

              {/* Direct Hooking / Theft */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Direct Line Hooking & Shunt Theft</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>1.80%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#ef4444', width: '35.3%', height: '100%' }} />
                </div>
              </div>

              {/* Meter Drift */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Defective / Sluggish Mechanical Meters</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>0.30%</span>
                </div>
                <div style={{ background: 'var(--track-bg)', height: '6px', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#fbbf24', width: '5.9%', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Energy Audit Balance Meter Bar */}
        <div style={{ background: 'var(--bg-stat-box)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Energy Balance Reconciliation (Current Month: 142.60 MU)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#10b981' }}>
              Collection Efficiency: 96.8%
            </span>
          </div>

          <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', background: 'var(--track-bg)', marginBottom: '8px' }}>
            <div style={{ width: '85.2%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#ffffff', fontWeight: 'bold' }} title="Billed Energy: 121.50 MU">
              Billed Energy (121.50 MU • 85.2%)
            </div>
            <div style={{ width: '9.7%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }} title="Technical Loss: 13.83 MU">
              Tech 9.7%
            </div>
            <div style={{ width: '5.1%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#000', fontWeight: 'bold' }} title="Commercial Loss: 7.27 MU">
              5.1%
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Input: 142.60 MU from 33kV Grid</span>
            <span>Billed: 121.50 MU</span>
            <span style={{ color: '#f59e0b' }}>Loss Gap: 21.10 MU (14.8%)</span>
          </div>
        </div>

        {/* Feeder-Level Loss Table & Anomaly Localization */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="var(--accent-cyan)" />
            Feeder-by-Feeder Loss Audit & Anomaly Detection
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Feeder</th>
                  <th style={{ padding: '8px 12px' }}>Input (MU)</th>
                  <th style={{ padding: '8px 12px' }}>Billed (MU)</th>
                  <th style={{ padding: '8px 12px' }}>Loss %</th>
                  <th style={{ padding: '8px 12px' }}>Loss Severity</th>
                  <th style={{ padding: '8px 12px' }}>AI Loss Anomaly Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {feederLossData.map((f, idx) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--bg-stat-box)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>{f.id}</span> - {f.name}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{f.inputMu}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{f.billedMu}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: f.lossPct > 20 ? '#ef4444' : f.lossPct > 12 ? '#f59e0b' : '#10b981' }}>
                      {f.lossPct}%
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${f.risk === 'HIGH' ? 'badge-danger' : f.risk === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                        {f.risk} RISK
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {f.anomaly}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
