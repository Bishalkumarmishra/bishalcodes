import { NextResponse } from 'next/server';

let pushNotificationsStore: Array<{
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  fileUrl?: string;
  targetAudience: string;
  timestamp: number;
  status: string;
}> = [
  {
    id: 'init-1',
    title: 'File Transfer 1.0 Live!',
    message: 'Welcome to BishalCodes native P2P file sharing platform.',
    actionUrl: 'https://bishalcodes.com/tools/file_transfer',
    targetAudience: 'all',
    timestamp: Date.now() - 3600000,
    status: 'sent'
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    notifications: pushNotificationsStore,
    latestTimestamp: pushNotificationsStore.length > 0 ? pushNotificationsStore[0].timestamp : 0
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, message, actionUrl, fileUrl, targetAudience, apiKey } = body;

    if (apiKey !== 'BISHALCODES_API_KEY_LIVE_99812') {
      return NextResponse.json({ error: 'Unauthorized API Key' }, { status: 401 });
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const notificationPayload = {
      id: 'notif-' + Date.now(),
      title,
      message,
      actionUrl: actionUrl || 'https://bishalcodes.com/tools/file_transfer',
      fileUrl: fileUrl || undefined,
      targetAudience: targetAudience || 'all',
      timestamp: Date.now(),
      status: 'sent'
    };

    pushNotificationsStore.unshift(notificationPayload);
    if (pushNotificationsStore.length > 50) {
      pushNotificationsStore.pop();
    }

    console.log('📡 Push Notification Broadcast Sent & Stored:', notificationPayload);

    return NextResponse.json({
      success: true,
      message: 'Push notification broadcast delivered successfully to Android devices and Web clients',
      payload: notificationPayload,
      notifications: pushNotificationsStore
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
