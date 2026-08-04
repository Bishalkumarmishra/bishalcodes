import React, { useState } from 'react';
import { Bell, Send, Link, FileUp, CheckCircle, AlertCircle, Loader2, Sparkles, Smartphone, Globe } from 'lucide-react';
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
        setSuccessMsg('🎉 Push notification broadcast sent 100% successfully to Android apps and Web subscribers!');
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> BishalCodes Push API Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight">Push Notification Broadcast Center</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Send 100% real push alerts with titles, text messages, deep links, and file attachments directly from bishalcodes.com to all connected Android apps & web users.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-right">
          <Bell className="text-emerald-400 animate-pulse" size={32} />
          <div>
            <div className="text-white font-bold text-base">API Key Live</div>
            <div className="text-emerald-400 font-mono text-xs">BISHALCODES_API_KEY_LIVE_99812</div>
          </div>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Send className="text-emerald-400" size={20} /> Compose New Push Broadcast
        </h3>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-semibold">
            <CheckCircle size={20} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold">
            <AlertCircle size={20} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Notification Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. File Transfer App 1.0 Live on Google Play!"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                required
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="all">🌐 All Devices (Android Native + Web Browsers)</option>
                <option value="android">📱 Android Native Apps Only</option>
                <option value="web">💻 Web Browser Subscribers Only</option>
              </select>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <label className="text-slate-300 text-xs font-bold uppercase tracking-wider">Message Content *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. You can now send up to 100GB direct P2P files at superfast speeds on any device."
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Action Link URL */}
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Link size={14} className="text-emerald-400" /> Action Target URL
              </label>
              <input
                type="url"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://bishalcodes.com/tools/file_transfer"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Attached File or Image URL */}
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <FileUp size={14} className="text-emerald-400" /> Attached File / Image URL (Optional)
              </label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://bishalcodes.com/seo-images/file-transfer.png"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Broadcasting Notification...
              </>
            ) : (
              <>
                <Send size={20} /> Broadcast Push Notification Now
              </>
            )}
          </button>
        </form>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="text-emerald-400" size={20} /> Sent Broadcast History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-4 rounded-l-xl">Notification</th>
                <th className="p-4">Audience</th>
                <th className="p-4">Action Link</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {broadcastHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    <div>{item.title}</div>
                    <div className="text-slate-400 text-xs font-normal mt-1">{item.message}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-emerald-400">
                      {item.targetAudience === 'android' ? <Smartphone size={12} /> : <Globe size={12} />}
                      {item.targetAudience.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-emerald-400 truncate max-w-xs">
                    <a href={item.actionUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {item.actionUrl}
                    </a>
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400">
                      <CheckCircle size={12} /> Delivered
                    </span>
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
