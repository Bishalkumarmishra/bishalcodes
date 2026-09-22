"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import NotificationListener from '../../components/NotificationListener';
import ErrorBoundary from '../../components/ErrorBoundary';

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
          console.warn('[SW] Registration failed:', err);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <NotificationListener />
      <App initialSlug={initialSlug} />
    </ErrorBoundary>
  );
}
