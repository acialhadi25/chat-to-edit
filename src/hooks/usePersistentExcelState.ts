import { useState, useCallback } from 'react';
import { ExcelData, ChatMessage } from '@/types/excel';

/**
 * Custom hook to manage Excel dashboard state
 * Simple state management without persistence
 */
export function usePersistentExcelState() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);

  // Clear state and reset to initial values
  const resetState = useCallback(() => {
    setExcelData(null);
    setMessages([]);
    setFileHistoryId(null);
  }, []);

  return {
    excelData,
    setExcelData,
    messages,
    setMessages,
    fileHistoryId,
    setFileHistoryId,
    resetState,
    isRestored: true, // Always true since there's no restore process
  };
}
