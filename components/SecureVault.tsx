'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft, Upload, X, File, Copy, Check, Lock, Unlock,
  ShieldCheck, Link2, QrCode, Download, Eye, EyeOff,
  AlertCircle, Loader2, Shield, Clock, RefreshCw,
  FileImage, FileText, Film, Music, Archive, Globe, Key, Zap
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

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

type Stage = 'idle' | 'encrypting' | 'uploading' | 'done' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getFileIcon = (type: string, name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (type.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return { icon: FileImage, color: 'text-pink-400', bg: 'bg-pink-500/10' };
  if (type.startsWith('video/') || ['mp4','mkv','mov','avi','webm'].includes(ext)) return { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10' };
  if (type.startsWith('audio/') || ['mp3','wav','flac','aac','ogg'].includes(ext)) return { icon: Music, color: 'text-sky-400', bg: 'bg-sky-500/10' };
  if (type === 'application/pdf' || ext === 'pdf') return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' };
  if (['zip','rar','7z','tar','gz'].includes(ext)) return { icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10' };
  return { icon: File, color: 'text-indigo-400', bg: 'bg-indigo-500/10' };
};

// ─── Web Crypto AES-256-GCM Encryption ────────────────────────────────────────
const PBKDF2_ITERATIONS = 310_000;

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

const toBase64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

async function encryptFile(file: File, password: string): Promise<{ encrypted: ArrayBuffer; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const fileBuffer = await file.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as any }, key, fileBuffer);
  return {
    encrypted,
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

const uploadFileWithProgress = (
  url: string,
  data: ArrayBuffer,
  onProgress: (pct: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.send(data);
  });
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SecureVault: React.FC = () => {
  const { navigate } = useNavigation();

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Result state
  const [vaultId, setVaultId] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Very Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
    return { score, label: 'Very Strong', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError('File must be under 500 MB.');
      return;
    }
    setError('');
    setFile(selectedFile);
    setStage('idle');
    setVaultId('');
    setShareUrl('');
    setQrDataUrl('');
  };

  // Drag & Drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleEncryptAndUpload = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setError('');
    setStage('encrypting');
    setProgress(5);

    try {
      const encryptedRes = await encryptFile(file, password);
      setProgress(40);

      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const storagePath = `vault/${id}/${file.name}`;

      const initRes = await fetch('/api/vault-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: storagePath })
      });

      if (!initRes.ok) {
        const errData = await initRes.json();
        throw new Error(errData.error || 'Failed to initialize vault storage');
      }

      const { signedUrl } = await initRes.json();
      setProgress(50);
      setStage('uploading');

      await uploadFileWithProgress(signedUrl, encryptedRes.encrypted, (pct) => {
        setProgress(50 + Math.round((pct / 100) * 45));
      });

      const record: any = {
        id,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath,
        iv: encryptedRes.iv,
        salt: encryptedRes.salt,
        expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
        createdAt: Date.now(),
        downloads: 0,
      };

      if (passwordHint) record.passwordHint = passwordHint;
      if (maxDownloads !== undefined) record.maxDownloads = maxDownloads;

      await setDoc(doc(db, 'secure_vault', id), record);
      setProgress(100);

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com';
      const url = `${origin}/vault/${id}`;
      setShareUrl(url);
      setVaultId(id);

      const qr = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#6366f1', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(qr);
      setStage('done');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Encryption or upload failed. Please try again.');
      setStage('error');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `vault-qr-${vaultId}.png`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setPasswordHint('');
    setStage('idle');
    setVaultId('');
    setShareUrl('');
    setQrDataUrl('');
    setError('');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileInfo = file ? getFileIcon(file.type, file.name) : null;
  const FileIcon = fileInfo?.icon || File;

  return (
    <div className="min-h-screen bg-[#000000] text-white w-full flex flex-col items-center select-none font-sans pt-20 sm:pt-28">
      <main className="w-full max-w-full px-4 md:px-8 py-8 space-y-8 flex-grow">
        
        {/* Navigation / Header replacement directly in-content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <button
            onClick={() => navigate('services')}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors self-start"
          >
            <ArrowLeft size={16} /> Back to Tools
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
              🔐 AES-256 Encrypted
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-bold bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1">
              🌐 Zero-Knowledge
            </span>
          </div>
        </div>

        {stage !== 'done' ? (
          <>
            {/* Hero section */}
            <div className="text-center space-y-3 py-4">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Secure File Locker & Vault
              </h1>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto">
                Encrypt images, PDFs, videos, or documents with AES-256-GCM. Share a password-protected link or QR code — decryption is entirely client-side.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: Lock, text: 'End-to-End Encrypted' },
                { icon: QrCode, text: 'QR Code Included' },
                { icon: Clock, text: 'Auto-Expiry' },
                { icon: Zap, text: 'Instant Sharing' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-3.5 py-1.5">
                  <Icon size={12} />
                  {text}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Upload + Settings */}
              <div className="lg:col-span-3 space-y-4">
                {/* Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                    ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'}
                    ${file ? 'cursor-default' : ''}`}
                  style={{ minHeight: '180px' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  {file ? (
                    <div className="p-6 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${fileInfo?.bg} flex items-center justify-center flex-shrink-0`}>
                        <FileIcon size={24} className={fileInfo?.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm">{file.name}</p>
                        <p className="text-zinc-400 text-xs mt-1">{formatBytes(file.size)} · {file.type || 'Unknown type'}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                        >
                          <X size={12} /> Remove file
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 rounded-lg border border-zinc-700"
                      >
                        <RefreshCw size={12} /> Change
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
                      <div className="w-14 h-14 rounded-xl bg-zinc-850 border border-zinc-800 flex items-center justify-center">
                        <Upload size={24} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Drop your file here</p>
                        <p className="text-zinc-400 text-xs mt-1">or <span className="text-indigo-400 underline underline-offset-2 font-semibold">click to browse</span></p>
                        <p className="text-zinc-500 text-[11px] mt-2 font-bold">Any file type · Max 500 MB</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-bold text-zinc-500">
                        {['PDF', 'Images', 'Videos', 'Docs', 'Zip', 'Audio'].map(t => (
                          <span key={t} className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Fields */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                    <Lock size={14} className="text-zinc-400" />
                    Security Key setup
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-bold">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter a strong password..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {password && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-zinc-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-300 w-20 text-right font-bold">{strength.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-bold">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat the password..."
                        className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all
                          ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-700'}`}
                      />
                      {confirmPassword && password === confirmPassword && (
                        <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-bold">Password Hint (optional)</label>
                    <input
                      type="text"
                      value={passwordHint}
                      onChange={e => setPasswordHint(e.target.value)}
                      placeholder="A clue shown to the recipient..."
                      maxLength={80}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Settings */}
              <div className="lg:col-span-2 space-y-4">
                {/* Expiry */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Clock size={14} className="text-zinc-400" />
                    Link Expiry
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '1 Hour', value: 1 },
                      { label: '6 Hours', value: 6 },
                      { label: '24 Hours', value: 24 },
                      { label: '3 Days', value: 72 },
                      { label: '7 Days', value: 168 },
                      { label: '30 Days', value: 720 },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setExpiryHours(value)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border
                          ${expiryHours === value
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download limit */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Download size={14} className="text-zinc-400" />
                    Max Downloads
                  </div>
                  <p className="text-xs text-zinc-400 font-bold">Leave blank for unlimited</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[undefined, 1, 5, 10, 25, 50].map((v) => (
                      <button
                        key={v ?? 'unlimited'}
                        onClick={() => setMaxDownloads(v)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border
                          ${maxDownloads === v
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                          }`}
                      >
                        {v === undefined ? '∞' : v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security badge */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Zero-Knowledge Security
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    Your password never leaves your browser. All encryption happens locally using AES-256-GCM.
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-350 font-bold">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress */}
            {(stage === 'encrypting' || stage === 'uploading') && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    {stage === 'encrypting' ? 'Encrypting file client-side...' : 'Uploading encrypted file to vault...'}
                  </div>
                  <span className="text-white text-xs font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-650 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleEncryptAndUpload}
              disabled={!file || !password || !confirmPassword || stage === 'encrypting' || stage === 'uploading'}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              {stage === 'encrypting' || stage === 'uploading' ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                <><Lock size={18} /> Encrypt & Generate Link</>
              )}
            </button>
          </>
        ) : (
          /* ─── Success / Result View ─────────────────────────────────────── */
          <div className="space-y-6">
            <div className="text-center space-y-3 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white">File Secured! 🎉</h2>
              <p className="text-zinc-400 text-sm font-semibold">
                Your file is encrypted and ready to share. Only the password holder can access it.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Share Link */}
              <div className="lg:col-span-3 space-y-4">
                {/* File info card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${fileInfo?.bg} flex items-center justify-center flex-shrink-0`}>
                      <FileIcon size={24} className={fileInfo?.color} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{file?.name}</p>
                      <p className="text-zinc-400 text-xs mt-1 font-semibold">{file ? formatBytes(file.size) : ''}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold">
                        Encrypted
                      </span>
                    </div>
                  </div>
                </div>

                {/* Share URL */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Link2 size={14} className="text-zinc-400" />
                    Shareable Link
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-indigo-300 font-mono truncate select-all">
                      {shareUrl}
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareUrl)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-zinc-700
                        ${copied ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'}`}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                    <Clock size={11} />
                    Expires in {expiryHours >= 24 ? `${expiryHours / 24} day(s)` : `${expiryHours} hour(s)`}
                    {maxDownloads && ` · Max ${maxDownloads} downloads`}
                  </p>
                </div>

                {/* Share buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const text = `🔐 Secure file: ${file?.name}\n\nAccess with your password here:\n${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="py-3 px-4 rounded-xl bg-green-600/10 border border-green-600/20 text-green-400 text-xs font-bold hover:bg-green-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    📱 Share on WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const subject = `Secure file: ${file?.name}`;
                      const body = `I've shared a password-protected file with you.\n\nFile: ${file?.name}\nLink: ${shareUrl}\n\nYou'll need the password to access it.`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                    className="py-3 px-4 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-bold hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    ✉️ Share via Email
                  </button>
                </div>

                {/* Password hint reminder */}
                {passwordHint && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 text-sm">
                    <p className="text-amber-400 font-bold text-xs mb-1">💡 Password Hint</p>
                    <p className="text-zinc-350 font-medium">{passwordHint}</p>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={reset}
                  className="w-full py-3 rounded-lg font-bold text-xs border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  Lock Another File
                </button>
              </div>

              {/* Right: QR Code */}
              <div className="lg:col-span-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <QrCode size={14} className="text-zinc-400" />
                    QR Code
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl border border-zinc-800 shadow">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 block select-none" />
                      ) : (
                        <div className="w-40 h-40 bg-zinc-950 rounded flex items-center justify-center">
                          <Loader2 className="animate-spin text-zinc-500" size={24} />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-bold text-center">
                    Scan to open the password gate
                  </p>
                  <button
                    onClick={downloadQR}
                    className="w-full py-2.5 rounded-lg font-bold text-xs bg-zinc-800 border border-zinc-700 text-zinc-350 hover:bg-zinc-750 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={12} /> Download QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SeoGuideSection toolId="secure-vault" />

    </div>
  );
};

export default SecureVault;
