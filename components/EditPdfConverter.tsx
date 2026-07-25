'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Loader2, Pencil, Square, Image as ImageIcon, Trash2,
  MousePointer, Copy, Hand, Link as LinkIcon, LayoutGrid,
  AlignLeft, AlignCenter, AlignRight, Plus, ChevronUp, ChevronDown,
  Minus, Maximize2, Search
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';

let pdfjsLib: any = null;

type MainMode = 'annotate' | 'edit';
type ToolMode = 'pan' | 'select' | 'text' | 'draw' | 'shapes' | 'insert' | 'forms';

interface TextOverlay {
  id: string; x: number; y: number; width: number; height: number;
  text: string; fontSize: number; fontColor: string; fontFamily: string;
  isBold: boolean; isItalic: boolean; isUnderline: boolean; isStrike: boolean;
  align: 'left' | 'center' | 'right'; linkUrl?: string; pageIndex: number;
  backgroundColor?: string;
}

interface ExtractedText {
  id: string; text: string; x: number; y: number; width: number; height: number;
  fontSize: number; fontFamily: string; fontColor: string; pageIndex: number;
}

const FONTS = ['Repo Extra', 'DM Sans', 'Inter', 'Roboto', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
const COLORS = ['#000000', '#e52521', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#64748b'];

export const EditPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [processedFileName, setProcessedFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(0.55);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [thumbZoom, setThumbZoom] = useState(50);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [mainMode, setMainMode] = useState<MainMode>('edit');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [pageInputVal, setPageInputVal] = useState('1');

  // Properties panel state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [linkUrl, setLinkUrl] = useState('');

  const [history, setHistory] = useState<TextOverlay[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);

  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load pdfjs dynamically (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('pdfjs-dist').then((lib) => {
      pdfjsLib = lib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
    }).catch(() => {});
  }, []);

  const handleFileSelect = async (f: File) => {
    if (!f || f.type !== 'application/pdf') { setError('Please select a valid PDF file.'); return; }
    setFile(f); setError(null); setIsProcessing(true);
    try {
      if (!pdfjsLib) {
        const lib = await import('pdfjs-dist');
        pdfjsLib = lib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      }
      const ab = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: ab }).promise;
      setPdfDoc(doc); setNumPages(doc.numPages); setCurrentPage(0);
      setTexts([]); setSelectedId(null);

      const thumbs: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i);
        const vp = pg.getViewport({ scale: 0.18 });
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        c.width = vp.width; c.height = vp.height;
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbs.push(c.toDataURL());
      }
      setThumbnails(thumbs);
      setIsProcessing(false);
    } catch (e: any) { setError(e.message || 'Error loading PDF.'); setIsProcessing(false); }
  };

  const extractPageText = useCallback(async (doc: any, pageNum: number, pageIdx: number) => {
    if (!doc) return;
    try {
      const pg = await doc.getPage(pageNum);
      const vp = pg.getViewport({ scale: 1.0 });
      const tc = await pg.getTextContent();
      const items: ExtractedText[] = [];
      
      tc.items.forEach((item: any, idx: number) => {
        if (!item.str?.trim()) return;
        
        const pdfX = item.transform[4];
        const pdfY = item.transform[5];
        const [vx, vy] = vp.convertToViewportPoint(pdfX, pdfY);
        const fontHeight = Math.abs(item.transform[3]);
        
        // Extract font name or fallback
        let fontName = 'Inter';
        if (item.fontName) {
          // Normalize PDF font names (e.g. g_d0_f1 -> sans-serif, TimesNewRoman -> Times New Roman)
          const lowerName = item.fontName.toLowerCase();
          if (lowerName.includes('times')) fontName = 'Times New Roman';
          else if (lowerName.includes('courier')) fontName = 'Courier New';
          else if (lowerName.includes('helvetica') || lowerName.includes('arial')) fontName = 'Arial';
        }

        let fontColor = '#000000';
        if (item.color) {
          if (Array.isArray(item.color) || item.color instanceof Uint8ClampedArray) {
            fontColor = `#${item.color[0].toString(16).padStart(2, '0')}${item.color[1].toString(16).padStart(2, '0')}${item.color[2].toString(16).padStart(2, '0')}`;
          } else if (typeof item.color === 'string') {
            fontColor = item.color.startsWith('#') ? item.color : `#${item.color}`;
          }
        }

        items.push({
          id: `ext-${pageIdx}-${idx}`,
          text: item.str,
          x: vx,
          y: vy - fontHeight,
          width: Math.max(item.width || (item.str.length * fontHeight * 0.6), 40),
          height: Math.max(fontHeight || 14, 12),
          fontSize: Math.max(fontHeight || 14, 10),
          fontFamily: fontName,
          fontColor: fontColor,
          pageIndex: pageIdx,
        });
      });
      
      console.log(`Extracted ${items.length} text items for page ${pageNum}`);
      setExtractedTexts(items);
    } catch (err) {
      console.error('Error in extractPageText:', err);
    }
  }, []);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !pageCanvasRef.current) return;
    try {
      const pg = await pdfDoc.getPage(currentPage + 1);
      const vp = pg.getViewport({ scale: zoom * 2.0 });
      const c = pageCanvasRef.current;
      const ctx = c.getContext('2d')!;
      c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    } catch { }
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
      extractPageText(pdfDoc, currentPage + 1, currentPage);
      setPageInputVal(`${currentPage + 1}`);
    }
  }, [pdfDoc, currentPage, zoom, renderPage, extractPageText]);

  const pushHistory = (newTexts: TextOverlay[]) => {
    const newH = history.slice(0, histIdx + 1);
    newH.push(newTexts);
    setHistory(newH); setHistIdx(newH.length - 1);
    setTexts(newTexts);
  };

  const undo = () => { if (histIdx > 0) { const ni = histIdx - 1; setHistIdx(ni); setTexts(history[ni]); } };
  const redo = () => { if (histIdx < history.length - 1) { const ni = histIdx + 1; setHistIdx(ni); setTexts(history[ni]); } };

  const selectedText = selectedId ? texts.find(t => t.id === selectedId) : null;

  const updateSelectedText = (updates: Partial<TextOverlay>) => {
    if (!selectedId) return;
    const updated = texts.map(t => t.id === selectedId ? { ...t, ...updates } : t);
    pushHistory(updated);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'select') {
      // Single click on blank canvas area → deselect
      setSelectedId(null);
      return;
    }
    if (toolMode !== 'text' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = zoom * 2.0;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const newText: TextOverlay = {
      id: `t-${Date.now()}`, x, y, width: 200, height: fontSize * 1.6,
      text: 'Add text', fontSize, fontColor, fontFamily,
      isBold, isItalic, isUnderline, isStrike, align: textAlign, pageIndex: currentPage,
    };
    const updated = [...texts, newText];
    pushHistory(updated);
    setSelectedId(newText.id);
    setToolMode('select');
  };

  // Only activate on DOUBLE-CLICK — single click just shows hover highlight
  const handleExtractedDoubleClick = (ext: ExtractedText) => {
    if (mainMode !== 'edit') return;
    const exists = texts.find(t => t.id === ext.id);
    if (!exists) {
      let bgCol = 'transparent';
      if (pageCanvasRef.current) {
        const ctx = pageCanvasRef.current.getContext('2d');
        if (ctx) {
           const scale = zoom * 2.0;
           // Sample color slightly left of the text to get background
           const px = ctx.getImageData(Math.max(0, ext.x * scale - 2), Math.max(0, ext.y * scale + (ext.height * scale) / 2), 1, 1).data;
           if (px[3] > 0) bgCol = `rgba(${px[0]}, ${px[1]}, ${px[2]}, ${px[3] / 255})`;
        }
      }

      const newText: TextOverlay = {
        id: ext.id, x: ext.x, y: ext.y,
        width: ext.width + 10, height: ext.height + 4,
        text: ext.text, fontSize: ext.fontSize,
        fontColor: ext.fontColor || '#000000', fontFamily: ext.fontFamily || 'Inter',
        isBold: false, isItalic: false, isUnderline: false, isStrike: false,
        align: 'left', pageIndex: currentPage,
        backgroundColor: bgCol,
      };
      const updated = [...texts, newText];
      pushHistory(updated);
      setSelectedId(newText.id);
    } else {
      setSelectedId(ext.id);
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const updated = texts.filter(t => t.id !== selectedId);
    pushHistory(updated); setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedText) return;
    const copy: TextOverlay = { ...selectedText, id: `t-${Date.now()}`, x: selectedText.x + 16, y: selectedText.y + 16 };
    const updated = [...texts, copy];
    pushHistory(updated); setSelectedId(copy.id);
  };

  const handleSave = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Write each text overlay to its corresponding page
      for (const t of texts) {
        if (t.pageIndex < pages.length) {
          const page = pages[t.pageIndex];
          const { width, height } = page.getSize();
          
          // If it's an edited existing text, draw a whiteout mask first
          if (t.id.startsWith('ext-')) {
            const ext = extractedTexts.find(e => e.id === t.id);
            if (ext) {
              const maskY = height - ext.y - ext.fontSize;
              page.drawRectangle({
                x: ext.x,
                y: maskY - 2,
                width: ext.width + 18,
                height: ext.height + 8,
                color: rgb(1, 1, 1), // Solid white mask
              });
            }
          }

          // PDF coordinates start from bottom-left, adjust y-coordinate accordingly
          const pdfX = t.x;
          const pdfY = height - t.y - (t.fontSize);

          // Convert hex color to rgb
          const hex = t.fontColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
          const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
          const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

          page.drawText(t.text, {
            x: pdfX,
            y: pdfY,
            size: t.fontSize,
            color: rgb(r, g, b),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setProcessedFileName(`edited_${file.name}`);
    } catch (err: any) {
      console.error('Error saving PDF:', err);
      setError('Failed to save edited PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
        <ToolHeroUpload
          title="Edit PDF Online"
          description="Add text, draw annotations, insert shapes and images, and edit existing text directly in your PDF. Secure, free, and entirely client-side."
          buttonText="Select PDF file"
          dropText="Drop your PDF here"
          accept=".pdf"
          multiple={false}
          onFilesSelected={(files) => { if (files[0]) handleFileSelect(files[0]); }}
          error={error}
        />
        <SeoGuideSection toolId="edit-pdf" />
      </div>
    );
  }

  if (downloadUrl) {
    return (
      <div className="w-full px-4 py-8 max-w-5xl mx-auto">
        <ToolDownloadStep
          title="Your edited PDF is ready!"
          downloadUrl={downloadUrl}
          downloadFileName={processedFileName}
          onReset={() => { setFile(null); setDownloadUrl(null); setTexts([]); }}
        />
      </div>
    );
  }

  const scale = zoom * 2.0;

  return (
    <div className="w-full h-screen flex flex-col bg-[#f1f1f1] dark:bg-[#111] overflow-hidden font-sans" style={{ fontFamily: 'Inter, DM Sans, sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          iLovePDF TOP TOOLBAR — exact replica
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="w-full bg-white dark:bg-[#1a1a1a] border-b border-[#e0e0e0] dark:border-[#2a2a2a] flex items-center justify-between px-4 h-14 shrink-0 z-40 shadow-sm">

        {/* LEFT: Annotate | Edit toggle pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#f1f1f1] dark:bg-[#2a2a2a] rounded-full border border-[#d0d0d0] dark:border-[#3a3a3a]">
            <button
              onClick={() => { setMainMode('annotate'); setToolMode('draw'); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                mainMode === 'annotate'
                  ? 'bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#3a3a3a]'
                  : 'text-[#555] dark:text-[#aaa]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Annotate
            </button>
            <button
              onClick={() => { setMainMode('edit'); setToolMode('select'); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                mainMode === 'edit'
                  ? 'bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#3a3a3a]'
                  : 'text-[#555] dark:text-[#aaa]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
              Edit
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background: '#fde68a', color: '#92400e' }}>✦</span>
            </button>
          </div>
        </div>

        {/* CENTER: Tool Icons row (exact iLovePDF order) */}
        <div className="flex items-center gap-1 bg-[#f7f7f7] dark:bg-[#222] rounded-lg border border-[#e0e0e0] dark:border-[#333] p-1">
          {/* Hand/Pan */}
          <button
            onClick={() => setToolMode('pan')}
            title="Pan"
            className={`p-2 rounded-md transition-all ${toolMode === 'pan' ? 'bg-[#e52521] text-white' : 'text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333]'}`}
          >
            <Hand size={18} />
          </button>
          {/* Select cursor */}
          <button
            onClick={() => setToolMode('select')}
            title="Select"
            className={`p-2 rounded-md transition-all ${toolMode === 'select' ? 'bg-[#e52521] text-white' : 'text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333]'}`}
          >
            <MousePointer size={18} />
          </button>
          <div className="w-px h-6 bg-[#e0e0e0] dark:bg-[#333] mx-1" />
          {/* Annotate tools */}
          <button
            onClick={() => setToolMode('draw')}
            title="Freehand Draw"
            className={`p-2 rounded-md transition-all ${toolMode === 'draw' ? 'bg-[#e52521] text-white' : 'text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333]'}`}
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setToolMode('shapes')}
            title="Shapes"
            className={`p-2 rounded-md transition-all ${toolMode === 'shapes' ? 'bg-[#e52521] text-white' : 'text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333]'}`}
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            title="Insert Image"
            className="p-2 rounded-md text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333] transition-all"
          >
            <ImageIcon size={18} />
          </button>
          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" />
          <div className="w-px h-6 bg-[#e0e0e0] dark:bg-[#333] mx-1" />
          {/* Edit text */}
          <button
            onClick={() => setToolMode('text')}
            title="Add Text"
            className={`p-2 rounded-md transition-all font-bold text-[13px] ${toolMode === 'text' ? 'bg-[#e52521] text-white' : 'text-[#e52521] hover:bg-red-50 dark:hover:bg-[#2a1a1a]'}`}
          >
            Aᵀ
          </button>
          {/* Forms */}
          <button
            onClick={() => setToolMode('forms')}
            title="Forms"
            className={`p-2 rounded-md transition-all ${toolMode === 'forms' ? 'bg-[#e52521] text-white' : 'text-[#444] dark:text-[#ccc] hover:bg-[#eee] dark:hover:bg-[#333]'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </button>
        </div>

        {/* RIGHT: Save changes button */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md"
          style={{ background: 'linear-gradient(135deg, #e52521 0%, #c41d1a 100%)' }}
        >
          {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
          Save changes
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </button>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN WORKSPACE
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ─── LEFT THUMBNAIL SIDEBAR ────────────────────────────────────────── */}
        <aside className="w-[168px] bg-white dark:bg-[#1a1a1a] border-r border-[#e0e0e0] dark:border-[#2a2a2a] flex flex-col shrink-0 overflow-y-auto">

          {/* View mode icons row */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#eee] dark:border-[#222]">
            <div className="flex items-center gap-1.5">
              <button className="p-1 rounded text-[#e52521] bg-red-50 dark:bg-red-950/30"><LayoutGrid size={15} /></button>
              <button className="p-1 rounded text-[#888] hover:text-[#333] dark:hover:text-white"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
              <button className="p-1 rounded text-[#888] hover:text-[#333] dark:hover:text-white"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
            </div>
            <button className="p-1 rounded text-[#888]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#eee] dark:border-[#222]">
            <button onClick={() => setThumbZoom(Math.max(20, thumbZoom - 10))} className="text-[#888] hover:text-[#333]"><Minus size={13} /></button>
            <input type="range" min={20} max={100} value={thumbZoom} onChange={e => setThumbZoom(Number(e.target.value))}
              className="flex-1 h-1 rounded-full accent-[#e52521]" />
            <button onClick={() => setThumbZoom(Math.min(100, thumbZoom + 10))} className="text-[#888] hover:text-[#333]"><Plus size={13} /></button>
          </div>

          {/* Page thumbnails */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto">
            {thumbnails.map((src, i) => (
              <div
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`cursor-pointer rounded-lg border-2 transition-all flex flex-col items-center p-1.5 gap-1 ${
                  currentPage === i
                    ? 'border-[#e52521] shadow-md'
                    : 'border-transparent hover:border-[#ccc] dark:hover:border-[#444]'
                }`}
              >
                <img
                  src={src} alt={`Page ${i + 1}`}
                  className="w-full h-auto rounded shadow-sm bg-white"
                  style={{ width: `${thumbZoom}%`, margin: '0 auto', display: 'block' }}
                />
                <span className="text-[11px] text-[#666] dark:text-[#aaa] font-medium">{i + 1}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── CENTER CANVAS AREA ─────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-auto bg-[#e8e8e8] dark:bg-[#0d0d0d] flex flex-col items-center py-8 px-4 relative"
          onClick={() => { if (toolMode === 'select') setSelectedId(null); }}
        >
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="relative shadow-2xl"
            style={{ display: 'inline-block', cursor: toolMode === 'text' ? 'text' : toolMode === 'pan' ? 'grab' : 'default' }}
          >
            {/* Base PDF canvas */}
            <canvas ref={pageCanvasRef} className="block bg-white" />

            {/* Whiteout masks for edited existing texts */}
            {texts.filter(t => t.id.startsWith('ext-') && t.pageIndex === currentPage).map(t => {
              const ext = extractedTexts.find(e => e.id === t.id);
              if (!ext) return null;
              return (
                <div
                  key={`mask-${t.id}`}
                  className="absolute"
                  style={{
                    left: ext.x * scale,
                    top: ext.y * scale,
                    width: ext.width * scale,
                    height: ext.height * scale,
                    backgroundColor: t.backgroundColor || 'transparent',
                    zIndex: 2,
                  }}
                />
              );
            })}

            {/* Extracted text hover zones (Edit mode only) — single-click to edit */}
            {mainMode === 'edit' && toolMode === 'select' && extractedTexts.filter(ext => !texts.some(t => t.id === ext.id)).map(ext => (
              <div
                key={ext.id}
                onClick={e => { e.stopPropagation(); handleExtractedDoubleClick(ext); }}
                title="Click to edit this text"
                className="absolute cursor-text rounded-sm border border-transparent hover:border-dashed hover:border-blue-400 hover:bg-blue-500/10 transition-all"
                style={{
                  left: ext.x * scale, top: ext.y * scale,
                  width: ext.width * scale + 16, height: ext.height * scale + 6,
                  zIndex: 5,
                }}
              />
            ))}

            {/* Text overlay elements with iLovePDF-style bounding box */}
            {texts.filter(t => t.pageIndex === currentPage).map(t => {
              const isSel = selectedId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={e => { e.stopPropagation(); setSelectedId(t.id); }}
                  className="absolute origin-top-left"
                  style={{
                    left: t.x * scale, top: t.y * scale,
                    width: t.width,
                    zIndex: 10,
                    outline: 'none',
                    background: 'transparent',
                    transform: `scale(${scale})`,
                  }}
                >
                  <input
                    type="text"
                    value={t.text}
                    onChange={e => updateSelectedText({ text: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    autoFocus={isSel}
                    className="w-full bg-transparent border-none outline-none p-0"
                    style={{
                      fontSize: `${t.fontSize}px`,
                      fontFamily: t.fontFamily,
                      color: t.fontColor,
                      fontWeight: t.isBold ? 'bold' : 'normal',
                      fontStyle: t.isItalic ? 'italic' : 'normal',
                      textDecoration: [t.isUnderline ? 'underline' : '', t.isStrike ? 'line-through' : ''].filter(Boolean).join(' '),
                      textAlign: t.align,
                    }}
                  />
                  {/* Floating action mini-toolbar below element */}
                  {isSel && (
                    <div className="absolute -bottom-12 left-0 flex items-center gap-0.5 bg-[#1e1e1e] rounded-xl px-2 py-1 shadow-xl z-30 origin-top-left"
                      style={{ 
                        whiteSpace: 'nowrap',
                        transform: `scale(${1 / scale})` 
                      }}
                    >
                      <button onClick={e => { e.stopPropagation(); duplicateSelected(); }}
                        className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-all" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteSelected(); }}
                        className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom floating page navigation bar — exact iLovePDF style */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1f2937]/90 backdrop-blur-md text-white rounded-2xl px-4 py-2 shadow-2xl z-50 border border-white/10">
            {/* Page nav */}
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronUp size={15} />
            </button>
            <div className="flex items-center gap-1 text-sm font-mono">
              <input
                type="text" value={pageInputVal}
                onChange={e => setPageInputVal(e.target.value)}
                onBlur={() => {
                  const n = parseInt(pageInputVal, 10) - 1;
                  if (!isNaN(n) && n >= 0 && n < numPages) setCurrentPage(n);
                  else setPageInputVal(`${currentPage + 1}`);
                }}
                className="w-8 bg-white/10 rounded text-center text-xs border-none outline-none focus:bg-white/20"
              />
              <span className="text-white/50">/</span>
              <span className="text-xs">{numPages}</span>
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(numPages - 1, p + 1))} disabled={currentPage === numPages - 1}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-all">
              <ChevronDown size={15} />
            </button>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-1 rounded hover:bg-white/10"><Minus size={14} /></button>
            <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="p-1 rounded hover:bg-white/10"><Plus size={14} /></button>

            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Fit width */}
            <button onClick={() => setZoom(0.55)} title="Fit Width" className="p-1 rounded hover:bg-white/10">
              <Maximize2 size={14} />
            </button>
            {/* Full screen */}
            <button title="Full Screen" className="p-1 rounded hover:bg-white/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
            {/* Search */}
            <button title="Search in PDF" className="p-1 rounded hover:bg-white/10">
              <Search size={14} />
            </button>
          </div>
        </main>

        {/* ─── RIGHT PROPERTIES PANEL — exact iLovePDF style ───────────────── */}
        <aside className="w-[260px] bg-white dark:bg-[#1a1a1a] border-l border-[#e0e0e0] dark:border-[#2a2a2a] flex flex-col shrink-0 overflow-y-auto">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[#eee] dark:border-[#222]">
            <h2 className="text-[15px] font-bold text-[#111] dark:text-white">Edit PDF</h2>
            <p className="text-xs text-[#888] dark:text-[#666] mt-1 flex items-start gap-1.5">
              <span className="text-blue-500 mt-0.5">ⓘ</span>
              Use the toolbar to modify or add text, upload images, and annotate with ease.
            </p>
          </div>

          <div className="flex-1 px-4 py-4 space-y-5">
            {/* Text Styles */}
            <div>
              <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wide mb-2">Text Styles</p>

              {/* Font family + size row */}
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedText ? selectedText.fontFamily : fontFamily}
                  onChange={e => { setFontFamily(e.target.value); updateSelectedText({ fontFamily: e.target.value }); }}
                  className="flex-1 min-w-0 text-xs border border-[#d0d0d0] dark:border-[#333] rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:border-[#e52521]"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select
                  value={selectedText ? selectedText.fontSize : fontSize}
                  onChange={e => { const v = Number(e.target.value); setFontSize(v); updateSelectedText({ fontSize: v }); }}
                  className="w-[64px] text-xs border border-[#d0d0d0] dark:border-[#333] rounded-lg px-2 py-1.5 bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:border-[#e52521]"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* B I U A strikethrough row */}
              <div className="flex items-center gap-1.5 mb-2">
                {[
                  { label: 'B', key: 'isBold' as const, style: 'font-bold' },
                  { label: 'I', key: 'isItalic' as const, style: 'italic' },
                  { label: 'U', key: 'isUnderline' as const, style: 'underline' },
                  { label: 'A', key: 'isStrike' as const, style: 'line-through' },
                ].map(({ label, key, style }) => {
                  const active = selectedText ? (selectedText as any)[key] : (
                    key === 'isBold' ? isBold : key === 'isItalic' ? isItalic : key === 'isUnderline' ? isUnderline : isStrike
                  );
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        const next = !active;
                        if (key === 'isBold') setIsBold(next);
                        else if (key === 'isItalic') setIsItalic(next);
                        else if (key === 'isUnderline') setIsUnderline(next);
                        else setIsStrike(next);
                        updateSelectedText({ [key]: next } as any);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${
                        active
                          ? 'border-[#e52521] bg-red-50 text-[#e52521] dark:bg-red-950/30'
                          : 'border-[#d0d0d0] dark:border-[#333] text-[#444] dark:text-[#aaa] hover:bg-[#f5f5f5] dark:hover:bg-[#222]'
                      } ${style === 'font-bold' ? 'font-bold' : style === 'italic' ? 'italic' : style === 'underline' ? 'underline decoration-current' : 'line-through'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Alignment row */}
              <div className="flex items-center gap-1.5 mb-2">
                {[
                  { icon: <AlignLeft size={15} />, val: 'left' as const },
                  { icon: <AlignCenter size={15} />, val: 'center' as const },
                  { icon: <AlignRight size={15} />, val: 'right' as const },
                ].map(({ icon, val }) => {
                  const active = (selectedText ? selectedText.align : textAlign) === val;
                  return (
                    <button
                      key={val}
                      onClick={() => { setTextAlign(val); updateSelectedText({ align: val }); }}
                      className={`flex-1 py-1.5 flex justify-center rounded-lg border transition-all ${
                        active
                          ? 'border-[#e52521] bg-red-50 text-[#e52521] dark:bg-red-950/30'
                          : 'border-[#d0d0d0] dark:border-[#333] text-[#444] dark:text-[#aaa] hover:bg-[#f5f5f5] dark:hover:bg-[#222]'
                      }`}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Hyperlink */}
              <button
                className="flex items-center gap-1.5 text-[#555] dark:text-[#aaa] text-xs hover:text-[#e52521] transition-all py-1"
                onClick={() => {
                  const url = prompt('Enter URL:', selectedText?.linkUrl || '');
                  if (url !== null) { setLinkUrl(url); updateSelectedText({ linkUrl: url }); }
                }}
              >
                <LinkIcon size={14} />
                <span>{selectedText?.linkUrl ? selectedText.linkUrl.slice(0, 26) + '…' : 'Add link'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#eee] dark:border-[#222]" />

            {/* Current Color */}
            <div>
              <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wide mb-2">Current Color</p>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-[#111] shadow-md cursor-pointer"
                  style={{ background: selectedText ? selectedText.fontColor : fontColor }}
                />
                <div className="w-8 h-8 rounded-lg border border-[#d0d0d0] dark:border-[#333] shadow-sm cursor-pointer relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #fff 50%, #aaa 50%)' }}
                />
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <p className="text-[11px] font-semibold text-[#888] uppercase tracking-wide mb-2">Custom Colors</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setFontColor(c); updateSelectedText({ fontColor: c }); }}
                    className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      background: c,
                      borderColor: (selectedText ? selectedText.fontColor : fontColor) === c ? '#111' : 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                ))}
                {/* Custom color picker plus button */}
                <label className="w-7 h-7 rounded-full border-2 border-dashed border-[#bbb] flex items-center justify-center cursor-pointer hover:border-[#e52521] transition-all">
                  <Plus size={14} className="text-[#888]" />
                  <input type="color" className="hidden" value={fontColor}
                    onChange={e => { setFontColor(e.target.value); updateSelectedText({ fontColor: e.target.value }); }}
                  />
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#eee] dark:border-[#222]" />

            {/* Undo / Redo */}
            <div className="flex items-center gap-3">
              <button
                onClick={undo} disabled={histIdx === 0}
                className="p-2 rounded-lg border border-[#d0d0d0] dark:border-[#333] text-[#555] dark:text-[#aaa] hover:bg-[#f5f5f5] dark:hover:bg-[#222] disabled:opacity-30 transition-all"
                title="Undo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
              </button>
              <button
                onClick={redo} disabled={histIdx === history.length - 1}
                className="p-2 rounded-lg border border-[#d0d0d0] dark:border-[#333] text-[#555] dark:text-[#aaa] hover:bg-[#f5f5f5] dark:hover:bg-[#222] disabled:opacity-30 transition-all"
                title="Redo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-4.95"/></svg>
              </button>
            </div>
          </div>

          {/* Bottom Save Changes */}
          <div className="p-4 border-t border-[#eee] dark:border-[#222]">
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              style={{ background: isProcessing ? '#ccc' : 'linear-gradient(135deg, #e52521 0%, #c41d1a 100%)' }}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
              Save changes
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EditPdfConverter;
