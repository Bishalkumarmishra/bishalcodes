import React, { useState, useEffect } from 'react';
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
import { ArrowRight, Loader2 } from 'lucide-react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ServiceTool } from '../types';

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

const ServicesPage: React.FC = () => {
  const { selectedId, navigate } = useNavigation();
  const [services, setServices] = useState<ServiceTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmbed, setIsEmbed] = useState(false);

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
    // Force instant scroll to top when changing tools
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Follow-up after React layout paints to handle late layout shifts
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    const timeout = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [selectedId]);

  // Dynamic SEO configuration for Services Page and individual Tools
  useEffect(() => {
    // 1. Determine Title, Description, and Keywords based on active selectedId
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
        // Fallback for dynamic Firestore services
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

    // 2. Set Document Title
    document.title = pageTitle;

    // 3. Set Meta Description
    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.setAttribute('content', pageDesc);

    // 4. Set Meta Keywords
    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsTag) {
      metaKeywordsTag = document.createElement('meta');
      metaKeywordsTag.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywordsTag);
    }
    metaKeywordsTag.setAttribute('content', pageKeywords);

    // 5. Inject/Update dynamic JSON-LD Schema
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
      schemaObj["offers"] = {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD"
      };
    }

    scriptTag.innerHTML = JSON.stringify(schemaObj);

    // Cleanup function to restore default homepage title & description
    return () => {
      document.title = "Bishal Mishra | World-Class Full-Stack Developer & 3D Web Architect";

      const defaultDesc = document.querySelector('meta[name="description"]');
      if (defaultDesc) {
        defaultDesc.setAttribute(
          'content',
          "Bishal Mishra is a premium Full-Stack Developer specializing in high-performance 3D visuals, Next.js architecture, and custom enterprise web applications."
        );
      }

      const defaultKeywords = document.querySelector('meta[name="keywords"]');
      if (defaultKeywords) {
        defaultKeywords.setAttribute(
          'content',
          "Bishal Mishra, Bishal Codes, Full Stack Developer Nepal, Web Developer, Next.js Expert, React Developer, UI/UX Designer, Professional Web Development, JavaScript Expert, TypeScript, Freelance Web Developer"
        );
      }

      const existingScript = document.getElementById(schemaId);
      if (existingScript) {
        existingScript.remove();
      }
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

  const renderDashboard = () => (
    <div id="services-dashboard" className="w-full text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <style>{`
        #services-dashboard .pure-white-card {
          background-color: #ffffff !important;
        }
        :root.dark #services-dashboard .pure-white-card {
          background-color: rgb(15 23 42 / 0.4) !important;
        }
      `}</style>

      {/* Upper Hero Banner */}
      <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-12 md:py-16">
        <div className="w-full px-4 md:px-8 mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-heading max-w-3xl mx-auto">
            Developer Services & Utility Tools
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal max-w-xl mx-auto leading-relaxed">
            A few simple tools I built that I personally use. Free to use, no sign-up needed.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="w-full px-4 md:px-8 py-12 min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-none">
            {/* ── Hardcoded: Developer Card Studio ── */}
            <a
              href="/tools/dev-card-studio"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'dev-card-studio');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-indigo-500 dark:hover:border-indigo-400 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-800/40">
                  🪪
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Developer Card Studio</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">NEW</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Design customized developer profile cards and OpenGraph preview banners. Export as PNG images or copy copyable SVG/React vector markups.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: Secure Vault ── */}
            <a
              href="/tools/secure-vault"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'secure-vault');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-indigo-500 dark:hover:border-indigo-400 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-800/40">
                  🔐
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Secure Vault</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">NEW</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Protect any file — image, PDF, video, or document — with AES-256 encryption. Share a password-protected link or QR code. Only those with the password can access it.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: File Transfer (always visible) ── */}
            <a
              href="/tools/file-transfer"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'file-transfer');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-emerald-500 dark:hover:border-emerald-450 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/40">
                  🚀
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">File Transfer</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">NEW</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Send any file or folder up to 100 GB. Get an instant shareable download link or email it — free, no account needed.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: Website Screenshot Studio ── */}
            <a
              href="/tools/screenshot-studio"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'screenshot-studio');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-purple-500 dark:hover:border-purple-450 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(168,85,247,0.06) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-800/40">
                  📸
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Screenshot Studio</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">NEW</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Capture high-resolution screenshots of any website. Customize resolution, emulate mobile/desktop devices, capture full scrolling pages, and download instantly.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: System Fonts Downloader ── */}
            <a
              href="/tools/font-downloader"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'font-downloader');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-amber-500 dark:hover:border-amber-450 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.07) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-800/40">
                  🔤
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">System Fonts Downloader</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">NEW</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Browse, preview and batch download 1100+ real Nepali and English fonts. Includes Preeti, Kantipur, Mangal, Kalimati, Roboto, Inter and more — install directly on your computer.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 group-hover:text-amber-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: AI OCR Image-to-Text ── */}
            <a
              href="/tools/ocr-converter"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'ocr-converter');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-indigo-600 dark:hover:border-indigo-500 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/30">
                  📝
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">AI OCR Converter</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">FREE AI</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Extract text instantly from scanned documents, receipts, screenshots, and photos. Runs completely in your browser — 100% free and private.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: Background Remover ── */}
            <a
              href="/tools/bg-remover"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'bg-remover');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-emerald-600 dark:hover:border-emerald-500 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30">
                  ✂️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors">Background Remover</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">FREE AI</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Remove image backgrounds automatically in seconds. Runs entirely on your browser for absolute data privacy and zero quality limits.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Hardcoded: Scan-to-PDF Document CamScanner ── */}
            <a
              href="/tools/scan-pdf"
              onClick={(e) => {
                e.preventDefault();
                navigate('services', 'scan-pdf');
              }}
              className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-indigo-600 dark:hover:border-indigo-500 block"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />
              <div className="space-y-3 w-full relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/30">
                  📷
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Scan-to-PDF CamScanner</h3>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">REAL TIME</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                    Scan documents using your phone camera, apply magic color enhancement filters, and compile pages into a clean PDF directly in your browser.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 transition-colors relative z-10">
                <span>Open Tool</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </a>

            {/* ── Firestore services ── */}
            {services.map(service => (
              <a
                key={service.id}
                href={`/tools/${service.linkUrl}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('services', service.linkUrl);
                }}
                className="group pure-white-card border-2 border-slate-950 dark:border-slate-800 shadow-sm hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start transition-all cursor-pointer relative overflow-hidden min-h-[200px] sm:min-h-[220px] hover:border-indigo-600 dark:hover:border-indigo-500 block"
              >
                {/* Dynamic Background Image overlay */}
                {service.bgImageUrl && (
                  <div
                    className="absolute inset-0 z-0 opacity-10 dark:opacity-[0.03] group-hover:opacity-20 dark:group-hover:opacity-[0.08] transition-opacity duration-500 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('${service.bgImageUrl}')` }}
                  />
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
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {service.title}
                      </h3>
                      {service.badge && (
                        <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] leading-relaxed font-medium">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10">
                  <span>Open Tool</span>
                  <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </a>
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