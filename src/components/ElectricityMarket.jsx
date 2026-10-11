import React, { useState, useMemo } from 'react';
import { useGrid } from '../context/GridContext';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Scale,
  Zap,
  BatteryCharging,
  DollarSign,
  ArrowUpRight,
  Clock,
  Sliders,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Handshake,
  ShieldCheck,
  Layers,
  Recycle,
  Cpu,
  FileCheck,
  Building2,
  Sun,
  Flame,
  Activity
} from 'lucide-react';
import { playBreakerCloseSound, playAlarmChirp } from '../utils/audioEffects';

export const ElectricityMarket = () => {
  const { totalDemandMw, substation, gridFrequencyHz } = useGrid();

  // Navigation: 'WHOLESALE_MOD' | 'P2P_TRADING' | 'SECOND_LIFE_BESS'
  const [activeMarketTab, setActiveMarketTab] = useState('WHOLESALE_MOD');

  // --- TAB 1 STATE: IEX WHOLESALE & MOD ---
  const [currentBlock, setCurrentBlock] = useState(14); // 14:00 Block
  const [targetLoadMw, setTargetLoadMw] = useState(65.0);

  // IEX 24-Hour Price Profile (15-min / Hourly synthetic realistic Indian power market data in ₹/kWh)
  const marketHourlyPrices = [
    { hour: 0, price: 3.40, demandGw: 185 },
    { hour: 1, price: 3.10, demandGw: 178 },
    { hour: 2, price: 2.80, demandGw: 172 },
    { hour: 3, price: 2.65, demandGw: 168 },
    { hour: 4, price: 2.70, demandGw: 170 },
    { hour: 5, price: 3.20, demandGw: 184 },
    { hour: 6, price: 4.10, demandGw: 205 },
    { hour: 7, price: 4.80, demandGw: 218 },
    { hour: 8, price: 5.40, demandGw: 228 },
    { hour: 9, price: 5.10, demandGw: 232 },
    { hour: 10, price: 4.20, demandGw: 226 },
    { hour: 11, price: 3.10, demandGw: 220 },
    { hour: 12, price: 2.40, demandGw: 216 }, // Deep solar depression
    { hour: 13, price: 2.15, demandGw: 212 }, // Lowest solar trough
    { hour: 14, price: 2.30, demandGw: 214 },
    { hour: 15, price: 2.80, demandGw: 222 },
    { hour: 16, price: 3.90, demandGw: 235 },
    { hour: 17, price: 5.60, demandGw: 244 },
    { hour: 18, price: 7.80, demandGw: 254 }, // Evening ramp begins
    { hour: 19, price: 9.60, demandGw: 258 }, // Peak evening spike
    { hour: 20, price: 9.95, demandGw: 260 }, // Maximum tariff spike
    { hour: 21, price: 8.40, demandGw: 252 },
    { hour: 22, price: 6.20, demandGw: 238 },
    { hour: 23, price: 4.50, demandGw: 210 },
  ];

  const activeMarketPoint = marketHourlyPrices[currentBlock] || marketHourlyPrices[14];
  const currentPrice = activeMarketPoint.price;

  // Merit Order Despatch Generation Fleet
  const generatorFleet = [
    { id: 'GEN-SOLAR', name: 'Bhadla Mega Solar Park', type: 'SOLAR', capacityMw: 20.0, marginalCost: 2.40, mustRun: true },
    { id: 'GEN-WIND', name: 'Muppandal Ridge Wind Farm', type: 'WIND', capacityMw: 15.0, marginalCost: 2.85, mustRun: true },
    { id: 'GEN-HYDRO', name: 'Sardar Sarovar Narmada Hydro', type: 'HYDRO', capacityMw: 25.0, marginalCost: 3.10, mustRun: false },
    { id: 'GEN-NUC', name: 'Kakrapar Atomic Plant (KAPS)', type: 'NUCLEAR', capacityMw: 30.0, marginalCost: 3.40, mustRun: false },
    { id: 'GEN-COAL', name: 'Mundra Supercritical Thermal', type: 'COAL', capacityMw: 50.0, marginalCost: 4.20, mustRun: false },
    { id: 'GEN-GAS', name: 'Dadri Fast Open-Cycle Gas Peaker', type: 'GAS', capacityMw: 15.0, marginalCost: 8.50, mustRun: false },
  ];

  const { dispatchedList, totalCostPerHour, avgCostPerKwh, peakersAvoidedSavings } = useMemo(() => {
    let remainingLoad = targetLoadMw;
    let totalCost = 0;
    const list = [];

    const sorted = [...generatorFleet].sort((a, b) => a.marginalCost - b.marginalCost);

    for (const gen of sorted) {
      let dispatchMw = 0;
      let status = 'SHUTDOWN';

      if (remainingLoad > 0) {
        dispatchMw = Math.min(remainingLoad, gen.capacityMw);
        remainingLoad -= dispatchMw;
        status = dispatchMw === gen.capacityMw ? 'FULL_DISPATCH' : 'PARTIAL_DISPATCH';
      }

      const cost = dispatchMw * 1000 * gen.marginalCost;
      totalCost += cost;

      list.push({
        ...gen,
        dispatchedMw: dispatchMw,
        status: status,
        costPerHourInr: cost
      });
    }

    const avgCost = targetLoadMw > 0 ? (totalCost / (targetLoadMw * 1000)) : 0;
    const baselineCost = targetLoadMw * 1000 * 6.50;
    const savings = Math.max(0, baselineCost - totalCost);

    return {
      dispatchedList: list,
      totalCostPerHour: totalCost,
      avgCostPerKwh: +avgCost.toFixed(2),
      peakersAvoidedSavings: Math.round(savings)
    };
  }, [targetLoadMw]);

  // Battery Arbitrage Calculations (20 MWh BESS)
  const spreadPerUnit = 9.95 - 2.15;
  const dailyArbitrageProfit = Math.round(20 * 1000 * spreadPerUnit * 0.92);
  const annualArbitrageProfitLakhs = +((dailyArbitrageProfit * 365) / 100000).toFixed(1);

  // --- TAB 2 STATE: P2P COMMUNITY ENERGY TRADING ---
  const [p2pClearingStatus, setP2pClearingStatus] = useState('IDLE');
  const [p2pTxHash, setP2pTxHash] = useState('0x8f2d...3a19');

  const prosumerAsks = [
    { id: 'ASK-01', entity: 'Mayur Vihar Pocket 1 RWA', type: 'Rooftop Solar PV', volumeKwh: 65.0, askPrice: 3.40, status: 'MATCHED' },
    { id: 'ASK-02', entity: 'Apex Agro Cold Storage & Solar Hub', type: 'Cold Storage + Canopy', volumeKwh: 40.0, askPrice: 3.60, status: 'MATCHED' },
    { id: 'ASK-03', entity: 'Govt Girls Senior Secondary School', type: 'Institutional Rooftop', volumeKwh: 20.0, askPrice: 3.20, status: 'MATCHED' },
    { id: 'ASK-04', entity: 'East End Co-op Housing Society', type: 'Residential Society', volumeKwh: 35.0, askPrice: 3.50, status: 'OPEN' },
  ];

  const consumerBids = [
    { id: 'BID-01', entity: 'Mayur Vihar DTC EV Fast Charger Hub', type: 'Commercial Fleet EV', volumeKwh: 45.0, bidPrice: 4.10, status: 'MATCHED' },
    { id: 'BID-02', entity: 'Pocket 4 Multi-Storey Apartments', type: 'Domestic Residential', volumeKwh: 50.0, bidPrice: 3.80, status: 'MATCHED' },
    { id: 'BID-03', entity: 'Delhi Jal Board Water Booster Pump', type: 'Critical Municipal Lifeline', volumeKwh: 30.0, bidPrice: 3.60, status: 'MATCHED' },
    { id: 'BID-04', entity: 'Shakarpur Local Commercial Bakery', type: 'MSME Food Processing', volumeKwh: 25.0, bidPrice: 3.45, status: 'OPEN' },
  ];

  const handleExecuteP2P = () => {
    playBreakerCloseSound();
    setP2pClearingStatus('CLEARING');
    setTimeout(() => {
      setP2pClearingStatus('CLEARED');
      setP2pTxHash(`0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`);
    }, 600);
  };

  // --- TAB 3 STATE: SECOND-LIFE EV BATTERY POOL ---
  const [bessSharedMode, setBessSharedMode] = useState('AUTO_FFR');

  const secondLifeRacks = [
    {
      id: 'SL-RACK-01',
      name: 'Tata Nexon EV 2nd-Life Cluster A',
      sourceVehicle: '4x Retired Nexon EV Packs (Delhi Fleet)',
      capacityKwh: 120,
      sohPct: 78.4,
      nominalVoltageV: 400,
      remainingCycles: 680,
      tempC: 31.2,
      currentPowerKw: bessSharedMode === 'DISCHARGING' ? -45.0 : (bessSharedMode === 'CHARGING' ? 38.0 : 0.0),
      status: 'HEALTHY'
    },
    {
      id: 'SL-RACK-02',
      name: 'DTC E-Bus Repurposed Sub-Module B',
      sourceVehicle: '1x Heavy Transit E-Bus Module (8yr Service)',
      capacityKwh: 180,
      sohPct: 75.2,
      nominalVoltageV: 650,
      remainingCycles: 840,
      tempC: 33.8,
      currentPowerKw: bessSharedMode === 'DISCHARGING' ? -68.0 : (bessSharedMode === 'CHARGING' ? 52.0 : 0.0),
      status: 'HEALTHY'
    },
    {
      id: 'SL-RACK-03',
      name: 'Mahindra Treo 3W Swappable Second-Life Cluster',
      sourceVehicle: '8x Swappable 48V Treo Packs',
      capacityKwh: 80,
      sohPct: 81.0,
      nominalVoltageV: 48,
      remainingCycles: 1120,
      tempC: 29.5,
      currentPowerKw: bessSharedMode === 'DISCHARGING' ? -30.0 : (bessSharedMode === 'CHARGING' ? 24.0 : 0.0),
      status: 'HEALTHY'
    }
  ];

  const totalSecondLifeCapacityKwh = secondLifeRacks.reduce((a, b) => a + b.capacityKwh, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="electricity-market-view">
      {/* 1. Market Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-success" style={{ fontWeight: 'bold' }}>IEX RTM • P2P MICROGRID • 2ND-LIFE BESS</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Indian Energy Exchange • CERC Market Framework • Local Feeder Flexibility (Track 03)
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coins size={26} color="#10b981" />
              Real-Time Electricity Market, P2P Trading & 2nd-Life BESS
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Dynamic financial dispatch minimizing procurement cost (CoPP) and unlocking neighborhood peer-to-peer trading and low-cost repurposed battery pooling.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected DISCOM BESS Profit:</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              ₹{annualArbitrageProfitLakhs} Lakhs <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ year</span>
            </div>
          </div>
        </div>

        {/* 3 Domain Sub-Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveMarketTab('WHOLESALE_MOD')}
            className={`btn-demo ${activeMarketTab === 'WHOLESALE_MOD' ? 'active' : ''}`}
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <Scale size={14} color={activeMarketTab === 'WHOLESALE_MOD' ? '#ffffff' : 'var(--accent-cyan)'} />
            <span>1. IEX Wholesale & Merit Order Despatch</span>
          </button>

          <button
            onClick={() => setActiveMarketTab('P2P_TRADING')}
            className={`btn-demo ${activeMarketTab === 'P2P_TRADING' ? 'active' : ''}`}
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <Handshake size={14} color={activeMarketTab === 'P2P_TRADING' ? '#ffffff' : '#10b981'} />
            <span>2. P2P Community Microgrid Trading</span>
          </button>

          <button
            onClick={() => setActiveMarketTab('SECOND_LIFE_BESS')}
            className={`btn-demo ${activeMarketTab === 'SECOND_LIFE_BESS' ? 'active' : ''}`}
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <Recycle size={14} color={activeMarketTab === 'SECOND_LIFE_BESS' ? '#ffffff' : '#a855f7'} />
            <span>3. 2nd-Life EV Battery Pooling ({totalSecondLifeCapacityKwh} kWh)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: IEX WHOLESALE MARKET & MERIT ORDER DESPATCH
         ========================================================================= */}
      {activeMarketTab === 'WHOLESALE_MOD' && (
        <>
          {/* Market KPI Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="grid-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>IEX SPOT CLEARING PRICE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: currentPrice > 7.0 ? '#ef4444' : currentPrice < 3.0 ? '#10b981' : '#f59e0b' }}>
                ₹{currentPrice.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ kWh</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: currentPrice < 3.0 ? '#10b981' : 'var(--text-secondary)' }}>
                {currentPrice < 3.0 ? '🟢 Ultra-Low Solar Trough' : currentPrice > 8.0 ? '🔴 Peak Evening Shortage' : 'Nominal Power Exchange Price'}
              </div>
            </div>

            <div className="grid-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AVERAGE PROCUREMENT COST (CoPP)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                ₹{avgCostPerKwh.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ kWh</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Optimized via Merit Order Stacking</div>
            </div>

            <div className="grid-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PEAKER AVOIDANCE SAVINGS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
                ₹{peakersAvoidedSavings.toLocaleString('en-IN')} <span style={{ fontSize: '0.85rem' }}>/ hr</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compared to diesel/gas baseline</div>
            </div>

            <div className="grid-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>BESS ARBITRAGE SPREAD</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#a855f7' }}>
                ₹{spreadPerUnit.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ unit</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Peak ₹9.95 vs Solar ₹2.15</div>
            </div>
          </div>

          {/* Interactive Time-Block Slider & 24h Price Curve */}
          <div className="grid-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                  IEX 24-Hour Day-Ahead Clearing Price & BESS Optimal Windows
                </h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Drag the time slider to see market clearing prices fluctuate and examine optimal charging/discharging arbitrage cycles.
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                Time: {String(currentBlock).padStart(2, '0')}:00 IST
              </div>
            </div>

            {/* Time Slider */}
            <div style={{ marginBottom: '18px' }}>
              <input
                type="range"
                min="0"
                max="23"
                value={currentBlock}
                onChange={(e) => setCurrentBlock(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <span>00:00 (Night Baseload)</span>
                <span>13:00 (Solar Valley: ₹2.15)</span>
                <span>20:00 (Evening Peak: ₹9.95)</span>
                <span>23:00 (Night Ramp Down)</span>
              </div>
            </div>

            {/* 24-Hour Price SVG */}
            <div style={{ background: 'var(--bg-stat-box)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <svg viewBox="0 0 760 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <rect x={(11 / 23) * 720 + 20} y="10" width={(4 / 23) * 720} height="100" fill="rgba(16, 185, 129, 0.12)" />
                <text x={(13 / 23) * 720 + 20} y="22" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">
                  BESS Optimal Charge Window (&lt; ₹2.50)
                </text>

                <rect x={(18 / 23) * 720 + 20} y="10" width={(4 / 23) * 720} height="100" fill="rgba(168, 85, 247, 0.15)" />
                <text x={(20 / 23) * 720 + 20} y="22" fill="#a855f7" fontSize="9" fontWeight="bold" textAnchor="middle">
                  BESS Discharge Window (&gt; ₹8.00)
                </text>

                {(() => {
                  const points = marketHourlyPrices.map(p => {
                    const x = 20 + (p.hour / 23) * 720;
                    const y = 110 - ((p.price - 2.0) / 8.5) * 85;
                    return `${x},${y}`;
                  });

                  const currentX = 20 + (currentBlock / 23) * 720;
                  const currentY = 110 - ((currentPrice - 2.0) / 8.5) * 85;

                  return (
                    <>
                      <polyline points={points.join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                      <line x1={currentX} y1="10" x2={currentX} y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx={currentX} cy={currentY} r="5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                      <text x={currentX} y={currentY - 10} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                        ₹{currentPrice.toFixed(2)}
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Merit Order Despatch Generator Fleet Table */}
          <div className="grid-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scale size={18} color="var(--accent-cyan)" />
                  Merit Order Generation Despatch (Least-Cost Priority Stack)
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Generators are committed strictly in ascending order of marginal cost to serve the target load.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Substation Demand:</span>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={targetLoadMw}
                  onChange={(e) => setTargetLoadMw(parseFloat(e.target.value))}
                  style={{ width: '130px', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#10b981', minWidth: '60px' }}>
                  {targetLoadMw} MW
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Priority & Generator</th>
                    <th style={{ padding: '10px' }}>Source Type</th>
                    <th style={{ padding: '10px' }}>Marginal Cost</th>
                    <th style={{ padding: '10px' }}>Available Capacity</th>
                    <th style={{ padding: '10px' }}>Dispatched Output</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Hourly Expenditure</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchedList.map((g, idx) => {
                    const isDispatched = g.dispatchedMw > 0;

                    return (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: isDispatched ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>#{idx + 1}</span>
                          {g.name}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge ${g.type === 'SOLAR' || g.type === 'WIND' ? 'badge-success' : g.type === 'HYDRO' ? 'badge-info' : g.type === 'GAS' ? 'badge-danger' : 'badge-purple'}`}>
                            {g.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: g.marginalCost < 3.0 ? '#10b981' : g.marginalCost > 7.0 ? '#ef4444' : 'var(--text-primary)' }}>
                          ₹{g.marginalCost.toFixed(2)} / unit
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{g.capacityMw} MW</td>
                        <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isDispatched ? '#10b981' : 'var(--text-muted)' }}>
                          {g.dispatchedMw} MW
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {g.status === 'FULL_DISPATCH' && <span className="badge badge-success">FULL DISPATCH</span>}
                          {g.status === 'PARTIAL_DISPATCH' && <span className="badge badge-warning">PARTIAL ({g.dispatchedMw} MW)</span>}
                          {g.status === 'SHUTDOWN' && <span className="badge badge-danger">CURTAILED / COLD</span>}
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>
                          ₹{Math.round(g.costPerHourInr).toLocaleString('en-IN')} / hr
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: PEER-TO-PEER (P2P) COMMUNITY ENERGY TRADING & ORDER BOOK
         ========================================================================= */}
      {activeMarketTab === 'P2P_TRADING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top P2P Value Proposition Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MARKET CLEARING PRICE (MCP)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                ₹3.55 <span style={{ fontSize: '0.85rem' }}>/ kWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Bilateral fair clearing between local prosumers & buyers
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NEIGHBOURHOOD BILL SAVINGS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                47.8% <span style={{ fontSize: '0.85rem' }}>Discount</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Compared to commercial retail grid tariff of ₹6.80/kWh
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PROSUMER SOLAR REVENUE LIFT</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
                +69.0% <span style={{ fontSize: '0.85rem' }}>Gain</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Compared to delayed ₹2.10 net-metering buyback
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DISCOM WHEELING TOLL EARNED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>
                ₹0.40 <span style={{ fontSize: '0.85rem' }}>/ unit toll</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Zero-risk grid utilization revenue for local DISCOM
              </div>
            </div>
          </div>

          {/* Interactive Double-Auction Order Book */}
          <div className="grid-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Handshake size={20} color="#10b981" />
                  Local Feeder Double-Auction Order Book (Mayur Vihar 11kV Substation)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Smart-contract enabled peer-to-peer bilateral matching clearing rooftop solar surplus against local EV chargers and cold storage demand.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  Tx Hash: {p2pTxHash}
                </span>
                <button
                  className="btn-primary"
                  onClick={handleExecuteP2P}
                  style={{ padding: '7px 14px', fontSize: '0.76rem' }}
                >
                  <Sparkles size={14} />
                  {p2pClearingStatus === 'CLEARING' ? "Matching Bids..." : "Execute Double Auction"}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Sellers (Asks) Table */}
              <div style={{ background: 'var(--bg-stat-box)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sun size={15} /> Prosumer Sellers (Surplus Asks)
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total: 160.0 kWh</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Prosumer</th>
                      <th style={{ padding: '6px' }}>Surplus</th>
                      <th style={{ padding: '6px' }}>Ask Price</th>
                      <th style={{ padding: '6px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prosumerAsks.map(ask => (
                      <tr key={ask.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{ask.entity}</td>
                        <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{ask.volumeKwh} kWh</td>
                        <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)', color: '#10b981' }}>₹{ask.askPrice.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <span className={`badge ${ask.status === 'MATCHED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                            {ask.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Buyers (Bids) Table */}
              <div style={{ background: 'var(--bg-stat-box)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={15} /> Consumer Buyers (Demand Bids)
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total: 150.0 kWh</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Buyer Entity</th>
                      <th style={{ padding: '6px' }}>Bid Load</th>
                      <th style={{ padding: '6px' }}>Bid Price</th>
                      <th style={{ padding: '6px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumerBids.map(bid => (
                      <tr key={bid.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{bid.entity}</td>
                        <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{bid.volumeKwh} kWh</td>
                        <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>₹{bid.bidPrice.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px' }}>
                          <span className={`badge ${bid.status === 'MATCHED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.62rem', padding: '2px 5px' }}>
                            {bid.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Contract Audit & Regulatory Compliance Bar */}
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={16} color="var(--accent-cyan)" />
                <span>
                  <strong>CERC Regulatory Sandbox:</strong> Automated settlement protocol verifies local physical feeder capacity before transaction execution, preventing transformer reverse-power overvoltage.
                </span>
              </div>
              <span className="badge badge-success">ZERO DISCOM ASSET STRAIN</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: COMMUNITY 2ND-LIFE EV BATTERY POOLING AGGREGATOR
         ========================================================================= */}
      {activeMarketTab === 'SECOND_LIFE_BESS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top 2nd-Life Value Proposition Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #a855f7' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL REPURPOSED CAPACITY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>
                {totalSecondLifeCapacityKwh} <span style={{ fontSize: '0.85rem' }}>kWh</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Across 3 aggregated neighbourhood battery racks
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CAPEX SAVINGS VS NEW LFP</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                71.4% <span style={{ fontSize: '0.85rem' }}>Cheaper</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                ₹4,150 / kWh (2nd-Life) vs ₹14,500 / kWh (New)
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #06b6d4' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EMBODIED CO₂ AVOIDED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                54.2 <span style={{ fontSize: '0.85rem' }}>Tons CO₂e</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                By extending battery lifespan 4-6 years before recycling
              </div>
            </div>

            <div className="grid-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OUTAGE BACKUP AUTONOMY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
                4.2 <span style={{ fontSize: '0.85rem' }}>Hours</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                For critical clinic, water pumping & street lighting loads
              </div>
            </div>
          </div>

          {/* Repurposed EV Battery Fleet Details */}
          <div className="grid-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Recycle size={20} color="#a855f7" />
                  2nd-Life EV Battery Repurposing Rack Fleet (BMS Health & SOH Monitor)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Retired EV batteries decommissioned from automotive traction (75-80% SOH) aggregated as stationary neighbourhood storage for peak shaving and FFR.
                </p>
              </div>

              {/* Mode Selector */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'AUTO_FFR', label: 'Auto Fast Frequency (FFR)' },
                  { id: 'CHARGING', label: 'Charge from Solar (G2B)' },
                  { id: 'DISCHARGING', label: 'Evening Peak Injection' }
                ].map(item => (
                  <button
                    key={item.id}
                    className="btn-outline"
                    onClick={() => {
                      playBreakerCloseSound();
                      setBessSharedMode(item.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      background: bessSharedMode === item.id ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                      borderColor: bessSharedMode === item.id ? '#a855f7' : 'var(--border-subtle)',
                      color: bessSharedMode === item.id ? '#c084fc' : 'var(--text-secondary)'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Racks Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {secondLifeRacks.map(rack => (
                <div key={rack.id} style={{ background: 'var(--bg-stat-box)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>{rack.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rack.sourceVehicle}</span>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>{rack.status}</span>
                  </div>

                  {/* SOH Bar */}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Remaining Health (SOH):</span>
                      <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>{rack.sohPct}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'var(--track-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${rack.sohPct}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  {/* Telemetry specs grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.72rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Usable Energy:</span>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{rack.capacityKwh} kWh</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Pack Voltage:</span>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{rack.nominalVoltageV} V DC</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Remaining Cycles:</span>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{rack.remainingCycles} cycles</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Cell Temp:</span>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: rack.tempC > 35 ? '#ef4444' : 'var(--text-primary)' }}>
                        {rack.tempC}°C
                      </div>
                    </div>
                  </div>

                  {/* Current dispatch state */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Power Flow:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: rack.currentPowerKw < 0 ? '#10b981' : (rack.currentPowerKw > 0 ? '#f59e0b' : 'var(--text-muted)') }}>
                      {rack.currentPowerKw < 0 ? `Discharging: ${Math.abs(rack.currentPowerKw)} kW` : (rack.currentPowerKw > 0 ? `Charging: +${rack.currentPowerKw} kW` : 'Standby / FFR Armed')}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
