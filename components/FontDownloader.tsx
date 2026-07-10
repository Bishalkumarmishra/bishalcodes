import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Download, Search, CheckSquare, Square, Loader2, Type, Info, FileDown, ArrowLeft } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

import { allFontsDB, FontItem } from './fontData';

export default function FontDownloader() {
  const { navigate } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedFontIds, setSelectedFontIds] = useState<string[]>([]);
  const [previewText, setPreviewText] = useState('Bishal Codes फन्ट नेपाल');
  const [fontSize, setFontSize] = useState<number>(18);
  const [loadedPreviews, setLoadedPreviews] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{
    status: 'idle' | 'fetching' | 'zipping' | 'done' | 'error';
    current: number;
    total: number;
    fontName: string;
  }>({ status: 'idle', current: 0, total: 0, fontName: '' });

  const [deepLinkedFont, setDeepLinkedFont] = useState<FontItem | null>(null);

  const handleLoadPreview = (font: FontItem) => {
    if (loadedPreviews.includes(font.id)) return;
    if (typeof window !== 'undefined' && 'FontFace' in window) {
      const ff = new FontFace(`font-preview-${font.id}`, `url(${font.url})`);
      ff.load().then(loaded => {
        document.fonts.add(loaded);
        setLoadedPreviews(prev => [...prev, font.id]);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    allFontsDB.slice(0, 12).forEach(f => handleLoadPreview(f));

    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts[0] === 'tools' && parts[1] === 'font-downloader' && parts[2]) {
        const fontId = parts[2];
        const found = allFontsDB.find(f => f.id === fontId);
        if (found) {
          setDeepLinkedFont(found);
          const ff = new FontFace(`font-preview-${found.id}`, `url(${found.url})`);
          ff.load().then(loaded => {
            document.fonts.add(loaded);
            setLoadedPreviews(prev => [...prev, found.id]);
          }).catch(() => {});
        }
      }
    }
  }, []);

  const filteredFonts = allFontsDB.filter(font => {
    const matchSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        font.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory === 'all' ||
                     font.category === activeCategory ||
                     (activeCategory === 'english' && font.category !== 'nepali');
    return matchSearch && matchCat;
  });

  const toggleSelectFont = (id: string) => {
    setSelectedFontIds(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredFonts.map(f => f.id);
    const allSel = visibleIds.every(id => selectedFontIds.includes(id));
    if (allSel) {
      setSelectedFontIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedFontIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleDownloadZip = async (fonts: FontItem[], zipName: string) => {
    if (!fonts.length) return;
    setDownloadProgress({ status: 'fetching', current: 0, total: fonts.length, fontName: fonts[0].name });
    const zip = new JSZip();
    let count = 0;
    for (let i = 0; i < fonts.length; i++) {
      const font = fonts[i];
      setDownloadProgress(p => ({ ...p, current: i, fontName: font.name }));
      try {
        const res = await fetch(font.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        zip.file(font.fileName, await res.blob());
        count++;
      } catch {}
    }
    if (!count) {
      setDownloadProgress(p => ({ ...p, status: 'error', fontName: 'All downloads failed.' }));
      return;
    }
    setDownloadProgress(p => ({ ...p, status: 'zipping', fontName: 'Packaging ZIP...' }));
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = zipName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadProgress(p => ({ ...p, status: 'done', current: count, fontName: `Downloaded ${count} fonts successfully!` }));
    } catch {
      setDownloadProgress(p => ({ ...p, status: 'error', fontName: 'Failed to package ZIP.' }));
    }
  };

  const handleDownloadSingle = async (font: FontItem) => {
    try {
      const res = await fetch(font.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = font.fileName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(`Could not download ${font.name}. Check your internet connection.`);
    }
  };

  const isDownloading = downloadProgress.status === 'fetching' || downloadProgress.status === 'zipping';

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[73px] sm:pt-[85px]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-[73px] sm:top-[85px] z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">

        {/* Title row */}
        <div className="w-full px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('services')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg shrink-0"
              title="Back to Tools"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
              <FileDown size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate">System Fonts Archive &amp; Downloader</h2>
              <p className="text-[10px] text-slate-400 hidden sm:block">1100 real fonts — Nepali &amp; English. Browse, preview, and batch download to your computer.</p>
            </div>
          </div>
          <button
            onClick={() => handleDownloadZip(allFontsDB, 'all_1100_nepali_english_fonts.zip')}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow transition-all shrink-0"
          >
            {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Download All 1100
          </button>
        </div>

        {/* Progress bar */}
        {downloadProgress.status !== 'idle' && (
          <div className="px-5 pb-2.5">
            <div className="flex justify-between items-center text-[10px] font-semibold mb-1">
              <span className="text-slate-600 dark:text-slate-300 truncate">{downloadProgress.fontName}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {downloadProgress.status === 'fetching' && (
                  <span className="text-slate-500">{downloadProgress.current}/{downloadProgress.total}</span>
                )}
                {downloadProgress.status === 'done' && <span className="text-emerald-600">✓ Done</span>}
                {downloadProgress.status === 'error' && <span className="text-rose-600">✗ Failed</span>}
                <button onClick={() => setDownloadProgress({ status: 'idle', current: 0, total: 0, fontName: '' })} className="text-slate-400 hover:text-slate-600 text-[9px] underline">dismiss</button>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${downloadProgress.status === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${downloadProgress.status === 'done' ? 100 : downloadProgress.status === 'zipping' ? 95 : downloadProgress.total > 0 ? (downloadProgress.current / downloadProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div className="w-full px-5 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">

            {/* Preview text */}
            <div className="relative flex-1 min-w-[140px] max-w-[260px]">
              <input
                type="text"
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder="Preview text..."
                className="w-full pl-7 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-white"
              />
              <Type size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Size */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold">{fontSize}px</span>
              <input type="range" min="12" max="48" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-20 accent-indigo-600 h-1" />
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Search */}
            <div className="relative shrink-0">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-32 text-xs pl-7 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-lg outline-none text-slate-700 dark:text-white focus:border-indigo-500 transition-all"
              />
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'All', value: 'all' },
                { label: 'Nepali', value: 'nepali' },
                { label: 'English', value: 'english' },
                { label: 'Sans-Serif', value: 'sans-serif' },
                { label: 'Serif', value: 'serif' },
                { label: 'Mono', value: 'monospace' },
                { label: 'Script', value: 'handwriting' }
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    activeCategory === cat.value
                      ? 'bg-slate-900 text-white dark:bg-indigo-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deep-linked Font Detail Deck ── */}
      {deepLinkedFont && (
        <div className="px-5 pt-5 pb-1">
          <div className="w-full bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-amber-400/50 rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-400/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="space-y-3 w-full md:max-w-2xl min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Direct Download</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{deepLinkedFont.category}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{deepLinkedFont.name}</h3>
              <p className="text-xs text-slate-400 font-mono truncate">{deepLinkedFont.fileName} · {deepLinkedFont.size} · {deepLinkedFont.license} License</p>
              
              {/* Preview */}
              <div className="py-4 border-y border-dashed border-slate-200 dark:border-slate-800 flex items-center min-h-[64px] overflow-hidden">
                <p style={loadedPreviews.includes(deepLinkedFont.id) ? { fontFamily: `font-preview-${deepLinkedFont.id}`, fontSize: '24px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { fontSize: '24px' }} className="text-slate-900 dark:text-white w-full">
                  {previewText || deepLinkedFont.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => {
                  setDeepLinkedFont(null);
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/tools/font-downloader');
                  }
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-all text-center"
              >
                Show All Fonts
              </button>
              <button
                onClick={() => handleDownloadSingle(deepLinkedFont)}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg transition-all"
              >
                <Download size={14} /> Download {deepLinkedFont.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Selection Bar ── */}
      {selectedFontIds.length > 0 && (
        <div className="w-full bg-slate-900 text-white px-5 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={13} className="text-indigo-400" />
            <span className="text-xs font-bold">{selectedFontIds.length} selected</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedFontIds([])} className="px-3 py-1 border border-slate-700 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all">
              Clear
            </button>
            <button
              onClick={() => handleDownloadZip(allFontsDB.filter(f => selectedFontIds.includes(f.id)), `selected_${selectedFontIds.length}_fonts.zip`)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-[10px] font-bold text-white transition-all"
            >
              <Download size={10} /> Download Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable Font Grid ── */}
      <div className="flex-1 w-full px-5 py-5">

        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {filteredFonts.length} of {allFontsDB.length} fonts
          </p>
          <button
            onClick={handleSelectAllVisible}
            className="text-[10px] text-indigo-600 hover:underline font-bold"
          >
            {filteredFonts.every(f => selectedFontIds.includes(f.id)) ? 'Deselect All Visible' : 'Select All Visible'}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredFonts.length > 0 ? filteredFonts.map(font => {
            const isSelected = selectedFontIds.includes(font.id);
            const isLoaded = loadedPreviews.includes(font.id);
            const previewStyle: React.CSSProperties = isLoaded
              ? { fontFamily: `font-preview-${font.id}`, fontSize: `${fontSize}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              : { fontSize: `${fontSize}px` };

            return (
              <div
                key={font.id}
                onMouseEnter={() => handleLoadPreview(font)}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
                  isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <button
                      onClick={() => toggleSelectFont(font.id)}
                      className="shrink-0 mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {isSelected ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{font.name}</h4>
                      <p className="text-[9px] text-slate-400 truncate">{font.fileName}</p>
                    </div>
                  </div>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                    {font.category}
                  </span>
                </div>

                {/* Preview area */}
                <div className="py-3 border-y border-dashed border-slate-100 dark:border-slate-800 flex items-center min-h-[56px] overflow-hidden">
                  {isLoaded ? (
                    <p style={previewStyle} className="text-slate-900 dark:text-white w-full">
                      {previewText || font.name}
                    </p>
                  ) : (
                    <div className="w-full flex justify-between items-center">
                      <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">hover to preview</span>
                      <button onClick={() => handleLoadPreview(font)} className="text-[9px] text-indigo-500 hover:underline font-bold">Load</button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400">{font.size} · <span className="uppercase font-bold">{font.license}</span></span>
                  <button
                    onClick={() => handleDownloadSingle(font)}
                    className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                  >
                    <Download size={10} /> Download
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Search className="mx-auto text-slate-200 dark:text-slate-700 mb-3" size={36} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching fonts</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term or category.</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4 text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5"><Info size={12} /> Font Notes</p>
          <p>• <strong>Legacy (Preeti, Kantipur):</strong> Preview won't match Devanagari typing — they use English-key mapping for layout.</p>
          <p>• <strong>Unicode (Mangal, Kalimati, Google Fonts):</strong> Supports direct Devanagari rendering.</p>
          <p>• <strong>Installing:</strong> Unzip → double-click a <code>.ttf</code> → click <em>Install Font</em> on Windows/macOS.</p>
        </div>
      </div>
    </div>
  );
}
