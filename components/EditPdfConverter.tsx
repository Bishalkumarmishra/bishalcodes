'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText, Loader2, ChevronRight, KeyRound, AlertCircle, Type, Pencil,
  Square, Circle, Image as ImageIcon, Highlighter, Trash2, ZoomIn, ZoomOut,
  Maximize2, ChevronLeft, Bold, Italic, Check, Plus, Move, MousePointer
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolMode = 'select' | 'text' | 'draw' | 'rect' | 'circle' | 'image' | 'highlight';

interface TextOverlay {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  align: 'left' | 'center' | 'right';
  coverBackground?: boolean;
}

interface ShapeOverlay {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

interface DrawingOverlay {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
}

interface ImageOverlay {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  base64: string;
}

interface CoverOverlay {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
}

interface PageEdits {
  texts: TextOverlay[];
  shapes: ShapeOverlay[];
  drawings: DrawingOverlay[];
  images: ImageOverlay[];
  covers: CoverOverlay[];
}

interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  bgImage: string;
  thumbnail: string;
  textBlocks: Array<{ text: string; bbox: [number, number, number, number]; fontSize: number; color: number }>;
}

export const EditPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();

  // Workflow steps: 'upload' | 'editor' | 'download'
  const [step, setStep] = useState<'upload' | 'editor' | 'download'>('upload');

  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [pagesInfo, setPagesInfo] = useState<PdfPageInfo[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Editor states
  const [zoom, setZoom] = useState(1.0); // 1.0 = 100%
  const [activeMode, setActiveMode] = useState<ToolMode>('select');
  const [fontSize, setFontSize] = useState(16);
  const [activeColor, setActiveColor] = useState('#e52521');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Edits map per pageNumber -> PageEdits
  const [allEdits, setAllEdits] = useState<Record<number, PageEdits>>({});

  // Drawing in progress
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);

  // Processing / Output states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Helpers
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPageEdits = (pNum: number): PageEdits => {
    return allEdits[pNum] || { texts: [], shapes: [], drawings: [], images: [], covers: [] };
  };

  const updatePageEdits = (pNum: number, updater: (prev: PageEdits) => PageEdits) => {
    setAllEdits(prev => ({
      ...prev,
      [pNum]: updater(prev[pNum] || { texts: [], shapes: [], drawings: [], images: [], covers: [] })
    }));
  };

  // ─── Step 1: Upload & Fetch Page Previews ────────────────────────────────
  const loadPdfData = useCallback(async (file: File) => {
    setIsLoadingPages(true);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/edit-pdf-internal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf: base64 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to read PDF pages.');
      }

      const data = await res.json();
      setTotalPages(data.totalPages || 0);
      setPagesInfo(data.pages || []);
      setCurrentPage(1);
      setAllEdits({});
      setStep('editor');

    } catch (err: any) {
      setError(`Failed to read PDF: ${err.message}`);
    } finally {
      setIsLoadingPages(false);
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
    loadPdfData(file);
  }, [loadPdfData]);

  // ─── Canvas Coordinates & Mouse Handlers ─────────────────────────────────
  const activePageInfo = pagesInfo[currentPage - 1];

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } | null => {
    if (!canvasContainerRef.current || !activePageInfo) return null;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert from rendered canvas pixels to native PDF point coordinates (width x height)
    const scaleX = activePageInfo.width / rect.width;
    const scaleY = activePageInfo.height / rect.height;

    return {
      x: Math.round(clickX * scaleX),
      y: Math.round(clickY * scaleY)
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords || !activePageInfo) return;

    if (activeMode === 'text') {
      const newText: TextOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        x: coords.x,
        y: coords.y,
        width: 180,
        height: 40,
        text: 'Click to edit text',
        fontSize: fontSize,
        fontColor: activeColor,
        isBold: isBold,
        isItalic: isItalic,
        align: 'left'
      };
      updatePageEdits(currentPage, prev => ({ ...prev, texts: [...prev.texts, newText] }));
      setSelectedElementId(newText.id);
      setActiveMode('select');
    } else if (activeMode === 'draw' || activeMode === 'highlight') {
      setIsDrawing(true);
      setCurrentPath([[coords.x, coords.y]]);
    } else if (activeMode === 'rect' || activeMode === 'circle') {
      const newShape: ShapeOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        type: activeMode,
        x: coords.x,
        y: coords.y,
        width: 120,
        height: 80,
        strokeColor: activeColor,
        fillColor: '',
        strokeWidth: strokeWidth
      };
      updatePageEdits(currentPage, prev => ({ ...prev, shapes: [...prev.shapes, newShape] }));
      setSelectedElementId(newShape.id);
      setActiveMode('select');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || (activeMode !== 'draw' && activeMode !== 'highlight')) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    setCurrentPath(prev => [...prev, [coords.x, coords.y]]);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentPath.length > 0) {
      const newDrawing: DrawingOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        points: currentPath,
        color: activeMode === 'highlight' ? 'rgba(253, 224, 71, 0.5)' : activeColor,
        width: activeMode === 'highlight' ? 14 : strokeWidth
      };
      updatePageEdits(currentPage, prev => ({ ...prev, drawings: [...prev.drawings, newDrawing] }));
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      const newImg: ImageOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        x: 50,
        y: 50,
        width: 160,
        height: 120,
        base64: b64
      };
      updatePageEdits(currentPage, prev => ({ ...prev, images: [...prev.images, newImg] }));
      setSelectedElementId(newImg.id);
      setActiveMode('select');
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Delete active element
  const deleteSelectedElement = () => {
    if (!selectedElementId) return;
    updatePageEdits(currentPage, prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.id !== selectedElementId),
      shapes: prev.shapes.filter(s => s.id !== selectedElementId),
      drawings: prev.drawings.filter(d => d.id !== selectedElementId),
      images: prev.images.filter(i => i.id !== selectedElementId),
      covers: prev.covers.filter(c => c.id !== selectedElementId)
    }));
    setSelectedElementId(null);
  };

  // Erase existing PDF text block
  const handleCoverTextBlock = (block: { bbox: [number, number, number, number] }) => {
    const newCover: CoverOverlay = {
      id: Math.random().toString(36).substring(2, 9),
      x0: block.bbox[0] - 2,
      y0: block.bbox[1] - 2,
      x1: block.bbox[2] + 2,
      y1: block.bbox[3] + 2,
      color: '#ffffff'
    };
    updatePageEdits(currentPage, prev => ({ ...prev, covers: [...prev.covers, newCover] }));
  };

  // ─── Step 3: Process & Apply Edits ──────────────────────────────────────
  const processSaveEdits = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setError(null);
    setProcessStatus('Applying edits to PDF pages...');

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      // Prepare payload of edits
      const payloadEdits = Object.entries(allEdits).map(([pNum, edits]) => ({
        pageNumber: Number(pNum),
        texts: edits.texts,
        shapes: edits.shapes,
        drawings: edits.drawings,
        images: edits.images,
        covers: edits.covers
      }));

      setProcessStatus('Rendering native PDF vectors...');
      const res = await fetch('/api/edit-pdf-internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf: base64,
          filename: pdfName,
          edits: payloadEdits
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to apply PDF edits.');
      }

      setProcessStatus('Preparing download...');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const outName = pdfName.replace(/\.pdf$/i, '') + '_edited.pdf';

      setDownloadUrl(url);
      setDownloadName(outName);
      setStep('download');

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = outName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  const handleReset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setPdfFile(null);
    setPdfName('');
    setPagesInfo([]);
    setTotalPages(0);
    setAllEdits({});
    setError(null);
    setDownloadUrl(null);
    setDownloadName('');
    setStep('upload');
  };

  // Color Swatches
  const COLORS = ['#000000', '#e52521', '#2563eb', '#16a34a', '#eab308', '#ffffff'];

  // ─── RENDER: STEP 3 (Download) ───────────────────────────────────────────
  if (step === 'download' && downloadUrl) {
    return (
      <div className="w-full font-sans">
        <ToolDownloadStep
          title="Your edited PDF is ready!"
          downloadUrl={downloadUrl}
          downloadFileName={downloadName}
          onReset={handleReset}
        />
        <SeoGuideSection toolId="edit-pdf" />
      </div>
    );
  }

  // ─── RENDER: STEP 1 (Upload) ─────────────────────────────────────────────
  if (step === 'upload' || isLoadingPages) {
    return (
      <div className="w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
        <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-4 flex items-center">
          <button onClick={() => navigate('services')} className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
            &larr; Back to Services
          </button>
        </div>

        {isLoadingPages ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Loader2 size={40} className="animate-spin text-[#e52521]" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Reading PDF document pages...</p>
          </div>
        ) : (
          <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
            <ToolHeroUpload
              title="PDF Editor"
              description="Edit PDF documents online. Add text, freehand drawings, shapes, images, and highlights natively."
              buttonText="Select PDF file"
              dropText="or drop PDF file here"
              accept=".pdf"
              multiple={false}
              onFilesSelected={handleFilesSelected}
              error={error}
            />
          </div>
        )}

        <SeoGuideSection toolId="edit-pdf" />
      </div>
    );
  }

  // ─── RENDER: STEP 2 (Full PDF Workbench Editor) ──────────────────────────
  const currentEdits = getPageEdits(currentPage);

  return (
    <div className="w-full font-sans text-slate-800 dark:text-slate-100 min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">

      {/* Hidden image input for Add Image tool */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ── Top Bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            &larr; New File
          </button>
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-[300px]">{pdfName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{totalPages} Pages · {pdfFile ? formatSize(pdfFile.size) : ''}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium hidden md:inline truncate max-w-xs">{error}</span>
          )}
          <button
            onClick={processSaveEdits}
            disabled={isProcessing}
            className="bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {processStatus || 'Saving...'}</>
            ) : (
              <>Save changes <ChevronRight size={16} strokeWidth={3} /></>
            )}
          </button>
        </div>
      </div>

      {/* ── Toolbar Bar (Tools & Styling Controls) ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-[57px] z-30 shadow-xs">
        
        {/* Modes */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'select', label: 'Select', icon: MousePointer },
            { id: 'text', label: 'Add Text', icon: Type },
            { id: 'draw', label: 'Draw', icon: Pencil },
            { id: 'rect', label: 'Rectangle', icon: Square },
            { id: 'circle', label: 'Circle', icon: Circle },
            { id: 'highlight', label: 'Highlight', icon: Highlighter },
          ].map(m => {
            const Icon = m.icon;
            const active = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id as ToolMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#e52521] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
                title={m.label}
              >
                <Icon size={15} />
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            title="Upload Image Overlay"
          >
            <ImageIcon size={15} />
            <span className="hidden md:inline">Image</span>
          </button>
        </div>

        {/* Styling controls (Font, Color, Bold, Italic) */}
        <div className="flex items-center gap-3">
          {/* Color swatches */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                  activeColor === c ? 'scale-125 border-slate-900 dark:border-white shadow-sm' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                title={`Select color ${c}`}
              />
            ))}
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400">Size:</span>
            <select
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>

          {/* Bold / Italic Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                isBold ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
              }`}
              title="Bold"
            >
              <Bold size={13} />
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                isItalic ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
              }`}
              title="Italic"
            >
              <Italic size={13} />
            </button>
          </div>

          {/* Delete Selected Element */}
          {selectedElementId && (
            <button
              onClick={deleteSelectedElement}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer"
              title="Delete Selected Element"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Main Canvas Workbench Body ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Left Sidebar: Page Thumbnails ── */}
        <div className="w-24 sm:w-28 md:w-36 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Pages ({totalPages})
          </p>
          {pagesInfo.map((p) => {
            const isCurr = p.pageNumber === currentPage;
            return (
              <div
                key={p.pageNumber}
                onClick={() => { setCurrentPage(p.pageNumber); setSelectedElementId(null); }}
                className={`group flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded-xl border-2 transition-all ${
                  isCurr
                    ? 'border-[#e52521] bg-red-50/30 dark:bg-red-950/20 shadow-xs'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-full aspect-3/4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50">
                  <img src={p.thumbnail} alt={`Page ${p.pageNumber}`} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[11px] font-bold ${isCurr ? 'text-[#e52521]' : 'text-slate-500 dark:text-slate-400'}`}>
                  {p.pageNumber}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Center Stage: PDF Page Canvas ── */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-200/60 dark:bg-slate-950">
          {activePageInfo && (
            <div
              style={{
                width: `${activePageInfo.width * zoom}px`,
                height: `${activePageInfo.height * zoom}px`,
              }}
              className="relative shadow-2xl rounded-sm bg-white overflow-hidden transition-all duration-150 select-none"
            >
              {/* Background PDF page render */}
              <img
                src={activePageInfo.bgImage}
                alt={`PDF Page ${currentPage}`}
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Interactive Canvas Overlay */}
              <div
                ref={canvasContainerRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className={`absolute inset-0 ${
                  activeMode === 'text' ? 'cursor-text' :
                  activeMode === 'draw' || activeMode === 'highlight' ? 'cursor-crosshair' :
                  activeMode === 'rect' || activeMode === 'circle' ? 'cursor-crosshair' :
                  'cursor-default'
                }`}
              >
                {/* 1. Original PDF Text Spans (detect & erase/edit original PDF text) */}
                {activePageInfo.textBlocks.map((blk, idx) => {
                  const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                  const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                  const left = blk.bbox[0] * scaleX;
                  const top = blk.bbox[1] * scaleY;
                  const w = (blk.bbox[2] - blk.bbox[0]) * scaleX;
                  const h = (blk.bbox[3] - blk.bbox[1]) * scaleY;

                  return (
                    <div
                      key={`blk-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCoverTextBlock(blk);
                      }}
                      style={{ left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` }}
                      className="absolute opacity-0 hover:opacity-100 hover:bg-[#e52521]/15 hover:border hover:border-[#e52521] rounded-xs cursor-pointer transition-opacity"
                      title="Click to erase/override original text"
                    />
                  );
                })}

                {/* 2. Cover rects (white background overlays to erase text) */}
                {currentEdits.covers.map((c) => {
                  const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                  const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                  return (
                    <div
                      key={c.id}
                      style={{
                        left: `${c.x0 * scaleX}px`,
                        top: `${c.y0 * scaleY}px`,
                        width: `${(c.x1 - c.x0) * scaleX}px`,
                        height: `${(c.y1 - c.y0) * scaleY}px`,
                        backgroundColor: c.color
                      }}
                      className="absolute z-10 border border-slate-100/50"
                    />
                  );
                })}

                {/* 3. Rendered Freehand Drawings (SVG paths) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                  {currentEdits.drawings.map((dwg) => {
                    const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                    const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                    const pathData = dwg.points
                      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0] * scaleX} ${pt[1] * scaleY}`)
                      .join(' ');
                    return (
                      <path
                        key={dwg.id}
                        d={pathData}
                        stroke={dwg.color}
                        strokeWidth={dwg.width * zoom}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {/* Active drawing stroke in progress */}
                  {isDrawing && currentPath.length > 1 && (
                    <path
                      d={currentPath.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${(pt[0] * activePageInfo.width * zoom) / activePageInfo.width} ${(pt[1] * activePageInfo.height * zoom) / activePageInfo.height}`).join(' ')}
                      stroke={activeMode === 'highlight' ? 'rgba(253, 224, 71, 0.5)' : activeColor}
                      strokeWidth={(activeMode === 'highlight' ? 14 : strokeWidth) * zoom}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>

                {/* 4. Shapes (Rectangle / Circle) */}
                {currentEdits.shapes.map((s) => {
                  const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                  const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                  const isSelected = selectedElementId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedElementId(s.id); }}
                      style={{
                        left: `${s.x * scaleX}px`,
                        top: `${s.y * scaleY}px`,
                        width: `${s.width * scaleX}px`,
                        height: `${s.height * scaleY}px`,
                        borderColor: s.strokeColor,
                        borderWidth: `${s.strokeWidth * zoom}px`,
                        backgroundColor: s.fillColor || 'transparent',
                        borderRadius: s.type === 'circle' ? '9999px' : '2px'
                      }}
                      className={`absolute z-20 cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#e52521] ring-offset-2' : ''
                      }`}
                    />
                  );
                })}

                {/* 5. Images */}
                {currentEdits.images.map((img) => {
                  const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                  const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                  const isSelected = selectedElementId === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedElementId(img.id); }}
                      style={{
                        left: `${img.x * scaleX}px`,
                        top: `${img.y * scaleY}px`,
                        width: `${img.width * scaleX}px`,
                        height: `${img.height * scaleY}px`,
                      }}
                      className={`absolute z-20 cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#e52521] ring-offset-2' : ''
                      }`}
                    >
                      <img src={img.base64} alt="Overlay" className="w-full h-full object-contain pointer-events-none" />
                    </div>
                  );
                })}

                {/* 6. Text Overlays (Editable text boxes) */}
                {currentEdits.texts.map((t) => {
                  const scaleX = (activePageInfo.width * zoom) / activePageInfo.width;
                  const scaleY = (activePageInfo.height * zoom) / activePageInfo.height;
                  const isSelected = selectedElementId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedElementId(t.id); }}
                      style={{
                        left: `${t.x * scaleX}px`,
                        top: `${t.y * scaleY}px`,
                        width: `${t.width * scaleX}px`,
                        minHeight: `${t.height * scaleY}px`,
                      }}
                      className={`absolute z-25 p-1 rounded-sm cursor-text transition-all ${
                        isSelected ? 'border-2 border-dashed border-[#e52521] bg-red-50/30' : 'hover:border hover:border-slate-400'
                      }`}
                    >
                      <textarea
                        value={t.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          updatePageEdits(currentPage, prev => ({
                            ...prev,
                            texts: prev.texts.map(item => item.id === t.id ? { ...item, text: val } : item)
                          }));
                        }}
                        style={{
                          fontSize: `${t.fontSize * zoom}px`,
                          color: t.fontColor,
                          fontWeight: t.isBold ? 'bold' : 'normal',
                          fontStyle: t.isItalic ? 'italic' : 'normal',
                          textAlign: t.align,
                        }}
                        className="w-full h-full bg-transparent resize font-sans border-none outline-none leading-tight overflow-hidden"
                      />
                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Floating Bar (Page Nav & Zoom Controls) ── */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between z-30 shadow-md">
        
        {/* Page Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.15))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(2.0, prev + 0.15))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
            title="Reset Zoom (100%)"
          >
            100%
          </button>
        </div>

      </div>

      <SeoGuideSection toolId="edit-pdf" />
    </div>
  );
};

export default EditPdfConverter;
