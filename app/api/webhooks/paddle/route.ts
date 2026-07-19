import { NextRequest, NextResponse } from 'next/server';
import { Paddle } from '@paddle/paddle-node-sdk';
import { db } from '../../../../services/firebase';
// @ts-ignore
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const paddleSecret = process.env.PADDLE_WEBHOOK_SECRET_KEY || '';
const paddleApiKey = process.env.PADDLE_API_KEY || '';

// Initialize Paddle client if API key is provided
const paddle = paddleApiKey ? new Paddle(paddleApiKey) : null;

function generateProductionKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `bc_prod_${salt}`;
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('paddle-signature') || '';
    const rawBody = await req.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing paddle-signature header' }, { status: 400 });
    }

    if (!paddleSecret) {
      console.error('PADDLE_WEBHOOK_SECRET_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'Webhook secret not configured on server' }, { status: 500 });
    }

    if (!paddle) {
      console.error('PADDLE_API_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'Paddle API client not configured on server' }, { status: 500 });
    }

    // Verify signature and unmarshal the event
    const event = await paddle.webhooks.unmarshal(rawBody, paddleSecret, signature);

    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    console.log(`Received verified Paddle event: ${event.eventType}`);

    // In Paddle Billing, transaction.completed represents a finalized payment/invoice event.
    if (event.eventType === 'transaction.completed') {
      const data = event.data;
      
      // Extract custom data passed during checkout trigger
      const customData = (data.customData as Record<string, any>) || {};
      const userId = customData.userId || 'guest_checkout';
      const userEmail = customData.userEmail || 'N/A';
      const planId = customData.planId || 'pro'; // Default to pro if unspecified

      console.log(`Processing completed transaction. User: ${userId}, Email: ${userEmail}, Plan: ${planId}`);

      const prodKey = generateProductionKey();
      
      // grandTotal is in cents/minor units in Billing API, dividing by 100 to get dollar amount
      const amountPaid = data.details?.totals?.grandTotal 
        ? Number(data.details.totals.grandTotal) / 100 
        : 0; 
      const currency = data.currencyCode || 'USD';

      // Log transaction to Firestore payments collection
      const paymentRecord = {
        userId,
        userEmail,
        planId,
        amountPaid,
        currency,
        paymentMethod: 'Paddle Billing Checkout',
        paddleTransactionId: data.id,
        status: 'completed',
        generatedApiKey: prodKey,
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'payments'), paymentRecord);
      console.log('Saved payment record to Firestore:', paymentRecord);

      // If user is logged in, link API key to their user profile
      if (userId && userId !== 'guest_checkout') {
        await setDoc(doc(db, 'users', userId), {
          api_production_key: prodKey,
          api_plan: planId,
          api_limit: planId === 'pro' ? 50000 : 999999
        }, { merge: true });
        console.log(`Successfully provisioned plan '${planId}' with API key '${prodKey}' to user '${userId}'`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Paddle webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
