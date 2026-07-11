import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigation } from '../context/NavigationContext';
import { Search, BookOpen, User, Briefcase, Cpu, HelpCircle, AlertCircle, ChevronRight, ExternalLink, X } from 'lucide-react';
// @ts-ignore
import { getDoc, doc, updateDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

interface DocSection {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
}

const initialDocSections: DocSection[] = [
  {
    id: 'developer-utilities',
    title: 'Developer Utilities & Browser Tools',
    category: 'Developer Utilities & Tools',
    keywords: ['pdf', 'converter', 'tools', 'utilities', 'translator', 'date', 'currency', 'compressor', 'emi', 'qr', 'json', 'diff', 'code runner', 'font downloader', 'ocr', 'image to text', 'background remover', 'bg remover', 'scan to pdf', 'camscanner', 'document scanner'],
    content: `
The Developer Services dashboard hosts a comprehensive suite of high-performance utility tools. To ensure absolute data confidentiality, **all file-processing and calculations run 100% client-side** inside your browser using modern APIs (Canvas, WebAssembly, and local JS libraries). Your files and data are never sent to external servers.

---

### Core Service Specifications

#### 1. Nepali Date Converter (AD ↔ BS)
- **Engine**: Local Bikram Sambat conversion library.
- **Capabilities**: Converts Gregorian (AD) dates to Nepali Bikram Sambat (BS) and vice-versa. Provides details on leap year status, lunar cycles, and monthly day structures.
- **Security**: Runs completely offline in the local sandbox.

#### 2. USD Currency Converter
- **Engine**: REST API for real-time exchange rates (updated hourly).
- **Capabilities**: Converts USD into NPR, INR, PKR, and 20+ other global currencies with historical rate estimation.
- **Use Case**: Quote calculations, international payment estimates, and freelance rate analysis.

#### 3. Language Translator
- **Engine**: Secure external translation services.
- **Capabilities**: Translates text dynamically between English, Nepali, Hindi, Chinese, and European languages. Includes text-to-speech audio rendering.

#### 4. AI Document Summarizer
- **Engine**: Secure streaming API to Google Gemini 1.5 Flash.
- **Capabilities**: Analyzes uploaded PDF documents, books, and long research papers to compile structured abstracts, lists of core takeaways, and brief summaries.

#### 5. Smart Image Compressor
- **Engine**: Browser-based Canvas API resizer.
- **Capabilities**: Compresses JPG, PNG, and WebP images to a user-defined target file size (e.g., under 100 KB, 200 KB) with zero quality loss.
- **Security**: Local client-side processing guarantees photo privacy.

#### 6. QR Code Studio
- **Engine**: JavaScript QR library and local MediaDevices API.
- **Capabilities**: Generates branded QR codes with logo overlays and custom foreground/background colors. Scans barcodes and QR codes in real-time using webcam feeds.

#### 7. JSON Formatter & Tree Viewer
- **Engine**: Local JSON parser and recursive DOM renderer.
- **Capabilities**: Formats, minifies, and validates raw JSON strings. Visualizes nested nodes recursively with a collapsible tree directory.

#### 8. Instant Text Diff Checker
- **Engine**: Local line/character diff algorithm.
- **Capabilities**: Computes line differences between two text templates side-by-side or inline, utilizing synchronized scrolling.

#### 9. HTML, CSS & JS Code Runner
- **Engine**: Isolated iframe sandbox environment.
- **Capabilities**: Edit and run frontend web code in real-time. Features editor tabs, log consoles, and immediate visual rendering previews.

#### 10. Fast File Transfer
- **Engine**: Secure WebRTC Peer-to-Peer (P2P) direct connection with local browser history and IndexedDB binary caching.
- **Capabilities**: 
  - **Direct P2P Sharing**: Share files and folders up to **100 GB** directly browser-to-browser.
  - **Local Link History**: Retains the last 10 generated transfer links in browser storage, allowing you to copy, re-share, or manage your links easily.
  - **IndexedDB Binary Caching**: File transfers under **150 MB** are automatically cached as native binary Blobs in the browser's database. This allows you to close the page and instantly **Re-activate** and host the original download link the next day **without re-uploading or re-selecting files**!
  - **Re-activation Zone**: For files larger than 150 MB, the tool provides a quick re-activation drop-zone where dropping the file re-hosts the original download link.
  - **Real-time Status Syncing**: Recipient pages update in real-time to show whether the sender is online or offline, dynamically blocking/enabling downloads to prevent connection failures.
  - **Email Notification**: Supports sending download links and automated notifications directly via email.
- **File Transfer Limits Comparison Table**:
  Below is a comparison of transfer limits for popular file sharing tools to help you choose the best tool for your needs:

  | File Transfer Tool | Free Size Limit | Paid/Premium Limit | Best Use Case |
  | :--- | :--- | :--- | :--- |
  | **BishalTransfer (P2P)** | **100 GB** | 100% Free | Secure, high-speed direct browser-to-browser sharing of huge datasets without uploads |
  | **Bishal Secure Vault** | **500 MB** | 100% Free | Zero-knowledge encrypted files stored in cloud with password-protected expiry links |
  | **WeTransfer** | **3 GB** | Up to 1 TB | Quick email shares of medium files with temporary cloud hosting |
  | **Send Anywhere** | **10 GB** (Web/App) | Up to 30 GB | High-volume temporary shares via 6-digit key or link |
  | **Wormhole** | **5 GB** (Server) / **10 GB** (P2P) | N/A | End-to-end encrypted sharing with instant link generation |
  | **Smash** | **2 GB** (Priority) / Unlimited (Queued) | Up to 1 TB | Sending very large files without speed priority on free tier |
  | **Google Drive** | **15 GB** (Total Storage) | Up to 5 TB per file | Long-term cloud storage, collaboration, and persistent document sharing |
  | **Dropbox** | **2 GB** (Total Storage) | Up to 50 GB per file | File syncing, workspace collaboration, and professional link transfer |
  | **Mega** | **20 GB** (Total Storage) | Up to 16 TB | Encrypted cloud storage with generous free space, but limited download bandwidth |

- **Security**: Files are encrypted during transit and deleted automatically after expiration. P2P transfers are 100% direct and never touch or store data on external cloud servers, guaranteeing absolute privacy.

#### 11. Website Screenshot Studio
- **Engine**: Headless rendering pipeline.
- **Capabilities**: Captures high-resolution, full-page scrolling screenshots of any public website. Emulates multiple device viewports (desktop, mobile, tablet) and outputs standard PNG/JPG files.

#### 12. Secure Vault
- **Engine**: Local Web Crypto API (AES-256-GCM + PBKDF2) & Supabase Storage.
- **Capabilities**: Password-protects any file type up to 500 MB. Generates a secure shareable link and customized QR code. 
- **Security**: Zero-knowledge encryption. The password never leaves the browser. Encrypted file binary is uploaded directly to Supabase storage, subject to configurable download limits and expiration.

#### 13. Developer Card & OG Banner Studio
- **Engine**: Local HTML5 Canvas & scalable offscreen render clone with Pointer event listeners.
- **Capabilities**: Generates social cards (OG image, LinkedIn cover, Twitter header, YouTube banner, Instagram post) at 3x scale. Supports 10 customizable designer layouts, dynamic drag-and-drop element visual positioning, and real-time custom font/color presets.
- **Security**: 100% client-side. Avatars and texts are parsed in browser memory only.

#### 14. System Fonts Downloader
- **Engine**: Static lookup database of 1,100 fonts (Nepali + Google CDN fonts) combined with browser-native FontFace caching.
- **Capabilities**: Previews any font with custom test text and size controls. Supports downloading individual fonts (.TTF) or downloading multiple checked fonts packaged dynamically into a ZIP file in the browser.
- **Security**: 100% offline-capable, runs entirely locally, and resolves fonts via secure, high-speed static CDN links.

#### 15. AI OCR Image-to-Text Converter
- **Engine**: Client-side Tesseract.js WASM engine.
- **Capabilities**: Scans images, photos, receipts, or screenshots to extract text with high precision. Supports 8 major languages including English, Nepali, Hindi, Spanish, French, German, Chinese, and Japanese. Features automatic text extraction progress tracking, copy-to-clipboard, and direct download of text files.
- **Security**: 100% private. OCR processing is done locally on your device's GPU/CPU; your files never touch or leave the browser.

#### 16. Client-Side Image Background Remover
- **Engine**: Client-side ONNX Runtime Web using \`@imgly/background-removal\` neural segmenter WASM.
- **Capabilities**: Removes background from photos, selfies, portraits, and product shots instantly. Downloads model components on-demand (~75MB, cached for speed on subsequent runs). Outputs high-resolution transparent PNG files.
- **Security**: 100% private. Your images are never sent to external servers or API cloud networks, guaranteeing data safety.

#### 17. Scan-to-PDF Document CamScanner (Fully Automatic)
- **Engine**: Local HTML5 MediaDevices camera API + Canvas-based Computer Vision Frame Analyzer + Homography Perspective Warp Engine + Firestore real-time sync channels.
- **Capabilities**:
  - **Automatic Capture**: Runs a real-time pixel luminance scanner on live video frames every 180ms using \`requestAnimationFrame\`. When the document boundary detected remains stable across 4 consecutive frames, the camera automatically triggers a flash and captures the shot. **No button press required.**
  - **Auto Document Boundary Detection**: A custom Computer Vision algorithm analyzes pixel brightness on each video frame using a luminance grid to find the document's four corner boundary points using TL/TR/BR/BL minimum-sum extremal point heuristics.
  - **Perspective Warp (De-skew)**: Uses a full 8x8 Gaussian elimination linear system solver to compute the homography transformation matrix H. Performs backward-mapped pixel-level warp of the captured frame to a clean A4 (900×1270px) rectangle, removing desk backgrounds and correcting tilt/angle distortions entirely.
  - **Magic Color Auto-Enhance**: Applies contrast amplification (factor 1.35x) and brightness correction (+15) to every pixel after warping, producing clean document scans automatically.
  - **Live Scan Guide Overlay**: Displays real-time animated bounding polygon showing detected document bounds in indigo (searching) or green (stable, ready to snap). A glowing green laser line sweeps the viewfinder continuously.
  - **Auto Page Resume**: After processing each page, the scanner automatically restarts and syncs to the next document ready state.
  - **QR Mobile Sync**: Scan the QR code shown on desktop to instantly link your smartphone as a remote capture device. All pages sync in real-time to the desktop via Firestore.
  - **PDF Compilation**: Compiles all scanned pages into a proper A4 PDF document using jsPDF library for one-click download.
- **Security**: 100% private. Captured images are stored temporarily in a secure Firestore session node for instant browser-to-browser transfer, and are cleared automatically per session. No cloud file server storage.

---

### PDF Manipulation Suite

Our browser-based PDF compiler uses WebAssembly to execute heavy document actions securely on your local CPU.

- **PDF to Image Converter**: Extracts pages from any PDF document and downloads them as a zip archive of high-resolution JPGs.
- **Add Page Numbers to PDF**: Stamped vector numbering overlay supporting customized alignments, font sizes, and margins.
- **Merge PDF Files**: Combines multiple separate PDF documents into a single document in custom orders.
- **JPG to PDF Converter**: Compiles images into an organized, single PDF document.

---

### How to Use & Capabilities Guide (What is There & What is Not)

To help you get the most out of our tools, here is a detailed breakdown of how to use each tool, what features are supported, and what is currently outside their scope.

#### 1. Developer Card & OG Banner Studio
* **How to Use**:
  1. Open the studio and select your desired canvas preset (e.g. OG Image, LinkedIn Cover, Twitter Header).
  2. Choose one of the 10 designer templates.
  3. Toggle **Visual Layout Editor: ON** under the Styling tab to enable visual layout editing. Drag the Avatar, Text Details, or Tags blocks to position them anywhere.
  4. Fill out your details in the Content tab, add social handles, upload your avatar, and click **Download Image (PNG)**.
* **What is There**: Proportional scaling, 10 design templates, custom background gradients, local avatar upload, Lucide social icons, and 3x offscreen canvas scaling for sharp HD downloads.
* **What is NOT**: No server-side storage of draft designs. Since edits are processed entirely inside your browser, drafts are cleared when reloading the page. No AI image generation.

#### 2. Nepali Date Converter
* **How to Use**: Select conversion direction (Gregorian AD to Bikram Sambat BS, or vice versa), enter your date, and see conversion results instantly.
* **What is There**: Bidirectional conversions, day of the week, leap year checker, days of the month, offline capability.
* **What is NOT**: No multi-date batch conversions. It converts one date at a time.

#### 3. AI Document Summarizer
* **How to Use**: Upload a PDF document, select a summary format, and click **Summarize**. The streaming AI compiles structured key takeaways.
* **What is There**: High-accuracy Gemini 1.5 Flash summarization, custom text abstracts, secure connection.
* **What is NOT**: Cannot summarize scanned images without OCR. File size is capped at 50 MB to prevent browser timeouts.

#### 4. Secure Vault
* **How to Use**: Select a file, set a strong custom password, and click **Encrypt & Upload**. Share the generated link or QR code with recipients.
* **What is There**: Zero-knowledge encryption (AES-256-GCM), local PBKDF2 key derivation, direct upload to Supabase storage, and customizable download counts/expiry days.
* **What is NOT**: We do not store passwords. If you lose or forget the file password, there is absolutely no password recovery system available.

#### 5. System Fonts Downloader
* **How to Use**: Select a font to preview, customize the preview text or size, and download the \`.ttf\` directly. You can select multiple check-boxes to batch download as a single \`.zip\`.
* **What is There**: 1,100 real pre-compiled Nepali and English fonts with secure direct-download URLs, batch zipping in the browser, custom live preview rendering, and dynamic deep links (e.g. \`/tools/font-downloader/preeti\`) optimized for search engines.
* **What is NOT**: Does not support uploading custom files to the web database (fonts are curated statically).

#### 6. AI OCR Image-to-Text
* **How to Use**: Drag and drop an image or screenshot, select the primary document language, and click **Extract Text**. Copy or download the results instantly.
* **What is There**: High-accuracy local OCR library, multi-language support (English, Nepali, Hindi, etc.), real-time parsing logs, one-click clipboard copy, and direct \`.txt\` downloads.
* **What is NOT**: Hand-written text recognition might have lower accuracy compared to clear, typed digital scans or print layouts.

#### 7. Image Background Remover
* **How to Use**: Upload a photo, preview it, and click **Remove Background**. The local AI model runs segmentation and reveals a download button for the transparent \`.png\` result.
* **What is There**: Zero-knowledge processing, local ONNX model runtime, download progress tracking, and full original resolution transparent output.
* **What is NOT**: The initial run requires a model file download of ~75MB, which might take a few seconds depending on internet speed.

#### 8. Scan-to-PDF CamScanner (Fully Automatic — No Buttons Needed)
* **How to Use**:
  1. Open the tool on your computer at [bishalcodes.com/tools/scan-pdf](https://bishalcodes.com/tools/scan-pdf). A QR code session link is generated automatically.
  2. On your smartphone, open the camera and scan the QR code. This loads the mobile scanner web-app without installing any app.
  3. Tap **Start Automatic Scanner**. Point the phone camera at your paper document.
  4. The AI automatically detects the paper boundary and shows a green animated overlay when it locks on. After 4 stable detection frames, it auto-captures — **no tap or button press needed.**
  5. The tool instantly: ① warps & de-skews the page, ② enhances colors, ③ streams the page to your desktop in real-time.
  6. Repeat for each page. Pages build up automatically on the desktop workspace.
  7. Click **Compile to PDF** on your computer to download the full document as a clean A4 PDF file.
* **What is There**:
  - Fully automatic frame analysis and document capture — no manual shutter button
  - Computer Vision luminance-based document boundary detection
  - Homography perspective warp (removes desk background, corrects angles)
  - Magic Color automatic enhancement (contrast + brightness correction)
  - Real-time animated scan guide overlay with stable-lock green indicator
  - QR-based mobile-to-desktop real-time Firestore sync
  - Multi-page document workspace and A4 PDF compilation
  - Also works by uploading local photos directly on desktop (auto-detects and crops)
* **What is NOT**: Does not require installing any apps. Does not support printing directly (download PDF and print). Each session generates a fresh sync ID (cannot be resumed after closing).

---

### Frequently Asked Questions (FAQ)

> **Q: Are my files or text uploaded to external servers?**  
> **A:** No. Privacy is our top priority. Except for the AI Summarizer and Translator which query secure third-party APIs, all operations (Image Compression, Date Conversion, PDF conversions, Code Runner, OCR Scan, Background Removal, CamScanner Scan, and secure encryption) run completely locally on your device's browser sandbox.

> **Q: Why does my downloaded Developer Card look blurry on some platforms?**  
> **A:** Make sure you use the official **Download Image** button inside the studio. It uses a high-resolution 3x scale rendering clone to export crispy, print-ready PNG assets. If you screenshot the preview container manually, the resolution will be limited by your monitor's pixel density.

> **Q: Can you recover my password if I lose it in the Secure Vault?**  
> **A:** No. The encryption key is derived directly from your password inside your browser. We never receive your password or raw key. If you forget your password, the encrypted binary file cannot be decrypted by anyone, including our systems.

> **Q: Is the HTML/CSS/JS Code Runner safe to execute raw code?**  
> **A:** Yes. The code runner executes files within an isolated iframe sandbox with restricted permissions, preventing the script from accessing your cookies, local storage, or host session attributes.

> **Q: What is the maximum file size limit for PDF conversions and merge operations?**  
> **A:** Since all compilation runs client-side using WebAssembly on your local system, the speed depends on your CPU and RAM. We recommend limiting uploads to 100 MB or less to ensure the browser doesn't run out of memory.
`
  },
  {
    id: 'getting-started',
    title: 'Getting Started & Overview',
    category: 'Core System',
    keywords: ['philosophy', 'overview', 'introduction', 'welcome', 'bishal', 'codes'],
    content: `
Welcome to the developer and client resource portal for **Bishal Codes**. This documentation provides technical guidelines, system architectures, service descriptions, and API behaviors.

---

### Engineering Principles

We build fast, secure, and modern digital web platforms. Our engineering workflow adheres to three foundational paradigms:

1. **Edge-First Performance**
   Applications are deployed globally with minimized bundle sizes, optimized dynamic imports, and aggressive caching strategies to maintain low initial load times.
2. **Clean Component Architecture**
   State management, API integration layer, and UI views are separated. We leverage Next.js App Router dynamic routes with React Server Components for highly optimized server rendering.
3. **Privacy by Default**
   User files and documents remain on the client machine wherever possible. Critical backend APIs are protected via cryptographic validation and strict access controls.

---

### Document Navigation Guides

- Use the **sidebar menu** to jump between categories.
- The **search bar** dynamically filters sections based on titles, keywords, or content.
- For search indexers and web crawlers, refer to the [AI Search & Bot Directory](#seo-bots) section.
`
  },
  {
    id: 'services',
    title: 'Services & Engagement Model',
    category: 'Services & Pricing',
    keywords: ['pricing', 'rates', 'fees', 'services', 'ui/ux', 'next.js', 'react', '3d', 'webGL', 'ecommerce', 'free tools', 'savings'],
    content: `
We offer full-cycle development services, ranging from custom frontend UI components to high-performance enterprise applications.

---

### Core Service Catalog

#### 1. Full-Stack Web Applications
- **Stack**: React, Next.js, Node.js, Firebase, Supabase, PostgreSQL.
- **Deliverables**: Client portals, database schemas, API endpoints, payment checkouts, and custom administrative CMS dashboards.

#### 2. Interactive 3D Web Experiences
- **Stack**: Three.js, React Three Fiber (R3F), Drei, WebGL, GLSL Shaders.
- **Deliverables**: Responsive 3D landing pages, product interactive customizers, and high-performance WebGL animations.

#### 3. Brand & UI/UX Design System
- **Deliverables**: Figma component libraries, typography guides, and interactive wireframes.

---

### Tool Pricing & Credit Systems (100% Free vs Paid Competitors)

Our developer utility tools are **100% free with no monthly subscription, no credit limits, no account signups, and no premium paywalls**. Other online platforms charge high rates or put files behind paywalls. 

Here is a pricing comparison of our tools compared to popular paid alternatives:

| Tool / Service | Bishal Codes | Other Websites (Paid Competitors) | Monthly Saving |
| :--- | :--- | :--- | :--- |
| **AI OCR Converter** | **$0 (100% Free, Local WASM)** | $5 - $15/mo (Limits pages, requires login) | **$10/mo** |
| **Background Remover** | **$0 (100% Free, Local AI)** | $9 - $29/mo (Credits-based, charges per high-res download) | **$15/mo** |
| **Scan-to-PDF Scanner** | **$0 (100% Free, Auto-Capture AI)** | $5 - $10/mo (e.g. CamScanner Pro / iLovePDF premium) | **$7/mo** |
| **System Fonts Downloader**| **$0 (100% Free, 1,100 fonts)** | Often behind registration or bundled subscriptions | **$5/mo** |
| **Secure Vault** | **$0 (100% Free, AES-256)** | $5 - $10/mo (Requires storage plan upgrades) | **$8/mo** |
| **Fast File Transfer** | **$0 (100% Free, up to 100 GB)** | $12 - $20/mo (e.g. WeTransfer Pro for large files) | **$15/mo** |
| **Developer Card Studio** | **$0 (100% Free, 3x exports)** | $5 - $12/mo (Watermarked templates on Canva Pro) | **$8/mo** |

**Why is it Free?**
By utilizing **client-side processing (WebAssembly, Canvas API, Web Crypto API, and local browser database caching)**, we eliminate expensive cloud server processing costs. This allows us to offer premium AI utilities to our visitors completely free, without limits, ads, or hidden charges!

---

### Client Engagement Process

Our collaboration timeline consists of four clear milestones:

- **Phase 1: Discovery (1-3 Days)**
  Requirements gathering, technical roadmap setup, and functional specifications scoping.
- **Phase 2: Architecture (2-5 Days)**
  Figma layout reviews, database schema design, and interactive mockup alignments.
- **Phase 3: Development (7-21 Sprints)**
  Agile code execution using git branches, with staging deployments shared weekly for client feedback.
- **Phase 4: Optimization (2-4 Days)**
  SEO configuration, automated page speed testing, and final domain deployment.
`
  },
  {
    id: 'ai-studio',
    title: 'AI Studio System Guide & Cloud Deployment',
    category: 'Features',
    keywords: ['ai', 'studio', 'gemini', 'credits', 'prompts', 'models', 'tokens', 'github', 'vercel', 'deploy', 'hosting'],
    content: `
The **AI Studio** is a powerful visual prototyping sandbox that allows you to generate responsive, high-performance HTML/CSS/JS websites and React components instantly using Gemini AI models, stream the generated code live, and deploy it to cloud platforms like Vercel or GitHub Pages in one click.

---

### Step-by-Step Guide: How to Generate & Deploy

#### 1. Prototyping Your Website
- **Describe Your Vision**: In the **Website Idea** field, specify your design requirements (colors, sections, theme, responsiveness).
- **Configure Specifications**: Choose the pages, select sections (Hero, About, Services, etc.), choose your brand color, and select your preferred font.
- **Select Output Format**: 
  - **HTML (Separated Files)**: Recommended if you want to deploy live to GitHub Pages or Vercel instantly.
  - **React Component (TSX)**: Best for downloading clean React components to paste into your Next.js project.
- **Generate**: Click **Generate Site** to watch the code stream live in the monochromatic terminal console.

#### 2. Deploying to GitHub Pages (Free Hosting)
- **Step A: Generate a Classic Personal Access Token**
  - Do **NOT** use GitHub's Fine-grained Personal Access Tokens — they do not support the GitHub Pages API.
  - Navigate directly to the Classic Token Creator: [github.com/settings/tokens/new](https://github.com/settings/tokens/new).
  - Set a descriptive name (e.g., "AI Studio Deployer").
  - Check the **\`repo\`** checkbox scope at the top of the list. Checking this automatically ticks all necessary sub-scopes.
  - Scroll to the bottom and click **Generate token**.
  - Copy the generated token immediately (it starts with \`ghp_\`). Note: You will not be able to see it again once you close the page.
- **Step B: Connect and Deploy**
  - Go to the **Deploy** tab in the AI Studio, select **GitHub Pages Hosting**, and click **Connect GitHub** to paste your token.
  - **Repository Name**: A unique repository name with a random suffix is automatically generated (e.g., \`my-portfolio-x7k2m\`). Click the **↺ (regenerate)** icon to change it.
  - Click **Deploy to GitHub Pages**. The AI Studio will create the repository, wait for GitHub initialisation, upload your files, and enable GitHub Pages hosting automatically.
  - Wait 60 seconds for GitHub to finish compiling the deployment, then click **Visit Live Website**.

#### 3. Deploying to Vercel (InstantSubdomain)
- **Step A: Create Vercel Token**
  - Go to your Vercel Account Settings: [vercel.com/account/settings/tokens](https://vercel.com/account/settings/tokens).
  - Click **Create**, name it "AI Studio", set the Scope to **All Projects** (or select your specific team), and click **Create**.
  - Copy the token value.
- **Step B: Deploy**
  - In the **Deploy** tab under Vercel, paste the token, verify your project name, and click **Deploy to Vercel**. Your site goes live instantly on a Vercel subdomain!

---

### ⚠️ Rules of Thumb: Do's and Do Not's

#### Do's:
*   **DO** use a **Classic token** (starts with \`ghp_\`) on GitHub.
*   **DO** ensure the **\`repo\`** checkbox is ticked when generating your GitHub token.
*   **DO** use a unique name or click the ↺ (regenerate) button to prevent name conflicts.
*   **DO** wait at least 60 seconds after a successful GitHub deploy for the static files to compile before opening the site.

#### Do Not's:
*   **DO NOT** use Fine-grained Personal Access Tokens on GitHub (these result in a \`Resource not accessible\` error).
*   **DO NOT** expose your tokens or API keys. If your tokens are exposed, delete them immediately in your settings panels.
*   **DO NOT** enter API keys, credit cards, or raw database keys into AI prompts.

---

### Troubleshooting Common Issues

*   **Error: "Resource not accessible by personal access token"**
    *   *Cause*: You are using a Fine-grained token.
    *   *Solution*: Disconnect, create a **Classic** token instead at [github.com/settings/tokens/new](https://github.com/settings/tokens/new) with the \`repo\` scope selected, and reconnect.
*   **Blank Screen on GitHub Pages**
    *   *Cause*: Broken relative script/style asset links on subdirectory domains.
    *   *Solution*: The AI Studio now automatically compiles your layouts into a single self-contained HTML page containing all styles and javascript inlined. Make sure to generate and redeploy your layout using the latest version of the studio.
`
  },
  {
    id: 'client-portal',
    title: 'Client Portal & Booking Operations',
    category: 'Client Area',
    keywords: ['login', 'account', 'booking', 'deposit', 'portal', 'dashboard', 'status'],
    content: `
The **Client Portal** is a dashboard that hosts billing, project progress trackers, file transfers, and consultant schedules.

---

### Identity & Authentication

Access is protected by secure authentication services:
- **Provider Methods**: Passwordless email verification and Google Single Sign-On (SSO).
- **Access Roles**:
  - *Standard User*: View tools, blog posts, and generic utilities.
  - *Client*: Access private project tracking page, files, and billing.
  - *Admin*: Complete CMS dashboard, support tickets, credit management, and client portal operations.

---

### Booking Deposit Process (Rs. 999)

We require a small commitment deposit to schedule discovery calls and prototype design phases:
- **Deposit Policy**: A deposit of Rs. 999 books an active development slot.
- **Billing Adjustment**: 100% of this commitment deposit is deducted from your final contract bill once development begins.
- **Verification**: Proof of deposit uploaded in the client dashboard is reviewed and approved by administrators within 24 hours.
`
  },
  {
    id: 'support',
    title: 'Support & Ticketing Systems',
    category: 'Client Area',
    keywords: ['report', 'bug', 'error', 'support', 'help', 'logs', 'modal'],
    content: `
If you identify database faults, layout issues, or functional bugs, you can request technical support directly.

---

### Submitting Bug Reports

1. **Access**: Click **Report Problem** in the footer of any page.
2. **Details**: Provide a clean subject, affected URL, and reproduction steps.
3. **Response Queue**: Tickets are saved to our database and prioritized by severity.

---

### Service-Level Agreements (SLA)

We categorize support issues as follows:

| Severity Level | Definition | Response Target |
| :--- | :--- | :--- |
| **Critical** | Database outages or security issues | 2-12 Hours |
| **High** | Broken features or major layout defects | 12-24 Hours |
| **Normal** | Content adjustments or minor cosmetic issues | 1-3 Business Days |
`
  },
  {
    id: 'seo-bots',
    title: 'AI Search & Bot Directory',
    category: 'AI Crawlers & SEO',
    keywords: ['bot', 'crawler', 'seo', 'bard', 'gemini', 'gptbot', 'perplexity', 'schema'],
    content: `
This directory contains machine-readable routing rules and database schemas optimized for AI search engines, crawler spiders, and semantic text parsers.

---

### Sitemap Route Index

| Route | Content Type | Refresh Freq | Search Authority |
| :--- | :--- | :--- | :--- |
| \`/\` | Home, FAQ, Experience | Daily | Primary Index |
| \`/about\` | Biography, Skills | Weekly | High |
| \`/projects\` | Tech Stack, Case Studies | Weekly | High |
| \`/services\` | Developer Tools, Utilities | Weekly | High |
| \`/blog\` | Development Tutorials | Daily | High |
| \`/docs\` | System Manuals, Guides | Weekly | Moderate |

---

### Structural Schemas & JSON-LD
The site incorporates automated **JSON-LD Schemas** (WebSite, Person, ProfessionalService, FAQPage, and TechArticle) embedded directly into the header templates. This structured data assists search engines like Google in understanding our page contents.
`
  },
  {
    id: 'widgets-integration',
    title: 'Widgets Integration & Embed Codes',
    category: 'Developer Utilities & Tools',
    keywords: ['widgets', 'iframe', 'embed', 'calendar', 'converter', 'nepali calendar', 'date converter', 'integration', 'code'],
    content: `
Our custom widgets allow you to embed our premium tools directly on your website or application. We offer two customizable iframe-based widgets:

---

### Available Widget Products

#### 1. Standalone Bikram Sambat (BS) Calendar Widget
- **Description**: Displays the current monthly Bikram Sambat calendar grid, complete with Nepalese holidays, festival labels, and corresponding Gregorian AD dates.
- **Base Embed URL**: \`https://bishalcodes.com/widgets/calendar\`
- **Recommended Dimension**:
  - **Medium**: 340px width × 420px height
  - **Small**: 220px width × 380px height (optimized text scaling and responsive holiday indicator dots)
  - **Full**: 800px width × 600px height (standard desktop table grid)

#### 2. Standalone Date Converter Widget
- **Description**: A bidirectional Gregorian (AD) to Bikram Sambat (BS) date conversion utility.
- **Base Embed URL**: \`https://bishalcodes.com/widgets/date-converter\`
- **Recommended Dimension**: 340px width × 420px height (standard block) or 220px width × 380px height (slim vertical container)

---

### Step-by-Step Integration Guide

To embed a widget on your site, follow these simple steps:

1. **Configure Parameters**: Go to the [Widgets Integrations Playground](/widgets) to select your widget template, size preset, or input custom height and width.
2. **Copy Code**: Click the copy icon to copy the generated HTML \`<iframe>\` code block to your clipboard.
3. **Paste Into Source**:
   - **Custom HTML Sites**: Paste the copied iframe block directly into your HTML file.
   - **WordPress**: Add a **Custom HTML** block and paste the iframe snippet.
   - **Webflow / Wix**: Insert an **Embed Component** or **HTML iframe** block and paste the snippet.

---

### Advanced Customization & Parameters

The iframe wrapper automatically adapts to light and dark theme modes based on the user's browser settings. Ensure the \`allowtransparency="true"\` attribute is present on the iframe element to maintain transparency backgrounds:

\`\`\`html
<iframe 
  src="https://bishalcodes.com/widgets/calendar" 
  frameborder="0" 
  scrolling="no" 
  style="border: none; overflow: hidden; width: 340px; height: 420px;" 
  allowtransparency="true"
></iframe>
\`\`\`
`
  },
  {
    id: 'desktop-calendar',
    title: 'Nepali Calendar Desktop App for Windows',
    category: 'Desktop Applications',
    keywords: ['desktop', 'calendar', 'nepali', 'windows', 'app', 'widget', 'download', 'offline', 'converter'],
    content: `
The Nepali Calendar Desktop App is a premium, offline-first calendar and date conversion utility built specifically for Windows 10 and 11. It brings all the capabilities of our web calendar directly to your desktop alongside advanced native integrations.

---

### Core Desktop Capabilities

- **Persistent Mini Widget**: Dock or float the widget on your desktop or run it silently in your Windows System Tray for quick access.
- **Dynamic Tray Day Icon**: The system tray icon dynamically updates in real-time to display the current day number in Devanagari (e.g. १४) on a premium card background.
- **Custom Event & Birthday Scheduler**: Schedule alerts on three cycles: once, yearly on Bikram Sambat (BS) dates, or yearly on English Gregorian (AD) dates.
- **Bi-directional Google & Outlook Sync**: Securely authorize the app using local OAuth redirects, convert BS schedules automatically to AD, and write them directly to your Google Calendar or Microsoft Outlook schedule.
- **Live Firestore Holiday Sync**: Automatically queries and fetches published national holidays from our cloud database, caching updates locally for offline availability.
- **Native OS Push Notifications**: Receives morning briefs (date, tithi, today's holidays) and custom notifications sent in real-time by the website administrators.

---

### Installation & Configuration Guide

1. Visit the [Date Converter & Calendar](/tools/date-converter) page on the web app.
2. Click **Download Desktop App (Win 10/11)** to download the latest setup archive (\`NepaliCalendar-Setup-v1.3.0.zip\`).
3. Extract and run the installer setup. If Windows SmartScreen displays a warning, select **More Info** ➔ **Run Anyway** to finish installation.
4. **Google & Outlook Setup**: Navigate to the App Settings tab, enter your custom OAuth credentials (Client ID & Secret), and click **Connect** to link your calendars.

---

### Need Help?
If you encounter any issues or want to leave feedback, use the rating modal on the download page, or contact us through the main website.
    `
  }
];

interface DocsPageProps {
  sectionId: string | null;
}

const DocsPage: React.FC<DocsPageProps> = ({ sectionId }) => {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [docSections, setDocSections] = useState<DocSection[]>(initialDocSections);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      setIsEditMode(localStorage.getItem('liveEditMode') === 'true');
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDocs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'docs'));
        if (!querySnapshot.empty && isMounted) {
            const list: DocSection[] = [];
            querySnapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                title: data.title || '',
                category: data.category || '',
                keywords: data.keywords || [],
                content: data.content || ''
              });
            });
            // Auto-seed missing sections newly added to code
            initialDocSections.forEach(async (item) => {
              if (!list.some(d => d.id === item.id)) {
                try {
                  await setDoc(doc(db, 'docs', item.id), {
                    title: item.title,
                    category: item.category,
                    keywords: item.keywords,
                    content: item.content
                  });
                  if (isMounted) {
                    setDocSections(prev => [...prev, item]);
                  }
                } catch (err) {
                  console.warn(`Failed to seed doc ${item.id}:`, err);
                }
              }
            });
            setDocSections(list);
        } else if (isMounted) {
          setDocSections(initialDocSections);
          initialDocSections.forEach(async (item) => {
            try {
              await setDoc(doc(db, 'docs', item.id), {
                title: item.title,
                category: item.category,
                keywords: item.keywords,
                content: item.content
              });
            } catch (err) {
              console.warn(`Failed to seed doc ${item.id}:`, err);
            }
          });
        }
      } catch (err) {
        console.warn("Failed to fetch docs from Firestore:", err);
        if (isMounted) {
          setDocSections(initialDocSections);
        }
      }
    };
    fetchDocs();
    return () => { isMounted = false; };
  }, []);

  const handleInlineSave = async (docId: string, field: 'title' | 'content', value: string) => {
    window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saving' }));
    
    setDocSections(prev => prev.map(item => {
      if (item.id === docId) {
        return { ...item, [field]: value };
      }
      return item;
    }));

    try {
      await updateDoc(doc(db, 'docs', docId), {
        [field]: value
      });
      window.dispatchEvent(new CustomEvent('liveEditSaveStatus', { detail: 'saved' }));
    } catch (err) {
      console.error("Error saving doc change:", err);
    }
  };
  
  // Set default section to 'getting-started' if none or invalid provided
  const activeSectionId = useMemo(() => {
    if (!sectionId) return 'getting-started';
    const exists = docSections.some(s => s.id === sectionId);
    return exists ? sectionId : 'getting-started';
  }, [sectionId, docSections]);

  const activeSection = useMemo(() => {
    return docSections.find(s => s.id === activeSectionId) || docSections[0] || initialDocSections[0];
  }, [docSections, activeSectionId]);

  // Set page headers for SEO dynamically
  useEffect(() => {
    document.title = `${activeSection.title} | Documentation | Bishal Codes`;
    
    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescriptionTag);
    }
    metaDescriptionTag.setAttribute(
      'content', 
      `Bishal Codes Documentation: Learn about ${activeSection.title}. Detailed developer guides, client portal usage, and service overviews.`
    );

    // Add Docs specific JSON-LD schema
    const schemaId = 'docs-jsonld-schema';
    let scriptTag = document.getElementById(schemaId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    scriptTag.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": `${activeSection.title} - Bishal Codes Documentation`,
      "description": `Official documentation guide for ${activeSection.title} on Bishal Codes.`,
      "image": "https://ik.imagekit.io/bishalc/desktop.png",
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
          "url": "https://bishalcodes.com/logo.png"
        }
      },
      "mainEntityOfPage": `https://bishalcodes.com/docs/${activeSection.id}`,
      "inLanguage": "en-US"
    });

    return () => {
      document.title = "Bishal Mishra | World-Class Full-Stack Developer & 3D Web Architect";
      const defaultDesc = document.querySelector('meta[name="description"]');
      if (defaultDesc) {
        defaultDesc.setAttribute(
          'content', 
          "Bishal Mishra is a premium Full-Stack Developer specializing in high-performance 3D visuals, Next.js architecture, and custom enterprise web applications."
        );
      }
      const existingScript = document.getElementById(schemaId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [activeSection]);

  // Handle Search filtering
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;
    const query = searchQuery.toLowerCase().trim();
    return docSections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.category.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query) ||
      section.keywords.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Group sections by category for sidebar navigation
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: DocSection[] } = {};
    filteredSections.forEach(sec => {
      if (!groups[sec.category]) {
        groups[sec.category] = [];
      }
      groups[sec.category].push(sec);
    });
    return groups;
  }, [filteredSections]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core System': return <BookOpen size={14} className="text-slate-400" />;
      case 'Services & Pricing': return <Briefcase size={14} className="text-slate-400" />;
      case 'Features': return <Cpu size={14} className="text-slate-400" />;
      case 'Client Area': return <User size={14} className="text-slate-400" />;
      case 'AI Crawlers & SEO': return <Search size={14} className="text-slate-400" />;
      default: return <HelpCircle size={14} className="text-slate-400" />;
    }
  };

  const handleSectionSelect = (id: string) => {
    navigate('docs', id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="w-full px-[5vw] mx-auto">
          
          {/* Main layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Column - Hidden on mobile, visible on desktop */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-24 shadow-sm space-y-5">
                
                {/* Search box */}
                <div className="relative">
                  <input
                    id="docs-search-input"
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 transition-colors"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-4" aria-label="Documentation Sidebar">
                  {Object.keys(groupedSections).length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium p-2">No matching topics found.</p>
                  ) : (
                    Object.entries(groupedSections).map(([category, items]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          {getCategoryIcon(category)}
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {category}
                          </h4>
                        </div>
                        <ul className="list-none space-y-0.5 pl-1">
                          {items.map(sec => {
                            const isActive = sec.id === activeSectionId;
                            return (
                              <li key={sec.id}>
                                <button
                                  id={`docs-nav-link-${sec.id}`}
                                  onClick={() => handleSectionSelect(sec.id)}
                                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-between group ${
                                    isActive
                                      ? 'bg-slate-100 text-indigo-600 font-semibold'
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <span>{sec.title}</span>
                                  <ChevronRight 
                                    size={12} 
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                      isActive ? 'text-indigo-600 opacity-100' : 'text-slate-400'
                                    }`} 
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </nav>
              </div>
            </aside>

            {/* Content Column */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
                
                {/* Mobile Navigation Header Trigger */}
                <div className="lg:hidden mb-6 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      {activeSection.title}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Topics
                  </button>
                </div>

                {/* Breadcrumb */}
                <div className="mb-4 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span onClick={() => navigate('home')} className="cursor-pointer hover:text-indigo-600 transition-colors">Home</span>
                  <ChevronRight size={10} className="text-slate-400" />
                  <span onClick={() => navigate('docs')} className="cursor-pointer hover:text-indigo-600 transition-colors">Docs</span>
                  <ChevronRight size={10} className="text-slate-400" />
                  <span className="text-slate-800 font-medium">{activeSection.category}</span>
                </div>

                {/* Main Heading */}
                <h1 
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleInlineSave(activeSection.id, 'title', e.currentTarget.textContent || '')}
                  className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-1 w-fit ${isEditMode ? 'outline-dashed outline-1 outline-amber-500/80 px-1 rounded cursor-text' : ''}`}
                >
                  {activeSection.title}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-6 mb-6">
                  Category: {activeSection.category}
                </p>

                {/* Markdown content rendering */}
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm sm:text-base font-normal">
                  {isEditMode ? (
                    <textarea
                      value={activeSection.content}
                      onChange={(e) => handleInlineSave(activeSection.id, 'content', e.target.value)}
                      className="w-full min-h-[400px] p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono text-xs text-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-y"
                    />
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        blockquote: ({ children }) => (
                          <div className="my-4 pl-4 border-l-2 border-slate-200 text-xs sm:text-[13px] text-slate-500 font-normal">
                            <div className="not-prose space-y-2">
                              {children}
                            </div>
                          </div>
                        )
                      } as any}
                    >
                      {activeSection.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Quick Info Box Callout */}
                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">Need Further Custom Specifications?</h5>
                    <p className="text-slate-500 text-xs font-normal leading-relaxed">
                      If your query requires dedicated technical attention or if you need a customized service scope, please submit a message via our contact portal.
                    </p>
                    <button 
                      onClick={() => navigate('contact')}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs transition-colors inline-flex items-center gap-1 mt-1.5"
                    >
                      Go to Contact Page <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[120] lg:hidden transition-all duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
        
        {/* Drawer Content */}
        <div className={`absolute top-[72px] left-0 bottom-0 w-[280px] bg-white border-r border-slate-200 p-4 flex flex-col space-y-4 transition-transform duration-300 shadow-xl ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Documentation</h3>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Search box in mobile drawer */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 transition-colors"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* List of topics in drawer */}
          <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
            {Object.keys(groupedSections).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No matching topics.</p>
            ) : (
              Object.entries(groupedSections).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5">
                    {getCategoryIcon(category)}
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {category}
                    </h4>
                  </div>
                  <ul className="list-none space-y-0.5 pl-1">
                    {items.map(sec => {
                      const isActive = sec.id === activeSectionId;
                      return (
                        <li key={sec.id}>
                          <button
                            onClick={() => {
                              handleSectionSelect(sec.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-between ${
                              isActive
                                ? 'bg-slate-100 text-indigo-600 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span>{sec.title}</span>
                            <ChevronRight size={12} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </nav>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DocsPage;
