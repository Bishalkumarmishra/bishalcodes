import React, { useState, useEffect } from 'react';
import { 
  Apple, 
  Download, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Settings, 
  QrCode, 
  HelpCircle, 
  CheckCircle2, 
  Copy, 
  ExternalLink,
  Sparkles,
  Layers,
  Check,
  Wifi,
  Package,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';

type PlatformType = 'ios' | 'android';
type IosProfileType = 'webclip' | 'dns' | 'custom';
type AndroidToolType = 'pwa' | 'dns' | 'wifi' | 'apk';

export default function IOSProfileGenerator() {
  const [platform, setPlatform] = useState<PlatformType>('ios');
  
  // iOS States
  const [activeIosTab, setActiveIosTab] = useState<IosProfileType>('webclip');
  const [appTitle, setAppTitle] = useState('Bishal Codes App');
  const [siteUrl, setSiteUrl] = useState('https://bishalcodes.com');
  const [organization, setOrganization] = useState('Bishal Codes');
  const [fullScreen, setFullScreen] = useState(true);
  const [isRemovable, setIsRemovable] = useState(true);
  const [iconBase64, setIconBase64] = useState<string>('');
  const [dnsProvider, setDnsProvider] = useState<'cloudflare' | 'adguard' | 'nextdns' | 'custom'>('cloudflare');
  const [customDnsUrl, setCustomDnsUrl] = useState('');
  const [dnsProfileTitle, setDnsProfileTitle] = useState('Cloudflare 1.1.1.1 DNS');
  const [customXml, setCustomXml] = useState('');

  // Android States
  const [activeAndroidTab, setActiveAndroidTab] = useState<AndroidToolType>('pwa');
  const [androidDnsProvider, setAndroidDnsProvider] = useState<'cloudflare' | 'adguard' | 'nextdns' | 'quad9' | 'custom'>('cloudflare');
  const [customAndroidDns, setCustomAndroidDns] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [apkUrl, setApkUrl] = useState('/downloads/app.apk');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Common UI States
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [wifiQrUrl, setWifiQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedDns, setCopiedDns] = useState(false);
  const [isSafari, setIsSafari] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Capture PWA Install Prompt for Android
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detect browser
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isSafariBrowser = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
    setIsSafari(!isIOS || isSafariBrowser);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Update iOS QR Code
  useEffect(() => {
    if (platform !== 'ios') return;
    let targetDownloadUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com'}/api/ios-profile?type=${activeIosTab}&title=${encodeURIComponent(appTitle)}&url=${encodeURIComponent(siteUrl)}&organization=${encodeURIComponent(organization)}`;
    
    if (activeIosTab === 'dns') {
      targetDownloadUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com'}/api/ios-profile?type=dns&title=${encodeURIComponent(dnsProfileTitle)}&dnsProvider=${dnsProvider}&serverUrl=${encodeURIComponent(customDnsUrl)}&organization=${encodeURIComponent(organization)}`;
    }

    QRCode.toDataURL(targetDownloadUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#ffffff', light: '#121215' },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [platform, activeIosTab, appTitle, siteUrl, organization, dnsProfileTitle, dnsProvider, customDnsUrl]);

  // Update Android Wi-Fi QR Code
  useEffect(() => {
    if (platform !== 'android' || activeAndroidTab !== 'wifi' || !wifiSsid) return;
    const wifiString = `WIFI:T:${wifiSecurity};S:${wifiSsid};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
    
    QRCode.toDataURL(wifiString, {
      width: 280,
      margin: 2,
      color: { dark: '#ffffff', light: '#121215' },
    })
      .then((url) => setWifiQrUrl(url))
      .catch((err) => console.error('Error generating Wi-Fi QR:', err));
  }, [platform, activeAndroidTab, wifiSsid, wifiPassword, wifiSecurity, wifiHidden]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadIosProfile = async () => {
    setDownloading(true);

    try {
      const payload: any = {
        type: activeIosTab,
        organization,
      };

      if (activeIosTab === 'webclip') {
        payload.title = appTitle;
        payload.url = siteUrl;
        payload.fullScreen = fullScreen;
        payload.isRemovable = isRemovable;
        if (iconBase64) payload.iconBase64 = iconBase64;
      } else if (activeIosTab === 'dns') {
        payload.title = dnsProfileTitle;
        payload.dnsProvider = dnsProvider;
        payload.serverUrl = customDnsUrl;
      } else if (activeIosTab === 'custom') {
        payload.title = 'Custom Profile';
        payload.customXml = customXml;
      }

      const response = await fetch('/api/ios-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to generate profile');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = `${(payload.title || 'profile').toLowerCase().replace(/[^a-z0-9]/g, '_')}.mobileconfig`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setShowGuideModal(true);
    } catch (err) {
      console.error('Error downloading iOS profile:', err);
      alert('Could not generate profile. Please check parameters and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleInstallAndroidPwa = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredInstallPrompt(null);
    } else {
      alert('To install on Android: Tap the 3 dots (⋮) in Chrome top right corner -> Tap "Add to Home screen" or "Install App".');
    }
  };

  const getAndroidDnsHostname = () => {
    if (androidDnsProvider === 'cloudflare') return 'one.one.one.one';
    if (androidDnsProvider === 'adguard') return 'dns.adguard.com';
    if (androidDnsProvider === 'quad9') return 'dns.quad9.net';
    if (androidDnsProvider === 'nextdns') return customAndroidDns || 'dns.nextdns.io';
    return customAndroidDns || 'dns.example.com';
  };

  const copyAndroidDnsHostname = () => {
    const hostname = getAndroidDnsHostname();
    navigator.clipboard.writeText(hostname);
    setCopiedDns(true);
    setTimeout(() => setCopiedDns(false), 2000);
  };

  const copyDirectLink = () => {
    const directUrl = `${window.location.origin}/api/ios-profile?type=${activeIosTab}&title=${encodeURIComponent(appTitle)}&url=${encodeURIComponent(siteUrl)}`;
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-white font-sans selection:bg-[#e52521] selection:text-white">
      
      {/* Top Hero Banner - Full Screen Width */}
      <div className="w-full bg-gradient-to-b from-[#0e0e11] via-[#050507] to-[#000000] border-b border-neutral-800/80 pt-24 pb-14 px-4 sm:px-6 lg:px-12 text-center space-y-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg">
            iOS & Android <span className="bg-gradient-to-r from-[#e52521] to-[#ff4d49] bg-clip-text text-transparent">Mobile Studio</span>
          </h1>
          
          <p className="text-neutral-300 font-medium max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
            Configure and download native mobile app shortcuts, <code className="text-red-300 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded font-mono text-sm font-bold">.mobileconfig</code> iOS profiles, Android WebAPKs, and Encrypted Private DNS.
          </p>
        </div>

        {/* Main OS Platform Selector */}
        <div className="pt-2 flex justify-center">
          <div className="bg-[#121215] p-2 rounded-2xl border border-neutral-800 inline-flex gap-3 shadow-2xl">
            <button
              onClick={() => setPlatform('ios')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-sm transition-all ${
                platform === 'ios'
                  ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/60 ring-2 ring-red-500/40'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Apple className="w-5 h-5" />
              Apple iOS (.mobileconfig)
            </button>

            <button
              onClick={() => setPlatform('android')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-extrabold text-sm transition-all ${
                platform === 'android'
                  ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/60 ring-2 ring-red-500/40'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Android OS (PWA & APK)
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body - Extended Full Width */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10 space-y-12">

        {/* Safari Browser Warning Banner for iOS */}
        {platform === 'ios' && !isSafari && (
          <div className="bg-amber-950/60 border border-amber-500/60 rounded-xl p-4 flex items-start gap-3 text-amber-200 text-sm shadow-xl">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-300">Safari Browser Required on iPhone:</strong> Apple iOS requires opening the profile download link inside <strong>Apple Safari</strong> to trigger native iOS profile installation.
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 1: APPLE iOS STUDIO                                      */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {platform === 'ios' && (
          <div className="space-y-8">
            
            {/* iOS Sub-Tabs */}
            <div className="flex flex-wrap justify-center gap-3 border-b border-neutral-800/80 pb-5">
              <button
                onClick={() => setActiveIosTab('webclip')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeIosTab === 'webclip'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Web Clip (App Icon)
              </button>

              <button
                onClick={() => setActiveIosTab('dns')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeIosTab === 'dns'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Encrypted DNS
              </button>

              <button
                onClick={() => setActiveIosTab('custom')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeIosTab === 'custom'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                Raw Custom XML
              </button>
            </div>

            {/* iOS Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Form Workspace Card */}
              <div className="xl:col-span-7 bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 shadow-2xl relative overflow-hidden">
                
                {activeIosTab === 'webclip' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <Smartphone className="w-6 h-6 text-[#e52521]" />
                      <div>
                        <h2 className="text-xl font-extrabold text-white">iOS Web Clip Configuration</h2>
                        <p className="text-xs text-neutral-400">Add standalone app icon to iPhone Home Screen</p>
                      </div>
                    </div>

                    <div className="space-y-5 text-sm">
                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">App Name / Title</label>
                        <input
                          type="text"
                          value={appTitle}
                          onChange={(e) => setAppTitle(e.target.value)}
                          placeholder="e.g. Bishal Codes"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-medium outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Target Website URL</label>
                        <input
                          type="url"
                          value={siteUrl}
                          onChange={(e) => setSiteUrl(e.target.value)}
                          placeholder="https://bishalcodes.com"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-medium outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Organization / Publisher</label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Bishal Codes Ltd"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-medium outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Custom App Icon (PNG/JPG)</label>
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={handleIconChange}
                          className="w-full text-xs text-neutral-300 bg-[#16161a] border border-neutral-700 rounded-xl p-2.5 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-400 hover:file:bg-red-900 transition"
                        />
                      </div>

                      <div className="pt-2 space-y-3.5 border-t border-neutral-800">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={fullScreen}
                            onChange={(e) => setFullScreen(e.target.checked)}
                            className="w-4 h-4 accent-[#e52521] rounded bg-neutral-900 border-neutral-700"
                          />
                          <span className="text-neutral-200 font-medium">Launch in Full Screen (Hide Safari Navigation UI)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isRemovable}
                            onChange={(e) => setIsRemovable(e.target.checked)}
                            className="w-4 h-4 accent-[#e52521] rounded bg-neutral-900 border-neutral-700"
                          />
                          <span className="text-neutral-200 font-medium">Allow User to Remove Profile Anytime</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeIosTab === 'dns' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <ShieldCheck className="w-6 h-6 text-[#e52521]" />
                      <div>
                        <h2 className="text-xl font-extrabold text-white">iOS Encrypted DNS Configuration</h2>
                        <p className="text-xs text-neutral-400">DNS-over-HTTPS (DoH) profile for iPhone & iPad</p>
                      </div>
                    </div>

                    <div className="space-y-5 text-sm">
                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Profile Title</label>
                        <input
                          type="text"
                          value={dnsProfileTitle}
                          onChange={(e) => setDnsProfileTitle(e.target.value)}
                          placeholder="Cloudflare 1.1.1.1 DNS"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-medium outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Select DNS Provider</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'cloudflare', name: 'Cloudflare 1.1.1.1' },
                            { id: 'adguard', name: 'AdGuard DNS (AdBlock)' },
                            { id: 'nextdns', name: 'NextDNS Custom' },
                            { id: 'custom', name: 'Custom DoH Server' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setDnsProvider(p.id as any);
                                if (p.id === 'cloudflare') setDnsProfileTitle('Cloudflare 1.1.1.1 DNS');
                                if (p.id === 'adguard') setDnsProfileTitle('AdGuard AdBlock DNS');
                                if (p.id === 'nextdns') setDnsProfileTitle('NextDNS Profile');
                              }}
                              className={`p-4 rounded-xl text-left border text-xs font-bold transition ${
                                dnsProvider === p.id
                                  ? 'border-[#e52521] bg-red-950/60 text-white shadow-lg'
                                  : 'border-neutral-800 bg-[#16161a] text-neutral-300 hover:border-neutral-700'
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(dnsProvider === 'nextdns' || dnsProvider === 'custom') && (
                        <div>
                          <label className="block text-neutral-200 font-semibold mb-2">DNS-over-HTTPS (DoH) URL</label>
                          <input
                            type="url"
                            value={customDnsUrl}
                            onChange={(e) => setCustomDnsUrl(e.target.value)}
                            placeholder="https://dns.nextdns.io/your-id"
                            className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-medium outline-none transition"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeIosTab === 'custom' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <Layers className="w-6 h-6 text-[#e52521]" />
                      <h2 className="text-xl font-extrabold text-white">Custom Apple Plist XML</h2>
                    </div>

                    <div className="space-y-3 text-sm">
                      <label className="block text-neutral-200 font-semibold">Paste Custom .mobileconfig Plist Code</label>
                      <textarea
                        rows={12}
                        value={customXml}
                        onChange={(e) => setCustomXml(e.target.value)}
                        placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n  ...\n</dict>\n</plist>`}
                        className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl p-4 text-xs font-mono text-neutral-200 placeholder-neutral-600 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex flex-wrap gap-4 items-center">
                  <button
                    onClick={handleDownloadIosProfile}
                    disabled={downloading}
                    className="flex-1 bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center gap-3 transition active:scale-95 disabled:opacity-50 text-base"
                  >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Generating Profile...' : 'Download iOS Profile (.mobileconfig)'}
                  </button>

                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="bg-[#16161a] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold py-4 px-5 rounded-xl flex items-center gap-2 transition"
                  >
                    <HelpCircle className="w-4 h-4 text-[#e52521]" />
                    Install Guide
                  </button>
                </div>
              </div>

              {/* Right Side Preview */}
              <div className="xl:col-span-5 space-y-6">
                <div className="bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                    <QrCode className="w-4 h-4 text-[#e52521]" />
                    Scan to Download directly on iPhone
                  </div>

                  <div className="bg-[#18181c] p-4 rounded-2xl inline-block border border-neutral-700">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="iOS Profile QR Code" className="w-56 h-56 rounded-xl mx-auto" />
                    ) : (
                      <div className="w-56 h-56 bg-neutral-900 animate-pulse rounded-xl flex items-center justify-center text-xs text-neutral-500">
                        Generating QR Code...
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                    Scan with iPhone Camera and open link in <strong>Safari</strong> to download profile natively.
                  </p>

                  <button
                    onClick={copyDirectLink}
                    className="w-full bg-[#16161a] hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#e52521]" />}
                    {copied ? 'Direct Link Copied!' : 'Copy Direct Profile URL'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* PLATFORM 2: ANDROID OS STUDIO                                     */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {platform === 'android' && (
          <div className="space-y-8">
            
            {/* Android Sub-Tabs */}
            <div className="flex flex-wrap justify-center gap-3 border-b border-neutral-800/80 pb-5">
              <button
                onClick={() => setActiveAndroidTab('pwa')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeAndroidTab === 'pwa'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                WebAPK App Installer
              </button>

              <button
                onClick={() => setActiveAndroidTab('dns')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeAndroidTab === 'dns'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Private DNS Hostnames
              </button>

              <button
                onClick={() => setActiveAndroidTab('wifi')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeAndroidTab === 'wifi'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Wifi className="w-4 h-4" />
                Wi-Fi QR Auto-Connect
              </button>

              <button
                onClick={() => setActiveAndroidTab('apk')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeAndroidTab === 'apk'
                    ? 'bg-[#e52521] text-white shadow-lg shadow-red-950/50'
                    : 'bg-[#121215] text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Direct APK Package
              </button>
            </div>

            {/* Android Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Form Config Workspace */}
              <div className="xl:col-span-7 bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 shadow-2xl relative overflow-hidden">
                
                {/* ANDROID TAB 1: PWA WebAPK */}
                {activeAndroidTab === 'pwa' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <Smartphone className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h2 className="text-xl font-extrabold text-white">Android WebAPK Home Screen App</h2>
                        <p className="text-xs text-neutral-400">Native PWA installation for Android launcher</p>
                      </div>
                    </div>

                    <p className="text-neutral-300 text-sm leading-relaxed">
                      Android supports native **WebAPK installation**. When installed, your website runs as a standalone app with its own icon in the Android app drawer and home screen!
                    </p>

                    <div className="bg-[#16161a] border border-neutral-700 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-700 flex items-center justify-center font-extrabold text-[#e52521] text-lg">
                          BC
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white text-lg">Bishal Codes Android App</h3>
                          <p className="text-xs text-neutral-400">PWA WebAPK Application</p>
                        </div>
                      </div>

                      <button
                        onClick={handleInstallAndroidPwa}
                        className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center gap-3 transition text-base"
                      >
                        <Download className="w-5 h-5" />
                        {isPwaInstalled ? 'App Already Installed!' : '1-Click Install App on Android'}
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-neutral-300 bg-[#16161a] p-4 rounded-xl border border-neutral-700 leading-relaxed">
                      <strong className="text-white block font-bold text-sm">Manual Chrome Installation:</strong>
                      1. Open site in Chrome on Android.<br />
                      2. Tap Chrome 3 dots menu (⋮) in top-right.<br />
                      3. Tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.
                    </div>
                  </div>
                )}

                {/* ANDROID TAB 2: Private DNS */}
                {activeAndroidTab === 'dns' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <ShieldCheck className="w-6 h-6 text-[#e52521]" />
                      <div>
                        <h2 className="text-xl font-extrabold text-white">Android Native Private DNS (DoT)</h2>
                        <p className="text-xs text-neutral-400">System-wide encrypted DNS across all Android apps</p>
                      </div>
                    </div>

                    <p className="text-neutral-300 text-sm leading-relaxed">
                      Android 9+ includes native **Private DNS (DNS-over-TLS)** support in Settings. Configure encrypted DNS across all Android apps without extra background software.
                    </p>

                    <div className="space-y-3">
                      <label className="block text-neutral-200 font-semibold text-sm">Select Android DNS Provider</label>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {[
                          { id: 'cloudflare', name: 'Cloudflare 1.1.1.1', host: 'one.one.one.one' },
                          { id: 'adguard', name: 'AdGuard (AdBlock)', host: 'dns.adguard.com' },
                          { id: 'quad9', name: 'Quad9 Security', host: 'dns.quad9.net' },
                          { id: 'custom', name: 'Custom Hostname', host: 'custom' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAndroidDnsProvider(item.id as any)}
                            className={`p-4 rounded-xl text-left border font-bold transition ${
                              androidDnsProvider === item.id
                                ? 'border-[#e52521] bg-red-950/60 text-white shadow-lg'
                                : 'border-neutral-800 bg-[#16161a] text-neutral-300 hover:border-neutral-700'
                            }`}
                          >
                            <div>{item.name}</div>
                            <code className="text-[11px] text-neutral-400 font-mono block mt-1">{item.host}</code>
                          </button>
                        ))}
                      </div>
                    </div>

                    {androidDnsProvider === 'custom' && (
                      <div>
                        <label className="block text-neutral-200 font-semibold text-xs mb-2">Private DNS Hostname</label>
                        <input
                          type="text"
                          value={customAndroidDns}
                          onChange={(e) => setCustomAndroidDns(e.target.value)}
                          placeholder="e.g. dns.nextdns.io"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white text-xs placeholder-neutral-500 outline-none transition"
                        />
                      </div>
                    )}

                    <div className="bg-[#16161a] border border-neutral-700 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-400 font-medium">Android Hostname:</span>
                        <code className="font-mono text-[#e52521] font-bold text-sm bg-black px-3 py-1.5 rounded-lg border border-neutral-800">
                          {getAndroidDnsHostname()}
                        </code>
                      </div>

                      <button
                        onClick={copyAndroidDnsHostname}
                        className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 text-sm transition"
                      >
                        {copiedDns ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedDns ? 'Copied Hostname!' : 'Copy Hostname for Android Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ANDROID TAB 3: Wi-Fi QR */}
                {activeAndroidTab === 'wifi' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <Wifi className="w-6 h-6 text-[#e52521]" />
                      <h2 className="text-xl font-extrabold text-white">Android Wi-Fi QR Auto-Connect</h2>
                    </div>

                    <div className="space-y-5 text-sm">
                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Network Name (SSID)</label>
                        <input
                          type="text"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          placeholder="Home_WiFi_5G"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-200 font-semibold mb-2">Wi-Fi Password</label>
                        <input
                          type="password"
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full bg-[#16161a] border border-neutral-700 focus:border-[#e52521] focus:ring-1 focus:ring-[#e52521] rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-neutral-200 font-semibold mb-2">Security Type</label>
                          <select
                            value={wifiSecurity}
                            onChange={(e) => setWifiSecurity(e.target.value as any)}
                            className="w-full bg-[#16161a] border border-neutral-700 rounded-xl px-4 py-3 text-white text-xs outline-none"
                          >
                            <option value="WPA">WPA / WPA2 / WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">None (Open)</option>
                          </select>
                        </div>

                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 select-none cursor-pointer text-xs text-neutral-200 font-semibold">
                            <input
                              type="checkbox"
                              checked={wifiHidden}
                              onChange={(e) => setWifiHidden(e.target.checked)}
                              className="accent-[#e52521] w-4 h-4"
                            />
                            Hidden Network
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ANDROID TAB 4: APK Package */}
                {activeAndroidTab === 'apk' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                      <Package className="w-6 h-6 text-[#e52521]" />
                      <h2 className="text-xl font-extrabold text-white">Direct Android APK Download</h2>
                    </div>

                    <p className="text-neutral-300 text-sm leading-relaxed">
                      Serve direct compiled Android application packages (<code className="text-red-400 font-bold">.apk</code>) with proper HTTP headers (`application/vnd.android.package-archive`).
                    </p>

                    <div className="bg-[#16161a] border border-neutral-700 rounded-2xl p-6 space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-2">APK File URL</label>
                        <input
                          type="text"
                          value={apkUrl}
                          onChange={(e) => setApkUrl(e.target.value)}
                          className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-xs text-neutral-200 font-mono outline-none"
                        />
                      </div>

                      <a
                        href={apkUrl}
                        download="app.apk"
                        className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center gap-3 transition text-base"
                      >
                        <Download className="w-5 h-5" />
                        Download Android APK (.apk)
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Side Box */}
              <div className="xl:col-span-5 space-y-6">
                
                {activeAndroidTab === 'wifi' && (
                  <div className="bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                      <QrCode className="w-4 h-4 text-[#e52521]" />
                      Scan to Auto-Connect Android Wi-Fi
                    </div>

                    <div className="bg-[#18181c] p-4 rounded-2xl inline-block border border-neutral-700">
                      {wifiQrUrl ? (
                        <img src={wifiQrUrl} alt="Android Wi-Fi QR Code" className="w-56 h-56 rounded-xl mx-auto" />
                      ) : (
                        <div className="w-56 h-56 bg-neutral-900 rounded-xl flex items-center justify-center text-xs text-neutral-500 font-medium">
                          Enter SSID to generate QR
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Scan with Android Camera to auto-connect without typing passwords.
                    </p>
                  </div>
                )}

                {activeAndroidTab === 'dns' && (
                  <div className="bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                      <Settings className="w-5 h-5 text-[#e52521]" />
                      Android Settings Guide
                    </h3>

                    <ol className="list-decimal list-inside space-y-3 text-xs text-neutral-200 leading-relaxed font-medium">
                      <li>Open Android <strong className="text-white font-bold">Settings</strong> app.</li>
                      <li>Tap <strong className="text-white font-bold">Network & Internet</strong> (or Connections).</li>
                      <li>Tap <strong className="text-white font-bold">Private DNS</strong>.</li>
                      <li>Select <strong className="text-white font-bold">Private DNS provider hostname</strong>.</li>
                      <li>Paste copied hostname & tap <strong className="text-[#e52521] font-extrabold">Save</strong>.</li>
                    </ol>
                  </div>
                )}

                {(activeAndroidTab === 'pwa' || activeAndroidTab === 'apk') && (
                  <div className="bg-[#0e0e11] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      Android PWA vs APK
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      <strong>WebAPK (PWA)</strong> installs instantly without needing Google Play Store or APK permissions. It auto-updates whenever you update your website!
                    </p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>

      {/* iOS Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0d10] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-6 relative shadow-2xl">
            <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#e52521]" />
                <div>
                  <h3 className="font-extrabold text-white text-lg">Profile Download Triggered!</h3>
                  <p className="text-xs text-neutral-400">Complete installation on your iPhone</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-neutral-400 hover:text-white text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-neutral-200">
              <p>
                Safari will show a system popup asking: <br />
                <code className="text-amber-300 bg-black px-2.5 py-1.5 rounded-lg text-xs block mt-2 border border-neutral-800">
                  "This website is trying to download a configuration profile. Do you want to allow this?"
                </code>
              </p>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-neutral-300 leading-relaxed bg-[#16161a] p-4 rounded-xl border border-neutral-700 font-medium">
                <li>Tap <strong className="text-white">Allow</strong>.</li>
                <li>Go to iPhone <strong className="text-white">Settings</strong> home screen.</li>
                <li>Tap <strong className="text-white">Profile Downloaded</strong> near the top.</li>
                <li>Tap <strong className="text-white">Install</strong> in top right corner.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white font-extrabold py-3.5 rounded-xl transition text-sm shadow-lg shadow-red-950/60"
            >
              Got it, Done!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
