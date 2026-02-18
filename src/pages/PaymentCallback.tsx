import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const statusCode = searchParams.get('status_code');
    const transactionStatus = searchParams.get('transaction_status');

    if (!orderId || !statusCode || !transactionStatus) {
      setStatus('failed');
      setMessage('Invalid payment callback parameters');
      return;
    }

    // Update transaction status in database
    const updateTransaction = async () => {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({
            status: transactionStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (error) {
          console.error('Failed to update transaction:', error);
        }

        // Determine status based on transaction_status
        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been activated.');
        } else if (transactionStatus === 'pending') {
          setStatus('pending');
          setMessage('Payment is being processed. Please wait for confirmation.');
        } else {
          setStatus('failed');
          setMessage('Payment failed or was cancelled.');
        }
      } catch (err) {
        console.error('Error updating transaction:', err);
        setStatus('failed');
        setMessage('An error occurred while processing your payment.');
      }
    };

    updateTransaction();
  }, [searchParams]);

  const handleContinue = () => {
    if (status === 'success') {
      navigate('/billing');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={handleContinue} className="w-full">
              Go to Billing Dashboard
            </Button>
          </>
        )}

        {status === 'pending' && (
          <>
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-yellow-700 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={handleContinue} className="w-full">
              Return to Home
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-red-700 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={handleContinue} className="w-full">
              Return to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
