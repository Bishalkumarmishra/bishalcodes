import { NextResponse } from 'next/server';
import { get, getAll } from '@vercel/edge-config';

export async function GET() {
  try {
    const edgeConfigConnectionString = process.env.EDGE_CONFIG || process.env.GLOBAL_CONFIG;
    if (!edgeConfigConnectionString) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'EDGE_CONFIG environment variable is not configured on Vercel.',
        config: {
          enable_ai_tools: true,
          maintenance_mode: false,
          announcement_banner: '',
          max_file_upload_mb: 50,
          rate_limit_per_minute: 60,
        }
      });
    }

    const config = await getAll();
    return NextResponse.json({
      success: true,
      connected: true,
      config: config || {}
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Failed to read Edge Config'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 });
    }

    const edgeConfigId = process.env.EDGE_CONFIG_ID || (process.env.EDGE_CONFIG ? process.env.EDGE_CONFIG.split('/')[3]?.split('?')[0] : null);
    const vercelToken = process.env.VERCEL_BEARER_TOKEN;

    if (!edgeConfigId || !vercelToken) {
      return NextResponse.json({
        success: false,
        message: 'Writing to Edge Config requires EDGE_CONFIG_ID and VERCEL_BEARER_TOKEN environment variables.'
      }, { status: 400 });
    }

    // Write update using Vercel REST API
    const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key,
            value,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ success: false, message: data.error?.message || 'Failed to update Edge Config item' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
