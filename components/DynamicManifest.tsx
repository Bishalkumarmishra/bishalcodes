'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DynamicManifest() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Determine target manifest based on pathname safely
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const isCalendarRoute =
      Boolean(currentPath) && (
        currentPath.startsWith('/widgets/calendar') ||
        currentPath.startsWith('/widgets/date-converter') ||
        currentPath.startsWith('/tools/date-converter')
      );

    const targetManifest = isCalendarRoute ? '/manifest-calendar.json' : '/manifest.json';
    const targetTitle = isCalendarRoute ? 'Mero Patro' : 'Bishal Codes';
    const targetIcon = isCalendarRoute ? '/calendar-desktop-icon.png' : '/apple-touch-icon.png?v=2';

    try {
      // Update <link rel="manifest">
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      if (manifestLink.getAttribute('href') !== targetManifest) {
        manifestLink.setAttribute('href', targetManifest);
      }

      // Update apple-touch-icon for iOS WebClip preview
      let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
      if (appleIconLink) {
        appleIconLink.setAttribute('href', targetIcon);
      }

      // Update apple-mobile-web-app-title
      let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
      if (appleTitleMeta) {
        appleTitleMeta.setAttribute('content', targetTitle);
      }
    } catch (err) {
      console.warn('Error updating dynamic manifest:', err);
    }
  }, [pathname]);

  return null;
}
