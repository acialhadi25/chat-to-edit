import { useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
};

interface UseUsageLimitReturn {
  checkCanUpload: () => { allowed: boolean; message?: string };
  isAtLimit: boolean;
  remaining: number;
  maxFiles: number;
  usedFiles: number;
  plan: string;
  isLoading: boolean;
}

export const useUsageLimit = (): UseUsageLimitReturn => {
  const { profile, isLoading } = useProfile();

  const maxFiles = PLAN_LIMITS[profile?.plan || "free"] || 5;
  const usedFiles = profile?.files_used_this_month ?? 0;
  const isAtLimit = usedFiles >= maxFiles;
  const remaining = Math.max(0, maxFiles - usedFiles);

  const checkCanUpload = useCallback((): { allowed: boolean; message?: string } => {
    if (isLoading) return { allowed: true }; // Allow while loading
    if (!profile) return { allowed: true }; // No profile yet, allow

    if (isAtLimit) {
      return {
        allowed: false,
        message: `You've used all ${maxFiles} files this month on the ${profile.plan === "pro" ? "Pro" : "Free"} plan. Upgrade to get more!`,
      };
    }

    return { allowed: true };
  }, [isLoading, profile, isAtLimit, maxFiles]);

  return {
    checkCanUpload,
    isAtLimit,
    remaining,
    maxFiles,
    usedFiles,
    plan: profile?.plan || "free",
    isLoading,
  };
};
