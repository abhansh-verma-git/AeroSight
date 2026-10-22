import React from 'react';
import { Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto px-8 py-3.5 border-t border-white/[0.06] bg-[#0e0f15]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2 select-none">
      <div className="flex items-center gap-2 text-zinc-400">
        <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <span>
          Prototype for academic demonstration. Detects object types only and does not identify military vs civilian assets.
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine Online (CUDA Active)</span>
        </div>
        <span className="text-zinc-600 font-mono">AeroSight v1.0.0</span>
      </div>
    </footer>
  );
};
