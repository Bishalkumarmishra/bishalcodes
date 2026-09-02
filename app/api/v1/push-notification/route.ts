import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/services/pushConfig';
import { db } from '@/services/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { getActiveSubscriptions, removeSubscription } from '@/services/pushSubscriptionStore';

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

// In-memory broadcast fallback cache
let memoryNotifications: any[] = [];

export async function GET() {
  let notifications: any[] = [];
  try {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    notifications = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore fetch notifications notice:', err);
  }

  if (notifications.length === 0 && memoryNotifications.length > 0) {
    notifications = memoryNotifications;
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

    const notificationPayload: Record<string, any> = {
      id: 'notif-' + Date.now(),
      title,
      message,
      actionUrl: actionUrl || 'https://bishalcodes.com/tools/file_transfer',
      fileUrl: fileUrl || '',
      targetAudience: targetAudience || 'all',
      timestamp: Date.now(),
      status: 'sent'
    };

    // 1. Store in-memory cache immediately
    memoryNotifications.unshift(notificationPayload);
    if (memoryNotifications.length > 50) memoryNotifications.pop();

    // 2. Non-blocking async firestore save in background (sanitized doc object)
    const firestoreDoc = { ...notificationPayload };
    if (!firestoreDoc.fileUrl) delete firestoreDoc.fileUrl;

    setDoc(doc(db, 'notifications', notificationPayload.id), firestoreDoc).catch((e) => {
      console.warn('Background Firestore notification write warning:', e);
    });

    // ── 3. Ultra-fast Web Push Broadcast (Parallelized Concurrent Streams) ──
    const allSubsMap = new Map<string, any>();

    // A) Immediately load In-Memory Subscriptions (0ms latency)
    const memSubs = getActiveSubscriptions();
    for (const sub of memSubs) {
      if (sub.endpoint) allSubsMap.set(sub.endpoint, sub);
    }

    // B) Fetch Firestore Subscriptions in parallel
    try {
      const subSnapshot = await getDocs(collection(db, 'push_subscriptions'));
      subSnapshot.forEach((d) => {
        const data = d.data();
        if (data.endpoint && data.keys) {
          allSubsMap.set(data.endpoint, data);
        }
      });
    } catch (e) {
      console.warn('Firestore push_subscriptions fetch warning:', e);
    }

    const targetSubscriptions = Array.from(allSubsMap.values());
    console.log(`⚡ [Lightning Push] Broadcasting to ${targetSubscriptions.length} global endpoints...`);

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

    // Dispatch all WebPush streams concurrently in parallel
    const sendPromises = targetSubscriptions.map((sub) => {
      const isApple = sub.endpoint && sub.endpoint.includes('apple.com');
      const options: webpush.RequestOptions = {
        TTL: 86400,
        urgency: 'high'
      };

      if (isApple) {
        options.headers = {
          'apns-push-type': 'alert',
          'apns-priority': '10'
        };
      }

      return webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: sub.keys
      }, pushPayloadString, options)
      .then(() => { successCount++; })
      .catch(async (err: any) => {
        failCount++;
        console.warn(`[WebPush] Status ${err.statusCode} for ${sub.endpoint}:`, err.message);
        if (err.statusCode === 410) {
          await removeSubscription(sub.endpoint);
          deleteDoc(doc(db, 'push_subscriptions', docIdFromEndpoint(sub.endpoint))).catch(() => {});
        }
      });
    });

    // Run parallel high-speed delivery streams
    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Lightning Push delivered! (${successCount} endpoints reached instantly).`,
      payload: notificationPayload,
      notifications: memoryNotifications,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const apiKey = searchParams.get('apiKey');

    if (apiKey !== 'BISHALCODES_API_KEY_LIVE_99812') {
      return NextResponse.json({ error: 'Unauthorized API Key' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Remove from in-memory array cache
    memoryNotifications = memoryNotifications.filter((n) => n.id !== id);

    // Delete from Firestore
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.warn('Firestore delete doc notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${id} deleted permanently from database and server.`
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function docIdFromEndpoint(endpoint: string): string {
  return Buffer.from(endpoint).toString('base64').replace(/=/g, '').slice(-40);
}



