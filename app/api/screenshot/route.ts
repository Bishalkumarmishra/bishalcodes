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

    let microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&embed=screenshot.url&screenshot.fullPage=${fullPage}&viewport.width=${width}&viewport.height=${height}&screenshot.type=${format}&viewport.deviceScaleFactor=${dpr}&waitUntil=${waitUntil}`;

    if (waitForTimeout && waitForTimeout !== '0') {
      microlinkUrl += `&waitForTimeout=${waitForTimeout}`;
    }
    if (omitBackground === 'true') {
      microlinkUrl += `&screenshot.omitBackground=true`;
    }

    let res = await fetch(microlinkUrl, {
      next: { revalidate: 3600 }
    });

    // Fallback if Microlink times out or fails (Free tier limit)
    if (!res.ok) {
      console.warn('Microlink failed, attempting fallback to Thum.io...');
      // Thum.io provides a highly reliable free screenshot service
      const fallbackUrl = `https://image.thum.io/get/width/${width}/crop/${height}/${targetUrl}`;
      res = await fetch(fallbackUrl);
      
      if (!res.ok) {
        return NextResponse.json({ 
          error: 'Capture failed completely. The website might be blocking bots, or took too long to respond. Try checking the URL.' 
        }, { status: 502 });
      }
      
      // Thum.io directly returns the image
      const blob = await res.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'image/jpeg', // Thum.io returns jpeg
          'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
      });
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
