import os
import sys
import copy
import json
import time
import math
import random
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

# Load .env file if present
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    try:
        with open(_env_path, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
    except Exception:
        pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

_backend_dir = Path(__file__).resolve().parent
_project_root = _backend_dir.parent
for _p in [str(_backend_dir), str(_project_root)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.database import (
        init_database,
        record_telemetry_tick,
        log_db_alarm,
        log_db_breaker_op,
        get_db_telemetry_history,
        get_db_alarms,
        get_db_breaker_operations,
        get_database_stats,
        execute_read_only_query
    )
    from backend.ml_service import GridPulseMLEngine
except ImportError:
    from database import (
        init_database,
        record_telemetry_tick,
        log_db_alarm,
        log_db_breaker_op,
        get_db_telemetry_history,
        get_db_alarms,
        get_db_breaker_operations,
        get_database_stats,
        execute_read_only_query
    )
    from ml_service import GridPulseMLEngine

_backend_dir = Path(__file__).resolve().parent

# Load JSON datasets
with open(_backend_dir / 'official_grid_data.json', 'r', encoding='utf-8') as f:
    _official_data = json.load(f)

with open(_backend_dir / 'sources_data.json', 'r', encoding='utf-8') as f:
    _sources_data = json.load(f)

with open(_backend_dir / 'substations_data.json', 'r', encoding='utf-8') as f:
    _substations_data = json.load(f)

with open(_backend_dir / 'sinks_data.json', 'r', encoding='utf-8') as f:
    _sinks_data = json.load(f)

OFFICIAL_NLDC_BASELINE = _official_data['OFFICIAL_NLDC_BASELINE']
REGIONAL_DESPATCH_CENTRES = _official_data['REGIONAL_DESPATCH_CENTRES']
OFFICIAL_TRANSMISSION_CORRIDORS = _official_data['OFFICIAL_TRANSMISSION_CORRIDORS']
ELECTRICITY_SOURCES = _sources_data
ELECTRICITY_SINKS = _sinks_data
GRID_SUBSTATIONS = _substations_data

# Comprehensive Transmission Corridors
ALL_TRANSMISSION_CORRIDORS = [
    *OFFICIAL_TRANSMISSION_CORRIDORS,
    {
        "id": "CORR-XBORDER-BANGLADESH",
        "name": "Baharampur (India) -> Bheramara (Bangladesh) 400 kV HVDC Interconnection",
        "from": [24.10, 88.25],
        "to": [24.03, 89.02],
        "capacityMw": 1000,
        "flowMw": 840,
        "voltageKv": 400,
        "type": "CROSS_BORDER_LINK",
        "color": "#10b981",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-XBORDER-NEPAL",
        "name": "Muzaffarpur (India) -> Dhalkebar (Nepal) 400 kV Cross-Border Interconnection",
        "from": [26.12, 85.39],
        "to": [26.96, 85.95],
        "capacityMw": 1000,
        "flowMw": 620,
        "voltageKv": 400,
        "type": "CROSS_BORDER_LINK",
        "color": "#10b981",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-XBORDER-BHUTAN",
        "name": "Tala Hydro (Bhutan) -> Alipurduar (India) 400 kV Cross-Border Link",
        "from": [27.02, 89.65],
        "to": [26.49, 89.53],
        "capacityMw": 2000,
        "flowMw": 1450,
        "voltageKv": 400,
        "type": "CROSS_BORDER_LINK",
        "color": "#38bdf8",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-UKAI-SURAT",
        "name": "Ukai Dam Hydro -> Surat 220 kV Transmission Feeder",
        "from": [21.25, 73.58],
        "to": [21.17, 72.83],
        "capacityMw": 600,
        "flowMw": 240,
        "voltageKv": 220,
        "type": "HYDRO_FEEDER",
        "color": "#38bdf8",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-NARMADA-AHM",
        "name": "Sardar Sarovar Narmada Hydro -> Ahmedabad 400 kV Link",
        "from": [21.83, 73.75],
        "to": [23.02, 72.57],
        "capacityMw": 1500,
        "flowMw": 1180,
        "voltageKv": 400,
        "type": "HYDRO_TRANSMISSION",
        "color": "#38bdf8",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-KAPS-HAZIRA",
        "name": "Kakrapar Atomic (KAPS) -> Hazira 400 kV Industrial Link",
        "from": [21.24, 73.35],
        "to": [21.11, 72.67],
        "capacityMw": 2000,
        "flowMw": 1420,
        "voltageKv": 400,
        "type": "NUCLEAR_FEEDER",
        "color": "#a855f7",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-TAPS-MUMBAI",
        "name": "Tarapur Nuclear (TAPS) -> Mumbai 400 kV Corridor",
        "from": [19.83, 72.65],
        "to": [19.07, 72.87],
        "capacityMw": 1600,
        "flowMw": 1350,
        "voltageKv": 400,
        "type": "NUCLEAR_FEEDER",
        "color": "#a855f7",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-MUNDRA-SANAND",
        "name": "Mundra Thermal -> Sanand Auto Mega Hub 400 kV Link",
        "from": [22.82, 69.52],
        "to": [23.00, 72.38],
        "capacityMw": 1200,
        "flowMw": 480,
        "voltageKv": 400,
        "type": "INDUSTRIAL_FEEDER",
        "color": "#8b5cf6",
        "status": "ENERGIZED",
        "rerouteTarget": None
    },
    {
        "id": "CORR-CHARANKA-AHM",
        "name": "Charanka Solar -> Ahmedabad 400 kV Green Line",
        "from": [23.91, 71.19],
        "to": [23.02, 72.57],
        "capacityMw": 1000,
        "flowMw": 680,
        "voltageKv": 400,
        "type": "GREEN_ENERGY_CORRIDOR",
        "color": "#f59e0b",
        "status": "ENERGIZED",
        "rerouteTarget": None
    }
]

PORT = int(os.environ.get('PORT', 5000))
HOST = os.environ.get('HOST', '0.0.0.0')
ML_SERVICE_URL = os.environ.get('ML_SERVICE_URL', 'http://127.0.0.1:8000')

# Server state containers
grid_state = {
    "nldc": copy.deepcopy(OFFICIAL_NLDC_BASELINE),
    "regions": copy.deepcopy(REGIONAL_DESPATCH_CENTRES),
    "sources": copy.deepcopy(ELECTRICITY_SOURCES),
    "substations": copy.deepcopy(GRID_SUBSTATIONS),
    "sinks": copy.deepcopy(ELECTRICITY_SINKS),
    "corridors": copy.deepcopy(ALL_TRANSMISSION_CORRIDORS),
    "substation": {
        "id": "SS-NORTH-01",
        "name": "Mayur Vihar 66/11kV Distribution Substation",
        "operatorRegion": "NRLDC / Delhi Transco",
        "frequencyHz": 50.01,
        "incomerVoltageKv": 66.2,
        "busVoltageKv": 11.08,
        "totalLoadMw": 23.72,
        "totalGenMw": 28.00,
        "feeders": [
            {
                "id": "FDR-01",
                "name": "Industrial Park Feeder",
                "type": "INDUSTRIAL",
                "voltageKv": 11.08,
                "currentA": 342.5,
                "activePowerMw": 6.20,
                "reactivePowerMvar": 1.40,
                "powerFactor": 0.97,
                "breakerState": "CLOSED",
                "status": "HEALTHY",
                "connectedCustomers": 1420,
                "criticalLoadPct": 35,
                "tieSwitchState": "OPEN"
            },
            {
                "id": "FDR-02",
                "name": "Urban Residential Feeder",
                "type": "RESIDENTIAL",
                "voltageKv": 10.94,
                "currentA": 288.1,
                "activePowerMw": 5.10,
                "reactivePowerMvar": 1.20,
                "powerFactor": 0.96,
                "breakerState": "CLOSED",
                "status": "HEALTHY",
                "connectedCustomers": 4850,
                "criticalLoadPct": 15,
                "faultLocation": None
            },
            {
                "id": "FDR-03",
                "name": "Metro Transit & Hospital Feeder",
                "type": "CRITICAL",
                "voltageKv": 11.12,
                "currentA": 382.4,
                "activePowerMw": 7.10,
                "reactivePowerMvar": 1.50,
                "powerFactor": 0.98,
                "breakerState": "CLOSED",
                "status": "HEALTHY",
                "connectedCustomers": 920,
                "criticalLoadPct": 85
            },
            {
                "id": "FDR-04",
                "name": "Commercial Tech Hub Feeder",
                "type": "COMMERCIAL",
                "voltageKv": 11.02,
                "currentA": 295.0,
                "activePowerMw": 5.32,
                "reactivePowerMvar": 1.10,
                "powerFactor": 0.97,
                "breakerState": "CLOSED",
                "status": "HEALTHY",
                "connectedCustomers": 2100,
                "criticalLoadPct": 40
            }
        ],
        "renewables": {
            "solarCapacityMw": 20.0,
            "solarOutputMw": 18.4,
            "windCapacityMw": 15.0,
            "windOutputMw": 12.1,
            "bessCapacityMwh": 20.0,
            "bessPowerRatingMw": 5.0,
            "bessStateOfChargePct": 82.5,
            "bessOutputMw": -2.5,
            "bessMode": "SMART_DISPATCH",
            "curtailedPct": 0.0
        },
        "transformers": [
            {
                "id": "TR-01",
                "name": "66/11kV Main Power Transformer #1",
                "ratingMva": 25.0,
                "activeLoadMw": 11.3,
                "loadingPct": 45.2,
                "windingTempC": 62.4,
                "oilTempC": 54.1,
                "healthIndex": 94,
                "dgaStatus": "NORMAL"
            },
            {
                "id": "TR-02",
                "name": "66/11kV Main Power Transformer #2",
                "ratingMva": 25.0,
                "activeLoadMw": 12.42,
                "loadingPct": 49.7,
                "windingTempC": 66.8,
                "oilTempC": 58.2,
                "healthIndex": 88,
                "dgaStatus": "WARNING_DGA"
            }
        ],
        "thresholds": {
            "freqLowHz": 49.85,
            "freqHighHz": 50.15,
            "feederCurrentMaxA": 400.0,
            "transformerLoadMaxPct": 85.0,
            "oilTempMaxC": 75.0
        }
    },
    "alarms": [
        {
            "id": "ALM-101",
            "timestamp": time.strftime("%I:%M:%S %p"),
            "severity": "INFO",
            "source": "SCADA Core",
            "message": "National Load Despatch Centre (NLDC) official telemetry feed connected.",
            "acknowledged": True
        },
        {
            "id": "ALM-102",
            "timestamp": time.strftime("%I:%M:%S %p"),
            "severity": "INFO",
            "source": "IEGC Monitor",
            "message": "System frequency conforming to IEGC operating band (49.90 - 50.05 Hz).",
            "acknowledged": True
        }
    ],
    "commandAuditLog": [],
    "flisrState": {
        "active": False,
        "stage": None,
        "targetFeeder": None,
        "timerMs": 0,
        "log": []
    }
}

# In-memory ML engine instance
ml_engine = GridPulseMLEngine()

# Connected WebSockets set
connected_websockets: set[WebSocket] = set()


async def broadcast(data: dict):
    """Broadcast JSON message to all connected WebSocket clients."""
    if not connected_websockets:
        return
    message = json.dumps(data)
    dead = []
    for ws in list(connected_websockets):
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connected_websockets.discard(ws)


def log_alarm(severity: str, source: str, message: str):
    """Push an alarm to state and DB, then broadcast."""
    new_alarm = {
        "id": f"ALM-{str(int(time.time() * 1000))[-4:]}",
        "timestamp": time.strftime("%I:%M:%S %p"),
        "severity": severity,
        "source": source,
        "message": message,
        "acknowledged": False
    }
    grid_state["alarms"].insert(0, new_alarm)
    if len(grid_state["alarms"]) > 50:
        grid_state["alarms"].pop()
    asyncio.create_task(broadcast({"type": "ALARM_NEW", "payload": new_alarm}))
    log_db_alarm(severity, source, message)


def log_audit(action: str, target: str, operator: str, details: str):
    """Record audit action to state and DB."""
    audit = {
        "id": f"AUD-{str(int(time.time() * 1000))[-5:]}",
        "timestamp": time.strftime("%I:%M:%S %p"),
        "action": action,
        "target": target,
        "operator": operator or "SYSTEM",
        "details": details
    }
    grid_state["commandAuditLog"].insert(0, audit)
    if len(grid_state["commandAuditLog"]) > 40:
        grid_state["commandAuditLog"].pop()
    if any(k in action for k in ("BREAKER", "TRIP", "RESTORE")):
        log_db_breaker_op(operator or "SYSTEM", target, action, details or "VERIFIED")


def recalculate_national_metrics():
    """Recalculate national totals and grid frequency physics."""
    total_gen = sum(s["currentGenMw"] for s in grid_state["sources"] if s.get("status") == "ONLINE")
    total_demand = sum(s["currentDemandMw"] for s in grid_state["sinks"] if s.get("status") != "BLACKOUT")

    grid_state["nldc"]["nationalDemandMetMw"] = total_demand

    balance_mw = total_gen - (total_demand * 0.95)
    target_freq = 50.00 + (balance_mw / 150000.0)
    clamped_freq = max(49.85, min(50.15, round(target_freq, 2)))
    grid_state["nldc"]["frequencyHz"] = clamped_freq
    grid_state["substation"]["frequencyHz"] = clamped_freq

    for corr in grid_state["corridors"]:
        if corr["status"] == "TRIPPED":
            corr["flowMw"] = 0
        elif corr["status"] == "REROUTED":
            corr["flowMw"] = round(corr["capacityMw"] * 0.45)


async def telemetry_loop():
    """Real-time 1-second telemetry physics simulation heartbeat."""
    while True:
        try:
            if not grid_state["flisrState"]["active"]:
                # Micro-fluctuation in Indian grid frequency within statutory IEGC band
                drift = (random.random() - 0.49) * 0.02
                new_freq = round(min(50.08, max(49.91, grid_state["nldc"]["frequencyHz"] + drift)), 2)
                grid_state["nldc"]["frequencyHz"] = new_freq
                grid_state["substation"]["frequencyHz"] = new_freq

                # Random drift in renewable sources
                for src in grid_state["sources"]:
                    if src.get("status") == "ONLINE" and not src.get("curtailed"):
                        gen_drift = (random.random() - 0.49) * 8
                        src["currentGenMw"] = int(min(src["maxDispatchMw"], max(src["minDispatchMw"], round(src["currentGenMw"] + gen_drift))))

                # Small fluctuations in sinks
                for sink in grid_state["sinks"]:
                    if sink.get("status") == "NORMAL":
                        demand_drift = (random.random() - 0.49) * 6
                        sink["currentDemandMw"] = int(round(sink["baseDemandMw"] * (1 - (sink.get("loadShedPct", 0) / 100.0)) + demand_drift))

                # Substation feeders update
                for f in grid_state["substation"]["feeders"]:
                    if f.get("breakerState") == "CLOSED" and f.get("status") == "HEALTHY":
                        cur_drift = (random.random() - 0.5) * 3
                        f["currentA"] = max(50.0, round(f["currentA"] + cur_drift, 1))
                        f["activePowerMw"] = round((f["currentA"] * f["voltageKv"] * 1.732 * f["powerFactor"]) / 1000.0, 2)

                record_telemetry_tick(grid_state["substation"])

            await broadcast({
                "type": "TELEMETRY_TICK",
                "payload": {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "nldc": grid_state["nldc"],
                    "sources": grid_state["sources"],
                    "sinks": grid_state["sinks"],
                    "corridors": grid_state["corridors"],
                    "substation": grid_state["substation"]
                }
            })
        except Exception as e:
            print(f"[GridPulse Simulation] Error in tick loop: {e}")

        await asyncio.sleep(1.0)


async def handle_client_command(msg: dict, sender_ws: Optional[WebSocket] = None):
    """Central Command Handler supporting both REST and WebSocket commands."""
    command = msg.get("command")
    payload = msg.get("payload", {})
    operator = msg.get("operator", "SCADA-DISPATCH")

    if command == "CORRIDOR_TRIP":
        corridor_id = payload.get("corridorId")
        corridor = next((c for c in grid_state["corridors"] if c["id"] == corridor_id), None)
        if corridor:
            corridor["status"] = "TRIPPED"
            corridor["flowMw"] = 0
            log_alarm("CRITICAL", corridor["name"], f"Corridor TRIPPED manually by operator {operator}. Power flow interrupted.")
            log_audit("CORRIDOR_TRIP", corridor["id"], operator, "Line breakers tripped. Flow: 0 MW")
            recalculate_national_metrics()
            await broadcast({"type": "CORRIDOR_UPDATED", "payload": corridor})

    elif command == "CORRIDOR_RESTORE":
        corridor_id = payload.get("corridorId")
        corridor = next((c for c in grid_state["corridors"] if c["id"] == corridor_id), None)
        if corridor:
            corridor["status"] = "ENERGIZED"
            corridor["flowMw"] = round(corridor["capacityMw"] * 0.65)
            log_alarm("INFO", corridor["name"], "Corridor re-energized and synchronized with regional grid.")
            log_audit("CORRIDOR_RESTORE", corridor["id"], operator, f"Re-closed breakers. Flow restored: {corridor['flowMw']} MW")
            recalculate_national_metrics()
            await broadcast({"type": "CORRIDOR_UPDATED", "payload": corridor})

    elif command == "CORRIDOR_REROUTE":
        corridor_id = payload.get("corridorId")
        corridor = next((c for c in grid_state["corridors"] if c["id"] == corridor_id), None)
        if corridor:
            corridor["status"] = "REROUTED"
            corridor["flowMw"] = round(corridor["capacityMw"] * 0.8)
            log_alarm("WARNING", corridor["name"], "Dynamic power rerouting active via alternate HVDC bypass.")
            log_audit("CORRIDOR_REROUTE", corridor["id"], operator, "Rerouted through parallel HVDC corridor.")
            recalculate_national_metrics()
            await broadcast({"type": "CORRIDOR_UPDATED", "payload": corridor})

    elif command == "GENERATOR_DISPATCH":
        source_id = payload.get("sourceId")
        target_mw = payload.get("targetMw", 0)
        source = next((s for s in grid_state["sources"] if s["id"] == source_id), None)
        if source:
            clamped = int(min(source["maxDispatchMw"], max(source["minDispatchMw"], float(target_mw))))
            source["currentGenMw"] = clamped
            log_audit("GENERATOR_DISPATCH", source["id"], operator, f"Dispatched output set to {clamped} MW")
            recalculate_national_metrics()
            await broadcast({"type": "SOURCE_UPDATED", "payload": source})

    elif command == "GENERATOR_CURTAIL_TOGGLE":
        source_id = payload.get("sourceId")
        source = next((s for s in grid_state["sources"] if s["id"] == source_id), None)
        if source:
            source["curtailed"] = not source.get("curtailed", False)
            if source["curtailed"]:
                source["currentGenMw"] = round(source["currentGenMw"] * 0.5)
                log_alarm("WARNING", source["name"], "Renewable generation curtailment imposed due to transmission congestion.")
            else:
                source["currentGenMw"] = round(source["capacityMw"] * 0.85)
                log_alarm("INFO", source["name"], "Curtailment removed. Generation operating at unrestricted output.")
            log_audit("CURTAIL_TOGGLE", source["id"], operator, f"Curtailment state: {source['curtailed']}")
            recalculate_national_metrics()
            await broadcast({"type": "SOURCE_UPDATED", "payload": source})

    elif command == "GENERATOR_TRIP_TOGGLE":
        source_id = payload.get("sourceId")
        source = next((s for s in grid_state["sources"] if s["id"] == source_id), None)
        if source:
            source["status"] = "TRIPPED" if source.get("status") == "ONLINE" else "ONLINE"
            if source["status"] == "TRIPPED":
                source["currentGenMw"] = 0
                log_alarm("CRITICAL", source["name"], f"Plant tripped! Loss of {source['capacityMw']} MW generation.")
            else:
                source["currentGenMw"] = round(source["capacityMw"] * 0.75)
                log_alarm("INFO", source["name"], "Plant re-synchronized to grid bus.")
            log_audit("GEN_TRIP_TOGGLE", source["id"], operator, f"Status: {source['status']}")
            recalculate_national_metrics()
            await broadcast({"type": "SOURCE_UPDATED", "payload": source})

    elif command == "DEMAND_SHED":
        sink_id = payload.get("sinkId")
        shed_pct = float(payload.get("shedPct", 0))
        sink = next((s for s in grid_state["sinks"] if s["id"] == sink_id), None)
        if sink:
            sink["loadShedPct"] = shed_pct
            sink["currentDemandMw"] = round(sink["baseDemandMw"] * (1.0 - (shed_pct / 100.0)))
            sink["status"] = "BLACKOUT" if shed_pct >= 90 else ("SHED" if shed_pct > 0 else "NORMAL")
            log_alarm("WARNING" if shed_pct > 0 else "INFO", sink["name"], f"Emergency Load Shedding set to {shed_pct}%. Current draw: {sink['currentDemandMw']} MW.")
            log_audit("DEMAND_SHED", sink["id"], operator, f"Shed: {shed_pct}%")
            recalculate_national_metrics()
            await broadcast({"type": "SINK_UPDATED", "payload": sink})

    elif command == "DEMAND_RESPONSE_TOGGLE":
        sink_id = payload.get("sinkId")
        sink = next((s for s in grid_state["sinks"] if s["id"] == sink_id), None)
        if sink:
            sink["drActive"] = not sink.get("drActive", False)
            if sink["drActive"]:
                sink["currentDemandMw"] = round(sink["baseDemandMw"] * 0.88)
                log_alarm("INFO", sink["name"], "Automated Demand Response (DR) activated: 12% peak shaved.")
            else:
                sink["currentDemandMw"] = sink["baseDemandMw"]
            log_audit("DR_TOGGLE", sink["id"], operator, f"Demand Response: {sink['drActive']}")
            recalculate_national_metrics()
            await broadcast({"type": "SINK_UPDATED", "payload": sink})

    elif command == "REGION_ISOLATE_TOGGLE":
        region_id = payload.get("regionId")
        region = next((r for r in grid_state["regions"] if r["id"] == region_id), None)
        if region:
            region["isIslanded"] = not region.get("isIslanded", False)
            region["status"] = "ISLANDED" if region["isIslanded"] else "NORMAL"
            log_alarm("CRITICAL" if region["isIslanded"] else "INFO", region["code"], f"Regional grid islanding {'ENGAGED' if region['isIslanded'] else 'SYNCHRONIZED'}.")
            log_audit("REGION_ISOLATE", region["id"], operator, f"Islanded: {region['isIslanded']}")
            await broadcast({"type": "REGION_UPDATED", "payload": region})

    elif command == "BREAKER_TOGGLE":
        feeder_id = payload.get("feederId")
        feeder = next((f for f in grid_state["substation"]["feeders"] if f["id"] == feeder_id), None)
        if feeder:
            next_state = "TRIP" if feeder["breakerState"] == "CLOSED" else "CLOSED"
            feeder["breakerState"] = next_state
            if next_state == "TRIP":
                feeder["currentA"] = 0
                feeder["activePowerMw"] = 0
                feeder["status"] = "OPEN"
                log_alarm("CRITICAL", feeder["id"], f"11kV Circuit breaker manually tripped by operator {operator}.")
            else:
                feeder["status"] = "HEALTHY"
                feeder["currentA"] = 310.0
                feeder["activePowerMw"] = 5.6
                log_alarm("INFO", feeder["id"], "11kV Circuit breaker re-closed and energized.")
            log_audit("BREAKER_TOGGLE", feeder["id"], operator, f"Breaker state: {next_state}")
            await broadcast({"type": "FEEDER_UPDATED", "payload": feeder})

    elif command == "TIE_SWITCH_TOGGLE":
        f1 = next((f for f in grid_state["substation"]["feeders"] if f["id"] == "FDR-01"), None)
        if f1:
            f1["tieSwitchState"] = "OPEN" if f1.get("tieSwitchState") == "CLOSED" else "CLOSED"
            log_alarm("INFO", "TS-1-2", f"Motorized Tie-Switch TS-1-2 set to {f1['tieSwitchState']}.")
            log_audit("TIE_SWITCH_TOGGLE", "TS-1-2", operator, f"State: {f1['tieSwitchState']}")
            await broadcast({"type": "FEEDER_UPDATED", "payload": f1})

    elif command == "TRIGGER_FLISR":
        asyncio.create_task(run_flisr_simulation())

    elif command == "STABILIZE_FREQUENCY":
        tehri = next((s for s in grid_state["sources"] if s["id"] == "SRC-TEHRI"), None)
        if tehri:
            tehri["currentGenMw"] = 1900
        grid_state["nldc"]["frequencyHz"] = 50.00
        grid_state["substation"]["frequencyHz"] = 50.00
        log_alarm("INFO", "IEGC-AGC", "Automatic Generation Control (AGC) activated. Frequency restored to 50.00 Hz.")
        log_audit("STABILIZE_FREQ", "ALL_SOURCES", operator, "Nominal 50.00 Hz achieved.")
        recalculate_national_metrics()
        await broadcast({"type": "STATE_REFRESH", "payload": grid_state})


async def run_flisr_simulation():
    """Multi-stage FLISR Self-Healing Automation Simulator."""
    if grid_state["flisrState"]["active"]:
        return

    grid_state["flisrState"]["active"] = True
    grid_state["flisrState"]["targetFeeder"] = "FDR-02"
    grid_state["flisrState"]["timerMs"] = 0
    grid_state["flisrState"]["log"] = []

    target_feeder = next((f for f in grid_state["substation"]["feeders"] if f["id"] == "FDR-02"), None)
    tie_feeder = next((f for f in grid_state["substation"]["feeders"] if f["id"] == "FDR-01"), None)

    # Step 1: Fault Injection & Detection (0s)
    grid_state["flisrState"]["stage"] = "DETECTION"
    if target_feeder:
        target_feeder["status"] = "FAULTED"
        target_feeder["currentA"] = 684.2
        target_feeder["breakerState"] = "TRIP"

    log1 = {"time": "0.0s", "text": "Overcurrent fault (684.2A) detected on FDR-02 Section B. Tripped CB-02 in 42ms."}
    grid_state["flisrState"]["log"].append(log1)
    log_alarm("CRITICAL", "FDR-02", "High impedance phase-to-ground fault detected. Breaker CB-02 tripped.")
    await broadcast({"type": "FLISR_UPDATE", "payload": grid_state["flisrState"]})
    if target_feeder:
        await broadcast({"type": "FEEDER_UPDATED", "payload": target_feeder})

    # Step 2: Fault Isolation (2.5s)
    await asyncio.sleep(2.5)
    grid_state["flisrState"]["stage"] = "ISOLATION"
    if target_feeder:
        target_feeder["status"] = "ISOLATED"
        target_feeder["currentA"] = 0.0

    log2 = {"time": "2.5s", "text": "Motorized sectionalizers SW-2A and SW-2B opened. Faulted Section B isolated."}
    grid_state["flisrState"]["log"].append(log2)
    log_alarm("WARNING", "FDR-02", "Faulted line segment successfully isolated via SCADA motorized switches.")
    await broadcast({"type": "FLISR_UPDATE", "payload": grid_state["flisrState"]})
    if target_feeder:
        await broadcast({"type": "FEEDER_UPDATED", "payload": target_feeder})

    # Step 3: Service Restoration via Tie-Switch (3.0s later -> 5.5s total)
    await asyncio.sleep(3.0)
    grid_state["flisrState"]["stage"] = "RESTORATION"
    if tie_feeder:
        tie_feeder["tieSwitchState"] = "CLOSED"
    if target_feeder:
        target_feeder["status"] = "RESTORED"
        target_feeder["currentA"] = 210.0
        target_feeder["activePowerMw"] = 3.65

    log3 = {"time": "5.5s", "text": "Tie-Switch TS-1-2 closed. 3,400 out of 4,850 customers restored via Feeder 1 tie."}
    grid_state["flisrState"]["log"].append(log3)
    log_alarm("INFO", "FLISR-ENGINE", "Autonomous self-healing completed: 70% customers restored without operator dispatch.")
    await broadcast({"type": "FLISR_UPDATE", "payload": grid_state["flisrState"]})
    if target_feeder:
        await broadcast({"type": "FEEDER_UPDATED", "payload": target_feeder})
    if tie_feeder:
        await broadcast({"type": "FEEDER_UPDATED", "payload": tie_feeder})

    # Step 4: Finalize
    await asyncio.sleep(3.0)
    grid_state["flisrState"]["active"] = False
    grid_state["flisrState"]["stage"] = "RESTORED"
    await broadcast({"type": "FLISR_UPDATE", "payload": grid_state["flisrState"]})


def mask_key(key: Optional[str]) -> str:
    """Safely mask secret keys for diagnostic logs & monitoring."""
    if not key:
        return "NOT_CONFIGURED"
    if len(key) <= 8:
        return "********"
    return key[:4] + "..." + key[-4:]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: starts telemetry simulation and seeds database."""
    init_database()
    telemetry_task = asyncio.create_task(telemetry_loop())
    print(f"[GridPulse Python Backend] FastAPI running on http://{HOST}:{PORT}")
    print(f"[GridPulse Python Backend] WebSocket stream active at ws://{HOST}:{PORT}/ws")
    print(f"[GridPulse Python Backend] Database: SQLite3 at {os.environ.get('GRIDPULSE_DB_PATH', 'backend/data/gridpulse.db')}")
    yield
    telemetry_task.cancel()


# FastAPI Application instance
app = FastAPI(
    title="GridPulse SCADA & AI Telemetry Engine",
    description="Python FastAPI High-Performance Industrial SCADA Server & AI Telemetry Gateway",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================================
# WEBSOCKET STREAMING ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    try:
        # Send full initial state snapshot immediately upon connection
        await websocket.send_text(json.dumps({
            "type": "INITIAL_STATE",
            "payload": grid_state
        }))

        while True:
            text_data = await websocket.receive_text()
            try:
                data = json.loads(text_data)
                await handle_client_command(data, sender_ws=websocket)
            except Exception as e:
                print(f"[GridPulse WS] Error handling client message: {e}")
    except WebSocketDisconnect:
        pass
    finally:
        connected_websockets.discard(websocket)


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.get("/api/grid/india")
def get_grid_india():
    return {
        "success": True,
        "data": {
            "nldc": grid_state["nldc"],
            "regions": grid_state["regions"],
            "sources": grid_state["sources"],
            "substations": grid_state.get("substations", []),
            "sinks": grid_state["sinks"],
            "corridors": grid_state["corridors"]
        }
    }


@app.get("/api/grid/substations")
def get_grid_substations(
    region: Optional[str] = Query(None),
    voltage: Optional[float] = Query(None),
    type: Optional[str] = Query(None)
):
    result = grid_state.get("substations", [])
    if region:
        result = [s for s in result if s.get("region") == region]
    if voltage:
        result = [s for s in result if s.get("voltageKv") == voltage]
    if type:
        result = [s for s in result if s.get("substationType") == type]

    return {
        "success": True,
        "count": len(result),
        "totalCapacityMva": sum(s.get("transformationCapacityMva", 0) for s in result),
        "substations": result
    }


@app.get("/api/grid/substations/{substation_id}")
def get_grid_substation_by_id(substation_id: str):
    sub = next((s for s in grid_state.get("substations", []) if s["id"] == substation_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail="Substation not found")
    return {"success": True, "substation": sub}


@app.get("/api/grid/sources")
def get_grid_sources(
    type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    result = grid_state["sources"]
    if type:
        result = [s for s in result if s.get("type") == type]
    if region:
        result = [s for s in result if s.get("region") == region]
    if status:
        result = [s for s in result if s.get("status") == status]

    return {
        "success": True,
        "count": len(result),
        "totalCapacityMw": sum(s.get("capacityMw", 0) for s in result),
        "totalCurrentGenMw": sum(s.get("currentGenMw", 0) for s in result if s.get("status") == "ONLINE"),
        "sources": result
    }


@app.get("/api/grid/sources/{source_id}")
def get_grid_source_by_id(source_id: str):
    source = next((s for s in grid_state["sources"] if s["id"] == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"success": True, "source": source}


@app.get("/api/grid/sinks")
def get_grid_sinks(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    result = grid_state["sinks"]
    if category:
        result = [s for s in result if s.get("category") == category]
    if region:
        result = [s for s in result if s.get("region") == region]
    if status:
        result = [s for s in result if s.get("status") == status]

    return {
        "success": True,
        "count": len(result),
        "totalPeakDemandMw": sum(s.get("peakDemandMw", 0) for s in result),
        "totalCurrentDemandMw": sum(s.get("currentDemandMw", 0) for s in result),
        "sinks": result
    }


@app.get("/api/grid/sinks/{sink_id}")
def get_grid_sink_by_id(sink_id: str):
    sink = next((s for s in grid_state["sinks"] if s["id"] == sink_id), None)
    if not sink:
        raise HTTPException(status_code=404, detail="Sink not found")
    return {"success": True, "sink": sink}


@app.get("/api/grid/substation")
def get_grid_substation():
    return {"success": True, "data": grid_state["substation"]}


@app.get("/api/grid/alarms")
def get_grid_alarms():
    return {"success": True, "data": grid_state["alarms"]}


@app.get("/api/grid/audit")
def get_grid_audit():
    return {"success": True, "data": grid_state["commandAuditLog"]}


@app.post("/api/grid/control")
async def post_grid_control(request: Request):
    body = await request.json()
    command = body.get("command")
    payload = body.get("payload", {})
    operator = body.get("operator", "DISCOM-ENG-402")

    if not command:
        raise HTTPException(status_code=400, detail="Missing command parameter")

    await handle_client_command({"command": command, "payload": payload, "operator": operator})

    return {
        "success": True,
        "message": f"Command {command} processed successfully.",
        "currentState": {
            "frequency": grid_state["nldc"]["frequencyHz"],
            "demandMetMw": grid_state["nldc"]["nationalDemandMetMw"]
        }
    }


@app.get("/api/health")
def get_health():
    return {
        "status": "OK",
        "uptimeSeconds": int(time.time()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "GridPulse Official India Grid SCADA & Automation Engine (Python FastAPI Edition)"
    }


# ============================================================================
# MACHINE LEARNING & PREDICTIVE AI ENDPOINTS
# ============================================================================

@app.get("/api/ml/health")
def get_ml_health():
    return {
        "status": "ONLINE",
        "service": "GridPulse Neural Grid Engine (Native Python Fast-Inference Core)",
        "has_scikit_learn": True,
        "source": "PYTHON_FASTAPI_SERVICE",
        "models": ml_engine.model_metadata
    }


@app.get("/api/ml/forecast")
def get_ml_forecast(
    temp: float = Query(38.0),
    cloud: float = Query(15.0),
    demand: Optional[float] = Query(None)
):
    base_demand = demand if demand is not None else grid_state["substation"]["totalLoadMw"]
    data = ml_engine.forecast_24h(temp, cloud, base_demand)
    return {"success": True, "data": data}


@app.get("/api/ml/fault-classify")
def get_ml_fault_classify(
    va: float = Query(2.1),
    vb: float = Query(11.8),
    vc: float = Query(11.7),
    ia: float = Query(1250.0),
    ib: float = Query(310.0),
    ic: float = Query(305.0),
    feeder: str = Query("FDR-02")
):
    data = ml_engine.classify_waveform_fault(va, vb, vc, ia, ib, ic, feeder)
    return {"success": True, "data": data}


@app.get("/api/ml/theft-detect")
def get_ml_theft_detect():
    data = ml_engine.detect_smart_meter_theft()
    return {"success": True, "data": data}


@app.get("/api/ml/duval-dga")
def get_ml_duval_dga(
    h2: float = Query(45.0),
    ch4: float = Query(38.0),
    c2h2: float = Query(2.1),
    c2h4: float = Query(28.0),
    c2h6: float = Query(14.0),
    temp: float = Query(58.0)
):
    data = ml_engine.evaluate_duval_dga(h2, ch4, c2h2, c2h4, c2h6, temp)
    return {"success": True, "data": data}


# ============================================================================
# PRODUCTION-GRADE SQLITE DATABASE REST ENDPOINTS
# ============================================================================

@app.get("/api/db/health")
def get_database_health():
    return {"success": True, "data": get_database_stats()}


@app.get("/api/db/telemetry/history")
def get_telemetry_history(limit: int = Query(60)):
    rows = get_db_telemetry_history(limit)
    return {"success": True, "count": len(rows), "data": rows}


@app.get("/api/db/alarms")
def get_alarms_db(limit: int = Query(50)):
    rows = get_db_alarms(limit)
    return {"success": True, "count": len(rows), "data": rows}


@app.get("/api/db/breakers")
def get_breakers_db(limit: int = Query(50)):
    rows = get_db_breaker_operations(limit)
    return {"success": True, "count": len(rows), "data": rows}


@app.post("/api/db/query")
async def post_database_query(request: Request):
    body = await request.json()
    sql = body.get("sql")
    if not sql:
        raise HTTPException(status_code=400, detail="Missing sql query in request body")
    try:
        result = execute_read_only_query(sql)
        return {"success": True, **result}
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))


# ============================================================================
# SCHNEIDER ELECTRIC ECOSTRUXURE & OPERATIONAL ENDPOINTS
# ============================================================================

@app.get("/api/ecostruxure/manifest")
def get_ecostruxure_manifest():
    return {
        "success": True,
        "platform": "GridPulse Intelligent Grid Management",
        "vendorCompatibility": "Schneider Electric EcoStruxure™ Power & Grid",
        "substation": "Mayur Vihar 66/11kV Substation",
        "standards": [
            "IEC 61850 Edition 2 (Substation Automation & Protection)",
            "IEC 62351-3/5/6 (Substation Cyber Security & GOOSE Authentication)",
            "IEEE C37.118 (Phasor Measurement Unit PMU Sync)",
            "Modbus TCP / IEC 60870-5-104 (SCADA Telemetry Stream)",
            "IEEE 738 (Dynamic Line Rating & Conductor Thermal Model)"
        ],
        "hardwareMapping": [
            {"bay": "FDR-01 (Industrial 11kV)", "protectionRelay": "Schneider Electric Easergy P5F30", "meter": "PowerLogic ION9000", "switchgear": "Premset SF6-Free 11kV"},
            {"bay": "FDR-02 (Residential 11kV)", "protectionRelay": "Schneider Electric Easergy P5F30", "meter": "PowerLogic PM8000", "switchgear": "Premset SF6-Free 11kV"},
            {"bay": "FDR-03 (Hospital Metro 11kV)", "protectionRelay": "Schneider Electric Easergy P5F30 Dual-Eth", "meter": "PowerLogic ION9000", "switchgear": "Premset SF6-Free 11kV"},
            {"bay": "TR-01 (16 MVA 33/11kV)", "protectionRelay": "Schneider Electric Easergy P5T30 Transformer Diff", "meter": "PowerLogic ION9000 Class 0.1S", "switchgear": "Schneider GHA Gas-Insulated"},
            {"bay": "BESS & Solar Microgrid", "edgeController": "Schneider EcoStruxure Microgrid Advisor", "inverterGateway": "Conext Smart Inverter Gateway"}
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/system/env-status")
def get_system_env_status():
    return {
        "success": True,
        "environment": os.environ.get("NODE_ENV", "development"),
        "server": {
            "port": PORT,
            "host": HOST,
            "runtime": f"Python {sys.version.split()[0]} (FastAPI + Uvicorn)"
        },
        "database": {
            "path": os.environ.get("GRIDPULSE_DB_PATH", "backend/data/gridpulse.db"),
            "journalMode": os.environ.get("DB_PRAGMA_JOURNAL_MODE", "WAL"),
            "synchronous": os.environ.get("DB_PRAGMA_SYNCHRONOUS", "NORMAL")
        },
        "mlService": {
            "url": ML_SERVICE_URL,
            "port": int(os.environ.get("ML_SERVICE_PORT", 8000)),
            "mode": "NATIVE_PYTHON_EMBEDDED"
        },
        "securityKeys": {
            "jwtConfigured": bool(os.environ.get("JWT_SECRET")),
            "jwtSecret": mask_key(os.environ.get("JWT_SECRET")),
            "scadaDispatchKey": mask_key(os.environ.get("SCADA_DISPATCH_API_KEY")),
            "iec62351Token": mask_key(os.environ.get("IEC62351_ZERO_TRUST_TOKEN")),
            "iexMarketApiKey": mask_key(os.environ.get("IEX_MARKET_API_KEY")),
            "posocoFeedKey": mask_key(os.environ.get("POSOCO_NLDC_FEED_KEY")),
            "ceaRegulatoryToken": mask_key(os.environ.get("CEA_REGULATORY_TOKEN")),
            "weatherApiKey": mask_key(os.environ.get("WEATHER_API_KEY"))
        }
    }


@app.get("/api/market/p2p/orders")
def get_market_p2p_orders():
    return {
        "success": True,
        "marketClearingPriceInr": 3.55,
        "retailGridTariffInr": 6.80,
        "discomBuybackTariffInr": 2.10,
        "discomWheelingTollInr": 0.40,
        "clearedVolumeKwh": 125.0,
        "totalProsumerRevenueInr": 443.75,
        "buyerCostSavingsPct": 47.8,
        "prosumerGainPct": 69.0,
        "asks": [
            {"id": "ASK-01", "entity": "Mayur Vihar Pocket 1 RWA", "type": "Rooftop Solar PV", "volumeKwh": 65.0, "askPrice": 3.40, "status": "MATCHED"},
            {"id": "ASK-02", "entity": "Apex Agro Cold Storage & Solar Hub", "type": "Cold Storage + Canopy", "volumeKwh": 40.0, "askPrice": 3.60, "status": "MATCHED"},
            {"id": "ASK-03", "entity": "Govt Girls Senior Secondary School", "type": "Institutional Rooftop", "volumeKwh": 20.0, "askPrice": 3.20, "status": "MATCHED"},
            {"id": "ASK-04", "entity": "East End Co-op Housing Society", "type": "Residential Society", "volumeKwh": 35.0, "askPrice": 3.50, "status": "OPEN"}
        ],
        "bids": [
            {"id": "BID-01", "entity": "Mayur Vihar DTC EV Fast Charger Hub", "type": "Commercial Fleet EV", "volumeKwh": 45.0, "bidPrice": 4.10, "status": "MATCHED"},
            {"id": "BID-02", "entity": "Pocket 4 Multi-Storey Apartments", "type": "Domestic Residential", "volumeKwh": 50.0, "bidPrice": 3.80, "status": "MATCHED"},
            {"id": "BID-03", "entity": "Delhi Jal Board Water Booster Pump", "type": "Critical Municipal Lifeline", "volumeKwh": 30.0, "bidPrice": 3.60, "status": "MATCHED"},
            {"id": "BID-04", "entity": "Shakarpur Local Commercial Bakery", "type": "MSME Food Processing", "volumeKwh": 25.0, "bidPrice": 3.45, "status": "OPEN"}
        ]
    }


@app.post("/api/market/p2p/clear")
def post_market_p2p_clear():
    tx_hash = "0x" + hex(random.randint(0x10000000, 0xffffffff))[2:] + "..." + hex(random.randint(0x1000, 0xffff))[2:]
    return {
        "success": True,
        "status": "CLEARED",
        "txHash": tx_hash,
        "matchedVolumeKwh": 125.0,
        "marketClearingPrice": 3.55,
        "discomWheelingEarned": 50.0,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/market/bess/second-life")
def get_market_bess_second_life():
    return {
        "success": True,
        "totalFleetCapacityKwh": 380.0,
        "capexSavingsPct": 71.4,
        "embodiedCarbonSavedTons": 54.2,
        "outageAutonomyHours": 4.2,
        "racks": [
            {"id": "SL-RACK-01", "name": "Tata Nexon EV 2nd-Life Cluster A", "capacityKwh": 120, "sohPct": 78.4, "cyclesLeft": 680, "tempC": 31.2, "status": "HEALTHY"},
            {"id": "SL-RACK-02", "name": "DTC E-Bus Repurposed Sub-Module B", "capacityKwh": 180, "sohPct": 75.2, "cyclesLeft": 840, "tempC": 33.8, "status": "HEALTHY"},
            {"id": "SL-RACK-03", "name": "Mahindra Treo 3W Swappable Cluster", "capacityKwh": 80, "sohPct": 81.0, "cyclesLeft": 1120, "tempC": 29.5, "status": "HEALTHY"}
        ]
    }


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
