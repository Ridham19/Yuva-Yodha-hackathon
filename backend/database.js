import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ELECTRICITY_SOURCES } from './sourcesData.js';
import { ELECTRICITY_SINKS } from './sinksData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // .env may already be loaded or provided by environment
}

// Database file path: backend/data/gridpulse.db or custom path from .env
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const configuredDbPath = process.env.GRIDPULSE_DB_PATH;
const dbPath = configuredDbPath
  ? (path.isAbsolute(configuredDbPath) ? configuredDbPath : path.resolve(process.cwd(), configuredDbPath))
  : path.join(dataDir, 'gridpulse.db');

let db = null;

try {
  db = new DatabaseSync(dbPath);
  const journalMode = process.env.DB_PRAGMA_JOURNAL_MODE || 'WAL';
  const synchronous = process.env.DB_PRAGMA_SYNCHRONOUS || 'NORMAL';
  try {
    db.exec(`PRAGMA journal_mode = ${journalMode};`);
    db.exec(`PRAGMA synchronous = ${synchronous};`);
  } catch (pe) {
    // Ignore pragma error if memory mode
  }
  console.log(`[GridPulse SQLite] Database connected successfully at ${dbPath} (journal_mode=${journalMode})`);
} catch (e) {
  console.error('[GridPulse SQLite] Failed to connect to database:', e);
}

