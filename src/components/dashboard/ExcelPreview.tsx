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
            // Use setTimeout to avoid race condition
            setTimeout(() => {
              changeDisposable.dispose();
              univer.dispose();
            }, 0);
          };
        }

        return () => {
          console.log('Cleaning up Univer...');
          // Use setTimeout to avoid race condition
          setTimeout(() => {
            univer.dispose();
          }, 0);
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

      // Dispose current workbook and create new one with updated data
      const workbookId = currentWorkbook.getId();
      
      // Convert ExcelData to Univer format
      const univerData = convertExcelDataToUniver(data);
      
      // Dispose old workbook
      univerAPIRef.current.disposeUnit(workbookId);
      
      // Create new workbook with updated data
      setTimeout(() => {
        try {
          const newWorkbook = univerAPIRef.current!.createWorkbook(univerData);
          console.log('✅ Workbook updated with new data');
        } catch (err) {
          console.error('❌ Error updating workbook:', err);
        }
      }, 50);
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

        // Helper function to parse A1 notation to row/col
        const parseA1Notation = (ref: string): { row: number; col: number } | null => {
          const match = ref.match(/^([A-Z]+)(\d+)$/);
          if (!match) return null;
          
          const colStr = match[1];
          const rowStr = match[2];
          
          // Convert column letters to number (A=0, B=1, etc)
          let col = 0;
          for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 65);
          }
          
          // Convert row to 0-based index
          const row = parseInt(rowStr) - 1;
          
          return { row, col };
        };

        // Helper function to get row/col from target
        const getRowCol = (target: any): { row: number; col: number } | null => {
          // Check if target has ref (A1 notation)
          if (target.ref && typeof target.ref === 'string') {
            return parseA1Notation(target.ref);
          }
          
          // Check if target has row/col or startRow/col
          const row = target.row !== undefined ? target.row : target.startRow;
          const col = target.col;
          
          if (row !== undefined && col !== undefined) {
            return { row, col };
          }
          
          return null;
        };

        // Apply action based on type
        switch (action.type) {
          case 'EDIT_CELL': {
            const target = (action as any).target || action.params?.target;
            if (target && action.params?.value !== undefined) {
              const rowCol = getRowCol(target);
              
              if (rowCol) {
                // Univer uses 0-based indexing
                sheet.getRange(rowCol.row, rowCol.col).setValue(action.params.value);
                console.log(`✅ Applied EDIT_CELL at row ${rowCol.row}, col ${rowCol.col}`);
              } else {
                console.warn('Invalid target for EDIT_CELL:', target);
              }
            }
            break;
          }
          
          case 'INSERT_FORMULA': {
            // INSERT_FORMULA: Add formula to specific cell or range
            // If action has changes array, it's handled at dashboard level
            if (action.changes && action.changes.length > 0) {
              console.log('⏳ INSERT_FORMULA with changes - handled at dashboard level');
              return false;
            }
            
            const target = (action as any).target || action.params?.target;
            const formula = action.params?.formula;
            
            if (target && formula && typeof formula === 'string') {
              const rowCol = getRowCol(target);
              
              if (rowCol) {
                // Remove leading = if present
                const formulaStr = formula.startsWith('=') ? formula.substring(1) : formula;
                
                // Univer uses 0-based indexing
                sheet.getRange(rowCol.row, rowCol.col).setValue(`=${formulaStr}`);
                console.log(`✅ Applied INSERT_FORMULA at row ${rowCol.row}, col ${rowCol.col}: ${formulaStr}`);
                return true;
              } else {
                console.log('⏳ INSERT_FORMULA without valid target - handled at dashboard level');
              }
            } else {
              console.log('⏳ INSERT_FORMULA without target/formula - handled at dashboard level');
            }
            return false;
          }
          
          case 'EDIT_ROW': {
            // EDIT_ROW: Update entire row with new values
            const rowData = action.params?.rowData;
            const target = (action as any).target || action.params?.target;
            
            if (Array.isArray(rowData) && target) {
              const rowCol = getRowCol(target);
              
              if (rowCol) {
                rowData.forEach((value: any, colIdx: number) => {
                  // Univer uses 0-based indexing
                  sheet.getRange(rowCol.row, colIdx).setValue(value);
                });
                console.log(`✅ Applied EDIT_ROW at row ${rowCol.row}`);
              } else {
                console.warn('Invalid target for EDIT_ROW:', target);
              }
            }
            break;
          }
          
          case 'DELETE_ROW': {
            // DELETE_ROW: Remove row(s)
            // If action has changes array, it's handled at dashboard level
            if (action.changes && action.changes.length > 0) {
              console.log('⏳ DELETE_ROW with changes - handled at dashboard level');
              return false;
            }
            
            const target = (action as any).target || action.params?.target;
            const countParam = action.params?.count || 1;
            const count = typeof countParam === 'number' ? countParam : 1;
            
            if (target) {
              const rowCol = getRowCol(target);
              
              if (rowCol) {
                // Use Univer command to delete rows
                try {
                  const workbook = univerAPIRef.current.getActiveWorkbook();
                  const sheetId = workbook?.getActiveSheet()?.getSheetId();
                  
                  if (sheetId) {
                    // Delete rows by clearing their content
                    const maxCols = sheet.getMaxColumns() || 20; // Default to 20 columns
                    const maxColsNum = typeof maxCols === 'number' ? maxCols : 20;
                    
                    for (let i = 0; i < count; i++) {
                      const rowToDelete = rowCol.row + i;
                      // Clear all cells in the row
                      for (let col = 0; col < maxColsNum; col++) {
                        sheet.getRange(rowToDelete, col).setValue(null);
                      }
                    }
                    console.log(`✅ Applied DELETE_ROW at row ${rowCol.row} (count: ${count})`);
                    return true;
                  }
                } catch (error) {
                  console.error('Failed to delete row:', error);
                }
              } else {
                console.log('⏳ DELETE_ROW without valid target - handled at dashboard level');
              }
            } else {
              console.log('⏳ DELETE_ROW without target - handled at dashboard level');
            }
            return false;
          }
          
          case 'ADD_COLUMN': {
            // ADD_COLUMN: Add new column(s)
            const columnNames = action.params?.columnNames || action.params?.columnName;
            const position = action.params?.position || 'end';
            
            if (columnNames) {
              const names = Array.isArray(columnNames) ? columnNames : [columnNames];
              console.log(`⏳ ADD_COLUMN: ${names.join(', ')} at ${position} - handled at dashboard level`);
              // Note: Adding columns requires updating the data structure
              // This should be handled at the ExcelDashboard level
            }
            break;
          }
          
          case 'DELETE_COLUMN': {
            // DELETE_COLUMN: Remove column
            console.log('⏳ DELETE_COLUMN - handled at dashboard level');
            // Note: Deleting columns requires updating the data structure
            // This should be handled at the ExcelDashboard level
            break;
          }
          
          case 'EDIT_COLUMN': {
            // EDIT_COLUMN: Fill entire column with values
            const target = (action as any).target || action.params?.target;
            const values = action.params?.values;
            
            if (target && Array.isArray(values)) {
              const rowCol = getRowCol(target);
              
              if (rowCol) {
                values.forEach((value: any, rowIdx: number) => {
                  sheet.getRange(rowIdx, rowCol.col).setValue(value);
                });
                console.log(`✅ Applied EDIT_COLUMN at col ${rowCol.col}, ${values.length} values`);
              } else {
                console.warn('Invalid target for EDIT_COLUMN:', target);
              }
            }
            break;
          }
          
          case 'DATA_TRANSFORM': {
            // DATA_TRANSFORM: Transform data (uppercase, lowercase, titlecase)
            // If action has changes array, it's handled at dashboard level
            if (action.changes && action.changes.length > 0) {
              console.log('⏳ DATA_TRANSFORM with changes - handled at dashboard level');
              return false;
            }
            
            const target = (action as any).target || action.params?.target;
            const transformType = action.params?.transformType || action.params?.transform;
            
            if (target && transformType) {
              // Parse range if it's a range notation like "A2:A10"
              if (target.ref && target.ref.includes(':')) {
                const [startRef, endRef] = target.ref.split(':');
                const startPos = parseA1Notation(startRef);
                const endPos = parseA1Notation(endRef);
                
                if (startPos && endPos) {
                  for (let row = startPos.row; row <= endPos.row; row++) {
                    for (let col = startPos.col; col <= endPos.col; col++) {
                      const range = sheet.getRange(row, col);
                      const value = range.getValue();
                      
                      if (typeof value === 'string') {
                        let newValue = value;
                        switch (transformType) {
                          case 'uppercase':
                            newValue = value.toUpperCase();
                            break;
                          case 'lowercase':
                            newValue = value.toLowerCase();
                            break;
                          case 'titlecase':
                            newValue = value.replace(/\w\S*/g, (txt) => 
                              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                            );
                            break;
                        }
                        range.setValue(newValue);
                      }
                    }
                  }
                  console.log(`✅ Applied DATA_TRANSFORM (${transformType}) to range ${target.ref}`);
                  return true;
                }
              } else if (target.type === 'column' && target.ref) {
                // Handle column reference (e.g., "G")
                console.log(`⏳ DATA_TRANSFORM for column ${target.ref} - handled at dashboard level`);
                return false;
              }
            }
            return false;
          }
          
          case 'FILL_DOWN': {
            // FILL_DOWN: Fill down values or formulas
            const target = (action as any).target || action.params?.target;
            
            if (target && target.ref && target.ref.includes(':')) {
              const [startRef, endRef] = target.ref.split(':');
              const startPos = parseA1Notation(startRef);
              const endPos = parseA1Notation(endRef);
              
              if (startPos && endPos) {
                // Get value from first cell
                const firstValue = sheet.getRange(startPos.row, startPos.col).getValue();
                
                // Fill down to all cells in range
                for (let row = startPos.row + 1; row <= endPos.row; row++) {
                  sheet.getRange(row, startPos.col).setValue(firstValue);
                }
                console.log(`✅ Applied FILL_DOWN from ${startRef} to ${endRef}`);
              }
            }
            break;
          }
          
          case 'GENERATE_DATA': {
            // GENERATE_DATA: Generate pattern-based data
            console.log('⏳ GENERATE_DATA - handled at ExcelDashboard level');
            // This action modifies the data structure, so it's handled by ExcelDashboard
            break;
          }
          
          case 'REMOVE_EMPTY_ROWS': {
            // REMOVE_EMPTY_ROWS: Remove rows that are completely empty
            console.log('⏳ REMOVE_EMPTY_ROWS - handled at ExcelDashboard level');
            // This action modifies the data structure, so it's handled by ExcelDashboard
            break;
          }
          
          case 'STATISTICS': {
            // STATISTICS: Add summary row with statistics
            console.log('⏳ STATISTICS - handled at ExcelDashboard level');
            // This action adds new rows, so it's handled by ExcelDashboard
            break;
          }
          
          case 'CONDITIONAL_FORMAT': {
            // CONDITIONAL_FORMAT: Apply conditional formatting
            console.log('⏳ CONDITIONAL_FORMAT not yet implemented for Univer');
            // TODO: Implement using Univer conditional formatting API
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

        const sheet = workbook.getActiveSheet();
        if (!sheet) {
          console.warn('getData: No active sheet');
          return null;
        }

        // Get workbook data in Univer format
        const workbookData = workbook.save();
        console.log('getData: Workbook data:', workbookData);

        // Extract formulas, styles, and values from Univer
        const extractedData: {
          formulas: { [key: string]: string };
          cellStyles: { [key: string]: any };
          columnWidths: { [key: number]: number };
          workbookData: any;
        } = {
          formulas: {},
          cellStyles: {},
          columnWidths: {},
          workbookData,
        };

        // Get sheet data
        const sheetData = workbookData.sheets?.[sheet.getSheetId()];
        if (!sheetData) {
          console.warn('getData: No sheet data');
          return extractedData;
        }

        const cellData = sheetData.cellData || {};
        console.log('getData: Processing cell data...');

        // Extract formulas and styles from cellData
        Object.keys(cellData).forEach((rowKey) => {
          const rowIdx = parseInt(rowKey);
          if (rowIdx === 0) return; // Skip header row for data extraction
          
          const row = cellData[rowKey];
          Object.keys(row).forEach((colKey) => {
            const colIdx = parseInt(colKey);
            const cell = row[colKey];
            
            if (!cell) return;
            
            const cellRef = `${String.fromCharCode(65 + colIdx)}${rowIdx}`;
            
            // Extract formula
            if (cell.f) {
              extractedData.formulas[cellRef] = cell.f;
              console.log(`Found formula at ${cellRef}: ${cell.f}`);
            }
            
            // Extract styles
            if (cell.s) {
              const style: any = {};
              
              if (cell.s.bg?.rgb) {
                style.bgcolor = '#' + cell.s.bg.rgb;
              }
              
              if (cell.s.fc?.rgb) {
                style.color = '#' + cell.s.fc.rgb;
              }
              
              if (cell.s.bl === 1) {
                style.font = { bold: true };
              }
              
              if (Object.keys(style).length > 0) {
                extractedData.cellStyles[cellRef] = style;
              }
            }
          });
        });

        // Extract column widths (if available)
        // TODO: Get column widths from Univer API

        console.log('getData: Extraction complete');
        console.log('📊 Summary:');
        console.log(`  - Formulas extracted: ${Object.keys(extractedData.formulas).length}`);
        console.log(`  - Cell styles extracted: ${Object.keys(extractedData.cellStyles).length}`);

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
    
    // Simple cell without custom style - let Univer use defaults
    cellData[0][colIdx] = {
      v: header,
    };
  });

  // Add data rows
  data.rows.forEach((row, rowIdx) => {
    const univerRowIdx = rowIdx + 1; // +1 because row 0 is headers
    if (!cellData[univerRowIdx]) cellData[univerRowIdx] = {};
    
    row.forEach((cellValue, colIdx) => {
      // Excel cellRef: A2, B2, etc. (rowIdx + 2 because: +1 for header, +1 for 1-based Excel)
      const excelRowNum = rowIdx + 2;
      const cellRef = `${String.fromCharCode(65 + colIdx)}${excelRowNum}`;
      
      // Check if this cell has a formula
      const hasFormula = data.formulas?.[cellRef];
      
      const cell: any = {};
      
      // Add formula if exists
      if (hasFormula) {
        const formula = data.formulas[cellRef];
        // Keep the leading = for Univer (based on official docs example)
        cell.f = formula.startsWith('=') ? formula : `=${formula}`;
        // Set v to empty string for formula cells
        cell.v = '';
        console.log(`📝 Adding formula to ${cellRef}: ${cell.f}`);
      } else {
        // Only set value if there's no formula
        cell.v = cellValue ?? '';
      }
      
      // Add styles if exists
      if (data.cellStyles?.[cellRef]) {
        const style = data.cellStyles[cellRef];
        cell.s = {};
        
        if (style.backgroundColor && typeof style.backgroundColor === 'string') {
          const bgColor = style.backgroundColor.replace('#', '');
          // Skip black or very dark backgrounds
          if (bgColor !== '000000' && !bgColor.match(/^00000[0-9A-Fa-f]$/)) {
            cell.s.bg = { rgb: bgColor };
          }
        }
        
        if (style.fontColor && typeof style.fontColor === 'string') {
          cell.s.fc = { rgb: style.fontColor.replace('#', '') }; // fc = font color
        }
        
        if (style.fontWeight === 'bold') {
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
