import React from 'react';
import { 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  Sun, 
  Clock, 
  Award,
  Layers,
  FileText
} from 'lucide-react';

export const ImpactSummary = () => {
  const slides = [
    { num: 1, title: "Title & Hook", desc: "GridPulse: Intelligent Grid Management & Automation Dashboard" },
    { num: 2, title: "The Problem", desc: "India's distribution grid strain: Renewable swings, manual delay, feeder imbalance" },
    { num: 3, title: "The Solution", desc: "Proactive, self-healing grid operations platform replacing SCADA-lite" },
    { num: 4, title: "Pillar 1: Monitor", desc: "Geo-tagged network topology, live electrical telemetry, color-coded health" },
    { num: 5, title: "Pillar 2: Control", desc: "Remote breaker & recloser switching, safety interlocks, configurable setpoints" },
    { num: 6, title: "Pillar 3: Automate", desc: "Self-healing FLISR fault isolation, demand-response shedding, BESS balancing" },
    { num: 7, title: "Predictive Health", desc: "ML models evaluating DGA and thermal aging to predict Remaining Useful Life" },
    { num: 8, title: "4-Layer Architecture", desc: "Field sensors -> MQTT/LoRaWAN comms -> Analytics engine -> React Operator UI" },
    { num: 9, title: "Tech Stack", desc: "React, Vite, WebSockets, Python/FastAPI, Time-series DB, SCADA UX" },
    { num: 10, title: "Impact & Alignment", desc: "SAIDI down 78%, AT&C losses cut, renewable absorption optimized" },
    { num: 11, title: "Roadmap & Vision", desc: "DISCOM pilot rollout, edge IoT gateway scaling, nationwide smart grid" }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="hackathon-impact-view">
      {/* Top Banner */}
      <div className="grid-card" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-warning">YOUTH HACKATHON PITCH</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Grid Reliability & Renewable Intermittency Track</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginTop: '6px' }}>
              Projected DISCOM Impact & Reliability Metrics
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '850px', marginTop: '4px' }}>
              Demonstrating measurable return on investment (ROI), outage reduction, and renewable hosting capacity for Indian power distribution companies.
            </p>
          </div>
          <Award size={36} color="#f59e0b" />
        </div>
      </div>

      {/* 4 Big Impact KPI Cards */}
      <div className="grid-4col">
        {/* Metric 1: SAIDI */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>OUTAGE DURATION (SAIDI)</span>
            <TrendingDown size={18} color="#10b981" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '800', color: '#10b981', margin: '8px 0' }}>
            -78%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Average customer outage hours drop from 18.5 hrs/year down to 4.1 hrs/year via sub-minute FLISR rerouting.
          </div>
        </div>

        {/* Metric 2: AT&C Loss */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>AT&C LOSS REDUCTION</span>
            <TrendingDown size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-cyan)', margin: '8px 0' }}>
            -6.6%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            From 21.4% down to 14.8% by eliminating overloaded feeder bottlenecks and phase unbalance.
          </div>
        </div>

        {/* Metric 3: Renewable Curtailment */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>RENEWABLE ABSORPTION</span>
            <TrendingUp size={18} color="#f59e0b" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '800', color: '#f59e0b', margin: '8px 0' }}>
            +34%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Absorbing more rooftop solar and wind generation through coordinated BESS storage dispatch.
          </div>
        </div>

        {/* Metric 4: Field Safety */}
        <div className="grid-card" style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 'bold' }}>MANUAL HAZARD EXPOSURE</span>
            <ShieldCheck size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: '800', color: '#8b5cf6', margin: '8px 0' }}>
            ZERO
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Zero manual line switching required under storm faults, drastically improving lineman safety.
          </div>
        </div>
      </div>

      {/* 11-Slide Deck Presentation Mapping */}
      <div className="grid-card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="var(--accent-cyan)" />
          Hackathon Pitch Presentation Guide (11-Slide Deck Reference)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
          Corresponds directly to your submitted pitch presentation slides. Use these talking points during judging:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {slides.map(slide => (
            <div 
              key={slide.num}
              style={{
                background: 'var(--bg-stat-box)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-info">Slide {slide.num}</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{slide.title}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {slide.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
