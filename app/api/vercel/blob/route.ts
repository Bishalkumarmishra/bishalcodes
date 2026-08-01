import { NextResponse } from 'next/server';
import { list, put, del } from '@vercel/blob';

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'BLOB_READ_WRITE_TOKEN is not configured on Vercel.',
        blobs: []
      });
    }

    const { blobs } = await list();
    return NextResponse.json({
      success: true,
      connected: true,
      blobs: blobs.map(b => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Failed to list Blob files'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, message: 'BLOB_READ_WRITE_TOKEN missing' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const blob = await put(file.name, file, { access: 'public' });
    return NextResponse.json({ success: true, blob });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ success: false, message: 'BLOB_READ_WRITE_TOKEN missing' }, { status: 400 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, message: 'URL parameter required' }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ success: true, message: 'Blob deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
