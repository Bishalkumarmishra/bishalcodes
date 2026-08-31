import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/services/pushConfig';
import { supabase } from '@/services/supabase';
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

let pushNotificationsStore: Array<{
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  fileUrl?: string;
  targetAudience: string;
  timestamp: number;
  status: string;
}> = []; // Clean initial state - NO old dummy/stale notifications on app startup!

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

    console.log('📡 Push Notification Broadcast Triggered:', notificationPayload);

    // ── 1. Gather all target Web Push subscriptions worldwide ──
    const allSubsMap = new Map<string, any>();

    // A) In-memory subscriptions
    const memorySubs = getActiveSubscriptions();
    for (const sub of memorySubs) {
      if (sub.endpoint) allSubsMap.set(sub.endpoint, sub);
    }

    // B) Supabase subscriptions
    try {
      const { data: dbSubs } = await supabase.from('push_subscriptions').select('*');
      if (Array.isArray(dbSubs)) {
        for (const row of dbSubs) {
          if (row.endpoint && !allSubsMap.has(row.endpoint)) {
            allSubsMap.set(row.endpoint, {
              endpoint: row.endpoint,
              keys: {
                p256dh: row.p256dh,
                auth: row.auth
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('Supabase subscription fetch notice:', e);
    }

    const targetSubscriptions = Array.from(allSubsMap.values());
    console.log(`🚀 Sending Web Push notification to ${targetSubscriptions.length} registered global endpoints...`);

    // ── 2. Broadcast via Web Push Protocol (APNs for iPhone / FCM for Android & Desktop) ──
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
        const pushSubscriptionObj = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        await webpush.sendNotification(pushSubscriptionObj, pushPayloadString, {
          TTL: 86400, // 24 hour time to live
          urgency: 'high'
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription: ${sub.endpoint}`);
          await removeSubscription(sub.endpoint);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    return NextResponse.json({
      success: true,
      message: `Push broadcast sent! Delivered to ${successCount} devices worldwide (${failCount} unreachable).`,
      payload: notificationPayload,
      notifications: pushNotificationsStore,
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
