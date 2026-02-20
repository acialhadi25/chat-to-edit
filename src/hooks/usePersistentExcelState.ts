import { useState, useEffect, useCallback } from 'react';
import { ExcelData, ChatMessage } from '@/types/excel';

const STORAGE_KEY_PREFIX = 'excel-dashboard-';
const EXCEL_DATA_KEY = `${STORAGE_KEY_PREFIX}data`;
const MESSAGES_KEY = `${STORAGE_KEY_PREFIX}messages`;
const FILE_HISTORY_ID_KEY = `${STORAGE_KEY_PREFIX}file-history-id`;
const TIMESTAMP_KEY = `${STORAGE_KEY_PREFIX}timestamp`;

// Maximum age for stored data (24 hours)
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface PersistentState {
  excelData: ExcelData | null;
  messages: ChatMessage[];
  fileHistoryId: string | null;
}

/**
 * Custom hook to persist Excel dashboard state across page navigation
 * State is stored in localStorage and automatically restored on mount
 * State is cleared when user clicks "Start Over" or after 24 hours
 */
export function usePersistentExcelState() {
  const [excelData, setExcelDataState] = useState<ExcelData | null>(null);
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const [fileHistoryId, setFileHistoryIdState] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const timestamp = localStorage.getItem(TIMESTAMP_KEY);
      
      // Check if stored data is too old
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age > MAX_AGE_MS) {
          console.log('Stored Excel state is too old, clearing...');
          clearPersistedState();
          setIsRestored(true);
          return;
        }
      }

      // Restore excel data
      const storedData = localStorage.getItem(EXCEL_DATA_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData) as ExcelData;
        setExcelDataState(parsed);
        console.log('Restored Excel data from localStorage:', parsed.fileName);
      }

      // Restore messages
      const storedMessages = localStorage.getItem(MESSAGES_KEY);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        setMessagesState(parsed);
        console.log('Restored chat messages from localStorage:', parsed.length);
      }

      // Restore file history ID
      const storedFileHistoryId = localStorage.getItem(FILE_HISTORY_ID_KEY);
      if (storedFileHistoryId) {
        setFileHistoryIdState(storedFileHistoryId);
        console.log('Restored file history ID from localStorage');
      }

      setIsRestored(true);
    } catch (error) {
      console.error('Error restoring Excel state from localStorage:', error);
      clearPersistedState();
      setIsRestored(true);
    }
  }, []);

  // Persist excel data to localStorage whenever it changes
  const setExcelData = useCallback((data: ExcelData | null) => {
    setExcelDataState(data);
    
    if (data) {
      try {
        localStorage.setItem(EXCEL_DATA_KEY, JSON.stringify(data));
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        console.log('Persisted Excel data to localStorage');
      } catch (error) {
        console.error('Error persisting Excel data to localStorage:', error);
      }
    } else {
      localStorage.removeItem(EXCEL_DATA_KEY);
    }
  }, []);

  // Persist messages to localStorage whenever they change
  const setMessages = useCallback((messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessagesState((prev) => {
      const newMessages = typeof messages === 'function' ? messages(prev) : messages;
      
      try {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(newMessages));
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        console.log('Persisted chat messages to localStorage');
      } catch (error) {
        console.error('Error persisting messages to localStorage:', error);
      }
      
      return newMessages;
    });
  }, []);

  // Persist file history ID to localStorage whenever it changes
  const setFileHistoryId = useCallback((id: string | null) => {
    setFileHistoryIdState(id);
    
    if (id) {
      try {
        localStorage.setItem(FILE_HISTORY_ID_KEY, id);
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        console.log('Persisted file history ID to localStorage');
      } catch (error) {
        console.error('Error persisting file history ID to localStorage:', error);
      }
    } else {
      localStorage.removeItem(FILE_HISTORY_ID_KEY);
    }
  }, []);

  // Clear all persisted state (called when user clicks "Start Over")
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(EXCEL_DATA_KEY);
      localStorage.removeItem(MESSAGES_KEY);
      localStorage.removeItem(FILE_HISTORY_ID_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
      console.log('Cleared all persisted Excel state from localStorage');
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
  }, []);

  // Clear state and reset to initial values
  const resetState = useCallback(() => {
    setExcelDataState(null);
    setMessagesState([]);
    setFileHistoryIdState(null);
    clearPersistedState();
  }, [clearPersistedState]);

  return {
    excelData,
    setExcelData,
    messages,
    setMessages,
    fileHistoryId,
    setFileHistoryId,
    resetState,
    isRestored, // Flag to indicate if state has been restored from localStorage
  };
}

/**
 * Helper function to check if there's persisted Excel state
 */
export function hasPersistentExcelState(): boolean {
  try {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (!timestamp) return false;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > MAX_AGE_MS) return false;

    return !!localStorage.getItem(EXCEL_DATA_KEY);
  } catch {
    return false;
  }
}
