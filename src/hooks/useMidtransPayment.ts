import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  loadMidtransScript,
  openMidtransPayment,
  createMidtransTransaction,
  type MidtransResult,
} from '@/lib/midtrans';

interface PaymentOptions {
  tier: 'pro' | 'enterprise';
  onSuccess?: (result: MidtransResult) => void;
  onPending?: (result: MidtransResult) => void;
  onError?: (result: MidtransResult) => void;
  onClose?: () => void;
}

const TIER_PRICES = {
  pro: 109890, // 99000 + 11% PPN
  enterprise: 553890, // 499000 + 11% PPN
};

const TIER_NAMES = {
  pro: 'Pro Plan',
  enterprise: 'Enterprise Plan',
};

export function useMidtransPayment() {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Midtrans script on mount
  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

    if (!clientKey) {
      setError('Midtrans client key not configured');
      return;
    }

    loadMidtransScript({ clientKey, isProduction })
      .then(() => setIsScriptLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  const initiatePayment = async (options: PaymentOptions) => {
    if (!user || !session) {
      setError('User not authenticated. Please log in again.');
      console.error('Auth check failed:', { user: !!user, session: !!session });
      return;
    }

    if (!session.access_token) {
      setError('Session token missing. Please log in again.');
      console.error('Session token missing');
      return;
    }

    if (!isScriptLoaded) {
      setError('Payment system not ready. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderId = `ORDER-${user.id.slice(0, 8)}-${Date.now()}`;
      const amount = TIER_PRICES[options.tier];
      const tierName = TIER_NAMES[options.tier];

      console.log('Initiating payment:', {
        orderId,
        amount,
        tier: options.tier,
        userId: user.id,
        hasAccessToken: !!session.access_token,
      });

      // Create transaction and get Snap token
      const { token } = await createMidtransTransaction({
        orderId,
        amount,
        userId: user.id,
        tier: options.tier,
        customerDetails: {
          firstName: user.email?.split('@')[0] || 'User',
          email: user.email || '',
        },
        itemDetails: [
          {
            id: options.tier,
            price: amount,
            quantity: 1,
            name: tierName,
          },
        ],
      }, session.access_token);

      // Open payment popup
      openMidtransPayment(token, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          options.onSuccess?.(result);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          options.onPending?.(result);
        },
        onError: (result) => {
          console.error('Payment error:', result);
          setError('Payment failed. Please try again.');
          options.onError?.(result);
        },
        onClose: () => {
          console.log('Payment popup closed');
          options.onClose?.();
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading,
    error,
    isReady: isScriptLoaded,
  };
}
