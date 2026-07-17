import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('apiKey');

  if (!apiKey) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Missing X-API-Key header or apiKey query parameter. Get a free sandbox key at bishalcodes.com/developers' },
        { status: 401 }
      )
    };
  }

  const isProdKey = apiKey.startsWith('bc_prod_');
  const isSandboxKey = apiKey.startsWith('bc_live_');

  if (!isProdKey && !isSandboxKey) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid X-API-Key. Get a valid key at bishalcodes.com/developers' },
        { status: 401 }
      )
    };
  }

  // If it's a sandbox key, restrict external API usage to bishalcodes.com or localhost
  if (isSandboxKey) {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';

    const isAllowedOrigin = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('bishalcodes.com') || 
      origin.includes('vercel.app') ||
      referer.includes('localhost') ||
      referer.includes('127.0.0.1') ||
      referer.includes('bishalcodes.com') ||
      referer.includes('vercel.app') ||
      host.includes('localhost') ||
      host.includes('127.0.0.1');

    if (!isAllowedOrigin) {
      return {
        isValid: false,
        errorResponse: NextResponse.json(
          { 
            error: 'Forbidden: Sandbox API keys (bc_live_xxx) are restricted to the bishalcodes.com playground. To integrate this API into your own external applications (Node, Python, Go, etc.), please purchase a Commercial Pro or Enterprise subscription to receive a production key (bc_prod_xxx).' 
          },
          { status: 403 }
        )
      };
    }
  }

  return { isValid: true };
}
