import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../sections/Navbar';
import DateConverter from '../components/DateConverter';
import LanguageTranslator from '../components/LanguageTranslator';
import CurrencyConverter from '../components/CurrencyConverter';
import JpgToPdfConverter from '../components/JpgToPdfConverter';
import PdfMerger from '../components/PdfMerger';
import PdfPageNumberAdder from '../components/PdfPageNumberAdder';
import PdfToImageConverter from '../components/PdfToImageConverter';
import AiSummarizer from '../components/AiSummarizer';
import ImageCompressor from '../components/ImageCompressor';
import EmiCalculator from '../components/EmiCalculator';
import QrCodeStudio from '../components/QrCodeStudio';
import JsonFormatter from '../components/JsonFormatter';
import DiffChecker from '../components/DiffChecker';
import CodeRunner from '../components/CodeRunner';
import FileTransfer from '../components/FileTransfer';
import ScreenshotStudio from '../components/ScreenshotStudio';
import SecureVault from '../components/SecureVault';
import DeveloperCardStudio from '../components/DeveloperCardStudio';
import FontDownloader from '../components/FontDownloader';
import AiOcrConverter from '../components/AiOcrConverter';
import BgRemover from '../components/BgRemover';
import DocScanner from '../components/DocScanner';
import Footer from '../sections/Footer';
import { useNavigation } from '../context/NavigationContext';
import { ArrowRight, Loader2, Star, Pin } from 'lucide-react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ServiceTool } from '../types';

const FAVOURITES_KEY = 'bishal_pinned_tools';

