import { useRef, memo, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import '@/styles/fortunesheet-override.css';
import { ExcelData, AIAction, CellValue, createCellRef } from '@/types/excel';
import { applyActionToFortuneSheet, syncFortuneSheetWithData, type FortuneSheetRef } from '@/utils/fortuneSheetOperations';

export interface ExcelPreviewHandle {
  applyAction: (action: AIAction) => void;
  getData: () => any;
}

interface ExcelPreviewProps {
  data: ExcelData;
  onDataChange?: (data: any) => void;
}

const PENDING_CHANGE_BG = '#fff3cd';

// Convert ExcelData to FortuneSheet format
const convertToFortuneSheetFormat = (excelData: ExcelData) => {
  const headers = Array.isArray(excelData.headers) ? excelData.headers : [];
  const rowsData = Array.isArray(excelData.rows) ? excelData.rows : [];

  // Create pending changes map for highlighting
  const pendingChangeMap = new Map<string, CellValue>();
  (excelData.pendingChanges || []).forEach((change) => {
    pendingChangeMap.set(createCellRef(change.col, change.row), change.newValue);
  });

  // Convert to celldata format (FortuneSheet uses celldata array)
  const celldata: any[] = [];

  // Add headers (row 0)
  headers.forEach((header, colIndex) => {
    celldata.push({
      r: 0,
      c: colIndex,
      v: {
        v: header,
        m: header,
        ct: { fa: 'General', t: 'g' },
        bg: '#f4f4f4',
        bl: 1, // bold
        ht: 1, // horizontal align center
        vt: 1, // vertical align middle
      },
    });
  });

  // Add data rows
  rowsData.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      const cellRef = createCellRef(colIndex, rowIndex);
      const isPending = pendingChangeMap.has(cellRef);
      let displayValue = isPending ? pendingChangeMap.get(cellRef) : cellValue;
      const originalStyle = excelData.cellStyles?.[cellRef];

      // Check if the cell value is a formula
      let isFormula = false;
      if (typeof displayValue === 'string' && displayValue.startsWith('=')) {
        isFormula = true;
      }

      const cellConfig: any = {
        r: rowIndex + 1, // +1 because row 0 is headers
        c: colIndex,
        v: {
          v: displayValue ?? '',
          m: String(displayValue ?? ''),
          ct: { fa: 'General', t: 'g' },
        },
      };

      // If it's a formula, set the f property for FortuneSheet to evaluate
      if (isFormula) {
        cellConfig.v.f = displayValue; // Store formula
        // FortuneSheet will automatically evaluate and display the result
      }

      // Apply pending change highlight
      if (isPending) {
        cellConfig.v.bg = PENDING_CHANGE_BG;
      } else if (originalStyle?.bgcolor) {
        cellConfig.v.bg = originalStyle.bgcolor;
      }

      // Apply other styles
      if (originalStyle) {
        if (originalStyle.color) cellConfig.v.fc = originalStyle.color;
        if (originalStyle.font?.bold) cellConfig.v.bl = 1;
        if (originalStyle.font?.italic) cellConfig.v.it = 1;
        if (originalStyle.align === 'center') cellConfig.v.ht = 1;
        if (originalStyle.align === 'right') cellConfig.v.ht = 2;
        if (originalStyle.valign === 'middle') cellConfig.v.vt = 1;
        if (originalStyle.valign === 'bottom') cellConfig.v.vt = 2;
      }

      celldata.push(cellConfig);
    });
  });

  // Column widths
  const columnlen: any = {};
  headers.forEach((_, index) => {
    columnlen[index] = excelData.columnWidths?.[index] || 120;
  });

  return [
    {
      name: excelData.currentSheet || 'Sheet1',
      celldata,
      config: {
        columnlen,
        rowlen: {},
      },
      row: rowsData.length + 20, // Add extra rows
      column: headers.length + 5, // Add extra columns
    },
  ];
};

