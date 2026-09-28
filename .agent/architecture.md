# GridPulse: Technical Architecture & Data Models

## 1. System Topology & Data Flow

```
+------------------------------------------------------------------------+
| 1. Field Layer (IoT & Smart Sensors)                                   |
| - Feeder Smart Meters, Transformer DGA Sensors, Substation RTUs        |
| - Solar/Wind Inverters, Battery Energy Storage Systems (BESS)          |
+-----------------------------------+------------------------------------+
                                    |
                                    v (MQTT / HTTP / LoRaWAN)
+------------------------------------------------------------------------+
| 2. Communication & Ingestion Layer                                     |
| - Real-time telemetry broker (MQTT / WebSocket Streamer)               |
| - Protocol translation & rate-limiting                                 |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
| 3. Processing & Analytics Engine (Backend: Python/FastAPI or Node.js)   |
| - State Estimation & Feeder Topology Graph                             |
| - Fault Detection, Isolation, and Service Restoration (FLISR) Engine   |
| - Demand Response (DR) Optimizer & Battery Dispatch Rules              |
| - ML Anomaly Detection & Predictive Maintenance Scorer                 |
+-----------------------------------+------------------------------------+
                                    |
                                    v (WebSockets / REST API)
+------------------------------------------------------------------------+
| 4. Application Layer (Operator Dashboard - Modern Web UI)              |
| - Geo-tagged Interactive Substation & Feeder Map                       |
| - Real-Time Telemetry & Gauges (Voltage, Current, Frequency, PF)       |
| - Remote Breaker Switching Modal with Safety Interlocks                |
| - Automated Self-Healing Simulation & Live Playback Control            |
| - Renewable vs Demand Balance Chart & Battery Storage Dispatcher       |
+------------------------------------------------------------------------+
```

---

## 2. Core Data Models

### Telemetry Packet (Per-Feeder Stream)
```json
{
  "timestamp": "2026-09-27T17:15:00.000Z",
  "substationId": "SS-NORTH-01",
  "frequencyHz": 50.02,
  "feeders": [
    {
      "id": "FDR-01",
      "name": "Industrial Park Feeder",
      "voltageKv": 11.08,
      "currentA": 342.5,
      "activePowerMw": 6.2,
      "reactivePowerMvar": 1.4,
      "powerFactor": 0.97,
      "status": "HEALTHY",
      "breakerState": "CLOSED"
    },
    {
      "id": "FDR-02",
      "name": "Urban Residential Feeder",
      "voltageKv": 10.94,
      "currentA": 288.1,
      "activePowerMw": 5.1,
      "reactivePowerMvar": 1.2,
      "powerFactor": 0.96,
      "status": "HEALTHY",
      "breakerState": "CLOSED"
    }
  ],
  "renewables": {
    "solarGenerationMw": 18.4,
    "windGenerationMw": 12.1,
    "bessStateOfChargePct": 82.5,
    "bessOutputMw": -2.0
  }
}
```

---

## 3. FLISR (Fault Location, Isolation & Service Restoration) Logic

```
   [ Normal Operation ]
           │
           │ Fault Injected on Feeder 2 Section B (Overcurrent > 600A)
           ▼
   [ 1. Fault Detection ]
     - Detect abnormal dI/dt on FDR-02
     - Trip Circuit Breaker CB-02 (< 50ms)
           │
           ▼
   [ 2. Fault Isolation ]
     - Identify faulted segment between Sectionalizer SW-2A and SW-2B
     - Motorized commands: Open SW-2A and Open SW-2B
           │
           ▼
   [ 3. Service Restoration ]
     - Re-close upstream Breaker CB-02 (Restores customers on Section A)
     - Verify capacity on adjacent healthy Feeder FDR-01
     - Close Normally-Open Tie-Switch TS-1-2 (Restores customers on Section C)
           │
           ▼
   [ Self-Healing Complete ]
     - Total duration: < 15 seconds (vs 2.5 hours manual operator dispatch)
```

---

## 4. Key Performance Indicators (KPIs)
- **SAIDI**: System Average Interruption Duration Index (hours/customer/year)
- **SAIFI**: System Average Interruption Frequency Index (interruptions/customer/year)
- **AT&C Loss**: Aggregate Technical and Commercial Loss (%)
- **Renewable Absorption**: % of generated solar/wind consumed without grid curtailment
