import { useRef, memo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import '@/styles/fortunesheet-override.css';
import { ExcelData, AIAction, CellValue, createCellRef } from '@/types/excel';

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
      const displayValue = isPending ? pendingChangeMap.get(cellRef) : cellValue;
      const originalStyle = excelData.cellStyles?.[cellRef];

      const cellConfig: any = {
        r: rowIndex + 1, // +1 because row 0 is headers
        c: colIndex,
        v: {
          v: displayValue ?? '',
          m: String(displayValue ?? ''),
          ct: { fa: 'General', t: 'g' },
        },
      };

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

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      applyAction: (action: AIAction) => {
        if (!workbookRef.current) {
          console.warn('Workbook not initialized');
          return;
        }

        const luckysheet = (window as any).luckysheet;
        if (!luckysheet) {
          console.warn('Luckysheet not available');
          return;
        }

        try {
          switch (action.type) {
            case 'EDIT_CELL':
            case 'EDIT_COLUMN':
            case 'EDIT_ROW':
            case 'FILL_DOWN':
              action.changes?.forEach((change) => {
                const row = change.row + 1; // +1 because row 0 is headers
                const col = change.col;
                luckysheet.setCellValue(row, col, change.newValue);
              });
              break;

            case 'DELETE_ROW':
              const rowsToDelete = action.changes?.map((c) => c.row + 1) || [];
              const uniqueRows = [...new Set(rowsToDelete)].sort((a, b) => b - a);
              uniqueRows.forEach((row) => {
                luckysheet.deleteRow(row, row);
              });
              break;

            case 'DELETE_COLUMN':
              const colsToDelete = action.changes?.map((c) => c.col) || [];
              const uniqueCols = [...new Set(colsToDelete)].sort((a, b) => b - a);
              uniqueCols.forEach((col) => {
                luckysheet.deleteColumn(col, col);
              });
              break;

            case 'RENAME_COLUMN':
              if (action.params?.from && action.params?.to) {
                const colIndex = data.headers.indexOf(action.params.from as string);
                if (colIndex !== -1) {
                  luckysheet.setCellValue(0, colIndex, action.params.to);
                }
              }
              break;

            case 'INSERT_FORMULA':
            case 'REMOVE_FORMULA':
              if (action.formula) {
                // Apply formula to all changed cells
                action.changes?.forEach((change) => {
                  const row = change.row + 1;
                  const col = change.col;
                  const formula = action.formula!.replace(/\{row\}/g, String(row));
                  luckysheet.setCellValue(row, col, formula);
                });
              }
              break;

            case 'SORT_DATA':
            case 'FILTER_DATA':
            case 'REMOVE_DUPLICATES':
            case 'REMOVE_EMPTY_ROWS':
              // These operations are handled by applyChanges in the parent
              // Just apply the resulting changes
              action.changes?.forEach((change) => {
                const row = change.row + 1;
                const col = change.col;
                luckysheet.setCellValue(row, col, change.newValue);
              });
              break;

            case 'CONDITIONAL_FORMAT':
              if (action.params?.formatStyle) {
                const style = action.params.formatStyle as any;
                action.changes?.forEach((change) => {
                  const row = change.row + 1;
                  const col = change.col;
                  
                  if (style.backgroundColor) {
                    luckysheet.setCellFormat(row, col, 'bg', style.backgroundColor);
                  }
                  if (style.color) {
                    luckysheet.setCellFormat(row, col, 'fc', style.color);
                  }
                  if (style.fontWeight === 'bold') {
                    luckysheet.setCellFormat(row, col, 'bl', 1);
                  }
                });
              }
              break;

            case 'FIND_REPLACE':
            case 'DATA_CLEANSING':
            case 'DATA_TRANSFORM':
            case 'ADD_COLUMN':
            case 'SPLIT_COLUMN':
            case 'MERGE_COLUMNS':
            case 'FORMAT_NUMBER':
            case 'EXTRACT_NUMBER':
            case 'GENERATE_ID':
            case 'CONCATENATE':
            case 'STATISTICS':
            case 'PIVOT_SUMMARY':
            case 'CREATE_CHART':
            case 'COPY_COLUMN':
              // These operations are handled by applyChanges
              // Apply the resulting changes
              action.changes?.forEach((change) => {
                const row = change.row + 1;
                const col = change.col;
                luckysheet.setCellValue(row, col, change.newValue);
              });
              break;

            case 'INFO':
            case 'CLARIFY':
            case 'DATA_AUDIT':
            case 'INSIGHTS':
            case 'DATA_VALIDATION':
            case 'TEXT_EXTRACTION':
            case 'DATE_CALCULATION':
              // These are informational only, no changes to apply
              break;

            default:
              console.warn(`Action type ${action.type} not implemented`);
          }
        } catch (error) {
          console.error('Error applying action:', error);
        }
      },

      getData: () => {
        const luckysheet = (window as any).luckysheet;
        if (!luckysheet) return null;
        return luckysheet.getAllSheets();
      },
    }));

    const fortuneSheetData = convertToFortuneSheetFormat(data);

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
export default memo(ExcelPreview);