// Initialize Relational Schema & Tables
export function initDatabase() {
  if (!db) return;

  // 1. Telemetry History (Time-Series)
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      frequency_hz REAL NOT NULL,
      incomer_kv REAL NOT NULL,
      bus_kv REAL NOT NULL,
      total_load_mw REAL NOT NULL,
      total_gen_mw REAL NOT NULL,
      at_c_loss_pct REAL NOT NULL
    );
  `);

  // 2. Alarms Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS alarms_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      severity TEXT NOT NULL,
      component TEXT NOT NULL,
      message TEXT NOT NULL,
      acknowledged INTEGER DEFAULT 0
    );
  `);

  // 3. Breaker Operations Audit Trail (IEC 61850)
  db.exec(`
    CREATE TABLE IF NOT EXISTS breaker_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      feeder_id TEXT NOT NULL,
      action TEXT NOT NULL,
      interlock_status TEXT NOT NULL
    );
  `);

  // 4. Power Plants Registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS power_plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      state TEXT,
      capacity_mw REAL NOT NULL,
      current_gen_mw REAL NOT NULL,
      lat REAL,
      lng REAL,
      status TEXT NOT NULL
    );
  `);

  // 5. Demand Sinks Registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS demand_sinks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      state TEXT,
      peak_demand_mw REAL NOT NULL,
      current_demand_mw REAL NOT NULL,
      lat REAL,
      lng REAL,
      status TEXT NOT NULL
    );
  `);

  // 6. Smart Meters Registry & Anomaly Scores
  db.exec(`
    CREATE TABLE IF NOT EXISTS smart_meters (
      meter_id TEXT PRIMARY KEY,
      consumer TEXT NOT NULL,
      feeder_id TEXT NOT NULL,
      avg_kwh REAL NOT NULL,
      today_kwh REAL NOT NULL,
      power_factor REAL NOT NULL,
      anomaly_score REAL NOT NULL,
      theft_prob REAL NOT NULL,
      fraud_type TEXT,
      status TEXT NOT NULL
    );
  `);

  // 7. Cyber-Physical Security Incidents
  db.exec(`
    CREATE TABLE IF NOT EXISTS cyber_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      attack_type TEXT NOT NULL,
      target_node TEXT NOT NULL,
      chi_square_residual REAL NOT NULL,
      status TEXT NOT NULL,
      mitigation TEXT
    );
  `);

  // 8. IEX Electricity Market Cleared Bids
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_clearing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_hour INTEGER NOT NULL,
      price_per_kwh REAL NOT NULL,
      national_demand_gw REAL NOT NULL,
      bess_action TEXT NOT NULL,
      arbitrage_spread REAL NOT NULL
    );
  `);

  // Seed baseline data if empty
  seedBaselineData();
}

function seedBaselineData() {
  if (!db) return;

  // Check Power Plants
  const plantCount = db.prepare('SELECT COUNT(*) as count FROM power_plants').get().count;
  if (plantCount === 0 && ELECTRICITY_SOURCES && ELECTRICITY_SOURCES.length > 0) {
    const insertPlant = db.prepare(`
      INSERT INTO power_plants (id, name, type, state, capacity_mw, current_gen_mw, lat, lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of ELECTRICITY_SOURCES) {
      insertPlant.run(
        p.id, p.name, p.type, p.state || 'India', p.capacityMw || 0,
        p.currentGenMw || 0, p.lat || null, p.lng || null, p.status || 'ONLINE'
      );
    }
    console.log(`[GridPulse SQLite] Seeded ${ELECTRICITY_SOURCES.length} power plants into SQLite.`);
  }

  // Check Demand Sinks
  const sinkCount = db.prepare('SELECT COUNT(*) as count FROM demand_sinks').get().count;
  if (sinkCount === 0 && ELECTRICITY_SINKS && ELECTRICITY_SINKS.length > 0) {
    const insertSink = db.prepare(`
      INSERT INTO demand_sinks (id, name, category, state, peak_demand_mw, current_demand_mw, lat, lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of ELECTRICITY_SINKS) {
      insertSink.run(
        s.id, s.name, s.category, s.state || 'India', s.peakDemandMw || 0,
        s.currentDemandMw || 0, s.lat || null, s.lng || null, s.status || 'NORMAL'
      );
    }
    console.log(`[GridPulse SQLite] Seeded ${ELECTRICITY_SINKS.length} demand sinks into SQLite.`);
  }

  // Check Smart Meters
  const meterCount = db.prepare('SELECT COUNT(*) as count FROM smart_meters').get().count;
  if (meterCount === 0) {
    const insertMeter = db.prepare(`
      INSERT INTO smart_meters (meter_id, consumer, feeder_id, avg_kwh, today_kwh, power_factor, anomaly_score, theft_prob, fraud_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const initialMeters = [
      ['MTR-IN-8910', 'Galaxy Plastic Works (SME)', 'FDR-01', 142.0, 139.5, 0.96, 0.12, 4.2, 'None', 'CLEAN'],
      ['MTR-AG-4421', 'Kisan Tube-Well #14', 'FDR-04', 88.0, 12.4, 0.68, 0.94, 94.6, 'Phase B Shunt Bypass Hooking', 'SUSPECT'],
      ['MTR-RS-2204', 'Mayur Enclave Apt 402', 'FDR-02', 18.5, 17.8, 0.98, 0.08, 2.1, 'None', 'CLEAN'],
      ['MTR-CM-7719', 'Kailash Cold Storage', 'FDR-01', 310.0, 124.0, 0.72, 0.88, 88.3, 'Neutral Line Disconnect & Tamper', 'SUSPECT'],
      ['MTR-AG-9932', 'Unregistered Submersible Pump', 'FDR-04', 65.0, 3.1, 0.62, 0.96, 97.1, 'Direct Overhead Line Jumper (Katiya)', 'FLAGGED_INSPECTION'],
      ['MTR-RS-5510', 'Pocket B Residential Block', 'FDR-02', 42.0, 41.2, 0.97, 0.15, 5.0, 'None', 'CLEAN']
    ];
    for (const m of initialMeters) {
      insertMeter.run(...m);
    }
  }

  // Check Market Clearing
  const marketCount = db.prepare('SELECT COUNT(*) as count FROM market_clearing').get().count;
  if (marketCount === 0) {
    const insertMarket = db.prepare(`
      INSERT INTO market_clearing (block_hour, price_per_kwh, national_demand_gw, bess_action, arbitrage_spread)
      VALUES (?, ?, ?, ?, ?)
    `);
    const hourlyPrices = [
      [0, 3.40, 185, 'IDLE', 0.0],
      [6, 4.10, 205, 'IDLE', 0.0],
      [12, 2.40, 216, 'CHARGE', 7.55],
      [13, 2.15, 212, 'CHARGE', 7.80],
      [19, 9.60, 258, 'DISCHARGE', 7.45],
      [20, 9.95, 260, 'DISCHARGE', 7.80]
    ];
    for (const row of hourlyPrices) {
      insertMarket.run(...row);
    }
  }
}

// Record Real-Time Telemetry Tick
export function recordTelemetryTick(telemetry) {
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO telemetry_history (timestamp, frequency_hz, incomer_kv, bus_kv, total_load_mw, total_gen_mw, at_c_loss_pct)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      new Date().toISOString(),
      telemetry.frequencyHz || 50.0,
      telemetry.incomerVoltageKv || 66.2,
      telemetry.busVoltageKv || 11.08,
      telemetry.totalLoadMw || 23.5,
      telemetry.totalGenMw || 28.0,
      14.80
    );

    // Prune history to keep last 2000 ticks (~30 minutes of 1s ticks)
    db.exec(`
      DELETE FROM telemetry_history WHERE id IN (
        SELECT id FROM telemetry_history ORDER BY id DESC LIMIT -1 OFFSET 2000
      );
    `);
  } catch (e) {
    console.error('[GridPulse SQLite] Error inserting telemetry tick:', e);
  }
}

