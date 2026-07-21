import React, { useState } from 'react';
import { X, Copy, Check, Code, ExternalLink, ShieldCheck } from 'lucide-react';

interface EmbedToolModalProps {
  toolId: string;
  toolName: string;
  isOpen: boolean;
  onClose: () => void;
}

const EmbedToolModal: React.FC<EmbedToolModalProps> = ({ toolId, toolName, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState('650');

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com';
  const embedUrl = `${origin}/tools/${toolId}?embed=true`;

  const embedCode = `<!-- Bishal Codes Embeddable Widget: ${toolName} | Powered by Bishal Codes © 2026 Bishal Mishra -->
<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" style="border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.06);" title="${toolName}"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Code size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Embed {toolName}
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Copy HTML iFrame Snippet for Website Integration
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>HTML iFrame Code Snippet</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-medium">Height:</span>
              <select
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] rounded px-2 py-0.5 outline-none font-medium text-slate-900 dark:text-white"
              >
                <option value="550">550px (Compact)</option>
                <option value="650">650px (Standard)</option>
                <option value="750">750px (Tall)</option>
              </select>
            </div>
          </div>

          <div className="relative bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 rounded-xl p-3.5 font-mono text-[11px] border border-slate-200 dark:border-slate-800 overflow-x-auto select-all">
            <pre className="whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">{embedCode}</pre>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={14} />
              Includes Copyright Attribution: Bishal Codes © 2026 Bishal Mishra
            </div>
            <button
              onClick={handleCopy}
              className="bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer border border-slate-800"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400 dark:text-white" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Embed Code
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target URL: <code className="font-mono text-emerald-600 dark:text-emerald-400">{embedUrl}</code></span>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 hover:underline"
          >
            Preview Embed <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedToolModal;
