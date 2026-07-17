import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../auth';
import { GET as originalGET } from '../../screenshot/route';

export async function GET(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.isValid) return authResult.errorResponse!;

    return originalGET(request);
  } catch (error: any) {
    console.error('Screenshot API route wrapper error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
