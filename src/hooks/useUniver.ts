/**
 * useUniver Hook
 * 
 * Custom hook for managing Univer instance lifecycle and providing API access.
 * Handles initialization, cleanup, and provides access to univerAPI and univer instance.
 * 
 * @see https://docs.univer.ai/guides/sheets/getting-started/installation
 */

import { useEffect, useRef, useState } from 'react';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import '@univerjs/preset-sheets-core/lib/index.css';
import { useUniverCellOperations } from './useUniverCellOperations';

interface UseUniverOptions {
  container: HTMLDivElement | null;
  initialData?: any;
  locale?: LocaleType;
}

interface UseUniverReturn {
  univerAPI: any;
  univer: any;
  isReady: boolean;
  // Cell operations
  getCellValue: (row: number, col: number) => any;
  setCellValue: (row: number, col: number, value: any) => Promise<void>;
  getRangeValues: (range: string) => any[][];
  setRangeValues: (range: string, values: any[][]) => Promise<void>;
}

/**
 * Hook for managing Univer instance
 * 
 * @param options - Configuration options
 * @returns Univer API, instance, and ready state
 */
export function useUniver({ container, initialData, locale = LocaleType.EN_US }: UseUniverOptions): UseUniverReturn {
  const univerAPIRef = useRef<any>(null);
  const univerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!container) return;

    // Create Univer instance with preset mode
    const { univer, univerAPI } = createUniver({
      locale,
      locales: {
        [locale]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
        }),
      ],
    });

    univerRef.current = univer;
    univerAPIRef.current = univerAPI;

    // Wait for lifecycle to be ready
    const disposable = univerAPI.addEvent(
      univerAPI.Event.LifeCycleChanged,
      ({ stage }: any) => {
        if (stage === univerAPI.Enum.LifecycleStages.Rendered) {
          setIsReady(true);
          
          // Create workbook with initial data or empty
          if (initialData) {
            univerAPI.createWorkbook(initialData);
          } else {
            univerAPI.createWorkbook({});
          }
        }
      }
    );

    // Cleanup
    return () => {
      disposable.dispose();
      univer.dispose();
      univerRef.current = null;
      univerAPIRef.current = null;
      setIsReady(false);
    };
  }, [container, locale]); // Note: initialData intentionally excluded to prevent re-initialization

  // Cell operations hook
  const cellOperations = useUniverCellOperations({
    univerAPI: univerAPIRef.current,
    isReady,
  });

  return {
    univerAPI: univerAPIRef.current,
    univer: univerRef.current,
    isReady,
    ...cellOperations,
  };
}
