import React from 'react';
import { Layers, Gauge } from 'lucide-react';

export const Comparison: React.FC = () => {
  const modelComparisons = [
    {
      name: 'best.pt (Custom Trained)',
      params: '3.1M',
      gflops: '8.3',
      map50: '64.4%',
      fps: '34.5 FPS',
      latency: '29.0 ms',
      memory: '225 MB VRAM',
      recommendedFor: 'Trained on DOTA v1.0 custom split with high recall on planes and maritime vessels.'
    },
    {
      name: 'yolov8n-obb.pt (Pretrained Nano)',
      params: '3.1M',
      gflops: '8.3',
      map50: '54.2%',
      fps: '38.0 FPS',
      latency: '26.3 ms',
      memory: '220 MB VRAM',
      recommendedFor: 'Ultra-lightweight edge deployment on UAVs and embedded NVIDIA Jetson platforms.'
    },
    {
      name: 'yolov8s-obb.pt (Pretrained Small)',
      params: '11.4M',
      gflops: '28.7',
      map50: '58.9%',
      fps: '22.0 FPS',
      latency: '45.5 ms',
      memory: '480 MB VRAM',
      recommendedFor: 'Higher capacity backbone for small vehicle and congested urban reconnaissance.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Model Architecture Comparison</h2>
        </div>
        <p className="text-xs text-zinc-400">
          Side-by-side benchmark comparison between custom trained weights and baseline YOLO-OBB architectures
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modelComparisons.map((m, idx) => (
          <div
            key={m.name}
            className={`p-6 rounded-[28px] border transition-all ${
              idx === 0
                ? 'bg-gradient-to-br from-indigo-950/70 via-[#181924] to-[#12131b] border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30'
                : 'bg-[#181924]/80 backdrop-blur-md border-white/[0.08] shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                idx === 0
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/[0.06] text-zinc-400 border border-white/[0.06]'
              }`}>
                {idx === 0 ? 'CURRENT BEST' : 'BASELINE'}
              </span>
              <Gauge className="w-4 h-4 text-zinc-500" />
            </div>

            <h3 className="font-bold text-base text-white mb-1">{m.name}</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{m.recommendedFor}</p>

            <div className="space-y-3 py-4 border-t border-white/[0.06] text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">mAP @ 0.50</span>
                <span className="font-black text-indigo-400 text-sm">{m.map50}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Throughput</span>
                <span className="font-bold text-white">{m.fps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Latency</span>
                <span className="font-bold text-white">{m.latency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Parameters</span>
                <span className="font-bold text-zinc-200">{m.params}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">GFLOPs</span>
                <span className="font-bold text-zinc-200">{m.gflops}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">GPU VRAM</span>
                <span className="font-bold text-emerald-400">{m.memory}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
