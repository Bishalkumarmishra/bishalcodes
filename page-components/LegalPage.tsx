
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// @ts-ignore
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LegalPage as LegalPageType } from '../types';
import {
  Loader2, AlertCircle, Shield, FileText, Cookie, Trash2,
  ChevronRight, ArrowUp, Clock, Globe, CheckCircle, ExternalLink,
  Scale, Lock, Eye, Users, Mail, Phone, MapPin, ChevronDown
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface LegalPageProps {
  slug: string | null;
}

const PAGE_CONFIGS: Record<string, {
  icon: React.ReactNode;
  badge: string;
  accentFrom: string;
  accentTo: string;
  badgeBg: string;
  badgeText: string;
}> = {
  'terms-and-conditions': {
    icon: <Scale size={28} />,
    badge: 'Legal Agreement',
    accentFrom: '#4f46e5',
    accentTo: '#7c3aed',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
  },
  'privacy-policy': {
    icon: <Shield size={28} />,
    badge: 'Privacy & Data',
    accentFrom: '#0ea5e9',
    accentTo: '#6366f1',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-600 dark:text-sky-400',
  },
  'cookies-policy': {
    icon: <Cookie size={28} />,
    badge: 'Cookie Notice',
    accentFrom: '#f59e0b',
    accentTo: '#ef4444',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-600 dark:text-amber-400',
  },
  'data-deletion-request': {
    icon: <Trash2 size={28} />,
    badge: 'Data Rights',
    accentFrom: '#ef4444',
    accentTo: '#dc2626',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-600 dark:text-red-400',
  },
};

const DEFAULT_CONFIG = {
  icon: <FileText size={28} />,
  badge: 'Legal Document',
  accentFrom: '#64748b',
  accentTo: '#334155',
  badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
  badgeText: 'text-slate-600 dark:text-slate-400',
};

const PAGE_HIGHLIGHTS: Record<string, { icon: React.ReactNode; label: string; desc: string }[]> = {
  'terms-and-conditions': [
    { icon: <Globe size={16} />, label: 'Jurisdiction', desc: 'Nepal & International Law' },
    { icon: <CheckCircle size={16} />, label: 'Compliance', desc: 'GDPR & Nepal IT Act 2063' },
    { icon: <Scale size={16} />, label: 'Governing Law', desc: 'Nepal Government Policy' },
    { icon: <Lock size={16} />, label: 'AdSense', desc: 'Google Publisher Policy' },
  ],
  'privacy-policy': [
    { icon: <Shield size={16} />, label: 'Data Protection', desc: 'GDPR & Nepal Privacy Law' },
    { icon: <Eye size={16} />, label: 'Transparency', desc: 'Full Data Disclosure' },
    { icon: <Lock size={16} />, label: 'Security', desc: 'AES-256 Encryption' },
    { icon: <Users size={16} />, label: 'Your Rights', desc: 'Access, Edit & Delete' },
  ],
  'cookies-policy': [
    { icon: <Cookie size={16} />, label: 'Cookie Types', desc: 'Essential, Analytics, Ads' },
    { icon: <CheckCircle size={16} />, label: 'Consent', desc: 'GDPR & ePrivacy Compliant' },
    { icon: <Globe size={16} />, label: 'Third Parties', desc: 'Google Analytics & AdSense' },
    { icon: <Lock size={16} />, label: 'Control', desc: 'Opt-Out Options Available' },
  ],
  'data-deletion-request': [
    { icon: <Trash2 size={16} />, label: 'Right to Erasure', desc: 'GDPR Article 17' },
    { icon: <Clock size={16} />, label: 'Response Time', desc: 'Within 30 Days' },
    { icon: <CheckCircle size={16} />, label: 'Verification', desc: 'Identity Check Required' },
    { icon: <Mail size={16} />, label: 'Contact', desc: 'developer@bishalcodes.com' },
  ],
};

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const lines = markdown.split('\n');
  const headings: { id: string; text: string; level: number }[] = [];
  lines.forEach(line => {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      headings.push({ id, text, level });
    }
  });
  return headings;
}


