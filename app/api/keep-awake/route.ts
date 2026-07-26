import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase credentials missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Make a lightweight request to keep the project active
    const { data, error } = await supabase.storage.getBucket('transfers');

    if (error && error.message !== 'The resource was not found') {
      console.error('Keep-awake ping error:', error);
      return NextResponse.json({ status: 'Error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'Awake!',
      time: new Date().toISOString(),
      message: 'Supabase pinged successfully to prevent auto-pause.',
    });
  } catch (err: any) {
    console.error('Keep-awake error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
