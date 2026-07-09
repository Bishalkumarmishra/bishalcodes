import React from 'react';
import { Metadata } from 'next';
import ClientApp from './ClientApp';

export default async function CatchAllPage(props: PageProps) {
  const { slug } = await props.params;
  return <ClientApp initialSlug={slug || []} />;
}

// Next.js 15: params is a Promise, so we must await it!
interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

// Helper to convert SVG images to raster format (PNG) for social media crawlers
function getSocialPreviewImage(url: string): string {
  if (!url) return "https://ik.imagekit.io/bishalc/desktop.png";

  // Strip query parameters to check extension
  const baseUrl = url.split('?')[0];
  if (baseUrl.toLowerCase().endsWith('.svg')) {
    // Cloudinary supports automatic format conversion by changing the file extension in the URL
    if (url.includes('cloudinary.com')) {
      return url.replace(/\.svg(\?|$)/i, '.png$1');
    }
    // Fallback if SVG cannot be dynamically converted by the hosting provider
    return "https://ik.imagekit.io/bishalc/desktop.png";
  }

  return url;
}

const DEFAULT_OG_IMAGES = [
  {
    url: "https://ik.imagekit.io/bishalc/desktop.png",
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
  images: ["https://ik.imagekit.io/bishalc/desktop.png"]
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
          title: "Nepali Date Converter | AD to BS & BS to AD Date Converter | Bishal Codes",
          description: "Convert English (AD) dates to Nepali (BS) dates and vice versa with precision. An accurate, offline-capable date converter utility by Bishal Codes, featuring leap year status, days of the month, and full Bikram Sambat calendar details.",
          keywords: "Nepali Date Converter, AD to BS Converter, BS to AD Converter, Bikram Sambat, Gregorian to Nepali, Nepali Calendar converter, Bishal Codes, date conversion nepal",
          alternates: {
            canonical: "https://bishalcodes.com/tools/date-converter",
          },
          openGraph: {
            title: "Nepali Date Converter | AD to BS & BS to AD | Bishal Codes",
            description: "Convert dates from Gregorian (AD) to Bikram Sambat (BS) and vice versa. Clean UI, high accuracy, and fast conversion.",
            url: "https://bishalcodes.com/tools/date-converter",
            siteName: "Bishal Codes",
            locale: "en_US",
            type: "website",
            images: [
              {
                url: "https://bishalcodes.com/seo-images/date-converter.png",
                width: 1200,
                height: 630,
                alt: "Nepali Date Converter | Bishal Codes",
              }
            ],
          },
          twitter: {
            card: "summary_large_image",
            site: "@bishalmishra",
            creator: "@bishalmishra",
            title: "Nepali Date Converter | AD to BS & BS to AD | Bishal Codes",
            description: "Convert English (AD) dates to Nepali (BS) dates and vice versa with precision.",
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
