import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { fileName, fileSize } = await request.json();

    if (!fileName || fileSize === undefined) {
      return NextResponse.json({ error: 'Missing fileName or fileSize' }, { status: 400 });
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

    // Generate a unique transfer ID using crypto
    const transferId = crypto.randomUUID();
    const storagePath = `${transferId}/${fileName}`;

    // Create a signed upload URL (valid for 60 minutes)
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('transfers')
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      console.error('Signed URL error:', signedError);
      return NextResponse.json({ error: signedError?.message || 'Failed to create upload URL' }, { status: 500 });
    }

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upload metadata JSON to storage
    const metadata = {
      transferId,
      fileName,
      fileSize,
      storagePath,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const { error: metaError } = await supabaseAdmin.storage
      .from('transfers')
      .upload(`${transferId}/metadata.json`, metadataBuffer, {
        contentType: 'application/json',
        upsert: false,
      });

    if (metaError) {
      console.error('Metadata upload error:', metaError);
      return NextResponse.json({ error: 'Failed to store transfer metadata' }, { status: 500 });
    }

    const supabaseUrlVal = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knopoetvssfyxmvggqei.supabase.co';
    const publicFileUrl = `${supabaseUrlVal}/storage/v1/object/public/transfers/${storagePath}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bishalcodes.com';
    const downloadPageUrl = `${siteUrl}/transfer/${transferId}`;

    return NextResponse.json({
      transferId,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      storagePath,
      publicFileUrl,
      downloadPageUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('file-transfer-init error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
