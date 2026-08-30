"use client";

import React, { useEffect } from 'react';

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

    // 1. Auto-register Service Worker across all environments (including localhost)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        console.log('✅ [Push System] Service Worker registered with scope:', reg.scope);
      }).catch((err) => {
        console.warn('⚠️ [Push System] Service Worker registration failed:', err);
      });
    }

    // 2. Request Notification Permission automatically on app startup
    if ('Notification' in window && Notification.permission === 'default') {
      const permTimer = setTimeout(() => {
        Notification.requestPermission().then((permission) => {
          console.log('📢 [Push System] Notification permission status:', permission);
        }).catch(() => {});
      }, 2000);
      return () => clearTimeout(permTimer);
    }
  }, []);

  // 3. Real-time background poller for instant broadcast delivery
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const LAST_SEEN_KEY = 'bishalcodes_last_seen_notification_time';
    let lastSeenTime = parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10);
    if (!lastSeenTime) {
      lastSeenTime = Date.now();
      localStorage.setItem(LAST_SEEN_KEY, lastSeenTime.toString());
    }

    const checkNewNotifications = async () => {
      try {
        const res = await fetch('/api/v1/push-notification', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !Array.isArray(data.notifications) || data.notifications.length === 0) return;

        const latest = data.notifications[0];
        if (latest.timestamp > lastSeenTime) {
          lastSeenTime = latest.timestamp;
          localStorage.setItem(LAST_SEEN_KEY, lastSeenTime.toString());

          // Play Sound Chime
          playNotificationChime();

          // Trigger System OS Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const title = latest.title || 'Bishal Codes Push Notification';
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

            // Trigger via Service Worker if available for native OS background tray banner
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

    // Initial check + poll every 3 seconds for instant response
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

