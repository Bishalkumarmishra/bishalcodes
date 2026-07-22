import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle, X, Loader2, Link2 } from 'lucide-react';

interface ToolHeroUploadProps {
  title: string;
  description: string;
  buttonText: string;
  dropText: string;
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  error?: string | null;
  className?: string;
}

export const ToolHeroUpload: React.FC<ToolHeroUploadProps> = ({
  title,
  description,
  buttonText,
  dropText,
  accept,
  multiple = true,
  onFilesSelected,
  error,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDropboxModalOpen, setIsDropboxModalOpen] = useState(false);
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [isFetchingDropbox, setIsFetchingDropbox] = useState(false);
  const [dropboxError, setDropboxError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  // Launch Dropbox Chooser script or URL import modal
  const openDropboxChooser = () => {
    if (typeof window !== 'undefined' && (window as any).Dropbox) {
      (window as any).Dropbox.choose({
        success: async (files: any[]) => {
          try {
            const fetchedFiles: File[] = [];
            for (const f of files) {
              const directLink = f.link.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
              const res = await fetch(directLink);
              const blob = await res.blob();
              const file = new File([blob], f.name, { type: blob.type || 'application/octet-stream' });
              fetchedFiles.push(file);
            }
            if (fetchedFiles.length > 0) {
              onFilesSelected(fetchedFiles);
            }
          } catch (err: any) {
            console.error('Dropbox fetch error:', err);
            setIsDropboxModalOpen(true);
          }
        },
        cancel: () => {},
        linkType: 'direct',
        multiselect: multiple,
      });
    } else {
      setIsDropboxModalOpen(true);
    }
  };

  const handleFetchDropboxUrl = async () => {
    if (!dropboxUrl.trim()) return;
    setDropboxError(null);
    setIsFetchingDropbox(true);

    try {
      // Convert standard Dropbox link (dl=0) to direct download link (dl=1 or raw=1)
      let directUrl = dropboxUrl.trim();
      if (directUrl.includes('dropbox.com')) {
        directUrl = directUrl.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');
        if (!directUrl.includes('dl=1') && !directUrl.includes('raw=1')) {
          directUrl += (directUrl.includes('?') ? '&' : '?') + 'dl=1';
        }
      }

      const res = await fetch(directUrl);
      if (!res.ok) throw new Error('Could not download file from Dropbox. Please check the link permission.');

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let fileName = 'dropbox-file';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        fileName = contentDisposition.split('filename=')[1].replace(/["']/g, '').trim();
      } else {
        const urlParts = dropboxUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1].split('?')[0];
        if (lastPart) fileName = decodeURIComponent(lastPart);
      }

      const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
      onFilesSelected([file]);
      setIsDropboxModalOpen(false);
      setDropboxUrl('');
    } catch (err: any) {
      setDropboxError(err.message || 'Failed to fetch file from Dropbox URL.');
    } finally {
      setIsFetchingDropbox(false);
    }
  };

  return (
    <div className={`w-full py-12 px-4 sm:px-8 bg-[#f4f5f8] dark:bg-slate-900/80 transition-colors duration-300 rounded-2xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full max-w-5xl mx-auto text-center flex flex-col items-center justify-center p-6 sm:p-10 rounded-xl transition-all duration-200 ${
          isDragging
            ? 'bg-red-500/10 border-2 border-dashed border-[#e52521]'
            : 'bg-transparent'
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3 font-heading">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8">
          {description}
        </p>

        {/* Error Alert if any */}
        {error && (
          <div className="w-full max-w-md mb-6 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-3.5 text-xs text-red-700 dark:text-red-400 text-left">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Controls: Main Red Button + Stacked Dropbox Button */}
        <div className="flex items-center gap-3 justify-center mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#e52521] hover:bg-[#d01f1c] text-white px-8 py-4 sm:px-10 sm:py-4.5 rounded-xl text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
          >
            {buttonText}
          </button>

          {/* Stacked Dropbox Button */}
          <div className="flex flex-col gap-2">
            <button
              onClick={openDropboxChooser}
              title="Select files from Dropbox"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e52521] hover:bg-[#d01f1c] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer p-2.5"
            >
              <img src="/dropbox.svg" alt="Dropbox" className="w-full h-full object-contain brightness-0 invert" />
            </button>
          </div>
        </div>

        {/* Drop hint text */}
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
          {dropText}
        </p>
      </div>

      {/* Dropbox URL Import Modal */}
      {isDropboxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsDropboxModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0 p-2">
                <img src="/dropbox.svg" alt="Dropbox" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Import from Dropbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Paste your shared Dropbox link to load the file directly.</p>
              </div>
            </div>

            {dropboxError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 rounded-xl">
                {dropboxError}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://www.dropbox.com/s/..."
                  value={dropboxUrl}
                  onChange={(e) => setDropboxUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#e52521] text-slate-900 dark:text-white"
                />
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                onClick={handleFetchDropboxUrl}
                disabled={isFetchingDropbox || !dropboxUrl.trim()}
                className="w-full bg-[#e52521] hover:bg-[#d01f1c] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isFetchingDropbox ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Fetching File from Dropbox...
                  </>
                ) : (
                  'Load File from Dropbox'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
