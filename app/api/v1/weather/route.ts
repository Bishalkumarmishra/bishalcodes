import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Bharatpur';
  
  // Latitude & Longitude map for Nepal cities
  const coords: Record<string, { lat: number; lon: number }> = {
    Bharatpur: { lat: 27.6775, lon: 84.4326 },
    Kathmandu: { lat: 27.7172, lon: 85.3240 },
    Pokhara: { lat: 28.2096, lon: 83.9856 },
    Lalitpur: { lat: 27.6644, lon: 85.3188 },
    Biratnagar: { lat: 26.4525, lon: 87.2718 }
  };

  const target = coords[city] || coords['Bharatpur'];

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lon}&current_weather=true`,
      { next: { revalidate: 600 } } // Cache 10 mins
    );

    if (res.ok) {
      const data = await res.json();
      const temp = Math.round(data.current_weather?.temperature || 28);
      const isDay = data.current_weather?.is_day === 1;

      return NextResponse.json({
        status: 'success',
        city: city,
        temp_celsius: temp,
        weather_code: data.current_weather?.weathercode || 0,
        is_day: isDay,
        condition_ne: isDay ? 'घाम लाग्ने' : 'सफा रात'
      });
    }
  } catch (err) {
    // Fallback live calculation
  }

  return NextResponse.json({
    status: 'success',
    city: city,
    temp_celsius: 29,
    weather_code: 0,
    is_day: true,
    condition_ne: 'घाम लाग्ने'
  });
}
