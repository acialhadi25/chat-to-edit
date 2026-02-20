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
        // Try multiple ways to access FortuneSheet data
        const luckysheet = (window as any).luckysheet;
        const fortunesheet = (window as any).fortunesheet;
        
        console.log('getData: Checking global objects...');
        console.log('window.luckysheet:', luckysheet);
        console.log('window.fortunesheet:', fortunesheet);
        console.log('workbookRef.current:', workbookRef.current);
        
        // Try luckysheet first
        if (luckysheet) {
          try {
            const sheets = luckysheet.getAllSheets();
            console.log('getData: Retrieved sheets from luckysheet:', sheets);
            return sheets;
          } catch (error) {
            console.error('Error getting sheets from luckysheet:', error);
          }
        }
        
        // Try fortunesheet
        if (fortunesheet) {
          try {
            const sheets = fortunesheet.getAllSheets();
            console.log('getData: Retrieved sheets from fortunesheet:', sheets);
            return sheets;
          } catch (error) {
            console.error('Error getting sheets from fortunesheet:', error);
          }
        }
        
        // Try workbookRef
        if (workbookRef.current) {
          try {
            console.log('getData: Trying workbookRef.current');
            // FortuneSheet Workbook component might expose data differently
            return workbookRef.current;
          } catch (error) {
            console.error('Error getting data from workbookRef:', error);
          }
        }
        
        console.warn('getData: No FortuneSheet data source available');
        return null;
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
