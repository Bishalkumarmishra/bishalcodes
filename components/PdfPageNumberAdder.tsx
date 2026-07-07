import React, { useState, useRef, useCallback } from 'react';
import { FilePlus, FileText, Download, X, AlertCircle, Hash, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const PdfPageNumberAdder: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdf, setPdf] = useState<{ id: string; file: File; name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Options
  const [style, setStyle] = useState<'standard' | 'roman'>('standard');
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('center');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Convert number to Roman Numeral
  const toRoman = (num: number): string => {
    const lookup: { [key: string]: number } = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman.toLowerCase();
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

      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNumText = style === 'standard' ? `${i + 1}` : toRoman(i + 1);
        const textWidth = helveticaFont.widthOfTextAtSize(pageNumText, fontSize);
        
        const { width } = page.getSize();
        
        let x = 30; // Default left
        if (position === 'center') {
          x = (width / 2) - (textWidth / 2);
        } else if (position === 'right') {
          x = width - textWidth - 30;
        }

        page.drawText(pageNumText, {
          x,
          y: 30, // 30 points from the bottom
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      const modifiedPdfBytes = await pdfDoc.save();
      
      const pdfBlob = new Blob([modifiedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const newName = pdf.name.replace(/\.pdf$/i, '') + '-numbered.pdf';
      link.download = newName;
      document.body.appendChild(link);
      
      const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvent);
      
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    } catch (err: any) {
      console.error('PDF Page Number Error:', err);
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
              <div className="text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Hash size={18} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Page Numbers
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
          {/* Left Column: Upload Area */}
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
                  <FilePlus size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Select PDF file
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">
                  Drop your PDF here or browse your computer to add page numbers.
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
                    <FileText size={18} className="text-slate-500" />
                    Selected Document
                  </h4>
                </div>
                
                <div className="group flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText size={20} />
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
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Numbering Style</label>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => setStyle('standard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${style === 'standard' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <Hash size={16} /> 1, 2, 3...
                      </button>
                      <button 
                        onClick={() => setStyle('roman')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${style === 'roman' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <Hash size={16} /> i, ii, iii...
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Footer Position</label>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => setPosition('left')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${position === 'left' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <AlignLeft size={16} /> Bottom Left
                      </button>
                      <button 
                        onClick={() => setPosition('center')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${position === 'center' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <AlignCenter size={16} /> Bottom Center
                      </button>
                      <button 
                        onClick={() => setPosition('right')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${position === 'right' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <AlignRight size={16} /> Bottom Right
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Process PDF</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Page numbers will be added to every page of the document.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={processPdf}
                  disabled={!pdf || isGenerating}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-medium text-sm transition-all shadow-sm ${
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPageNumberAdder;
