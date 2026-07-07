import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Limit text length to prevent exceeding token limits on massive PDFs
    const maxChars = 200000; // ~50k words
    const truncatedText = text.substring(0, maxChars);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfiguration: GEMINI_API_KEY is not set.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Read the following text extracted from a PDF document and provide a comprehensive, well-structured summary.

CRITICAL INSTRUCTION: DO NOT include any conversational filler, introductory text, or pleasantries (e.g., "Here is the summary," "As an expert," etc.). Output EXACTLY and ONLY the markdown formatted summary starting directly with the first section heading.

Please format your response using Markdown with the following sections (if applicable to the content):
- **Purpose and scope**: Assess what the document is about and what it aims to achieve.
- **Methods**: Describe the methodology, analysis, or approach used.
- **Key findings**: Use bullet points to list the most critical positive drivers, negative drivers, outcomes, or facts.
- **Conclusion**: A brief final takeaway.

If the document is a generic letter, article, or short text that doesn't fit a research format, simply provide a clear, concise bulleted summary of the most important points.

TEXT TO SUMMARIZE:
"""
${truncatedText}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text });
  } catch (error: any) {
    console.error('AI Summarization API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate summary' }, { status: 500 });
  }
}
