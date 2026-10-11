import os
import time
import sqlite3
import json
from pathlib import Path

# Base data directory and DB path
_backend_dir = Path(__file__).resolve().parent
_data_dir = _backend_dir / 'data'
_data_dir.mkdir(parents=True, exist_ok=True)

_configured_db = os.environ.get('GRIDPULSE_DB_PATH')
if _configured_db:
    _db_path_obj = Path(_configured_db) if Path(_configured_db).is_absolute() else (Path.cwd() / _configured_db).resolve()
    DB_PATH = str(_db_path_obj)
else:
    DB_PATH = str((_data_dir / 'gridpulse.db').resolve())


def get_db_connection():
    """Create a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize schema tables and seed data if not present."""
    journal_mode = os.environ.get('DB_PRAGMA_JOURNAL_MODE', 'WAL')
    synchronous = os.environ.get('DB_PRAGMA_SYNCHRONOUS', 'NORMAL')

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        try:
            cur.execute(f"PRAGMA journal_mode = {journal_mode};")
            cur.execute(f"PRAGMA synchronous = {synchronous};")
        except Exception:
            pass

        # 1. Telemetry History (Time-Series)
        cur.execute("""
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
        """)

        # 2. Alarms Log
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alarms_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                component TEXT NOT NULL,
                message TEXT NOT NULL,
                acknowledged INTEGER DEFAULT 0
            );
        """)

        # 3. Breaker Operations Audit Trail (IEC 61850)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS breaker_operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                operator_id TEXT NOT NULL,
                feeder_id TEXT NOT NULL,
                action TEXT NOT NULL,
                interlock_status TEXT NOT NULL
            );
        """)

        # 4. Power Plants Registry
        cur.execute("""
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
        """)

        # 4b. 765kV / 400kV Grid Substations & Pooling Stations Registry
        cur.execute("""
            CREATE TABLE IF NOT EXISTS grid_substations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                operator TEXT NOT NULL,
                state TEXT,
                region TEXT,
                voltage_kv REAL NOT NULL,
                transformation_capacity_mva REAL NOT NULL,
                substation_type TEXT NOT NULL,
                connected_corridor TEXT,
                statcom_installed INTEGER DEFAULT 0,
                lat REAL,
                lng REAL,
                status TEXT NOT NULL,
                description TEXT
            );
        """)

        # 5. Demand Sinks Registry
        cur.execute("""
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
        """)

        # 6. Smart Meters Registry & Anomaly Scores
        cur.execute("""
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
        """)

        # 7. Cyber-Physical Security Incidents
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cyber_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                attack_type TEXT NOT NULL,
                target_node TEXT NOT NULL,
                chi_square_residual REAL NOT NULL,
                status TEXT NOT NULL,
                mitigation TEXT
            );
        """)

        # 8. IEX Electricity Market Cleared Bids
        cur.execute("""
            CREATE TABLE IF NOT EXISTS market_clearing (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                block_hour INTEGER NOT NULL,
                price_per_kwh REAL NOT NULL,
                national_demand_gw REAL NOT NULL,
                bess_action TEXT NOT NULL,
                arbitrage_spread REAL NOT NULL
            );
        """)

        conn.commit()
        seed_baseline_data(conn)
        print(f"[GridPulse SQLite] Database connected successfully at {DB_PATH} (journal_mode={journal_mode})")
    except Exception as e:
        print(f"[GridPulse SQLite] Error initializing database: {e}")
    finally:
        conn.close()


def seed_baseline_data(conn):
    """Seed default power plants, sinks, smart meters, and market bids if tables are empty."""
    cur = conn.cursor()

    # Load sources, substations, and sinks from JSON files
    sources_path = _backend_dir / 'sources_data.json'
    substations_path = _backend_dir / 'substations_data.json'
    sinks_path = _backend_dir / 'sinks_data.json'

    # Sync Power Plants
    if sources_path.exists():
        try:
            with open(sources_path, 'r', encoding='utf-8') as f:
                sources = json.load(f)
            for p in sources:
                cur.execute("""
                    INSERT OR REPLACE INTO power_plants (id, name, type, state, capacity_mw, current_gen_mw, lat, lng, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    p.get('id'),
                    p.get('name'),
                    p.get('type'),
                    p.get('state', 'India'),
                    float(p.get('capacityMw', 0)),
                    float(p.get('currentGenMw', 0)),
                    p.get('coordinates', [None, None])[0] if p.get('coordinates') else None,
                    p.get('coordinates', [None, None])[1] if p.get('coordinates') else None,
                    p.get('status', 'ONLINE')
                ))
            conn.commit()
            print(f"[GridPulse SQLite] Synced {len(sources)} power plants into SQLite.")
        except Exception as e:
            print(f"[GridPulse SQLite] Could not seed power plants: {e}")

    # Sync Grid Substations & Pooling Stations
    if substations_path.exists():
        try:
            with open(substations_path, 'r', encoding='utf-8') as f:
                substations = json.load(f)
            for s in substations:
                cur.execute("""
                    INSERT OR REPLACE INTO grid_substations (id, name, operator, state, region, voltage_kv, transformation_capacity_mva, substation_type, connected_corridor, statcom_installed, lat, lng, status, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s.get('id'),
                    s.get('name'),
                    s.get('operator', 'POWERGRID'),
                    s.get('state', 'India'),
                    s.get('region', 'NR'),
                    float(s.get('voltageKv', 400)),
                    float(s.get('transformationCapacityMva', 3000)),
                    s.get('substationType', 'GRID_SUBSTATION'),
                    s.get('connectedCorridor', ''),
                    1 if s.get('statcomInstalled') else 0,
                    s.get('coordinates', [None, None])[0] if s.get('coordinates') else None,
                    s.get('coordinates', [None, None])[1] if s.get('coordinates') else None,
                    s.get('status', 'ENERGIZED'),
                    s.get('description', '')
                ))
            conn.commit()
            print(f"[GridPulse SQLite] Synced {len(substations)} grid substations into SQLite.")
        except Exception as e:
            print(f"[GridPulse SQLite] Could not seed grid substations: {e}")

    # Check Demand Sinks
    cur.execute("SELECT COUNT(*) as count FROM demand_sinks")
    sink_count = cur.fetchone()[0]
    if sink_count == 0 and sinks_path.exists():
        try:
            with open(sinks_path, 'r', encoding='utf-8') as f:
                sinks = json.load(f)
            for s in sinks:
                cur.execute("""
                    INSERT OR IGNORE INTO demand_sinks (id, name, category, state, peak_demand_mw, current_demand_mw, lat, lng, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s.get('id'),
                    s.get('name'),
                    s.get('category'),
                    s.get('state', 'India'),
                    float(s.get('peakDemandMw', 0)),
                    float(s.get('currentDemandMw', 0)),
                    s.get('coordinates', [None, None])[0] if s.get('coordinates') else None,
                    s.get('coordinates', [None, None])[1] if s.get('coordinates') else None,
                    s.get('status', 'NORMAL')
                ))
            conn.commit()
            print(f"[GridPulse SQLite] Seeded {len(sinks)} demand sinks into SQLite.")
        except Exception as e:
            print(f"[GridPulse SQLite] Could not seed demand sinks: {e}")

    # Check Smart Meters
    cur.execute("SELECT COUNT(*) as count FROM smart_meters")
    meter_count = cur.fetchone()[0]
    if meter_count == 0:
        initial_meters = [
            ('MTR-IN-8910', 'Galaxy Plastic Works (SME)', 'FDR-01', 142.0, 139.5, 0.96, 0.12, 4.2, 'None', 'CLEAN'),
            ('MTR-AG-4421', 'Kisan Tube-Well #14', 'FDR-04', 88.0, 12.4, 0.68, 0.94, 94.6, 'Phase B Shunt Bypass Hooking', 'SUSPECT'),
            ('MTR-RS-2204', 'Mayur Enclave Apt 402', 'FDR-02', 18.5, 17.8, 0.98, 0.08, 2.1, 'None', 'CLEAN'),
            ('MTR-CM-7719', 'Kailash Cold Storage', 'FDR-01', 310.0, 124.0, 0.72, 0.88, 88.3, 'Neutral Line Disconnect & Tamper', 'SUSPECT'),
            ('MTR-AG-9932', 'Unregistered Submersible Pump', 'FDR-04', 65.0, 3.1, 0.62, 0.96, 97.1, 'Direct Overhead Line Jumper (Katiya)', 'FLAGGED_INSPECTION'),
            ('MTR-RS-5510', 'Pocket B Residential Block', 'FDR-02', 42.0, 41.2, 0.97, 0.15, 5.0, 'None', 'CLEAN')
        ]
        cur.executemany("""
            INSERT OR IGNORE INTO smart_meters (meter_id, consumer, feeder_id, avg_kwh, today_kwh, power_factor, anomaly_score, theft_prob, fraud_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_meters)
        conn.commit()

    # Check Market Clearing
    cur.execute("SELECT COUNT(*) as count FROM market_clearing")
    market_count = cur.fetchone()[0]
    if market_count == 0:
        hourly_prices = [
            (0, 3.40, 185.0, 'IDLE', 0.0),
            (6, 4.10, 205.0, 'IDLE', 0.0),
            (12, 2.40, 216.0, 'CHARGE', 7.55),
            (13, 2.15, 212.0, 'CHARGE', 7.80),
            (19, 9.60, 258.0, 'DISCHARGE', 7.45),
            (20, 9.95, 260.0, 'DISCHARGE', 7.80)
        ]
        cur.executemany("""
            INSERT OR IGNORE INTO market_clearing (block_hour, price_per_kwh, national_demand_gw, bess_action, arbitrage_spread)
            VALUES (?, ?, ?, ?, ?)
        """, hourly_prices)
        conn.commit()


def record_telemetry_tick(telemetry):
    """Insert a 1-second time-series snapshot and prune to last 2000 records."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO telemetry_history (timestamp, frequency_hz, incomer_kv, bus_kv, total_load_mw, total_gen_mw, at_c_loss_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            telemetry.get('frequencyHz', 50.0),
            telemetry.get('incomerVoltageKv', 66.2),
            telemetry.get('busVoltageKv', 11.08),
            telemetry.get('totalLoadMw', 23.5),
            telemetry.get('totalGenMw', 28.0),
            14.80
        ))
        # Keep last 2000 rows
        cur.execute("""
            DELETE FROM telemetry_history WHERE id NOT IN (
                SELECT id FROM telemetry_history ORDER BY id DESC LIMIT 2000
            );
        """)
        conn.commit()
    except Exception as e:
        print(f"[GridPulse SQLite] Error inserting telemetry tick: {e}")
    finally:
        conn.close()


