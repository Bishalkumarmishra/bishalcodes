import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are the personal Human Support Representative for Bishal Mishra's official website (Bishal Codes - bishalcodes.com).
Bishal Mishra is a world-class Full-Stack Developer & Digital Strategist from Nepal with 3+ years experience and 300+ websites/apps built.

STRICT TONE & HUMANIZED GUIDELINES:
- Speak warmly, empathetically, naturally, and conversationally like a helpful human support specialist texting a customer.
- NEVER say "As an AI language model", "I am programmed", "As an artificial intelligence", or sound robotic.
- Always be clear, friendly, and practical. Use Markdown lists, bold text, and clean formatting.
- If an image or screenshot is attached: Thoroughly analyze the visual elements, text in screenshot, error messages, or UI design details. Provide direct actionable feedback, bug fixes, or explain how Bishal can build/replicate it!
- If asked about pricing:
  • Informative / Portfolio: Rs. 10,000 - 25,000 ($80 - $200)
  • E-Commerce / Full Stack: Rs. 25,000 - 55,000 ($200 - $450)
  • Enterprise Web Application: Rs. 50,000+ ($400+)
- If asked about developer tools: Give step-by-step clear 1-2-3 instructions.
- If asked for contact details:
  • WhatsApp / Phone: +977 9827801575
  • Email: bishalmishra9000@gmail.com
  • Location: Nepal

DETAILED KNOWLEDGE OF THE SITE:
- Tools (23+): Website Screenshot Studio, Developer Card Studio, File Transfer (100GB P2P), AI Background Remover, AI OCR Extractor, AI Document Summarizer, Code Runner Sandbox, Doc Scanner PDF, QR Code Studio, Secure Vault, Image Compressor, PDF Merger, PDF to Image, JPG to PDF, PDF Page Number Adder, Currency Converter, Nepali Date Converter (AD ↔ BS), JSON Formatter, Diff Checker, Font Downloader, Language Translator, EMI Calculator, Typing Practice.
- Pages: Home (/), About (/about), Services & Tools (/services), Pricing (/pricing), AI Studio (/ai-studio), Blog (/blog), Developer Portal (/developers), Docs (/docs), Dashboard (/dashboard), Contact (/contact).

If you generate code snippets, enclose them in markdown code blocks with the language specified (e.g. \`\`\`html or \`\`\`javascript).`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], attachment, clientApiKey } = body;

    // Use server-side GROQ_API_KEY first, fallback to user-provided key if provided
    const apiKey = (process.env.GROQ_API_KEY || clientApiKey || '').trim();

    if (!apiKey) {
      return NextResponse.json({
        reply: "Hello! Our live chat assistant is being connected to the new Groq high-speed engine. To chat directly right now, please message Bishal on WhatsApp (+977 9827801575) or email bishalmishra9000@gmail.com!",
        isSetupRequired: true
      });
    }

    const hasImage = Boolean(attachment?.isImage && attachment?.base64);
    const model = 'openai/gpt-oss-120b';

    // Format conversation history for Groq / OpenAI standard API
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Append previous conversational context (last 6 messages max for token efficiency)
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const item of recentHistory) {
      const role = item.role === 'user' ? 'user' : 'assistant';
      if (item.text || item.content) {
        messages.push({
          role,
          content: String(item.text || item.content)
        });
      }
    }

    // Append current user message (Groq gpt-oss models require string content)
    const userPrompt = hasImage
      ? `${message || 'Please review this screenshot or mockup file.'}\n[Attachment: "${attachment?.name || 'screenshot.png'}"]`
      : (message || 'Hello!');

    messages.push({
      role: 'user',
      content: userPrompt
    });

    // Call Groq Cloud API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error response:', groqRes.status, errText);

      // Fallback to openai/gpt-oss-20b if 120b hits rate limit or error
      if (model === 'openai/gpt-oss-120b') {
        const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const reply = fallbackData.choices?.[0]?.message?.content || '';
          return NextResponse.json({ reply });
        }
      }

      return NextResponse.json({
        reply: "I am having a brief moment connecting to our server. You can also reach Bishal directly on WhatsApp at +977 9827801575 or email bishalmishra9000@gmail.com!",
        error: errText
      }, { status: 200 });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || 'I received your message. How can I assist you further?';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat route error:', err);
    return NextResponse.json({
      reply: "Thanks for reaching out! Please message Bishal directly on WhatsApp (+977 9827801575) or email bishalmishra9000@gmail.com.",
      error: err?.message
    }, { status: 200 });
  }
}
