'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';

export default function ShareMarketTool() {
  const [iframeKey, setIframeKey] = useState(0);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);

  // Dynamic Nepal NEPSE Market Hours Calculator (Asia/Kathmandu: UTC +5:45)
  // Sunday (0) to Thursday (4), 11:00 AM to 3:00 PM
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nepalTime = new Date(utc + (5.75 * 3600000));
      
      const day = nepalTime.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, 5 = Fri, 6 = Sat
      const totalMinutes = nepalTime.getHours() * 60 + nepalTime.getMinutes();
      
      const isTradingDay = day >= 0 && day <= 4;
      const isTradingHours = totalMinutes >= 660 && totalMinutes < 900; // 11:00 AM (660m) - 3:00 PM (900m)
      
      setIsMarketOpen(isTradingDay && isTradingHours);
    };

    checkMarketStatus();
    const timer = setInterval(checkMarketStatus, 15000); // Check every 15s
    return () => clearInterval(timer);
  }, []);

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
              <span className={`px-2.5 py-0.5 rounded-full text-white font-semibold text-xs flex items-center gap-1.5 ${
                isMarketOpen ? 'bg-emerald-600' : 'bg-[#e52521]'
              }`}>
                <span className="relative flex h-2 w-2">
                  {isMarketOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <TrendingUp size={13} />
                <span>{isMarketOpen ? 'NEPSE Market Open' : 'NEPSE Market Closed'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700">
                Trading Hours: Sun-Thu 11:00 AM - 3:00 PM
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
        {/* CSS Full-Width Header Mask covering the entire top bar of the iframe */}
        <div className="absolute top-0 left-0 right-0 z-10 w-full h-[64px] bg-[#ffffff] dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-xs select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#e52521] text-white flex items-center justify-center font-black text-xs shadow-xs">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                NEPSE Live
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#e52521]/10 text-[#e52521] font-semibold">
                  Real-Time
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Share Market Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dynamic Market Status Pill (Green when Open, Red when Closed) */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              isMarketOpen 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/50 border-red-200/80 dark:border-red-900/40 text-red-700 dark:text-red-300'
            }`}>
              <span className="relative flex h-2 w-2">
                {isMarketOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e52521]"></span>
                )}
              </span>
              <span>{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Refresh Live Market Data"
            >
              <RefreshCw size={14} />
            </button>

            <a
              href="https://laganisutra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Full Tab</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* CSS Desktop Mask covering iframe's bottom-left contact, socials & download links */}
        <div className="hidden md:flex absolute bottom-0 left-0 z-10 w-[240px] h-[270px] bg-[#f8fafc] dark:bg-[#0f172a] border-t border-r border-slate-200/80 dark:border-slate-800 p-4 flex-col justify-between shadow-xs select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isMarketOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e52521]"></span>
                )}
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {isMarketOpen ? 'Live NEPSE Feed' : 'NEPSE Market Closed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isMarketOpen 
                ? 'Real-time trading indices, market pressure, floor sheets & portfolio metrics.' 
                : 'Market trading is closed. Regular hours: Sun - Thu, 11:00 AM - 3:00 PM.'}
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-[#e52521]">BishalCodes Suite</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
              isMarketOpen 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}>
              {isMarketOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>

        {/* CSS Mobile Bottom Mask covering Lagani Sutra's mobile bottom navigation bar */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-10 w-full h-[62px] bg-[#ffffff] dark:bg-[#0f172a] border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 shadow-xs select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isMarketOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e52521]"></span>
              )}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isMarketOpen ? 'Market Open (Live)' : 'Market Closed'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
            <a
              href="https://laganisutra.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-[#e52521] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Tab</span>
              <ExternalLink size={11} />
            </a>
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
