import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Leaf,
  FileText,
  Download,
  Printer,
  TrendingDown,
  Scale,
  Award,
  Calendar,
  CheckCircle2,
  Zap,
  Flame
} from 'lucide-react';
import { playBreakerCloseSound } from '../utils/audioEffects';

export const CarbonAndReports = () => {
  const { substation, gridFrequencyHz } = useGrid();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Carbon metrics
  const nationalAvgCarbonGkwh = 710;
  const localCarbonGkwh = 385; // Low due to solar/wind mix
  const reductionPct = Math.round(((nationalAvgCarbonGkwh - localCarbonGkwh) / nationalAvgCarbonGkwh) * 100);
  const coalSavedTonsToday = 214.8;
  const recCreditsEarned = 4820;

  // 1-Click Export Function
  const handleExportCsv = () => {
    playBreakerCloseSound();
    const rows = [
      ["Metric", "Value", "Baseline Benchmark", "Status"],
      ["Substation Name", "Mayur Vihar 66/11kV Substation", "Delhi Transco / NRLDC", "COMPLIANT"],
      ["Grid Frequency (Hz)", gridFrequencyHz.toFixed(2), "50.00 Hz (49.90 - 50.05 IEGC)", "IN_BAND"],
      ["Carbon Emissions (g CO2/kWh)", localCarbonGkwh, "710 National Avg", `-${reductionPct}% AVOIDED`],
      ["Coal Saved Today (Metric Tons)", coalSavedTonsToday, "0 Baseline", "ACTIVE SAVINGS"],
      ["Renewable Certificates (RECs)", recCreditsEarned, "Target 3000", "EXCEEDED"],
      ["AT&C Losses (%)", "14.80%", "16.50% National Avg", "RDSS TARGET MET"],
      ["SAIDI Outage Duration", "4.1 hrs/yr", "18.5 hrs/yr Baseline", "-78% SLASHEED"],
      ["FLISR Restoration Time", "6.82 seconds", "2 hrs 15 mins Manual", "ZERO-LATENCY"]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GridPulse_CEA_Compliance_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="carbon-reports-view">
      {/* 1. Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-success" style={{ fontWeight: 'bold' }}>CERC & CEA REGULATORY COMPLIANCE</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                India Net-Zero 2070 Roadmap • Bureau of Energy Efficiency (BEE) Standards
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Leaf size={26} color="#10b981" />
              ESG Carbon Accounting & Regulatory Compliance Exporter
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Continuous Scope 1/2 grid carbon emissions intensity measurement, coal avoidance ledger, and one-click regulatory audit packet generation.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCsv}
              className="btn-demo"
              style={{ padding: '10px 18px', background: 'var(--badge-bg-success)', color: '#10b981', borderColor: '#10b981' }}
            >
              <Download size={16} />
              {downloadSuccess ? 'Downloaded CSV!' : 'Export CEA Audit CSV'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-demo"
              style={{ padding: '10px 16px' }}
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </div>

        {/* Carbon KPI Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>LOCAL CARBON INTENSITY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
              {localCarbonGkwh} <span style={{ fontSize: '0.85rem' }}>g CO₂/kWh</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>
              <TrendingDown size={12} style={{ display: 'inline' }} /> {reductionPct}% cleaner than national average
            </div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>COAL SAVED TODAY</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
              {coalSavedTonsToday} <span style={{ fontSize: '0.85rem' }}>Metric Tons</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Equivalent to 470 barrels of crude</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RENEWABLE CERTIFICATES (RECs)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#a855f7' }}>
              {recCreditsEarned.toLocaleString('en-IN')} RECs
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Monetizable on Indian Carbon Exchange</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CLEAN GENERATION SHARE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#f59e0b' }}>
              58.4%
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Solar + Wind + Hydro mix</div>
          </div>
        </div>
      </div>

      {/* 2. Official CEA Dossier Preview Card */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-cyan)" />
              Central Electricity Authority (CEA) Standard Inspection Dossier
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Official monthly return ready for submission to State Load Despatch Centre (SLDC) and DISCOM management.
            </div>
          </div>
          <span className="badge badge-info">OFFICIAL CEA SCHEDULE-V</span>
        </div>

        {/* Dossier Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Audit Parameter</th>
                <th style={{ padding: '10px' }}>Current Measured Value</th>
                <th style={{ padding: '10px' }}>Regulatory Mandate</th>
                <th style={{ padding: '10px' }}>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>System Frequency Deviation Band</td>
                <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{gridFrequencyHz.toFixed(2)} Hz</td>
                <td style={{ padding: '12px 10px' }}>49.90 - 50.05 Hz (IEGC Statutory)</td>
                <td style={{ padding: '12px 10px' }}><span className="badge badge-success">COMPLIANT</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>Aggregate Technical & Commercial (AT&C) Loss</td>
                <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>14.80%</td>
                <td style={{ padding: '12px 10px' }}>&lt; 16.50% (RDSS Scheme Benchmark)</td>
                <td style={{ padding: '12px 10px' }}><span className="badge badge-success">RDSS TARGET MET</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>SAIDI System Average Interruption Duration</td>
                <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>4.1 Hours / Customer / Year</td>
                <td style={{ padding: '12px 10px' }}>&lt; 12.0 Hours / Year</td>
                <td style={{ padding: '12px 10px' }}><span className="badge badge-success">-78% OUTAGE DROP</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>Autonomous FLISR Restoration Latency</td>
                <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>6.82 Seconds</td>
                <td style={{ padding: '12px 10px' }}>&lt; 60 Seconds (Smart Grid Code)</td>
                <td style={{ padding: '12px 10px' }}><span className="badge badge-success">ZERO-LATENCY</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>Cyber Security Verification Standard</td>
                <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>IEC 62351 Cryptographic Handshake</td>
                <td style={{ padding: '12px 10px' }}>CERT-In Power Sector Guidelines 2023</td>
                <td style={{ padding: '12px 10px' }}><span className="badge badge-success">CERT-In SECURED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
