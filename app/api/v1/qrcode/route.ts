import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const size = parseInt(searchParams.get('size') || '250', 10);
    const margin = parseInt(searchParams.get('margin') || '1', 10);
    const color = searchParams.get('color') || '#000000';
    const bg = searchParams.get('bg') || '#ffffff';
    const format = searchParams.get('format') || 'image'; // 'image' or 'json'

    if (!text) {
      return NextResponse.json({ error: 'Text/URL parameter is required.' }, { status: 400 });
    }

    const options: QRCode.QRCodeRenderersOptions = {
      width: isNaN(size) ? 250 : size,
      margin: isNaN(margin) ? 1 : margin,
      color: {
        dark: color,
        light: bg,
      },
    };

    if (format === 'json') {
      const dataUrl = await QRCode.toDataURL(text, options);
      return NextResponse.json({ success: true, dataUrl });
    }

    // Generate binary PNG buffer
    const pngBuffer = await QRCode.toBuffer(text, options);

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('QR Code API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