// ─── Professional fallback content ────────────────────────────────────────────
// Used when Firebase doc is empty. Fully compliant with:
//   Nepal Electronic Transaction Act 2063 | Individual Privacy Act 2075 | GDPR | Google AdSense Policies
const FALLBACK_CONTENT: Record<string, string> = {

  'terms-and-conditions': `
## Overview

These Terms and Conditions govern your access to and use of **bishalcodes.com** and all associated services, tools, and digital products offered by Bishal Codes. By visiting or using this website, you confirm that you have read, understood, and agreed to be bound by these terms.

If you do not agree with any part of these Terms, please discontinue use of the website immediately. We reserve the right to update these terms at any time, and continued use of the site after any changes constitutes your acceptance of the revised terms.

## About Bishal Codes

Bishal Codes is a professional web development and digital services platform founded and operated by **Bishal Kumar Mishra**, based in Nepal. We specialize in building high-performance websites, web applications, and developer utility tools for clients and users across Nepal and internationally.

Our platform provides free developer tools — including a Nepali Date Converter, Currency Converter, QR Code Studio, File Transfer, AI Assistant, and more — alongside a professional portfolio, technical blog articles, and paid web development services. We are committed to providing reliable, fast, and accessible digital experiences to every user.

- **Business Name:** Bishal Codes
- **Owner:** Bishal Kumar Mishra
- **Country:** Nepal
- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Website:** https://bishalcodes.com

## 1. Acceptance of Terms

By accessing bishalcodes.com, you confirm that you are at least 13 years of age, that you have the legal capacity to enter into a binding agreement, and that you agree to comply with these Terms and all applicable laws and regulations, including those of Nepal.

If you are using this website on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

## 2. Services Provided

Bishal Codes offers the following services through bishalcodes.com:

- **Free Developer Tools** — Online utilities including Nepali Date Converter, Currency Converter, QR Code Studio, AI Summarizer, Code Runner, Image Compressor, PDF tools, and more.
- **Portfolio & Project Showcase** — Presentation of past development work, case studies, and project documentation.
- **Technical Blog** — Original articles, tutorials, and guides related to web development, programming, and technology.
- **Web Development Services** — Custom website and web application development for clients, offered on a contract or freelance basis.
- **File Transfer & Secure Vault** — Peer-to-peer file transfer and AES-256 encrypted file sharing tools.
- **AI Studio** — Experimental AI-powered tools for productivity and automation.

All free tools are provided as-is, on a best-effort basis. Paid services are governed by separate agreements or contracts signed with each client.

## 3. User Responsibilities

When using bishalcodes.com, you agree to:

- Use the website and its tools only for lawful purposes and in accordance with these Terms.
- Not attempt to reverse engineer, copy, scrape, or republish any proprietary content or software from this website without explicit written permission.
- Not use any tool or feature on this website to store, transmit, or distribute illegal, harmful, defamatory, obscene, or infringing content.
- Not interfere with or disrupt the integrity, performance, or security of the website or its underlying infrastructure.
- Not use automated bots, crawlers, or scrapers against this website in a manner that imposes an unreasonable load on our servers.
- Provide accurate and truthful information when submitting contact forms, service requests, or client project inquiries.

## 4. Intellectual Property

All content on bishalcodes.com — including but not limited to text, graphics, logos, icons, images, software code, and design layouts — is the exclusive intellectual property of Bishal Kumar Mishra / Bishal Codes, unless otherwise attributed.

You may view and print individual pages for personal, non-commercial reference, and share links to our content with proper attribution. You may **not** reproduce, redistribute, or resell any content without express written permission, use our brand name or logo without authorization, or claim ownership of our original content.

## 5. Third-Party Services & Advertising

This website uses the following third-party services:

- **Google Analytics** — To analyze website traffic and user behavior in aggregate, anonymized form.
- **Google AdSense** — To serve relevant advertisements. Google may use cookies and browsing data to personalize ads shown to you.
- **Firebase (Google)** — For database, authentication, and content management.
- **ImageKit** — For optimized image delivery.

All third-party services operate under their own terms and privacy policies. We comply with all **Google AdSense Publisher Policies** and **Google Pay monetization guidelines**.

## 6. Disclaimers & Limitation of Liability

The tools, content, and information on bishalcodes.com are provided **"as is"** without warranties of any kind. While we strive for accuracy and reliability, we make no guarantees that the website will be available uninterrupted or error-free, or that any tool will produce results that are 100% accurate for all use cases.

To the maximum extent permitted by law, Bishal Codes shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of this website or its tools.

## 7. Governing Law & Jurisdiction

These Terms and Conditions are governed by the laws of **Nepal**, including the Nepal Electronic Transaction Act, 2063 (2008), Nepal Contract Act, 2056 (2000), and Nepal Consumer Protection Act, 2075 (2018). Any unresolved disputes shall be subject to the exclusive jurisdiction of the courts of Nepal.

## 8. Changes to These Terms

We may update these Terms at any time. When we make significant changes, we will update the **"Last Updated"** date at the top of this page. Your continued use of bishalcodes.com after any changes constitutes your acceptance of the new Terms.

## 9. Contact Us

- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Address:** Nepal
- **Business Hours:** Sunday – Friday, 9:00 AM – 6:00 PM (Nepal Standard Time, NPT UTC+5:45)
`,

  'privacy-policy': `
## Overview

At Bishal Codes, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit **bishalcodes.com** and use our services.

We believe that privacy is a fundamental right. We are committed to being fully transparent about our data practices, giving you control over your personal information, and never selling your data to third parties. This policy is written in plain, simple language so that anyone — not just lawyers — can understand exactly how we handle your data.

This policy is compliant with the **Nepal Individual Privacy Act, 2075 (2018)**, the **Nepal Electronic Transaction Act, 2063 (2008)**, and the **EU General Data Protection Regulation (GDPR)**.

## About Bishal Codes

Bishal Codes is a web development and digital services platform operated by **Bishal Kumar Mishra** in Nepal. We serve users across Nepal and internationally through our website at bishalcodes.com.

As the data controller for bishalcodes.com, we are responsible for the personal data we collect and process. If you have any questions or concerns about your data, you can contact us directly at any time.

- **Data Controller:** Bishal Kumar Mishra (Bishal Codes)
- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Country:** Nepal

## 1. What Information We Collect

We collect two types of information: information you provide to us directly, and information collected automatically when you use our website.

### Information You Provide Directly

- **Contact form submissions** — Your name, email address, and message content when you reach out to us.
- **Service inquiries** — Project details, contact information, and budget information when requesting web development services.
- **Report Problem submissions** — Description of the issue and your contact email.
- **Admin account** — Email address and authentication tokens (for site administrators only).

### Information Collected Automatically

- **Usage data** — Pages visited, time spent, buttons clicked, and features used (via Google Analytics, anonymized).
- **Device and browser data** — Browser type, operating system, screen resolution, and device type.
- **IP address** — Collected by our hosting and CDN services (anonymized where possible).
- **Cookies** — See our Cookie Policy for full details.

### Information We Do NOT Collect

- We do not collect payment card details (all payments are processed by third-party gateways).
- We do not collect government ID numbers, national IDs, or sensitive personal data.
- We do not build behavioral profiles or track you across other websites beyond standard Google Analytics.

## 2. How We Use Your Information

We use the information we collect only for the following purposes:

- **To provide our services** — Responding to your inquiries, delivering project proposals, and fulfilling web development contracts.
- **To improve our website** — Analyzing usage patterns to make tools faster and more useful.
- **To show relevant advertisements** — Google AdSense uses cookies to serve ads relevant to your interests. You can opt out at [Google's Ad Settings](https://adssettings.google.com/).
- **To maintain security** — Detecting and preventing fraud, abuse, or unauthorized access.
- **To comply with legal obligations** — Responding to lawful requests from government authorities in Nepal or internationally, if required.

We will never sell or rent your personal data to any third party, use your data for automated decision-making that significantly affects your rights, or send you unsolicited marketing emails without your explicit consent.

## 3. Third-Party Services

We use trusted third-party services to operate bishalcodes.com:

- **Google Analytics** ([Privacy Policy](https://policies.google.com/privacy)) — Tracks anonymized usage data to help us understand how visitors use the site.
- **Google AdSense** ([Privacy Policy](https://policies.google.com/privacy)) — Displays targeted advertisements based on your browsing activity.
- **Firebase by Google** ([Privacy Policy](https://firebase.google.com/support/privacy)) — Powers our database, user authentication, and content management.
- **ImageKit** — Serves optimized images via a global CDN.
- **Vercel** — Hosts and delivers the website globally.

## 4. Your Rights

Under Nepal's Individual Privacy Act 2075 and GDPR, you have the following rights regarding your personal data:

- **Right to Access** — You can request a copy of all personal data we hold about you.
- **Right to Correction** — You can ask us to correct any inaccurate or incomplete data.
- **Right to Erasure** — You can request permanent deletion of your personal data. See our Data Deletion Request page.
- **Right to Restriction** — You can ask us to limit how we process your data in certain circumstances.
- **Right to Object** — You can object to our processing of your data for specific purposes such as marketing.
- **Right to Data Portability** — You can request your data in a structured, machine-readable format.

To exercise any of these rights, email us at **developer@bishalcodes.com**. We will respond within **30 days**.

## 5. Data Retention

We retain personal data only for as long as necessary:

- **Contact form data** — Retained for up to 2 years, then permanently deleted.
- **Analytics data** — Retained for 26 months (Google Analytics default), then automatically deleted.
- **Server logs** — Retained for up to 90 days for security purposes.
- **Admin authentication data** — Retained for the duration of the admin account and deleted upon account closure.

## 6. Data Security

We implement appropriate technical and organizational measures to protect your data:

- All data transmitted to and from bishalcodes.com is encrypted using **HTTPS/TLS**.
- Firebase database access is restricted by strict security rules.
- Our Secure Vault tool uses **AES-256-GCM encryption** — passwords never leave your browser.
- We conduct regular security reviews and keep all dependencies up to date.

No method of electronic transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security against all possible threats.

## 7. Children's Privacy

bishalcodes.com is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete it promptly.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. The **"Last Updated"** date at the top of this page will be revised accordingly.

## 9. Contact Us

- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Address:** Nepal
- **Response Time:** Within 30 days of receiving your request
`,

  'cookies-policy': `
## Overview

This Cookie Policy explains how **Bishal Codes** (bishalcodes.com) uses cookies and similar tracking technologies when you visit our website. We want to be fully transparent about what cookies we use, why we use them, and how you can control them.

Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how visitors use the site, and deliver relevant content and advertising. By using bishalcodes.com, you consent to our use of cookies as described in this policy.

This policy is compliant with the **EU ePrivacy Directive (Cookie Law)**, **GDPR**, **Nepal Individual Privacy Act 2075**, and **Google's AdSense & Analytics Policies**.

## About Bishal Codes

Bishal Codes is a web development platform and digital tools provider operated by **Bishal Kumar Mishra** in Nepal. Our website uses cookies to deliver a better, faster, and more personalized experience to every visitor.

If you have questions about how we use cookies, contact us at **developer@bishalcodes.com**.

## 1. What Are Cookies?

A cookie is a small file that a website stores on your browser or device. When you revisit the site, the browser sends the cookie back to the server, allowing the site to recognize your browser and remember information about your visit.

Cookies can be **session cookies** (temporary, deleted when you close your browser), **persistent cookies** (stored on your device for a set period), **first-party cookies** (set by bishalcodes.com directly), or **third-party cookies** (set by external services like Google that we use on our site).

## 2. Cookies We Use

### Essential Cookies

These cookies are strictly necessary for the website to function. Without them, certain features would not work. They do not require consent.

| Cookie | Purpose | Duration |
|---|---|---|
| __session | Firebase authentication session | Session |
| theme | Remembers your light/dark theme preference | 1 year |

### Analytics Cookies (Google Analytics)

We use **Google Analytics** to understand how visitors use our website — which pages are most popular, how long visitors stay, and where they come from. All data is aggregated and anonymized; we cannot identify individual users.

| Cookie | Purpose | Duration |
|---|---|---|
| _ga | Distinguishes unique users | 2 years |
| _gid | Distinguishes users (short-term) | 24 hours |
| _ga_* | Maintains session state | 2 years |

You can opt out of Google Analytics at any time using the [Google Analytics Opt-Out Browser Add-on](https://tools.google.com/dlpage/gaoptout).

### Advertising Cookies (Google AdSense)

We use **Google AdSense** to display advertisements on our website. Google and its partners use cookies to serve ads based on your browsing history and interests across the web. This helps us keep our free tools free to use.

| Cookie | Purpose | Duration |
|---|---|---|
| IDE | Used by Google to display personalized ads | 1 year |
| DSID | Identifies signed-in Google users for ads | 2 weeks |
| test_cookie | Checks if your browser supports cookies | 15 minutes |

You can control personalized advertising through [Google's Ad Settings](https://adssettings.google.com/) or opt out via the [Network Advertising Initiative](https://optout.networkadvertising.org/).

## 3. How to Manage Cookies

You have full control over cookies. Most browsers allow you to view, delete, and block cookies through their settings:

- **Chrome:** Settings → Privacy and Security → Cookies and other site data
- **Firefox:** Options → Privacy & Security → Cookies and Site Data
- **Safari:** Preferences → Privacy → Manage Website Data
- **Edge:** Settings → Privacy, Search, and Services → Cookies

Note: Blocking all cookies may prevent some features of bishalcodes.com from working correctly.

### Google-Specific Opt-Outs

- **Google Analytics:** [Opt-Out Add-on](https://tools.google.com/dlpage/gaoptout)
- **Google Ads Personalization:** [Ad Settings](https://adssettings.google.com/)
- **Google Privacy Controls:** [myaccount.google.com](https://myaccount.google.com/privacy)

## 4. Third-Party Cookie Policies

Since we use third-party services, those providers may also set cookies subject to their own policies:

- [Google Privacy Policy](https://policies.google.com/privacy)
- [Google AdSense Policies](https://support.google.com/adsense/answer/48182)
- [Firebase Privacy Policy](https://firebase.google.com/support/privacy)

## 5. Changes to This Policy

We may update this Cookie Policy from time to time. When we do, we will update the **"Last Updated"** date on this page.

## 6. Contact Us

- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Address:** Nepal
`,

  'data-deletion-request': `
## Overview

At Bishal Codes, we believe that your personal data belongs to you. If you would like us to permanently delete any personal information we hold about you, you can submit a Data Deletion Request at any time.

This process is fully compliant with your rights under the **Nepal Individual Privacy Act, 2075 (2018)**, the **Nepal Electronic Transaction Act, 2063 (2008)**, and the **EU General Data Protection Regulation (GDPR) — Article 17: Right to Erasure ("Right to be Forgotten")**.

We take every deletion request seriously and are committed to processing it within **30 days** of verification.

## About Bishal Codes

Bishal Codes is a web development and digital tools platform operated by **Bishal Kumar Mishra** in Nepal. As the data controller for bishalcodes.com, we are responsible for the personal data stored on our platform and are committed to honoring your privacy rights.

- **Data Controller:** Bishal Kumar Mishra (Bishal Codes)
- **Email:** developer@bishalcodes.com
- **Phone:** +977 9828701575
- **Response Time:** Within 30 days

## 1. What Data Can Be Deleted?

You can request the permanent deletion of any personal data we hold about you, including:

- **Contact form submissions** — Your name, email address, and message history stored from form submissions.
- **Service inquiry records** — Project details and correspondence submitted through our contact or inquiry forms.
- **Report Problem submissions** — Issue descriptions and contact details submitted via the report feature.
- **Admin account data** — If you have an administrator account, all associated account data including email address and authentication records.
- **Analytics association** — We can submit a data deletion request to Google Analytics on your behalf.

### What Cannot Be Deleted

Certain data cannot be deleted if required by law or legitimate business needs:

- **Financial transaction records** — Nepal tax regulations require us to retain billing records for a minimum of 5 years.
- **Security logs** — Short-term server logs required to protect against fraud and abuse.
- **Anonymized analytics data** — Data that has already been fully anonymized cannot be identified or deleted, as it is no longer personal data.

## 2. How to Submit a Deletion Request

### Method 1: Email Request (Recommended)

Send an email to **developer@bishalcodes.com** with the subject line:

> **Data Deletion Request — [Your Name or Email]**

Please include your full name as provided to us, the email address associated with your data, a description of what data you want deleted, and your preferred method of confirmation.

### Method 2: Phone Request

Call us at **+977 9828701575** (Sunday – Friday, 9:00 AM – 6:00 PM Nepal Standard Time) and request a Data Deletion. We will guide you through the verification process.

## 3. Verification Process

To protect your privacy and prevent unauthorized deletion requests, we will verify your identity before processing any deletion. This typically involves email verification from the same address associated with your data, and in some cases a follow-up confirmation question.

We will never delete your data based on an unverified request, as this could itself be a privacy violation.

## 4. Processing Timeline

| Step | Timeline |
|---|---|
| Request received | Day 0 |
| Identity verification | Within 5 business days |
| Data deletion executed | Within 30 days of verification |
| Deletion confirmation sent | Same day as deletion |

If we are unable to fulfill your request (e.g., due to a legal obligation to retain the data), we will inform you in writing within the 30-day period and explain the reason.

## 5. After Deletion

Once your data is deleted, we will send you a written confirmation via email. Any backup copies of your data will be purged during the next scheduled backup rotation (within 90 days). Anonymized or aggregated data derived from your usage — which cannot be linked back to you — may be retained.

## 6. Data Deletion for Third-Party Services

bishalcodes.com uses third-party services that may hold their own copies of your data. While we will submit deletion requests on your behalf where possible, you may also need to exercise your rights directly with:

- **Google Analytics:** [Delete your data](https://support.google.com/analytics/answer/6366371)
- **Google AdSense:** [Google Privacy Controls](https://myaccount.google.com/privacy)
- **Firebase:** Your authentication data can be deleted via [myaccount.google.com](https://myaccount.google.com/)

## 7. Your Rights Under Law

Under the **Nepal Individual Privacy Act, 2075** and **GDPR Article 17**, you have the right to request deletion of your personal data when:

- The data is no longer necessary for the purposes for which it was collected.
- You withdraw consent on which the processing was based.
- You object to the processing and there are no overriding legitimate grounds.
- The personal data has been processed unlawfully.
- The personal data must be deleted to comply with a legal obligation.

## 8. Contact Us

- **Email:** developer@bishalcodes.com *(Fastest response)*
- **Phone:** +977 9828701575
- **Business Hours:** Sunday – Friday, 9:00 AM – 6:00 PM (Nepal Standard Time)
- **Response Guarantee:** We will acknowledge your request within 5 business days and complete processing within 30 days.
`,

};

