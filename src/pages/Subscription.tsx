import { useNavigate } from 'react-router-dom';
import {
  useUserSubscriptionInfo,
  useUserCreditUsage,
  useCancelSubscription,
  useReactivateSubscription,
} from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-fallback';
import { formatCredits, getUsagePercentage } from '@/types/credits';
import { useState } from 'react';
import { BillingHistory } from '@/components/subscription/BillingHistory';

export default function Subscription() {
  const navigate = useNavigate();
  const { data: subscriptionInfo, isLoading: isLoadingSubscription } = useUserSubscriptionInfo();
  const { data: creditUsage, isLoading: isLoadingUsage } = useUserCreditUsage();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoadingSubscription || isLoadingUsage) {
    return <PageLoader />;
  }

  const tierName = subscriptionInfo?.tier_display_name || 'Free';
  const tierStatus = subscriptionInfo?.status || 'none';
  const usagePercentage = creditUsage ? getUsagePercentage(creditUsage) : 0;

  const handleCancelSubscription = async () => {
    try {
      await cancelMutation.mutateAsync();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await reactivateMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    }
  };

  const canUpgrade = tierName === 'Free' || tierName === 'Pro';

  return (
    <div className="container mx-auto px-4 py-8 pb-16 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your plan, view usage, and billing information
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              {tierStatus === 'active' && (
                <Badge variant="default">Active</Badge>
              )}
              {tierStatus === 'cancelled' && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{tierName}</p>
              {tierName === 'Pro' && (
                <p className="text-muted-foreground">
                  Rp 99.000/month <span className="text-xs">(+ PPN 11%)</span>
                </p>
              )}
              {tierName === 'Enterprise' && (
                <p className="text-muted-foreground">
                  Rp 499.000/month <span className="text-xs">(+ PPN 11%)</span>
                </p>
              )}
            </div>

            {subscriptionInfo?.status === 'active' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Next billing: {new Date(creditUsage?.period_end || '').toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {tierStatus === 'cancelled' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will end on {new Date(creditUsage?.period_end || '').toLocaleDateString('id-ID')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {canUpgrade && tierStatus !== 'cancelled' && (
              <Button onClick={() => navigate('/pricing')} className="flex-1">
                Upgrade Plan
              </Button>
            )}
            {tierStatus === 'active' && !showCancelConfirm && (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1"
              >
                Cancel Subscription
              </Button>
            )}
            {tierStatus === 'cancelled' && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={reactivateMutation.isPending}
                className="flex-1"
              >
                {reactivateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  'Reactivate Subscription'
                )}
              </Button>
            )}
          </CardFooter>

          {showCancelConfirm && (
            <CardFooter className="flex-col gap-3 border-t pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Are you sure you want to cancel? You'll lose access to premium features at the end of your billing period.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelMutation.isPending}
                  className="flex-1"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancel'
                  )}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Credit Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Credit Usage
            </CardTitle>
            <CardDescription>
              Current billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-bold">
                  {formatCredits(creditUsage?.credits_used || 0)}
                </span>
                <span className="text-muted-foreground">
                  of {formatCredits(creditUsage?.credits_limit || 0)} credits
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {creditUsage?.credits_remaining || 0} credits remaining
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period start</span>
                <span>{new Date(creditUsage?.period_start || '').toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period end</span>
                <span>{new Date(creditUsage?.period_end || '').toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {usagePercentage >= 80 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've used {usagePercentage}% of your credits. Consider upgrading for more capacity.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          {canUpgrade && (
            <CardFooter>
              <Button variant="outline" onClick={() => navigate('/pricing')} className="w-full">
                View Plans
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Credit Cost Reference */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Credit Costs</CardTitle>
            <CardDescription>
              How credits are consumed for different actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">AI Chat</span>
                <Badge variant="secondary">1 credit</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Simple Operation</span>
                <Badge variant="secondary">1 credit</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Complex Operation</span>
                <Badge variant="secondary">2 credits</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Template Generation</span>
                <Badge variant="secondary">3 credits</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">File Upload</span>
                <Badge variant="secondary">5 credits</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <div className="md:col-span-2">
          <BillingHistory />
        </div>
      </div>
    </div>
  );
}
