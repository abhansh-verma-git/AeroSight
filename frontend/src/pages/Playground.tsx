import React from 'react';
import { Sparkles } from 'lucide-react';
import { Detect } from './Detect';

export const Playground: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-zinc-900 border border-purple-500/30 text-white p-6 rounded-[28px] shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold tracking-tight">AI Surveillance Playground</h2>
        </div>
        <p className="text-xs text-purple-200/80 max-w-xl">
          Experiment with rotated bounding box inference, multi-tile overlap parameters, and real-time class filters on custom aerial orthophotos.
        </p>
      </div>

      <Detect />
    </div>
  );
};
