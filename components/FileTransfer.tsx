'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft, Upload, X, File, Folder, Copy, Check,
  Send, Link2, AlertCircle, Loader2, CloudUpload, Mail,
  ShieldCheck, Clock, FileArchive, Lock, Zap, Globe, FileDown, Download
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

// ─── Types ────────────────────────────────────────────────────────────────────
import { doc, setDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface FileEntry { file: File; relativePath: string; }
type Stage = 'idle' | 'zipping' | 'connecting' | 'transferring' | 'done' | 'error';
interface TransferResult {
  transferId: string; downloadPageUrl: string; publicFileUrl?: string;
  expiresAt: string; fileName: string; fileSize: number;
}
interface SavedTransfer {
  transferId: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  downloadPageUrl: string;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '🖼️';
  if (['mp4','mkv','mov','avi','webm'].includes(ext)) return '🎬';
  if (['mp3','wav','flac','aac','ogg'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '📦';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  if (['js','ts','tsx','jsx','py','java','cpp','c','go','rs'].includes(ext)) return '💻';
  return '📁';
};

async function getAllFilesFromDataTransfer(
  items: DataTransferItemList,
  onProgress: (count: number, size: number) => void,
  state: { totalSize: number; count: number; aborted: boolean }
): Promise<FileEntry[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') { const e = item.webkitGetAsEntry(); if (e) entries.push(e); }
  }
  return readEntriesOpt(entries, '', state, onProgress);
}

async function readEntriesOpt(
  entries: FileSystemEntry[],
  basePath: string,
  state: { totalSize: number; count: number; aborted: boolean },
  onProgress: (count: number, size: number) => void
): Promise<FileEntry[]> {
  const results: FileEntry[] = [];
  for (const entry of entries) {
    if (state.aborted) break;
    state.count++;
    
    // Periodically yield back to the browser's event loop to prevent freezing
    if (state.count % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
      state.totalSize += file.size;
      
      // Early size check: abort scanning if we exceed the 100 GB P2P limit
      if (state.totalSize > 100 * 1024 * 1024 * 1024) {
        state.aborted = true;
        break;
      }
      
      results.push({ file, relativePath: basePath ? `${basePath}/${entry.name}` : entry.name });
      onProgress(state.count, state.totalSize);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const subEntries = await new Promise<FileSystemEntry[]>((res, rej) => {
        const all: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries(b => {
            if (!b.length) res(all);
            else {
              all.push(...b);
              readBatch();
            }
          }, rej);
        };
        readBatch();
      });
      const sub = await readEntriesOpt(subEntries, basePath ? `${basePath}/${entry.name}` : entry.name, state, onProgress);
      results.push(...sub);
    }
  }
  return results;
}

const getZipSize = async (entries: FileEntry[]): Promise<number> => {
  const { predictLength } = await import('client-zip');
  const inputs = entries.map(e => ({
    name: e.relativePath,
    size: e.file.size
  }));
  return Number(predictLength(inputs));
};

const getTransferHistory = (): SavedTransfer[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('bishal_transfer_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveTransferToHistory = (t: SavedTransfer) => {
  if (typeof window === 'undefined') return;
  const history = getTransferHistory();
  const index = history.findIndex(item => item.transferId === t.transferId);
  if (index > -1) {
    history[index] = t;
  } else {
    history.unshift(t);
  }
  localStorage.setItem('bishal_transfer_history', JSON.stringify(history.slice(0, 10)));
};

const deleteTransferFromHistoryLocally = (transferId: string): SavedTransfer[] => {
  if (typeof window === 'undefined') return [];
  const updated = getTransferHistory().filter(item => item.transferId !== transferId);
  localStorage.setItem('bishal_transfer_history', JSON.stringify(updated));
  return updated;
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open('BishalTransferCacheDB', 1);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'transferId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const cacheFiles = async (transferId: string, files: FileEntry[]) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    const record = {
      transferId,
      files: files.map(f => ({
        file: f.file,
        relativePath: f.relativePath
      })),
      timestamp: Date.now()
    };
    await new Promise<void>((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to cache files in IndexedDB:', e);
  }
};

const getCachedFiles = async (transferId: string): Promise<FileEntry[] | null> => {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.warn('getCachedFiles timed out after 1.5s, falling back to manual re-activation');
      resolve(null);
    }, 1500);
  });

  const fetchPromise = (async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const record = await new Promise<any>((resolve, reject) => {
        const req = store.get(transferId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (record && record.files) {
        return record.files;
      }
      return null;
    } catch (e) {
      console.error('Failed to retrieve cached files:', e);
      return null;
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
};

const deleteCachedFiles = async (transferId: string) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(transferId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to delete cached files:', e);
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FileTransfer: React.FC = () => {
  const { navigate } = useNavigation();
  const [user] = useAuthState(auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const reactivateFileInputRef = useRef<HTMLInputElement>(null);

  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [zipProgress, setZipProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [history, setHistory] = useState<SavedTransfer[]>([]);
  const [reactivatingTransfer, setReactivatingTransfer] = useState<SavedTransfer | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [radarDevices, setRadarDevices] = useState<any[]>([]);
  const [incomingPairRequest, setIncomingPairRequest] = useState<any | null>(null);
  const [pairedDevice, setPairedDevice] = useState<any | null>(null);
  const [pairingStatus, setPairingStatus] = useState<string>('');
  const [receivedFileModal, setReceivedFileModal] = useState<any | null>(null);

  const myDeviceIdRef = useRef<string>('');
  const myDeviceNameRef = useRef<string>('');
  const myPlatformRef = useRef<string>('');

  useEffect(() => {
    setHistory(getTransferHistory());
  }, []);

  // Web P2P Radar Device Heartbeat, Discovery & Pairing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    myPlatformRef.current = isIOS ? 'ios_web' : isAndroid ? 'android_web' : 'desktop_web';
    myDeviceNameRef.current = isIOS ? 'iPhone (Safari Web)' : isAndroid ? 'Android (Chrome Web)' : 'Desktop Browser';
    myDeviceIdRef.current = 'web-' + Math.random().toString(36).substring(2, 9);

    const pollRadar = async () => {
      try {
        const resPost = await fetch('/api/v1/radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: myDeviceIdRef.current,
            name: myDeviceNameRef.current,
            platform: myPlatformRef.current,
            status: 'active'
          })
        });
        const dataPost = await resPost.json();
        if (dataPost.success) {
          if (dataPost.activeDevices) {
            setRadarDevices(dataPost.activeDevices.filter((d: any) => d.id !== myDeviceIdRef.current));
          }
          if (dataPost.incomingRequests && dataPost.incomingRequests.length > 0) {
            setIncomingPairRequest(dataPost.incomingRequests[0]);
          }
          if (dataPost.incomingFiles && dataPost.incomingFiles.length > 0) {
            const received = dataPost.incomingFiles[0];
            setReceivedFileModal(received);
            // Try auto click download
            try {
              const a = document.createElement('a');
              a.href = received.fileData;
              a.download = received.fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (e) {}
            setPairingStatus(`🎉 Directly received "${received.fileName}" from ${received.senderName}!`);
          }
        }
      } catch (e) {
        // Silently handle radar poll error
      }
    };

    pollRadar();
    const interval = setInterval(pollRadar, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleConnectToDevice = async (dev: any) => {
    setPairingStatus(`Sending connection request to ${dev.name}...`);
    try {
      const res = await fetch('/api/v1/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_request',
          id: myDeviceIdRef.current,
          name: myDeviceNameRef.current,
          targetId: dev.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setPairingStatus(`Waiting for ${dev.name} to accept...`);
        // Start polling for acceptance
        const checkInterval = setInterval(async () => {
          const resCheck = await fetch('/api/v1/radar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check_pair_status',
              id: myDeviceIdRef.current
            })
          });
          const dataCheck = await resCheck.json();
          if (dataCheck.success && dataCheck.sentRequests) {
            const req = dataCheck.sentRequests.find((r: any) => r.id === data.pairRequest.id);
            if (req) {
              if (req.status === 'accepted') {
                clearInterval(checkInterval);
                setPairedDevice(dev);
                setPairingStatus(`⚡ Connected & Paired to ${dev.name}! Choose file to send.`);
                fileInputRef.current?.click();
              } else if (req.status === 'rejected') {
                clearInterval(checkInterval);
                setPairingStatus(`${dev.name} declined connection request.`);
              }
            }
          }
        }, 1500);
      }
    } catch (e) {
      setPairingStatus('Failed to send connection request.');
    }
  };

  const handleRespondPairRequest = async (accept: boolean) => {
    if (!incomingPairRequest) return;
    const responseStatus = accept ? 'accepted' : 'rejected';
    try {
      await fetch('/api/v1/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_request',
          requestId: incomingPairRequest.id,
          responseStatus
        })
      });

      if (accept) {
        setPairedDevice({
          id: incomingPairRequest.fromId,
          name: incomingPairRequest.fromName
        });
        setPairingStatus(`⚡ Connected & Paired to ${incomingPairRequest.fromName}!`);
      }
      setIncomingPairRequest(null);
    } catch (e) {
      setIncomingPairRequest(null);
    }
  };

  useEffect(() => {
    const handleUnload = () => {
      const tId = activeTransferIdRef.current;
      if (tId) {
        const transferRef = doc(db, 'transfers', tId);
        updateDoc(transferRef, { senderStatus: 'offline' }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // WebRTC refs and speed tracking
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const unsubscribeRefs = useRef<Array<() => void>>([]);
  const activeTransferIdRef = useRef<string | null>(null);
  const [transferSpeed, setTransferSpeed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedText, setElapsedText] = useState<string>('00:00');
  const [connectionStateText, setConnectionStateText] = useState<string>('Waiting for receiver to connect...');

  useEffect(() => {
    if (result?.downloadPageUrl) {
      QRCode.toDataURL(
        result.downloadPageUrl,
        {
          width: 128,
          margin: 1.5,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeUrl(url);
          }
        }
      );
    } else {
      setQrCodeUrl('');
    }
  }, [result]);

  // Sync variables for native site themes - force absolute black OLED background
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

  const cleanupConnection = useCallback(() => {
    const tId = activeTransferIdRef.current;
    if (tId) {
      const transferRef = doc(db, 'transfers', tId);
      updateDoc(transferRef, { senderStatus: 'offline' }).catch(() => {});
    }

    if (ackTimeoutRef.current) {
      clearTimeout(ackTimeoutRef.current);
      ackTimeoutRef.current = null;
    }
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    setElapsedText('00:00');
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
    
    if (dcRef.current) {
      try { dcRef.current.close(); } catch (e) {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    setTransferSpeed('');
    setTimeRemaining('');
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  const totalSize = fileEntries.reduce((s, e) => s + e.file.size, 0);
  const MAX_SIZE = 100 * 1024 * 1024 * 1024; // 100 GB

  const setupP2PConnection = async (
    fileName: string,
    totalSz: number,
    entries: FileEntry[],
    needsZip: boolean,
    existingTransferId?: string
  ) => {
    setStage('connecting');
    setConnectionStateText('Initializing P2P connection...');
    cleanupConnection();

    try {
      const transferId = existingTransferId || (Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10));
      activeTransferIdRef.current = transferId;
      const downloadPageUrl = `${window.location.origin}/transfer/${transferId}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      });
      pcRef.current = pc;

      const dc = pc.createDataChannel('fileTransfer', { ordered: true });
      dc.binaryType = 'arraybuffer';
      dc.bufferedAmountLowThreshold = 65536; // 64 KB
      dcRef.current = dc;

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            const candidateRef = doc(collection(db, 'transfers', transferId, 'senderCandidates'));
            await setDoc(candidateRef, event.candidate.toJSON());
          } catch (e) {
            console.error('Error writing sender ICE candidate:', e);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection State:", pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStateText('Recipient connected! Starting P2P transfer...');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setError('Recipient disconnected. Make sure both browsers remain open.');
          setStage('error');
          cleanupConnection();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const transferRef = doc(db, 'transfers', transferId);
      await setDoc(transferRef, {
        transferId,
        fileName,
        fileSize: totalSz,
        createdAt: new Date().toISOString(),
        expiresAt,
        offer: { type: offer.type, sdp: offer.sdp },
        senderStatus: 'waiting',
        receiverStatus: 'waiting'
      });

      setConnectionStateText('Waiting for recipient to connect... Keep this page open.');

      const unsubTransfer = onSnapshot(transferRef, async (snapshot) => {
        const data = snapshot.data();
        if (data && data.answer && !pc.remoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await updateDoc(transferRef, { senderStatus: 'connecting' });
          } catch (e) {
            console.error('Error setting remote description:', e);
          }
        }
      });
      unsubscribeRefs.current.push(unsubTransfer);

      const receiverCandidatesCol = collection(db, 'transfers', transferId, 'receiverCandidates');
      const unsubCandidates = onSnapshot(receiverCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateData as RTCIceCandidateInit));
            } catch (e) {
              console.error('Error adding receiver ICE candidate:', e);
            }
          }
        });
      });
      unsubscribeRefs.current.push(unsubCandidates);

      dc.onopen = () => {
        setStage('transferring');
        setConnectionStateText('Transferring...');
        
        // Optimize WebRTC data channel buffer and chunk sizes for maximum P2P speed (up to 100+ Mbps)
        dc.bufferedAmountLowThreshold = 512 * 1024; // 512 KB threshold to trigger early bufferedamountlow
        let offset = 0;
        const CHUNK_SIZE = 262144; // Increase chunk size to 256 KB to minimize event loop overhead
        let lastTime = performance.now();
        let lastOffset = 0;

        let startTime = Date.now();
        elapsedIntervalRef.current = setInterval(() => {
          const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
          setElapsedText(formatElapsed(elapsedSecs));
        }, 1000);

        const finishTransfer = () => {
          if (ackTimeoutRef.current) {
            clearTimeout(ackTimeoutRef.current);
            ackTimeoutRef.current = null;
          }
          if (speedIntervalRef.current) {
            clearInterval(speedIntervalRef.current);
            speedIntervalRef.current = null;
          }
          setTransferSpeed('');
          setStage('done');
          setConnectionStateText('Transfer Complete!');
          updateDoc(transferRef, { senderStatus: 'done' }).catch(console.error);
        };

        const initiateFinishTransfer = () => {
          setConnectionStateText('Finishing transfer... writing to recipient\'s disk.');
          try {
            dc.send(JSON.stringify({ type: 'DONE' }));
          } catch (e) {
            finishTransfer();
            return;
          }
          // Set fallback timeout if receiver doesn't support/send ACK_DONE
          ackTimeoutRef.current = setTimeout(() => {
            console.warn('ACK_DONE timeout, finalizing transfer.');
            finishTransfer();
          }, 8000);
        };

        dc.onmessage = (eEvent) => {
          try {
            const msg = JSON.parse(eEvent.data);
            if (msg.type === 'ACK_DONE') {
              finishTransfer();
            }
          } catch (err) {
            // Ignore legacy or binary parsing errors
          }
        };

        speedIntervalRef.current = setInterval(() => {
          const now = performance.now();
          const bytesSent = offset;
          const elapsed = (now - lastTime) / 1000;
          if (elapsed > 0) {
            const speed = (bytesSent - lastOffset) / elapsed;
            setTransferSpeed(`${formatBytes(speed)}/s`);
            
            const remainingBytes = totalSz - bytesSent;
            if (speed > 0) {
              const secondsLeft = remainingBytes / speed;
              setTimeRemaining(formatTime(secondsLeft));
            } else {
              setTimeRemaining('estimating...');
            }
          }
          lastTime = now;
          lastOffset = bytesSent;
        }, 1000);

        if (needsZip) {
          // Streaming ZIP logic via Worker
          const workerCode = `
            self.importScripts('https://cdn.jsdelivr.net/npm/client-zip/worker.js');
            let reader = null;
            self.onmessage = async function(e) {
              const data = e.data;
              if (data.type === 'start') {
                try {
                  const files = data.files;
                  const zipInputs = files.map(f => ({
                    name: f.relativePath,
                    input: f.file,
                    size: f.file.size,
                    lastModified: new Date(f.file.lastModified || Date.now())
                  }));
                  const response = downloadZip(zipInputs);
                  reader = response.body.getReader();
                  self.postMessage({ type: 'ready' });
                } catch (err) {
                  self.postMessage({ type: 'error', error: err.message });
                }
              } else if (data.type === 'pull') {
                if (!reader) return;
                try {
                  const { done, value } = await reader.read();
                  if (done) {
                    self.postMessage({ type: 'done' });
                    reader = null;
                  } else {
                    const cleanBuffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
                    self.postMessage({ type: 'chunk', chunk: cleanBuffer }, [cleanBuffer]);
                  }
                } catch (err) {
                  self.postMessage({ type: 'error', error: err.message });
                  reader = null;
                }
              }
            };
          `;
          
          const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(workerBlob);
          const worker = new Worker(workerUrl);

          let isPulling = false;

          dc.bufferedAmountLowThreshold = 512 * 1024; // Configure threshold for worker streaming
          const pullNext = () => {
            if (isPulling) return;
            if (dc.bufferedAmount > 1024 * 1024) { // Keep 1 MB pipeline filled
              return;
            }
            isPulling = true;
            worker.postMessage({ type: 'pull' });
          };

          dc.onbufferedamountlow = () => {
            pullNext();
          };

          worker.onmessage = (eMsg) => {
            const { type, chunk, error: workerErr } = eMsg.data;
            if (type === 'ready') {
              pullNext();
            } else if (type === 'chunk') {
              isPulling = false;
              try {
                const totalLength = chunk.byteLength;
                let chunkOffset = 0;
                const SEND_CHUNK_SIZE = 262144; // 256 KB chunk slices for zipping
                
                while (chunkOffset < totalLength) {
                  const size = Math.min(SEND_CHUNK_SIZE, totalLength - chunkOffset);
                  const subChunk = chunk.slice(chunkOffset, chunkOffset + size);
                  dc.send(subChunk);
                  offset += size;
                  chunkOffset += size;
                }
                
                const pct = Math.round((offset / totalSz) * 100);
                setUploadProgress(pct);
                pullNext();
              } catch (err) {
                console.error('Error sending chunk:', err);
                setError('Data transmission failed.');
                setStage('error');
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
                cleanupConnection();
              }
            } else if (type === 'done') {
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              initiateFinishTransfer();
            } else if (type === 'error') {
              console.error('Worker error:', workerErr);
              setError(workerErr || 'Zipping failed.');
              setStage('error');
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              cleanupConnection();
            }
          };

          const filesToSend = entries.map(e => ({
            relativePath: e.relativePath,
            file: e.file
          }));
          worker.postMessage({ type: 'start', files: filesToSend });

        } else {
          // Single file transmission logic
          const file = entries[0].file;
          const sendNext = () => {
            while (offset < totalSz) {
              if (dc.bufferedAmount > 1024 * 1024) { // Allow up to 1 MB in socket queue
                return;
              }
              const slice = file.slice(offset, offset + CHUNK_SIZE);
              const reader = new FileReader();
              reader.onload = (eLoad) => {
                if (eLoad.target?.result instanceof ArrayBuffer) {
                  try {
                    dc.send(eLoad.target.result);
                    offset += eLoad.target.result.byteLength;
                    const pct = Math.round((offset / totalSz) * 100);
                    setUploadProgress(pct);
                    sendNext();
                  } catch (err) {
                    console.error('Error during send:', err);
                    setError('Data transmission failed.');
                    setStage('error');
                    cleanupConnection();
                  }
                }
              };
              reader.readAsArrayBuffer(slice);
              return;
            }

            if (offset >= totalSz) {
              initiateFinishTransfer();
            }
          };

          dc.onbufferedamountlow = () => {
            sendNext();
          };

          sendNext();
        }
      };

      setResult({
        transferId,
        downloadPageUrl,
        expiresAt,
        fileName,
        fileSize: totalSz,
        publicFileUrl: ''
      });

      const newTransfer: SavedTransfer = {
        transferId,
        fileName,
        fileSize: totalSz,
        createdAt: new Date().toISOString(),
        expiresAt,
        downloadPageUrl
      };
      saveTransferToHistory(newTransfer);
      setHistory(getTransferHistory());
      if (totalSz < 150 * 1024 * 1024) {
        cacheFiles(transferId, entries);
      }

    } catch (err: any) {
      setError(err.message || 'P2P setup failed. Please try again.');
      setStage('error');
    }
  };

  const processIncomingFiles = async (files: File[], isFolder = false, folderEntries?: FileEntry[]) => {
    setError('');
    setResult(null);
    setUploadProgress(0);
    setZipProgress(0);

    let entries: FileEntry[] = [];
    if (folderEntries) {
      entries = folderEntries;
    } else {
      entries = files.map(f => ({
        file: f,
        relativePath: (isFolder && f.webkitRelativePath) ? f.webkitRelativePath : f.name
      }));
    }

    if (!entries.length) return;

    if (pairedDevice) {
      for (const entry of entries) {
        setPairingStatus(`Transferring "${entry.relativePath}" directly to ${pairedDevice.name}...`);
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          await fetch('/api/v1/radar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_direct_file',
              id: myDeviceIdRef.current,
              name: myDeviceNameRef.current,
              targetId: pairedDevice.id,
              fileName: entry.relativePath,
              fileSize: entry.file.size,
              fileData: base64Data
            })
          });
          setPairingStatus(`🎉 Directly sent "${entry.relativePath}" to ${pairedDevice.name}!`);
        };
        reader.readAsDataURL(entry.file);
      }
      return;
    }

    setFileEntries(entries);
    const needsZip = entries.length > 1 || (entries.length === 1 && entries[0].relativePath.includes('/'));
    const fileName = needsZip ? `transfer-${new Date().toISOString().slice(0, 10)}.zip` : entries[0].file.name;

    let totalSz = 0;
    if (needsZip) {
      try {
        totalSz = await getZipSize(entries);
      } catch (err) {
        console.error('Failed to calculate ZIP size:', err);
        setError('Failed to calculate file size.');
        setStage('idle');
        return;
      }
    } else {
      totalSz = entries[0].file.size;
    }

    if (totalSz > MAX_SIZE) {
      setError(`Total size (${formatBytes(totalSz)}) exceeds the 100 GB P2P limit.`);
      setStage('idle');
      setFileEntries([]);
      return;
    }

    await setupP2PConnection(fileName, totalSz, entries, needsZip);
  };

  const addFilesAndStart = useCallback((incoming: File[], basePath = '') => {
    processIncomingFiles(incoming, false);
  }, []);

  const addFiles = addFilesAndStart;

  const removeEntry = (idx: number) => setFileEntries(prev => prev.filter((_, i) => i !== idx));
  const clearAll = () => {
    cleanupConnection();
    activeTransferIdRef.current = null;
    setReactivatingTransfer(null);
    setFileEntries([]);
    setStage('idle');
    setResult(null);
    setError('');
    setShowSharePanel(false);
    setUploadProgress(0);
    setZipProgress(0);
  };

  const handleReactivate = async (item: SavedTransfer) => {
    setError('');
    setReactivatingId(item.transferId);
    try {
      const cached = await getCachedFiles(item.transferId);
      if (cached && cached.length > 0) {
        setStage('connecting');
        setConnectionStateText('Restoring files from browser database cache...');
        
        const needsZip = cached.length > 1 || (cached.length === 1 && cached[0].relativePath.includes('/'));
        let totalSz = 0;
        if (needsZip) {
          try {
            totalSz = await getZipSize(cached);
          } catch (e) {
            totalSz = cached.reduce((s, c) => s + c.file.size, 0);
          }
        } else {
          totalSz = cached[0].file.size;
        }

        await setupP2PConnection(item.fileName, totalSz, cached, needsZip, item.transferId);
      } else {
        setReactivatingTransfer(item);
      }
    } catch (e) {
      console.error('Error in handleReactivate:', e);
      setReactivatingTransfer(item);
    } finally {
      setReactivatingId(null);
    }
  };

  const handleDeleteHistoryItem = (transferId: string) => {
    if (confirm('Delete this link from history? (Recipient will still see download page but cannot connect)')) {
      const updated = deleteTransferFromHistoryLocally(transferId);
      setHistory(updated);
      deleteCachedFiles(transferId);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    setStage('connecting');
    setConnectionStateText('Reading file structure...');
    try {
      let freshEntries: FileEntry[];
      if (e.dataTransfer.items) {
        const state = { totalSize: 0, count: 0, aborted: false };
        const items = e.dataTransfer.items;
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file') { const e = item.webkitGetAsEntry(); if (e) entries.push(e); }
        }
        
        freshEntries = await readEntriesOpt(entries, '', state, (count, size) => {
          setConnectionStateText(`Reading folder: ${count} files detected (${formatBytes(size)})`);
        });

        if (state.aborted) {
          setError(`Total size exceeds the 100 GB P2P limit.`);
          setStage('idle');
          setFileEntries([]);
          return;
        }
      } else {
        freshEntries = Array.from(e.dataTransfer.files).map(f => ({ file: f, relativePath: f.name }));
      }

      await processIncomingFiles(freshEntries.map(e => e.file), false, freshEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to read files.');
      setStage('error');
    }
  };

  const handleCreate = () => processIncomingFiles(fileEntries.map(e => e.file), false, fileEntries);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.downloadPageUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    if (!result || !emails.trim()) return;
    setEmailSending(true); setEmailError(''); setEmailSent(false);
    try {
      const res = await fetch('/api/file-transfer-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmails: emails, fileName: result.fileName, fileSize: result.fileSize, downloadPageUrl: result.downloadPageUrl, expiresAt: result.expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setEmailSent(true); setEmails('');
    } catch (err: any) { setEmailError(err.message || 'Email sending failed.'); }
    finally { setEmailSending(false); }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return 'estimating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatElapsed = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeFileName = result ? result.fileName : (fileEntries.length === 1 && !fileEntries[0].relativePath.includes('/') ? fileEntries[0].file.name : `transfer-${new Date().toISOString().slice(0, 10)}.zip`);
  const activeFileSize = result ? result.fileSize : totalSize;
  const expiryFormatted = result?.expiresAt ? new Date(result.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isUploading = stage === 'zipping' || stage === 'connecting' || stage === 'transferring';
  const showDashboard = ['zipping', 'connecting', 'transferring', 'done'].includes(stage) || (stage === 'error' && result !== null);

  return (
    <div 
      className="min-h-screen pt-20 pb-8 relative overflow-hidden transition-colors w-full flex flex-col items-center justify-between text-white font-sans limewire-bg"
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

        @keyframes ping-wave-effect {
          0% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            opacity: 0.45;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
        .animate-ping-wave {
          animation: ping-wave-effect 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }
      `}} />

      {/* Floating 3D Graphic Tiles - Only visible in Step 1 */}
      {stage === 'idle' && (
        <>
          {/* Left Side Icons */}
          <div className="absolute left-[4%] top-[12%] lg:left-[6%] lg:top-[16%] xl:left-[8%] xl:top-[20%] hidden md:block animate-float-1 select-none pointer-events-none z-10">
            <img src="/imgi_6_landing-tile-left-play-C4JzP4ox.svg" className="w-20 md:w-28 lg:w-36 xl:w-44 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
          </div>

          <div className="absolute left-[8%] top-[28%] lg:left-[10%] lg:top-[30%] xl:left-[12%] xl:top-[32%] hidden md:block animate-float-2 select-none pointer-events-none z-10">
            <img src="/imgi_7_landing-tile-left-below-play-CGFEidvo.svg" className="w-16 md:w-22 lg:w-28 xl:w-36 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
          </div>

          {/* Right Side Icons */}
          <div className="absolute right-[10%] top-[10%] lg:right-[12%] lg:top-[14%] xl:right-[14%] xl:top-[18%] hidden md:block animate-float-3 select-none pointer-events-none z-10">
            <img src="/imgi_11_landing-tile-right-above-tick-W8AhC-Qu.svg" className="w-16 md:w-22 lg:w-28 xl:w-36 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
          </div>

          <div className="absolute right-[4%] top-[28%] lg:right-[6%] lg:top-[30%] xl:right-[8%] xl:top-[32%] hidden md:block animate-float-1 select-none pointer-events-none z-10">
            <img src="/imgi_10_landing-tile-right-tick-DyOBp0tS.svg" className="w-20 md:w-28 lg:w-36 xl:w-44 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]" alt="" />
          </div>
        </>
      )}

      {/* Back nav & Brand */}
      <div className="w-full max-w-6xl px-6 flex justify-between items-center mb-3 z-20">
        <button 
          onClick={() => navigate('services')} 
          className="flex items-center gap-2 text-sm font-semibold transition-colors text-slate-400 hover:text-[#03df7a]"
        >
          <ArrowLeft size={16} /> Back to Tools
        </button>
        <div className="text-sm font-extrabold select-none text-white flex items-center gap-2 bg-[#03df7a]/10 border border-[#03df7a]/30 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(3,223,122,0.15)] transition-all hover:border-[#03df7a]/50">
          <Zap size={14} className="text-[#03df7a] animate-pulse" />
          <span className="tracking-wide">File Transfer</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-6xl px-6 z-20 flex-1 flex flex-col items-center justify-center">
        
        {!showDashboard ? (
          /* ──────────────── STEP 1: UPLOAD FILES (OLED Neon Dark Mode) ──────────────── */
          <div className="flex flex-col items-center justify-center flex-1 max-w-xl mx-auto w-full py-6">
            
            {/* Hero Heading */}
            <div className="text-center mb-6 max-w-2xl px-4">
              <h1 className="text-2xl sm:text-4xl md:text-[40px] font-extrabold font-outfit mb-2 leading-tight tracking-tight">
                <span className="text-[#03df7a]">Upload, edit and share</span> <br />
                <span className="text-white">files of any size</span>
              </h1>
              <p className="text-xs text-slate-400 max-w-xl mx-auto leading-normal">
                Our end-to-end encrypted, AI-powered file sharing platform allows you to upload, manipulate &amp; share files of any size, on any device.
              </p>
            </div>

            {/* Upload Area, File Queue and Alerts */}
            <div className="flex flex-col items-center justify-center w-full space-y-4">
                {reactivatingTransfer ? (
                  /* Re-activation Drop Zone */
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={async (e) => {
                      e.preventDefault(); setIsDragging(false);
                      setStage('connecting');
                      setConnectionStateText('Reading file structure...');
                      try {
                        let freshEntries: FileEntry[];
                        if (e.dataTransfer.items) {
                          const state = { totalSize: 0, count: 0, aborted: false };
                          const items = e.dataTransfer.items;
                          const entries: FileSystemEntry[] = [];
                          for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item.kind === 'file') { const e = item.webkitGetAsEntry(); if (e) entries.push(e); }
                          }
                          
                          freshEntries = await readEntriesOpt(entries, '', state, (count, size) => {
                            setConnectionStateText(`Reading folder: ${count} files detected (${formatBytes(size)})`);
                          });

                          if (state.aborted) {
                            setError(`Total size exceeds the 100 GB P2P limit.`);
                            setStage('idle');
                            return;
                          }
                        } else {
                          freshEntries = Array.from(e.dataTransfer.files).map(f => ({ file: f, relativePath: f.name }));
                        }

                        const needsZip = freshEntries.length > 1 || (freshEntries.length === 1 && freshEntries[0].relativePath.includes('/'));
                        let totalSz = 0;
                        if (needsZip) {
                          totalSz = await getZipSize(freshEntries);
                        } else {
                          totalSz = freshEntries[0].file.size;
                        }

                        await setupP2PConnection(reactivatingTransfer.fileName, totalSz, freshEntries, needsZip, reactivatingTransfer.transferId);
                        setReactivatingTransfer(null);
                      } catch (err: any) {
                        setError(err.message || 'Failed to read files.');
                        setStage('error');
                      }
                    }}
                    onClick={() => !isUploading && reactivateFileInputRef.current?.click()}
                    className="relative w-[230px] h-[230px] sm:w-[270px] sm:h-[270px] rounded-full flex flex-col items-center justify-center text-center p-5 transition-all duration-500 select-none mx-auto cursor-pointer border-2"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderStyle: isDragging ? 'dashed' : 'solid',
                      borderColor: '#f59e0b',
                      boxShadow: isDragging 
                        ? '0 0 0 8px rgba(245, 158, 11, 0.25), 0 0 45px rgba(245, 158, 11, 0.5), inset 0 0 15px rgba(245, 158, 11, 0.1)' 
                        : '0 0 0 5px rgba(245, 158, 11, 0.15), 0 0 30px rgba(245, 158, 11, 0.25), inset 0 0 10px rgba(245, 158, 11, 0.05)'
                    }}
                  >
                    {/* Staggered Wave Ripple Effect */}
                    {!isUploading && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-[#f59e0b] pointer-events-none animate-ping-wave" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#f59e0b] pointer-events-none animate-ping-wave" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#f59e0b] pointer-events-none animate-ping-wave" style={{ animationDelay: '2s' }}></div>
                      </>
                    )}

                    <input 
                      ref={reactivateFileInputRef} 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onClick={e => e.stopPropagation()}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        setStage('connecting');
                        setConnectionStateText('Preparing files...');
                        try {
                          const entries = files.map(f => ({ file: f, relativePath: f.name }));
                          const needsZip = entries.length > 1 || (entries.length === 1 && entries[0].relativePath.includes('/'));
                          let totalSz = 0;
                          if (needsZip) {
                            totalSz = await getZipSize(entries);
                          } else {
                            totalSz = entries[0].file.size;
                          }
                          await setupP2PConnection(reactivatingTransfer.fileName, totalSz, entries, needsZip, reactivatingTransfer.transferId);
                          setReactivatingTransfer(null);
                        } catch (err: any) {
                          setError(err.message || 'Failed to read files.');
                          setStage('error');
                        }
                      }} 
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-[0_4px_15px_rgba(245,158,11,0.3)] mb-3 transition-transform duration-300 hover:scale-110 relative z-10">
                      <CloudUpload size={22} className="text-white" />
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold leading-tight max-w-[170px] mb-1 text-white relative z-10">
                      Re-select files for:
                    </h3>
                    <p className="text-[11px] font-bold text-amber-400 truncate max-w-[160px] relative z-10 px-2" title={reactivatingTransfer.fileName}>
                      {reactivatingTransfer.fileName}
                    </p>
                    <span className="text-[10px] mt-2 font-extrabold text-amber-300 animate-pulse text-center max-w-[190px] relative z-10">
                      Drop files here to start hosting!
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReactivatingTransfer(null);
                      }}
                      className="absolute bottom-3 text-[10px] font-bold text-slate-500 hover:text-rose-400 underline z-20"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Circular Drag and Drop Area */
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="relative w-[230px] h-[230px] sm:w-[270px] sm:h-[270px] rounded-full flex flex-col items-center justify-center text-center p-5 transition-all duration-500 select-none mx-auto cursor-pointer"
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: isDragging ? '4px dashed #03df7a' : '2.5px solid #03df7a',
                      boxShadow: isDragging 
                        ? '0 0 0 8px rgba(3, 223, 122, 0.25), 0 0 45px rgba(3, 223, 122, 0.5), inset 0 0 15px rgba(3, 223, 122, 0.1)' 
                        : '0 0 0 5px rgba(3, 223, 122, 0.15), 0 0 30px rgba(3, 223, 122, 0.25), inset 0 0 10px rgba(3, 223, 122, 0.05)'
                    }}
                  >
                    {/* Staggered Wave Ripple Effect */}
                    {!isUploading && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-[#03df7a] pointer-events-none animate-ping-wave" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#03df7a] pointer-events-none animate-ping-wave" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-[#03df7a] pointer-events-none animate-ping-wave" style={{ animationDelay: '2s' }}></div>
                      </>
                    )}

                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onClick={e => e.stopPropagation()}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;

                        if (pairedDevice) {
                          // NEARBY METHOD (SHAREit / AIRDROP STYLE): DIRECT INSTANT STREAM! NO LINK / NO QR CODE!
                          const file = files[0];
                          setPairingStatus(`Transferring "${file.name}" directly to ${pairedDevice.name}...`);
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const base64Data = reader.result as string;
                            await fetch('/api/v1/radar', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'send_direct_file',
                                id: myDeviceIdRef.current,
                                name: myDeviceNameRef.current,
                                targetId: pairedDevice.id,
                                fileName: file.name,
                                fileSize: file.size,
                                fileData: base64Data
                              })
                            });
                            setPairingStatus(`🎉 Direct file transfer sent to ${pairedDevice.name}!`);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          // FAR METHOD: CREATE P2P LINK & QR CODE
                          await processIncomingFiles(files, false);
                        }
                      }} 
                    />
                    <input
                      id="folder-upload-input"
                      ref={folderInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onClick={e => e.stopPropagation()}
                      {...({ webkitdirectory: "", directory: "" } as any)}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        await processIncomingFiles(files, true);
                      }}
                    />

                    {/* Inner Cloud Circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00b874] to-[#03df7a] flex items-center justify-center shadow-[0_4px_15px_rgba(0,184,116,0.3)] mb-3 transition-transform duration-300 hover:scale-110 relative z-10">
                      <CloudUpload size={22} className="text-white" />
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold leading-tight max-w-[170px] mb-0.5 text-white relative z-10">
                      Click or drag-and-drop your files here
                    </h3>
                    <label
                      htmlFor="folder-upload-input"
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] sm:text-xs font-bold underline cursor-pointer transition-colors text-[#03df7a] hover:text-[#00ff87] relative z-10"
                    >
                      Or select a folder
                    </label>
                    <span className="text-[9px] sm:text-[10px] mt-2.5 font-semibold text-slate-400 relative z-10">
                      Up to 100GB direct P2P
                    </span>
                  </div>
                )}

                {/* Selected Files Queue and Actions */}
                {fileEntries.length > 0 && (
                  <div className="w-full max-w-md mt-4 rounded-[24px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 shadow-2xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {fileEntries.length} file{fileEntries.length !== 1 ? 's' : ''} · {formatBytes(totalSize)}
                      </span>
                      <button onClick={clearAll} className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors">
                        Clear all
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {fileEntries.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 group">
                          <span className="text-lg flex-shrink-0">{getFileIcon(entry.file.name)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{entry.relativePath}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{formatBytes(entry.file.size)}</p>
                          </div>
                          <button onClick={() => removeEntry(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {totalSize > MAX_SIZE && (
                      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                        <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-350 font-medium">Total size exceeds 100 GB P2P limit. Please remove some files to continue.</p>
                      </div>
                    )}
                    {/* Size constraints warning removed for unlimited streaming zip */}

                    {/* Progress Indicators */}
                    {isUploading && (
                      <div className="space-y-3 pt-2">
                        {stage === 'zipping' && (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5 text-slate-400">
                              <span className="flex items-center gap-1.5"><FileArchive size={12} className="text-[#03df7a]" />Compressing files…</span>
                              <span className="font-bold text-[#03df7a]">{zipProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#00d084] to-[#03df7a] transition-all duration-75" style={{ width: `${zipProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {stage === 'connecting' && (
                          <div className="flex items-center gap-2 text-xs text-amber-500 py-1 font-bold">
                            <Loader2 size={12} className="animate-spin" /> Preparing secure P2P link...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action CTA Button */}
                    <div className="pt-2">
                      <button 
                        onClick={handleCreate} 
                        disabled={!fileEntries.length || isUploading || totalSize > MAX_SIZE}
                        className="w-full py-4 rounded-full font-extrabold text-sm tracking-wider uppercase text-black bg-[#03df7a] hover:bg-[#00ff87] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98] shadow-[0_4px_25px_rgba(3,223,122,0.25)] flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <><Loader2 size={16} className="animate-spin" />{stage === 'zipping' ? 'Zipping assets…' : 'Preparing P2P…'}</>
                        ) : (
                          <><Zap size={16} />Create P2P Link</>
                        )}
                      </button>
                      <p className="text-center text-[10px] text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                        <Lock size={11} className="text-[#03df7a]" /> Direct direct connection &amp; no cloud storage limit
                      </p>
                    </div>
                  </div>
                )}

                {/* Error alerts */}
                {(stage === 'error' || error) && (
                  <div className="w-full max-w-lg mt-2 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-355 font-semibold text-rose-350">{error}</p>
                  </div>
                )}
            </div>

            {/* Live Active Devices Radar Bar */}
            <div className="w-full max-w-xl mt-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md text-left shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#03df7a] animate-ping" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">Nearby Active P2P Devices ({radarDevices.length})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Auto-Connecting Web &amp; Android</span>
              </div>

              {pairingStatus && (
                <div className="mb-3 p-2.5 bg-[#03df7a]/10 border border-[#03df7a]/40 rounded-xl text-xs font-bold text-[#03df7a] flex items-center justify-between">
                  <span>{pairingStatus}</span>
                  {pairedDevice && (
                    <button onClick={() => { setPairedDevice(null); setPairingStatus(''); }} className="text-[10px] text-slate-400 underline hover:text-white">
                      Disconnect
                    </button>
                  )}
                </div>
              )}

              {radarDevices.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-3">
                  📡 Scanning for active Android apps, iPhones &amp; Web browsers...
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {radarDevices.map((dev: any) => (
                    <div key={dev.id} className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-[#03df7a]/60 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-base">
                          {dev.platform === 'android_app' ? '📱' : dev.platform === 'ios_web' ? '🍎' : '💻'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{dev.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {dev.platform === 'android_app' ? 'Android Native App' : dev.platform === 'ios_web' ? 'iPhone (Safari)' : 'Web Browser'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnectToDevice(dev)}
                        className="px-3.5 py-1.5 bg-[#03df7a] hover:bg-[#02be68] text-black font-extrabold text-xs rounded-lg transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                      >
                        <Zap size={12} /> Connect &amp; Send File
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Connection Request Modal (SHAREit Style) */}
            {incomingPairRequest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border-2 border-[#03df7a] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(3,223,122,0.3)] text-center animate-in fade-in zoom-in duration-200">
                  <div className="w-14 h-14 rounded-full bg-[#03df7a]/20 border border-[#03df7a] flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Zap size={28} className="text-[#03df7a]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-1">Incoming Connection Request</h3>
                  <p className="text-xs text-slate-350 mb-6">
                    <strong className="text-[#03df7a]">{incomingPairRequest.fromName}</strong> wants to connect and send files directly via P2P.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRespondPairRequest(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespondPairRequest(true)}
                      className="flex-1 py-2.5 rounded-xl bg-[#03df7a] hover:bg-[#02be68] text-black font-extrabold text-xs shadow-lg transition-all active:scale-95"
                    >
                      Accept &amp; Connect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Received File Download Modal (For iOS / Safari / Desktop) */}
            {receivedFileModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border-2 border-[#03df7a] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(3,223,122,0.4)] text-center animate-in fade-in zoom-in duration-200">
                  <div className="w-14 h-14 rounded-full bg-[#03df7a]/20 border border-[#03df7a] flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Download size={28} className="text-[#03df7a]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-1">File Received! 🎉</h3>
                  <p className="text-xs text-slate-350 mb-2">
                    Received <strong className="text-white">{receivedFileModal.fileName}</strong> from <strong className="text-[#03df7a]">{receivedFileModal.senderName}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 mb-6">
                    Tap the button below to save the file to your device.
                  </p>
                  <a
                    href={receivedFileModal.fileData}
                    download={receivedFileModal.fileName}
                    onClick={() => setReceivedFileModal(null)}
                    className="block w-full py-3 rounded-xl bg-[#03df7a] hover:bg-[#02be68] text-black font-extrabold text-xs shadow-lg transition-all active:scale-95 text-center"
                  >
                    📥 Save File to Device
                  </a>
                </div>
              </div>
            )}

            {/* Steps to Use Hover Trigger Popup */}
            <div className="relative group mt-6 z-30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#03df7a] hover:text-[#00ff87] transition-colors cursor-pointer px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 shadow-md">
                <AlertCircle size={14} className="text-[#03df7a]" />
                <span>Steps to use</span>
              </div>
              
              {/* Tooltip Content */}
              <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 w-[280px] sm:w-[360px] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 text-left scale-95 group-hover:scale-100 origin-bottom">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#03df7a] mb-2">How to Use: Direct P2P Transfer</h4>
                <ol className="text-[11px] text-slate-350 space-y-2 list-decimal list-inside leading-relaxed font-semibold">
                  <li>
                    <span className="text-white">Select Files</span>: Click the zone above to drag &amp; drop or browse files/folders (up to 100GB total size).
                  </li>
                  <li>
                    <span className="text-white">Generate Link</span>: Click <strong className="text-[#03df7a]">"Create P2P Link"</strong> to configure the direct channel.
                  </li>
                  <li>
                    <span className="text-white">Share link/QR</span>: Copy the link or show the QR code to the receiver.
                  </li>
                  <li>
                    <span className="text-white">Keep Tab Open</span>: <strong className="text-amber-400">Crucial!</strong> Keep this browser tab open while the receiver downloads the file. Closing it will abort the transfer.
                  </li>
                </ol>
                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[6px] border-transparent border-t-slate-950 w-0 h-0" />
                <div className="absolute top-[100%] left-1/2 transform -translate-x-1/2 border-[7px] border-transparent border-t-slate-800 w-0 h-0 -z-10" />
              </div>
            </div>

            {/* Stats Capsule */}
            <div className="w-full max-w-2xl mt-8 px-4">
              <div className="flex flex-row flex-nowrap items-center justify-between gap-1 sm:gap-2 py-2.5 px-3 sm:px-6 rounded-full border border-slate-800 bg-slate-900/40 backdrop-blur-md text-white">
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg bg-[#03df7a]/10 flex items-center justify-center flex-shrink-0">
                    <Zap size={10} className="text-[#03df7a] sm:size-[16px] flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-sm font-bold text-white leading-none whitespace-nowrap">131M</p>
                    <p className="text-[7px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 whitespace-nowrap">Files Shared</p>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-800 flex-shrink-0" />
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg bg-[#03df7a]/10 flex items-center justify-center flex-shrink-0">
                    <CloudUpload size={10} className="text-[#03df7a] sm:size-[16px] flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-sm font-bold text-white leading-none whitespace-nowrap">7.6PB</p>
                    <p className="text-[7px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 whitespace-nowrap">Uploaded</p>
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-800 flex-shrink-0" />
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                  <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg bg-[#03df7a]/10 flex items-center justify-center flex-shrink-0">
                    <Zap size={10} className="text-[#03df7a] sm:size-[16px] flex-shrink-0 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-sm font-bold text-[#03df7a] leading-none whitespace-nowrap">Litespeed</p>
                    <p className="text-[7px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 whitespace-nowrap">Superfast P2P</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transfers List */}
            {history.length > 0 && !reactivatingTransfer && (
              <div className="w-full max-w-xl mt-8 rounded-[24px] bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 shadow-2xl space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    My Recent Links (Last 10)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Stored in browser</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {history.map((item, idx) => {
                    const isCurrent = result && result.transferId === item.transferId && stage !== 'idle';
                    return (
                      <div key={item.transferId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl flex-shrink-0">{getFileIcon(item.fileName)}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate max-w-[200px]" title={item.fileName}>
                              {item.fileName}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatBytes(item.fileSize)} · {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isCurrent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            {isCurrent ? 'Active' : 'Offline'}
                          </span>

                          {/* Copy Link Button */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.downloadPageUrl);
                              alert('Link copied to clipboard!');
                            }}
                            title="Copy download page link"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Re-activate Button */}
                          {!isCurrent && (
                            <button
                              disabled={reactivatingId !== null}
                              onClick={() => handleReactivate(item)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase bg-amber-500 hover:bg-amber-400 text-black shadow-sm transition-all disabled:opacity-50 min-w-[80px]"
                            >
                              {reactivatingId === item.transferId ? 'Checking...' : 'Re-activate'}
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteHistoryItem(item.transferId)}
                            title="Remove from history"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ──────────────── STEP 2: DASHBOARD (Success/Manage State) ──────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-4 w-full">
            
            {/* Left/Main Column - Upload bar, alerts, activity */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Smaller Horizontal Upload Zone */}
              <div 
                onClick={clearAll}
                className="w-full border-2 border-dashed border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left cursor-pointer hover:border-[#03df7a] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#03df7a]/15 text-[#03df7a] flex items-center justify-center flex-shrink-0">
                    <CloudUpload size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Direct browser-to-browser P2P mode</p>
                    <p className="text-[10px] text-[#03df7a]">Send another file</p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Up to 100GB direct · <span className="text-[#03df7a] font-bold">P2P Speed</span>
                </div>
              </div>

              {/* Warning Alert Banner */}
              {!user && (
                <div className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-500 flex-shrink-0" />
                    <p className="leading-relaxed">
                      As an anonymous user, your files automatically expire after 7 days. To remove all limits now, simply create a free account.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('login')}
                    className="bg-[#03df7a] hover:bg-[#00ff87] text-black font-bold px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex-shrink-0 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Activity Section */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  My Activity
                </h3>

                {/* Activity Card */}
                <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-5 shadow-sm space-y-4 text-left">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today</p>
                      <h4 className="text-sm font-extrabold text-white mt-0.5 truncate max-w-sm sm:max-w-md" title={activeFileName}>
                        {activeFileName}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={10} className="text-[#03df7a]" /> Expires in 7 days · {expiryFormatted}
                      </p>
                    </div>
                    <button 
                      disabled={!result}
                      onClick={() => setShowSharePanel(!showSharePanel)}
                      className="bg-[#03df7a] hover:bg-[#00ff87] text-black font-extrabold text-xs py-1.5 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Globe size={12} /> {showSharePanel ? 'Hide Options' : 'Share'}
                    </button>
                  </div>

                  {/* Card Body - Folder preview thumbnail */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800/60">
                    <div className="w-10 h-10 rounded-lg bg-[#03df7a]/10 text-[#03df7a] flex items-center justify-center flex-shrink-0">
                      {activeFileName.endsWith('.zip') ? (
                        <FileArchive size={20} />
                      ) : (
                        <File size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeFileName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(activeFileSize)}</p>
                    </div>
                  </div>

                  {/* P2P Live Progress & Status */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        {['zipping', 'connecting', 'transferring'].includes(stage) && <Loader2 size={12} className="animate-spin text-amber-500" />}
                        {stage === 'done' && <Check size={12} className="text-[#03df7a]" />}
                        Status: <span className={
                          ['zipping', 'connecting'].includes(stage) ? 'text-amber-500' :
                          stage === 'transferring' ? 'text-[#03df7a]' : 'text-slate-350'
                        }>
                          {stage === 'zipping' && `Zipping assets...`}
                          {stage === 'connecting' && connectionStateText}
                          {stage === 'transferring' && `Transferring...`}
                          {stage === 'done' && `Transfer Complete!`}
                        </span>
                      </span>
                      {stage === 'transferring' && transferSpeed && (
                        <span className="text-[#03df7a] font-mono">{transferSpeed}</span>
                      )}
                    </div>

                    {(stage === 'zipping' || stage === 'transferring' || stage === 'done') && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <span>{stage === 'zipping' ? 'Compression' : 'Transmission'} Progress</span>
                          <span className="text-[#03df7a]">{stage === 'zipping' ? zipProgress : uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-[#00d084] to-[#03df7a] transition-all duration-75" 
                            style={{ width: `${stage === 'zipping' ? zipProgress : uploadProgress}%` }} 
                          />
                        </div>

                        {/* Live Speed and Time Stats during Transfer */}
                        {stage === 'transferring' && (
                          <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-950/40">
                            <div className="flex justify-between items-center">
                              <span>Elapsed Time:</span>
                              <span className="text-slate-300 font-mono">{elapsedText}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Time Remaining:</span>
                              <span className="text-slate-300 font-mono">{timeRemaining || 'estimating...'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Transfer Speed:</span>
                              <span className="text-[#03df7a] font-mono">{transferSpeed || 'estimating...'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {['zipping', 'connecting'].includes(stage) && (
                      <p className="text-[10px] text-amber-500/80 font-medium italic">
                        {stage === 'zipping' && "Compressing selected files in browser. Please don't close this window."}
                        {stage === 'connecting' && "Keep this browser tab open. The recipient needs to connect to this device to stream the files."}
                      </p>
                    )}
                  </div>

                  {/* Share and Email Panel */}
                  {(showSharePanel || true) && (
                    <div className="pt-2 space-y-4 animate-fade-in border-t border-slate-800/60 mt-2">
                      {/* Copy Link field */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Download Link</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
                            <Link2 size={12} className="text-slate-500 flex-shrink-0" />
                            {result ? (
                              <span className="text-xs text-slate-200 truncate font-mono select-all w-full">{result.downloadPageUrl}</span>
                            ) : (
                              <span className="text-xs text-slate-550 italic truncate w-full flex items-center gap-1.5"><Loader2 size={11} className="animate-spin text-amber-500" /> Generating P2P Link...</span>
                            )}
                          </div>
                          <button 
                            onClick={handleCopy}
                            disabled={!result}
                            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: copied ? 'rgba(3,223,122,0.1)' : '#03df7a',
                              color: copied ? '#03df7a' : '#000000',
                            }}
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Email Form */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Send Link to Emails</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800">
                            <Mail size={12} className="text-slate-500 flex-shrink-0" />
                            <input 
                              type="text" 
                              disabled={!result}
                              placeholder={result ? "friend@email.com, another@email.com" : "Waiting for link..."}
                              value={emails} 
                              onChange={e => setEmails(e.target.value)}
                              className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none w-full border-none focus:ring-0 p-0 disabled:opacity-50" 
                            />
                          </div>
                          <button 
                            onClick={handleSendEmail} 
                            disabled={!emails.trim() || emailSending || !result}
                            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors"
                          >
                            {emailSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Send
                          </button>
                        </div>
                        {emailSent && <p className="text-[10px] text-[#03df7a] font-bold flex items-center gap-1 mt-1"><Check size={10} />Link sent successfully!</p>}
                        {emailError && <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1"><AlertCircle size={10} />{emailError}</p>}
                      </div>
                    </div>
                  )}

                  {/* Card Footer actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      P2P Mode Active
                    </div>
                    <button 
                      onClick={clearAll}
                      className="bg-[#03df7a] hover:bg-[#00ff87] text-black font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                    >
                      Send Another File
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Column - Sidebar cards */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Scan to Download Card */}
              <div className="hidden sm:block border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4 shadow-sm text-center space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Scan to Download</h4>
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="p-2 bg-white rounded-lg inline-block">
                      <img src={qrCodeUrl} alt="Download QR Code" className="w-28 h-28 select-none" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-lg border border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-600 gap-1.5">
                      <Loader2 size={16} className="animate-spin text-amber-500" />
                      <span className="text-[9px] uppercase tracking-wider font-bold">Generating...</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-semibold">
                  Scan this QR code with your phone camera to download the file directly to your mobile device.
                </p>
              </div>

              {/* Credit Balance Card */}
              <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4 shadow-sm text-left space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Credit Balance</h4>
                <p className="text-sm font-extrabold text-white">0 credits remaining</p>
                <a href="#/" onClick={e => e.preventDefault()} className="text-xs text-[#03df7a] hover:underline font-bold block">
                  Buy more Credits
                </a>
              </div>

              {/* Subscription Card */}
              <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4 shadow-sm text-left space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#03df7a]">My Subscription</h4>
                <p className="text-sm font-extrabold text-white">Free Plan</p>
                <a href="#/" onClick={e => { e.preventDefault(); navigate('login'); }} className="text-xs text-[#03df7a] hover:underline font-bold block">
                  Upgrade Account
                </a>
              </div>

              {/* Discover More Card */}
              <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4 shadow-sm text-left space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Discover More Tools</h4>
                <div className="space-y-1.5 flex flex-col">
                  {[
                    { name: 'Image Compressor', id: 'image-compressor' },
                    { name: 'Language Translator', id: 'translator' },
                    { name: 'EMI Calculator', id: 'emi-calculator' },
                    { name: 'QR Code Studio', id: 'qr-studio' },
                    { name: 'JSON Formatter', id: 'json-formatter' },
                  ].map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate('services', link.id)}
                      className="text-xs text-left font-semibold text-slate-400 hover:text-[#03df7a] py-1 border-b border-slate-800/40 last:border-0"
                    >
                      {link.name} &gt;
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Peer-to-Peer File Transfer SEO Guide & FAQ Section */}
      <div className="w-full max-w-6xl px-6 py-16 border-t border-slate-900 mt-16 space-y-12 text-left z-20 text-slate-400">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading">
            P2P File Transfer Guide &amp; WebRTC Technology
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            Discover how zero-knowledge direct browser sharing works, why peer-to-peer WebRTC file transfers are highly secure, and how you can share files up to 100 GB.
          </p>
        </div>

        {/* Guide Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-sm leading-relaxed">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <span>🚀</span> How WebRTC P2P Sharing Works
            </h3>
            <p>
              Traditional file sharing sites require you to first upload a file to their central cloud servers, wait for the upload to complete, and then send a link to the receiver. The receiver then has to download the file from that cloud storage.
            </p>
            <p>
              <strong>Bishal Transfer</strong> uses <strong>WebRTC (Web Real-Time Communication)</strong> technology to establish a direct, peer-to-peer data tunnel between your browser and the recipient's browser. Files are compressed client-side and stream directly from your device to theirs.
            </p>
            <p>
              Because it bypasses the cloud entirely, there is no waiting time for uploads, and the speed is only limited by the physical bandwidth of the two connections.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <span>🔒</span> Zero-Knowledge &amp; Absolute Privacy
            </h3>
            <p>
              When you send sensitive documents, designs, or personal data, the last thing you want is for a copy to reside on a third-party server.
            </p>
            <p>
              Our WebRTC data channels are encrypted end-to-end using standard <strong>DTLS</strong> (Datagram Transport Layer Security) and <strong>SRTP</strong> (Secure Real-time Transport Protocol). The signaling server only handles the initial discovery handshake and is completely blind to your file data.
            </p>
            <p>
              Once connected, the transfer is direct, private, and leaves no digital footprint on the internet.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-t border-slate-900 pt-12 max-w-4xl mx-auto space-y-6">
          <h3 className="text-2xl font-bold text-center text-white font-heading">
            Frequently Asked Questions (FAQ)
          </h3>
          
          <div className="space-y-4">
            {[
              {
                q: "Do I need to keep the sender browser tab open during transfer?",
                a: "Yes. Since WebRTC relies on a direct peer-to-peer link between the two browsers, you must keep the sender tab open and active until the receiver finishes downloading the files."
              },
              {
                q: "What is the maximum file size limit?",
                a: "You can send single files or entire folders up to 100 GB. For folders, the files are zipped dynamically in your browser using local client-side workers before transmission."
              },
              {
                q: "Are my files stored on your server?",
                a: "No, files are never stored on any server. The data streams directly from the sender's hard drive to the receiver's memory/cache, ensuring total file privacy."
              },
              {
                q: "What ports or setup are required for WebRTC?",
                a: "No downloads, extensions, or registration are needed. WebRTC runs natively in all modern web browsers (Chrome, Safari, Firefox, Edge) and works behind NAT firewalls using STUN/TURN servers."
              }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 transition-colors">
                <button
                  onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 font-semibold text-white text-sm sm:text-base hover:bg-slate-900/60 text-left transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#03df7a] font-bold ml-4">
                    {openFaqIdx === i ? '−' : '+'}
                  </span>
                </button>
                {openFaqIdx === i && (
                  <div className="p-4 bg-slate-950/40 border-t border-slate-900 text-slate-400 text-sm leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTransfer;