const toolSeoData: Record<string, { title: string; desc: string; keywords: string[] }> = {
  'dev-card-studio': {
    title: 'Developer Card & OG Image Banner Studio',
    desc: 'Design customized developer profile cards and OpenGraph preview banners. Export as PNG images or copyable SVG/React vector markups.',
    keywords: ['developer card', 'og image generator', 'profile banner builder', 'svg mockup', 'portfolio utility']
  },
  'secure-vault': {
    title: 'Secure Vault - Zero-Knowledge File Encryption',
    desc: 'Encrypt and protect files (images, PDFs, documents) locally with AES-256 encryption. Secure download link or QR code generation with zero server-side passwords.',
    keywords: ['file encryption', 'aes-256-gcm', 'secure vault', 'zero-knowledge storage', 'password protect file']
  },
  'file-transfer': {
    title: 'Fast P2P File Transfer (Up to 100 GB)',
    desc: 'Send large files and folders up to 100 GB directly browser-to-browser via WebRTC P2P. Secure, fast, and completely free.',
    keywords: ['p2p file sharing', 'large file transfer', 'webrtc transfer', 'free file send', 'direct browser share']
  },
  'screenshot-studio': {
    title: 'Website Screenshot Studio - Full Page Capture',
    desc: 'Capture high-resolution screenshots of public websites. Supports custom viewports (desktop, mobile, tablet) and full scrolling screenshot rendering.',
    keywords: ['website screenshot', 'full page capture', 'headless rendering screenshot', 'web screenshot tool', 'viewport mockup']
  },
  'date-converter': {
    title: 'Nepali Calendar Desktop App & Date Converter (BS to AD)',
    desc: 'Download the official Nepali Calendar Desktop App for Windows. Convert Bikram Sambat (BS) to Gregorian (AD) instantly offline. The most powerful desktop widget for Nepal.',
    keywords: ['nepali calendar desktop app', 'nepali calendar download', 'windows calendar widget', 'bs to ad converter', 'nepali date converter']
  },
  'translator': {
    title: 'Multi-Language Text Translator & Text-to-Speech',
    desc: 'Translate text between English, Nepali, Hindi, Chinese, and European languages dynamically with voice and speech synthesis audio rendering.',
    keywords: ['text translator', 'nepali english translation', 'hindi translation', 'text to speech converter', 'speech translator']
  },
  'currency-converter': {
    title: 'Live Currency Exchange Rate Converter',
    desc: 'Convert global currencies with real-time exchange rates (updated hourly). Calculate exchange values for NPR, USD, INR, EUR, and more.',
    keywords: ['currency converter', 'live exchange rates', 'usd to npr', 'nepali rupee exchange', 'forex converter']
  },
  'jpg-to-pdf': {
    title: 'JPG to PDF Converter - Compile Images to PDF',
    desc: 'Convert and merge JPG, PNG, and WebP images into a single clean PDF document completely in your browser. 100% private and secure.',
    keywords: ['jpg to pdf', 'image to pdf compiler', 'convert png to pdf', 'local pdf creator', 'browser pdf tools']
  },
  'merge-pdf': {
    title: 'PDF Merger - Combine Multiple PDF Documents',
    desc: 'Merge multiple PDF files into a single document in any custom order. Processes entirely local with WebAssembly for total file security.',
    keywords: ['merge pdf', 'combine pdf files', 'pdf compiler tool', 'wasm pdf editor', 'private pdf merger']
  },
  'add-page-numbers': {
    title: 'Add Page Numbers to PDF Documents',
    desc: 'Stamp page numbers onto vector PDF documents with customizable layouts, alignments, fonts, margins, and starting indices.',
    keywords: ['add pdf page numbers', 'stamp pdf pages', 'pdf pagination', 'local pdf editor', 'custom page numbers']
  },
  'pdf-to-image': {
    title: 'PDF to Image Converter - Extract Pages as JPG/PNG',
    desc: 'Extract all pages from any PDF document and download them as high-quality PNG or JPG image archives. Runs 100% client-side.',
    keywords: ['pdf to image converter', 'extract pdf pages', 'pdf to jpg zip', 'convert pdf to png', 'local pdf extraction']
  },
  'ai-summarizer': {
    title: 'AI Document Summarizer - PDF Abstract Generator',
    desc: 'Analyze and summarize long PDF reports, books, and articles using Gemini 1.5 Flash. Get instant bulleted takeaways and executive abstracts.',
    keywords: ['ai document summarizer', 'pdf summary tool', 'gemini summarizer', 'text abstract builder', 'smart doc analyzer']
  },
  'image-compressor': {
    title: 'Smart Image Compressor - Reduce File Size Online',
    desc: 'Compress JPG, PNG, and WebP images to a specific target file size (e.g. under 100KB) with zero quality loss. Local browser compression for privacy.',
    keywords: ['image compressor', 'reduce photo size', 'png compressor online', 'target file size photo', 'local canvas resizer']
  },
  'emi-calculator': {
    title: 'EMI Calculator - Loan & Interest Payment Schedule',
    desc: 'Calculate monthly loan payments (EMI) with interactive amortization charts, showing principal vs interest breakdown over time.',
    keywords: ['emi calculator', 'loan calculator', 'interest payment schedule', 'amortization chart loan', 'mortgage calculator']
  },
  'qr-studio': {
    title: 'Branded QR Code Studio & Scanner',
    desc: 'Generate customized QR codes with brand logo overlays, foreground colors, and gradients. Includes live camera-based QR and barcode scanner.',
    keywords: ['qr code generator', 'branded qr creator', 'camera qr scanner', 'barcode reader online', 'custom qr styling']
  },
  'json-formatter': {
    title: 'Smart JSON Formatter, Minifier & Tree Viewer',
    desc: 'Format, validate, parse, and minify JSON strings instantly. Collapsible interactive tree directory explorer for nested JSON objects.',
    keywords: ['json formatter', 'minify json online', 'json tree visualizer', 'validate json markup', 'pretty print json']
  },
  'diff-checker': {
    title: 'Instant Text Diff Checker - Side-by-Side Comparison',
    desc: 'Compare two text documents side-by-side or inline with synchronized scrolling and highlighted differences at line and character levels.',
    keywords: ['diff checker', 'text comparison tool', 'compare files online', 'git diff visualizer', 'character differences checker']
  },
  'code-runner': {
    title: 'HTML, CSS & JS Code Runner Sandbox',
    desc: 'Write, edit, and execute HTML, CSS, and JavaScript web code in an isolated iframe sandbox with immediate live rendering preview.',
    keywords: ['code runner', 'html editor live preview', 'js sandbox', 'iframe developer playground', 'front-end editor']
  },
  'ocr-converter': {
    title: 'AI OCR Image to Text Converter',
    desc: 'Extract text instantly from scanned documents, receipts, screenshots, and photos. Runs completely in your browser — 100% free and private.',
    keywords: ['ocr converter', 'image to text', 'extract text from image', 'online ocr tool', 'free local ocr']
  },
  'bg-remover': {
    title: 'Client-Side Image Background Remover',
    desc: 'Remove image backgrounds automatically in seconds. Runs entirely on your browser for absolute data privacy and zero quality loss.',
    keywords: ['background remover', 'remove bg online', 'transparent image converter', 'png maker', 'free local bg remover']
  },
  'scan-pdf': {
    title: 'Scan-to-PDF Document CamScanner',
    desc: 'Scan paper documents using your phone camera, apply magic color enhancement filters, and compile pages into a clean, searchable PDF directly in your browser.',
    keywords: ['scan to pdf', 'camscanner online', 'document scanner', 'phone camera scan to computer', 'mobile document capture', 'free online scanner']
  }
};

