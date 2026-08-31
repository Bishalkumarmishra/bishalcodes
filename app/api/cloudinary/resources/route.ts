import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'de240foz4';
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '685633191642553';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || 'sdKE63yHU-3PUhGuEuoVaPBHJ7g';

export async function GET() {
  try {
    const authHeader = 'Basic ' + Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

    // 1. Fetch images from Cloudinary Search API
    const searchUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`;
    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        expression: 'resource_type:image OR resource_type:video OR resource_type:raw',
        max_results: 500,
        sort_by: [{ created_at: 'desc' }],
      }),
      next: { revalidate: 0 },
    });

    let cloudinaryResources: any[] = [];
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      cloudinaryResources = searchData.resources || [];
    } else {
      console.warn('Cloudinary search failed, fallback to listing resources:', await searchRes.text());
      // Fallback: fetch images listing
      const listUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=500`;
      const listRes = await fetch(listUrl, {
        headers: { 'Authorization': authHeader },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        cloudinaryResources = listData.resources || [];
      }
    }

    const items = cloudinaryResources.map((item: any) => {
      let detectedType: 'image' | 'video' | 'pdf' | 'raw' = 'image';
      if (item.resource_type === 'video') detectedType = 'video';
      else if (item.format === 'pdf' || item.resource_type === 'raw') detectedType = 'pdf';

      const filename = item.filename || item.public_id.split('/').pop() || item.public_id;

      return {
        id: item.public_id,
        name: filename,
        url: item.secure_url,
        type: detectedType,
        publicId: item.public_id,
        sizeBytes: item.bytes,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        source: 'Cloudinary Account'
      };
    });

    return NextResponse.json({ success: true, count: items.length, resources: items }, { status: 200 });
  } catch (error: any) {
    console.error('Cloudinary resources fetch error:', error);
    return NextResponse.json({ success: false, error: error.message, resources: [] }, { status: 500 });
  }
}
