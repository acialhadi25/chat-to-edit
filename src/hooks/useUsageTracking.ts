import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UsageEventType = 
  | "file_upload" 
  | "ai_request" 
  | "action_applied" 
  | "formula_generated" 
  | "export_download";

export interface UsageMetadata {
  fileName?: string;
  rowsCount?: number;
  sheetsCount?: number;
  actionType?: string;
  formulaCount?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface MonthlyUsageSummary {
  files_uploaded: number;
  ai_requests: number;
  actions_applied: number;
  formulas_generated: number;
  exports_downloaded: number;
}

export interface UserQuota {
  monthly_ai_requests_quota: number;
  monthly_files_quota: number;
  plan_expires_at: string | null;
}

export const useUsageTracking = () => {
  const { user } = useAuth();

  /**
   * Log a usage event
   */
  const logUsageEvent = useCallback(
    async (eventType: UsageEventType, metadata: UsageMetadata = {}) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase.rpc("log_usage_event", {
          p_user_id: user.id,
          p_event_type: eventType,
          p_metadata: metadata,
        });

        if (error) {
          console.error("Failed to log usage event:", error);
          return null;
        }

        return data;
      } catch (err) {
        console.error("Error logging usage event:", err);
        return null;
      }
    },
    [user]
  );

  /**
   * Get monthly usage summary
   */
  const getMonthlyUsage = useCallback(async (): Promise<MonthlyUsageSummary | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("get_monthly_usage_summary", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Failed to get monthly usage:", error);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error("Error getting monthly usage:", err);
      return null;
    }
  }, [user]);

  /**
   * Check if user has quota for specific action
   */
  const checkQuota = useCallback(
    async (quotaType: "ai_request" | "file_upload"): Promise<boolean> => {
      if (!user) return false;

      try {
        const { data, error } = await supabase.rpc("check_usage_quota", {
          p_user_id: user.id,
          p_quota_type: quotaType,
        });

        if (error) {
          console.error("Failed to check quota:", error);
          return false;
        }

        return data || false;
      } catch (err) {
        console.error("Error checking quota:", err);
        return false;
      }
    },
    [user]
  );

  /**
   * Get user quota limits
   */
  const getUserQuota = useCallback(async (): Promise<UserQuota | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("monthly_ai_requests_quota, monthly_files_quota, plan_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to get user quota:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error getting user quota:", err);
      return null;
    }
  }, [user]);

  /**
   * Log file upload
   */
  const logFileUpload = useCallback(
    async (fileName: string, rowsCount: number, sheetsCount: number) => {
      return logUsageEvent("file_upload", {
        fileName,
        rowsCount,
        sheetsCount,
      });
    },
    [logUsageEvent]
  );

  /**
   * Log AI request
   */
  const logAIRequest = useCallback(
    async (actionType?: string) => {
      return logUsageEvent("ai_request", {
        actionType,
        timestamp: new Date().toISOString(),
      });
    },
    [logUsageEvent]
  );

  /**
   * Log action applied
   */
  const logActionApplied = useCallback(
    async (actionType: string, affectedRows?: number) => {
      return logUsageEvent("action_applied", {
        actionType,
        affectedRows,
      });
    },
    [logUsageEvent]
  );

  /**
   * Log formula generated
   */
  const logFormulaGenerated = useCallback(
    async (formulaCount: number) => {
      return logUsageEvent("formula_generated", {
        formulaCount,
      });
    },
    [logUsageEvent]
  );

  /**
   * Log export download
   */
  const logExportDownload = useCallback(
    async (fileName: string) => {
      return logUsageEvent("export_download", {
        fileName,
      });
    },
    [logUsageEvent]
  );

  return {
    logUsageEvent,
    getMonthlyUsage,
    checkQuota,
    getUserQuota,
    logFileUpload,
    logAIRequest,
    logActionApplied,
    logFormulaGenerated,
    logExportDownload,
  };
};
