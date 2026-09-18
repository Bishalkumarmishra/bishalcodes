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
                NEPSE • Lagani Sutra™
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Live NEPSE Share Market & Portfolio Portal
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
              <span>Open Lagani Sutra</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Full Width Embedded Portal Container */}
      <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 h-[calc(100vh-220px)] min-h-[750px]">
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
