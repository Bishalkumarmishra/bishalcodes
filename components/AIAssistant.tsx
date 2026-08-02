import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Send, PhoneCall, Phone, Shield, ExternalLink, Sparkles, Loader2, Copy, Check, MessageCircle, HelpCircle, Wrench, DollarSign, BookOpen, Key, ArrowRight, User, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApiKey } from '../hooks/useApiKey';
import ApiKeyModal from './ApiKeyModal';
import { useNavigation } from '../context/NavigationContext';
import WebVoiceCallModal, { WebCallState } from './WebVoiceCallModal';
import { webRtcService } from '../services/webRtcCall';
import { auth, db } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, doc, setDoc, addDoc, onSnapshot } from 'firebase/firestore';

// Customer Service Headset + Speech Bubble Icon (matching Vecteezy Customer Support Chat design)
const CustomerSupportChatIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 14V11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="2" y="12" width="3" height="5" rx="1" fill="currentColor" />
    <rect x="19" y="12" width="3" height="5" rx="1" fill="currentColor" />
    <path d="M19 16.5V17.5C19 19.433 17.433 21 15.5 21H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="21" r="1.2" fill="currentColor" />
    <path d="M7.5 8C6.67157 8 6 8.67157 6 9.5V12.5C6 13.3284 6.67157 14 7.5 14H8.5V16L10.5 14H16.5C17.3284 14 18 13.3284 18 12.5V9.5C18 8.67157 17.3284 8 16.5 8H7.5Z" fill="currentColor" />
    <circle cx="9.5" cy="11" r="0.8" fill="black" />
    <circle cx="12" cy="11" r="0.8" fill="black" />
    <circle cx="14.5" cy="11" r="0.8" fill="black" />
  </svg>
);

