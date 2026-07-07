import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Currency symbols to fetch from Yahoo Finance
const CURRENCY_SYMBOLS = [
  'USDNPR=X',
  'USDINR=X',
  'USDPKR=X',
  'USDLKR=X',
  'USDBDT=X',
  'USDIDR=X',
  'USDMUR=X',
  'USDSCR=X',
  'USDEUR=X',
  'USDGBP=X',
  'USDCAD=X',
  'USDAUD=X',
  'USDJPY=X',
  'USDCNY=X',
  'USDAED=X',
  'USDSAR=X',
  'USDMYR=X',
  'USDSGD=X',
  'USDKRW=X',
  'USDTHB=X',
  'USDQAR=X',
  'USDKWD=X',
];

// Cache so we don't hammer Yahoo Finance on every request
let cache: { rates: Record<string, number>; fetchedAt: number; marketTime: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchRate(symbol: string): Promise<{ code: string; rate: number; marketTime: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    next: { revalidate: 300 }, // Next.js cache 5min
  });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) return null;
  const code = symbol.replace('USD', '').replace('=X', '');
  return { code, rate: meta.regularMarketPrice, marketTime: meta.regularMarketTime };
}

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      rates: cache.rates,
      marketTime: cache.marketTime,
      source: 'Yahoo Finance (cached)',
      cachedAt: new Date(cache.fetchedAt).toISOString(),
    });
  }

  try {
    // Fetch all currencies in parallel
    const results = await Promise.allSettled(
      CURRENCY_SYMBOLS.map((sym) => fetchRate(sym))
    );

    const rates: Record<string, number> = {};
    let latestMarketTime = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const { code, rate, marketTime } = result.value;
        rates[code] = rate;
        if (marketTime > latestMarketTime) latestMarketTime = marketTime;
      }
    }

    if (Object.keys(rates).length === 0) {
      return NextResponse.json({ success: false, error: 'No rates fetched from Yahoo Finance.' }, { status: 502 });
    }

    // Update cache
    cache = { rates, fetchedAt: Date.now(), marketTime: latestMarketTime };

    return NextResponse.json({
      success: true,
      rates,
      marketTime: latestMarketTime,
      source: 'Yahoo Finance',
      cachedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[currency-rates] fetch failed:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal error.' }, { status: 500 });
  }
}
