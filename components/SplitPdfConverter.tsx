'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Download, Trash2, Plus, X, Loader2, ChevronRight, KeyRound, AlertCircle, Scissors, Layers, AlignJustify, LayoutGrid, CheckCircle, Move } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';

// ─── Types ────────────────────────────────────────────────────────────────────
type SplitMode = 'range' | 'fixed' | 'pages';
type RangeMode = 'custom' | 'fixed';

interface PageRange {
  id: string;
  from: number;
  to: number;
}

// ─── Page Thumbnail ───────────────────────────────────────────────────────────
const PageThumb: React.FC<{
  pageNum: number;
  thumb?: string;
  isLoading?: boolean;
  selected?: boolean;
  onClick?: () => void;
}> = ({ pageNum, thumb, isLoading, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`relative flex flex-col items-center gap-1.5 cursor-pointer group`}
  >
    <div className={`relative w-[90px] h-[120px] rounded-lg overflow-hidden border-2 transition-all shadow-md ${
      selected
        ? 'border-[#e52521] shadow-red-200 dark:shadow-red-900/40 scale-[1.04]'
        : 'border-slate-200 dark:border-slate-700 hover:border-[#e52521]/60'
    }`}>
      {isLoading ? (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      ) : thumb ? (
        <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <FileText size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 bg-[#e52521]/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#e52521] flex items-center justify-center">
            <CheckCircle size={14} className="text-white" />
          </div>
        </div>
      )}
    </div>
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{pageNum}</span>
  </div>
);

// ─── Range Row ────────────────────────────────────────────────────────────────
const RangeRow: React.FC<{
  range: PageRange;
  index: number;
  totalPages: number;
  onUpdate: (id: string, field: 'from' | 'to', value: number) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}> = ({ range, index, totalPages, onUpdate, onRemove, showRemove }) => (
  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 shrink-0">
      Range {index + 1}
    </span>
    <div className="flex items-center gap-2 flex-1">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">from page</span>
      <input
        type="number"
        min={1}
        max={range.to}
        value={range.from}
        onChange={e => onUpdate(range.id, 'from', Math.max(1, Math.min(Number(e.target.value), range.to)))}
        className="w-16 text-center text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/50 focus:border-[#e52521]"
      />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">to</span>
      <input
        type="number"
        min={range.from}
        max={totalPages}
        value={range.to}
        onChange={e => onUpdate(range.id, 'to', Math.max(range.from, Math.min(Number(e.target.value), totalPages)))}
        className="w-16 text-center text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/50 focus:border-[#e52521]"
      />
    </div>
    {showRemove && (
      <button
        onClick={() => onRemove(range.id)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const SplitPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();

  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split config state
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [rangeMode, setRangeMode] = useState<RangeMode>('custom');
  const [ranges, setRanges] = useState<PageRange[]>([{ id: '1', from: 1, to: 1 }]);
  const [fixedInterval, setFixedInterval] = useState(1);
  const [mergeRanges, setMergeRanges] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');
  const [done, setDone] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const loadPdfInfo = useCallback(async (file: File) => {
    setThumbsLoading(true);
    setThumbs({});
    setTotalPages(0);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // First load: get page count + first 10 thumbnails
      const res = await fetch('/api/split-pdf-internal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf: base64, pages: Array.from({ length: 10 }, (_, i) => i + 1) }),
      });

      if (!res.ok) throw new Error('Failed to read PDF info.');
      const data = await res.json();
      const total = data.totalPages || 0;
      setTotalPages(total);
      setThumbs(data.thumbs || {});

      // Update default range to cover all pages
      setRanges([{ id: '1', from: 1, to: total }]);
      setFixedInterval(1);

    } catch (err: any) {
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setThumbsLoading(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
    setDone(false);
    setDownloadUrl(null);
    loadPdfInfo(file);
  }, [loadPdfInfo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newFrom = Math.min(lastRange.to + 1, totalPages);
    setRanges(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      from: newFrom,
      to: totalPages,
    }]);
  };

  const updateRange = (id: string, field: 'from' | 'to', value: number) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRange = (id: string) => {
    setRanges(prev => prev.filter(r => r.id !== id));
  };

  const processSplit = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setError(null);
    setDone(false);
    setDownloadUrl(null);

    try {
      setStep('Preparing PDF for splitting...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      setStep('Splitting PDF on server...');
      const payload: any = {
        pdf: base64,
        filename: pdfName,
        mode: splitMode,
        mergeRanges,
      };

      if (splitMode === 'range') {
        payload.ranges = ranges.map(r => ({ from: r.from, to: r.to }));
      } else if (splitMode === 'fixed') {
        payload.fixedInterval = fixedInterval;
      }

      const res = await fetch('/api/split-pdf-internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Split operation failed.');
      }

      setStep('Preparing download...');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const isZip = res.headers.get('Content-Type')?.includes('zip');
      const outName = pdfName.replace(/\.pdf$/i, '') + (isZip ? '_split_pages.zip' : '_split.pdf');

      setDownloadUrl(url);
      setDownloadName(outName);
      setDone(true);

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = outName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(`Split failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setPdfFile(null);
    setPdfName('');
    setTotalPages(0);
    setThumbs({});
    setRanges([{ id: '1', from: 1, to: 1 }]);
    setError(null);
    setDone(false);
    setDownloadUrl(null);
  };

  // ─── Render: Upload Screen ─────────────────────────────────────────────────
  if (!pdfFile) {
    return (
      <div className="w-full font-sans">
        <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-4">
          <button onClick={() => navigate('services')} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
            &larr; Back to Services
          </button>
        </div>

        <div
          className="w-full px-4 md:px-8 xl:px-12 pb-16"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#e52521]/10 border-2 border-[#e52521]/30 flex items-center justify-center mb-6">
              <Scissors size={36} className="text-[#e52521]" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">Split PDF</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-10">
              Split PDFs by custom page ranges, fixed intervals, or extract every page individually.
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#e52521] rounded-3xl p-16 cursor-pointer transition-all group hover:bg-red-50/30 dark:hover:bg-red-950/10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#e52521]/10 flex items-center justify-center transition-colors">
                  <FileText size={32} className="text-slate-400 group-hover:text-[#e52521] transition-colors" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Select PDF file</p>
                  <p className="text-sm text-slate-400">or drop PDF file here</p>
                </div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </div>
        <SeoGuideSection toolId="split-pdf" />
      </div>
    );
  }

  // ─── Render: Split Configuration ───────────────────────────────────────────
  return (
    <div className="w-full font-sans min-h-screen bg-white dark:bg-slate-950">
      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="w-full px-4 md:px-8 xl:px-12 py-3 flex items-center justify-between gap-4">
          <button onClick={handleReset} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
            &larr; Upload New
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{pdfName}</p>
            <p className="text-xs text-slate-400">{totalPages} pages · {pdfFile ? formatSize(pdfFile.size) : ''}</p>
          </div>
          <button
            onClick={processSplit}
            disabled={isProcessing || totalPages === 0}
            className="bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Splitting...</>
            ) : (
              <><Scissors size={16} /> Split PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ── Left panel: Page thumbnails ──────────────────────────────────── */}
        <div className="flex-1 px-4 md:px-8 xl:px-10 py-8 overflow-y-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">
            Preview — {totalPages} pages
          </h2>
          {thumbsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#e52521]" />
                <p className="text-sm text-slate-400 font-medium">Loading page thumbnails...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                // Determine if page is in any range
                const inRange = splitMode === 'pages' ? true :
                  splitMode === 'range' ? ranges.some(r => pageNum >= r.from && pageNum <= r.to) :
                  true;
                return (
                  <PageThumb
                    key={pageNum}
                    pageNum={pageNum}
                    thumb={thumbs[pageNum]}
                    isLoading={!thumbs[pageNum] && thumbsLoading}
                    selected={inRange}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right panel: Split Config ─────────────────────────────────────── */}
        <div className="w-full lg:w-96 xl:w-[420px] shrink-0 bg-slate-50/80 dark:bg-slate-900/80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Split</h2>

            {/* Split mode tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'range', label: 'Range', icon: <AlignJustify size={16} /> },
                { key: 'pages', label: 'Pages', icon: <LayoutGrid size={16} /> },
                { key: 'fixed', label: 'Fixed', icon: <Layers size={16} /> },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setSplitMode(m.key as SplitMode)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    splitMode === m.key
                      ? 'bg-white dark:bg-slate-950 border-[#e52521] text-[#e52521] shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {/* ── Range mode ─────────────────────────────────────────────── */}
            {splitMode === 'range' && (
              <div className="space-y-4">
                {/* Custom / Fixed sub-tabs */}
                <div className="flex gap-2">
                  {(['custom', 'fixed'] as RangeMode[]).map(rm => (
                    <button
                      key={rm}
                      onClick={() => setRangeMode(rm)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer capitalize ${
                        rangeMode === rm
                          ? 'bg-white dark:bg-slate-950 border-[#e52521] text-[#e52521]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {rm}
                    </button>
                  ))}
                </div>

                {rangeMode === 'custom' ? (
                  <div className="space-y-3">
                    {ranges.map((r, i) => (
                      <RangeRow
                        key={r.id}
                        range={r}
                        index={i}
                        totalPages={totalPages || 999}
                        onUpdate={updateRange}
                        onRemove={removeRange}
                        showRemove={ranges.length > 1}
                      />
                    ))}
                    <button
                      onClick={addRange}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#e52521] text-slate-400 hover:text-[#e52521] text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus size={14} /> Add Range
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Split every N pages</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={fixedInterval}
                        onChange={e => setFixedInterval(Math.max(1, Number(e.target.value)))}
                        className="w-20 text-center text-lg font-black border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/50"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">pages per chunk</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Will create ~{totalPages ? Math.ceil(totalPages / fixedInterval) : '?'} PDF files
                    </p>
                  </div>
                )}

                {/* Merge all ranges option */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={mergeRanges}
                    onChange={e => setMergeRanges(e.target.checked)}
                    className="w-4 h-4 accent-[#e52521] cursor-pointer rounded"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    Merge all ranges into one PDF file
                  </span>
                </label>
              </div>
            )}

            {/* ── Fixed mode ──────────────────────────────────────────────── */}
            {splitMode === 'fixed' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pages per chunk</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={fixedInterval}
                      onChange={e => setFixedInterval(Math.max(1, Number(e.target.value)))}
                      className="w-20 text-center text-lg font-black border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/50"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">pages per file</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Will create ~{totalPages ? Math.ceil(totalPages / fixedInterval) : '?'} PDF files
                  </p>
                </div>
              </div>
            )}

            {/* ── Pages mode ──────────────────────────────────────────────── */}
            {splitMode === 'pages' && (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Extract every page</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each page will become its own individual PDF file. All {totalPages} pages will be packaged into a ZIP archive.
                </p>
              </div>
            )}

            {/* Processing step */}
            {isProcessing && (
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                <Loader2 size={14} className="animate-spin text-[#e52521]" />
                {step}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Success */}
            {done && downloadUrl && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-green-900 dark:text-green-300 mb-1">Split complete!</p>
                  <a
                    href={downloadUrl}
                    download={downloadName}
                    className="text-xs font-bold text-[#e52521] underline underline-offset-2 hover:text-[#d01f1c] cursor-pointer"
                  >
                    Download again ↓
                  </a>
                </div>
              </div>
            )}

            {/* Split button (bottom) */}
            <button
              onClick={processSplit}
              disabled={isProcessing || totalPages === 0}
              className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white py-4 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Splitting...</>
              ) : (
                <><Scissors size={18} /> Split PDF <ChevronRight size={16} strokeWidth={3} /></>
              )}
            </button>

            {/* Security note */}
            <div className="flex gap-2 text-xs text-slate-400 leading-relaxed">
              <KeyRound size={13} className="text-[#e52521] shrink-0 mt-0.5" />
              <span>Your files are processed securely and deleted immediately after splitting.</span>
            </div>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="split-pdf" />
    </div>
  );
};

export default SplitPdfConverter;
