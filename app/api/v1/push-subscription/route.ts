
import { NextResponse } from 'next/server';
import { subscriptionsStore, addSubscription, removeSubscription } from '@/services/pushSubscriptionStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: subscriptionsStore.size,
    subscriptions: Array.from(subscriptionsStore.values())
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid push subscription object' }, { status: 400 });
    }

    await addSubscription(subscription, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully',
      activeCount: subscriptionsStore.size
    });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body;
    if (endpoint) {
      await removeSubscription(endpoint);
    }
    return NextResponse.json({ success: true, activeCount: subscriptionsStore.size });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
