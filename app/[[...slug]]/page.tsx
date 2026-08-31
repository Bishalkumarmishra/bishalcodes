import React from 'react';
import { Metadata } from 'next';
import ClientApp from './ClientApp';
import { allFontsDB } from '../../components/fontData';

export default async function CatchAllPage(props: PageProps) {
  const { slug } = await props.params;
  const slugArr = slug || [];
  const schemas: any[] = [];

  // Generate metadata dynamically to reuse titles, descriptions, and canonical URLs for JSON-LD schemas
  const metadata = await generateMetadata(props).catch(() => ({}) as Metadata);
  const titleStr = typeof metadata.title === 'string' 
    ? metadata.title 
    : (metadata.title && 'absolute' in metadata.title ? (metadata.title.absolute || '') : '');
  const descStr = metadata.description || '';
  const canonUrl = metadata.alternates?.canonical 
    ? (typeof metadata.alternates.canonical === 'string' ? metadata.alternates.canonical : String(metadata.alternates.canonical))
    : '';

  // 1. Tool Pages (slugArr[0] === 'tools' && slugArr[1])
  if (slugArr[0] === 'tools') {
    const subpage = slugArr[1] || '';
    if (subpage) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": titleStr.split('|')[0].trim() || subpage,
        "url": canonUrl || `https://bishalcodes.com/tools/${subpage}`,
        "description": descStr,
        "applicationCategory": subpage === 'currency-calculator' || subpage === 'emi-calculator' ? "FinancialApplication" : "UtilityApplication",
        "operatingSystem": "All"
      });

      // FAQ database for all developer tools
      const toolFaqs: Record<string, Array<{ q: string; a: string }>> = {
        'date-converter': [
          {
            q: "आज कति गते हो? (What is Today's Nepali Date?)",
            a: "Bishal Codes Date Converter displays today's live Bikram Sambat (BS) date along with today's Gregorian (AD) date and live real-time Nepal Standard Time (NPT)."
          },
          {
            q: "How to check Today's Date in Nepal?",
            a: "Visit bishalcodes.com/tools/date-converter to instantly see today's Nepali date (BS), English date (AD), live clock, and convert dates (AD ↔ BS)."
          },
          {
            q: "What is Bikram Sambat (BS) calendar system?",
            a: "Bikram Sambat (BS) is the official calendar system of Nepal. It is a solar calendar based on ancient Hindu calendar systems and is approximately 56 years and 8.5 months ahead of the Gregorian calendar (AD)."
          },
          {
            q: "How to convert English (AD) date to Nepali (BS) date?",
            a: "To convert AD to BS, input the Gregorian year, month, and day into our date converter tool. It will dynamically calculate the corresponding Bikram Sambat date based on the solar calendar transit rules."
          },
          {
            q: "Why do Nepali month lengths vary between 29 to 32 days?",
            a: "In the Bikram Sambat calendar, the length of each month is determined by the actual time the sun stays in each zodiac sign (solar transit). Therefore, the number of days in each month is not fixed and varies from 29 to 32 days year by year."
          }
        ],
        'file-transfer': [
          {
            q: "How does P2P WebRTC file sharing work?",
            a: "WebRTC peer-to-peer (P2P) file sharing establishes a direct data channel between the sender's and recipient's browsers. The files are split into small chunks and streamed directly, without saving any copy to intermediate cloud servers."
          },
          {
            q: "What is the maximum file size limit for transfer?",
            a: "Our P2P file transfer tool allows you to send large files and folders up to 100 GB. Since it runs direct client-side stream compression, there is no server upload wait time."
          },
          {
            q: "Are my files secure during peer-to-peer sharing?",
            a: "Yes, WebRTC connections are fully encrypted end-to-end using DTLS/SRTP protocols. Since files bypass intermediate servers, nobody else can access your shared data."
          }
        ],
        'currency-converter': [
          {
            q: "What are mid-market exchange rates?",
            a: "The mid-market rate is the real exchange rate at which banks buy and sell currency from each other. It is the midpoint between the buy and sell prices on the global currency markets."
          },
          {
            q: "How often are the exchange rates updated?",
            a: "Our system pulls fresh live rate updates every single hour to ensure accuracy for top pairs like USD/NPR, USD/INR, and USD/EUR."
          },
          {
            q: "Why do bank rates differ from online rates?",
            a: "Retail banks and money transfer services add a margin or commission to the mid-market rate to cover operational costs and gain profit, meaning their actual rate is typically 1-3% less favorable than the live interbank rate."
          }
        ],
        'ai-summarizer': [
          {
            q: "How does the AI Document Summarizer work?",
            a: "The tool parses the text contents of uploaded PDF documents in your browser and securely calls the Google Gemini 1.5 Flash API to generate structural highlights, executive summaries, and bulleted takeaways."
          },
          {
            q: "Is my uploaded PDF stored on your servers?",
            a: "No, your PDF files are parsed entirely in the client-side browser memory. The text content is only sent to the AI api to generate the summary and is never saved or persisted on our servers."
          },
          {
            q: "Are there any file type or size limits?",
            a: "The tool supports PDF files and scanned images up to 50MB. Text extractions are processed locally using PDF.js and Tesseract.js."
          }
        ],
        'translator': [
          {
            q: "How does the online language translator work?",
            a: "The translator uses API integrations powered by Google Translate to translate text instantly between English, Nepali, and 100+ other major global languages."
          },
          {
            q: "Does it support text-to-speech voice audio?",
            a: "Yes, you can click the audio icon to listen to the spoken pronunciation of the translated text."
          }
        ],
        'pdf-to-image': [
          {
            q: "Can I convert PDF pages to JPG for free?",
            a: "Yes, you can select any PDF file and convert its pages to high-quality JPG or PNG images entirely inside your browser for free."
          }
        ],
        'pdf-to-word': [
          {
            q: "Can I convert PDF pages to editable Word documents?",
            a: "Yes, you can upload any PDF file and convert it into a fully editable Microsoft Word DOCX document. It supports layout reconstruction and offline OCR for scanned documents."
          }
        ],
        'word-to-pdf': [
          {
            q: "Can I convert Word documents to PDF?",
            a: "Yes, you can upload any Microsoft Word document (.docx, .doc) and convert it into a high-fidelity PDF document with exact margins, layout preservation, and font embedding."
          }
        ],
        'excel-to-pdf': [
          {
            q: "Can I convert Excel spreadsheets to PDF?",
            a: "Yes, you can upload any Microsoft Excel spreadsheet (.xlsx, .xls) and convert it into a high-fidelity PDF document with exact sheet layout preservation, gridlines, and charts."
          }
        ],
        'pdf-to-excel': [
          {
            q: "Can I convert PDF pages to Excel spreadsheet tables?",
            a: "Yes, you can upload any PDF file and convert its pages into a fully formatted Microsoft Excel spreadsheet (.xlsx) with gridlines and cell alignment auto-fitted."
          }
        ],
        'split-pdf': [
          {
            q: "Can I split a PDF into multiple files?",
            a: "Yes! Upload any PDF and split it by custom page ranges, fixed page intervals (every N pages), or extract every single page as its own individual PDF file."
          }
        ],
        'edit-pdf': [
          {
            q: "Can I edit text and add annotations to a PDF?",
            a: "Yes! Upload any PDF and add text overlays, freehand drawings, shapes, images, and highlights natively. Save and download your edited PDF instantly."
          }
        ],
        'image-compressor': [
          {
            q: "Is the image compression private and secure?",
            a: "Yes. The compression runs entirely on your local device using client-side canvas APIs. None of your photos are ever uploaded to any servers."
          }
        ],
        'emi-calculator': [
          {
            q: "How is the monthly EMI calculated?",
            a: "The EMI is calculated using standard financial amortization formulas based on your principal loan amount, annual interest rate, and tenure."
          }
        ],
        'qr-studio': [
          {
            q: "Can I create custom QR codes with logos?",
            a: "Yes, you can customize the colors, dots, corner styles, and upload a central logo icon to generate high-resolution SVG or PNG QR codes."
          }
        ],
        'json-formatter': [
          {
            q: "How does the JSON Formatter validate syntax?",
            a: "It parses the input JSON string using local parser rules, highlights any syntax errors with exact line numbers, and formats it with custom tab indentations."
          }
        ],
        'diff-checker': [
          {
            q: "Can I compare two code files offline?",
            a: "Yes. The diff checker computes line-by-line and character-by-character differences locally using the Myers diff algorithm."
          }
        ],
        'code-runner': [
          {
            q: "What programming languages can I compile online?",
            a: "You can write and run Javascript, HTML/CSS, Python, and other scripts inside our interactive sandbox IDE runner."
          }
        ],
        'screenshot-studio': [
          {
            q: "How does the website screenshot utility capture pages?",
            a: "It sends a request to our high-performance headless browser rendering engine to capture the full page or viewport screenshot of any public website url."
          }
        ],
        'secure-vault': [
          {
            q: "Is the browser vault safe to store secrets?",
            a: "Yes. All data stored in the secure vault is encrypted client-side using military-grade AES-256-GCM encryption with a password key that never leaves your device."
          }
        ],
        'ocr-converter': [
          {
            q: "How does online image OCR text extraction work?",
            a: "It uses local Tesseract.js engines and advanced layout-recognition AI to read and extract text from images, scans, and PDFs in real-time."
          }
        ],
        'bg-remover': [
          {
            q: "How can I remove image backgrounds online?",
            a: "Our tool utilizes local machine learning segmentation models in the browser to detect the subject and make the background fully transparent without uploading your file."
          }
        ],
        'scan-pdf': [
          {
            q: "Can I scan paper documents to PDF using my webcam?",
            a: "Yes, the tool accesses your device camera, auto-detects document edges, performs perspective correction, and saves it as a multi-page PDF."
          }
        ],
        'font-downloader': [
          {
            q: "Where can I download Nepali fonts like Preeti or Kantipur?",
            a: "You can browse, preview, and download over 1100+ standard Nepali and English fonts in TTF format for free from our font downloader tool."
          }
        ],
        'typing-practice': [
          {
            q: "How is the typing speed (WPM) calculated?",
            a: "Words Per Minute (WPM) is computed using the standard formula: (total correct characters typed / 5) / (time elapsed in minutes). This ensures standardized speed tracking across varying word lengths."
          },
          {
            q: "Does this online typing tutor save or log my keystrokes?",
            a: "No. The typing practice application executes 100% locally in your web browser. None of your inputs, text pastes, or keystrokes are transmitted or logged server-side."
          }
        ]
      };

      const faqs = toolFaqs[subpage] || [
        {
          q: "Is this developer tool free to use?",
          a: "Yes! All developer tools and utilities on Bishal Codes are 100% free, fast, and require no account registration or downloads."
        },
        {
          q: "Does this utility tool upload my files or data to a server?",
          a: "No. Most tools on our site run completely client-side in your browser's sandboxed environment, ensuring complete security and data privacy."
        }
      ];

      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      });
    }
  }

  // 2. Blog Single Post Page (slugArr[0] === 'blog' && slugArr[1])
  if (slugArr[0] === 'blog' && slugArr[1]) {
    const blogId = slugArr[1];
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/blog/${blogId}`, {
        next: { revalidate: 300 }
      });
      if (res.ok) {
        const data = await res.json();
        const title = data.fields?.title?.stringValue || "Bishal Codes Blog";
        const excerpt = data.fields?.excerpt?.stringValue || "Read this article on Bishal Codes.";
        const publishedTime = data.createTime || new Date().toISOString();
        const rawImageUrl = data.fields?.imageUrl?.stringValue || "";
        const imageUrl = getSocialPreviewImage(rawImageUrl);

        schemas.push({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": title,
          "description": excerpt,
          "image": imageUrl,
          "datePublished": publishedTime,
          "author": {
            "@type": "Person",
            "name": "Bishal Mishra",
            "url": "https://bishalcodes.com/"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Bishal Codes",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.bishalcodes.com/bishal.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonUrl || `https://bishalcodes.com/blog/${blogId}`
          }
        });
      }
    } catch (err) {
      console.warn("Schema fetch failed for blog post:", err);
    }
  }

  // 3. Blog Listing / Index Page (slugArr[0] === 'blog' && !slugArr[1])
  if (slugArr[0] === 'blog' && !slugArr[1]) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Bishal Codes Blog",
      "url": canonUrl || "https://bishalcodes.com/blog",
      "description": descStr || "Read our latest developer tips, programming guides, and thoughts on React, JavaScript, Next.js, and modern full-stack web engineering."
    });
  }

  // 4. Other Standard Pages (About, Contact, Projects, Experience, Skills, AI Studio, Docs)
  if (slugArr[0] && slugArr[0] !== 'tools' && slugArr[0] !== 'blog') {
    const firstSlug = slugArr[0];
    
    if (firstSlug === 'about') {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About Bishal Mishra",
        "url": canonUrl || "https://bishalcodes.com/about",
        "description": descStr
      });
    } else if (firstSlug === 'contact') {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact Bishal Mishra",
        "url": canonUrl || "https://bishalcodes.com/contact",
        "description": descStr
      });
    } else if (firstSlug === 'projects') {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Projects Portfolio",
        "url": canonUrl || "https://bishalcodes.com/projects",
        "description": descStr
      });
    } else {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": titleStr.split('|')[0].trim() || firstSlug,
        "url": canonUrl || `https://bishalcodes.com/${firstSlug}`,
        "description": descStr
      });
    }
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ClientApp initialSlug={slugArr} />
    </>
  );
}

