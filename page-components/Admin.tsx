
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
// @ts-ignore - Suppress misleading named export error for Firebase Firestore
import { getDoc, doc, query, collection, orderBy, getDocs, setDoc, addDoc, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Removed storage import
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Plus, Trash2, LogOut, Layout, Briefcase, FileText, Home, Loader2, 
  ShieldCheck, Settings, Bell, Sparkles, User, Users, DollarSign, HelpCircle, 
  Mail, Phone, ExternalLink, Inbox, CheckCircle, Menu, X, Wand2, Save,
  MessageSquare, Zap, Database, Edit3, Search, Image as ImageIcon, Link as LinkIcon,
  CheckCircle2, Eye, Clock, List, ArrowRight, UploadCloud, Video, Image, File,
  AlertTriangle, Share2, Activity, Globe, Cpu, BarChart3, Wifi, Package, Code, Book, Terminal,
  Coins, Star, GalleryVertical // Added Coins, Star, GalleryVertical icons
} from 'lucide-react'; 
import { useNavigation } from '../context/NavigationContext';
import { LegalPage as LegalPageType, Project, SocialLink, Report, PaymentRequest, PathPage, Testimonial, Experience } from '../types'; // Import SocialLink, Report, PaymentRequest, Testimonial, and Experience types
// Removed Firebase Storage functions: ref, uploadBytes, getDownloadURL
import { uploadToCloudinary } from '../services/cloudinary';
import { useApiKey } from '../hooks/useApiKey';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type AdminTab = 'dashboard' | 'hero' | 'about' | 'projects' | 'blog' | 'pricing' | 'faq' | 'leads' | 'system' | 'legal' | 'socials' | 'reports' | 'payments' | 'testimonials' | 'experience' | 'services' | 'seo' | 'users'; // Added 'payments', 'testimonials', 'experience', 'seo', and 'users'

// FIX: Define an interface for sidebar tab items to ensure correct type inference.
interface SidebarTab {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
}

// Helper function to validate Gemini API Key with detailed console output
const validateGeminiApiKey = (apiKey: string | null): boolean => {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.trim() === '') {
    console.error(
      "🚨 CRITICAL GEMINI API KEY ERROR - WITHIN APP CHECK 🚨\n" +
      "--------------------------------------------------\n" +
      "Gemini API Key is missing, empty, or still the placeholder `YOUR_GEMINI_API_KEY_HERE`.\n" +
      "AI features cannot function without a valid API Key.\n" +
      "1. Obtain your API Key from: https://ai.google.dev/gemini-api/docs/api-key\n" +
      "2. For local development, **DIRECTLY EDIT `index.html`** and replace the placeholder `AIzaSyC_9-L0CSSKdNgm1LuEK0-HNxEtwojqrZ0` (or `YOUR_GEMINI_API_KEY_HERE`) with your actual key in the `<script>` shim.\n" +
      "3. If using a build tool, ensure your environment variable is correctly named `API_KEY` (e.g., `API_KEY=your_key_here`) and NOT `GERNINT_API_KEY` in your `.env` file.\n" +
      "   Also, verify your build process successfully loads `process.env.API_KEY` into the browser's runtime environment.\n" +
      "--------------------------------------------------"
    );
    alert(
      "Gemini API Key is missing or invalid.\n" +
      "Please check the browser console (F12) for detailed instructions on how to set it up.\n" +
      "HINT: Ensure it is configured correctly in the System settings or Vercel environment variables."
    );
    return false;
  } else {
    console.log(
      "✅ Gemini API Key Status (from `validateGeminiApiKey`): Detected and looks present.\n" +
      `   Key preview: "${apiKey.substring(0, 5)}...". Total length: ${apiKey.length}.`
    );
    return true;
  }
};

interface PaymentProofViewerProps {
  base64Image: string;
  onClose: () => void;
}

