"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Send, Sparkles, Image as ImageIcon, Link as LinkIcon, Users, User, CheckCircle, AlertCircle, Loader2, RotateCcw, Trash2, Eye, Smartphone, Monitor, Code, Zap, FileUp, FolderPlus, X, ShieldCheck } from 'lucide-react';
import { uploadToCloudinary } from '@/services/cloudinary';
import { MediaPickerModal } from './AdminMediaAssets';
import { generateHtmlEmailTemplate } from '@/services/emailTemplates';

export interface EmailBroadcastPayload {
  id: string;
  subject: string;
  title: string;
  preheader?: string;
  message: string;
  bannerUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  themeColor?: string;
  recipientType: 'all' | 'specific';
  recipientCount: number;
  recipientsList?: string[];
  timestamp: number;
  status: string;
}

export default function AdminBulkMailer() {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [preheader, setPreheader] = useState('');
  const [message, setMessage] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Bishal Codes Now');
  const [buttonUrl, setButtonUrl] = useState('https://bishalcodes.com/');
  const [themeColor, setThemeColor] = useState('#e52521');

  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [specificEmails, setSpecificEmails] = useState('');

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'code'>('desktop');
  const [history, setHistory] = useState<EmailBroadcastPayload[]>([]);

  const presetTemplates = [
    {
      name: '🚀 File Transfer 1.0 Launch',
      subject: 'File Transfer 1.0 Native Released on Bishal Codes!',
      title: 'High-Speed Native P2P File Transfer is Live!',
      preheader: 'Send files up to 100GB instantly across devices with zero file compression.',
      message: "We are excited to announce the official release of File Transfer 1.0 on Bishal Codes.\n\nEnjoy lightning-fast peer-to-peer transfers, end-to-end encryption, and multi-file sharing without sign-up restrictions.",
      bannerUrl: 'https://bishalcodes.com/seo-images/file-transfer.png',
      buttonText: 'Try File Transfer Now',
      buttonUrl: 'https://bishalcodes.com/tools/file_transfer',
      themeColor: '#e52521'
    },
    {
      name: '📢 Tech Digest & System Update',
      subject: 'Monthly Tech Digest & Platform Improvements | Bishal Codes',
      title: 'Bishal Codes Platform Updates & New Utilities',
      preheader: 'Discover the latest developer APIs, screenshot tools, and system performance upgrades.',
      message: "Here is your monthly summary of all new tools and performance upgrades added to Bishal Codes Studio.\n\n• Enhanced AI Summarizer & OCR engine speed by 40%.\n• Expanded Developer API Hub with full-screen width dashboard.\n• Added high-resolution Website Screenshot Studio.",
      bannerUrl: 'https://bishalcodes.com/seo-images/dev-card-studio.png',
      buttonText: 'Read Full Developer Blog',
      buttonUrl: 'https://bishalcodes.com/blog',
      themeColor: '#2563eb'
    },
    {
      name: '⚡ Developer API Suite',
      subject: 'Free Commercial API Keys Released on Bishal Codes',
      title: 'Integrate Core Developer Utilities via REST API',
      preheader: 'Generate 100% free production API credentials with 50,000 monthly requests.',
      message: "You can now connect your applications directly to Bishal Codes utility APIs.\n\nAccess Website Screenshots, QR Code Generation, AI Document Summarization, OCR, JSON Formatters, and Currency Exchange endpoints with simple HTTP headers.",
      bannerUrl: 'https://bishalcodes.com/seo-images/ai-summarizer.png',
      buttonText: 'Get Free API Credentials',
      buttonUrl: 'https://bishalcodes.com/developers',
      themeColor: '#10b981'
    },
    {
      name: '🔐 Security & Zero-Knowledge Vault',
      subject: 'Security Upgrade: Zero-Knowledge AES-256 Vault Live',
      title: 'Secure File Locker & Client-Side Encryption',
      preheader: 'Protect sensitive files locally with password-derived AES-256-GCM encryption.',
      message: "Your privacy is our top priority. We have launched the Zero-Knowledge Secure File Locker on Bishal Codes.\n\nAll encryption occurs locally inside your browser memory before any data transmission. No plain text data or passwords ever touch our servers.",
      bannerUrl: 'https://bishalcodes.com/seo-images/secure-vault.png',
      buttonText: 'Open Secure Vault',
      buttonUrl: 'https://bishalcodes.com/tools/secure-vault',
      themeColor: '#8b5cf6'
    }
  ];

  useEffect(() => {
    fetchBroadcastHistory();
  }, []);

  const fetchBroadcastHistory = async () => {
    try {
      const res = await fetch('/api/v1/send-bulk-email', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.broadcasts)) {
          setHistory(data.broadcasts);
        }
      }
    } catch (err) {
      console.warn('Error fetching email broadcast history:', err);
    }
  };

  const handleApplyPreset = (preset: typeof presetTemplates[0]) => {
    setSubject(preset.subject);
    setTitle(preset.title);
    setPreheader(preset.preheader);
    setMessage(preset.message);
    setBannerUrl(preset.bannerUrl);
    setButtonText(preset.buttonText);
    setButtonUrl(preset.buttonUrl);
    setThemeColor(preset.themeColor);
    setSuccessMsg(`Preset template "${preset.name}" loaded into mailer composer!`);
    setErrorMsg(null);
  };

  const handleReuseHistoryItem = (item: EmailBroadcastPayload) => {
    setSubject(item.subject);
    setTitle(item.title);
    setPreheader(item.preheader || '');
    setMessage(item.message);
    setBannerUrl(item.bannerUrl || '');
    setButtonText(item.buttonText || 'Explore Bishal Codes Now');
    setButtonUrl(item.buttonUrl || 'https://bishalcodes.com/');
    setThemeColor(item.themeColor || '#e52521');
    setRecipientType(item.recipientType || 'all');
    setSuccessMsg(`Loaded past email campaign "${item.subject}" into composer!`);
    setErrorMsg(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      setErrorMsg(null);
      const res = await uploadToCloudinary(file);
      setBannerUrl(res.url);
      setSuccessMsg(`Custom email banner image uploaded to Cloudinary successfully! (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed uploading email banner to Cloudinary.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSendEmailBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim() || !message.trim()) {
      setErrorMsg('Please enter email subject, title, and message content.');
      return;
    }

    if (recipientType === 'specific' && !specificEmails.trim()) {
      setErrorMsg('Please enter at least one recipient email address.');
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/send-bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          title,
          preheader,
          message,
          bannerUrl,
          buttonText,
          buttonUrl,
          themeColor,
          recipientType,
          specificEmails,
          apiKey: 'BISHALCODES_API_KEY_LIVE_99812'
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Bulk Email Broadcast Sent Successfully! ${data.count} recipient(s) reached.`);
        fetchBroadcastHistory();
        setSubject('');
        setTitle('');
        setPreheader('');
        setMessage('');
        setBannerUrl('');
      } else {
        setErrorMsg(data.error || 'Failed to send bulk email broadcast.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error sending bulk email broadcast.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email campaign log from history?')) return;
    try {
      const res = await fetch(`/api/v1/send-bulk-email?id=${id}&apiKey=BISHALCODES_API_KEY_LIVE_99812`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(prev => prev.filter(h => h.id !== id));
        setSuccessMsg('Email campaign log deleted successfully.');
      } else {
        setErrorMsg(data.error || 'Failed deleting email campaign.');
      }
    } catch (err) {
      setErrorMsg('Error deleting email campaign log.');
    }
  };

  const liveHtml = generateHtmlEmailTemplate({
    title: title || 'Your Email Campaign Heading Title',
    preheader: preheader || 'Preview snippet text of your announcement email...',
    message: message || 'Enter your message body content here. Paragraphs and bullet points will format cleanly.',
    bannerUrl: bannerUrl || undefined,
    buttonText: buttonText || 'Explore Now',
    buttonUrl: buttonUrl || 'https://bishalcodes.com/',
    themeColor: themeColor || '#e52521'
  });

  return (
    <div className="space-y-6 text-left">
      {/* Sleek Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold uppercase tracking-wider mb-2">
            <Mail size={14} /> Global Email Broadcast Engine
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Bulk Mailer & Newsletter Center</h2>
          <p className="text-slate-400 text-xs mt-1">
            Send rich HTML emails, product announcements, & newsletters to all registered subscribers worldwide or targeted individuals.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-955 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
          <Send className="text-[#e52521]" size={20} />
          <div>
            <div className="text-white font-semibold text-xs">SMTP Dispatch Ready</div>
            <div className="text-slate-400 font-mono text-[10px]">HTML Responsive Templates Active</div>
          </div>
        </div>
      </div>

      {/* Preset Templates Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Zap size={13} className="text-[#e52521]" /> Quick Email Preset Templates (1-Click Fill)
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {presetTemplates.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-[#e52521]/10 text-slate-700 hover:text-[#e52521] border border-slate-200 hover:border-[#e52521]/30 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: 2-Column Split (Form Composer + Live HTML Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Email Composer Form (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="text-[#e52521]" size={18} /> Compose Email Campaign
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Preview Active
            </span>
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

          <form onSubmit={handleSendEmailBroadcast} className="space-y-4">
            
            {/* Recipient Selector */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="text-slate-800 text-xs font-bold uppercase tracking-wider block">Target Recipients</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'all'}
                    onChange={() => setRecipientType('all')}
                    className="accent-[#e52521]"
                  />
                  <Users size={14} className="text-[#e52521]" />
                  <span>Send to All Subscribers & Users</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'specific'}
                    onChange={() => setRecipientType('specific')}
                    className="accent-[#e52521]"
                  />
                  <User size={14} className="text-blue-600" />
                  <span>Specific Recipient(s)</span>
                </label>
              </div>

              {recipientType === 'specific' && (
                <div className="pt-2">
                  <textarea
                    value={specificEmails}
                    onChange={(e) => setSpecificEmails(e.target.value)}
                    placeholder="Enter email addresses (separated by commas or newlines e.g. client@domain.com, user2@gmail.com)..."
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#e52521] font-mono"
                  />
                </div>
              )}
            </div>

            {/* Email Subject Line */}
            <div className="space-y-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Email Subject Line *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. File Transfer 1.0 Native Released on Bishal Codes!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                required
              />
            </div>

            {/* Preheader & Heading Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Email Heading Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High-Speed Native P2P File Transfer is Live!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Preheader Text (Snippet)</label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="e.g. Send files up to 100GB instantly..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                />
              </div>
            </div>

            {/* Message Body Content */}
            <div className="space-y-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Message Body Content *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter email content body paragraphs. Separate paragraphs with blank lines..."
                rows={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521] resize-none leading-relaxed"
                required
              />
            </div>

            {/* Banner Image URL + Cloudinary / Media Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon size={13} className="text-[#e52521]" /> Banner Image (Direct Link or Cloudinary Upload)
                </label>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X size={11} /> Clear Banner
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="Paste image URL or pick from Cloudinary..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                />

                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-300 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <FolderPlus size={13} className="text-[#e52521]" /> Media
                </button>

                <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0 border border-slate-800">
                  {uploadingBanner ? (
                    <Loader2 className="animate-spin text-[#e52521]" size={13} />
                  ) : (
                    <FileUp size={13} className="text-[#e52521]" />
                  )}
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                </label>
              </div>

              <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelectMedia={(selectedUrl) => setBannerUrl(selectedUrl)}
              />
            </div>

            {/* CTA Button Text & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">CTA Button Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. Try File Transfer Now"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">CTA Button Target Link</label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://bishalcodes.com/tools/file_transfer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs focus:outline-none focus:border-[#e52521]"
                />
              </div>
            </div>

            {/* Theme Accent Color Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block">Theme Accent Color</label>
              <div className="flex items-center gap-3">
                {[
                  { name: 'Red', hex: '#e52521' },
                  { name: 'Royal Blue', hex: '#2563eb' },
                  { name: 'Emerald', hex: '#10b981' },
                  { name: 'Purple', hex: '#8b5cf6' },
                  { name: 'Amber', hex: '#f59e0b' }
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setThemeColor(c.hex)}
                    className={`w-7 h-7 rounded-full transition-all border-2 cursor-pointer ${
                      themeColor === c.hex ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Broadcasting Bulk Emails...
                </>
              ) : (
                <>
                  <Send size={16} /> Send Bulk Email Broadcast Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Interactive Email Preview (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Live HTML Email Template Preview</h3>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-1 bg-slate-955 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  previewMode === 'desktop' ? 'bg-[#e52521] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  previewMode === 'mobile' ? 'bg-[#e52521] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={12} /> Mobile
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('code')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  previewMode === 'code' ? 'bg-[#e52521] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code size={12} /> HTML
              </button>
            </div>
          </div>

          {/* Render Area */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[480px]">
            {previewMode === 'code' ? (
              <textarea
                readOnly
                value={liveHtml}
                className="w-full h-full min-h-[460px] bg-slate-955 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-emerald-400 leading-relaxed outline-none resize-none"
              />
            ) : (
              <div className={`transition-all duration-300 overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-white text-slate-900 ${
                previewMode === 'mobile' ? 'w-[360px] max-w-full' : 'w-full'
              }`}>
                <iframe
                  title="Live Email Template Preview"
                  srcDoc={liveHtml}
                  className="w-full h-[520px] border-none bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sent Email Broadcast History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Mail className="text-slate-600" size={16} /> Sent Email Campaigns ({history.length})
          </h3>
          <button
            type="button"
            onClick={fetchBroadcastHistory}
            className="text-[11px] font-bold text-[#e52521] hover:underline cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-150">
              <tr>
                <th className="p-3">Campaign Subject & Title</th>
                <th className="p-3">Recipients</th>
                <th className="p-3">CTA Link</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                    No sent email broadcasts found in database history.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{item.subject}</div>
                      <div className="text-slate-500 text-[11px] font-normal mt-0.5 line-clamp-1">{item.title}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                        {item.recipientType === 'specific' ? <User size={10} /> : <Users size={10} />}
                        {item.recipientCount} Recipient(s)
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                      {item.buttonUrl ? (
                        <a href={item.buttonUrl} target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
                          {item.buttonUrl}
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
                          title="Load this past campaign into composer to resend"
                        >
                          <RotateCcw size={11} /> Reuse
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Delete from database log"
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
