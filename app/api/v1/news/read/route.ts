import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!res.ok) {
      return NextResponse.redirect(targetUrl);
    }

    let html = await res.text();

    // Inject CSS to completely hide headers, footers, navbars, sidebars, and ads
    const customCss = `
      <style id="clean-reader-injected-style">
        header, footer, nav, 
        .header, .footer, .site-header, .site-footer, 
        .main-header, .main-footer, .nav-bar, .navbar,
        .sidebar, .side-bar, .ad-container, .adsbygoogle,
        #header, #footer, #site-header, #site-footer, #nav,
        .ok-header, .ok-footer, .rtp-header, .rtp-footer,
        .stp-header, .stp-footer, .header-wrapper, .footer-wrapper {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        body {
          padding-top: 10px !important;
          padding-bottom: 20px !important;
        }
      </style>
    `;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${customCss}</head>`);
    } else {
      html = customCss + html;
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (e: any) {
    console.error('Error proxying news article:', e);
    return new NextResponse('Failed to load article', { status: 500 });
  }
}
