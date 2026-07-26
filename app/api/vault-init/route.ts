import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knopoetvssfyxmvggqei.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase service role key is not configured. Please set the SUPABASE_SERVICE_ROLE_KEY environment variable on your hosting dashboard.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey
    );

    // Create a signed upload URL valid for 60 minutes
    const { data, error } = await supabaseAdmin.storage
      .from('transfers')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('Vault signed URL generation failed:', error);
      return NextResponse.json({ error: error?.message || 'Failed to generate upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
    });
  } catch (err: any) {
    console.error('vault-init error:', err);
    let errorMessage = err.message || 'Internal server error';
    if (errorMessage === 'fetch failed') {
      errorMessage = 'Failed to connect to Supabase. Your Supabase project might be paused or unreachable.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
