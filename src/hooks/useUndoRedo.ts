import { useState, useCallback } from "react";
import { ExcelData, EditHistory, ActionType } from "@/types/excel";
import { cloneExcelData } from "@/utils/excelOperations";

const MAX_HISTORY = 50;

interface UseUndoRedoReturn {
  pushState: (
    before: ExcelData,
    after: ExcelData,
    actionType: ActionType,
    description: string
  ) => void;
  undo: () => ExcelData | null;
  redo: () => ExcelData | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  getCurrentDescription: () => string | null;
  getNextDescription: () => string | null;
  historyLength: number;
}

export function useUndoRedo(initialData: ExcelData | null): UseUndoRedoReturn {
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback(
    (
      before: ExcelData,
      after: ExcelData,
      actionType: ActionType,
      description: string
    ) => {
      const entry: EditHistory = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        actionType,
        description,
        before: cloneExcelData(before),
        after: cloneExcelData(after),
      };

      setHistory((prev) => {
        // Remove any redo history
        const newHistory = prev.slice(0, currentIndex + 1);
        // Add new entry
        newHistory.push(entry);
        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [currentIndex]
  );

  const undo = useCallback((): ExcelData | null => {
    if (!canUndo) return null;
    const entry = history[currentIndex];
    setCurrentIndex((prev) => prev - 1);
    return cloneExcelData(entry.before);
  }, [canUndo, history, currentIndex]);

  const redo = useCallback((): ExcelData | null => {
    if (!canRedo) return null;
    const entry = history[currentIndex + 1];
    setCurrentIndex((prev) => prev + 1);
    return cloneExcelData(entry.after);
  }, [canRedo, history, currentIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  const getCurrentDescription = useCallback((): string | null => {
    if (currentIndex < 0) return null;
    return history[currentIndex].description;
  }, [history, currentIndex]);

  const getNextDescription = useCallback((): string | null => {
    if (!canRedo) return null;
    return history[currentIndex + 1].description;
  }, [canRedo, history, currentIndex]);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentDescription,
    getNextDescription,
    historyLength: history.length,
  };
}
