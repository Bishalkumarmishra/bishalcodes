import { NextResponse } from 'next/server';
// @ts-ignore
import { db } from '../../../services/firebase';
// @ts-ignore
import { getDoc, doc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  let apiKey = '';
  
  try {
    const geminiSnap = await getDoc(doc(db, 'settings', 'gemini'));
    if (geminiSnap.exists()) {
      apiKey = (geminiSnap.data() as any).apiKey || '';
    }
  } catch (err) {
    console.warn('Failed to fetch Gemini API key from Firestore, using environment variable fallback:', err);
  }

  // Fallback to environment variable if Firestore did not have a valid key
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    apiKey = process.env.GEMINI_API_KEY || '';
  }

  apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

  return NextResponse.json({ apiKey });
}
