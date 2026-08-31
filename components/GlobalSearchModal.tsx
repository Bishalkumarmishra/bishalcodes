"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Sparkles, FileText, Terminal, Code, Calendar, Lock, Zap, BookOpen, User, Briefcase, Mail, Shield, X } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { PathPage } from '../types';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: 'Tools' | 'Pages' | 'Docs' | 'APIs' | 'Blog';
  target: PathPage | string;
  icon: React.ReactNode;
  tags?: string[];
}

const SEARCH_INDEX: SearchItem[] = [
  // Developer Tools
  {
    id: 'tool-file-transfer',
    title: 'Fast P2P File Transfer 1.0',
    description: 'Instant zero-server WebRTC peer-to-peer file sharing up to 10GB with encryption.',
    category: 'Tools',
    target: 'transfer',
    icon: <Zap size={16} className="text-[#e52521]" />,
    tags: ['share', 'p2p', 'webrtc', 'upload', 'files', 'fast']
  },
  {
    id: 'tool-secure-vault',
    title: 'Secure File Locker & Vault',
    description: 'Client-side zero-knowledge AES-256-GCM encrypted file storage & password links.',
    category: 'Tools',
    target: 'vault',
    icon: <Lock size={16} className="text-emerald-400" />,
    tags: ['encrypt', 'password', 'vault', 'privacy', 'secret']
  },
  {
    id: 'tool-[#e52521]',
    title: 'Document OCR Scanner',
    description: 'Extract text instantly from images and PDF documents using AI browser OCR.',
    category: 'Tools',
    target: 'services',
    icon: <FileText size={16} className="text-amber-400" />,
    tags: ['ocr', 'text', 'pdf', 'image', 'scan']
  },
  {
    id: 'tool-ai-summarizer',
    title: 'AI Document Summarizer',
    description: 'Summarize long articles, PDFs, and code files with Gemini AI Intelligence.',
    category: 'Tools',
    target: 'ai-studio',
    icon: <Sparkles size={16} className="text-rose-400" />,
    tags: ['ai', 'summary', 'gemini', 'pdf', 'article']
  },
  {
    id: 'tool-nepali-calendar',
    title: 'Nepali Desktop Calendar & Converter',
    description: 'BS to AD date converter with live official holiday widgets.',
    category: 'Tools',
    target: 'widget-calendar',
    icon: <Calendar size={16} className="text-blue-400" />,
    tags: ['nepali', 'calendar', 'date', 'bs', 'ad', 'converter']
  },
  {
    id: 'tool-embed-widgets',
    title: 'Embed Widgets Collection',
    description: 'Custom React & HTML embeddable widgets for websites and dashboards.',
    category: 'Tools',
    target: 'widgets',
    icon: <Code size={16} className="text-purple-400" />,
    tags: ['widgets', 'embed', 'component', 'code']
  },

  // Main Pages
  {
    id: 'page-home',
    title: 'Home / Overview',
    description: 'BishalCodes portfolio overview, recent projects, and featured utilities.',
    category: 'Pages',
    target: 'home',
    icon: <User size={16} className="text-slate-300" />,
    tags: ['main', 'landing', 'bishal', 'mishra']
  },
  {
    id: 'page-creator',
    title: 'About Creator (Bishal Mishra)',
    description: 'Full-stack software engineer background, experience, and tech stack.',
    category: 'Pages',
    target: 'about',
    icon: <User size={16} className="text-slate-300" />,
    tags: ['bio', 'resume', 'skills', 'experience']
  },
  {
    id: 'page-projects',
    title: 'Project Showcase',
    description: 'Explore shipped enterprise mobile apps, web systems, and desktop utilities.',
    category: 'Pages',
    target: 'projects',
    icon: <Briefcase size={16} className="text-slate-300" />,
    tags: ['work', 'portfolio', 'apps', 'android', 'ios']
  },
  {
    id: 'page-[#e52521]',
    title: 'Developer APIs & Portal',
    description: 'REST API documentation, rate limits, and API key management.',
    category: 'APIs',
    target: 'developers',
    icon: <Terminal size={16} className="text-[#e52521]" />,
    tags: ['api', 'keys', 'rest', 'developer', 'endpoint']
  },
  {
    id: 'page-docs',
    title: 'Documentation & Guides',
    description: 'Integration docs for file transfer, secure vault, and desktop calendar.',
    category: 'Docs',
    target: 'docs',
    icon: <BookOpen size={16} className="text-amber-400" />,
    tags: ['docs', 'help', 'guide', 'manual']
  },
  {
    id: 'page-blog',
    title: 'Developer Blog & Insights',
    description: 'Articles on full-stack architecture, WebRTC, PWA, and security.',
    category: 'Blog',
    target: 'blog',
    icon: <FileText size={16} className="text-[#e52521]" />,
    tags: ['blog', 'articles', 'news', 'tutorials']
  },
  {
    id: 'page-contact',
    title: 'Get In Touch / Hire Me',
    description: 'Direct contact form, WhatsApp, email, and social links.',
    category: 'Pages',
    target: 'contact',
    icon: <Mail size={16} className="text-[#e52521]" />,
    tags: ['contact', 'email', 'whatsapp', 'hire']
  }
];

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { navigate } = useNavigation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent('open_global_search'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered Results
  const filteredResults = SEARCH_INDEX.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  // Autocomplete Suggestions
  const suggestions = query.trim() ? Array.from(new Set(
    filteredResults.flatMap(r => r.tags || []).filter(t => t.toLowerCase().includes(query.toLowerCase()))
  )).slice(0, 5) : ['file transfer', 'secure vault', 'nepali calendar', 'api keys', 'blog'];

  const handleSelect = (item: SearchItem) => {
    if (typeof item.target === 'string' && item.target.startsWith('http')) {
      window.open(item.target, '_blank');
    } else {
      navigate(item.target as PathPage);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 md:pt-24 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search size={20} className="text-[#e52521] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, docs, blogs, APIs & utilities... (Press Esc to exit)"
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <Command size={11} /> <span>K</span>
          </div>
        </div>

        {/* Instant Suggestions Bar */}
        <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
            <Zap size={11} className="text-[#e52521]" /> Suggested:
          </span>
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => setQuery(sug)}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-[#e52521]/20 text-slate-700 dark:text-slate-300 hover:text-[#e52521] border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-200 dark:divide-slate-800/50 flex-1 space-y-1">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching tools, blogs, or docs found for "<strong className="text-slate-800 dark:text-slate-300">{query}</strong>"
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#e52521]/10 dark:bg-[#e52521]/15 border border-[#e52521]/40 text-slate-900 dark:text-white' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded text-[9px] font-semibold uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-[#e52521]' : 'text-slate-400 dark:text-slate-600'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Use <kbd className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">↓</kbd> to navigate</span>
          <span>Press <kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
