'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
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

// ── 1. Homography solver math ──
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

// ── 2. Computer Vision Auto-Crop boundary detector ──
function detectDocumentCorners(ctx: CanvasRenderingContext2D, w: number, h: number) {
  try {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let totalLuma = 0;
    const lumaGrid = new Float32Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      lumaGrid[i / 4] = luma;
      totalLuma += luma;
    }
    const avgLuma = totalLuma / (w * h);

    // Threshold coordinates (paper brightness)
    const threshold = avgLuma + 10;
    const points = [];
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const idx = y * w + x;
        if (lumaGrid[idx] > threshold) {
          points.push({ x, y });
        }
      }
    }

    if (points.length < 80) {
      return [
        { x: 0.15, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.85, y: 0.85 },
        { x: 0.15, y: 0.85 }
      ];
    }

    // Heuristics: Find extreme nodes forming paper bounds
    let tl = points[0], tr = points[0], br = points[0], bl = points[0];
    let minTL = Infinity, maxTR = -Infinity, maxBR = -Infinity, minBL = Infinity;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const sum = p.x + p.y;
      const diff = p.x - p.y;

      if (sum < minTL) { minTL = sum; tl = p; }
      if (diff > maxTR) { maxTR = diff; tr = p; }
      if (sum > maxBR) { maxBR = sum; br = p; }
      if (diff < minBL) { minBL = diff; bl = p; }
    }

    return [
      { x: Math.max(0, Math.min(1, tl.x / w)), y: Math.max(0, Math.min(1, tl.y / h)) },
      { x: Math.max(0, Math.min(1, tr.x / w)), y: Math.max(0, Math.min(1, tr.y / h)) },
      { x: Math.max(0, Math.min(1, br.x / w)), y: Math.max(0, Math.min(1, br.y / h)) },
      { x: Math.max(0, Math.min(1, bl.x / w)), y: Math.max(0, Math.min(1, bl.y / h)) }
    ];
  } catch (e) {
    console.error('[Auto Crop] Error scanning pixels:', e);
    return [
      { x: 0.15, y: 0.15 },
      { x: 0.85, y: 0.15 },
      { x: 0.85, y: 0.85 },
      { x: 0.15, y: 0.85 }
    ];
  }
}

// ── 3. Backward Mapping perspective warper helper ──
const warpImage = (
  rawUrl: string,
  normalizedCorners: { x: number; y: number }[],
  callback: (warpedUrl: string) => void
) => {
  const img = new Image();
  img.src = rawUrl;
  img.onload = () => {
    const srcWidth = img.width;
    const srcHeight = img.height;

    // Standard high-quality A4 dimensions
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

    const p0 = { x: normalizedCorners[0].x * srcWidth, y: normalizedCorners[0].y * srcHeight };
    const p1 = { x: normalizedCorners[1].x * srcWidth, y: normalizedCorners[1].y * srcHeight };
    const p2 = { x: normalizedCorners[2].x * srcWidth, y: normalizedCorners[2].y * srcHeight };
    const p3 = { x: normalizedCorners[3].x * srcWidth, y: normalizedCorners[3].y * srcHeight };

    const d0 = { x: 0, y: 0 };
    const d1 = { x: dstWidth, y: 0 };
    const d2 = { x: dstWidth, y: dstHeight };
    const d3 = { x: 0, y: dstHeight };

    const H = getPerspectiveTransform([d0, d1, d2, d3], [p0, p1, p2, p3]);
    if (!H) {
      callback(rawUrl);
      return;
    }

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
    callback(dstCanvas.toDataURL('image/jpeg', 0.85));
  };
};

