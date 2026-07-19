"use client";

import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { useEffect, useState } from 'react';

export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox') as 'sandbox' | 'production';

    if (!clientToken) {
      console.warn("Paddle Client Token is not set. Please set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in .env.local");
      return;
    }

    initializePaddle({
      environment,
      token: clientToken,
      eventCallback: (event) => {
        if (typeof window !== 'undefined') {
          const customEvent = new CustomEvent('paddle-event', { detail: event });
          window.dispatchEvent(customEvent);
        }
      }
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    }).catch((err) => {
      console.error("Failed to initialize Paddle SDK:", err);
    });
  }, []);

  return paddle;
}
