import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, FileText, X, Download, Trash2, AlertCircle, Plus, ChevronRight, RectangleVertical, RectangleHorizontal, RotateCw, Settings } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';
import { jsPDF } from 'jspdf';

interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  rotation: number;
}

type Orientation = 'portrait' | 'landscape';
type PageSize = 'a4' | 'fit' | 'letter';
type MarginSize = 'no' | 'small' | 'big';

export const JpgToPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Options state matching iLovePDF Workbench
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [margin, setMargin] = useState<MarginSize>('no');
  
  // Mobile settings drawer state
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    setError(null);
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/jpeg') || file.type.startsWith('image/png') || file.type.startsWith('image/webp')
    );

    if (validFiles.length !== fileArray.length) {
      setError('Only JPG, PNG, and WebP images are supported.');
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      rotation: 0
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const rotateImage = (id: string) => {
    setImages(prev => prev.map(img => {
      if (img.id === id) {
        return { ...img, rotation: (img.rotation + 90) % 360 };
      }
      return img;
    }));
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
    setIsMobileSettingsOpen(false);
  };

  // Real PDF Generation applying exact orientation, page size, and margins
  const generatePdf = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    setError(null);

    // Yield to the event loop so the button spinner can render before the blocking operation
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      let jsPdfFormat: string | [number, number] = 'a4';
      if (pageSize === 'letter') jsPdfFormat = 'letter';

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'pt',
        format: pageSize === 'fit' ? 'a4' : jsPdfFormat
      });

      let marginPts = 0;
      if (margin === 'small') marginPts = 24;
      if (margin === 'big') marginPts = 48;

      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];

        const img = new Image();
        img.src = imgData.previewUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        let renderCanvas = document.createElement('canvas');
        const ctx = renderCanvas.getContext('2d');
        if (imgData.rotation % 180 !== 0) {
          renderCanvas.width = img.height;
          renderCanvas.height = img.width;
        } else {
          renderCanvas.width = img.width;
          renderCanvas.height = img.height;
        }

        if (ctx) {
          ctx.translate(renderCanvas.width / 2, renderCanvas.height / 2);
          ctx.rotate((imgData.rotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        }

        const base64Data = renderCanvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = renderCanvas.width;
        const imgHeight = renderCanvas.height;

        let pdfWidth: number;
        let pdfHeight: number;

        if (pageSize === 'fit') {
          pdfWidth = imgWidth + marginPts * 2;
          pdfHeight = imgHeight + marginPts * 2;
          if (i > 0) {
            pdf.addPage([pdfWidth, pdfHeight], orientation);
          } else {
            pdf.deletePage(1);
            pdf.addPage([pdfWidth, pdfHeight], orientation);
          }
        } else {
          if (i > 0) pdf.addPage(jsPdfFormat, orientation);
          pdfWidth = pdf.internal.pageSize.getWidth();
          pdfHeight = pdf.internal.pageSize.getHeight();
        }

        const availWidth = pdfWidth - marginPts * 2;
        const availHeight = pdfHeight - marginPts * 2;

        const imgRatio = imgWidth / imgHeight;
        const availRatio = availWidth / availHeight;

        let drawW = availWidth;
        let drawH = availHeight;
        let x = marginPts;
        let y = marginPts;

        if (imgRatio > availRatio) {
          drawW = availWidth;
          drawH = availWidth / imgRatio;
          y = marginPts + (availHeight - drawH) / 2;
        } else {
          drawH = availHeight;
          drawW = availHeight * imgRatio;
          x = marginPts + (availWidth - drawW) / 2;
        }

        pdf.addImage(base64Data, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
      }

      const arrayBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(blobUrl);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'converted-images.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsMobileSettingsOpen(false);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setError(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setImages([]);
    setError(null);
  }, [pdfUrl]);

  // Render options form component to share between Desktop Sidebar & Mobile Drawer
  const renderOptionsForm = () => (
    <div className="space-y-6">
      {/* Page Orientation */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          PAGE ORIENTATION
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setOrientation('portrait')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
              orientation === 'portrait'
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-[#e52521]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <RectangleVertical size={26} className="mb-1.5" />
            <span className="text-xs font-bold">Portrait</span>
          </button>

          <button
            onClick={() => setOrientation('landscape')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
              orientation === 'landscape'
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-[#e52521]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <RectangleHorizontal size={26} className="mb-1.5" />
            <span className="text-xs font-bold">Landscape</span>
          </button>
        </div>
      </div>

      {/* Page Size */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          PAGE SIZE
        </label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value as PageSize)}
          className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#e52521] cursor-pointer"
        >
          <option value="a4">A4 (297×210 mm)</option>
          <option value="fit">Fit (Same page size as image)</option>
          <option value="letter">US Letter (215.9×279.4 mm)</option>
        </select>
      </div>

      {/* Margin */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          MARGIN
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setMargin('no')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
              margin === 'no'
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-[#e52521]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <div className="w-5 h-5 border-2 border-current rounded mb-1 flex items-center justify-center">
              <div className="w-full h-full bg-current/20" />
            </div>
            <span className="text-[11px] font-bold">No margin</span>
          </button>

          <button
            onClick={() => setMargin('small')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
              margin === 'small'
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-[#e52521]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <div className="w-5 h-5 border-2 border-dashed border-current rounded mb-1 p-0.5">
              <div className="w-full h-full bg-current/20" />
            </div>
            <span className="text-[11px] font-bold">Small</span>
          </button>

          <button
            onClick={() => setMargin('big')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
              margin === 'big'
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-[#e52521]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-300'
            }`}
          >
            <div className="w-5 h-5 border-2 border-dashed border-current rounded mb-1 p-1">
              <div className="w-full h-full bg-current/20" />
            </div>
            <span className="text-[11px] font-bold">Big</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (pdfUrl) {
    return (
      <div className="w-full font-sans">
        <ToolDownloadStep 
          title="The images have been converted to PDF"
          downloadUrl={pdfUrl}
          downloadFileName="converted-images.pdf"
          onReset={handleReset}
        />
        <SeoGuideSection toolId="jpg-to-pdf" />
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('services')}
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
        >
          &larr; Back to Services
        </button>

        {images.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={14} /> Clear All ({images.length})
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Main Step 1 Hero or Step 2 iLovePDF Workbench */}
      {images.length === 0 ? (
        <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
          <ToolHeroUpload
            title="JPG to PDF"
            description="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
            buttonText="Select JPG images"
            dropText="or drop JPG images here"
            accept="image/jpeg, image/png, image/webp"
            multiple={true}
            onFilesSelected={(files) => handleFiles(files)}
            error={error}
          />
        </div>
      ) : (
        <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* iLovePDF Step 2 Layout */}
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            
            {/* Left/Center Canvas */}
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className="w-full lg:flex-1 bg-[#f4f5f8] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 min-h-[520px] relative flex flex-col justify-between"
            >
              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-20 lg:pb-0">
                {images.map((img, idx) => (
                  <div 
                    key={img.id}
                    className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center relative"
                  >
                    {/* Index badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white text-[11px] font-bold flex items-center justify-center z-10 shadow">
                      {idx + 1}
                    </div>

                    {/* Rotate & Remove Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => rotateImage(img.id)}
                        className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow"
                        title="Rotate Image"
                      >
                        <RotateCw size={13} />
                      </button>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="w-7 h-7 rounded-lg bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer shadow"
                        title="Remove Image"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Image Preview Thumbnail */}
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-2.5">
                      <img 
                        src={img.previewUrl} 
                        alt={img.name} 
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                      />
                    </div>

                    {/* Filename label */}
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center px-1" title={img.name}>
                      {img.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Floating Action Controls Stack on Canvas Right Edge (Positioned Vertically Middle Right) */}
              <div className="fixed lg:absolute top-1/3 right-4 sm:right-6 z-30 flex flex-col items-center gap-3">
                
                {/* Floating Gear / Settings Icon Button (Mobile Only, triggers Slide-over Drawer) */}
                <div className="relative group lg:hidden">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Image to PDF options
                  </span>
                  <button
                    onClick={() => setIsMobileSettingsOpen(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-800 transition-transform active:scale-95 cursor-pointer"
                    title="Image to PDF options"
                  >
                    <Settings size={22} className="text-slate-800 dark:text-white" />
                  </button>
                </div>

                {/* Floating Add More Files (+) Button with Badge */}
                <div className="relative group">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Add more files
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-full bg-[#e52521] hover:bg-[#d01f1c] text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer relative"
                  >
                    <Plus size={26} strokeWidth={2.5} />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {images.length}
                    </span>
                  </button>
                </div>

                {/* Floating Dropbox Button with Official SVG */}
                <div className="relative group">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Add from Dropbox
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-11 h-11 rounded-full bg-[#e52521] hover:bg-[#d01f1c] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer p-2.5"
                  >
                    <img src="/dropbox.svg" alt="Dropbox" className="w-full h-full object-contain brightness-0 invert" />
                  </button>
                </div>
              </div>

              {/* Mobile Fixed Bottom Convert Button Bar (Visible on Mobile) */}
              <div className="fixed bottom-[90px] left-4 right-4 z-40 lg:hidden">
                <button
                  onClick={generatePdf}
                  disabled={images.length === 0 || isGenerating}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:opacity-50 text-white py-3.5 px-4 rounded-2xl text-sm font-extrabold shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <span>Convert to PDF</span>
                      <ChevronRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Desktop Docked Options Sidebar (Visible on Desktop lg Screens) */}
            <div className="hidden lg:flex w-[360px] shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm flex-col justify-between space-y-8">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 font-heading">
                  Image to PDF options
                </h3>

                {renderOptionsForm()}
              </div>

              {/* Convert to PDF Big Red Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={generatePdf}
                  disabled={images.length === 0 || isGenerating}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:opacity-50 text-white py-4 rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <span>Convert to PDF</span>
                      <ChevronRight size={20} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Slide-Over Options Drawer (Triggered by Gear Icon Button) */}
      {isMobileSettingsOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMobileSettingsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" 
          />

          {/* Slide-over Panel from Right Edge */}
          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-[360px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 pt-[88px] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Top Drawer Header with Title & Transparent Close Icon */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
                  Image to PDF options
                </h3>
                <button
                  onClick={() => setIsMobileSettingsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {renderOptionsForm()}
            </div>

            {/* Bottom Action inside Drawer */}
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={generatePdf}
                disabled={images.length === 0 || isGenerating}
                className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:opacity-50 text-white py-4 rounded-xl text-base font-extrabold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <span>Convert to PDF</span>
                    <ChevronRight size={20} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Guide Section */}
      <SeoGuideSection toolId="jpg-to-pdf" />
    </div>
  );
};

export default JpgToPdfConverter;
