import React, { useState, useEffect } from 'react';
import { Bell, Send, Link, FileUp, CheckCircle, AlertCircle, Loader2, Smartphone, Globe, Radio, ShieldCheck, RotateCcw, Sparkles, CornerDownLeft, Zap, Image as ImageIcon, X, FolderPlus, Trash2 } from 'lucide-react';
import { PushNotificationPayload } from '../types';
import { uploadToCloudinary } from '@/services/cloudinary';
import { MediaPickerModal } from './AdminMediaAssets';

export default function AdminPushNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('https://bishalcodes.com/tools/file_transfer');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'desktop' | 'ios' | 'android' | 'web'>('all');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  const [aiTitleSuggestion, setAiTitleSuggestion] = useState('');
  const [aiMsgSuggestion, setAiMsgSuggestion] = useState('');

  const titleDictionary: Record<string, string> = {
    'file': 'File Transfer 1.0 Native Released!',
    'app': 'App Update Available - Faster P2P & Bug Fixes',
    'new': 'New Feature Released: Try It Today on BishalCodes!',
    'sec': 'Security & Encryption Update - Zero Knowledge Vault',
    'nep': 'Nepali Desktop Calendar & Converter Updated!',
    'ai': 'AI Assistant Studio 2.0 Released on BishalCodes',
    'sys': 'System Maintenance Completed - All Services Active'
  };

  const messageDictionary: Record<string, string> = {
    'down': 'Download the official BishalCodes app for maximum speed, offline access, and security.',
    'check': 'Check out the latest tools and features live on BishalCodes.com today!',
    'try': 'Try out the new developer utilities, API keys, and instant file sharing features now.',
    'upd': 'Updated with performance improvements, bug fixes, and enhanced user interface.',
    'sec': 'Your files and data remain end-to-end encrypted with zero-knowledge AES-256.'
  };

  const presetTemplates = [
    {
      name: '🚀 File Transfer Release',
      title: 'File Transfer 1.0 Native Released!',
      message: 'Download the official Android P2P File Transfer app from bishalcodes.com.',
      actionUrl: 'https://bishalcodes.com/tools/file_transfer',
      fileUrl: 'https://bishalcodes.com/seo-images/file-transfer.png',
      targetAudience: 'all' as const
    },
    {
      name: '🔒 Secure Vault Update',
      title: 'Secure File Locker & Vault Live!',
      message: 'Encrypt files locally with zero-knowledge AES-256-GCM. Share password-protected links & QR codes.',
      actionUrl: 'https://bishalcodes.com/tools/secure-vault',
      fileUrl: '',
      targetAudience: 'all' as const
    },
    {
      name: '📅 Desktop Calendar App',
      title: 'Nepali Desktop Calendar Available!',
      message: 'Install the native Desktop Calendar app with live widgets and date converter.',
      actionUrl: 'https://bishalcodes.com/widgets/calendar',
      fileUrl: '',
      targetAudience: 'all' as const
    },
    {
      name: '⚡ Developer APIs & Tools',
      title: 'New Developer Utilities Added!',
      message: 'Explore AI Summarizer, Document OCR, JSON Formatter & Code Runner on BishalCodes.',
      actionUrl: 'https://bishalcodes.com/developers',
      fileUrl: '',
      targetAudience: 'web' as const
    }
  ];

  const [broadcastHistory, setBroadcastHistory] = useState<PushNotificationPayload[]>([
    {
      id: '1',
      title: 'File Transfer 1.0 Native Released!',
      message: 'Download the official Android P2P File Transfer app from bishalcodes.com.',
      actionUrl: 'https://bishalcodes.com/tools/file_transfer',
      fileUrl: 'https://bishalcodes.com/seo-images/file-transfer.png',
      targetAudience: 'all',
      timestamp: Date.now() - 3600000,
      status: 'sent'
    }
  ]);

  const fetchBroadcastHistory = async () => {
    try {
      const res = await fetch('/api/v1/push-notification', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setBroadcastHistory(data.notifications);
        }
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
  };

  const handleAdminDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this notification broadcast from the database and all user feeds?')) return;
    try {
      const res = await fetch(`/api/v1/push-notification?id=${id}&apiKey=BISHALCODES_API_KEY_LIVE_99812`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastHistory(prev => prev.filter(item => item.id !== id));
        setSuccessMsg(`Notification deleted permanently from server database.`);
      } else {
        setErrorMsg(data.error || 'Failed to delete notification.');
      }
    } catch (err: any) {
      setErrorMsg('Error deleting notification from server.');
    }
  };

  useEffect(() => {
    fetchBroadcastHistory();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  // AI Autocomplete listener for Title
  useEffect(() => {
    if (!title.trim()) {
      setAiTitleSuggestion('');
      return;
    }
    const lower = title.toLowerCase().trim();
    const key = Object.keys(titleDictionary).find(k => lower.startsWith(k));
    if (key && titleDictionary[key].toLowerCase() !== lower) {
      setAiTitleSuggestion(titleDictionary[key]);
    } else {
      setAiTitleSuggestion('');
    }
  }, [title]);

  // AI Autocomplete listener for Message
  useEffect(() => {
    if (!message.trim()) {
      setAiMsgSuggestion('');
      return;
    }
    const lower = message.toLowerCase().trim();
    const key = Object.keys(messageDictionary).find(k => lower.startsWith(k));
    if (key && messageDictionary[key].toLowerCase() !== lower) {
      setAiMsgSuggestion(messageDictionary[key]);
    } else {
      setAiMsgSuggestion('');
    }
  }, [message]);

  const handleApplyPreset = (preset: typeof presetTemplates[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setActionUrl(preset.actionUrl);
    setFileUrl(preset.fileUrl);
    setTargetAudience(preset.targetAudience);
    setSuccessMsg(`Preset template "${preset.name}" loaded into editor!`);
    setErrorMsg(null);
  };

  const handleReuseHistoryItem = (item: PushNotificationPayload) => {
    setTitle(item.title);
    setMessage(item.message);
    setActionUrl(item.actionUrl || 'https://bishalcodes.com');
    setFileUrl(item.fileUrl || '');
    setTargetAudience(item.targetAudience || 'all');
    setSuccessMsg(`Loaded past notification "${item.title}" into editor! Ready to resend.`);
    setErrorMsg(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && aiTitleSuggestion) {
      e.preventDefault();
      setTitle(aiTitleSuggestion);
      setAiTitleSuggestion('');
    }
  };

  const handleMsgKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && aiMsgSuggestion) {
      e.preventDefault();
      setMessage(aiMsgSuggestion);
      setAiMsgSuggestion('');
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      setErrorMsg(null);
      const res = await uploadToCloudinary(file);
      setFileUrl(res.url);
      setSuccessMsg(`Custom banner uploaded to Cloudinary successfully! (${(file.size / (1024 * 1024)).toFixed(1)}MB full quality)`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed uploading banner image to Cloudinary.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if ('pushManager' in reg) {
              const { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } = await import('@/services/pushConfig');
              let sub = await reg.pushManager.getSubscription();
              if (!sub) {
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource
                });
              }
              if (sub) {
                await fetch('/api/v1/push-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent })
                });
              }
            }
          }
          alert('System notifications & Web Push registered! You will now receive instant push banners worldwide even when app is closed.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setErrorMsg('Please enter notification title and message body.');
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/push-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          actionUrl,
          fileUrl,
          targetAudience,
          apiKey: 'BISHALCODES_API_KEY_LIVE_99812'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const stats = data.deliveryStats ? ` (${data.deliveryStats.successCount} Web Push endpoints delivered via APNs/FCM)` : '';
        setSuccessMsg(`Broadcast sent successfully to all connected Android, iOS PWA & Web clients!${stats}`);

        const newPayload: PushNotificationPayload = {
          id: Date.now().toString(),
          title,
          message,
          actionUrl,
          fileUrl,
          targetAudience,
          timestamp: Date.now(),
          status: 'sent'
        };
        fetchBroadcastHistory();
        setTitle('');
        setMessage('');
        setFileUrl('');
      } else {
        setErrorMsg(data.error || 'Failed to send broadcast');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error sending push notification broadcast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Sleek Top Banner (Light Theme) */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio size={14} /> Live Instant Push Notification Channel
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Push Notification Broadcast Center</h2>
          <p className="text-slate-600 text-xs mt-1">
            Broadcast real-time system alerts, updates, and file links directly to Android devices, iOS PWAs, & Web browsers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {permissionStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ShieldCheck size={16} /> Enable Device Notifications
            </button>
          )}

          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <Bell className="text-emerald-600" size={20} />
            <div>
              <div className="text-slate-900 font-bold text-xs">API Key Active</div>
              <div className="text-slate-500 font-mono text-[10px]">BISHALCODES_API_KEY_LIVE_99812</div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Send className="text-[#e52521]" size={18} /> Compose Push Notification
          </h3>

          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
            <Sparkles size={12} className="text-[#e52521]" />
            <span>AI Smart Type & Tab Autocomplete Active</span>
          </div>
        </div>

        {/* Quick Preset Templates */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={13} className="text-[#e52521]" /> Quick Preset Templates (1-Click Fill)
          </div>
          <div className="flex flex-wrap gap-2">
            {presetTemplates.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-[#e52521]/10 text-slate-700 hover:text-[#e52521] border border-slate-200 hover:border-[#e52521]/30 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-xs font-semibold">
            <AlertCircle size={16} className="text-red-600 shrink-0" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Notification Title *</label>
                {aiTitleSuggestion && (
                  <button
                    type="button"
                    onClick={() => { setTitle(aiTitleSuggestion); setAiTitleSuggestion(''); }}
                    className="text-[11px] font-bold text-[#e52521] hover:text-[#d01f1c] flex items-center gap-1 bg-[#e52521]/10 px-2 py-0.5 rounded border border-[#e52521]/20 cursor-pointer"
                  >
                    <Sparkles size={11} /> Press <kbd className="bg-white px-1 py-0.2 rounded border border-slate-200 text-[10px] font-mono text-slate-800">Tab</kbd> to complete
                  </button>
                )}
              </div>
              <input
                type="text"
                value={title}
                onKeyDown={handleTitleKeyDown}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. File Transfer App 1.0 Released!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
                required
              />
              {aiTitleSuggestion && (
                <div className="text-[11px] text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="truncate">AI Suggestion: <strong className="text-slate-900">{aiTitleSuggestion}</strong></span>
                  <button
                    type="button"
                    onClick={() => { setTitle(aiTitleSuggestion); setAiTitleSuggestion(''); }}
                    className="text-[#e52521] font-bold hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                  >
                    <CornerDownLeft size={11} /> Apply (Tab)
                  </button>
                </div>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
              >
                <option value="all">All Devices (Android Native + iOS PWA + Web)</option>
                <option value="android">Android Native App Only</option>
                <option value="web">Web & iOS PWA Subscribers Only</option>
              </select>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Message Content *</label>
              {aiMsgSuggestion && (
                <button
                  type="button"
                  onClick={() => { setMessage(aiMsgSuggestion); setAiMsgSuggestion(''); }}
                  className="text-[11px] font-bold text-[#e52521] hover:text-[#d01f1c] flex items-center gap-1 bg-[#e52521]/10 px-2 py-0.5 rounded border border-[#e52521]/20 cursor-pointer"
                >
                  <Sparkles size={11} /> Press <kbd className="bg-white px-1 py-0.2 rounded border border-slate-200 text-[10px] font-mono text-slate-800">Tab</kbd> to complete
                </button>
              )}
            </div>
            <textarea
              value={message}
              onKeyDown={handleMsgKeyDown}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Download the official P2P file transfer app for maximum speed and security."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors resize-none"
              required
            />
            {aiMsgSuggestion && (
              <div className="text-[11px] text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="truncate">AI Suggestion: <strong className="text-slate-900">{aiMsgSuggestion}</strong></span>
                <button
                  type="button"
                  onClick={() => { setMessage(aiMsgSuggestion); setAiMsgSuggestion(''); }}
                  className="text-[#e52521] font-bold hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                >
                  <CornerDownLeft size={11} /> Apply (Tab)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Action Link URL */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Link size={13} className="text-[#e52521]" /> Action Target URL
              </label>
              <input
                type="url"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://bishalcodes.com/tools/file_transfer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
              />
            </div>

            {/* Attached File or Image URL / Cloudinary Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon size={13} className="text-[#e52521]" /> Custom Banner / Image
                </label>
                {fileUrl && (
                  <button
                    type="button"
                    onClick={() => setFileUrl('')}
                    className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X size={11} /> Clear Banner
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Paste direct URL, pick from Media Library, or upload..."
                  className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="flex-1 sm:flex-none px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <FolderPlus size={14} className="text-[#e52521]" /> Media Library
                  </button>

                  <label className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-slate-800 whitespace-nowrap">
                    {uploadingBanner ? (
                      <>
                        <Loader2 className="animate-spin text-[#e52521]" size={14} /> Uploading...
                      </>
                    ) : (
                      <>
                        <FileUp size={14} className="text-[#e52521]" /> Upload
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*,.gif"
                      onChange={handleBannerFileUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Media Picker Modal */}
              <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelectMedia={(selectedUrl) => setFileUrl(selectedUrl)}
              />

              {fileUrl && (
                <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3">
                  <img src={fileUrl} alt="Banner Preview" className="w-16 h-12 object-cover rounded-lg border border-slate-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-800 truncate">Cloudinary Banner Active</div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">{fileUrl}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target Audience Selector (Microsoft Store Desktop, iOS, Android, Web) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={13} className="text-[#e52521]" /> Target Platform / App Audience
              </label>
              <span className="text-[11px] font-mono text-[#e52521] font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Key: BISHALCODES_API_KEY_LIVE_99812
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'all', label: 'All Platforms', icon: '🌐', desc: 'Desktop, iOS, Android, Web' },
                { id: 'desktop', label: 'Desktop App', icon: '🖥️', desc: 'Microsoft Store Windows' },
                { id: 'ios', label: 'iOS Calendar', icon: '🍎', desc: 'iPhone Safari & PWA' },
                { id: 'android', label: 'Android App', icon: '🤖', desc: 'Native APK & P2P' },
                { id: 'web', label: 'Web Browsers', icon: '💻', desc: 'Chrome, Edge, Safari' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTargetAudience(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    targetAudience === item.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-[#e52521]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] mt-1 line-clamp-1 ${targetAudience === item.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Broadcasting Notification...
              </>
            ) : (
              <>
                <Send size={16} /> Broadcast Push Notification Now
              </>
            )}
          </button>
        </form>
      </div>

      {/* Broadcast History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="text-slate-600" size={16} /> Sent Broadcast History ({broadcastHistory.length})
          </h3>
          <button
            type="button"
            onClick={fetchBroadcastHistory}
            className="text-[11px] font-bold text-[#e52521] hover:underline cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-3">
          {broadcastHistory.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-medium border border-slate-100 rounded-xl">
              No sent notifications found in database history.
            </div>
          ) : (
            broadcastHistory.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.fileUrl && (
                      <img src={item.fileUrl} alt="Banner" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{item.title}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{item.message}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[9px] font-bold shrink-0">
                    {item.targetAudience === 'android' ? <Smartphone size={9} /> : <Globe size={9} />}
                    {(item.targetAudience || 'all').toUpperCase()}
                  </span>
                </div>

                {item.actionUrl && (
                  <div className="text-[11px] font-mono text-blue-600 truncate border-t border-slate-200/60 pt-1.5">
                    <a href={item.actionUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {item.actionUrl}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                  <span suppressHydrationWarning>{new Date(item.timestamp).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReuseHistoryItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e52521]/10 text-[#e52521] border border-[#e52521]/30 rounded-lg text-[10px] font-bold"
                    >
                      <RotateCcw size={10} /> Reuse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminDeleteNotification(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-bold"
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th className="p-3">Notification</th>
                <th className="p-3">Audience</th>
                <th className="p-3">Action Link</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {broadcastHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                    No sent notifications found in database history.
                  </td>
                </tr>
              ) : (
                broadcastHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.fileUrl && (
                          <img src={item.fileUrl} alt="Banner" className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-slate-500 text-[11px] font-normal mt-0.5 line-clamp-1">{item.message}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                        {item.targetAudience === 'android' ? <Smartphone size={10} /> : <Globe size={10} />}
                        {(item.targetAudience || 'all').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                      {item.actionUrl ? (
                        <a href={item.actionUrl} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
                          {item.actionUrl}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-[11px] text-slate-400" suppressHydrationWarning>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleReuseHistoryItem(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e52521]/10 hover:bg-[#e52521]/20 text-[#e52521] border border-[#e52521]/30 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Load this past message into editor to resend"
                        >
                          <RotateCcw size={11} /> Reuse
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteNotification(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Delete from database and all device feeds"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
