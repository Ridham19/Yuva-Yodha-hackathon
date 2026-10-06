# GridPulse: Persistent Project Memory & Knowledge Base

**Document Purpose**: Comprehensive persistent operational memory capturing architectural decisions, component mappings, resolved gotchas, UX design system tokens, and presentation protocols for **GridPulse**.

---

## 1. Project Identity & Hackathon Metadata

* **Project Title**: **GridPulse: Intelligent Grid Management & Automation Dashboard**
* **Hackathon**: Schneider Electric "Yuva Yodha" Energy Tech Hackathon 2026–2027
* **Competition Track**: **Grid Reliability & Renewable Intermittency** (*"Making Clean Power Dependable, Neighbourhood by Neighbourhood"*)
* **Prize Target**: ₹45 Lakhs Total Pool (₹20 Lakhs Grand Prize + SE Ventures Mentorship)
* **Domain Alignment**: Central Electricity Authority (CEA), POSOCO / NLDC, Indian Energy Exchange (IEX), IEC 61850 / IEC 62351 standards.

---

## 2. System Architecture & Port Allocations

GridPulse is engineered as a full-stack, enterprise-grade distributed SCADA suite:

```
[ Field Layer / IoT Sensors ]
     │ (IEC 61850 GOOSE, MQTT, Telemetry Ticks)
     ▼
[ Node.js + Express + WebSocket Server ]  ── Port 5000 (`backend/server.js`)
     │ (WAL-mode SQLite Database) ────────── `backend/data/gridpulse.db`
     │ (Proxy & Embedded Fallback)
     ▼
[ Python FastAPI ML Microservice ]        ── Port 8000 (`backend/ml_service.py`)
     │ (Scikit-Learn, PyTorch, NumPy)
     ▼
[ React + Vite Operator SCADA UI ]       ── Port 5173 (`src/App.jsx`)
```

### Active Port Registry
* **Frontend Web Dashboard**: `http://localhost:5173` (Vite 5 HMR)
* **Backend SCADA Engine**: `http://localhost:5000` (Node.js 25, WebSocket `/ws`, REST `/api/*`)
* **ML Analytics Engine**: `http://localhost:8000` (FastAPI / Uvicorn, with sub-6ms native Node embedded fallback)
* **SQLite Database**: `backend/data/gridpulse.db` (ACID-compliant, WAL journal mode)

---

## 3. The 23 Pillars of GridPulse

