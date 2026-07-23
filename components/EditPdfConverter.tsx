'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText, Loader2, ChevronRight, KeyRound, AlertCircle, Type, Pencil,
  Square, Circle, Image as ImageIcon, Highlighter, Eraser, Trash2, ZoomIn, ZoomOut,
  Maximize2, ChevronLeft, Bold, Italic, Check, Plus, Move, MousePointer, Copy, Sliders,
  RotateCw, Search, Edit3
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolMode = 'select' | 'text' | 'draw' | 'rect' | 'circle' | 'image' | 'highlight' | 'whiteout';

interface TextOverlay {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  align: 'left' | 'center' | 'right';
  bgColor?: string;
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

export const EditPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();

  // Step: 'upload' | 'editor' | 'download'
  const [step, setStep] = useState<'upload' | 'editor' | 'download'>('upload');

  // File & Document State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageViewport, setPageViewport] = useState<{ width: number; height: number } | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<Record<number, string>>({});
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  // Editor Controls
  const [editorTab, setEditorTab] = useState<'annotate' | 'edit'>('annotate');
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [zoom, setZoom] = useState(1.0); // 1.0 = 100%
  const [activeMode, setActiveMode] = useState<ToolMode>('select');

  const rotateCurrentPage = (pNum: number) => {
    setPageRotations(prev => ({
      ...prev,
      [pNum]: ((prev[pNum] || 0) + 90) % 360
    }));
  };

  // Active Tool Styling
  const [fontFamily, setFontFamily] = useState('Helvetica');
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

  // Processing & Output
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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

