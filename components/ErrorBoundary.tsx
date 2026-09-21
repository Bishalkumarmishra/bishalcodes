'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/widgets/calendar';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#e52521]/20 border border-[#e52521]/40 flex items-center justify-center text-[#e52521] mb-6 shadow-xl text-3xl">
            📅
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2">Mero Patro - Nepali Calendar</h1>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            The application experienced a temporary loading issue. Tap below to reload the calendar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              Reload App
            </button>
            <button
              onClick={this.handleGoHome}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-700 active:scale-95"
            >
              Open Calendar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