1. **Live Monitoring & Topology Map** (`TopologyMap.jsx`): Interactive SVG single-line diagram with real-time active power flow vectors and feeder status.
2. **Remote Control Panel & Breaker Switching** (`ControlCenter.jsx`): Role-based breaker actuation (`DISCOM-ENG-402`, `SCADA-OPS-109`), safety clearance permit modals, and IEC 61850-7-4 audit trail.
3. **Automation & Self-Healing Core (FLISR)** (`SelfHealingAutomation.jsx`): 3-stage autonomous loop isolating cable flashover and restoring downstream customers via tie-switch in **6.82 seconds**.
4. **Predictive Maintenance & Transformer Health** (`PredictiveMaintenance.jsx`): Multi-sensor IoT dashboard with online DGA, vibration RMS, and Arrhenius thermal aging degradation.
5. **Renewable Intermittency & BESS Storage** (`FeederMonitoring.jsx`): Solar cloud dip detector triggering Fast Frequency Response (+8.5 MW in < 200ms).
6. **National Map of India with Real Sources & Sinks** (`IndiaGridMap.jsx`): 100% keyless Esri Dark Gray Canvas with 15 major generation stations (29,825 MW) and 19 demand sinks (36,586 MW).
7. **Node.js Express & WebSocket Backend** (`backend/server.js`): Dual-channel streaming engine simulating statutory IEGC frequency band (49.90 – 50.05 Hz).
8. **Hackathon Preset Pitch Scenarios**: Quick-launch buttons for Sub-10s FLISR, Solar Dip & BESS, and Peak ADR Shedding.
9. **Machine Learning AI Suite** (`MachineLearningStudio.jsx`): 24h duck-curve forecaster, 4.8 kHz PMU transient fault classifier (99.2% accuracy), smart meter theft detector, and Duval Triangle 1.
10. **Cyber-Physical Grid Security Center** (`CyberSecurityCenter.jsx`): IEC 62351 Zero-Trust perimeter, False Data Injection Attack (FDIA) detector, and Chi-Square residual state estimation.
11. **Real-Time Electricity Market & Merit Order Despatch** (`ElectricityMarket.jsx`): 15-minute IEX DAM/RTM clearing prices (₹/kWh) and BESS price arbitrage profit counter.
12. **EV Fleet V2G Aggregator & Virtual Power Plant** (`EVFleetV2G.jsx`): Virtual aggregator for 1,500+ Delhi DTC electric buses providing +4.5 MW peak shaving.
13. **Voice & Natural Language SCADA Dispatch Copilot** (`VoiceDispatchCopilot.jsx`): Web Speech API hands-free voice assistant with synthesized voice replies and safety checklist verification.
14. **Substation Digital Twin (Double-Busbar Bay SLD)** (`DoubleBusbarSLD.jsx`): Interactive 66kV/11kV double-busbar system with 4-step on-load feeder transfer sequence.
15. **ESG Carbon Accounting & Regulatory Exporter** (`CarbonAndReports.jsx`): Real-time g CO₂/kWh tracker, cumulative coal avoidance counter, and 1-click CEA / CERC compliance PDF/CSV reports.
16. **Production-Grade SQLite Database & SQL Explorer** (`DatabaseExplorer.jsx`): 8 relational tables (`telemetry_history`, `alarms_log`, `breaker_operations`, etc.) with interactive SQL query console.
17. **Production Environment & Secrets Hardening** (`.env`, `.env.example`): Masked credential verification endpoint (`GET /api/system/env-status`) and hardened `.gitignore`.
18. **Schneider Electric EcoStruxure™ Center** (`EcoStruxureIntegration.jsx`): 3-tier architecture mapping, sub-3ms IEC 61850-8-1 GOOSE bus monitor, PowerLogic ION9000 harmonics, and 1-click JSON BOM export.
19. **Grand Finale 11-Slide Interactive Jury Pitch Deck** (`HackathonPitchDeck.jsx`): Presentation deck launched from header or hotkey **`[P]`** with embedded live micro-widgets and speaker notes.
20. **IEEE 738 Dynamic Line Rating (DLR) Engine** (`FeederMonitoring.jsx`): Conductor thermal model unlocking +22% extra renewable hosting capacity based on ambient cooling.
21. **Multi-Hazard Disaster Resilience Sandbox** (`SelfHealingAutomation.jsx`): 5 selectable disaster drills including Cyclone 140km/h shear and Microgrid islanding.
22. **EcoStruxure JSON Manifest Verification Endpoint** (`backend/server.js`): Programmatic schema compliance endpoint at `GET /api/ecostruxure/manifest`.
23. **Human-Friendly UI & Visual Hierarchy Overhaul** (`Header.jsx`, `AlarmsDrawer.jsx`, `index.css`): Unified top command bar, slide-over notification drawer, theme-adaptive semantic design system, and viewport-responsive map canvas.

---

## 4. UI Design System & Human-Centered UX Standards

### Layout Principles
* **Single Command Bar**: Avoid multiple stacked navbar tiers. All primary modules live under 4 domain tabs (`National Grid`, `Substation SCADA`, `AI & Cyber`, `Markets & Ops`).
* **Secondary Navigation**: Only renders when an active category contains sub-modules, using clean segmented pills.
* **Dropdown Grouping**: Consolidate secondary and tertiary actions into categorized dropdowns:
  * `Drills ▾`: High-impact disaster and operational demonstrations.
  * `Tools ▾`: Audio mute, stream pause, CSV inspectors, baseline reset.
* **Non-Obtrusive Slide-Over**: Alarms and audit logs live in a slide-over drawer triggered via the header notification bell `(🔔)` with badge counts, freeing 55px of bottom screen real estate.
* **Zero Collisions**: Floating widgets (such as the AI Dispatch Copilot) maintain dedicated positioning with no overlapping bottom bars.
* **Viewport Adaptability**: Map and diagram containers use `calc(100vh - 125px)` with min/max clamps so both top controls and bottom action docks remain in view without vertical scrolling.