// Comprehensive Site Knowledge Base for fallback & prompt enrichment
const SITE_KNOWLEDGE = {
  owner: "Bishal Mishra",
  contact: {
    phone: "+977 9827801575",
    whatsapp: "https://wa.me/9779827801575",
    email: "bishalmishra9000@gmail.com",
    location: "Nepal"
  },
  bio: "Bishal Mishra is a world-class Full-Stack Web Developer and Digital Strategist with 3+ years of experience and over 300+ websites and web applications built. Specialized in Next.js, React, TypeScript, Node.js, TailwindCSS, Python, Firebase, Gemini AI integrations, and custom Shopify setups.",
  pricing: [
    {
      name: "INFORMATIVE",
      price: "Rs. 10,000 - 25,000",
      description: "Best for business websites, personal portfolios, or single-page landing layouts.",
      features: ["Responsive Mobile Layout", "Custom Admin Dashboard", "Standard SEO Optimization", "Clean, Accessible Codebase", "Post-Launch Tech Support"]
    },
    {
      name: "ECOMMERCE (Recommended)",
      price: "Rs. 25,000 - 55,000",
      description: "Specialized online store layouts using Shopify, WooCommerce, or custom platforms.",
      features: ["High-Converting Shop Setup", "Payment Gateway Integration", "Product Filter Frameworks", "Inventory Tracking", "Post-Launch Tech Support"]
    },
    {
      name: "ENTERPRISE",
      price: "Rs. 50,000+",
      description: "Bespoke web applications, custom tools, and complex business software.",
      features: ["Technical Planning Sessions", "Scalable Server Infrastructure", "Secure User Auth", "Optimized Data Pipelines", "Dedicated Support"]
    }
  ],
  services: [
    "Full-Stack Web Application Development (Next.js, React, Node.js)",
    "E-Commerce Store Building (Shopify, WooCommerce, Custom storefronts)",
    "Custom Backend API Development & Database Design",
    "UI/UX Interface Design & Modern Glassmorphism Animations",
    "Custom Admin Dashboards & CMS Systems",
    "SEO Optimization, Performance Tuning & PageSpeed Acceleration"
  ],
  tools: [
    {
      id: "screenshot-studio",
      name: "Website Screenshot Studio",
      route: "services",
      slug: "screenshot-studio",
      desc: "Captures high-resolution full-page scrolling screenshots of any public website with device viewport options.",
      howToUse: "1. Paste any public website URL.\n2. Choose viewport size (Desktop 1920px, Tablet 768px, Mobile 375px).\n3. Click 'Capture Screenshot' and download the PNG instantly."
    },
    {
      id: "dev-card-studio",
      name: "Developer Card Studio",
      route: "services",
      slug: "dev-card-studio",
      desc: "Design custom developer social profile cards and OpenGraph preview banners for GitHub and LinkedIn.",
      howToUse: "1. Type your name, title, tech stack, and profile avatar URL.\n2. Customize color themes, layout styles, and card background gradients.\n3. Click 'Export HD PNG' or copy the raw SVG code."
    },
    {
      id: "file-transfer",
      name: "File Transfer (P2P 100GB)",
      route: "transfer",
      slug: "",
      desc: "Send files up to 100 GB instantly via WebRTC peer-to-peer encrypted data streams.",
      howToUse: "1. Drag & drop files or click to select files.\n2. Share the generated download link or QR code with your recipient.\n3. Keep the browser tab open while transfer completes directly device-to-device."
    },
    {
      id: "bg-remover",
      name: "AI Background Remover",
      route: "services",
      slug: "bg-remover",
      desc: "Removes image backgrounds locally using client-side AI image segmentation.",
      howToUse: "1. Upload any photo or product image.\n2. Wait 2 seconds for client-side AI to isolate the subject.\n3. Download transparent HD PNG."
    },
    {
      id: "ai-ocr-converter",
      name: "AI OCR Text Extractor",
      route: "services",
      slug: "ai-ocr-converter",
      desc: "Extracts editable text from scanned documents, photos, or image receipts.",
      howToUse: "1. Upload a picture or document scan.\n2. Click 'Extract Text'.\n3. Copy the extracted text or save as TXT/JSON file."
    },
    {
      id: "ai-summarizer",
      name: "AI Document Summarizer",
      route: "services",
      slug: "ai-summarizer",
      desc: "Summarizes long text articles, PDFs, and books into key takeaways using AI.",
      howToUse: "1. Paste raw text or upload a PDF document.\n2. Choose summary length (Executive, Detailed, Bullet points).\n3. Click 'Summarize Document'."
    },
    {
      id: "code-runner",
      name: "Interactive Code Runner Sandbox",
      route: "services",
      slug: "code-runner",
      desc: "Execute JavaScript, HTML, CSS, and web scripts in a secure live preview sandbox.",
      howToUse: "1. Write or paste your code snippet.\n2. Click 'Run Code'.\n3. View live visual rendering or console outputs."
    },
    {
      id: "doc-scanner",
      name: "Document Scanner to PDF",
      route: "services",
      slug: "doc-scanner",
      desc: "Scans paper documents using your webcam/camera, fixes perspective, and exports as PDF.",
      howToUse: "1. Allow camera access and align paper in view.\n2. Snap capture, drag crop handles to set corners.\n3. Apply black-and-white filter and save PDF."
    },
    {
      id: "qr-studio",
      name: "QR Code Studio & Scanner",
      route: "services",
      slug: "qr-studio",
      desc: "Generates custom branded QR codes with embedded logo icons or scans QR codes via camera.",
      howToUse: "1. Enter text, link, Wi-Fi details, or vCard.\n2. Pick dot patterns, gradient colors, and upload center logo.\n3. Click 'Download QR Code' in SVG or PNG."
    },
    {
      id: "secure-vault",
      name: "Secure Encrypted Vault",
      route: "vault",
      slug: "",
      desc: "Encrypts secret notes and passwords client-side using military-grade AES-256 encryption.",
      howToUse: "1. Enter private text or password.\n2. Set your master passphrase.\n3. Copy the encrypted hash or shareable secret link."
    },
    {
      id: "image-compressor",
      name: "Smart Image Compressor",
      route: "services",
      slug: "image-compressor",
      desc: "Compresses JPG, PNG, and WebP images up to 90% without quality loss.",
      howToUse: "1. Drag & drop images into compressor.\n2. Select target quality percentage or file size limit (e.g. 200 KB).\n3. Download compressed images individually or as ZIP."
    },
    {
      id: "pdf-merger",
      name: "PDF Merger",
      route: "services",
      slug: "pdf-merger",
      desc: "Combines multiple PDF documents into a single organized file.",
      howToUse: "1. Upload multiple PDF files.\n2. Re-order files using drag handles.\n3. Click 'Merge PDFs' and download."
    },
    {
      id: "pdf-to-image",
      name: "PDF to Image Converter",
      route: "services",
      slug: "pdf-to-image",
      desc: "Converts PDF pages into high-resolution JPG or PNG images.",
      howToUse: "1. Select your PDF file.\n2. Pick output format (JPG/PNG) and DPI quality.\n3. Click 'Convert' to download image zip."
    },
    {
      id: "jpg-to-pdf",
      name: "JPG to PDF Converter",
      route: "services",
      slug: "jpg-to-pdf",
      desc: "Converts image files into a single formatted PDF document.",
      howToUse: "1. Select multiple JPG/PNG images.\n2. Adjust page orientation and margins.\n3. Click 'Generate PDF'."
    },
    {
      id: "pdf-page-number",
      name: "PDF Page Number Adder",
      route: "services",
      slug: "pdf-page-number",
      desc: "Adds custom page numbers to header or footer of PDF documents.",
      howToUse: "1. Select PDF file.\n2. Choose page number placement, font style, and starting index.\n3. Download numbered PDF."
    },
    {
      id: "currency-converter",
      name: "Live Currency Converter",
      route: "services",
      slug: "currency-converter",
      desc: "Converts rates live across USD, NPR, INR, PKR, EUR, GBP, and 30+ currencies updated hourly.",
      howToUse: "1. Enter numeric amount.\n2. Choose base currency and target currency.\n3. View conversion with historical exchange chart."
    },
    {
      id: "date-converter",
      name: "Nepali Date Converter (AD ↔ BS)",
      route: "widget-date-converter",
      slug: "",
      desc: "Converts Gregorian dates (AD) to Nepali Bikram Sambat dates (BS) and vice versa.",
      howToUse: "1. Choose conversion direction (AD to BS or BS to AD).\n2. Select Year, Month, and Day.\n3. View accurate Nepali calendar date, day of week, and Tithi."
    },
    {
      id: "json-formatter",
      name: "JSON Formatter & Validator",
      route: "services",
      slug: "json-formatter",
      desc: "Beautifies, minifies, validates, and visualizes raw JSON payloads with collapsible tree view.",
      howToUse: "1. Paste raw JSON string.\n2. Click 'Format/Beautify' or 'Minify'.\n3. Inspect syntax error highlights or browse interactive key-value tree."
    },
    {
      id: "diff-checker",
      name: "Text Diff Checker",
      route: "services",
      slug: "diff-checker",
      desc: "Compares text snippets line-by-line to highlight additions, deletions, and modifications.",
      howToUse: "1. Paste original text in left column.\n2. Paste new text in right column.\n3. Inspect side-by-side highlighted line diffs."
    },
    {
      id: "font-downloader",
      name: "Font Downloader & Viewer",
      route: "services",
      slug: "font-downloader",
      desc: "Browse, preview, and download 1100+ free Google and Nepali web fonts in TTF format.",
      howToUse: "1. Search font name or filter by typography category.\n2. Test live preview text and font sizes.\n3. Download font file package or copy web CSS @import code."
    },
    {
      id: "language-translator",
      name: "Language Translator",
      route: "services",
      slug: "language-translator",
      desc: "Translates text between English, Nepali, Hindi, Spanish, and 50+ languages with text-to-speech.",
      howToUse: "1. Enter text to translate.\n2. Select target output language.\n3. View instant translation and click speaker icon for audio pronunciation."
    },
    {
      id: "emi-calculator",
      name: "EMI & Loan Calculator",
      route: "services",
      slug: "emi-calculator",
      desc: "Calculates loan monthly payments (EMI), interest totals, and visual payment schedules.",
      howToUse: "1. Adjust principal amount slider, interest rate %, and loan tenure.\n2. View monthly payment EMI result.\n3. Examine donut breakdown chart and amortization breakdown ledger."
    },
    {
      id: "typing-practice",
      name: "Typing Speed Practice",
      route: "services",
      slug: "typing-practice",
      desc: "Tests typing speed in Words Per Minute (WPM) and accuracy with real-time feedback.",
      howToUse: "1. Select practice text or difficulty level.\n2. Start typing in target input field.\n3. View real-time WPM speed, accuracy percentage, and error statistics."
    }
  ],
  pages: [
    { title: "Home (`/`)", desc: "Main portfolio overview, featured projects, services preview, timeline, and client testimonials." },
    { title: "About (`/about`)", desc: "Detailed biography of Bishal Mishra, background, career milestones, and philosophy." },
    { title: "Services (`/services` or `/tools`)", desc: "Directory of custom web dev services and 23+ free browser developer utilities." },
    { title: "Pricing (`/pricing`)", desc: "Full pricing breakdown for Informative (10K-25K), E-Commerce (25K-55K), and Enterprise (50K+) packages." },
    { title: "AI Studio (`/ai-studio`)", desc: "Interactive showcase of AI utilities powered by Google Gemini API (Summarizer, OCR, Code Generator, Translator)." },
    { title: "Blog (`/blog`)", desc: "Articles on Next.js, Web Engineering, SEO strategies, JavaScript tips, and tutorial guides." },
    { title: "Developer Portal (`/developers`)", desc: "Free REST APIs for currency rates, date conversion, and fonts with API key management and docs." },
    { title: "Docs (`/docs`)", desc: "Official technical documentation for all tools, API endpoints, integration guides, and tutorials." },
    { title: "User Dashboard (`/dashboard`)", desc: "Logged-in portal for managing saved preferences, tools, API keys, and account settings." },
    { title: "Contact (`/contact`)", desc: "Direct messaging form, email, and direct WhatsApp contact buttons." }
  ]
};