// Next.js 15: params is a Promise, so we must await it!
interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

// Helper to convert SVG images to raster format (PNG) for social media crawlers
function getSocialPreviewImage(url: string): string {
  if (!url) return "https://www.bishalcodes.com/bishal.png";

  // Strip query parameters to check extension
  const baseUrl = url.split('?')[0];
  if (baseUrl.toLowerCase().endsWith('.svg')) {
    // Cloudinary supports automatic format conversion by changing the file extension in the URL
    if (url.includes('cloudinary.com')) {
      return url.replace(/\.svg(\?|$)/i, '.png$1');
    }
    // Fallback if SVG cannot be dynamically converted by the hosting provider
    return "https://www.bishalcodes.com/bishal.png";
  }

  return url;
}

const DEFAULT_OG_IMAGES = [
  {
    url: "https://www.bishalcodes.com/bishal.png",
    width: 1200,
    height: 630,
    alt: "Bishal Codes | Portfolio and Developer Utilities",
  }
];

const DEFAULT_TWITTER_CONFIG = {
  card: "summary_large_image" as const,
  site: "@bishalmishra",
  creator: "@bishalmishra",
  title: "Bishal Mishra | Full-Stack Web Developer & Designer Portfolio",
  description: "Hi, I'm Bishal Mishra. I build fast, clean, and interactive websites and web applications. Explore my portfolio projects, read my blog, or get in touch for custom web development.",
  images: ["https://www.bishalcodes.com/bishal.png"]
};