  // ─── 1. Load PDF Document via PDF.js in the DOM ──────────────────────────
  const loadPdfDocument = useCallback(async (file: File) => {
    setIsLoadingPages(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      setPdfArrayBuffer(buffer);

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      // Render thumbnails for all pages
      const thumbs: Record<number, string> = {};
      for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.3 });
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = vp.width;
        thumbCanvas.height = vp.height;
        const ctx = thumbCanvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: vp, canvas: thumbCanvas } as any).promise;
          thumbs[i] = thumbCanvas.toDataURL('image/png');
        }
      }
      setPageThumbnails(thumbs);
      setStep('editor');

    } catch (err: any) {
      console.error('PDF.js load error:', err);
      setError(`Failed to parse PDF document: ${err.message}`);
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
    loadPdfDocument(file);
  }, [loadPdfDocument]);

  // ─── 2. Render Active Page onto DOM Canvas ──────────────────────────────
  const renderCurrentPageCanvas = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const vp = page.getViewport({ scale: zoom * 1.5 }); // High-DPI canvas
      setPageViewport({ width: page.getViewport({ scale: 1.0 }).width, height: page.getViewport({ scale: 1.0 }).height });

      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas: canvas } as any).promise;
      }
    } catch (err: any) {
      console.error('Canvas render error:', err);
    }
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    if (step === 'editor' && pdfDoc) {
      renderCurrentPageCanvas();
    }
  }, [step, pdfDoc, currentPage, zoom, renderCurrentPageCanvas]);

  // ─── 3. Canvas Mouse Events & Coordinate Calculation ─────────────────────
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } | null => {
    if (!canvasContainerRef.current || !pageViewport) return null;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = pageViewport.width / rect.width;
    const scaleY = pageViewport.height / rect.height;

    return {
      x: Math.round(clickX * scaleX),
      y: Math.round(clickY * scaleY)
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords || !pageViewport) return;

    if (activeMode === 'text') {
      const newText: TextOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        x: coords.x,
        y: coords.y,
        width: 140,
        height: 32,
        text: 'Text',
        fontSize: fontSize,
        fontColor: activeColor,
        fontFamily: fontFamily,
        isBold: isBold,
        isItalic: isItalic,
        align: 'left'
      };
      updatePageEdits(currentPage, prev => ({ ...prev, texts: [...prev.texts, newText] }));
      setSelectedElementId(newText.id);
      setActiveMode('select');
    } else if (activeMode === 'whiteout') {
      const newCover: CoverOverlay = {
        id: Math.random().toString(36).substring(2, 9),
        x0: coords.x,
        y0: coords.y,
        x1: coords.x + 120,
        y1: coords.y + 40,
        color: '#ffffff'
      };
      updatePageEdits(currentPage, prev => ({ ...prev, covers: [...prev.covers, newCover] }));
      setSelectedElementId(newCover.id);
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
    const coords = getCanvasCoords(e);
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

  // Image upload overlay handler
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

  // Element actions
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

  const duplicateSelectedElement = () => {
    if (!selectedElementId) return;
    const pEdits = getPageEdits(currentPage);
    const selText = pEdits.texts.find(t => t.id === selectedElementId);
    if (selText) {
      const dup: TextOverlay = { ...selText, id: Math.random().toString(36).substring(2, 9), x: selText.x + 20, y: selText.y + 20 };
      updatePageEdits(currentPage, prev => ({ ...prev, texts: [...prev.texts, dup] }));
      setSelectedElementId(dup.id);
    }
  };

  // Selected text properties sync
  const currentEdits = getPageEdits(currentPage);
  const selectedText = currentEdits.texts.find(t => t.id === selectedElementId);

  const updateSelectedTextProp = (key: keyof TextOverlay, value: any) => {
    if (!selectedElementId) return;
    updatePageEdits(currentPage, prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === selectedElementId ? { ...t, [key]: value } : t)
    }));
  };

  // ─── Save Changes & Burn Edits via Backend API ───────────────────────────
  const processSaveEdits = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setError(null);
    setProcessStatus('Applying edits to PDF document...');

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });

      const payloadEdits = Object.entries(allEdits).map(([pNum, edits]) => ({
        pageNumber: Number(pNum),
        texts: edits.texts,
        shapes: edits.shapes,
        drawings: edits.drawings,
        images: edits.images,
        covers: edits.covers
      }));

      setProcessStatus('Generating native PDF vectors...');
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
    setPdfArrayBuffer(null);
    setPdfDoc(null);
    setTotalPages(0);
    setPageThumbnails({});
    setAllEdits({});
    setError(null);
    setDownloadUrl(null);
    setDownloadName('');
    setStep('upload');
  };

  const PRESET_COLORS = ['#000000', '#e52521', '#2563eb', '#16a34a', '#eab308', '#ffffff'];
  const FONT_FAMILIES = ['Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Impact'];

  // ─── RENDER STEP 3: Download ─────────────────────────────────────────────
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

  // ─── RENDER STEP 1: Upload ───────────────────────────────────────────────
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
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Loading PDF document pages...</p>
          </div>
        ) : (
          <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
            <ToolHeroUpload
              title="PDF Editor"
              description="Edit PDF documents online. Add text, freehand drawings, shapes, images, and whiteouts natively."
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

  // ─── RENDER STEP 2: Workbench Editor ──────────────────────────────────────
  return (
    <div className="w-full font-sans text-slate-800 dark:text-slate-100 min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">

      {/* Hidden file input for image upload */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ── Top Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            &larr; New File
          </button>
          
          {/* iLovePDF-style Mode Switcher: Annotate vs Edit */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setEditorTab('annotate')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editorTab === 'annotate' ? 'bg-[#e52521] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Pencil size={13} /> Annotate
            </button>
            <button
              onClick={() => setEditorTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editorTab === 'edit' ? 'bg-[#e52521] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 size={13} /> Edit
            </button>
          </div>

          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-[300px]">{pdfName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{totalPages} Pages · {pdfFile ? formatSize(pdfFile.size) : ''}</p>
          </div>
        </div>

        {/* Primary Save Action */}
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

      {/* ── Toolbar Bar ── */}
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
            { id: 'whiteout', label: 'Erase / Whiteout', icon: Eraser },
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

        {/* Quick Styling Controls */}
        <div className="flex items-center gap-3">
          {/* Color swatches + Custom color picker */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => {
                  setActiveColor(c);
                  if (selectedText) updateSelectedTextProp('fontColor', c);
                }}
                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                  activeColor === c ? 'scale-125 border-slate-900 dark:border-white shadow-sm' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {/* Custom color picker */}
            <label className="relative w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-pink-500 to-yellow-400">
              <input
                type="color"
                value={activeColor}
                onChange={e => {
                  setActiveColor(e.target.value);
                  if (selectedText) updateSelectedTextProp('fontColor', e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Custom color"
              />
            </label>
          </div>

          {/* Delete / Duplicate */}
          {selectedElementId && (
            <div className="flex items-center gap-1">
              <button
                onClick={duplicateSelectedElement}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                title="Duplicate Element"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={deleteSelectedElement}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer"
                title="Delete Selected Element"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Thumbnails Sidebar */}
        <div className="w-24 sm:w-28 md:w-36 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Pages ({totalPages})
          </p>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
            const isCurr = pNum === currentPage;
            const thumb = pageThumbnails[pNum];
            return (
              <div
                key={pNum}
                onClick={() => { setCurrentPage(pNum); setSelectedElementId(null); }}
                className={`group flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded-xl border-2 transition-all ${
                  isCurr
                    ? 'border-[#e52521] bg-red-50/30 dark:bg-red-950/20 shadow-xs'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="w-full aspect-3/4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 flex items-center justify-center relative group/thumb">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={`Page ${pNum}`}
                      style={{ transform: `rotate(${pageRotations[pNum] || 0}deg)` }}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />
                  ) : (
                    <FileText size={20} className="text-slate-300" />
                  )}
                  {/* Rotate button hover overlay */}
                  <button
                    onClick={(e) => { e.stopPropagation(); rotateCurrentPage(pNum); }}
                    className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-[#e52521] text-white rounded-md opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    title="Rotate Page"
                  >
                    <RotateCw size={11} />
                  </button>
                </div>
                <span className={`text-[11px] font-bold ${isCurr ? 'text-[#e52521]' : 'text-slate-500 dark:text-slate-400'}`}>
                  {pNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Center Stage: Native DOM PDF Canvas */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-200/60 dark:bg-slate-950">
          {pageViewport && (
            <div
              style={{
                width: `${pageViewport.width * zoom}px`,
                height: `${pageViewport.height * zoom}px`,
              }}
              className="relative shadow-2xl rounded-sm bg-white overflow-hidden transition-all duration-150 select-none"
            >
              {/* Native PDF.js DOM Canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  width: `${pageViewport.width * zoom}px`,
                  height: `${pageViewport.height * zoom}px`,
                }}
                className="w-full h-full block pointer-events-none"
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
                  activeMode === 'rect' || activeMode === 'circle' || activeMode === 'whiteout' ? 'cursor-crosshair' :
                  'cursor-default'
                }`}
              >
                {/* 1. Whiteout Covers */}
                {currentEdits.covers.map((c) => {
                  const scaleX = (pageViewport.width * zoom) / pageViewport.width;
                  const scaleY = (pageViewport.height * zoom) / pageViewport.height;
                  const isSelected = selectedElementId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedElementId(c.id); }}
                      style={{
                        left: `${c.x0 * scaleX}px`,
                        top: `${c.y0 * scaleY}px`,
                        width: `${(c.x1 - c.x0) * scaleX}px`,
                        height: `${(c.y1 - c.y0) * scaleY}px`,
                        backgroundColor: c.color
                      }}
                      className={`absolute z-10 border ${isSelected ? 'border-[#e52521] ring-1 ring-[#e52521]' : 'border-slate-200/40'}`}
                    />
                  );
                })}

                {/* 2. Freehand Drawings (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                  {currentEdits.drawings.map((dwg) => {
                    const scaleX = (pageViewport.width * zoom) / pageViewport.width;
                    const scaleY = (pageViewport.height * zoom) / pageViewport.height;
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

                  {/* Active stroke in progress */}
                  {isDrawing && currentPath.length > 1 && (
                    <path
                      d={currentPath.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${(pt[0] * pageViewport.width * zoom) / pageViewport.width} ${(pt[1] * pageViewport.height * zoom) / pageViewport.height}`).join(' ')}
                      stroke={activeMode === 'highlight' ? 'rgba(253, 224, 71, 0.5)' : activeColor}
                      strokeWidth={(activeMode === 'highlight' ? 14 : strokeWidth) * zoom}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>

                {/* 3. Shapes */}
                {currentEdits.shapes.map((s) => {
                  const scaleX = (pageViewport.width * zoom) / pageViewport.width;
                  const scaleY = (pageViewport.height * zoom) / pageViewport.height;
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

                {/* 4. Images */}
                {currentEdits.images.map((img) => {
                  const scaleX = (pageViewport.width * zoom) / pageViewport.width;
                  const scaleY = (pageViewport.height * zoom) / pageViewport.height;
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

                {/* 5. Clean Floating Text Box Overlays */}
                {currentEdits.texts.map((t) => {
                  const scaleX = (pageViewport.width * zoom) / pageViewport.width;
                  const scaleY = (pageViewport.height * zoom) / pageViewport.height;
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
                        isSelected ? 'border-2 border-dashed border-[#e52521] bg-transparent shadow-xs' : 'hover:border hover:border-slate-400/50'
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
                          fontFamily: t.fontFamily || 'Helvetica',
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

        {/* ── Right Text Styles Sidebar (Matching iLovePDF Sidebar) ── */}
        {selectedText && (
          <div className="w-64 md:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 shrink-0 overflow-y-auto space-y-5 shadow-lg z-30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders size={16} className="text-[#e52521]" /> Text Styles
              </h3>
              <button onClick={() => setSelectedElementId(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                Close
              </button>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Font Family</label>
              <select
                value={selectedText.fontFamily || 'Helvetica'}
                onChange={e => updateSelectedTextProp('fontFamily', e.target.value)}
                className="w-full text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e52521]"
              >
                {FONT_FAMILIES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Font Size</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={8}
                  max={120}
                  value={selectedText.fontSize}
                  onChange={e => updateSelectedTextProp('fontSize', Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-bold">px</span>
              </div>
            </div>

            {/* Formatting (Bold, Italic, Alignment) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formatting</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSelectedTextProp('isBold', !selectedText.isBold)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold flex justify-center items-center cursor-pointer transition-colors ${
                    selectedText.isBold ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Bold size={15} />
                </button>
                <button
                  onClick={() => updateSelectedTextProp('isItalic', !selectedText.isItalic)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold flex justify-center items-center cursor-pointer transition-colors ${
                    selectedText.isItalic ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Italic size={15} />
                </button>
              </div>
            </div>

            {/* Align */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alignment</label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'center', 'right'] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => updateSelectedTextProp('align', a)}
                    className={`py-1.5 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-colors ${
                      selectedText.align === a ? 'bg-[#e52521] text-white border-[#e52521]' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedText.fontColor}
                  onChange={e => updateSelectedTextProp('fontColor', e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent p-0.5"
                />
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{selectedText.fontColor}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={duplicateSelectedElement}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy size={15} /> Duplicate Text
              </button>
              <button
                onClick={deleteSelectedElement}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 size={15} /> Delete Text
              </button>
            </div>

          </div>
        )}

        {/* Floating Bottom Right "Save changes" Button (iLovePDF Style) */}
        <div className="absolute bottom-6 right-6 z-40">
          <button
            onClick={processSaveEdits}
            disabled={isProcessing}
            className="bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-6 py-3.5 rounded-2xl text-base font-extrabold shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3 border-2 border-white/20"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {processStatus || 'Saving...'}</>
            ) : (
              <>Save changes <ChevronRight size={20} strokeWidth={3} /></>
            )}
          </button>
        </div>

      </div>

      {/* ── Bottom Nav Bar (Page & Zoom) ── */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between z-30 shadow-md">
        
        {/* Page Navigation */}
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
            title="Reset Zoom"
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
