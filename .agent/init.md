# GridPulse: Project Initialization Guide

This document guides developers on setting up, configuring, and initializing the **GridPulse** Intelligent Grid Management & Automation Dashboard development environment.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (recommended: v20 LTS)
- **Package Manager**: `npm` (v9+) or `pnpm` / `yarn`
- **Python**: 3.10+ (if running the Python ML / simulation analytics service)
- **Modern Browser**: Chrome, Edge, Firefox, or Safari with WebGL / Canvas / WebSocket support

---

## 2. Recommended Directory Structure

```
Yuva_yodha_hackthon/
├── .agent/                    # Agent orchestration, plans, and documentation
│   ├── context.md             # Project vision, track, and problem statements
│   ├── plan.md                # Phased master implementation plan
│   ├── init.md                # Setup, commands, and environment guide
│   ├── ToDo.md                # Granular task checklist & status tracker
│   └── architecture.md        # Technical dataflow, schemas, and FLISR logic
├── frontend/                  # Operator Web Dashboard (React + Vite)
│   ├── public/                # Static assets, geojson topologies, icons
│   ├── src/
│   │   ├── assets/            # SVGs, grid diagrams, branding logos
│   │   ├── components/        # UI components (Map, Gauges, Breakers, Alerts)
│   │   │   ├── Map/           # Geo-topology & substation network canvas
│   │   │   ├── Telemetry/     # Electrical gauges (V, I, Hz, MW, MVAR)
│   │   │   ├── Controls/      # Breakers, reclosers, interlock controls
│   │   │   ├── Automate/      # FLISR self-healing simulator & BESS controls
│   │   │   ├── Analytics/     # Predictive maintenance & ML charts
│   │   │   └── Common/        # Buttons, modals, cards, badges
│   │   ├── context/           # Grid state management (live feeds, thresholds)
│   │   ├── hooks/             # WebSocket hooks, simulation interval hooks
│   │   ├── styles/            # Vanilla CSS design system & theme tokens
│   │   ├── types/             # TypeScript / Prop definitions
│   │   ├── utils/             # FLISR simulation logic & telemetry formulas
│   │   ├── App.jsx            # Main dashboard container & view switcher
│   │   └── main.jsx           # Root entry
│   ├── index.html             # HTML entry with font imports & meta tags
│   ├── package.json           # Dependencies & build scripts
│   └── vite.config.js         # Vite configuration
├── backend/                   # Telemetry & Automation Server (Optional/Simulator)
│   ├── server.js or app.py    # WebSocket broker & telemetry generator
│   └── mock_data/             # Feeder topologies, load curves, transformer specs
└── README.md                  # Hackathon pitch, quickstart & impact metrics
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Chosen Technology | Rationale |
|---|---|---|
| **Frontend Framework** | **React (with Vite)** | Lightning-fast HMR, component modularity, instant dashboard state updates. |
| **Styling** | **Vanilla CSS Design System** | Maximum control over high-tech grid dark mode, neon status glows, custom glassmorphism, zero build overhead. |
| **Visualizations** | **SVG / Canvas / Chart.js / Leaflet** | High-performance 60fps rendering of feeder topologies, power curves, and sparklines. |
| **Real-time Comms** | **WebSockets / SSE (or in-browser engine)** | Sub-second latency for breaker state transitions, frequency variations, and alert dispatch. |
| **State Management** | **React Context + Reducers** | Coordinated grid state across the map, control switches, and event log without bloated external libraries. |

---

## 4. Quickstart Setup Guide

### Setting up the Frontend
```bash
# Navigate to the workspace root
cd d:/codes/Yuva_yodha_hackthon

# Create Vite React app (if starting fresh)
npx -y create-vite@latest frontend --template react

# Move into frontend directory
cd frontend

# Install necessary icons / utilities (e.g. lucide-react for industrial telemetry icons)
npm install lucide-react

# Launch dev server
npm run dev
```

### Development Ports
- **Frontend Dashboard**: `http://localhost:5173`
- **Telemetry Streamer / API (if dedicated)**: `http://localhost:8000` or in-memory WebSocket generator.

---

## 5. Environment & Simulation Variables

Create a `.env` in `frontend/` if needed:
```env
VITE_APP_TITLE="GridPulse - Intelligent Grid Management & Automation"
VITE_ENABLE_SIMULATION_MODE=true
VITE_SIMULATION_TICK_RATE_MS=1000
VITE_GRID_NOMINAL_FREQ=50.0
VITE_GRID_NOMINAL_VOLTAGE_KV=11.0
```

---

## 6. Verification Checklist
- [ ] Dev server spins up on port 5173 without warnings.
- [ ] Modern dark-themed industrial aesthetic loads properly.
- [ ] Telemetry stream updates indicators at ~1s intervals.
- [ ] Interactive breaker controls respond to click actions with safety confirmations.
- [ ] Self-healing FLISR demo runs smoothly end-to-end.
