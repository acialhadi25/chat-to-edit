import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Generic chat message structure used across the application.
 */
interface GenericChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** When the message was created */
  timestamp: Date;
}

/**
 * Return type for the useChatHistory hook.
 */
interface UseChatHistoryReturn {
  /** Saves a chat message to Supabase */
  saveChatMessage: (
    message: Pick<GenericChatMessage, 'role' | 'content'>,
    fileHistoryId: string | null,
    formula?: string
  ) => Promise<void>;
  /** Loads chat history for a specific file */
  loadChatHistory: (fileHistoryId: string) => Promise<GenericChatMessage[]>;
}

/**
 * Custom hook for managing chat history persistence in Supabase.
 * Provides functions to save and load chat messages associated with file history.
 *
 * @returns Object containing saveChatMessage and loadChatHistory functions
 *
 * @example
 * const { saveChatMessage, loadChatHistory } = useChatHistory();
 *
 * // Save a user message
 * await saveChatMessage(
 *   { role: 'user', content: 'Hello' },
 *   fileHistoryId,
 *   '=SUM(A1:A10)'
 * );
 *
 * // Load chat history for a file
 * const messages = await loadChatHistory(fileHistoryId);
 */
export const useChatHistory = (): UseChatHistoryReturn => {
  const { user } = useAuth();

  const saveChatMessage = useCallback(
    async (
      message: Pick<GenericChatMessage, 'role' | 'content'>,
      fileHistoryId: string | null,
      formula?: string
    ) => {
      if (!user) return;

      await supabase.from('chat_history').insert({
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
        .from('chat_history')
        .select('*')
        .eq('file_history_id', fileHistoryId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        role: row.role as 'user' | 'assistant',
        content: row.content,
        timestamp: new Date(row.created_at),
      }));
    },
    [user]
  );

  return { saveChatMessage, loadChatHistory };
};
