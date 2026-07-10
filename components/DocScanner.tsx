'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  ArrowLeft, Camera, Upload, QrCode, RefreshCw, FileDown, 
  Trash2, Sparkles, Check, CheckCircle2, Image as ImageIcon, 
  Plus, Smartphone, Laptop, Loader2, Play, Eye, RotateCw, AlertCircle
} from 'lucide-react';

interface ScannedPage {
  id: string;
  dataUrl: string;
  filter: 'original' | 'magic' | 'bw' | 'grayscale';
  createdAt: string;
}

// ── Homography system helper ──
function solveGaussian(A: number[][], B: number[]) {
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempRow = A[i]; A[i] = A[maxRow]; A[maxRow] = tempRow;
    const tempB = B[i]; B[i] = B[maxRow]; B[maxRow] = tempB;

    if (Math.abs(A[i][i]) < 1e-10) return null;

    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] += c * A[i][j];
      }
      B[k] += c * B[i];
    }
  }
  const x = [];
  for (let i = 0; i < n; i++) {
    x.push(B[i] / A[i][i]);
  }
  return x;
}

function getPerspectiveTransform(src: { x: number; y: number }[], dst: { x: number; y: number }[]) {
  const A = [];
  const B = [];
  for (let i = 0; i < 4; i++) {
    const sx = src[i].x, sy = src[i].y;
    const dx = dst[i].x, dy = dst[i].y;
    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    B.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    B.push(dy);
  }
  const h = solveGaussian(A, B);
  if (!h) return null;
  return [
    h[0], h[1], h[2],
    h[3], h[4], h[5],
    h[6], h[7], 1
  ];
}

