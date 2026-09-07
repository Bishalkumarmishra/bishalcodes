import { NextResponse } from 'next/server';

// Scrapes live NEPSE data from ShareSansar (public site, no auth needed)
async function fetchNEPSE() {
  const res = await fetch('https://www.sharesansar.com/market', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    next: { revalidate: 120 } // Cache 2 mins
  });

  if (!res.ok) throw new Error('ShareSansar fetch failed');
  const html = await res.text();

  // Parse NEPSE Index from first table row (Table 0)
  const tableBodies = [...html.matchAll(/<table[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g)];

  let index = '—', change = '—', percent = '—', turnover = '—', isUp = true;

  if (tableBodies[0]) {
    const firstRow = tableBodies[0][1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/);
    if (firstRow) {
      const cols = [...firstRow[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
        .map(c => c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
      // cols: [NEPSE Index, open, high, low, close, pointChange, percentChange, turnover]
      if (cols.length >= 8) {
        index = cols[4] || cols[3]; // close or low fallback
        const raw = cols[5];
        isUp = !raw.startsWith('-');
        change = (isUp ? '+' : '') + raw;
        percent = (isUp ? '+' : '') + cols[6] + '%';
        const t = parseFloat(cols[7].replace(/,/g, ''));
        turnover = isNaN(t) ? cols[7] : (t / 1e9).toFixed(2) + ' Arba';
      }
    }
  }

  // Parse Gainers (Table 2) and Losers (Table 3)
  const parseTickers = (body: string, isGainer: boolean) => {
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    return rows.slice(0, 8).map(r => {
      const cols = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
        .map(c => c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
      return cols.length >= 4 ? {
        sym: cols[0],
        ltp: cols[1],
        chg: (isGainer ? '+' : '') + cols[3] + '%',
        up: isGainer
      } : null;
    }).filter(Boolean);
  };

  const gainers = tableBodies[2] ? parseTickers(tableBodies[2][1], true) : [];
  const losers = tableBodies[3] ? parseTickers(tableBodies[3][1], false) : [];

  return { index, change, percent, turnover, isUp, gainers, losers };
}

export async function GET() {
  try {
    const data = await fetchNEPSE();
    return NextResponse.json({ status: 'success', source: 'sharesansar.com', ...data });
  } catch (e) {
    return NextResponse.json({
      status: 'error',
      source: 'sharesansar.com',
      index: '—',
      change: '—',
      percent: '—',
      turnover: '—',
      isUp: true,
      gainers: [],
      losers: [],
      error: 'Market data temporarily unavailable. Retry shortly.'
    });
  }
}
