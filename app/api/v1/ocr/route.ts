import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType = 'image/jpeg' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Base64 image data is required.' }, { status: 400 });
    }

    // Strip out base64 prefixes if present (e.g. data:image/png;base64,)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        'Extract all readable text from this image. Output only the extracted text exactly as it appears, preserving layout if possible. Do not add any introduction, headers, or explanations.'
      ]
    });

    return NextResponse.json({
      success: true,
      text: response.text || ''
    });

  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract text from image.' }, { status: 500 });
  }
}
