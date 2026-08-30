import React, { useState, useEffect } from 'react';
import { Bell, Send, Link, FileUp, CheckCircle, AlertCircle, Loader2, Smartphone, Globe, Radio, ShieldCheck } from 'lucide-react';
import { PushNotificationPayload } from '../types';

export default function AdminPushNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('https://bishalcodes.com/tools/file_transfer');
  const [fileUrl, setFileUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'android' | 'web'>('all');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  const [broadcastHistory, setBroadcastHistory] = useState<PushNotificationPayload[]>([
    {
      id: '1',
      title: 'File Transfer 1.0 Native Released!',
      message: 'Download the official Android P2P File Transfer app from bishalcodes.com.',
      actionUrl: 'https://bishalcodes.com/tools/file_transfer',
      targetAudience: 'all',
      timestamp: Date.now() - 3600000,
      status: 'sent'
    }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          alert('System notifications granted! You will now receive instant push banners.');
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
        setSuccessMsg('Broadcast sent successfully to all connected Android, iOS PWA & Web clients!');
        
        // Trigger local notification test
        if ('Notification' in window && Notification.permission === 'granted') {
          const options = {
            body: message,
            icon: '/apple-touch-icon.png',
            badge: '/favicon.svg',
            image: fileUrl || undefined,
            data: { url: actionUrl || '/' },
            vibrate: [200, 100, 200],
            tag: 'broadcast-' + Date.now(),
            renotify: true,
            requireInteraction: true
          };

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, options);
            }).catch(() => {
              new Notification(title, options);
            });
          } else {
            new Notification(title, options);
          }
        }

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
        setBroadcastHistory([newPayload, ...broadcastHistory]);
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
      {/* Sleek Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold uppercase tracking-wider mb-2">
            <Radio size={14} /> Live Instant Push Notification Channel
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Push Notification Broadcast Center</h2>
          <p className="text-slate-400 text-xs mt-1">
            Broadcast real-time system alerts, updates, and file links directly to Android devices, iOS PWAs, & Web browsers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {permissionStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ShieldCheck size={16} /> Enable Device Notifications
            </button>
          )}

          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
            <Bell className="text-emerald-400" size={20} />
            <div>
              <div className="text-white font-semibold text-xs">API Key Active</div>
              <div className="text-slate-400 font-mono text-[10px]">BISHALCODES_API_KEY_LIVE_99812</div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Send className="text-[#e52521]" size={18} /> Compose Push Notification
        </h3>

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

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Notification Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. File Transfer App 1.0 Released!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
                required
              />
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
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Message Content *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Download the official P2P file transfer app for maximum speed and security."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors resize-none"
              required
            />
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

            {/* Attached File or Image URL */}
            <div className="space-y-1.5">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <FileUp size={13} className="text-[#e52521]" /> Attachment File / Image URL (Optional)
              </label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://bishalcodes.com/seo-images/file-transfer.png"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#e52521] transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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

      {/* Broadcast History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="text-slate-600" size={16} /> Sent Broadcast History
        </h3>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th className="p-3">Notification</th>
                <th className="p-3">Audience</th>
                <th className="p-3">Action Link</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {broadcastHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium text-slate-900">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-slate-500 text-[11px] font-normal mt-0.5">{item.message}</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {item.targetAudience === 'android' ? <Smartphone size={10} /> : <Globe size={10} />}
                      {item.targetAudience.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                    <a href={item.actionUrl} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
                      {item.actionUrl}
                    </a>
                  </td>
                  <td className="p-3 text-[11px] text-slate-400" suppressHydrationWarning>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-600 flex items-center justify-end gap-1">
                    <CheckCircle size={12} /> Sent
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
