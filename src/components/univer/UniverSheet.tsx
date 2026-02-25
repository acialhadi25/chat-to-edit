/**
 * Univer Sheet Component
 * 
 * A React wrapper for Univer Sheets using preset mode for simplified integration.
 * 
 * Features:
 * - Preset mode (easier setup, no manual plugin registration)
 * - Facade API included automatically
 * - Internationalization support (en-US default)
 * - Ref methods for data access and manipulation
 * - Custom hooks for API access and event handling
 * 
 * @see https://docs.univer.ai/guides/sheets/getting-started/installation
 * @see https://docs.univer.ai/guides/sheets/getting-started/facade
 */

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useUniver } from '../../hooks/useUniver';
import { useUniverEvents } from '../../hooks/useUniverEvents';
import type { UniverSheetProps, UniverSheetHandle } from '../../types/univer.types';

/**
 * UniverSheet Component
 * 
 * Refactored to use custom hooks for better separation of concerns:
 * - useUniver: Manages Univer instance lifecycle and API access
 * - useUniverEvents: Handles event subscriptions and cleanup
 */
const UniverSheet = forwardRef<UniverSheetHandle, UniverSheetProps>(
  ({ initialData, onChange, onSelectionChange, height = '600px', width = '100%' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Use custom hook for Univer instance management
    const { univerAPI, univer, isReady } = useUniver({
      container: containerRef.current,
      initialData,
    });

    // Use custom hook for event handling
    useUniverEvents({
      univerAPI,
      isReady,
      onChange,
      onSelectionChange,
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getWorkbookData: async () => {
        if (!univerAPI) return null;
        const workbook = univerAPI.getActiveWorkbook();
        return workbook?.save() || null;
      },
      
      setWorkbookData: async (data: any) => {
        if (!univerAPI) return;
        // Dispose current workbook and create new one
        const currentWorkbook = univerAPI.getActiveWorkbook();
        if (currentWorkbook) {
          univerAPI.disposeUnit(currentWorkbook.getId());
        }
        univerAPI.createWorkbook(data);
      },
      
      getActiveSheet: () => {
        if (!univerAPI) return null;
        return univerAPI.getActiveWorkbook()?.getActiveSheet() || null;
      },
      
      getCellValue: (row: number, col: number) => {
        if (!univerAPI) return null;
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        return sheet?.getRange(row, col).getValue();
      },
      
      setCellValue: async (row: number, col: number, value: any) => {
        if (!univerAPI) return;
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        await sheet?.getRange(row, col).setValue(value);
      },

      getRangeValues: (range: string) => {
        if (!univerAPI) return [];
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        return sheet?.getRange(range).getValues() || [];
      },

      setRangeValues: async (range: string, values: any[][]) => {
        if (!univerAPI) return;
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        await sheet?.getRange(range).setValues(values);
      },

      getFormula: (row: number, col: number) => {
        if (!univerAPI) return null;
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        return sheet?.getRange(row, col).getFormula() || null;
      },

      setFormula: async (row: number, col: number, formula: string) => {
        if (!univerAPI) return;
        const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
        await sheet?.getRange(row, col).setFormula(formula);
      },
      
      univerAPI,
      univer,
    }), [univerAPI, univer]);

    return (
      <div
        ref={containerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
        }}
      />
    );
  }
);

UniverSheet.displayName = 'UniverSheet';

export default UniverSheet;
