import React, { useState } from 'react';
import {
  GitCompare,
  UploadCloud,
  FileImage,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { runChangeDetection } from '../services/api';
import type { ChangeDetectionResult } from '../types';

export const ChangeDetection: React.FC = () => {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [sampleBefore, setSampleBefore] = useState<string | null>(null);
  const [sampleAfter, setSampleAfter] = useState<string | null>(null);

  const [previewBefore, setPreviewBefore] = useState<string | null>(null);
  const [previewAfter, setPreviewAfter] = useState<string | null>(null);

  const [conf] = useState<number>(0.25);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ChangeDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'comparison' | 'before' | 'after'>('comparison');

  const handleLoadSamplePair = () => {
    setSampleBefore('airport_hangar.jpg');
    setSampleAfter('aircraft_runway.jpg');
    setBeforeFile(null);
    setAfterFile(null);
    setPreviewBefore('/api/samples/airport_hangar.jpg');
    setPreviewAfter('/api/samples/aircraft_runway.jpg');
    setResult(null);
    setError(null);
  };

  const handleRunChangeDetection = async () => {
    if ((!beforeFile && !sampleBefore) || (!afterFile && !sampleAfter)) {
      setError('Please provide both Before and After surveillance images.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (beforeFile) formData.append('before_file', beforeFile);
      else if (sampleBefore) formData.append('sample_before', sampleBefore);

      if (afterFile) formData.append('after_file', afterFile);
      else if (sampleAfter) formData.append('sample_after', sampleAfter);

      formData.append('conf', conf.toString());

      const res = await runChangeDetection(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Change detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Temporal Change Detection</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Bi-Temporal OBB
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Compare aerial captures across time to isolate new, missing, and persistent military/civilian structures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSamplePair}
            className="px-4 py-2 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] rounded-full flex items-center gap-1.5 transition-colors"
          >
            <FileImage className="w-4 h-4 text-zinc-400" />
            <span>Load Sample Pair</span>
          </button>
          <button
            onClick={handleRunChangeDetection}
            disabled={loading || ((!beforeFile && !sampleBefore) || (!afterFile && !sampleAfter))}
            className="px-6 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
            <span>{loading ? 'Analyzing Differences...' : 'Run Change Detection'}</span>
          </button>
        </div>
      </div>

      {/* Upload Dual Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slot 1: Before Image */}
        <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Temporal Capture A (Before)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-semibold border border-white/[0.06]">
              T0 Baseline
            </span>
          </div>

          <label className="border-2 border-dashed border-white/[0.1] hover:border-indigo-500 hover:bg-indigo-500/[0.05] rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 min-h-[160px]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setBeforeFile(e.target.files[0]);
                  setSampleBefore(null);
                  setPreviewBefore(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {previewBefore ? (
              <img src={previewBefore} alt="Before" className="max-h-36 object-contain rounded-lg shadow-md" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Upload Prior Surveillance Image</span>
                <span className="text-[10px] text-zinc-500">Baseline aerial reference frame</span>
              </>
            )}
          </label>
        </div>

        {/* Slot 2: After Image */}
        <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Temporal Capture B (After)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
              T1 Recent
            </span>
          </div>

          <label className="border-2 border-dashed border-white/[0.1] hover:border-indigo-500 hover:bg-indigo-500/[0.05] rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 min-h-[160px]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setAfterFile(e.target.files[0]);
                  setSampleAfter(null);
                  setPreviewAfter(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {previewAfter ? (
              <img src={previewAfter} alt="After" className="max-h-36 object-contain rounded-lg shadow-md" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-indigo-400" />
                <span className="text-xs font-semibold text-zinc-300">Upload Recent Surveillance Image</span>
                <span className="text-[10px] text-zinc-500">Target scene for delta extraction</span>
              </>
            )}
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#181924]/80 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs text-emerald-400 font-semibold">New Objects</span>
                <div className="text-2xl font-black text-white mt-0.5">+{result.summary.new_count}</div>
              </div>
              <PlusCircle className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="bg-[#181924]/80 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs text-rose-400 font-semibold">Missing Objects</span>
                <div className="text-2xl font-black text-white mt-0.5">-{result.summary.missing_count}</div>
              </div>
              <MinusCircle className="w-6 h-6 text-rose-400" />
            </div>

            <div className="bg-[#181924]/80 border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs text-zinc-400 font-semibold">Persistent Objects</span>
                <div className="text-2xl font-black text-white mt-0.5">{result.summary.unchanged_count}</div>
              </div>
              <CheckCircle className="w-6 h-6 text-zinc-400" />
            </div>

            <div className="bg-[#181924]/80 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs text-indigo-400 font-semibold">Dual Latency</span>
                <div className="text-2xl font-black text-white mt-0.5">{result.latency_ms} <span className="text-xs font-semibold text-zinc-400">ms</span></div>
              </div>
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          {/* Visualization Canvas + Delta Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Visualizer (2 cols) */}
            <div className="lg:col-span-2 bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Change Map Overlay</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Green = New
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    Red = Missing
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] p-1 rounded-full text-xs font-medium text-zinc-400">
                  <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      viewMode === 'comparison' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
                    }`}
                  >
                    Overlay
                  </button>
                  <button
                    onClick={() => setViewMode('before')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      viewMode === 'before' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
                    }`}
                  >
                    Before
                  </button>
                  <button
                    onClick={() => setViewMode('after')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      viewMode === 'after' ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-white'
                    }`}
                  >
                    After
                  </button>
                </div>
              </div>

              <div className="w-full bg-[#0a0b10] border border-white/[0.06] rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] p-2">
                <img
                  src={
                    viewMode === 'comparison'
                      ? result.annotated_comparison_base64
                      : viewMode === 'before'
                      ? result.before_annotated_base64
                      : result.after_annotated_base64
                  }
                  alt="Change Detection Result"
                  className="max-h-[550px] w-auto object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>

            {/* Delta Summary Table (1 col) */}
            <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-white mb-1">Per-Class Differences</h3>
                <p className="text-xs text-zinc-400 mb-4">Object count variances between T0 and T1</p>

                <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                  {Object.entries(result.class_deltas).map(([cls, data]) => {
                    const isInc = data.delta > 0;
                    const isDec = data.delta < 0;
                    return (
                      <div
                        key={cls}
                        className="p-3 bg-black/40 border border-white/[0.04] rounded-2xl flex items-center justify-between text-xs hover:border-white/[0.1] transition-colors"
                      >
                        <div>
                          <span className="font-bold text-zinc-200 capitalize block">{cls}</span>
                          <span className="text-[10px] text-zinc-500">
                            {data.before} &rarr; {data.after} units
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isInc
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : isDec
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {isInc ? `+${data.delta}` : data.delta}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] mt-4 text-center">
                <span className="text-[11px] text-zinc-500">
                  Confidence cutoff applied: {(conf * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
