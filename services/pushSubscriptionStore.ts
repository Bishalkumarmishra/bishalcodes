import { supabase } from '@/services/supabase';

// Global in-memory storage for active web push subscriptions across all devices worldwide
export const subscriptionsStore = new Map<string, any>();

export function getActiveSubscriptions() {
  return Array.from(subscriptionsStore.values());
}

export async function addSubscription(subscription: any, userAgent?: string) {
  if (!subscription || !subscription.endpoint) return;

  const endpointKey = subscription.endpoint;
  const subRecord = {
    endpoint: subscription.endpoint,
    keys: subscription.keys || {},
    userAgent: userAgent || 'Unknown Device',
    updatedAt: Date.now()
  };

  subscriptionsStore.set(endpointKey, subRecord);

  // Attempt to persist in Supabase table 'push_subscriptions'
  try {
    await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        user_agent: userAgent || 'Unknown Device',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'endpoint' }
    );
  } catch (dbErr) {
    console.warn('Supabase subscription storage notice:', dbErr);
  }
}

export async function removeSubscription(endpoint: string) {
  if (!endpoint) return;
  subscriptionsStore.delete(endpoint);
  try {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (e) {}
}
