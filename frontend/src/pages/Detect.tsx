import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Scan,
  Download,
  AlertTriangle,
  RefreshCw,
  FileImage,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { detectObjects, getSamples } from '../services/api';
import type { DetectionResult, SampleItem } from '../types';

const DOTA_CLASSES = [
  "plane", "ship", "storage-tank", "baseball-diamond", "tennis-court",
  "basketball-court", "ground-track-field", "harbor", "bridge", "large-vehicle",
  "small-vehicle", "helicopter", "roundabout", "soccer-ball-field", "swimming-pool"
];

const CLASS_BADGE_COLORS: Record<string, string> = {
  "plane": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "ship": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "storage-tank": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "baseball-diamond": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "tennis-court": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "basketball-court": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "ground-track-field": "bg-lime-500/20 text-lime-400 border-lime-500/30",
  "harbor": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "bridge": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "large-vehicle": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "small-vehicle": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "helicopter": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "roundabout": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "soccer-ball-field": "bg-green-500/20 text-green-400 border-green-500/30",
  "swimming-pool": "bg-sky-500/20 text-sky-400 border-sky-500/30"
};

export const Detect: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [showSampleModal, setShowSampleModal] = useState(false);

  // Settings
  const [conf, setConf] = useState<number>(0.25);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Results & Loading
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSamples().then(setSamples).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedSample(null);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleSelectSample = (sample: SampleItem) => {
    setSelectedSample(sample.filename);
    setSelectedFile(null);
    setPreviewUrl(sample.url);
    setResult(null);
    setError(null);
    setShowSampleModal(false);
  };

  const toggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleRunDetection = async () => {
    if (!selectedFile && !selectedSample) {
      setError('Please select or upload an aerial image first.');
      return;
    }

    setLoading(true);
    setLoadingProgress(15);
    setError(null);

    const progressTimer = setInterval(() => {
      setLoadingProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 250);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (selectedSample) {
        formData.append('sample_filename', selectedSample);
      }
      formData.append('conf', conf.toString());
      formData.append('iou', '0.45');
      if (selectedClasses.length > 0) {
        formData.append('classes', selectedClasses.join(','));
      }

      const res = await detectObjects(formData);
      clearInterval(progressTimer);
      setLoadingProgress(100);
      setResult(res);
    } catch (err: any) {
      clearInterval(progressTimer);
      setError(err.message || 'Detection failed');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const downloadAnnotatedImage = () => {
    if (!result?.annotated_image_base64) return;
    const link = document.createElement('a');
    link.href = result.annotated_image_base64;
    link.download = `aerosight_detected_${result.filename || 'image.jpg'}`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-zinc-100">
      {/* Top Banner and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Oriented Object Detection</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              YOLO-OBB Live
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tiled 1024px inference with rotated bounding box NMS across tile boundaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSampleModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] rounded-full flex items-center gap-1.5 transition-colors"
          >
            <FileImage className="w-4 h-4 text-zinc-400" />
            <span>Try sample image</span>
          </button>
          <button
            onClick={handleRunDetection}
            disabled={loading || (!selectedFile && !selectedSample)}
            className="px-6 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
            <span>{loading ? 'Processing Tiles...' : 'Run Detection'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Image Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration & Upload Area */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Target Image</h3>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/[0.1] hover:border-indigo-500 hover:bg-indigo-500/[0.05] rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.04] text-zinc-400 flex items-center justify-center border border-white/[0.06]">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-xs font-semibold text-zinc-200">
                {selectedFile ? selectedFile.name : selectedSample ? `Sample: ${selectedSample}` : 'Drop aerial image or click to browse'}
              </div>
              <p className="text-[11px] text-zinc-500">Supports JPG, PNG, TIFF up to 25MB</p>
            </div>

            {/* Confidence Slider */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-zinc-300">Confidence Threshold</span>
                <span className="text-xs font-bold text-indigo-400">{Math.round(conf * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={conf}
                onChange={(e) => setConf(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>More Detections (10%)</span>
                <span>High Precision (90%)</span>
              </div>
            </div>
          </div>

          {/* Class Filter Chips */}
          <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">DOTA Class Filter</h3>
              </div>
              {selectedClasses.length > 0 && (
                <button
                  onClick={() => setSelectedClasses([])}
                  className="text-[10px] font-bold text-indigo-400 hover:underline"
                >
                  Clear ({selectedClasses.length})
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">
              Leave all unselected to detect all 15 classes.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {DOTA_CLASSES.map((cls) => {
                const isSelected = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() => toggleClass(cls)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-[#12131c] hover:bg-white/[0.06] text-zinc-300 border-white/[0.06]'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detection Results Side Panel */}
          {result && (
            <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="text-xs text-zinc-400">Total Detections</span>
                  <div className="text-2xl font-black text-white">{result.total_detections}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">Inference Latency</span>
                  <div className="text-sm font-bold text-indigo-400">{result.latency_ms} ms</div>
                </div>
              </div>

              {/* Per-Class Counts */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
                  Per-Class Counts
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(result.counts).length === 0 ? (
                    <p className="text-xs text-zinc-500">No objects exceeded the confidence threshold.</p>
                  ) : (
                    Object.entries(result.counts).map(([cls, count]) => (
                      <div key={cls} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                        <span className="font-semibold text-zinc-300 capitalize">{cls}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CLASS_BADGE_COLORS[cls] || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                          {count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={downloadAnnotatedImage}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Annotated Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Large Image Canvas & Result Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#181924]/80 backdrop-blur-md p-6 rounded-[28px] border border-white/[0.08] shadow-lg min-h-[500px] flex flex-col justify-between">
            {/* Viewport Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {result ? 'Annotated Oriented Bounding Boxes (OBB)' : 'Image Preview'}
                </span>
                {result?.alert_triggered && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Alert Triggered</span>
                  </span>
                )}
              </div>
              {result && (
                <div className="text-xs text-zinc-400">
                  Model: <span className="font-mono font-semibold text-indigo-400">{result.model_name}</span>
                </div>
              )}
            </div>

            {/* Image Canvas / Viewport */}
            <div className="relative w-full flex-1 bg-[#0a0b10] border border-white/[0.06] rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px]">
              {loading && (
                <div className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4 text-white p-6 text-center">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Processing Tiled Aerial Inference...</h4>
                    <p className="text-xs text-zinc-400 mt-1">Slicing into 1024x1024 patches & merging rotated NMS</p>
                  </div>
                  <div className="w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {result?.annotated_image_base64 ? (
                <img
                  src={result.annotated_image_base64}
                  alt="AeroSight Detection"
                  className="max-h-[600px] w-auto object-contain rounded-xl shadow-2xl"
                />
              ) : previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Target Preview"
                    className="max-h-[500px] w-auto object-contain rounded-xl opacity-90 shadow-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handleRunDetection}
                      className="bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xl shadow-indigo-600/40 backdrop-blur-sm transition-all"
                    >
                      Click 'Run Detection' to Analyze
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-zinc-500">
                  <Scan className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No aerial scene loaded</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Upload an image or pick a sample from the validation split.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Picker Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181924] border border-white/[0.1] rounded-3xl p-6 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Select Sample Aerial Image</h3>
                <p className="text-xs text-zinc-400">High-resolution validation scenes from DOTA v1.0</p>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded-full"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto py-2">
              {samples.map((s) => (
                <div
                  key={s.filename}
                  onClick={() => handleSelectSample(s)}
                  className="group relative border border-white/[0.08] hover:border-indigo-500 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg bg-black/40"
                >
                  <img
                    src={s.url}
                    alt={s.filename}
                    className="h-28 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-2.5">
                    <span className="text-[11px] font-bold text-zinc-200 truncate block">
                      {s.filename}
                    </span>
                    <span className="text-[10px] text-zinc-500">{s.size_kb} KB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
