import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { Detect } from './pages/Detect';
import { ChangeDetection } from './pages/ChangeDetection';
import { Analytics } from './pages/Analytics';
import { HistoryPage } from './pages/HistoryPage';
import { ModelsPage } from './pages/ModelsPage';
import { Playground } from './pages/Playground';
import { Comparison } from './pages/Comparison';
import { Settings } from './pages/Settings';
import { getMetrics, getHistory, getAlerts, getModels } from './services/api';
import type { EvaluationMetrics, RunHistoryItem, SystemAlert, ModelItem } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [historyRuns, setHistoryRuns] = useState<RunHistoryItem[]>([]);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [activeModelName, setActiveModelName] = useState<string>('best.pt');

  const refreshAllData = async () => {
    try {
      const [m, h, a, mod] = await Promise.all([
        getMetrics().catch(() => null),
        getHistory(50).catch(() => ({ runs: [], summary: {} })),
        getAlerts(20).catch(() => []),
        getModels().catch(() => ({ active_model: 'best.pt', models: [] }))
      ]);

      if (m) setMetrics(m);
      if (h) {
        setHistoryRuns(h.runs || []);
        setHistorySummary(h.summary || {});
      }
      if (a) setAlerts(a);
      if (mod) {
        setModels(mod.models || []);
        setActiveModelName(mod.active_model || 'best.pt');
      }
    } catch (e) {
      console.error('Failed to sync data:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const activeModelMap50 = metrics?.mAP50 || 0.644;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            metrics={metrics}
            historyRuns={historyRuns}
            historySummary={historySummary}
            alerts={alerts}
            onNavigateTab={setActiveTab}
            onRefresh={refreshAllData}
          />
        );
      case 'detect':
        return <Detect />;
      case 'change-detection':
        return <ChangeDetection />;
      case 'history':
        return <HistoryPage runs={historyRuns} onRefresh={refreshAllData} />;
      case 'analytics':
        return <Analytics metrics={metrics} onRefresh={refreshAllData} />;
      case 'models':
        return (
          <ModelsPage
            models={models}
            activeModelName={activeModelName}
            onModelSwitched={refreshAllData}
          />
        );
      case 'playground':
        return <Playground />;
      case 'comparison':
        return <Comparison />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard
            metrics={metrics}
            historyRuns={historyRuns}
            historySummary={historySummary}
            alerts={alerts}
            onNavigateTab={setActiveTab}
            onRefresh={refreshAllData}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a0f] text-zinc-100 font-sans">
      {/* 1. Left Charcoal Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeModelName={activeModelName}
        activeModelMap50={activeModelMap50}
      />

      {/* 2. Main Page Container on sleek dark backdrop */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-4">
        {/* Large Premium Dark Rounded Panel */}
        <main className="flex-1 flex flex-col bg-[#12131a] rounded-[32px] shadow-2xl border border-white/[0.08] overflow-hidden">
          {/* Top Bar with Avatar, Search, and Notification Bell */}
          <TopBar
            alerts={alerts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNavigateTab={setActiveTab}
          />

          {/* Dynamic Scrollable Page Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {renderActiveTab()}
          </div>

          {/* Academic Demonstration Disclaimer Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default App;
