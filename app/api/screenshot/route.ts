import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required.' }, { status: 400 });
    }

    const width = searchParams.get('width') || '1280';
    const height = searchParams.get('height') || '800';
    const fullPage = searchParams.get('fullPage') === 'true' ? 'true' : 'false';
    const format = searchParams.get('format') || 'png';
    const dpr = searchParams.get('dpr') || '1';
    const waitUntil = searchParams.get('waitUntil') || 'load';
    const waitForTimeout = searchParams.get('waitForTimeout') || '0';
    const omitBackground = searchParams.get('omitBackground') === 'true' ? 'true' : 'false';

    // Construct Microlink screenshot URL
    // uses embed=screenshot.url to return binary image data directly
    let microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&embed=screenshot.url&screenshot.fullPage=${fullPage}&viewport.width=${width}&viewport.height=${height}&screenshot.type=${format}&viewport.deviceScaleFactor=${dpr}&waitUntil=${waitUntil}`;

    if (waitForTimeout && waitForTimeout !== '0') {
      microlinkUrl += `&waitForTimeout=${waitForTimeout}`;
    }
    if (omitBackground === 'true') {
      microlinkUrl += `&screenshot.omitBackground=true`;
    }

    const res = await fetch(microlinkUrl, {
      next: { revalidate: 3600 } // Cache screenshots for 1 hour
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Microlink capture error:', errText);
      
      let errMsg = 'Failed to capture screenshot. Make sure the URL is valid.';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.code === 'EBRWSRTIMEOUT' || (errJson.data && errJson.data.url && errJson.data.url.includes('timeout'))) {
          errMsg = 'Capture timed out. The website took too long to load. Try setting the Readiness Event to "Network Idle Light" or "Document Loaded" in Advanced Settings.';
        } else if (errJson.message) {
          errMsg = errJson.message;
        }
      } catch (e) {
        // ignore JSON parsing errors
      }

      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || `image/${format}`;

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });

  } catch (error: any) {
    console.error('Screenshot proxy error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
