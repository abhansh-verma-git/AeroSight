import React from 'react';
import {
  LayoutDashboard,
  Scan,
  GitCompare,
  History,
  BarChart3,
  Cpu,
  Sparkles,
  Sliders,
  Layers,
  Plane,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeModelName: string;
  activeModelMap50: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeModelName,
  activeModelMap50,
}) => {
  const primaryNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detect', label: 'Detect', icon: Scan },
    { id: 'change-detection', label: 'Change Detection', icon: GitCompare },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'models', label: 'Models', icon: Cpu },
  ];

  const aiToolsNav = [
    { id: 'playground', label: 'Playground', icon: Sparkles },
    { id: 'comparison', label: 'Model Comparison', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 min-w-[16rem] bg-[#0c0d12] text-zinc-300 flex flex-col justify-between py-6 px-4 select-none shrink-0 border-r border-white/[0.06]">
      <div>
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">AeroSight</span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">OBB</span>
            </div>
            <p className="text-xs text-zinc-400">Aerial Surveillance AI</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1 mb-6">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-zinc-950 font-bold shadow-md shadow-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Section Divider: AI Tools */}
        <div className="px-4 mb-2 mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            AI Tools
          </span>
        </div>

        {/* AI Tools Navigation */}
        <nav className="space-y-1">
          {aiToolsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-zinc-950 font-bold shadow-md shadow-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Model Card */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-indigo-950/80 via-[#181924] to-[#101118] p-4 rounded-3xl text-white shadow-xl border border-indigo-500/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Active Model
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <div className="font-bold text-sm truncate mb-1 text-white" title={activeModelName}>
            {activeModelName}
          </div>
          <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between">
            <span>Validation mAP50</span>
            <span className="font-bold text-emerald-400">{(activeModelMap50 * 100).toFixed(1)}%</span>
          </div>
          <button
            onClick={() => setActiveTab('detect')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
          >
            <span>Run Detection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
