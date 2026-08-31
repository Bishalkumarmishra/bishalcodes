import { NextResponse } from 'next/server';

// Dynamic Sitemap Generator - Fetches all blog posts from Firestore and builds a valid XML sitemap
// This runs server-side on Vercel and is always fresh, helping Google discover all your content.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE_URL = 'https://bishalcodes.com';
const PROJECT_ID = 'bishal-mishra-3c559';

// Static pages with their priorities
const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/tools', priority: '0.9', changefreq: 'daily' },
  { url: '/projects', priority: '0.8', changefreq: 'weekly' },
  { url: '/skills', priority: '0.8', changefreq: 'weekly' },
  { url: '/experience', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/docs', priority: '0.7', changefreq: 'weekly' },
  { url: '/developers', priority: '0.9', changefreq: 'daily' },
  { url: '/developers/screenshot', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/qrcode', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/ocr', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/summarize', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/diff', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/json-format', priority: '0.8', changefreq: 'weekly' },
  { url: '/developers/currency', priority: '0.8', changefreq: 'weekly' },
  { url: '/widgets', priority: '0.8', changefreq: 'weekly' },
  { url: '/widgets/calendar', priority: '0.7', changefreq: 'weekly' },
  { url: '/widgets/date-converter', priority: '0.7', changefreq: 'weekly' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const urlsToFetch = [
      { name: 'blog', url: `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blog?pageSize=200` },
      { name: 'services', url: `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/services?pageSize=200` },
      { name: 'legalPages', url: `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/legalPages?pageSize=200` },
      { name: 'projects', url: `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/projects?pageSize=200` }
    ];

    const fetchResults = await Promise.allSettled(
      urlsToFetch.map(item => fetch(item.url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 }, // Cache 1 hour
      }))
    );

    let blogUrls: string[] = [];
    let serviceUrls: string[] = [];
    let legalUrls: string[] = [];
    let projectUrls: string[] = [];
    
    // Parse blog posts
    const blogRes = fetchResults[0];
    if (blogRes.status === 'fulfilled' && blogRes.value.ok) {
      const data = await blogRes.value.json();
      if (data.documents) {
        blogUrls = data.documents.map((doc: any) => doc.name.split('/').pop()).filter(Boolean);
      }
    }

    // Parse tools (services)
    const servicesRes = fetchResults[1];
    if (servicesRes.status === 'fulfilled' && servicesRes.value.ok) {
      const data = await servicesRes.value.json();
      if (data.documents) {
        serviceUrls = data.documents.map((doc: any) => doc.name.split('/').pop()).filter(Boolean);
      }
    }

    // Include all hardcoded developer tools to ensure they rank extremely fast on Google
    const HARDCODED_TOOLS = [
      'date-converter', 'currency-converter', 'translator', 'ai-summarizer',
      'pdf-to-image', 'pdf-to-word', 'word-to-pdf', 'excel-to-pdf', 'pdf-to-excel',
      'split-pdf', 'edit-pdf', 'add-page-numbers', 'merge-pdf', 'jpg-to-pdf',
      'image-compressor', 'emi-calculator', 'qr-studio', 'json-formatter',
      'diff-checker', 'code-runner', 'screenshot-studio', 'secure-vault',
      'dev-card-studio', 'font-downloader', 'ocr-converter', 'bg-remover',
      'scan-pdf', 'typing-practice', 'file-transfer'
    ];
    
    // Deduplicate any overlapping tools
    serviceUrls = Array.from(new Set([...serviceUrls, ...HARDCODED_TOOLS]));

    // Parse legal pages
    const legalRes = fetchResults[2];
    if (legalRes.status === 'fulfilled' && legalRes.value.ok) {
      const data = await legalRes.value.json();
      if (data.documents) {
        legalUrls = data.documents.map((doc: any) => doc.name.split('/').pop()).filter(Boolean);
      }
    }

    // Parse projects for Google Indexing
    const projectsRes = fetchResults[3];
    if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
      const data = await projectsRes.value.json();
      if (data.documents) {
        projectUrls = data.documents.map((doc: any) => doc.name.split('/').pop()).filter(Boolean);
      }
    }

    const now = new Date().toISOString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${STATIC_PAGES.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${blogUrls.map(id => `  <url>
    <loc>${SITE_URL}/blog/${escapeXml(id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${serviceUrls.map(id => `  <url>
    <loc>${SITE_URL}/tools/${escapeXml(id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
${projectUrls.map(id => `  <url>
    <loc>${SITE_URL}/projects/${escapeXml(id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
${legalUrls.map(id => `  <url>
    <loc>${SITE_URL}/legal/${escapeXml(id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n')}`;
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return a minimal sitemap even on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <priority>0.9</priority>
  </url>
</urlset>`;
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