def log_db_alarm(severity: str, component: str, message: str):
    """Insert an alarm record into alarms_log."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO alarms_log (timestamp, severity, component, message, acknowledged)
            VALUES (?, ?, ?, ?, 0)
        """, (time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), severity, component, message))
        conn.commit()
    except Exception as e:
        print(f"[GridPulse SQLite] Error logging alarm: {e}")
    finally:
        conn.close()


def log_db_breaker_op(operator_id: str, feeder_id: str, action: str, interlock_status: str):
    """Insert a breaker operation record into breaker_operations."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO breaker_operations (timestamp, operator_id, feeder_id, action, interlock_status)
            VALUES (?, ?, ?, ?, ?)
        """, (time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), operator_id, feeder_id, action, interlock_status))
        conn.commit()
    except Exception as e:
        print(f"[GridPulse SQLite] Error logging breaker operation: {e}")
    finally:
        conn.close()


def log_db_cyber_incident(attack_type: str, target_node: str, chi_square_residual: float, status: str, mitigation: str):
    """Insert a cyber-security incident record."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO cyber_incidents (timestamp, attack_type, target_node, chi_square_residual, status, mitigation)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), attack_type, target_node, chi_square_residual, status, mitigation))
        conn.commit()
    except Exception as e:
        print(f"[GridPulse SQLite] Error logging cyber incident: {e}")
    finally:
        conn.close()


def get_db_telemetry_history(limit: int = 60):
    """Retrieve the recent time-series telemetry rows in chronological order."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM telemetry_history ORDER BY id DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        return list(reversed(rows))
    except Exception as e:
        print(f"[GridPulse SQLite] Error fetching telemetry history: {e}")
        return []
    finally:
        conn.close()


