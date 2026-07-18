import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, QrCode, Scan, Download, Upload, Copy, Check, Link as LinkIcon, Camera, Wifi, User, Globe, Trash2, CameraOff, Eye, EyeOff, Smartphone, KeyRound } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { SeoGuideSection } from './SeoGuideSection';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

export const QrCodeStudio: React.FC = () => {
  const { navigate } = useNavigation();

  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'scan'>('generate');

  // Generator State
  const [genType, setGenType] = useState<'text' | 'wifi' | 'vcard'>('text');
  const [textInput, setTextInput] = useState<string>('');
  
  // Wi-Fi inputs
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiSecurity, setWifiSecurity] = useState<string>('WPA');

  // vCard inputs
  const [vcName, setVcName] = useState<string>('');
  const [vcPhone, setVcPhone] = useState<string>('');
  const [vcEmail, setVcEmail] = useState<string>('');
  const [vcOrg, setVcOrg] = useState<string>('');
  const [vcUrl, setVcUrl] = useState<string>('');

  // Styles
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Scanner State
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [scanCopied, setScanCopied] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<'ssid' | 'password' | 'raw' | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopId = useRef<number | null>(null);
  const scannerActiveRef = useRef<boolean>(false);

  // Trigger QR generation
  useEffect(() => {
    if (activeSubTab !== 'generate' || !qrCanvasRef.current) return;

    let payload = '';
    if (genType === 'text') {
      payload = textInput.trim() || 'https://www.bishalcodes.com';
    } else if (genType === 'wifi') {
      if (wifiSsid) {
        payload = `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPassword};;`;
      } else {
        payload = 'WIFI:S:Example_SSID;T:WPA;P:password;;';
      }
    } else if (genType === 'vcard') {
      if (vcName) {
        payload = `BEGIN:VCARD\nVERSION:3.0\nN:${vcName};;;;\nFN:${vcName}\nORG:${vcOrg}\nTEL:${vcPhone}\nEMAIL:${vcEmail}\nURL:${vcUrl}\nEND:VCARD`;
      } else {
        payload = 'BEGIN:VCARD\nVERSION:3.0\nFN:Bishal Mishra\nEND:VCARD';
      }
    }

    const drawQR = async () => {
      try {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;

        // Draw basic QR code
        await QRCode.toCanvas(canvas, payload, {
          color: {
            dark: fgColor,
            light: bgColor
          },
          errorCorrectionLevel: 'H', // Heavy ECC so center logo doesn't break reading
          margin: 3,
          width: 320
        });

        // Overlay Logo if exists
        if (logoBase64) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              const logoSize = canvas.width * 0.22; // 22% size
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;
              
              // Clear behind the logo
              ctx.fillStyle = bgColor;
              ctx.fillRect(x - 3, y - 3, logoSize + 6, logoSize + 6);
              
              // Draw logo
              ctx.drawImage(img, x, y, logoSize, logoSize);
            };
            img.src = logoBase64;
          }
        }
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    };

    drawQR();
  }, [textInput, wifiSsid, wifiPassword, wifiSecurity, vcName, vcPhone, vcEmail, vcOrg, vcUrl, fgColor, bgColor, logoBase64, genType, activeSubTab]);

  // Handle Logo uploading
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Download Generated QR code
  const handleDownload = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qrcode_${genType}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Webcam scanning cycle
  const startScanner = async () => {
    setScanResult('');
    setScanError(null);
    setScannerActive(true);
    scannerActiveRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanLoopId.current = requestAnimationFrame(scanTick);
      }
    } catch (err: any) {
      console.error('Webcam fetch failed:', err);
      setScanError('Webcam access was denied or is unavailable. Check permissions.');
      setScannerActive(false);
      scannerActiveRef.current = false;
    }
  };

  const stopScanner = () => {
    setScannerActive(false);
    scannerActiveRef.current = false;
    if (scanLoopId.current) {
      cancelAnimationFrame(scanLoopId.current);
      scanLoopId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanTick = () => {
    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = scanCanvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (decoded) {
            setScanResult(decoded.data);
            
            // Audio feedback if available
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.12);
            } catch {}

            stopScanner();
            return;
          }
        }
      }
    }
    if (scannerActiveRef.current) {
      scanLoopId.current = requestAnimationFrame(scanTick);
    }
  };

  // Image Upload Scanner
  const handleImageScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      setScanError(null);
      setScanResult('');
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decoded = jsQR(imgData.data, imgData.width, imgData.height);
            if (decoded) {
              setScanResult(decoded.data);
            } else {
              setScanError('Could not decode QR code from this image. Ensure it is clear and well-lit.');
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerActive) stopScanner();
    };
  }, [scannerActive]);

  const copyToClipboard = (text: string, isScan: boolean) => {
    navigator.clipboard.writeText(text).then(() => {
      if (isScan) {
        setScanCopied(true);
        setTimeout(() => setScanCopied(false), 2000);
      } else {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    });
  };

  // Helper to parse standard Wi-Fi QR Codes (WIFI:S:ssid;T:WPA;P:password;;)
  const parseWifiQr = (text: string) => {
    if (!text.startsWith('WIFI:')) return null;
    const raw = text.substring(5);
    const result = {
      ssid: '',
      password: '',
      type: 'nopass',
      hidden: false
    };

    let currentKey = '';
    let currentValue = '';
    let escaped = false;
    
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if (escaped) {
        currentValue += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === ';') {
        if (currentKey && currentValue) {
          if (currentKey === 'S') result.ssid = currentValue;
          else if (currentKey === 'P') result.password = currentValue;
          else if (currentKey === 'T') result.type = currentValue;
          else if (currentKey === 'H') result.hidden = currentValue === 'true';
        }
        currentKey = '';
        currentValue = '';
      } else if (char === ':' && !currentKey) {
        currentKey = currentValue;
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // If no SSID was parsed but there is content, fall back to parsing by simple splits
    if (!result.ssid) {
      const parts = raw.split(';');
      parts.forEach(part => {
        const [k, v] = part.split(':');
        if (k === 'S') result.ssid = v;
        else if (k === 'P') result.password = v;
        else if (k === 'T') result.type = v;
        else if (k === 'H') result.hidden = v === 'true';
      });
    }

    return result.ssid ? result : null;
  };

  // Helper to check if the browser is on iOS
  const isIosDevice = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  };

  // Generate and download a iOS .mobileconfig profile to configure and auto-connect Wi-Fi
  const downloadMobileConfig = (ssid: string, password?: string, encryption: string = 'WPA') => {
    const uuid1 = '3A4B29BE-E708-410E-9040-' + Math.random().toString(16).substring(2, 14).toUpperCase();
    const uuid2 = '8F22A7F1-3DBC-4C7E-A89E-' + Math.random().toString(16).substring(2, 14).toUpperCase();
    
    const configXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadDisplayName</key>
    <string>Configure Wi-Fi: ${ssid}</string>
    <key>PayloadIdentifier</key>
    <string>com.bishalcodes.wifi.${ssid}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${uuid1}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>AutoJoin</key>
            <true/>
            <key>EncryptionType</key>
            <string>${encryption === 'nopass' ? 'None' : encryption}</string>
            <key>SSID_STR</key>
            <string>${ssid}</string>
            ${password ? `<key>Password</key><string>${password}</string>` : ''}
            <key>HIDDEN_NETWORK</key>
            <false/>
            <key>PayloadDisplayName</key>
            <string>Wi-Fi</string>
            <key>PayloadIdentifier</key>
            <string>com.apple.wifi.managed</string>
            <key>PayloadType</key>
            <string>com.apple.wifi.managed</string>
            <key>PayloadUUID</key>
            <string>${uuid2}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
</dict>
</plist>`;

    const blob = new Blob([configXml], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ssid.replace(/[^a-zA-Z0-9]/g, '_')}_wifi.mobileconfig`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyField = (text: string, field: 'ssid' | 'password' | 'raw') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleWifiConnect = (ssid: string, password?: string, encryption: string = 'WPA') => {
    if (password) {
      navigator.clipboard.writeText(password);
    }
    
    // If it's an iOS device, download the config profile
    if (isIosDevice()) {
      downloadMobileConfig(ssid, password, encryption);
    }
    
    setShowConnectionModal(true);
  };

  const isUrl = (val: string) => {
    try {
      const url = new URL(val);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Top Hero Section */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="w-full px-4 md:px-8 mx-auto">
          <div className="flex flex-col items-start gap-4">
            <button 
              onClick={() => { stopScanner(); navigate('services'); }}
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={13} />
              Back to Services
            </button>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading">
                QR Code Studio
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed max-w-3xl">
                Create customized QR codes (Wi-Fi access, VCards, links) with custom colors and logo inserts. Switch tabs to scan barcodes and QR Codes instantly using your web camera.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full px-4 md:px-8 py-8">
        
        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 max-w-md mx-auto">
          <button
            onClick={() => { stopScanner(); setActiveSubTab('generate'); }}
            className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'generate'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <QrCode size={16} />
            Generate QR
          </button>
          <button
            onClick={() => setActiveSubTab('scan')}
            className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'scan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            <Scan size={16} />
            Scan QR Code
          </button>
        </div>

        {activeSubTab === 'generate' ? (
          // GENERATOR WORKSPACE
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            
            {/* Input Config Panel (7 Columns) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
              
              <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setGenType('text')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    genType === 'text'
                      ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Globe size={13} />
                  Link & Text
                </button>
                <button
                  onClick={() => setGenType('wifi')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    genType === 'wifi'
                      ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Wifi size={13} />
                  Wi-Fi Credentials
                </button>
                <button
                  onClick={() => setGenType('vcard')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    genType === 'vcard'
                      ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <User size={13} />
                  VCard / Contact
                </button>
              </div>

              {/* Dynamic Sub-Forms */}
              {genType === 'text' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Text Content or Website URL</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter URL (e.g. https://www.google.com) or plain text..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 outline-none text-sm placeholder:text-slate-400 resize-none font-medium"
                  />
                </div>
              )}

              {genType === 'wifi' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Network Name (SSID)</label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        placeholder="e.g. Home_Network"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Network Password</label>
                      <input
                        type="password"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Security Encryption</label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold cursor-pointer"
                    >
                      <option value="WPA" className="dark:bg-slate-900">WPA/WPA2</option>
                      <option value="WEP" className="dark:bg-slate-900">WEP</option>
                      <option value="nopass" className="dark:bg-slate-900">No Password (Open)</option>
                    </select>
                  </div>
                </div>
              )}

              {genType === 'vcard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Full Name</label>
                      <input
                        type="text"
                        value={vcName}
                        onChange={(e) => setVcName(e.target.value)}
                        placeholder="Bishal Mishra"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Phone Number</label>
                      <input
                        type="text"
                        value={vcPhone}
                        onChange={(e) => setVcPhone(e.target.value)}
                        placeholder="+977-98XXXXXXXX"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Email Address</label>
                      <input
                        type="email"
                        value={vcEmail}
                        onChange={(e) => setVcEmail(e.target.value)}
                        placeholder="mail@bishalcodes.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Organization / Company</label>
                      <input
                        type="text"
                        value={vcOrg}
                        onChange={(e) => setVcOrg(e.target.value)}
                        placeholder="Web Architect"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Website URL</label>
                    <input
                      type="url"
                      value={vcUrl}
                      onChange={(e) => setVcUrl(e.target.value)}
                      placeholder="https://www.bishalcodes.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Design Customizations */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Aesthetic Customizer</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">QR Pattern Color</label>
                    <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 overflow-hidden"
                      />
                      <span className="text-[10px] font-bold uppercase font-mono">{fgColor}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Background Color</label>
                    <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 overflow-hidden"
                      />
                      <span className="text-[10px] font-bold uppercase font-mono">{bgColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Center Logo</label>
                    <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between px-3 py-1.5">
                      {logoBase64 ? (
                        <div className="flex items-center justify-between w-full">
                          <img src={logoBase64} alt="Uploaded logo" className="w-6 h-6 object-contain rounded-md" />
                          <button
                            onClick={() => setLogoBase64('')}
                            className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                            title="Remove logo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer text-indigo-500 hover:text-indigo-600 w-full py-1">
                          <Upload size={12} />
                          <span>Insert Logo</span>
                          <input
                            type="file"
                            onChange={handleLogoUpload}
                            accept="image/png, image/jpeg, image/jpg"
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Live Canvas Output Panel (5 Columns) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm space-y-6 min-h-[400px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800/80 w-full">
                Generated Code Output
              </h3>

              {/* Dynamic QR Render Zone */}
              <div className="p-4 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 relative">
                <canvas 
                  ref={qrCanvasRef} 
                  className="max-w-full rounded-lg shadow-md aspect-square w-64 h-64"
                />
              </div>

              {/* Actions */}
              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3 px-5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download size={16} />
                  Download QR Image (PNG)
                </button>
                
                <p className="text-[10px] text-slate-400 font-medium">
                  Designed at 512x512px with error correction padding. Suitable for printing.
                </p>
              </div>

            </div>

          </div>
        ) : (
          // SCANNER WORKSPACE
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Cam Frame Cover card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col items-center">
              
              <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Camera size={16} className="text-indigo-500" />
                  Live Camera Scanner
                </h3>
                
                {scannerActive ? (
                  <button
                    onClick={stopScanner}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <CameraOff size={14} />
                    Deactivate Camera
                  </button>
                ) : (
                  <button
                    onClick={startScanner}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-600 cursor-pointer"
                  >
                    <Camera size={14} />
                    Activate Camera
                  </button>
                )}
              </div>

              {/* Cam Canvas Box */}
              <div className="relative w-full max-w-md aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-250 dark:border-slate-800 flex items-center justify-center shadow-inner">
                
                {/* Hidden canvas for video pixel capture */}
                <canvas ref={scanCanvasRef} className="hidden" />

                {scannerActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      playsInline 
                    />
                    
                    {/* Scanner scan-line animation overlay */}
                    <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-md shadow-rose-500/50 animate-scan" />
                    
                    {/* Reticle guide overlay */}
                    <div className="absolute w-48 h-48 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-indigo-500 absolute top-0 left-0" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-500 absolute top-0 right-0" />
                      <div className="w-4 h-4 border-b-2 border-l-2 border-indigo-500 absolute bottom-0 left-0" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-indigo-500 absolute bottom-0 right-0" />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-500 dark:text-slate-400 space-y-4 p-8">
                    <CameraOff className="w-12 h-12 mx-auto stroke-[1.2] text-slate-400" />
                    <div>
                      <p className="text-xs font-bold">Camera is sleeping</p>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-xs mt-1">
                        Click the button above to start your webcam, or select a static image below to decode.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* File scan selector */}
              {!scannerActive && (
                <div className="mt-6 w-full pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer bg-slate-50 dark:bg-slate-950 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Upload size={14} />
                    <span>Upload Image to Decode</span>
                    <input
                      type="file"
                      onChange={handleImageScanUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
              )}

            </div>

            {/* Scan Error Display */}
            {scanError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-semibold leading-relaxed">
                {scanError}
              </div>
            )}

            {/* Scan Output Results */}
            {scanResult && (() => {
              const wifiData = parseWifiQr(scanResult);
              return (
                <div className="space-y-4">
                  {wifiData ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
                      
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Wifi size={20} className="animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              Wi-Fi Network Credentials Detected
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                              Encrypted Wireless Network Info
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                          {wifiData.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SSID Row */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[75px]">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Network Name (SSID)
                          </span>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                              {wifiData.ssid}
                            </span>
                            <button
                              onClick={() => handleCopyField(wifiData.ssid, 'ssid')}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                              title="Copy SSID"
                            >
                              {copiedField === 'ssid' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Password Row */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[75px]">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Network Password
                          </span>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                              {wifiData.password ? (showPassword ? wifiData.password : '••••••••••••') : 'No Password'}
                            </span>
                            <div className="flex gap-1">
                              {wifiData.password && (
                                <button
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                                  title={showPassword ? "Hide Password" : "Show Password"}
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              )}
                              <button
                                onClick={() => handleCopyField(wifiData.password || '', 'password')}
                                disabled={!wifiData.password}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
                                title="Copy Password Only"
                              >
                                {copiedField === 'password' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          onClick={() => handleWifiConnect(wifiData.ssid, wifiData.password, wifiData.type)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition cursor-pointer text-xs"
                        >
                          <Smartphone size={16} className="animate-bounce" />
                          <span>Connect to Network</span>
                        </button>
                      </div>

                      {/* Collapsible raw data */}
                      <details className="group/details mt-2">
                        <summary className="list-none flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider cursor-pointer py-1.5 select-none">
                          <span>Show Raw QR Data</span>
                          <span className="transition-transform group-open/details:rotate-180">▼</span>
                        </summary>
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl font-mono text-[10px] text-slate-500 break-all select-all">
                          {scanResult}
                        </div>
                      </details>

                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-2">
                        Scanned Result Data
                      </h4>
                      
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-200 whitespace-pre-wrap break-all min-h-[80px]">
                        {scanResult}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => copyToClipboard(scanResult, true)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                        >
                          {scanCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{scanCopied ? 'Copied Data!' : 'Copy Decoded Data'}</span>
                        </button>
                        
                        {isUrl(scanResult) && (
                          <a
                            href={scanResult}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-semibold py-2.5 rounded-xl text-center"
                          >
                            <LinkIcon size={14} />
                            <span>Open Link Address</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Wi-Fi Connection Instructions Modal overlay */}
                  {showConnectionModal && wifiData && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-scale-up">
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <Wifi size={24} className="animate-pulse" />
                          </div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">
                            Wi-Fi Connection Helper
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Follow steps below to connect to <strong className="text-slate-700 dark:text-slate-300 font-bold">{wifiData.ssid}</strong>
                          </p>
                        </div>

                        <div className="space-y-4">
                          {isIosDevice() ? (
                            <div className="space-y-3">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed">
                                iOS device detected! The configuration profile has been downloaded.
                              </div>
                              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                                  <p>Select <strong>Allow</strong> when Safari prompts you to download the configuration profile.</p>
                                </div>
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                                  <p>Open your iPhone or iPad's <strong>Settings</strong> app.</p>
                                </div>
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                                  <p>Tap on the <strong>Profile Downloaded</strong> banner at the top.</p>
                                </div>
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                                  <p>Tap <strong>Install</strong> in the top-right corner, enter your passcode, and install to configure and connect automatically!</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold leading-relaxed flex items-center gap-2">
                                <KeyRound size={16} className="shrink-0 text-indigo-500" />
                                <span>Password copied to clipboard!</span>
                              </div>
                              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                                  <p>Open your device's native <strong>Wi-Fi Settings</strong>.</p>
                                </div>
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                                  <p>Select the network named <strong>{wifiData.ssid}</strong>.</p>
                                </div>
                                <div className="flex gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                                  <p>Paste the password (<strong>{wifiData.password || '(No Password)'}</strong>) and tap <strong>Connect</strong>.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {isIosDevice() && (
                            <button
                              onClick={() => downloadMobileConfig(wifiData.ssid, wifiData.password, wifiData.type)}
                              className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 hover:text-slate-900 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              <Download size={14} />
                              <span>Re-download iOS Profile</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setShowConnectionModal(false)}
                          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
                        >
                          Got It, Connect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

      </div>

      <SeoGuideSection toolId="qr-studio" />

    </div>
  );
};

export default QrCodeStudio;