interface FirestoreSeoDoc {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

async function getCustomSeoSettings(pageId: string): Promise<FirestoreSeoDoc | null> {
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/seo_settings/${pageId}`, {
      next: { revalidate: 60 } // Cache results for 1 minute
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.fields?.title?.stringValue || undefined,
        description: data.fields?.description?.stringValue || undefined,
        keywords: data.fields?.keywords?.stringValue || undefined,
        ogImage: data.fields?.ogImage?.stringValue || undefined,
        canonical: data.fields?.canonical?.stringValue || undefined
      };
    }
  } catch (err) {
    console.error(`Failed to fetch custom SEO settings for ${pageId}:`, err);
  }
  return null;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const slugArr = slug || [];
  const pageId = slugArr.length > 0 ? slugArr.join('-') : 'home';

  const getOriginalMetadata = async (): Promise<Metadata> => {
    // If it's the services page
    if (slugArr[0] === 'tools') {
      const subpage = slugArr[1] || '';

      if (subpage === 'date-converter') {
        return {
          title: "Today's Date & Nepali Date Today | आज कति गते? | AD ↔ BS Converter | Bishal Codes",
          description: "Check Today's Date in English (AD) and Nepali Bikram Sambat (BS) - आज कति गते?. Instant AD to BS converter, BS to AD converter, live Kathmandu clock, and full 2083 calendar.",
          keywords: "todays date, today date in nepal, nepali date today, आज कति गते, nepali date converter, AD to BS converter, BS to AD converter, Bikram Sambat calendar 2083, todays nepali date, bishal codes date converter",
          alternates: {
            canonical: "https://bishalcodes.com/tools/date-converter",
          },
          openGraph: {
            title: "Today's Date & Nepali Date Today | आज कति गते? | Bishal Codes",
            description: "Check today's live date in English (AD) and Bikram Sambat (BS). Fast AD to BS date converter with full 2083 Nepali calendar.",
            url: "https://bishalcodes.com/tools/date-converter",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: "https://bishalcodes.com/seo-images/date-converter.png",
                width: 1200,
                height: 630,
                alt: "Today's Date & Nepali Date Today | Bishal Codes",
              }
            ],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Today's Date & Nepali Date Today | आज कति गते? | Bishal Codes",
            description: "Check today's live date in English (AD) and Bikram Sambat (BS). Fast AD ↔ BS converter.",
            images: ["https://bishalcodes.com/seo-images/date-converter.png"]
          }
        };
      }

      if (subpage === 'currency-converter') {
        return {
          title: "USD Currency Converter | Live Exchange Rates to NPR, INR, PKR & More | Bishal Codes",
          description: "Convert USD to Nepali Rupee (NPR), Indian Rupee (INR), Pakistani Rupee (PKR), Sri Lankan Rupee, and 20+ other currencies using live exchange rates updated every hour.",
          keywords: "USD to NPR, USD to INR, USD to PKR, dollar to rupee, live exchange rate, currency converter, USD to Nepali rupees, dollar to Indian rupees",
          alternates: {
            canonical: "https://bishalcodes.com/tools/currency-converter",
          },
          openGraph: {
            title: "USD Currency Converter | Live Rates to NPR, INR, PKR & More | Bishal Codes",
            description: "Real live exchange rates — convert USD to Nepali, Indian, Pakistani rupees and 20+ currencies. Updated every hour.",
            url: "https://bishalcodes.com/tools/currency-converter",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: "https://bishalcodes.com/seo-images/currency-converter.png",
                width: 1200,
                height: 630,
                alt: "USD Currency Converter | Bishal Codes",
              }
            ],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "USD Currency Converter | Live Rates to NPR, INR, PKR & More | Bishal Codes",
            description: "Convert USD to Nepali, Indian, Pakistani rupees and more with live exchange rates.",
            images: ["https://bishalcodes.com/seo-images/currency-converter.png"]
          }
        };
      }

      if (subpage === 'translator') {
        return {
          title: "Language Translator | English to Nepali & All Languages | Bishal Codes",
          description: "Translate text in real-time between English, Nepali, and all major global languages. High-accuracy translation powered by Google Translate, featuring text-to-speech audio and clipboard export.",
          keywords: "English to Nepali translator, Nepali to English translation, language translator, voice translator, Google Translate, Bishal Codes, translate all languages",
          alternates: {
            canonical: "https://bishalcodes.com/tools/translator",
          },
          openGraph: {
            title: "Language Translator | English to Nepali & All Languages | Bishal Codes",
            description: "Real-time translation for English, Nepali, Spanish, Hindi, and more. Features text-to-speech audio and one-click copy.",
            url: "https://bishalcodes.com/tools/translator",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: "https://bishalcodes.com/seo-images/translator.png",
                width: 1200,
                height: 630,
                alt: "Language Translator | Bishal Codes",
              }
            ],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Language Translator | English to Nepali & All Languages | Bishal Codes",
            description: "Translate text in real-time between English, Nepali, and all major global languages.",
            images: ["https://bishalcodes.com/seo-images/translator.png"]
          }
        };
      }

      if (subpage === 'ai-summarizer') {
        return {
          title: "AI Document Summarizer | Free PDF Summarizer Online | Bishal Codes",
          description: "Instantly summarize large PDF documents, books, and research papers using advanced AI. Fast, accurate, and completely free online AI document summarizer by Bishal Codes.",
          keywords: "AI PDF summarizer, document summarizer, AI text summarizer, summarize PDF online, research paper summarizer, Bishal Codes, free AI tools, gemini AI pdf",
          alternates: {
            canonical: "https://bishalcodes.com/tools/ai-summarizer",
          },
          openGraph: {
            title: "AI Document Summarizer | Free PDF Summarizer Online | Bishal Codes",
            description: "Instantly summarize large PDF documents, books, and research papers using advanced AI.",
            url: "https://bishalcodes.com/tools/ai-summarizer",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: "https://bishalcodes.com/seo-images/ai-summarizer.png",
                width: 1200,
                height: 630,
                alt: "AI Document Summarizer | Bishal Codes",
              }
            ],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "AI Document Summarizer | Free PDF Summarizer Online | Bishal Codes",
            description: "Instantly summarize large PDF documents using advanced AI.",
            images: ["https://bishalcodes.com/seo-images/ai-summarizer.png"]
          }
        };
      }

      if (subpage === 'pdf-to-image') {
        return {
          title: "PDF to Image Converter | Convert PDF to JPG Online Free | Bishal Codes",
          description: "Free online PDF to Image converter. Easily extract pages from any PDF document and save them as high-quality JPG images instantly without installing any software.",
          keywords: "PDF to Image, PDF to JPG, convert PDF to picture, online PDF tools, extract PDF pages to image, free PDF converter, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/pdf-to-image",
          },
          openGraph: {
            title: "PDF to Image Converter | Convert PDF to JPG Online Free",
            description: "Easily extract pages from any PDF document and save them as high-quality JPG images instantly.",
            url: "https://bishalcodes.com/tools/pdf-to-image",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/pdf-to-image.png", width: 1200, height: 630, alt: "PDF to Image Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "PDF to Image Converter | Convert PDF to JPG Online Free",
            description: "Easily extract pages from any PDF document and save them as high-quality JPG images instantly.",
            images: ["https://bishalcodes.com/seo-images/pdf-to-image.png"]
          }
        };
      }

      if (subpage === 'pdf-to-word') {
        return {
          title: "PDF to Word Converter | Convert PDF to Word Online Free | Bishal Codes",
          description: "Free online PDF to Word converter. Convert vector PDF files and scanned paper sheets into fully editable Microsoft Word DOCX files with offline OCR support.",
          keywords: "PDF to Word, PDF to DOCX, convert PDF to editable document, online PDF tools, OCR converter, free PDF converter, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/pdf-to-word",
          },
          openGraph: {
            title: "PDF to Word Converter | Convert PDF to Word Online Free",
            description: "Convert vector PDF files and scanned paper sheets into fully editable Microsoft Word DOCX files with offline OCR support.",
            url: "https://bishalcodes.com/tools/pdf-to-word",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/pdf-to-word.png", width: 1200, height: 630, alt: "PDF to Word Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "PDF to Word Converter | Convert PDF to Word Online Free",
            description: "Convert vector PDF files and scanned paper sheets into fully editable Microsoft Word DOCX files with offline OCR support.",
            images: ["https://bishalcodes.com/seo-images/pdf-to-word.png"]
          }
        };
      }

      if (subpage === 'word-to-pdf') {
        return {
          title: "Word to PDF Converter | Convert DOCX to PDF Online Free | Bishal Codes",
          description: "Free online Word to PDF converter. Convert Word documents (.docx, .doc) into high-fidelity PDF documents with exact layout, margins, and formatting preservation.",
          keywords: "Word to PDF, DOCX to PDF, convert docx to PDF, online PDF tools, document converter, free Word converter, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/word-to-pdf",
          },
          openGraph: {
            title: "Word to PDF Converter | Convert DOCX to PDF Online Free",
            description: "Convert Word documents (.docx, .doc) into high-fidelity PDF documents with exact layout, margins, and formatting preservation.",
            url: "https://bishalcodes.com/tools/word-to-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/word-to-pdf.png", width: 1200, height: 630, alt: "Word to PDF Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Word to PDF Converter | Convert DOCX to PDF Online Free",
            description: "Convert Word documents (.docx, .doc) into high-fidelity PDF documents with exact layout, margins, and formatting preservation.",
            images: ["https://bishalcodes.com/seo-images/word-to-pdf.png"]
          }
        };
      }

      if (subpage === 'excel-to-pdf') {
        return {
          title: "Excel to PDF Converter | Convert XLSX to PDF Online Free | Bishal Codes",
          description: "Free online Excel to PDF converter. Convert Microsoft Excel spreadsheets (.xlsx, .xls) into high-fidelity PDF documents with exact gridlines, tables, and formatting preservation.",
          keywords: "Excel to PDF, XLSX to PDF, convert excel to PDF, online PDF tools, spreadsheet converter, free Excel converter, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/excel-to-pdf",
          },
          openGraph: {
            title: "Excel to PDF Converter | Convert XLSX to PDF Online Free",
            description: "Convert Microsoft Excel spreadsheets (.xlsx, .xls) into high-fidelity PDF documents with exact gridlines, tables, and formatting preservation.",
            url: "https://bishalcodes.com/tools/excel-to-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/excel-to-pdf.png", width: 1200, height: 630, alt: "Excel to PDF Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Excel to PDF Converter | Convert XLSX to PDF Online Free",
            description: "Convert Microsoft Excel spreadsheets (.xlsx, .xls) into high-fidelity PDF documents with exact gridlines, tables, and formatting preservation.",
            images: ["https://bishalcodes.com/seo-images/excel-to-pdf.png"]
          }
        };
      }

      if (subpage === 'pdf-to-excel') {
        return {
          title: "PDF to Excel Converter | Extract PDF Tables to Excel Free | Bishal Codes",
          description: "Free online PDF to Excel converter. Extract data tables and rows from PDF documents into formatted Microsoft Excel spreadsheets (.xlsx) with gridlines.",
          keywords: "PDF to Excel, convert PDF to Excel, extract PDF tables, online PDF tools, data extraction, free Excel converter, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/pdf-to-excel",
          },
          openGraph: {
            title: "PDF to Excel Converter | Extract PDF Tables to Excel Free",
            description: "Extract data tables and rows from PDF documents into formatted Microsoft Excel spreadsheets (.xlsx) with gridlines.",
            url: "https://bishalcodes.com/tools/pdf-to-excel",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/pdf-to-excel.png", width: 1200, height: 630, alt: "PDF to Excel Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "PDF to Excel Converter | Extract PDF Tables to Excel Free",
            description: "Extract data tables and rows from PDF documents into formatted Microsoft Excel spreadsheets (.xlsx) with gridlines.",
            images: ["https://bishalcodes.com/seo-images/pdf-to-excel.png"]
          }
        };
      }

      if (subpage === 'split-pdf') {
        return {
          title: "Split PDF Online Free | Split PDF by Pages or Ranges | Bishal Codes",
          description: "Split PDF files into multiple documents by custom page ranges, fixed intervals, or extract every page. No watermarks, free and instant.",
          keywords: "split PDF, PDF splitter, split PDF online, split PDF by pages, extract pages from PDF, free PDF splitter, Bishal Codes",
          alternates: { canonical: "https://bishalcodes.com/tools/split-pdf" },
          openGraph: {
            title: "Split PDF Online Free | Split PDF by Pages or Ranges",
            description: "Split PDF files into multiple documents by custom page ranges, fixed intervals, or extract every page. No watermarks, free and instant.",
            url: "https://bishalcodes.com/tools/split-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/split-pdf.png", width: 1200, height: 630, alt: "Split PDF Online" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Split PDF Online Free | Split PDF by Pages or Ranges",
            description: "Split PDF files into multiple documents by custom page ranges, fixed intervals, or extract every page.",
            images: ["https://bishalcodes.com/seo-images/split-pdf.png"]
          }
        };
      }

      if (subpage === 'edit-pdf') {
        return {
          title: "PDF Editor Online Free | Edit PDF Text, Shapes & Drawings | Bishal Codes",
          description: "Edit PDF documents online by adding text, freehand drawings, shapes, images, and highlights natively. Free, secure, and instant.",
          keywords: "PDF editor, edit PDF online, add text to PDF, PDF annotator, edit PDF free, draw on PDF, Bishal Codes",
          alternates: { canonical: "https://bishalcodes.com/tools/edit-pdf" },
          openGraph: {
            title: "PDF Editor Online Free | Edit PDF Text, Shapes & Drawings",
            description: "Edit PDF documents online by adding text, freehand drawings, shapes, images, and highlights natively. Free, secure, and instant.",
            url: "https://bishalcodes.com/tools/edit-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/edit-pdf.png", width: 1200, height: 630, alt: "PDF Editor Online" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "PDF Editor Online Free | Edit PDF Text, Shapes & Drawings",
            description: "Edit PDF documents online by adding text, freehand drawings, shapes, images, and highlights natively.",
            images: ["https://bishalcodes.com/seo-images/edit-pdf.png"]
          }
        };
      }

      if (subpage === 'dev-card-studio') {
        return {
          title: "Developer Card & OpenGraph Banner Studio | Design Social Banners Online | Bishal Codes",
          description: "Design stunning social preview cards, GitHub profile headers, and digital dev cards with drag-and-drop visual controls. Export high-resolution (3x) print-ready assets entirely inside your browser.",
          keywords: "developer card generator, OG image generator, github readme banner, linkedin cover design, twitter header builder, visual layout editor, open graph banner, bishal codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/dev-card-studio",
          },
          openGraph: {
            title: "Developer Card & OpenGraph Banner Studio | Design Social Banners Online",
            description: "Design stunning social preview cards, GitHub profile headers, and digital dev cards with drag-and-drop visual controls.",
            url: "https://bishalcodes.com/tools/dev-card-studio",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/dev-card-studio.png", width: 1200, height: 630, alt: "Developer Card & OG Banner Studio" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Developer Card & OpenGraph Banner Studio | Design Social Banners Online",
            description: "Design stunning social preview cards, GitHub profile headers, and digital dev cards with drag-and-drop visual controls.",
            images: ["https://bishalcodes.com/seo-images/dev-card-studio.png"]
          }
        };
      }

      if (subpage === 'add-page-numbers') {
        return {
          title: "Add Page Numbers to PDF | Free Online PDF Numbering Tool | Bishal Codes",
          description: "Easily add page numbers to your PDF documents online for free. A clean, fast, and secure PDF utility tool by Bishal Codes.",
          keywords: "add page numbers to PDF, insert page numbers PDF, PDF numbering tool, online PDF editor, number PDF pages, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/add-page-numbers",
          },
          openGraph: {
            title: "Add Page Numbers to PDF | Free Online PDF Numbering Tool",
            description: "Easily add page numbers to your PDF documents online for free.",
            url: "https://bishalcodes.com/tools/add-page-numbers",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/add-page-numbers.png", width: 1200, height: 630, alt: "Add Page Numbers to PDF" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Add Page Numbers to PDF | Free Online PDF Numbering Tool",
            description: "Easily add page numbers to your PDF documents online for free.",
            images: ["https://bishalcodes.com/seo-images/add-page-numbers.png"]
          }
        };
      }

      if (subpage === 'merge-pdf') {
        return {
          title: "Merge PDF Files | Combine PDFs Online Free | Bishal Codes",
          description: "Combine multiple PDF documents into a single file instantly. Free, secure, and lightning-fast online PDF merger tool by Bishal Codes.",
          keywords: "merge PDF, combine PDF, PDF merger online, join PDF files, PDF binder, free PDF combiner, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/merge-pdf",
          },
          openGraph: {
            title: "Merge PDF Files | Combine PDFs Online Free",
            description: "Combine multiple PDF documents into a single file instantly for free.",
            url: "https://bishalcodes.com/tools/merge-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/merge-pdf.png", width: 1200, height: 630, alt: "Merge PDF Files" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Merge PDF Files | Combine PDFs Online Free",
            description: "Combine multiple PDF documents into a single file instantly for free.",
            images: ["https://bishalcodes.com/seo-images/merge-pdf.png"]
          }
        };
      }

      if (subpage === 'jpg-to-pdf') {
        return {
          title: "JPG to PDF Converter | Convert Images to PDF Online | Bishal Codes",
          description: "Convert your JPG, PNG, and image files into a single, beautifully formatted PDF document for free. Fast online image to PDF converter.",
          keywords: "JPG to PDF, image to PDF, convert photo to PDF, PNG to PDF, make PDF from images, online PDF tools, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/jpg-to-pdf",
          },
          openGraph: {
            title: "JPG to PDF Converter | Convert Images to PDF Online",
            description: "Convert your JPG, PNG, and image files into a single PDF document for free.",
            url: "https://bishalcodes.com/tools/jpg-to-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/jpg-to-pdf.png", width: 1200, height: 630, alt: "JPG to PDF Converter" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "JPG to PDF Converter | Convert Images to PDF Online",
            description: "Convert your JPG, PNG, and image files into a single PDF document for free.",
            images: ["https://bishalcodes.com/seo-images/jpg-to-pdf.png"]
          }
        };
      }

      if (subpage === 'image-compressor') {
        return {
          title: "Smart Image Compressor | Compress JPG, PNG, WebP Online | Bishal Codes",
          description: "Reduce image file sizes (JPEG, PNG, WebP) to target levels (like 200 KB or 100 KB) instantly client-side without quality loss. 100% private, browser-based compression.",
          keywords: "image compressor, compress image under 200kb, reduce photo size online, PNG compressor, JPEG optimizer, free online image resizer, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/image-compressor",
          },
          openGraph: {
            title: "Smart Image Compressor | Compress JPG, PNG, WebP Online | Bishal Codes",
            description: "Compress images under 200 KB or 100 KB instantly in your browser. Complete privacy with client-side canvas processing.",
            url: "https://bishalcodes.com/tools/image-compressor",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/image-compressor.png", width: 1200, height: 630, alt: "Smart Image Compressor" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Smart Image Compressor | Compress JPG, PNG, WebP Online | Bishal Codes",
            description: "Compress images under 200 KB or 100 KB instantly in your browser.",
            images: ["https://bishalcodes.com/seo-images/image-compressor.png"]
          }
        };
      }

      if (subpage === 'emi-calculator') {
        return {
          title: "EMI & Loan Calculator | Interactive Amortization Ledger | Bishal Codes",
          description: "Plan your loans with sliders for principal, rates, and tenure. Instantly see monthly payments (EMI), interest totals, donut breakdown charts, and yearly amortization ledgers.",
          keywords: "EMI calculator, loan calculator, home loan EMI, car loan calculator, interest amortization schedule, loan repayment calculator, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/emi-calculator",
          },
          openGraph: {
            title: "EMI & Loan Calculator | Interactive Amortization Ledger | Bishal Codes",
            description: "Calculate monthly EMIs and view principal vs interest breakdowns using custom interactive SVG charts.",
            url: "https://bishalcodes.com/tools/emi-calculator",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/emi-calculator.png", width: 1200, height: 630, alt: "EMI & Loan Calculator" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "EMI & Loan Calculator | Interactive Amortization Ledger | Bishal Codes",
            description: "Calculate monthly EMIs and view principal vs interest breakdowns.",
            images: ["https://bishalcodes.com/seo-images/emi-calculator.png"]
          }
        };
      }

      if (subpage === 'qr-studio') {
        return {
          title: "QR Code Studio | Free Generator & Scanner Online | Bishal Codes",
          description: "Generate customized QR codes for URLs, Wi-Fi connections, and VCards with logos and custom colors. Scan QR codes in real-time via camera feed.",
          keywords: "QR code generator, QR code scanner online, generate custom QR, VCard QR code, Wi-Fi QR code generator, scan barcode camera, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/qr-studio",
          },
          openGraph: {
            title: "QR Code Studio | Free Generator & Scanner Online | Bishal Codes",
            description: "Create branded QR codes with custom colors and center logo overlay, or scan them instantly via your web camera.",
            url: "https://bishalcodes.com/tools/qr-studio",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/qr-studio.png", width: 1200, height: 630, alt: "QR Code Studio" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "QR Code Studio | Free Generator & Scanner Online | Bishal Codes",
            description: "Create branded QR codes with custom colors and center logo overlay, or scan them instantly.",
            images: ["https://bishalcodes.com/seo-images/qr-studio.png"]
          }
        };
      }

      if (subpage === 'json-formatter') {
        return {
          title: "JSON Formatter, Validator & Tree Viewer | Bishal Codes",
          description: "Format, minify, and validate JSON data structures. Highlight syntax errors with lines and browse nested data structures with collapsible tree viewer nodes.",
          keywords: "JSON formatter, JSON validator, JSON tree viewer, beautify JSON, minify JSON online, parse JSON tool, JSON syntax validation, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/json-formatter",
          },
          openGraph: {
            title: "JSON Formatter, Validator & Tree Viewer | Bishal Codes",
            description: "Beautify or minify raw JSON payloads and explore nested arrays/objects recursively in an interactive tree view.",
            url: "https://bishalcodes.com/tools/json-formatter",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/json-formatter.png", width: 1200, height: 630, alt: "JSON Formatter & Validator" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "JSON Formatter, Validator & Tree Viewer | Bishal Codes",
            description: "Beautify or minify raw JSON payloads and explore nested arrays/objects recursively.",
            images: ["https://bishalcodes.com/seo-images/json-formatter.png"]
          }
        };
      }

      if (subpage === 'diff-checker') {
        return {
          title: "Instant Text Diff Checker | Side-by-Side Code Compare | Bishal Codes",
          description: "Compare line differences between original and modified texts. Highlight character additions and deletions side-by-side or inline with synchronized scrolling.",
          keywords: "diff checker online, text comparison tool, compare text files, line diff, code diff viewer, visual diff checker, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/diff-checker",
          },
          openGraph: {
            title: "Instant Text Diff Checker | Side-by-Side Code Compare | Bishal Codes",
            description: "Find differences between two texts instantly. Displays split column views or inline changes calculated locally.",
            url: "https://bishalcodes.com/tools/diff-checker",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/diff-checker.png", width: 1200, height: 630, alt: "Instant Text Diff Checker" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Instant Text Diff Checker | Side-by-Side Compare | Bishal Codes",
            description: "Find differences between two texts instantly. Displays split column views.",
            images: ["https://bishalcodes.com/seo-images/diff-checker.png"]
          }
        };
      }

      if (subpage === 'code-runner') {
        return {
          title: "HTML, CSS & JavaScript Code Runner | Live Web Playground | Bishal Codes",
          description: "Run and preview HTML, CSS, and JS web code directly in your browser. Features editor tabs, log consoles, and instant visual render previews.",
          keywords: "html css js runner, online code editor, live html preview, javascript code runner, web playground, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/code-runner",
          },
          openGraph: {
            title: "HTML, CSS & JavaScript Code Runner | Live Web Playground | Bishal Codes",
            description: "An interactive, isolated sandbox editor to run and preview HTML, CSS, and JS code instantly with visual logs.",
            url: "https://bishalcodes.com/tools/code-runner",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/code-runner.png", width: 1200, height: 630, alt: "HTML CSS JS Live Code Runner" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "HTML, CSS & JavaScript Code Runner | Live Web Playground | Bishal Codes",
            description: "An interactive, isolated sandbox editor to run and preview HTML, CSS, and JS code instantly.",
            images: ["https://bishalcodes.com/seo-images/code-runner.png"]
          }
        };
      }

      if (subpage === 'screenshot-studio') {
        return {
          title: "Website Screenshot Studio | Capture & Save Web Pages | Bishal Codes",
          description: "Capture high-resolution screenshots of any web page. Responsive presets, mobile/desktop emulation, full scrolling pages, and free downloads.",
          keywords: "website screenshot, capture website, site shot online, take webpage screenshot, full page screenshot, screenshot API, free developer tools, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/screenshot-studio",
          },
          openGraph: {
            title: "Website Screenshot Studio | Capture Web Pages Online | Bishal Codes",
            description: "Capture high-resolution screenshots of any website. Desktop, tablet, and mobile presets, full-page scrolling captures, and instant downloads.",
            url: "https://bishalcodes.com/tools/screenshot-studio",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/screenshot-studio.png", width: 1200, height: 630, alt: "Website Screenshot Studio" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Website Screenshot Studio | Capture Web Pages Online | Bishal Codes",
            description: "Capture high-resolution screenshots of any website. Emulate viewports and download captures instantly.",
            images: ["https://bishalcodes.com/seo-images/screenshot-studio.png"]
          }
        };
      }

      if (subpage === 'file-transfer') {
        return {
          title: "P2P File Transfer | Send Large Files Securely | Bishal Codes",
          description: "Send files up to 100 GB instantly via secure peer-to-peer connection. Direct, completely private, and browser-based file sharing tool.",
          keywords: "P2P file transfer, send files online, secure file sharing, browser file transfer, free file sender, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/file-transfer",
          },
          openGraph: {
            title: "P2P File Transfer | Send Large Files Securely | Bishal Codes",
            description: "Direct peer-to-peer secure file sharing. Send files up to 100 GB instantly from your browser.",
            url: "https://bishalcodes.com/tools/file-transfer",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/file-transfer.png", width: 1200, height: 630, alt: "P2P File Transfer" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "P2P File Transfer | Send Large Files Securely | Bishal Codes",
            description: "Direct peer-to-peer secure file sharing up to 100 GB.",
            images: ["https://bishalcodes.com/seo-images/file-transfer.png"]
          }
        };
      }

      if (subpage === 'secure-vault') {
        return {
          title: "Secure Vault | Password-Protect & Share Any File | Bishal Codes",
          description: "Encrypt any file — image, PDF, video, or document — with AES-256-GCM encryption. Generate a password-protected shareable link and QR code. Zero-knowledge: your password never leaves your browser.",
          keywords: "password protect file online, encrypt file share link, AES-256 file encryption, secure file sharing, password protected file link, QR code file share, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/secure-vault",
          },
          openGraph: {
            title: "Secure Vault | Password-Protect & Share Any File | Bishal Codes",
            description: "Lock any file with AES-256 encryption. Share via a password-protected link or QR code. Zero-knowledge security — password never sent to server.",
            url: "https://bishalcodes.com/tools/secure-vault",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/secure-vault.png", width: 1200, height: 630, alt: "Secure Vault | Bishal Codes" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Secure Vault | Password-Protect & Share Any File | Bishal Codes",
            description: "Lock any file with AES-256 encryption. Zero-knowledge security — password never leaves browser.",
            images: ["https://bishalcodes.com/seo-images/secure-vault.png"]
          }
        };
      }

      if (subpage === 'ocr-converter') {
        return {
          title: "AI OCR Image to Text Converter | Free Online OCR Scan | Bishal Codes",
          description: "Extract text from images, receipts, screenshots, and scans instantly. Powered by 15-language client-side AI, completely free, unlimited, and private.",
          keywords: "image to text, AI OCR online, free OCR scanner, extract text from image, local browser OCR, text recognizer, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/ocr-converter",
          },
          openGraph: {
            title: "AI OCR Image to Text Converter | Free Online OCR Scan | Bishal Codes",
            description: "Extract text from images, receipts, screenshots, and scans instantly. 100% private and runs entirely locally in your browser.",
            url: "https://bishalcodes.com/tools/ocr-converter",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: "AI OCR Image-to-Text" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "AI OCR Image to Text Converter | Free Online OCR Scan | Bishal Codes",
            description: "Extract text from images, receipts, screenshots, and scans instantly. 100% private client-side AI.",
            images: ["https://bishalcodes.com/seo-images/tools.png"]
          }
        };
      }

      if (subpage === 'bg-remover') {
        return {
          title: "Free AI Image Background Remover | Transparent PNG Maker | Bishal Codes",
          description: "Remove background from photos and portraits instantly inside your browser. Powered by local AI with zero server uploads for absolute privacy and high-resolution output.",
          keywords: "remove background from image, transparent PNG converter, free background remover, image cut out online, local AI bg remover, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/bg-remover",
          },
          openGraph: {
            title: "Free AI Image Background Remover | Transparent PNG Maker | Bishal Codes",
            description: "Remove background from photos and portraits instantly inside your browser. 100% private with no quality limits.",
            url: "https://bishalcodes.com/tools/bg-remover",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: "AI Background Remover" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Free AI Image Background Remover | Transparent PNG Maker | Bishal Codes",
            description: "Remove background from photos and portraits instantly inside your browser. 100% private.",
            images: ["https://bishalcodes.com/seo-images/tools.png"]
          }
        };
      }
      
      if (subpage === 'scan-pdf') {
        return {
          title: "Scan to PDF Online | Free Mobile CamScanner App | Bishal Codes",
          description: "Scan paper documents using your smartphone camera and stream them to your computer screen in real-time. Apply magic colors and compile to PDF.",
          keywords: "scan to pdf, online camscanner, scan document phone to pc, mobile document scanner, free scanner app, scan to pdf online, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/scan-pdf",
          },
          openGraph: {
            title: "Scan to PDF Online | Free Mobile CamScanner App | Bishal Codes",
            description: "Scan paper documents using your smartphone camera and stream them to your computer screen in real-time. Apply magic colors and compile to PDF.",
            url: "https://bishalcodes.com/tools/scan-pdf",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: "Online CamScanner" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Scan to PDF Online | Free Mobile CamScanner App | Bishal Codes",
            description: "Scan paper documents using your smartphone camera and stream them to your computer screen in real-time.",
            images: ["https://bishalcodes.com/seo-images/tools.png"]
          }
        };
      }

      if (subpage === 'typing-practice') {
        return {
          title: "Online Typing Speed Test & Keyboard Practice | Bishal Codes",
          description: "Test and build your typing speed (WPM) and accuracy. Practice using standard English vocabularies, programming code snippets, or your own custom paragraphs. Complete offline privacy.",
          keywords: "typing speed test, online typing tutor, learn typing fast, keyboard WPM tracker, code typing practice, free typing tutor, Bishal Codes",
          alternates: {
            canonical: "https://bishalcodes.com/tools/typing-practice",
          },
          openGraph: {
            title: "Online Typing Speed Test & Keyboard Practice | Bishal Codes",
            description: "Improve your WPM and keyboard accuracy with dynamic text challenges and local muscle-memory visualizations.",
            url: "https://bishalcodes.com/tools/typing-practice",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: "Online Typing Studio" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Online Typing Speed Test & Keyboard Practice | Bishal Codes",
            description: "Improve your WPM and keyboard accuracy with dynamic text challenges.",
            images: ["https://bishalcodes.com/seo-images/tools.png"]
          }
        };
      }

      if (subpage === 'font-downloader') {
        const subFontId = slugArr[2] || '';
        const font = subFontId ? allFontsDB.find(f => f.id === subFontId) : null;

        if (font) {
          const fontName = font.name;
          const fileName = font.fileName;
          const catName = font.category === 'nepali' ? 'Nepali' : font.category;
          return {
            title: `Download ${fontName} Font | Free TrueType TTF Download | Bishal Codes`,
            description: `Download the real ${fontName} font (${fileName}) for free. Preview and install this official ${catName} font on Windows, macOS, and Linux. No registration required.`,
            keywords: `download ${fontName} font, free ${fontName} ttf, install ${fontName}, ${catName} font download, bishal codes font downloader`,
            alternates: {
              canonical: `https://bishalcodes.com/tools/font-downloader/${subFontId}`,
            },
            openGraph: {
              title: `Download ${fontName} Font | Free TrueType TTF Download`,
              description: `Get the official ${fontName} font for free. Preview, test font size, and download the .ttf file directly.`,
              url: `https://bishalcodes.com/tools/font-downloader/${subFontId}`,
              siteName: "Bishal Codes",
              type: "website",
              images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: `Download ${fontName} Font` }],
            },
            twitter: {
              card: "summary_large_image",
              site: "@bishalmishra",
              creator: "@bishalmishra",
              title: `Download ${fontName} Font | Free TTF Download | Bishal Codes`,
              description: `Get the official ${fontName} font for free. Preview and download the .ttf file directly.`,
              images: ["https://bishalcodes.com/seo-images/tools.png"]
            }
          };
        }

        return {
          title: "System Fonts Downloader | Batch Download 1100+ Fonts | Bishal Codes",
          description: "Browse, preview, and batch download 1100+ real Nepali and English fonts for free. Includes Preeti, Kantipur, Mangal, Kalimati, Roboto, Inter, and more. Install directly on your computer.",
          keywords: "system fonts downloader, download nepali fonts, download preeti, download kantipur, download roboto, download google fonts zip, bishal codes, font previews",
          alternates: {
            canonical: "https://bishalcodes.com/tools/font-downloader",
          },
          openGraph: {
            title: "System Fonts Downloader | Batch Download 1100+ Fonts | Bishal Codes",
            description: "Browse, preview, and batch download 1100+ real Nepali and English fonts for free. 100% private and offline-capable preview.",
            url: "https://bishalcodes.com/tools/font-downloader",
            siteName: "Bishal Codes",
            type: "website",
            images: [{ url: "https://bishalcodes.com/seo-images/tools.png", width: 1200, height: 630, alt: "System Fonts Downloader" }],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "System Fonts Downloader | Batch Download 1100+ Fonts | Bishal Codes",
            description: "Browse, preview, and batch download 1100+ real Nepali and English fonts for free.",
            images: ["https://bishalcodes.com/seo-images/tools.png"]
          }
        };
      }

      // Default Services Dashboard
      return {
        title: "Utility Services & Developer Tools | Bishal Codes",
        description: "Explore free high-performance utility tools and developer services by Bishal Codes, including our accurate Nepali Date Converter and Language Translator.",
        keywords: "Bishal Codes services, developer tools, Nepali Date Converter, Language Translator, English to Nepali, AD to BS, online tools nepal",
        alternates: {
          canonical: "https://bishalcodes.com/tools",
        },
        openGraph: {
          title: "Utility Services & Developer Tools | Bishal Codes",
          description: "Access premium web tools, including the Nepali Date Converter and Language Translator, built for performance and speed.",
          url: "https://bishalcodes.com/tools",
          siteName: "Bishal Codes",
          locale: "en_US",
          type: "website",
          images: [
            {
              url: "https://bishalcodes.com/seo-images/tools.png",
              width: 1200,
              height: 630,
              alt: "Utility Services | Bishal Codes",
            }
          ],
        },
        twitter: {
          card: "summary_large_image",
          site: "@bishalmishra",
          creator: "@bishalmishra",
          title: "Utility Services & Developer Tools | Bishal Codes",
          description: "Explore free high-performance utility tools by Bishal Codes, including Nepali Date Converter and AI Translator.",
          images: ["https://bishalcodes.com/seo-images/tools.png"]
        }
      };
    }

    // If it's a blog post page: /blog/<id>
    if (slugArr[0] === 'blog' && slugArr[1]) {
      const blogId = slugArr[1];
      try {
        // Fetch the blog post directly from the Firestore REST API (no credentials needed for public reading)
        const res = await fetch(`https://firestore.googleapis.com/v1/projects/bishal-mishra-3c559/databases/(default)/documents/blog/${blogId}`, {
          next: { revalidate: 300 } // Cache results for 5 minutes
        });

        if (res.ok) {
          const data = await res.json();
          const title = data.fields?.title?.stringValue || "Bishal Codes Blog";
          const excerpt = data.fields?.excerpt?.stringValue || "Read this article on Bishal Codes.";
          const content = data.fields?.content?.stringValue || "";

          let rawImageUrl = data.fields?.imageUrl?.stringValue || "";
          if (!rawImageUrl) {
            // Extract first image from markdown body content
            const imgMatch = content.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
            if (imgMatch && imgMatch[1]) {
              rawImageUrl = imgMatch[1];
            }
          }

          const imageUrl = getSocialPreviewImage(rawImageUrl);
          const seoDescription = data.fields?.seoDescription?.stringValue || excerpt;

          return {
            title: `${title} | Bishal Codes`,
            description: seoDescription,
            openGraph: {
              title: title,
              description: seoDescription,
              url: `https://bishalcodes.com/blog/${blogId}`,
              siteName: "Bishal Codes",
              locale: "en_US",
              images: [
                {
                  url: imageUrl,
                  width: 1200,
                  height: 630,
                  alt: title,
                }
              ],
              type: "article"
            },
            twitter: {
              card: "summary_large_image",
              site: "@bishalmishra",
              creator: "@bishalmishra",
              title: title,
              description: seoDescription,
              images: [imageUrl]
            }
          };
        }
      } catch (err) {
        console.warn(`Failed to fetch metadata for blog post ${blogId}:`, err);
      }
    }

    const firstSlug = slugArr[0];

    // Homepage
    if (!firstSlug) {
      return {
        title: "Bishal Mishra | Full-Stack Web Developer & Designer Portfolio",
        description: "Hi, I'm Bishal Mishra. I build fast, clean, and interactive websites and web applications. Explore my portfolio projects, read my blog, or get in touch for custom web development.",
        alternates: {
          canonical: "https://bishalcodes.com/",
        },
        openGraph: {
          title: "Bishal Mishra | Full-Stack Web Developer & Designer Portfolio",
          description: "Hi, I'm Bishal Mishra. I build fast, clean, and interactive websites and web applications. Explore my portfolio projects, read my blog, or get in touch for custom web development.",
          url: "https://bishalcodes.com/",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Developers Page / API Portal
    if (firstSlug === 'developers') {
      const subpage = slugArr[1] || '';
      let pageTitle = "Core Utility Developer APIs | Live Playground & Integration | Bishal Codes";
      let pageDesc = "Integrate fast, robust, and real utility developer APIs: Website Screenshot Capture, QR Code Generator, AI Document Summarizer, AI OCR, JSON Formatter, and Diff Checker.";
      let canonUrl = "https://bishalcodes.com/developers";

      if (subpage) {
        const cleanSub = subpage.charAt(0).toUpperCase() + subpage.slice(1).replace('-', ' ');
        pageTitle = `${cleanSub} API | Interactive Playground & Integration Docs | Bishal Codes`;
        pageDesc = `Free, production-level, and lightning-fast developer ${cleanSub} API. Test requests in our interactive playground and copy clean Node.js, Python, or Go snippets.`;
        canonUrl = `https://bishalcodes.com/developers/${subpage}`;
      }

      return {
        title: pageTitle,
        description: pageDesc,
        keywords: "developer apis, free utility apis, screenshot api, qr code api, ocr api, summarize api, json format api, diff checker api, bishal codes apis",
        alternates: {
          canonical: canonUrl,
        },
        openGraph: {
          title: pageTitle,
          description: pageDesc,
          url: canonUrl,
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // About Page
    if (firstSlug === 'about') {
      return {
        title: "About Me | Bishal Mishra",
        description: "Get to know me: I'm a developer who loves writing clean code and building user-centric websites. Here is my story, background, and tech stack.",
        alternates: {
          canonical: "https://bishalcodes.com/about",
        },
        openGraph: {
          title: "About Me | Bishal Mishra",
          description: "Get to know me: I'm a developer who loves writing clean code and building user-centric websites. Here is my story, background, and tech stack.",
          url: "https://bishalcodes.com/about",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Skills Page
    if (firstSlug === 'skills') {
      return {
        title: "My Skills & Tech Stack | Bishal Mishra",
        description: "A transparent overview of my technical skills, frontend and backend capabilities, and the tools I use daily to build modern web experiences.",
        alternates: {
          canonical: "https://bishalcodes.com/skills",
        },
        openGraph: {
          title: "My Skills & Tech Stack | Bishal Mishra",
          description: "A transparent overview of my technical skills, frontend and backend capabilities, and the tools I use daily to build modern web experiences.",
          url: "https://bishalcodes.com/skills",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Projects Page
    if (firstSlug === 'projects') {
      return {
        title: "My Projects & Portfolio | Bishal Mishra",
        description: "Take a look at the web applications, utility tools, and sites I've built. Each project includes details on features and technology used.",
        alternates: {
          canonical: "https://bishalcodes.com/projects",
        },
        openGraph: {
          title: "My Projects & Portfolio | Bishal Mishra",
          description: "Take a look at the web applications, utility tools, and sites I've built. Each project includes details on features and technology used.",
          url: "https://bishalcodes.com/projects",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Experience Page
    if (firstSlug === 'experience') {
      return {
        title: "Work Experience | Bishal Mishra",
        description: "A summary of my professional background, previous developer roles, and projects I have worked on throughout my career.",
        alternates: {
          canonical: "https://bishalcodes.com/experience",
        },
        openGraph: {
          title: "Work Experience | Bishal Mishra",
          description: "A summary of my professional background, previous developer roles, and projects I have worked on throughout my career.",
          url: "https://bishalcodes.com/experience",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Blog Index Page
    if (firstSlug === 'blog' && !slugArr[1]) {
      return {
        title: "Bishal Codes Blog | Programming & Web Dev Tips",
        description: "Read my latest posts, guides, and thoughts on JavaScript, React, Next.js, and web development. No fluff, just practical advice.",
        alternates: {
          canonical: "https://bishalcodes.com/blog",
        },
        openGraph: {
          title: "Bishal Codes Blog | Programming & Web Dev Tips",
          description: "Read my latest posts, guides, and thoughts on JavaScript, React, Next.js, and web development. No fluff, just practical advice.",
          url: "https://bishalcodes.com/blog",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Contact Page
    if (firstSlug === 'contact') {
      return {
        title: "Contact Me & Get in Touch | Bishal Mishra",
        description: "Need a custom website, a web application, or just want to chat? Fill out the form or reach out directly to discuss your project.",
        alternates: {
          canonical: "https://bishalcodes.com/contact",
        },
        openGraph: {
          title: "Contact Me & Get in Touch | Bishal Mishra",
          description: "Need a custom website, a web application, or just want to chat? Fill out the form or reach out directly to discuss your project.",
          url: "https://bishalcodes.com/contact",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // AI Studio Page
    if (firstSlug === 'ai-studio') {
      return {
        title: "AI Studio | Interactive Web Tools | Bishal Codes",
        description: "Try my experimental web-based AI tools and see how they can help you with simple daily tasks.",
        alternates: {
          canonical: "https://bishalcodes.com/ai-studio",
        },
        openGraph: {
          title: "AI Studio | Interactive Web Tools | Bishal Codes",
          description: "Try my experimental web-based AI tools and see how they can help you with simple daily tasks.",
          url: "https://bishalcodes.com/ai-studio",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Docs Page
    if (firstSlug === 'docs') {
      return {
        title: "Documentation & Guides | Bishal Codes",
        description: "User manuals, references, and system documentation for the open-source tools and developer projects I host on my website.",
        alternates: {
          canonical: "https://bishalcodes.com/docs",
        },
        openGraph: {
          title: "Documentation & Guides | Bishal Codes",
          description: "User manuals, references, and system documentation for the open-source tools and developer projects I host on my website.",
          url: "https://bishalcodes.com/docs",
          type: "website",
          images: DEFAULT_OG_IMAGES
        },
        twitter: DEFAULT_TWITTER_CONFIG
      };
    }

    // Vault View Page (password-protected file access)
    if (firstSlug === 'vault') {
      return {
        title: "Secure File Access | Password Protected | Bishal Codes",
        description: "Enter the password to access this encrypted file. This file is protected with AES-256-GCM encryption and can only be unlocked with the correct password.",
        robots: "noindex, nofollow",
      };
    }

    // Login Page
    if (firstSlug === 'login') {
      return {
        title: "Login | Bishal Codes Admin Panel",
        description: "Administrative login page for the Bishal Codes portfolio platform.",
        alternates: {
          canonical: "https://bishalcodes.com/login",
        }
      };
    }

    // Admin Page
    if (firstSlug === 'admin') {
      return {
        title: "Admin Dashboard | Bishal Codes",
        description: "Manage projects, write blogs, and configure services directly from the admin dashboard.",
        alternates: {
          canonical: "https://bishalcodes.com/admin",
        }
      };
    }

    // Legal Pages
    if (firstSlug === 'legal') {
      const legalSubpage = slugArr[1] || '';

      if (legalSubpage === 'terms-and-conditions') {
        return {
          title: "Terms and Conditions | Bishal Codes — Nepal Compliant Legal Agreement",
          description: "Read the complete Terms and Conditions for bishalcodes.com. Governs your use of our website, developer tools, services, and digital content. Compliant with Nepal Electronic Transaction Act 2063, GDPR, and Google AdSense Publisher Policies.",
          keywords: "terms and conditions bishal codes, website terms of service nepal, bishalcodes legal agreement, terms of use nepal IT act, google adsense terms compliance, GDPR terms nepal website",
          robots: "index, follow",
          alternates: {
            canonical: "https://bishalcodes.com/legal/terms-and-conditions",
          },
          openGraph: {
            title: "Terms and Conditions | Bishal Codes",
            description: "Read the complete terms governing your use of bishalcodes.com — covering services, intellectual property, disclaimers, and user obligations. Nepal & GDPR compliant.",
            url: "https://bishalcodes.com/legal/terms-and-conditions",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: DEFAULT_OG_IMAGES,
          },
          twitter: {
            ...DEFAULT_TWITTER_CONFIG,
            title: "Terms and Conditions | Bishal Codes",
            description: "Read the complete terms governing your use of bishalcodes.com — Nepal & GDPR compliant.",
          },
        };
      }

      if (legalSubpage === 'privacy-policy') {
        return {
          title: "Privacy Policy | Bishal Codes — How We Protect Your Data",
          description: "Learn exactly how bishalcodes.com collects, uses, stores, and protects your personal information. Fully compliant with Nepal Individual Privacy Act 2075, GDPR (EU), and Google Privacy Policy. Includes data rights, opt-out options, and third-party disclosures.",
          keywords: "privacy policy bishal codes, data protection nepal website, GDPR privacy policy nepal, google analytics privacy bishalcodes, how we use your data, bishalcodes personal data",
          robots: "index, follow",
          alternates: {
            canonical: "https://bishalcodes.com/legal/privacy-policy",
          },
          openGraph: {
            title: "Privacy Policy | Bishal Codes",
            description: "How bishalcodes.com collects, uses, and protects your data. Nepal Privacy Act 2075, GDPR, and Google Policy compliant.",
            url: "https://bishalcodes.com/legal/privacy-policy",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: DEFAULT_OG_IMAGES,
          },
          twitter: {
            ...DEFAULT_TWITTER_CONFIG,
            title: "Privacy Policy | Bishal Codes",
            description: "How bishalcodes.com collects, uses, and protects your data. Nepal & GDPR compliant.",
          },
        };
      }

      if (legalSubpage === 'cookies-policy') {
        return {
          title: "Cookie Policy | Bishal Codes — How We Use Cookies",
          description: "Find out exactly how bishalcodes.com uses cookies and similar tracking technologies. Covers essential cookies, analytics (Google Analytics), advertising (Google AdSense), and how to manage or opt out. GDPR & ePrivacy Directive compliant.",
          keywords: "cookie policy bishal codes, google adsense cookies, analytics cookies nepal, cookie consent GDPR, bishalcodes tracking technology, how to disable cookies nepal website",
          robots: "index, follow",
          alternates: {
            canonical: "https://bishalcodes.com/legal/cookies-policy",
          },
          openGraph: {
            title: "Cookie Policy | Bishal Codes",
            description: "How bishalcodes.com uses cookies — essential, analytics, and advertising. Learn how to manage your preferences. GDPR compliant.",
            url: "https://bishalcodes.com/legal/cookies-policy",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: DEFAULT_OG_IMAGES,
          },
          twitter: {
            ...DEFAULT_TWITTER_CONFIG,
            title: "Cookie Policy | Bishal Codes",
            description: "How bishalcodes.com uses cookies for analytics and advertising. GDPR compliant.",
          },
        };
      }

      if (legalSubpage === 'data-deletion-request') {
        return {
          title: "Data Deletion Request | Bishal Codes — Right to Erasure",
          description: "Exercise your right to have your personal data permanently deleted from bishalcodes.com. Submit a data deletion request in compliance with GDPR Article 17 (Right to Erasure) and Nepal Individual Privacy Act 2075. We respond within 30 days.",
          keywords: "data deletion request bishal codes, right to erasure GDPR, delete my data nepal, remove personal data bishalcodes, GDPR article 17 request, personal data removal nepal website",
          robots: "index, follow",
          alternates: {
            canonical: "https://bishalcodes.com/legal/data-deletion-request",
          },
          openGraph: {
            title: "Data Deletion Request | Bishal Codes",
            description: "Submit a request to permanently delete your personal data from bishalcodes.com. GDPR Article 17 and Nepal Privacy Act 2075 compliant. Response within 30 days.",
            url: "https://bishalcodes.com/legal/data-deletion-request",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: DEFAULT_OG_IMAGES,
          },
          twitter: {
            ...DEFAULT_TWITTER_CONFIG,
            title: "Data Deletion Request | Bishal Codes",
            description: "Request permanent deletion of your data from bishalcodes.com. GDPR & Nepal Privacy Act compliant.",
          },
        };
      }

      // Generic legal page fallback
      return {
        title: "Legal Information | Bishal Codes",
        description: "Legal documents, terms of service, privacy policy, cookie policy, and data rights information for bishalcodes.com. Compliant with Nepal law and international privacy standards.",
        robots: "index, follow",
        alternates: {
          canonical: `https://bishalcodes.com/legal/${legalSubpage}`,
        },
        openGraph: {
          title: "Legal Information | Bishal Codes",
          description: "Legal documents and policies for bishalcodes.com — compliant with Nepal law and GDPR.",
          url: `https://bishalcodes.com/legal/${legalSubpage}`,
          siteName: "Bishal Codes",
          locale: "en_US",
          type: "website",
          images: DEFAULT_OG_IMAGES,
        },
        twitter: DEFAULT_TWITTER_CONFIG,
      };
    }

    // Return empty metadata to fallback to default layout metadata for all other routes
    return {};
  };

  let metadata = await getOriginalMetadata();

  // Load custom SEO settings from Firestore REST API
  const customSeo = await getCustomSeoSettings(pageId);
  if (customSeo) {
    if (customSeo.title) {
      metadata.title = customSeo.title;
      if (!metadata.openGraph) metadata.openGraph = {};
      metadata.openGraph.title = customSeo.title;
      if (!metadata.twitter) metadata.twitter = {};
      metadata.twitter.title = customSeo.title;
    }
    if (customSeo.description) {
      metadata.description = customSeo.description;
      if (!metadata.openGraph) metadata.openGraph = {};
      metadata.openGraph.description = customSeo.description;
      if (!metadata.twitter) metadata.twitter = {};
      metadata.twitter.description = customSeo.description;
    }
    if (customSeo.keywords) {
      metadata.keywords = customSeo.keywords;
    }
    if (customSeo.canonical) {
      metadata.alternates = { ...metadata.alternates, canonical: customSeo.canonical };
      if (!metadata.openGraph) metadata.openGraph = {};
      metadata.openGraph.url = customSeo.canonical;
    }
    if (customSeo.ogImage) {
      const previewUrl = getSocialPreviewImage(customSeo.ogImage);
      if (!metadata.openGraph) metadata.openGraph = {};
      metadata.openGraph.images = [{ url: previewUrl, width: 1200, height: 630, alt: (customSeo.title || metadata.title || "Bishal Codes") as string }];
      if (!metadata.twitter) metadata.twitter = {};
      metadata.twitter.images = [previewUrl];
    }
  }

  return metadata;
}
