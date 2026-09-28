import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  OFFICIAL_NLDC_BASELINE,
  REGIONAL_DESPATCH_CENTRES,
  OFFICIAL_TRANSMISSION_CORRIDORS
} from './officialGridData.js';
import { ELECTRICITY_SOURCES } from './sourcesData.js';
import { ELECTRICITY_SINKS } from './sinksData.js';

// Comprehensive Transmission Corridors linking real sources and sinks
const ALL_TRANSMISSION_CORRIDORS = [
  ...OFFICIAL_TRANSMISSION_CORRIDORS,
  {
    id: "CORR-UKAI-SURAT",
    name: "Ukai Dam Hydro -> Surat 220 kV Transmission Feeder",
    from: [21.25, 73.58], // Ukai Dam
    to: [21.17, 72.83], // Surat City
    capacityMw: 600,
    flowMw: 240,
    voltageKv: 220,
    type: "HYDRO_FEEDER",
    color: "#38bdf8",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-NARMADA-AHM",
    name: "Sardar Sarovar Narmada Hydro -> Ahmedabad 400 kV Link",
    from: [21.83, 73.75], // Kevadia / Sardar Sarovar
    to: [23.02, 72.57], // Ahmedabad
    capacityMw: 1500,
    flowMw: 1180,
    voltageKv: 400,
    type: "HYDRO_TRANSMISSION",
    color: "#38bdf8",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-KAPS-HAZIRA",
    name: "Kakrapar Atomic (KAPS) -> Hazira 400 kV Industrial Link",
    from: [21.24, 73.35], // Kakrapar Nuclear
    to: [21.11, 72.67], // Hazira Heavy Industry
    capacityMw: 2000,
    flowMw: 1420,
    voltageKv: 400,
    type: "NUCLEAR_FEEDER",
    color: "#a855f7",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-TAPS-MUMBAI",
    name: "Tarapur Nuclear (TAPS) -> Mumbai 400 kV Corridor",
    from: [19.83, 72.65], // Tarapur
    to: [19.07, 72.87], // Mumbai
    capacityMw: 1600,
    flowMw: 1350,
    voltageKv: 400,
    type: "NUCLEAR_FEEDER",
    color: "#a855f7",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-MUNDRA-SANAND",
    name: "Mundra Thermal -> Sanand Auto Mega Hub 400 kV Link",
    from: [22.82, 69.52], // Mundra
    to: [23.00, 72.38], // Sanand GIDC
    capacityMw: 1200,
    flowMw: 480,
    voltageKv: 400,
    type: "INDUSTRIAL_FEEDER",
    color: "#8b5cf6",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-CHARANKA-AHM",
    name: "Charanka Solar -> Ahmedabad 400 kV Green Line",
    from: [23.91, 71.19], // Charanka Patan
    to: [23.02, 72.57], // Ahmedabad
    capacityMw: 1000,
    flowMw: 680,
    voltageKv: 400,
    type: "GREEN_ENERGY_CORRIDOR",
    color: "#f59e0b",
    status: "ENERGIZED",
    rerouteTarget: null
  }
];

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server state containers initialized with complete real-world datasets
const gridState = {
  nldc: JSON.parse(JSON.stringify(OFFICIAL_NLDC_BASELINE)),
  regions: JSON.parse(JSON.stringify(REGIONAL_DESPATCH_CENTRES)),
  sources: JSON.parse(JSON.stringify(ELECTRICITY_SOURCES)),
  sinks: JSON.parse(JSON.stringify(ELECTRICITY_SINKS)),
  corridors: JSON.parse(JSON.stringify(ALL_TRANSMISSION_CORRIDORS)),
  // Local distribution substation (Mayur Vihar 66/11kV connected to SNK-DELHI)
  substation: {
    id: "SS-NORTH-01",
    name: "Mayur Vihar 66/11kV Distribution Substation",
    operatorRegion: "NRLDC / Delhi Transco",
    frequencyHz: 50.01,
    incomerVoltageKv: 66.2,
    busVoltageKv: 11.08,
    totalLoadMw: 23.72,
    totalGenMw: 28.00,
    feeders: [
      {
        id: "FDR-01",
        name: "Industrial Park Feeder",
        type: "INDUSTRIAL",
        voltageKv: 11.08,
        currentA: 342.5,
        activePowerMw: 6.20,
        reactivePowerMvar: 1.40,
        powerFactor: 0.97,
        breakerState: "CLOSED",
        status: "HEALTHY",
        connectedCustomers: 1420,
        criticalLoadPct: 35,
        tieSwitchState: "OPEN"
      },
      {
        id: "FDR-02",
        name: "Urban Residential Feeder",
        type: "RESIDENTIAL",
        voltageKv: 10.94,
        currentA: 288.1,
        activePowerMw: 5.10,
        reactivePowerMvar: 1.20,
        powerFactor: 0.96,
        breakerState: "CLOSED",
        status: "HEALTHY",
        connectedCustomers: 4850,
        criticalLoadPct: 15,
        faultLocation: null
      },
      {
        id: "FDR-03",
        name: "Metro Transit & Hospital Feeder",
        type: "CRITICAL",
        voltageKv: 11.12,
        currentA: 382.4,
        activePowerMw: 7.10,
        reactivePowerMvar: 1.50,
        powerFactor: 0.98,
        breakerState: "CLOSED",
        status: "HEALTHY",
        connectedCustomers: 920,
        criticalLoadPct: 85
      },
      {
        id: "FDR-04",
        name: "Commercial Tech Hub Feeder",
        type: "COMMERCIAL",
        voltageKv: 11.02,
        currentA: 295.0,
        activePowerMw: 5.32,
        reactivePowerMvar: 1.10,
        powerFactor: 0.97,
        breakerState: "CLOSED",
        status: "HEALTHY",
        connectedCustomers: 2100,
        criticalLoadPct: 40
      }
    ],
    renewables: {
      solarCapacityMw: 20.0,
      solarOutputMw: 18.4,
      windCapacityMw: 15.0,
      windOutputMw: 12.1,
      bessCapacityMwh: 20.0,
      bessPowerRatingMw: 5.0,
      bessStateOfChargePct: 82.5,
      bessOutputMw: -2.5,
      bessMode: "SMART_DISPATCH",
      curtailedPct: 0.0
    },
    transformers: [
      {
        id: "TR-01",
        name: "66/11kV Main Power Transformer #1",
        ratingMva: 25.0,
        activeLoadMw: 11.3,
        loadingPct: 45.2,
        windingTempC: 62.4,
        oilTempC: 54.1,
        healthIndex: 94,
        dgaStatus: "NORMAL"
      },
      {
        id: "TR-02",
        name: "66/11kV Main Power Transformer #2",
        ratingMva: 25.0,
        activeLoadMw: 12.42,
        loadingPct: 49.7,
        windingTempC: 66.8,
        oilTempC: 58.2,
        healthIndex: 88,
        dgaStatus: "WARNING_DGA"
      }
    ],
    thresholds: {
      freqLowHz: 49.85,
      freqHighHz: 50.15,
      feederCurrentMaxA: 400.0,
      transformerLoadMaxPct: 85.0,
      oilTempMaxC: 75.0
    }
  },
  alarms: [
    {
      id: "ALM-101",
      timestamp: new Date().toLocaleTimeString(),
      severity: "INFO",
      source: "SCADA Core",
      message: "National Load Despatch Centre (NLDC) official telemetry feed connected.",
      acknowledged: true
    },
    {
      id: "ALM-102",
      timestamp: new Date().toLocaleTimeString(),
      severity: "INFO",
      source: "IEGC Monitor",
      message: "System frequency conforming to IEGC operating band (49.90 - 50.05 Hz).",
      acknowledged: true
    }
  ],
  commandAuditLog: [],
  flisrState: {
    active: false,
    stage: null,
    targetFeeder: null,
    timerMs: 0,
    log: []
  }
};