// ─── All static hardcoded tool metadata ────────────────────────────────────
interface StaticTool {
  id: string;
  name: string;
  emoji: string;
  description: string;
  badge: string;
  accentColor: string; // tailwind color name e.g. 'indigo'
}

const STATIC_TOOLS: StaticTool[] = [
  {
    id: 'dev-card-studio',
    name: 'Developer Card Studio',
    emoji: '🪪',
    description: 'Design customized developer profile cards and OpenGraph preview banners. Export as PNG images or copy copyable SVG/React vector markups.',
    badge: 'NEW',
    accentColor: 'indigo',
  },
  {
    id: 'secure-vault',
    name: 'Secure Vault',
    emoji: '🔐',
    description: 'Protect any file — image, PDF, video, or document — with AES-256 encryption. Share a password-protected link or QR code. Only those with the password can access it.',
    badge: 'NEW',
    accentColor: 'indigo',
  },
  {
    id: 'file-transfer',
    name: 'File Transfer',
    emoji: '🚀',
    description: 'Send any file or folder up to 100 GB. Get an instant shareable download link or email it — free, no account needed.',
    badge: 'NEW',
    accentColor: 'emerald',
  },
  {
    id: 'screenshot-studio',
    name: 'Screenshot Studio',
    emoji: '📸',
    description: 'Capture high-resolution screenshots of any website. Customize resolution, emulate mobile/desktop devices, capture full scrolling pages, and download instantly.',
    badge: 'NEW',
    accentColor: 'purple',
  },
  {
    id: 'font-downloader',
    name: 'System Fonts Downloader',
    emoji: '🔤',
    description: 'Browse, preview and batch download 1100+ real Nepali and English fonts. Includes Preeti, Kantipur, Mangal, Kalimati, Roboto, Inter and more — install directly on your computer.',
    badge: 'NEW',
    accentColor: 'amber',
  },
  {
    id: 'ocr-converter',
    name: 'AI OCR Converter',
    emoji: '📝',
    description: 'Extract text instantly from scanned documents, receipts, screenshots, and photos. Runs completely in your browser — 100% free and private.',
    badge: 'FREE AI',
    accentColor: 'indigo',
  },
  {
    id: 'bg-remover',
    name: 'Background Remover',
    emoji: '✂️',
    description: 'Remove image backgrounds automatically in seconds. Runs entirely on your browser for absolute data privacy and zero quality limits.',
    badge: 'FREE AI',
    accentColor: 'emerald',
  },
  {
    id: 'scan-pdf',
    name: 'Scan-to-PDF CamScanner',
    emoji: '📷',
    description: 'Scan documents using your phone camera, apply magic color enhancement filters, and compile pages into a clean PDF directly in your browser.',
    badge: 'REAL TIME',
    accentColor: 'indigo',
  },
];

