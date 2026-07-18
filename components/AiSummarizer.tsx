import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FilePlus, FileText, Sparkles, AlertCircle, X, Loader2, Copy, Download, Check } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

export const AiSummarizer: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdf, setPdf] = useState<{ id: string; file: File; name: string; url: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('pdfjs-dist').then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }).catch(err => console.error('Failed to load pdfjs-dist', err));
    }
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setSummary(null);
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    setPdf({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    });
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    // We limit extraction to first 50 pages to prevent memory issues on massive PDFs
    const pagesToRead = Math.min(pdfDocument.numPages, 50);

    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  };

  const summarizePdf = async () => {
    if (!pdf) return;
    setIsSummarizing(true);
    setScanProgress(0);
    setError(null);

    // Simulate scanning progress from 0% to 95% while waiting for API
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        // Slow down as it gets closer to 95%
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : prev < 95 ? 1 : 0;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    try {
      // 1. Extract text
      const extractedText = await extractTextFromPdf(pdf.file);
      
      if (!extractedText.trim()) {
        throw new Error('No readable text found in this PDF. It might be a scanned image.');
      }

      // 2. Send to backend
      const response = await fetch('/api/summarizePdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setScanProgress(100);
      
      // Short delay at 100% to let the user see the completion before showing summary
      setTimeout(() => {
        setSummary(data.summary);
      }, 500);

    } catch (err: any) {
      console.error('AI Summarization Error:', err);
      let errorMessage = err.message || 'An unknown error occurred while summarizing.';
      
      // The Gemini API sometimes returns stringified JSON errors. Let's parse them cleanly.
      try {
        // Handle cases where the error string contains the JSON blob
        const jsonMatch = errorMessage.match(/(\{.*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        }
      } catch (e) {
        // If parsing fails, just use the original error message
      }
      
      setError(errorMessage);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsSummarizing(false);
      }, 500);
    }
  };

  const clearPdf = () => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    setPdf(null);
    setSummary(null);
    setError(null);
  };

  const handleCopy = () => {
    if (!summary) return;
    // Strip basic markdown
    const cleanText = summary
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .trim();
    
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!summary) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Strip markdown formatting for clean text
    const cleanText = summary
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`{1,3}.*?`{1,3}/g, '')
      .replace(/-/g, '•')
      .trim();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("AI Document Summary", margin, margin);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const paragraphs = cleanText.split('\n');
    let y = margin + 12;

    paragraphs.forEach(paragraph => {
      if (!paragraph.trim()) {
        y += 4;
        return;
      }
      
      const lines = doc.splitTextToSize(paragraph.trim(), pageWidth - margin * 2);
      
      // Page break check
      if (y + (lines.length * 6) > pageHeight - margin - 10) {
        // Add footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("© Bishalcodes.com", pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.setTextColor(0);
        doc.setFontSize(11);
        
        doc.addPage();
        y = margin;
      }

      // Print paragraph justified
      doc.text(lines, margin, y, { align: "justify", maxWidth: pageWidth - margin * 2 });
      y += lines.length * 6 + 4; // spacing below paragraph
    });
    
    // Footer on last page
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("© Bishalcodes.com", pageWidth / 2, pageHeight - 10, { align: "center" });

    doc.save(`${pdf?.name?.replace('.pdf', '') || 'Document'}_Summary.pdf`);
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
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
              <div className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Summarizer
              </h1>
            </div>
          </div>
          
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-grow w-full flex flex-col ${!pdf ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {error && (
          <div className="m-4 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 rounded-lg p-4 text-sm text-red-700 dark:text-red-400 shrink-0">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!pdf ? (
          /* Upload State & SEO Guide */
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-2xl p-4 md:p-8">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                className={`w-full border-2 border-dashed rounded-xl p-8 md:p-12 text-center flex flex-col items-center justify-center transition-all duration-200 ${
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
                  Drop your PDF here or browse your computer to begin AI summarization.
                </p>
                
                <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} accept="application/pdf" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-md transition-colors cursor-pointer"
                >
                  Browse Files
                </button>
              </div>
            </div>

            <SeoGuideSection toolId="ai-summarizer" />

          </div>
        ) : (
          /* Split View State */
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative border-t border-slate-200 dark:border-slate-800">
            
            {/* Left Side: PDF Preview */}
            <div className="w-full lg:w-1/3 xl:w-[30%] h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/50 to-transparent z-10 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
                 <span className="text-white text-xs font-bold px-2 drop-shadow-md truncate max-w-[80%]">{pdf.name}</span>
                 <button onClick={clearPdf} className="p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors" title="Close File">
                   <X size={16} />
                 </button>
              </div>
              <iframe 
                src={`${pdf.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&view=FitH`} 
                className="w-[calc(100%+24px)] h-full border-none flex-1 bg-white max-w-none" 
                title="PDF Preview"
              />
            </div>

            {/* Right Side: AI Panel */}
            <div className="w-full flex-1 h-1/2 lg:h-full bg-white dark:bg-slate-900 overflow-y-auto relative">
              {isSummarizing || scanProgress === 100 && !summary ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 z-20">
                  <Loader2 size={32} className="text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Processing document... {scanProgress}%
                    </p>
                  </div>
                </div>
              ) : summary ? (
                <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
                  <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                      AI Summary
                    </h2>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-1.5 px-3 rounded-md transition-colors"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button 
                        onClick={handleDownloadPdf}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 px-3 rounded-md transition-colors shadow-sm"
                      >
                        <Download size={14} />
                        Save PDF
                      </button>
                    </div>
                  </div>
                  
                  {/* Markdown Rendering */}
                  <div className="prose prose-slate dark:prose-invert prose-sm md:prose-base max-w-none 
                    prose-headings:font-bold prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-6
                    prose-h3:text-base
                    prose-p:text-slate-600 dark:prose-p:text-slate-300
                  ">
                    <ReactMarkdown>
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <FileText size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Ready to Summarize</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                    Click the button below to extract and analyze the contents.
                  </p>
                  <button 
                    onClick={summarizePdf}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors cursor-pointer"
                  >
                    Generate AI Summary
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AiSummarizer;
