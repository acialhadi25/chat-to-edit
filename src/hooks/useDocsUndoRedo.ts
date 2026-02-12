import { useState, useCallback } from "react";
import { DocsData } from "@/types/docs";
import { cloneDocsData } from "@/utils/docsOperations";

interface DocsEditHistory {
  id: string;
  timestamp: Date;
  description: string;
  before: DocsData;
  after: DocsData;
}

const MAX_HISTORY = 50;

export function useDocsUndoRedo() {
  const [history, setHistory] = useState<DocsEditHistory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback(
    (before: DocsData, after: DocsData, description: string) => {
      const entry: DocsEditHistory = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        description,
        before: cloneDocsData(before),
        after: cloneDocsData(after),
      };

      setHistory((prev) => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(entry);
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

  const undo = useCallback((): DocsData | null => {
    if (!canUndo) return null;
    const entry = history[currentIndex];
    setCurrentIndex((prev) => prev - 1);
    return cloneDocsData(entry.before);
  }, [canUndo, history, currentIndex]);

  const redo = useCallback((): DocsData | null => {
    if (!canRedo) return null;
    const entry = history[currentIndex + 1];
    setCurrentIndex((prev) => prev + 1);
    return cloneDocsData(entry.after);
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
  };
}
