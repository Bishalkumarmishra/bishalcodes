"use client";

import React, { useEffect } from 'react';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/services/pushConfig';

// Web Audio API pleasant notification sound generator (zero asset dependency)
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1 - Crisp melody start
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Tone 2 - High bright chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Ignore audio context errors if user hasn't interacted yet
  }
};

export default function NotificationListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Robust Web Push Subscription helper using navigator.serviceWorker.ready
    const syncPushSubscription = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const reg = await navigator.serviceWorker.ready;
        if (!reg || !reg.pushManager) return;

        let sub = await reg.pushManager.getSubscription();

        if (!sub && Notification.permission === 'granted') {
          try {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource
            });
          } catch (subErr) {
            console.warn('⚠️ [Push System] Subscription creation notice:', subErr);
          }
        }

        if (sub) {
          await fetch('/api/v1/push-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: sub.toJSON(),
              userAgent: navigator.userAgent
            })
          });
          console.log('✅ [Push System] Active Web Push endpoint synced with APNs/FCM server:', sub.endpoint);
        }
      } catch (err) {
        console.warn('⚠️ [Push System] Push sync error:', err);
      }
    };

    // 1. Register Service Worker and sync Push Subscription when ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then(() => {
        console.log('✅ [Push System] Service Worker registered.');
        if (Notification.permission === 'granted') {
          syncPushSubscription();
        }
      }).catch((err) => {
        console.warn('⚠️ [Push System] Service Worker registration failed:', err);
      });

      navigator.serviceWorker.ready.then(() => {
        if (Notification.permission === 'granted') {
          syncPushSubscription();
        }
      });

      // Continuous auto-resync when PWA or tab comes into foreground on mobile
      const handleVisibilityOrFocus = () => {
        if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
          syncPushSubscription();
        }
      };

      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);

      // 2. Request Notification Permission automatically on app startup if default
      if ('Notification' in window && Notification.permission === 'default') {
        const permTimer = setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            console.log('📢 [Push System] Notification permission:', permission);
            if (permission === 'granted') {
              syncPushSubscription();
            }
          }).catch(() => {});
        }, 2000);
        return () => {
          clearTimeout(permTimer);
          window.removeEventListener('focus', handleVisibilityOrFocus);
          document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
      }

      return () => {
        window.removeEventListener('focus', handleVisibilityOrFocus);
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      };
    }
  }, []);

  // 3. Foreground Real-time Poller for active browser tab (prevents showing old past notifications)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const LAST_SEEN_KEY = 'bishalcodes_last_seen_notification_time';
    let storedTime = parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10);
    
    // ANCHOR SESSION: If no timestamp existed or if it was unset, set it to Date.now()
    // so old historical notifications NEVER pop up automatically on site visit!
    let sessionStartTime = storedTime > 0 ? storedTime : Date.now();
    if (!storedTime) {
      localStorage.setItem(LAST_SEEN_KEY, sessionStartTime.toString());
    }

    let isInitialFetch = true;

    const checkNewNotifications = async () => {
      try {
        const res = await fetch('/api/v1/push-notification', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !Array.isArray(data.notifications) || data.notifications.length === 0) return;

        const latest = data.notifications[0];

        if (isInitialFetch) {
          isInitialFetch = false;
          // On initial page load, anchor lastSeenTime to the latest existing notification timestamp or current time
          // WITHOUT showing a pop-up banner for old messages!
          if (latest.timestamp > sessionStartTime) {
            sessionStartTime = latest.timestamp;
            localStorage.setItem(LAST_SEEN_KEY, sessionStartTime.toString());
          }
          return;
        }

        // Only trigger pop-up if a NEW notification arrives LIVE while session is active
        if (latest.timestamp > sessionStartTime) {
          sessionStartTime = latest.timestamp;
          localStorage.setItem(LAST_SEEN_KEY, sessionStartTime.toString());

          // Play Sound Chime
          playNotificationChime();

          // Trigger System OS Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const title = latest.title || 'Bishal Codes Notification';
            const options = {
              body: latest.message || latest.body || '',
              icon: '/apple-touch-icon.png',
              badge: '/favicon.svg',
              image: latest.fileUrl || undefined,
              data: { url: latest.actionUrl || 'https://bishalcodes.com/' },
              vibrate: [200, 100, 200],
              tag: latest.id || 'push-' + Date.now(),
              renotify: true,
              requireInteraction: true
            };

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, options);
              }).catch(() => {
                new Notification(title, options);
              });
            } else {
              new Notification(title, options);
            }
          }
        }
      } catch (err) {
        // Silent catch for network drops
      }
    };

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  // 4. Background Supabase Keep-Alive Auto-Pinger (prevents auto-pause)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pingSupabase = () => {
      fetch('/api/keep-awake', { cache: 'no-store' }).catch(() => {});
    };
    pingSupabase();
    const interval = setInterval(pingSupabase, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return null;
}


