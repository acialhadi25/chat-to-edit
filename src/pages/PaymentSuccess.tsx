import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    // Optional: Track successful payment
    console.log('Payment successful:', { orderId, transactionStatus, transactionId });
  }, [orderId, transactionStatus, transactionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {orderId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Order ID</p>
              <p className="text-sm font-mono">{orderId}</p>
            </div>
          )}
          
          {transactionId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</p>
              <p className="text-sm font-mono">{transactionId}</p>
            </div>
          )}

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              ✓ Your account has been upgraded
              <br />
              ✓ Credits have been added to your account
              <br />
              ✓ You can now access premium features
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => navigate('/dashboard/subscription')} 
            className="w-full gap-2"
          >
            View Subscription
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
