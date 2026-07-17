import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '../auth';

export const dynamic = 'force-dynamic';

const CURRENCY_SYMBOLS = [
  'USDNPR=X', 'USDINR=X', 'USDPKR=X', 'USDLKR=X', 'USDBDT=X',
  'USDIDR=X', 'USDMUR=X', 'USDSCR=X', 'USDEUR=X', 'USDGBP=X',
  'USDCAD=X', 'USDAUD=X', 'USDJPY=X', 'USDCNY=X', 'USDAED=X',
  'USDSAR=X', 'USDMYR=X', 'USDSGD=X', 'USDKRW=X', 'USDTHB=X',
  'USDQAR=X', 'USDKWD=X'
];

let cache: { rates: Record<string, number>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

async function fetchRate(symbol: string): Promise<{ code: string; rate: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 600 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!rate) return null;
    const code = symbol.replace('USD', '').replace('=X', '');
    return { code, rate };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.isValid) return authResult.errorResponse!;

    const { searchParams } = new URL(request.url);
    const base = (searchParams.get('base') || 'USD').toUpperCase();

    let rates: Record<string, number> = {};

    // Use cached rates if available
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      rates = { ...cache.rates };
    } else {
      const results = await Promise.allSettled(
        CURRENCY_SYMBOLS.map(sym => fetchRate(sym))
      );

      rates['USD'] = 1.0; // Base reference
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { code, rate } = result.value;
          rates[code] = rate;
        }
      }

      if (Object.keys(rates).length <= 1) {
        return NextResponse.json({ error: 'Failed to retrieve rates from source.' }, { status: 502 });
      }

      cache = { rates, fetchedAt: Date.now() };
    }

    // Convert base currency if not USD
    if (base !== 'USD') {
      const baseToUsdRate = rates[base];
      if (!baseToUsdRate) {
        return NextResponse.json({ error: `Unsupported base currency: ${base}` }, { status: 400 });
      }
      
      const convertedRates: Record<string, number> = {};
      const usdInBase = 1 / baseToUsdRate;

      for (const [code, rateInUsd] of Object.entries(rates)) {
        if (code === base) {
          convertedRates[code] = 1.0;
        } else if (code === 'USD') {
          convertedRates[code] = parseFloat(usdInBase.toFixed(6));
        } else {
          // Convert relative currency: Rate (USD -> Target) / Rate (USD -> Base)
          convertedRates[code] = parseFloat((rateInUsd / baseToUsdRate).toFixed(6));
        }
      }
      rates = convertedRates;
    }

    return NextResponse.json({
      success: true,
      base,
      rates,
      timestamp: Math.floor(Date.now() / 1000)
    });

  } catch (error: any) {
    console.error('Currency API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
