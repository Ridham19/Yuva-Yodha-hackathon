import React, { useState, useEffect } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Flame,
  ArrowRight,
  Server,
  Boxes,
  FileCode2,
  Sparkles,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { playBreakerCloseSound, playAlarmChirp } from '../utils/audioEffects';

export const EcoStruxureIntegration = () => {
  const { substation, gridFrequencyHz, totalDemandMw } = useGrid();

  // Active view tab inside EcoStruxure
  const [activeTab, setActiveTab] = useState('architecture'); // 'architecture' | 'iec61850' | 'powerlogic' | 'bom'
  
  // IEC 61850 GOOSE Live Stream State
  const [goosePackets, setGoosePackets] = useState([
    { id: 1, time: '21:14:02.104', appId: '0x0001', cb: 'CB-01', status: 'CLOSED', stNum: 14, sqNum: 28, delayMs: 1.8 },
    { id: 2, time: '21:14:03.220', appId: '0x0002', cb: 'CB-02', status: 'CLOSED', stNum: 22, sqNum: 45, delayMs: 2.1 },
    { id: 3, time: '21:14:04.512', appId: '0x0003', cb: 'CB-03', status: 'CLOSED', stNum: 9, sqNum: 18, delayMs: 1.6 }
  ]);
  const [isGooseActive, setIsGooseActive] = useState(true);
  const [selectedRelay, setSelectedRelay] = useState('EASERGY_P5');
  const [manifestDownloaded, setManifestDownloaded] = useState(false);

  // PowerLogic ION9000 Harmonic Telemetry
  const [harmonicOrders] = useState([
    { order: 'Fundamental (50Hz)', pct: 100.0, currentA: 382.4 },
    { order: '3rd Harmonic (150Hz)', pct: 1.45, currentA: 5.5 },
    { order: '5th Harmonic (250Hz)', pct: 2.80, currentA: 10.7 },
    { order: '7th Harmonic (350Hz)', pct: 1.95, currentA: 7.4 },
    { order: '9th Harmonic (450Hz)', pct: 0.65, currentA: 2.5 },
    { order: '11th Harmonic (550Hz)', pct: 1.20, currentA: 4.6 },
    { order: '13th Harmonic (650Hz)', pct: 0.85, currentA: 3.2 },
    { order: '15th Harmonic (750Hz)', pct: 0.35, currentA: 1.3 }
  ]);

  // Simulate incoming live GOOSE packets
  useEffect(() => {
    if (!isGooseActive) return;
    const interval = setInterval(() => {
      const cbs = ['CB-01', 'CB-02', 'CB-03', 'CB-04', 'TS-1-2'];
      const randomCb = cbs[Math.floor(Math.random() * cbs.length)];
      const delay = +(1.2 + Math.random() * 1.5).toFixed(2);
      const newPacket = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }) + '.' + String(Math.floor(Math.random() * 900) + 100),
        appId: '0x00' + Math.floor(Math.random() * 9 + 1),
        cb: randomCb,
        status: 'CLOSED',
        stNum: Math.floor(Math.random() * 50) + 1,
        sqNum: Math.floor(Math.random() * 100) + 1,
        delayMs: delay
      };
      setGoosePackets(prev => [newPacket, ...prev.slice(0, 7)]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isGooseActive]);

  // Download Schneider EcoStruxure Integration Manifest
  const handleDownloadManifest = () => {
    playBreakerCloseSound();
    const manifest = {
      platform: "GridPulse Intelligent Grid Management",
      vendorCompatibility: "Schneider Electric EcoStruxure™ Power & Grid",
      substation: substation.name,
      standards: [
        "IEC 61850 Edition 2 (Substation Automation & Protection)",
        "IEC 62351-3/5/6 (Substation Cyber Security & GOOSE Authentication)",
        "IEEE C37.118 (Phasor Measurement Unit PMU Sync)",
        "Modbus TCP / IEC 60870-5-104 (SCADA Telemetry Stream)"
      ],
      hardwareMapping: [
        { bay: "FDR-01 (Industrial 11kV)", protectionRelay: "Schneider Electric Easergy P5F30", meter: "PowerLogic ION9000", switchgear: "Premset SF6-Free 11kV" },
        { bay: "FDR-02 (Residential 11kV)", protectionRelay: "Schneider Electric Easergy P5F30", meter: "PowerLogic PM8000", switchgear: "Premset SF6-Free 11kV" },
        { bay: "FDR-03 (Hospital Metro 11kV)", protectionRelay: "Schneider Electric Easergy P5F30 Dual-Eth", meter: "PowerLogic ION9000", switchgear: "Premset SF6-Free 11kV" },
        { bay: "TR-01 (16 MVA 33/11kV)", protectionRelay: "Schneider Electric Easergy P5T30 Transformer Diff", meter: "PowerLogic ION9000 Class 0.1S", switchgear: "Schneider GHA Gas-Insulated" },
        { bay: "BESS & Solar Microgrid", edgeController: "Schneider EcoStruxure Microgrid Advisor", inverterGateway: "Conext Smart Inverter Gateway" }
      ],
      exportTimestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GridPulse_Schneider_EcoStruxure_Manifest_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setManifestDownloaded(true);
    setTimeout(() => setManifestDownloaded(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="ecostruxure-view">
      {/* 1. Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-success" style={{ fontWeight: 'bold' }}>SCHNEIDER ELECTRIC ECOSTRUXURE™ INTEROPERABILITY</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                IEC 61850 Edition 2 • Easergy Relays • PowerLogic ION9000 • SF6-Free Premset
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Boxes size={26} color="#10b981" />
              Schneider Electric EcoStruxure™ Grid Architecture & Interoperability Center
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Full digital twin integration connecting Schneider Electric field protection switchgear with GridPulse AI-driven autonomous FLISR, microgrid dispatch, and IEC 61850 GOOSE telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownloadManifest}
              className="btn-demo"
              style={{ padding: '10px 18px', background: 'var(--badge-bg-success)', color: '#10b981', borderColor: '#10b981' }}
            >
              <Download size={16} />
              {manifestDownloaded ? 'Manifest Downloaded!' : 'Export EcoStruxure™ JSON Manifest'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`btn-demo ${activeTab === 'architecture' ? 'active' : ''}`}
          style={{ padding: '8px 16px' }}
        >
          <Layers size={15} />
          3-Tier EcoStruxure™ Architecture
        </button>
        <button
          onClick={() => setActiveTab('iec61850')}
          className={`btn-demo ${activeTab === 'iec61850' ? 'active' : ''}`}
          style={{ padding: '8px 16px' }}
        >
          <Zap size={15} />
          IEC 61850 GOOSE Live Bus
        </button>
        <button
          onClick={() => setActiveTab('powerlogic')}
          className={`btn-demo ${activeTab === 'powerlogic' ? 'active' : ''}`}
          style={{ padding: '8px 16px' }}
        >
          <Activity size={15} />
          PowerLogic™ ION9000 Power Quality
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`btn-demo ${activeTab === 'bom' ? 'active' : ''}`}
          style={{ padding: '8px 16px' }}
        >
          <Server size={15} />
          Schneider Hardware BOM & Digital Twin
        </button>
      </div>

      {/* 3. TAB 1: 3-Tier EcoStruxure Architecture */}
      {activeTab === 'architecture' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Tier 3: Apps, Analytics & Services */}
          <div className="grid-card" style={{ padding: '20px', borderTop: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 'bold' }}>TIER 3: CLOUD & ENTERPRISE</span>
              <Cpu size={20} color="#a855f7" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Apps, Analytics & Services</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              High-level intelligence layer interfacing with DISCOM control centers, state load dispatch centers (SLDCs), and asset managers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#c084fc' }}>Schneider EcoStruxure™ ADMS</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Advanced Distribution Management System with outage management & state estimation.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#c084fc' }}>GridPulse Neural Forecaster & DGA AI</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>24-Hour Duck Curve forecaster & Duval Triangle Transformer Health scoring.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#c084fc' }}>EcoStruxure Asset Advisor</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Condition-based predictive maintenance and Remaining Useful Life (RUL) tracker.</div>
              </div>
            </div>
          </div>

          {/* Tier 2: Edge Control */}
          <div className="grid-card" style={{ padding: '20px', borderTop: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', fontWeight: 'bold' }}>TIER 2: SUBSTATION EDGE</span>
              <Activity size={20} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Edge Control & Automation</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Sub-second deterministic automation, localized microgrid management, and autonomous self-healing isolation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#22d3ee' }}>GridPulse Autonomous FLISR Core</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sub-10 second fault location, isolation, and back-feed service restoration engine.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#22d3ee' }}>Schneider EcoStruxure Microgrid Advisor</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dynamic optimization of 20 MWh BESS, 25 MW Solar, and 15 MW Wind dispatch.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#22d3ee' }}>EcoStruxure Substation Operation (ESSO)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IEC 61850 Station Bus HMI, gateway communications, and interlock supervisory logic.</div>
              </div>
            </div>
          </div>

          {/* Tier 1: Connected Products */}
          <div className="grid-card" style={{ padding: '20px', borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 'bold' }}>TIER 1: FIELD SENSORS & RELAYS</span>
              <Zap size={20} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Connected Products</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Physical medium-voltage switchgear, protection relays, smart meters, and wireless IoT thermal sensors.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#34d399' }}>Schneider Easergy P5 & P3 Relays</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Native IEC 61850 GOOSE numerical protection relays with optical arc detection.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#34d399' }}>Schneider PowerLogic™ ION9000</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Class 0.1S accuracy power quality and waveform capture revenue meter.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-card-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#34d399' }}>Schneider Premset 11kV Switchgear</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SF6-Free Shielded Solid Insulated System (2SSIS) with zero greenhouse gas leakage.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: IEC 61850 GOOSE Live Bus */}
      {activeTab === 'iec61850' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={20} color="#10b981" />
                  IEC 61850-8-1 GOOSE Substation Bus Monitor
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Generic Object Oriented Substation Events (GOOSE) providing sub-3ms peer-to-peer multicast over Ethernet between Easergy protection relays and breakers.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setIsGooseActive(!isGooseActive)}
                  className={`btn-demo ${isGooseActive ? 'active' : ''}`}
                  style={{ padding: '8px 14px' }}
                >
                  <RefreshCw size={14} className={isGooseActive ? 'spin' : ''} />
                  {isGooseActive ? 'Streaming Live' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Live Packet Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Timestamp (IST)</th>
                    <th style={{ padding: '10px' }}>AppID</th>
                    <th style={{ padding: '10px' }}>Protected Device</th>
                    <th style={{ padding: '10px' }}>Logical Node (LN)</th>
                    <th style={{ padding: '10px' }}>State / Trip</th>
                    <th style={{ padding: '10px' }}>StNum / SqNum</th>
                    <th style={{ padding: '10px' }}>Transfer Latency</th>
                    <th style={{ padding: '10px' }}>IEC 62351 Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {goosePackets.map((pkt) => (
                    <tr key={pkt.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{pkt.time}</td>
                      <td style={{ padding: '10px', color: '#06b6d4' }}>{pkt.appId}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{pkt.cb} (Schneider Premset)</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>XCBR1$Pos / PIOC1</td>
                      <td style={{ padding: '10px' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          {pkt.status} (HEALTHY)
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{pkt.stNum} / {pkt.sqNum}</td>
                      <td style={{ padding: '10px', color: '#10b981', fontWeight: 'bold' }}>
                        {pkt.delayMs} ms (Type 1A Class P2/3)
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.75rem' }}>
                          <ShieldCheck size={13} /> HMAC-SHA256
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: PowerLogic ION9000 Power Quality */}
      {activeTab === 'powerlogic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Harmonics Bar Visualizer */}
          <div className="grid-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#06b6d4" />
              Schneider PowerLogic™ ION9000 Harmonic Spectrum
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Class 0.1S compliance monitoring. IEEE 519-2022 voltage harmonic limits (THD-V &lt; 5.0%, Current TDD &lt; 8.0%).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {harmonicOrders.map((h, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{h.order}</span>
                    <span style={{ color: i === 0 ? '#10b981' : '#06b6d4', fontWeight: 'bold' }}>{h.pct}% ({h.currentA} A)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, h.pct)}%`,
                        height: '100%',
                        background: i === 0 ? '#10b981' : h.pct > 2.5 ? '#f59e0b' : '#06b6d4',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Power Quality Parameters */}
          <div className="grid-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={18} color="#10b981" />
              Power Quality & Waveform Summary
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Substation Incomer 66/11kV Bay • Class 0.1S Revenue Grade Accuracy
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Harmonic Distortion (THD-V)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>1.82 %</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IEEE 519 Limit: &lt; 5.0% (PASS)</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Demand Distortion (TDD-I)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>3.24 %</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IEEE 519 Limit: &lt; 8.0% (PASS)</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Voltage Unbalance Factor (VUF)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#06b6d4', marginTop: '4px' }}>0.42 %</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IEC 61000-4-30 Class A</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Instantaneous Crest Factor</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>1.414</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pure Sinusoidal Ratio (√2)</div>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> EcoStruxure Power Advisor Certified
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Zero sag/swell events recorded in the last 24 hours. Power factor maintained dynamically at 0.98 inductive via capacitor bank and BESS reactive compensation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: Schneider Hardware BOM & Digital Twin */}
      {activeTab === 'bom' && (
        <div className="grid-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={20} color="#10b981" />
            Schneider Electric Substation Bill of Materials (BOM) & Digital Twin
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Direct mapping of all GridPulse substation assets to commercial Schneider Electric hardware specifications and ratings.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Substation Bay</th>
                  <th style={{ padding: '10px' }}>Schneider Equipment Reference</th>
                  <th style={{ padding: '10px' }}>Voltage / Rating</th>
                  <th style={{ padding: '10px' }}>Key Specification</th>
                  <th style={{ padding: '10px' }}>Protocol Support</th>
                  <th style={{ padding: '10px' }}>Digital Twin Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Feeder 1 & 2 (11kV Bays)</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>Easergy P5F30 Numerical Relay</td>
                  <td style={{ padding: '10px' }}>11 kV / 630 A</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Overcurrent, Earth Fault & Optical Arc Sensor</td>
                  <td style={{ padding: '10px' }}>IEC 61850 Ed. 2 GOOSE</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">ONLINE</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Feeder 3 (Hospital / Metro)</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>Easergy P5F30 Dual-Ethernet</td>
                  <td style={{ padding: '10px' }}>11 kV / 1250 A</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>PRP/HSR Seamless Redundancy</td>
                  <td style={{ padding: '10px' }}>IEC 61850 PRP / MMS</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">ONLINE</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Transformer TR-01 & TR-02</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>Easergy P5T30 Transformer Differential</td>
                  <td style={{ padding: '10px' }}>33/11 kV, 16 MVA</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Restricted Earth Fault & IEEE C57.104 DGA Link</td>
                  <td style={{ padding: '10px' }}>IEC 61850 / Modbus TCP</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">ONLINE</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>11kV Distribution Switchboard</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>Premset SF6-Free Modular Switchgear</td>
                  <td style={{ padding: '10px' }}>17.5 kV / 25 kA (3s)</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Shielded Solid Insulation (Zero SF6 Gas)</td>
                  <td style={{ padding: '10px' }}>Integrated Motorized Drive</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">ONLINE</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Substation Gateway & Telemetry</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>EcoStruxure Substation Operation (ESSO)</td>
                  <td style={{ padding: '10px' }}>Dual Redundant RTU</td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Substation-to-NRLDC Telecontrol Broker</td>
                  <td style={{ padding: '10px' }}>IEC 60870-5-104 / DNP3</td>
                  <td style={{ padding: '10px' }}><span className="badge badge-success">ONLINE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