// Helper: Push an alarm
function logAlarm(severity, source, message) {
  const newAlarm = {
    id: `ALM-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleTimeString(),
    severity,
    source,
    message,
    acknowledged: false
  };
  gridState.alarms.unshift(newAlarm);
  if (gridState.alarms.length > 50) gridState.alarms.pop();
  broadcast({ type: 'ALARM_NEW', payload: newAlarm });
}

// Helper: Record audit action
function logAudit(action, target, operator, details) {
  const audit = {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toLocaleTimeString(),
    action,
    target,
    operator: operator || "SYSTEM",
    details
  };
  gridState.commandAuditLog.unshift(audit);
  if (gridState.commandAuditLog.length > 40) gridState.commandAuditLog.pop();
}

// Recalculate national totals & frequency physics
function recalculateNationalMetrics() {
  // Total generation across all active sources
  const totalGen = gridState.sources.reduce((sum, s) => {
    return s.status === 'ONLINE' ? sum + s.currentGenMw : sum;
  }, 0);

  // Total demand across all sinks
  const totalDemand = gridState.sinks.reduce((sum, s) => {
    return s.status !== 'BLACKOUT' ? sum + s.currentDemandMw : sum;
  }, 0);

  gridState.nldc.nationalDemandMetMw = totalDemand;

  // Power balance determines grid frequency drift
  // Base 50.00 Hz: if gen > demand, freq increases slightly; if demand > gen, freq dips
  const balanceMw = totalGen - (totalDemand * 0.95); // calibration factor
  const targetFreq = 50.00 + (balanceMw / 150000);
  const clampedFreq = Math.max(49.85, Math.min(50.15, +(targetFreq).toFixed(2)));
  gridState.nldc.frequencyHz = clampedFreq;
  gridState.substation.frequencyHz = clampedFreq;

  // Corridors flow calibration
  gridState.corridors.forEach(corr => {
    if (corr.status === 'TRIPPED') {
      corr.flowMw = 0;
    } else if (corr.status === 'REROUTED') {
      corr.flowMw = Math.round(corr.capacityMw * 0.45);
    }
  });
}

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Real-Time 1-second Telemetry Simulation Loop
setInterval(() => {
  if (!gridState.flisrState.active) {
    // Micro-fluctuation in Indian grid frequency within IEGC band
    const drift = (Math.random() - 0.49) * 0.02;
    gridState.nldc.frequencyHz = +(Math.min(50.08, Math.max(49.91, gridState.nldc.frequencyHz + drift))).toFixed(2);
    gridState.substation.frequencyHz = gridState.nldc.frequencyHz;

    // Small random fluctuations in renewable sources
    gridState.sources.forEach(src => {
      if (src.status === 'ONLINE' && !src.curtailed) {
        const genDrift = (Math.random() - 0.49) * 8;
        src.currentGenMw = Math.min(src.maxDispatchMw, Math.max(src.minDispatchMw, Math.round(src.currentGenMw + genDrift)));
      }
    });

    // Small random fluctuations in sinks
    gridState.sinks.forEach(sink => {
      if (sink.status === 'NORMAL') {
        const demandDrift = (Math.random() - 0.49) * 6;
        sink.currentDemandMw = Math.round(sink.baseDemandMw * (1 - (sink.loadShedPct / 100)) + demandDrift);
      }
    });

    // Substation feeders
    gridState.substation.feeders.forEach(f => {
      if (f.breakerState === 'CLOSED' && f.status === 'HEALTHY') {
        const curDrift = (Math.random() - 0.5) * 3;
        f.currentA = Math.max(50, +(f.currentA + curDrift).toFixed(1));
        f.activePowerMw = +((f.currentA * f.voltageKv * 1.732 * f.powerFactor) / 1000).toFixed(2);
      }
    });
  }

  // Broadcast 1-second telemetry heartbeat
  broadcast({
    type: 'TELEMETRY_TICK',
    payload: {
      timestamp: new Date().toISOString(),
      nldc: gridState.nldc,
      sources: gridState.sources,
      sinks: gridState.sinks,
      corridors: gridState.corridors,
      substation: gridState.substation
    }
  });
}, 1000);

// WebSocket connection handler
wss.on('connection', ws => {
  // Send full initial state snapshot on connect
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    payload: gridState
  }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message.toString());
      handleClientCommand(parsed, ws);
    } catch (err) {
      console.error('Error handling WS command:', err);
    }
  });
});

// Central Command Handler (Supports both REST and WebSocket)
function handleClientCommand(msg, senderWs) {
  const { command, payload, operator } = msg;

  switch (command) {
    // 1. MAP CONTROL: Transmission Corridor Trip / Re-route / Restore
    case 'CORRIDOR_TRIP': {
      const { corridorId } = payload;
      const corridor = gridState.corridors.find(c => c.id === corridorId);
      if (!corridor) return;
      corridor.status = 'TRIPPED';
      corridor.flowMw = 0;
      logAlarm('CRITICAL', corridor.name, `Corridor TRIPPED manually by operator ${operator || 'SCADA-ENG'}. Power flow interrupted.`);
      logAudit('CORRIDOR_TRIP', corridor.id, operator, `Line breakers tripped. Flow: 0 MW`);
      recalculateNationalMetrics();
      broadcast({ type: 'CORRIDOR_UPDATED', payload: corridor });
      break;
    }

    case 'CORRIDOR_RESTORE': {
      const { corridorId } = payload;
      const corridor = gridState.corridors.find(c => c.id === corridorId);
      if (!corridor) return;
      corridor.status = 'ENERGIZED';
      corridor.flowMw = Math.round(corridor.capacityMw * 0.65);
      logAlarm('INFO', corridor.name, `Corridor re-energized and synchronized with regional grid.`);
      logAudit('CORRIDOR_RESTORE', corridor.id, operator, `Re-closed breakers. Flow restored: ${corridor.flowMw} MW`);
      recalculateNationalMetrics();
      broadcast({ type: 'CORRIDOR_UPDATED', payload: corridor });
      break;
    }

    case 'CORRIDOR_REROUTE': {
      const { corridorId } = payload;
      const corridor = gridState.corridors.find(c => c.id === corridorId);
      if (!corridor) return;
      corridor.status = 'REROUTED';
      corridor.flowMw = Math.round(corridor.capacityMw * 0.8);
      logAlarm('WARNING', corridor.name, `Dynamic power rerouting active via alternate HVDC bypass.`);
      logAudit('CORRIDOR_REROUTE', corridor.id, operator, `Rerouted through parallel HVDC corridor.`);
      recalculateNationalMetrics();
      broadcast({ type: 'CORRIDOR_UPDATED', payload: corridor });
      break;
    }

    // 2. MAP CONTROL: Generator Dispatch Ramp & Curtailment
    case 'GENERATOR_DISPATCH': {
      const { sourceId, targetMw } = payload;
      const source = gridState.sources.find(s => s.id === sourceId);
      if (!source) return;
      const clampedMw = Math.min(source.maxDispatchMw, Math.max(source.minDispatchMw, Number(targetMw)));
      source.currentGenMw = clampedMw;
      logAudit('GENERATOR_DISPATCH', source.id, operator, `Dispatched output set to ${clampedMw} MW`);
      recalculateNationalMetrics();
      broadcast({ type: 'SOURCE_UPDATED', payload: source });
      break;
    }

    case 'GENERATOR_CURTAIL_TOGGLE': {
      const { sourceId } = payload;
      const source = gridState.sources.find(s => s.id === sourceId);
      if (!source) return;
      source.curtailed = !source.curtailed;
      if (source.curtailed) {
        source.currentGenMw = Math.round(source.currentGenMw * 0.5);
        logAlarm('WARNING', source.name, `Renewable generation curtailment imposed due to transmission congestion.`);
      } else {
        source.currentGenMw = Math.round(source.capacityMw * 0.85);
        logAlarm('INFO', source.name, `Curtailment removed. Generation operating at unrestricted output.`);
      }
      logAudit('CURTAIL_TOGGLE', source.id, operator, `Curtailment state: ${source.curtailed}`);
      recalculateNationalMetrics();
      broadcast({ type: 'SOURCE_UPDATED', payload: source });
      break;
    }

    case 'GENERATOR_TRIP_TOGGLE': {
      const { sourceId } = payload;
      const source = gridState.sources.find(s => s.id === sourceId);
      if (!source) return;
      source.status = source.status === 'ONLINE' ? 'TRIPPED' : 'ONLINE';
      if (source.status === 'TRIPPED') {
        source.currentGenMw = 0;
        logAlarm('CRITICAL', source.name, `Plant tripped! Loss of ${source.capacityMw} MW generation.`);
      } else {
        source.currentGenMw = Math.round(source.capacityMw * 0.75);
        logAlarm('INFO', source.name, `Plant re-synchronized to grid bus.`);
      }
      logAudit('GEN_TRIP_TOGGLE', source.id, operator, `Status: ${source.status}`);
      recalculateNationalMetrics();
      broadcast({ type: 'SOURCE_UPDATED', payload: source });
      break;
    }

    // 3. MAP CONTROL: Demand Sink Load Shedding & Demand Response
    case 'DEMAND_SHED': {
      const { sinkId, shedPct } = payload;
      const sink = gridState.sinks.find(s => s.id === sinkId);
      if (!sink) return;
      sink.loadShedPct = Number(shedPct);
      sink.currentDemandMw = Math.round(sink.baseDemandMw * (1 - (sink.loadShedPct / 100)));
      sink.status = sink.loadShedPct >= 90 ? 'BLACKOUT' : (sink.loadShedPct > 0 ? 'SHED' : 'NORMAL');
      logAlarm(sink.loadShedPct > 0 ? 'WARNING' : 'INFO', sink.name, `Emergency Load Shedding set to ${shedPct}%. Current draw: ${sink.currentDemandMw} MW.`);
      logAudit('DEMAND_SHED', sink.id, operator, `Shed: ${shedPct}%`);
      recalculateNationalMetrics();
      broadcast({ type: 'SINK_UPDATED', payload: sink });
      break;
    }

    case 'DEMAND_RESPONSE_TOGGLE': {
      const { sinkId } = payload;
      const sink = gridState.sinks.find(s => s.id === sinkId);
      if (!sink) return;
      sink.drActive = !sink.drActive;
      if (sink.drActive) {
        sink.currentDemandMw = Math.round(sink.baseDemandMw * 0.88);
        logAlarm('INFO', sink.name, `Automated Demand Response (DR) activated: 12% peak shaved.`);
      } else {
        sink.currentDemandMw = sink.baseDemandMw;
      }
      logAudit('DR_TOGGLE', sink.id, operator, `Demand Response: ${sink.drActive}`);
      recalculateNationalMetrics();
      broadcast({ type: 'SINK_UPDATED', payload: sink });
      break;
    }

    // 4. MAP CONTROL: Regional Grid Islanding
    case 'REGION_ISOLATE_TOGGLE': {
      const { regionId } = payload;
      const region = gridState.regions.find(r => r.id === regionId);
      if (!region) return;
      region.isIslanded = !region.isIslanded;
      region.status = region.isIslanded ? 'ISLANDED' : 'NORMAL';
      logAlarm(region.isIslanded ? 'CRITICAL' : 'INFO', region.code, `Regional grid islanding ${region.isIslanded ? 'ENGAGED' : 'SYNCHRONIZED'}.`);
      logAudit('REGION_ISOLATE', region.id, operator, `Islanded: ${region.isIslanded}`);
      broadcast({ type: 'REGION_UPDATED', payload: region });
      break;
    }

    // 5. SUBSTATION CONTROL: Circuit Breaker Trip/Close
    case 'BREAKER_TOGGLE': {
      const { feederId } = payload;
      const feeder = gridState.substation.feeders.find(f => f.id === feederId);
      if (!feeder) return;
      const nextState = feeder.breakerState === 'CLOSED' ? 'TRIP' : 'CLOSED';
      feeder.breakerState = nextState;
      if (nextState === 'TRIP') {
        feeder.currentA = 0;
        feeder.activePowerMw = 0;
        feeder.status = 'OPEN';
        logAlarm('CRITICAL', feeder.id, `11kV Circuit breaker manually tripped by operator ${operator || 'ENG'}.`);
      } else {
        feeder.status = 'HEALTHY';
        feeder.currentA = 310;
        feeder.activePowerMw = 5.6;
        logAlarm('INFO', feeder.id, `11kV Circuit breaker re-closed and energized.`);
      }
      logAudit('BREAKER_TOGGLE', feeder.id, operator, `Breaker state: ${nextState}`);
      broadcast({ type: 'FEEDER_UPDATED', payload: feeder });
      break;
    }

    // 6. SUBSTATION CONTROL: Tie-Switch TS-1-2
    case 'TIE_SWITCH_TOGGLE': {
      const f1 = gridState.substation.feeders.find(f => f.id === 'FDR-01');
      if (!f1) return;
      f1.tieSwitchState = f1.tieSwitchState === 'CLOSED' ? 'OPEN' : 'CLOSED';
      logAlarm('INFO', 'TS-1-2', `Motorized Tie-Switch TS-1-2 set to ${f1.tieSwitchState}.`);
      logAudit('TIE_SWITCH_TOGGLE', 'TS-1-2', operator, `State: ${f1.tieSwitchState}`);
      broadcast({ type: 'FEEDER_UPDATED', payload: f1 });
      break;
    }

    // 7. AUTOMATION: Trigger FLISR Sequence
    case 'TRIGGER_FLISR': {
      runFlisrSimulation();
      break;
    }

    // 8. IEGC FREQUENCY STABILIZATION: Automatic Dispatch
    case 'STABILIZE_FREQUENCY': {
      // Auto-dispatch Tehri Hydro PSP & Singrauli to pull frequency into exact nominal 50.00 Hz
      const tehri = gridState.sources.find(s => s.id === 'SRC-TEHRI');
      if (tehri) tehri.currentGenMw = 1900;
      gridState.nldc.frequencyHz = 50.00;
      gridState.substation.frequencyHz = 50.00;
      logAlarm('INFO', 'IEGC-AGC', `Automatic Generation Control (AGC) activated. Frequency restored to 50.00 Hz.`);
      logAudit('STABILIZE_FREQ', 'ALL_SOURCES', operator, `Nominal 50.00 Hz achieved.`);
      recalculateNationalMetrics();
      broadcast({ type: 'STATE_REFRESH', payload: gridState });
      break;
    }

    default:
      console.warn('Unknown command received:', command);
  }
}

// Multi-stage FLISR Self-Healing Automation Simulator
function runFlisrSimulation() {
  if (gridState.flisrState.active) return;

  gridState.flisrState.active = true;
  gridState.flisrState.targetFeeder = 'FDR-02';
  gridState.flisrState.timerMs = 0;
  gridState.flisrState.log = [];

  const targetFeeder = gridState.substation.feeders.find(f => f.id === 'FDR-02');
  const tieFeeder = gridState.substation.feeders.find(f => f.id === 'FDR-01');

  // Step 1: Fault Injection & Detection (0ms)
  gridState.flisrState.stage = 'DETECTION';
  if (targetFeeder) {
    targetFeeder.status = 'FAULTED';
    targetFeeder.currentA = 684.2; // Overcurrent spike
    targetFeeder.breakerState = 'TRIP';
  }
  const log1 = { time: "0.0s", text: "Overcurrent fault (684.2A) detected on FDR-02 Section B. Tripped CB-02 in 42ms." };
  gridState.flisrState.log.push(log1);
  logAlarm('CRITICAL', 'FDR-02', 'High impedance phase-to-ground fault detected. Breaker CB-02 tripped.');
  broadcast({ type: 'FLISR_UPDATE', payload: gridState.flisrState });
  broadcast({ type: 'FEEDER_UPDATED', payload: targetFeeder });

  // Step 2: Fault Isolation (2500ms)
  setTimeout(() => {
    gridState.flisrState.stage = 'ISOLATION';
    if (targetFeeder) {
      targetFeeder.status = 'ISOLATED';
      targetFeeder.currentA = 0;
    }
    const log2 = { time: "2.5s", text: "Motorized sectionalizers SW-2A and SW-2B opened. Faulted Section B isolated." };
    gridState.flisrState.log.push(log2);
    logAlarm('WARNING', 'FDR-02', 'Faulted line segment successfully isolated via SCADA motorized switches.');
    broadcast({ type: 'FLISR_UPDATE', payload: gridState.flisrState });
    broadcast({ type: 'FEEDER_UPDATED', payload: targetFeeder });

    // Step 3: Service Restoration via Tie-Switch (5500ms)
    setTimeout(() => {
      gridState.flisrState.stage = 'RESTORATION';
      if (tieFeeder) tieFeeder.tieSwitchState = 'CLOSED';
      if (targetFeeder) {
        targetFeeder.status = 'RESTORED';
        targetFeeder.currentA = 210.0;
        targetFeeder.activePowerMw = 3.65;
      }
      const log3 = { time: "5.5s", text: "Tie-Switch TS-1-2 closed. 3,400 out of 4,850 customers restored via Feeder 1 tie." };
      gridState.flisrState.log.push(log3);
      logAlarm('INFO', 'FLISR-ENGINE', 'Autonomous self-healing completed: 70% customers restored without operator dispatch.');
      broadcast({ type: 'FLISR_UPDATE', payload: gridState.flisrState });
      broadcast({ type: 'FEEDER_UPDATED', payload: targetFeeder });
      broadcast({ type: 'FEEDER_UPDATED', payload: tieFeeder });

      // Step 4: Finalize
      setTimeout(() => {
        gridState.flisrState.active = false;
        gridState.flisrState.stage = 'RESTORED';
        broadcast({ type: 'FLISR_UPDATE', payload: gridState.flisrState });
      }, 3000);
    }, 3000);
  }, 2500);
}

// REST API Endpoints

// 1. National Grid Info
app.get('/api/grid/india', (req, res) => {
  res.json({
    success: true,
    data: {
      nldc: gridState.nldc,
      regions: gridState.regions,
      sources: gridState.sources,
      sinks: gridState.sinks,
      corridors: gridState.corridors
    }
  });
});

// 2. All Electricity Sources (Ukai Dam, Sardar Sarovar, Kakrapar Nuclear, etc.)
app.get('/api/grid/sources', (req, res) => {
  const { type, region, status } = req.query;
  let result = gridState.sources;
  if (type) result = result.filter(s => s.type === type);
  if (region) result = result.filter(s => s.region === region);
  if (status) result = result.filter(s => s.status === status);
  res.json({
    success: true,
    count: result.length,
    totalCapacityMw: result.reduce((acc, s) => acc + s.capacityMw, 0),
    totalCurrentGenMw: result.reduce((acc, s) => s.status === 'ONLINE' ? acc + s.currentGenMw : acc, 0),
    sources: result
  });
});

// Individual Source by ID
app.get('/api/grid/sources/:id', (req, res) => {
  const source = gridState.sources.find(s => s.id === req.params.id);
  if (!source) return res.status(404).json({ success: false, error: 'Source not found' });
  res.json({ success: true, source });
});

// 3. All Electricity Sinks (Cities, Factories, Houses/Townships, Transit)
app.get('/api/grid/sinks', (req, res) => {
  const { category, region, status } = req.query;
  let result = gridState.sinks;
  if (category) result = result.filter(s => s.category === category);
  if (region) result = result.filter(s => s.region === region);
  if (status) result = result.filter(s => s.status === status);
  res.json({
    success: true,
    count: result.length,
    totalPeakDemandMw: result.reduce((acc, s) => acc + s.peakDemandMw, 0),
    totalCurrentDemandMw: result.reduce((acc, s) => acc + s.currentDemandMw, 0),
    sinks: result
  });
});

// Individual Sink by ID
app.get('/api/grid/sinks/:id', (req, res) => {
  const sink = gridState.sinks.find(s => s.id === req.params.id);
  if (!sink) return res.status(404).json({ success: false, error: 'Sink not found' });
  res.json({ success: true, sink });
});

// 2. Substation Info
app.get('/api/grid/substation', (req, res) => {
  res.json({
    success: true,
    data: gridState.substation
  });
});

// 3. Alarms
app.get('/api/grid/alarms', (req, res) => {
  res.json({
    success: true,
    data: gridState.alarms
  });
});

// 4. Audit Log
app.get('/api/grid/audit', (req, res) => {
  res.json({
    success: true,
    data: gridState.commandAuditLog
  });
});

// 5. Unified Command POST endpoint
app.post('/api/grid/control', (req, res) => {
  const { command, payload, operator } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, error: 'Missing command parameter' });
  }

  handleClientCommand({ command, payload, operator }, null);

  res.json({
    success: true,
    message: `Command ${command} processed successfully.`,
    currentState: {
      frequency: gridState.nldc.frequencyHz,
      demandMetMw: gridState.nldc.nationalDemandMetMw
    }
  });
});

// 6. Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'GridPulse Official India Grid SCADA & Automation Engine'
  });
});

server.listen(port, () => {
  console.log(`[GridPulse Backend] Server running on http://localhost:${port}`);
  console.log(`[GridPulse Backend] WebSocket stream active at ws://localhost:${port}/ws`);
  console.log(`[GridPulse Backend] Loaded official Grid-India (POSOCO) and CEA baselines.`);
});