const PaymentProofViewer: React.FC<PaymentProofViewerProps> = ({ base64Image, onClose }) => {
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-labelledby="payment-proof-title">
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10" aria-label="Close payment proof viewer">
          <X size={24} />
        </button>

        <div className="p-8 sm:p-12 text-center">
          <h2 id="payment-proof-title" className="text-3xl font-black text-slate-900 italic tracking-tighter mb-8">Payment Proof</h2>
          <div className="relative w-full h-96 bg-slate-100 flex items-center justify-center rounded-2xl border border-slate-200 overflow-hidden">
            {imageLoading && <Loader2 className="animate-spin text-indigo-600" size={48} role="status" aria-label="Loading image" />}
            <img
              src={`data:image/jpeg;base64,${base64Image}`}
              alt="Payment Proof"
              className={`max-w-full max-h-full object-contain ${imageLoading ? 'hidden' : 'block'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                alert("Failed to load image. It might be corrupted or invalid Base64 data.");
              }}
            />
          </div>
          <button onClick={onClose} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold">Close Viewer</button>
        </div>
      </div>
    </div>
  );
};

  const DEFAULT_SEO_METADATA: Record<string, { title: string; description: string; keywords: string; canonical: string; ogImage: string }> = {
    home: {
      title: "Bishal Mishra | Full-Stack Web Developer & Designer Portfolio",
      description: "Hi, I'm Bishal Mishra. I build fast, clean, and interactive websites and web applications. Explore my portfolio projects, read my blog, or get in touch for custom web development.",
      keywords: "Bishal Mishra, Bishal Codes, Full Stack Developer Nepal, Web Developer, Next.js Expert, React Developer, UI/UX Designer, Professional Web Development, JavaScript Expert, TypeScript, Freelance Web Developer",
      canonical: "https://bishalcodes.com/",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    about: {
      title: "About Me | Bishal Mishra | Full-Stack Web Developer & Designer",
      description: "Learn more about Bishal Mishra, a passionate software developer and designer specialized in Next.js, React, Node.js, and cloud architectures.",
      keywords: "Bishal Mishra, software engineer Nepal, portfolio, about bishal, web designer",
      canonical: "https://bishalcodes.com/about",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    services: {
      title: "Services & Developer Utilities | Bishal Codes",
      description: "Explore clean, high-utility online developer tools, converters, compressors, formatters, and custom web development packages.",
      keywords: "developer tools, utilities, online converters, file compression, JSON formatter, Bishal Codes",
      canonical: "https://bishalcodes.com/services",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    projects: {
      title: "Portfolio Projects | Bishal Mishra | Full-Stack Web Architect",
      description: "Browse custom projects, web applications, SaaS platforms, and digital designs built by full-stack developer Bishal Mishra.",
      keywords: "portfolio projects, SaaS applications, nextjs portfolio, developer work",
      canonical: "https://bishalcodes.com/projects",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    experience: {
      title: "Professional Experience & Resume | Bishal Mishra",
      description: "View the career timeline, technologies used, and project achievements of software engineer Bishal Mishra.",
      keywords: "resume, cv, work timeline, professional developer, software engineer",
      canonical: "https://bishalcodes.com/experience",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    contact: {
      title: "Contact & Collaboration | Hire Full-Stack Developer | Bishal Mishra",
      description: "Get in touch with Bishal Mishra for freelancing, custom web development, consulting, or project collaborations.",
      keywords: "hire developer, contact bishal, freelance developer, software consulting",
      canonical: "https://bishalcodes.com/contact",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    blog: {
      title: "Bishal Codes Blog | Full-Stack Development Insights",
      description: "Read technical articles, tutorials, web design tips, and career guides on modern JavaScript, React, Next.js, and cloud engineering.",
      keywords: "programming blog, web development tips, nextjs tutorial, tech articles",
      canonical: "https://bishalcodes.com/blog",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    docs: {
      title: "Developer Documentation Hub | Bishal Codes Utilities",
      description: "Comprehensive API guides, direct usage instructions, and comparisons for the developer utility suite by Bishal Codes.",
      keywords: "API docs, developer guides, file transfer limit comparison, utilities documentation",
      canonical: "https://bishalcodes.com/docs",
      ogImage: "https://ik.imagekit.io/bishalc/desktop.png",
    },
    'tools-date-converter': {
      title: "Nepali Date Converter | AD to BS & BS to AD Date Converter | Bishal Codes",
      description: "Convert English (AD) dates to Nepali (BS) dates and vice versa with precision. An accurate, offline-capable date converter utility by Bishal Codes.",
      keywords: "Nepali Date Converter, AD to BS Converter, BS to AD Converter, Bikram Sambat, Gregorian to Nepali, Nepali Calendar converter",
      canonical: "https://bishalcodes.com/tools/date-converter",
      ogImage: "https://bishalcodes.com/seo-images/date-converter.png",
    },
    'tools-currency-converter': {
      title: "USD Currency Converter | Live Exchange Rates to NPR, INR, PKR & More | Bishal Codes",
      description: "Convert USD to Nepali Rupee (NPR), Indian Rupee (INR), Pakistani Rupee (PKR), Sri Lankan Rupee, and 20+ other currencies using live exchange rates.",
      keywords: "USD to NPR, USD to INR, USD to PKR, dollar to rupee, live exchange rate, currency converter",
      canonical: "https://bishalcodes.com/tools/currency-converter",
      ogImage: "https://bishalcodes.com/seo-images/currency-converter.png",
    },
    'tools-translator': {
      title: "Language Translator | English to Nepali & All Languages | Bishal Codes",
      description: "Translate text in real-time between English, Nepali, and all major global languages. High-accuracy translation powered by Google Translate.",
      keywords: "English to Nepali translator, Nepali to English translation, language translator, Google Translate",
      canonical: "https://bishalcodes.com/tools/translator",
      ogImage: "https://bishalcodes.com/seo-images/translator.png",
    },
    'tools-ai-summarizer': {
      title: "AI Document Summarizer | Free PDF Summarizer Online | Bishal Codes",
      description: "Instantly summarize large PDF documents, books, and research papers using advanced AI. Fast, accurate, and completely free online AI document summarizer.",
      keywords: "AI PDF summarizer, document summarizer, AI text summarizer, summarize PDF online",
      canonical: "https://bishalcodes.com/tools/ai-summarizer",
      ogImage: "https://bishalcodes.com/seo-images/ai-summarizer.png",
    },
    'tools-pdf-to-image': {
      title: "PDF to Image Converter | Convert PDF Pages to JPG/PNG | Bishal Codes",
      description: "Extract high-quality images from PDF pages or convert the entire document to JPG, PNG, and WebP instantly, completely in-browser.",
      keywords: "PDF to JPG, PDF to PNG, extract images from PDF, convert PDF pages",
      canonical: "https://bishalcodes.com/tools/pdf-to-image",
      ogImage: "https://bishalcodes.com/seo-images/pdf-to-image.png",
    },
    'tools-dev-card-studio': {
      title: "Developer Card Studio | Design Business Cards Online | Bishal Codes",
      description: "Design and customize stunning HTML/CSS digital business cards, interactive developer cards, or professional portfolios in minutes.",
      keywords: "developer card, portfolio maker, digital business card, CSS template design",
      canonical: "https://bishalcodes.com/tools/dev-card-studio",
      ogImage: "https://bishalcodes.com/seo-images/dev-card-studio.png",
    },
    'tools-add-page-numbers': {
      title: "Add Page Numbers to PDF | Free PDF Page Numberer | Bishal Codes",
      description: "Quickly label and customize page numbers on your PDF document. Define layouts, offsets, styles, and download instantly.",
      keywords: "add page numbers, label PDF pages, PDF pager tool, number PDF online",
      canonical: "https://bishalcodes.com/tools/add-page-numbers",
      ogImage: "https://bishalcodes.com/seo-images/add-page-numbers.png",
    },
    'tools-merge-pdf': {
      title: "Merge PDF Documents | Combine Multiple PDFs Online | Bishal Codes",
      description: "Combine multiple PDF files into a single consolidated PDF document. Simple drag-and-drop ordering, fully secure and client-side.",
      keywords: "merge pdf, combine pdf pages, join pdf files, free pdf merger",
      canonical: "https://bishalcodes.com/tools/merge-pdf",
      ogImage: "https://bishalcodes.com/seo-images/merge-pdf.png",
    },
    'tools-jpg-to-pdf': {
      title: "JPG to PDF Converter | Convert Images to PDF Document | Bishal Codes",
      description: "Convert JPG, PNG, WebP, and other image file formats into a beautifully structured, standard PDF document in seconds.",
      keywords: "jpg to pdf, png to pdf, convert image to document, free image to pdf",
      canonical: "https://bishalcodes.com/tools/jpg-to-pdf",
      ogImage: "https://bishalcodes.com/seo-images/jpg-to-pdf.png",
    },
    'tools-image-compressor': {
      title: "AI Image Compressor & Optimizer | Reduce Image File Size | Bishal Codes",
      description: "Compress images up to 90% without losing visual quality. Ideal for PNG, JPG, and WebP optimization before uploading.",
      keywords: "image compressor, reduce image size, optimize web images, png compressor",
      canonical: "https://bishalcodes.com/tools/image-compressor",
      ogImage: "https://bishalcodes.com/seo-images/image-compressor.png",
    },
    'tools-emi-calculator': {
      title: "Loan EMI Calculator | Calculate Monthly Loan Installments | Bishal Codes",
      description: "Accurately compute monthly loan installments, interest schedules, and total repayment breakdowns with our loan EMI calculator.",
      keywords: "emi calculator, loan installment calculator, interest payments calculator, mortgage calculator",
      canonical: "https://bishalcodes.com/tools/emi-calculator",
      ogImage: "https://bishalcodes.com/seo-images/emi-calculator.png",
    },
    'tools-qr-studio': {
      title: "QR Code Studio | Custom QR Code Generator & Designer | Bishal Codes",
      description: "Create customizable QR codes for text, URLs, Wi-Fi, email, and social links. Style colors, borders, custom logos, and downloads.",
      keywords: "qr code generator, customized qr codes, make free qr code, qr maker with logo",
      canonical: "https://bishalcodes.com/tools/qr-studio",
      ogImage: "https://bishalcodes.com/seo-images/qr-studio.png",
    },
    'tools-json-formatter': {
      title: "JSON Formatter & Parser | Format, Validate & Prettify JSON | Bishal Codes",
      description: "Format, validate, prettify, and minify your JSON data in real-time with automatic syntax checking, folding, and clipboard actions.",
      keywords: "json formatter, json validator, prettify json online, parse json tool",
      canonical: "https://bishalcodes.com/tools/json-formatter",
      ogImage: "https://bishalcodes.com/seo-images/json-formatter.png",
    },
    'tools-diff-checker': {
      title: "Online Diff Checker | Compare Code, Text & Files Side-by-Side | Bishal Codes",
      description: "Compare text, code scripts, and configuration files side-by-side to highlight additions, removals, and replacements instantly.",
      keywords: "diff checker, code comparison tool, compare text files, visual diff tool",
      canonical: "https://bishalcodes.com/tools/diff-checker",
      ogImage: "https://bishalcodes.com/seo-images/diff-checker.png",
    },
    'tools-code-runner': {
      title: "Interactive Code Runner & Editor | Run JavaScript & CSS Online | Bishal Codes",
      description: "Write, edit, and execute HTML, CSS, and JavaScript directly in your browser. Real-time visual iframe updates and syntax console output.",
      keywords: "online code editor, code runner, run javascript browser, live css editing",
      canonical: "https://bishalcodes.com/tools/code-runner",
      ogImage: "https://bishalcodes.com/seo-images/code-runner.png",
    },
    'tools-screenshot-studio': {
      title: "Website Screenshot Studio | Capture Full Scrolling Screen | Bishal Codes",
      description: "Capture high-resolution full-page scrolling screenshots of any site. Customize device viewports, resolutions, and download captures instantly.",
      keywords: "website screenshot capture, full page scrolling screenshot, browser mock screenshot",
      canonical: "https://bishalcodes.com/tools/screenshot-studio",
      ogImage: "https://bishalcodes.com/seo-images/screenshot-studio.png",
    },
    'tools-file-transfer': {
      title: "BishalTransfer | Secure 100GB End-to-End P2P File Sharing | Bishal Codes",
      description: "Transfer files up to 100 GB directly to any device via peer-to-peer WebRTC connection. Encrypted, fast, and completely secure.",
      keywords: "secure file transfer, WebRTC P2P sharing, bishaltransfer, send large files online",
      canonical: "https://bishalcodes.com/tools/file-transfer",
      ogImage: "https://bishalcodes.com/seo-images/file-transfer.png",
    },
    'tools-secure-vault': {
      title: "Secure Vault | Password Encrypted Zero-Knowledge File Share | Bishal Codes",
      description: "Store and share files inside client-side encrypted password-protected vaults. High security zero-knowledge file encryption.",
      keywords: "zero knowledge encrypted vault, password protected file sharing, secure vault drive",
      canonical: "https://bishalcodes.com/tools/secure-vault",
      ogImage: "https://bishalcodes.com/seo-images/secure-vault.png",
    },
  };

const Admin: React.FC = () => {
  const [user, userLoading] = useAuthState(auth);
  const { navigate } = useNavigation();
  const { apiKey: geminiApiKey } = useApiKey(); // Added useApiKey hook
  const [adminGeminiKey, setAdminGeminiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminActiveTab') as AdminTab;
      return saved || 'dashboard';
    }
    return 'dashboard';
  }); // Default to dashboard or saved state

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab]);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [humanizeLoading, setHumanizeLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Payment Proof Viewer State
  const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);
  const [currentProofBase64, setCurrentProofBase64] = useState('');


  // Data Lists
  const [projects, setProjects] = useState<Project[]>([]); // Use Project type
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]); // State for reports
  const [payments, setPayments] = useState<PaymentRequest[]>([]); // State for payments
  const [services, setServices] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [legalPages, setLegalPages] = useState<LegalPageType[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]); // State for testimonials
  const [experiences, setExperiences] = useState<Experience[]>([]); // State for experiences
  const [dashboardUsers, setDashboardUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // SEO Pages list & state variables
  const SEO_PAGES = [
    { id: 'home', name: 'Home Page' },
    { id: 'about', name: 'About Page' },
    { id: 'services', name: 'Services & Tools Page' },
    { id: 'projects', name: 'Projects Page' },
    { id: 'experience', name: 'Experience Page' },
    { id: 'contact', name: 'Contact Page' },
    { id: 'blog', name: 'Blog Home Page' },
    { id: 'docs', name: 'Docs Home Page' },
    { id: 'tools-date-converter', name: 'Tool: Date Converter' },
    { id: 'tools-currency-converter', name: 'Tool: Currency Converter' },
    { id: 'tools-translator', name: 'Tool: Translator' },
    { id: 'tools-ai-summarizer', name: 'Tool: AI Summarizer' },
    { id: 'tools-pdf-to-image', name: 'Tool: PDF to Image' },
    { id: 'tools-dev-card-studio', name: 'Tool: Dev Card Studio' },
    { id: 'tools-add-page-numbers', name: 'Tool: Add Page Numbers' },
    { id: 'tools-merge-pdf', name: 'Tool: Merge PDF' },
    { id: 'tools-jpg-to-pdf', name: 'Tool: JPG to PDF' },
    { id: 'tools-image-compressor', name: 'Tool: Image Compressor' },
    { id: 'tools-emi-calculator', name: 'Tool: EMI Calculator' },
    { id: 'tools-qr-studio', name: 'Tool: QR Studio' },
    { id: 'tools-json-formatter', name: 'Tool: JSON Formatter' },
    { id: 'tools-diff-checker', name: 'Tool: Diff Checker' },
    { id: 'tools-code-runner', name: 'Tool: Code Runner' },
    { id: 'tools-screenshot-studio', name: 'Tool: Screenshot Studio' },
    { id: 'tools-file-transfer', name: 'Tool: File Transfer' },
    { id: 'tools-secure-vault', name: 'Tool: Secure Vault' },
  ];

  const [selectedSeoPage, setSelectedSeoPage] = useState<string>('home');
  const [seoForm, setSeoForm] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    canonical: '',
  });
  
  // Hero slide custom schema interface
  interface HeroSlide {
    imageUrl: string;
    title: string;
    subtitle: string;
    description: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    primaryBtnColor: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
    secondaryBtnColor: string;
    titleColor?: string;
    subtitleColor?: string;
    descriptionColor?: string;
    mobileImageUrl?: string;
    titleSizeMobile?: number;
    titleSizeDesktop?: number;
    subtitleSizeMobile?: number;
    subtitleSizeDesktop?: number;
    descSizeMobile?: number;
    descSizeDesktop?: number;
  }

  const defaultMappedSlides: HeroSlide[] = [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1920',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920',
    'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1920'
  ].map((slide, index) => ({
    imageUrl: slide,
    title: index === 0 ? "Hi, I'm Bishal Mishra" : `Specialized Solutions #${index + 1}`,
    subtitle: index === 0 ? "Full-Stack Developer & Web Architect" : `Tailored for Scale #${index + 1}`,
    description: index === 0 ? "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences." : `Delivering pixel-perfect components and clean, robust cloud services.`,
    primaryBtnText: 'View My Work',
    primaryBtnLink: 'projects',
    primaryBtnColor: '#6366f1',
    secondaryBtnText: 'Get in Touch',
    secondaryBtnLink: 'contact',
    secondaryBtnColor: 'transparent',
    titleColor: '#ffffff',
    subtitleColor: '#818cf8',
    descriptionColor: '#e2e8f0',
    mobileImageUrl: slide,
    titleSizeMobile: 2.0,
    titleSizeDesktop: 4.5,
    subtitleSizeMobile: 1.125,
    subtitleSizeDesktop: 1.5,
    descSizeMobile: 0.875,
    descSizeDesktop: 1.125,
  }));

  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  // Settings / Identity State (Hardcoded Defaults)
  const [heroData, setHeroData] = useState<{
    title: string;
    subtitle: string;
    description: string;
    slides: HeroSlide[];
    sliderHeightMobile?: number;
    sliderHeightDesktop?: number;
  }>({
    title: "Hi, I'm Bishal Mishra",
    subtitle: "Full-Stack Developer & Web Architect",
    description: "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences.",
    slides: defaultMappedSlides,
    sliderHeightMobile: 50,
    sliderHeightDesktop: 100,
  });
  const [aboutData, setAboutData] = useState({ 
    title: 'Full-Stack Web Architect', 
    experience: '3+ Years', 
    bio: "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.", 
    phone: '+977 9828701575', 
    email: 'developer@bishalcodes.com',
    imageUrl: 'https://ik.imagekit.io/bishalc/bishal.png',
    images: [] as string[],
    projectsCompleted: '300+',
    whatsappUrl: 'https://wa.me/9779828701575'
  });
  const [socials, setSocials] = useState<SocialLink[]>([]); // State for social links

  // Define the default (empty) form state for projects
  const defaultProjectForm: Project = { 
    id: '', 
    title: '', 
    description: '', 
    seoDescription: '', 
    images: [], 
    techStack: [], 
    liveUrl: '', 
    githubUrl: '',
    createdAt: Date.now(),
  };

  const defaultTestimonialForm: Testimonial = {
    id: '',
    name: '',
    company: '',
    rating: 5,
    text: '',
    avatarUrl: '',
    createdAt: Date.now(),
  };

  const defaultExperienceForm: Experience = {
    id: '',
    title: '',
    company: '',
    period: '',
    description: '',
    order: 0,
  };

  // Form States (Pre-filled with Hardcoded Defaults for immediate UX)
  const [serviceForm, setServiceForm] = useState({ title: '', description: '', iconUrl: '', bgImageUrl: '', linkUrl: '', badge: '', order: 0 });
  const [blogForm, setBlogForm] = useState({ 
    id: '', title: 'Next.js 15: The New Era of Web Development', excerpt: 'Deep-dive into the latest performance optimizations and server components.', tag: 'NEXTJS', content: 'Modern web development requires peak performance...', imageUrl: 'https://images.unsplash.com/photo/1555066931-4365d14bab8c', seoDescription: 'SEO optimization for Next.js 15 articles', views: 0 
  });
  const [blogPreviewMode, setBlogPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [imageReplaceTarget, setImageReplaceTarget] = useState<{ oldUrl: string } | null>(null);
  const [imageReplaceUrl, setImageReplaceUrl] = useState('');
  const [pricingForm, setPricingForm] = useState({ 
    id: '', title: 'INFORMATIVE', price: '25,000', description: 'Best for portfolio and high-converting landing pages.', features: 'SEO, Responsive, Admin Panel, 1yr Warranty', isPopular: false 
  });
  const [faqForm, setFaqForm] = useState({ 
    id: '', question: 'What is your typical project timeline?', answer: 'Standard projects are delivered within 7-14 business days.' 
  });
  const [dailyVisits, setDailyVisits] = useState<any[]>([]);
  const [toolClicks, setToolClicks] = useState<any[]>([]);
  const [trafficRange, setTrafficRange] = useState<number>(15); // default to 15 days
  const [trafficLogSearch, setTrafficLogSearch] = useState<string>('');
  const [hoveredDotIndex, setHoveredDotIndex] = useState<number | null>(null);
  // PURGED: Initialize projectForm with the empty defaultProjectForm to prevent hardcoded data.
  const [projectForm, setProjectForm] = useState<Project>(defaultProjectForm);
  const [legalForm, setLegalForm] = useState<LegalPageType>({
    id: '',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: 'This is a placeholder for your privacy policy content. Use AI to generate comprehensive text after setting the title and slug. Remember to review and customize all generated legal text.',
    seoTitle: 'Privacy Policy | Bishal Codes',
    seoDescription: 'Read our privacy policy to understand how we handle your data and privacy on Bishal Codes.',
    createdAt: Date.now(),
  });

  const [testimonialForm, setTestimonialForm] = useState<Testimonial>(defaultTestimonialForm);
  const [experienceForm, setExperienceForm] = useState<Experience>(defaultExperienceForm);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalTitle, setFormModalTitle] = useState('');

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setProjectForm(defaultProjectForm);
    setServiceForm({ title: '', description: '', iconUrl: '', bgImageUrl: '', linkUrl: '', badge: '', order: 0 });
    setBlogForm({ id: '', title: '', excerpt: '', tag: '', content: '', imageUrl: '', seoDescription: '', views: 0 });
    setTestimonialForm(defaultTestimonialForm);
    setExperienceForm(defaultExperienceForm);
    setPricingForm({ id: '', title: '', price: '', description: '', features: '', isPopular: false });
    setFaqForm({ id: '', question: '', answer: '' });
    setLegalForm({ id: '', title: '', slug: '', content: 'This is a placeholder for your legal document content. Use AI to generate comprehensive text after setting the title and slug. Remember to review and customize all generated legal text.', seoTitle: '', seoDescription: '', createdAt: Date.now() });
  };
  
  // Fix: Add 'socials' and 'experience' to the type definition for `seedTarget` to allow seeding social media and experience data.
  const [seedTarget, setSeedTarget] = useState<'all' | 'blog' | 'pricing' | 'faq' | 'legal' | 'socials' | 'testimonials' | 'experience' | 'services'>('all');
  const [fileUploadProgress, setFileUploadProgress] = useState<number | null>(null);
  const [mediaLinkInput, setMediaLinkInput] = useState<string>(''); // State for direct media link input
  const fileInputRef = useRef<HTMLInputElement>(null);


  // System logs simulation removed to keep interface clean and real.


  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        // Not logged in, redirect to login
        navigate('login');
        setIsAuthorized(false);
      } else {
        // User is logged in, check if they are an admin
        const allowedAdmins = [
          'bishalmishra9000@gmail.com',
          'admin@bishalcodes.com',
          'developer@bishalcodes.com'
        ];
        if (allowedAdmins.includes(user.email!)) {
          setIsAuthorized(true);
        } else {
          // Not an admin, show alert and redirect
          alert("Access Denied. You do not have permission to view the admin panel.");
          navigate('home');
          setIsAuthorized(false);
        }
      }
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (user && isAuthorized) { // Only fetch data if user is authorized
      fetchData();
      fetchSettings();
    }
  }, [user, isAuthorized, activeTab]);

  const fetchSettings = async () => {
    try {
      const heroSnap = await getDoc(doc(db, 'settings', 'hero'));
      if (heroSnap.exists()) {
        const data = heroSnap.data() as any;
        const globalTitle = data.title || "Hi, I'm Bishal Mishra";
        const globalSubtitle = data.subtitle || "Full-Stack Developer & Web Architect";
        const globalDesc = data.description || "I design and build high-performance web applications, clean user interfaces, and robust cloud services that deliver exceptional digital experiences.";
        
        const rawSlides = data.slides && data.slides.length > 0 ? data.slides : [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
          'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1920',
          'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920',
          'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1920'
        ];

        const mappedSlides = rawSlides.map((slide: any, index: number) => {
          if (typeof slide === 'string') {
            return {
              imageUrl: slide,
              title: index === 0 ? globalTitle : `Specialized Solutions #${index + 1}`,
              subtitle: index === 0 ? globalSubtitle : `Tailored for Scale #${index + 1}`,
              description: index === 0 ? globalDesc : `Delivering pixel-perfect components and clean, robust cloud services.`,
              primaryBtnText: 'View My Work',
              primaryBtnLink: 'projects',
              primaryBtnColor: '#6366f1',
              secondaryBtnText: 'Get in Touch',
              secondaryBtnLink: 'contact',
              secondaryBtnColor: 'transparent',
              titleColor: '#ffffff',
              subtitleColor: '#818cf8',
              descriptionColor: '#e2e8f0',
              mobileImageUrl: slide,
              titleSizeMobile: 2.0,
              titleSizeDesktop: 4.5,
              subtitleSizeMobile: 1.125,
              subtitleSizeDesktop: 1.5,
              descSizeMobile: 0.875,
              descSizeDesktop: 1.125,
            };
          }

          return {
            imageUrl: slide.imageUrl || '',
            title: slide.title || (index === 0 ? globalTitle : `Specialized Solutions #${index + 1}`),
            subtitle: slide.subtitle || (index === 0 ? globalSubtitle : `Tailored for Scale #${index + 1}`),
            description: slide.description || (index === 0 ? globalDesc : `Delivering pixel-perfect components and clean, robust cloud services.`),
            primaryBtnText: slide.primaryBtnText || 'View My Work',
            primaryBtnLink: slide.primaryBtnLink || 'projects',
            primaryBtnColor: slide.primaryBtnColor || '#6366f1',
            secondaryBtnText: slide.secondaryBtnText || 'Get in Touch',
            secondaryBtnLink: slide.secondaryBtnLink || 'contact',
            secondaryBtnColor: slide.secondaryBtnColor || 'transparent',
            titleColor: slide.titleColor || '#ffffff',
            subtitleColor: slide.subtitleColor || '#818cf8',
            descriptionColor: slide.descriptionColor || '#e2e8f0',
            mobileImageUrl: slide.mobileImageUrl || slide.imageUrl || '',
            titleSizeMobile: slide.titleSizeMobile !== undefined ? Number(slide.titleSizeMobile) : 2.0,
            titleSizeDesktop: slide.titleSizeDesktop !== undefined ? Number(slide.titleSizeDesktop) : 4.5,
            subtitleSizeMobile: slide.subtitleSizeMobile !== undefined ? Number(slide.subtitleSizeMobile) : 1.125,
            subtitleSizeDesktop: slide.subtitleSizeDesktop !== undefined ? Number(slide.subtitleSizeDesktop) : 1.5,
            descSizeMobile: slide.descSizeMobile !== undefined ? Number(slide.descSizeMobile) : 0.875,
            descSizeDesktop: slide.descSizeDesktop !== undefined ? Number(slide.descSizeDesktop) : 1.125,
          };
        });

        setHeroData({
          title: globalTitle,
          subtitle: globalSubtitle,
          description: globalDesc,
          slides: mappedSlides,
          sliderHeightMobile: data.sliderHeightMobile !== undefined ? Number(data.sliderHeightMobile) : 50,
          sliderHeightDesktop: data.sliderHeightDesktop !== undefined ? Number(data.sliderHeightDesktop) : 100,
        });
      }
      
      const aboutSnap = await getDoc(doc(db, 'settings', 'about'));
      if (aboutSnap.exists()) {
        const aData = aboutSnap.data() as any;
        const currentBio = aData.bio || '';
        if (currentBio.includes("Engineering high-performance web ecosystems") || 
            currentBio.includes("I am a dedicated software engineer specializing in web application architecture")) {
          const humanizedBio = "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.";
          
          aData.bio = humanizedBio;
          aData.title = 'Full-Stack Web Architect';
          aData.experience = '3+ Years';
          
          // Auto-save the upgraded human copy in Firestore
          setDoc(doc(db, 'settings', 'about'), aData, { merge: true })
            .then(() => console.log("Upgraded robotic about bio to human-made copy in Firestore!"))
            .catch(err => console.error("Firestore auto-upgrade error:", err));
        }
        setAboutData(prev => ({...prev, ...aData}));
      }

      const socialSnap = await getDoc(doc(db, 'settings', 'socials')); // Fetch social links
      // Add type assertion to socialSnap.data() to resolve 'links' property error
      if (socialSnap.exists()) {
        setSocials((socialSnap.data() as any).links || []);
      }

      const geminiSnap = await getDoc(doc(db, 'settings', 'gemini'));
      if (geminiSnap.exists()) {
        setAdminGeminiKey((geminiSnap.data() as any).apiKey || '');
      }
    } catch (e) { console.warn("Identity Fetch Error", e); }
  };

  // Fetch custom SEO configuration from Firestore when selected page changes
  useEffect(() => {
    if (activeTab === 'seo' && selectedSeoPage) {
      const fetchPageSeo = async () => {
        setLoading(true);
        try {
          const docSnap = await getDoc(doc(db, 'seo_settings', selectedSeoPage));
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setSeoForm({
              title: data.title || '',
              description: data.description || '',
              keywords: data.keywords || '',
              ogImage: data.ogImage || '',
              canonical: data.canonical || '',
            });
          } else {
            // Document doesn't exist, clear form to start fresh
            setSeoForm({
              title: '',
              description: '',
              keywords: '',
              ogImage: '',
              canonical: '',
            });
          }
        } catch (err) {
          console.error("Error fetching SEO settings: ", err);
        } finally {
          setLoading(false);
        }
      };
      fetchPageSeo();
    }
  }, [activeTab, selectedSeoPage]);

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'seo_settings', selectedSeoPage), {
        title: seoForm.title.trim(),
        description: seoForm.description.trim(),
        keywords: seoForm.keywords.trim(),
        ogImage: seoForm.ogImage.trim(),
        canonical: seoForm.canonical.trim(),
        updatedAt: Date.now(),
      });
      alert("SEO metadata settings saved successfully!");
    } catch (err: any) {
      alert(`Failed to save SEO settings: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Re-fetch all relevant data for dashboard and individual tabs
      const projectSnap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
      setProjects(projectSnap.docs.map(doc => {
        const docData = doc.data() as any;
        return {
          id: doc.id,
          ...docData,
          images: docData.images || [], // Ensure images is always an array
          techStack: docData.techStack || [], // Ensure techStack is always an array
        } as Project;
      }));

      const serviceSnap = await getDocs(query(collection(db, 'services'), orderBy('order', 'asc')));
      const fetchedServices = serviceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const hasFileTransfer = fetchedServices.some(s => s.linkUrl === 'file-transfer');
      const hasScreenshot = fetchedServices.some(s => s.linkUrl === 'screenshot-studio');
      const hasFontDownloader = fetchedServices.some(s => s.linkUrl === 'font-downloader');
      const missingServices = [];
      
      if (!hasFileTransfer) {
        missingServices.push({
          id: 'file-transfer',
          title: 'File Transfer',
          description: 'Send files up to 100 GB instantly via secure peer-to-peer connection. Get a shareable link or email directly — free, no registration required.',
          iconUrl: '/file-transfer.svg',
          bgImageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop',
          linkUrl: 'file-transfer',
          badge: 'NEW',
          order: 15
        });
      }
      
      if (!hasScreenshot) {
        missingServices.push({
          id: 'screenshot-studio',
          title: 'Website Screenshot Studio',
          description: 'Capture high-resolution full-page scrolling screenshots of any site. Customize device viewports, resolutions, and download captures instantly.',
          iconUrl: '/screenshot-studio.svg',
          bgImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop',
          linkUrl: 'screenshot-studio',
          badge: 'NEW',
          order: 16
        });
      }

      if (!hasFontDownloader) {
        missingServices.push({
          id: 'font-downloader',
          title: 'System Fonts Downloader',
          description: 'Browse, test, and batch download 156 real Nepali and English fonts for Windows, macOS, and Linux locally in a single ZIP.',
          iconUrl: '/font-downloader.svg',
          bgImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop',
          linkUrl: 'font-downloader',
          badge: 'NEW',
          order: 17
        });
      }
      
      if (missingServices.length > 0) {
        const batch = writeBatch(db);
        missingServices.forEach(s => {
          const { id, ...cleanData } = s;
          batch.set(doc(db, 'services', id), { ...cleanData, createdAt: Date.now() });
          fetchedServices.push(s);
        });
        await batch.commit();
        console.log("Auto-seeded missing core services in Firestore");
      }
      
      setServices(fetchedServices);

      const blogSnap = await getDocs(query(collection(db, 'blog'), orderBy('createdAt', 'desc')));
      setBlogs(blogSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));

      const submissionsSnap = await getDocs(query(collection(db, 'submissions'), orderBy('timestamp', 'desc')));
      setSubmissions(submissionsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));

      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('timestamp', 'desc')));
      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Report)));
      
      const paymentsSnap = await getDocs(query(collection(db, 'payments'), orderBy('timestamp', 'desc')));
      setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as PaymentRequest)));

      const testimonialsSnap = await getDocs(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')));
      setTestimonials(testimonialsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Testimonial)));

      const experienceSnap = await getDocs(query(collection(db, 'experience'), orderBy('order', 'asc')));
      setExperiences(experienceSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Experience)));

      const visitsSnap = await getDocs(query(collection(db, 'analytics_daily_visits'), orderBy('date', 'desc')));
      setDailyVisits(visitsSnap.docs.map(doc => doc.data() as any));

      const toolClicksSnap = await getDocs(collection(db, 'analytics_tool_clicks'));
      setToolClicks(toolClicksSnap.docs.map(doc => doc.data() as any));

      // Only fetch pricing, faq, legal, socials if specific tab is active (or on dashboard load to populate stats)
      if (activeTab === 'pricing' || activeTab === 'dashboard') {
        const pricingSnap = await getDocs(collection(db, 'pricing'));
        setPricing(pricingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }
      if (activeTab === 'faq' || activeTab === 'dashboard') {
        const faqSnap = await getDocs(collection(db, 'faq'));
        setFaqs(faqSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }
      if (activeTab === 'legal' || activeTab === 'dashboard') {
        const legalSnap = await getDocs(query(collection(db, 'legalPages'), orderBy('createdAt', 'desc')));
        setLegalPages(legalSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as LegalPageType)));
      }
      if (activeTab === 'socials' || activeTab === 'dashboard') {
        const socialSnap = await getDoc(doc(db, 'settings', 'socials'));
        if (socialSnap.exists()) {
          setSocials((socialSnap.data() as any).links || []);
        }
      }
      if (activeTab === 'users' || activeTab === 'dashboard') {
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('lastActive', 'desc')));
        setDashboardUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
        
        const actSnap = await getDocs(query(collection(db, 'user_activity'), orderBy('timestamp', 'desc')));
        setActivities(actSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
      }

    } catch (e) { console.warn("Data Stream Interrupted", e); }
    setLoading(false);
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset link sent successfully to ${email}`);
    } catch (err: any) {
      alert(`Failed to send password reset: ${err.message || err}`);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    // NO CONFIRMATION. INSTANT ACTION.
    
    // 1. Optimistic UI update - INSTANTLY remove from view
    if (col === 'projects') setProjects(prev => prev.filter(i => i.id !== id));
    if (col === 'services') setServices(prev => prev.filter(i => i.id !== id));
    if (col === 'blog') setBlogs(prev => prev.filter(i => i.id !== id));
    if (col === 'submissions') setSubmissions(prev => prev.filter(i => i.id !== id));
    if (col === 'reports') setReports(prev => prev.filter(i => i.id !== id));
    if (col === 'pricing') setPricing(prev => prev.filter(i => i.id !== id));
    if (col === 'faq') setFaqs(prev => prev.filter(i => i.id !== id));
    if (col === 'legalPages') setLegalPages(prev => prev.filter(i => i.id !== id));
    if (col === 'payments') setPayments(prev => prev.filter(i => i.id !== id));
    if (col === 'testimonials') setTestimonials(prev => prev.filter(i => i.id !== id)); // Added testimonials
    if (col === 'experience') setExperiences(prev => prev.filter(i => i.id !== id)); // Added experience

    try {
      // 2. Perform backend operation silently
      await deleteDoc(doc(db, col, id));
      // Success is silent. The UI is already updated.
    } catch (e: any) {
      // 3. On failure, rollback the UI and alert.
      console.error(`FATAL: Delete operation failed for item ${id} in ${col}. Rolling back UI.`, e);
      alert("System Execution Error: Asset deletion failed. Your view has been restored to prevent data loss.");
      // Rollback by re-fetching all data.
      fetchData(); 
    }
  };

  const handleDeepBlogGen = async () => {
    if (!blogForm.title) {
      alert("Please enter a title for the blog post.");
      return;
    }
    if (!validateGeminiApiKey(adminGeminiKey || geminiApiKey)) return;

    setAiLoading(true);
    try {
      // Always use `new GoogleGenAI` directly before making an API call
      const ai = new GoogleGenAI({ apiKey: adminGeminiKey || geminiApiKey! });
      const promptText = `Generate an extremely in-depth, long-form, comprehensive blog post targeting at least 3500 to 4000+ words for the title: "${blogForm.title}".
      
      The output must be returned strictly in this XML tag format (do NOT wrap it in JSON or any markdown code blocks, just output the plain tags):
      <tag>A single category/tag (e.g., 'Web Development', 'React', 'AI', 'UI/UX', 'Cloud')</tag>
      <excerpt>A compelling, organic-sounding summary of the article under 150 words</excerpt>
      <seoDescription>A highly optimized SEO meta description under 160 characters</seoDescription>
      <content>
      [The extremely detailed 3500-4000+ words Markdown article here...]
      </content>

      CRITICAL RULES FOR CONTENT GENERATION (to guarantee Google AdSense approval for original, high-value content):
      1. STYLE & TONE: Write in a totally natural, human-written editorial voice. Avoid any AI tells, robotic structuring, or clichés (do NOT use terms like 'delve', 'testament', 'demystify', 'in conclusion', 'moreover', 'furthermore'). Write with deep insights, professional authority, and engaging prose.
      2. WORD COUNT: The article must be highly comprehensive and exhaustive, targeting at least 3500 to 4000+ words. Do not summarize or gloss over details. Explain the 'why', 'how', historical context, real-world applications, future trends, and practical implementation challenges of every concept to achieve this length organically.
      3. RICH MEDIA & GRAPHICS: Insert real, context-appropriate Markdown image links using high-resolution Unsplash image assets. Do not use fake or placeholder links. Format them exactly as: \`![alt text](https://images.unsplash.com/photo-ID?auto=format&fit=crop&w=800&q=80)\`. 
         Choose appropriate IDs from these valid, beautiful Unsplash tech assets:
         - Code editor/developer laptop screen: photo-1555066931-4365d14bab8c
         - Laptop on creative desk: photo-1498050108023-c5249f4df085
         - Coding on desktop screens: photo-1517694712202-14dd9538aa97
         - Modern tech office/brainstorming: photo-1531403009284-440f080d1e12
         - Cyber security/matrix theme: photo-1526374965328-7f61d4dc18c5
         - Modern desktop workspace: photo-1504868584819-f8e8b4b6d7e3
         - Abstract artificial intelligence/neural network: photo-1618005182384-a83a8bd57fbe
         - Web interface mockup/design: photo-1507238691740-187a5b1d37b8
         Include at least 2 relevant images placed logically throughout the content.
      4. DATA & TABLES: You must include at least one Markdown table (e.g., comparison table, pros vs cons, feature checklist, speed benchmarks, or tech stacks comparison) to organize structured information.
      5. CODE & EXAMPLES: If the topic is technical, include detailed, realistic, and working code blocks (with syntax highlighting like \`\`\`typescript or \`\`\`javascript). Do not output brief snippets; write complete, readable code.
      6. STRUCTURAL FLOW: Use clear H2 and H3 headings. Do not include section numbers (e.g., '1. Introduction'). Use bullet points and paragraphs naturally. Ensure there are two blank lines between paragraphs for excellent markdown spacing.`;
      
      // Try models in priority order — waterfall on 503/overload errors
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-3-flash-preview',
      ];
      let response: any = null;
      let lastError: any = null;
      for (const model of modelsToTry) {
        try {
          response = await ai.models.generateContent({ model, contents: promptText });
          if (response?.text?.trim()) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Generate: ${model} failed, trying next model...`, err?.message || err);
        }
      }
      if (!response?.text?.trim()) throw lastError || new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');
      
      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error("AI response was empty or malformed.");
      }

      // Parse using XML-like tags (robust against any unescaped quotes/backslashes)
      const extractTag = (tag: string) => {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = responseText.match(regex);
        return match ? match[1].trim() : '';
      };

      const parsedData = {
        tag: extractTag('tag'),
        excerpt: extractTag('excerpt'),
        seoDescription: extractTag('seoDescription'),
        content: extractTag('content')
      };

      if (!parsedData.content || !parsedData.tag) {
        // Fallback: If XML parsing fails, try parsing as JSON (in case model outputted JSON anyway)
        try {
          const fallbackData = JSON.parse(responseText);
          setBlogForm({ ...blogForm, ...fallbackData });
          return;
        } catch (jsonErr) {
          throw new Error("Could not parse AI response. Expected XML tag structure.");
        }
      }

      // Auto-prepend a personal author intro for AdSense authenticity
      const titleForIntro = blogForm.title || 'this topic';
      const authorIntro = `*By **Bishal Mishra** — Full-Stack Developer & Digital Tools Builder*\n\nAs a developer who has worked extensively on building web tools and real-world projects, I've had hands-on experience with ${titleForIntro.toLowerCase()}. In this article, I'm sharing what I've personally learned and tested — practical insights you won't find in a generic tutorial.\n\n---\n\n`;
      const contentWithIntro = parsedData.content ? authorIntro + parsedData.content : parsedData.content;
      setBlogForm({ ...blogForm, ...parsedData, content: contentWithIntro });
    } catch (e: any) { // Catch full error object
      console.error("AI content generation failed for Blog:", e);
      let userMessage = "Failed to generate blog content. Please check the console (F12) for details.";

      // Attempt to parse specific error from Google GenAI SDK
      if (e && e.message && typeof e.message === 'string') {
        if (e.message.includes('400 Bad Request') && e.message.includes('RESOURCE_EXHAUSTED')) {
          userMessage = "Failed to generate content: You have exceeded your Gemini API quota or billing limit.";
        } else if (e.message.includes('429 Resource has been exhausted')) {
           userMessage = "Failed to generate content: Gemini API quota exceeded.";
        } else if (e.message.includes('403 Permission denied')) {
          userMessage = "Failed to generate content: Permission denied. Please check your API key.";
        } else if (e.message.includes('user aborted a request')) {
          userMessage = "Failed to generate content: Request aborted.";
        }
      }
      alert(userMessage); 
    }
    setAiLoading(false);
  };

  const handleHumanizeBlogContent = async () => {
    if (!blogForm.content || !blogForm.content.trim()) {
      alert("Please enter or generate some content first to humanize.");
      return;
    }
    if (!validateGeminiApiKey(adminGeminiKey || geminiApiKey)) return;

    setHumanizeLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: adminGeminiKey || geminiApiKey! });
      const promptText = `You are an expert editor specializing in humanizing AI-generated text to bypass AI content detectors and sound fully natural, engaging, and indistinguishable from professional human writing.

Rewrite the following blog post content to sound organic and human-written.

CRITICAL RULES FOR HUMANIZING CONTENT:
1. STYLE & TONE: Write in a totally natural, human-written editorial voice. Use a mix of long and short sentences. Avoid typical AI structural patterns (e.g., repeating the same sentence length, excessive use of passive voice).
2. ELIMINATE AI CLICHÉS: Do NOT use robotic, overused AI filler words and transitions (such as: 'delve', 'testament', 'demystify', 'in conclusion', 'moreover', 'furthermore', 'tapestry', 'beacon', 'it is worth noting', 'remember', 'let us look at', 'crucial aspect').
3. READABILITY & ENGAGEMENT: Vary sentence structure. Use conversational but authoritative tones where appropriate. Keep all markdown formatting (such as headings, bold text, links, code blocks, tables, images, etc.) EXACTLY as they are, but rewrite the text within them to flow naturally.
4. WORD COUNT & DEPTH: Maintain the depth and detail of the article. Do not summarize or cut down the length of the content significantly.
5. PERSPECTIVE: Use a natural developer/writer's voice.

Here is the AI-generated blog content to humanize:
--------------------------------------------------
${blogForm.content}
--------------------------------------------------

Output ONLY the final humanized text in Markdown format. Do NOT wrap it in extra JSON, XML tags, or markdown code blocks (unless they were in the original content). Start directly with the humanized content.`;

      // Try models in priority order — waterfall on 503/overload errors
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-3-flash-preview',
      ];
      let response: any = null;
      let lastError: any = null;
      for (const model of modelsToTry) {
        try {
          response = await ai.models.generateContent({ model, contents: promptText });
          if (response?.text?.trim()) break; // success — stop trying
        } catch (err: any) {
          lastError = err;
          console.warn(`Humanizer: ${model} failed, trying next model...`, err?.message || err);
        }
      }
      if (!response?.text?.trim()) throw lastError || new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');

      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error("AI response was empty or malformed.");
      }

      // Check if author intro already exists (avoid duplicating it)
      const hasAuthorIntro = responseText.includes('By **Bishal Mishra**') || blogForm.content.startsWith('*By **Bishal Mishra**');
      let finalContent = responseText;
      if (!hasAuthorIntro) {
        const titleForIntro = blogForm.title || 'this topic';
        const authorIntro = `*By **Bishal Mishra** — Full-Stack Developer & Digital Tools Builder*\n\nAs a developer who has worked extensively on building web tools and real-world projects, I've had hands-on experience with ${titleForIntro.toLowerCase()}. In this article, I'm sharing what I've personally learned and tested — practical insights you won't find in a generic tutorial.\n\n---\n\n`;
        finalContent = authorIntro + responseText;
      }
      setBlogForm({ ...blogForm, content: finalContent });
      alert("✅ Content humanized + Bishal Mishra author intro added automatically!");
    } catch (e: any) {
      console.error("AI content humanizing failed for Blog:", e);
      let userMessage = "Failed to humanize content. Please check the console (F12) for details.";
      if (e && e.message && typeof e.message === 'string') {
        if (e.message.includes('400 Bad Request') && e.message.includes('RESOURCE_EXHAUSTED')) {
          userMessage = "Failed to humanize content: You have exceeded your Gemini API quota or billing limit.";
        } else if (e.message.includes('429 Resource has been exhausted')) {
          userMessage = "Failed to humanize content: Gemini API quota exceeded.";
        } else if (e.message.includes('403 Permission denied')) {
          userMessage = "Failed to humanize content: Permission denied. Please check your API key.";
        }
      }
      alert(userMessage);
    }
    setHumanizeLoading(false);
  };

  const handleUploadContentImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLoading(true);
    try {
      const res = await uploadToCloudinary(file);
      const imageUrl = res.url;
      const markdownImage = `\n\n![Uploaded Image](${imageUrl})\n\n`;

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = blogForm.content;
        const newContent = text.substring(0, start) + markdownImage + text.substring(end);
        setBlogForm(prev => ({ ...prev, content: newContent }));

        // Refocus textarea and place cursor after the inserted markdown
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + markdownImage.length, start + markdownImage.length);
        }, 50);
      } else {
        setBlogForm(prev => ({ ...prev, content: prev.content + markdownImage }));
      }
      alert("Image uploaded and inserted into content successfully!");
    } catch (err: any) {
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setLoading(false);
      // Reset input element value to allow uploading the same file again if desired
      e.target.value = '';
    }
  };

  // New AI generation handler for legal pages
  const handleDeepLegalGen = async () => {
    if (!legalForm.title) {
      alert("Please enter a document title first.");
      return;
    }
    if (!validateGeminiApiKey(adminGeminiKey || geminiApiKey)) return;

    setAiLoading(true);
    try {
      // Always use `new GoogleGenAI` directly before making an API call
      const ai = new GoogleGenAI({ apiKey: adminGeminiKey || geminiApiKey! });
      const prompt = `Generate a comprehensive and professional Markdown document for a "${legalForm.title}" for a developer portfolio website called 'Bishal Codes'.
      
      **ABSOLUTELY CRUCIAL FOR READABILITY: Ensure a minimum of two blank lines (i.e., typing 'Enter' twice, resulting in '\\n\\n') between *all* distinct paragraphs to create clear visual separation.**
      
      **ALWAYS include at least two blank lines after *every* heading (H1, H2, H3, etc.) before any subsequent text, lists, or other elements. For example: '# Heading\\n\\nThis is content.'**
      
      **Separate all major sections and logical content blocks (e.g., lists, tables, quoted text, code blocks) with at least two blank lines from the surrounding paragraphs.**
      
      **Use standard Markdown lists (bullet points or numbered lists) for enumerations, ensuring they are also well-separated by blank lines from adjacent text. For example:\\n\\n* Item 1\\n* Item 2\\n\\nNext paragraph.**

      **Content Requirements:**
      - Include relevant headings and subheadings.
      - Incorporate sections such as "What information we collect", "How we use your information", "Data Security", "Your Rights", "Cookies Policy", "Third-party Links", "Changes to this Policy", "Contact Us", where applicable for a portfolio site.
      - For "Cookies Policy", include a small table example showing types of cookies, purpose, and duration.
      - For "Your Rights" or "Data Deletion", include placeholder links to hypothetical data request forms or relevant external resources (e.g., a generic data protection authority website).
      - Ensure it's suitable for a personal portfolio website, focusing on web development services.
      - Format: Pure Markdown.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              maxOutputTokens: 2000,
              thinkingConfig: { thinkingBudget: 200 }
          }
        });
      } catch (err) {
        console.warn("gemini-2.5-flash failed, falling back to gemini-3-flash-preview:", err);
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
              maxOutputTokens: 2000,
              thinkingConfig: { thinkingBudget: 200 }
          }
        });
      }
      setLegalForm({ ...legalForm, content: response.text?.trim() || '' });
    } catch (e: any) { // Catch full error object
      console.error("AI content generation failed for Legal:", e);
      let userMessage = "Failed to generate legal content. Please check the console (F12) for details.";

      if (e && e.message && typeof e.message === 'string') {
        if (e.message.includes('400 Bad Request') && e.message.includes('RESOURCE_EXHAUSTED')) {
          userMessage = "Failed to generate content: You have exceeded your Gemini API quota or billing limit.";
        } else if (e.message.includes('429 Resource has been exhausted')) {
           userMessage = "Failed to generate content: Gemini API quota exceeded.";
        } else if (e.message.includes('403 Permission denied')) {
          userMessage = "Failed to generate content: Permission denied. Please check your API key.";
        } else if (e.message.includes('user aborted a request')) {
          userMessage = "Failed to generate content: Request aborted.";
        }
      }
      alert(userMessage);
    }
    setAiLoading(false);
  };

  const saveSettings = async (docId: string, data: any) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', docId), data, { merge: true });
      alert("Settings updated successfully.");
    } catch (e) { alert("Failed to save settings."); }
    setLoading(false);
  };

  const saveGeminiKey = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'gemini'), { apiKey: adminGeminiKey.trim() });
      alert("Gemini API Key updated successfully in Firestore!");
    } catch (err: any) {
      alert(`Failed to save Gemini key: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (col: string, data: any, formSetter: any, defaultForm: any) => {
    setLoading(true);
    try {
      const { id, slug, ...cleanData } = data; // Extract 'slug' for legalPages specific logic

      if (col === 'legalPages') {
        if (!slug) {
          alert("Error: Legal pages require a unique URL Slug.");
          setLoading(false);
          return;
        }
        await setDoc(doc(db, col, slug), {
          ...cleanData,
          id: slug, 
          slug: slug, 
          createdAt: data.createdAt || Date.now(),
          updatedAt: Date.now(),
        }, { merge: true });
      } else {
        // Special handling for projectForm techStack and images
        if (col === 'projects') {
          cleanData.techStack = typeof cleanData.techStack === 'string' ? cleanData.techStack.split(',').map((s: string) => s.trim()).filter(Boolean) : cleanData.techStack;
          cleanData.images = cleanData.images.filter((img: { url: string }) => img.url && img.url.trim() !== ''); // Clean empty media
        }
        // Special handling for testimonials: ensure rating is a number
        if (col === 'testimonials') {
            cleanData.rating = Number(cleanData.rating);
        }
        // Special handling for experience: ensure order is a number
        if (col === 'experience') {
            cleanData.order = Number(cleanData.order);
        }

        let responseDoc;
        if (id) {
          await setDoc(doc(db, col, id), { ...cleanData, updatedAt: Date.now() }, { merge: true });
        } else {
          responseDoc = await addDoc(collection(db, col), { ...cleanData, createdAt: Date.now() });
        }

        // Trigger automatic newsletter broadcast when publishing a new blog or project
        if (!id && (col === 'blog' || col === 'projects')) {
          try {
            const broadcastType = col === 'blog' ? 'blog-broadcast' : 'project-broadcast';
            const itemId = responseDoc ? responseDoc.id : '';
            const itemTitle = cleanData.title || '';
            const itemExcerpt = col === 'blog' ? (cleanData.excerpt || '') : (cleanData.description || '');
            const itemLink = col === 'blog' 
              ? `https://bishalcodes.com/blog/${itemId}` 
              : `https://bishalcodes.com/work`;

            // Grab the image URL safely
            let imageUrl = '';
            if (col === 'blog') {
              imageUrl = cleanData.imageUrl || '';
            } else if (col === 'projects' && Array.isArray(cleanData.images) && cleanData.images[0]) {
              imageUrl = cleanData.images[0].url || '';
            }

            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: broadcastType,
                data: {
                  title: itemTitle,
                  excerpt: itemExcerpt,
                  link: itemLink,
                  imageUrl: imageUrl
                }
              })
            }).catch(fetchErr => {
              console.warn("Broadcast fetch failed:", fetchErr);
            });
          } catch (broadcastErr) {
            console.warn("Newsletter broadcast trigger failed:", broadcastErr);
          }
        }
      }
      
      formSetter(defaultForm);
      setIsFormModalOpen(false);
      fetchData();
      alert("Settings saved successfully.");
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save settings. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (data: any, setter: any) => {
    // Special handling for projectForm techStack (array to CSV for input)
    if (activeTab === 'projects') {
      setter({ ...data, techStack: Array.isArray(data.techStack) ? data.techStack.join(', ') : data.techStack });
      setFormModalTitle('Edit Project');
    } else if (activeTab === 'services') {
      setter(data);
      setFormModalTitle('Edit Service');
    } else if (activeTab === 'blog') {
      setter(data);
      setFormModalTitle('Edit Blog Post');
    } else if (activeTab === 'testimonials') {
      setter(data);
      setFormModalTitle('Edit Testimonial');
    } else if (activeTab === 'experience') {
      setter(data);
      setFormModalTitle('Edit Experience');
    } else if (activeTab === 'pricing') {
      setter(data);
      setFormModalTitle('Edit Pricing Plan');
    } else if (activeTab === 'faq') {
      setter(data);
      setFormModalTitle('Edit FAQ');
    } else if (activeTab === 'legal') {
      setter(data);
      setFormModalTitle('Edit Legal Page');
    } else {
      setter(data);
      setFormModalTitle('Edit Item');
    }
    setIsFormModalOpen(true);
  };

  // NEW: Handle Cloudinary file uploads (no Base64 conversion, directly to Cloudinary)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setLoading(true);
    setFileUploadProgress(0);
    const files = Array.from(e.target.files);
    const uploadedMedia: { url: string; type: 'image' | 'video' | 'pdf' | 'raw' }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadToCloudinary(file);
        uploadedMedia.push({ url: res.url, type: res.type });
        setFileUploadProgress(((i + 1) / files.length) * 100);
      }
      setProjectForm(prev => ({ ...prev, images: [...prev.images, ...uploadedMedia] }));
      if (uploadedMedia.length > 0) {
        alert("Files uploaded successfully to Cloudinary!");
      }
    } catch (error: any) {
      console.error("Cloudinary upload failed:", error);
      alert(`Upload failed: ${error.message || "An unknown error occurred during Cloudinary upload."}`);
    } finally {
      setLoading(false);
      setFileUploadProgress(null); // Reset progress
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear input
      }
    }
  };

  // NEW: Add media link from input
  const addMediaLink = () => {
    if (mediaLinkInput.trim() === '') return;
    let mediaType: 'image' | 'video' = 'image';
    // Simple check for common video extensions or YouTube embed format
    if (mediaLinkInput.match(/\.(mp4|webm|ogg|mov|avi)$/i) || mediaLinkInput.includes('youtube.com/embed/') || mediaLinkInput.includes('vimeo.com/')) {
      mediaType = 'video';
    }
    setProjectForm(prev => ({ ...prev, images: [...prev.images, { url: mediaLinkInput.trim(), type: mediaType }] }));
    setMediaLinkInput('');
  };

  // NEW: Remove media from project form
  const removeMedia = (index: number) => {
    setProjectForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Update Social Link handler
  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const newSocials = [...socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setSocials(newSocials);
  };

  // Add Social Link handler
  const addSocialLink = (name: 'Facebook' | 'Instagram' | 'TikTok' | 'LinkedIn' | 'GitHub') => {
    const newLink: SocialLink = {
      id: Date.now().toString(), // Unique ID
      name: name,
      url: '',
      enabled: true,
    };
    setSocials([...socials, newLink]);
  };

  // Save Socials to Firestore
  const saveSocials = async () => {
    await saveSettings('socials', { links: socials });
  };

  const migrateAllAssetsToCloudinary = async () => {
    setLoading(true);
    let migratedCount = 0;
    let failCount = 0;
    
    const tryMigrateUrl = async (url: string, name: string): Promise<string> => {
      if (!url || !url.startsWith('http') || url.includes('cloudinary.com')) {
        return url;
      }
      try {
        const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Proxy fetch failed');
        const blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        const file = new window.File([blob], `${name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`, { type: blob.type });
        const uploadRes = await uploadToCloudinary(file);
        migratedCount++;
        return uploadRes.url;
      } catch (err) {
        console.error(`Failed to migrate asset: ${url}`, err);
        failCount++;
        return url;
      }
    };

    try {
      // 1. SERVICES
      const servicesSnap = await getDocs(collection(db, 'services'));
      for (const d of servicesSnap.docs) {
        const data = d.data();
        const iconUrl = await tryMigrateUrl(data.iconUrl, `${d.id}-icon`);
        const bgImageUrl = await tryMigrateUrl(data.bgImageUrl, `${d.id}-bg`);
        if (iconUrl !== data.iconUrl || bgImageUrl !== data.bgImageUrl) {
          await setDoc(doc(db, 'services', d.id), { iconUrl, bgImageUrl }, { merge: true });
        }
      }

      // 2. PROJECTS
      const projectsSnap = await getDocs(collection(db, 'projects'));
      for (const d of projectsSnap.docs) {
        const data = d.data();
        let changed = false;
        const images = [...(data.images || [])];
        for (let i = 0; i < images.length; i++) {
          const originalUrl = images[i].url;
          const newUrl = await tryMigrateUrl(originalUrl, `${d.id}-img-${i}`);
          if (newUrl !== originalUrl) {
            images[i] = { ...images[i], url: newUrl };
            changed = true;
          }
        }
        if (changed) {
          await setDoc(doc(db, 'projects', d.id), { images }, { merge: true });
        }
      }

      // 3. BLOG POSTS
      const blogSnap = await getDocs(collection(db, 'blog'));
      for (const d of blogSnap.docs) {
        const data = d.data();
        const imageUrl = await tryMigrateUrl(data.imageUrl, `${d.id}-banner`);
        if (imageUrl !== data.imageUrl) {
          await setDoc(doc(db, 'blog', d.id), { imageUrl }, { merge: true });
        }
      }

      // 4. TESTIMONIALS
      const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
      for (const d of testimonialsSnap.docs) {
        const data = d.data();
        const avatarUrl = await tryMigrateUrl(data.avatarUrl, `${d.id}-avatar`);
        if (avatarUrl !== data.avatarUrl) {
          await setDoc(doc(db, 'testimonials', d.id), { avatarUrl }, { merge: true });
        }
      }

      // 5. HERO SETTINGS
      const heroDoc = await getDoc(doc(db, 'settings', 'hero'));
      if (heroDoc.exists()) {
        const data = heroDoc.data();
        let changed = false;
        const slides = [...(data.slides || [])];
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const imageUrl = await tryMigrateUrl(slide.imageUrl, `hero-slide-${i}`);
          const mobileImageUrl = await tryMigrateUrl(slide.mobileImageUrl, `hero-slide-mobile-${i}`);
          if (imageUrl !== slide.imageUrl || mobileImageUrl !== slide.mobileImageUrl) {
            slides[i] = { ...slide, imageUrl, mobileImageUrl };
            changed = true;
          }
        }
        if (changed) {
          await setDoc(doc(db, 'settings', 'hero'), { slides }, { merge: true });
        }
      }

      // 6. ABOUT SETTINGS
      const aboutDoc = await getDoc(doc(db, 'settings', 'about'));
      if (aboutDoc.exists()) {
        const data = aboutDoc.data();
        const imageUrl = await tryMigrateUrl(data.imageUrl, `about-main-img`);
        if (imageUrl !== data.imageUrl) {
          await setDoc(doc(db, 'settings', 'about'), { imageUrl }, { merge: true });
        }
      }

      // Refresh all state variables
      await fetchSettings();
      await fetchData();

      alert(`Global Asset Migration Complete!\nSuccessfully migrated ${migratedCount} external assets to your Cloudinary server.\nFailed/Skipped assets: ${failCount}`);
    } catch (err: any) {
      console.error('Global migration failed:', err);
      alert(`Global migration failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Approve Payment Handler
  const handleApprovePayment = async (paymentId: string, userId: string, creditsToAdd: number) => {
      if (!confirm(`Approve this payment and add ${creditsToAdd} credits to the user? This is irreversible.`)) return;

      setLoading(true);
      try {
          const batch = writeBatch(db);
          const paymentRef = doc(db, 'payments', paymentId);
          const userRef = doc(db, 'users', userId);
          
          batch.update(paymentRef, { status: 'approved' });
          batch.update(userRef, { credits: increment(creditsToAdd) });
          
          await batch.commit();
          alert("Payment approved and credits added successfully.");
          fetchData(); // Refresh data
      } catch (e) {
          console.error("Failed to approve payment:", e);
          alert("Error: Could not approve payment. Check console for details.");
      } finally {
          setLoading(false);
      }
  };

  // Decline Payment Handler
  const handleDeclinePayment = async (paymentId: string) => {
      if (!confirm("Decline this payment request? This action cannot be undone.")) return;
      
      setLoading(true);
      try {
          await setDoc(doc(db, 'payments', paymentId), { status: 'declined' }, { merge: true });
          alert("Payment request has been declined.");
          fetchData(); // Refresh data
      } catch (e) {
          console.error("Failed to decline payment:", e);
          alert("Error: Could not decline payment. Check console for details.");
      } finally {
          setLoading(false);
      }
  };


  const executeSeed = async () => {
    setLoading(true);
    setSeedSuccess(false);
    try {
      const batch = writeBatch(db);
      
      // Seed Blog Data
      if (seedTarget === 'all' || seedTarget === 'services') {
        const seeds = [
          { title: 'Nepali Date Converter (AD ↔ BS)', description: 'Quickly convert dates between English (AD) and Nepali Bikram Sambat (BS). Useful for filling government forms, birthdays, and anything that needs a Nepali date.', iconUrl: '/imgi_3_date-icon.png', bgImageUrl: 'https://www.highapproach.com/wp-content/uploads/2022/12/Date-Converter-1024x576.jpg', linkUrl: 'date-converter', badge: '', order: 1 },
          { title: 'Language Translator', description: 'Type in any language and instantly get it translated into Nepali, English, Hindi, Chinese, and more. Just start typing — it translates automatically.', iconUrl: '/text coverter.png', bgImageUrl: 'https://play-lh.googleusercontent.com/QHUs4KzBnlyOBpzL1Mv5BC28jQyX5u-_llyf2HKXWjkp2-UQBFyLQsYlp2LSi6lS49l8KJfh8nHKlWx_tPbbLQ', linkUrl: 'translator', badge: '', order: 2 },
          { title: 'USD Currency Converter', description: 'Enter a USD amount and see how much it is in Nepali rupees, Indian rupees, Pakistani rupees, and many more — using live exchange rates updated every hour.', iconUrl: '/currancy converter.svg', bgImageUrl: 'https://static.vecteezy.com/system/resources/previews/048/457/783/non_2x/currency-converter-currency-exchange-rate-dollars-to-euro-currency-trading-flat-icon-illustration-vector.jpg', linkUrl: 'currency-converter', badge: '', order: 3 },
          { title: 'JPG to PDF Converter', description: 'Convert single or multiple JPG/PNG images into a PDF document instantly. 100% private, works entirely in your browser without uploading files.', iconUrl: '/jpg to pdf.svg', bgImageUrl: 'https://s.smallpdf.com/static/cms/f/102628/300x180/0cf4630611/bb46b97de13eb9b590de.svg', linkUrl: 'jpg-to-pdf', badge: '', order: 4 },
          { title: 'Merge PDF', description: 'Combine multiple PDF documents into a single file instantly. Maintains 100% original ultra-high quality. Works completely offline.', iconUrl: '/merge pdf.svg', bgImageUrl: 'https://www.adobe.com/acrobat/online/media_103939bb66e443fe831b451a36fcb4af8e954e67a.png?width=1200&format=pjpg&optimize=medium', linkUrl: 'merge-pdf', badge: '', order: 5 },
          { title: 'Add Page Numbers', description: 'Natively stamp standard or Roman numeral page numbers onto any PDF file instantly. Maintains original vector quality.', iconUrl: '/page number.svg', bgImageUrl: 'https://www.adobe.com/dc-shared/assets/images/frictionless/how-to-images/add-pdf-page-numbers.svg', linkUrl: 'add-page-numbers', badge: '', order: 6 },
          { title: 'PDF to Image', description: 'Extract high-quality JPG or PNG images from any PDF document. Bundles all pages into a convenient .zip download.', iconUrl: '/pdf to png jpg.svg', bgImageUrl: 'https://s.smallpdf.com/static/cms/f/102628/300x180/a73f80f984/62ac088ae0f9e2098a7b.svg', linkUrl: 'pdf-to-image', badge: '', order: 7 },
          { title: 'AI PDF Summarizer', description: 'Upload any PDF and our AI will instantly read it, analyze it, and generate a beautifully structured markdown summary.', iconUrl: '/ai summairaizer.svg', bgImageUrl: 'https://s.smallpdf.com/static/cms/f/102628/600x520/c4a4255f01/ai-summarizer-3.svg', linkUrl: 'ai-summarizer', badge: 'NEW', order: 8 },
          { title: 'Smart Image Compressor', description: 'Reduce image file sizes (JPEG, PNG, WebP) to target levels (like 200 KB or 100 KB) instantly client-side without quality loss.', iconUrl: '/image-compressor.svg', bgImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop', linkUrl: 'image-compressor', badge: 'NEW', order: 9 },
          { title: 'EMI & Loan Calculator', description: 'Plan your loans with sliders for principal, rates, and tenure. Instantly shows EMI breakdown charts and yearly amortization ledgers.', iconUrl: '/emi-calculator.svg', bgImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600&auto=format&fit=crop', linkUrl: 'emi-calculator', badge: 'NEW', order: 10 },
          { title: 'QR Code Studio', description: 'Create customized QR codes (URLs, Wi-Fi, VCards) with logos and colors, and scan codes instantly in real-time using your webcam.', iconUrl: '/qr-studio.svg', bgImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop', linkUrl: 'qr-studio', badge: 'NEW', order: 11 },
          { title: 'JSON Formatter & Tree Viewer', description: 'Pretty-print, validate syntax correctness, and inspect complex JSON data structures using an interactive collapsible tree browser.', iconUrl: '/json-formatter.svg', bgImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop', linkUrl: 'json-formatter', badge: 'NEW', order: 12 },
          { title: 'Instant Text Diff Checker', description: 'Compare line changes between original and modified texts. Highlights line-by-line insertions and deletions with scroll sync.', iconUrl: '/diff-checker.svg', bgImageUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop', linkUrl: 'diff-checker', badge: 'NEW', order: 13 },
          { title: 'HTML, CSS & JS Code Runner', description: 'Write HTML, CSS, and JS code directly in your browser and preview the execution live. Features editor tabs, logs console, and preset web layouts.', iconUrl: '/code-runner.svg', bgImageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop', linkUrl: 'code-runner', badge: 'NEW', order: 14 },
          { title: 'File Transfer', description: 'Send files up to 100 GB instantly via secure peer-to-peer connection. Get a shareable link or email directly — free, no registration required.', iconUrl: '/file-transfer.svg', bgImageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=600&auto=format&fit=crop', linkUrl: 'file-transfer', badge: 'NEW', order: 15 },
          { title: 'Website Screenshot Studio', description: 'Capture high-resolution full-page scrolling screenshots of any site. Customize device viewports, resolutions, and download captures instantly.', iconUrl: '/screenshot-studio.svg', bgImageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop', linkUrl: 'screenshot-studio', badge: 'NEW', order: 16 }
        ];
        seeds.forEach(s => batch.set(doc(db, 'services', s.linkUrl), s));
      }
      if (seedTarget === 'all' || seedTarget === 'blog') {
        const seeds = [
          { title: 'Next.js 15: The New Era', excerpt: 'Deep dive into performance optimizations.', tag: 'NEXTJS', views: 0, content: 'Content payload...', imageUrl: 'https://images.unsplash.com/photo/1555066931-4365d14bab8c', createdAt: Date.now() }
        ];
        seeds.forEach(s => batch.set(doc(collection(db, 'blog')), s));
      }

      // PURGED: Project seeding logic has been completely removed to prevent default projects.

      // Seed Pricing Data
      if (seedTarget === 'all' || seedTarget === 'pricing') {
        const seeds = [
          { title: 'INFORMATIVE', price: '25,000', description: 'Portfolios & Landings', features: 'SEO, Responsive, Admin', isPopular: false },
          { title: 'ECOMMERCE', price: '45,000', description: 'Online Stores', features: 'Gateways, Inventory, CRM', isPopular: true }
        ];
        seeds.forEach(s => batch.set(doc(collection(db, 'pricing')), s));
      }

      // Seed FAQ Data
      if (seedTarget === 'all' || seedTarget === 'faq') {
        const seeds = [
          { question: 'What is your delivery timeline?', answer: '7-14 days for standard projects.' },
          { question: 'Do you offer post-launch support?', answer: '1 year warranty included.' }
        ];
        seeds.forEach(s => batch.set(doc(collection(db, 'faq')), s));
      }

      // Seed Testimonials Data
      if (seedTarget === 'all' || seedTarget === 'testimonials') {
        const now = Date.now();
        const testimonialSeeds: Testimonial[] = [
          {
            id: 'testimonial-1',
            name: 'Bishal Mishra',
            company: 'Developer · bishalcodes.com',
            rating: 5,
            text: "I built this platform myself, so I know every line of code inside out. What I'm genuinely proud of is how it performs — fast loads, clean UI, and it actually works the way I imagined. Building your own portfolio teaches you more than any tutorial ever will. Shipping real projects is the only way to grow.",
            createdAt: now,
          },
          {
            id: 'testimonial-2',
            name: 'Janak Singh Karki',
            company: 'Client · Web Project',
            rating: 5,
            text: "Honestly didn't expect this level of quality from a freelancer. Bishal understood exactly what I needed without me explaining too much — the website looked great, loaded fast, and he made edits without any fuss. Will definitely hire again for my next project.",
            createdAt: now + 1,
          },
          {
            id: 'testimonial-3',
            name: 'Ritik Chaudhary',
            company: 'Client · Landing Page',
            rating: 5,
            text: "Bhai ne kaam bahut accha kiya — seriously impressed. The landing page he made for my business got way more attention than I expected. Mobile look was especially clean. He replies fast and doesn't ghost you. Good guy to work with.",
            createdAt: now + 2,
          },
        ];
        testimonialSeeds.forEach(s => batch.set(doc(db, 'testimonials', s.id), s));
      }

      // Seed Experience Data
      if (seedTarget === 'all' || seedTarget === 'experience') {
        const experienceSeeds: Experience[] = [
          { id: 'exp-1', title: 'Senior Full-Stack Developer', company: 'Global Tech Solutions', period: 'Jan 2023 - Present', description: 'Leading development of scalable web applications using Next.js, Node.js, and cloud platforms.', order: 1 },
          { id: 'exp-2', title: 'Front-End Specialist', company: 'Creative Digital Agency', period: 'Jul 2021 - Dec 2022', description: 'Developed interactive user interfaces with React and optimized performance for client projects.', order: 2 },
          { id: 'exp-3', title: 'Junior Web Developer', company: 'Startup Innovations', period: 'Feb 2020 - Jun 2021', description: 'Contributed to building and maintaining company websites and internal tools using modern web technologies.', order: 3 },
        ];
        experienceSeeds.forEach(s => batch.set(doc(db, 'experience', s.id), s));
      }
      
      // Seed Legal Pages Data
      if (seedTarget === 'all' || seedTarget === 'legal') {
        const now = Date.now();
        const legalSeeds: LegalPageType[] = [
          {
            id: 'privacy-policy',
            title: 'Privacy Policy',
            slug: 'privacy-policy',
            content: `
# Privacy Policy


**Last Updated:** 2025-01-01


This Privacy Policy describes how Bishal Mishra ("I", "me", "my") collects, uses, and discloses information when you use my portfolio website and services.


## 1. Information I Collect


### Personal Data
I may collect personally identifiable information, such as your name, email address, and phone number, when you:
*   Contact me through the "Contact" form.
*   Subscribe to my newsletter or blog updates.
*   Engage in direct communication (e.g., WhatsApp chat).


### Usage Data
I may also collect information that your browser sends whenever you visit my website. This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of my website that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.


## 2. How I Use Your Information


I use the collected data for various purposes:
*   To provide and maintain my website and services.
*   To notify you about changes to my services.
*   To allow you to participate in interactive features of my website when you choose to do so.
*   To provide customer support.
*   To monitor the usage of my website.
*   To detect, prevent, and address technical issues.
*   To send you newsletters, marketing or promotional materials and other information that may be of interest to you.


## 3. Data Security


The security of your data is important to me, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While I strive to use commercially acceptable means to protect your Personal Data, I cannot guarantee its absolute security.


## 4. Your Rights


You have the following data protection rights:
*   **The right to access, update or to delete the information I have on you.** Whenever made possible, you can access, update or request deletion of your Personal Data directly within your account settings section. If you are unable to perform these actions yourself, please contact me at [developer@bishalcodes.com](mailto:developer@bishalcodes.com) to assist you.
*   **The right of rectification.** You have the right to have your information rectified if that information is inaccurate or incomplete.
*   **The right to object.** You have the right to object to my processing of your Personal Data.
*   **The right of restriction.** You have the right to request that I restrict the processing of your personal information.
*   **The right to data portability.** You have the right to be provided with a copy of the information I have on you in a structured, machine-readable and commonly used format.
*   **The right to withdraw consent.** You also have the right to withdraw your consent at any time where I relied on your consent to process your personal information.


Please note that I may ask you to verify your identity before responding to such requests.


## 5. Third-Party Links


My website may contain links to other sites that are not operated by me. If you click on a third-party link, you will be directed to that third party's site. I strongly advise you to review the Privacy Policy of every site you visit.


## 6. Changes to This Privacy Policy


I may update my Privacy Policy from time to time. I will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.


## 7. Contact Me


If you have any questions about this Privacy Policy, please contact me:
*   By email: [developer@bishalcodes.com](mailto:developer@bishalcodes.com)
*   By visiting this page on my website: [/contact](/contact)
`,
            seoTitle: 'Privacy Policy | Bishal Codes',
            seoDescription: 'Understand how Bishal Codes collects, uses, and protects your personal data through this detailed privacy policy.',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'terms-and-conditions',
            title: 'Terms and Conditions',
            slug: 'terms-and-conditions',
            content: `
# Terms and Conditions


**Last Updated:** 2025-01-01


Welcome to Bishal Codes! These terms and conditions ("Terms") govern your use of my portfolio website and any services provided. By accessing or using the website, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.


## 1. Services Provided


Bishal Codes offers web development, UI/UX design, and digital strategy consultation services. Specific project details, timelines, and deliverables will be outlined in separate project proposals or contracts.


## 2. User Accounts


When you create an account with me (e.g., for admin access or specific client portals), you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.


## 3. Intellectual Property


The website and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Bishal Mishra. My trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Bishal Mishra.


## 4. Links to Other Web Sites


My service may contain links to other sites that are not operated by me. If you click on a third-party link, you will be directed to that third party's site. I strongly advise you to review the Privacy Policy of every site you visit.


## 5. Termination


I may terminate or suspend your access to my service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.


## 6. Governing Law


These Terms shall be governed and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions.


## 7. Changes to Terms


I reserve the right, at my sole discretion, to modify or replace these Terms at any time. If a revision is material, I will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at my sole discretion.


## 8. Contact Me


If you have any questions about these Terms, please contact me:
*   By email: [developer@bishalcodes.com](mailto:developer@bishalcodes.com)
*   By visiting this page on my website: [/contact](/contact)
`,
            seoTitle: 'Terms and Conditions | Bishal Codes',
            seoDescription: 'Read the terms and conditions governing the use of Bishal Codes website and services.',
            createdAt: now + 1,
            updatedAt: now + 1,
          },
          {
            id: 'cookies-policy',
            title: 'Cookies Policy',
            slug: 'cookies-policy',
            content: `
# Cookies Policy


**Last Updated:** 2025-01-01


This Cookies Policy explains what cookies are, how Bishal Codes ("I", "me", "my") uses cookies, how third-parties I may partner with may use cookies on the website, your choices regarding cookies and further information about cookies.


## 1. What Are Cookies?


Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the website or a third-party to recognize you and make your next visit easier and the website more useful to you.


Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.


## 2. How Bishal Codes Uses Cookies


When you use and access the website, I may place a number of cookies files in your web browser.
I use cookies for the following purposes:
*   To enable certain functions of the website.
*   To provide analytics.
*   To store your preferences.
*   To enable advertisements delivery, including behavioral advertising.


I use both session and persistent cookies on the service and I use different types of cookies to run the service:


| Cookie Type | Purpose | Duration |
|---|---|---|
| **Essential** | Enable core website functionality (e.g., user authentication). | Session |
| **Analytics** | Collect anonymous data on website usage to improve performance. | Persistent (e.g., 2 years) |
| **Preference** | Remember user choices and settings (e.g., language, theme). | Persistent (e.g., 1 year) |


## 3. Third-Party Cookies


In addition to my own cookies, I may also use various third-parties cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on. These third-parties may include analytics providers (e.g., Google Analytics) and advertising networks.


## 4. Your Choices Regarding Cookies


If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features I offer, you may not be able to store your preferences, and some of my pages might not display properly.


## 5. More Information About Cookies


You can learn more about cookies and the following third-party websites:
*   AllAboutCookies: [www.allaboutcookies.org](https://www.allaboutcookies.org/)
*   Network Advertising Initiative: [www.networkadvertising.org](https://www.networkadvertising.org/)


## 6. Contact Me


If you have any questions about this Cookies Policy, please contact me:
*   By email: [developer@bishalcodes.com](mailto:developer@bishalcodes.com)
*   By visiting this page on my website: [/contact](/contact)
`,
            seoTitle: 'Cookies Policy | Bishal Codes',
            seoDescription: 'Learn about how Bishal Codes uses cookies on its website and your options for managing them.',
            createdAt: now + 2,
            updatedAt: now + 2,
          },
          {
            id: 'data-deletion-request',
            title: 'Data Deletion Request',
            slug: 'data-deletion-request',
            content: `
# Data Deletion Request


**Last Updated:** 2025-01-01


At Bishal Codes, I respect your right to privacy and control over your personal data. This page outlines the process for requesting the deletion of your personal data held by Bishal Codes.


## 1. Your Right to Data Deletion


Under various data protection regulations (such as GDPR), you have the right to request the deletion of your personal data in certain circumstances. This is also known as the "right to be forgotten."


## 2. Data I May Hold About You


I may hold personal data such as:
*   Your name and email address provided via contact forms or newsletter subscriptions.
*   Your phone number provided via contact forms or direct communication.
*   Usage data related to your interactions with my website (e.g., IP address, browser type).


## 3. How to Request Data Deletion


To submit a data deletion request, please follow these steps:


1.  **Send an Email**: Compose an email to [developer@bishalcodes.com](mailto://developer@bishalcodes.com).
2.  **Subject Line**: Clearly state "Data Deletion Request" in the subject line.
3.  **Required Information**: In the body of the email, you **must** include:
    *   Your full name.
    *   The email address(es) and phone number(s) you have used to interact with Bishal Codes.
    *   A brief description of the data you wish to have deleted (e.g., "all personal data linked to my email address").
    *   Any other information that may help me identify your data accurately.
    *   Any other information that may help me identify your data accurately.
4.  **Verification**: I may need to verify your identity to ensure that the request comes from the legitimate data owner. This might involve sending a confirmation email to the address you provided or requesting additional information.


## 4. Processing Your Request


Once I receive your request and verify your identity:
*   I will confirm receipt of your request within [e.g., 5 business days].
*   I will proceed with deleting your data from my active systems within [e.g., 30 calendar days].
*   Please note that some data may remain in backup systems for a limited period for disaster recovery purposes, after which it will also be securely deleted.


## 5. Limitations


Please be aware that certain data may be retained if legally required or for legitimate business purposes (e.g., transaction records for accounting, legal obligations). In such cases, I will inform you of the reasons for retaining specific data.


## 6. Contact Me


If you have any questions about this Data Deletion Policy or your data deletion request, please contact me:
*   By email: [developer@bishalcodes.com](mailto://developer@bishalcodes.com)
*   By visiting this page on my website: [/contact](/contact)
*   For general data protection inquiries, you may consult your local data protection authority (e.g., [Your Local DPA Link](https://example-dpa.org)).
`,
            seoTitle: 'Data Deletion Request | Bishal Codes',
            seoDescription: 'Request the deletion of your personal data from Bishal Codes systems in accordance with your privacy rights.',
            createdAt: now + 3,
            updatedAt: now + 3,
          }
        ];
        legalSeeds.forEach(s => batch.set(doc(db, 'legalPages', s.id), s));
      }


      await batch.commit();
      setSeedSuccess(true);
      fetchData();
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (e) { console.error("Seeding Failed:", e); alert("Seeding process failed."); }
    setLoading(false);
  };

  const purgeAllProjects = async () => {
    setLoading(true);
    // Optimistically clear UI immediately
    setProjects([]); 
    try {
        const q = query(collection(db, 'projects'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            // Silently succeed if already empty
            setLoading(false);
            return;
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        // No alert needed, the UI is already clear. Let the silence be the success message.
    } catch (e) {
        console.error(`FATAL: Purge operation failed for projects.`, e);
        alert("System Execution Error: Registry purge failed. A manual refresh might be required.");
        // Rollback UI on error
        fetchData(); 
    } finally {
        setLoading(false);
    }
  };

  const renderStars = (rating: number, editable: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={20} 
        className={i < rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} 
        onClick={editable ? () => setTestimonialForm(prev => ({ ...prev, rating: i + 1 })) : undefined}
        style={editable ? { cursor: 'pointer' } : {}}
      />
    ));
  };


  if (isAuthorized !== true) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
         <Loader2 className="animate-spin text-indigo-600 mb-3" size={24} />
         <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex overflow-hidden w-full max-w-full font-sans text-xs">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 mb-4">
          <p className="text-sm font-bold text-slate-900 tracking-tight">Admin Dashboard</p>
        </div>
        
        <nav className="px-3 space-y-1 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
          {(
            [
              { id: 'dashboard', label: 'Dashboard', icon: <Activity size={15} /> },
              { id: 'projects', label: 'Projects', icon: <Layout size={15} /> },
              { id: 'services', label: 'Services', icon: <Cpu size={15} /> },
              { id: 'blog', label: 'Blog', icon: <FileText size={15} /> },
              { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare size={15} /> },
              { id: 'experience', label: 'Experience', icon: <Briefcase size={15} /> },
              { id: 'leads', label: 'Leads', icon: <Inbox size={15} /> },
              { id: 'payments', label: 'Payments', icon: <Coins size={15} /> },
              { id: 'reports', label: 'Reports', icon: <AlertTriangle size={15} /> },
              { id: 'hero', label: 'Hero Settings', icon: <User size={15} /> },
              { id: 'about', label: 'About Page', icon: <User size={15} /> },
              { id: 'pricing', label: 'Pricing', icon: <DollarSign size={15} /> },
              { id: 'legal', label: 'Legal Pages', icon: <ShieldCheck size={15} /> },
              { id: 'socials', label: 'Social Links', icon: <Share2 size={15} /> },
              { id: 'users', label: 'Users & Activity', icon: <Users size={15} /> },
              { id: 'seo', label: 'SEO & Metadata', icon: <Search size={15} /> },
              { id: 'system', label: 'System Tools', icon: <Database size={15} /> },
            ] as SidebarTab[]
          ).map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); fetchData(); }} 
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <button onClick={() => navigate('home')} className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-100"><Home size={14} /> Exit to Site</button>
            <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-rose-600 font-medium text-xs rounded-lg hover:bg-rose-500/10"><LogOut size={14} /> Sign Out</button>
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600"><Menu size={20}/></button>
             <h1 className="text-sm font-semibold text-slate-900 capitalize tracking-tight">{activeTab} settings</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900">Bishal Mishra</p>
                <p className="text-[10px] font-medium text-slate-500">Administrator</p>
             </div>
             <img src="https://i.ibb.co/RpStGhqm/IMG-5251-Original.jpg" className="w-8 h-8 rounded-lg border border-slate-200 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Admin Profile" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 custom-scrollbar">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            
            {/* Quick Stats Header */}
            {activeTab === 'dashboard' || activeTab === 'system' ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                 {[
                   { label: 'Total Visits', val: dailyVisits.reduce((sum, d) => sum + (d.visits || 0), 0), icon: <Globe size={14} />, color: 'text-indigo-600' },
                   { label: 'Visits Today', val: dailyVisits.find(d => d.date === new Date().toISOString().split('T')[0])?.visits || 0, icon: <Activity size={14} />, color: 'text-sky-600' },
                   { label: 'Leads / Inquiries', val: submissions.length, icon: <Inbox size={14} />, color: 'text-purple-600' },
                   { label: 'Pending Payments', val: payments.filter(p => p.status === 'pending').length, icon: <Coins size={14} />, color: 'text-amber-600' },
                   { label: 'Total Projects', val: projects.length, icon: <Layout size={14} />, color: 'text-emerald-600' },
                 ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                       <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>{stat.icon}</div>
                       <div>
                         <p className="text-base font-semibold text-slate-900 leading-none">{stat.val}</p>
                         <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
                       </div>
                    </div>
                 ))}
              </div>
            ) : null}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Traffic Trend Graph */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-base flex items-center gap-2">
                        <Activity size={18} className="text-indigo-600 animate-pulse" />
                        Traffic Trend & Analytics
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Historical traffic data of visitors and tool interactions saved for a lifetime.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shrink-0">
                      {[
                        { label: '7D', value: 7 },
                        { label: '15D', value: 15 },
                        { label: '30D', value: 30 },
                        { label: '90D', value: 90 },
                        { label: 'All', value: -1 }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTrafficRange(opt.value)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            trafficRange === opt.value
                              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                              : 'hover:bg-slate-200/50 text-slate-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const sortedVisits = [...dailyVisits];
                    const sliceLength = trafficRange === -1 ? sortedVisits.length : Math.min(trafficRange, sortedVisits.length);
                    const currentPeriod = sortedVisits.slice(0, sliceLength);
                    const previousPeriod = sortedVisits.slice(sliceLength, sliceLength * 2);
                    
                    const chartDays = [...currentPeriod].reverse();
                    const maxVisits = Math.max(...chartDays.map(d => d.visits || 0), 1);
                    
                    const chartData = [...chartDays];
                    const padSize = trafficRange === -1 ? 0 : trafficRange;
                    while (chartData.length < padSize) {
                      chartData.unshift({ date: 'No Data', visits: 0 });
                    }

                    const totalVisits = currentPeriod.reduce((sum, d) => sum + (d.visits || 0), 0);
                    const prevTotalVisits = previousPeriod.reduce((sum, d) => sum + (d.visits || 0), 0);
                    
                    const avgVisits = currentPeriod.length > 0 ? (totalVisits / currentPeriod.length) : 0;
                    
                    let peakDay = { date: 'N/A', visits: 0 };
                    if (currentPeriod.length > 0) {
                      const sortedByVisits = [...currentPeriod].sort((a, b) => (b.visits || 0) - (a.visits || 0));
                      if (sortedByVisits[0]) {
                        peakDay = { date: sortedByVisits[0].date, visits: sortedByVisits[0].visits || 0 };
                      }
                    }
                    
                    let trendPercent = 0;
                    let hasGrowth = true;
                    if (prevTotalVisits > 0) {
                      trendPercent = ((totalVisits - prevTotalVisits) / prevTotalVisits) * 100;
                      if (trendPercent < 0) {
                        hasGrowth = false;
                        trendPercent = Math.abs(trendPercent);
                      }
                    } else {
                      trendPercent = totalVisits > 0 ? 100 : 0;
                    }

                    const width = 600;
                    const height = 140;

                    const points = chartData.map((day, i) => {
                      const x = (i / (chartData.length - 1)) * width;
                      const y = height - ((day.visits || 0) / maxVisits) * (height - 30) - 15;
                      return { x, y, date: day.date, visits: day.visits };
                    });

                    // Bezier curves generator
                    const getBezierPath = (pts: typeof points) => {
                      if (pts.length === 0) return '';
                      let path = `M ${pts[0].x} ${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[i];
                        const p1 = pts[i + 1];
                        const cp1x = p0.x + (p1.x - p0.x) / 3;
                        const cp1y = p0.y;
                        const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
                        const cp2y = p1.y;
                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                      }
                      return path;
                    };

                    const pathD = getBezierPath(points);
                    const fillD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';

                    // Calculate a 3-day rolling average for the dotted trend line offset slightly above the main line
                    const avgPoints = points.map((p, i) => {
                      if (p.date === 'No Data' || !p.date) return p;
                      const sub = points.slice(Math.max(0, i - 2), i + 1).filter(item => item.date !== 'No Data' && item.date);
                      const avgV = sub.reduce((sum, item) => sum + (item.visits || 0), 0) / (sub.length || 1);
                      const y = height - (avgV / maxVisits) * (height - 30) - 15 - 6; // Offset slightly above
                      return { ...p, y };
                    });
                    const avgPathD = getBezierPath(avgPoints);

                    // Decide label step size to prevent crowding
                    let step = 1;
                    if (chartData.length > 30) step = 7;
                    else if (chartData.length > 15) step = 3;
                    else if (chartData.length > 7) step = 1;

                    return (
                      <div className="space-y-5">
                        {/* Period metrics overview cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Total Visits Card */}
                          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Visits</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-slate-900">{totalVisits}</span>
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                hasGrowth ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {hasGrowth ? '↑' : '↓'} {trendPercent.toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">vs previous {sliceLength}d ({prevTotalVisits})</p>
                          </div>
                          
                          {/* Average Daily Visits Card */}
                          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Average</span>
                            <div>
                              <span className="text-xl font-bold text-slate-900">{avgVisits.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-500 font-medium ml-1">visits / day</span>
                            </div>
                            <p className="text-[9px] text-slate-400">Active period mean engagement</p>
                          </div>

                          {/* Peak Traffic Card */}
                          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Peak Traffic</span>
                            <div>
                              <span className="text-xl font-bold text-slate-900">{peakDay.visits}</span>
                              <span className="text-[10px] text-slate-500 font-medium ml-1">visits</span>
                            </div>
                            <p className="text-[9px] text-slate-400 truncate">
                              On {peakDay.date !== 'N/A' ? new Date(peakDay.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Custom SVG Line Graph */}
                        <div className="relative w-full h-48 pt-4 pb-2 px-2 border-b border-slate-100">
                          <div className="relative w-full h-full">
                            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                                </linearGradient>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#6366f1" />
                                  <stop offset="50%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                              
                              {/* Grid lines (horizontal) */}
                              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                                <line 
                                  key={idx} 
                                  x1="0" 
                                  y1={15 + p * (height - 30)} 
                                  x2={width} 
                                  y2={15 + p * (height - 30)} 
                                  stroke="#f1f5f9" 
                                  strokeWidth="1" 
                                  strokeDasharray="4 4"
                                />
                              ))}

                              {/* Filled Area */}
                              {fillD && <path d={fillD} fill="url(#chartGradient)" />}

                              {/* Dashed Guideline Path */}
                              {avgPathD && (
                                <path 
                                  d={avgPathD} 
                                  fill="none" 
                                  stroke="#8b5cf6" 
                                  strokeWidth="1" 
                                  strokeDasharray="2 3" 
                                  opacity="0.65" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                />
                              )}

                              {/* Solid Thin Line Path */}
                              {pathD && (
                                <path 
                                  d={pathD} 
                                  fill="none" 
                                  stroke="url(#lineGradient)" 
                                  strokeWidth="1.25" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                />
                              )}

                              {/* Bullet Nodes */}
                              {points.map((p, idx) => {
                                if (p.date === 'No Data' || !p.date) return null;
                                const isHovered = hoveredDotIndex === idx;
                                return (
                                  <g key={idx}>
                                    <circle 
                                      cx={p.x} 
                                      cy={p.y} 
                                      r="4" 
                                      fill="#ffffff" 
                                      stroke="#6366f1" 
                                      strokeWidth="1" 
                                      style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s ease' }} 
                                    />
                                    <circle 
                                      cx={p.x} 
                                      cy={p.y} 
                                      r="1.5" 
                                      fill={isHovered ? '#6366f1' : '#c7d2fe'} 
                                      style={{ transition: 'fill 0.15s ease' }} 
                                    />
                                  </g>
                                );
                              })}
                            </svg>

                            {/* Hover Tooltip Overlay Areas */}
                            <div className="absolute inset-0 flex justify-between">
                              {points.map((p, idx) => {
                                if (p.date === 'No Data' || !p.date) return <div key={idx} className="flex-1" />;
                                return (
                                  <div 
                                    key={idx} 
                                    className="flex-1 group relative flex justify-center"
                                    onMouseEnter={() => setHoveredDotIndex(idx)}
                                    onMouseLeave={() => setHoveredDotIndex(null)}
                                  >
                                    {/* Vertical line indicator on hover */}
                                    <div className="absolute top-0 bottom-0 w-[1px] bg-slate-200/50 hidden group-hover:block pointer-events-none" style={{ left: '50%' }} />
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center bg-slate-900/95 backdrop-blur-sm text-white text-[10px] p-2.5 rounded-xl border border-slate-700/50 shadow-2xl z-30 whitespace-nowrap pointer-events-none transition-all duration-200">
                                      <span className="text-slate-300 font-medium">
                                        {new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-indigo-400 text-xs font-black mt-1">{p.visits} visits</span>
                                      {totalVisits > 0 && (
                                        <span className="text-slate-400 text-[8px] mt-0.5">
                                          {((p.visits / totalVisits) * 100).toFixed(1)}% of total
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Date labels below graph */}
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 px-3">
                          {chartData.map((d, i) => {
                            const showLabel = i % step === 0 && d.date && d.date !== 'No Data';
                            return (
                              <span key={i} className="w-8 text-center truncate" style={{ visibility: showLabel ? 'visible' : 'hidden' }}>
                                {d.date ? new Date(d.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Traffic Table & Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                  {/* Site Visits List */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                      <h3 className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                        <Globe size={16} className="text-indigo-600" />
                        Lifetime Traffic Log
                      </h3>
                      <div className="relative w-full sm:w-28 shrink-0">
                        <input
                          type="text"
                          placeholder="Search date..."
                          value={trafficLogSearch}
                          onChange={(e) => setTrafficLogSearch(e.target.value)}
                          className="w-full text-[10px] pl-5 pr-4 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg outline-none text-slate-700 focus:border-indigo-500 transition-all font-semibold"
                        />
                        <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        {trafficLogSearch && (
                          <button onClick={() => setTrafficLogSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold">×</button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {(() => {
                        const filteredLog = dailyVisits.filter(d => 
                          d.date.includes(trafficLogSearch) || 
                          new Date(d.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}).toLowerCase().includes(trafficLogSearch.toLowerCase())
                        );
                        if (filteredLog.length === 0) {
                          return <p className="text-slate-400 text-xs py-8 text-center font-medium uppercase tracking-wider">No matching logs</p>;
                        }
                        const maxVisits = Math.max(...dailyVisits.map(v => v.visits || 1));
                        return filteredLog.map((d, idx) => {
                          const percent = ((d.visits || 0) / maxVisits) * 100;
                          const formattedDate = new Date(d.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>{formattedDate}</span>
                                <span className="text-indigo-600">{d.visits || 0} visits</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Tool Clicks Card */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 lg:col-span-2 text-left">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                        <Cpu size={16} className="text-indigo-600" />
                        Tool Usage Leaderboard
                      </h3>
                      {toolClicks.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                          {toolClicks.reduce((sum, item) => sum + (item.clicks || 0), 0)} Total Clicks
                        </span>
                      )}
                    </div>
                    <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {toolClicks.length > 0 ? [...toolClicks].sort((a,b) => b.clicks - a.clicks).map((tc, idx) => {
                        const totalClicks = toolClicks.reduce((sum, item) => sum + (item.clicks || 0), 0);
                        const percent = ((tc.clicks || 0) / (totalClicks || 1)) * 100;
                        
                        let rankBadgeStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                        let progressColor = 'bg-gradient-to-r from-indigo-500 to-purple-500';
                        let rankLabel = `#${idx + 1}`;
                        
                        if (idx === 0) {
                          rankBadgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-500/20 font-black';
                          progressColor = 'bg-gradient-to-r from-amber-500 to-yellow-400';
                          rankLabel = '🥇';
                        } else if (idx === 1) {
                          rankBadgeStyle = 'bg-slate-300/30 text-slate-700 border-slate-300/40 font-black';
                          progressColor = 'bg-gradient-to-r from-slate-400 to-slate-300';
                          rankLabel = '🥈';
                        } else if (idx === 2) {
                          rankBadgeStyle = 'bg-orange-500/10 text-orange-700 border-orange-500/20 font-black';
                          progressColor = 'bg-gradient-to-r from-orange-500 to-amber-600';
                          rankLabel = '🥉';
                        }

                        return (
                          <div key={idx} className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs shrink-0 shadow-sm ${rankBadgeStyle}`}>
                              {rankLabel}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="capitalize font-bold text-slate-800">{tc.toolSlug.replace(/-/g, ' ')}</span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  <strong className="text-indigo-600 font-extrabold">{tc.clicks || 0}</strong> clicks ({percent.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-slate-400 text-xs py-8 text-center font-medium uppercase tracking-wider">No tool click data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
                    <h3 className="text-slate-900 font-semibold text-base mb-4 flex items-center gap-2"><Clock size={16} /> Recent Leads / Contacts</h3>
                    <div className="space-y-3">
                      {submissions.length > 0 ? submissions.slice(0, 5).map(s => (
                        <div key={s.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-left">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{s.name}</p>
                            <p className="text-[10px] text-slate-500">{s.email || s.phone}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-indigo-600">{new Date(s.timestamp).toLocaleDateString()}</span>
                        </div>
                      )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Recent Leads</div>}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
                    <h3 className="text-slate-900 font-semibold text-base mb-4 flex items-center gap-2"><Layout size={16} /> Recent Projects</h3>
                    <div className="space-y-3">
                      {projects.length > 0 ? projects.slice(0, 5).map(p => (
                        <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-left">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{p.title}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{p.description}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-purple-600">{p.techStack && p.techStack.slice(0, 2).join(', ')}</span>
                        </div>
                      )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Projects Found</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

                    {activeTab === 'projects' && (
              <div className="space-y-8">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Project Title</label>
                          <input placeholder="Project Title" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Live URL</label>
                          <input placeholder="Live URL" value={projectForm.liveUrl} onChange={e => setProjectForm({...projectForm, liveUrl: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">GitHub URL</label>
                          <input placeholder="GitHub URL" value={projectForm.githubUrl || ''} onChange={e => setProjectForm({...projectForm, githubUrl: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Tech Stack (CSV)</label>
                          <input placeholder="Tech Stack (CSV)" value={Array.isArray(projectForm.techStack) ? projectForm.techStack.join(', ') : projectForm.techStack} onChange={e => setProjectForm({...projectForm, techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Short Description</label>
                          <textarea placeholder="Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" rows={2} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">SEO Description</label>
                          <textarea placeholder="SEO Description" value={projectForm.seoDescription || ''} onChange={e => setProjectForm({...projectForm, seoDescription: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" rows={2} />
                        </div>
                        
                        <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Project Media</p>
                          <input type="file" ref={fileInputRef} multiple accept="image/*,video/*,application/pdf" onChange={handleFileUpload} className="block w-full text-[10px] text-slate-600 file:bg-slate-100 file:text-slate-900 file:border-0 file:px-4 file:py-2 file:rounded-lg file:mr-4 file:font-semibold cursor-pointer" />
                          
                          <div className="flex gap-2">
                             <input placeholder="External Image/Video URL" value={mediaLinkInput} onChange={e => setMediaLinkInput(e.target.value)} className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-slate-900 text-xs outline-none focus:border-indigo-500 transition-all font-medium" />
                             <button onClick={() => { if(mediaLinkInput) setProjectForm(p=>({...p, images:[...p.images, {url: mediaLinkInput, type: mediaLinkInput.includes('youtube')?'video':'image'}]})); setMediaLinkInput(''); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-all">Add URL</button>
                          </div>
    
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {projectForm.images.map((img, i) => (
                              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                {img.type === 'image' ? (
                                    <img src={img.url} className="w-full h-full object-cover" alt={`Project media ${i}`} />
                                ) : img.type === 'video' ? (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Video size={20} />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-2">
                                        <FileText size={20} />
                                        <span className="text-[8px] mt-1 font-bold text-center select-none truncate w-full">{img.type.toUpperCase()}</span>
                                    </div>
                                )}
                                <button onClick={() => removeMedia(i)} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={14}/></button>
                              </div>
                            ))}
                          </div>
                        </div>
    
                        <button onClick={() => saveItem('projects', projectForm, setProjectForm, defaultProjectForm)} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline" /> Save Project</button>
                      </div>
                    </div>
                  </div>
                )}
    
                {/* PROJECT LIST */}
                <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm text-left">
                   <div className="flex justify-between items-center p-4 border-b border-slate-200 mb-2">
                      <h3 className="text-slate-900 font-semibold text-base">Projects List</h3>
                      <div className="flex gap-2">
                        {projects.length > 0 && !loading && (
                            <button 
                                onClick={purgeAllProjects}
                                className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-rose-600 hover:text-white transition-all active:scale-95 animate-in fade-in duration-350">
                                <Trash2 size={12}/> Delete All Projects
                            </button>
                        )}
                        <button 
                            onClick={() => { setProjectForm(defaultProjectForm); setFormModalTitle('Add New Project'); setIsFormModalOpen(true); }}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                            <Plus size={12}/> Add Project
                        </button>
                      </div>
                   </div>                     {projects.length > 0 ? (
                     <div className="space-y-2">
                       {projects.map(p => (
                         <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
                           <img src={p.images[0]?.url || 'https://via.placeholder.com/100x100?text=No+Img'} className="w-16 h-16 object-cover rounded-lg shrink-0 border border-slate-200" alt={p.title} />
                           <div className="flex-1 min-w-0">
                             <h4 className="text-slate-900 font-semibold truncate">{p.title}</h4>
                             <div className="flex flex-wrap gap-1 mt-1">
                               {Array.isArray(p.techStack) && p.techStack.slice(0, 4).map(t => (
                                 <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200">{t}</span>
                               ))}
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-sky-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all"><ExternalLink size={14}/></a>
                             <button onClick={() => startEdit(p, setProjectForm)} className="p-2 bg-slate-100 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all"><Edit3 size={14}/></button>
                             <button onClick={() => deleteItem('projects', p.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="py-16 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">
                       <Layout size={32} className="mx-auto mb-4 opacity-20"/>
                       No Projects Found
                     </div>
                   )}
                </div>

              </div>
            )}
            
            
            {activeTab === 'services' && (
              <div className="space-y-6">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Service Title</label>
                          <input placeholder="Title" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Link URL / Slug</label>
                          <input placeholder="Link URL (slug)" value={serviceForm.linkUrl} onChange={e => setServiceForm({...serviceForm, linkUrl: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Icon URL</label>
                          <input placeholder="Icon URL" value={serviceForm.iconUrl} onChange={e => setServiceForm({...serviceForm, iconUrl: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-4 mt-2">
                          <label className="text-xs font-semibold text-slate-700 block">Background Image</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {serviceForm.bgImageUrl && (
                              <div className="w-20 h-12 rounded-lg bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                <img src={serviceForm.bgImageUrl} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-2">
                              <input 
                                type="text" 
                                placeholder="Paste background image URL link here..." 
                                value={serviceForm.bgImageUrl || ''} 
                                onChange={e => setServiceForm({...serviceForm, bgImageUrl: e.target.value})} 
                                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all text-xs" 
                              />
                              
                              <div className="flex items-center gap-2">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setLoading(true);
                                      try {
                                        const res = await uploadToCloudinary(e.target.files[0]);
                                        setServiceForm({...serviceForm, bgImageUrl: res.url});
                                        alert("Background image uploaded successfully!");
                                      } catch (err: any) {
                                        alert(`Upload failed: ${err.message || err}`);
                                      } finally {
                                        setLoading(false);
                                      }
                                    }
                                  }} 
                                  className="hidden" 
                                  id="service-bg-upload" 
                                />
                                <label htmlFor="service-bg-upload" className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all inline-block select-none shadow-sm hover:bg-slate-800">
                                  Upload Background Image
                                </label>
                                
                                {serviceForm.bgImageUrl && (
                                  <button 
                                    type="button"
                                    onClick={() => setServiceForm({...serviceForm, bgImageUrl: ''})}
                                    className="bg-rose-100 text-rose-600 hover:bg-rose-200 px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Badge</label>
                          <input placeholder="Badge (e.g., NEW) Optional" value={serviceForm.badge} onChange={e => setServiceForm({...serviceForm, badge: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Order</label>
                          <input type="number" placeholder="Order" value={serviceForm.order} onChange={e => setServiceForm({...serviceForm, order: Number(e.target.value)})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Description</label>
                          <textarea placeholder="Description" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs md:col-span-2" rows={3} />
                        </div>
                        <button onClick={async () => {
                          if (!serviceForm.title || !serviceForm.linkUrl) { alert('Title and Link URL are required!'); return; }
                          setLoading(true);
                          try {
                            const data = { ...serviceForm, order: Number(serviceForm.order) };
                            if ((serviceForm as any).id) {
                              await setDoc(doc(db, 'services', (serviceForm as any).id), data);
                              setServices(prev => prev.map(s => s.id === (serviceForm as any).id ? { id: s.id, ...data } : s));
                            } else {
                              const docRef = await addDoc(collection(db, 'services'), data);
                              setServices([...services, { id: docRef.id, ...data }]);
                            }
                            setServiceForm({ title: '', description: '', iconUrl: '', bgImageUrl: '', linkUrl: '', badge: '', order: 0 });
                            setIsFormModalOpen(false);
                          } catch(e) { alert('Error saving service'); console.error(e); }
                          setLoading(false);
                        }} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm">
                          <Save size={14} /> Save Service
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-900 font-semibold text-sm">Existing Services</h3>
                    <button 
                        onClick={() => { setServiceForm({ title: '', description: '', iconUrl: '', bgImageUrl: '', linkUrl: '', badge: '', order: 0 }); setFormModalTitle('Add New Service'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add Service
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider">
                        <th className="p-3">Order</th>
                        <th className="p-3">Icon</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Link</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.sort((a,b) => a.order - b.order).map(srv => (
                        <tr key={srv.id} className="border-b border-slate-100 text-sm">
                          <td className="p-3 font-medium text-slate-800">{srv.order}</td>
                          <td className="p-3"><img src={srv.iconUrl} className="w-8 h-8 object-contain rounded" /></td>
                          <td className="p-3 font-semibold text-slate-900">{srv.title} {srv.badge && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full ml-2">{srv.badge}</span>}</td>
                          <td className="p-3 text-slate-500 text-xs">{srv.linkUrl}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => startEdit(srv, setServiceForm)} className="text-blue-500 hover:text-blue-700 mr-3"><Edit3 size={16}/></button>
                            <button onClick={async () => { if (confirm('Are you sure you want to delete this service?')) { await deleteDoc(doc(db, 'services', srv.id)); setServices(prev => prev.filter(s => s.id !== srv.id)); } }} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
  {activeTab === 'blog' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-5xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <div className="flex items-center gap-3">
                          {/* Editor / Preview Tabs */}
                          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                            <button
                              onClick={() => setBlogPreviewMode('editor')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                blogPreviewMode === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              ✏️ Editor
                            </button>
                            <button
                              onClick={() => setBlogPreviewMode('preview')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                blogPreviewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              👁 Live Preview
                            </button>
                          </div>
                          <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                        </div>
                      </div>

                      {/* ── EDITOR MODE ── */}
                      {blogPreviewMode === 'editor' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 flex justify-between items-center pb-2">
                            <span className="text-xs font-semibold text-slate-400">AI Assistance Available</span>
                            <button onClick={handleDeepBlogGen} disabled={aiLoading} className="bg-slate-100 text-slate-800 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all">
                               {aiLoading ? <Loader2 size={14} className="animate-spin"/> : <><Wand2 size={14}/> Generate Content</>}
                            </button>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Article Title</label>
                            <input placeholder="Title" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Banner URL</label>
                            <div className="flex gap-2">
                              <input placeholder="Banner URL" value={blogForm.imageUrl} onChange={e => setBlogForm({...blogForm, imageUrl: e.target.value})} className="flex-1 bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                              <div className="relative flex items-center">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    if (!e.target.files || e.target.files.length === 0) return;
                                    setLoading(true);
                                    try {
                                      const res = await uploadToCloudinary(e.target.files[0]);
                                      setBlogForm(prev => ({ ...prev, imageUrl: res.url }));
                                      alert("Blog banner uploaded to Cloudinary!");
                                    } catch (err: any) {
                                      alert(`Upload failed: ${err.message || err}`);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }} 
                                  className="hidden" 
                                  id="blog-banner-upload" 
                                />
                                <label htmlFor="blog-banner-upload" className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs hover:bg-slate-800 transition-all inline-block select-none whitespace-nowrap">
                                  Upload Banner
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">Tag</label>
                            <input placeholder="Tag" value={blogForm.tag} onChange={e => setBlogForm({...blogForm, tag: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-700">Content (Markdown)</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleHumanizeBlogContent}
                                  disabled={humanizeLoading || !blogForm.content.trim()}
                                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {humanizeLoading ? (
                                    <Loader2 size={11} className="animate-spin text-indigo-700" />
                                  ) : (
                                    <Sparkles size={11} className="text-indigo-700" />
                                  )}
                                  AI Humanizer (Undetectable.ai)
                                </button>
                                <div className="relative">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleUploadContentImage} 
                                    className="hidden" 
                                    id="blog-content-image-upload" 
                                  />
                                  <label htmlFor="blog-content-image-upload" className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all select-none whitespace-nowrap">
                                    <ImageIcon size={11} className="text-slate-600" />
                                    Upload & Insert Image
                                  </label>
                                </div>
                              </div>
                            </div>
                            <textarea ref={textareaRef} placeholder="Content (Markdown)" value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs font-mono" rows={14} />
                          </div>
                          <button onClick={() => saveItem('blog', blogForm, setBlogForm, {id:'', title:'', excerpt:'', tag:'', content:'', imageUrl:'', seoDescription:'', views:0})} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline" /> Save Blog Post</button>
                        </div>
                      )}

                      {/* ── LIVE PREVIEW MODE ── */}
                      {blogPreviewMode === 'preview' && (
                        <div>
                          {/* Image Replace Sub-Modal */}
                          {imageReplaceTarget && (
                            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40">
                              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-3 border border-slate-200">
                                <h3 className="font-bold text-slate-900 text-sm">Replace Image</h3>
                                <p className="text-slate-500 text-xs">Paste a URL or upload a new image file</p>
                                <input
                                  type="text"
                                  placeholder="https://... paste image URL here"
                                  value={imageReplaceUrl}
                                  onChange={e => setImageReplaceUrl(e.target.value)}
                                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs"
                                />
                                <div className="flex gap-2">
                                  <label className="flex-1 cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        if (!e.target.files?.[0]) return;
                                        setLoading(true);
                                        try {
                                          const res = await uploadToCloudinary(e.target.files[0]);
                                          setImageReplaceUrl(res.url);
                                        } catch (err: any) {
                                          alert(`Upload failed: ${err.message}`);
                                        } finally { setLoading(false); }
                                      }}
                                    />
                                    <span className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-2.5 px-3 rounded-lg text-xs font-bold transition-all">
                                      <UploadCloud size={13} /> Upload File
                                    </span>
                                  </label>
                                  <button
                                    onClick={() => {
                                      if (!imageReplaceUrl.trim()) return;
                                      const escaped = imageReplaceTarget.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                      const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}\\)`, 'g');
                                      const updated = blogForm.content.replace(regex, `![$1](${imageReplaceUrl.trim()})`);
                                      setBlogForm(prev => ({ ...prev, content: updated }));
                                      setImageReplaceTarget(null);
                                      setImageReplaceUrl('');
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3 rounded-lg text-xs font-bold transition-all"
                                  >
                                    ✓ Apply
                                  </button>
                                </div>
                                <button onClick={() => { setImageReplaceTarget(null); setImageReplaceUrl(''); }} className="w-full text-slate-400 text-xs hover:text-slate-600 transition-colors">Cancel</button>
                              </div>
                            </div>
                          )}

                          {/* Preview header */}
                          <div className="mb-4 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview — hover images to edit/delete</span>
                            <button onClick={() => saveItem('blog', blogForm, setBlogForm, {id:'', title:'', excerpt:'', tag:'', content:'', imageUrl:'', seoDescription:'', views:0})} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2"><Save size={13} /> Save Post</button>
                          </div>

                          {/* Blog post preview */}
                          <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 prose prose-slate max-w-none">
                            {/* Banner */}
                            {blogForm.imageUrl && (
                              <div className="relative group/img mb-6 rounded-xl overflow-hidden">
                                <img src={blogForm.imageUrl} alt={blogForm.title} className="w-full h-56 object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover/img:opacity-100">
                                  <button
                                    onClick={() => { setImageReplaceTarget({ oldUrl: blogForm.imageUrl }); setImageReplaceUrl(blogForm.imageUrl); }}
                                    className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-1"
                                  >
                                    <ImageIcon size={11} /> Change Image
                                  </button>
                                  <button
                                    onClick={() => setBlogForm(prev => ({ ...prev, imageUrl: '' }))}
                                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-1"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              </div>
                            )}
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{blogForm.title || 'Untitled Post'}</h1>
                            <p className="text-slate-500 text-sm mb-6">{blogForm.excerpt}</p>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({ src, alt }: any) => (
                                  <span className="relative group/img block my-4">
                                    <img src={src} alt={alt} className="w-full rounded-xl max-h-80 object-cover" />
                                    <span className="absolute inset-0 bg-black/0 group-hover/img:bg-black/50 transition-all duration-200 rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover/img:opacity-100">
                                      <button
                                        onClick={() => { setImageReplaceTarget({ oldUrl: src || '' }); setImageReplaceUrl(src || ''); }}
                                        className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-1"
                                      >
                                        <ImageIcon size={11} /> Change Image
                                      </button>
                                      <button
                                        onClick={() => {
                                          const escaped = (src || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                          const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escaped}\\)`, 'g');
                                          setBlogForm(prev => ({ ...prev, content: prev.content.replace(regex, '') }));
                                        }}
                                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-1"
                                      >
                                        <Trash2 size={11} /> Delete
                                      </button>
                                    </span>
                                  </span>
                                ),
                                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-8 mb-3">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 mt-7 mb-3 border-b border-slate-100 pb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-bold text-slate-800 mt-5 mb-2">{children}</h3>,
                                p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-4 text-sm">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                                a: ({ href, children }) => <a href={href} className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{children}</a>,
                                code: ({ children }) => <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-mono">{children}</code>,
                                pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-[11px] font-mono my-4">{children}</pre>,
                                ul: ({ children }) => <ul className="list-disc list-inside text-slate-700 text-sm space-y-1 mb-4 ml-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside text-slate-700 text-sm space-y-1 mb-4 ml-2">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-slate-600 my-4">{children}</blockquote>,
                                hr: () => <hr className="border-slate-200 my-6" />,
                                table: ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full text-xs border-collapse border border-slate-200 rounded-lg">{children}</table></div>,
                                th: ({ children }) => <th className="bg-slate-100 border border-slate-200 p-2 font-bold text-slate-800 text-left">{children}</th>,
                                td: ({ children }) => <td className="border border-slate-200 p-2 text-slate-700">{children}</td>,
                              } as any}
                            >
                              {blogForm.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">Existing Blog Posts</h3>
                    <button 
                        onClick={() => { setBlogForm({ id: '', title: '', excerpt: '', tag: '', content: '', imageUrl: '', seoDescription: '', views: 0 }); setFormModalTitle('Write Blog Post'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Write Post
                    </button>
                  </div>
                  <div className="space-y-2">
                    {blogs.length > 0 ? blogs.map(b => (
                    <div key={b.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors">
                      <p className="text-slate-900 font-semibold truncate">{b.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(b, setBlogForm)} className="p-2 bg-slate-100 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all"><Edit3 size={14}/></button>
                        <button onClick={() => deleteItem('blog', b.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Blog Posts Found</div>}
                </div>
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Client Name</label>
                          <input placeholder="Client Name" value={testimonialForm.name} onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Company</label>
                          <input placeholder="Company Name" value={testimonialForm.company} onChange={e => setTestimonialForm({...testimonialForm, company: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Rating (1-5 Stars)</label>
                          <div className="flex items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg w-fit">
                            {renderStars(testimonialForm.rating, true)} {/* Editable stars */}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2 border-t border-slate-100 pt-4 mt-2">
                          <label className="text-xs font-semibold text-slate-700 block">Client Profile Image (Avatar)</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {testimonialForm.avatarUrl ? (
                                <img src={testimonialForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-indigo-600 font-bold text-xl">{testimonialForm.name ? testimonialForm.name.charAt(0).toUpperCase() : 'C'}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <input 
                                type="text" 
                                placeholder="Or paste direct image URL link here..." 
                                value={testimonialForm.avatarUrl || ''} 
                                onChange={e => setTestimonialForm({...testimonialForm, avatarUrl: e.target.value})} 
                                className="w-full bg-white border border-slate-300 p-2 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all text-xs" 
                              />
                              
                              <div className="flex items-center gap-2">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      try {
                                        const res = await uploadToCloudinary(e.target.files[0]);
                                        setTestimonialForm({...testimonialForm, avatarUrl: res.url});
                                        alert("Client profile image uploaded successfully!");
                                      } catch (err: any) {
                                        alert(`Upload failed: ${err.message || err}`);
                                      }
                                    }
                                  }} 
                                  className="hidden" 
                                  id="client-avatar-upload" 
                                />
                                <label htmlFor="client-avatar-upload" className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-all inline-block select-none shadow-sm hover:bg-slate-800">
                                  Upload Profile Photo
                                </label>
                                
                                {testimonialForm.avatarUrl && (
                                  <button 
                                    type="button"
                                    onClick={() => setTestimonialForm({...testimonialForm, avatarUrl: ''})}
                                    className="bg-rose-100 text-rose-600 hover:bg-rose-200 px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Testimonial Text</label>
                          <textarea placeholder="Client feedback..." value={testimonialForm.text} onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 font-medium resize-none outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" rows={4} />
                        </div>
                        <button onClick={() => saveItem('testimonials', testimonialForm, setTestimonialForm, defaultTestimonialForm)} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"><Save size={14} className="inline" /> Save Testimonial</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">Testimonials</h3>
                    <button 
                        onClick={() => { setTestimonialForm(defaultTestimonialForm); setFormModalTitle('Add Testimonial'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add Testimonial
                    </button>
                  </div>
                  <div className="space-y-2">
                    {testimonials.length > 0 ? testimonials.map(t => (
                    <div key={t.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0 font-bold text-indigo-700">
                          {t.avatarUrl ? (
                            <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            t.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-slate-900 font-semibold truncate">{t.name}</p>
                            <span className="text-[9px] font-medium text-slate-500">from {t.company}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-1.5">{renderStars(t.rating)}</div>
                          <p className="text-slate-600 text-xs italic line-clamp-1">"{t.text}"</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => startEdit(t, setTestimonialForm)} className="p-2 bg-slate-100 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all"><Edit3 size={14}/></button>
                        <button onClick={() => deleteItem('testimonials', t.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Testimonials Found</div>}
                </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Job Title</label>
                          <input placeholder="e.g., Senior Full-Stack Developer" value={experienceForm.title} onChange={e => setExperienceForm({...experienceForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Company</label>
                          <input placeholder="e.g., Tech Solutions" value={experienceForm.company} onChange={e => setExperienceForm({...experienceForm, company: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Period</label>
                          <input placeholder="e.g., Jan 2023 - Present" value={experienceForm.period} onChange={e => setExperienceForm({...experienceForm, period: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Order (Lower = First)</label>
                          <input type="number" placeholder="e.g., 1" value={experienceForm.order} onChange={e => setExperienceForm({...experienceForm, order: Number(e.target.value)})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Description</label>
                          <textarea placeholder="Key responsibilities and achievements..." value={experienceForm.description} onChange={e => setExperienceForm({...experienceForm, description: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" rows={4} />
                        </div>
                        <button onClick={() => saveItem('experience', experienceForm, setExperienceForm, defaultExperienceForm)} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline" /> Save Experience</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">Work Experiences</h3>
                    <button 
                        onClick={() => { setExperienceForm(defaultExperienceForm); setFormModalTitle('Add Experience'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add Experience
                    </button>
                  </div>
                  <div className="space-y-2">
                  {experiences.length > 0 ? experiences.map(exp => (
                    <div key={exp.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-slate-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-slate-900 font-semibold truncate">{exp.title}</p>
                          <span className="text-[9px] font-medium text-slate-500">at {exp.company} ({exp.period})</span>
                        </div>
                        <p className="text-slate-600 text-sm italic line-clamp-2">"{exp.description}"</p>
                        <p className="text-slate-400 text-[8px] font-semibold uppercase tracking-widest mt-1">Order: {exp.order}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => startEdit(exp, setExperienceForm)} className="p-2 bg-slate-100 text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all"><Edit3 size={14}/></button>
                        <button onClick={() => deleteItem('experience', exp.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Experience Entries Found</div>}
                </div>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left font-sans">
                <h2 className="text-slate-900 font-semibold text-base mb-6">Leads & Contact Inquiries</h2>
                <div className="space-y-4">
                  {submissions.length > 0 ? submissions.map((s) => (
                    <div key={s.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors text-left">
                      <div>
                        <p className="text-slate-900 font-semibold text-sm truncate">{s.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{s.email || s.phone} • {new Date(s.timestamp).toLocaleDateString()}</p>
                        <p className="text-slate-700 text-xs mt-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm leading-relaxed">{s.message}</p>
                      </div>
                      <button onClick={() => deleteItem('submissions', s.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all shrink-0"><Trash2 size={14}/></button>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">No Inquiries Found</div>}
                </div>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-slate-900 font-semibold text-lg mb-6">Payment Requests</h2>
                <div className="space-y-4">
                  {payments.length > 0 ? payments.map((p) => (
                    <div key={p.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6 hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full
                            ${p.status === 'pending' ? 'bg-orange-100 text-orange-600 border border-orange-200' : ''}
                            ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : ''}
                            ${p.status === 'declined' ? 'bg-rose-100 text-rose-600 border border-rose-200' : ''}
                          `}>{p.status}</span>
                          <p className="text-slate-500 text-xs font-medium">{new Date(p.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-slate-900 font-bold text-base">{p.userName} (<span className="font-normal text-slate-500">{p.userEmail}</span>)</p>
                        <p className="text-slate-600 text-sm mt-1">Package: <span className="font-semibold text-indigo-600">{p.creditPackage.name}</span> (+{p.creditPackage.credits} Credits for Rs. {p.creditPackage.price})</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button onClick={() => { setIsProofViewerOpen(true); setCurrentProofBase64(p.paymentProofBase64); }} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-sky-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all text-xs font-semibold flex items-center justify-center gap-2"><ImageIcon size={16} /> View Proof</button>
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprovePayment(p.id!, p.userId, p.creditPackage.credits)} className="flex-1 sm:flex-none p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={16} /></button>
                            <button onClick={() => handleDeclinePayment(p.id!)} className="flex-1 sm:flex-none p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No Payment Requests</div>}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
                <h2 className="text-slate-900 font-semibold text-lg mb-6">User Reports & Issues</h2>
                <div className="space-y-4">
                  {reports.length > 0 ? reports.map((r) => (
                    <div key={r.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors text-left">
                      <div>
                        <p className="text-slate-900 font-semibold text-sm truncate">{r.name}</p>
                        <p className="text-[10px] font-medium text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</p>
                        <p className="text-slate-600 text-xs mt-1 line-clamp-2">"{r.problem}"</p>
                      </div>
                      <button onClick={() => deleteItem('reports', r.id)} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No Reports Found</div>}
                </div>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 text-left">
                <h2 className="text-slate-900 font-semibold text-lg">Hero Section Settings</h2>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Main Title (Global Default)</label>
                    <input type="text" value={heroData.title} onChange={e => setHeroData({...heroData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Subtitle (Global Default)</label>
                    <textarea value={heroData.subtitle} onChange={e => setHeroData({...heroData, subtitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-semibold outline-none focus:border-indigo-500 transition-all" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Description (Global Default)</label>
                    <textarea value={(heroData as any).description || ''} onChange={e => setHeroData({...heroData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium resize-none outline-none focus:border-indigo-500 transition-all" rows={3} />
                  </div>

                  {/* Slider Height Configuration */}
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Slider Height Configuration</p>
                      <button 
                        type="button" 
                        onClick={() => setHeroData({...heroData, sliderHeightMobile: 50, sliderHeightDesktop: 100})} 
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-[8px] font-bold uppercase transition-all shadow-sm shrink-0"
                      >
                        Reset heights
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>Mobile Height</span>
                          <span className="text-indigo-600 font-semibold">{(heroData as any).sliderHeightMobile || 50}vh</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="90" 
                          step="1"
                          value={(heroData as any).sliderHeightMobile || 50} 
                          onChange={(e) => setHeroData({...heroData, sliderHeightMobile: parseInt(e.target.value)})}
                          className="w-full accent-indigo-600 cursor-ew-resize" 
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>Desktop Height</span>
                          <span className="text-indigo-600 font-semibold">{(heroData as any).sliderHeightDesktop || 100}vh</span>
                        </div>
                        <input 
                          type="range" 
                          min="50" 
                          max="100" 
                          step="1"
                          value={(heroData as any).sliderHeightDesktop || 100} 
                          onChange={(e) => setHeroData({...heroData, sliderHeightDesktop: parseInt(e.target.value)})}
                          className="w-full accent-indigo-600 cursor-ew-resize" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-4 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Configure Slide Details ({heroData.slides.length} Slides)</p>
                    
                    {/* Slide Selector Tabs */}
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                      {heroData.slides.map((_, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveSlideIdx(idx)}
                            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all border ${
                              activeSlideIdx === idx
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            Slide #{idx + 1}
                          </button>
                          {heroData.slides.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSlides = heroData.slides.filter((_, i) => i !== idx);
                                const newActiveIdx = Math.max(0, Math.min(activeSlideIdx, newSlides.length - 1));
                                setHeroData({ ...heroData, slides: newSlides });
                                setActiveSlideIdx(newActiveIdx);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-550 hover:text-rose-600 transition-all active:scale-95"
                              title="Delete Slide"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {/* Add Slide Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newSlide: HeroSlide = {
                            imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
                            title: `New Specialized Solution`,
                            subtitle: `Tailored for Scale`,
                            description: `Delivering pixel-perfect components and clean, robust cloud services.`,
                            primaryBtnText: 'View My Work',
                            primaryBtnLink: 'projects',
                            primaryBtnColor: '#6366f1',
                            secondaryBtnText: 'Get in Touch',
                            secondaryBtnLink: 'contact',
                            secondaryBtnColor: 'transparent',
                            titleColor: '#ffffff',
                            subtitleColor: '#818cf8',
                            descriptionColor: '#e2e8f0',
                            mobileImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1920',
                            titleSizeMobile: 2.0,
                            titleSizeDesktop: 4.5,
                            subtitleSizeMobile: 1.125,
                            subtitleSizeDesktop: 1.5,
                            descSizeMobile: 0.875,
                            descSizeDesktop: 1.125,
                          };
                          const newSlides = [...heroData.slides, newSlide];
                          setHeroData({ ...heroData, slides: newSlides });
                          setActiveSlideIdx(newSlides.length - 1);
                        }}
                        className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold text-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Plus size={12} /> Add Slide
                      </button>
                    </div>

                    {/* Editor for Active Slide */}
                    {heroData.slides && heroData.slides[activeSlideIdx] && (
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs font-semibold text-indigo-600">Editing Slide #{activeSlideIdx + 1} Settings</span>
                          {heroData.slides[activeSlideIdx].imageUrl && (
                            <img src={heroData.slides[activeSlideIdx].imageUrl} alt={`Slide preview ${activeSlideIdx}`} className="w-16 h-10 object-cover rounded-md border border-slate-200" />
                          )}
                        </div>

                        {/* Image URL & Upload */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Desktop Background Image</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Desktop Image URL" 
                                value={heroData.slides[activeSlideIdx].imageUrl} 
                                onChange={(e) => {
                                  const newSlides = [...heroData.slides];
                                  newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], imageUrl: e.target.value };
                                  setHeroData({ ...heroData, slides: newSlides });
                                }} 
                                className="flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-slate-900 text-[10px] font-medium outline-none focus:border-indigo-500 transition-all" 
                              />
                              <div className="relative flex items-center">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    if (!e.target.files || e.target.files.length === 0) return;
                                    setLoading(true);
                                    try {
                                      const res = await uploadToCloudinary(e.target.files[0]);
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], imageUrl: res.url };
                                      setHeroData(prev => ({ ...prev, slides: newSlides }));
                                      alert(`Slide #${activeSlideIdx + 1} Desktop background image uploaded to Cloudinary!`);
                                    } catch (err: any) {
                                      alert(`Upload failed: ${err.message || err}`);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }} 
                                  className="hidden" 
                                  id={`hero-slide-upload-desktop-${activeSlideIdx}`} 
                                />
                                <label htmlFor={`hero-slide-upload-desktop-${activeSlideIdx}`} className="cursor-pointer bg-slate-900 text-white px-3 py-2.5 rounded-lg font-bold text-[10px] hover:bg-slate-800 transition-all inline-block select-none whitespace-nowrap">
                                  Upload
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Mobile Background Image</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Mobile Image URL (Fallback to Desktop)" 
                                value={heroData.slides[activeSlideIdx].mobileImageUrl || ''} 
                                onChange={(e) => {
                                  const newSlides = [...heroData.slides];
                                  newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], mobileImageUrl: e.target.value };
                                  setHeroData({ ...heroData, slides: newSlides });
                                }} 
                                className="flex-1 bg-white border border-slate-200 p-2.5 rounded-lg text-slate-900 text-[10px] font-medium outline-none focus:border-indigo-500 transition-all" 
                              />
                              <div className="relative flex items-center">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    if (!e.target.files || e.target.files.length === 0) return;
                                    setLoading(true);
                                    try {
                                      const res = await uploadToCloudinary(e.target.files[0]);
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], mobileImageUrl: res.url };
                                      setHeroData(prev => ({ ...prev, slides: newSlides }));
                                      alert(`Slide #${activeSlideIdx + 1} Mobile background image uploaded to Cloudinary!`);
                                    } catch (err: any) {
                                      alert(`Upload failed: ${err.message || err}`);
                                    } finally {
                                      setLoading(false);
                                    }
                                  }} 
                                  className="hidden" 
                                  id={`hero-slide-upload-mobile-${activeSlideIdx}`} 
                                />
                                <label htmlFor={`hero-slide-upload-mobile-${activeSlideIdx}`} className="cursor-pointer bg-slate-900 text-white px-3 py-2.5 rounded-lg font-bold text-[10px] hover:bg-slate-800 transition-all inline-block select-none whitespace-nowrap">
                                  Upload
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title, Subtitle, Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Slide Title</label>
                            <input 
                              type="text" 
                              placeholder="Slide Title"
                              value={heroData.slides[activeSlideIdx].title} 
                              onChange={(e) => {
                                const newSlides = [...heroData.slides];
                                newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], title: e.target.value };
                                setHeroData({ ...heroData, slides: newSlides });
                              }}
                              className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all text-[10px]" 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Slide Subtitle</label>
                            <input 
                              type="text" 
                              placeholder="Slide Subtitle"
                              value={heroData.slides[activeSlideIdx].subtitle} 
                              onChange={(e) => {
                                const newSlides = [...heroData.slides];
                                newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], subtitle: e.target.value };
                                setHeroData({ ...heroData, slides: newSlides });
                              }}
                              className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-slate-900 font-semibold outline-none focus:border-indigo-500 transition-all text-[10px]" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Slide Description</label>
                          <textarea 
                            placeholder="Slide Description"
                            value={heroData.slides[activeSlideIdx].description} 
                            onChange={(e) => {
                              const newSlides = [...heroData.slides];
                              newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], description: e.target.value };
                              setHeroData({ ...heroData, slides: newSlides });
                            }}
                            className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-slate-900 font-medium resize-none outline-none focus:border-indigo-500 transition-all text-[10px]" 
                            rows={2}
                          />
                        </div>

                        {/* Slide Text Color Customizers */}
                        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Text Color Configuration</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Title Color (HEX)</label>
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="color" 
                                  value={heroData.slides[activeSlideIdx].titleColor || '#ffffff'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], titleColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent" 
                                />
                                <input 
                                  type="text" 
                                  value={heroData.slides[activeSlideIdx].titleColor || '#ffffff'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], titleColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  placeholder="#ffffff"
                                  className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Subtitle Color (HEX)</label>
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="color" 
                                  value={heroData.slides[activeSlideIdx].subtitleColor || '#818cf8'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], subtitleColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent" 
                                />
                                <input 
                                  type="text" 
                                  value={heroData.slides[activeSlideIdx].subtitleColor || '#818cf8'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], subtitleColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  placeholder="#818cf8"
                                  className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Description Color (HEX)</label>
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="color" 
                                  value={heroData.slides[activeSlideIdx].descriptionColor || '#e2e8f0'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], descriptionColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent" 
                                />
                                <input 
                                  type="text" 
                                  value={heroData.slides[activeSlideIdx].descriptionColor || '#e2e8f0'} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], descriptionColor: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  placeholder="#e2e8f0"
                                  className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Slide Text Sizing Customizers */}
                        <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Text Sizing Configuration (rem)</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const newSlides = [...heroData.slides];
                                newSlides[activeSlideIdx] = { 
                                  ...newSlides[activeSlideIdx], 
                                  titleSizeMobile: 2.0, 
                                  titleSizeDesktop: 4.5, 
                                  subtitleSizeMobile: 1.125, 
                                  subtitleSizeDesktop: 1.5, 
                                  descSizeMobile: 0.875, 
                                  descSizeDesktop: 1.125 
                                };
                                setHeroData({ ...heroData, slides: newSlides });
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-[8px] font-bold uppercase transition-all shadow-sm shrink-0"
                            >
                              Reset text sizes
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Title Size */}
                            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Title Font Size</span>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Mobile</span>
                                  <span>{heroData.slides[activeSlideIdx].titleSizeMobile || 2.0} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="1.0" 
                                  max="3.5" 
                                  step="0.1"
                                  value={heroData.slides[activeSlideIdx].titleSizeMobile || 2.0} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], titleSizeMobile: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Desktop</span>
                                  <span>{heroData.slides[activeSlideIdx].titleSizeDesktop || 4.5} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="2.0" 
                                  max="6.5" 
                                  step="0.1"
                                  value={heroData.slides[activeSlideIdx].titleSizeDesktop || 4.5} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], titleSizeDesktop: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                            </div>

                            {/* Subtitle Size */}
                            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subtitle Font Size</span>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Mobile</span>
                                  <span>{heroData.slides[activeSlideIdx].subtitleSizeMobile || 1.125} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0.8" 
                                  max="2.0" 
                                  step="0.05"
                                  value={heroData.slides[activeSlideIdx].subtitleSizeMobile || 1.125} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], subtitleSizeMobile: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Desktop</span>
                                  <span>{heroData.slides[activeSlideIdx].subtitleSizeDesktop || 1.5} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="1.0" 
                                  max="3.5" 
                                  step="0.1"
                                  value={heroData.slides[activeSlideIdx].subtitleSizeDesktop || 1.5} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], subtitleSizeDesktop: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                            </div>

                            {/* Description Size */}
                            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Description Font Size</span>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Mobile</span>
                                  <span>{heroData.slides[activeSlideIdx].descSizeMobile || 0.875} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0.7" 
                                  max="1.8" 
                                  step="0.05"
                                  value={heroData.slides[activeSlideIdx].descSizeMobile || 0.875} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], descSizeMobile: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-semibold text-slate-600">
                                  <span>Desktop</span>
                                  <span>{heroData.slides[activeSlideIdx].descSizeDesktop || 1.125} rem</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0.9" 
                                  max="2.5" 
                                  step="0.05"
                                  value={heroData.slides[activeSlideIdx].descSizeDesktop || 1.125} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], descSizeDesktop: parseFloat(e.target.value) };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full accent-indigo-600 cursor-ew-resize" 
                                />
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Button Customizers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                          {/* Primary Button */}
                          <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Primary Button</span>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Text</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. View My Work"
                                  value={heroData.slides[activeSlideIdx].primaryBtnText} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], primaryBtnText: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Link / Target Route</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. projects, contact, or https://example.com"
                                  value={heroData.slides[activeSlideIdx].primaryBtnLink} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], primaryBtnLink: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Color (HEX)</label>
                                <div className="flex gap-2 items-center">
                                  <input 
                                    type="color" 
                                    value={heroData.slides[activeSlideIdx].primaryBtnColor || '#6366f1'} 
                                    onChange={(e) => {
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], primaryBtnColor: e.target.value };
                                      setHeroData({ ...heroData, slides: newSlides });
                                    }}
                                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent" 
                                  />
                                  <input 
                                    type="text" 
                                    value={heroData.slides[activeSlideIdx].primaryBtnColor || '#6366f1'} 
                                    onChange={(e) => {
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], primaryBtnColor: e.target.value };
                                      setHeroData({ ...heroData, slides: newSlides });
                                    }}
                                    placeholder="#6366f1"
                                    className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Button */}
                          <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Secondary Button</span>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Text</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Get in Touch"
                                  value={heroData.slides[activeSlideIdx].secondaryBtnText} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], secondaryBtnText: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Link / Target Route</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. contact, projects, or https://example.com"
                                  value={heroData.slides[activeSlideIdx].secondaryBtnLink} 
                                  onChange={(e) => {
                                    const newSlides = [...heroData.slides];
                                    newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], secondaryBtnLink: e.target.value };
                                    setHeroData({ ...heroData, slides: newSlides });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Button Color (HEX / transparent)</label>
                                <div className="flex gap-2 items-center">
                                  <input 
                                    type="color" 
                                    value={heroData.slides[activeSlideIdx].secondaryBtnColor === 'transparent' ? '#000000' : (heroData.slides[activeSlideIdx].secondaryBtnColor || '#000000')} 
                                    onChange={(e) => {
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], secondaryBtnColor: e.target.value };
                                      setHeroData({ ...heroData, slides: newSlides });
                                    }}
                                    disabled={heroData.slides[activeSlideIdx].secondaryBtnColor === 'transparent'}
                                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0 bg-transparent disabled:opacity-40" 
                                  />
                                  <input 
                                    type="text" 
                                    value={heroData.slides[activeSlideIdx].secondaryBtnColor || 'transparent'} 
                                    onChange={(e) => {
                                      const newSlides = [...heroData.slides];
                                      newSlides[activeSlideIdx] = { ...newSlides[activeSlideIdx], secondaryBtnColor: e.target.value };
                                      setHeroData({ ...heroData, slides: newSlides });
                                    }}
                                    placeholder="transparent or hex color"
                                    className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-900 text-[10px] outline-none focus:border-indigo-500" 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => saveSettings('hero', heroData)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} /> Save Hero Settings</button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 text-left">
                <h2 className="text-slate-900 font-semibold text-lg">About Page Settings</h2>
                <div className="space-y-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Professional Title</label>
                      <input type="text" value={aboutData.title} onChange={e => setAboutData({...aboutData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Experience Years</label>
                      <input type="text" value={aboutData.experience} onChange={e => setAboutData({...aboutData, experience: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Projects Completed</label>
                      <input type="text" value={(aboutData as any).projectsCompleted || ''} onChange={e => setAboutData({...aboutData, projectsCompleted: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Contact Email</label>
                      <input type="text" value={aboutData.email} onChange={e => setAboutData({...aboutData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Contact Phone</label>
                      <input type="text" value={aboutData.phone} onChange={e => setAboutData({...aboutData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">WhatsApp URL</label>
                      <input type="text" value={(aboutData as any).whatsappUrl || ''} onChange={e => setAboutData({...aboutData, whatsappUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   
                   {/* About Images Gallery Manager */}
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">About Images (Slider)</label>
                      <p className="text-[10px] text-slate-400">Add multiple images for the About section slider. First image is the default.</p>
                      
                      {/* Existing images grid */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {((aboutData as any).images || []).map((img: string, idx: number) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt={`About ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                            <button
                              onClick={() => {
                                const newImages = [...((aboutData as any).images || [])];
                                newImages.splice(idx, 1);
                                setAboutData({...aboutData, images: newImages} as any);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1 rounded">{idx + 1}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add image controls */}
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text" 
                          placeholder="Paste image URL and click Add" 
                          id="about-new-image-url"
                          className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all text-xs" 
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('about-new-image-url') as HTMLInputElement;
                            const url = input?.value?.trim();
                            if (!url) { alert('Enter an image URL first'); return; }
                            const currentImages = (aboutData as any).images || [];
                            setAboutData({...aboutData, images: [...currentImages, url]} as any);
                            if (input) input.value = '';
                          }}
                          className="bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all whitespace-nowrap"
                        >
                          + Add
                        </button>
                        <div className="relative flex items-center">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              if (!e.target.files || e.target.files.length === 0) return;
                              setLoading(true);
                              try {
                                const res = await uploadToCloudinary(e.target.files[0]);
                                const currentImages = (aboutData as any).images || [];
                                setAboutData(prev => ({ ...prev, images: [...currentImages, res.url] } as any));
                                alert("Image uploaded and added!");
                              } catch (err: any) {
                                alert(`Upload failed: ${err.message || err}`);
                              } finally {
                                setLoading(false);
                                e.target.value = '';
                              }
                            }} 
                            className="hidden" 
                            id="about-gallery-upload" 
                          />
                          <label htmlFor="about-gallery-upload" className="cursor-pointer bg-slate-900 text-white px-4 py-3.5 rounded-lg font-bold text-xs hover:bg-slate-800 transition-all inline-block select-none whitespace-nowrap">
                            Upload
                          </label>
                        </div>
                      </div>

                      {/* Legacy single image URL (fallback) */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fallback Image URL (used if no gallery images)</label>
                        <input 
                          type="text" 
                          value={(aboutData as any).imageUrl || ''} 
                          onChange={e => setAboutData({...aboutData, imageUrl: e.target.value})} 
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-900 font-medium outline-none focus:border-indigo-500 transition-all text-xs mt-1" 
                        />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Personal Biography</label>
                      <textarea rows={4} value={aboutData.bio} onChange={e => setAboutData({...aboutData, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-medium resize-none outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <button onClick={() => saveSettings('about', aboutData)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline mr-2" /> Save About Settings</button>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Plan Name</label>
                           <input type="text" value={pricingForm.title} onChange={e => setPricingForm({...pricingForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Price Range</label>
                           <input type="text" value={pricingForm.price} onChange={e => setPricingForm({...pricingForm, price: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Key Features (CSV)</label>
                           <input type="text" value={pricingForm.features} onChange={e => setPricingForm({...pricingForm, features: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <button onClick={() => saveItem('pricing', pricingForm, setPricingForm, { id: '', title: '', price: '', description: '', features: '', isPopular: false })} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} /> Save Pricing Plan</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">Pricing Plans</h3>
                    <button 
                        onClick={() => { setPricingForm({ id: '', title: '', price: '', description: '', features: '', isPopular: false }); setFormModalTitle('Add Pricing Plan'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add Plan
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     {pricing.length > 0 ? pricing.map(p => (
                        <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group hover:bg-slate-100 transition-colors text-left flex flex-col justify-between min-h-[140px]">
                           <div>
                             <h4 className="font-bold text-slate-900 text-sm mb-1 truncate">{p.title}</h4>
                             <p className="text-indigo-600 font-semibold text-xs mb-3">Rs. {p.price}</p>
                           </div>
                           <div className="flex gap-2 mt-2">
                              <button onClick={() => startEdit(p, setPricingForm)} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 transition-all">Edit</button>
                              <button onClick={() => deleteItem('pricing', p.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><Trash2 size={14} /></button>
                           </div>
                        </div>
                      )) : <div className="md:col-span-3 py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No Pricing Plans Found</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Question</label>
                           <input type="text" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Answer</label>
                           <textarea rows={3} value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <button onClick={() => saveItem('faq', faqForm, setFaqForm, { id: '', question: '', answer: '' })} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline mr-2" /> Save FAQ Item</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">FAQs</h3>
                    <button 
                        onClick={() => { setFaqForm({ id: '', question: '', answer: '' }); setFormModalTitle('Add FAQ'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add FAQ
                    </button>
                  </div>
                  <div className="space-y-2">
                     {faqs.length > 0 ? faqs.map(f => (
                       <div key={f.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors text-left">
                          <div className="flex-1 pr-10">
                             <h4 className="font-semibold text-slate-900 truncate text-sm">{f.question}</h4>
                             <p className="text-slate-500 text-xs mt-1 line-clamp-1">{f.answer}</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => startEdit(f, setFaqForm)} className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all border border-slate-200"><Edit3 size={14}/></button>
                             <button onClick={() => deleteItem('faq', f.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><Trash2 size={14} /></button>
                          </div>
                       </div>
                     )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No FAQs Found</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="space-y-4 text-left">
                {isFormModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="relative w-full max-w-3xl bg-white rounded-xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar text-left animate-in zoom-in-95 duration-200 border border-slate-200 shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h2 className="text-slate-900 font-bold text-base">{formModalTitle}</h2>
                        <button onClick={closeFormModal} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      
                      <div className="md:col-span-2 flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-xs font-semibold text-slate-400">AI Assistance Available</span>
                        <button onClick={handleDeepLegalGen} disabled={aiLoading} className="bg-slate-100 text-slate-755 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                          {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <><Zap size={14} /> Generate Content</>}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Document Title</label>
                           <input type="text" value={legalForm.title} onChange={e => setLegalForm({...legalForm, title: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-semibold text-slate-700">URL Slug</label>
                           <input type="text" value={legalForm.slug} onChange={e => setLegalForm({...legalForm, slug: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                           <label className="text-xs font-semibold text-slate-700">SEO Title</label>
                           <input type="text" value={legalForm.seoTitle} onChange={e => setLegalForm({...legalForm, seoTitle: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                           <label className="text-xs font-semibold text-slate-700">SEO Description</label>
                           <textarea value={legalForm.seoDescription} onChange={e => setLegalForm({...legalForm, seoDescription: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs" rows={2} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                           <label className="text-xs font-semibold text-slate-700">Content (Markdown)</label>
                           <textarea rows={10} value={legalForm.content} onChange={e => setLegalForm({...legalForm, content: e.target.value})} className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-[11px] font-mono" />
                        </div>
                        <button onClick={() => saveItem('legalPages', legalForm, setLegalForm, { id: '', title: '', slug: '', content: 'This is a placeholder for your legal document content. Use AI to generate comprehensive text after setting the title and the slug. Remember to review and customize all generated legal text.', seoTitle: '', seoDescription: '', createdAt: Date.now() })} className="md:col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"><Save size={14} className="inline mr-2" /> Save Legal Page</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-slate-900 font-semibold text-sm">Legal Documents</h3>
                    <button 
                        onClick={() => { setLegalForm({ id: '', title: '', slug: '', content: 'This is a placeholder for your legal document content. Use AI to generate comprehensive text after setting the title and the slug. Remember to review and customize all generated legal text.', seoTitle: '', seoDescription: '', createdAt: Date.now() }); setFormModalTitle('Add Legal Page'); setIsFormModalOpen(true); }}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={12}/> Add Document
                    </button>
                  </div>
                  <div className="space-y-2">
                     {legalPages.length > 0 ? legalPages.map(lp => (
                       <div key={lp.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors text-left">
                          <div className="flex-1 pr-10">
                             <h4 className="font-semibold text-slate-900 truncate text-sm">{lp.title}</h4>
                             <p className="text-slate-500 text-xs mt-1 font-medium">Slug: /{lp.slug}</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => startEdit(lp, setLegalForm)} className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all border border-slate-200"><Edit3 size={14}/></button>
                             <button onClick={() => deleteItem('legalPages', lp.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-100"><Trash2 size={14} /></button>
                          </div>
                       </div>
                     )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No Legal Documents Found</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'socials' && (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="text-slate-900 font-semibold text-lg">Social Media Links</h2>
                  <div className="flex flex-wrap gap-2">
                    {['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'GitHub'].map(name => (
                      <button key={name} onClick={() => addSocialLink(name as any)} className="bg-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">Add {name}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {socials.length > 0 ? socials.map((social, idx) => (
                    <div key={social.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center hover:bg-slate-100 transition-colors text-left">
                      <div className="w-20 shrink-0 font-semibold text-indigo-600">{social.name}</div>
                      <input 
                        type="text" value={social.url} 
                        onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                        placeholder="https://..." 
                        className="flex-1 bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-900 text-xs font-semibold outline-none focus:border-indigo-500 transition-all"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-semibold text-slate-600">Active</span>
                        <input 
                          type="checkbox" checked={social.enabled} 
                          onChange={e => updateSocialLink(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                      </label>
                      <button onClick={() => setSocials(socials.filter((_, i) => i !== idx))} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )) : <div className="py-10 text-center text-slate-400 font-semibold uppercase tracking-wider text-xs">No Social Links</div>}
                </div>
                <button onClick={saveSocials} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"><Save size={14} className="inline" /> Save Social Links</button>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch text-left">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="text-indigo-600" size={20} />
                      <h2 className="text-slate-900 font-semibold text-base">Gemini API Configuration</h2>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed text-left">
                      Set or update the global system Gemini API Key. Changing this here will immediately apply to all AI playgrounds and chatbots across the site for all users without redeploying or touching environment variables.
                    </p>
                    <div className="space-y-1.5 text-left font-sans mt-4">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Google Gemini API Key</label>
                      <input 
                        type="password" 
                        placeholder="Paste your new Gemini API key here..."
                        value={adminGeminiKey} 
                        onChange={(e) => setAdminGeminiKey(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all text-xs" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={saveGeminiKey} 
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14}/> : <><Save size={14} /> Update Global Gemini Key</>}
                  </button>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="text-indigo-600" size={20} />
                      <h2 className="text-slate-900 font-semibold text-base">Database Setup & Seeding</h2>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed text-left">
                      Choose a database collection to seed it with initial default entries. This will populate Firestore with predefined projects, blogs, testimonials and experiences.
                    </p>
                    <div className="space-y-1.5 text-left font-sans mt-4">
                      <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Select Collection to Seed</label>
                      <select value={seedTarget} onChange={(e) => setSeedTarget(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg font-semibold text-slate-900 text-xs outline-none">
                        <option value="all">SEED ALL COLLECTIONS</option>
                        <option value="blog">SEED BLOG ONLY</option>
                        <option value="pricing">SEED PRICING ONLY</option>
                        <option value="faq">SEED FAQ ONLY</option>
                        <option value="legal">SEED LEGAL ONLY</option>
                        <option value="socials">SEED SOCIALS ONLY</option>
                        <option value="testimonials">SEED TESTIMONIALS ONLY</option>
                        <option value="experience">SEED EXPERIENCE ONLY</option>
                        <option value="services">SEED SERVICES ONLY</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <button onClick={executeSeed} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {loading ? <Loader2 size={16} className="animate-spin"/> : <><Zap size={16} /> Seed Database</>}
                    </button>
                    {seedSuccess && <div className="mt-2 p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Database seeded successfully!</div>}
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 lg:col-span-2">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UploadCloud className="text-indigo-600" size={20} />
                      <h2 className="text-slate-900 font-semibold text-base">Migrate All Site Media to Cloudinary</h2>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed text-left">
                      Scan all Services, Projects, Blogs, Testimonials, Hero Slides, and About Settings. It will automatically download any externally hosted images or video assets and upload them directly to your secure Cloudinary cloud, updating all database links seamlessly.
                    </p>
                  </div>
                  <button 
                    onClick={migrateAllAssetsToCloudinary} 
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14}/> : <><UploadCloud size={14} /> Run Global Asset Migration</>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-4xl space-y-6 mx-auto text-left">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">SEO & Page Metadata Settings</h2>
                  <p className="text-slate-500 text-xs font-normal">Configure HTML titles, descriptions, focus keywords, canonical tags, and OpenGraph social share previews for search engine optimization.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="text-slate-700 font-semibold text-xs tracking-wider uppercase shrink-0">Select Target Page/Tool:</label>
                  <select
                    value={selectedSeoPage}
                    onChange={(e) => setSelectedSeoPage(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 text-xs font-semibold outline-none focus:border-slate-950 transition-colors shadow-sm"
                  >
                    {SEO_PAGES.map((page) => (
                      <option key={page.id} value={page.id}>{page.name}</option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleSaveSeo} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Page Title</label>
                    <input
                      type="text"
                      value={seoForm.title}
                      onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
                      placeholder="e.g. Nepali Date Converter | AD to BS & BS to AD | Bishal Codes"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition-all text-xs font-normal placeholder:text-slate-350"
                    />
                    {DEFAULT_SEO_METADATA[selectedSeoPage]?.title && (
                      <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                        <strong>Default:</strong> {DEFAULT_SEO_METADATA[selectedSeoPage].title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Meta Description</label>
                    <textarea
                      rows={3}
                      value={seoForm.description}
                      onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })}
                      placeholder="Enter a brief, high-impact description summarizing page contents for Google search listings (150-160 characters recommended)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition-all text-xs font-normal placeholder:text-slate-350 resize-none"
                    ></textarea>
                    {DEFAULT_SEO_METADATA[selectedSeoPage]?.description && (
                      <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                        <strong>Default:</strong> {DEFAULT_SEO_METADATA[selectedSeoPage].description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Meta Keywords</label>
                      <input
                        type="text"
                        value={seoForm.keywords}
                        onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                        placeholder="keyword1, keyword2, tag3, bishal codes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition-all text-xs font-normal placeholder:text-slate-350"
                      />
                      {DEFAULT_SEO_METADATA[selectedSeoPage]?.keywords && (
                        <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                          <strong>Default:</strong> {DEFAULT_SEO_METADATA[selectedSeoPage].keywords}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Canonical URL Link</label>
                      <input
                        type="url"
                        value={seoForm.canonical}
                        onChange={(e) => setSeoForm({ ...seoForm, canonical: e.target.value })}
                        placeholder="https://bishalcodes.com/tools/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition-all text-xs font-normal placeholder:text-slate-350"
                      />
                      {DEFAULT_SEO_METADATA[selectedSeoPage]?.canonical && (
                        <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                          <strong>Default:</strong> {DEFAULT_SEO_METADATA[selectedSeoPage].canonical}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">OpenGraph Image Preview Link</label>
                    <input
                      type="url"
                      value={seoForm.ogImage}
                      onChange={(e) => setSeoForm({ ...seoForm, ogImage: e.target.value })}
                      placeholder="https://ik.imagekit.io/bishalc/... or image host URL"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition-all text-xs font-normal placeholder:text-slate-350"
                    />
                    {DEFAULT_SEO_METADATA[selectedSeoPage]?.ogImage && (
                      <p className="text-[10px] text-slate-400 mt-1 italic leading-normal border-b border-slate-100 pb-2">
                        <strong>Default:</strong> {DEFAULT_SEO_METADATA[selectedSeoPage].ogImage}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16} /> Save SEO Metadata</>}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm w-full space-y-6 text-left">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Users & Activity Log</h2>
                  <p className="text-slate-500 text-xs font-normal">View registered dashboard users and their recent profile update logs.</p>
                </div>

                <div className="space-y-6">
                  {/* Users Table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-150">
                          <th className="p-4">User</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">User ID</th>
                          <th className="p-4">Last Active</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dashboardUsers.length > 0 ? (
                          dashboardUsers.map((u) => {
                            const getInitials = (name?: string, email?: string) => {
                              if (name && name.trim()) return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                              if (email) return email[0].toUpperCase();
                              return 'U';
                            };
                            return (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium flex items-center gap-3">
                                  {u.photoURL ? (
                                    <img src={u.photoURL} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="avatar" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] w-8 h-8 shrink-0">
                                      {getInitials(u.displayName, u.email)}
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-900 font-semibold">{u.displayName || 'No Name'}</span>
                                </td>
                                <td className="p-4 text-xs font-medium">{u.email}</td>
                                <td className="p-4 font-mono text-[10px] text-slate-400">{u.id}</td>
                                <td className="p-4 text-slate-400 text-xs">{u.lastActive ? new Date(u.lastActive).toLocaleString() : 'N/A'}</td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => handleSendPasswordReset(u.email)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-md text-[10px] font-semibold transition-colors"
                                  >
                                    <Mail size={10} /> Send Reset Link
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-medium">No registered users found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Activity Logs */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity Log</h3>
                    <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50">
                      {activities.length > 0 ? (
                        activities.map((act) => (
                          <div key={act.id} className="p-4 flex justify-between items-start gap-4 hover:bg-slate-100/50 transition-colors bg-white">
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{act.displayName || act.email || 'System user'}</p>
                              <p className="text-xs text-slate-500 mt-1">{act.details}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{new Date(act.timestamp).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white">No recent activity logged.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {aiLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-100/95 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center font-sans">
           <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
           <p className="text-sm font-semibold text-slate-700 tracking-wide">Generating Content...</p>
        </div>
      )}

      {isProofViewerOpen && currentProofBase64 && (
        <PaymentProofViewer
          base64Image={currentProofBase64}
          onClose={() => setIsProofViewerOpen(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } /* Light theme scrollbar */
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } /* Light theme scrollbar track */
      `}} />
    </div>
  );
};

export default Admin;