// Code Sandbox Modal
const CodePreviewModal: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');

  const srcDoc = useMemo(() => {
    if (code.toLowerCase().includes('<html') || code.toLowerCase().includes('<!doctype')) {
      return code;
    }
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 24px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f8fafc;
            color: #1e293b;
          }
        </style>
      </head>
      <body>
        ${code}
      </body>
      </html>
    `;
  }, [code]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-3xl h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="bg-slate-950 p-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Live Sandbox Preview</h3>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'preview' ? 'bg-[#e52521] text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              Live Output
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'source' ? 'bg-[#e52521] text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              Source Code
            </button>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          {activeTab === 'preview' ? (
            <iframe
              title="Live Sandbox Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <pre className="w-full h-full overflow-auto p-5 text-xs font-mono bg-slate-950 text-slate-300 m-0">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatPre: React.FC<{ children: React.ReactNode; onRun: (code: string) => void }> = ({ children, onRun }) => {
  const [copied, setCopied] = useState(false);

  const codeElement = React.Children.toArray(children).find(
    (child: any) => child.type === 'code' || (child.props && child.props.className)
  ) as any;
  const codeText = codeElement ? codeElement.props.children : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(codeText).trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  const isHtmlPreviewable = useMemo(() => {
    const text = String(codeText).toLowerCase();
    return text.includes('<html') || text.includes('<div') || text.includes('<button') || text.includes('<style') || text.includes('<script') || text.includes('<!doctype') || text.includes('<svg');
  }, [codeText]);

  return (
    <div className="relative group/chat-code my-3 rounded-lg overflow-hidden border border-slate-200">
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 group-hover/chat-code:opacity-100 transition-opacity z-10">
        {isHtmlPreviewable && (
          <button
            onClick={() => onRun(String(codeText))}
            className="p-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm px-1.5"
            title="Run Code"
          >
            <Sparkles size={10} /> Run
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm px-1.5"
          title="Copy Code"
        >
          {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />} Copy
        </button>
      </div>
      <pre className="m-0 text-xs p-3 bg-slate-900 text-slate-100 overflow-x-auto rounded-lg font-mono">
        {children}
      </pre>
    </div>
  );
};

// Fallback intelligent responder when offline or API key isn't provided
function generateLocalHumanResponse(userQuery: string, hasAttachment?: boolean, attachmentName?: string): { text: string; actionLinks?: { label: string; route: string; slug?: string }[] } {
  const query = userQuery.toLowerCase().trim();
  const links: { label: string; route: string; slug?: string }[] = [];  // Attachment handling
  if (hasAttachment) {
    links.push({ label: "WhatsApp Bishal Directly", route: "whatsapp" });
    links.push({ label: "View Consultation Plans", route: "home" });
    return {
      text: `**I have received your image/file${attachmentName ? ` ("${attachmentName}")` : ''}!**

I am analyzing the uploaded content. If this is a screenshot of a bug, website design mockup, or project reference:
• Bishal can build, fix, or replicate this exact UI using Next.js, React, and modern TailwindCSS!
• For an immediate direct quote or code review on this reference screenshot, you can also send it directly to Bishal on WhatsApp (+977 9827801575).

${userQuery ? `**Your query:** "${userQuery}"\n` : ''}How would you like to proceed?`,
      actionLinks: links
    };
  }

  // 1. Pricing / Cost queries
  if (query.includes('price') || query.includes('pricing') || query.includes('cost') || query.includes('rate') || query.includes('package') || query.includes('plan')) {
    links.push({ label: "View Consultation Plans", route: "home" });
    links.push({ label: "WhatsApp Bishal Directly", route: "whatsapp" });
    return {
      text: `Here is a breakdown of Bishal Mishra's custom web development consultation plans:

• **INFORMATIVE PLAN (Rs. 10,000 – 25,000)**
  Perfect for business websites, personal portfolios, or single-page landing layouts. Includes mobile responsive design, custom admin dashboard, standard SEO, clean code, and post-launch tech support.

• **ECOMMERCE PLAN (Rs. 25,000 – 55,000)** — *Most Popular*
  Tailored online stores using Shopify, WooCommerce, or custom platforms. Includes high-converting layouts, payment gateway integration, product filtering, inventory tracking, and full post-launch support.

• **ENTERPRISE PLAN (Rs. 50,000+)**
  Bespoke web applications, custom SaaS platforms, and enterprise software. Includes technical planning, scalable architecture, secure auth, and dedicated tech support.

If you have a custom project in mind, feel free to book a direct consultation or chat with Bishal on WhatsApp (+977 9827801575)!`,
      actionLinks: links
    };
  }

  // 2. Tools / How to use specific tool
  const matchedTool = SITE_KNOWLEDGE.tools.find(t =>
    query.includes(t.name.toLowerCase()) ||
    query.includes(t.id) ||
    (t.slug && query.includes(t.slug)) ||
    query.split(' ').some(word => word.length > 3 && t.name.toLowerCase().includes(word))
  );

  if (matchedTool && (query.includes('how') || query.includes('use') || query.includes('tool') || query.includes('step') || query.includes('guide'))) {
    links.push({ label: `Open ${matchedTool.name}`, route: matchedTool.route, slug: matchedTool.slug });
    return {
      text: `### How to use **${matchedTool.name}**:

${matchedTool.desc}

**Step-by-step instructions:**
${matchedTool.howToUse}

You can click the button below to launch the tool right away!`,
      actionLinks: links
    };
  }

  // 3. General list of tools
  if (query.includes('tool') || query.includes('features') || query.includes('utilities') || query.includes('free')) {
    links.push({ label: "Explore All Tools", route: "services" });
    links.push({ label: "Website Screenshot Studio", route: "services", slug: "screenshot-studio" });
    links.push({ label: "Developer Card Studio", route: "services", slug: "dev-card-studio" });
    links.push({ label: "File Transfer (100GB)", route: "transfer" });

    return {
      text: `Bishal Codes features **23+ free developer tools & utilities** that run fast and privacy-first in your browser with zero registration required!

Here are some popular tools:
1. **Website Screenshot Studio**: Full-page website captures with viewport controls.
2. **Developer Card Studio**: Create social banners & developer profile cards.
3. **File Transfer**: Send up to 100 GB via encrypted WebRTC P2P streams.
4. **AI Background Remover**: Instant transparent background isolation.
5. **AI OCR Text Extractor**: Extract text from scans and images.
6. **AI Document Summarizer**: Summarize PDFs and articles.
7. **Code Runner Sandbox**: Execute HTML/CSS/JS code live.
8. **Nepali Date Converter**: Instant AD ↔ BS conversions.
9. **Live Currency Converter**: Hourly exchange rates for 30+ currencies.
10. **Secure Encrypted Vault**: AES-256 client-side encrypted password notes.

Ask me about any specific tool and I'll give you step-by-step instructions on how to use it!`,
      actionLinks: links
    };
  }

  // 4. Services / Web dev queries
  if (query.includes('service') || query.includes('hire') || query.includes('work') || query.includes('build') || query.includes('website') || query.includes('app')) {
    links.push({ label: "Book Consultation", route: "contact" });
    links.push({ label: "WhatsApp Direct", route: "whatsapp" });
    return {
      text: `Bishal Mishra offers end-to-end web engineering & digital strategy services:

• **Full-Stack Web App Development**: Built with Next.js, React, Node.js, and TypeScript for high performance and scalability.
• **E-Commerce Stores**: Custom Shopify, WooCommerce, or custom storefronts with payment gateways integrated.
• **Custom APIs & Backend Engineering**: Scalable databases, REST/GraphQL APIs, and serverless functions.
• **UI/UX Design & Glassmorphism**: Stunning, responsive designs using TailwindCSS and modern CSS animations.
• **Custom Admin Dashboards & CMS**: Tailored dashboards so you can manage your content and data effortlessly.
• **SEO & Speed Optimization**: Core Web Vitals acceleration to rank higher on Google search results.

Would you like to discuss your project requirements or get a custom quote?`,
      actionLinks: links
    };
  }

  // 5. Blog / Articles
  if (query.includes('blog') || query.includes('article') || query.includes('post') || query.includes('read') || query.includes('tutorial')) {
    links.push({ label: "Browse Articles & Tutorials", route: "blog" });
    return {
      text: `Bishal writes in-depth articles on modern web engineering, Next.js optimization, SEO best practices, and AI integrations.

You can visit our **Blog Archive** page to read step-by-step tutorials, code breakdowns, and industry guides. Click the button below to explore!`,
      actionLinks: links
    };
  }

  // 6. Developer Portal / APIs / Docs
  if (query.includes('dev') || query.includes('api') || query.includes('doc') || query.includes('key') || query.includes('endpoint')) {
    links.push({ label: "Developer Portal", route: "developers" });
    links.push({ label: "Technical Docs", route: "docs" });
    return {
      text: `Bishal Codes provides **Free REST APIs** for developers!

Available APIs:
• **Currency Rate API**: Live exchange rates updated hourly.
• **Nepali Date API**: Fast AD to BS date conversion endpoint.
• **Font Search API**: Retrieve typography metadata and font CDN files.

You can manage your API keys, inspect endpoints, and view SDK integration code snippets in our **Developer Portal** and **Docs** pages!`,
      actionLinks: links
    };
  }

  // 7. About Bishal / Contact
  if (query.includes('who') || query.includes('about') || query.includes('bishal') || query.includes('contact') || query.includes('phone') || query.includes('email') || query.includes('number')) {
    links.push({ label: "About Bishal", route: "about" });
    links.push({ label: "WhatsApp Bishal (+977 9827801575)", route: "whatsapp" });
    return {
      text: `**Bishal Mishra** is a Full-Stack Developer & Digital Strategist based in Nepal. He has 3+ years of experience, built over 300+ websites and web applications, and helps clients worldwide build fast, modern web software.

**Contact Details:**
• **WhatsApp / Phone**: +977 9827801575
• **Email**: bishalmishra9000@gmail.com
• **Location**: Nepal

Feel free to send a direct message on WhatsApp or click 'Book Consultation' to get in touch!`,
      actionLinks: links
    };
  }

  // Fallback general friendly response
  links.push({ label: "Explore All Tools", route: "services" });
  links.push({ label: "View Pricing Plans", route: "home" });
  links.push({ label: "Contact Bishal on WhatsApp", route: "whatsapp" });
  return {
    text: `Thanks for reaching out! I'm here to help you navigate through Bishal Mishra's portfolio, free developer tools, web development services, pricing plans, and articles.

Here are a few quick things you can explore:
• **23+ Free Developer Tools** (Screenshot Studio, Dev Card Studio, File Transfer, PDF utilities, Date Converter, etc.)
• **Custom Consultation & Web Development Plans** (Informative, E-Commerce, Enterprise)
• **Full-Stack Web Engineering Services** (Next.js, React, Custom APIs, Shopify)
• **Developer Portal & REST APIs**

What would you like to know more about?`,
    actionLinks: links
  };
}

