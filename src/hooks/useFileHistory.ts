import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFileHistory = () => {
  const { user } = useAuth();

  /**
   * Save file history record and atomically increment usage counter
   */
  const saveFileRecord = useCallback(
    async (fileName: string, rowsCount: number, sheetsCount: number) => {
      if (!user) return null;

      // Insert file history record
      const { data, error } = await supabase
        .from("file_history")
        .insert({
          user_id: user.id,
          file_name: fileName,
          rows_count: rowsCount,
          sheets_count: sheetsCount,
          formulas_applied: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save file history:", error);
        return null;
      }

      // Atomically increment usage counter (handles reset on new month internally)
      const { error: rpcError } = await supabase.rpc(
        "increment_files_used_this_month",
        { p_user_id: user.id }
      );

      if (rpcError) {
        console.error("Failed to increment usage:", rpcError);
        // Don't fail the whole operation if just the counter failed
      }

      return data;
    },
    [user]
  );

  /**
   * Get current monthly usage count (with auto-reset if needed)
   */
  const getMonthlyUsage = useCallback(async () => {
    if (!user) return 0;

    const { data, error } = await supabase.rpc("get_monthly_usage", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Failed to get monthly usage:", error);
      return 0;
    }

    return data || 0;
  }, [user]);

  /**
   * Update formulas count for a file history record
   */
  const updateFormulasCount = useCallback(
    async (fileHistoryId: string, count: number) => {
      const { error } = await supabase
        .from("file_history")
        .update({ formulas_applied: count })
        .eq("id", fileHistoryId);

      if (error) {
        console.error("Failed to update formulas count:", error);
      }
    },
    []
  );

  return { saveFileRecord, getMonthlyUsage, updateFormulasCount };
};
