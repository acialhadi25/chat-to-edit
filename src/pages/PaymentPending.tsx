import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const paymentType = searchParams.get('payment_type');

  const getPaymentInstructions = () => {
    switch (paymentType) {
      case 'bank_transfer':
        return 'Please complete the bank transfer using the virtual account number provided. Your subscription will be activated automatically once payment is confirmed.';
      case 'echannel':
        return 'Please complete the payment at Mandiri ATM or internet banking. Your subscription will be activated automatically once payment is confirmed.';
      case 'gopay':
        return 'Please complete the payment in your GoPay app. Your subscription will be activated automatically once payment is confirmed.';
      default:
        return 'Please complete your payment. Your subscription will be activated automatically once payment is confirmed.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Payment Pending</CardTitle>
          <CardDescription>
            Your payment is being processed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {orderId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Order ID</p>
              <p className="text-sm font-mono">{orderId}</p>
            </div>
          )}

          <Alert>
            <AlertDescription>
              {getPaymentInstructions()}
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>What's next?</strong>
              <br />
              • Complete your payment using the provided instructions
              <br />
              • Check your email for payment details
              <br />
              • Your subscription will activate automatically
              <br />
              • Payment confirmation usually takes 1-5 minutes
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => navigate('/dashboard/subscription')} 
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Check Payment Status
          </Button>
          <Button 
            onClick={() => navigate('/pricing')} 
            variant="outline" 
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
