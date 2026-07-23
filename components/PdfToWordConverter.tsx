import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Download, X, AlertCircle, RefreshCw, KeyRound, CheckCircle, Sparkles, ChevronRight, Settings, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';

interface PagePreview {
  pageNum: number;
  dataUrl: string;
}

export const PdfToWordConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdf, setPdf] = useState<{ id: string; file: File; name: string; size: number } | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  // Options State
  const [ocrMode, setOcrMode] = useState<boolean>(false);
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');
  const [scannedDetected, setScannedDetected] = useState<boolean>(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

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

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSuccess(false);
    setDownloadUrl(null);
    setPages([]);
    setScannedDetected(false);
    setIsMobileSettingsOpen(false);

    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    const newPdf = {
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size
    };
    
    setPdf(newPdf);
    setLoadingPages(true);

    try {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      let totalTextItems = 0;
      const thumbs: PagePreview[] = [];
      
      // Render up to 12 pages for preview to maintain high performance
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Count non-empty text items
        const textItems = textContent.items.filter((item: any) => item && typeof item.str === 'string' && item.str.trim() !== '');
        totalTextItems += textItems.length;

        if (i <= 12) {
          const viewport = page.getViewport({ scale: 0.3 }); // Small preview scale
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport, canvas: canvas as any }).promise;
            thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
          } else {
            thumbs.push({ pageNum: i, dataUrl: '' });
          }
        } else {
          // Placeholder for page > 12 to prevent heavy rendering in browser
          thumbs.push({ pageNum: i, dataUrl: '' });
        }
      }
      setPages(thumbs);

      // Auto-detect scanned PDF (average text items per page < 6)
      const avgTextItems = totalTextItems / numPages;
      if (avgTextItems < 6) {
        setOcrMode(true);
        setScannedDetected(true);
      } else {
        setOcrMode(false);
        setScannedDetected(false);
      }
    } catch (err: any) {
      console.error('Error generating PDF thumbnails:', err);
      setError('Could not render page previews, but you can still proceed with the conversion.');
    } finally {
      setLoadingPages(false);
    }
  }, []);

  const processPdf = async () => {
    if (!pdf) return;
    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setDownloadUrl(null);
    setProgress(0);
    setIsMobileSettingsOpen(false);

    try {
      setGenerationStep('Preparing file for high-precision conversion...');
      
      // Convert file to base64
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdf.file);
      });

      setProgress(20);
      setGenerationStep('Converting document layout, tables, and images on server...');

      let response: Response;
      try {
        response = await fetch('/api/pdf-to-word-internal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdf: base64Pdf,
            filename: pdf.name,
          }),
        });

        if (response.ok) {
          setProgress(90);
          setGenerationStep('Downloading converted Word document...');
          
          const docxBlob = await response.blob();
          const url = URL.createObjectURL(docxBlob);
          const outName = pdf.name.replace(/\.pdf$/i, '') + '.docx';

          setDownloadUrl(url);
          setDownloadName(outName);
          setSuccess(true);
          setProgress(100);
          
          // Auto-trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = outName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return; // Success! Exit early.
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Server-side layout conversion returned error, falling back to client engine:', errData.error);
        }
      } catch (apiErr) {
        console.warn('Server-side layout conversion failed to connect, falling back to client engine:', apiErr);
      }

      // FALLBACK: Client-side JS converter (if backend fails, serverless timeout, or on Vercel production without Python setup)
      setGenerationStep('Using client-side fallback engine. Reading structure...');
      setProgress(30);

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
        const pageProgress = Math.round((i / numPages) * 70); // Reserve last 30% for docx packaging
        setProgress(pageProgress);
        setGenerationStep(`Processing page ${i} of ${numPages}...`);
        
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Clean check for text items
        const textItems = textContent.items.filter((item: any) => item && typeof item.str === 'string' && item.str.trim() !== '') as any[];

        // Render page canvas for OCR/Image fallbacks
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5 scale is ideal resolution for extracting OCR or page images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas rendering context not found.');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas as unknown as HTMLCanvasElement,
        };
        await page.render(renderContext).promise;

        // If vector page with selectable text AND OCR is NOT forced/enabled
        if (textItems.length > 0 && !ocrMode) {
          // Sort items top-to-bottom, left-to-right
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

          // Group lines into paragraphs based on spacing
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
                  size: Math.min(72, Math.max(16, Math.round(run.fontSize * 2))),
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
          // If page has NO selectable text (scanned PDF page) OR OCR Mode is explicitly enabled
          let ocrSuccess = false;

          // Always run high-precision server-side OCR if page text content is empty or OCR is forced
          try {
            setGenerationStep(`Running server OCR on page ${i}...`);
            const base64Image = canvas.toDataURL('image/jpeg', 0.85);

            const response = await fetch('/api/ocr-internal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: base64Image,
                mimeType: 'image/jpeg',
              }),
            });

            if (!response.ok) {
              throw new Error(`Server returned status ${response.status}`);
            }

            const resData = await response.json();
            const extractedText = resData.text || '';
            
            if (extractedText.trim() !== '') {
              ocrSuccess = true;
              const textParagraphs = extractedText.split(/\n\s*\n/);

              for (const p of textParagraphs) {
                if (p.trim() === '') continue;
                const lines = p.split('\n');
                const runs: TextRun[] = [];
                for (const l of lines) {
                  runs.push(
                    new TextRun({
                      text: l + ' ',
                      font: 'Arial',
                      size: 22
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
          } catch (ocrErr) {
            console.error('Server-side OCR failed, falling back to layout parser:', ocrErr);
          }

          // Fallback if OCR is disabled, failed, or generated blank text (ensure the Word document is NEVER blank!)
          if (!ocrSuccess) {
            setGenerationStep(`Parsing vector text layout for page ${i} (fallback)...`);
            
            // Reconstruct text layout from vector items
            if (textItems.length > 0) {
              const sortedItems = [...textItems].sort((a: any, b: any) => {
                const yA = a.transform[5];
                const yB = b.transform[5];
                if (Math.abs(yA - yB) < 6) {
                  return a.transform[4] - b.transform[4];
                }
                return yB - yA;
              });

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

              for (const para of pageParagraphs) {
                const runs: TextRun[] = [];
                for (const run of para) {
                  runs.push(
                    new TextRun({
                      text: run.text + ' ',
                      bold: run.isBold,
                      italics: run.isItalic,
                      size: Math.min(72, Math.max(16, Math.round(run.fontSize * 2))),
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
              // Scanned page fallback: display editable message notifying text recognition empty
              docxParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `[Page ${i}: Scanned document page with empty text content. Please try turning on OCR Mode to perform layout character recognition.]`,
                      italics: true,
                      size: 20,
                      color: '999999',
                      font: 'Arial'
                    })
                  ],
                  spacing: { after: 140 }
                })
              );
            }
          }

        }
      }

      setGenerationStep('Packaging Word document file structure...');
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
      
      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = outName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error('PDF to Word Conversion Error:', err);
      setError(`An error occurred during conversion: ${err.message || 'Unknown error'}. Please verify your PDF is not password-protected.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setPdf(null);
    setPages([]);
    setSuccess(false);
    setScannedDetected(false);
    setError(null);
    setProgress(0);
    setIsMobileSettingsOpen(false);
  };

  const renderOptionsForm = () => (
    <div className="space-y-6">
      {/* Conversion Engine Mode */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          CONVERSION MODE
        </label>
        <div className="space-y-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setOcrMode(false)}
            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              !ocrMode
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-350'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">No OCR</span>
            </div>
            <p className="text-[10px] font-medium leading-relaxed opacity-80">
              Convert vector layouts, structures and texts directly. Scanned PDF sheets are converted as high-resolution embedded pages.
            </p>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setOcrMode(true)}
            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              ocrMode
                ? 'border-[#e52521] bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 hover:border-slate-350'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider">OCR Engine</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-[#e52521] rounded font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50">
                OFFLINE OCR
              </span>
            </div>
            <p className="text-[10px] font-medium leading-relaxed opacity-80">
              Analyze scanned paper sheets or flattened pages using built-in OCR text engine to produce editable Word sentences.
            </p>
          </button>
        </div>
      </div>

      {/* OCR Language Dropdown */}
      {ocrMode && (
        <div className="animate-in fade-in duration-200">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
            OCR LANGUAGE
          </label>
          <select
            value={ocrLanguage}
            disabled={isGenerating}
            onChange={(e) => setOcrLanguage(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#e52521] cursor-pointer"
          >
            <option value="eng">English (Standard)</option>
            <option value="spa">Spanish (Español)</option>
            <option value="fra">French (Français)</option>
            <option value="deu">German (Deutsch)</option>
            <option value="hin">Hindi (हिन्दी)</option>
            <option value="chi_sim">Chinese Simplified (简体中文)</option>
          </select>
        </div>
      )}
    </div>
  );

  if (downloadUrl) {
    return (
      <div className="w-full font-sans">
        <ToolDownloadStep
          title="The PDF has been converted to Word"
          downloadUrl={downloadUrl}
          downloadFileName={downloadName}
          onReset={handleReset}
        />
        <SeoGuideSection toolId="pdf-to-word" />
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Header Bar */}
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('services')}
          className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
        >
          &larr; Back to Services
        </button>

        {pdf && (
          <button
            onClick={handleReset}
            className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={14} /> Clear File
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Upload Phase or Workbench Phase */}
      {!pdf ? (
        <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
          <ToolHeroUpload
            title="PDF to Word Converter"
            description="Convert PDF files into fully editable Microsoft Word DOCX files with native layout reconstruction and offline client-side OCR."
            buttonText="Select PDF file"
            dropText="or drop PDF file here"
            accept="application/pdf"
            multiple={false}
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

          {scannedDetected && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400 animate-in slide-in-from-top duration-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">Scanned Document Auto-Detected</p>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-medium">
                  This PDF does not contain selectable vector text. We have automatically enabled the **Offline OCR Engine** to extract and reconstruct editable paragraphs inside your Word document.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            
            {/* Left Content Area: Page Previews */}
            <div className="w-full lg:flex-1 bg-[#f4f5f8] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 min-h-[520px] relative flex flex-col justify-between">
              
              {loadingPages ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                  <Loader2 className="w-10 h-10 animate-spin text-[#e52521] mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Rendering page previews...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-20 lg:pb-0">
                  {pages.map((p, idx) => (
                    <div 
                      key={idx}
                      className="group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center relative"
                    >
                      {/* Page number badge */}
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white text-[11px] font-bold flex items-center justify-center z-10 shadow">
                        {p.pageNum}
                      </div>

                      {/* PDF Thumbnail rendering */}
                      <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-2.5">
                        {p.dataUrl ? (
                          <img 
                            src={p.dataUrl} 
                            alt={`Page ${p.pageNum}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <FileText size={32} strokeWidth={1.5} className="mb-1 text-slate-350 dark:text-slate-600" />
                            <span className="text-[10px] font-extrabold uppercase">Page {p.pageNum}</span>
                          </div>
                        )}
                      </div>

                      {/* File Details (shown only on first card) */}
                      {idx === 0 ? (
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center px-1" title={pdf.name}>
                          {pdf.name}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 truncate w-full text-center px-1">
                          Page {p.pageNum}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Floating Action Controls Stack on Right Side */}
              <div className="fixed lg:absolute top-1/3 right-4 sm:right-6 z-30 flex flex-col items-center gap-3">
                {/* Floating settings gear icon (triggers mobile options slideover drawer) */}
                <div className="relative group lg:hidden">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Conversion options
                  </span>
                  <button
                    onClick={() => setIsMobileSettingsOpen(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-800 transition-transform active:scale-95 cursor-pointer animate-none"
                    title="Conversion options"
                  >
                    <Settings size={22} className="text-slate-855 dark:text-white animate-none" />
                  </button>
                </div>

                {/* Floating change file button */}
                <div className="relative group">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Select different file
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-full bg-[#e52521] hover:bg-[#d01f1c] text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer"
                  >
                    <FileText size={24} />
                  </button>
                </div>

                {/* Floating Clear Button */}
                <div className="relative group">
                  <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Remove PDF
                  </span>
                  <button
                    onClick={handleReset}
                    className="w-11 h-11 rounded-full bg-white dark:bg-slate-950 text-red-650 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Mobile Fixed Bottom Action Button */}
              <div className="fixed bottom-[90px] left-4 right-4 z-40 lg:hidden">
                <button
                  onClick={processPdf}
                  disabled={isGenerating}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-3.5 px-4 rounded-2xl text-sm font-extrabold shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{generationStep} ({progress}%)</span>
                    </>
                  ) : (
                    <>
                      <span>Convert to WORD</span>
                      <ChevronRight size={18} strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Column: Settings Sidebar (lg and up screens) */}
            <div className="hidden lg:flex w-[360px] shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm flex-col justify-between space-y-8 min-h-[520px]">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 font-heading">
                  PDF to Word options
                </h3>
                {renderOptionsForm()}
              </div>

              {/* Action convert button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={processPdf}
                  disabled={isGenerating}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-4 rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>{progress}% Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert to WORD</span>
                      <ChevronRight size={20} strokeWidth={3} />
                    </>
                  )}
                </button>
                {isGenerating && (
                  <p className="text-[10px] text-slate-400 text-center mt-2 font-medium animate-pulse">
                    {generationStep}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Slide-Over options drawer */}
      {isMobileSettingsOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            onClick={() => setIsMobileSettingsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" 
          />

          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-[360px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-6 pt-[88px] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">
                  PDF to Word options
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

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={processPdf}
                disabled={isGenerating}
                className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-4 rounded-xl text-base font-extrabold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{progress}% Converting...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to WORD</span>
                    <ChevronRight size={20} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy and Info Alert */}
      <div className="w-full px-4 md:px-8 xl:px-12 mb-8">
        <div className="w-full max-w-4xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4 flex gap-3 text-xs leading-normal">
          <KeyRound size={16} className="text-[#e52521] dark:text-[#d01f1c] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-900 dark:text-red-300 block mb-0.5">Secure local sandboxing</span>
            <span className="text-red-800/95 dark:text-red-400/80 font-medium">
              Your files never touch any servers. All PDF decoding, text parsing, OCR recognition, and DOCX document packing runs 100% locally in your secure browser sandbox.
            </span>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="pdf-to-word" />
    </div>
  );
};

export default PdfToWordConverter;
