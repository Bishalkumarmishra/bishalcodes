import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FilePlus, FileImage, Download, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import JSZip from 'jszip';

export const PdfToImageConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdf, setPdf] = useState<{ id: string; file: File; name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Options
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [quality, setQuality] = useState<1 | 2>(2); // 1 = standard, 2 = high

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('pdfjs-dist').then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }).catch(err => console.error('Failed to load pdfjs-dist', err));
    }
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    setPdf({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size
    });
  }, []);

  const processPdf = async () => {
    if (!pdf) return;
    setIsGenerating(true);
    setError(null);

    try {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(pdf.file);
      });

      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      const zip = new JSZip();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: quality * 1.5 }); // High res scaling

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas as unknown as HTMLCanvasElement,
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Failed to create blob'));
            },
            `image/${format}`,
            format === 'jpeg' ? 0.95 : undefined
          );
        });

        const extension = format === 'jpeg' ? 'jpg' : 'png';
        const paddedNum = i.toString().padStart(3, '0');
        const baseFileName = pdf.name.replace(/\.pdf$/i, '');
        zip.file(`${baseFileName}_page_${paddedNum}.${extension}`, blob);
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const zipName = pdf.name.replace(/\.pdf$/i, '') + '-images.zip';
      link.download = zipName;
      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvent);
      
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    } catch (err: any) {
      console.error('PDF to Image Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-28 pb-4 md:pt-32 md:pb-6 shrink-0">
        <div className="w-full px-4 md:px-6 mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors"
            >
              &larr; Back
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <FileImage size={18} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                PDF to Image
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 py-6 max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!pdf ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                className={`w-full border-2 border-dashed rounded-xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[250px] transition-all duration-200 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                  <FileImage size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Select PDF file
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">
                  Drop your PDF here or browse your computer to convert pages to images.
                </p>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} accept="application/pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors cursor-pointer">
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileImage size={18} className="text-slate-500" />
                    Selected Document
                  </h4>
                </div>
                
                <div className="group flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileImage size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={pdf.name}>{pdf.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(pdf.size)}</p>
                  </div>
                  <button onClick={() => setPdf(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer" title="Remove PDF">
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Output Format</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setFormat('jpeg')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${format === 'jpeg' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <ImageIcon size={16} /> JPG
                      </button>
                      <button 
                        onClick={() => setFormat('png')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${format === 'png' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <ImageIcon size={16} /> PNG
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Resolution Quality</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setQuality(1)}
                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${quality === 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        Standard
                      </button>
                      <button 
                        onClick={() => setQuality(2)}
                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${quality === 2 ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        High (HD)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Convert to Images</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                All pages will be converted to {format.toUpperCase()} and packed into a .zip file.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={processPdf}
                  disabled={!pdf || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition-all ${
                    !pdf
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                      : isGenerating 
                        ? 'bg-indigo-600/70 text-white cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download .zip
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="pdf-to-image" />

    </div>
  );
};

export default PdfToImageConverter;
