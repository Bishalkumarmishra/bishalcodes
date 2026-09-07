import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let lat = searchParams.get('lat');
  let lon = searchParams.get('lon');
  let city = searchParams.get('city');

  try {
    // If lat/lon not provided by browser GPS, detect location from IP
    if (!lat || !lon) {
      try {
        const ipRes = await fetch('http://ip-api.com/json/', { next: { revalidate: 3600 } });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData?.lat && ipData?.lon) {
            lat = String(ipData.lat);
            lon = String(ipData.lon);
            if (!city && ipData.city) {
              city = ipData.city;
            }
          }
        }
      } catch (err) {
        console.warn('IP location fetch failed:', err);
      }
    }

    // Default to Kathmandu if IP geolocation failed
    if (!lat || !lon) {
      lat = '27.7172';
      lon = '85.3240';
      city = city || 'Kathmandu';
    }

    // Reverse geocode to get city name if missing
    if (!city && lat && lon) {
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          { next: { revalidate: 86400 } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          city = geoData.city || geoData.locality || geoData.principalSubdivision || 'Kathmandu';
        }
      } catch (_) {
        city = 'Kathmandu';
      }
    }

    // Fetch real-time weather from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      { next: { revalidate: 600 } }
    );

    if (weatherRes.ok) {
      const data = await weatherRes.json();
      const temp = Math.round(data.current_weather?.temperature || 28);
      const isDay = data.current_weather?.is_day === 1;

      return NextResponse.json({
        status: 'success',
        city: city || 'Kathmandu',
        temp_celsius: temp,
        weather_code: data.current_weather?.weathercode || 0,
        is_day: isDay,
        condition_ne: isDay ? 'घाम लाग्ने' : 'सफा रात'
      });
    }
  } catch (err) {
    console.error('Weather GET error:', err);
  }

  return NextResponse.json({
    status: 'success',
    city: city || 'Kathmandu',
    temp_celsius: 28,
    weather_code: 0,
    is_day: true,
    condition_ne: 'घाम लाग्ने'
  });
}
