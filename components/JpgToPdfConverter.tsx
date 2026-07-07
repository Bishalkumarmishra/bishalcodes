import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, FileText, X, Download, Trash2, AlertCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { jsPDF } from 'jspdf';

interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
}

export const JpgToPdfConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null);
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/jpeg') || file.type.startsWith('image/png')
    );

    if (validFiles.length !== files.length) {
      setError('Only JPG and PNG images are supported.');
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file)
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

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setError(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Create a new PDF document in A4 format (portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        const imgData = images[i];
        
        // Load image to get natural dimensions
        const img = new Image();
        img.src = imgData.previewUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Calculate aspect ratio to fit image within A4 page dimensions
        const imgRatio = img.width / img.height;
        const pageRatio = pdfWidth / pdfHeight;

        let renderWidth = pdfWidth;
        let renderHeight = pdfHeight;
        let x = 0;
        let y = 0;

        if (imgRatio > pageRatio) {
          // Image is wider than the page: fit by width
          renderWidth = pdfWidth;
          renderHeight = pdfWidth / imgRatio;
          y = (pdfHeight - renderHeight) / 2; // Center vertically
        } else {
          // Image is taller than the page: fit by height
          renderHeight = pdfHeight;
          renderWidth = pdfHeight * imgRatio;
          x = (pdfWidth - renderWidth) / 2; // Center horizontally
        }

        // Read the exact original file bytes to preserve 100% ultra full quality
        const originalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imgData.file);
        });

        const format = imgData.file.type === 'image/png' ? 'PNG' : 'JPEG';
        // Embed the original raw image directly without any canvas downscaling
        pdf.addImage(originalBase64, format, x, y, renderWidth, renderHeight, undefined, 'FAST');
      }

      // 1. Generate ArrayBuffer and create a strictly typed PDF Blob
      // Explicitly setting application/pdf prevents Chrome from discarding the filename
      const arrayBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // 2. Create link and dispatch a proper MouseEvent
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'converted-images.pdf';
      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      link.dispatchEvent(clickEvent);
      
      // 3. Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}. Try converting fewer images at a time.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              &larr; Back to Services
            </button>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                JPG to PDF Converter
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed mt-2">
                Convert multiple images into a single PDF document. Everything happens securely in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 md:px-8 py-8 max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px] transition-all duration-200 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400">
                <Upload size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Drag & drop images here
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">
                Supports JPG and PNG. You can upload multiple images to combine them into one multi-page PDF.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFiles(e.target.files)} 
                accept="image/jpeg, image/png" 
                multiple 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Browse Files
              </button>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon size={18} className="text-slate-500" />
                    Selected Images ({images.length})
                  </h4>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} /> Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[3/4] bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={img.previewUrl} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeImage(img.id)}
                          className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
                          title="Remove image"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Convert to PDF</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Images will be automatically resized and centered on standard A4 pages.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm py-3 border-y border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Total Images:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{images.length}</span>
                </div>
                
                <button
                  onClick={generatePdf}
                  disabled={images.length === 0 || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
                    images.length === 0 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                      : isGenerating 
                        ? 'bg-indigo-600/70 text-white cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                <p>
                  <strong>100% Private:</strong> Your files never leave your device. All processing is done locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JpgToPdfConverter;
