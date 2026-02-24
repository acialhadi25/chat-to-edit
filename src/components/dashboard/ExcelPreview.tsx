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
      if (!containerRef.current) {
        console.warn('Container ref not ready');
        return;
      }

      console.log('Initializing Univer with data:', data);
      console.log('Container element:', containerRef.current);

      try {
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

        console.log('✅ Univer instance created:', { univer, univerAPI });

        univerRef.current = univer;
        univerAPIRef.current = univerAPI;

        // Convert ExcelData to Univer format
        const univerData = convertExcelDataToUniver(data);
        console.log('📊 Converted data to Univer format:', univerData);

        // Use setTimeout to ensure Univer is fully initialized
        setTimeout(() => {
          console.log('Creating workbook after delay...');
          try {
            const workbook = univerAPI.createWorkbook(univerData);
            console.log('✅ Workbook created:', workbook);
          } catch (err) {
            console.error('❌ Error creating workbook:', err);
          }
        }, 100);

        // Listen for changes
        if (onDataChange) {
          const changeDisposable = univerAPI.addEvent(
            univerAPI.Event.CommandExecuted,
            () => {
              const wb = univerAPI.getActiveWorkbook();
              if (wb) {
                onDataChange(wb.save());
              }
            }
          );

          return () => {
            console.log('Cleaning up Univer...');
            changeDisposable.dispose();
            univer.dispose();
          };
        }

        return () => {
          console.log('Cleaning up Univer...');
          univer.dispose();
        };
      } catch (error) {
        console.error('❌ Error initializing Univer:', error);
        return () => {}; // Return empty cleanup function
      }
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
  console.log('Converting ExcelData to Univer format...');
  console.log('Headers:', data.headers);
  console.log('Rows:', data.rows.length);
  
  // Univer uses a different format - we need to create proper workbook structure
  // Based on Univer documentation and working example
  
  const sheetId = 'sheet-01';
  const sheetName = data.currentSheet || 'Sheet1';
  
  // Build cellData in Univer format
  const cellData: any = {};
  
  // Add headers (row 0)
  data.headers.forEach((header, colIdx) => {
    if (!cellData[0]) cellData[0] = {};
    cellData[0][colIdx] = {
      v: header,
      s: {
        bg: { rgb: 'E8E8E8' }, // Light gray background
        fc: { rgb: '000000' }, // Black text
        bl: 1, // bold
        ht: 1, // horizontal align center
        vt: 1, // vertical align middle
      },
    };
  });

  // Add data rows
  data.rows.forEach((row, rowIdx) => {
    const univerRowIdx = rowIdx + 1; // +1 because row 0 is headers
    if (!cellData[univerRowIdx]) cellData[univerRowIdx] = {};
    
    row.forEach((cellValue, colIdx) => {
      const cell: any = { v: cellValue ?? '' };
      
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
          cell.s.fc = { rgb: style.color.replace('#', '') }; // fc = font color
        }
        
        if (style.font?.bold) {
          cell.s.bl = 1;
        }
      }
      
      cellData[univerRowIdx][colIdx] = cell;
    });
  });

  // Return in Univer workbook format (not nested sheets)
  const univerData = {
    id: 'workbook-01',
    name: data.fileName || 'Workbook',
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: sheetName,
        cellData,
        rowCount: data.rows.length + 20,
        columnCount: data.headers.length + 5,
      },
    },
  };
  
  console.log('✅ Conversion complete. Cell data rows:', Object.keys(cellData).length);
  console.log('📊 Univer data structure:', univerData);
  return univerData;
}

export default memo(ExcelPreview);
