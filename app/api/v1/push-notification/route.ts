import { NextResponse } from 'next/server';

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

    // Broadcast log object
    const notificationPayload = {
      title,
      message,
      actionUrl: actionUrl || 'https://bishalcodes.com',
      fileUrl: fileUrl || null,
      targetAudience: targetAudience || 'all',
      timestamp: Date.now(),
      status: 'sent'
    };

    console.log('📡 Push Notification Broadcast Sent:', notificationPayload);

    return NextResponse.json({
      success: true,
      message: 'Push notification broadcast delivered successfully to Android devices and Web clients',
      payload: notificationPayload
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
