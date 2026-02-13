import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GenericChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseChatHistoryReturn {
  saveChatMessage: (
    message: Pick<GenericChatMessage, "role" | "content">,
    fileHistoryId: string | null,
    formula?: string
  ) => Promise<void>;
  loadChatHistory: (fileHistoryId: string) => Promise<GenericChatMessage[]>;
}

export const useChatHistory = (): UseChatHistoryReturn => {
  const { user } = useAuth();

  const saveChatMessage = useCallback(
    async (
      message: Pick<GenericChatMessage, "role" | "content">,
      fileHistoryId: string | null,
      formula?: string
    ) => {
      if (!user) return;

      await supabase.from("chat_history").insert({
        user_id: user.id,
        role: message.role,
        content: message.content,
        file_history_id: fileHistoryId,
        formula: formula || null,
      });
    },
    [user]
  );

  const loadChatHistory = useCallback(
    async (fileHistoryId: string): Promise<GenericChatMessage[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("file_history_id", fileHistoryId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        role: row.role as "user" | "assistant",
        content: row.content,
        timestamp: new Date(row.created_at),
      }));
    },
    [user]
  );

  return { saveChatMessage, loadChatHistory };
};
