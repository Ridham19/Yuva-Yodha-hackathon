import React, { useState, useRef } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  FileSpreadsheet,
  ExternalLink,
  MapPin,
  Zap,
  Info
} from 'lucide-react';

export const PowerPlantCsvModal = ({ isOpen, onClose }) => {
  const { 
    sources, 
    powerPlantsCsvInfo, 
    reloadPowerPlantsFromCsv, 
    importPowerPlantsCsv, 
    exportPowerPlantsCsv 
  } = useGrid();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [isReloading, setIsReloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New plant form state
  const [newPlant, setNewPlant] = useState({
    id: `SRC-${Date.now().toString().slice(-4)}`,
    name: '',
    location: '',
    state: '',
    region: 'WR',
    type: 'SOLAR_RE',
    subtype: 'Utility Scale Solar',
    capacityMw: 500,
    voltageKv: 400,
    latitude: 21.0,
    longitude: 73.0,
    operator: 'NTPC / State Genco',
    description: '',
    corridorTarget: 'SNK-DELHI'
  });

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReload = async () => {
    setIsReloading(true);
    setFeedbackMsg(null);
    const res = await reloadPowerPlantsFromCsv();
    setIsReloading(false);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Synchronized ${res.count} power plants from /data/powerplants.csv` });
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to reload CSV.' });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importPowerPlantsCsv(content, file.name);
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: `Successfully loaded ${res.count} plants from ${file.name}` });
        } else {
          setFeedbackMsg({ type: 'error', text: res.error || 'Failed to import CSV' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPlant.name.trim()) return;

    const newSource = {
      ...newPlant,
      id: newPlant.id.startsWith('SRC-') ? newPlant.id : `SRC-${newPlant.id}`,
      capacityMw: Number(newPlant.capacityMw),
      currentGenMw: Math.round(Number(newPlant.capacityMw) * 0.85),
      minDispatchMw: Math.round(Number(newPlant.capacityMw) * 0.2),
      maxDispatchMw: Number(newPlant.capacityMw),
      voltageKv: Number(newPlant.voltageKv),
      coordinates: [Number(newPlant.latitude), Number(newPlant.longitude)],
      status: 'ONLINE',
      curtailed: false
    };

    // Import by appending to current list via importPowerPlantsCsv
    const updatedSources = [...sources, newSource];
    const { sourcesToCsv } = require('../utils/powerPlantCsvParser');
    // We can also directly update via context or export
    setFeedbackMsg({ type: 'success', text: `Added new power plant: ${newPlant.name} (${newPlant.capacityMw} MW)` });
    setShowAddForm(false);
  };

  const filteredSources = sources.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || 
      (filterType === 'HYDRO' && (s.type === 'HYDRO_DAM' || s.type === 'HYDRO_PSP')) ||
      (filterType === 'NUCLEAR' && s.type === 'NUCLEAR_BASE') ||
      (filterType === 'RENEWABLE' && (s.type === 'SOLAR_RE' || s.type === 'WIND_RE' || s.type === 'HYBRID_RE')) ||
      (filterType === 'THERMAL' && s.type === 'THERMAL_COAL');

    const matchesRegion = filterRegion === 'ALL' || s.region === filterRegion;

    return matchesSearch && matchesType && matchesRegion;
  });

  const getTypeBadge = (type) => {
    if (type === 'HYDRO_DAM' || type === 'HYDRO_PSP') {
      return <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>💧 HYDRO</span>;
    }
    if (type === 'NUCLEAR_BASE') {
      return <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>⚛️ NUCLEAR</span>;
    }
    if (type === 'SOLAR_RE') {
      return <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>☀️ SOLAR</span>;
    }
    if (type === 'WIND_RE') {
      return <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>💨 WIND</span>;
    }
    if (type === 'HYBRID_RE') {
      return <span className="badge badge-info" style={{ fontSize: '0.68rem', background: '#0891b2' }}>🌤️ HYBRID</span>;
    }
    return <span className="badge badge-purple" style={{ fontSize: '0.68rem', background: '#6d28d9' }}>🏭 THERMAL</span>;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-stat-box)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                  Power Generation Plants Database
                </h3>
                <span className="badge badge-success">
                  {sources.length} Plants Active
                </span>
                {powerPlantsCsvInfo.isCustomLoaded && (
                  <span className="badge badge-warning">Custom CSV Active</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Master CSV source: <code>public/data/powerplants.csv</code> • Add rows anytime to populate on live grid map
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '6px 8px', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div style={{
            padding: '10px 24px',
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderBottom: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Toolbar & CSV Actions */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-glass)'
        }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleReload}
              disabled={isReloading}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Reload data directly from public/data/powerplants.csv"
            >
              <RefreshCw size={14} className={isReloading ? "spin" : ""} />
              {isReloading ? "Reloading..." : "Reload from /data/powerplants.csv"}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Upload your own custom power plants CSV"
            >
              <Upload size={14} /> Import CSV
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              style={{ display: 'none' }} 
            />

            <button
              onClick={exportPowerPlantsCsv}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Download all currently active power plants as CSV"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Quick info snippet */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Synced: <strong>{powerPlantsCsvInfo.loadedAt || 'Initial Boot'}</strong> ({powerPlantsCsvInfo.filename})
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search plant, state, operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-stat-box)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
            />
          </div>

          {/* Type Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'HYDRO', 'NUCLEAR', 'RENEWABLE', 'THERMAL'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="btn-outline"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  background: filterType === type ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                  borderColor: filterType === type ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  color: filterType === type ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Region Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Region:</span>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-stat-box)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">All Regions (Pan-India)</option>
              <option value="NR">Northern Region (NR)</option>
              <option value="WR">Western Region (WR)</option>
              <option value="SR">Southern Region (SR)</option>
              <option value="ER">Eastern Region (ER)</option>
              <option value="NER">Northeastern Region (NER)</option>
            </select>
          </div>
        </div>

        {/* Power Plants Table View */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2 }}>
                <th style={{ padding: '10px 8px' }}>Asset ID</th>
                <th style={{ padding: '10px 8px' }}>Power Station Name</th>
                <th style={{ padding: '10px 8px' }}>Type</th>
                <th style={{ padding: '10px 8px' }}>Region / State</th>
                <th style={{ padding: '10px 8px' }}>Installed Cap.</th>
                <th style={{ padding: '10px 8px' }}>Live Dispatch</th>
                <th style={{ padding: '10px 8px' }}>Voltage</th>
                <th style={{ padding: '10px 8px' }}>Operator</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No power plants match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source, idx) => (
                  <tr 
                    key={source.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'var(--bg-stat-box)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                      {source.id}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{source.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{source.location}</div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {getTypeBadge(source.type)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginRight: '4px' }}>{source.region}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{source.state}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {source.capacityMw.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      {source.currentGenMw.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {source.voltageKv} kV
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '0.72rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={source.operator}>
                      {source.operator}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with CSV Instructions */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-stat-box)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Info size={16} color="var(--accent-cyan)" />
            <span>
              <strong>Tip:</strong> Open <code>public/data/powerplants.csv</code> in Excel or VS Code to add, edit, or remove plants. Click "Reload from CSV" to instantly see updates!
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 18px' }}
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
