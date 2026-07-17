import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { validateApiKey } from '../auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.isValid) return authResult.errorResponse!;

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text parameter is required for summarization.' }, { status: 400 });
    }

    // Limit text length to prevent exceeding token limits
    const maxChars = 200000;
    const truncatedText = text.substring(0, maxChars);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Read the following text and provide a comprehensive, well-structured summary.

CRITICAL INSTRUCTION: DO NOT include any conversational filler, introductory text, or pleasantries (e.g., "Here is the summary," "As an expert," etc.). Output EXACTLY and ONLY the markdown formatted summary starting directly with the first section heading.

Please format your response using Markdown with the following sections (if applicable to the content):
- **Purpose and scope**: Assess what the document is about and what it aims to achieve.
- **Methods/Key Points**: Describe the methodology, analysis, or approach used.
- **Key findings**: Use bullet points to list the most critical positive drivers, negative drivers, outcomes, or facts.
- **Conclusion**: A brief final takeaway.

TEXT TO SUMMARIZE:
"""
${truncatedText}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      summary: response.text || ''
    });

  } catch (error: any) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate summary.' }, { status: 500 });
  }
}
