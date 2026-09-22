import React, { useState, useEffect } from 'react';
import { X, Smartphone, Apple, Download, QrCode, CheckCircle2, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface MobileAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  appUrl?: string;
}

export default function MobileAppDownloadModal({
  isOpen,
  onClose,
  appName = 'Mero Patro',
  appUrl = 'https://bishalcodes.com/widgets/calendar'
}: MobileAppDownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const effectiveAppUrl = appUrl || (typeof window !== 'undefined' ? `${window.location.origin}/widgets/calendar` : 'https://bishalcodes.com/widgets/calendar');
  const iosProfileUrl = `/api/ios-profile?type=webclip&title=${encodeURIComponent(appName)}&url=${encodeURIComponent(effectiveAppUrl)}&organization=${encodeURIComponent('Bishal Codes')}`;
  const androidApkUrl = '/downloads/NepaliCalendar-Mobile.apk';

  // Helper to pre-cache all page resources for offline WebClip availability
  const ensureOfflinePrecached = async () => {
    if (typeof window === 'undefined') return;
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/service-worker.js').catch(e => console.warn(e));
      }
      if ('caches' in window) {
        const cache = await caches.open('bishalcodes-v6');
        const staticAssets = [
          effectiveAppUrl,
          '/',
          '/widgets/calendar',
          '/widgets/calendar/',
          '/manifest.json',
          '/manifest-calendar.json',
          '/favicon.svg',
          '/apple-touch-icon.png',
          '/logo-icon.png',
          '/calendar-desktop-icon.png',
          '/mero-patro-app-icon-3d.png',
          '/mero-patro-logo.png'
        ];

        const scriptUrls = Array.from(document.querySelectorAll('script[src]'))
          .map((s: any) => s.src)
          .filter(src => src.startsWith(window.location.origin));
        const styleUrls = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
          .map((l: any) => l.href)
          .filter(href => href.startsWith(window.location.origin));

        const allAssetsToPrecache = Array.from(new Set([...staticAssets, ...scriptUrls, ...styleUrls]));
        console.log(`[Offline Prep] Pre-caching ${allAssetsToPrecache.length} assets for WebClip...`);
        await Promise.allSettled(
          allAssetsToPrecache.map(url =>
            cache.add(new Request(url, { credentials: 'omit' })).catch(e => console.warn('[Precache warn]', url, e))
          )
        );
      }
    } catch (err) {
      console.warn('[Offline Prep] Pre-cache error:', err);
    }
  };

  // Listen for PWA prompt & auto pre-cache on modal open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isOpen) {
      ensureOfflinePrecached();
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isOpen]);

  // Generate standard, high-contrast black & white QR code
  useEffect(() => {
    if (!isOpen) return;
    const targetUrl = activeTab === 'ios' 
      ? (typeof window !== 'undefined' ? `${window.location.origin}${iosProfileUrl}` : iosProfileUrl)
      : (typeof window !== 'undefined' ? `${window.location.origin}${androidApkUrl}` : androidApkUrl);

    QRCode.toDataURL(targetUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [isOpen, activeTab, iosProfileUrl, androidApkUrl]);

  if (!isOpen) return null;

  const handleDownloadIosProfile = async () => {
    setDownloading(true);
    try {
      await ensureOfflinePrecached();

      const response = await fetch('/api/ios-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webclip',
          title: appName,
          url: effectiveAppUrl,
          organization: 'Bishal Codes',
          fullScreen: true,
          isRemovable: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate iOS profile');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${appName.toLowerCase().replace(/\s+/g, '_')}.mobileconfig`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading profile:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on your device: Tap the browser share / menu icon and choose "Add to Home Screen".');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-[#e52521] shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Install {appName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct install for iOS & Android without App Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Apple size={15} className={activeTab === 'ios' ? 'text-[#e52521]' : ''} />
              <span>Apple iOS Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone size={15} className={activeTab === 'android' ? 'text-[#e52521]' : ''} />
              <span>Android APK & PWA</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'ios' ? (
            <div className="space-y-5">
              {/* iOS Direct Action Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Apple size={16} className="text-[#e52521]" />
                    Apple iOS WebClip Profile
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] font-semibold border border-red-200 dark:border-red-900/40">
                    Standalone WebClip
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Downloads an official Apple <code className="text-xs bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">.mobileconfig</code> profile to install {appName} directly on your iPhone/iPad Home Screen in full-screen mode.
                </p>
                <a
                  href={iosProfileUrl}
                  onClick={() => ensureOfflinePrecached()}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Download size={15} />
                  <span>Download iOS Profile (.mobileconfig)</span>
                </a>
              </div>

              {/* iOS Step-by-Step Guide */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Installation Steps:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span className="text-slate-700 dark:text-slate-300">Tap <strong>Download iOS Profile</strong> and choose <strong>Allow</strong> when Safari prompts.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span className="text-slate-700 dark:text-slate-300">Open iPhone <strong>Settings</strong> &rarr; tap the <strong>Profile Downloaded</strong> banner at top.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span className="text-slate-700 dark:text-slate-300">Tap <strong>Install</strong> in the top-right corner. {appName} is now ready on your Home Screen!</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <img src={qrCodeUrl} alt="iOS QR Code" className="w-20 h-20 rounded-lg border border-slate-200 bg-white p-1 shrink-0 shadow-sm" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <QrCode size={14} className="text-[#e52521]" /> Scan with iPhone Camera
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Scan this QR code with your iPhone or iPad camera to download the profile directly onto your device.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Android Direct Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone size={16} className="text-[#e52521]" />
                    Android App Package & PWA
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900/40">
                    Offline App
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Install {appName} on Android either via the standalone APK package or 1-tap browser Home Screen PWA.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={androidApkUrl}
                    download
                    className="bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Download size={14} />
                    Download APK (.apk)
                  </a>

                  <button
                    onClick={handlePwaInstall}
                    className="border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[#e52521]" />
                    Add to Home Screen
                  </button>
                </div>
              </div>

              {/* Android Installation Steps */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Installation Steps:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span className="text-slate-700 dark:text-slate-300">Tap <strong>Download APK (.apk)</strong> or tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span className="text-slate-700 dark:text-slate-300">For APK: Open file download and allow "Install from Unknown Sources".</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/80 dark:border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#e52521] border border-red-200/80 dark:border-red-900/40 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span className="text-slate-700 dark:text-slate-300">Open {appName} from your phone app drawer or Home Screen!</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <img src={qrCodeUrl} alt="Android QR Code" className="w-20 h-20 rounded-lg border border-slate-200 bg-white p-1 shrink-0 shadow-sm" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <QrCode size={14} className="text-[#e52521]" /> Scan with Android Camera
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Scan this QR code from your Android device to download the APK package directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <ShieldCheck size={15} className="text-emerald-500" /> Safe, Virus-Free &amp; Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

