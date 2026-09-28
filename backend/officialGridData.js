// Official National Power Grid of India: Baseline Data & Topology
// Sourced from Grid Controller of India (Grid-India / formerly POSOCO),
// Central Electricity Authority (CEA), and National Load Despatch Centre (NLDC).
// Standard IEGC (Indian Electricity Grid Code) operating frequency: 50.00 Hz (Band: 49.90 - 50.05 Hz)

export const OFFICIAL_NLDC_BASELINE = {
  nationalDemandMetMw: 238450,
  nationalDemandPeakMw: 250200,
  frequencyHz: 50.01,
  frequencyBand: { min: 49.90, max: 50.05, nominal: 50.00 },
  fuelMixMw: {
    thermalCoal: 134200,
    thermalGas: 5800,
    hydro: 28400,
    solar: 36200,
    wind: 16100,
    nuclear: 4850,
    biomassAndSmallHydro: 3900
  },
  renewableSharePct: 23.6,
  totalInterRegionalCapacityMw: 112250,
  interRegionalEnergyTransferredMw: 24600,
  carbonIntensityGPerKwh: 618
};

// 5 Regional Load Despatch Centres (RLDCs) under NLDC
export const REGIONAL_DESPATCH_CENTRES = [
  {
    id: "RLDC-NR",
    code: "NRLDC",
    name: "Northern Regional Load Despatch Centre",
    hq: "New Delhi",
    states: ["Delhi", "Punjab", "Haryana", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Himachal Pradesh", "J&K", "Ladakh"],
    demandMetMw: 74800,
    generationMw: 69200,
    netImportMw: 5600,
    frequencyHz: 50.01,
    status: "NORMAL",
    isIslanded: false
  },
  {
    id: "RLDC-WR",
    code: "WRLDC",
    name: "Western Regional Load Despatch Centre",
    hq: "Mumbai",
    states: ["Maharashtra", "Gujarat", "Madhya Pradesh", "Chhattisgarh", "Goa"],
    demandMetMw: 71500,
    generationMw: 78600,
    netImportMw: -7100, // Net Exporter
    frequencyHz: 50.02,
    status: "NORMAL",
    isIslanded: false
  },
  {
    id: "RLDC-SR",
    code: "SRLDC",
    name: "Southern Regional Load Despatch Centre",
    hq: "Bengaluru",
    states: ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Puducherry"],
    demandMetMw: 61800,
    generationMw: 59700,
    netImportMw: 2100,
    frequencyHz: 50.00,
    status: "NORMAL",
    isIslanded: false
  },
  {
    id: "RLDC-ER",
    code: "ERLDC",
    name: "Eastern Regional Load Despatch Centre",
    hq: "Kolkata",
    states: ["West Bengal", "Bihar", "Odisha", "Jharkhand", "Sikkim"],
    demandMetMw: 26850,
    generationMw: 27450,
    netImportMw: -600, // Net Exporter
    frequencyHz: 50.01,
    status: "NORMAL",
    isIslanded: false
  },
  {
    id: "RLDC-NER",
    code: "NERLDC",
    name: "North-Eastern Regional Load Despatch Centre",
    hq: "Shillong",
    states: ["Assam", "Meghalaya", "Tripura", "Manipur", "Nagaland", "Mizoram", "Arunachal Pradesh"],
    demandMetMw: 3500,
    generationMw: 3500,
    netImportMw: 0,
    frequencyHz: 50.01,
    status: "NORMAL",
    isIslanded: false
  }
];

// Major Indian Generation Stations across RE, Hydro Peaking, Thermal, and Nuclear
export const OFFICIAL_GENERATION_SOURCES = [
  {
    id: "SRC-BHADLA",
    name: "Bhadla Solar Park",
    state: "Rajasthan (Phalodi / Jodhpur)",
    region: "NR",
    type: "SOLAR_RE",
    capacityMw: 2245,
    currentGenMw: 1840,
    maxDispatchMw: 2245,
    minDispatchMw: 0,
    voltageKv: 765,
    coordinates: [27.53, 71.91],
    description: "One of the world's largest solar parks (14,000+ acres). Anchors the Northern Green Energy Corridor with 765kV EHV lines.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-DELHI"
  },
  {
    id: "SRC-KHAVDA",
    name: "Khavda Renewable Energy Park",
    state: "Gujarat (Rann of Kutch)",
    region: "WR",
    type: "HYBRID_RE",
    capacityMw: 3000,
    currentGenMw: 2420,
    maxDispatchMw: 3000,
    minDispatchMw: 0,
    voltageKv: 765,
    coordinates: [23.85, 69.73],
    description: "Mega hybrid wind-solar installation feeding Western Grid and inter-regional HVDC corridors to Mumbai.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-MUMBAI"
  },
  {
    id: "SRC-PAVAGADA",
    name: "Pavagada Solar Park (Shakti Sthala)",
    state: "Karnataka (Tumakuru)",
    region: "SR",
    type: "SOLAR_RE",
    capacityMw: 2050,
    currentGenMw: 1710,
    maxDispatchMw: 2050,
    minDispatchMw: 0,
    voltageKv: 400,
    coordinates: [14.10, 77.27],
    description: "Southern Regional Grid anchor solar park powering Bengaluru Tech Hub and industrial centers.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-BLR"
  },
  {
    id: "SRC-MUPPANDAL",
    name: "Muppandal Wind Energy Complex",
    state: "Tamil Nadu (Kanyakumari)",
    region: "SR",
    type: "WIND_RE",
    capacityMw: 1500,
    currentGenMw: 1120,
    maxDispatchMw: 1500,
    minDispatchMw: 100,
    voltageKv: 400,
    coordinates: [8.26, 77.54],
    description: "Historic high-capacity wind farm utilizing seasonal Palghat gap wind corridors.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-CHENNAI"
  },
  {
    id: "SRC-TEHRI",
    name: "Tehri Hydro & Pumped Storage (THDC)",
    state: "Uttarakhand (Garhwal)",
    region: "NR",
    type: "HYDRO_PSP",
    capacityMw: 2400,
    currentGenMw: 1450,
    maxDispatchMw: 2400,
    minDispatchMw: 400,
    voltageKv: 400,
    coordinates: [30.37, 78.48],
    description: "Peaking and black-start hydro asset providing fast-acting AGC secondary frequency control.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-DELHI"
  },
  {
    id: "SRC-SINGRAULI",
    name: "Singrauli Super Thermal (NTPC)",
    state: "Uttar Pradesh / MP Border",
    region: "NR",
    type: "THERMAL_BASE",
    capacityMw: 2000,
    currentGenMw: 1880,
    maxDispatchMw: 2000,
    minDispatchMw: 1100,
    voltageKv: 500,
    coordinates: [24.10, 82.67],
    description: "Pioneering baseload thermal plant connected via India's first ±500 kV HVDC Rihand-Dadri link.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-DELHI"
  },
  {
    id: "SRC-KUDANKULAM",
    name: "Kudankulam Nuclear Power Plant (NPCIL)",
    state: "Tamil Nadu (Tirunelveli)",
    region: "SR",
    type: "NUCLEAR_BASE",
    capacityMw: 2000,
    currentGenMw: 1980,
    maxDispatchMw: 2000,
    minDispatchMw: 1800,
    voltageKv: 400,
    coordinates: [8.17, 77.71],
    description: "VVER-1000 pressurized water reactors supplying ultra-stable zero-carbon baseload power to Southern Grid.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-CHENNAI"
  },
  {
    id: "SRC-KOYNA",
    name: "Koyna Hydroelectric Complex",
    state: "Maharashtra (Satara)",
    region: "WR",
    type: "HYDRO_PSP",
    capacityMw: 1960,
    currentGenMw: 1250,
    maxDispatchMw: 1960,
    minDispatchMw: 200,
    voltageKv: 400,
    coordinates: [17.40, 73.75],
    description: "Largest completed hydroelectric plant in India, providing peaking power to Mumbai & Pune grid.",
    status: "ONLINE",
    curtailed: false,
    corridorTarget: "SNK-MUMBAI"
  }
];

// Major Indian Demand Sinks (Metros, Tech Hubs & Heavy Industrial Belts)
export const OFFICIAL_DEMAND_SINKS = [
  {
    id: "SNK-DELHI",
    name: "Delhi-NCR Megacity & Industrial Hub",
    state: "National Capital Region (Delhi/Noida/Gurugram)",
    region: "NR",
    type: "URBAN_METRO_SINK",
    peakDemandMw: 8656,
    currentDemandMw: 7420,
    baseDemandMw: 7420,
    loadShedPct: 0,
    coordinates: [28.61, 77.23],
    connectedSubstation: "Mayur Vihar 66/11kV Substation",
    description: "Highest demand density in Northern Grid. Host to GridPulse local distribution pilot.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-MUMBAI",
    name: "Mumbai Metropolitan Region (MMR)",
    state: "Maharashtra (Mumbai/Thane/Navi Mumbai)",
    region: "WR",
    type: "COMMERCIAL_FINANCIAL_SINK",
    peakDemandMw: 4300,
    currentDemandMw: 3850,
    baseDemandMw: 3850,
    loadShedPct: 0,
    coordinates: [19.07, 72.87],
    connectedSubstation: "Kalwa 400/220kV Receiving Station",
    description: "Financial capital hub supplied by Western Grid coastal transmission corridors & Tata/Adani islanding scheme.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-BLR",
    name: "Bengaluru Tech & Electronics Belt",
    state: "Karnataka (Bengaluru Urban)",
    region: "SR",
    type: "TECH_MANUFACTURING_SINK",
    peakDemandMw: 3450,
    currentDemandMw: 3120,
    baseDemandMw: 3120,
    loadShedPct: 0,
    coordinates: [12.97, 77.59],
    connectedSubstation: "Hoodi 400/220kV Substation",
    description: "Major electronics, EV manufacturing, and IT tech park load center.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-AHMEDABAD",
    name: "Ahmedabad - Sanand Auto & Petrochem",
    state: "Gujarat",
    region: "WR",
    type: "INDUSTRIAL_SINK",
    peakDemandMw: 2800,
    currentDemandMw: 2480,
    baseDemandMw: 2480,
    loadShedPct: 0,
    coordinates: [23.02, 72.57],
    connectedSubstation: "Pirana 400kV Substation",
    description: "Automobile manufacturing plants, pharmaceutical zones, and petrochemical processing facilities.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-CHENNAI",
    name: "Chennai Automotive & Port Corridor",
    state: "Tamil Nadu",
    region: "SR",
    type: "INDUSTRIAL_SINK",
    peakDemandMw: 3900,
    currentDemandMw: 3510,
    baseDemandMw: 3510,
    loadShedPct: 0,
    coordinates: [13.08, 80.27],
    connectedSubstation: "Sriperumbudur 400kV Substation",
    description: "Automotive assembly hub, container ports, and hyperscale data center clusters.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-KOLKATA",
    name: "Kolkata - Durgapur Industrial Belt",
    state: "West Bengal",
    region: "ER",
    type: "HEAVY_INDUSTRY_SINK",
    peakDemandMw: 2600,
    currentDemandMw: 2250,
    baseDemandMw: 2250,
    loadShedPct: 0,
    coordinates: [22.57, 88.36],
    connectedSubstation: "Subhashgram 400kV Substation",
    description: "Eastern Grid heavy engineering, steel rolling mills, and metro transit loads.",
    status: "NORMAL",
    drActive: false
  },
  {
    id: "SNK-HYDERABAD",
    name: "Hyderabad Genome Valley & IT Corridor",
    state: "Telangana",
    region: "SR",
    type: "TECH_PHARMA_SINK",
    peakDemandMw: 3600,
    currentDemandMw: 3200,
    baseDemandMw: 3200,
    loadShedPct: 0,
    coordinates: [17.38, 78.48],
    connectedSubstation: "Malkaram 400kV Substation",
    description: "Biotech hubs, global cloud clusters, and electronic chip design facilities.",
    status: "NORMAL",
    drActive: false
  }
];

// Strategic Inter-Regional & Interstate EHV / HVDC Corridors
export const OFFICIAL_TRANSMISSION_CORRIDORS = [
  {
    id: "CORR-01",
    name: "Bhadla -> Delhi 765 kV Green Energy Corridor",
    from: [27.53, 71.91],
    to: [28.61, 77.23],
    capacityMw: 4000,
    flowMw: 1840,
    voltageKv: 765,
    type: "GREEN_ENERGY_CORRIDOR",
    color: "#f59e0b",
    status: "ENERGIZED", // 'ENERGIZED' | 'TRIPPED' | 'REROUTED'
    rerouteTarget: "CORR-06"
  },
  {
    id: "CORR-02",
    name: "Khavda RE -> Mumbai Inter-Regional HVDC",
    from: [23.85, 69.73],
    to: [19.07, 72.87],
    capacityMw: 5000,
    flowMw: 2420,
    voltageKv: 765,
    type: "HVDC_INTERREGIONAL",
    color: "#06b6d4",
    status: "ENERGIZED",
    rerouteTarget: "CORR-07"
  },
  {
    id: "CORR-03",
    name: "Tehri Hydro -> Delhi Northern Peaking Line",
    from: [30.37, 78.48],
    to: [28.61, 77.23],
    capacityMw: 2500,
    flowMw: 1450,
    voltageKv: 400,
    type: "HYDRO_PEAKING",
    color: "#38bdf8",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-04",
    name: "Pavagada Solar -> Bengaluru 400 kV Line",
    from: [14.10, 77.27],
    to: [12.97, 77.59],
    capacityMw: 2500,
    flowMw: 1710,
    voltageKv: 400,
    type: "REGIONAL_TRANS",
    color: "#f59e0b",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-05",
    name: "Muppandal Wind -> Chennai 400 kV Corridor",
    from: [8.26, 77.54],
    to: [13.08, 80.27],
    capacityMw: 2000,
    flowMw: 1120,
    voltageKv: 400,
    type: "WIND_CORRIDOR",
    color: "#10b981",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-06",
    name: "Singrauli Thermal -> Delhi ±500 kV HVDC (Rihand-Dadri)",
    from: [24.10, 82.67],
    to: [28.61, 77.23],
    capacityMw: 3000,
    flowMw: 1880,
    voltageKv: 500,
    type: "HVDC_BASELOAD",
    color: "#8b5cf6",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-07",
    name: "Khavda -> Ahmedabad-Sanand 400 kV Line",
    from: [23.85, 69.73],
    to: [23.02, 72.57],
    capacityMw: 2500,
    flowMw: 1100,
    voltageKv: 400,
    type: "INDUSTRIAL_FEEDER",
    color: "#06b6d4",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-08",
    name: "Champa -> Kurukshetra ±800 kV UHVDC Link",
    from: [22.05, 82.65], // Champa, Chhattisgarh
    to: [29.96, 76.87], // Kurukshetra, Haryana
    capacityMw: 6000,
    flowMw: 3800,
    voltageKv: 800,
    type: "UHVDC_INTERREGIONAL",
    color: "#ec4899", // Pink
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-09",
    name: "Raigarh -> Pugalur ±800 kV UHVDC Bipole",
    from: [21.89, 83.39], // Raigarh, Chhattisgarh (WR)
    to: [11.05, 77.99], // Pugalur, Tamil Nadu (SR)
    capacityMw: 6000,
    flowMw: 4100,
    voltageKv: 800,
    type: "UHVDC_INTERREGIONAL",
    color: "#ec4899",
    status: "ENERGIZED",
    rerouteTarget: null
  },
  {
    id: "CORR-10",
    name: "Kudankulam -> Bengaluru-Hyderabad 400 kV Grid",
    from: [8.17, 77.71],
    to: [12.97, 77.59],
    capacityMw: 2200,
    flowMw: 1650,
    voltageKv: 400,
    type: "NUCLEAR_FEEDER",
    color: "#a855f7",
    status: "ENERGIZED",
    rerouteTarget: null
  }
];
