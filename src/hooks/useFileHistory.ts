import { useCallback } from 'react';

interface FileHistoryRecord {
  id: string;
  fileName: string;
  rowsCount: number;
  sheetsCount: number;
  formulasApplied: number;
  createdAt: string;
}

interface UseFileHistoryReturn {
  saveFileRecord: (
    fileName: string,
    rowsCount: number,
    sheetsCount: number
  ) => Promise<FileHistoryRecord | null>;
  updateFormulasCount: (fileHistoryId: string, count: number) => Promise<void>;
  getFileHistory: () => FileHistoryRecord[];
  clearFileHistory: () => void;
}

const STORAGE_KEY = 'chat_to_excel_file_history';
const MAX_HISTORY = 10; // Keep only last 10 files

export const useFileHistory = (): UseFileHistoryReturn => {
  const saveFileRecord = useCallback(
    async (fileName: string, rowsCount: number, sheetsCount: number) => {
      const record: FileHistoryRecord = {
        id: crypto.randomUUID(),
        fileName,
        rowsCount,
        sheetsCount,
        formulasApplied: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = localStorage.getItem(STORAGE_KEY);
        const history: FileHistoryRecord[] = existing ? JSON.parse(existing) : [];
        
        // Add new record at the beginning
        history.unshift(record);
        
        // Keep only last MAX_HISTORY records
        const trimmed = history.slice(0, MAX_HISTORY);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return record;
      } catch (error) {
        console.error('Failed to save file history to local storage:', error);
        return null;
      }
    },
    []
  );

  const updateFormulasCount = useCallback(async (fileHistoryId: string, count: number) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) return;
      
      const history: FileHistoryRecord[] = JSON.parse(existing);
      const updated = history.map(record =>
        record.id === fileHistoryId
          ? { ...record, formulasApplied: count }
          : record
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update formulas count:', error);
    }
  }, []);

  const getFileHistory = useCallback((): FileHistoryRecord[] => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Failed to get file history:', error);
      return [];
    }
  }, []);

  const clearFileHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear file history:', error);
    }
  }, []);

  return { saveFileRecord, updateFormulasCount, getFileHistory, clearFileHistory };
};