def get_db_alarms(limit: int = 50):
    """Retrieve recent alarms from the database."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM alarms_log ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cur.fetchall()]
    except Exception as e:
        print(f"[GridPulse SQLite] Error fetching alarms: {e}")
        return []
    finally:
        conn.close()


def get_db_breaker_operations(limit: int = 50):
    """Retrieve breaker operations audit trail."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM breaker_operations ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cur.fetchall()]
    except Exception as e:
        print(f"[GridPulse SQLite] Error fetching breaker ops: {e}")
        return []
    finally:
        conn.close()


def get_db_substations(limit: int = 100):
    """Retrieve grid substations and pooling stations."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM grid_substations ORDER BY voltage_kv DESC, transformation_capacity_mva DESC LIMIT ?", (limit,))
        return [dict(r) for r in cur.fetchall()]
    except Exception as e:
        print(f"[GridPulse SQLite] Error fetching substations: {e}")
        return []
    finally:
        conn.close()


def get_database_stats():
    """Return database health, file size, and table row counts."""
    tables = [
        'telemetry_history',
        'alarms_log',
        'breaker_operations',
        'power_plants',
        'grid_substations',
        'demand_sinks',
        'smart_meters',
        'cyber_incidents',
        'market_clearing'
    ]
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        stats = {}
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            stats[t] = cur.fetchone()[0]

        file_stat = os.stat(DB_PATH) if os.path.exists(DB_PATH) else None
        size_bytes = file_stat.st_size if file_stat else 0

        return {
            'status': 'ONLINE',
            'engine': 'Python 3.14 Native SQLite (sqlite3)',
            'databaseFile': DB_PATH,
            'sizeBytes': size_bytes,
            'sizeKb': round(size_bytes / 1024, 1),
            'tableCounts': stats
        }
    except Exception as e:
        return {'status': 'ERROR', 'error': str(e)}
    finally:
        conn.close()


def execute_read_only_query(sql: str):
    """Execute a safe read-only SQL query for SCADA operators and return rows."""
    trimmed = sql.strip()
    upper = trimmed.upper()

    if not (upper.startswith('SELECT') or upper.startswith('PRAGMA') or upper.startswith('EXPLAIN')):
        raise ValueError('SECURITY RESTRICTION: Only read-only queries (SELECT) are permitted in production SCADA mode.')

    forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'ATTACH', 'DETACH', 'VACUUM']
    for f in forbidden:
        if f" {f} " in upper or f";{f}" in upper or upper.endswith(f" {f}"):
            raise ValueError(f"SECURITY RESTRICTION: Forbidden modification keyword detected ({f}).")

    start_time = time.perf_counter()
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(trimmed)
        rows = [dict(r) for r in cur.fetchall()]
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            'rows': rows,
            'rowCount': len(rows),
            'durationMs': duration_ms
        }
    finally:
        conn.close()
