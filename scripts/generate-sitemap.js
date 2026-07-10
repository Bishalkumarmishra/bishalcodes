const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE_URL = 'https://bishalcodes.com';
const PROJECT_ID = 'bishal-mishra-3c559';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (err) => {
      resolve(null);
    });
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function run() {
  console.log('[Sitemap Generator] Running auto-detection scan...');

  const sitemapUrls = [];
  const now = new Date().toISOString().split('T')[0];

  // 1. Static Core Pages
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/about', priority: '0.8', changefreq: 'weekly' },
    { path: '/skills', priority: '0.7', changefreq: 'weekly' },
    { path: '/projects', priority: '0.9', changefreq: 'weekly' },
    { path: '/experience', priority: '0.7', changefreq: 'weekly' },
    { path: '/ai-studio', priority: '0.7', changefreq: 'weekly' },
    { path: '/tools', priority: '0.8', changefreq: 'weekly' },
    { path: '/blog', priority: '0.9', changefreq: 'daily' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly' },
    { path: '/docs', priority: '0.8', changefreq: 'weekly' },
    { path: '/widgets', priority: '0.8', changefreq: 'weekly' },
    { path: '/widgets/calendar', priority: '0.7', changefreq: 'weekly' },
    { path: '/widgets/date-converter', priority: '0.7', changefreq: 'weekly' }
  ];

  staticPages.forEach(page => {
    sitemapUrls.push({
      loc: `${SITE_URL}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // 2. Scan app/[[...slug]]/page.tsx for custom developer utilities / tools
  try {
    const pagePath = path.join(__dirname, '../app/[[...slug]]/page.tsx');
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, 'utf8');
      
      // Regex to find subpage match statements: subpage === 'tool-name'
      const toolRegex = /subpage\s*===\s*['"]([^'"]+)['"]/g;
      let match;
      const tools = new Set();
      
      while ((match = toolRegex.exec(content)) !== null) {
        tools.add(match[1]);
      }

      console.log(`[Sitemap Generator] Auto-detected ${tools.size} dynamic utility tools in page.tsx:`, Array.from(tools));
      
      tools.forEach(tool => {
        sitemapUrls.push({
          loc: `${SITE_URL}/tools/${tool}`,
          lastmod: now,
          changefreq: 'daily',
          priority: '0.9'
        });
      });
    }
  } catch (err) {
    console.error('[Sitemap Generator] Error scanning page.tsx for tools:', err);
  }

  // 3. Scan page-components/DocsPage.tsx for documentation sections
  try {
    const docsPath = path.join(__dirname, '../page-components/DocsPage.tsx');
    if (fs.existsSync(docsPath)) {
      const content = fs.readFileSync(docsPath, 'utf8');
      
      // Look for the docSections definition and grab all the id values
      // We parse sections of the structure: id: 'getting-started',
      const docIdRegex = /id:\s*['"]([^'"]+)['"]/g;
      let match;
      const docSections = new Set();
      
      while ((match = docIdRegex.exec(content)) !== null) {
        // Skip general occurrences and ensure it's a section ID
        if (match[1] !== 'docs-jsonld-schema') {
          docSections.add(match[1]);
        }
      }

      console.log(`[Sitemap Generator] Auto-detected ${docSections.size} documentation sections in DocsPage.tsx:`, Array.from(docSections));
      
      docSections.forEach(section => {
        sitemapUrls.push({
          loc: `${SITE_URL}/docs/${section}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    }
  } catch (err) {
    console.error('[Sitemap Generator] Error scanning DocsPage.tsx for sections:', err);
  }

  // 4. Fetch dynamic blog posts from Firestore REST API
  try {
    const blogData = await fetchUrl(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blog?pageSize=200`);
    if (blogData && blogData.documents) {
      const blogPosts = blogData.documents
        .map(doc => doc.name.split('/').pop())
        .filter(Boolean);
      
      console.log(`[Sitemap Generator] Fetched ${blogPosts.length} blog posts from Firestore.`);
      
      blogPosts.forEach(id => {
        sitemapUrls.push({
          loc: `${SITE_URL}/blog/${escapeXml(id)}`,
          lastmod: now,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });
    }
  } catch (err) {
    console.error('[Sitemap Generator] Error fetching blog posts from Firestore:', err);
  }

  // 5. Fetch dynamic legal pages from Firestore REST API
  try {
    const legalData = await fetchUrl(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/legalPages?pageSize=200`);
    let legalPages = [];
    if (legalData && legalData.documents) {
      legalPages = legalData.documents
        .map(doc => doc.name.split('/').pop())
        .filter(Boolean);
      console.log(`[Sitemap Generator] Fetched ${legalPages.length} legal pages from Firestore.`);
    }

    // Default fallbacks if Firestore fetch is empty
    if (legalPages.length === 0) {
      legalPages = ['privacy-policy', 'terms-and-conditions', 'cookies-policy', 'data-deletion-request'];
    }

    legalPages.forEach(id => {
      sitemapUrls.push({
        loc: `${SITE_URL}/legal/${escapeXml(id)}`,
        lastmod: now,
        changefreq: 'yearly',
        priority: '0.3'
      });
    });
  } catch (err) {
    console.error('[Sitemap Generator] Error fetching legal pages:', err);
  }

  // Build the XML sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(item => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const destPath = path.join(__dirname, '../public/sitemap.xml');
  const rootPath = path.join(__dirname, '../sitemap.xml');
  fs.writeFileSync(destPath, xml, 'utf8');
  fs.writeFileSync(rootPath, xml, 'utf8');
  console.log(`[Sitemap Generator] Successfully generated sitemap with ${sitemapUrls.length} links to public/sitemap.xml and root sitemap.xml`);
}

run();
