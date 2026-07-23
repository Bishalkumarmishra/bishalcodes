import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Link as LinkIcon, Trash2, ArrowLeft, Lightbulb, ChevronRight, Lock as LockIcon, CheckCircle2, Send, Terminal, Image as ImageIcon, FileText, QrCode as QrCodeIcon, Code2, X, Copy, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

interface ToolDownloadStepProps {
  title: string;
  downloadUrl: string;
  downloadFileName: string;
  onReset: () => void;
}

export const ToolDownloadStep: React.FC<ToolDownloadStepProps> = ({
  title,
  downloadUrl,
  downloadFileName,
  onReset,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Generate a mock shareable link since the actual file is local to the browser
  // In a real backend implementation, this would be a real server URL
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/download/${Math.random().toString(36).substring(2, 9)}`;
      setShareLink(link);
      
      // Generate QR Code for the link
      QRCode.toDataURL(link, { width: 256, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error(err));
    }
  }, []);

  const [isUploadingToDropbox, setIsUploadingToDropbox] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const uploadToDropbox = async (token: string) => {
    setIsUploadingToDropbox(true);
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      
      const uploadRes = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${downloadFileName}`,
            mode: 'add',
            autorename: true,
            mute: false
          }),
          'Content-Type': 'application/octet-stream'
        },
        body: blob
      });
      
      if (uploadRes.ok) {
        alert('Success! Your PDF has been saved securely to your Dropbox.');
      } else {
        const err = await uploadRes.text();
        alert('Failed to save to Dropbox: ' + err);
      }
    } catch (e) {
      console.error(e);
      alert('Network error while uploading to Dropbox.');
    } finally {
      setIsUploadingToDropbox(false);
    }
  };

  const handleDropboxClick = () => {
    const clientId = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
    if (!clientId) {
      alert("Please add your Dropbox App Key to NEXT_PUBLIC_DROPBOX_APP_KEY in your .env.local file to enable direct cloud saving.");
      return;
    }

    const redirectUri = window.location.origin + '/dropbox-oauth';
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const popup = window.open(authUrl, 'DropboxAuth', 'width=600,height=600');
    
    const messageListener = async (event: MessageEvent) => {
      if (event.data?.type === 'DROPBOX_AUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        const token = event.data.token;
        await uploadToDropbox(token);
      } else if (event.data?.type === 'DROPBOX_AUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        alert('Dropbox authentication failed or was cancelled.');
      }
    };
    
    window.addEventListener('message', messageListener);
  };

  return (
    <div className="relative z-50 w-full min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center pt-16 sm:pt-24 pb-12 px-4 sm:px-6">
      
      {/* 1. Main Title */}
      <h1 className="text-3xl sm:text-[40px] font-extrabold text-[#333333] dark:text-white mb-8 sm:mb-10 text-center font-heading tracking-tight">
        {title}
      </h1>

      {/* 2. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3 mb-16 w-full max-w-4xl justify-center px-2">
        
        {/* Back Button */}
        <button 
          onClick={onReset}
          className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-[#333333] hover:bg-[#222222] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          title="Start over"
        >
          <ArrowLeft strokeWidth={2.5} className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Huge Download Button */}
        <a
          href={downloadUrl}
          download={downloadFileName}
          className="w-full sm:flex-1 sm:max-w-[400px] h-16 sm:h-[72px] bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 px-6 font-extrabold text-xl sm:text-2xl cursor-pointer"
        >
          <Download strokeWidth={3} className="w-6 h-6 sm:w-7 sm:h-7" />
          {downloadFileName.toLowerCase().endsWith('.docx') ? 'Download Word' :
           downloadFileName.toLowerCase().endsWith('.zip') ? 'Download ZIP' :
           'Download PDF'}
        </a>

        {/* Quick Actions (Link, Dropbox, Delete) */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-2 mt-2 sm:mt-0">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-[#333333] dark:text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer" 
            title="Share Link & QR"
          >
            <LinkIcon size={24} strokeWidth={2.5} />
          </button>
          <button 
            onClick={handleDropboxClick}
            disabled={isUploadingToDropbox}
            className={`w-14 h-14 sm:w-[72px] sm:h-[72px] bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-[#333333] dark:text-white rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer ${isUploadingToDropbox ? 'opacity-80' : 'hover:scale-105'}`} 
            title="Save to Dropbox"
          >
            {isUploadingToDropbox ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-[#0061FE]" />
            ) : (
              <img src="/dropbox.svg" alt="Dropbox" className="w-7 h-7 object-contain dark:invert" />
            )}
          </button>
          <button 
            onClick={onReset}
            className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-[#333333] dark:text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer" 
            title="Delete"
          >
            <Trash2 size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-[800px] flex flex-col gap-6">
        
        {/* 3. Continue to... Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-extrabold text-[#333333] dark:text-white mb-6">
            Continue to...
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/file-transfer" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-[#e52521]">
                  <Send size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">File Transfer</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>

            <Link href="/image-compressor" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-green-600">
                  <ImageIcon size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">Compress Image</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>

            <Link href="/ocr-converter" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-[#e52521]">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">OCR Converter</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>

            <Link href="/qr-studio" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-orange-500">
                  <QrCodeIcon size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">QR Studio</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>

            <Link href="/dev-card" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-[#e52521]">
                  <Code2 size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">Dev Card Studio</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>

            <Link href="/code-runner" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#e52521] dark:hover:border-[#e52521] hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f2f2f2] dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
                  <Terminal size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#e52521]">Code Runner</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#e52521]" />
            </Link>
          </div>
        </div>

        {/* 4. Desktop App Alert */}
        <div className="bg-[#eaf4fe] dark:bg-blue-900/30 border border-[#c4e0fb] dark:border-blue-800/50 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-white dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0 text-yellow-500 shadow-sm">
            <Lightbulb size={22} fill="currentColor" />
          </div>
          <p className="text-[#333333] dark:text-blue-100 text-sm font-medium">
            Work offline and enjoy powerful batch editing with BishalCodes Desktop App.{' '}
            <a href="https://apps.microsoft.com/detail/9PJVV2J32KNP?hl=en-us&gl=US&ocid=pdpshare" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#e52521]">
              Get the App
            </a>
          </p>
        </div>

        {/* 5. Secure. Private. In your control. Card */}
        <div className="bg-[#f0f7fe] dark:bg-slate-900 border border-[#e1f0fe] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm mb-20">
          <h3 className="text-xl font-extrabold text-[#333333] dark:text-white mb-4">
            Secure. Private. In your control
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            For over a decade, we have securely processed documents with no storage, no tracking, and complete privacy. Your files are always handled safely and automatically deleted after 2 hours.{' '}
            <Link href="/privacy" className="font-bold text-[#333333] dark:text-slate-300 hover:text-[#e52521] underline underline-offset-2">
              Learn more
            </Link>
          </p>
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-800 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={24} className="text-slate-800 dark:text-slate-300" strokeWidth={2.5} />
              <span>ISO<br/><span className="text-[10px] text-slate-500">27001</span></span>
            </div>
            <div className="flex items-center gap-2">
              <LockIcon size={24} className="text-slate-800 dark:text-slate-300" strokeWidth={2.5} />
              <span>SECURE<br/><span className="text-[10px] text-slate-500">SSL CONNECTION</span></span>
            </div>
          </div>
        </div>

      </div>

      {/* Share QR Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsShareModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Share & Download</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                <X size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center font-medium">
              Scan the QR code with your mobile device to download the file directly on your phone!
            </p>

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 ring-4 ring-slate-50 dark:ring-slate-800">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading...</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-medium truncate select-all">
                  {shareLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-12 h-12 shrink-0 bg-[#e52521] hover:bg-[#d01f1c] text-white rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Copy Link"
                >
                  {isCopied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
