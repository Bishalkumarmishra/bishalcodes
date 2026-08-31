import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle2, AlertCircle, Loader2, Send, Key, RefreshCw, Layers, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

const DEFAULT_SITE_PAGES = [
  'https://bishalcodes.com/',
  'https://bishalcodes.com/about',
  'https://bishalcodes.com/services',
  'https://bishalcodes.com/projects',
  'https://bishalcodes.com/experience',
  'https://bishalcodes.com/contact',
  'https://bishalcodes.com/blog',
  'https://bishalcodes.com/docs',
  'https://bishalcodes.com/tools/currency-converter',
  'https://bishalcodes.com/tools/date-converter',
  'https://bishalcodes.com/tools/translator',
  'https://bishalcodes.com/tools/ai-summarizer',
  'https://bishalcodes.com/tools/pdf-to-image',
  'https://bishalcodes.com/tools/pdf-to-word',
  'https://bishalcodes.com/tools/word-to-pdf',
  'https://bishalcodes.com/tools/excel-to-pdf',
  'https://bishalcodes.com/tools/pdf-to-excel',
  'https://bishalcodes.com/tools/split-pdf',
  'https://bishalcodes.com/tools/edit-pdf',
  'https://bishalcodes.com/tools/dev-card-studio',
  'https://bishalcodes.com/tools/add-page-numbers',
  'https://bishalcodes.com/tools/merge-pdf',
  'https://bishalcodes.com/tools/jpg-to-pdf',
  'https://bishalcodes.com/tools/image-compressor',
  'https://bishalcodes.com/tools/emi-calculator',
  'https://bishalcodes.com/tools/qr-studio',
  'https://bishalcodes.com/tools/json-formatter',
  'https://bishalcodes.com/tools/diff-checker',
  'https://bishalcodes.com/tools/code-runner',
  'https://bishalcodes.com/tools/screenshot-studio',
  'https://bishalcodes.com/tools/file-transfer',
  'https://bishalcodes.com/tools/secure-vault',
  'https://bishalcodes.com/tools/ocr-converter',
  'https://bishalcodes.com/tools/bg-remover',
  'https://bishalcodes.com/tools/scan-pdf',
  'https://bishalcodes.com/tools/typing-practice',
  'https://bishalcodes.com/tools/font-downloader',
];

interface LogEntry {
  url: string;
  success: boolean;
  status: number;
  message: string;
  time: string;
}

