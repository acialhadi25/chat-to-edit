// @ts-nocheck
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserUsage, useUserSubscriptionInfo } from '@/hooks/useSubscription';
import {
  formatUsageCount,
  calculateUsagePercentage,
  isApproachingLimit,
  hasExceededLimit,
  getResourceTypeName,
} from '@/lib/usageTracker';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function UsageDisplay() {
  const { data: usage, isLoading: usageLoading } = useUserUsage();
  const { data: subscriptionInfo, isLoading: subLoading } = useUserSubscriptionInfo();

  if (usageLoading || subLoading || !subscriptionInfo || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  const resourceTypes: Array<{
    key: 'excel_operation' | 'file_upload' | 'ai_message';
    limitKey: keyof typeof subscriptionInfo.limits;
  }> = [
    { key: 'excel_operation', limitKey: 'excel_operations_per_month' },
    { key: 'file_upload', limitKey: 'file_uploads_per_month' },
    { key: 'ai_message', limitKey: 'ai_messages_per_month' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <p className="text-sm text-gray-500">
          Current billing period usage for {subscriptionInfo.tier_display_name} plan
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {resourceTypes.map(({ key, limitKey }) => {
          const count = usage[key] || 0;
          const limit = subscriptionInfo.limits[limitKey];
          const percentage = calculateUsagePercentage(count, limit);
          const approaching = isApproachingLimit(count, limit);
          const exceeded = hasExceededLimit(count, limit);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{getResourceTypeName(key)}</span>
                  {exceeded && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {!exceeded && limit !== -1 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <span className="text-sm text-gray-600">{formatUsageCount(count, limit)}</span>
              </div>

              {limit !== -1 && (
                <>
                  <Progress
                    value={percentage}
                    className={
                      exceeded ? 'bg-red-100' : approaching ? 'bg-yellow-100' : 'bg-green-100'
                    }
                  />

                  {approaching && !exceeded && (
                    <p className="text-xs text-yellow-600">You're approaching your monthly limit</p>
                  )}

                  {exceeded && (
                    <p className="text-xs text-red-600">
                      You've reached your monthly limit. Upgrade to continue.
                    </p>
                  )}
                </>
              )}

              {limit === -1 && <p className="text-xs text-gray-500">Unlimited usage available</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
