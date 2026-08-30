"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import NotificationListener from '../../components/NotificationListener';

// Dynamically import the App component with SSR enabled
// to support search engine crawlers and pre-render correct content.
const App = dynamic(() => import('../../App'), { ssr: true });

export default function ClientApp({ initialSlug = [] }: { initialSlug?: string[] }) {
  // Register the service worker for offline PWA & push notification support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Registered with scope:', registration.scope);

          // When a new SW is found, activate it immediately
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'activated' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('[SW] New version activated.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });
    }
  }, []);

  // PWA Native Protection Shield (No Pinch-Zoom, No Copy/Paste, Print/Screenshot Protection, App-Switcher Blur)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Block gesture zooming on touch screens
    const handleGestureStart = (e: Event) => e.preventDefault();
    const handleGestureChange = (e: Event) => e.preventDefault();

    document.addEventListener('gesturestart', handleGestureStart, { passive: false });
    document.addEventListener('gesturechange', handleGestureChange, { passive: false });

    // Block double-tap to zoom
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 2. Block Right-Click context menus, Copy, and Cut actions (Mobile only, except Admin page)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || ('ontouchstart' in window);

    const handleContextMenu = (e: MouseEvent) => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isMobile && !isAdmin) {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isMobile && !isAdmin) {
        e.preventDefault();
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isMobile && !isAdmin) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy as any);
    document.addEventListener('cut', handleCut as any);

    // 3. Clear Clipboard on PrintScreen key release (Mobile only, except Admin page)
    const handleKeyUp = (e: KeyboardEvent) => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isMobile && !isAdmin) {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        }
      }
    };
    window.addEventListener('keyup', handleKeyUp);

    // 4. Blur App switcher/prevent screenshots visibility when switching focus (Mobile only, except Admin page)
    const handleBlur = () => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isMobile && !isAdmin) {
        document.body.classList.add('app-protected-blur');
      }
    };
    const handleFocus = () => {
      document.body.classList.remove('app-protected-blur');
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureChange);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy as any);
      document.removeEventListener('cut', handleCut as any);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <>
      <NotificationListener />
      <App initialSlug={initialSlug} />
    </>
  );
}
