import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import type { RunHistoryItem } from '../types';

interface HistoryPageProps {
  runs: RunHistoryItem[];
  onRefresh: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ runs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Alert Triggered' | 'Completed'>('All');
  const [selectedRun, setSelectedRun] = useState<RunHistoryItem | null>(null);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch = r.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.model_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Mission & Detection Log</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.06]">
              SQLite Audit Trail
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Complete historical record of surveillance inferences, detections, and alerts
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-[#111218] border border-white/[0.1] text-xs text-white rounded-full pl-8 pr-3 py-1.5 outline-none focus:border-indigo-500 placeholder:text-zinc-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#111218] border border-white/[0.1] text-xs font-semibold text-zinc-300 rounded-full px-3 py-1.5 outline-none cursor-pointer hover:border-white/[0.2]"
          >
            <option value="All">All Runs</option>
            <option value="Alert Triggered">Alerts Only</option>
            <option value="Completed">Normal Runs</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Run ID</th>
                <th className="pb-3">Preview</th>
                <th className="pb-3">Target Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Object Counts</th>
                <th className="pb-3">Model</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    No detection runs matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 pl-2 font-mono font-semibold text-zinc-400">#{r.id}</td>
                    <td className="py-3">
                      {r.annotated_image_path ? (
                        <img
                          src={r.annotated_image_path}
                          alt="Thumbnail"
                          className="w-10 h-10 object-cover rounded-lg border border-white/[0.1] cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedRun(r)}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-zinc-600">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-white max-w-[160px] truncate" title={r.filename}>
                      {r.filename}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Alert Triggered'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {r.status === 'Alert Triggered' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        <span className="font-extrabold text-white mr-1">{r.total_detections} total:</span>
                        {Object.entries(r.counts).slice(0, 3).map(([c, cnt]) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-medium text-zinc-300 border border-white/[0.04]">
                            {c}: {cnt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-zinc-400 font-mono text-[11px]">{r.model_name}</td>
                    <td className="py-3 text-zinc-300 font-medium">{r.latency_ms} ms</td>
                    <td className="py-3 text-zinc-500 text-[11px]">
                      {new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => setSelectedRun(r)}
                        className="px-3 py-1 rounded-full text-indigo-400 hover:bg-indigo-500/10 font-semibold text-xs transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181924] border border-white/[0.1] rounded-3xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-150 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-base text-white">Run #{selectedRun.id}: {selectedRun.filename}</h3>
                <p className="text-xs text-zinc-400">{new Date(selectedRun.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRun.annotated_image_path && (
              <div className="w-full bg-[#0a0b10] border border-white/[0.06] rounded-2xl overflow-hidden flex items-center justify-center p-2">
                <img
                  src={selectedRun.annotated_image_path}
                  alt="Annotated Run"
                  className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Total Detections</span>
                <span className="text-lg font-bold text-white">{selectedRun.total_detections}</span>
              </div>
              <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Inference Latency</span>
                <span className="text-lg font-bold text-indigo-400">{selectedRun.latency_ms} ms</span>
              </div>
              <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl">
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Model Used</span>
                <span className="text-xs font-mono font-bold text-zinc-200 truncate block mt-1">{selectedRun.model_name}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-zinc-300 block mb-2">Class Breakdown</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(selectedRun.counts).map(([cls, cnt]) => (
                  <span key={cls} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/[0.06] text-zinc-200">
                    <span className="capitalize">{cls}</span>: <b>{cnt}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
