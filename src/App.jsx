import React, { useState, useEffect } from 'react';
import { GridProvider, useGrid } from './context/GridContext';
import { Header } from './components/Header';
import { IndiaGridMap } from './components/IndiaGridMap';
import { TopologyMap } from './components/TopologyMap';
import { FeederMonitoring } from './components/FeederMonitoring';
import { ControlCenter } from './components/ControlCenter';
import { SelfHealingAutomation } from './components/SelfHealingAutomation';
import { EcoStruxureIntegration } from './components/EcoStruxureIntegration';
import { PredictiveMaintenance } from './components/PredictiveMaintenance';
import { MachineLearningStudio } from './components/MachineLearningStudio';
import { CyberSecurityCenter } from './components/CyberSecurityCenter';
import { ElectricityMarket } from './components/ElectricityMarket';
import { EVFleetV2G } from './components/EVFleetV2G';
import { DoubleBusbarSLD } from './components/DoubleBusbarSLD';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { CarbonAndReports } from './components/CarbonAndReports';
import { VoiceDispatchCopilot } from './components/VoiceDispatchCopilot';
import { ImpactSummary } from './components/ImpactSummary';
import { AlarmsDrawer } from './components/AlarmsDrawer';
import { HackathonPitchDeck } from './components/HackathonPitchDeck';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('india-map');
  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const [isAlarmsOpen, setIsAlarmsOpen] = useState(false);
  const { toggleTheme, setIsLiveStreamActive, toggleSound } = useGrid();

  // Keyboard shortcuts for power operators: [T] Theme, [Space] Stream, [M] Mute, [P] Pitch Deck, [A] Alarms
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setIsLiveStreamActive(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleSound();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShowPitchDeck(prev => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setIsAlarmsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, setIsLiveStreamActive, toggleSound]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenPitchDeck={() => setShowPitchDeck(true)}
        isAlarmsOpen={isAlarmsOpen}
        onToggleAlarms={() => setIsAlarmsOpen(prev => !prev)}
      />

      <main className="dashboard-container">
        {activeTab === 'india-map' && (
          <IndiaGridMap onSelectLocalSubstation={() => setActiveTab('topology')} />
        )}
        {activeTab === 'topology' && <TopologyMap />}
        {activeTab === 'busbar-sld' && <DoubleBusbarSLD />}
        {activeTab === 'feeders' && <FeederMonitoring />}
        {activeTab === 'control' && <ControlCenter />}
        {activeTab === 'flisr' && <SelfHealingAutomation />}
        {activeTab === 'ecostruxure' && <EcoStruxureIntegration />}
        {activeTab === 'ml-studio' && <MachineLearningStudio />}
        {activeTab === 'cyber' && <CyberSecurityCenter />}
        {activeTab === 'market' && <ElectricityMarket />}
        {activeTab === 'v2g' && <EVFleetV2G />}
        {activeTab === 'database' && <DatabaseExplorer />}
        {activeTab === 'predictive' && <PredictiveMaintenance />}
        {activeTab === 'carbon' && <CarbonAndReports />}
        {activeTab === 'impact' && <ImpactSummary />}
      </main>

      {/* Slide-over SCADA Alarms Drawer */}
      <AlarmsDrawer 
        isOpen={isAlarmsOpen} 
        onClose={() => setIsAlarmsOpen(false)} 
      />

      {/* Floating AI SCADA Voice Copilot */}
      <VoiceDispatchCopilot onNavigateTab={(tab) => {
        if (tab === 'pitch-deck') {
          setShowPitchDeck(true);
        } else {
          setActiveTab(tab);
        }
      }} />

      {/* Yuva Yodha Grand Finale Interactive Pitch Deck */}
      {showPitchDeck && (
        <HackathonPitchDeck 
          onClose={() => setShowPitchDeck(false)}
          onNavigateTab={(tab) => {
            setShowPitchDeck(false);
            setActiveTab(tab);
          }}
        />
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[GridPulse React Crash]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>⚠️ SCADA Telemetry Render Alert</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
              A UI component encountered an unexpected state. Automatic fallback recovery initialized.
            </p>
            <pre style={{
              background: '#020617',
              color: '#fca5a5',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              textAlign: 'left',
              overflowX: 'auto',
              maxHeight: '150px'
            }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                background: '#10b981',
                color: '#000',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GridProvider>
        <DashboardContent />
      </GridProvider>
    </ErrorBoundary>
  );
}