// ─── Accent color map ────────────────────────────────────────────────────────
const ACCENT: Record<string, { border: string; hoverBorder: string; glow: string; bg: string; iconBg: string; iconBorder: string; text: string; badgeBg: string; badgeText: string }> = {
  indigo: {
    border: 'border-slate-950 dark:border-slate-800',
    hoverBorder: 'hover:border-indigo-500 dark:hover:border-indigo-400',
    glow: 'rgba(99,102,241,0.07)',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconBorder: 'border-indigo-100 dark:border-indigo-800/40',
    text: 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
  },
  emerald: {
    border: 'border-slate-950 dark:border-slate-800',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-400',
    glow: 'rgba(16,185,129,0.06)',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconBorder: 'border-emerald-100 dark:border-emerald-800/40',
    text: 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  purple: {
    border: 'border-slate-950 dark:border-slate-800',
    hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-400',
    glow: 'rgba(168,85,247,0.06)',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconBorder: 'border-purple-100 dark:border-purple-800/40',
    text: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-700',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/50',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  amber: {
    border: 'border-slate-950 dark:border-slate-800',
    hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-400',
    glow: 'rgba(245,158,11,0.07)',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconBorder: 'border-amber-100 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
};

// ─── Pin button component ─────────────────────────────────────────────────────
interface PinButtonProps {
  toolId: string;
  pinned: boolean;
  onToggle: (toolId: string, e: React.MouseEvent) => void;
}

const PinButton: React.FC<PinButtonProps> = ({ toolId, pinned, onToggle }) => (
  <button
    id={`pin-btn-${toolId}`}
    aria-label={pinned ? 'Unpin from favourites' : 'Pin to favourites'}
    title={pinned ? 'Unpin from favourites' : 'Pin to favourites'}
    onClick={(e) => onToggle(toolId, e)}
    className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
      ${pinned
        ? 'bg-amber-400 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/40 scale-110'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-500'
      }`}
    style={{ transition: 'opacity 0.15s, background 0.15s, color 0.15s, transform 0.15s' }}
  >
    <Star size={13} fill={pinned ? 'currentColor' : 'none'} strokeWidth={pinned ? 0 : 2} />
  </button>
);

// ─── Static Tool Card ─────────────────────────────────────────────────────────
interface StaticCardProps {
  tool: StaticTool;
  pinned: boolean;
  onPin: (id: string, e: React.MouseEvent) => void;
  onOpen: (id: string) => void;
  compact?: boolean;
}

const StaticCard: React.FC<StaticCardProps> = ({ tool, pinned, onPin, onOpen, compact }) => {
  const ac = ACCENT[tool.accentColor] || ACCENT['indigo'];
  return (
    <a
      href={`/tools/${tool.id}`}
      id={`tool-card-${tool.id}`}
      onClick={(e) => { e.preventDefault(); onOpen(tool.id); }}
      className={`group pure-white-card border-2 ${ac.border} ${ac.hoverBorder} shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden ${compact ? 'min-h-[180px]' : 'min-h-[200px] sm:min-h-[220px]'} hover:border-opacity-100 block`}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at top left, ${ac.glow} 0%, transparent 60%)` }} />

      {/* Pin button */}
      <PinButton toolId={tool.id} pinned={pinned} onToggle={onPin} />

      {/* Pinned badge */}
      {pinned && (
        <span className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-sm">
          <Pin size={8} /> Pinned
        </span>
      )}

      <div className="space-y-3 w-full relative z-10">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg ${ac.iconBg} border ${ac.iconBorder}`}>
          {tool.emoji}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`text-base font-bold text-slate-900 dark:text-white group-hover:${ac.text.split(' ')[0]} transition-colors`}>{tool.name}</h3>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${ac.badgeBg} ${ac.badgeText}`}>{tool.badge}</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">{tool.description}</p>
        </div>
      </div>
      <div className={`mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${ac.text} transition-colors relative z-10`}>
        <span>Open Tool</span>
        <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
};