// Web Audio API pleasant notification sound generator (zero asset dependency)
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1 - crisp pop
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2 - high warm chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.07); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.32);
  } catch (e) {
    console.warn("Notification audio blocked or unsupported:", e);
  }
};

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  previewUrl: string;
  base64: string;
  isImage: boolean;
}

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  image?: string;
  fileName?: string;
  senderType?: 'user' | 'admin' | 'bot';
  actionLinks?: { label: string; route: string; slug?: string }[];
}

interface UserLeadProfile {
  name: string;
  email: string;
  phone: string;
  sessionId: string;
  createdAt: string;
}

const AIAssistant: React.FC = () => {
  const { apiKey, saveApiKey, isKeyAvailable, clearApiKey } = useApiKey();
  const { navigate } = useNavigation();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Check if component is loaded inside an embedded iframe or widget URL
  const [isEmbeddedIframe, setIsEmbeddedIframe] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isEmbedParam = new URLSearchParams(window.location.search).get('embed') === 'true';
      const inIframe = window.self !== window.top;
      const isWidgetRoute = window.location.pathname.startsWith('/widgets');
      if (isEmbedParam || inIframe || isWidgetRoute) {
        setIsEmbeddedIframe(true);
      }
    }
  }, []);

  // Admin Authentication State
  const [authUser] = useAuthState(auth);
  const isAdmin = !!authUser;

  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead User Onboarding State
  const [leadUser, setLeadUser] = useState<UserLeadProfile | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');

  // Automatically recognize logged-in Admin and bypass lead onboarding form
  useEffect(() => {
    if (isAdmin && !leadUser) {
      const adminProfile: UserLeadProfile = {
        name: "Bishal Mishra (Admin)",
        email: authUser?.email || "bishalmishra9000@gmail.com",
        phone: "+977 9827801575",
        sessionId: "admin_session_" + Date.now(),
        createdAt: new Date().toISOString()
      };
      setLeadUser(adminProfile);
    }
  }, [isAdmin, authUser, leadUser]);

  // In-App Web Voice Call State
  const [callState, setCallState] = useState<WebCallState | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const durationTimerRef = useRef<any>(null);