export default function DocScanner() {
  const { navigate } = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Router session states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  // Scanning & Sync lists
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  // Live Auto Capture & stability checks
  const [liveDetectedCorners, setLiveDetectedCorners] = useState<{ x: number; y: number }[]>([]);
  const [flashActive, setFlashActive] = useState(false);
  const [isStableDetected, setIsStableDetected] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(3 / 4);
  
  const scanLoopIdRef = useRef<number | null>(null);
  const stableCountRef = useRef<number>(0);
  const prevCornersRef = useRef<{ x: number; y: number }[]>([]);

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

    return () => {
      if (scanLoopIdRef.current) cancelAnimationFrame(scanLoopIdRef.current);
    };
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
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;
            if (width && height) {
              setVideoAspectRatio(width / height);
            }
          }
          startScanningLoop();
        };
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not access device camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopIdRef.current) {
      cancelAnimationFrame(scanLoopIdRef.current);
      scanLoopIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLiveDetectedCorners([]);
    setIsStableDetected(false);
  };

  // ── 4. Real-time Frame Analysis Scanning Loop ──
  const startScanningLoop = () => {
    const checkFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        if (cameraActive) scanLoopIdRef.current = requestAnimationFrame(checkFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        const maxDim = 200;
        if (video.videoWidth > video.videoHeight) {
          canvas.width = maxDim;
          canvas.height = Math.round(maxDim * (video.videoHeight / video.videoWidth));
        } else {
          canvas.height = maxDim;
          canvas.width = Math.round(maxDim * (video.videoWidth / video.videoHeight));
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const newCorners = detectDocumentCorners(ctx, canvas.width, canvas.height);
        setLiveDetectedCorners(newCorners);

        // Check stability across sequential frames
        if (prevCornersRef.current.length === 4) {
          let isStable = true;
          for (let i = 0; i < 4; i++) {
            const dx = Math.abs(newCorners[i].x - prevCornersRef.current[i].x);
            const dy = Math.abs(newCorners[i].y - prevCornersRef.current[i].y);
            if (dx > 0.045 || dy > 0.045) {
              isStable = false;
              break;
            }
          }

          if (isStable) {
            stableCountRef.current += 1;
            setIsStableDetected(true);
            if (stableCountRef.current >= 4) {
              stableCountRef.current = 0;
              setIsStableDetected(false);
              triggerAutoCapture(video, newCorners);
              return; 
            }
          } else {
            stableCountRef.current = 0;
            setIsStableDetected(false);
          }
        }
        prevCornersRef.current = newCorners;
      }

      // Scan every 180ms to prevent browser lag
      setTimeout(() => {
        if (videoRef.current && videoRef.current.srcObject) {
          scanLoopIdRef.current = requestAnimationFrame(checkFrame);
        }
      }, 180);
    };

    scanLoopIdRef.current = requestAnimationFrame(checkFrame);
  };

  // ── 5. Auto Capture Trigger, Warp, & Filter ──
  const triggerAutoCapture = (video: HTMLVideoElement, cropCorners: { x: number; y: number }[]) => {
    // Visual flash animation trigger
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawUrl = canvas.toDataURL('image/jpeg', 0.90);

    // Pause feed capture
    stopCamera();

    warpAndEnhanceDirectly(rawUrl, cropCorners);
  };

  const warpAndEnhanceDirectly = (rawUrl: string, cropCorners: { x: number; y: number }[]) => {
    setLoading(true);

    warpImage(rawUrl, cropCorners, (warpedUrl) => {
      // Magic Color automatic enhancement filter
      applyFilters(warpedUrl, 'magic', async (filteredUrl) => {
        if (isMobileMode) {
          setUploadStatus('sending');
          try {
            const sessionRef = doc(db, 'transfers', `scan_${sessionId}`);
            await updateDoc(sessionRef, {
              pages: arrayUnion({
                id: Math.random().toString(36).substring(7),
                dataUrl: filteredUrl,
                filter: 'magic',
                createdAt: new Date().toISOString()
              })
            });
            setUploadStatus('sent');
            setTimeout(() => {
              setUploadStatus('idle');
              // Automatically resume scanner for the next page
              startCamera();
            }, 1000);
          } catch (err: any) {
            console.error(err);
            setError('Failed to send sheet to PC. Resuming camera...');
            setUploadStatus('error');
            setTimeout(startCamera, 1200);
          }
        } else {
          // Desktop mode direct addition
          setPages(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              dataUrl: filteredUrl,
              filter: 'magic',
              createdAt: new Date().toISOString()
            }
          ]);
        }
        setLoading(false);
      });
    });
  };

  // ── 6. Local File Import ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawUrl = event.target.result as string;
          
          const img = new Image();
          img.src = rawUrl;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              // Run corner detector
              const detected = detectDocumentCorners(ctx, img.width, img.height);
              // Warp and Enhance directly without showing manual edit circular handles
              warpAndEnhanceDirectly(rawUrl, detected);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ── 7. Image Filter logic ──
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

  const deletePage = (pid: string) => {
    setPages(prev => prev.filter(p => p.id !== pid));
  };

  // ── 8. jsPDF A4 Document Compile ──
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

  // ── Render Mobile Mode (Auto-Capture & Real-time Guide) ──
  if (isMobileMode) {
    return (
      <div className="w-full text-slate-800 dark:text-slate-100 min-h-screen pt-24 pb-16 flex flex-col items-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-md px-4 flex flex-col gap-6">
          
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center rounded-lg">
              <Smartphone size={16} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Mobile CamScanner</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Session ID: {sessionId}</p>
            </div>
          </div>

          {error && (
            <div className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Camera Frame Viewport */}
          <div 
            className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col items-center justify-center shadow-sm transition-all duration-300"
            style={{ aspectRatio: cameraActive ? videoAspectRatio : 3 / 4 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Flash visual overlay */}
            {flashActive && <div className="absolute inset-0 bg-white z-30 animate-flash" />}

            {/* Scanning guidemarkers, dynamic detected bounding box, and laser scanning line */}
            {cameraActive && (
              <>
                {/* Dynamic Auto-Crop Bounding polygon overlay */}
                {liveDetectedCorners.length === 4 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <polygon
                      points={liveDetectedCorners.map(c => `${c.x * 100}%,${c.y * 100}%`).join(' ')}
                      fill={isStableDetected ? "rgba(34, 197, 94, 0.12)" : "rgba(99, 102, 241, 0.08)"}
                      stroke={isStableDetected ? "#22c55e" : "#6366f1"}
                      strokeWidth="2.5"
                      strokeDasharray={isStableDetected ? "none" : "5,5"}
                    />
                  </svg>
                )}

                {/* Laser scanning line */}
                <div className="absolute left-[10%] right-[10%] h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-scanner-line pointer-events-none z-10" />

                {/* Status indicator */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-center">
                  <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border shadow-sm ${
                    isStableDetected 
                      ? 'bg-green-600 border-green-500 text-white animate-pulse' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}>
                    {isStableDetected ? 'Hold Steady: Scanning...' : 'Align Document Paper'}
                  </span>
                </div>
              </>
            )}

            {!cameraActive && (
              <button
                onClick={startCamera}
                className="absolute z-15 flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow"
              >
                <Play size={14} /> Start Automatic Scanner
              </button>
            )}

            {cameraActive && (
              <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center">
                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      stopCamera();
                      setTimeout(startCamera, 100);
                    }}
                    className="bg-slate-950/85 text-white border border-slate-800 px-2 py-1.5 rounded-lg text-[10px] max-w-[100px] truncate focus:outline-none"
                  >
                    {cameras.map((c, i) => (
                      <option key={c.deviceId} value={c.deviceId}>Cam {i + 1}</option>
                    ))}
                  </select>
                )}

                <button 
                  onClick={stopCamera}
                  className="text-[10px] font-bold bg-slate-950/85 text-white px-3 py-1.5 border border-slate-800 rounded-lg ml-auto"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Loader2 size={13} className="animate-spin text-indigo-500" />
              <span>Processing Perspective Auto-Crop & Enhancing...</span>
            </div>
          )}

          {uploadStatus !== 'idle' && (
            <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {uploadStatus === 'sending' && <Loader2 size={13} className="animate-spin" />}
              {uploadStatus === 'sent' && <CheckCircle2 size={13} className="text-emerald-500" />}
              <span>
                {uploadStatus === 'sending' ? 'Uploading page to PC...' : 'Sheet uploaded successfully!'}
              </span>
            </div>
          )}

        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanner {
            0% { top: 10%; }
            50% { top: 90%; }
            100% { top: 10%; }
          }
          .animate-scanner-line {
            animation: scanner 2.2s ease-in-out infinite;
          }
          @keyframes flashAnim {
            from { opacity: 0.95; }
            to { opacity: 0; }
          }
          .animate-flash {
            animation: flashAnim 0.25s ease-out forwards;
          }
        `}} />
      </div>
    );
  }

  // ── Render Desktop Mode (Clean Human Design) ──
  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300 min-h-screen pt-28 pb-16 flex flex-col items-center">
      <div className="w-full px-4 md:px-8 xl:px-12 flex flex-col text-left">
        
        {/* Back Button & Title */}
        <div className="flex flex-col gap-4 mb-8 text-left">
          <button 
            onClick={() => navigate('services')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg w-fit shrink-0"
            title="Back to Tools"
          >
            <ArrowLeft size={13} />
            <span>Back to Tools</span>
          </button>
          
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Scan-to-PDF Document Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl font-medium leading-relaxed">
              Snap paper documents with your smartphone and sync them to your PC screen in real-time. Automatically removes background desks, corrects skewed angles, and compiles pages into clean PDFs.
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
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              
              <div className="flex items-center gap-2 mb-4 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/20">
                <Smartphone size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Sync Mobile Camera</span>
              </div>

              {qrUrl ? (
                <div className="w-44 h-44 rounded-xl bg-white p-2.5 border border-slate-200 flex items-center justify-center shadow-sm relative group overflow-hidden">
                  <img src={qrUrl} alt="Connect QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-dashed border-slate-350">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              )}

              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-4">1. Scan QR with Smartphone</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs mt-1 leading-normal font-medium">
                Point your phone camera here to open the remote capture scanner page. Photos snapped on your phone will stream directly to this dashboard.
              </p>

              <div className="flex items-center justify-between gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Waiting for scan...</span>
                </div>
                <span>Session ID: {sessionId}</span>
              </div>
            </div>

            {/* Desktop direct upload */}
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Laptop size={14} className="text-slate-400" />
                <span>Or Upload Local File</span>
              </h4>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[100px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <ImageIcon size={18} className="text-slate-400 mb-1.5" />
                <span className="text-[10px] font-bold text-slate-650 dark:text-slate-400">Drag & drop or browse image</span>
                <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG, WebP</span>
              </div>
            </div>

          </div>

          {/* Right panel: Scanned Pages grid */}
          <div className="xl:col-span-8 flex flex-col gap-6 w-full min-h-[480px]">
            
            {/* Sheet Actions Header */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Scanned Sheets ({pages.length})</span>
              </div>
              
              <button
                onClick={compileAndDownloadPdf}
                disabled={pages.length === 0 || loading}
                className="flex items-center justify-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:pointer-events-none rounded-lg text-xs font-bold shadow transition-all shrink-0 border border-indigo-700"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                <span>Compile to PDF</span>
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="flex-1 w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30 border-dashed min-h-[360px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-3 text-slate-350 border border-slate-200 dark:border-slate-800">
                  <Camera size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Workspace is empty</h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm leading-normal">
                  Connect your phone using the QR code instructions on the left or upload a local photo to build your document pages list.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((page, index) => (
                  <div key={page.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-2.5 flex flex-col gap-2 shadow-sm relative group animate-fade-in">
                    
                    <div className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                      {index + 1}
                    </div>

                    <div className="w-full aspect-[3/4] bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-850 relative">
                      <img src={page.dataUrl} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain pointer-events-none" />
                      
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => deletePage(page.id)}
                          className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow transition-all"
                          title="Delete Page"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-450 px-1">
                      <span className="font-mono">Page {index + 1}</span>
                      <span className="capitalize text-indigo-600 dark:text-indigo-400 font-bold">{page.filter}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      <SeoGuideSection toolId="scan-pdf" />

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
