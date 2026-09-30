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
  Sparkles
} from 'lucide-react';
import { playBreakerCloseSound } from '../utils/audioEffects';

export const ElectricityMarket = () => {
  const { totalDemandMw, substation } = useGrid();

  const [currentBlock, setCurrentBlock] = useState(14); // 14:00 Block
  const [bessArbitrageMode, setBessArbitrageMode] = useState('AUTO');

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

  // Current active price based on slider
  const activeMarketPoint = marketHourlyPrices[currentBlock] || marketHourlyPrices[14];
  const currentPrice = activeMarketPoint.price;

  // Merit Order Despatch (MOD) Generation Fleet
  const generatorFleet = [
    { id: 'GEN-SOLAR', name: 'Bhadla Mega Solar Park', type: 'SOLAR', capacityMw: 20.0, marginalCost: 2.40, mustRun: true },
    { id: 'GEN-WIND', name: 'Muppandal Ridge Wind Farm', type: 'WIND', capacityMw: 15.0, marginalCost: 2.85, mustRun: true },
    { id: 'GEN-HYDRO', name: 'Sardar Sarovar Narmada Hydro', type: 'HYDRO', capacityMw: 25.0, marginalCost: 3.10, mustRun: false },
    { id: 'GEN-NUC', name: 'Kakrapar Atomic Plant (KAPS)', type: 'NUCLEAR', capacityMw: 30.0, marginalCost: 3.40, mustRun: false },
    { id: 'GEN-COAL', name: 'Mundra Supercritical Thermal', type: 'COAL', capacityMw: 50.0, marginalCost: 4.20, mustRun: false },
    { id: 'GEN-GAS', name: 'Dadri Fast Open-Cycle Gas Peaker', type: 'GAS', capacityMw: 15.0, marginalCost: 8.50, mustRun: false },
  ];

  // Discom Target Demand
  const [targetLoadMw, setTargetLoadMw] = useState(65.0);

  // Merit Order Dispatch Computation
  const { dispatchedList, totalCostPerHour, avgCostPerKwh, peakersAvoidedSavings } = useMemo(() => {
    let remainingLoad = targetLoadMw;
    let totalCost = 0;
    const list = [];

    // Sort by marginal cost (cheapest first)
    const sorted = [...generatorFleet].sort((a, b) => a.marginalCost - b.marginalCost);

    for (const gen of sorted) {
      let dispatchMw = 0;
      let status = 'SHUTDOWN';

      if (remainingLoad > 0) {
        dispatchMw = Math.min(remainingLoad, gen.capacityMw);
        remainingLoad -= dispatchMw;
        status = dispatchMw === gen.capacityMw ? 'FULL_DISPATCH' : 'PARTIAL_DISPATCH';
      }

      const cost = dispatchMw * 1000 * gen.marginalCost; // MW * 1000 kWh * ₹/kWh
      totalCost += cost;

      list.push({
        ...gen,
        dispatchedMw: dispatchMw,
        status: status,
        costPerHourInr: cost
      });
    }

    const avgCost = targetLoadMw > 0 ? (totalCost / (targetLoadMw * 1000)) : 0;
    // Savings compared to flat thermal/gas baseline (e.g. ₹6.50 flat)
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
  // Charges at trough price (₹2.15/kWh), Discharges at peak (₹9.95/kWh)
  const spreadPerUnit = 9.95 - 2.15; // ₹7.80 / kWh profit
  const dailyArbitrageProfit = Math.round(20 * 1000 * spreadPerUnit * 0.92); // 92% roundtrip efficiency -> ~₹1,43,520 / day
  const annualArbitrageProfitLakhs = +((dailyArbitrageProfit * 365) / 100000).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} id="electricity-market-view">
      {/* 1. Market Header Banner */}
      <div className="grid-card" style={{ padding: '22px', borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-success" style={{ fontWeight: 'bold' }}>IEX REAL-TIME MARKET (RTM)</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Indian Energy Exchange • CERC Market Regulations • 15-Minute Clearing Block
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coins size={26} color="#10b981" />
              Real-Time Electricity Market & Merit Order Despatch (MOD)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px' }}>
              Dynamic financial dispatch minimizing procurement cost (CoPP) across solar, hydro, and thermal generators while driving battery price arbitrage profits.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected DISCOM BESS Profit:</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              ₹{annualArbitrageProfitLakhs} Lakhs <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ year</span>
            </div>
          </div>
        </div>

        {/* Market KPI Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>IEX SPOT CLEARING PRICE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: currentPrice > 7.0 ? '#ef4444' : currentPrice < 3.0 ? '#10b981' : '#f59e0b' }}>
              ₹{currentPrice.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ kWh</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: currentPrice < 3.0 ? '#10b981' : 'var(--text-secondary)' }}>
              {currentPrice < 3.0 ? '🟢 Ultra-Low Solar Trough' : currentPrice > 8.0 ? '🔴 Peak Evening Shortage' : 'Nominal Power Exchange Price'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AVERAGE PROCUREMENT COST (CoPP)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
              ₹{avgCostPerKwh.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ kWh</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Optimized via Merit Order Stacking</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PEAKER AVOIDANCE SAVINGS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981' }}>
              ₹{peakersAvoidedSavings.toLocaleString('en-IN')} <span style={{ fontSize: '0.85rem' }}>/ hr</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compared to diesel/gas baseline</div>
          </div>

          <div style={{ background: 'var(--bg-stat-box)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>BESS ARBITRAGE SPREAD</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 'bold', color: '#a855f7' }}>
              ₹{spreadPerUnit.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>/ unit</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Peak ₹9.95 vs Solar ₹2.15</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Time-Block Slider & 24h Price Curve */}
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
            {/* Shaded BESS Charge Window (11:00 to 15:00) */}
            <rect x={(11 / 23) * 720 + 20} y="10" width={(4 / 23) * 720} height="100" fill="rgba(16, 185, 129, 0.12)" />
            <text x={(13 / 23) * 720 + 20} y="22" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">
              BESS Optimal Charge Window (&lt; ₹2.50)
            </text>

            {/* Shaded BESS Discharge Window (18:30 to 22:00) */}
            <rect x={(18 / 23) * 720 + 20} y="10" width={(4 / 23) * 720} height="100" fill="rgba(168, 85, 247, 0.15)" />
            <text x={(20 / 23) * 720 + 20} y="22" fill="#a855f7" fontSize="9" fontWeight="bold" textAnchor="middle">
              BESS Discharge Window (&gt; ₹8.00)
            </text>

            {/* Price Line */}
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
                  {/* Current Time Indicator */}
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

      {/* 3. Merit Order Despatch (MOD) Generator Fleet Table */}
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
    </div>
  );
};
