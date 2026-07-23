'use client';
import React, { useState, useRef, useCallback } from 'react';
import { FileText, Loader2, ChevronRight, KeyRound, AlertCircle, Scissors, Layers, AlignJustify, LayoutGrid, Plus, X, CheckCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';

// ─── Types ────────────────────────────────────────────────────────────────────
type SplitMode = 'range' | 'fixed' | 'pages';
type RangeMode = 'custom' | 'fixed-range';

interface PageRange {
  id: string;
  from: number;
  to: number;
}

// ─── Page Thumbnail ───────────────────────────────────────────────────────────
const PageThumb: React.FC<{ pageNum: number; thumb?: string; selected?: boolean }> = ({ pageNum, thumb, selected }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`relative w-[76px] h-[100px] rounded-lg overflow-hidden border-2 transition-all shadow-sm ${
      selected ? 'border-[#e52521] shadow-red-200 dark:shadow-red-900/30' : 'border-slate-200 dark:border-slate-700'
    }`}>
      {thumb ? (
        <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <FileText size={22} className="text-slate-300 dark:text-slate-600" />
        </div>
      )}
      {selected && (
        <div className="absolute top-1 right-1">
          <div className="w-4 h-4 rounded-full bg-[#e52521] flex items-center justify-center">
            <CheckCircle size={10} className="text-white" strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{pageNum}</span>
  </div>
);

// ─── Range Row ────────────────────────────────────────────────────────────────
const RangeRow: React.FC<{
  range: PageRange; index: number; totalPages: number;
  onUpdate: (id: string, field: 'from' | 'to', value: number) => void;
  onRemove: (id: string) => void; showRemove: boolean;
}> = ({ range, index, totalPages, onUpdate, onRemove, showRemove }) => (
  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-14 shrink-0">Range {index + 1}</span>
    <div className="flex items-center gap-1.5 flex-1 flex-wrap">
      <span className="text-xs text-slate-400 shrink-0">from page</span>
      <input type="number" min={1} max={range.to} value={range.from}
        onChange={e => onUpdate(range.id, 'from', Math.max(1, Math.min(Number(e.target.value), range.to)))}
        className="w-14 text-center text-sm font-bold border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/40 focus:border-[#e52521]"
      />
      <span className="text-xs text-slate-400">to</span>
      <input type="number" min={range.from} max={totalPages} value={range.to}
        onChange={e => onUpdate(range.id, 'to', Math.max(range.from, Math.min(Number(e.target.value), totalPages)))}
        className="w-14 text-center text-sm font-bold border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/40 focus:border-[#e52521]"
      />
    </div>
    {showRemove && (
      <button onClick={() => onRemove(range.id)} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0">
        <X size={13} />
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const SplitPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();

  // Step: 'upload' | 'configure' | 'done'
  const [step, setStep] = useState<'upload' | 'configure' | 'done'>('upload');

  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [thumbsLoading, setThumbsLoading] = useState(false);

  // Split config
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [rangeMode, setRangeMode] = useState<RangeMode>('custom');
  const [ranges, setRanges] = useState<PageRange[]>([{ id: '1', from: 1, to: 1 }]);
  const [fixedInterval, setFixedInterval] = useState(1);
  const [mergeRanges, setMergeRanges] = useState(false);

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
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

      const res = await fetch('/api/split-pdf-internal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf: base64, pages: Array.from({ length: 15 }, (_, i) => i + 1) }),
      });

      if (!res.ok) throw new Error('Failed to read PDF.');
      const data = await res.json();
      const total = data.totalPages || 0;
      setTotalPages(total);
      setThumbs(data.thumbs || {});
      setRanges([{ id: '1', from: 1, to: total }]);
      setFixedInterval(1);
      setStep('configure');
    } catch (err: any) {
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setThumbsLoading(false);
    }
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
    setError(null);
    loadPdfInfo(file);
  }, [loadPdfInfo]);

  const addRange = () => {
    const last = ranges[ranges.length - 1];
    const newFrom = Math.min(last.to + 1, totalPages);
    setRanges(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), from: newFrom, to: totalPages }]);
  };

  const updateRange = (id: string, field: 'from' | 'to', value: number) =>
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const removeRange = (id: string) => setRanges(prev => prev.filter(r => r.id !== id));

  const processSplit = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      setProcessStep('Preparing PDF...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      setProcessStep('Splitting PDF on server...');
      const payload: any = { pdf: base64, filename: pdfName, mode: splitMode, mergeRanges };
      if (splitMode === 'range') payload.ranges = ranges.map(r => ({ from: r.from, to: r.to }));
      if (splitMode === 'fixed') payload.fixedInterval = fixedInterval;
      if (splitMode === 'fixed-range' as any) { payload.mode = 'fixed'; payload.fixedInterval = fixedInterval; }

      const res = await fetch('/api/split-pdf-internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Split operation failed.');
      }

      setProcessStep('Preparing download...');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const isZip = res.headers.get('Content-Type')?.includes('zip');
      const outName = pdfName.replace(/\.pdf$/i, '') + (isZip ? '_split_pages.zip' : '_split.pdf');

      setDownloadUrl(url);
      setDownloadName(outName);
      setStep('done');

      // Auto-download
      const link = document.createElement('a');
      link.href = url; link.download = outName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err: any) {
      setError(`Split failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setPdfFile(null); setPdfName(''); setTotalPages(0); setThumbs({});
    setRanges([{ id: '1', from: 1, to: 1 }]); setError(null);
    setDownloadUrl(null); setDownloadName(''); setStep('upload');
  };

  // Determine which pages are "selected" (in any range)
  const isPageSelected = (p: number) => {
    if (splitMode === 'pages') return true;
    if (splitMode === 'range' || splitMode === 'fixed') {
      if (rangeMode === 'custom') return ranges.some(r => p >= r.from && p <= r.to);
      // fixed-range: highlight chunks of fixedInterval
      const chunkStart = Math.floor((p - 1) / fixedInterval) * fixedInterval + 1;
      return chunkStart <= totalPages;
    }
    return true;
  };

  // ─── STEP 3: Download ───────────────────────────────────────────────────────
  if (step === 'done' && downloadUrl) {
    return (
      <div className="w-full font-sans">
        <ToolDownloadStep
          title="Your PDF has been split successfully!"
          downloadUrl={downloadUrl}
          downloadFileName={downloadName}
          onReset={handleReset}
        />
        <SeoGuideSection toolId="split-pdf" />
      </div>
    );
  }

  // ─── STEP 1: Upload ─────────────────────────────────────────────────────────
  if (step === 'upload' || thumbsLoading) {
    return (
      <div className="w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-4 flex items-center">
          <button onClick={() => navigate('services')} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
            &larr; Back to Services
          </button>
        </div>

        {thumbsLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Loader2 size={40} className="animate-spin text-[#e52521]" />
            <p className="text-sm font-semibold text-slate-500">Reading PDF pages...</p>
          </div>
        ) : (
          <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
            <ToolHeroUpload
              title="Split PDF"
              description="Separate one PDF into multiple files by custom page ranges, fixed intervals, or extract every single page."
              buttonText="Select PDF file"
              dropText="or drop PDF file here"
              accept=".pdf"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              error={error}
            />
          </div>
        )}

        <SeoGuideSection toolId="split-pdf" />
      </div>
    );
  }

  // ─── STEP 2: Configure + Split ──────────────────────────────────────────────
  return (
    <div className="w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* ── Top back bar ── */}
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-6 flex items-center justify-between">
        <button onClick={handleReset} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
          &larr; Upload New
        </button>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs">{pdfName}</p>
          <p className="text-xs text-slate-400">{totalPages} pages · {pdfFile ? formatSize(pdfFile.size) : ''}</p>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
        <div className="flex flex-col xl:flex-row gap-8">

          {/* ── Left: Page thumbnails ── */}
          <div className="flex-1">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
              Preview — {totalPages} pages
            </h2>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PageThumb key={p} pageNum={p} thumb={thumbs[p]} selected={isPageSelected(p)} />
              ))}
            </div>
          </div>

          {/* ── Right: Split config panel ── */}
          <div className="w-full xl:w-[380px] shrink-0">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl sticky top-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-5">Split</h2>

              {/* Mode tabs */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { key: 'range', label: 'Range', icon: <AlignJustify size={15} /> },
                  { key: 'pages', label: 'Pages', icon: <LayoutGrid size={15} /> },
                  { key: 'fixed', label: 'Fixed', icon: <Layers size={15} /> },
                ].map(m => (
                  <button key={m.key} onClick={() => setSplitMode(m.key as SplitMode)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      splitMode === m.key
                        ? 'bg-[#e52521]/5 border-[#e52521] text-[#e52521]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >{m.icon}{m.label}</button>
                ))}
              </div>

              {/* ── Range mode ── */}
              {splitMode === 'range' && (
                <div className="space-y-3 mb-5">
                  <div className="flex gap-2 mb-3">
                    {(['custom', 'fixed-range'] as RangeMode[]).map(rm => (
                      <button key={rm} onClick={() => setRangeMode(rm)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          rangeMode === rm ? 'bg-[#e52521]/5 border-[#e52521] text-[#e52521]' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >{rm === 'custom' ? 'Custom' : 'Fixed'}</button>
                    ))}
                  </div>

                  {rangeMode === 'custom' ? (
                    <>
                      {ranges.map((r, i) => (
                        <RangeRow key={r.id} range={r} index={i} totalPages={totalPages || 999}
                          onUpdate={updateRange} onRemove={removeRange} showRemove={ranges.length > 1} />
                      ))}
                      <button onClick={addRange}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#e52521] text-slate-400 hover:text-[#e52521] text-xs font-bold transition-all cursor-pointer">
                        <Plus size={13} /> Add Range
                      </button>
                    </>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Split every N pages</p>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={totalPages} value={fixedInterval}
                          onChange={e => setFixedInterval(Math.max(1, Number(e.target.value)))}
                          className="w-16 text-center text-base font-black border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/40" />
                        <span className="text-xs text-slate-400">pages per chunk · ~{totalPages ? Math.ceil(totalPages / fixedInterval) : '?'} files</span>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={mergeRanges} onChange={e => setMergeRanges(e.target.checked)} className="w-4 h-4 accent-[#e52521] cursor-pointer" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Merge all ranges into one PDF file</span>
                  </label>
                </div>
              )}

              {/* ── Fixed mode ── */}
              {splitMode === 'fixed' && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pages per file</p>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={totalPages} value={fixedInterval}
                      onChange={e => setFixedInterval(Math.max(1, Number(e.target.value)))}
                      className="w-16 text-center text-base font-black border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]/40" />
                    <span className="text-xs text-slate-400">pages per file · ~{totalPages ? Math.ceil(totalPages / fixedInterval) : '?'} files created</span>
                  </div>
                </div>
              )}

              {/* ── Pages mode ── */}
              {splitMode === 'pages' && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5">
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Extract every page</p>
                  <p className="text-xs text-slate-400 leading-relaxed">All {totalPages} pages extracted as individual PDFs, packaged into a ZIP archive.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400 mb-4">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 animate-pulse mb-4">
                  <Loader2 size={13} className="animate-spin text-[#e52521]" />
                  {processStep}
                </div>
              )}

              {/* Split button */}
              <button onClick={processSplit} disabled={isProcessing || totalPages === 0}
                className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white py-4 rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                {isProcessing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Splitting...</>
                  : <><Scissors size={18} /> Split PDF <ChevronRight size={16} strokeWidth={3} /></>
                }
              </button>

              {/* Privacy note */}
              <div className="flex gap-2 mt-4 text-xs text-slate-400">
                <KeyRound size={12} className="text-[#e52521] shrink-0 mt-0.5" />
                <span>Files are processed securely and deleted immediately after splitting.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="split-pdf" />
    </div>
  );
};

export default SplitPdfConverter;
