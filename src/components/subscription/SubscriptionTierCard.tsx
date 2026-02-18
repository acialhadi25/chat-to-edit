import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SubscriptionTier } from '@/types/subscription';

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  isCurrentTier?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
}

export function SubscriptionTierCard({
  tier,
  isCurrentTier = false,
  onSelect,
  isLoading = false,
}: SubscriptionTierCardProps) {
  const formatPrice = (priceIdr: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(priceIdr);
  };

  const getFeatureList = () => {
    const features: string[] = [];

    if (tier.features.basic_excel_operations) {
      features.push('Basic Excel Operations');
    }
    if (tier.features.advanced_excel_operations) {
      features.push('Advanced Excel Operations');
    }
    if (tier.features.ai_chat) {
      features.push('AI Chat Assistant');
    }
    if (tier.features.templates) {
      features.push('Template Library');
    }
    if (tier.features.custom_templates) {
      features.push('Custom Templates');
    }
    if (tier.features.priority_support) {
      features.push('Priority Support');
    }
    if (tier.features.team_collaboration) {
      features.push('Team Collaboration');
    }
    if (tier.features.api_access) {
      features.push('API Access');
    }
    if (tier.features.dedicated_support) {
      features.push('Dedicated Support');
    }

    return features;
  };

  const getLimitText = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  return (
    <Card className={isCurrentTier ? 'border-blue-500 border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {tier.display_name}
          {isCurrentTier && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Current Plan</span>
          )}
        </CardTitle>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">
          {tier.price_idr === 0 ? (
            'Free'
          ) : (
            <>
              {formatPrice(tier.price_idr)}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Features:</h4>
          <ul className="space-y-1">
            {getFeatureList().map((feature) => (
              <li key={feature} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold text-sm">Monthly Limits:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>Excel Operations: {getLimitText(tier.limits.excel_operations_per_month)}</li>
            <li>File Uploads: {getLimitText(tier.limits.file_uploads_per_month)}</li>
            <li>AI Messages: {getLimitText(tier.limits.ai_messages_per_month)}</li>
            <li>Max File Size: {tier.limits.max_file_size_mb} MB</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onSelect(tier)}
          disabled={isCurrentTier || isLoading}
          className="w-full"
          variant={isCurrentTier ? 'outline' : 'default'}
        >
          {isCurrentTier ? 'Current Plan' : isLoading ? 'Processing...' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
