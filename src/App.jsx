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
import { MissionControlBar } from './components/MissionControlBar';
import { HackathonPitchDeck } from './components/HackathonPitchDeck';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('india-map');
  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const { toggleTheme, setIsLiveStreamActive, toggleSound } = useGrid();

  // Keyboard shortcuts for power operators: [T] Theme, [Space] Stream, [M] Mute, [P] Pitch Deck
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, setIsLiveStreamActive, toggleSound]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenPitchDeck={() => setShowPitchDeck(true)}
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

      <AlarmsDrawer />

      {/* Floating AI SCADA Voice Copilot */}
      <VoiceDispatchCopilot onNavigateTab={(tab) => setActiveTab(tab)} />

      {/* Docked SCADA Mission Control Telemetry HUD */}
      <MissionControlBar />

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

export default function App() {
  return (
    <GridProvider>
      <DashboardContent />
    </GridProvider>
  );
}

