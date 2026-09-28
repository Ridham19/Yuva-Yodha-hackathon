import React, { useState } from 'react';
import { GridProvider } from './context/GridContext';
import { Header } from './components/Header';
import { IndiaGridMap } from './components/IndiaGridMap';
import { TopologyMap } from './components/TopologyMap';
import { FeederMonitoring } from './components/FeederMonitoring';
import { ControlCenter } from './components/ControlCenter';
import { SelfHealingAutomation } from './components/SelfHealingAutomation';
import { PredictiveMaintenance } from './components/PredictiveMaintenance';
import { ImpactSummary } from './components/ImpactSummary';
import { AlarmsDrawer } from './components/AlarmsDrawer';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('india-map');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="dashboard-container">
        {activeTab === 'india-map' && (
          <IndiaGridMap onSelectLocalSubstation={() => setActiveTab('topology')} />
        )}
        {activeTab === 'topology' && <TopologyMap />}
        {activeTab === 'feeders' && <FeederMonitoring />}
        {activeTab === 'control' && <ControlCenter />}
        {activeTab === 'flisr' && <SelfHealingAutomation />}
        {activeTab === 'predictive' && <PredictiveMaintenance />}
        {activeTab === 'impact' && <ImpactSummary />}
      </main>

      <AlarmsDrawer />
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
