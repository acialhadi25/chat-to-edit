import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMidtransPayment } from '@/hooks/useMidtransPayment';
import { useUserSubscriptionInfo } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, CheckCircle2 } from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-fallback';

const TIER_INFO = {
  pro: {
    name: 'Pro Plan',
    price: 99000,
    priceDisplay: 'Rp 99.000',
    vatRate: 0.11,
    vatAmount: 10890,
    totalPrice: 109890,
    totalPriceDisplay: 'Rp 109.890',
    credits: 2000,
    features: [
      '2,000 credits per month',
      'Advanced Excel operations',
      'File upload up to 100MB',
      'Priority support',
      'Custom templates',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 499000,
    priceDisplay: 'Rp 499.000',
    vatRate: 0.11,
    vatAmount: 54890,
    totalPrice: 553890,
    totalPriceDisplay: 'Rp 553.890',
    credits: 10000,
    features: [
      '10,000 credits per month',
      'All Pro features',
      'File upload up to 500MB',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
  },
};

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initiatePayment, isLoading, error, isReady } = useMidtransPayment();
  const { data: subscriptionInfo, isLoading: isLoadingSubscription } = useUserSubscriptionInfo();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const tierParam = location.state?.tier as string;
  const tier: 'pro' | 'enterprise' = (tierParam === 'pro' || tierParam === 'enterprise') ? tierParam : 'pro';
  const tierInfo = TIER_INFO[tier];

  useEffect(() => {
    // Redirect if trying to checkout for invalid tier
    const validTier = tierParam === 'pro' || tierParam === 'enterprise';
    if (!tierParam || !validTier) {
      navigate('/pricing');
    }
  }, [tierParam, navigate]);

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    await initiatePayment({
      tier,
      onSuccess: (result) => {
        console.log('Payment successful:', result);
        setPaymentStatus('success');
        // Redirect to subscription page after 2 seconds
        setTimeout(() => {
          navigate('/dashboard/subscription');
        }, 2000);
      },
      onPending: (result) => {
        console.log('Payment pending:', result);
        setPaymentStatus('idle');
        // Show pending message
      },
      onError: (result) => {
        console.error('Payment failed:', result);
        setPaymentStatus('error');
      },
      onClose: () => {
        if (paymentStatus === 'processing') {
          setPaymentStatus('idle');
        }
      },
    });
  };

  if (isLoadingSubscription) {
    return <PageLoader />;
  }

  const currentTier = subscriptionInfo?.tier_name || 'free';
  const canUpgrade = 
    (currentTier === 'free' && (tier === 'pro' || tier === 'enterprise')) ||
    (currentTier === 'pro' && tier === 'enterprise');

  if (!canUpgrade) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Upgrade</CardTitle>
            <CardDescription>
              You cannot upgrade to this plan from your current subscription.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Pricing Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">
              You're upgrading to {tierInfo.name}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="font-medium">{tierInfo.name}</span>
                  <span className="text-2xl font-bold">{tierInfo.priceDisplay}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">What's included:</p>
                  <ul className="space-y-2">
                    {tierInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Subtotal</span>
                    <span>{tierInfo.priceDisplay}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>PPN (11%)</span>
                    <span>Rp {tierInfo.vatAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">{tierInfo.totalPriceDisplay}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed monthly • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    Secure payment powered by Midtrans
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isReady && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Loading payment system...
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {paymentStatus === 'success' && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        Payment successful! Redirecting to your subscription...
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={!isReady || isLoading || paymentStatus === 'success'}
                  >
                    {isLoading || paymentStatus === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : paymentStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Payment Complete
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {tierInfo.totalPriceDisplay}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                    Your subscription will automatically renew monthly unless cancelled.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
