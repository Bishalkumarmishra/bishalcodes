import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.isValid) return authResult.errorResponse!;

    const body = await request.json();
    const { json, action = 'format', space = 2 } = body;

    if (json === undefined || json === null) {
      return NextResponse.json({ error: 'JSON string parameter is required.' }, { status: 400 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: err.message || 'Invalid JSON syntax.',
        formatted: null
      });
    }

    if (action === 'validate') {
      return NextResponse.json({
        success: true,
        valid: true,
        error: null,
        formatted: null
      });
    }

    let formatted: string;
    if (action === 'minify') {
      formatted = JSON.stringify(parsed);
    } else {
      const indent = isNaN(parseInt(space, 10)) ? 2 : parseInt(space, 10);
      formatted = JSON.stringify(parsed, null, indent);
    }

    return NextResponse.json({
      success: true,
      valid: true,
      error: null,
      formatted
    });

  } catch (error: any) {
    console.error('JSON Formatter API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
