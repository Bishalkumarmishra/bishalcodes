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
  appName = 'Nepali Calendar',
  appUrl = 'https://bishalcodes.com/widgets/calendar'
}: MobileAppDownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const iosProfileUrl = `/api/ios-profile?type=webclip&title=${encodeURIComponent(appName)}&url=${encodeURIComponent(appUrl)}&organization=${encodeURIComponent('Bishal Codes')}`;
  const androidApkUrl = '/downloads/NepaliCalendar-Mobile.apk';

  // Listen for PWA prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Generate QR Code for target app URL
  useEffect(() => {
    if (!isOpen) return;
    const targetUrl = activeTab === 'ios' 
      ? (typeof window !== 'undefined' ? `${window.location.origin}${iosProfileUrl}` : iosProfileUrl)
      : (typeof window !== 'undefined' ? `${window.location.origin}${androidApkUrl}` : androidApkUrl);

    QRCode.toDataURL(targetUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#ffffff', light: '#09090b' },
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [isOpen, activeTab, iosProfileUrl, androidApkUrl]);

  if (!isOpen) return null;

  const handleDownloadIosProfile = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/ios-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webclip',
          title: appName,
          url: appUrl,
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
      alert('To add to Home Screen: Tap the browser menu (⋮ or Share icon) and select "Add to Home Screen".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#09090b] border border-slate-800 rounded-2xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e52521]/10 border border-[#e52521]/30 flex items-center justify-center text-[#e52521]">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {appName} Mobile App
              </h3>
              <p className="text-xs text-slate-400">Install directly on iOS & Android without App Store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 p-3 bg-slate-950 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ios'
                ? 'bg-[#e52521] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Apple size={16} />
            <span>iOS Profile (.mobileconfig)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-[#e52521] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone size={16} />
            <span>Android Direct APK & PWA</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'ios' ? (
            <div className="space-y-5">
              {/* iOS Direct Action */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Apple size={16} className="text-[#e52521]" />
                    iOS Configuration Profile
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e52521]/20 text-[#e52521] font-semibold border border-[#e52521]/30">
                    Standalone WebClip
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Downloads an official Apple `.mobileconfig` WebClip profile. Installs the {appName} directly on your iPhone/iPad Home Screen with full-screen support and custom app icon.
                </p>
                <button
                  onClick={handleDownloadIosProfile}
                  disabled={downloading}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download size={15} />
                  {downloading ? 'Generating Profile...' : 'Download iOS Profile (.mobileconfig)'}
                </button>
              </div>

              {/* iOS Step-by-Step Guide */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">iOS Installation Steps:</h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span>Tap <strong>Download iOS Profile</strong> and select <strong>Allow</strong> when Safari asks to download profile.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span>Open iPhone <strong>Settings</strong> → Tap <strong>Profile Downloaded</strong> banner at top.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span>Tap <strong>Install</strong> in top-right corner. Launch {appName} anytime from your Home Screen!</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="flex items-center gap-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800">
                  <img src={qrCodeUrl} alt="iOS QR Code" className="w-20 h-20 rounded-lg border border-slate-700 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1">
                      <QrCode size={14} className="text-[#e52521]" /> Scan with iPhone Camera
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Point your iPhone camera at this QR code to download the profile directly onto your device.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Android Direct Actions */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone size={16} className="text-[#e52521]" />
                    Android Direct APK & PWA
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Offline App
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Install {appName} on Android either via direct APK installer or 1-tap browser Home Screen PWA installation.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={androidApkUrl}
                    download
                    className="bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Download size={14} />
                    Download APK (.apk)
                  </a>

                  <button
                    onClick={handlePwaInstall}
                    className="border border-slate-700 hover:border-slate-500 bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[#e52521]" />
                    Add to Home Screen
                  </button>
                </div>
              </div>

              {/* Android Installation Steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Android Installation Steps:</h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span>Tap <strong>Download APK (.apk)</strong> or tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span>For APK: Open file download and allow "Install from Unknown Sources".</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-[#e52521]/20 text-[#e52521] flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span>Open {appName} from your phone app drawer or Home Screen!</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="flex items-center gap-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800">
                  <img src={qrCodeUrl} alt="Android QR Code" className="w-20 h-20 rounded-lg border border-slate-700 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1">
                      <QrCode size={14} className="text-[#e52521]" /> Scan with Android Camera
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Scan this QR code from your Android device to download the APK package directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" /> Safe, Virus-Free & Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