const LegalPage: React.FC<LegalPageProps> = ({ slug }) => {
  const { navigate } = useNavigation();
  const [legalDoc, setLegalDoc] = useState<LegalPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const config = slug ? (PAGE_CONFIGS[slug] || DEFAULT_CONFIG) : DEFAULT_CONFIG;
  const highlights = slug ? (PAGE_HIGHLIGHTS[slug] || []) : [];

  useEffect(() => {
    const fetchLegalDocument = async () => {
      if (!slug) {
        setError('Legal document not specified.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setLegalDoc(null);
      try {
        const docRef = doc(db, 'legalPages', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...(docSnap.data() as any) } as LegalPageType;
          setLegalDoc(data);
          document.title = data.seoTitle || data.title + ' | Bishal Codes';
          let metaTag = document.querySelector('meta[name="description"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'description');
            document.head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', data.seoDescription || data.content.substring(0, 160) + '...');
        } else {
          setError(`Legal document "${slug}" not found.`);
        }
      } catch (err) {
        console.warn('Error fetching legal document:', err);
        setError('Failed to load legal document. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLegalDocument();
    return () => {
      document.title = 'Bishal Mishra | Full-Stack Web Developer & Designer Portfolio';
      const metaTag = document.querySelector('meta[name="description"]');
      if (metaTag) {
        metaTag.setAttribute('content', "Hi, I'm Bishal Mishra. I build fast, clean, and interactive websites and web applications.");
      }
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      if (!contentRef.current) return;
      const headingEls = contentRef.current.querySelectorAll('h1[id], h2[id], h3[id]');
      let current = '';
      headingEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = el.id;
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [legalDoc]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setTocOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: `linear-gradient(135deg, ${config.accentFrom}, ${config.accentTo})` }}
          >
            <Loader2 className="animate-spin text-white" size={28} />
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-slate-100 font-semibold text-base">Loading document…</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Fetching legal content securely</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !legalDoc) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500" size={36} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Document Not Found</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
              {error || 'The requested legal document could not be retrieved. It may have been moved or is temporarily unavailable.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('home')}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
              >
                Return Home
              </button>
              <a
                href="mailto:developer@bishalcodes.com"
                className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const activeContent = (legalDoc.content && legalDoc.content.trim().length > 50)
    ? legalDoc.content
    : (slug ? FALLBACK_CONTENT[slug] : legalDoc.content) || legalDoc.content;

  const headings = extractHeadings(activeContent);

  const formatDate = (val: any): string => {
    if (!val) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (typeof val === 'string') return val;
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const lastUpdated = formatDate((legalDoc as any).updatedAt);
  const effectiveDate = (legalDoc as any).effectiveDate || lastUpdated;

  const otherPages = [
    { slug: 'terms-and-conditions', label: 'Terms and Conditions' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'cookies-policy', label: 'Cookie Policy' },
    { slug: 'data-deletion-request', label: 'Data Deletion Request' },
  ].filter(p => p.slug !== slug);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 font-sans">
      <Navbar />

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <header className="relative pt-24 pb-12 overflow-hidden border-b border-slate-100 dark:border-slate-900">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-[0.05] dark:opacity-[0.10] blur-3xl pointer-events-none rounded-full"
          style={{ background: `radial-gradient(ellipse, ${config.accentFrom}, transparent 70%)` }}
        />
        <div className="relative w-full px-5 md:px-10 lg:px-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-600 mb-6 flex-wrap">
            <button onClick={() => navigate('home')} className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-medium">Home</button>
            <ChevronRight size={12} />
            <span className="font-medium">Legal</span>
            <ChevronRight size={12} />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{legalDoc.title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${config.accentFrom}, ${config.accentTo})` }}
            >
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText} mb-3`}>
                <CheckCircle size={11} />
                {config.badge}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 leading-tight">
                {legalDoc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  Last Updated: <strong className="ml-1 text-slate-700 dark:text-slate-200 font-semibold">{lastUpdated}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-500" />
                  Effective: <strong className="ml-1 text-slate-700 dark:text-slate-200 font-semibold">{effectiveDate}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe size={13} />
                  Applies to: <strong className="ml-1 text-slate-700 dark:text-slate-200 font-semibold">bishalcodes.com</strong>
                </span>
              </div>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                  <span className="text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0">{h.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-0.5">{h.label}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="w-full px-5 md:px-10 lg:px-16 py-10 md:py-14 flex gap-12">

        {/* Sidebar TOC */}
        {headings.length > 0 && (
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-3">Contents</p>
              <nav className="space-y-0.5">
                {headings.map(h => (
                  <button
                    key={h.id}
                    onClick={() => scrollToSection(h.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border-l-2 ${
                      activeSection === h.id
                        ? 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    } ${h.level === 3 ? 'pl-6' : ''}`}
                  >
                    {h.text}
                  </button>
                ))}
              </nav>

              <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Have questions?</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mb-3 leading-relaxed">Contact us about any legal or privacy concern.</p>
                <a href="mailto:developer@bishalcodes.com" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-1.5">
                  <Mail size={11} /> developer@bishalcodes.com
                </a>
                <a href="tel:+9779828701575" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-1.5">
                  <Phone size={11} /> +977 9828701575
                </a>
                <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                  <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                  Nepal (Company Act 2063)
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Article */}
        <div className="flex-1 min-w-0">
          {/* Mobile TOC */}
          {headings.length > 0 && (
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2"><FileText size={14} /> Table of Contents</span>
                <ChevronDown size={16} className={`transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
              </button>
              {tocOpen && (
                <div className="mt-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-0.5">
                  {headings.map(h => (
                    <button
                      key={h.id}
                      onClick={() => scrollToSection(h.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        activeSection === h.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      } ${h.level === 3 ? 'pl-7' : ''}`}
                    >
                      {h.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compliance banner */}
          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">Legally Compliant Document</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                This document complies with the <strong>Nepal Electronic Transaction Act 2063</strong>, <strong>Nepal Individual Privacy Act 2075</strong>, <strong>GDPR (EU 2016/679)</strong>,{' '}
                <a href="https://support.google.com/adsense/answer/48182" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-0.5">
                  Google AdSense Policies <ExternalLink size={10} />
                </a>, and{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 inline-flex items-center gap-0.5">
                  Google Privacy Policy <ExternalLink size={10} />
                </a>.
              </p>
            </div>
          </div>

          {/* Markdown */}
          <div ref={contentRef} className="legal-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              // react-markdown v9 uses hast-util-to-jsx-runtime Components type;
              // casting to `any` is the standard workaround for custom renderers.
              components={{
                h1: ({ children }: any) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                  return (
                    <h1 id={id} className="text-2xl md:text-[1.75rem] font-bold text-slate-900 dark:text-white mt-10 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 scroll-mt-24">
                      {children}
                    </h1>
                  );
                },
                h2: ({ children }: any) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                  return (
                    <h2 id={id} className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-3 scroll-mt-24">
                      {children}
                    </h2>
                  );
                },
                h3: ({ children }: any) => {
                  const text = String(children);
                  const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                  return (
                    <h3 id={id} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2 scroll-mt-24">
                      {children}
                    </h3>
                  );
                },
                p: ({ children }: any) => (
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }: any) => (
                  <ul className="my-4 space-y-2 pl-0 list-none">{children}</ul>
                ),
                ol: ({ children }: any) => (
                  <ol className="my-4 space-y-2 pl-5 list-decimal marker:text-slate-400 dark:marker:text-slate-600">{children}</ol>
                ),
                li: ({ children }: any) => (
                  <li className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="mt-1.5 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                    </span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                a: ({ children, href }: any) => (
                  <a
                    href={href}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 decoration-indigo-300 dark:decoration-indigo-700 hover:decoration-indigo-600 dark:hover:decoration-indigo-400 transition-all inline-flex items-center gap-0.5"
                  >
                    {children}
                    {href?.startsWith('http') && <ExternalLink size={11} className="ml-0.5 opacity-60 flex-shrink-0" />}
                  </a>
                ),
                strong: ({ children }: any) => (
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
                ),
                em: ({ children }: any) => (
                  <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
                ),
                blockquote: ({ children }: any) => (
                  <blockquote className="my-5 pl-4 border-l-4 border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 py-3 pr-4 rounded-r-xl">
                    <div className="text-sm text-indigo-800 dark:text-indigo-300 italic leading-relaxed">{children}</div>
                  </blockquote>
                ),
                code: ({ children }: any) => (
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono border border-slate-200 dark:border-slate-700">
                    {children}
                  </code>
                ),
                hr: () => <hr className="my-8 border-slate-100 dark:border-slate-800" />,
                table: ({ children }: any) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }: any) => (
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    {children}
                  </th>
                ),
                td: ({ children }: any) => (
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/50">
                    {children}
                  </td>
                ),
              } as any}
            >
              {activeContent}
            </ReactMarkdown>
          </div>

          {/* Bottom cards */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Contact */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Mail size={15} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Questions & Concerns</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed mb-4">
                  For any questions about this document or our legal practices, contact us directly.
                </p>
                <div className="space-y-2">
                  <a href="mailto:developer@bishalcodes.com" className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Mail size={12} /> developer@bishalcodes.com
                  </a>
                  <a href="tel:+9779828701575" className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Phone size={12} /> +977 9828701575
                  </a>
                  <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-500">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    Bishal Codes, Nepal — Registered under Nepal Company Act 2063
                  </p>
                </div>
              </div>

              {/* Related legal pages */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={15} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Other Legal Documents</h3>
                </div>
                <ul className="space-y-2">
                  {otherPages.map(p => (
                    <li key={p.slug}>
                      <button
                        onClick={() => navigate('legal-page', p.slug)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <ChevronRight size={12} />
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Compliance footer note */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
              <p className="text-xs text-slate-400 dark:text-slate-600 leading-relaxed text-center">
                bishalcodes.com complies with Nepal's{' '}
                <a href="https://www.lawcommission.gov.np/en/wp-content/uploads/2020/09/Electronic-Transaction-Act-2063-2008.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Electronic Transaction Act 2063</a>,{' '}
                <a href="https://www.lawcommission.gov.np/en/wp-content/uploads/2021/08/individual-privacy-act-2075.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Individual Privacy Act 2075</a>,{' '}
                <a href="https://gdpr-info.eu/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">EU GDPR</a>,{' '}
                <a href="https://support.google.com/adsense/answer/48182" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google AdSense Policies</a>, and{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      <Footer />
    </div>
  );
};

export default LegalPage;