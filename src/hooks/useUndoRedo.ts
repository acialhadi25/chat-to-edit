import { useState, useCallback } from 'react';
import { ExcelData, EditHistory, ActionType } from '@/types/excel';
import { cloneExcelData } from '@/utils/excelOperations';

const MAX_HISTORY = 50;

/**
 * Return type for the useUndoRedo hook.
 */
interface UseUndoRedoReturn {
  /** Records a new state change in the history */
  pushState: (
    before: ExcelData,
    after: ExcelData,
    actionType: ActionType,
    description: string
  ) => void;
  /** Reverts to the previous state. Returns null if no undo available */
  undo: () => ExcelData | null;
  /** Advances to the next state. Returns null if no redo available */
  redo: () => ExcelData | null;
  /** Whether undo operation is available */
  canUndo: boolean;
  /** Whether redo operation is available */
  canRedo: boolean;
  /** Clears all history */
  clearHistory: () => void;
  /** Gets description of current state */
  getCurrentDescription: () => string | null;
  /** Gets description of next state (for redo) */
  getNextDescription: () => string | null;
  /** Total number of history entries */
  historyLength: number;
}

/**
 * Custom hook for managing undo/redo functionality for Excel data.
 * Maintains a history of up to 50 edit operations with the ability to undo and redo changes.
 *
 * @param initialData - The initial Excel data state (can be null)
 * @returns Object containing undo/redo functions and state
 *
 * @example
 * const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo(excelData);
 *
 * // Record a change
 * pushState(oldData, newData, 'edit', 'Updated cell A1');
 *
 * // Undo the change
 * if (canUndo) {
 *   const previousData = undo();
 *   setExcelData(previousData);
 * }
 *
 * // Redo the change
 * if (canRedo) {
 *   const nextData = redo();
 *   setExcelData(nextData);
 * }
 */
export function useUndoRedo(initialData: ExcelData | null): UseUndoRedoReturn {
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback(
    (before: ExcelData, after: ExcelData, actionType: ActionType, description: string) => {
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
