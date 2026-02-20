import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const statusMessage = searchParams.get('status_message');
  const statusCode = searchParams.get('status_code');

  const getErrorMessage = () => {
    if (statusMessage) return statusMessage;
    
    switch (statusCode) {
      case '201':
        return 'Payment was denied by the bank. Please check your card details or try a different payment method.';
      case '202':
        return 'Payment was cancelled. You can try again when ready.';
      case '407':
        return 'Payment has expired. Please create a new transaction.';
      default:
        return 'There was an error processing your payment. Please try again or contact support if the problem persists.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            We couldn't process your payment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {orderId && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Order ID</p>
              <p className="text-sm font-mono">{orderId}</p>
            </div>
          )}

          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage()}
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-muted bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Common solutions:</strong>
              <br />
              • Check your card details and try again
              <br />
              • Try a different payment method
              <br />
              • Ensure you have sufficient balance
              <br />
              • Contact your bank if the issue persists
              <br />
              • Contact our support team for assistance
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => navigate('/pricing')} 
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="w-full gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
