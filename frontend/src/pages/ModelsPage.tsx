import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import type { ModelItem } from '../types';
import { selectModel } from '../services/api';

interface ModelsPageProps {
  models: ModelItem[];
  activeModelName: string;
  onModelSwitched: () => void;
}

export const ModelsPage: React.FC<ModelsPageProps> = ({
  models,
  activeModelName,
  onModelSwitched
}) => {
  const [switching, setSwitching] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectModel = async (modelName: string) => {
    setSwitching(modelName);
    try {
      await selectModel(modelName);
      setSuccessMsg(`Switched active inference model to ${modelName}`);
      onModelSwitched();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      alert(`Failed to switch model: ${e.message}`);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Model Weights Inventory</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Ultralytics OBB
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage custom trained checkpoint weights and pre-trained aerial backbones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Active Architecture:</span>
          <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">
            {activeModelName}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((m) => {
          const isActive = m.name === activeModelName;
          return (
            <div
              key={m.name}
              className={`p-6 rounded-[28px] border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-950/70 via-[#181924] to-[#12131b] border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30'
                  : 'bg-[#181924]/80 backdrop-blur-md border-white/[0.08] shadow-lg hover:border-white/[0.15]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-white/[0.06] text-zinc-400 border border-white/[0.06]'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  {isActive ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/[0.04] text-zinc-500 border border-white/[0.04]">
                      Available
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-white mb-1">{m.name}</h3>
                <p className="text-xs text-zinc-400 mb-4">{m.type}</p>

                <div className="space-y-2 py-3 border-y border-white/[0.06] text-xs text-zinc-400 mb-4">
                  <div className="flex justify-between">
                    <span>Task</span>
                    <span className="font-semibold text-zinc-200">Oriented Bounding Boxes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size</span>
                    <span className="font-semibold text-zinc-200">{m.size_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DOTA Classes</span>
                    <span className="font-semibold text-zinc-200">15 Categories</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware</span>
                    <span className="font-semibold text-zinc-200">CUDA / GPU FP16</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectModel(m.name)}
                disabled={isActive || switching === m.name}
                className={`w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-white/[0.04] text-zinc-500 border border-white/[0.04] cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                {switching === m.name ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating Model...</span>
                  </>
                ) : isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Currently Active</span>
                  </>
                ) : (
                  <>
                    <span>Switch to this Model</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
