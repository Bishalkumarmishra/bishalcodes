import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const feeds = [
      { name: 'OnlineKhabar', url: 'https://www.onlinekhabar.com/feed', domain: 'onlinekhabar.com', defaultCategory: 'ताजा' },
      { name: 'Ratopati', url: 'https://www.ratopati.com/feed', domain: 'ratopati.com', defaultCategory: 'ताजा' },
      { name: 'Setopati', url: 'https://www.setopati.com/feed', domain: 'setopati.com', defaultCategory: 'ताजा' },
      { name: 'Nagarik News', url: 'https://nagariknews.nagariknetwork.com/feed', domain: 'nagariknews.nagariknetwork.com', defaultCategory: 'समाचार' },
      { name: 'Khabarhub', url: 'https://nepali.khabarhub.com/feed/', domain: 'khabarhub.com', defaultCategory: 'ताजा' },
      { name: 'Baahrakhari', url: 'https://baahrakhari.com/feed/', domain: 'baahrakhari.com', defaultCategory: 'समाचार' }
    ];

    const allNews: any[] = [];

    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          next: { revalidate: 180 }
        });

        if (res.ok) {
          const xml = await res.text();
          // Extract <item> tags
          const itemBlocks = xml.split('<item>').slice(1);
          
          let count = 0;
          for (const block of itemBlocks) {
            if (count >= 10) break;
            const endIdx = block.indexOf('</item>');
            const itemXml = endIdx !== -1 ? block.substring(0, endIdx) : block;

            // Extract Title
            const titleMatch = itemXml.match(/<title>(.*?)<\/title>/s);
            let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim() : '';

            // Extract Link
            const linkMatch = itemXml.match(/<link>(.*?)<\/link>/s);
            let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim() : '';

            // Extract PubDate
            const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/s);
            let pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

            // Extract Category
            const catMatch = itemXml.match(/<category>(.*?)<\/category>/s);
            let category = catMatch ? catMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim() : feed.defaultCategory;

            // Extract Real Banner Image URL
            let image = '';
            
            // 1. Check media:content or media:thumbnail
            const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
            if (mediaMatch && mediaMatch[1]) {
              image = mediaMatch[1];
            }

            // 2. Check enclosure
            if (!image) {
              const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
              if (enclosureMatch && enclosureMatch[1]) {
                image = enclosureMatch[1];
              }
            }

            // 3. Check <img> tag inside description or content:encoded
            if (!image) {
              const imgTagMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgTagMatch && imgTagMatch[1]) {
                image = imgTagMatch[1];
              }
            }

            // Extract clean description summary snippet
            let description = '';
            const descMatch = itemXml.match(/<description>(.*?)<\/description>/s);
            if (descMatch) {
              const rawDesc = descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
              description = rawDesc.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            }

            if (title && link) {
              allNews.push({
                id: `${feed.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                title,
                link,
                image: image || null,
                source: feed.name,
                domain: feed.domain,
                pubDate,
                category,
                description: description ? description.slice(0, 240) + '...' : ''
              });
              count++;
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching feed ${feed.name}:`, err);
      }
    }

    // Filter by category if requested
    let filteredNews = allNews;
    if (categoryFilter && categoryFilter !== 'all') {
      filteredNews = allNews.filter(n => n.category.includes(categoryFilter) || n.source.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedNews = filteredNews.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      status: 'success',
      total: filteredNews.length,
      page,
      limit,
      source: 'Official Nepali Media Real-Time RSS Stream',
      news: paginatedNews.length > 0 ? paginatedNews : allNews
    });
  } catch (e: any) {
    console.error('News route error:', e);
    return NextResponse.json({
      status: 'error',
      message: e.message || 'Failed to fetch live news'
    }, { status: 500 });
  }
}
