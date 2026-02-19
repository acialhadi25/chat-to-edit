import { useCallback } from 'react';

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
  /** Saves a chat message to local storage (session only) */
  saveChatMessage: (
    message: Pick<GenericChatMessage, 'role' | 'content'>,
    fileHistoryId: string | null,
    formula?: string
  ) => Promise<void>;
  /** Loads chat history for current session (not persisted) */
  loadChatHistory: (fileHistoryId: string) => Promise<GenericChatMessage[]>;
  /** Clears chat history from local storage */
  clearChatHistory: () => void;
}

const STORAGE_KEY = 'chat_to_excel_chat_history';

/**
 * Custom hook for managing chat history in local storage (session only).
 * Chat history is NOT persisted to database to save storage costs.
 * History will be cleared when user refreshes the page.
 *
 * @returns Object containing saveChatMessage, loadChatHistory, and clearChatHistory functions
 *
 * @example
 * const { saveChatMessage, loadChatHistory, clearChatHistory } = useChatHistory();
 *
 * // Save a user message (session only)
 * await saveChatMessage(
 *   { role: 'user', content: 'Hello' },
 *   fileHistoryId,
 *   '=SUM(A1:A10)'
 * );
 *
 * // Load chat history for current session
 * const messages = await loadChatHistory(fileHistoryId);
 *
 * // Clear chat history
 * clearChatHistory();
 */
export const useChatHistory = (): UseChatHistoryReturn => {
  const saveChatMessage = useCallback(
    async (
      message: Pick<GenericChatMessage, 'role' | 'content'>,
      fileHistoryId: string | null,
      formula?: string
    ) => {
      // Chat history is not persisted - this is a no-op
      // Messages are managed in component state only
      // This function exists for API compatibility
      return Promise.resolve();
    },
    []
  );

  const loadChatHistory = useCallback(
    async (fileHistoryId: string): Promise<GenericChatMessage[]> => {
      // Chat history is not persisted - return empty array
      // Messages are managed in component state only
      return Promise.resolve([]);
    },
    []
  );

  const clearChatHistory = useCallback(() => {
    // No-op since we don't persist chat history
    // This function exists for API compatibility
  }, []);

  return { saveChatMessage, loadChatHistory, clearChatHistory };
};
