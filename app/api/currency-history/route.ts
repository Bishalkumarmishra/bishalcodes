import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Range = '1mo' | '3mo' | '6mo' | '1y';
const VALID_RANGES: Range[] = ['1mo', '3mo', '6mo', '1y'];
const VALID_INTERVALS: Record<Range, string> = {
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1wk',
  '1y':  '1wk',
};

// Simple in-memory cache per symbol+range
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol'); // e.g. USDNPR=X
  const range = (searchParams.get('range') || '1mo') as Range;

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'Missing symbol parameter.' }, { status: 400 });
  }
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ success: false, error: 'Invalid range.' }, { status: 400 });
  }

  const cacheKey = `${symbol}__${range}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const interval = VALID_INTERVALS[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Yahoo Finance responded: ${res.status}` }, { status: 502 });
    }

    const raw = await res.json();
    const result = raw?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ success: false, error: 'No data returned for this pair.' }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp || [];
    const closes: number[] = result.indicators?.quote?.[0]?.close || [];

    // Build clean [{date, close}] array, skip nulls
    const points: { date: string; close: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        points.push({
          date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
          close: closes[i],
        });
      }
    }

    const responseData = { success: true, symbol, range, points };
    cache.set(cacheKey, { data: responseData, fetchedAt: Date.now() });

    return NextResponse.json(responseData);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error.' }, { status: 500 });
  }
}
