import React, { useState, useRef, useCallback } from 'react';
import { FileText, Download, X, AlertCircle, RefreshCw, KeyRound, CheckCircle, Sparkles, ChevronRight, Settings, Trash2, ArrowLeft, Loader2, FileSpreadsheet } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { ToolDownloadStep } from './ToolDownloadStep';

export const PdfToExcelConverter: React.FC = () => {
  const { navigate } = useNavigation();
  const [pdfFile, setPdfFile] = useState<{ id: string; file: File; name: string; size: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf') {
      setError('Only PDF documents (.pdf) are supported.');
      return;
    }

    const newPdf = {
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size
    };
    
    setPdfFile(newPdf);
  }, []);

  const processPdf = async () => {
    if (!pdfFile) return;
    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setDownloadUrl(null);
    setProgress(0);

    try {
      setGenerationStep('Preparing file structure...');
      setProgress(20);

      // Convert file to base64
      const base64Pdf = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile.file);
      });

      setProgress(40);
      setGenerationStep('Extracting table cells and grid coordinates on server...');

      const response = await fetch('/api/pdf-to-excel-internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf: base64Pdf,
          filename: pdfFile.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server-side layout rendering failed.');
      }

      setProgress(85);
      setGenerationStep('Downloading Excel spreadsheet...');
      
      const excelBlob = await response.blob();
      const url = URL.createObjectURL(excelBlob);
      const outName = pdfFile.name.replace(/\.pdf$/i, '') + '.xlsx';

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
      console.error('PDF to Excel Conversion Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}. Please verify the file is not corrupted.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setPdfFile(null);
    setSuccess(false);
    setError(null);
    setProgress(0);
  };

  if (downloadUrl) {
    return (
      <div className="w-full font-sans">
        <ToolDownloadStep
          title="The PDF has been converted to Excel Spreadsheet"
          downloadUrl={downloadUrl}
          downloadFileName={downloadName}
          onReset={handleReset}
        />
        <SeoGuideSection toolId="pdf-to-excel" />
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

        {pdfFile && (
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
        accept=".pdf"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {!pdfFile ? (
        <div className="w-full px-4 md:px-8 xl:px-12 pb-12">
          <ToolHeroUpload
            title="PDF to Excel Converter"
            description="Convert PDF documents into structured Microsoft Excel spreadsheets (.xlsx) with clean cell grids, row preservation, and automatic layout mapping."
            buttonText="Select PDF file"
            dropText="or drop PDF file here"
            accept=".pdf"
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

          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <FileText size={40} />
              </div>
              <div className="flex-1 text-center md:text-left min-w-0">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white truncate mb-1" title={pdfFile.name}>
                  {pdfFile.name}
                </h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Size: {formatSize(pdfFile.size)}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 rounded-xl transition-all cursor-pointer"
              >
                Change File
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <button
                onClick={processPdf}
                disabled={isGenerating}
                className="w-full sm:w-auto min-w-[280px] bg-[#e52521] hover:bg-[#d01f1c] text-white py-4 px-8 rounded-xl text-base font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{progress}% Converting...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to Excel</span>
                    <ChevronRight size={20} strokeWidth={3} />
                  </>
                )}
              </button>
              
              {isGenerating && (
                <p className="text-xs text-slate-400 mt-3 font-medium animate-pulse text-center">
                  {generationStep}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Banner */}
      <div className="w-full px-4 md:px-8 xl:px-12 mb-8">
        <div className="w-full max-w-4xl mx-auto bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-4 flex gap-3 text-xs leading-normal">
          <KeyRound size={16} className="text-[#e52521] dark:text-[#d01f1c] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-900 dark:text-red-300 block mb-0.5">Secure local sandboxing</span>
            <span className="text-red-800/95 dark:text-red-400/80 font-medium">
              Your files are secure. PDF document processing and Excel structure creation are processed entirely in a secure environment. Your uploads are instantly deleted from storage post-conversion.
            </span>
          </div>
        </div>
      </div>

      <SeoGuideSection toolId="pdf-to-excel" />
    </div>
  );
};

export default PdfToExcelConverter;
