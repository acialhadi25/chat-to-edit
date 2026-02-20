import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserCreditUsage } from '@/hooks/useSubscription';
import { formatCredits, getUsagePercentage } from '@/types/credits';
import { Zap, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Component to display user's credit usage with visual progress bar
 */
export function CreditUsageDisplay() {
  const { data: usage, isLoading } = useUserCreditUsage();

  if (isLoading || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Credit Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = getUsagePercentage(usage);
  const isLow = percentage >= 80;
  const isVeryLow = percentage >= 95;

  // Format period dates
  const periodStart = new Date(usage.period_start);
  const periodEnd = new Date(usage.period_end);
  const periodText = `${periodStart.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - ${periodEnd.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`;

  return (
    <Card className={isVeryLow ? 'border-red-500' : isLow ? 'border-yellow-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Credit Usage
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          {periodText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credit Counter */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold">
              {formatCredits(usage.credits_remaining)}
            </p>
            <p className="text-sm text-muted-foreground">
              of {formatCredits(usage.credits_limit)} credits remaining
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              {percentage}% used
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={percentage} 
          className={`h-2 ${isVeryLow ? 'bg-red-100' : isLow ? 'bg-yellow-100' : ''}`}
          indicatorClassName={isVeryLow ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-primary'}
        />

        {/* Warning Messages */}
        {isVeryLow && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Almost out of credits!
            </p>
            <p className="text-xs text-red-600 mt-1">
              You have only {usage.credits_remaining} credits left. Upgrade to continue using AI features.
            </p>
          </div>
        )}

        {isLow && !isVeryLow && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              Running low on credits
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Consider upgrading to get more credits and avoid interruptions.
            </p>
          </div>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="text-lg font-semibold">{formatCredits(usage.credits_used)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Limit</p>
            <p className="text-lg font-semibold">{formatCredits(usage.credits_limit)}</p>
          </div>
        </div>

        {/* Upgrade CTA */}
        {(isLow || usage.credits_limit < 2000) && (
          <Button asChild className="w-full" variant={isVeryLow ? "destructive" : "default"}>
            <Link to="/pricing" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {isLow ? 'Upgrade Now' : 'Get More Credits'}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for header/navbar
 */
export function CreditUsageBadge() {
  const { data: usage } = useUserCreditUsage();

  if (!usage) return null;

  const percentage = getUsagePercentage(usage);
  const isLow = percentage >= 80;

  return (
    <Link 
      to="/dashboard/usage" 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isLow 
          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}
    >
      <Zap className="h-4 w-4" />
      <span>{formatCredits(usage.credits_remaining)}</span>
    </Link>
  );
}
