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

---

## 5. UI Component Architecture & Design System

### Layout Hierarchy
```
[ Root Viewport (100vh) ]
 ├── [ Header.jsx ] ── Single Command Bar
 │    ├── Brand Identity & Live Stream Status (:5000 / WS)
 │    ├── 4 Primary Domain Tabs (National Grid | Substation SCADA | AI & Cyber | Markets & Ops)
 │    ├── Consolidated Telemetry Capsule (50.04 Hz | 24.2 MW Load)
 │    ├── Slide-Over Alarms Trigger (🔔 Bell Icon with Unread Count Badge)
 │    ├── Grouped Action Dropdowns (Drills ▾ | Tools ▾)
 │    └── Utility Controls (Pitch Deck [P] | Theme Toggle [T])
 │
 ├── [ Secondary Segmented Subnav Bar ] (Contextual: renders only for active domain with sub-views)
 │
 ├── [ Main Content Area (dashboard-container) ]
 │    ├── National Grid GIS Map (765kV Corridors, Sources & Sinks, Floating Pills)
 │    ├── Substation SCADA (SLD, Double Busbar Twin, Feeder Telemetry, Switchgear, FLISR, EcoStruxure)
 │    ├── AI & Cyber (Neural ML Studio, IEC 62351 Zero-Trust Defense, Predictive DGA)
 │    └── Markets & Ops (IEX Merit Order Despatch, EV Fleet V2G, SQLite Explorer, ESG Carbon)
 │
 ├── [ AlarmsDrawer.jsx ] ── Slide-over right drawer with backdrop blur (ALL / CRITICAL / WARNING / INFO)
 ├── [ VoiceDispatchCopilot.jsx ] ── Floating Web Speech AI assistant (bottom-right: 24px)
 └── [ HackathonPitchDeck.jsx ] ── 11-slide jury pitch deck overlay (Hotkey: [P])
```

### Semantic Design Tokens (`src/index.css`)
* **Surfaces**: `var(--bg-card)`, `var(--bg-glass)`, `var(--bg-stat-box)`, `var(--bg-elevated)`
* **Text**: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--text-accent)`
* **Borders**: `var(--border-subtle)`, `var(--border-medium)`, `var(--border-active)`
* **Status Glows**: `var(--status-normal)`, `var(--status-warning)`, `var(--status-critical)`, `var(--accent-cyan)`

