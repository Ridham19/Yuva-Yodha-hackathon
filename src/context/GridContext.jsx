import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  INITIAL_SUBSTATION,
  INITIAL_FEEDERS,
  INITIAL_RENEWABLES,
  INITIAL_TRANSFORMERS,
  DEFAULT_THRESHOLDS
} from '../data/gridData';
import {
  OFFICIAL_NLDC_BASELINE,
  REGIONAL_DESPATCH_CENTRES,
  INDIA_GRID_SOURCES,
  INDIA_GRID_SINKS,
  TRANSMISSION_CORRIDORS
} from '../data/indiaGridData';
import {
  playBreakerTripSound,
  playBreakerCloseSound,
  playAlarmChirp,
  setSoundEnabled
} from '../utils/audioEffects';

const GridContext = createContext(null);

export const GridProvider = ({ children }) => {
  // --- NATIONAL LEVEL STATE (Official NLDC / Grid-India) ---
  const [nldc, setNldc] = useState(OFFICIAL_NLDC_BASELINE);
  const [regions, setRegions] = useState(REGIONAL_DESPATCH_CENTRES);
  const [sources, setSources] = useState(INDIA_GRID_SOURCES);
  const [sinks, setSinks] = useState(INDIA_GRID_SINKS);
  const [corridors, setCorridors] = useState(TRANSMISSION_CORRIDORS);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [commandAuditLog, setCommandAuditLog] = useState([]);

  // Breaker Operation & Interlock Audit Log (IEC 61850-7-4)
  const [breakerOperationLog, setBreakerOperationLog] = useState([
    {
      id: "SW-OP-891",
      timestamp: "13:58:22",
      feederId: "FDR-01",
      feederName: "Industrial Hub Feeder",
      action: "CLOSE",
      targetState: "ENERGIZED",
      operator: "DISCOM-ENG-402",
      role: "Senior Dispatcher",
      interlockStatus: "CLEAR & VALIDATED",
      protocol: "IEC 61850 GOOSE"
    },
    {
      id: "SW-OP-890",
      timestamp: "13:42:10",
      feederId: "TS-1-2",
      feederName: "Feeder 1-2 Motorized Tie-Switch",
      action: "OPEN",
      targetState: "NORMAL_ISOLATED",
      operator: "AUTONOMOUS-FLISR",
      role: "SCADA Automation Core",
      interlockStatus: "INTERLOCK VERIFIED",
      protocol: "DNP3 / Modbus TCP"
    },
    {
      id: "SW-OP-889",
      timestamp: "12:15:04",
      feederId: "FDR-04",
      feederName: "Agricultural Feeder (11kV)",
      action: "CLOSE",
      targetState: "ENERGIZED",
      operator: "SCADA-OPS-109",
      role: "Protection Engineer",
      interlockStatus: "CLEAR & VALIDATED",
      protocol: "IEC 61850 GOOSE"
    }
  ]);

  // Audio mute switch
  const [soundMuted, setSoundMuted] = useState(false);

  // Auto Demand Response (ADR) Armed Flag
  const [isAutoAdrArmed, setIsAutoAdrArmed] = useState(true);

  // --- LOCAL SUBSTATION STATE ---
  const [substation, setSubstation] = useState(INITIAL_SUBSTATION);
  const [feeders, setFeeders] = useState(INITIAL_FEEDERS);
  const [renewables, setRenewables] = useState(INITIAL_RENEWABLES);
  const [transformers, setTransformers] = useState(INITIAL_TRANSFORMERS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // Electrical Telemetry
  const [gridFrequencyHz, setGridFrequencyHz] = useState(50.01);
  const [totalDemandMw, setTotalDemandMw] = useState(23.72);
  const [totalGenerationMw, setTotalGenerationMw] = useState(28.00);

  // Alarms & Events
  const [alarms, setAlarms] = useState([
    {
      id: "ALM-101",
      timestamp: new Date().toLocaleTimeString(),
      severity: "INFO",
      source: "NLDC Gateway",
      message: "National Load Despatch Centre (Grid-India) official telemetry feed initialized.",
      acknowledged: true
    },
    {
      id: "ALM-102",
      timestamp: new Date().toLocaleTimeString(),
      severity: "INFO",
      source: "IEGC Monitor",
      message: "Grid frequency locked in statutory IEGC band (49.90 - 50.05 Hz).",
      acknowledged: true
    }
  ]);

  // Self-Healing FLISR Simulation State
  const [flisrActive, setFlisrActive] = useState(false);
  const [flisrStage, setFlisrStage] = useState(null);
  const [flisrTimerMs, setFlisrTimerMs] = useState(0);
  const [flisrLog, setFlisrLog] = useState([]);
  const flisrIntervalRef = useRef(null);

  // Simulation Running Switch
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);

  // WebSocket reference
  const wsRef = useRef(null);

  // Helper: Log alarm locally
  const addAlarm = (severity, source, message) => {
    if (severity === "CRITICAL" || severity === "WARNING") {
      if (!soundMuted) playAlarmChirp();
    }
    const newAlarm = {
      id: `ALM-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      severity,
      source,
      message,
      acknowledged: false
    };
    setAlarms(prev => [newAlarm, ...prev.slice(0, 49)]);
  };

  // Helper: Send command to backend via WebSocket or HTTP fallback
  const sendBackendCommand = (command, payload = {}, operator = "DISCOM-ENG-402") => {
    const packet = { command, payload, operator };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    } else {
      // HTTP fallback
      fetch('/api/grid/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      }).catch(err => console.debug('HTTP fallback failed or backend offline:', err.message));
    }

    // Also update audit log locally
    setCommandAuditLog(prev => [
      {
        id: `AUD-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString(),
        action: command,
        target: payload.corridorId || payload.sourceId || payload.sinkId || payload.feederId || 'GRID',
        operator,
        details: JSON.stringify(payload)
      },
      ...prev.slice(0, 39)
    ]);
  };

  // Connect WebSocket to Backend
  useEffect(() => {
    const wsUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/ws` 
      : `ws://localhost:5000/ws`;

    let reconnectTimer = null;

    const connectWs = () => {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsBackendConnected(true);
          addAlarm("INFO", "SCADA-NET", "Real-Time WebSocket Link established to GridPulse Backend Server (Port 5000).");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'INITIAL_STATE':
                if (data.payload.nldc) setNldc(data.payload.nldc);
                if (data.payload.regions) setRegions(data.payload.regions);
                if (data.payload.sources) setSources(data.payload.sources);
                if (data.payload.sinks) setSinks(data.payload.sinks);
                if (data.payload.corridors) setCorridors(data.payload.corridors);
                if (data.payload.substation?.feeders) setFeeders(data.payload.substation.feeders);
                if (data.payload.substation?.frequencyHz) setGridFrequencyHz(data.payload.substation.frequencyHz);
                break;

              case 'TELEMETRY_TICK':
                if (data.payload.nldc) setNldc(data.payload.nldc);
                if (data.payload.nldc?.frequencyHz) setGridFrequencyHz(data.payload.nldc.frequencyHz);
                if (data.payload.sources) setSources(data.payload.sources);
                if (data.payload.sinks) setSinks(data.payload.sinks);
                if (data.payload.corridors) setCorridors(data.payload.corridors);
                if (data.payload.substation?.feeders) setFeeders(data.payload.substation.feeders);
                break;

              case 'CORRIDOR_UPDATED':
                setCorridors(prev => prev.map(c => c.id === data.payload.id ? data.payload : c));
                break;

              case 'SOURCE_UPDATED':
                setSources(prev => prev.map(s => s.id === data.payload.id ? data.payload : s));
                break;

              case 'SINK_UPDATED':
                setSinks(prev => prev.map(s => s.id === data.payload.id ? data.payload : s));
                break;

              case 'REGION_UPDATED':
                setRegions(prev => prev.map(r => r.id === data.payload.id ? data.payload : r));
                break;

              case 'FEEDER_UPDATED':
                setFeeders(prev => prev.map(f => f.id === data.payload.id ? data.payload : f));
                break;

              case 'FLISR_UPDATE':
                setFlisrActive(data.payload.active);
                setFlisrStage(data.payload.stage);
                if (data.payload.log) setFlisrLog(data.payload.log);
                break;

              case 'ALARM_NEW':
                setAlarms(prev => [data.payload, ...prev.slice(0, 49)]);
                break;

              case 'STATE_REFRESH':
                if (data.payload.nldc) setNldc(data.payload.nldc);
                if (data.payload.sources) setSources(data.payload.sources);
                if (data.payload.sinks) setSinks(data.payload.sinks);
                if (data.payload.corridors) setCorridors(data.payload.corridors);
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('Error parsing backend message:', err);
          }
        };

        socket.onclose = () => {
          setIsBackendConnected(false);
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        socket.onerror = () => {
          setIsBackendConnected(false);
          socket.close();
        };
      } catch (e) {
        setIsBackendConnected(false);
        reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Fallback Local Simulation Loop (runs when not connected or in standalone)
  useEffect(() => {
    if (!isLiveStreamActive || isBackendConnected) return;

    const interval = setInterval(() => {
      if (!flisrActive) {
        setGridFrequencyHz(prev => {
          const drift = (Math.random() - 0.49) * 0.03;
          const next = +(prev + drift).toFixed(2);
          return Math.min(Math.max(next, 49.90), 50.10);
        });
      }

      setFeeders(prevFeeders => {
        return prevFeeders.map(f => {
          if (f.breakerState !== "CLOSED" || f.status === "FAULTED" || f.status === "ISOLATED") {
            return f;
          }
          const currentFluctuation = (Math.random() - 0.5) * 3.0;
          const newCurrent = Math.max(50, +(f.currentA + currentFluctuation).toFixed(1));
          const newMw = +((newCurrent * f.voltageKv * 1.732 * f.powerFactor) / 1000).toFixed(2);
          const newMvar = +(newMw * Math.tan(Math.acos(f.powerFactor))).toFixed(2);
          return {
            ...f,
            currentA: newCurrent,
            activePowerMw: newMw,
            reactivePowerMvar: newMvar
          };
        });
      });

      setRenewables(prev => {
        const solarDrift = (Math.random() - 0.48) * 0.2;
        const windDrift = (Math.random() - 0.5) * 0.3;
        const nextSolar = Math.max(0, Math.min(prev.solarCapacityMw, +(prev.solarOutputMw + solarDrift).toFixed(1)));
        const nextWind = Math.max(0, Math.min(prev.windCapacityMw, +(prev.windOutputMw + windDrift).toFixed(1)));
        return {
          ...prev,
          solarOutputMw: nextSolar,
          windOutputMw: nextWind
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveStreamActive, flisrActive, isBackendConnected]);

  // Recalculate Totals whenever feeders or renewables change
  useEffect(() => {
    const demand = feeders.reduce((sum, f) => {
      return f.breakerState === "CLOSED" ? sum + f.activePowerMw : sum;
    }, 0);
    setTotalDemandMw(+demand.toFixed(2));

    const gen = renewables.solarOutputMw + renewables.windOutputMw + renewables.bessOutputMw;
    setTotalGenerationMw(+gen.toFixed(2));
  }, [feeders, renewables]);

  // Check Overload & Frequency Thresholds
  useEffect(() => {
    feeders.forEach(f => {
      if (f.currentA > thresholds.feederCurrentMaxA && f.status === "HEALTHY" && f.breakerState === "CLOSED") {
        addAlarm("CRITICAL", f.id, `Overcurrent: ${f.currentA}A exceeds safe ceiling of ${thresholds.feederCurrentMaxA}A.`);
      }
    });

    if (gridFrequencyHz < thresholds.freqLowHz) {
      addAlarm("WARNING", "GRID-FREQ", `System Frequency dipped to ${gridFrequencyHz} Hz (< ${thresholds.freqLowHz} Hz threshold).`);
      
      // Auto Demand Response (ADR) Autonomous Frequency Defense
      if (isAutoAdrArmed) {
        const agriFeeder = feeders.find(f => f.id === 'FDR-04');
        if (agriFeeder && !agriFeeder.isDemandResponseActive && agriFeeder.breakerState === 'CLOSED') {
          if (!soundMuted) playBreakerTripSound();
          setFeeders(prev => prev.map(f => {
            if (f.id !== 'FDR-04') return f;
            return {
              ...f,
              isDemandResponseActive: true,
              breakerState: "TRIP",
              currentA: 0,
              activePowerMw: 0
            };
          }));
          setBreakerOperationLog(prev => [
            {
              id: `SW-OP-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toLocaleTimeString(),
              feederId: "FDR-04",
              feederName: "Agricultural Feeder (11kV)",
              action: "ADR_AUTOSHED",
              targetState: "ISOLATED",
              operator: "AUTONOMOUS-ADR",
              role: "Grid Auto-Shed Agent",
              interlockStatus: "FREQ DROP VERIFIED",
              protocol: "IEC 61850 GOOSE"
            },
            ...prev.slice(0, 49)
          ]);
          addAlarm(
            "CRITICAL",
            "AUTO-ADR",
            `🚨 AUTOMATIC DEMAND RESPONSE: Frequency dropped to ${gridFrequencyHz} Hz (< ${thresholds.freqLowHz} Hz). Autonomously shed 4.15 MW agricultural load on Feeder 4 to stabilize grid!`
          );
        }
      }
    } else if (gridFrequencyHz > thresholds.freqHighHz) {
      addAlarm("WARNING", "GRID-FREQ", `System Frequency elevated to ${gridFrequencyHz} Hz (> ${thresholds.freqHighHz} Hz threshold).`);
    }
  }, [gridFrequencyHz, thresholds, isAutoAdrArmed, feeders, soundMuted]);

  // --- MAP-BASED TELE-CONTROL ACTIONS ---

  // 1. Control Transmission Corridor: Trip, Restore, Reroute
  const controlCorridor = (corridorId, action) => {
    if (action === 'TRIP') {
      sendBackendCommand('CORRIDOR_TRIP', { corridorId });
      setCorridors(prev => prev.map(c => c.id === corridorId ? { ...c, status: 'TRIPPED', flowMw: 0 } : c));
      addAlarm('CRITICAL', corridorId, `Corridor line breakers TRIPPED. Power flow interrupted.`);
    } else if (action === 'RESTORE') {
      sendBackendCommand('CORRIDOR_RESTORE', { corridorId });
      setCorridors(prev => prev.map(c => c.id === corridorId ? { ...c, status: 'ENERGIZED', flowMw: Math.round(c.capacityMw * 0.65) } : c));
      addAlarm('INFO', corridorId, `Corridor re-energized and synchronized.`);
    } else if (action === 'REROUTE') {
      sendBackendCommand('CORRIDOR_REROUTE', { corridorId });
      setCorridors(prev => prev.map(c => c.id === corridorId ? { ...c, status: 'REROUTED', flowMw: Math.round(c.capacityMw * 0.8) } : c));
      addAlarm('WARNING', corridorId, `Power flow dynamic reroute active via alternate link.`);
    }
  };

  // 2. Control Generation Station: Ramp MW, Curtail, Trip
  const controlGenerator = (sourceId, action, targetMw = null) => {
    if (action === 'DISPATCH') {
      sendBackendCommand('GENERATOR_DISPATCH', { sourceId, targetMw });
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, currentGenMw: Number(targetMw) } : s));
      addAlarm('INFO', sourceId, `Generation output dispatched to ${targetMw} MW.`);
    } else if (action === 'CURTAIL') {
      sendBackendCommand('GENERATOR_CURTAIL_TOGGLE', { sourceId });
      setSources(prev => prev.map(s => {
        if (s.id !== sourceId) return s;
        const nextCurtailed = !s.curtailed;
        return {
          ...s,
          curtailed: nextCurtailed,
          currentGenMw: nextCurtailed ? Math.round(s.currentGenMw * 0.5) : Math.round(s.capacityMw * 0.85)
        };
      }));
      addAlarm('WARNING', sourceId, `Renewable curtailment status toggled.`);
    } else if (action === 'TRIP') {
      sendBackendCommand('GENERATOR_TRIP_TOGGLE', { sourceId });
      setSources(prev => prev.map(s => {
        if (s.id !== sourceId) return s;
        const nextStatus = s.status === 'ONLINE' ? 'TRIPPED' : 'ONLINE';
        return {
          ...s,
          status: nextStatus,
          currentGenMw: nextStatus === 'TRIPPED' ? 0 : Math.round(s.capacityMw * 0.75)
        };
      }));
      addAlarm('CRITICAL', sourceId, `Generator trip / restore state toggled.`);
    }
  };

  // 3. Control Demand Sink: Shedding & Demand Response
  const controlDemand = (sinkId, action, shedPct = 0) => {
    if (action === 'SHED') {
      sendBackendCommand('DEMAND_SHED', { sinkId, shedPct });
      setSinks(prev => prev.map(s => {
        if (s.id !== sinkId) return s;
        const nextDemand = Math.round(s.baseDemandMw * (1 - (shedPct / 100)));
        return {
          ...s,
          loadShedPct: Number(shedPct),
          currentDemandMw: nextDemand,
          status: shedPct >= 90 ? 'BLACKOUT' : (shedPct > 0 ? 'SHED' : 'NORMAL')
        };
      }));
      addAlarm(shedPct > 0 ? 'WARNING' : 'INFO', sinkId, `Emergency load shed set to ${shedPct}%.`);
    } else if (action === 'DR_TOGGLE') {
      sendBackendCommand('DEMAND_RESPONSE_TOGGLE', { sinkId });
      setSinks(prev => prev.map(s => {
        if (s.id !== sinkId) return s;
        const nextDr = !s.drActive;
        return {
          ...s,
          drActive: nextDr,
          currentDemandMw: nextDr ? Math.round(s.baseDemandMw * 0.88) : s.baseDemandMw
        };
      }));
      addAlarm('INFO', sinkId, `Demand Response toggled.`);
    }
  };

  // 4. Regional Despatch Islanding Control
  const controlRegion = (regionId, action) => {
    sendBackendCommand('REGION_ISOLATE_TOGGLE', { regionId });
    setRegions(prev => prev.map(r => {
      if (r.id !== regionId) return r;
      const nextIslanded = !r.isIslanded;
      return {
        ...r,
        isIslanded: nextIslanded,
        status: nextIslanded ? 'ISLANDED' : 'NORMAL'
      };
    }));
    addAlarm('CRITICAL', regionId, `Regional grid islanding toggled.`);
  };

  // 5. Automatic Frequency Stabilizer (AGC)
  const stabilizeFrequency = () => {
    sendBackendCommand('STABILIZE_FREQUENCY', {});
    setGridFrequencyHz(50.00);
    setNldc(prev => ({ ...prev, frequencyHz: 50.00 }));
    setSources(prev => prev.map(s => s.id === 'SRC-TEHRI' ? { ...s, currentGenMw: 1900 } : s));
    addAlarm('INFO', 'IEGC-AGC', 'AGC secondary frequency control restored system to 50.00 Hz nominal.');
  };

  // --- SUBSTATION REMOTE BREAKER CONTROLS ---
  const toggleBreaker = (feederId, operatorName = "DISCOM-ENG-402", operatorRole = "Senior Dispatcher") => {
    sendBackendCommand('BREAKER_TOGGLE', { feederId }, operatorName);
    const targetFeeder = feeders.find(f => f.id === feederId);
    const nextState = targetFeeder?.breakerState === "CLOSED" ? "TRIP" : "CLOSED";

    // Play synthetic switchgear sound
    if (!soundMuted) {
      if (nextState === "TRIP") playBreakerTripSound();
      else playBreakerCloseSound();
    }

    // High-voltage Breaker Operation Log (IEC 61850)
    const newLogEntry = {
      id: `SW-OP-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      feederId,
      feederName: targetFeeder?.name || feederId,
      action: nextState,
      targetState: nextState === "CLOSED" ? "ENERGIZED" : "ISOLATED",
      operator: operatorName,
      role: operatorRole,
      interlockStatus: "CLEAR & VALIDATED",
      protocol: "IEC 61850 GOOSE"
    };
    setBreakerOperationLog(prev => [newLogEntry, ...prev.slice(0, 49)]);

    setFeeders(prevFeeders => {
      return prevFeeders.map(f => {
        if (f.id !== feederId) return f;
        const nextStatus = nextState === "CLOSED" ? "HEALTHY" : "ISOLATED";
        addAlarm(
          nextState === "CLOSED" ? "INFO" : "WARNING",
          f.id,
          `Breaker ${f.id} commanded to ${nextState} by ${operatorName} (${operatorRole}).`
        );
        return {
          ...f,
          breakerState: nextState,
          status: nextStatus,
          currentA: nextState === "CLOSED" ? 280.0 : 0.0,
          activePowerMw: nextState === "CLOSED" ? 5.2 : 0.0
        };
      });
    });
  };

  const toggleTieSwitch = (tieSwitchId = "TS-1-2", operatorName = "DISCOM-ENG-402") => {
    sendBackendCommand('TIE_SWITCH_TOGGLE', { tieSwitchId });
    const f1 = feeders.find(f => f.id === 'FDR-01');
    const nextTieState = f1?.tieSwitchState === "CLOSED" ? "OPEN" : "CLOSED";

    if (!soundMuted) {
      if (nextTieState === "OPEN") playBreakerTripSound();
      else playBreakerCloseSound();
    }

    const newLogEntry = {
      id: `SW-OP-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      feederId: tieSwitchId,
      feederName: "Feeder 1-2 Motorized Tie-Switch",
      action: nextTieState,
      targetState: nextTieState === "CLOSED" ? "LOOP_CLOSED" : "ISOLATED",
      operator: operatorName,
      role: "Field / Automation",
      interlockStatus: "SYNCHRONISM CHECK PASSED",
      protocol: "DNP3 / Modbus TCP"
    };
    setBreakerOperationLog(prev => [newLogEntry, ...prev.slice(0, 49)]);

    setFeeders(prevFeeders => {
      return prevFeeders.map(f => {
        if (!f.hasTieSwitch && f.id !== 'FDR-01') return f;
        addAlarm("INFO", tieSwitchId, `Tie-switch ${tieSwitchId} switched to ${nextTieState} by ${operatorName}.`);
        return {
          ...f,
          tieSwitchState: nextTieState
        };
      });
    });
  };

  const toggleDemandResponse = (feederId, operatorName = "ADR-SYSTEM") => {
    const f = feeders.find(item => item.id === feederId);
    const willShed = !f?.isDemandResponseActive;

    if (!soundMuted) {
      if (willShed) playBreakerTripSound();
      else playBreakerCloseSound();
    }

    const newLogEntry = {
      id: `SW-OP-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      feederId,
      feederName: f?.name || feederId,
      action: willShed ? "ADR_SHED" : "ADR_RESTORE",
      targetState: willShed ? "ISOLATED" : "ENERGIZED",
      operator: operatorName,
      role: "Demand Management",
      interlockStatus: "SHED PERMITTED",
      protocol: "IEC 61850 GOOSE"
    };
    setBreakerOperationLog(prev => [newLogEntry, ...prev.slice(0, 49)]);

    setFeeders(prev => prev.map(item => {
      if (item.id !== feederId) return item;
      addAlarm(
        willShed ? "WARNING" : "INFO",
        item.id,
        willShed 
          ? `Automatic Demand Response (ADR) ACTIVATED: Shed 4.15 MW agricultural load to protect grid frequency.`
          : `Demand Response deactivated on ${item.name}. Normal load restored.`
      );
      return {
        ...item,
        isDemandResponseActive: willShed,
        breakerState: willShed ? "TRIP" : "CLOSED",
        currentA: willShed ? 0 : 220.1,
        activePowerMw: willShed ? 0 : 4.15
      };
    }));
  };

  const updateThreshold = (key, value) => {
    setThresholds(prev => ({ ...prev, [key]: Number(value) }));
    addAlarm("INFO", "CONFIG", `Operating threshold '${key}' updated to ${value}.`);
  };

  const acknowledgeAlarm = (alarmId) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, acknowledged: true } : a));
  };

  const clearAcknowledgedAlarms = () => {
    setAlarms(prev => prev.filter(a => !a.acknowledged));
  };

  // Sound mute toggle
  const toggleSound = () => {
    setSoundMuted(prev => {
      const next = !prev;
      setSoundEnabled(!next);
      return next;
    });
  };

  // FLISR Automated Self-Healing Simulation
  const triggerFLISRSimulation = () => {
    sendBackendCommand('TRIGGER_FLISR', {});
    if (flisrActive) return;

    if (!soundMuted) playBreakerTripSound();
    setFlisrActive(true);
    setFlisrStage('DETECTION');
    setFlisrTimerMs(0);
    setFlisrLog([]);

    const startTime = Date.now();
    flisrIntervalRef.current = setInterval(() => {
      setFlisrTimerMs(Date.now() - startTime);
    }, 50);

    addAlarm("CRITICAL", "FDR-02", "SURGE DETECTED: Ground fault on Feeder 2 (Section B). Fault current: 1240 A!");
    setFlisrLog(prev => [...prev, {
      time: "00.04s",
      stage: "FAULT INJECTION",
      detail: "Line-to-ground flashover occurred on Feeder 2 (Sector Crossing). Fault current: 1240A."
    }]);

    setTimeout(() => {
      if (!soundMuted) playBreakerTripSound();
      setFeeders(prev => prev.map(f => {
        if (f.id !== "FDR-02") return f;
        return {
          ...f,
          breakerState: "TRIP",
          status: "FAULTED",
          currentA: 0,
          activePowerMw: 0,
          sections: f.sections ? f.sections.map(s => ({ ...s, status: "DE_ENERGIZED" })) : []
        };
      }));
      setFlisrLog(prev => [...prev, {
        time: "00.12s",
        stage: "STEP 1: BREAKER TRIP",
        detail: "Digital Protection Relay sensed dI/dt > threshold. Circuit Breaker CB-02 tripped in 42ms."
      }]);
      setFlisrStage('ISOLATION');
    }, 1200);

    setTimeout(() => {
      if (!soundMuted) playBreakerCloseSound();
      setFeeders(prev => prev.map(f => {
        if (f.id !== "FDR-02") return f;
        return {
          ...f,
          breakerState: "CLOSED",
          status: "ISOLATED",
          currentA: 110.4,
          activePowerMw: 2.1
        };
      }));
      setFlisrLog(prev => [...prev, {
        time: "03.45s",
        stage: "STEP 2: SECTION ISOLATION",
        detail: "Motorized switches SW-2A & SW-2B opened to isolate faulty Section B. Breaker CB-02 re-closed."
      }]);
      setFlisrStage('RESTORATION');
    }, 3600);

    setTimeout(() => {
      if (!soundMuted) playBreakerCloseSound();
      setFeeders(prev => prev.map(f => {
        if (f.id === "FDR-01") {
          return {
            ...f,
            currentA: +(f.currentA + 160.0).toFixed(1),
            activePowerMw: +(f.activePowerMw + 3.1).toFixed(2),
            tieSwitchState: "CLOSED"
          };
        }
        if (f.id === "FDR-02") {
          return {
            ...f,
            status: "RESTORED"
          };
        }
        return f;
      }));

      setFlisrLog(prev => [...prev, {
        time: "06.82s",
        stage: "STEP 3: TIE-SWITCH RESTORATION",
        detail: "Capacity verified on healthy Feeder FDR-01. Tie-switch TS-1-2 closed: Restored downstream customers!"
      }]);
      setFlisrStage('RESTORED');
      if (flisrIntervalRef.current) clearInterval(flisrIntervalRef.current);
      addAlarm("INFO", "FLISR-ENGINE", "Self-Healing Cycle completed in 6.82s. 91% customers restored autonomously.");
    }, 7000);
  };

  // Scenario 2: Solar Dip & BESS Frequency Response
  const triggerSolarDipSimulation = () => {
    addAlarm("WARNING", "WEATHER", "Sudden heavy cloud cover detected over solar park. Irradiance falling rapidly.");
    setRenewables(prev => ({
      ...prev,
      solarOutputMw: 5.2,
      weatherCondition: "CLOUD_COVER",
      solarIrradianceWm2: 220
    }));
    setGridFrequencyHz(49.78);
    addAlarm("CRITICAL", "GRID-FREQ", "Frequency dipped to 49.78 Hz due to solar deficit (-13.4 MW).");

    setTimeout(() => {
      setRenewables(prev => ({
        ...prev,
        bessStatus: "DISCHARGING",
        bessOutputMw: 8.5
      }));
      setGridFrequencyHz(49.99);
      addAlarm("INFO", "BESS-AUTOMATION", "BESS Fast Frequency Response dispatched +8.5 MW in 180ms. Frequency recovered to 49.99 Hz.");
    }, 1200);
  };

  // Scenario 3: Peak Load Demand Response (ADR)
  const triggerPeakLoadADRSimulation = () => {
    addAlarm("WARNING", "LOAD-SPIKE", "Peak load evening surge detected: Industrial demand surged by +25% on Feeder 1.");
    setFeeders(prev => prev.map(f => {
      if (f.id === 'FDR-01') {
        return {
          ...f,
          currentA: +(f.currentA * 1.25).toFixed(1),
          activePowerMw: +(f.activePowerMw * 1.25).toFixed(2)
        };
      }
      return f;
    }));
    setGridFrequencyHz(49.74);
    addAlarm("CRITICAL", "GRID-FREQ", "Grid frequency plunged to 49.74 Hz (< 49.85 Hz safety band) due to heavy peak demand.");

    setTimeout(() => {
      toggleDemandResponse('FDR-04', 'AUTONOMOUS-ADR');
      setGridFrequencyHz(49.98);
      addAlarm("INFO", "ADR-STABILIZE", "Auto-Demand Response (ADR) shed 4.15 MW agricultural load. Frequency recovered to 49.98 Hz in 420ms.");
    }, 1000);
  };

  const resetToHealthy = () => {
    if (flisrIntervalRef.current) clearInterval(flisrIntervalRef.current);
    setFeeders(INITIAL_FEEDERS);
    setRenewables(INITIAL_RENEWABLES);
    setSubstation(INITIAL_SUBSTATION);
    setSources(INDIA_GRID_SOURCES);
    setSinks(INDIA_GRID_SINKS);
    setCorridors(TRANSMISSION_CORRIDORS);
    setGridFrequencyHz(50.01);
    setFlisrActive(false);
    setFlisrStage(null);
    setFlisrTimerMs(0);
    setFlisrLog([]);
    addAlarm("INFO", "SYS-RESET", "All national grid corridors, generation stations, and distribution feeders reset.");
  };

  return (
    <GridContext.Provider
      value={{
        // National NLDC / POSOCO state
        nldc,
        regions,
        sources,
        sinks,
        corridors,
        isBackendConnected,
        commandAuditLog,

        // Map-based controls
        controlCorridor,
        controlGenerator,
        controlDemand,
        controlRegion,
        stabilizeFrequency,

        // Local Substation state
        substation,
        feeders,
        renewables,
        transformers,
        thresholds,
        gridFrequencyHz,
        totalDemandMw,
        totalGenerationMw,
        alarms,
        flisrActive,
        flisrStage,
        flisrTimerMs,
        flisrLog,
        isLiveStreamActive,
        setIsLiveStreamActive,
        toggleBreaker,
        toggleTieSwitch,
        toggleDemandResponse,
        updateThreshold,
        acknowledgeAlarm,
        clearAcknowledgedAlarms,
        triggerFLISRSimulation,
        triggerSolarDipSimulation,
        triggerPeakLoadADRSimulation,
        resetToHealthy,

        // Breaker logs & ADR & Sound
        breakerOperationLog,
        isAutoAdrArmed,
        setIsAutoAdrArmed,
        soundMuted,
        toggleSound
      }}
    >
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) throw new Error("useGrid must be used within a GridProvider");
  return context;
};
