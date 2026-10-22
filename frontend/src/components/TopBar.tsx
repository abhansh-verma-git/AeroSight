import React, { useState } from 'react';
import { Search, Bell, ChevronDown, ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';
import type { SystemAlert } from '../types';

interface TopBarProps {
  alerts: SystemAlert[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  alerts,
  searchQuery,
  setSearchQuery,
  onNavigateTab
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Critical</span>;
      case 'Warning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Warning</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Info</span>;
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'Warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#12131a]/80 backdrop-blur-md rounded-t-[32px] select-none text-zinc-100">
      {/* User profile dropdown on left */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/10 shadow-md">
          SC
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
            Cmdr. Sarah Chen
          </span>
          <span className="text-[11px] text-zinc-400">s.chen@aerosight.io</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors ml-0.5" />
      </div>

      {/* Rounded search bar in center */}
      <div className="relative w-80 max-w-sm">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search targets, runs, coordinates..."
          className="w-full bg-[#181924] border border-white/[0.08] focus:border-indigo-500 focus:bg-[#1e202e] text-xs text-white rounded-full pl-9 pr-4 py-2 outline-none transition-all placeholder:text-zinc-500"
        />
      </div>

      {/* Right icons: Notification bell with badge count */}
      <div className="relative flex items-center gap-3">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-9 h-9 rounded-full bg-[#181924] hover:bg-zinc-800 flex items-center justify-center text-zinc-300 transition-colors border border-white/[0.08]"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Modal */}
        {showNotifications && (
          <div className="absolute right-0 top-12 w-88 bg-[#181922] rounded-3xl shadow-2xl border border-white/[0.1] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Surveillance Alerts</span>
                <span className="text-[10px] bg-white/[0.08] text-zinc-300 px-2 py-0.5 rounded-full font-medium">
                  {alerts.length} total
                </span>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto py-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No active system alerts. All surveillance sweeps normal.
                </div>
              ) : (
                alerts.slice(0, 8).map((al) => (
                  <div key={al.id} className="py-2.5 px-1 hover:bg-white/[0.04] rounded-xl transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {getSeverityIcon(al.severity)}
                        <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                          {al.title}
                        </span>
                      </div>
                      {getSeverityBadge(al.severity)}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 pl-5">
                      {al.message}
                    </p>
                    <span className="text-[10px] text-zinc-500 pl-5 block mt-0.5">
                      {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            {onNavigateTab && (
              <div className="pt-2 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigateTab('history');
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1"
                >
                  View All Logged Events &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
