import React, { useState } from 'react';
import { Sliders, ShieldCheck, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const [tileSize, setTileSize] = useState('1024');
  const [overlap, setOverlap] = useState('200');
  const [iouThreshold, setIouThreshold] = useState('0.35');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">System & Inference Parameters</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Tune high-resolution aerial orthorectification, tiling patch dimensions, and GPU runtime parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tiling Parameters */}
        <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-white">Tiling & Rotated NMS</h3>
          
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Tile Patch Size (px)</label>
            <input
              type="text"
              value={tileSize}
              onChange={(e) => setTileSize(e.target.value)}
              className="w-full bg-[#111218] border border-white/[0.1] text-xs text-white rounded-xl p-2.5 outline-none font-mono focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">Default: 1024x1024 (DOTA standard)</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Overlap Gap (px)</label>
            <input
              type="text"
              value={overlap}
              onChange={(e) => setOverlap(e.target.value)}
              className="w-full bg-[#111218] border border-white/[0.1] text-xs text-white rounded-xl p-2.5 outline-none font-mono focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">Overlap margin between contiguous tiles (200px)</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Rotated NMS IoU Threshold</label>
            <input
              type="text"
              value={iouThreshold}
              onChange={(e) => setIouThreshold(e.target.value)}
              className="w-full bg-[#111218] border border-white/[0.1] text-xs text-white rounded-xl p-2.5 outline-none font-mono focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">Polygon IoU threshold to deduplicate tile boundaries</span>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Preferences Saved' : 'Save Parameters'}</span>
          </button>
        </div>

        {/* Runtime Environment & Hardware */}
        <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-white">Hardware & Storage Inventory</h3>

          <div className="p-4 bg-black/40 border border-white/[0.06] rounded-2xl space-y-2.5 text-xs text-zinc-300">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Inference Hardware</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
                NVIDIA RTX 3050 (6GB)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Acceleration Backend</span>
              <span className="font-semibold text-white">PyTorch 2.6.0 + CUDA 12.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Dataset Root</span>
              <span className="font-mono text-[11px] text-zinc-300">P:\Projects\AeroSight\DOTAv1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Weights Destination</span>
              <span className="font-mono text-[11px] text-indigo-400">P:\Projects\AeroSight\ml\weights\best.pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Audit Database</span>
              <span className="font-mono text-[11px] text-zinc-300">SQLite (aerosight.db)</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Real-time inference is fully active on local GPU. Tiled sliding windows are executed with automatic memory management to guarantee zero Out-Of-Memory exceptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
