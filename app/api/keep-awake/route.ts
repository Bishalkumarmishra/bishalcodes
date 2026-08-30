import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knopoetvssfyxmvggqei.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-lTSqONdT5KgK3D2d8102Q_8t9yXYbe';

    // 1. Direct REST ping to keep database active
    const restPing = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      cache: 'no-store'
    }).catch(() => null);

    // 2. Storage Bucket query via SDK
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.storage.getBucket('transfers').catch(() => ({ data: null, error: null }));

    const isAwake = restPing?.ok || (error && error.message === 'The resource was not found') || !!data;

    return NextResponse.json({
      status: isAwake ? 'Awake!' : 'Warning',
      time: new Date().toISOString(),
      restStatus: restPing?.status || 'Network Error',
      supabaseUrl,
      message: 'Supabase pinged successfully to prevent auto-pause.'
    });
  } catch (err: any) {
    console.error('Keep-awake error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