const ExcelPreview = forwardRef<ExcelPreviewHandle, ExcelPreviewProps>(
  ({ data, onDataChange }, ref) => {
    const workbookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose imperative methods using FortuneSheet operations
    useImperativeHandle(ref, () => ({
      applyAction: (action: AIAction) => {
        console.log('applyAction called with:', action.type);
        return applyActionToFortuneSheet(workbookRef.current as FortuneSheetRef, action, data);
      },

      getData: () => {
        console.log('getData: Extracting data from FortuneSheet using getAllSheets API');
        
        if (!workbookRef.current) {
          console.warn('getData: workbookRef not available');
          return null;
        }

        try {
          // Use getAllSheets() to get raw sheet data
          const sheets = workbookRef.current.getAllSheets();
          console.log('getData: getAllSheets() returned:', sheets);
          
          if (!sheets || sheets.length === 0) {
            console.warn('getData: No sheets data available');
            return null;
          }

          const sheet = sheets[0];
          console.log('getData: First sheet:', sheet);
          console.log('getData: Sheet keys:', Object.keys(sheet));
          console.log('getData: Sheet.data:', sheet.data);
          console.log('getData: Sheet.celldata:', sheet.celldata);
          
          // Extract formulas and styles from data
          const extractedData: {
            formulas: { [key: string]: string };
            cellStyles: { [key: string]: any };
            values: any[][];
          } = {
            formulas: {},
            cellStyles: {},
            values: []
          };

          // FortuneSheet stores data in 'data' property as 2D array
          if (sheet.data && Array.isArray(sheet.data)) {
            console.log(`getData: Processing 2D data array with ${sheet.data.length} rows`);
            
            // In 2D format, iterate through rows and columns
            sheet.data.forEach((row: any[], rowIdx: number) => {
              if (rowIdx === 0) {
                console.log('getData: Skipping header row');
                return; // Skip header
              }
              
              if (!Array.isArray(row)) {
                console.log(`getData: Row ${rowIdx} is not an array`);
                return;
              }
              
              row.forEach((cell: any, colIdx: number) => {
                if (!cell || typeof cell !== 'object') return;
                
                const dataRowIdx = rowIdx - 1; // Adjust for header
                const cellRef = createCellRef(colIdx, dataRowIdx);
                
                // Log first few cells to understand structure
                if (rowIdx === 1 && colIdx < 3) {
                  console.log(`getData: Cell at row ${rowIdx}, col ${colIdx}:`, cell);
                  console.log(`getData: Cell keys:`, Object.keys(cell));
                }
                
                // Extract formula
                if (cell.f) {
                  extractedData.formulas[cellRef] = cell.f;
                  console.log(`Found formula at ${cellRef}: ${cell.f}`);
                }
                
                // Extract styles
                const style: any = {};
                
                if (cell.bg) {
                  style.bgcolor = cell.bg;
                }
                
                if (cell.fc) {
                  style.color = cell.fc;
                }
                
                if (cell.bl === 1) {
                  style.font = { bold: true };
                }
                
                if (Object.keys(style).length > 0) {
                  extractedData.cellStyles[cellRef] = style;
                  console.log(`Found style at ${cellRef}:`, style);
                }
              });
            });
          } 
          // Handle celldata format (array of cell objects) - fallback
          else if (sheet.celldata && Array.isArray(sheet.celldata)) {
            console.log(`getData: Processing ${sheet.celldata.length} cells from celldata array`);

            sheet.celldata.forEach((cell: any) => {
              if (cell.r === 0) return; // Skip header row

              const rowIdx = cell.r - 1; // Adjust for header
              const colIdx = cell.c;
              const cellRef = createCellRef(colIdx, rowIdx);

              // Extract formula
              if (cell.v?.f) {
                extractedData.formulas[cellRef] = cell.v.f;
                console.log(`Found formula at ${cellRef}: ${cell.v.f}`);
              }

              // Extract styles
              const style: any = {};
              
              if (cell.v?.bg) {
                style.bgcolor = cell.v.bg;
              }
              
              if (cell.v?.fc) {
                style.color = cell.v.fc;
              }
              
              if (cell.v?.bl === 1) {
                style.font = { bold: true };
              }

              if (Object.keys(style).length > 0) {
                extractedData.cellStyles[cellRef] = style;
                console.log(`Found style at ${cellRef}:`, style);
              }
            });
          }
          else {
            console.warn('getData: No data or celldata in sheet');
            return null;
          }

          console.log('getData: Extraction complete', {
            formulaCount: Object.keys(extractedData.formulas).length,
            styleCount: Object.keys(extractedData.cellStyles).length
          });

          return extractedData;
        } catch (error) {
          console.error('getData: Error extracting data:', error);
          return null;
        }
      },
    }));

    const fortuneSheetData = useMemo(() => {
      console.log('useMemo: Converting data to FortuneSheet format, rows:', data.rows.length);
      return convertToFortuneSheetFormat(data);
    }, [data]);

    // Update FortuneSheet when data changes using FortuneSheet operations
    useEffect(() => {
      if (!workbookRef.current) {
        console.log('Workbook ref not ready yet');
        return;
      }

      console.log('Syncing FortuneSheet with data, rows:', data.rows.length);
      syncFortuneSheetWithData(workbookRef.current as FortuneSheetRef, data);
    }, [data]);

    // Add resize observer to trigger FortuneSheet resize - MORE AGGRESSIVE
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        // Trigger luckysheet resize multiple times with requestAnimationFrame
        const luckysheet = (window as any).luckysheet;
        if (luckysheet && luckysheet.resize) {
          requestAnimationFrame(() => {
            luckysheet.resize();
            
            // Rapid fire resizes
            setTimeout(() => luckysheet.resize(), 10);
            setTimeout(() => luckysheet.resize(), 30);
            setTimeout(() => luckysheet.resize(), 60);
            setTimeout(() => luckysheet.resize(), 100);
            setTimeout(() => luckysheet.resize(), 200);
          });
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Also trigger resize when component mounts or data changes - MORE AGGRESSIVE
    useEffect(() => {
      const luckysheet = (window as any).luckysheet;
      if (luckysheet && luckysheet.resize) {
        requestAnimationFrame(() => {
          luckysheet.resize();
          setTimeout(() => luckysheet.resize(), 10);
          setTimeout(() => luckysheet.resize(), 50);
          setTimeout(() => luckysheet.resize(), 100);
          setTimeout(() => luckysheet.resize(), 200);
        });
      }
    }, [data]);

    // Add global resize listener for sidebar changes
    useEffect(() => {
      const handleResize = () => {
        const luckysheet = (window as any).luckysheet;
        if (luckysheet && luckysheet.resize) {
          requestAnimationFrame(() => {
            luckysheet.resize();
          });
        }
      };

      window.addEventListener('resize', handleResize);
      
      // Also listen for custom sidebar events
      const handleSidebarChange = () => {
        setTimeout(handleResize, 10);
        setTimeout(handleResize, 50);
        setTimeout(handleResize, 100);
      };
      
      window.addEventListener('sidebar-toggle', handleSidebarChange);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('sidebar-toggle', handleSidebarChange);
      };
    }, []);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <Workbook
          ref={workbookRef}
          data={fortuneSheetData}
          onChange={(data) => {
            if (onDataChange) {
              onDataChange(data);
            }
          }}
        />
      </div>
    );
  }
);

ExcelPreview.displayName = 'ExcelPreview';

// Custom comparison function for memo - always re-render if data changes
const areEqual = (prevProps: ExcelPreviewProps, nextProps: ExcelPreviewProps) => {
  const rowsChanged = prevProps.data.rows.length !== nextProps.data.rows.length;
  const dataRefChanged = prevProps.data !== nextProps.data;
  
  console.log('ExcelPreview memo comparison:', { 
    prevRows: prevProps.data.rows.length, 
    nextRows: nextProps.data.rows.length,
    rowsChanged,
    dataRefChanged,
    shouldUpdate: rowsChanged || dataRefChanged
  });
  
  // Return true if props are equal (don't re-render)
  // Return false if props changed (do re-render)
  return !rowsChanged && !dataRefChanged;
};

export default memo(ExcelPreview, areEqual);
