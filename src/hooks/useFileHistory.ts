import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFileHistory = () => {
  const { user } = useAuth();

  const saveFileRecord = useCallback(
    async (fileName: string, rowsCount: number, sheetsCount: number) => {
      if (!user) return null;

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

      // Increment usage counter
      await supabase.rpc("reset_monthly_usage").then(() => {
        // After resetting if needed, increment
        supabase
          .from("profiles")
          .update({
            files_used_this_month: 1,
          })
          .eq("user_id", user.id);
      });

      // Simpler: just increment via raw update
      await supabase
        .from("profiles")
        .select("files_used_this_month")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            supabase
              .from("profiles")
              .update({
                files_used_this_month: profile.files_used_this_month + 1,
              })
              .eq("user_id", user.id)
              .then(() => {});
          }
        });

      return data;
    },
    [user]
  );

  const updateFormulasCount = useCallback(
    async (fileHistoryId: string, count: number) => {
      await supabase
        .from("file_history")
        .update({ formulas_applied: count })
        .eq("id", fileHistoryId);
    },
    []
  );

  return { saveFileRecord, updateFormulasCount };
};
