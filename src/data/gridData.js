// GridPulse Initial Mock Topology & Device Specs for Indian DISCOM Distribution Substation

export const INITIAL_SUBSTATION = {
  id: "SS-DELHI-N04",
  name: "Mayur Vihar 66/11 kV Substation",
  region: "Eastern Discom Zone 4",
  nominalVoltageKv: 11.0,
  nominalFrequencyHz: 50.0,
  totalCapacityMva: 31.5,
  status: "ONLINE",
  transformerHealthIndex: 88.5
};

export const INITIAL_FEEDERS = [
  {
    id: "FDR-01",
    name: "Industrial Hub Feeder",
    zone: "Sector 62 Heavy Industrial",
    nominalVoltageKv: 11.0,
    voltageKv: 11.04,
    currentA: 348.2,
    activePowerMw: 6.64,
    reactivePowerMvar: 1.38,
    powerFactor: 0.98,
    loadPercentage: 68.5,
    breakerState: "CLOSED", // "CLOSED" | "TRIPPED" | "LOCKED"
    status: "HEALTHY",     // "HEALTHY" | "OVERLOAD" | "FAULTED" | "ISOLATED" | "RESTORED"
    consumerCount: 420,
    criticality: "HIGH",
    lengthKm: 4.8,
    hasTieSwitch: true,
    tieSwitchId: "TS-1-2",
    tieSwitchState: "OPEN" // Normally open tie-switch to FDR-02
  },
  {
    id: "FDR-02",
    name: "Urban Residential Feeder",
    zone: "Pocket 1-4 High-Density Apts",
    nominalVoltageKv: 11.0,
    voltageKv: 10.96,
    currentA: 284.6,
    activePowerMw: 5.41,
    reactivePowerMvar: 1.25,
    powerFactor: 0.97,
    loadPercentage: 58.2,
    breakerState: "CLOSED",
    status: "HEALTHY",
    consumerCount: 3850,
    criticality: "CRITICAL",
    lengthKm: 6.2,
    sections: [
      { id: "SEC-2A", name: "Section A (Substation to Block C)", status: "ENERGIZED", switchState: "CLOSED" },
      { id: "SEC-2B", name: "Section B (Block D to Sector Crossing)", status: "ENERGIZED", switchState: "CLOSED" },
      { id: "SEC-2C", name: "Section C (Downstream Residential)", status: "ENERGIZED", switchState: "CLOSED" }
    ],
    hasTieSwitch: true,
    tieSwitchId: "TS-1-2"
  },
  {
    id: "FDR-03",
    name: "Tech Park & Hospital Feeder",
    zone: "Cyber Valley & District Hospital",
    nominalVoltageKv: 11.0,
    voltageKv: 11.08,
    currentA: 392.4,
    activePowerMw: 7.52,
    reactivePowerMvar: 1.45,
    powerFactor: 0.98,
    loadPercentage: 78.4,
    breakerState: "CLOSED",
    status: "HEALTHY",
    consumerCount: 85,
    criticality: "VITAL",
    lengthKm: 3.5
  },
  {
    id: "FDR-04",
    name: "Agri & EV Charging Feeder",
    zone: "Peri-urban Farms & Metro EV Hub",
    nominalVoltageKv: 11.0,
    voltageKv: 10.88,
    currentA: 220.1,
    activePowerMw: 4.15,
    reactivePowerMvar: 1.10,
    powerFactor: 0.96,
    loadPercentage: 46.0,
    breakerState: "CLOSED",
    status: "HEALTHY",
    consumerCount: 1240,
    criticality: "SHEDDABLE", // Eligible for Automatic Demand Response
    isDemandResponseActive: false,
    lengthKm: 8.4
  }
];

export const INITIAL_RENEWABLES = {
  solarCapacityMw: 25.0,
  solarOutputMw: 18.6,
  windCapacityMw: 15.0,
  windOutputMw: 9.4,
  bessCapacityMwh: 20.0,
  bessMaxMw: 10.0,
  bessCurrentSoCPct: 82.0,
  bessOutputMw: 0.0, // positive = discharging, negative = charging
  bessStatus: "STANDBY", // "STANDBY" | "DISCHARGING" | "CHARGING"
  weatherCondition: "CLEAR", // "CLEAR" | "CLOUD_COVER" | "GUST_WIND"
  solarIrradianceWm2: 840
};

export const INITIAL_TRANSFORMERS = [
  {
    id: "TR-01",
    name: "66/11 kV 16 MVA Power Transformer #1",
    loadPct: 64.2,
    windingTempC: 62.4,
    oilTempC: 51.8,
    dgaH2Ppm: 32,      // Hydrogen (acceptable < 100)
    dgaCh4Ppm: 18,     // Methane (acceptable < 120)
    dgaC2h4Ppm: 12,    // Ethylene (acceptable < 50)
    vibrationMmS: 1.8,
    healthIndexPct: 91.2,
    predictedRulYears: 14.8,
    status: "NORMAL"
  },
  {
    id: "TR-02",
    name: "66/11 kV 16 MVA Power Transformer #2",
    loadPct: 76.8,
    windingTempC: 78.1,
    oilTempC: 64.3,
    dgaH2Ppm: 88,
    dgaCh4Ppm: 74,
    dgaC2h4Ppm: 46,
    vibrationMmS: 3.4,
    healthIndexPct: 74.5,
    predictedRulYears: 6.2,
    status: "MONITOR"
  }
];

export const DEFAULT_THRESHOLDS = {
  freqHighHz: 50.20,
  freqLowHz: 49.85,
  freqCritLowHz: 49.70,
  voltageTolerancePct: 6.0, // +/- 6% on 11kV -> 10.34 kV to 11.66 kV
  feederCurrentMaxA: 420.0,
  transformerTempMaxC: 85.0
};
