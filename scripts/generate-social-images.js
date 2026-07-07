const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_DIR = path.join(PUBLIC_DIR, 'seo-images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Custom icons for tools that don't have SVGs or need specific styling
const CUSTOM_ICONS = {
  'date-converter': `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
    <rect x="7" y="13" width="2" height="2" fill="currentColor"/>
    <rect x="11" y="13" width="2" height="2" fill="currentColor"/>
    <rect x="15" y="13" width="2" height="2" fill="currentColor"/>
    <rect x="7" y="17" width="2" height="2" fill="currentColor"/>
    <rect x="11" y="17" width="2" height="2" fill="currentColor"/>
  `,
  'translator': `
    <path d="M5 8h14M12 4v4M4 14c0-3.3 2.7-6 6-6M12 8c0 3.3-2.7 6-6 6M2 5h12M17 22l-5-10-5 10M19 18h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,
  'secure-vault': `
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" fill="none"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
  `,
  'tools': `
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  `
};

const TOOLS = [
  {
    slug: 'date-converter',
    title: 'Nepali Date Converter',
    desc: 'Convert English (AD) dates to Nepali (BS) dates and vice versa with precision, leap year info, and Bikram Sambat details.',
    customIcon: 'date-converter',
    color: '#06b6d4'
  },
  {
    slug: 'translator',
    title: 'Language Translator',
    desc: 'Translate text in real-time between English, Nepali, Hindi, and all major languages, powered by high-accuracy speech output.',
    customIcon: 'translator',
    color: '#3b82f6'
  },
  {
    slug: 'currency-converter',
    title: 'USD Currency Converter',
    desc: 'Convert USD and global currencies to NPR, INR, PKR, and 20+ other rates using live updates refreshed every hour.',
    svgFile: 'currancy converter.svg',
    color: '#10b981'
  },
  {
    slug: 'jpg-to-pdf',
    title: 'JPG to PDF Converter',
    desc: 'Convert single or multiple JPG, PNG, and web images into a single, clean PDF file instantly in your browser.',
    svgFile: 'jpg to pdf.svg',
    color: '#ec4899'
  },
  {
    slug: 'merge-pdf',
    title: 'Merge PDF Files',
    desc: 'Combine multiple PDF documents into a single PDF file instantly offline without uploading any data.',
    svgFile: 'merge pdf.svg',
    color: '#f59e0b'
  },
  {
    slug: 'add-page-numbers',
    title: 'Add Page Numbers to PDF',
    desc: 'Stamp standard page numbers or Roman numerals onto any PDF document easily with native vector quality.',
    svgFile: 'page number.svg',
    color: '#6366f1'
  },
  {
    slug: 'pdf-to-image',
    title: 'PDF to Image Converter',
    desc: 'Extract high-resolution JPG or PNG images from any PDF pages and download them in a single ZIP folder.',
    svgFile: 'pdf to png jpg.svg',
    color: '#8b5cf6'
  },
  {
    slug: 'ai-summarizer',
    title: 'AI Document Summarizer',
    desc: 'Instantly summarize large PDF documents, textbooks, and research papers using advanced Gemini AI structures.',
    svgFile: 'ai summairaizer.svg',
    color: '#a855f7'
  },
  {
    slug: 'image-compressor',
    title: 'Smart Image Compressor',
    desc: 'Reduce photo file sizes (JPEG, PNG, WebP) to target levels like 100 KB or 200 KB client-side without quality loss.',
    svgFile: 'image-compressor.svg',
    color: '#06b6d4'
  },
  {
    slug: 'emi-calculator',
    title: 'EMI & Loan Calculator',
    desc: 'Plan your loans with sliders for principal, rates, and tenure. View dynamic amortization tables and graphs.',
    svgFile: 'emi-calculator.svg',
    color: '#10b981'
  },
  {
    slug: 'qr-studio',
    title: 'QR Code Studio',
    desc: 'Generate custom styled QR codes with embedded center logo, and scan QR codes in real-time via camera feed.',
    svgFile: 'qr-studio.svg',
    color: '#f43f5e'
  },
  {
    slug: 'json-formatter',
    title: 'JSON Formatter & Tree',
    desc: 'Format, minify, and validate raw JSON structures. Collapse, search, and navigate nested keys in a tree browser.',
    svgFile: 'json-formatter.svg',
    color: '#3b82f6'
  },
  {
    slug: 'diff-checker',
    title: 'Instant Text Diff Checker',
    desc: 'Compare line differences side-by-side or inline with synchronized scrolling and highlighted character diffs.',
    svgFile: 'diff-checker.svg',
    color: '#6366f1'
  },
  {
    slug: 'code-runner',
    title: 'HTML, CSS & JS Code Runner',
    desc: 'Write web code directly in your browser and preview the layout and execution live with synchronized console logs.',
    svgFile: 'code-runner.svg',
    color: '#eab308'
  },
  {
    slug: 'file-transfer',
    title: 'P2P File Transfer',
    desc: 'Send files up to 500 MB instantly via secure peer-to-peer connection. Completely private and browser-based.',
    svgFile: 'file-transfer.svg',
    color: '#06b6d4'
  },
  {
    slug: 'screenshot-studio',
    title: 'Website Screenshot Studio',
    desc: 'Capture high-resolution screenshots of any web page with customized mobile, tablet, and desktop emulation.',
    svgFile: 'screenshot-studio.svg',
    color: '#8b5cf6'
  },
  {
    slug: 'secure-vault',
    title: 'Secure File Vault',
    desc: 'Encrypt and password-protect any file locally using AES-256-GCM encryption before generating a secure link.',
    customIcon: 'secure-vault',
    color: '#10b981'
  },
  {
    slug: 'tools',
    title: 'Developer Services & Tools',
    desc: 'Access a premium suite of free, client-side developer utilities and privacy-focused productivity tools.',
    customIcon: 'tools',
    color: '#6366f1'
  }
];

// Helper to wrap description text into two lines
function wrapText(text, maxCharsPerLine = 48) {
  const words = text.split(' ');
  let line1 = '';
  let line2 = '';
  
  for (let word of words) {
    if ((line1 + word).length < maxCharsPerLine) {
      line1 += (line1 ? ' ' : '') + word;
    } else if ((line2 + word).length < maxCharsPerLine + 5) {
      line2 += (line2 ? ' ' : '') + word;
    } else {
      line2 += '...';
      break;
    }
  }
  return { line1, line2 };
}

function cleanSvgContent(rawSvg) {
  // Extract content inside <svg>...</svg>
  const match = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!match) return '';
  let content = match[1];
  
  // Strip out defs and linearGradients if we want standard fill/stroke colors,
  // but to preserve gradients, we can just replace gradients to avoid conflicts.
  // Actually, we can keep the defs as is. Just clean some class names.
  return content;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

async function main() {
  console.log('Generating social preview cards...');

  for (let tool of TOOLS) {
    let iconContent = '';
    
    if (tool.customIcon) {
      iconContent = CUSTOM_ICONS[tool.customIcon];
    } else if (tool.svgFile) {
      const filePath = path.join(PUBLIC_DIR, tool.svgFile);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        iconContent = cleanSvgContent(fileContent);
      } else {
        console.warn(`File not found: ${tool.svgFile}, falling back to gears.`);
        iconContent = CUSTOM_ICONS['tools'];
      }
    }

    const { line1, line2 } = wrapText(tool.desc);
    const escapedTitle = escapeXml(tool.title);
    const escapedLine1 = escapeXml(line1);
    const escapedLine2 = escapeXml(line2);

    const svgTemplate = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0a0a0f" />
            <stop offset="50%" stop-color="#050507" />
            <stop offset="100%" stop-color="#010102" />
          </linearGradient>
          <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#141522" />
            <stop offset="100%" stop-color="#0b0c12" />
          </linearGradient>
          <radialGradient id="glow-cyan" cx="10%" cy="10%" r="60%">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
          </radialGradient>
          <radialGradient id="glow-indigo" cx="90%" cy="90%" r="60%">
            <stop offset="0%" stop-color="${tool.color}" stop-opacity="0.12" />
            <stop offset="100%" stop-color="${tool.color}" stop-opacity="0.0" />
          </radialGradient>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg-grad)" />
        <rect width="1200" height="630" fill="url(#glow-cyan)" />
        <rect width="1200" height="630" fill="url(#glow-indigo)" />

        <!-- Glowing border shadow -->
        <rect x="118" y="103" width="964" height="424" rx="34" ry="34" fill="none" stroke="${tool.color}" stroke-opacity="0.15" stroke-width="8" filter="blur(6px)" />
        
        <!-- Glassmorphism Card -->
        <rect x="120" y="105" width="960" height="420" rx="32" ry="32" fill="url(#card-grad)" stroke="#272a3f" stroke-width="2.5" />

        <!-- Left Side: Circular Badge -->
        <circle cx="310" cy="315" r="105" fill="#090a0f" stroke="#222538" stroke-width="3" />
        <circle cx="310" cy="315" r="90" fill="#12131c" stroke="${tool.color}" stroke-opacity="0.3" stroke-width="2" />
        
        <!-- Icon Wrapper with viewport/scaling -->
        <g transform="translate(232, 237) scale(6.5)" color="${tool.color}">
          ${iconContent}
        </g>

        <!-- Right Side: Content -->
        <text x="510" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${tool.color}" letter-spacing="3">BISHAL CODES • UTILITY TOOL</text>
        <text x="510" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#ffffff">${escapedTitle}</text>
        
        <text x="510" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
          <tspan x="510" dy="0">${escapedLine1}</tspan>
          <tspan x="510" dy="28">${escapedLine2}</tspan>
        </text>

        <!-- Dynamic Badges -->
        <g transform="translate(510, 410)">
          <rect x="0" y="0" width="130" height="32" rx="16" fill="#1b1d36" stroke="#2a2e4b" stroke-width="1.2" />
          <text x="65" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#818cf8" text-anchor="middle">100% SECURE</text>

          <rect x="145" y="0" width="150" height="32" rx="16" fill="#082b3d" stroke="#0e5a7a" stroke-width="1.2" />
          <text x="220" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#22d3ee" text-anchor="middle">BROWSER-BASED</text>

          <rect x="310" y="0" width="130" height="32" rx="16" fill="#053e2d" stroke="#0b6348" stroke-width="1.2" />
          <text x="375" y="21" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#34d399" text-anchor="middle">FREE &amp; FAST</text>
        </g>
      </svg>
    `;

    try {
      const opts = {
        background: 'transparent',
        fitTo: {
          mode: 'width',
          value: 1200,
        },
      };

      const resvg = new Resvg(svgTemplate, opts);
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      const outputPath = path.join(OUTPUT_DIR, `${tool.slug}.png`);
      fs.writeFileSync(outputPath, pngBuffer);
      console.log(`Successfully generated: ${tool.slug}.png`);
    } catch (err) {
      console.error(`Error rendering ${tool.slug}:`, err);
    }
  }

  console.log('All social images generated successfully!');
}

main().catch(err => {
  console.error('Fatal error in generator script:', err);
  process.exit(1);
});
