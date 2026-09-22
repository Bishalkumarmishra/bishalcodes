'use client';

import React, { useState } from 'react';
import { ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';

export default function ShareMarketTool() {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 space-y-4 pb-8 font-sans">
      {/* Light Clean Header Banner */}
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e52521] text-white font-semibold text-xs flex items-center gap-1">
                <TrendingUp size={13} /> Live Stock Market
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                NEPSE • Live Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Live NEPSE Share Market &amp; Portfolio Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Real-time NEPSE stock market index, market pressure gauge, top gainers, top losers, sector performance, and portfolio analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Live Data"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            <a
              href="https://laganisutra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Live Portal</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Full Width Embedded Portal Container with Clean Branding Mask */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 h-[calc(100vh-220px)] min-h-[750px]">
        {/* CSS Brand Mask covering the iframe's top-left logo area */}
        <div className="absolute top-0 left-0 z-10 w-[240px] h-[64px] bg-[#ffffff] dark:bg-[#0f172a] border-b border-r border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2.5 shadow-xs select-none">
          <div className="w-8 h-8 rounded-xl bg-[#e52521] text-white flex items-center justify-center font-black text-xs shadow-xs">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">NEPSE Live</div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Share Market</div>
          </div>
        </div>

        {/* CSS Mask covering iframe's bottom-left contact, socials & download links */}
        <div className="hidden md:flex absolute bottom-0 left-0 z-10 w-[240px] h-[210px] bg-[#f8fafc] dark:bg-[#0f172a] border-t border-r border-slate-200/80 dark:border-slate-800 p-4 flex-col justify-between shadow-xs select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live NEPSE Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time trading indices, market pressure, floor sheets &amp; portfolio metrics.
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-[#e52521]">BishalCodes Suite</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">LIVE</span>
          </div>
        </div>

        <iframe
          key={iframeKey}
          src="https://laganisutra.com/"
          className="w-full h-full border-0"
          title="Live NEPSE Share Market Portal"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
