import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Mail, Shield, User, CreditCard, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user } = useAuth();
  const { subscription, isLoading } = useSubscriptionStatus();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const isPro = subscription?.tierName === "pro";
  const isEnterprise = subscription?.tierName === "enterprise";
  const isFree = subscription?.tierName === "free";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
            </div>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">User ID</p>
              <p className="text-sm font-mono text-muted-foreground">{user?.id.slice(0, 8)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Plan</p>
              <p className="text-sm text-muted-foreground">{subscription?.tierDisplayName || "Free"}</p>
            </div>
            <Badge variant={isPro || isEnterprise ? "default" : "secondary"} className="gap-1">
              {(isPro || isEnterprise) && <Crown className="h-3 w-3" />}
              {subscription?.tierDisplayName || "Free"}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Credits</p>
              <p className="text-sm text-muted-foreground">
                {subscription?.creditsRemaining || 0} of {subscription?.creditsLimit || 50} remaining
              </p>
            </div>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {isFree && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Upgrade to Pro for 2,000 credits per month and unlock advanced features.
                </p>
                <Button 
                  className="w-full gap-2"
                  onClick={() => navigate('/pricing')}
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </div>
            </>
          )}
          {(isPro || isEnterprise) && (
            <>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/dashboard/subscription')}
              >
                Manage Subscription
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To change your password, use the "Forgot Password" flow from the login page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
