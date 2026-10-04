# GridPulse: Project Context

## Overview
**Project Name**: GridPulse: Intelligent Grid Management & Automation Dashboard  
**Hackathon**: Schneider Electric "Yuva Yodha" Energy Tech Hackathon 2026–2027  
**Track**: **Grid Reliability & Renewable Intermittency** (*"Making Clean Power Dependable, Neighbourhood by Neighbourhood"*)  
**Prize Target**: ₹45 Lakhs Pool (₹20 Lakhs Grand Prize + SE Ventures Exposure)  
**Target Domain**: India's Electrical Distribution Network & Smart Grid Infrastructure (CEA / CERC / RDSS)  

---

## Executive Summaries

### Full Description (390 Words)
India's power distribution network is under growing strain. Rising renewable penetration brings unpredictable solar and wind output, manual monitoring delays fault detection and restoration, uneven feeder loading causes overloads and voltage instability, and operators often lack the real-time visibility needed to act before small issues cascade into larger outages. As decentralized generation, EV charging, and demand volatility increase, traditional SCADA-lite systems are no longer enough.

GridPulse is a unified, web-based dashboard that gives grid operators real-time visibility and automated, self-healing control over the distribution network — shifting grid operations from reactive firefighting to proactive management.

The system is built around three pillars:
1. **Monitor**: Live electrical parameters (voltage, current, frequency, load) are streamed from smart meters and IoT sensors on feeders and substations, visualized on a geo-tagged network map with color-coded health status, alongside a real-time view of renewable generation against consumer demand, IEEE 738 dynamic line rating, and Schneider Electric PowerLogic™ ION9000 power quality telemetry.
2. **Control**: Operators get remote, role-based switching of breakers and reclosers, manual override during exceptions, and configurable voltage/frequency/load thresholds that trigger alerts with IEC 61850-7-4 audit trails.
3. **Automate**: The core differentiator — self-healing fault isolation (FLISR) that detects a fault and automatically reroutes power to healthy feeders (cutting restoration from hours to seconds); demand response automation that sheds or shifts non-critical load during peak stress; predictive maintenance using ML models trained on sensor patterns to flag failing transformers (Duval Triangle 1) and lines before they fail; and renewable-balancing logic that adjusts storage dispatch when solar or wind output drops unexpectedly.

Architecturally, GridPulse follows a four-layer flow: a field layer of smart meters, sensors, and RTUs; a communication layer using IEC 61850 GOOSE, MQTT, and WebSockets; a processing layer where cloud/edge analytics run forecasting and anomaly-detection models; and an application layer — the operator-facing dashboard built in React with WebSocket-driven live charts, backed by an ACID SQLite time-series database.

This project directly targets Yuva Yodha's Grid Reliability & Renewable Intermittency track. By combining real-time monitoring, granular remote control, and automation that reacts faster than any human operator, GridPulse aims to reduce outage duration, cut technical and commercial losses, improve safety by minimizing manual intervention on live equipment, and help utilities absorb India's expanding renewable capacity without compromising reliability — supporting a more resilient, self-healing grid for the country's energy transition.

---

### Compact Description (150 Words)
India's power grid is under strain — rising solar/wind output causes unpredictable supply swings, manual monitoring delays fault response, and uneven feeder loads lead to overloads and voltage issues. Operators are often reacting to problems instead of preventing them.

GridPulse is a unified dashboard that gives grid operators real-time visibility and automated control over the distribution network. It has three parts:
- **Monitor**: Live voltage, current, load, and renewable generation data on a color-coded network map, with IEEE 738 dynamic line rating.
- **Control**: Remote, role-based switching of breakers with custom alert thresholds and safety interlocks.
- **Automate**: Sub-10s self-healing fault isolation (FLISR), automatic demand-response load shedding, ML-based predictive maintenance, and renewable-output balancing.

Built on IoT sensors, cloud/edge analytics, and a modern web dashboard, GridPulse directly targets Yuva Yodha's Grid Reliability & Renewable Intermittency track — cutting outage time by 78%, reducing losses, and helping the grid absorb more renewable energy reliably.

---

## Core Problem Statements Addressed
1. **Renewable Intermittency**: Solar and wind supply fluctuations create sudden voltage and frequency drops/spikes.
2. **Delayed Fault Response**: Manual telephone/dispatch reporting takes hours to isolate faults and restore power.
3. **Uneven Feeder Loading**: Unbalanced loads trigger transformer burnouts and blackouts.
4. **Safety Risks**: Field operators manually handling high-voltage switchgear during faults.
5. **Lack of Predictive Insights**: Equipment is serviced reactively post-failure rather than proactively.

---

## The Three Pillars of GridPulse

```
                    +------------------------------------+
                    |             GridPulse              |
                    +------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
   +-----------+            +-------------------+            +-----------+
   |  MONITOR  |            |      CONTROL      |            |  AUTOMATE |
   +-----------+            +-------------------+            +-----------+
   * Live Parameters        * Remote Breaker Trip/Close      * Self-Healing Fault Isolation
     (V, I, Hz, P, Q)       * Recloser Switching             * Demand Response Shedding
   * Geo-tagged Network     * Role-based Permissions        * Predictive Health Scoring
   * Renewable vs Demand    * Configurable Thresholds        * Battery Storage Balancing
   * Feeder Health Map      * Manual Override Interventions  * Auto-Rerouting Logic
```

---

## Target Audience & Personas
- **Substation Operators**: Live monitoring, acknowledging alerts, remote breaker operations.
- **Distribution Engineers**: Load flow analysis, phase balance optimization, predictive maintenance scheduling.
- **Discom Management / Utility Executives**: Grid reliability metrics (SAIDI, SAIFI), renewable absorption rates, loss reduction reports.
- **Field Maintenance Teams**: Pinpointed fault locations and safe isolation status before dispatch.

---

## Key Presentation & Pitch Outline (11 Slides)
1. **Title**: GridPulse — Intelligent Grid Management & Automation Dashboard
2. **Problem**: Realities of Indian DISCOMs (intermittency, manual delays, feeder strain)
3. **Solution**: Proactive, self-healing grid operations platform
4. **Pillar 1 - Monitoring**: Geo-tagged GIS topology, real-time telemetry, color-coded health
5. **Pillar 2 - Control**: Tele-control of breakers/reclosers, safety interlocks, threshold alerts
6. **Pillar 3 - Automation**: Self-healing loops (FLISR), auto-load shed, battery dispatch
7. **Predictive Maintenance**: Sensor-driven ML models for transformer & line health
8. **System Architecture**: 4-Layer edge-to-cloud architecture
9. **Tech Stack & Implementation**: React/Vite, WebSockets, Python/FastAPI, Time-Series Engine
10. **Impact & Hackathon Alignment**: SAIDI/SAIFI reduction, renewable penetration resilience
11. **Roadmap & Conclusion**: Deployment roadmap, pilot scale, DISCOM modernization
