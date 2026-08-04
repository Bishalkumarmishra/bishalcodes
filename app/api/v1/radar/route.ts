import { NextResponse } from 'next/server';

interface RadarDevice {
  id: string;
  name: string;
  platform: 'android_app' | 'ios_web' | 'android_web' | 'desktop_web';
  ip?: string;
  port?: number;
  status: 'active' | 'receiving' | 'sending';
  lastSeen: number;
}

// In-memory active devices store
let activeDevices: Map<string, RadarDevice> = new Map();

// Clean up inactive devices (older than 15 seconds)
function cleanupStaleDevices() {
  const now = Date.now();
  for (const [id, device] of activeDevices.entries()) {
    if (now - device.lastSeen > 15000) {
      activeDevices.delete(id);
    }
  }
}

export async function GET() {
  cleanupStaleDevices();
  const devices = Array.from(activeDevices.values());
  return NextResponse.json({
    success: true,
    count: devices.length,
    devices
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, platform, ip, port, status } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Device ID and Name are required' }, { status: 400 });
    }

    const device: RadarDevice = {
      id,
      name,
      platform: platform || 'desktop_web',
      ip: ip || '127.0.0.1',
      port: port || 12345,
      status: status || 'active',
      lastSeen: Date.now()
    };

    activeDevices.set(id, device);
    cleanupStaleDevices();

    return NextResponse.json({
      success: true,
      registeredDevice: device,
      activeDevices: Array.from(activeDevices.values())
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
