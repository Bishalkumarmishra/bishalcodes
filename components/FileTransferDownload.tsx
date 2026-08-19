'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Clock, ShieldCheck, AlertTriangle, Loader2,
  FileArchive, File, CheckCircle2, ArrowLeft, Lock, Globe, FileDown
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface TransferMetadata {
  transferId: string;
  fileName: string;
  fileSize: number;
  storagePath?: string;
  expiresAt: string;
  createdAt: string;
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

interface Props {
  transferId: string | null;
}

type LoadState = 'loading' | 'ready' | 'expired' | 'notfound' | 'error';

const FileTransferDownload: React.FC<Props> = ({ transferId: propTransferId }) => {
  const [urlId, setUrlId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const idFromSearch = new URLSearchParams(window.location.search).get('id');
      const idFromPath = window.location.pathname.startsWith('/transfer/') 
        ? window.location.pathname.replace('/transfer/', '').split('/')[0].split('?')[0] 
        : null;
      setUrlId(idFromSearch || idFromPath || null);
    }
  }, []);

  const transferId = propTransferId || urlId;
  const [metadata, setMetadata] = useState<TransferMetadata | null>(null);
  const [directFileData, setDirectFileData] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [downloading, setDownloading] = useState(false);
  const [senderStatus, setSenderStatus] = useState<string>('offline');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const unsubscribeRefs = useRef<Array<() => void>>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('');
  const [connectionStateText, setConnectionStateText] = useState('');

  // Clean-up and force-dark variables to prevent light mode bleeding
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    
    root.style.setProperty('--body-bg', '#000000', 'important');
    root.style.setProperty('--html-bg', '#000000', 'important');
    root.style.setProperty('--nav-bg', '#000000', 'important');
    root.style.setProperty('--nav-border', 'rgba(255, 255, 255, 0.08)', 'important');
    root.style.setProperty('--nav-text', '#94a3b8', 'important');
    root.style.setProperty('--nav-text-hover', '#ffffff', 'important');

    return () => {
      root.style.removeProperty('--body-bg');
      root.style.removeProperty('--html-bg');
      root.style.removeProperty('--nav-bg');
      root.style.removeProperty('--nav-border');
      root.style.removeProperty('--nav-text');
      root.style.removeProperty('--nav-text-hover');
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else if (savedTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    };
  }, []);

  const cleanupConnection = React.useCallback(() => {
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    setDownloadSpeed('');
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  const getMimeFromFilename = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      case 'pdf': return 'application/pdf';
      case 'mp4': return 'video/mp4';
      case 'mp3': return 'audio/mpeg';
      case 'zip': return 'application/zip';
      case 'apk': return 'application/vnd.android.package-archive';
      case 'json': return 'application/json';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  };

  const triggerDirectBlobDownload = (dataURI: string, fileName: string) => {
    try {
      const parts = dataURI.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      let mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      if (mime === 'application/octet-stream' || !mime) {
        mime = getMimeFromFilename(fileName);
      }
      const bstr = atob(parts[1] || parts[0]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (err) {
      console.error('Direct download error:', err);
      window.open(dataURI, '_blank');
    }
  };

  useEffect(() => {
    if (!transferId) { setLoadState('notfound'); return; }

    const transferDocRef = doc(db, 'transfers', transferId);
    const unsubscribeTransfer = onSnapshot(transferDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const meta: TransferMetadata = {
          transferId: data.transferId || transferId,
          fileName: data.fileName || 'Shared File',
          fileSize: data.fileSize || 0,
          expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: data.createdAt || new Date().toISOString(),
        };
        setMetadata(meta);
        setSenderStatus(data.senderStatus || 'offline');

        const now = new Date();
        const expiry = new Date(meta.expiresAt);
        if (now > expiry) {
          setLoadState('expired');
        } else {
          setLoadState('ready');
        }
      } else {
        // Fallback to p2p_links
        getDoc(doc(db, 'p2p_links', transferId)).then(p2pSnap => {
          if (p2pSnap.exists()) {
            const data = p2pSnap.data();
            setDirectFileData(data.fileData || null);
            setMetadata({
              transferId,
              fileName: data.fileName || 'Shared File',
              fileSize: data.fileSize || (data.fileData ? data.fileData.length : 0),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
            });
            setSenderStatus('online');
            setLoadState('ready');
          } else {
            // Fallback to radar API
            fetch(`/api/v1/radar?transferId=${transferId}`)
              .then(res => res.json())
              .then(radarRes => {
                if (radarRes.success && radarRes.payload) {
                  setDirectFileData(radarRes.payload.fileData);
                  setMetadata({
                    transferId,
                    fileName: radarRes.payload.fileName || 'Shared File',
                    fileSize: radarRes.payload.fileSize || 0,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date().toISOString(),
                  });
                  setSenderStatus('online');
                  setLoadState('ready');
                } else {
                  setLoadState('notfound');
                }
              })
              .catch(() => setLoadState('notfound'));
          }
        }).catch(() => setLoadState('notfound'));
      }
    }, err => {
      console.error('Failed to listen to transfer document:', err);
      setLoadState('error');
    });

    return () => {
      unsubscribeTransfer();
    };
  }, [transferId]);

  const handleDownload = async () => {
    if (!metadata || !transferId) return;
    if (directFileData) {
      setDownloading(true);
      setConnectionStateText('Downloading file...');
      triggerDirectBlobDownload(directFileData, metadata.fileName);
      setDownloading(false);
      setDownloadProgress(100);
      setConnectionStateText('Download complete!');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setConnectionStateText('Initializing P2P link...');
    cleanupConnection();

    let fileWriter: any = null;
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: metadata.fileName,
        });
        fileWriter = await handle.createWritable();
      } catch (err) {
        console.log('Save file picker canceled or failed, falling back to memory assembly:', err);
      }
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
          { urls: 'stun:stun.cloudflare.com:3478' }
        ]
      });
      pcRef.current = pc;

      // Handle local ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            const candidateRef = doc(collection(db, 'transfers', transferId, 'receiverCandidates'));
            await setDoc(candidateRef, event.candidate.toJSON());
          } catch (e) {
            console.error('Error writing receiver ICE candidate:', e);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Receiver Connection State:", pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStateText('Connected to sender! Preparing streaming...');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionStateText('Connection lost. Please make sure the sender keeps their tab open.');
          setDownloading(false);
          cleanupConnection();
        }
      };

      // Set up Data Channel listener
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.binaryType = 'arraybuffer';

        let receivedChunks: ArrayBuffer[] = [];
        let bytesReceived = 0;
        let lastTime = performance.now();
        let lastBytes = 0;
        let hasError = false;

        let writeQueue = Promise.resolve();

        dc.onopen = () => {
          setConnectionStateText('Receiving file...');
        };

        dc.onmessage = (e) => {
          if (typeof e.data === 'string') {
            writeQueue = writeQueue.then(async () => {
              if (hasError) return;
              try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'DONE') {
                  await finishDownload();
                }
              } catch (err) {
                if (e.data === 'DONE') {
                  await finishDownload();
                }
              }
            });
          } else {
            const buffer = e.data as ArrayBuffer;
            const bufferCopy = buffer.slice(0);
            bytesReceived += bufferCopy.byteLength;

            const now = performance.now();
            const elapsed = (now - lastTime) / 1000;
            if (elapsed >= 0.5) {
              const speed = (bytesReceived - lastBytes) / elapsed;
              setDownloadSpeed(`${formatBytes(speed)}/s`);
              lastTime = now;
              lastBytes = bytesReceived;
            }

            const pct = Math.min(100, Math.round((bytesReceived / metadata.fileSize) * 100));
            setDownloadProgress(pct);

            if (fileWriter) {
              writeQueue = writeQueue.then(async () => {
                if (hasError) return;
                await fileWriter.write(new Uint8Array(bufferCopy));
              }).catch(async (err) => {
                if (hasError) return;
                hasError = true;
                console.error("Write error:", err);
                setConnectionStateText('Disk write failed. Check disk space or permissions.');
                setDownloading(false);
                try {
                  await fileWriter.close();
                } catch (closeErr) {}
                cleanupConnection();
              });
            } else {
              receivedChunks.push(bufferCopy);
            }
          }
        };

        const finishDownload = async () => {
          setConnectionStateText('Finalizing download...');
          setDownloadSpeed('');
          
          if (fileWriter) {
            try {
              await fileWriter.close();
            } catch (e) {
              console.error('Error closing file writer:', e);
            }
            setDownloading(false);
            setDownloadProgress(100);
            setConnectionStateText('Done!');
          } else {
            const blob = new Blob(receivedChunks, { type: getMimeFromFilename(metadata.fileName) });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = metadata.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setDownloading(false);
            setDownloadProgress(100);
            setConnectionStateText('Done!');
          }

          try {
            dc.send(JSON.stringify({ type: 'ACK_DONE' }));
          } catch (err) {
            console.error('Error sending ACK_DONE:', err);
          }

          cleanupConnection();
        };
      };

      // Get transfer metadata & offer from Firestore
      const transferDocRef = doc(db, 'transfers', transferId);
      const snap = await getDoc(transferDocRef);
      if (!snap.exists()) {
        throw new Error('Transfer metadata not found.');
      }
      const data = snap.data();
      if (!data.offer) {
        throw new Error('Offer signal not found.');
      }

      const pendingSenderCandidates: RTCIceCandidateInit[] = [];
      const addSenderCandidate = async (candidateData: RTCIceCandidateInit) => {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateData));
          } catch (e) {
            console.error('Error adding sender ICE candidate:', e);
          }
        } else {
          pendingSenderCandidates.push(candidateData);
        }
      };

      // Subscribe to Sender ICE Candidates
      const senderCandidatesCol = collection(db, 'transfers', transferId, 'senderCandidates');
      const unsubCandidates = onSnapshot(senderCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data() as RTCIceCandidateInit;
            await addSenderCandidate(candidateData);
          }
        });
      });
      unsubscribeRefs.current.push(unsubCandidates);

      // Set Remote Description (SDP Offer)
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      // Flush buffered sender candidates
      while (pendingSenderCandidates.length > 0) {
        const cand = pendingSenderCandidates.shift();
        if (cand) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
      }

      // Create local SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Write Answer to Firestore
      await updateDoc(transferDocRef, {
        answer: { type: answer.type, sdp: answer.sdp },
        receiverStatus: 'connecting'
      });

      setConnectionStateText('Connecting to sender browser...');

    } catch (err: any) {
      console.error(err);
      setConnectionStateText('');
      setDownloading(false);
      alert(err.message || 'P2P connection failed. Make sure the sender has their tab open.');
    }
  };

  const expiryFormatted = metadata?.expiresAt
    ? new Date(metadata.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const createdFormatted = metadata?.createdAt
    ? new Date(metadata.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const daysLeft = metadata?.expiresAt
    ? Math.max(0, Math.ceil((new Date(metadata.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div 
      className="min-h-screen pt-20 pb-16 relative overflow-hidden transition-colors w-full flex flex-col items-center justify-center text-white limewire-bg"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .limewire-bg {
          background-color: #000000;
          background-image: url('/imgi_5_landing-vertical-bg-DU0uf3oE.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        @media (min-width: 768px) {
          .limewire-bg {
            background-image: url('/imgi_4_landing-horizontal-bg-CEVXo4MQ.png');
          }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(4deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-15px) rotate(0deg); }
        }
        .animate-float-1 { animation: float-1 7s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 9s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 6s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 8s ease-in-out infinite; }
      `}} />

      {/* Floating 3D Graphic Tiles */}
      <>
        {/* Left Side Icons */}
        <div className="absolute left-[1%] lg:left-[2%] xl:left-[3%] top-[18%] hidden md:block animate-float-1 select-none pointer-events-none z-10">
          <img src="/imgi_6_landing-tile-left-play-C4JzP4ox.svg" className="w-20 md:w-28 lg:w-36 xl:w-44 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
        </div>

        <div className="absolute left-[3%] lg:left-[4%] xl:left-[6%] top-[48%] hidden md:block animate-float-2 select-none pointer-events-none z-10">
          <img src="/imgi_7_landing-tile-left-below-play-CGFEidvo.svg" className="w-16 md:w-22 lg:w-28 xl:w-36 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
        </div>

        {/* Right Side Icons */}
        <div className="absolute right-[3%] lg:right-[4%] xl:right-[6%] top-[15%] hidden md:block animate-float-3 select-none pointer-events-none z-10">
          <img src="/imgi_11_landing-tile-right-above-tick-W8AhC-Qu.svg" className="w-16 md:w-22 lg:w-28 xl:w-36 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
        </div>

        <div className="absolute right-[1%] lg:right-[2%] xl:right-[3%] top-[45%] hidden md:block animate-float-1 select-none pointer-events-none z-10">
          <img src="/imgi_10_landing-tile-right-tick-DyOBp0tS.svg" className="w-20 md:w-28 lg:w-36 xl:w-44 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
        </div>
      </>

      <div className="w-full max-w-4xl px-6 z-20 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-xl font-extrabold text-white mb-1">
            Bishal<span className="text-[#03df7a]">Codes</span>
          </div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Secure File Transfer</p>
        </div>

        {/* ── Loading Card ── */}
        {loadState === 'loading' && (
          <div className="w-full max-w-md mx-auto rounded-[28px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-12 text-center shadow-2xl">
            <Loader2 size={36} className="mx-auto animate-spin text-[#03df7a] mb-4" />
            <p className="text-sm font-bold text-slate-300">Retrieving secure transfer info…</p>
          </div>
        )}

        {/* ── Not Found Card ── */}
        {loadState === 'notfound' && (
          <div className="w-full max-w-md mx-auto rounded-[28px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={26} className="text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Transfer not found</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                This transfer link is invalid, expired, or the files have been manually deleted from the secure vault.
              </p>
            </div>
            <div className="pt-2">
              <a 
                href="/" 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <ArrowLeft size={15} /> Return to Home
              </a>
            </div>
          </div>
        )}

        {/* ── Expired Card ── */}
        {loadState === 'expired' && (
          <div className="w-full max-w-md mx-auto rounded-[28px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <Clock size={26} className="text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">This transfer has expired</h2>
              <p className="text-xs text-slate-300 font-semibold truncate px-2">{metadata?.fileName}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                This file was only available until <strong className="text-slate-200">{expiryFormatted}</strong>. In compliance with security standards, all archives are auto-deleted after 7 days.
              </p>
            </div>
            <div className="pt-2">
              <a 
                href="/services/file-transfer" 
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm text-black bg-[#03df7a] hover:bg-[#00ff87] transition-all shadow-[0_4px_20px_rgba(3,223,122,0.25)]"
              >
                Send a New File →
              </a>
            </div>
          </div>
        )}

        {/* ── Error Card ── */}
        {loadState === 'error' && (
          <div className="w-full max-w-md mx-auto rounded-[28px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={26} className="text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Could not load metadata for this transfer. This is usually due to network latency. Please reload to try again.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-full font-bold text-sm text-black bg-[#03df7a] hover:bg-[#00ff87] transition-colors"
              >
                Reload Page
              </button>
              <a 
                href="/" 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft size={15} /> Return Home
              </a>
            </div>
          </div>
        )}

        {/* ── Ready Card (Download details) ── */}
        {loadState === 'ready' && metadata && (
          <div className="w-full rounded-[32px] bg-slate-900/60 backdrop-blur-md border border-[#03df7a]/20 overflow-hidden shadow-[0_15px_50px_rgba(3,223,122,0.08)] p-6 md:p-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: File Info & Metadata */}
              <div className="space-y-5">
                {/* File Icon & Info */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <div className="w-12 h-12 bg-[#03df7a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {metadata.fileName.endsWith('.zip') ? (
                      <FileArchive size={24} className="text-[#03df7a]" />
                    ) : (
                      <File size={24} className="text-[#03df7a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-extrabold text-white truncate" title={metadata.fileName}>
                      {metadata.fileName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">
                      {formatBytes(metadata.fileSize)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        senderStatus !== 'offline' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${senderStatus !== 'offline' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                        Sender is {senderStatus !== 'offline' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compatibility Warning for Large Files */}
                {metadata.fileSize > 1024 * 1024 * 1024 && typeof window !== 'undefined' && !('showSaveFilePicker' in window) && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 leading-normal space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-500" /> Large File Warning
                    </p>
                    <p>
                      This file is larger than 1GB. Streaming might fail due to browser memory limits. We highly recommend using Chrome, Edge, or Opera.
                    </p>
                  </div>
                )}

                {/* Meta Table info */}
                <div className="grid grid-cols-2 gap-4 text-[11px] p-4 rounded-2xl bg-slate-950/20 border border-slate-800/50">
                  <div>
                    <p className="text-slate-500 font-bold uppercase tracking-wider mb-1">Sent Date</p>
                    <p className="text-slate-300 font-bold">{createdFormatted}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase tracking-wider mb-1">Expiration</p>
                    <p className={`font-bold ${daysLeft <= 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {expiryFormatted}
                      {daysLeft <= 1 && <span className="ml-1 text-[9px] block text-amber-500 font-semibold">(expires soon)</span>}
                    </p>
                  </div>
                </div>

                {/* Expiry Progress Bar */}
                <div className="px-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                    <span>Time remaining</span>
                    <span className="text-[#03df7a]">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${daysLeft <= 1 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#00d084] to-[#03df7a]'}`}
                      style={{ width: `${Math.min(100, (daysLeft / 7) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Actions & Help Guides */}
              <div className="space-y-4">
                {/* Download Status & Progress */}
                {downloading && (
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-[#03df7a]" />
                        Status: <span className="text-[#03df7a]">{connectionStateText}</span>
                      </span>
                      {downloadSpeed && <span className="text-[#03df7a] font-mono">{downloadSpeed}</span>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00d084] to-[#03df7a] transition-all duration-75"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading || senderStatus === 'offline'}
                  className="w-full flex items-center justify-center gap-2.5 text-black bg-[#03df7a] hover:bg-[#00ff87] disabled:opacity-45 font-extrabold py-4 rounded-full text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_25px_rgba(3,223,122,0.25)] transform active:scale-[0.98]"
                >
                  {downloading ? (
                    <><Loader2 size={16} className="animate-spin text-black" /> Connecting &amp; Receiving…</>
                  ) : senderStatus === 'offline' ? (
                    <><Lock size={16} /> Sender is Offline</>
                  ) : (
                    <><Download size={16} /> Download File</>
                  )}
                </button>

                {senderStatus === 'offline' && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 leading-relaxed text-left font-semibold">
                    <strong className="text-rose-400 block font-bold mb-0.5">Sender appears to be offline:</strong>
                    The sender closed or refreshed their tab, so the direct P2P link is offline. Ask the sender to open their browser, visit the transfer tool, and click <strong className="text-[#03df7a]">"Re-activate"</strong> on this link to resume hosting.
                  </div>
                )}

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-400 leading-relaxed text-left font-semibold">
                  <strong>Attention:</strong> Since this is a Peer-to-Peer transfer, the sender must keep their browser tab open for the transfer to complete.
                </div>

                <div className="p-3 bg-[#03df7a]/5 border border-[#03df7a]/10 rounded-xl text-[10px] text-slate-400 leading-relaxed text-left space-y-1">
                  <strong className="text-[#03df7a] block font-bold uppercase tracking-wider text-[9px]">Steps to Download:</strong>
                  <ul className="list-disc list-inside space-y-1 font-semibold">
                    <li>Ensure the sender has their browser window open on their transfer page.</li>
                    <li>Click <span className="text-[#03df7a]">"Download File"</span> to establish the P2P connection.</li>
                    <li>Choose where to save the file (or wait for in-memory download to complete).</li>
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-semibold pt-1">
                  <span className="flex items-center gap-1"><Lock size={10} className="text-[#03df7a]" /> Stored Encrypted</span>
                  <span className="flex items-center gap-1"><Clock size={10} className="text-[#03df7a]" /> Auto-deleted</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Bottom footer text */}
        <p className="text-center text-[10px] text-slate-500 mt-8 font-semibold uppercase tracking-wider select-none">
          Powered by{' '}
          <a href="https://bishalcodes.com" className="text-[#03df7a] hover:underline font-bold">BishalCodes.com</a>
        </p>
      </div>
    </div>
  );
};

export default FileTransferDownload;
