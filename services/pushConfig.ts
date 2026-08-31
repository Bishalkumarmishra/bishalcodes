// BishalCodes Web Push VAPID Configuration
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BG-MxHGHV8-GbubPPMiIuqLtVMC63r94Hz_QIB_iW5SBVAPNAX9shqEppkC3PC0Xuza6EZGj0OInKfDKkQ64SqQ';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'lqcSWWVrF7ciY98FUKUG4Ahw4PSd4hl5h9Tjhgrf_Hw';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bishalcodes.com';

/**
 * Utility to convert base64 VAPID public key to Uint8Array required by PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
