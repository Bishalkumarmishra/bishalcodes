import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'de240foz4';
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '685633191642553';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || 'sdKE63yHU-3PUhGuEuoVaPBHJ7g';

function generateSignature(params: Record<string, any>, secret: string) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(toSign + secret).digest('hex');
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided for upload' }, { status: 400 });
    }

    const folder = (formData.get('folder') as string) || 'mero_patro_admin';
    const timestamp = Math.floor(Date.now() / 1000);

    // Determine resource type: image, video, or raw
    let resourceType = 'image';
    if (typeof file !== 'string' && file.type) {
      if (file.type.startsWith('video/')) resourceType = 'video';
      else if (!file.type.startsWith('image/')) resourceType = 'raw';
    }

    const paramsToSign: Record<string, any> = {
      folder,
      timestamp
    };

    const signature = generateSignature(paramsToSign, API_SECRET);

    // Prepare payload for Cloudinary API
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('api_key', API_KEY);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('file', file);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Cloudinary API upload error:', errText);
      return NextResponse.json({ success: false, error: 'Cloudinary upload failed: ' + errText }, { status: 500 });
    }

    const result = await res.json();

    return NextResponse.json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height
    });
  } catch (error: any) {
    console.error('Upload endpoint internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal upload error' }, { status: 500 });
  }
}