const getCanonicalSessionId = (email?: string, fallbackId?: string) => {
  if (email && email.includes('@')) {
    return 'session_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return fallbackId || 'session_default';
};

  // Listen for WebRTC Voice Signals for User Widget across all devices
  const lastSignalTsRef = useRef<number>(0);
  useEffect(() => {
    const handleSignal = (signal: any) => {
      if (!signal) return;
      // Timestamp dedup to prevent stale Firestore signals re-firing
      const sigTs = signal.timestamp || 0;
      if (sigTs > 0 && sigTs <= lastSignalTsRef.current) return;
      if (sigTs > 0) lastSignalTsRef.current = sigTs;

      if (signal.type === 'CALL_INIT' && signal.callerRole === 'admin' && leadUser && (signal.sessionId === leadUser.sessionId)) {
        // Already on a call — ignore new ring
        if (callState && callState.status !== 'ended') return;
        setCallState({
          status: 'ringing',
          callerName: 'Bishal Mishra (Admin)',
          callerRole: 'admin',
          calleeName: leadUser.name,
          sessionId: leadUser.sessionId
        });
        setIsOpen(true);
        webRtcService.startRingtone();
      } else if (signal.type === 'CALL_ACCEPT' && signal.callerRole === 'admin' && signal.sessionId === callState?.sessionId) {
        webRtcService.stopRingtone();
        webRtcService.playCallConnectedChime();
        setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        setCallDuration(0);
        durationTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (signal.type === 'CALL_END' && signal.callerRole === 'admin') {
        // Admin ended or is busy
        const isBusy = signal.data?.reason === 'busy';
        webRtcService.stopRingtone();
        webRtcService.cleanup();
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
        setCallState(null);
        setCallDuration(0);
        if (isBusy) {
          alert('🚫 Bishal is currently on another call. Please try again later or send a message!');
        }
      }
    };

    // 1. Listen to user session's WebRTC signals in Firestore across all devices
    let unsubFirestore: () => void = () => {};
    if (leadUser?.sessionId) {
      try {
        unsubFirestore = onSnapshot(doc(db, 'webrtc_signals', leadUser.sessionId), (snap) => {
          if (snap.exists()) {
            handleSignal(snap.data());
          }
        });
      } catch (e) {}
    }

    // 2. BroadcastChannel & Storage fallback
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('bishal_webrtc_call_channel');
      bc.onmessage = (e) => handleSignal(e.data);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bishal_webrtc_signal' && e.newValue) {
        handleSignal(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      unsubFirestore();
    };
  }, [callState?.status, leadUser]);

  const initiateUserCall = async () => {
    if (!leadUser) {
      alert('Please fill out the chat registration details first to make a call.');
      return;
    }
    // Guard: already on a call
    if (callState && callState.status !== 'ended') {
      alert('⚠️ You are already on a call.');
      return;
    }
    await webRtcService.getMicrophoneStream();
    setCallState({
      status: 'calling',
      callerName: leadUser.name,
      callerRole: 'user',
      calleeName: 'Bishal Mishra (Admin)',
      sessionId: leadUser.sessionId
    });
    webRtcService.startRingtone();
    webRtcService.sendSignal({
      type: 'CALL_INIT',
      sessionId: leadUser.sessionId,
      callerName: leadUser.name,
      callerRole: 'user'
    });
  };

  const acceptIncomingUserCall = async () => {
    await webRtcService.getMicrophoneStream();
    webRtcService.stopRingtone();
    webRtcService.playCallConnectedChime();
    setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    if (callState) {
      webRtcService.sendSignal({
        type: 'CALL_ACCEPT',
        sessionId: callState.sessionId,
        callerName: leadUser?.name || 'Customer',
        callerRole: 'user'
      });
    }
  };

  const endActiveUserCall = () => {
    webRtcService.cleanup();
    webRtcService.playCallEndedChime();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (callState && leadUser) {
      webRtcService.sendSignal({
        type: 'CALL_END',
        sessionId: callState.sessionId,
        callerName: leadUser.name,
        callerRole: 'user'
      });
    }
    setCallState(null);
    setCallDuration(0);
  };

  // Load lead profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bishal_chat_lead_user');
      if (stored) {
        setLeadUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse lead profile:", e);
    }
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: "Hi! Welcome to Bishal Mishra's Support Desk! I'm here to help you explore our web dev services, free tools, pricing plans, tutorials, and developer APIs. You can also upload photos or screenshots for AI analysis! What can I help you find today?",
      senderType: 'bot',
      actionLinks: [
        { label: "View Pricing & Plans", route: "home" },
        { label: "Free Developer Tools", route: "services" },
        { label: "WhatsApp Support", route: "whatsapp" }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Submit Lead Form for First-Time Users
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const canonicalId = getCanonicalSessionId(leadEmail.trim());

    const newLead: UserLeadProfile = {
      name: leadName.trim(),
      email: leadEmail.trim(),
      phone: leadPhone.trim(),
      sessionId: canonicalId,
      createdAt: new Date().toISOString()
    };

    setLeadUser(newLead);
    localStorage.setItem('bishal_chat_lead_user', JSON.stringify(newLead));

    const welcomeMsg = {
      id: 'msg_welcome',
      sessionId: newLead.sessionId,
      sender: 'bot',
      text: `Hi ${newLead.name}! Welcome to Bishal Mishra's Support Desk. Your support session is registered. Bishal (Admin) has been notified. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newSession = {
      lead: newLead,
      messages: [welcomeMsg],
      lastUpdated: new Date().toISOString(),
      unreadAdminCount: 1
    };

    // 1. Sync to Firebase Firestore support_sessions
    try {
      await setDoc(doc(db, 'support_sessions', newLead.sessionId), newSession, { merge: true });
    } catch (err) {
      console.error("Failed to save lead session to Firebase Firestore support_sessions:", err);
    }

    // 2. ALSO save to Firebase Firestore submissions collection (Guaranteed permitted in Firebase Rules)
    try {
      await addDoc(collection(db, 'submissions'), {
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        message: 'Live Support Desk Chat Ticket Created',
        type: 'chat_lead',
        status: 'new',
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to save lead to submissions collection:", err);
    }

    // 3. Email Alert Notification to Bishal
    try {
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'bishalmishra9000@gmail.com',
          subject: `🚨 New Live Support Chat Lead: ${newLead.name}`,
          message: `New customer registered on live chat support!\nName: ${newLead.name}\nEmail: ${newLead.email}\nPhone: ${newLead.phone}`
        })
      }).catch(() => {});
    } catch (e) {}

    // 2. Sync to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('bishal_live_support_sessions') || '[]');
      const updated = [newSession, ...existing.filter((s: any) => s.lead?.email !== newLead.email)];
      localStorage.setItem('bishal_live_support_sessions', JSON.stringify(updated));

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('bishal_live_chat_channel');
        bc.postMessage({ type: 'NEW_LEAD', session: newSession });
        bc.close();
      }
    } catch (err) {
      console.error("Failed to register lead session in localStorage:", err);
    }

    setMessages([
      {
        role: 'bot',
        text: `Hi ${newLead.name}! Welcome to Bishal Mishra's Support Desk! Your support request has been registered and Bishal (Admin) is notified. How can I help you explore our services, pricing, or tools today?`,
        senderType: 'bot',
        actionLinks: [
          { label: "View Pricing & Plans", route: "home" },
          { label: "Free Developer Tools", route: "services" },
          { label: "WhatsApp Support", route: "whatsapp" }
        ]
      }
    ]);
  };

  // Real-time Firestore & Storage Sync of Admin Replies and Sessions
  useEffect(() => {
    if (!leadUser) return;

    // 1. Listen to Firebase Firestore document in real-time
    let unsubscribe: () => void = () => {};
    try {
      const docRef = doc(db, 'support_sessions', leadUser.sessionId);
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const mySession = docSnap.data();
          if (mySession && mySession.messages && mySession.messages.length > 0) {
            const formatted: ChatMessage[] = mySession.messages.map((m: any) => ({
              role: m.sender === 'user' ? 'user' : 'bot',
              text: m.text,
              image: m.image,
              fileName: m.fileName,
              senderType: m.sender
            }));
            setMessages(formatted);
          }
        }
      }, (err) => {
        console.warn("Firestore customer session listener error:", err);
      });
    } catch (e) {
      console.error("Failed to attach Firestore session listener:", e);
    }

    // 2. Fallback to localStorage & BroadcastChannel
    const syncMessagesFromStorage = () => {
      try {
        const stored = localStorage.getItem('bishal_live_support_sessions');
        if (stored) {
          const sessions = JSON.parse(stored);
          const mySession = sessions.find((s: any) => s.lead?.sessionId === leadUser.sessionId || s.lead?.email === leadUser.email);
          if (mySession && mySession.messages && mySession.messages.length > 0) {
            const formatted: ChatMessage[] = mySession.messages.map((m: any) => ({
              role: m.sender === 'user' ? 'user' : 'bot',
              text: m.text,
              image: m.image,
              fileName: m.fileName,
              senderType: m.sender
            }));
            setMessages(formatted);
          }
        }
      } catch (e) {
        console.error("Failed to sync live chat messages:", e);
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('bishal_live_chat_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ADMIN_REPLY' && (event.data.sessionId === leadUser.sessionId || event.data.email === leadUser.email)) {
          syncMessagesFromStorage();
          playNotificationSound();
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bishal_live_support_sessions') {
        syncMessagesFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      unsubscribe();
    };
  }, [leadUser]);

  // Show floating greeting popup for first-time visitors and auto-close after 2 seconds
  useEffect(() => {
    let hideTimer: any;
    const showTimer = setTimeout(() => {
      setShowGreetingBubble(true);
      playNotificationSound();

      // Automatically hide greeting bubble after 2 seconds
      hideTimer = setTimeout(() => {
        setShowGreetingBubble(false);
      }, 2000);
    }, 1800);

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const handleActionClick = (action: { label: string; route: string; slug?: string }) => {
    if (action.route === 'whatsapp') {
      window.open(SITE_KNOWLEDGE.contact.whatsapp, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action.route === 'home' && !action.slug) {
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) {
        pricingEl.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(action.route as any, action.slug);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload a file under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImage = file.type.startsWith('image/');
      setAttachedFile({
        name: file.name,
        type: file.type || (isImage ? 'image/png' : 'text/plain'),
        size: file.size,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        base64,
        isImage
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const syncUserMessageToSessions = async (userMsgText: string, imgData?: string, docName?: string) => {
    if (!leadUser) return;
    const msgObj = {
      id: 'usr_' + Date.now(),
      sessionId: leadUser.sessionId,
      sender: 'user',
      text: userMsgText,
      image: imgData,
      fileName: docName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const stored = localStorage.getItem('bishal_live_support_sessions');
      const sessions = stored ? JSON.parse(stored) : [];
      let sessionFound = false;
      let targetSessionObj: any = null;

      const updated = sessions.map((s: any) => {
        if (s.lead?.sessionId === leadUser.sessionId || s.lead?.email === leadUser.email) {
          sessionFound = true;
          targetSessionObj = {
            ...s,
            lead: leadUser,
            messages: [...(s.messages || []), msgObj],
            lastUpdated: new Date().toISOString(),
            unreadAdminCount: (s.unreadAdminCount || 0) + 1
          };
          return targetSessionObj;
        }
        return s;
      });

      if (!sessionFound) {
        targetSessionObj = {
          lead: leadUser,
          messages: [msgObj],
          lastUpdated: new Date().toISOString(),
          unreadAdminCount: 1
        };
        updated.unshift(targetSessionObj);
      }

      localStorage.setItem('bishal_live_support_sessions', JSON.stringify(updated));

      // 1. Sync User Message to Firebase Firestore
      try {
        await setDoc(doc(db, 'support_sessions', leadUser.sessionId), targetSessionObj, { merge: true });
      } catch (e) {
        console.error("Failed to sync user message to Firestore:", e);
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('bishal_live_chat_channel');
        bc.postMessage({ type: 'NEW_MESSAGE', sessionId: leadUser.sessionId });
        bc.close();
      }
    } catch (e) {
      console.error("Failed to sync user message:", e);
    }
  };

  const syncBotMessageToSessions = async (botMsgText: string) => {
    if (!leadUser) return;
    const msgObj = {
      id: 'bot_' + Date.now(),
      sessionId: leadUser.sessionId,
      sender: 'bot',
      text: botMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const stored = localStorage.getItem('bishal_live_support_sessions');
      if (!stored) return;
      const sessions = JSON.parse(stored);
      let targetSessionObj: any = null;

      const updated = sessions.map((s: any) => {
        if (s.lead?.sessionId === leadUser.sessionId || s.lead?.email === leadUser.email) {
          targetSessionObj = {
            ...s,
            messages: [...(s.messages || []), msgObj],
            lastUpdated: new Date().toISOString()
          };
          return targetSessionObj;
        }
        return s;
      });

      localStorage.setItem('bishal_live_support_sessions', JSON.stringify(updated));

      // 1. Sync Bot Message to Firebase Firestore
      if (targetSessionObj) {
        try {
          await setDoc(doc(db, 'support_sessions', leadUser.sessionId), targetSessionObj, { merge: true });
        } catch (e) {
          console.error("Failed to sync bot message to Firestore:", e);
        }
      }

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('bishal_live_chat_channel');
        bc.postMessage({ type: 'NEW_MESSAGE', sessionId: leadUser.sessionId });
        bc.close();
      }
    } catch (e) {
      console.error("Failed to sync bot message:", e);
    }
  };

  const handleSend = async (forcedQuery?: string) => {
    const messageToSend = forcedQuery || input;
    if ((!messageToSend.trim() && !attachedFile) || loading) return;

    const userMessage = messageToSend.trim() || (attachedFile ? `[Uploaded File: ${attachedFile.name}]` : '');
    const currentAttachment = attachedFile;

    if (!forcedQuery) {
      setInput('');
      setAttachedFile(null);
    }

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        text: userMessage,
        image: currentAttachment?.isImage ? currentAttachment.base64 : undefined,
        fileName: !currentAttachment?.isImage && currentAttachment ? currentAttachment.name : undefined,
        senderType: 'user'
      }
    ]);

    // Sync User message to Admin Sessions
    syncUserMessageToSessions(
      userMessage,
      currentAttachment?.isImage ? currentAttachment.base64 : undefined,
      !currentAttachment?.isImage && currentAttachment ? currentAttachment.name : undefined
    );

    setLoading(true);

    // Build human system prompt with exhaustive site knowledge & multimodal vision capabilities
    const systemInstruction = `You are the personal Human Support Representative for Bishal Mishra's official website (Bishal Codes).
Bishal Mishra is a world-class Full-Stack Developer & Digital Strategist with 3+ years experience and 300+ sites built.

STRICT TONE & HUMANIZE GUIDELINES:
- Speak warmly, empathetically, naturally, and conversationally like a helpful human support specialist texting a customer.
- NEVER say "As an AI language model", "I am programmed", "As an artificial intelligence", or sound robotic.
- Always be clear, friendly, and practical. Use Markdown lists, bold text, and clean formatting.
- If an image or screenshot is attached: Thoroughly analyze the visual elements, text in screenshot, error messages, or UI design details. Provide direct actionable feedback, bug fixes, or explain how Bishal can build/replicate it!
- If asked about pricing: Mention Informative (Rs. 10K-25K), E-Commerce (Rs. 25K-55K), Enterprise (Rs. 50K+).
- If asked about tools or how to use them: Give step-by-step clear 1-2-3 instructions.
- If asked for contact details: Mention WhatsApp/Phone +977 9827801575 and Email bishalmishra9000@gmail.com.

DETAILED KNOWLEDGE OF THE SITE:
- Tools (23+): Website Screenshot Studio, Developer Card Studio, File Transfer (100GB P2P), AI Background Remover, AI OCR Extractor, AI Document Summarizer, Code Runner Sandbox, Doc Scanner PDF, QR Code Studio, Secure Vault, Image Compressor, PDF Merger, PDF to Image, JPG to PDF, PDF Page Number Adder, Currency Converter, Nepali Date Converter (AD ↔ BS), JSON Formatter, Diff Checker, Font Downloader, Language Translator, EMI Calculator, Typing Practice.
- Pages: Home (/), About (/about), Services & Tools (/services), Pricing (/pricing), AI Studio (/ai-studio), Blog (/blog), Developer Portal (/developers), Docs (/docs), Dashboard (/dashboard), Contact (/contact).

If you generate code snippets, enclose them in markdown block code syntax so the live sandbox runner can execute them.`;

    if (!isKeyAvailable) {
      // Use local human response engine if API key is not yet set
      setTimeout(() => {
        const localResp = generateLocalHumanResponse(userMessage, !!currentAttachment, currentAttachment?.name);
        setMessages(prev => [...prev, { role: 'bot', text: localResp.text, actionLinks: localResp.actionLinks, senderType: 'bot' }]);
        syncBotMessageToSessions(localResp.text);
        setLoading(false);
        playNotificationSound();
      }, 400);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      let responseText = "";

      const contentsParts: any[] = [];
      if (currentAttachment && currentAttachment.base64) {
        const base64Data = currentAttachment.base64.split(',')[1];
        contentsParts.push({
          inlineData: {
            mimeType: currentAttachment.type || 'image/png',
            data: base64Data
          }
        });
      }
      contentsParts.push({ text: userMessage || "Please analyze this uploaded photo/screenshot." });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentsParts,
          config: { systemInstruction },
        });
        responseText = response.text || "";
      } catch (err) {
        console.warn("gemini-2.5-flash failed, falling back to gemini-3-flash-preview:", err);
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contentsParts,
          config: { systemInstruction },
        });
        responseText = response.text || "";
      }

      if (!responseText) {
        const localResp = generateLocalHumanResponse(userMessage, !!currentAttachment, currentAttachment?.name);
        setMessages(prev => [...prev, { role: 'bot', text: localResp.text, actionLinks: localResp.actionLinks, senderType: 'bot' }]);
        syncBotMessageToSessions(localResp.text);
      } else {
        const localResp = generateLocalHumanResponse(userMessage, !!currentAttachment, currentAttachment?.name);
        setMessages(prev => [...prev, { role: 'bot', text: responseText, actionLinks: localResp.actionLinks, senderType: 'bot' }]);
        syncBotMessageToSessions(responseText);
      }
      playNotificationSound();
    } catch (e: any) {
      console.warn("Gemini API call warning - utilizing local human support fallback:", e);
      const localResp = generateLocalHumanResponse(userMessage, !!currentAttachment, currentAttachment?.name);
      setMessages(prev => [...prev, { role: 'bot', text: localResp.text, actionLinks: localResp.actionLinks, senderType: 'bot' }]);
      syncBotMessageToSessions(localResp.text);
      playNotificationSound();
    } finally {
      setLoading(false);
    }
  };

  if (isEmbeddedIframe) return null;

  return (
    <>
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={(key) => {
          saveApiKey(key);
          setIsKeyModalOpen(false);
          setMessages(prev => [...prev, { role: 'bot', text: "Thanks! Support desk is fully connected. How can I help you today?" }]);
        }}
      />

      {/* Floating Customer Support Live Chat Box Container */}
      <div className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-[100]">
        {isOpen ? (
          <div className="w-[calc(100vw-2rem)] sm:w-[350px] h-[480px] max-h-[82vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

            {/* Humanized Support Header */}
            <div className="bg-black px-3.5 py-3 text-white flex items-center justify-between shadow-md relative border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-400/90 shadow-sm bg-slate-800 flex items-center justify-center">
                    {!avatarError ? (
                      <img
                        src="/bishal.png"
                        alt="Bishal Mishra"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">BM</span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs tracking-tight text-white">Bishal Mishra</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                      <CustomerSupportChatIcon size={10} className="text-emerald-400" />
                      Support
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Online • Replies instantly
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={initiateUserCall}
                  className="p-1.5 bg-[#e52521]/20 hover:bg-[#e52521]/30 text-indigo-300 rounded-lg transition-all active:scale-95"
                  title="Make Live In-App Web Call to Bishal"
                >
                  <PhoneCall size={15} />
                </button>
                <a
                  href={SITE_KNOWLEDGE.contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle size={15} />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
                  aria-label="Close Support Desk"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Contact & Info Sub-Bar */}
            <div className="bg-slate-100/90 dark:bg-slate-900 px-3 py-1.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <HelpCircle size={11} className="text-[#e52521] dark:text-[#d01f1c]" /> Support Desk
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${SITE_KNOWLEDGE.contact.phone}`}
                  className="text-indigo-700 dark:text-[#d01f1c] hover:underline font-semibold flex items-center gap-0.5"
                >
                  <Phone size={9} /> Call (+977 9827801575)
                </a>
                <span>•</span>
                <a
                  href={SITE_KNOWLEDGE.contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
                >
                  <MessageCircle size={9} /> WhatsApp
                </a>
              </div>
            </div>

            {!leadUser ? (
              /* First-Time User Lead Capture Form */
              <div className="flex-1 p-5 flex flex-col justify-center bg-slate-950 text-white animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                  <CustomerSupportChatIcon size={24} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Welcome to Bishal Codes Support!</h3>
                <p className="text-[11px] text-slate-300 mt-1 mb-4 leading-relaxed font-medium">
                  Please provide your details below to start live support. Your session will be recorded and connected live with Bishal (Admin).
                </p>

                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. Bishal Kumar Mishra"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gmail / Email ID *</label>
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="e.g. bishal@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mobile / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="e.g. +977 9827801575"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 mt-2"
                  >
                    <span>Start Support Chat</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            ) : (
              <>

            {/* Messages Scroll Container */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60 dark:bg-slate-900/60 text-xs">
              {messages.map((m, i) => {
                const markdownComponents: any = {
                  pre({ children }: any) {
                    return <ChatPre onRun={(code) => setPreviewCode(code)}>{children}</ChatPre>;
                  },
                  a({ href, children }: any) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#e52521] dark:text-[#d01f1c] hover:underline font-semibold"
                      >
                        {children}
                      </a>
                    );
                  }
                };

                return (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'bot' && (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-400/80 bg-slate-900 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        {!avatarError ? (
                          <img
                            src="/bishal.png"
                            alt="Bishal Mishra"
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <span className="text-white font-bold text-[9px]">BM</span>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl text-xs font-normal leading-relaxed ${m.role === 'user'
                        ? 'bg-slate-900 dark:bg-[#e52521] text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                        }`}>
                        {/* User Uploaded Image Preview in Bubble */}
                        {m.role === 'user' && m.image && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                            <img src={m.image} alt="Uploaded attachment" className="max-w-[200px] max-h-[160px] object-cover rounded-md" />
                          </div>
                        )}
                        {/* User Uploaded Document Chip */}
                        {m.role === 'user' && m.fileName && !m.image && (
                          <div className="mb-1.5 flex items-center gap-1.5 bg-slate-800/90 dark:bg-slate-900 px-2.5 py-1 rounded-md text-[11px] text-indigo-200 border border-slate-700">
                            <FileText size={12} className="text-[#d01f1c] shrink-0" />
                            <span className="truncate max-w-[160px]">{m.fileName}</span>
                          </div>
                        )}
                        {m.role === 'bot' ? (
                          <div className="prose prose-xs max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 text-slate-800 dark:text-slate-100 prose-headings:text-slate-900 dark:prose-headings:text-white prose-strong:text-slate-900 dark:prose-strong:text-white text-xs">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {m.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          m.text
                        )}
                      </div>

                      {/* Interactive Navigation Action Chips */}
                      {m.role === 'bot' && m.actionLinks && m.actionLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.actionLinks.map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionClick(act)}
                              className="px-2 py-1 bg-red-50 dark:bg-indigo-950/80 hover:bg-red-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-red-200/80 dark:border-indigo-800/80 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                            >
                              <span>{act.label}</span>
                              <ArrowRight size={10} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-400/80 bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                    {!avatarError ? (
                      <img
                        src="/bishal.png"
                        alt="Bishal Mishra"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="text-white font-bold text-[9px]">BM</span>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-500 dark:text-slate-300 text-xs font-medium">
                    <span>Bishal is analyzing</span>
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-[#e52521] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-[#e52521] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-[#e52521] rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions Bar */}
            <div className="px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800 overflow-x-auto flex gap-1 scrollbar-hide shrink-0">
              <button
                onClick={() => handleSend("What are your pricing plans?")}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-indigo-900/60 hover:text-[#d01f1c] dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-md text-[9.5px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 transition-colors flex items-center gap-1"
              >
                <DollarSign size={9} /> Pricing
              </button>
              <button
                onClick={() => handleSend("What free tools are available and how to use them?")}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-indigo-900/60 hover:text-[#d01f1c] dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-md text-[9.5px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 transition-colors flex items-center gap-1"
              >
                <Wrench size={9} /> Tools Guide
              </button>
              <button
                onClick={() => handleSend("What web development services do you offer?")}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-indigo-900/60 hover:text-[#d01f1c] dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-md text-[9.5px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 transition-colors flex items-center gap-1"
              >
                <User size={9} /> Services
              </button>
              <button
                onClick={() => handleSend("Tell me about Developer Portal and APIs")}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-indigo-900/60 hover:text-[#d01f1c] dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-md text-[9.5px] font-semibold text-slate-600 dark:text-slate-300 shrink-0 transition-colors flex items-center gap-1"
              >
                <Key size={9} /> APIs & Docs
              </button>
            </div>

            {/* Attachment Preview Bar */}
            {attachedFile && (
              <div className="px-3 py-1.5 bg-red-50/90 dark:bg-indigo-950/80 border-t border-red-100 dark:border-indigo-900 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-100">
                <div className="flex items-center gap-2 truncate max-w-[85%]">
                  {attachedFile.isImage ? (
                    <img src={attachedFile.previewUrl || attachedFile.base64} alt="Attachment" className="w-7 h-7 object-cover rounded border border-red-200 dark:border-indigo-800 shrink-0" />
                  ) : (
                    <FileText size={16} className="text-[#e52521] dark:text-[#d01f1c] shrink-0" />
                  )}
                  <span className="font-semibold text-indigo-950 dark:text-indigo-100 truncate text-[11px]">{attachedFile.name}</span>
                  <span className="text-[9px] text-[#e52521] dark:text-indigo-300 shrink-0">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-red-100 dark:hover:bg-indigo-900 rounded transition-colors"
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Humanized Input Area */}
            <div className="p-2.5 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.json,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg transition-colors shrink-0 ${attachedFile ? 'text-[#e52521] bg-red-50 dark:bg-indigo-950 dark:text-[#d01f1c]' : 'text-slate-400 dark:text-slate-400 hover:text-[#d01f1c] dark:hover:text-[#d01f1c] hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Upload screenshot or photo for AI analysis"
              >
                <Paperclip size={15} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={attachedFile ? "Add details about this upload..." : "Ask or attach screenshot/photo..."}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachedFile) || loading}
                className="w-8 h-8 bg-slate-900 dark:bg-[#e52521] hover:bg-[#e52521] dark:hover:bg-[#e52521] text-white rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:active:scale-100 shrink-0"
                aria-label="Send Message"
              >
                <Send size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    ) : (
          /* Floating Message Icon Launcher Button with First-Time Greeting Popover */
          <div className="relative">
            {/* First-time Greeting Floating Popup */}
            {showGreetingBubble && (
              <div
                onClick={() => {
                  setIsOpen(true);
                  setShowGreetingBubble(false);
                  playNotificationSound();
                }}
                className="absolute bottom-full left-0 mb-3 w-72 sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl shadow-2xl border border-red-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300 cursor-pointer group/bubble hover:border-indigo-400 dark:hover:border-[#e52521]"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden shadow-xs bg-slate-900 flex items-center justify-center">
                      {!avatarError ? (
                        <img
                          src="/bishal.png"
                          alt="Bishal Mishra"
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <span className="text-white font-bold text-xs">BM</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Bishal Mishra</h4>
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">Online</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-snug mt-1">
                      Hi! Need help with web development, pricing, or free tools? Let's chat!
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGreetingBubble(false);
                    }}
                    className="text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close message"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* Pointer triangle */}
                <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white dark:bg-slate-900 rotate-45 border-l border-b border-red-100 dark:border-slate-700" />
              </div>
            )}

            {/* Developer Picture Floating Launcher Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                setShowGreetingBubble(false);
                playNotificationSound();
              }}
              className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 hover:bg-[#e52521] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-slate-200 dark:border-slate-800 p-0.5 overflow-hidden cursor-pointer"
              aria-label="Open Chat Support"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
                {!avatarError ? (
                  <img
                    src="/bishal.png"
                    alt="Bishal Mishra"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-white font-bold text-base">BM</span>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Sandbox Execution Modal */}
      {previewCode && (
        <CodePreviewModal
          code={previewCode}
          onClose={() => setPreviewCode(null)}
        />
      )}

      {/* In-App Voice Call Overlay Modal */}
      <WebVoiceCallModal
        callState={callState}
        onAcceptCall={acceptIncomingUserCall}
        onEndCall={endActiveUserCall}
        onToggleMute={() => setIsMuted(prev => !prev)}
        isMuted={isMuted}
        callDuration={callDuration}
        myRole="user"
      />
    </>
  );
};

export default AIAssistant;
