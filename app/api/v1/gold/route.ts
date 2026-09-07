import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.sharesansar.com/bullion', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache 1 hour (gold doesn't change by minute)
    });

    if (!res.ok) throw new Error('Bullion fetch failed');
    const html = await res.text();

    // Parse Fine Gold
    const fineGoldMatch = html.match(/Fine Gold<\/u><\/h3>\s*<h4>\s*<p>(Rs\.[\d,]+\/tola)/);
    const tejabi = html.match(/Tejabi Gold<\/u><\/h3>\s*<h4>\s*<p>(Rs\.[\d,]+\/tola)/);
    const silverMatch = html.match(/Silver<\/u><\/h3>\s*<h4>\s*<p>(Rs\.[\d,]+\/tola)/);

    // Parse changes (color indicates up/down)
    const fineChangeMatch = html.match(/Fine Gold[\s\S]*?<font color="([^"]+)">([^<]+)<\/font>/);
    const tejabiChangeMatch = html.match(/Tejabi Gold[\s\S]*?<font color="([^"]+)">([^<]+)<\/font>/);

    const fineGoldPrice = fineGoldMatch ? fineGoldMatch[1].replace('Rs.', 'रु. ').replace('/tola', '') : '—';
    const tejabiPrice = tejabi ? tejabi[1].replace('Rs.', 'रु. ').replace('/tola', '') : '—';
    const silverPrice = silverMatch ? silverMatch[1].replace('Rs.', 'रु. ').replace('/tola', '') : '—';

    const fineChange = fineChangeMatch ? fineChangeMatch[2].trim() : '—';
    const tejabiChange = tejabiChangeMatch ? tejabiChangeMatch[2].trim() : '—';
    const fineUp = fineChangeMatch ? fineChangeMatch[1] !== 'red' : true;

    return NextResponse.json({
      status: 'success',
      source: 'sharesansar.com/bullion',
      fineGold: { price: fineGoldPrice, change: fineChange, up: fineUp },
      tejabiGold: { price: tejabiPrice, change: tejabiChange, up: fineUp },
      silver: { price: silverPrice, change: '—', up: true },
    });
  } catch (e) {
    return NextResponse.json({
      status: 'error',
      source: 'sharesansar.com/bullion',
      fineGold: { price: '—', change: '—', up: true },
      tejabiGold: { price: '—', change: '—', up: true },
      silver: { price: '—', change: '—', up: true },
    });
  }
}
