import { useNavigate } from 'react-router-dom';
import { useUserSubscriptionInfo } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Building2, Sparkles } from 'lucide-react';
import { PageLoader } from '@/components/ui/loading-fallback';

const tiers = [
  {
    name: 'free',
    displayName: 'Free',
    price: 0,
    priceDisplay: 'Gratis',
    priceWithTax: 0,
    description: 'Try before you buy - perfect for occasional use',
    credits: 50,
    features: [
      '50 credits per month',
      'Basic Excel operations',
      'AI chat assistance',
      'File upload (max 5MB)',
      'Template generation',
    ],
    icon: Sparkles,
    buttonText: 'Get Started',
    popular: false,
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 99000,
    priceDisplay: 'Rp 99.000',
    priceWithTax: 109890, // 99000 + 11% PPN
    description: 'For professionals who work with Excel daily',
    credits: 2000,
    features: [
      '2,000 credits per month',
      'All Free features',
      'Advanced Excel operations',
      'File upload (max 100MB)',
      'Priority support',
      'Custom templates',
    ],
    icon: Zap,
    buttonText: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 499000,
    priceDisplay: 'Rp 499.000',
    priceWithTax: 553890, // 499000 + 11% PPN
    description: 'For teams and power users',
    credits: 10000,
    features: [
      '10,000 credits per month',
      'All Pro features',
      'File upload (max 500MB)',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
    icon: Building2,
    buttonText: 'Upgrade to Enterprise',
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { data: subscriptionInfo, isLoading } = useUserSubscriptionInfo();

  const handleSelectTier = (tierName: string) => {
    if (tierName === 'free') {
      navigate('/register');
    } else {
      navigate('/checkout', { state: { tier: tierName } });
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const currentTier = subscriptionInfo?.tier_name || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans use a simple credit system.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrentTier = currentTier === tier.name;
            const canUpgrade = 
              (currentTier === 'free' && tier.name !== 'free') ||
              (currentTier === 'pro' && tier.name === 'enterprise');

            return (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle>{tier.displayName}</CardTitle>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{tier.priceDisplay}</span>
                    {tier.price > 0 && (
                      <>
                        <span className="text-muted-foreground">/month</span>
                        <div className="text-sm text-muted-foreground mt-1">
                          + PPN 11% = Rp {tier.priceWithTax.toLocaleString('id-ID')}
                        </div>
                      </>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-center">
                      {tier.credits.toLocaleString()} credits/month
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectTier(tier.name)}
                    disabled={isCurrentTier}
                  >
                    {isCurrentTier
                      ? 'Current Plan'
                      : canUpgrade
                      ? tier.buttonText
                      : tier.name === 'free'
                      ? 'Get Started'
                      : 'Select Plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Credit Cost Reference */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How Credits Work</CardTitle>
              <CardDescription>
                Credits are consumed based on the action you perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>AI Chat Message</span>
                  <span className="font-semibold">1 credit</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Simple Operation</span>
                  <span className="font-semibold">1 credit</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Complex Operation</span>
                  <span className="font-semibold">2 credits</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Template Generation</span>
                  <span className="font-semibold">3 credits</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>File Upload</span>
                  <span className="font-semibold">5 credits</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
