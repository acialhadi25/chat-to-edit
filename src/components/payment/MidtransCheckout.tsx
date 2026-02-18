import { useState } from 'react';
import { useMidtrans } from '@/hooks/useMidtrans';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { MidtransResult } from '@/lib/midtrans';

interface MidtransCheckoutProps {
  orderId: string;
  amount: number;
  itemName: string;
  customerEmail: string;
  customerName: string;
  onSuccess?: (result: MidtransResult) => void;
  onPending?: (result: MidtransResult) => void;
}

export function MidtransCheckout({
  orderId,
  amount,
  itemName,
  customerEmail,
  customerName,
  onSuccess,
  onPending,
}: MidtransCheckoutProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { pay, isLoading, isScriptLoaded, error } = useMidtrans({
    onSuccess: (result) => {
      toast({
        title: 'Payment Successful',
        description: `Transaction ${result.transaction_id} completed successfully.`,
      });
      onSuccess?.(result);
    },
    onPending: (result) => {
      toast({
        title: 'Payment Pending',
        description: 'Your payment is being processed. Please wait for confirmation.',
        variant: 'default',
      });
      onPending?.(result);
    },
    onError: (result) => {
      toast({
        title: 'Payment Failed',
        description: result.status_message || 'An error occurred during payment.',
        variant: 'destructive',
      });
    },
    onClose: () => {
      setIsProcessing(false);
    },
  });

  const handleCheckout = async () => {
    setIsProcessing(true);

    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ');

    await pay({
      orderId,
      amount,
      customerDetails: {
        firstName,
        lastName: lastName || undefined,
        email: customerEmail,
      },
      itemDetails: [
        {
          id: orderId,
          price: amount,
          quantity: 1,
          name: itemName,
        },
      ],
    });
  };

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={!isScriptLoaded || isLoading || isProcessing}
      className="w-full"
    >
      {isLoading || isProcessing ? 'Processing...' : 'Pay Now'}
    </Button>
  );
}
