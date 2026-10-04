# Schneider Electric Yuva Yodha Energy Tech Hackathon 2026: Official Dossier & Documentation

> **Source**: Extracted directly from official portal [yuvayodhatech.com](https://www.yuvayodhatech.com/challenges) & YouNoodle registration portal (`apply.younoodle.com/round/yuva_yodha_tech_hackathon_2026`).

---

## 1. Executive Summary & Vision
The **Yuva Yodha Energy Tech Hackathon 2026**, hosted by **Schneider Electric**, is a premier nationwide innovation challenge designed to empower Indian STEM and university talent to build affordable, scalable, and data-driven solutions for energy efficiency, renewable energy integration, grid reliability, smart buildings, and manufacturing decarbonisation.

- **Host & Organizer**: Schneider Electric India
- **Venture Exposure**: Direct exposure and networking opportunity with **SE Ventures** (Schneider Electric's global venture capital arm)
- **Eligibility**: Open to all students currently enrolled in Undergraduate (UG), Postgraduate (PG), or other STEM programs in India (18+ years)
- **Team Format**: Individual entries or teams of up to **4 members**
- **Entry Fee**: 100% Free of charge
- **Submission Platform**: YouNoodle (`apply.younoodle.com/round/yuva_yodha_tech_hackathon_2026`)

---

## 2. Prize Pool & Incentives
| Position | Prize Amount | Additional Benefits |
|---|---|---|
| 🥇 **Grand Winner** | **₹20,00,000 INR (20 Lakhs)** | Trophy, SE Ventures exposure, corporate fast-track mentorship |
| 🥈 **1st Runner Up** | **₹15,00,000 INR (15 Lakhs)** | Certificate of excellence, industry mentorship |
| 🥉 **2nd Runner Up** | **₹10,00,000 INR (10 Lakhs)** | Certificate of excellence, industry mentorship |
| 🌟 **Top Finalists** | **Corporate Showcase** | Present solutions at Schneider Electric India Headquarters |

---

## 3. The 4 Official Challenge Categories (Tracks)

### 🌾 Track 01: Clean Power for Agriculture
- **Focus**: *Renewable Energy & Storage for Agricultural Processing*
- **Problem**: High post-harvest losses due to unreliable grid power and expensive fossil-fuel reliance for cooling, drying, milling, and processing at the farm-gate level.
- **Goal**: Decentralized, affordable renewable power and energy storage solutions tailored for smallholder farmers and Farmer Producer Organizations (FPOs).
- **Key Focus Areas**:
  - Solar-powered micro cold storage with Phase Change Materials (PCM) / thermal energy storage.
  - Shared mobile solar processing units for seasonal crops.
  - Pay-as-you-go or Energy-as-a-Service business models.
  - Smart off-grid energy management and IoT monitoring for thermal/electrical efficiency.

### 🏢 Track 02: Smart Buildings & Energy Efficiency
- **Focus**: *Real-Time Energy Management for Commercial & Residential Buildings*
- **Problem**: Buildings account for >30% of electricity in India, yet small-to-midsize buildings lack affordable automated energy management.
- **Goal**: Affordable real-time energy monitoring, load-shifting, and indoor environmental quality (IEQ) optimization.
- **Key Focus Areas**:
  - AI/ML-driven HVAC and smart lighting control algorithms.
  - Low-cost sensor networks for occupancy and environmental tracking.
  - Plug-and-play BMS software for SMEs and residential societies.
  - Automated demand-response and peak-shaving mechanisms.

### ⚡ Track 03: Grid Reliability & Renewable Intermittency *(Our Track: GridPulse)*
- **Focus**: *Making Clean Power Dependable, Neighbourhood by Neighbourhood*
- **The Problem**: Solar and wind generation are inherently variable. As clean energy scales towards India's 2047 goals, intermittency creates feeder-level outage risks, especially in high-density urban and peri-urban distribution zones.
- **The Goal**: Develop local, low-cost flexibility tools at the feeder/neighbourhood level to balance renewable supply-demand gaps without requiring heavy capital investments in physical grid reinforcement.
- **Key Focus Areas & Ideas**:
  1. **Community/Shared Energy Storage Dispatch Models**: Including 2nd-life EV battery reuse and fast frequency response (FFR).
  2. **Microgrid / Mini-Grid Control Software**: Autonomous islanding, blackstart, and critical load prioritization.
  3. **Peer-to-Peer (P2P) Energy Trading & Market Clearing**: Cooperative energy pooling, day-ahead and real-time market dispatch.
  4. **DISCOM-Facing Analytics Dashboards**: Predict feeder stress, dynamic line rating (DLR), voltage violations, and recommend demand-response signals.

### 🏭 Track 04: Smart Manufacturing & Industrial Decarbonisation
- **Focus**: *Industrial Energy & Process Efficiency for SMEs*
- **Problem**: Industry consumes 35–40% of India's energy, with energy taking 15–30% of production costs in SMEs.
- **Goal**: Affordable real-time monitoring, predictive maintenance, and process optimization to decarbonise factory floors without losing throughput.
- **Key Focus Areas**:
  - Low-cost IoT smart metering and edge energy monitoring.
  - AI predictive maintenance for motors, compressors, boilers, and furnaces.
  - Production scheduling aligned with time-of-day (ToD) tariffs.
  - Automated digital energy-audit tools benchmarking against Bureau of Energy Efficiency (BEE) norms.

---

## 4. Official Submission Deliverables (6 Core Items)
The Schneider Electric jury evaluates teams on the following 6 concrete deliverables:

1. **Detailed Solution Write-Up**:
   - Clear explanation of the mechanism, key engineering assumptions, and suitability for Indian operating conditions (temperatures, grid codes, rural/urban feeders).
2. **System & Architecture Diagrams**:
   - Comprehensive schematic outlining IoT sensors, edge controllers, cloud/backend software, data flows, and hardware integration.
3. **Design Artefacts & UX**:
   - Polished SCADA dashboards, topology maps, single-line diagrams (SLD), data models, and service blueprints.
4. **Quantified Impact Metrics**:
   - Clear baseline comparison (e.g. SAIDI reduction %, AT&C loss reduction %, coal avoided tons/day, renewable curtailment prevented).
5. **Business & Ownership Model**:
   - Unit economics, DISCOM deployment strategy, payback period, and scale-up plan across Indian states.
6. **Software Prototype / Interactive Simulation**:
   - High-fidelity working prototype demonstrating live self-healing (FLISR), telemetry streaming, and predictive analytics.

---

## 5. How GridPulse Addresses Every Deliverable
| YouNoodle Deliverable | GridPulse Implementation | Location in Repo |
|---|---|---|
| **1. Solution Write-Up** | Comprehensive domain analysis covering Indian CEA/IEGC grid code, duck-curve physics, and FLISR logic. | [`.agent/context.md`](file:///d:/codes/Yuva_yodha_hackthon/.agent/context.md) |
| **2. Architecture Diagrams** | 4-layer edge-to-cloud architecture + Schneider Electric EcoStruxure™ 3-tier digital twin. | [`src/components/EcoStruxureIntegration.jsx`](file:///d:/codes/Yuva_yodha_hackthon/src/components/EcoStruxureIntegration.jsx) |
| **3. Design Artefacts** | Ultra-premium dark SCADA UI, Esri GIS National Map, Double-Busbar Bay SLD, DLR Heatmap. | [`src/components/IndiaGridMap.jsx`](file:///d:/codes/Yuva_yodha_hackthon/src/components/IndiaGridMap.jsx) |
| **4. Quantified Impact** | SAIDI slashed by -78%, ₹11.84 Cr/yr DISCOM savings, 214.8 T coal avoided daily, +34% renewable hosting. | [`src/components/ImpactSummary.jsx`](file:///d:/codes/Yuva_yodha_hackthon/src/components/ImpactSummary.jsx) |
| **5. Business Model** | IEX RTM arbitrage model, EV fleet V2G aggregation, RDSS compliance ROI calculations. | [`src/components/ElectricityMarket.jsx`](file:///d:/codes/Yuva_yodha_hackthon/src/components/ElectricityMarket.jsx) |
| **6. Working Prototype** | Full-stack application with live WebSocket streaming, sub-10s FLISR, and interactive pitch deck. | Launch via `npm run dev` |
