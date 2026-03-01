// @ts-nocheck
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useSubscriptionTiers,
  useUserSubscription,
  useUserSubscriptionInfo,
  useCancelSubscription,
  useReactivateSubscription,
} from '@/hooks/useSubscription';
import { useMidtrans } from '@/hooks/useMidtrans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionTierCard } from '@/components/subscription/SubscriptionTierCard';
import { UsageDisplay } from '@/components/subscription/UsageDisplay';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Download, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import type { SubscriptionTier } from '@/types/subscription';
import type { MidtransResult } from '@/lib/midtrans';

export function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  const { data: tiers, isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: subscription } = useUserSubscription();
  const { data: subscriptionInfo } = useUserSubscriptionInfo();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();

  const { pay, isLoading: paymentLoading } = useMidtrans({
    onSuccess: (result: MidtransResult) => {
      toast({
        title: 'Payment Successful',
        description: 'Your subscription has been updated.',
      });
      setSelectedTier(null);
    },
    onPending: (result: MidtransResult) => {
      toast({
        title: 'Payment Pending',
        description: 'Your payment is being processed.',
      });
    },
  });

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (!user) return;

    if (tier.price_idr === 0) {
      toast({
        title: 'Free Tier',
        description: "You're already on the free tier.",
      });
      return;
    }

    setSelectedTier(tier);

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${user.id.substring(0, 8)}`;

    // Initiate payment
    await pay({
      orderId,
      amount: tier.price_idr,
      customerDetails: {
        firstName: user.email?.split('@')[0] || 'User',
        email: user.email || '',
      },
      itemDetails: [
        {
          id: tier.id,
          price: tier.price_idr,
          quantity: 1,
          name: `${tier.display_name} Subscription - Monthly`,
        },
      ],
    });
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelMutation.mutateAsync();
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the billing period.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await reactivateMutation.mutateAsync();
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to view billing information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and view usage statistics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{subscriptionInfo.tier_display_name}</h3>
                      <p className="text-sm text-gray-600">
                        {subscriptionInfo.status === 'active'
                          ? 'Active subscription'
                          : 'No active subscription'}
                      </p>
                    </div>
                  </div>

                  {subscription && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Billing period:{' '}
                          {format(new Date(subscription.current_period_start), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {subscription.cancel_at_period_end && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            Your subscription will be cancelled on{' '}
                            {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {subscription.cancel_at_period_end ? (
                          <Button
                            onClick={handleReactivateSubscription}
                            disabled={reactivateMutation.isPending}
                          >
                            Reactivate Subscription
                          </Button>
                        ) : (
                          subscription.status === 'active' && (
                            <Button
                              variant="outline"
                              onClick={handleCancelSubscription}
                              disabled={cancelMutation.isPending}
                            >
                              Cancel Subscription
                            </Button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <UsageDisplay />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiersLoading ? (
              <p>Loading plans...</p>
            ) : (
              tiers?.map((tier) => (
                <SubscriptionTierCard
                  key={tier.id}
                  tier={tier}
                  isCurrentTier={subscriptionInfo?.tier_name === tier.name}
                  onSelect={handleSelectTier}
                  isLoading={paymentLoading && selectedTier?.id === tier.id}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <UsageDisplay />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistory userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentHistory({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setTransactions(data);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  });

  if (isLoading) {
    return <p>Loading payment history...</p>;
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No payment history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">{tx.order_id}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
                <p className="text-sm text-gray-600">Payment: {tx.payment_type || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: tx.currency,
                    minimumFractionDigits: 0,
                  }).format(tx.amount)}
                </p>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    tx.status === 'settlement'
                      ? 'bg-green-100 text-green-800'
                      : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
