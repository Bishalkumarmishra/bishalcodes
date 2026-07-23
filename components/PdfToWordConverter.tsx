import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Download, X, AlertCircle, RefreshCw, KeyRound, CheckCircle, Sparkles } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { createWorker } from 'tesseract.js';

export const PdfToWordConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdf, setPdf] = useState<{ id: string; file: File; name: string; size: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  // Options
  const [ocrMode, setOcrMode] = useState<boolean>(false); // false = No OCR, true = OCR

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

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(false);
    setDownloadUrl(null);
    
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
    setSuccess(false);
    setDownloadUrl(null);
    setProgress(0);

    try {
      setGenerationStep('Reading document structures...');
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

      const docxParagraphs: Paragraph[] = [];

      // Loop through all pages to parse content
      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round((i / numPages) * 70)); // Reserve last 30% for docx compiling
        setGenerationStep(`Processing page ${i} of ${numPages}...`);
        
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.filter((item: any) => 'str' in item) as any[];
        
        // If regular vector page with selectable text, parse layout
        if (textItems.length > 0 && !ocrMode) {
          // Sort items top-to-bottom (y descending), left-to-right (x ascending)
          const sortedItems = [...textItems].sort((a: any, b: any) => {
            const yA = a.transform[5];
            const yB = b.transform[5];
            if (Math.abs(yA - yB) < 6) {
              return a.transform[4] - b.transform[4];
            }
            return yB - yA;
          });

          // Group items into lines
          const lines: any[] = [];
          let currentLine: any[] = [];
          let currentY = -1;

          for (const item of sortedItems) {
            const y = item.transform[5];
            if (currentLine.length === 0) {
              currentLine.push(item);
              currentY = y;
            } else if (Math.abs(y - currentY) < 6) {
              currentLine.push(item);
            } else {
              lines.push(currentLine);
              currentLine = [item];
              currentY = y;
            }
          }
          if (currentLine.length > 0) lines.push(currentLine);

          // Group lines into paragraphs based on vertical spacing
          const pageParagraphs: any[] = [];
          let currentParagraph: any[] = [];
          let lastY = -1;

          for (const line of lines) {
            let lineText = '';
            let lastXEnd = -1;
            let maxFontSize = 10;
            let isBold = false;
            let isItalic = false;

            for (const item of line) {
              const x = item.transform[4];
              const width = item.width || 0;
              const fontSize = Math.sqrt(item.transform[0]**2 + item.transform[1]**2) || item.transform[3] || 10;
              if (fontSize > maxFontSize) maxFontSize = fontSize;

              const fontNameLower = (item.fontName || '').toLowerCase();
              if (fontNameLower.includes('bold') || fontNameLower.includes('black') || fontNameLower.includes('heavy') || fontNameLower.includes('medium')) {
                isBold = true;
              }
              if (fontNameLower.includes('italic') || fontNameLower.includes('oblique')) {
                isItalic = true;
              }

              if (lineText !== '' && lastXEnd !== -1 && x - lastXEnd > fontSize * 0.25) {
                lineText += ' ';
              }
              lineText += item.str;
              lastXEnd = x + width;
            }

            const y = line[0].transform[5];
            const fontSize = maxFontSize;

            if (pageParagraphs.length === 0 && currentParagraph.length === 0) {
              currentParagraph.push({ text: lineText, fontSize, isBold, isItalic });
              lastY = y;
            } else {
              const gap = Math.abs(lastY - y);
              if (gap > fontSize * 1.8) {
                pageParagraphs.push(currentParagraph);
                currentParagraph = [{ text: lineText, fontSize, isBold, isItalic }];
                lastY = y;
              } else {
                currentParagraph.push({ text: lineText, fontSize, isBold, isItalic });
                lastY = y;
              }
            }
          }
          if (currentParagraph.length > 0) pageParagraphs.push(currentParagraph);

          // Convert parsed paragraphs into DOCX structures
          for (const para of pageParagraphs) {
            const runs: TextRun[] = [];
            for (const run of para) {
              runs.push(
                new TextRun({
                  text: run.text + ' ',
                  bold: run.isBold,
                  italics: run.isItalic,
                  size: Math.min(72, Math.max(16, Math.round(run.fontSize * 2))), // clamp to reasonable Word font sizes
                  font: 'Arial'
                })
              );
            }
            docxParagraphs.push(
              new Paragraph({
                children: runs,
                spacing: { after: 140, line: 276 }
              })
            );
          }

        } else {
          // If page is scanned or OCR mode is enabled, run optical character recognition
          setGenerationStep(`Extracting OCR text from page ${i}...`);
          
          // Render page to high-res canvas
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas rendering engine not loaded.');
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas as unknown as HTMLCanvasElement,
          };
          await page.render(renderContext).promise;

          // Process text recognition via local Tesseract worker
          const worker = await createWorker('eng');
          const { data } = await worker.recognize(canvas);
          await worker.terminate();

          const ocrParagraphs = (data as any).paragraphs || [];

          for (const p of ocrParagraphs) {
            const textLines = p.lines || [];
            const runs: TextRun[] = [];
            
            for (const l of textLines) {
              runs.push(
                new TextRun({
                  text: l.text + '\n',
                  font: 'Arial',
                  size: 22 // Standard 11pt size
                })
              );
            }
            docxParagraphs.push(
              new Paragraph({
                children: runs,
                spacing: { after: 140, line: 276 }
              })
            );
          }
        }
      }

      setGenerationStep('Packaging editable DOCX document...');
      setProgress(85);

      const docxDoc = new Document({
        sections: [
          {
            properties: {},
            children: docxParagraphs
          }
        ]
      });

      const docxBlob = await Packer.toBlob(docxDoc);
      const url = URL.createObjectURL(docxBlob);
      const outName = pdf.name.replace(/\.pdf$/i, '') + '.docx';

      setDownloadUrl(url);
      setDownloadName(outName);
      setSuccess(true);
      setProgress(100);
      
      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = outName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error('PDF to Word Conversion Error:', err);
      setError(`An error occurred during conversion: ${err.message || 'Unknown error'}. Please verify your PDF is not encrypted.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setPdf(null);
    setSuccess(false);
    setError(null);
    setDownloadUrl(null);
    setProgress(0);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-20 pb-4 md:pt-24 md:pb-6 shrink-0">
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
              <div className="text-[#e52521] flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                PDF to Word Converter
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 xl:px-12 py-6">
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
              <ToolHeroUpload
                title="Convert PDF to Word"
                description="Convert PDF to fully editable DOCX Word files with maximum layout precision."
                buttonText="Select PDF file"
                dropText="or drop PDF file here"
                accept="application/pdf"
                multiple={false}
                onFilesSelected={(files) => handleFiles(files)}
                error={error}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-slate-500" />
                    Selected Document
                  </h4>
                </div>

                <div className="group flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                  <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-950/30 text-[#e52521] dark:text-[#d01f1c] flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={pdf.name}>{pdf.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(pdf.size)}</p>
                  </div>
                  <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer" title="Remove PDF">
                    <X size={20} />
                  </button>
                </div>

                {isGenerating && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <span>{generationStep}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-[#e52521] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                {success && downloadUrl && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 rounded-lg p-4 flex gap-3 text-sm text-emerald-800 dark:text-emerald-400">
                      <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                      <div>
                        <span className="font-bold">Conversion Completed!</span> Your file has been downloaded. If the download didn't trigger automatically, click the button below.
                      </div>
                    </div>
                    <a
                      href={downloadUrl}
                      download={downloadName}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-600/10 transition-colors"
                    >
                      <Download size={16} />
                      Download Word Document
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Settings & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Conversion Options</h3>
              
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={!pdf || isGenerating}
                  onClick={() => setOcrMode(false)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    !ocrMode
                      ? 'border-[#e52521] bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-650 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider">No OCR</span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80">
                    Reconstruct layouts, structures, and fonts directly from vector text documents. Best for native PDFs.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!pdf || isGenerating}
                  onClick={() => setOcrMode(true)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    ocrMode
                      ? 'border-[#e52521] bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-650 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider">OCR Engine</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-[#e52521] rounded font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50">
                      OCR
                    </span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80">
                    Analyze scanned paper docs or flattened pages using built-in OCR text extraction.
                  </p>
                </button>
              </div>

              {pdf && !isGenerating && !success && (
                <button
                  onClick={processPdf}
                  className="w-full mt-6 flex items-center justify-center gap-1.5 px-6 py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-lg text-sm font-bold shadow-md shadow-red-600/10 transition-all active:scale-98 cursor-pointer"
                >
                  <Sparkles size={16} />
                  Convert to WORD
                </button>
              )}
            </div>

            {/* Privacy Alert */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-4 flex gap-3 text-xs leading-normal">
              <KeyRound size={16} className="text-[#e52521] dark:text-[#d01f1c] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-900 dark:text-red-300 block mb-0.5">Secure edge processing</span>
                <span className="text-red-800/90 dark:text-red-400/80 font-medium">
                  Document parsing, layout mapping, and OCR calculations run 100% locally in your sandbox browser. Files are never uploaded to our server.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
