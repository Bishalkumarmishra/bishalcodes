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

        // Sync fetched notifications into Notification Center history & update unread badge
        try {
          const STORAGE_KEY = 'bishalcodes_notification_center_history';
          const UNREAD_KEY = 'bishalcodes_notification_unread_count';
          const storedRaw = localStorage.getItem(STORAGE_KEY);
          let localItems: any[] = storedRaw ? JSON.parse(storedRaw) : [];
          const localMap = new Map(localItems.map(item => [item.id, item]));

          data.notifications.forEach((n: any) => {
            const id = n.id || 'notif-' + n.timestamp;
            if (!localMap.has(id)) {
              localMap.set(id, {
                id,
                title: n.title || 'Bishal Codes Broadcast',
                message: n.message || n.body || '',
                actionUrl: n.actionUrl || 'https://bishalcodes.com/',
                fileUrl: n.fileUrl || undefined,
                timestamp: n.timestamp || Date.now(),
                read: false
              });
            }
          });

          const updatedList = Array.from(localMap.values()).sort((a, b) => b.timestamp - a.timestamp);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

          const unread = updatedList.filter(n => !n.read).length;
          localStorage.setItem(UNREAD_KEY, unread.toString());
          window.dispatchEvent(new CustomEvent('notification_count_updated', { detail: unread }));
        } catch (syncErr) {
          console.warn('Error syncing notification center state:', syncErr);
        }

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

    // 0ms instant BroadcastChannel listener across tabs
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('bishalcodes_push_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_PUSH_BROADCAST') {
          checkNewNotifications();
        }
      };
    }

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 1000);
    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
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

  const [showPrompt, setShowPrompt] = React.useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'default') {
      setShowPrompt(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      console.log('📢 [Push System] User gesture permission result:', permission);
      setShowPrompt(false);
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.pushManager) {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource
            });
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
            console.log('✅ [Push System] iOS/Android device registered with APNs/FCM server:', sub.endpoint);
            alert('Notifications enabled successfully! You will now receive instant push alerts.');
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [Push System] User gesture permission error:', err);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-4 rounded-2xl shadow-2xl z-[9999] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e52521]/20 border border-[#e52521]/30 flex items-center justify-center shrink-0">
          <span className="text-xl">🔔</span>
        </div>
        <div>
          <div className="text-xs font-bold text-white">Enable Instant Push Notifications</div>
          <div className="text-[11px] text-slate-300 mt-0.5">Get real-time updates and file transfer alerts directly on your device.</div>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        <button
          onClick={() => setShowPrompt(false)}
          className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          onClick={handleRequestPermission}
          className="px-3.5 py-2 bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          Enable Now
        </button>
      </div>
    </div>
  );
}


