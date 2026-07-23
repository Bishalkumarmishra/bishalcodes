'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { ToolHeroUpload } from './ToolHeroUpload';
import { createWorker } from 'tesseract.js';
import { 
  ArrowLeft, FileText, Upload, Copy, Check, 
  Download, AlertCircle, Loader2, Sparkles, Languages
} from 'lucide-react';

const supportedLanguages = [
  { code: 'eng', name: 'English' },
  { code: 'nep', name: 'Nepali (नेपाली)' },
  { code: 'hin', name: 'Hindi (हिन्दी)' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' },
  { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
  { code: 'jpn', name: 'Japanese (日本語)' }
];

export default function AiOcrConverter() {
  const { navigate } = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState('eng');
  const [isDragging, setIsDragging] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setExtractedText('');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const runOcr = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatusText('Initializing AI Engine...');
    
    try {
      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Extracting Text: ${Math.round(m.progress * 100)}%`);
          } else {
            setStatusText(m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...');
          }
        }
      });

      setStatusText('Parsing Image Content...');
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();

      if (!text || text.trim() === '') {
        setExtractedText('No text could be found in the image. Please try a clearer scan or high-contrast image.');
      } else {
        setExtractedText(text);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize OCR engine. Check your internet connection for loading language assets.');
    } finally {
      setLoading(false);
      setProgress(0);
      setStatusText('');
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const originalName = image?.name || 'ocr';
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}_extracted.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetOcr = () => {
    setImage(null);
    setImagePreview(null);
    setExtractedText('');
    setError(null);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300 min-h-screen pt-20 pb-12 flex flex-col items-center">
      <div className="w-full px-4 md:px-8 xl:px-12 flex flex-col text-left">
        
        {/* Back Button & Title */}
        <div className="flex flex-col gap-4 mb-8 text-left">
          <button 
            onClick={() => navigate('services')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg w-fit shrink-0"
            title="Back to Tools"
          >
            <ArrowLeft size={13} />
            <span>Back to Tools</span>
          </button>
          
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              AI OCR <span className="text-[#e52521] dark:text-[#d01f1c] font-normal">Image-to-Text</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl font-medium leading-relaxed">
              Extract text instantly from scanned documents, receipts, screenshots, and photos. Runs completely in your browser — 100% free, unlimited, and private.
            </p>
          </div>
        </div>

        {error && (
          <div className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 mb-6 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Execution Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left panel: Upload and Preview */}
          <div className="lg:col-span-6 flex flex-col gap-4 w-full">
            
            {/* Upload Box */}
            {!imagePreview ? (
              <ToolHeroUpload
                title="AI OCR Image-to-Text"
                description="Extract text instantly from scanned documents, receipts, screenshots, and photos."
                buttonText="Select Image file"
                dropText="or drop image file here"
                accept="image/*"
                multiple={false}
                onFilesSelected={(files) => {
                  if (files.length > 0) handleFiles(files);
                }}
                error={error}
              />
            ) : (
              <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shadow-sm relative">
                
                {/* Image Actions Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#e52521]" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{image?.name}</span>
                  </div>
                  <button 
                    onClick={resetOcr}
                    disabled={loading}
                    className="text-xs text-rose-500 hover:underline font-bold disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                {/* Preview Image */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  <img
                    src={imagePreview}
                    alt="Scan Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Configuration */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Languages size={15} className="text-slate-400 shrink-0" />
                    <label htmlFor="ocr-lang" className="text-xs font-bold text-slate-500 dark:text-slate-400">Language:</label>
                    <select
                      id="ocr-lang"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={loading}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#e52521] text-slate-700 dark:text-white flex-1 sm:flex-none"
                    >
                      {supportedLanguages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={runOcr}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-[#e52521] hover:bg-[#d01f1c] disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Extract Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
          </div>

          {/* Right panel: Progress and Extracted Text */}
          <div className="lg:col-span-6 flex flex-col gap-4 h-full w-full">
            
            {loading && (
              <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <Loader2 className="animate-spin text-[#e52521] mb-4" size={32} />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{statusText}</h4>
                <p className="text-[10px] text-slate-400 mb-4">Loading neural network assets locally in your browser.</p>
                {progress > 0 && (
                  <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#e52521] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            {/* Extracted Text Area */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-sm flex-1 min-h-[380px]">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Extracted Text Result</span>
                
                {extractedText && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold transition-all"
                    >
                      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 font-bold transition-all"
                    >
                      <Download size={11} />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full flex flex-col">
                <textarea
                  readOnly
                  placeholder="Extracted text will appear here after image upload and clicking 'Extract Text'..."
                  value={extractedText}
                  className="w-full flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 text-xs font-medium text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none resize-none min-h-[260px] leading-relaxed"
                />
              </div>
            </div>

          </div>

        </div>

      </div>

      <SeoGuideSection toolId="ocr-converter" />

    </div>
  );
}
