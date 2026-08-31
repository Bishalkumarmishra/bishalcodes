import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/services/pushConfig';
import { db } from '@/services/firebase';

export const dynamic = 'force-dynamic';

// Configure Web Push with VAPID credentials
try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.warn('Web Push VAPID setup notice:', e);
}

export async function GET() {
  let notifications: any[] = [];
  try {
    const snapshot = await db.collection('notifications').orderBy('timestamp', 'desc').limit(50).get();
    notifications = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    // If Admin SDK collection method unavailable in client db instance, fallback to raw REST / empty array
  }

  return NextResponse.json({
    success: true,
    notifications,
    latestTimestamp: notifications.length > 0 ? notifications[0].timestamp : 0
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

    // Save to Firestore permanently so all devices fetch this broadcast
    try {
      await db.collection('notifications').doc(notificationPayload.id).set(notificationPayload);
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }

    // ── 1. Fetch all Web Push subscriptions from Firestore ──
    const targetSubscriptions: any[] = [];
    try {
      const subSnapshot = await db.collection('push_subscriptions').get();
      subSnapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.endpoint && data.keys) {
          targetSubscriptions.push(data);
        }
      });
    } catch (e) {
      console.warn('Firestore push_subscriptions fetch warning:', e);
    }

    console.log(`🚀 Sending Web Push to ${targetSubscriptions.length} global endpoints...`);

    const pushPayloadString = JSON.stringify({
      title: notificationPayload.title,
      body: notificationPayload.message,
      message: notificationPayload.message,
      actionUrl: notificationPayload.actionUrl,
      fileUrl: notificationPayload.fileUrl,
      url: notificationPayload.actionUrl,
      image: notificationPayload.fileUrl,
      icon: '/apple-touch-icon.png',
      badge: '/favicon.svg',
      id: notificationPayload.id,
      timestamp: notificationPayload.timestamp
    });

    let successCount = 0;
    let failCount = 0;

    const sendPromises = targetSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, pushPayloadString, {
          TTL: 86400,
          urgency: 'high'
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await db.collection('push_subscriptions').doc(docIdFromEndpoint(sub.endpoint)).delete();
          } catch (e) {}
        }
      }
    });

    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Push broadcast delivered successfully! (${successCount} Web Push endpoints delivered).`,
      payload: notificationPayload,
      deliveryStats: {
        totalTargeted: targetSubscriptions.length,
        successCount,
        failCount
      }
    });
  } catch (error: any) {
    console.error('Error broadcasting push notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function docIdFromEndpoint(endpoint: string): string {
  return Buffer.from(endpoint).toString('base64').replace(/=/g, '').slice(-40);
}