// Log Alarm
export function logDbAlarm(severity, component, message) {
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO alarms_log (timestamp, severity, component, message, acknowledged)
      VALUES (?, ?, ?, ?, 0)
    `);
    stmt.run(new Date().toISOString(), severity, component, message);
  } catch (e) {
    console.error('[GridPulse SQLite] Error logging alarm:', e);
  }
}

// Log Breaker Operation (IEC 61850)
export function logDbBreakerOp(operatorId, feederId, action, interlockStatus) {
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO breaker_operations (timestamp, operator_id, feeder_id, action, interlock_status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(new Date().toISOString(), operatorId, feederId, action, interlockStatus);
  } catch (e) {
    console.error('[GridPulse SQLite] Error logging breaker operation:', e);
  }
}

// Log Cyber Incident
export function logDbCyberIncident(attackType, targetNode, chiSquareResidual, status, mitigation) {
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO cyber_incidents (timestamp, attack_type, target_node, chi_square_residual, status, mitigation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(new Date().toISOString(), attackType, targetNode, chiSquareResidual, status, mitigation);
  } catch (e) {
    console.error('[GridPulse SQLite] Error logging cyber incident:', e);
  }
}

// Retrieve Telemetry History
export function getDbTelemetryHistory(limit = 60) {
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT * FROM telemetry_history ORDER BY id DESC LIMIT ?
    `).all(limit);
    return rows.reverse();
  } catch (e) {
    console.error('[GridPulse SQLite] Error fetching telemetry history:', e);
    return [];
  }
}

// Retrieve Alarms
export function getDbAlarms(limit = 50) {
  if (!db) return [];
  try {
    return db.prepare(`SELECT * FROM alarms_log ORDER BY id DESC LIMIT ?`).all(limit);
  } catch (e) {
    return [];
  }
}

// Retrieve Breaker Operations
export function getDbBreakerOperations(limit = 50) {
  if (!db) return [];
  try {
    return db.prepare(`SELECT * FROM breaker_operations ORDER BY id DESC LIMIT ?`).all(limit);
  } catch (e) {
    return [];
  }
}

// Retrieve Database Health & Table Counts
export function getDatabaseStats() {
  if (!db) return { status: 'DISCONNECTED' };

  try {
    const tables = [
      'telemetry_history',
      'alarms_log',
      'breaker_operations',
      'power_plants',
      'demand_sinks',
      'smart_meters',
      'cyber_incidents',
      'market_clearing'
    ];

    const stats = {};
    for (const t of tables) {
      const res = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get();
      stats[t] = res.count;
    }

    const fileStat = fs.existsSync(dbPath) ? fs.statSync(dbPath) : { size: 0 };

    return {
      status: 'ONLINE',
      engine: 'Node.js 25 Native SQLite (node:sqlite)',
      databaseFile: dbPath,
      sizeBytes: fileStat.size,
      sizeKb: +(fileStat.size / 1024).toFixed(1),
      tableCounts: stats
    };
  } catch (e) {
    return { status: 'ERROR', error: e.message };
  }
}

// Execute Read-Only SQL Query (Safe Console for SCADA operators)
export function executeReadOnlyQuery(sql) {
  if (!db) throw new Error('Database is offline');

  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // Enforce read-only constraint
  if (!upper.startsWith('SELECT') && !upper.startsWith('PRAGMA') && !upper.startsWith('EXPLAIN')) {
    throw new Error('SECURITY RESTRICTION: Only read-only queries (SELECT) are permitted in production SCADA mode.');
  }

  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'ATTACH', 'DETACH', 'VACUUM'];
  for (const f of forbidden) {
    if (upper.includes(` ${f} `) || upper.includes(`;${f}`)) {
      throw new Error(`SECURITY RESTRICTION: Forbidden modification keyword detected (${f}).`);
    }
  }

  const startTime = performance.now();
  const rows = db.prepare(trimmed).all();
  const durationMs = +(performance.now() - startTime).toFixed(2);

  return {
    rows,
    rowCount: rows.length,
    durationMs
  };
}
