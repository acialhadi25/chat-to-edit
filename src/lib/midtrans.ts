/**
 * Midtrans Payment Integration
 *
 * This module provides client-side integration with Midtrans Snap payment gateway.
 * It handles payment popup initialization and transaction callbacks.
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        options?: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface MidtransResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
}

export interface MidtransConfig {
  clientKey: string;
  isProduction: boolean;
}

/**
 * Load Midtrans Snap.js script
 */
export function loadMidtransScript(config: MidtransConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.snap) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = config.isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', config.clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans script'));
    document.head.appendChild(script);
  });
}

/**
 * Open Midtrans payment popup
 */
export function openMidtransPayment(
  snapToken: string,
  callbacks: {
    onSuccess?: (result: MidtransResult) => void;
    onPending?: (result: MidtransResult) => void;
    onError?: (result: MidtransResult) => void;
    onClose?: () => void;
  }
): void {
  if (!window.snap) {
    throw new Error('Midtrans Snap not loaded. Call loadMidtransScript first.');
  }

  window.snap.pay(snapToken, callbacks);
}

/**
 * Create transaction and get Snap token
 */
export async function createMidtransTransaction(
  data: {
    orderId: string;
    amount: number;
    userId: string;
    tier: 'pro' | 'enterprise';
    customerDetails: {
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
    };
    itemDetails: {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }[];
  },
  accessToken: string
): Promise<{ token: string; redirectUrl: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('Creating transaction with:', {
    url: `${supabaseUrl}/functions/v1/midtrans-create-transaction`,
    hasAnonKey: !!supabaseAnonKey,
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.length,
  });

  const response = await fetch(`${supabaseUrl}/functions/v1/midtrans-create-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Transaction creation failed:', error);
    throw new Error(error.error || 'Failed to create transaction');
  }

  return response.json();
}