export default function DocScanner() {
  const { navigate } = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Router session states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  // Scanning & Cropping states
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activeFilter, setActiveFilter] = useState<'original' | 'magic' | 'bw' | 'grayscale'>('magic');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  
  // Draggable corners (Normalized)
  const [corners, setCorners] = useState<{ x: number; y: number }[]>([
    { x: 0.15, y: 0.15 }, // TL
    { x: 0.85, y: 0.15 }, // TR
    { x: 0.85, y: 0.85 }, // BR
    { x: 0.15, y: 0.85 }  // BL
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Syncing & UI status
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // ── 1. Check Routing Mode (Desktop vs Mobile) ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');

      if (sessionParam) {
        setSessionId(sessionParam);
        setIsMobileMode(true);
      } else {
        const newSessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSessionId(newSessionId);
        setIsMobileMode(false);
        setupDesktopSession(newSessionId);
      }
    }
  }, []);

  // ── 2. Desktop Host: Initialize Session & Listen ──
  const setupDesktopSession = async (sid: string) => {
    try {
      const sessionRef = doc(db, 'transfers', `scan_${sid}`);
      await setDoc(sessionRef, { pages: [], createdAt: new Date().toISOString() });

      const joinUrl = `${window.location.origin}/tools/scan-pdf?session=${sid}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl, { margin: 2, scale: 6 });
      setQrUrl(qrDataUrl);

      const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const syncedPages: ScannedPage[] = data.pages || [];
          setPages(prev => {
            const prevIds = prev.map(p => p.id);
            const newPages = syncedPages.filter(p => !prevIds.includes(p.id));
            return [...prev, ...newPages];
          });
        }
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error(err);
      setError('Failed to configure sync connection. Try reloading.');
    }
  };

  // ── 3. Camera Setup & Streaming ──
  const startCamera = async () => {
    setError(null);
    try {
      setCameraActive(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);

      const selectedId = selectedCameraId || videoDevices[videoDevices.length - 1]?.deviceId || '';
      setSelectedCameraId(selectedId);

      const constraints = {
        video: selectedId ? { deviceId: { exact: selectedId } } : { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not access device camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCroppingImage(rawUrl);
        // Reset corners to reasonable default crop
        setCorners([
          { x: 0.15, y: 0.15 },
          { x: 0.85, y: 0.15 },
          { x: 0.85, y: 0.85 },
          { x: 0.15, y: 0.85 }
        ]);
        stopCamera();
      }
    }
  };

  // ── 4. Local File Import ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCroppingImage(event.target.result as string);
          setCorners([
            { x: 0.15, y: 0.15 },
            { x: 0.85, y: 0.15 },
            { x: 0.85, y: 0.85 },
            { x: 0.15, y: 0.85 }
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ── 5. Perspective Warping Pixel Algorithm ──
  const runPerspectiveWarp = () => {
    if (!croppingImage) return;
    setLoading(true);

    const img = new Image();
    img.src = croppingImage;
    img.onload = () => {
      const srcWidth = img.width;
      const srcHeight = img.height;

      // Clean A4 canvas aspect ratio dimensions
      const dstWidth = 900;
      const dstHeight = 1270;

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = srcWidth;
      srcCanvas.height = srcHeight;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return;
      srcCtx.drawImage(img, 0, 0);
      const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
      const srcData = srcImageData.data;

      const dstCanvas = document.createElement('canvas');
      dstCanvas.width = dstWidth;
      dstCanvas.height = dstHeight;
      const dstCtx = dstCanvas.getContext('2d');
      if (!dstCtx) return;
      const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
      const dstData = dstImageData.data;

      // Source corners mapped from normalized positions
      const p0 = { x: corners[0].x * srcWidth, y: corners[0].y * srcHeight };
      const p1 = { x: corners[1].x * srcWidth, y: corners[1].y * srcHeight };
      const p2 = { x: corners[2].x * srcWidth, y: corners[2].y * srcHeight };
      const p3 = { x: corners[3].x * srcWidth, y: corners[3].y * srcHeight };

      // Destination coordinates
      const d0 = { x: 0, y: 0 };
      const d1 = { x: dstWidth, y: 0 };
      const d2 = { x: dstWidth, y: dstHeight };
      const d3 = { x: 0, y: dstHeight };

      // Generate the mapping matrix H mapping (u, v) -> (x, y)
      const H = getPerspectiveTransform([d0, d1, d2, d3], [p0, p1, p2, p3]);
      if (!H) {
        setImagePreview(croppingImage);
        setCroppingImage(null);
        setLoading(false);
        return;
      }

      // Backward map pixel matrix warp
      for (let v = 0; v < dstHeight; v++) {
        for (let u = 0; u < dstWidth; u++) {
          const w = H[6] * u + H[7] * v + H[8];
          const x = (H[0] * u + H[1] * v + H[2]) / w;
          const y = (H[3] * u + H[4] * v + H[5]) / w;

          const xs = Math.round(x);
          const ys = Math.round(y);

          const dstIdx = (v * dstWidth + u) * 4;

          if (xs >= 0 && xs < srcWidth && ys >= 0 && ys < srcHeight) {
            const srcIdx = (ys * srcWidth + xs) * 4;
            dstData[dstIdx] = srcData[srcIdx];
            dstData[dstIdx + 1] = srcData[srcIdx + 1];
            dstData[dstIdx + 2] = srcData[srcIdx + 2];
            dstData[dstIdx + 3] = srcData[srcIdx + 3];
          } else {
            dstData[dstIdx] = 255;
            dstData[dstIdx + 1] = 255;
            dstData[dstIdx + 2] = 255;
            dstData[dstIdx + 3] = 255;
          }
        }
      }

      dstCtx.putImageData(dstImageData, 0, 0);
      const warpedUrl = dstCanvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(warpedUrl);
      setCroppingImage(null);
      setLoading(false);
    };
  };

  // ── 6. Drag & Drop Perspective Point Handlers ──
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingIndex(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIndex === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setCorners(prev => {
      const next = [...prev];
      next[draggingIndex] = { x, y };
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIndex !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setDraggingIndex(null);
    }
  };

  // ── 7. Image Filters (Magic Color, BW, Grayscale) ──
  const applyFilters = (dataUrl: string, filterType: 'original' | 'magic' | 'bw' | 'grayscale', callback: (filteredUrl: string) => void) => {
    if (filterType === 'original') {
      callback(dataUrl);
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (filterType === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      } else if (filterType === 'bw') {
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
          const threshold = 125;
          const v = avg > threshold ? 255 : 0;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        }
      } else if (filterType === 'magic') {
        const contrast = 1.35;
        const brightness = 15;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          data[i] = factor * (data[i] - 128) + 128 + brightness;
          data[i + 1] = factor * (data[i + 1] - 128) + 128 + brightness;
          data[i + 2] = factor * (data[i + 2] - 128) + 128 + brightness;

          data[i] = Math.max(0, Math.min(255, data[i]));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    };
  };

  // ── 8. Mobile Page Sync Sender ──
  const sendPageToDesktop = () => {
    if (!imagePreview || !sessionId) return;
    setUploadStatus('sending');

    applyFilters(imagePreview, activeFilter, async (filteredUrl) => {
      try {
        const sessionRef = doc(db, 'transfers', `scan_${sessionId}`);
        await updateDoc(sessionRef, {
          pages: arrayUnion({
            id: Math.random().toString(36).substring(7),
            dataUrl: filteredUrl,
            filter: activeFilter,
            createdAt: new Date().toISOString()
          })
        });
        setUploadStatus('sent');
        setTimeout(() => {
          setUploadStatus('idle');
          setImagePreview(null);
        }, 1800);
      } catch (err: any) {
        console.error(err);
        setError('Connection timed out. Retrying...');
        setUploadStatus('error');
      }
    });
  };

  // ── 9. Desktop Add Page Direct ──
  const handleDesktopFileAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCroppingImage(e.target.result as string);
        setCorners([
          { x: 0.15, y: 0.15 },
          { x: 0.85, y: 0.15 },
          { x: 0.85, y: 0.85 },
          { x: 0.15, y: 0.85 }
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const deletePage = (pid: string) => {
    setPages(prev => prev.filter(p => p.id !== pid));
  };

  // ── 10. jsPDF A4 Document Compile ──
  const compileAndDownloadPdf = () => {
    if (pages.length === 0) return;
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pages.forEach((page, index) => {
        if (index > 0) pdf.addPage();
        pdf.addImage(page.dataUrl, 'JPEG', 0, 0, 210, 297);
      });

      pdf.save(`Scanned_Doc_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      setError('Could not render document to PDF compiler.');
    } finally {
      setLoading(false);
    }
  };

  // ── Perspective Crop Overlay Screen ──
  if (croppingImage) {
    const polyPoints = corners.map(c => `${c.x * 100}%,${c.y * 100}%`).join(' ');
    return (
      <div className="w-full text-slate-800 dark:text-slate-100 min-h-screen pt-24 pb-16 flex flex-col items-center bg-slate-950 text-white">
        <div className="w-full max-w-md px-4 flex flex-col gap-6">
          <div className="text-left">
            <h2 className="text-base font-black">Perspective Adjust</h2>
            <p className="text-xs text-slate-400 mt-1">Drag the 4 corner handles to match the borders of the paper sheet.</p>
          </div>

          {/* Interactive Bounding Box Polygon Grid */}
          <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden relative select-none border border-slate-800"
            style={{ touchAction: 'none' }}
          >
            <img 
              src={croppingImage} 
              alt="Raw document" 
              className="w-full h-full object-contain pointer-events-none" 
            />

            {/* SVG Polygon connecting handle coordinates */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <polygon
                points={polyPoints}
                fill="rgba(34, 197, 94, 0.15)"
                stroke="#22c55e"
                strokeWidth="2.5"
              />
            </svg>

            {/* Draggable Circle Handles */}
            {corners.map((corner, i) => (
              <div
                key={i}
                onPointerDown={(e) => handlePointerDown(i, e)}
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-[3px] border-green-500 bg-white/90 active:bg-green-100 flex items-center justify-center cursor-move shadow-md z-20 transition-transform active:scale-110"
                style={{
                  left: `${corner.x * 100}%`,
                  top: `${corner.y * 100}%`
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCroppingImage(null)}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-all text-center"
            >
              Cancel
            </button>
            <button
              onClick={runPerspectiveWarp}
              disabled={loading}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>Crop & Warp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Mobile Mode ──
  if (isMobileMode) {
    return (
      <div className="w-full text-slate-800 dark:text-slate-100 min-h-screen pt-24 pb-16 flex flex-col items-center bg-slate-900 text-white">
        <div className="w-full max-w-md px-4 flex flex-col gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center rounded-lg">
              <Smartphone size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none text-white">Mobile CamScanner</h2>
              <p className="text-[10px] text-slate-400 mt-1">Sync Session: {sessionId}</p>
            </div>
          </div>

          {error && (
            <div className="w-full bg-rose-500/20 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Camera Viewport */}
          {!imagePreview ? (
            <div className="w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-slate-800 relative flex flex-col items-center justify-center shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="absolute z-10 flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md"
                >
                  <Play size={14} /> Start Camera
                </button>
              ) : (
                <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-center gap-4">
                  
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        stopCamera();
                        setTimeout(startCamera, 100);
                      }}
                      className="bg-black/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] max-w-[120px] truncate focus:outline-none"
                    >
                      {cameras.map((c, i) => (
                        <option key={c.deviceId} value={c.deviceId}>Cam {i + 1}</option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={capturePhoto}
                    className="w-14 h-14 bg-white hover:bg-slate-200 border-4 border-slate-600 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-pulse"
                    title="Capture Photo"
                  >
                    <div className="w-10 h-10 bg-white rounded-full border border-slate-300" />
                  </button>

                  <button 
                    onClick={stopCamera}
                    className="text-[10px] font-bold bg-slate-800/80 px-3 py-1.5 border border-slate-700 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Filter Selection screen after warp */
            <div className="w-full flex flex-col gap-4">
              <div className="w-full aspect-[3/4] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Captured page preview"
                  className={`max-w-full max-h-full object-contain ${
                    activeFilter === 'grayscale' ? 'grayscale' :
                    activeFilter === 'bw' ? 'contrast-200 brightness-100 grayscale' :
                    activeFilter === 'magic' ? 'contrast-125 brightness-105 saturate-120' : ''
                  }`}
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'original', name: 'Original', icon: ImageIcon },
                  { id: 'magic', name: 'Magic', icon: Sparkles },
                  { id: 'grayscale', name: 'Gray', icon: RotateCw },
                  { id: 'bw', name: 'B&W', icon: RotateCw }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`flex flex-col items-center py-2 rounded-xl border text-[10px] font-bold gap-1 transition-all ${
                      activeFilter === f.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <f.icon size={12} />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setImagePreview(null); startCamera(); }}
                  disabled={uploadStatus === 'sending'}
                  className="flex-1 py-3 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs transition-all text-center"
                >
                  Retake
                </button>
                
                <button
                  onClick={sendPageToDesktop}
                  disabled={uploadStatus === 'sending' || uploadStatus === 'sent'}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {uploadStatus === 'sending' && <Loader2 size={13} className="animate-spin" />}
                  {uploadStatus === 'sent' && <CheckCircle2 size={13} className="text-emerald-400" />}
                  {uploadStatus === 'idle' && <FileDown size={13} />}
                  <span>
                    {uploadStatus === 'sending' ? 'Sending Page...' : 
                     uploadStatus === 'sent' ? 'Page Sent!' : 'Send to PC'}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Render Desktop Mode ──
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
              Scan-to-PDF <span className="text-indigo-600 dark:text-indigo-400 font-normal">CamScanner</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl font-medium leading-relaxed">
              Scan documents with your smartphone camera and stream pages directly to your browser in real-time. Apply magic colors, warp perspective bounds, and export to PDF.
            </p>
          </div>
        </div>

        {error && (
          <div className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 mb-6 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Sync Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full">
          
          {/* Left panel: Connection guide & Scan source */}
          <div className="xl:col-span-4 flex flex-col gap-6 w-full">
            
            {/* Connection Status Box */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
              
              <div className="flex items-center gap-2 mb-4 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/20">
                <Smartphone size={13} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Smartphone Scanner Sync</span>
              </div>

              {qrUrl ? (
                <div className="w-44 h-44 rounded-2xl bg-white p-2.5 border border-slate-100 flex items-center justify-center shadow-md relative group overflow-hidden">
                  <img src={qrUrl} alt="Connect QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-dashed border-slate-350">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              )}

              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mt-4">Scan QR to Scan Page</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-normal font-medium">
                Point your phone camera at this QR code to instantly link your phone as a portable scanner. All photos snapped on mobile sync to this screen in real-time.
              </p>

              <div className="flex items-center justify-between gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-[10px] font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-1.5 text-indigo-500 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Waiting for mobile...</span>
                </div>
                <span>Sync: {sessionId}</span>
              </div>
            </div>

            {/* Local file uploader */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Laptop size={14} className="text-slate-400" />
                <span>Upload From Desktop</span>
              </h4>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[120px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <ImageIcon size={20} className="text-slate-400 mb-2" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Choose image file</span>
                <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG, WebP</span>
              </div>
            </div>

          </div>

          {/* Right panel: Scanned Pages grid & Compilation */}
          <div className="xl:col-span-8 flex flex-col gap-6 w-full min-h-[480px]">
            
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Scanned Pages ({pages.length})</span>
              </div>
              
              <button
                onClick={compileAndDownloadPdf}
                disabled={pages.length === 0 || loading}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-black shadow-md transition-all shrink-0"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                <span>Download Compiled PDF</span>
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="flex-1 w-full border border-slate-200 dark:border-slate-850 rounded-3xl bg-white dark:bg-slate-900/40 border-dashed min-h-[360px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4 text-slate-300 border border-slate-100 dark:border-slate-850">
                  <Camera size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Your Document Workspace is Empty</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-normal">
                  Connect your phone using the QR code on the left, capture document pages, and they will populate here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((page, index) => (
                  <div key={page.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-2.5 flex flex-col gap-2 shadow-sm relative group animate-fade-in">
                    
                    <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                      {index + 1}
                    </div>

                    <div className="w-full aspect-[3/4] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-850 relative">
                      <img src={page.dataUrl} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain" />
                      
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => deletePage(page.id)}
                          className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition-all"
                          title="Delete Page"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                      <span className="font-mono">Page {index + 1}</span>
                      <span className="capitalize text-indigo-500 font-bold">{page.filter} filter</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
}
