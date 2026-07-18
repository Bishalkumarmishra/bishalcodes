'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { 
  ArrowLeft, Upload, FileImage, Download, AlertCircle, 
  Loader2, Sparkles, Trash2, Eye, ShieldCheck
} from 'lucide-react';

export default function BgRemover() {
  const { navigate } = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
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
      setResultUrl(null);
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

  const removeBg = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatusText('Downloading AI model (First time may take a moment)...');

    try {
      // Dynamically import to prevent Next.js SSR build errors
      const { removeBackground } = await import('@imgly/background-removal');

      const config = {
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100);
          setProgress(percent);
          setStatusText(`Loading AI Model: ${percent}%`);
        }
      };

      const resultBlob = await removeBackground(image, config);
      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process background removal. Ensure WebAssembly is supported on your browser.');
    } finally {
      setLoading(false);
      setProgress(0);
      setStatusText('');
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const originalName = image?.name || 'img';
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_nobg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setImage(null);
    setImagePreview(null);
    setResultUrl(null);
    setError(null);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300 min-h-screen pt-28 pb-16 flex flex-col items-center">
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
              Background <span className="text-indigo-600 dark:text-indigo-400 font-normal">Remover</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl font-medium leading-relaxed">
              Remove image backgrounds automatically in seconds. Runs entirely on your browser for absolute data privacy and zero quality loss.
            </p>
          </div>
        </div>

        {error && (
          <div className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 mb-6 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Process Failure</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          
          {/* Main workspace panels */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            
            {/* Input upload box */}
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full min-h-[360px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20' 
                    : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFiles(e.target.files)}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                  <Upload size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Upload Photo to Remove Background</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-4">Drag & drop or select an image file.</p>
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                  Choose Image
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-6">
                
                {/* Side-by-Side comparison or Single result */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Image */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Original Photo</span>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                      <img src={imagePreview} alt="Original source" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>

                  {/* Processed/Result Image */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-sm relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Transparent Result</span>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden transparent-checkerboard flex items-center justify-center border border-slate-100 dark:border-slate-850">
                      {resultUrl ? (
                        <img src={resultUrl} alt="Transparent background result" className="max-w-full max-h-full object-contain animate-fade-in" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Loader2 className="animate-spin text-indigo-500" size={28} />
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{statusText}</p>
                              {progress > 0 && (
                                <div className="w-40 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <Eye size={24} className="text-slate-300 dark:text-slate-700 mb-2" />
                              <p className="text-xs text-slate-400 font-medium">Click 'Remove Background' to preview</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workspace Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileImage size={15} className="text-indigo-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{image?.name}</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={resetAll}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 disabled:opacity-50 transition-all"
                    >
                      <Trash2 size={13} />
                      <span>Reset</span>
                    </button>

                    {!resultUrl ? (
                      <button
                        onClick={removeBg}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={13} />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Remove Background</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleDownload}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg transition-all shrink-0"
                      >
                        <Download size={13} />
                        <span>Download PNG</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}
            
          </div>

          {/* Right sidebar: Privacy notes and help card */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Zero-Server Privacy</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Unlike other background removers that upload your private photos to external servers (and charge credits), this tool runs a WebAssembly AI segmentation model **100% locally in your web browser**. 
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-[11px] font-semibold text-slate-400">
                <p>✓ No server logs or file storage</p>
                <p>✓ Unlimited daily conversions</p>
                <p>✓ Full original image resolution output</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 dark:border-indigo-400/10 rounded-3xl p-6 text-xs space-y-3">
              <h4 className="font-bold text-indigo-700 dark:text-indigo-400">Model Download Note</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-normal font-medium">
                The first time you click <strong>Remove Background</strong>, your browser will download a ~75MB machine learning model. This model is cached locally on your machine, so subsequent removals will run almost instantly!
              </p>
            </div>
          </div>

        </div>

      </div>

      <SeoGuideSection toolId="bg-remover" />

      <style dangerouslySetInnerHTML={{ __html: `
        .transparent-checkerboard {
          background-color: #fafbfd;
          background-image: linear-gradient(45deg, #f0f2f6 25%, transparent 25%), 
                            linear-gradient(-45deg, #f0f2f6 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #f0f2f6 75%), 
                            linear-gradient(-45deg, transparent 75%, #f0f2f6 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        :root.dark .transparent-checkerboard {
          background-color: #0c0f17;
          background-image: linear-gradient(45deg, #161c29 25%, transparent 25%), 
                            linear-gradient(-45deg, #161c29 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #161c29 75%), 
                            linear-gradient(-45deg, transparent 75%, #161c29 75%);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
