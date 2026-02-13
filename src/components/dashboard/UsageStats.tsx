import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, 
  MessageSquare, 
  Zap, 
  Download, 
  TrendingUp,
  AlertCircle,
  Crown
} from "lucide-react";
import { useUsageTracking, MonthlyUsageSummary, UserQuota } from "@/hooks/useUsageTracking";
import { useToast } from "@/hooks/use-toast";

interface UsageStatsProps {
  onUpgradeClick?: () => void;
}

export function UsageStats({ onUpgradeClick }: UsageStatsProps) {
  const { getMonthlyUsage, getUserQuota } = useUsageTracking();
  const { toast } = useToast();
  const [usage, setUsage] = useState<MonthlyUsageSummary | null>(null);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const [usageData, quotaData] = await Promise.all([
        getMonthlyUsage(),
        getUserQuota(),
      ]);
      setUsage(usageData);
      setQuota(quotaData);
    } catch (error) {
      console.error("Failed to load usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const aiUsagePercent = usage && quota 
    ? Math.min((usage.ai_requests / quota.monthly_ai_requests_quota) * 100, 100) 
    : 0;
  
  const filesUsagePercent = usage && quota 
    ? Math.min((usage.files_uploaded / quota.monthly_files_quota) * 100, 100) 
    : 0;

  const isNearAiLimit = aiUsagePercent >= 80;
  const isNearFilesLimit = filesUsagePercent >= 80;

  return (
    <div className="space-y-4">
      {/* Header with Upgrade CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usage Statistics</h3>
          <p className="text-sm text-muted-foreground">
            Your monthly usage this billing cycle
          </p>
        </div>
        <Button 
          onClick={onUpgradeClick}
          variant={isNearAiLimit || isNearFilesLimit ? "default" : "outline"}
          className="gap-2"
        >
          <Crown className="h-4 w-4" />
          Upgrade Plan
        </Button>
      </div>

      {/* AI Requests Card */}
      <Card className={isNearAiLimit ? "border-amber-500/50" : undefined}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            AI Chat Requests
            {isNearAiLimit && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
          <CardDescription>
            {usage?.ai_requests || 0} / {quota?.monthly_ai_requests_quota || 100} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={aiUsagePercent} className="h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{aiUsagePercent.toFixed(0)}% used</span>
            <span>{quota?.monthly_ai_requests_quota - (usage?.ai_requests || 0)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* File Uploads Card */}
      <Card className={isNearFilesLimit ? "border-amber-500/50" : undefined}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
            File Uploads
            {isNearFilesLimit && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
          <CardDescription>
            {usage?.files_uploaded || 0} / {quota?.monthly_files_quota || 50} files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={filesUsagePercent} className="h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filesUsagePercent.toFixed(0)}% used</span>
            <span>{quota?.monthly_files_quota - (usage?.files_uploaded || 0)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Actions Applied</span>
            </div>
            <p className="text-2xl font-bold mt-1">{usage?.actions_applied || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Downloads</span>
            </div>
            <p className="text-2xl font-bold mt-1">{usage?.exports_downloaded || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan Badge */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Free Plan</Badge>
          <span className="text-sm text-muted-foreground">
            Resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
          </span>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