// ─── Firestore Tool Card ──────────────────────────────────────────────────────
interface DynCardProps {
  service: ServiceTool;
  pinned: boolean;
  onPin: (id: string, e: React.MouseEvent) => void;
  onOpen: (id: string) => void;
  compact?: boolean;
}

const DynCard: React.FC<DynCardProps> = ({ service, pinned, onPin, onOpen, compact }) => (
  <a
    href={`/tools/${service.linkUrl}`}
    id={`tool-card-${service.linkUrl}`}
    onClick={(e) => { e.preventDefault(); onOpen(service.linkUrl); }}
    className={`group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden ${compact ? 'min-h-[180px]' : 'min-h-[200px] sm:min-h-[220px]'} hover:border-indigo-600 dark:hover:border-indigo-500 block`}
  >
    {service.bgImageUrl && (
      <div
        className="absolute inset-0 z-0 opacity-10 dark:opacity-[0.03] group-hover:opacity-20 dark:group-hover:opacity-[0.08] transition-opacity duration-500 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${service.bgImageUrl}')` }}
      />
    )}

    {/* Pin button */}
    <PinButton toolId={service.linkUrl} pinned={pinned} onToggle={onPin} />

    {/* Pinned badge */}
    {pinned && (
      <span className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-sm">
        <Pin size={8} /> Pinned
      </span>
    )}

    <div className="space-y-3 w-full relative z-10">
      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden p-2 border border-slate-100 dark:border-slate-700">
        {service.iconUrl ? (
          <img src={service.iconUrl} alt={service.title} className="w-full h-full object-contain drop-shadow-sm" />
        ) : (
          <div className="w-full h-full bg-slate-200 rounded" />
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{service.title}</h3>
          {service.badge && (
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">{service.badge}</span>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">{service.description}</p>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10">
      <span>Open Tool</span>
      <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
    </div>
  </a>
);

// ─── ServicesPage ─────────────────────────────────────────────────────────────
const ServicesPage: React.FC = () => {
  const { selectedId, navigate } = useNavigation();
  const [services, setServices] = useState<ServiceTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmbed, setIsEmbed] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(FAVOURITES_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });
  const [justPinned, setJustPinned] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify([...pinnedIds]));
    } catch { /* ignore */ }
  }, [pinnedIds]);

  const handlePin = useCallback((toolId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
        setJustPinned(toolId);
        setTimeout(() => setJustPinned(null), 1200);
      }
      return next;
    });
  }, []);

  const handleOpen = useCallback((id: string) => {
    navigate('services', id);
  }, [navigate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('embed') === 'true' || params.get('desktop') === 'true') {
        setIsEmbed(true);
      }
    }
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        setServices(snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ServiceTool))
          .filter(service => service.linkUrl !== 'file-transfer' && service.linkUrl !== 'screenshot-studio' && service.linkUrl !== 'font-downloader' && service.linkUrl !== 'ocr-converter' && service.linkUrl !== 'bg-remover' && service.linkUrl !== 'scan-pdf')
        );
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const raf = requestAnimationFrame(() => { window.scrollTo(0, 0); });
    const timeout = setTimeout(() => { window.scrollTo(0, 0); }, 50);
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
  }, [selectedId]);

  // Dynamic SEO
  useEffect(() => {
    let pageTitle = 'Developer Services & Utility Tools | Bishal Codes';
    let pageDesc = 'Explore free, local client-side developer utility tools. Secure Vault (AES-256 encryption), File Transfer (up to 100 GB), Screenshot Studio, Code Runner, and PDF utilities.';
    let pageKeywords = 'developer tools, utilities, local file transfer, pdf merger, secure vault encryption, screen capture tool, custom dev cards';
    let schemaType = 'WebApplication';
    let schemaName = 'Developer Services & Utility Tools';

    if (selectedId) {
      if (toolSeoData[selectedId]) {
        const data = toolSeoData[selectedId];
        pageTitle = `${data.title} | Developer Tools | Bishal Codes`;
        pageDesc = data.desc;
        pageKeywords = data.keywords.join(', ');
        schemaType = 'SoftwareApplication';
        schemaName = data.title;
      } else {
        const dynamicService = services.find(s => s.linkUrl === selectedId);
        if (dynamicService) {
          pageTitle = `${dynamicService.title} | Developer Tools | Bishal Codes`;
          pageDesc = dynamicService.description || pageDesc;
          pageKeywords = `${dynamicService.title.toLowerCase()}, developer tools, bishal codes`;
          schemaType = 'SoftwareApplication';
          schemaName = dynamicService.title;
        }
      }
    }

    document.title = pageTitle;

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.setAttribute('content', pageDesc);

    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsTag) {
      metaKeywordsTag = document.createElement('meta');
      metaKeywordsTag.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywordsTag);
    }
    metaKeywordsTag.setAttribute('content', pageKeywords);

    const schemaId = 'services-jsonld-schema';
    let scriptTag = document.getElementById(schemaId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaObj: any = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": schemaName,
      "description": pageDesc,
      "url": selectedId ? `https://bishalcodes.com/tools/${selectedId}` : "https://bishalcodes.com/tools",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "author": {
        "@type": "Person",
        "name": "Bishal Mishra",
        "url": "https://bishalcodes.com/"
      }
    };

    if (schemaType === 'SoftwareApplication') {
      schemaObj["offers"] = { "@type": "Offer", "price": "0.00", "priceCurrency": "USD" };
    }

    scriptTag.innerHTML = JSON.stringify(schemaObj);

    return () => {
      document.title = "Bishal Mishra | World-Class Full-Stack Developer & 3D Web Architect";
      const defaultDesc = document.querySelector('meta[name="description"]');
      if (defaultDesc) defaultDesc.setAttribute('content', "Bishal Mishra is a premium Full-Stack Developer specializing in high-performance 3D visuals, Next.js architecture, and custom enterprise web applications.");
      const defaultKeywords = document.querySelector('meta[name="keywords"]');
      if (defaultKeywords) defaultKeywords.setAttribute('content', "Bishal Mishra, Bishal Codes, Full Stack Developer Nepal, Web Developer, Next.js Expert, React Developer, UI/UX Designer, Professional Web Development, JavaScript Expert, TypeScript, Freelance Web Developer");
      const existingScript = document.getElementById(schemaId);
      if (existingScript) existingScript.remove();
    };
  }, [selectedId, services]);

  const renderActiveService = () => {
    switch (selectedId) {
      case 'date-converter': return <DateConverter />;
      case 'translator': return <LanguageTranslator />;
      case 'currency-converter': return <CurrencyConverter />;
      case 'jpg-to-pdf': return <JpgToPdfConverter />;
      case 'merge-pdf': return <PdfMerger />;
      case 'add-page-numbers': return <PdfPageNumberAdder />;
      case 'pdf-to-image': return <PdfToImageConverter />;
      case 'ai-summarizer': return <AiSummarizer />;
      case 'image-compressor': return <ImageCompressor />;
      case 'emi-calculator': return <EmiCalculator />;
      case 'qr-studio': return <QrCodeStudio />;
      case 'json-formatter': return <JsonFormatter />;
      case 'diff-checker': return <DiffChecker />;
      case 'code-runner': return <CodeRunner />;
      case 'file-transfer': return <FileTransfer />;
      case 'screenshot-studio': return <ScreenshotStudio />;
      case 'secure-vault': return <SecureVault />;
      case 'dev-card-studio': return <DeveloperCardStudio />;
      case 'font-downloader': return <FontDownloader />;
      case 'ocr-converter': return <AiOcrConverter />;
      case 'bg-remover': return <BgRemover />;
      case 'scan-pdf': return <DocScanner />;
      default: return renderDashboard();
    }
  };

  // Build pinned tools list for the favourites section
  const pinnedStaticTools = STATIC_TOOLS.filter(t => pinnedIds.has(t.id));
  const pinnedDynTools = services.filter(s => pinnedIds.has(s.linkUrl));
  const hasPinned = pinnedStaticTools.length > 0 || pinnedDynTools.length > 0;

  const renderDashboard = () => (
    <div id="services-dashboard" className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <style>{`
        #services-dashboard .pure-white-card {
          background-color: #ffffff !important;
        }
        :root.dark #services-dashboard .pure-white-card {
          background-color: rgb(15 23 42 / 0.4) !important;
        }
        @keyframes pin-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35) rotate(-8deg); }
          70% { transform: scale(0.92) rotate(4deg); }
          100% { transform: scale(1); }
        }
        .pin-pop { animation: pin-pop 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-down { animation: slide-down 0.35s ease both; }
      `}</style>

      {/* Toast notification */}
      {justPinned && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-amber-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg slide-down pointer-events-none">
          <Star size={14} fill="white" />
          Pinned to Favourites!
        </div>
      )}

      {/* Upper Hero Banner */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-12 md:py-16">
        <div className="w-full px-4 md:px-8 mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading max-w-3xl mx-auto">
            Developer Services &amp; Utility Tools
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal max-w-xl mx-auto leading-relaxed">
            A few simple tools I built that I personally use. Free to use, no sign-up needed.
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs flex items-center justify-center gap-1.5">
            <Star size={11} className="text-amber-400" fill="currentColor" />
            Click the star on any tool card to pin it to your Favourites
          </p>
        </div>
      </div>

      {/* ── Pinned Favourites Section ── */}
      {hasPinned && (
        <div className="w-full px-4 md:px-8 pt-10 pb-2 slide-down">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400/15 dark:bg-amber-400/10">
              <Star size={15} className="text-amber-500" fill="currentColor" />
            </div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white uppercase">Pinned Favourites</h2>
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {pinnedStaticTools.length + pinnedDynTools.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 w-full">
            {pinnedStaticTools.map(tool => (
              <div key={tool.id} className="slide-down">
                <StaticCard tool={tool} pinned={true} onPin={handlePin} onOpen={handleOpen} compact />
              </div>
            ))}
            {pinnedDynTools.map(service => (
              <div key={service.id} className="slide-down">
                <DynCard service={service} pinned={true} onPin={handlePin} onOpen={handleOpen} compact />
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800" />
        </div>
      )}

      {/* Services Grid */}
      <div className="w-full px-4 md:px-8 py-10 min-h-[50vh]">
        {hasPinned && (
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-5">All Tools</h2>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-none">
            {STATIC_TOOLS.map(tool => (
              <StaticCard
                key={tool.id}
                tool={tool}
                pinned={pinnedIds.has(tool.id)}
                onPin={handlePin}
                onOpen={handleOpen}
              />
            ))}

            {/* ── Firestore services ── */}
            {services.map(service => (
              <DynCard
                key={service.id}
                service={service}
                pinned={pinnedIds.has(service.linkUrl)}
                onPin={handlePin}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const isFullBleed = selectedId === 'file-transfer' || selectedId === 'font-downloader' || selectedId === 'ocr-converter' || selectedId === 'bg-remover' || selectedId === 'scan-pdf';

  return (
    <div className="min-h-screen bg-[#FDF9F3] dark:bg-slate-950 font-sans transition-colors duration-300 selection:bg-indigo-500/30">
      {!isEmbed && <Navbar />}
      <main className={`w-full flex-grow flex flex-col ${isEmbed ? 'pt-0 pb-0 mt-0' : isFullBleed ? 'pt-0 pb-0' : selectedId ? 'pt-0 pb-12' : 'pb-12 pt-20 sm:pt-28'}`}>
        {renderActiveService()}
      </main>
      {!selectedId && !isEmbed && <Footer />}
    </div>
  );
};

export default ServicesPage;