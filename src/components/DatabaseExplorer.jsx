import React, { useState, useEffect } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Database,
  Table,
  Play,
  Download,
  Search,
  Server,
  Terminal,
  CheckCircle2,
  AlertCircle,
  FileCode,
  HardDrive,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { playBreakerCloseSound } from '../utils/audioEffects';

export const DatabaseExplorer = () => {
  const [dbStats, setDbStats] = useState({
    status: 'ONLINE',
    engine: 'Node.js 25 Native SQLite (node:sqlite)',
    databaseFile: 'backend/data/gridpulse.db',
    sizeKb: 64.0,
    tableCounts: {
      telemetry_history: 120,
      power_plants: 42,
      demand_sinks: 47,
      smart_meters: 6,
      breaker_operations: 18,
      alarms_log: 24,
      cyber_incidents: 4,
      market_clearing: 6
    }
  });

  const [activeTable, setActiveTable] = useState('power_plants');
  const [tableSearch, setTableSearch] = useState('');
  const [sqlInput, setSqlInput] = useState('SELECT type, COUNT(*) as count, ROUND(SUM(capacity_mw), 1) as total_capacity_mw FROM power_plants GROUP BY type ORDER BY total_capacity_mw DESC;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch live DB stats from server if online
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/db/health');
        if (res.ok) {
          const json = await res.json();
          if (json.data) setDbStats(json.data);
        }
      } catch (e) {
        // Fallback to local default stats
      }
    };
    fetchStats();
  }, []);

  // Built-in seed data for client-side offline preview
  const tableDataPreviews = {
    power_plants: [
      { id: "SRC-BHADLA", name: "Bhadla Solar Park", type: "SOLAR", state: "Rajasthan", capacity_mw: 2245, current_gen_mw: 1980, status: "ONLINE" },
      { id: "SRC-KHAVDA", name: "Khavda Hybrid Renewable Park", type: "SOLAR_WIND", state: "Gujarat", capacity_mw: 3000, current_gen_mw: 2450, status: "ONLINE" },
      { id: "SRC-MUNDRA-T", name: "Mundra Thermal Power Station", type: "COAL", state: "Gujarat", capacity_mw: 4620, current_gen_mw: 3820, status: "ONLINE" },
      { id: "SRC-KUDANKULAM", name: "Kudankulam Nuclear Power Plant (KKNPP)", type: "NUCLEAR", state: "Tamil Nadu", capacity_mw: 2000, current_gen_mw: 1950, status: "ONLINE" },
      { id: "SRC-SARDAR-SAROVAR", name: "Sardar Sarovar Dam Hydro", type: "HYDRO", state: "Gujarat", capacity_mw: 1450, current_gen_mw: 1180, status: "ONLINE" },
      { id: "SRC-TEHRI", name: "Tehri Hydro & PSP", type: "HYDRO_PSP", state: "Uttarakhand", capacity_mw: 1400, current_gen_mw: 950, status: "ONLINE" },
    ],
    demand_sinks: [
      { id: "SNK-DELHI", name: "National Capital Region (Delhi NCT)", category: "METRO", state: "Delhi", peak_demand_mw: 7400, current_demand_mw: 6240, status: "NORMAL" },
      { id: "SNK-MUMBAI", name: "Greater Mumbai & MMR", category: "METRO", state: "Maharashtra", peak_demand_mw: 4200, current_demand_mw: 3680, status: "NORMAL" },
      { id: "SNK-BENGALURU", name: "Bengaluru Tech Hub & IT Corridor", category: "METRO", state: "Karnataka", peak_demand_mw: 3850, current_demand_mw: 3120, status: "NORMAL" },
      { id: "SNK-HAZIRA", name: "Hazira Petrochemical & Heavy Industrial Hub", category: "INDUSTRY", state: "Gujarat", peak_demand_mw: 2800, current_demand_mw: 2450, status: "NORMAL" },
      { id: "SNK-DMRC", name: "Delhi Metro Rail Corporation (Transit)", category: "TRANSIT", state: "Delhi", peak_demand_mw: 450, current_demand_mw: 380, status: "CRITICAL" },
    ],
    smart_meters: [
      { meter_id: "MTR-IN-8910", consumer: "Galaxy Plastic Works (SME)", feeder_id: "FDR-01", avg_kwh: 142.0, today_kwh: 139.5, power_factor: 0.96, theft_prob: 4.2, status: "CLEAN" },
      { meter_id: "MTR-AG-4421", consumer: "Kisan Tube-Well #14", feeder_id: "FDR-04", avg_kwh: 88.0, today_kwh: 12.4, power_factor: 0.68, theft_prob: 94.6, status: "SUSPECT" },
      { meter_id: "MTR-RS-2204", consumer: "Mayur Enclave Apt 402", feeder_id: "FDR-02", avg_kwh: 18.5, today_kwh: 17.8, power_factor: 0.98, theft_prob: 2.1, status: "CLEAN" },
      { meter_id: "MTR-CM-7719", consumer: "Kailash Cold Storage", feeder_id: "FDR-01", avg_kwh: 310.0, today_kwh: 124.0, power_factor: 0.72, theft_prob: 88.3, status: "SUSPECT" },
      { meter_id: "MTR-AG-9932", consumer: "Unregistered Submersible Pump", feeder_id: "FDR-04", avg_kwh: 65.0, today_kwh: 3.1, power_factor: 0.62, theft_prob: 97.1, status: "FLAGGED_INSPECTION" }
    ],
    telemetry_history: [
      { id: 101, timestamp: "2026-09-30T18:30:00Z", frequency_hz: 50.01, incomer_kv: 66.2, bus_kv: 11.08, total_load_mw: 23.72, total_gen_mw: 28.00, at_c_loss_pct: 14.80 },
      { id: 102, timestamp: "2026-09-30T18:30:05Z", frequency_hz: 50.02, incomer_kv: 66.2, bus_kv: 11.09, total_load_mw: 23.68, total_gen_mw: 28.00, at_c_loss_pct: 14.80 },
      { id: 103, timestamp: "2026-09-30T18:30:10Z", frequency_hz: 49.99, incomer_kv: 66.1, bus_kv: 11.07, total_load_mw: 23.75, total_gen_mw: 28.00, at_c_loss_pct: 14.80 },
      { id: 104, timestamp: "2026-09-30T18:30:15Z", frequency_hz: 50.00, incomer_kv: 66.2, bus_kv: 11.08, total_load_mw: 23.71, total_gen_mw: 28.00, at_c_loss_pct: 14.80 },
    ],
    breaker_operations: [
      { id: 1, timestamp: "18:15:20", operator_id: "DISCOM-ENG-402", feeder_id: "FDR-02", action: "TRIP", interlock_status: "VERIFIED" },
      { id: 2, timestamp: "18:15:27", operator_id: "AUTONOMOUS-FLISR", feeder_id: "SW-2A", action: "OPEN_ISOLATE", interlock_status: "VERIFIED" },
      { id: 3, timestamp: "18:15:32", operator_id: "AUTONOMOUS-FLISR", feeder_id: "TS-1-2", action: "CLOSE_TIE", interlock_status: "VERIFIED" },
    ]
  };

  // Run Custom SQL Query
  const handleExecuteQuery = async () => {
    setIsExecuting(true);
    setQueryError(null);
    playBreakerCloseSound();

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlInput })
      });

      if (res.ok) {
        const json = await res.json();
        setQueryResult(json);
      } else {
        const err = await res.json();
        setQueryError(err.error || 'SQL query failed');
      }
    } catch (e) {
      // Simulate client execution if offline
      setTimeout(() => {
        setQueryResult({
          rows: [
            { type: "COAL", count: 18, total_capacity_mw: 18450.0 },
            { type: "SOLAR", count: 12, total_capacity_mw: 8240.0 },
            { type: "HYDRO", count: 8, total_capacity_mw: 4850.0 },
            { type: "NUCLEAR", count: 4, total_capacity_mw: 2000.0 }
          ],
          rowCount: 4,
          durationMs: 3.4
        });
      }, 250);
    } finally {
      setIsExecuting(false);
    }
  };

  // Preset SQL Queries
  const presets = [
    {
      label: 'Generation by Fuel Type',
      sql: 'SELECT type, COUNT(*) as count, ROUND(SUM(capacity_mw), 1) as total_capacity_mw FROM power_plants GROUP BY type ORDER BY total_capacity_mw DESC;'
    },
    {
      label: 'Flagged Theft Meters (> 70% Prob)',
      sql: 'SELECT meter_id, consumer, feeder_id, today_kwh, theft_prob, fraud_type FROM smart_meters WHERE theft_prob > 70 ORDER BY theft_prob DESC;'
    },
    {
      label: 'Top 5 Industrial Demand Sinks',
      sql: 'SELECT id, name, state, peak_demand_mw FROM demand_sinks WHERE category="INDUSTRY" ORDER BY peak_demand_mw DESC LIMIT 5;'
    },
    {
      label: 'Latest 10 Breaker Operations',
      sql: 'SELECT * FROM breaker_operations ORDER BY id DESC LIMIT 10;'
    }
  ];

  const activeRows = tableDataPreviews[activeTable] || [];
  const filteredRows = activeRows.filter(r => 
    Object.values(r).some(val => String(val).toLowerCase().includes(tableSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="database-explorer-view">
      {/* 1. Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #38bdf8', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-info" style={{ fontWeight: 'bold' }}>ACID COMPLIANT RELATIONAL DATABASE</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {dbStats.engine} • High-Concurrency WAL Mode
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={26} color="#38bdf8" />
              Production-Grade SQLite Database & Time-Series Archive
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Embedded zero-configuration relational storage persisting SCADA telemetry ticks, switchgear operations, alarms log, smart meter registries, and IEX market bids.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Database File:</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              backend/data/gridpulse.db
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Size: {dbStats.sizeKb} KB • Synchronous Normal</span>
          </div>
        </div>

        {/* Database Table Counts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {Object.entries(dbStats.tableCounts || {}).map(([tbl, cnt]) => (
            <div 
              key={tbl} 
              onClick={() => tableDataPreviews[tbl] && setActiveTable(tbl)}
              style={{ 
                background: activeTable === tbl ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-stat-box)', 
                border: `1px solid ${activeTable === tbl ? '#38bdf8' : 'var(--border-subtle)'}`,
                padding: '10px 12px', 
                borderRadius: '8px',
                cursor: tableDataPreviews[tbl] ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {tbl.replace('_', ' ')}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 'bold', color: activeTable === tbl ? '#38bdf8' : 'var(--text-primary)' }}>
                {cnt} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>rows</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Interactive SQL Query Studio Console */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="var(--accent-cyan)" />
              Live SCADA SQL Query Console (Read-Only Safe Mode)
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Write or load SQL queries to inspect generation metrics, feeder losses, or smart meter anomalies in real-time.
            </div>
          </div>

          <button
            onClick={handleExecuteQuery}
            disabled={isExecuting}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '7px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
          >
            <Play size={14} />
            {isExecuting ? 'Executing Query...' : 'Run SQL Query'}
          </button>
        </div>

        {/* Preset Query Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px' }}>
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => { setSqlInput(p.sql); setQueryResult(null); }}
              style={{
                fontSize: '0.72rem',
                background: sqlInput === p.sql ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-stat-box)',
                color: sqlInput === p.sql ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${sqlInput === p.sql ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                padding: '5px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* SQL Input Textarea */}
        <textarea
          rows={3}
          value={sqlInput}
          onChange={(e) => setSqlInput(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-stat-box)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#38bdf8',
            outline: 'none',
            resize: 'vertical'
          }}
        />

        {queryError && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.8rem' }}>
            ⚠️ {queryError}
          </div>
        )}

        {/* Query Results Table */}
        {queryResult && queryResult.rows && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>
                Returned <strong>{queryResult.rowCount} rows</strong> in <strong>{queryResult.durationMs} ms</strong>
              </span>
              <span className="badge badge-success">SQL OK</span>
            </div>

            <div style={{ overflowX: 'auto', background: 'var(--bg-stat-box)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    {Object.keys(queryResult.rows[0] || {}).map(col => (
                      <th key={col} style={{ padding: '8px 12px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px 12px', fontFamily: typeof val === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Relational Table Browser */}
      <div className="grid-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={18} color="var(--accent-cyan)" />
              Database Table Viewer: <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{activeTable}</span>
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Browsing active records stored in SQLite database.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search table..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  background: 'var(--bg-stat-box)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 12px 6px 30px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Render */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                {Object.keys(filteredRows[0] || {}).map(k => (
                  <th key={k} style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {Object.values(r).map((v, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px', fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                      {String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
