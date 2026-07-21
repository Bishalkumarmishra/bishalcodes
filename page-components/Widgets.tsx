import React, { useState } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { Copy, Check, Calendar, ArrowRightLeft, Code, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import DesktopDownloadModal from '../components/DesktopDownloadModal';

const EMBEDDABLE_TOOLS = [
  { id: 'date-converter', name: 'Date Converter (BS ↔ AD)', path: '/widgets/date-converter' },
  { id: 'calendar', name: 'Nepali Calendar', path: '/widgets/calendar' },
  { id: 'currency-converter', name: 'Live Currency Exchange Rate Converter', path: '/tools/currency-converter?embed=true' },
  { id: 'currency-calculator', name: 'Currency Calculator', path: '/tools/currency-calculator?embed=true' },
  { id: 'translator', name: 'Multi-Language Text & Speech Translator', path: '/tools/translator?embed=true' },
  { id: 'pdf-to-image', name: 'PDF to Image Converter', path: '/tools/pdf-to-image?embed=true' },
  { id: 'dev-card-studio', name: 'Developer Card & Banner Studio', path: '/tools/dev-card-studio?embed=true' },
  { id: 'add-page-numbers', name: 'PDF Page Number Adder', path: '/tools/add-page-numbers?embed=true' },
  { id: 'merge-pdf', name: 'PDF Merger Tool', path: '/tools/merge-pdf?embed=true' },
  { id: 'jpg-to-pdf', name: 'JPG to PDF Converter', path: '/tools/jpg-to-pdf?embed=true' },
  { id: 'image-compressor', name: 'Smart Image Compressor', path: '/tools/image-compressor?embed=true' },
  { id: 'qr-studio', name: 'QR Code Generator Studio', path: '/tools/qr-studio?embed=true' },
  { id: 'json-formatter', name: 'JSON Formatter & Validator', path: '/tools/json-formatter?embed=true' },
  { id: 'diff-checker', name: 'Text & Code Diff Checker', path: '/tools/diff-checker?embed=true' },
  { id: 'code-runner', name: 'Online Code Runner & Compiler', path: '/tools/code-runner?embed=true' },
  { id: 'screenshot-studio', name: 'Website Screenshot Studio', path: '/tools/screenshot-studio?embed=true' },
  { id: 'file-transfer', name: 'P2P File Transfer (100GB)', path: '/tools/file-transfer?embed=true' },
  { id: 'secure-vault', name: 'Zero-Knowledge Secure Vault', path: '/tools/secure-vault?embed=true' },
  { id: 'ocr-converter', name: 'AI Image OCR Text Extractor', path: '/tools/ocr-converter?embed=true' },
  { id: 'bg-remover', name: 'AI Background Remover', path: '/tools/bg-remover?embed=true' },
  { id: 'scan-pdf', name: 'Document Camera Scanner', path: '/tools/scan-pdf?embed=true' },
  { id: 'typing-practice', name: 'Typing Studio Tutor', path: '/tools/typing-practice?embed=true' },
  { id: 'font-downloader', name: 'Google Font Downloader', path: '/tools/font-downloader?embed=true' },
  { id: 'emi-calculator', name: 'Loan & EMI Calculator', path: '/tools/emi-calculator?embed=true' }
];

export default function Widgets() {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>('date-converter');
  const [sizePreset, setSizePreset] = useState<'small' | 'medium' | 'full' | 'custom'>('medium');
  
  // Custom Dimension State
  const [customWidth, setCustomWidth] = useState<number>(360);
  const [customHeight, setCustomHeight] = useState<number>(550);

  // Copy status
  const [copied, setCopied] = useState<boolean>(false);

  const selectedTool = EMBEDDABLE_TOOLS.find(t => t.id === selectedToolId) || EMBEDDABLE_TOOLS[0];

  // Get current dimensions based on preset
  const getDimensions = () => {
    switch (sizePreset) {
      case 'small':
        return { width: 300, height: 450 };
      case 'medium':
        return { width: 420, height: 600 };
      case 'full':
        return { width: 800, height: 650 };
      default:
        return { width: customWidth, height: customHeight };
    }
  };

  const { width, height } = getDimensions();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com';
  const widgetUrl = `${origin}${selectedTool.path}`;
  const embedCode = `<!-- Bishal Codes Embeddable Widget: ${selectedTool.name} -->
<iframe src="${widgetUrl}" frameborder="0" style="border: 1px solid #e2e8f0; border-radius:16px; width: ${width}px; height: ${height}px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);" title="${selectedTool.name}"></iframe>
<div style="font-size:11px; text-align:right; font-family:sans-serif; margin-top:4px; color:#64748b;">
  Powered by <a href="https://bishalcodes.com" target="_blank" style="color:#059669; font-weight:bold; text-decoration:none;">Bishal Codes</a> © 2026 Bishal Mishra
</div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadDesktopApp = async () => {
    setIsDownloadModalOpen(true);
    try {
      const metricRef = doc(db, 'desktop_app_metrics', 'downloads');
      await updateDoc(metricRef, {
        count: increment(1)
      }).catch(async (err) => {
        if (err.code === 'not-found') {
          await setDoc(metricRef, { count: 1 });
        }
      });
    } catch (err) {
      console.error("Error tracking download", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between select-none">
      <Navbar />

      <main className="w-full px-[5vw] mx-auto pt-28 pb-16 flex-grow">
        
        {/* Page Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            Webmaster Integrations
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Embeddable Widgets &amp; Tools
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Embed any of our 24 responsive developer utilities on your blog, web app, or site with a 1-click HTML snippet including copyright attribution.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block - Customizer Configuration */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Code size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Select &amp; Customize Tool Widget</span>
            </h3>

            {/* 1. Widget Tool Dropdown Selection */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Choose Embeddable Tool ({EMBEDDABLE_TOOLS.length} Available)</label>
              <select
                value={selectedToolId}
                onChange={(e) => setSelectedToolId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 cursor-pointer"
              >
                {EMBEDDABLE_TOOLS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Size Preset Selection */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Widget Dimension Presets</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'small', label: 'Compact (300px)' },
                  { id: 'medium', label: 'Medium (420px)' },
                  { id: 'full', label: 'Wide (800px)' },
                  { id: 'custom', label: 'Custom' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSizePreset(preset.id as any)}
                    className={`text-center py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      sizePreset === preset.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
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
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Width (px)</span>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Math.max(220, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Height (px)</span>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Math.max(250, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 4. Generated Copy Code Box */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Copy HTML iFrame Code</label>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Includes Copyright
                </span>
              </div>
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-3.5 text-slate-200 text-xs font-mono select-all overflow-x-auto whitespace-pre leading-relaxed">
                {embedCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
              >
                {copied ? <Check size={14} className="text-emerald-400 dark:text-white" /> : <Copy size={14} />}
                {copied ? 'HTML Snippet Copied!' : 'Copy Embed Code'}
              </button>
            </div>

            {/* Standalone Desktop App Section */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 space-y-3">
              <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Desktop Integration</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-base">💻</span> Standalone Windows App
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  Want the Nepali Calendar directly on your Windows desktop? Download our desktop app with system tray widget integration and offline support.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://apps.microsoft.com/detail/9PJVV2J32KNP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    🛍️ Get from Microsoft Store
                  </a>
                  <a
                    href="/downloads/NepaliCalendar-Setup-v1.6.0.zip"
                    download
                    onClick={handleDownloadDesktopApp}
                    className="inline-flex w-full items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2 px-4 rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    💾 Direct ZIP Installer
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block - Live Widget Preview Frame */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Live Widget Preview</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                {width}px × {height}px
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-4 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl overflow-auto border border-slate-200/60 dark:border-slate-800/60 min-h-[480px]">
              <div 
                style={{ width: `${width}px`, height: `${height}px` }} 
                className="bg-white dark:bg-slate-950 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-all flex flex-col justify-between"
              >
                <iframe
                  title={`Preview of ${selectedTool.name}`}
                  src={widgetUrl}
                  className="w-full h-full border-0"
                />
                <div className="bg-slate-950 text-white text-[10px] py-1.5 px-3 flex items-center justify-between border-t border-slate-800">
                  <span>Powered by <strong className="text-emerald-400 font-bold">Bishal Codes</strong></span>
                  <span className="text-slate-400">© 2026 Bishal Mishra</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Standalone Desktop Download Modal */}
      <DesktopDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
