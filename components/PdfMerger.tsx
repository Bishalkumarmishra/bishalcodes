import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Download, Trash2, AlertCircle, FilePlus } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { PDFDocument } from 'pdf-lib';

interface PdfData {
  id: string;
  file: File;
  name: string;
  size: number;
}

export const PdfMerger: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdfs, setPdfs] = useState<PdfData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null);
    
    const validFiles = Array.from(files).filter(file => file.type === 'application/pdf');

    if (validFiles.length !== files.length) {
      setError('Only PDF files are supported.');
    }

    if (validFiles.length === 0) return;

    const newPdfs = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size
    }));

    setPdfs(prev => [...prev, ...newPdfs]);
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

  const removePdf = (id: string) => {
    setPdfs(prev => prev.filter(p => p.id !== id));
  };

  const clearAll = () => {
    setPdfs([]);
    setError(null);
  };

  const mergePdfs = async () => {
    if (pdfs.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      // Create a new empty PDFDocument
      const mergedPdf = await PDFDocument.create();

      for (const pdfData of pdfs) {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(pdfData.file);
        });

        // Load the PDF using pdf-lib
        const pdf = await PDFDocument.load(arrayBuffer);
        
        // Copy all pages from the loaded PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        // Add them to the merged document
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const mergedPdfBytes = await mergedPdf.save();

      // Explicitly construct an application/pdf Blob to ensure robust downloading across browsers
      const pdfBlob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'merged-document.pdf';
      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      link.dispatchEvent(clickEvent);
      
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    } catch (err: any) {
      console.error('PDF Merge Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}. Please try again.`);
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
                Merge PDF
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed mt-2">
                Combine multiple PDFs into a single file at 100% original ultra-high quality. Works completely offline.
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
              className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[250px] transition-all duration-200 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500 dark:text-slate-400">
                <FilePlus size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Drop PDF files here
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">
                Upload 2 or more PDF documents. You can combine massive files without losing any quality.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFiles(e.target.files)} 
                accept="application/pdf" 
                multiple 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Browse PDFs
              </button>
            </div>

            {/* Selected PDFs List */}
            {pdfs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-slate-500" />
                    Selected Documents ({pdfs.length})
                  </h4>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} /> Clear All
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {pdfs.map((pdf, index) => (
                    <div 
                      key={pdf.id} 
                      className="group flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={pdf.name}>
                          {pdf.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatSize(pdf.size)}
                        </p>
                      </div>
                      <button 
                        onClick={() => removePdf(pdf.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remove PDF"
                      >
                        <X size={18} />
                      </button>
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
                <FilePlus size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Merge PDFs</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Documents will be merged exactly in the order listed.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm py-3 border-y border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Files to Merge:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pdfs.length}</span>
                </div>
                
                <button
                  onClick={mergePdfs}
                  disabled={pdfs.length < 2 || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
                    pdfs.length < 2
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                      : isGenerating 
                        ? 'bg-indigo-600/70 text-white cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer hover:shadow-md'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Merging...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download Merged PDF
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                  <p>
                    <strong>Original Quality:</strong> Merges native PDF vectors seamlessly with zero quality loss.
                  </p>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                  <p>
                    <strong>100% Private:</strong> Your files never leave your device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="merge-pdf" />

    </div>
  );
};

export default PdfMerger;
