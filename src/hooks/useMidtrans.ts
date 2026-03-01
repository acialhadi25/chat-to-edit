// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import {
  loadMidtransScript,
  openMidtransPayment,
  createMidtransTransaction,
  type MidtransResult,
} from '@/lib/midtrans';

interface UseMidtransOptions {
  onSuccess?: (result: MidtransResult) => void;
  onPending?: (result: MidtransResult) => void;
  onError?: (result: MidtransResult) => void;
  onClose?: () => void;
}

export function useMidtrans(options: UseMidtransOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const pay = useCallback(
    async (data: {
      orderId: string;
      amount: number;
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
    }) => {
      if (!isScriptLoaded) {
        setError('Midtrans script not loaded yet');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create transaction and get Snap token
        const { token } = await createMidtransTransaction(data);

        // Open payment popup
        openMidtransPayment(token, {
          onSuccess: (result) => {
            setIsLoading(false);
            options.onSuccess?.(result);
          },
          onPending: (result) => {
            setIsLoading(false);
            options.onPending?.(result);
          },
          onError: (result) => {
            setIsLoading(false);
            setError(result.status_message);
            options.onError?.(result);
          },
          onClose: () => {
            setIsLoading(false);
            options.onClose?.();
          },
        });
      } catch (err) {
        setIsLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Payment failed';
        setError(errorMessage);
      }
    },
    [isScriptLoaded, options]
  );

  return {
    pay,
    isLoading,
    isScriptLoaded,
    error,
  };
}
