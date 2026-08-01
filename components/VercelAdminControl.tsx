import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Database, HardDrive, RefreshCw, CheckCircle2, 
  AlertCircle, Upload, Trash2, Shield, Activity, Radio, ToggleLeft, 
  ToggleRight, Play, FileText, ExternalLink, Globe, Layers
} from 'lucide-react';

interface EdgeConfigData {
  enable_ai_tools?: boolean;
  maintenance_mode?: boolean;
  announcement_banner?: string;
  max_file_upload_mb?: number;
  rate_limit_per_minute?: number;
  [key: string]: any;
}

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface Deployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  creator?: string;
}

const VercelAdminControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edge-config' | 'blob' | 'cron' | 'status'>('edge-config');

  // Edge Config State
  const [edgeConfig, setEdgeConfig] = useState<EdgeConfigData>({});
  const [edgeConfigConnected, setEdgeConfigConnected] = useState<boolean>(false);
  const [edgeLoading, setEdgeLoading] = useState<boolean>(true);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [edgeStatusMsg, setEdgeStatusMsg] = useState<string>('');

  // Blob Storage State
  const [blobs, setBlobs] = useState<BlobFile[]>([]);
  const [blobConnected, setBlobConnected] = useState<boolean>(false);
  const [blobLoading, setBlobLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [blobMsg, setBlobMsg] = useState<string>('');

  // Cron State
  const [cronRunning, setCronRunning] = useState<boolean>(false);
  const [cronLogs, setCronLogs] = useState<{ time: string; msg: string; status: 'ok' | 'error' }[]>([]);

  // Status State
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  // Fetch Edge Config
  const fetchEdgeConfig = async () => {
    setEdgeLoading(true);
    try {
      const res = await fetch('/api/vercel/edge-config');
      const data = await res.json();
      if (data.success) {
        setEdgeConfig(data.config || {});
        setEdgeConfigConnected(data.connected);
      } else {
        setEdgeConfigConnected(false);
      }
    } catch (err: any) {
      setEdgeConfigConnected(false);
    } finally {
      setEdgeLoading(false);
    }
  };

  // Fetch Blob Files
  const fetchBlobs = async () => {
    setBlobLoading(true);
    try {
      const res = await fetch('/api/vercel/blob');
      const data = await res.json();
      if (data.success) {
        setBlobs(data.blobs || []);
        setBlobConnected(data.connected);
      } else {
        setBlobConnected(false);
      }
    } catch (err: any) {
      setBlobConnected(false);
    } finally {
      setBlobLoading(false);
    }
  };

  // Fetch Vercel Status
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/vercel/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      setSystemStatus({ success: false, message: 'Could not connect to Vercel Status API' });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchEdgeConfig();
    fetchBlobs();
    fetchStatus();
  }, []);

  // Handle Edge Config item update
  const handleUpdateEdgeConfig = async (keyToUpdate: string, valueToUpdate: any) => {
    setEdgeStatusMsg(`Updating ${keyToUpdate}...`);
    try {
      const res = await fetch('/api/vercel/edge-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToUpdate, value: valueToUpdate })
      });
      const data = await res.json();
      if (data.success) {
        setEdgeConfig(prev => ({ ...prev, [keyToUpdate]: valueToUpdate }));
        setEdgeStatusMsg(`Successfully updated ${keyToUpdate}`);
      } else {
        setEdgeStatusMsg(`Notice: ${data.message}`);
      }
    } catch (err: any) {
      setEdgeStatusMsg(`Failed to update ${keyToUpdate}`);
    }
  };

  // Handle file upload to Vercel Blob
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setBlobMsg('Uploading file...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vercel/blob', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBlobMsg(`Uploaded ${file.name} successfully.`);
        fetchBlobs();
      } else {
        setBlobMsg(`Upload failed: ${data.message}`);
      }
    } catch (err: any) {
      setBlobMsg(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete file from Vercel Blob
  const handleDeleteBlob = async (url: string) => {
    if (!confirm('Are you sure you want to delete this file from Vercel Blob?')) return;
    try {
      const res = await fetch('/api/vercel/blob', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        setBlobs(prev => prev.filter(b => b.url !== url));
        setBlobMsg('File deleted successfully.');
      } else {
        setBlobMsg(`Delete failed: ${data.message}`);
      }
    } catch (err: any) {
      setBlobMsg(`Error deleting file`);
    }
  };

  // Trigger Cron Manual Execution
  const triggerCronJob = async () => {
    setCronRunning(true);
    try {
      const res = await fetch('/api/cron/cleanup');
      const data = await res.json();
      const now = new Date().toLocaleTimeString();
      if (data.success) {
        setCronLogs(prev => [
          { time: now, msg: `Cron triggered: ${data.message}`, status: 'ok' },
          ...prev
        ]);
      } else {
        setCronLogs(prev => [
          { time: now, msg: `Cron error: ${data.message || 'Execution failed'}`, status: 'error' },
          ...prev
        ]);
      }
    } catch (err: any) {
      const now = new Date().toLocaleTimeString();
      setCronLogs(prev => [
        { time: now, msg: `Network error triggering cron`, status: 'error' },
        ...prev
      ]);
    } finally {
      setCronRunning(false);
    }
  };

  return (
    <div className="w-full bg-white text-slate-800 p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm font-sans text-xs sm:text-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#e52521]/10 rounded-xl border border-[#e52521]/20">
            <Server className="w-5 h-5 text-[#e52521]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Vercel Infrastructure Control</h2>
            <p className="text-xs text-slate-500">Manage real-time Edge Config, Blob storage, Cron schedules, and environment status.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#e52521]" />
            {systemStatus?.environment?.region || 'Production Edge'}
          </span>
          <button 
            onClick={() => { fetchEdgeConfig(); fetchBlobs(); fetchStatus(); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('edge-config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'edge-config'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-[#e52521]" />
          Edge Config
        </button>

        <button
          onClick={() => setActiveTab('blob')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'blob'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4 text-[#e52521]" />
          Blob Storage ({blobs.length})
        </button>

        <button
          onClick={() => setActiveTab('cron')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'cron'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-[#e52521]" />
          Cron Schedules
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'status'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#e52521]" />
          System & Telemetry
        </button>
      </div>

      {/* Tab 1: Edge Config */}
      {activeTab === 'edge-config' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${edgeConfigConnected ? 'bg-emerald-500' : 'bg-[#e52521]'}`} />
              <span className="font-semibold text-slate-800">Connection Status:</span>
              <span className="text-slate-600">
                {edgeConfigConnected ? 'Connected to Vercel Edge Config' : 'EDGE_CONFIG Environment Variable Required'}
              </span>
            </div>
            {edgeStatusMsg && <span className="text-xs text-[#e52521] font-semibold">{edgeStatusMsg}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Live System Toggles */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live System Toggles</h3>
              
              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Enable AI Tools</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Global switch for AIAssistant & Converters</div>
                </div>
                <button
                  onClick={() => handleUpdateEdgeConfig('enable_ai_tools', !edgeConfig.enable_ai_tools)}
                  className="text-[#e52521] hover:opacity-80 transition-opacity"
                >
                  {edgeConfig.enable_ai_tools !== false ? (
                    <ToggleRight className="w-7 h-7 text-[#e52521]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Maintenance Mode</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Restrict site tools to administrators</div>
                </div>
                <button
                  onClick={() => handleUpdateEdgeConfig('maintenance_mode', !edgeConfig.maintenance_mode)}
                  className="text-[#e52521] hover:opacity-80 transition-opacity"
                >
                  {edgeConfig.maintenance_mode ? (
                    <ToggleRight className="w-7 h-7 text-[#e52521]" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Config Input Form */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Edge Key-Value</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Key Name</label>
                  <input
                    type="text"
                    placeholder="e.g. announcement_banner"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e52521] shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Value String</label>
                  <input
                    type="text"
                    placeholder="Value string or JSON payload"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e52521] shadow-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newKey) handleUpdateEdgeConfig(newKey, newValue);
                  }}
                  className="w-full bg-[#e52521] hover:bg-[#d01f1c] text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Update Edge Key-Value
                </button>
              </div>
            </div>
          </div>

          {/* Active Config JSON Viewer */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Current Live Read-Only State</h3>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 text-[11px] font-mono overflow-x-auto shadow-inner">
              {JSON.stringify(edgeConfig, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Blob Storage */}
      {activeTab === 'blob' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${blobConnected ? 'bg-emerald-500' : 'bg-[#e52521]'}`} />
              <span className="font-semibold text-slate-800">Vercel Blob Status:</span>
              <span className="text-slate-600">
                {blobConnected ? 'Active Connection' : 'BLOB_READ_WRITE_TOKEN required on Vercel'}
              </span>
            </div>

            <label className="inline-flex items-center gap-2 bg-[#e52521] hover:bg-[#d01f1c] text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {blobMsg && <div className="text-xs text-[#e52521] font-semibold">{blobMsg}</div>}

          {/* File List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">File Pathname</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Uploaded Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {blobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                      No files stored in Vercel Blob or BLOB_READ_WRITE_TOKEN is missing.
                    </td>
                  </tr>
                ) : (
                  blobs.map((blob) => (
                    <tr key={blob.url} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-xs text-slate-900 font-medium max-w-[220px] truncate">{blob.pathname}</td>
                      <td className="p-3.5 text-slate-500 font-medium">{(blob.size / 1024).toFixed(1)} KB</td>
                      <td className="p-3.5 text-slate-500 font-medium">{new Date(blob.uploadedAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <a
                          href={blob.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteBlob(blob.url)}
                          className="text-[#e52521] hover:text-red-700 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cron Schedules */}
      {activeTab === 'cron' && (
        <div className="space-y-5">
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vercel Cron Jobs (`vercel.json`)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated serverless cron jobs scheduled for file & session maintenance.</p>
              </div>

              <button
                onClick={triggerCronJob}
                disabled={cronRunning}
                className="flex items-center gap-2 bg-[#e52521] hover:bg-[#d01f1c] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" />
                <span>{cronRunning ? 'Triggering...' : 'Run Cleanup Cron'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="font-mono font-bold text-[#e52521]">/api/cron/cleanup</div>
                <div className="text-[11px] text-slate-500">Schedule: <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">0 0 * * *</code> (Daily Midnight)</div>
                <div className="text-[11px] text-slate-500 mt-1">Task: Temporary file purge & vault cache cleanup</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="font-mono font-bold text-[#e52521]">/api/keep-awake</div>
                <div className="text-[11px] text-slate-500">Schedule: <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">0 0 * * 1,4</code> (Mon, Thu)</div>
                <div className="text-[11px] text-slate-500 mt-1">Task: Warmup ping to prevent serverless cold starts</div>
              </div>
            </div>
          </div>

          {/* Cron Execution Logs */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Execution Log Output</h3>
            <div className="bg-slate-900 text-zinc-200 p-4 rounded-xl border border-slate-800 font-mono text-[11px] h-36 overflow-y-auto space-y-1.5 shadow-inner">
              {cronLogs.length === 0 ? (
                <div className="text-slate-500">No cron triggers executed in this session. Click "Run Cleanup Cron" above to test.</div>
              ) : (
                cronLogs.map((log, i) => (
                  <div key={i} className={`flex items-center gap-2 ${log.status === 'ok' ? 'text-emerald-400' : 'text-[#e52521]'}`}>
                    <span className="text-slate-500">[{log.time}]</span>
                    <span>{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System & Telemetry */}
      {activeTab === 'status' && (
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 text-[11px] font-medium">Runtime Host</div>
              <div className="font-bold text-slate-900 text-sm">{systemStatus?.environment?.isVercel ? 'Vercel Serverless' : 'Local Node.js'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 text-[11px] font-medium">Environment</div>
              <div className="font-bold text-[#e52521] uppercase text-sm">{systemStatus?.environment?.env || 'Development'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 text-[11px] font-medium">Git Commit SHA</div>
              <div className="font-mono font-bold text-slate-800 text-sm">{systemStatus?.environment?.gitCommitSha || 'Head'}</div>
            </div>
          </div>

          {/* Vercel API Deployments */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Vercel API Telemetry</h3>
            
            {systemStatus?.message && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-600 text-xs shadow-sm">
                {systemStatus.message}
              </div>
            )}

            {systemStatus?.deployments && systemStatus.deployments.length > 0 && (
              <div className="space-y-2">
                {systemStatus.deployments.map((d: Deployment) => (
                  <div key={d.uid} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${d.state === 'READY' ? 'bg-emerald-500' : 'bg-[#e52521]'}`} />
                      <span className="font-mono font-semibold text-slate-900">{d.name}</span>
                      <span className="text-slate-500">({d.state})</span>
                    </div>
                    <a
                      href={`https://${d.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#e52521] hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
                    >
                      {d.url}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VercelAdminControl;
