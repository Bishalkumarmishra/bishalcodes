import React, { useState } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { Copy, Check, Calendar, ArrowRightLeft, Code, Eye } from 'lucide-react';

export default function Widgets() {
  const [widgetType, setWidgetType] = useState<'date-converter' | 'calendar'>('date-converter');
  const [sizePreset, setSizePreset] = useState<'small' | 'medium' | 'full' | 'custom'>('medium');
  
  // Custom Dimension State
  const [customWidth, setCustomWidth] = useState<number>(340);
  const [customHeight, setCustomHeight] = useState<number>(420);

  // Copy status
  const [copied, setCopied] = useState<boolean>(false);

  // Get current dimensions based on preset
  const getDimensions = () => {
    switch (sizePreset) {
      case 'small':
        return { width: 220, height: 380 };
      case 'medium':
        return { width: 340, height: 420 };
      case 'full':
        return { width: 800, height: 600 };
      default:
        return { width: customWidth, height: customHeight };
    }
  };

  const { width, height } = getDimensions();
  const widgetUrl = `${window.location.origin}/widgets/${widgetType}`;
  const embedCode = `<iframe src="${widgetUrl}" frameborder="0" scrolling="no" style="border: none; overflow: hidden; width: ${width}px; height: ${height}px;" allowtransparency="true"></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between select-none">
      <Navbar />

      <main className="w-full px-[5vw] mx-auto pt-28 pb-16 flex-grow">
        
        {/* Page Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] bg-[#9c3e1b]/10 text-[#9c3e1b] dark:bg-[#ebd6cc]/10 dark:text-[#ebd6cc] px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Webmaster Integrations
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Free Calendar & Converter Widgets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Embed our responsive Bikram Sambat calendar and Gregorian date converter widgets on your own blog, CMS, or website with just a single line of HTML code.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block - Customizer Configuration */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Code size={16} className="text-[#9c3e1b]" />
              <span>Customize Widget</span>
            </h3>

            {/* 1. Widget Type Selection */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Widget Template</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWidgetType('date-converter')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    widgetType === 'date-converter'
                      ? 'border-[#9c3e1b] bg-[#9c3e1b]/5 text-[#9c3e1b] font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowRightLeft size={14} />
                  <span>Date Converter</span>
                </button>
                <button
                  onClick={() => setWidgetType('calendar')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    widgetType === 'calendar'
                      ? 'border-[#9c3e1b] bg-[#9c3e1b]/5 text-[#9c3e1b] font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Calendar size={14} />
                  <span>Nepali Calendar</span>
                </button>
              </div>
            </div>

            {/* 2. Size Preset Selection */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Widget Dimensions Preset</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'small', label: 'Small Size (220px)' },
                  { id: 'medium', label: 'Medium Size (340px)' },
                  { id: 'full', label: 'Full Width (800px)' },
                  { id: 'custom', label: 'Custom Dimension' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSizePreset(preset.id as any)}
                    className={`text-center py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      sizePreset === preset.id
                        ? 'border-[#9c3e1b] bg-[#9c3e1b]/5 text-[#9c3e1b]'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Sizes input fields */}
            {sizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 text-left animate-fadeIn">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Width (px)</span>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(180, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b]"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Height (px)</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(200, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#9c3e1b]"
                  />
                </div>
              </div>
            )}

            {/* 4. Generated Copy Code Box */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Copy Embed Code</label>
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 pr-12 text-slate-800 dark:text-slate-200 text-xs font-mono select-all overflow-x-auto whitespace-pre leading-relaxed">
                {embedCode}
                <button
                  onClick={handleCopyCode}
                  className="absolute top-2.5 right-2.5 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg hover:scale-105 active:scale-95 transition-all text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer shadow-sm"
                  title="Copy Embed Code"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Simply copy and paste the HTML snippet above into your site's source code where you want the widget to appear.
              </p>
            </div>

          </div>

          {/* Right Block - Live Interactive Preview */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 px-2">
              <Eye size={16} className="text-[#9c3e1b]" />
              <span>Live Preview ({width}x{height}px)</span>
            </h3>

            {/* Preview Frame Container */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-sm p-4 flex items-center justify-center min-h-[460px] overflow-auto">
              <iframe
                key={`${widgetType}-${sizePreset}-${width}-${height}`} // force reload on change
                src={widgetUrl}
                frameBorder="0"
                scrolling="no"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)'
                }}
                {...({ allowtransparency: "true" } as any)}
              />
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
