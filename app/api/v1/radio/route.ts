import { NextResponse } from 'next/server';

// Working verified Nepali FM radio streams (tested 2026-09-07)
const STATIONS = [
  {
    id: 'radiokantipur',
    name: 'रेडियो कान्तिपुर (Radio Kantipur)',
    freq: '96.1 MHz',
    loc: 'काठमाडौँ',
    streamUrl: 'https://radio-broadcast.ekantipur.com/stream',
    website: 'https://ekantipur.com/radio'
  },
  {
    id: 'radionepal',
    name: 'रेडियो नेपाल (Radio Nepal)',
    freq: '100.0 MHz',
    loc: 'सिंहदरबार, काठमाडौँ',
    streamUrl: 'https://streaming.softnep.net:10982/;stream.mp3',
    website: 'https://radionepal.gov.np'
  },
  {
    id: 'sagarmatha',
    name: 'रेडियो सगरमाथा (Radio Sagarmatha)',
    freq: '102.4 MHz',
    loc: 'काठमाडौँ',
    streamUrl: 'https://streaming.softnep.net:10952/;stream.mp3',
    website: 'https://radiosagarmatha.org'
  },
  {
    id: 'imagefm',
    name: 'इमेज एफएम (Image FM)',
    freq: '97.9 MHz',
    loc: 'काठमाडौँ',
    streamUrl: 'https://streaming.softnep.net:10972/;stream.mp3',
    website: 'https://imagefm.com.np'
  },
  {
    id: 'bbcnepali',
    name: 'बीबीसी नेपाली (BBC Nepali)',
    freq: 'Online',
    loc: 'आन्तर्राष्ट्रिय',
    streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_nepali_radio',
    website: 'https://bbc.com/nepali'
  }
];

export async function GET() {
  return NextResponse.json({ status: 'success', stations: STATIONS });
}
