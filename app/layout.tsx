import React from 'react';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Bishal Mishra | Full-Stack Web Developer & Free Developer APIs",
  description: "Hi, I'm Bishal Mishra. Explore my portfolio projects, read technical blogs, and get 100% free production API keys for developer utilities, OCR, Screenshot, and Currency APIs.",
  keywords: "Bishal Mishra, Bishal Codes, Free Developer APIs, Free Production API Key, Web Developer Nepal, Full Stack Developer, Next.js Expert, React Developer, UI/UX Designer, Free Currency API, Free Screenshot API, Free OCR API",
  authors: [{ name: "Bishal Mishra" }],
  alternates: {
    canonical: "https://bishalcodes.com/",
  },
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    type: "website",
    url: "https://bishalcodes.com/",
    title: "Bishal Mishra | Full-Stack Web Developer & Free Developer APIs",
    description: "Hi, I'm Bishal Mishra. Explore my portfolio projects, read technical blogs, and get 100% free production API keys for developer utilities, OCR, Screenshot, and Currency APIs.",
    images: [
      {
        url: "https://ik.imagekit.io/bishalc/desktop.png",
        width: 1200,
        height: 630,
      }
    ],
    siteName: "Bishal Codes",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@bishalmishra",
    creator: "@bishalmishra",
    title: "Bishal Mishra | Full-Stack Web Developer & Free Developer APIs",
    description: "Hi, I'm Bishal Mishra. Explore my portfolio projects, read technical blogs, and get 100% free production API keys for developer utilities, OCR, Screenshot, and Currency APIs.",
    images: ["https://ik.imagekit.io/bishalc/desktop.png"],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <meta name="google-site-verification" content="9UfBNUlB0bN6D8aODWOnvRyMp93nqwVzLWLNniUNpoo" />
        
        {/* Google AdSense ownership verification & client code */}
        <meta name="google-adsense-account" content="ca-pub-2257248018050891" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2257248018050891" crossOrigin="anonymous"></script>
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bishal Codes" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-navbutton-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="msapplication-navbutton-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />




        {/* Gemini API Key Shim */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__GEMINI_API_KEY__ = '${process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE'}';
          if (typeof window !== 'undefined') {
            try {
              window.process = window.process || {};
              window.process.env = window.process.env || {};
              window.process.env.API_KEY = '${process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE'}';
            } catch (e) {
              console.warn('Could not inject window.process.env.API_KEY shim:', e);
            }
          }
        `}} />

        {/* Structured JSON-LD Data Schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://bishalcodes.com/",
          "name": "Bishal Mishra Portfolio",
          "alternateName": "Bishal Codes",
          "description": "Premium Full-Stack Developer & 3D Web Architect Portfolio",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://bishalcodes.com/projects?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Bishal Mishra",
          "url": "https://bishalcodes.com/",
          "image": "https://ik.imagekit.io/bishalc/bishal.png",
          "sameAs": [
            "https://www.facebook.com/share/1AhoqK2XMo/",
            "https://www.instagram.com/bishalmishra9827?igsh=NHo2d2I5YTBmdms3",
            "https://www.tiktok.com/@bishal_mishra1?_r=1&_t=ZS-92jwosZwCW0",
            "https://www.linkedin.com/in/beesalmishra/",
            "https://github.com/Bishalkumarmishra/bishalcodes"
          ],
          "jobTitle": "Full-Stack Web Developer",
          "worksFor": {
            "@type": "Organization",
            "name": "Bishal Codes"
          },
          "description": "Expert Full-Stack Developer with 3+ years of experience in high-performance web engineering, Next.js, and 3D UI designs.",
          "knowsAbout": ["Web Development", "Next.js", "React", "TypeScript", "Shopify", "UI/UX Architecture", "Cloud Computing"],
          "alumniOf": "Tribhuvan University"
        }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": "Bishal Codes",
          "image": "https://ik.imagekit.io/bishalc/desktop.png",
          "@id": "https://bishalcodes.com/",
          "url": "https://bishalcodes.com/",
          "telephone": "+9779827801575",
          "priceRange": "$$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Bishal Codes Studio",
            "addressLocality": "Kathmandu",
            "addressRegion": "Bagmati",
            "postalCode": "44600",
            "addressCountry": "NP"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 27.7172,
            "longitude": 85.3240
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          }
        }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://bishalcodes.com/"
          },{
            "@type": "ListItem",
            "position": 2,
            "name": "About",
            "item": "https://bishalcodes.com/about"
          },{
            "@type": "ListItem",
            "position": 3,
            "name": "Projects",
            "item": "https://bishalcodes.com/projects"
          },{
            "@type": "ListItem",
            "position": 4,
            "name": "Blog",
            "item": "https://bishalcodes.com/blog"
          }]
        }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [{
            "@type": "Question",
            "name": "How long does a typical website project take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A standard informative website usually takes 7-14 days. Complex e-commerce platforms or custom web applications with advanced logic can take 4-8 weeks."
            }
          }, {
            "@type": "Question",
            "name": "What tech stack do you recommend for performance?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For maximum speed and SEO, I primarily use React/Next.js for the frontend and Node.js or PHP for the backend."
            }
          }, {
            "@type": "Question",
            "name": "How does the Rs. 999 booking slot work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Rs. 999 is a commitment deposit for serious clients. It includes a 30-minute consultancy and is fully adjusted into your final project quote."
            }
          }, {
            "@type": "Question",
            "name": "Do you offer post-launch support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, every project comes with a 1-year warranty. We also offer maintenance retainers for security and performance monitoring."
            }
          }, {
            "@type": "Question",
            "name": "Can you migrate my existing slow website?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. I specialize in rebuilding legacy sites using modern architecture for better performance and rankings."
            }
          }]
        }
        `}} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Bishal Codes Services",
          "description": "Premium technical services offered by Bishal Mishra.",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Service",
                "name": "UI/UX Architecture",
                "description": "Pixel-perfect, high-converting digital interfaces."
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Service",
                "name": "Full-Stack Development",
                "description": "Scalable web and mobile applications using modern stacks."
              }
            }
          ]
        }
        `}} />
      </head>
      <body className="bg-[#FFFFFF] selection:bg-indigo-500 selection:text-white">
        {/* Sky-Blue mobile status bar filler */}
        <div className="sky-status-bar" />
        {children}
      </body>
    </html>
  );
}
