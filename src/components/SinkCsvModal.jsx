import React, { useState, useRef } from 'react';
import { useGrid } from '../context/GridContext';
import { 
  Building2, 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  FileSpreadsheet,
  Factory,
  Home,
  Train,
  Info
} from 'lucide-react';

export const SinkCsvModal = ({ isOpen, onClose }) => {
  const { 
    sinks, 
    sinksCsvInfo, 
    reloadSinksFromCsv, 
    importSinksCsv, 
    exportSinksCsv 
  } = useGrid();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [isReloading, setIsReloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReload = async () => {
    setIsReloading(true);
    setFeedbackMsg(null);
    const res = await reloadSinksFromCsv();
    setIsReloading(false);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Synchronized ${res.count} demand sinks from /data/sinks.csv` });
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
        const res = importSinksCsv(content, file.name);
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: `Successfully loaded ${res.count} demand sinks from ${file.name}` });
        } else {
          setFeedbackMsg({ type: 'error', text: res.error || 'Failed to import CSV' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredSinks = sinks.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.discomOperator && s.discomOperator.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || 
      (filterCategory === 'CITIES' && s.category === 'CITY_METRO') ||
      (filterCategory === 'FACTORIES' && s.category === 'FACTORY_HEAVY_INDUSTRY') ||
      (filterCategory === 'HOUSES' && s.category === 'RESIDENTIAL_HOUSING') ||
      (filterCategory === 'TRANSIT' && s.category === 'TRANSIT_CRITICAL_INFRA');

    const matchesRegion = filterRegion === 'ALL' || s.region === filterRegion;

    return matchesSearch && matchesCategory && matchesRegion;
  });

  const getCategoryBadge = (category) => {
    if (category === 'CITY_METRO') {
      return <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>🏙️ CITY METRO</span>;
    }
    if (category === 'FACTORY_HEAVY_INDUSTRY') {
      return <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>🏭 FACTORY</span>;
    }
    if (category === 'RESIDENTIAL_HOUSING') {
      return <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>🏘️ HOUSING</span>;
    }
    return <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>🚆 TRANSIT / INFRA</span>;
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
        maxWidth: '1100px',
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
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-normal)'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                  Electricity Demand Sinks Database (Cities & Factories)
                </h3>
                <span className="badge badge-success">
                  {sinks.length} Sinks Active
                </span>
                {sinksCsvInfo.isCustomLoaded && (
                  <span className="badge badge-warning">Custom CSV Active</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Master CSV source: <code>public/data/sinks.csv</code> • Add cities, factories, or townships anytime to populate on live grid map
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
              title="Reload data directly from public/data/sinks.csv"
            >
              <RefreshCw size={14} className={isReloading ? "spin" : ""} />
              {isReloading ? "Reloading..." : "Reload from /data/sinks.csv"}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Upload your own custom sinks CSV"
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
              onClick={exportSinksCsv}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              title="Download all currently active sinks as CSV"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Quick info snippet */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Synced: <strong>{sinksCsvInfo.loadedAt || 'Initial Boot'}</strong> ({sinksCsvInfo.filename})
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
              placeholder="Search city, factory, operator..."
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

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'CITIES', 'FACTORIES', 'HOUSES', 'TRANSIT'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className="btn-outline"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  background: filterCategory === cat ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  borderColor: filterCategory === cat ? 'var(--status-normal)' : 'var(--border-subtle)',
                  color: filterCategory === cat ? 'var(--status-normal)' : 'var(--text-secondary)'
                }}
              >
                {cat}
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

        {/* Sinks Table View */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2 }}>
                <th style={{ padding: '10px 8px' }}>Sink ID</th>
                <th style={{ padding: '10px 8px' }}>Demand Center Name</th>
                <th style={{ padding: '10px 8px' }}>Category</th>
                <th style={{ padding: '10px 8px' }}>Region / State</th>
                <th style={{ padding: '10px 8px' }}>Peak Demand</th>
                <th style={{ padding: '10px 8px' }}>Current Load</th>
                <th style={{ padding: '10px 8px' }}>Voltage</th>
                <th style={{ padding: '10px 8px' }}>DISCOM / Operator</th>
              </tr>
            </thead>
            <tbody>
              {filteredSinks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No demand sinks match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSinks.map((sink, idx) => (
                  <tr 
                    key={sink.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'var(--bg-stat-box)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                      {sink.id}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{sink.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sink.city}</div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      {getCategoryBadge(sink.category)}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginRight: '4px' }}>{sink.region}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{sink.state}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {sink.peakDemandMw.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {sink.currentDemandMw.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {sink.voltageLevelKv} kV
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '0.72rem', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sink.discomOperator}>
                      {sink.discomOperator}
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
            <Info size={16} color="var(--status-normal)" />
            <span>
              <strong>Tip:</strong> Open <code>public/data/sinks.csv</code> in Excel or VS Code to add, edit, or remove cities & factories. Click "Reload from CSV" to instantly see updates!
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
