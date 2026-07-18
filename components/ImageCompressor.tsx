import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Sliders, 
  Settings, 
  RefreshCw, 
  ZoomIn, 
  Minimize2, 
  FileArchive, 
  Folder, 
  File, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  HardDrive
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import JSZip from 'jszip';

interface CompressionResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
  quality: number;
  scale: number;
}

interface ZipFileItem {
  file: File;
  filepath: string;
  size: number;
}

const zipFilesInWorker = (
  zipFiles: ZipFileItem[],
  compressionLevel: number,
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const workerCode = `
        self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        self.onmessage = async function(e) {
          const { files, compressionLevel } = e.data;
          try {
            const zip = new JSZip();
            for (const file of files) {
              zip.file(file.filepath, file.file);
            }
            const isDeflate = compressionLevel > 0;
            const blob = await zip.generateAsync({
              type: 'blob',
              compression: isDeflate ? 'DEFLATE' : 'STORE',
              compressionOptions: isDeflate ? { level: compressionLevel } : undefined
            }, function(metadata) {
              self.postMessage({ type: 'progress', percent: Math.round(metadata.percent) });
            });
            self.postMessage({ type: 'done', blob: blob });
          } catch (err) {
            self.postMessage({ type: 'error', error: err.message });
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e) => {
        const { type, percent, blob: resultBlob, error } = e.data;
        if (type === 'progress') {
          if (onProgress) onProgress(percent);
        } else if (type === 'done') {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(resultBlob);
        } else if (type === 'error') {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(new Error(error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        reject(err);
      };

      const filesToSend = zipFiles.map(item => ({
        filepath: item.filepath,
        file: item.file
      }));

      worker.postMessage({ files: filesToSend, compressionLevel });
    } catch (err) {
      reject(err);
    }
  });
};

export const ImageCompressor: React.FC = () => {
  const { navigate } = useNavigation();

  // Mode state: 'image' or 'zip'
  const [compressMode, setCompressMode] = useState<'image' | 'zip'>('image');

  // --- Image Compressor State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  const [mode, setMode] = useState<'manual' | 'target'>('manual');
  const [quality, setQuality] = useState<number>(80);
  const [scale, setScale] = useState<number>(100);
  const [targetSize, setTargetSize] = useState<number>(200); // Target KB

  const [result, setResult] = useState<CompressionResult | null>(null);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // --- ZIP Compressor State ---
  const [zipFiles, setZipFiles] = useState<ZipFileItem[]>([]);
  const [zipName, setZipName] = useState<string>('compressed-archive.zip');
  const [zipCompressionLevel, setZipCompressionLevel] = useState<number>(5); // 0 (Store) or 1-9 (Deflate)
  const [zipResult, setZipResult] = useState<{ blob: Blob; url: string; size: number; name: string } | null>(null);
  const [zipping, setZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // References to keep track of current URLs for unmount cleanup
  const originalUrlRef = useRef(originalUrl);
  const resultUrlRef = useRef(result?.url);
  const zipResultUrlRef = useRef(zipResult?.url);

  useEffect(() => {
    originalUrlRef.current = originalUrl;
  }, [originalUrl]);

  useEffect(() => {
    resultUrlRef.current = result?.url;
  }, [result?.url]);

  useEffect(() => {
    zipResultUrlRef.current = zipResult?.url;
  }, [zipResult?.url]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (zipResultUrlRef.current) URL.revokeObjectURL(zipResultUrlRef.current);
    };
  }, []);

  // Format file sizes
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Traverses directory entries recursively for dropped folders
  const traverseDirectoryEntry = (entry: any, path: string = ''): Promise<{ file: File; filepath: string }[]> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(
          (file: File) => {
            resolve([{ file, filepath: path ? `${path}/${file.name}` : file.name }]);
          },
          () => resolve([])
        );
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const allEntries: any[] = [];
        
        const readEntries = () => {
          dirReader.readEntries(
            async (entries: any[]) => {
              if (entries.length === 0) {
                // Done reading this directory tree, now traverse sub-entries
                const promises = allEntries.map(subEntry => 
                  traverseDirectoryEntry(subEntry, path ? `${path}/${entry.name}` : entry.name)
                );
                const results = await Promise.all(promises);
                resolve(results.flat());
              } else {
                allEntries.push(...entries);
                readEntries();
              }
            },
            () => resolve([])
          );
        };
        
        readEntries();
      } else {
        resolve([]);
      }
    });
  };

  // Handle single file upload for image mode
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setOriginalSize(file.size);

    // Revoke previous original URL
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }
    
    // Revoke previous compression result URL
    setResult(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    // Load dimensions
    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      // Run initial compression
      triggerCompression(file, url, img.width, img.height);
    };
    img.onerror = () => {
      setError('Failed to load image. Ensure it is a valid format.');
    };
    img.src = url;
  };

  // Multiple files input handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      // If we are in image mode and it's a single image, route to image compressor
      if (compressMode === 'image' && filesArray.length === 1 && filesArray[0].type.startsWith('image/')) {
        handleFileSelect(filesArray[0]);
      } else {
        // Otherwise route to ZIP compressor mode
        setCompressMode('zip');
        setZipFiles(prev => {
          const merged = [...prev];
          filesArray.forEach(file => {
            const filepath = file.webkitRelativePath || file.name;
            const existingIdx = merged.findIndex(x => x.filepath === filepath);
            if (existingIdx !== -1) {
              merged[existingIdx] = { file, filepath, size: file.size };
            } else {
              merged.push({ file, filepath, size: file.size });
            }
          });
          return merged;
        });

        // Set name suggestions
        if (filesArray.length === 1) {
          const baseName = filesArray[0].name.split('.').slice(0, -1).join('.') || filesArray[0].name;
          setZipName(`${baseName}.zip`);
        } else {
          setZipName('compressed-archive.zip');
        }
      }
    }
  };

  // Folder input handler
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setCompressMode('zip');
      
      let folderName = 'folder-archive';
      const firstPath = filesArray[0].webkitRelativePath;
      if (firstPath) {
        const parts = firstPath.split('/');
        if (parts.length > 0) {
          folderName = parts[0];
        }
      }
      setZipName(`${folderName}.zip`);

      setZipFiles(prev => {
        const merged = [...prev];
        filesArray.forEach(file => {
          const filepath = file.webkitRelativePath || file.name;
          const existingIdx = merged.findIndex(x => x.filepath === filepath);
          if (existingIdx !== -1) {
            merged[existingIdx] = { file, filepath, size: file.size };
          } else {
            merged.push({ file, filepath, size: file.size });
          }
        });
        return merged;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const entries: any[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }
      }

      if (entries.length > 0) {
        setCompressing(true);
        try {
          const filePromises = entries.map(entry => traverseDirectoryEntry(entry));
          const allFilesList = (await Promise.all(filePromises)).flat();

          if (allFilesList.length === 0) {
            setCompressing(false);
            return;
          }

          // If a single image file is dropped, load it in standard image mode
          if (allFilesList.length === 1 && allFilesList[0].file.type.startsWith('image/')) {
            setCompressMode('image');
            handleFileSelect(allFilesList[0].file);
          } else {
            // Otherwise compress into a ZIP file
            setCompressMode('zip');
            const newZipFiles = allFilesList.map(item => ({
              file: item.file,
              filepath: item.filepath,
              size: item.file.size
            }));

            setZipFiles(prev => {
              const merged = [...prev];
              newZipFiles.forEach(item => {
                const existingIdx = merged.findIndex(x => x.filepath === item.filepath);
                if (existingIdx !== -1) {
                  merged[existingIdx] = item;
                } else {
                  merged.push(item);
                }
              });
              return merged;
            });

            // Set suggested name
            if (entries.length === 1 && entries[0].isDirectory) {
              setZipName(`${entries[0].name}.zip`);
            } else if (entries.length === 1) {
              const baseName = entries[0].name.split('.').slice(0, -1).join('.') || entries[0].name;
              setZipName(`${baseName}.zip`);
            } else {
              setZipName('compressed-archive.zip');
            }
          }
        } catch (err) {
          console.error(err);
          setError('Failed to parse dropped files or folders.');
        } finally {
          setCompressing(false);
        }
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      if (filesArray.length === 1 && filesArray[0].type.startsWith('image/')) {
        setCompressMode('image');
        handleFileSelect(filesArray[0]);
      } else {
        setCompressMode('zip');
        setZipFiles(filesArray.map(f => ({ file: f, filepath: f.name, size: f.size })));
        setZipName('compressed-archive.zip');
      }
    }
  };

  // --- Image Compressor Executor ---
  const triggerCompression = async (
    file: File,
    imgUrl: string,
    wWidth: number = originalWidth,
    wHeight: number = originalHeight
  ) => {
    if (!file) return;
    setCompressing(true);
    setError(null);

    try {
      const compressed = await performCompression(file, imgUrl, wWidth, wHeight);
      setResult(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return compressed;
      });
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to compress the image. Ensure it is a valid format.');
    } finally {
      setCompressing(false);
    }
  };

  const performCompression = (
    file: File,
    imgUrl: string,
    origW: number,
    origH: number
  ): Promise<CompressionResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const runExport = (q: number, s: number): Promise<Blob> => {
          return new Promise((res, rej) => {
            const w = Math.max(1, Math.round(origW * s));
            const h = Math.max(1, Math.round(origH * s));
            canvas.width = w;
            canvas.height = h;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            
            // Export image/jpeg or image/webp to utilize quality levels
            const mime = file.type === 'image/png' || file.type === 'image/gif' ? 'image/jpeg' : file.type;
            canvas.toBlob(
              (blob) => {
                if (blob) res(blob);
                else rej(new Error('Canvas toBlob failed'));
              },
              mime,
              q
            );
          });
        };

        if (mode === 'target') {
          const targetBytes = targetSize * 1024;
          let lowQ = 0.05;
          let highQ = 0.95;
          let bestBlob: Blob | null = null;
          let bestQ = 0.7;
          let bestS = 1.0;

          const search = async () => {
            // Step 1: Binary search on Quality at 100% scale
            for (let i = 0; i < 7; i++) {
              const midQ = (lowQ + highQ) / 2;
              const blob = await runExport(midQ, bestS);
              if (blob.size <= targetBytes) {
                bestBlob = blob;
                bestQ = midQ;
                lowQ = midQ;
              } else {
                highQ = midQ;
              }
            }

            // Step 2: Scale down dimensions if file is still too large
            if (!bestBlob || bestBlob.size > targetBytes) {
              let lowS = 0.15;
              let highS = 1.0;
              for (let i = 0; i < 6; i++) {
                const midS = (lowS + highS) / 2;
                const blob = await runExport(0.15, midS);
                if (blob.size <= targetBytes) {
                  bestBlob = blob;
                  bestS = midS;
                  lowS = midS;
                } else {
                  highS = midS;
                }
              }
            }

            // Final fallback
            if (!bestBlob) {
              bestBlob = await runExport(0.05, 0.15);
              bestQ = 0.05;
              bestS = 0.15;
            }

            resolve({
              blob: bestBlob,
              url: URL.createObjectURL(bestBlob),
              width: Math.round(origW * bestS),
              height: Math.round(origH * bestS),
              size: bestBlob.size,
              quality: Math.round(bestQ * 100),
              scale: Math.round(bestS * 100),
            });
          };

          search().catch(reject);
        } else {
          // Manual adjustments
          const q = quality / 100;
          const s = scale / 100;
          runExport(q, s)
            .then((blob) => {
              resolve({
                blob,
                url: URL.createObjectURL(blob),
                width: Math.round(origW * s),
                height: Math.round(origH * s),
                size: blob.size,
                quality,
                scale,
              });
            })
            .catch(reject);
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imgUrl;
    });
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    const a = document.createElement('a');
    a.href = result.url;
    
    const extIdx = selectedFile.name.lastIndexOf('.');
    const baseName = extIdx !== -1 ? selectedFile.name.substring(0, extIdx) : selectedFile.name;
    const finalExt = selectedFile.type === 'image/png' || selectedFile.type === 'image/gif' ? 'jpg' : selectedFile.name.split('.').pop() || 'jpg';
    a.download = `${baseName}_compressed_${result.quality}q.${finalExt}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- ZIP Compressor Executor ---
  const handleZipCompress = async () => {
    if (zipFiles.length === 0) return;
    setZipping(true);
    setZipProgress(0);
    setError(null);

    // Revoke previous ZIP result url to prevent leaks
    setZipResult(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });

    try {
      let blob: Blob;
      try {
        blob = await zipFilesInWorker(zipFiles, zipCompressionLevel, setZipProgress);
      } catch (workerError) {
        console.warn("Background zipping failed, falling back to main thread:", workerError);
        const zip = new JSZip();
        zipFiles.forEach(item => {
          zip.file(item.filepath, item.file);
        });
        const isDeflate = zipCompressionLevel > 0;
        blob = await zip.generateAsync({
          type: 'blob',
          compression: isDeflate ? 'DEFLATE' : 'STORE',
          compressionOptions: isDeflate ? { level: zipCompressionLevel } : undefined
        });
      }

      const url = URL.createObjectURL(blob);
      const name = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;

      setZipResult({
        blob,
        url,
        size: blob.size,
        name
      });
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate ZIP archive: ' + err.message);
    } finally {
      setZipping(false);
    }
  };

  const handleDownloadZip = () => {
    if (!zipResult) return;
    const a = document.createElement('a');
    a.href = zipResult.url;
    a.download = zipResult.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removeZipFile = (index: number) => {
    setZipFiles(prev => prev.filter((_, i) => i !== index));
    setZipResult(null); // invalidate previous zip results on modifications
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl('');
    setResult(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setZipResult(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setZipFiles([]);
    setError(null);
  };

  // Re-run compression when parameters change in manual mode
  useEffect(() => {
    if (selectedFile && originalUrl && mode === 'manual' && compressMode === 'image') {
      triggerCompression(selectedFile, originalUrl);
    }
  }, [quality, scale, mode, originalUrl, compressMode]);

  // Re-run when target size changes
  useEffect(() => {
    if (selectedFile && originalUrl && mode === 'target' && compressMode === 'image') {
      triggerCompression(selectedFile, originalUrl);
    }
  }, [targetSize, mode, originalUrl, compressMode]);

  // Determine ZIP details
  const totalZipInputSize = zipFiles.reduce((sum, item) => sum + item.size, 0);

  // Return icons based on file type
  const getFileIcon = (filepath: string) => {
    const ext = filepath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'gif':
      case 'svg':
        return <ImageIcon className="text-emerald-500 w-4 h-4 shrink-0" />;
      case 'pdf':
        return <File className="text-rose-500 w-4 h-4 shrink-0" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive className="text-amber-500 w-4 h-4 shrink-0" />;
      default:
        return <File className="text-slate-400 dark:text-slate-500 w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Hero Header */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={() => navigate('services')}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={13} />
              Back to Services
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                Smart Compressor
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                Compress images (JPEG, PNG, WebP) by scaling quality & resolutions, or bundle any kinds of files and folders into optimized, compressed ZIP archives entirely in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compressor Mode Toggle Tabs */}
      <div className="w-full px-4 md:px-8 mt-6">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => {
              setCompressMode('image');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer ${
              compressMode === 'image'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon size={15} />
            Smart Image Compressor
          </button>
          <button
            onClick={() => {
              setCompressMode('zip');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer ${
              compressMode === 'zip'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-600 shadow-md shadow-indigo-600/10'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileArchive size={15} />
            Files & Folders Compressor (ZIP)
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="w-full px-4 md:px-8 py-8">
        
        {error && (
          <div className="mb-6 max-w-6xl mx-auto bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* --- 1. UPLOAD VIEW (If no files are loaded in active mode) --- */}
        {((compressMode === 'image' && !selectedFile) || (compressMode === 'zip' && zipFiles.length === 0)) ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full max-w-4xl mx-auto min-h-[350px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-lg scale-[1.01]'
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-slate-700'
            }`}
          >
            {/* Input triggers */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple={compressMode === 'zip'}
              accept={compressMode === 'image' ? "image/jpeg, image/jpg, image/png, image/webp" : "*/*"}
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderInputChange}
              {...({ webkitdirectory: "", directory: "" } as any)}
              multiple
              className="hidden"
            />

            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
              <Upload className="text-indigo-600 dark:text-indigo-400 w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {compressMode === 'image' ? 'Upload Your Image' : 'Upload Files or Folders'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mt-2">
              {compressMode === 'image' 
                ? 'Drag & drop your file here, or select an image file to resize and scale.'
                : 'Drag & drop any files, folders, or mix here, or use the selectors below.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
              >
                <File size={14} />
                Select File{compressMode === 'zip' && 's'}
              </button>

              {compressMode === 'zip' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Folder size={14} />
                  Select Folder
                </button>
              )}
            </div>
            
            <span className="text-[10px] text-slate-400 mt-4 leading-normal">
              100% Secure & Client-Side. No uploads to server databases.
            </span>
          </div>
        ) : (
          // --- 2. ACTIVE WORKSPACE VIEW ---
          <div className="max-w-6xl mx-auto">
            {compressMode === 'image' ? (
              // IMAGE COMPRESSOR WORKSPACE
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
                
                {/* Control Panel (4 Columns) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Sliders size={18} className="text-indigo-500" />
                      Compression Settings
                    </h2>
                    <button 
                      onClick={handleReset}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Clear File
                    </button>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                    <button
                      onClick={() => setMode('manual')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        mode === 'manual'
                          ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Settings size={13} />
                      Manual Size
                    </button>
                    <button
                      onClick={() => setMode('target')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        mode === 'target'
                          ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Minimize2 size={13} />
                      Target Size (KB)
                    </button>
                  </div>

                  {/* Settings Fields */}
                  {mode === 'manual' ? (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">Quality (JPEG/WebP)</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Lowering quality reduces file size significantly with minor visual loss.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">Resolution Scale</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{scale}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={scale}
                          onChange={(e) => setScale(parseInt(e.target.value))}
                          className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 leading-normal">
                          <span>Target Resolution:</span>
                          <span>
                            {Math.round(originalWidth * (scale / 100))} &times; {Math.round(originalHeight * (scale / 100))} px
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Target File Size (KB)</label>
                        <div className="relative rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center">
                          <input
                            type="number"
                            min="5"
                            max="20000"
                            value={targetSize}
                            onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-transparent border-0 outline-none px-4 py-2.5 text-sm font-bold placeholder:text-slate-400 text-slate-800 dark:text-white font-sans"
                          />
                          <span className="text-xs font-bold text-slate-400 pr-4">KB</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Example: Enter 200 to keep the file under 200 KB (perfect for online portal applications).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info Metrics / Download Section */}
                  {result && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 dark:text-slate-400">New File Size:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatSize(result.size)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 dark:text-slate-400">Reduction:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            -{((originalSize - result.size) / originalSize * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 dark:text-slate-400">Final Quality:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {result.quality}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 dark:text-slate-400">Final Scale:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {result.scale}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                      >
                        <Download size={16} />
                        Download Compressed Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Interactive Preview Comparison Panel (8 Columns) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Original Preview Frame */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Original</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {formatSize(originalSize)}
                        </span>
                      </div>
                      <div className="flex-1 min-h-[220px] max-h-[300px] flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950/50 relative">
                        <img 
                          src={originalUrl} 
                          alt="Original" 
                          className="max-w-full max-h-[220px] object-contain rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800" 
                        />
                      </div>
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/30 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Resolution: {originalWidth} &times; {originalHeight} px
                      </div>
                    </div>

                    {/* Compressed Preview Frame */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col relative">
                      
                      {compressing && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/70 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Optimizing Image...</span>
                        </div>
                      )}

                      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compressed</span>
                        {result && (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {formatSize(result.size)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-h-[220px] max-h-[300px] flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950/50">
                        {result ? (
                          <img 
                            src={result.url} 
                            alt="Compressed" 
                            className="max-w-full max-h-[220px] object-contain rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
                            <ImageIcon size={32} strokeWidth={1.5} />
                            <span className="text-xs font-medium">Processing Output...</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/30 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Resolution: {result ? `${result.width} × ${result.height}` : '--'} px
                      </div>
                    </div>

                  </div>

                  {/* Helpful Tips Card */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                      <ZoomIn size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Privacy & Performance Note</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400/80 leading-relaxed font-medium">
                        All file compression happens completely client-side in your browser. Your images are never uploaded to any remote server, ensuring complete confidentiality, data privacy, and instant processing speeds.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              // --- ZIP COMPRESSOR WORKSPACE ---
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
                
                {/* Control Panel (4 Columns) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold flex items-center gap-2">
                      <Sliders size={18} className="text-indigo-500" />
                      ZIP Config
                    </h2>
                    <button 
                      onClick={handleReset}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Input settings */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Archive Name</label>
                      <input
                        type="text"
                        value={zipName}
                        onChange={(e) => setZipName(e.target.value)}
                        placeholder="archive-name.zip"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 transition-colors text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Compression Level</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {zipCompressionLevel === 0 ? 'Store (None)' : zipCompressionLevel === 1 ? '1 (Fastest)' : zipCompressionLevel === 9 ? '9 (Maximum)' : `${zipCompressionLevel} (Normal)`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="9"
                        value={zipCompressionLevel}
                        onChange={(e) => setZipCompressionLevel(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Store level completes instantly without size reductions. High levels (6-9) yield smallest archives but take longer.
                      </p>
                    </div>

                    {/* Stats metrics */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Loaded Files:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{zipFiles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Uncompressed Size:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{formatSize(totalZipInputSize)}</span>
                      </div>
                      {zipResult && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">ZIP File Size:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatSize(zipResult.size)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Reduction:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              -{Math.max(0, ((totalZipInputSize - zipResult.size) / Math.max(1, totalZipInputSize) * 100)).toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Execution Buttons */}
                    <div className="pt-2">
                      {zipResult ? (
                        <button
                          onClick={handleDownloadZip}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                        >
                          <Download size={16} />
                          Download ZIP Archive
                        </button>
                      ) : (
                        <button
                          onClick={handleZipCompress}
                          disabled={zipping || zipFiles.length === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                        >
                          {zipping ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Zipping {zipFiles.length} files ({zipProgress}%)...
                            </>
                          ) : (
                            <>
                              <HardDrive size={16} />
                              Generate ZIP Archive
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ZIP Files List Panel (8 Columns) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Folder size={16} className="text-indigo-500" />
                      Files to Compress
                    </h3>

                    {/* Inputs triggers in panel */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      multiple
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={folderInputRef}
                      onChange={handleFolderInputChange}
                      {...({ webkitdirectory: "", directory: "" } as any)}
                      multiple
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                      >
                        <Plus size={12} /> Add Files
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                      >
                        <Folder size={12} className="w-3 h-3 shrink-0" /> Add Folder
                      </button>
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 select-none">
                    {zipFiles.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                        <div className="flex items-center gap-2 max-w-[80%]">
                          {getFileIcon(item.filepath)}
                          <span 
                            title={item.filepath} 
                            className="font-mono text-slate-600 dark:text-slate-300 truncate"
                          >
                            {item.filepath}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-medium">{formatSize(item.size)}</span>
                          <button
                            onClick={() => removeZipFile(idx)}
                            title="Remove file"
                            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {zipResult && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle size={16} />
                      ZIP Archive generated successfully ({formatSize(zipResult.size)}). Click "Download ZIP Archive" to save.
                    </div>
                  )}

                  {/* Privacy Alert */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex gap-3 text-xs leading-normal">
                    <HardDrive size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-0.5">Zip Compressor</span>
                      <span className="text-indigo-600/90 dark:text-indigo-400/80">
                        Recursive folder trees are parsed. Output file compression runs entirely in memory without remote server involvement.
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>

      <SeoGuideSection toolId="image-compressor" />

    </div>
  );
};

export default ImageCompressor;
