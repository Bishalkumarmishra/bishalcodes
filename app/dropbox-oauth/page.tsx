'use client';

import { useEffect } from 'react';

export default function DropboxOAuthCallback() {
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    
    if (token) {
      if (window.opener) {
        window.opener.postMessage({ type: 'DROPBOX_AUTH_SUCCESS', token }, '*');
        window.close();
      }
    } else {
      if (window.opener) {
        window.opener.postMessage({ type: 'DROPBOX_AUTH_ERROR' }, '*');
        window.close();
      }
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center font-sans bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0061FE] rounded-full animate-spin"></div>
        <p className="font-medium">Connecting to Dropbox...</p>
      </div>
    </div>
  );
}