export default function GscAdminControl() {
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>(DEFAULT_SITE_PAGES);
  const [loading, setLoading] = useState(false);
  const [testingAuth, setTestingAuth] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Load saved credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('gsc_client_email') || '';
      const savedKey = localStorage.getItem('gsc_private_key') || '';
      setClientEmail(savedEmail);
      setPrivateKey(savedKey);

      const savedLogs = localStorage.getItem('gsc_submission_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch {}
      }
    }
  }, []);

  const saveCredentials = (email: string, key: string) => {
    setClientEmail(email);
    setPrivateKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gsc_client_email', email);
      localStorage.setItem('gsc_private_key', key);
    }
  };

  const handleTestCredentials = async () => {
    setTestingAuth(true);
    setAuthStatus(null);
    try {
      const res = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_credentials',
          credentials: clientEmail && privateKey ? { client_email: clientEmail, private_key: privateKey } : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthStatus({ success: true, message: `Connected! Service Account: ${data.client_email}` });
      } else {
        setAuthStatus({ success: false, message: data.error || 'Authentication failed' });
      }
    } catch (err: any) {
      setAuthStatus({ success: false, message: err.message || 'Connection error' });
    } finally {
      setTestingAuth(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(DEFAULT_SITE_PAGES);
    } else {
      setSelectedPages([]);
    }
  };

  const handleTogglePage = (url: string) => {
    setSelectedPages((prev) =>
      prev.includes(url) ? prev.filter((p) => p !== url) : [...prev, url]
    );
  };

  const addLogEntries = (newEntries: LogEntry[]) => {
    setLogs((prev) => {
      const updated = [...newEntries, ...prev].slice(0, 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gsc_submission_logs', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSubmitCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let targetUrl = customUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_url',
          url: targetUrl,
          credentials: clientEmail && privateKey ? { client_email: clientEmail, private_key: privateKey } : undefined,
        }),
      });

      const data = await res.json();
      const time = new Date().toLocaleTimeString();

      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        addLogEntries([
          {
            url: item.url,
            success: item.success,
            status: item.status,
            message: item.success ? 'Notification Published (200 OK)' : item.error || 'Failed',
            time,
          },
        ]);
      } else {
        addLogEntries([
          {
            url: targetUrl,
            success: false,
            status: res.status,
            message: data.error || 'Failed to submit',
            time,
          },
        ]);
      }

      setCustomUrl('');
    } catch (err: any) {
      addLogEntries([
        {
          url: targetUrl,
          success: false,
          status: 500,
          message: err.message || 'Network error',
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSelectedBatch = async () => {
    if (selectedPages.length === 0) {
      alert('Please select at least one URL to submit.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_publish',
          urls: selectedPages,
          credentials: clientEmail && privateKey ? { client_email: clientEmail, private_key: privateKey } : undefined,
        }),
      });

      const data = await res.json();
      const time = new Date().toLocaleTimeString();

      if (data.results && Array.isArray(data.results)) {
        const newEntries: LogEntry[] = data.results.map((r: any) => ({
          url: r.url,
          success: r.success,
          status: r.status,
          message: r.success ? 'URL_UPDATED Notification Sent' : r.error || 'Error',
          time,
        }));
        addLogEntries(newEntries);
      } else {
        alert(data.error || 'Batch submission failed.');
      }
    } catch (err: any) {
      alert('Batch indexing error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm w-full space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="text-[#e52521]" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Google Search Console & Indexing API</h2>
          </div>
          <p className="text-slate-500 text-xs font-normal">
            Submit site URLs directly to Google's Indexing API (`URL_UPDATED`) to trigger instant crawl requests.
          </p>
        </div>

        <button
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0"
        >
          <HelpCircle size={15} />
          {showSetupGuide ? 'Hide Setup Guide' : 'Google Cloud Setup Guide'}
        </button>
      </div>

      {/* Setup Guide Drawer */}
      {showSetupGuide && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl space-y-4 text-xs font-normal border border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck size={18} />
            How to Set Up Google Indexing Service Account (Free)
          </div>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
            <li>
              Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-amber-400 underline">Google Cloud Console</a> and create or select your project (`bishal-mishra-3c559` or similar).
            </li>
            <li>
              Enable the <strong>Web Search Indexing API</strong> from <strong>APIs & Services &gt; Library</strong>.
            </li>
            <li>
              Create a <strong>Service Account</strong> under <strong>IAM & Admin &gt; Service Accounts</strong>, then generate a new <strong>JSON Key</strong>.
            </li>
            <li>
              Open Google Search Console, go to <strong>Settings &gt; Users and permissions</strong>, and add your Service Account's email (e.g. `something@project.iam.gserviceaccount.com`) as an <strong>Owner</strong>.
            </li>
            <li>
              Paste the `client_email` and `private_key` into the Credential settings below or set `GSC_SERVICE_ACCOUNT_KEY` environment variable in Vercel.
            </li>
          </ol>
        </div>
      )}

      {/* Credentials Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="text-slate-700" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Service Account Credentials</h3>
          </div>
          {authStatus && (
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${authStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
              {authStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {authStatus.message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Service Account Email (`client_email`)</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => saveCredentials(e.target.value, privateKey)}
              placeholder="my-service-account@project.iam.gserviceaccount.com"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-950 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Private Key (`private_key` RSA PEM)</label>
            <textarea
              value={privateKey}
              onChange={(e) => saveCredentials(clientEmail, e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAAS..."
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-950 font-mono resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestCredentials}
            disabled={testingAuth}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {testingAuth ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Test Credentials Connection
          </button>
          <span className="text-[11px] text-slate-400">Credentials are stored locally in your browser session for security.</span>
        </div>
      </div>

      {/* Single Custom URL Submission */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Send size={15} className="text-[#e52521]" /> Single URL Submission
        </h3>

        <form onSubmit={handleSubmitCustomUrl} className="flex gap-2">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://bishalcodes.com/blog/my-new-post"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-950 font-mono"
          />
          <button
            type="submit"
            disabled={loading || !customUrl.trim()}
            className="px-5 py-2.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50 shrink-0 shadow-sm"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publish URL
          </button>
        </form>
      </div>

      {/* Batch Page Indexing */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers size={15} className="text-slate-700" /> Batch Submit Site Pages ({selectedPages.length}/{DEFAULT_SITE_PAGES.length} selected)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Select all core site routes to dispatch indexing update notifications to Google.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedPages.length === DEFAULT_SITE_PAGES.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-slate-300 text-[#e52521] focus:ring-0"
              />
              Select All ({DEFAULT_SITE_PAGES.length})
            </label>

            <button
              onClick={handleSubmitSelectedBatch}
              disabled={loading || selectedPages.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              Submit Selected ({selectedPages.length})
            </button>
          </div>
        </div>

        {/* Page List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar p-1 bg-slate-50 border border-slate-200/70 rounded-2xl">
          {DEFAULT_SITE_PAGES.map((url) => {
            const isSelected = selectedPages.includes(url);
            const path = url.replace('https://bishalcodes.com', '') || '/';
            return (
              <label
                key={url}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected ? 'bg-white border-slate-950 text-slate-900 font-semibold shadow-xs' : 'bg-slate-100/60 border-slate-200/60 text-slate-500 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTogglePage(url)}
                    className="rounded border-slate-300 text-[#e52521] focus:ring-0 shrink-0"
                  />
                  <span className="font-mono text-[11px] truncate">{path}</span>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-400 hover:text-slate-900 shrink-0"
                  title="Open live page"
                >
                  <ExternalLink size={12} />
                </a>
              </label>
            );
          })}
        </div>
      </div>

      {/* Live Submission Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Submission Logs ({logs.length})</h3>
          {logs.length > 0 && (
            <button
              onClick={() => {
                setLogs([]);
                if (typeof window !== 'undefined') localStorage.removeItem('gsc_submission_logs');
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline"
            >
              Clear Logs
            </button>
          )}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No submissions recorded yet. Use the controls above to send URL indexing requests to Google.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-150">
                  <th className="p-3">Status</th>
                  <th className="p-3">Target URL</th>
                  <th className="p-3">Response Message</th>
                  <th className="p-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                          log.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.success ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                        {log.status || (log.success ? 200 : 400)}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] font-medium text-slate-900 max-w-xs truncate">{log.url}</td>
                    <td className="p-3 text-slate-600 max-w-md truncate">{log.message}</td>
                    <td className="p-3 text-right font-mono text-[10px] text-slate-400">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
