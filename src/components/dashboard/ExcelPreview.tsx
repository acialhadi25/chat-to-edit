import { useRef, memo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { ExcelData, AIAction } from '@/types/excel';

export interface ExcelPreviewHandle {
  applyAction: (action: AIAction) => void;
  getData: () => any;
}

interface ExcelPreviewProps {
  data: ExcelData;
  onDataChange?: (data: any) => void;
}

const ExcelPreview = forwardRef<ExcelPreviewHandle, ExcelPreviewProps>(
  ({ data, onDataChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerAPIRef = useRef<any>(null);
    const univerRef = useRef<any>(null);

    // Initialize Univer
    useEffect(() => {
      if (!containerRef.current) return;

      console.log('Initializing Univer with data:', data);

      const { univer, univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
        },
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
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
            console.log('Univer rendered, creating workbook...');
            
            // Convert ExcelData to Univer format
            const univerData = convertExcelDataToUniver(data);
            univerAPI.createWorkbook(univerData);
          }
        }
      );

      // Listen for changes
      if (onDataChange) {
        const changeDisposable = univerAPI.addEvent(
          univerAPI.Event.CommandExecuted,
          () => {
            const workbook = univerAPI.getActiveWorkbook();
            if (workbook) {
              onDataChange(workbook.save());
            }
          }
        );

        return () => {
          disposable.dispose();
          changeDisposable.dispose();
          univer.dispose();
        };
      }

      return () => {
        disposable.dispose();
        univer.dispose();
      };
    }, []);

    // Update workbook when data changes
    useEffect(() => {
      if (!univerAPIRef.current || !data) return;

      console.log('Data changed, updating workbook...');
      
      // Get current workbook
      const currentWorkbook = univerAPIRef.current.getActiveWorkbook();
      if (!currentWorkbook) return;

      // Update sheet data
      const sheet = currentWorkbook.getActiveSheet();
      if (!sheet) return;

      // Convert and apply data
      // TODO: Implement incremental update instead of full replace
      console.log('Workbook updated');
    }, [data]);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      applyAction: (action: AIAction) => {
        console.log('applyAction called with:', action.type);
        
        if (!univerAPIRef.current) {
          console.warn('univerAPI not ready');
          return;
        }

        const workbook = univerAPIRef.current.getActiveWorkbook();
        const sheet = workbook?.getActiveSheet();
        
        if (!sheet) {
          console.warn('No active sheet');
          return;
        }

        // Apply action based on type
        switch (action.type) {
          case 'EDIT_CELL': {
            const target = (action as any).target || action.params?.target;
            if (target && action.params?.value !== undefined) {
              sheet.getRange(target.row + 1, target.col).setValue(action.params.value);
              console.log(`✅ Applied EDIT_CELL at row ${target.row}, col ${target.col}`);
            }
            break;
          }
          
          case 'EDIT_ROW': {
            // TODO: Implement EDIT_ROW
            console.log('EDIT_ROW not yet implemented for Univer');
            break;
          }
          
          case 'DELETE_ROW': {
            // TODO: Implement DELETE_ROW
            console.log('DELETE_ROW not yet implemented for Univer');
            break;
          }
          
          default:
            console.warn(`Action type ${action.type} not implemented for Univer`);
        }
      },

      getData: () => {
        console.log('getData: Extracting data from Univer');
        
        if (!univerAPIRef.current) {
          console.warn('getData: univerAPI not available');
          return null;
        }

        const workbook = univerAPIRef.current.getActiveWorkbook();
        if (!workbook) {
          console.warn('getData: No active workbook');
          return null;
        }

        // Get workbook data
        const workbookData = workbook.save();
        console.log('getData: Workbook data:', workbookData);

        // Extract formulas, styles, etc.
        const extractedData = {
          formulas: {},
          cellStyles: {},
          columnWidths: {},
          workbookData, // Include full workbook data for download
        };

        console.log('getData: Extraction complete');
        return extractedData;
      },
    }));

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    );
  }
);

ExcelPreview.displayName = 'ExcelPreview';

// Helper function to convert ExcelData to Univer format
function convertExcelDataToUniver(data: ExcelData) {
  const cellData: any = {};
  
  // Add headers (row 0)
  data.headers.forEach((header, colIdx) => {
    if (!cellData[0]) cellData[0] = {};
    cellData[0][colIdx] = {
      v: header,
      s: {
        bg: { rgb: 'E8E8E8' },
        bl: 1, // bold
      },
    };
  });

  // Add data rows
  data.rows.forEach((row, rowIdx) => {
    const univerRowIdx = rowIdx + 1; // +1 because row 0 is headers
    if (!cellData[univerRowIdx]) cellData[univerRowIdx] = {};
    
    row.forEach((cellValue, colIdx) => {
      const cell: any = { v: cellValue };
      
      // Add formula if exists
      const cellRef = `${String.fromCharCode(65 + colIdx)}${rowIdx + 1}`;
      if (data.formulas?.[cellRef]) {
        cell.f = data.formulas[cellRef];
      }
      
      // Add styles if exists
      if (data.cellStyles?.[cellRef]) {
        const style = data.cellStyles[cellRef];
        cell.s = {};
        
        if (style.bgcolor) {
          cell.s.bg = { rgb: style.bgcolor.replace('#', '') };
        }
        
        if (style.color) {
          cell.s.cl = { rgb: style.color.replace('#', '') };
        }
        
        if (style.font?.bold) {
          cell.s.bl = 1;
        }
      }
      
      cellData[univerRowIdx][colIdx] = cell;
    });
  });

  return {
    sheets: {
      [data.currentSheet || 'Sheet1']: {
        name: data.currentSheet || 'Sheet1',
        cellData,
      },
    },
  };
}

export default memo(ExcelPreview);
