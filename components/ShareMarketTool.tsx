'use client';

import React, { useState } from 'react';
import { ExternalLink, RefreshCw, Maximize2, Minimize2, TrendingUp, ShieldCheck, Sparkles, Share2 } from 'lucide-react';

export default function ShareMarketTool() {
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#e52521] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                <TrendingUp size={12} /> Live Stock Market
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                NEPSE • Lagani Sutra™
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              Live NEPSE Share Market & Portfolio Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track real-time NEPSE indices, stock market pressure gauges, top gainers, top losers, sector analysis, and company portfolios in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Live Data"
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="https://laganisutra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Lagani Sutra</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Interactive Embedded Portal */}
      <div className={`relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-black transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen' : 'h-[750px] sm:h-[850px]'
      }`}>
        <iframe
          key={iframeKey}
          src="https://laganisutra.com/"
          className="w-full h-full border-0"
          title="Lagani Sutra Live NEPSE Share Market Portal"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
