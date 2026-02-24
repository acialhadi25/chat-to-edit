/**
 * useUniverEvents Hook
 * 
 * Custom hook for managing Univer event subscriptions.
 * Handles event listener registration, cleanup, and provides type-safe event handling.
 * 
 * @see https://docs.univer.ai/guides/sheets/getting-started/facade
 */

import { useEffect, useRef } from 'react';

interface UseUniverEventsOptions {
  univerAPI: any;
  isReady: boolean;
  onChange?: (data: any) => void;
  onSelectionChange?: (selection: any) => void;
}

/**
 * Hook for managing Univer event subscriptions
 * 
 * @param options - Event handler options
 */
export function useUniverEvents({
  univerAPI,
  isReady,
  onChange,
  onSelectionChange,
}: UseUniverEventsOptions): void {
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);

  // Keep refs updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Subscribe to data changes
  useEffect(() => {
    if (!univerAPI || !isReady || !onChangeRef.current) return;

    const disposable = univerAPI.addEvent(
      univerAPI.Event.CommandExecuted,
      () => {
        const workbook = univerAPI.getActiveWorkbook();
        if (workbook && onChangeRef.current) {
          const data = workbook.save();
          onChangeRef.current(data);
        }
      }
    );

    return () => {
      disposable.dispose();
    };
  }, [univerAPI, isReady]);

  // Subscribe to selection changes
  useEffect(() => {
    if (!univerAPI || !isReady || !onSelectionChangeRef.current) return;

    const disposable = univerAPI.addEvent(
      univerAPI.Event.SelectionChanged,
      (params: any) => {
        if (params.selections && params.selections.length > 0 && onSelectionChangeRef.current) {
          // Get the first selection
          const selection = params.selections[0];
          onSelectionChangeRef.current(selection);
        }
      }
    );

    return () => {
      disposable.dispose();
    };
  }, [univerAPI, isReady]);
}
