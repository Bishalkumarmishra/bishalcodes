'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { 
  ArrowLeft, Camera, Download, ExternalLink, Copy, Check, 
  Loader2, AlertCircle, Monitor, Tablet, Smartphone, Settings 
} from 'lucide-react';

type PresetType = 'desktop' | 'tablet' | 'mobile' | 'custom';

export const ScreenshotStudio: React.FC = () => {
  const { navigate } = useNavigation();

  const [url, setUrl] = useState('');
  const [preset, setPreset] = useState<PresetType>('desktop');
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(800);
  const [fullPage, setFullPage] = useState(false);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [dpr, setDpr] = useState<'1' | '2' | '3' | '4' | '5'>('3');
  const [omitBackground, setOmitBackground] = useState(false);
  const [waitUntil, setWaitUntil] = useState<'load' | 'networkidle0' | 'networkidle2'>('networkidle2');
  const [waitForTimeout, setWaitForTimeout] = useState<'0' | '1000' | '3000' | '5000'>('1000');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync sliders when presets change
  useEffect(() => {
    if (preset === 'desktop') {
      setWidth(1280);
      setHeight(800);
    } else if (preset === 'tablet') {
      setWidth(768);
      setHeight(1024);
    } else if (preset === 'mobile') {
      setWidth(375);
      setHeight(812);
    }
  }, [preset]);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Validate URL structure
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
      setUrl(formattedUrl);
    }

    setLoading(true);
    setError('');
    setPreviewUrl(null);

    try {
      const queryParams = new URLSearchParams({
        url: formattedUrl,
        width: width.toString(),
        height: height.toString(),
        fullPage: fullPage.toString(),
        format,
        dpr,
        waitUntil,
        waitForTimeout,
        omitBackground: omitBackground.toString()
      });

      const responseUrl = `/api/screenshot?${queryParams.toString()}`;
      
      // Pre-fetch the screenshot to ensure it renders correctly and check for errors
      const testRes = await fetch(responseUrl);
      if (!testRes.ok) {
        const errData = await testRes.json();
        throw new Error(errData.error || 'Failed to capture screenshot.');
      }

      setPreviewUrl(responseUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to capture screenshot. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanUrl}_screenshot_${width}x${height}.${format}`;
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download the screenshot. Please try again.');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      if (format !== 'png') {
        alert('Copying is only supported for PNG format. Please switch to PNG and capture again to copy.');
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      alert('Failed to copy the image to clipboard. Check browser permissions.');
    }
  };

  // Sync variables for native site themes - force absolute black OLED background
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');

    root.style.setProperty('--body-bg', '#000000', 'important');
    root.style.setProperty('--html-bg', '#000000', 'important');
    root.style.setProperty('--nav-bg', '#000000', 'important');
    root.style.setProperty('--nav-border', 'rgba(255, 255, 255, 0.08)', 'important');
    root.style.setProperty('--nav-text', '#94a3b8', 'important');
    root.style.setProperty('--nav-text-hover', '#ffffff', 'important');

    return () => {
      root.style.removeProperty('--body-bg');
      root.style.removeProperty('--html-bg');
      root.style.removeProperty('--nav-bg');
      root.style.removeProperty('--nav-border');
      root.style.removeProperty('--nav-text');
      root.style.removeProperty('--nav-text-hover');
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    };
  }, []);

  return (
    <div 
      style={{ 
        background: '#000000', 
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.06) 0%, transparent 65%),
          linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }} 
      className="min-h-screen pt-20 pb-16 relative overflow-hidden w-full flex flex-col items-center justify-center text-white"
    >
      <div className="w-full max-w-none px-4 md:px-8 xl:px-12 z-20 flex flex-col">
        {/* Back Button & Header */}
        <div className="flex flex-col gap-4 mb-10 text-left">
          <button 
            onClick={() => navigate('services')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors outline-none w-fit"
          >
            <ArrowLeft size={14} /> Back to Tools
          </button>
          
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              Screenshot <span className="text-[#a855f7]">Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl font-medium leading-relaxed">
              Capture high-resolution screenshots of any web page. Completely client-side, responsive presets, and full scroll captures at $0 server cost.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* ── Configuration Panel ── */}
          <form 
            onSubmit={handleCapture}
            className="lg:col-span-4 rounded-3xl bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 space-y-6 text-left shadow-xl"
          >
            {/* Target URL */}
            <div className="space-y-2">
              <label htmlFor="url" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Website URL</label>
              <div className="relative">
                <input 
                  type="text" 
                  id="url"
                  placeholder="e.g. wikipedia.org"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#a855f7] transition-all"
                  required
                />
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Device Preset</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'desktop', icon: <Monitor size={14} />, label: 'Desk' },
                  { type: 'tablet', icon: <Tablet size={14} />, label: 'Tab' },
                  { type: 'mobile', icon: <Smartphone size={14} />, label: 'Mob' },
                  { type: 'custom', icon: <Settings size={14} />, label: 'User' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setPreset(item.type as PresetType)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                      preset === item.type 
                        ? 'border-[#a855f7] bg-[#a855f7]/10 text-white' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.icon}
                    <span className="mt-1">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution sliders (always adjustable) */}
            <div className="space-y-4 pt-2 border-t border-slate-800/60">
              {/* Width Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Width</span>
                  <span className="text-white font-mono">{width}px</span>
                </div>
                <input 
                  type="range" 
                  min="320" 
                  max="2560" 
                  value={width} 
                  onChange={(e) => {
                    setWidth(parseInt(e.target.value));
                    setPreset('custom');
                  }}
                  className="w-full accent-[#a855f7] bg-slate-950 cursor-pointer h-1.5 rounded-full outline-none"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Height</span>
                  <span className="text-white font-mono">{height}px</span>
                </div>
                <input 
                  type="range" 
                  min="320" 
                  max="1600" 
                  value={height} 
                  disabled={fullPage}
                  onChange={(e) => {
                    setHeight(parseInt(e.target.value));
                    setPreset('custom');
                  }}
                  className={`w-full accent-[#a855f7] bg-slate-950 cursor-pointer h-1.5 rounded-full outline-none ${
                    fullPage ? 'opacity-40 pointer-events-none' : ''
                  }`}
                />
              </div>
            </div>

            {/* Additional parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-800/60">
              {/* Full page switch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Page scrolling</span>
                  <span className="text-[9px] text-slate-500 font-semibold block">Captures entire scrolling layout</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fullPage}
                    onChange={(e) => setFullPage(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a855f7] peer-checked:after:bg-white peer-checked:after:border-[#a855f7]"></div>
                </label>
              </div>

              {/* Format Dropdown */}
              <div className="space-y-2">
                <label htmlFor="format" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Output Format</label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                >
                  <option value="png">PNG (Lossless / High quality)</option>
                  <option value="jpeg">JPEG (Smaller file size)</option>
                  <option value="webp">WebP (Modern compression / High quality)</option>
                </select>
              </div>

              {/* Quality Dropdown */}
              <div className="space-y-2">
                <label htmlFor="dpr" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capture Quality</label>
                <select
                  id="dpr"
                  value={dpr}
                  onChange={(e) => setDpr(e.target.value as '1' | '2' | '3' | '4' | '5')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                >
                  <option value="1">Standard Quality (1x DPR)</option>
                  <option value="2">High Quality Retina (2x DPR)</option>
                  <option value="3">Ultra Extreme Quality (3x DPR - Super High-Res)</option>
                  <option value="4">Extra Crisp Pro (4x DPR - Ultra HD)</option>
                  <option value="5">Insane Extreme Quality (5x DPR - Ultimate HD)</option>
                </select>
              </div>

              {/* Transparent background (PNG/WebP only) */}
              {format !== 'jpeg' && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transparent Background</span>
                    <span className="text-[9px] text-slate-500 font-semibold block">Omit page default background</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={omitBackground}
                      onChange={(e) => setOmitBackground(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a855f7] peer-checked:after:bg-white peer-checked:after:border-[#a855f7]"></div>
                  </label>
                </div>
              )}

              {/* Advanced Settings Toggle */}
              <div className="pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-[#a855f7] hover:underline flex items-center gap-1.5 focus:outline-none"
                >
                  <Settings size={12} className={showAdvanced ? 'rotate-45 transition-transform' : 'transition-transform'} />
                  {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-slate-800/60">
                  {/* Wait Until Dropdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="waitUntil" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Readiness Event</label>
                      <span className="text-[9px] text-slate-500 font-mono">waitUntil</span>
                    </div>
                    <select
                      id="waitUntil"
                      value={waitUntil}
                      onChange={(e) => setWaitUntil(e.target.value as 'load' | 'networkidle0' | 'networkidle2')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                    >
                      <option value="networkidle0">Network Idle (Fully Loaded)</option>
                      <option value="networkidle2">Network Idle Light (Mainly Loaded)</option>
                      <option value="load">Document Loaded (Fastest / Standard)</option>
                    </select>
                  </div>

                  {/* Render Delay Dropdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="waitForTimeout" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extra Render Delay</label>
                      <span className="text-[9px] text-slate-500 font-mono">waitForTimeout</span>
                    </div>
                    <select
                      id="waitForTimeout"
                      value={waitForTimeout}
                      onChange={(e) => setWaitForTimeout(e.target.value as '0' | '1000' | '3000' | '5000')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#a855f7]"
                    >
                      <option value="0">No delay (Instant capture)</option>
                      <option value="1000">1 Second (Wait for webfonts/widgets)</option>
                      <option value="3000">3 Seconds (Wait for slider animations)</option>
                      <option value="5000">5 Seconds (Wait for charts/lazy assets)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Capture CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-extrabold text-xs uppercase tracking-wider text-black bg-[#a855f7] hover:bg-[#b56ef8] disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-[0_4px_25px_rgba(168,85,247,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Screenshot...
                </>
              ) : (
                <>
                  <Camera size={14} />
                  Capture Website
                </>
              )}
            </button>
          </form>

          {/* ── Preview Sandbox ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Error Message */}
            {error && (
              <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-3 text-left">
                <AlertCircle size={18} className="text-rose-500 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Showcase Mockup Frame */}
            <div className="w-full aspect-[16/10] rounded-[28px] border border-slate-800 bg-slate-950/50 flex flex-col overflow-hidden shadow-2xl relative">
              {/* Top Chrome Window Bar */}
              <div className="w-full h-11 bg-slate-950 border-b border-slate-900 flex items-center px-4 justify-between select-none">
                {/* Traffic buttons */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                </div>
                {/* Address bar */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-lg text-[10px] text-slate-500 font-semibold px-12 py-1 max-w-sm truncate text-center select-none">
                  {url ? url.replace(/^https?:\/\//i, '') : 'screenshot-studio://preview'}
                </div>
                <div className="w-12" />
              </div>

              {/* Showcase Frame Content */}
              <div className="flex-1 flex items-center justify-center relative p-6 overflow-y-auto">
                {loading && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="text-[#a855f7] animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Loading website frame...</p>
                  </div>
                )}

                {!loading && !previewUrl && !error && (
                  <div className="text-center space-y-3 max-w-xs">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-xl text-slate-500">
                      💻
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">No Capture Ready</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Input a valid website URL on the left panel and click "Capture Website" to render the screenshot preview here.
                      </p>
                    </div>
                  </div>
                )}

                {previewUrl && (
                  <div className="w-full h-full flex justify-center items-start overflow-y-auto rounded-xl">
                    <img 
                      src={previewUrl} 
                      alt="Captured Website Preview" 
                      className="max-w-full h-auto object-contain rounded-lg border border-slate-800 shadow-xl"
                      style={{ maxHeight: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            {previewUrl && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution</p>
                  <p className="text-xs font-bold text-white mt-0.5">{width} x {height} px ({format.toUpperCase()})</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {/* Open in New Tab */}
                  <a 
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition-all"
                  >
                    <ExternalLink size={13} /> Open
                  </a>

                  {/* Copy Image (only PNG supported by browser ClipboardItem) */}
                  {format === 'png' && (
                    <button 
                      onClick={handleCopyToClipboard}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-bold transition-all"
                    >
                      {copied ? (
                        <><Check size={13} className="text-[#a855f7]" /> Copied</>
                      ) : (
                        <><Copy size={13} /> Copy</>
                      )}
                    </button>
                  )}

                  {/* Download Screenshot */}
                  <button 
                    onClick={handleDownload}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-black bg-[#a855f7] hover:bg-[#b56ef8] rounded-xl text-xs font-extrabold transition-all shadow-[0_4px_15px_rgba(168,85,247,0.15)]"
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="screenshot-studio" />

    </div>
  );
};

export default ScreenshotStudio;
