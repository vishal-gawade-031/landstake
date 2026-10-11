'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Satellite,
  Layers,
  Cpu,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  Building,
} from 'lucide-react';

export default function SatelliteAiPage() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [selectedCase, setSelectedCase] = useState('CASE_1');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-900/50">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              Future Scope & Computer Vision Prototype
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Satellite Temporal Change Detection
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Demonstrates prospective integration of high-resolution remote sensing (Cartosat-3 / Sentinel-2)
              with deep learning segmentation models (ResNet-UNet) for automated detection of illegal encroachment,
              unauthorized conversion, and wetland degradation.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs space-y-1">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Academic Demo Interface
            </p>
            <p className="text-slate-400 text-[11px]">
              Simulated optical change comparison with deterministic computer vision pipeline placeholder.
            </p>
          </div>
        </div>

        {/* 1. PIPELINE ARCHITECTURE FLOW */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span>AI/ML Image Processing Architecture Pipeline</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold">1</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Multi-Spectral Satellite Tiles</p>
              <p className="text-[10px] text-slate-400 mt-1">0.5m RGB + NIR</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Orthorectification & Co-reg</p>
              <p className="text-[10px] text-slate-400 mt-1">Sub-pixel spatial alignment</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Temporal Difference Engine</p>
              <p className="text-[10px] text-slate-400 mt-1">Normalized Diff Index (NDVI)</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 font-bold">4</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">CNN Feature Segmentation</p>
              <p className="text-[10px] text-slate-400 mt-1">Built-up footprint mask</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 font-bold">5</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Cadastral Boundary Cross-Check</p>
              <p className="text-[10px] text-slate-400 mt-1">Compare with ULPIN zoning</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">6</div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Officer Verification Notice</p>
              <p className="text-[10px] text-slate-400 mt-1">Automatic alert dispatch</p>
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE BEFORE / AFTER SLIDER WORKBENCH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Visual Slider Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Optical Imagery Temporal Comparison (Before vs After)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-600">Left: 2022 Baseline</span>
                <span>|</span>
                <span className="font-semibold text-red-600">Right: 2026 Detection</span>
              </div>
            </div>

            {/* Simulated Satellite Comparison Box */}
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700 select-none bg-slate-950">
              {/* After Layer (Full width behind) */}
              <div
                className="absolute inset-0 bg-cover bg-center flex flex-col justify-between p-4"
                style={{
                  background:
                    'radial-gradient(circle at 60% 40%, #1e293b 0%, #0f172a 100%)',
                }}
              >
                {/* Synthetic Imagery Artwork: After (With construction) */}
                <div className="w-full h-full relative flex items-center justify-center">
                  {/* Grid Lines simulating cadastral boundaries */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Parcel Polygon Outlines */}
                  <div className="w-64 h-56 border-2 border-dashed border-red-500 bg-red-500/10 rounded-lg relative flex items-center justify-center">
                    <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-red-400 bg-slate-900/80 px-2 py-0.5 rounded">
                      KA-BLG-001-000104
                    </span>

                    {/* Detected Unauthorized Structure Box */}
                    <div className="w-36 h-28 bg-slate-700/80 border-2 border-red-500 rounded shadow-lg flex flex-col items-center justify-center p-2 text-center">
                      <Building className="w-6 h-6 text-red-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white mt-1">UNAUTHORIZED WAREHOUSE</span>
                      <span className="text-[9px] text-red-300">Footprint: 1,120 sq.m</span>
                    </div>

                    <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                      AI Anomaly Detected (96.4%)
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end text-[11px] font-mono text-slate-400 z-10">
                  <span>Cartosat-3 Pan-Sharpened • 2026-02-18</span>
                  <span className="text-red-400 font-bold">CURRENT DETECTED STATE</span>
                </div>
              </div>

              {/* Before Layer (Clipped by slider position) */}
              <div
                className="absolute inset-y-0 left-0 bg-cover bg-center overflow-hidden border-r-2 border-white shadow-2xl flex flex-col justify-between p-4"
                style={{
                  width: `${sliderPosition}%`,
                  background:
                    'radial-gradient(circle at 40% 40%, #14532d 0%, #064e3b 60%, #022c22 100%)',
                }}
              >
                {/* Synthetic Imagery Artwork: Before (Open Agriculture / Green) */}
                <div className="w-full h-full relative flex items-center justify-center min-w-[320px]">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#86efac_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Parcel Polygon Outlines */}
                  <div className="w-64 h-56 border-2 border-emerald-400 bg-emerald-500/20 rounded-lg relative flex items-center justify-center">
                    <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded">
                      KA-BLG-001-000104
                    </span>

                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <span className="text-xs font-bold text-emerald-200">ACTIVE AGRICULTURAL CROPLAND</span>
                      <span className="text-[10px] text-emerald-300 mt-1">NDVI Index: 0.78 (Healthy Crop)</span>
                      <span className="text-[9px] text-emerald-400">Zero Built-up Concrete</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end text-[11px] font-mono text-emerald-300 z-10 min-w-[260px]">
                  <span>Sentinel-2 L2A • 2022-03-10</span>
                  <span className="font-bold">BASELINE STATE</span>
                </div>
              </div>

              {/* Interactive Draggable Handle Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center text-xs font-bold">
                  ↔
                </div>
              </div>
            </div>

            {/* Slider Range Input */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Drag to Reveal 2022 Baseline State</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sliderPosition}%</span>
                <span>Drag to Reveal 2026 Resurvey</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Anomaly Inspection Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Detected Spatial Anomaly
                </h3>
                <p className="text-[11px] text-slate-400">Detection Ref: SAT-DET-2026-081</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Parcel:</span>
                  <Link href="/parcels/KA-BLG-001-000104" className="font-mono font-bold text-blue-600 hover:underline">
                    KA-BLG-001-000104
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorized Zoning:</span>
                  <span className="font-bold text-emerald-600">Agricultural Green Belt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Detected Feature:</span>
                  <span className="font-bold text-red-600">Commercial Warehouse Structure</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Area:</span>
                  <span className="font-bold font-mono">1,120 sq. meters (~0.28 Acres)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Confidence:</span>
                  <span className="font-bold font-mono text-purple-600">96.4%</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Presumptive Violation:</p>
                <p className="text-[11px] leading-relaxed">
                  Construction initiated without Section 95 Karnataka Land Revenue Act non-agricultural conversion
                  order. Recommended for joint verification by Tahasildar and Planning Authority.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => alert('Demo Action: Notice drafted under Section 96 KLR Act. Dispatched to registered owner.')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  Generate Officer Field Notice
                </button>
                <Link
                  href="/parcels/KA-BLG-001-000104"
                  className="block w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-center border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Inspect Parcel 360 &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
