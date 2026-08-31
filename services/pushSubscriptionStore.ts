import { db } from '@/services/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

// Global in-memory storage for active web push subscriptions across all devices worldwide
export const subscriptionsStore = new Map<string, any>();

export function getActiveSubscriptions() {
  return Array.from(subscriptionsStore.values());
}

export async function addSubscription(subscription: any, userAgent?: string) {
  if (!subscription || !subscription.endpoint) return;

  const endpointKey = subscription.endpoint;
  const docId = docIdFromEndpoint(endpointKey);
  const subRecord = {
    endpoint: subscription.endpoint,
    keys: subscription.keys || {},
    userAgent: userAgent || 'Unknown Device',
    updatedAt: Date.now()
  };

  subscriptionsStore.set(endpointKey, subRecord);

  // Persist to Cloud Firestore table 'push_subscriptions'
  try {
    await setDoc(doc(db, 'push_subscriptions', docId), {
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
      userAgent: userAgent || 'Unknown Device',
      updatedAt: new Date().toISOString()
    });
  } catch (dbErr) {
    console.warn('Firestore subscription storage notice:', dbErr);
  }
}

export async function removeSubscription(endpoint: string) {
  if (!endpoint) return;
  subscriptionsStore.delete(endpoint);
  try {
    await deleteDoc(doc(db, 'push_subscriptions', docIdFromEndpoint(endpoint)));
  } catch (e) {}
}

function docIdFromEndpoint(endpoint: string): string {
  return Buffer.from(endpoint).toString('base64').replace(/=/g, '').slice(-40);
}