### Semantic Color & Theme Tokens (`src/index.css`)
Never hardcode hex values or dark `rgba()` backgrounds inside component cards or pills. Always use semantic CSS variables:
* Surface Cards: `var(--bg-card)`
* Elevated Glass: `var(--bg-glass)`
* Sub-Boxes / Stat Containers: `var(--bg-stat-box)`
* Primary Text: `var(--text-primary)` (Dark `#0f172a` in Light Mode, White `#ffffff` in Dark Mode)
* Secondary Text: `var(--text-secondary)`
* Borders: `var(--border-subtle)` / `var(--border-medium)`
* Electrical Accents:
  * Normal / Energized: `var(--status-normal)` (`#059669` light / `#10b981` dark)
  * Warning: `var(--status-warning)` (`#d97706` light / `#f59e0b` dark)
  * Critical / Fault: `var(--status-critical)` (`#dc2626` light / `#ef4444` dark)
  * Clean / Renewable: `var(--accent-cyan)` (`#0284c7` light / `#06b6d4` dark)

---

## 5. Key Technical Lessons & Resolved Gotchas

1. **Light Theme Contrast Trap**:
   * *Problem*: Early components hardcoded `background: rgba(15, 23, 42, 0.95)` or dark gradients. In Light Mode, text became unreadable and created dark blotches.
   * *Resolution*: Replaced all hardcoded card surfaces with `var(--bg-card)` and `var(--bg-stat-box)`. Added explicit `color: var(--text-primary)` to all heading elements.
2. **Bottom HUD Collision**:
   * *Problem*: `<MissionControlBar />` occupied 55px at `bottom: 0`, colliding directly with `VoiceDispatchCopilot.jsx` and `<AlarmsDrawer />`.
   * *Resolution*: Removed `<MissionControlBar />`, consolidated live telemetry into the top header capsule, and converted alarms into a slide-over drawer.
3. **Feeder Object Nullish Property Access**:
   * *Problem*: In `FeederMonitoring.jsx`, simulated WebSocket feeder payloads without `consumerCount` triggered `feeder.consumerCount.toLocaleString()`, crashing the React render tree.
   * *Resolution*: Refactored all property accessors using nullish coalescing (`(feeder.consumerCount ?? 0).toLocaleString()`).
4. **Hotkeys**:
   * Press **`[P]`** from anywhere in the application to instantly open the 11-slide Grand Finale Pitch Deck.
   * Press **`[T]`** to toggle between Dark Mode and Light Mode.
   * Press **`[M]`** to mute/unmute Web Audio API switchgear clacks.
   * Press **`[Space]`** to pause or resume real-time telemetry streaming.

---

## 6. Tomorrow's Jury Pitch Rehearsal Sequence

1. **Opening (Slide 1–2 / Press `[P]`)**:
   * State the national crisis: 500 GW clean energy targets vs grid instability and 2.5-hour manual outage restoration.
2. **Pillar 1: Real-Time Visibility**:
   * Switch to `National Grid`: Show live Esri map, 765kV corridors, 29 GW generation, and 36 GW demand.
3. **Pillar 2: Autonomous FLISR Self-Healing (The Climax)**:
   * Open `Substation SCADA` -> `Self-Healing FLISR` (or use `Drills ▾` -> `FLISR Fault & Healing`).
   * Trigger fault on Feeder 2: Point to the live stopwatch as the 3-stage relay/sectionalizer/tie-switch sequence restores power in **6.82 seconds**.
4. **Pillar 3: Schneider EcoStruxure™ Alignment**:
   * Switch to `Schneider EcoStruxure™`: Show live IEC 61850-8-1 GOOSE sub-3ms packet traffic and PowerLogic ION9000 50th-order harmonics.
   * Click **Export EcoStruxure Manifest** to demonstrate automated enterprise JSON compliance.
5. **Pillar 4: Neural AI & Cyber Defense**:
   * Switch to `AI & Cyber`: Showcase the 24h duck-curve forecaster with heatwave sensitivity and the 4.8 kHz PMU waveform classifier.
6. **Closing (Slide 11)**:
   * Display the ROI banner: -78% SAIDI, -6.6% AT&C losses (₹11.84 Crores annual DISCOM savings), and zero lineman safety hazards.
