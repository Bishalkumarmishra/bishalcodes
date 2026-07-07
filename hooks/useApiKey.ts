import { useState, useCallback, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'gemini_api_key';

// This hook manages the Gemini API key, prioritizing localStorage for user-provided keys.
export const useApiKey = () => {
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    // 1. First look at localStorage for immediate synchronous load
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setKey(storedKey);
    }

    // 2. Access the key from custom window variable or window.process shim if available (local development fallback)
    const envKey = (window as any).__GEMINI_API_KEY__ || (window as any).process?.env?.API_KEY;
    if (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE' && envKey.trim() !== '') {
      setKey(envKey);
      return;
    }

    // 3. Dynamic background fetch to ensure Vercel runtime config resolves correctly
    fetch('/api/gemini-key')
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey && data.apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && data.apiKey.trim() !== '') {
          if (data.apiKey !== storedKey) {
            setKey(data.apiKey);
            localStorage.setItem(API_KEY_STORAGE_KEY, data.apiKey);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Gemini API key dynamically:', err);
      });
  }, []);

  const saveApiKey = useCallback((newKey: string) => {
    if (newKey && newKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
      setKey(newKey);
    }
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setKey(null);
  }, []);

  const isKeyAvailable = !!key;

  return { apiKey: key, saveApiKey, clearApiKey, isKeyAvailable };
};