'use client';
import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Unlock, Eye, EyeOff, Download, AlertCircle,
  Loader2, ShieldCheck, Clock, FileText, FileImage, Film, Music,
  Archive, File, ArrowLeft, Key, CheckCircle2, XCircle, Zap, Globe
} from 'lucide-react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '../context/NavigationContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VaultRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  encryptedData?: string;
  storagePath?: string;
  iv: string;
  salt: string;
  passwordHint?: string;
  expiresAt: number;
  createdAt: number;
  downloads: number;
  maxDownloads?: number;
}

type ViewStage = 'loading' | 'not-found' | 'expired' | 'limit-reached' | 'gate' | 'downloading' | 'decrypting' | 'wrong-password' | 'preview' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h remaining`;
  if (h > 0) return `${h}h ${m % 60}m remaining`;
  if (m > 0) return `${m}m ${s % 60}s remaining`;
  return `${s}s remaining`;
};

const getFileIconInfo = (type: string, name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (type.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext))
    return { icon: FileImage, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Image' };
  if (type.startsWith('video/') || ['mp4','mkv','mov','avi','webm'].includes(ext))
    return { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Video' };
  if (type.startsWith('audio/') || ['mp3','wav','flac','aac','ogg'].includes(ext))
    return { icon: Music, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Audio' };
  if (type === 'application/pdf' || ext === 'pdf')
    return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', label: 'PDF' };
  if (['zip','rar','7z','tar','gz'].includes(ext))
    return { icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Archive' };
  return { icon: File, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'File' };
};

// ─── Web Crypto Decrypt ────────────────────────────────────────────────────────
const PBKDF2_ITERATIONS = 310_000;

const fromBase64 = (str: string): Uint8Array => {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

async function decryptRecord(
  record: VaultRecord,
  password: string,
  encryptedBytes: Uint8Array
): Promise<Blob> {
  const salt = fromBase64(record.salt);
  const iv = fromBase64(record.iv);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encryptedBytes as any
  );
  return new Blob([decrypted], { type: record.fileType || 'application/octet-stream' });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface SecureVaultViewProps {
  vaultId: string | null;
}

const SecureVaultView: React.FC<SecureVaultViewProps> = ({ vaultId }) => {
  const { navigate } = useNavigation();

  const [record, setRecord] = useState<VaultRecord | null>(null);
  const [stage, setStage] = useState<ViewStage>('loading');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState(0);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isText, setIsText] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [shakeInput, setShakeInput] = useState(false);

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
      }
    };
  }, []);

  // Load vault record from Firestore
  useEffect(() => {
    if (!vaultId) { setStage('not-found'); return; }

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'secure_vault', vaultId));
        if (!snap.exists()) { setStage('not-found'); return; }
        const data = snap.data() as VaultRecord;

        if (Date.now() > data.expiresAt) { setStage('expired'); return; }
        if (data.maxDownloads !== undefined && data.downloads >= data.maxDownloads) {
          setStage('limit-reached'); return;
        }

        setRecord(data);
        setStage('gate');
      } catch (err) {
        console.error(err);
        setStage('error');
      }
    };
    load();
  }, [vaultId]);

  // Timer countdown
  useEffect(() => {
    if (!record) return;
    const tick = () => {
      const remaining = record.expiresAt - Date.now();
      if (remaining <= 0) { setStage('expired'); return; }
      setTimeLeft(formatTime(remaining));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [record]);

  // Cleanup blob URL
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const triggerShake = () => {
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 500);
  };

  const handleUnlock = async () => {
    if (!password.trim() || !record) return;

    try {
      let encryptedBytes: Uint8Array;

      if (record.storagePath) {
        setStage('downloading');
        setProgress(0);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knopoetvssfyxmvggqei.supabase.co';
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/transfers/${record.storagePath}`;

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to retrieve file from storage');

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Cannot initialize storage stream reader');

        let receivedBytes = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            setProgress(Math.round((receivedBytes / totalBytes) * 100));
          }
        }

        encryptedBytes = new Uint8Array(receivedBytes);
        let pos = 0;
        for (const chunk of chunks) {
          encryptedBytes.set(chunk, pos);
          pos += chunk.length;
        }
      } else if (record.encryptedData) {
        setStage('decrypting');
        encryptedBytes = fromBase64(record.encryptedData);
      } else {
        throw new Error('Vault contains no valid file data storage details.');
      }

      setStage('decrypting');
      const decrypted = await decryptRecord(record, password, encryptedBytes);
      
      // Use window.File constructor to avoid naming collision with Lucide-react's File icon
      const fileObj = new window.File([decrypted], record.fileName, { type: record.fileType || 'application/octet-stream' });
      setDecryptedBlob(fileObj);

      const url = URL.createObjectURL(fileObj);
      setBlobUrl(url);

      const type = record.fileType;
      if (type.startsWith('image/')) setIsImage(true);
      if (type === 'application/pdf') setIsPdf(true);
      if (type.startsWith('text/') || ['json','xml','csv','md','txt'].some(ext => record.fileName.endsWith(`.${ext}`))) {
        setIsText(true);
        const text = await fileObj.text();
        setTextContent(text);
      }

      try {
        await updateDoc(doc(db, 'secure_vault', record.id), { downloads: increment(1) });
      } catch (e) { /* non-critical */ }

      setStage('preview');
    } catch (err: any) {
      console.error(err);
      setAttempts(a => a + 1);
      setStage('wrong-password');
      triggerShake();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  const handleDownload = () => {
    if (!blobUrl || !record) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = record.fileName;
    document.body.appendChild(a); // Required for Chrome/Firefox to enforce the download attribute filename
    a.click();
    document.body.removeChild(a);  // Clean up DOM
  };

  const fileInfo = record ? getFileIconInfo(record.fileType, record.fileName) : null;
  const FileIcon = fileInfo?.icon || File;

  // ─── Render States ─────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Loader2 size={24} className="text-zinc-400 animate-spin" />
          </div>
          <p className="text-zinc-500 font-bold text-sm">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (stage === 'not-found') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 font-sans">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <XCircle size={28} className="text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Vault Not Found</h1>
            <p className="text-zinc-400 text-sm font-bold">This vault link doesn't exist or has been permanently deleted.</p>
          </div>
          <button onClick={() => navigate('home')} className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-bold flex items-center gap-2 mx-auto">
            <ArrowLeft size={14} /> Go Home
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'expired') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 font-sans">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Clock size={28} className="text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Vault Expired</h1>
            <p className="text-zinc-400 text-sm font-bold">This vault link has expired and the file is no longer accessible.</p>
          </div>
          <button onClick={() => navigate('services', 'secure-vault')} className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-bold flex items-center gap-2 mx-auto">
            <Shield size={14} /> Create New Vault
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'limit-reached') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 font-sans">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Download size={28} className="text-orange-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Download Limit Reached</h1>
            <p className="text-zinc-400 text-sm font-bold">The maximum number of downloads for this vault has been reached.</p>
          </div>
          <button onClick={() => navigate('services', 'secure-vault')} className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-bold flex items-center gap-2 mx-auto">
            <Shield size={14} /> Create New Vault
          </button>
        </div>
      </div>
    );
  }

  if (
    stage === 'gate' ||
    stage === 'wrong-password' ||
    stage === 'downloading' ||
    stage === 'decrypting'
  ) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-xl mx-auto flex items-center justify-center border transition-all duration-300
              ${stage === 'downloading' || stage === 'decrypting'
                ? 'bg-indigo-500/10 border-indigo-500/30 scale-105'
                : stage === 'wrong-password'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {stage === 'downloading' || stage === 'decrypting' ? (
                <Loader2 size={32} className="text-indigo-400 animate-spin" />
              ) : stage === 'wrong-password' ? (
                <Lock size={32} className="text-red-400" />
              ) : (
                <Lock size={32} className="text-indigo-400" />
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">
                {stage === 'downloading'
                  ? `Downloading encrypted file...`
                  : stage === 'decrypting'
                    ? 'Decrypting file...'
                    : 'Password Required'}
              </h1>
              <p className="text-zinc-450 text-sm font-semibold">
                {stage === 'downloading'
                  ? `Transferring binary segments from storage (${progress}%)`
                  : stage === 'decrypting'
                    ? 'Unlocking file locally with AES-256-GCM...'
                    : 'This file is password-protected. Enter the password to access it.'}
              </p>
            </div>
          </div>

          {record && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${fileInfo?.bg} flex items-center justify-center flex-shrink-0`}>
                <FileIcon size={24} className={fileInfo?.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate text-sm">{record.fileName}</p>
                <p className="text-zinc-400 text-xs mt-0.5 font-bold">{formatBytes(record.fileSize)} · {fileInfo?.label}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-zinc-400 font-bold">{timeLeft}</p>
                {record.maxDownloads && (
                  <p className="text-xs text-zinc-500 mt-0.5 font-bold">
                    {record.downloads}/{record.maxDownloads} downloads
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                <Key size={11} /> Enter Password
              </label>
              <div
                className={`relative transition-all duration-350 ${shakeInput ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}`}
                style={shakeInput ? { animation: 'wiggle 0.4s ease-in-out' } : {}}
              >
                <style>{`
                  @keyframes wiggle {
                    0%, 100% { transform: translateX(0); }
                    15% { transform: translateX(-8px); }
                    30% { transform: translateX(8px); }
                    45% { transform: translateX(-6px); }
                    60% { transform: translateX(6px); }
                    75% { transform: translateX(-4px); }
                    90% { transform: translateX(4px); }
                  }
                `}</style>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter the password..."
                  disabled={stage === 'downloading' || stage === 'decrypting'}
                  autoFocus
                  className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 pr-10 text-white placeholder-zinc-500 focus:outline-none transition-all text-sm
                    ${stage === 'wrong-password' ? 'border-red-500/50' : 'border-zinc-800 focus:border-zinc-700'}
                    disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-zinc-200 transition-colors"
                  disabled={stage === 'downloading' || stage === 'decrypting'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {stage === 'wrong-password' && (
                <div className="flex items-center gap-2 text-xs text-red-400 font-bold">
                  <AlertCircle size={12} />
                  Incorrect password. Please try again.
                </div>
              )}
            </div>

            {record?.passwordHint && (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-xs">
                <p className="text-amber-400 font-bold mb-1">💡 Hint from sender</p>
                <p className="text-zinc-300 font-medium">{record.passwordHint}</p>
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={!password.trim() || stage === 'downloading' || stage === 'decrypting'}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              {stage === 'downloading' ? (
                <><Loader2 size={16} className="animate-spin text-white" /> Downloading... {progress}%</>
              ) : stage === 'decrypting' ? (
                <><Loader2 size={16} className="animate-spin text-white" /> Decrypting…</>
              ) : (
                <><Unlock size={16} /> Unlock File</>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-zinc-550">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={11} className="text-emerald-600" />
              AES-256-GCM
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <Globe size={11} className="text-emerald-600" />
              Zero-knowledge
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <Zap size={11} className="text-emerald-600" />
              Client-side
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'preview' && record) {
    return (
      <div className="min-h-screen bg-[#000000] text-white w-full flex flex-col items-center font-sans">
        <div className="w-full flex-grow flex flex-col">
          
          {/* Header replacement (direct in-content back arrow) */}
          <div className="max-w-full px-4 md:px-8 py-4 flex items-center gap-4 border-b border-zinc-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-sm">{record.fileName}</p>
              <p className="text-xs text-zinc-400 font-bold">{formatBytes(record.fileSize)} · Decrypted successfully</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all flex-shrink-0 text-white border-none"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>

          <main className="max-w-full px-4 md:px-8 py-8 space-y-6 w-full flex-grow">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 font-bold text-sm">File unlocked successfully</p>
                <p className="text-zinc-450 text-xs mt-0.5 font-bold">Decrypted locally in your browser. The key was never sent to any server.</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-full">
              {isImage && blobUrl && (
                <div className="p-4 flex justify-center bg-zinc-950 w-full">
                  <img
                    src={blobUrl}
                    alt={record.fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded shadow"
                  />
                </div>
              )}

              {isPdf && blobUrl && (
                <iframe
                  src={blobUrl}
                  className="w-full"
                  style={{ height: '75vh' }}
                  title={record.fileName}
                />
              )}

              {isText && (
                <div className="p-4 bg-zinc-950">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono rounded overflow-auto max-h-[70vh]">
                    {textContent}
                  </pre>
                </div>
              )}

              {!isImage && !isPdf && !isText && (
                <div className="p-10 text-center space-y-4">
                  <div className={`w-16 h-16 rounded-xl ${fileInfo?.bg} flex items-center justify-center mx-auto`}>
                    <FileIcon size={28} className={fileInfo?.color} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{record.fileName}</p>
                    <p className="text-zinc-450 text-xs mt-1 font-bold">Preview not available for this file type</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all text-white border-none"
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'File Name', value: record.fileName },
                { label: 'File Size', value: formatBytes(record.fileSize) },
                { label: 'File Type', value: fileInfo?.label || 'Unknown' },
                { label: 'Expires', value: timeLeft },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 font-bold">{label}</p>
                  <p className="text-sm text-white font-bold mt-1 truncate">{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Download size={18} /> Download {record.fileName}
            </button>

            <div className="text-center pt-4">
              <p className="text-zinc-500 text-xs font-bold">Want to protect your own files?</p>
              <button
                onClick={() => navigate('services', 'secure-vault')}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold underline underline-offset-2 transition-colors"
              >
                Create a Secure Vault →
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 font-sans">
      <div className="text-center space-y-6 max-w-md font-sans">
        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Something went wrong</h1>
          <p className="text-zinc-400 text-sm font-bold">Unable to load this vault. Please check your internet connection and try again.</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all text-sm font-bold mx-auto">
          Retry
        </button>
      </div>
    </div>
  );
};

export default SecureVaultView;
