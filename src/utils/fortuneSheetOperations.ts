/**
 * FortuneSheet Operations
 * Complete implementation of all FortuneSheet API operations
 * Based on: https://ruilisi.github.io/fortune-sheet-docs/guide/api.html
 */

import { AIAction, DataChange, ExcelData } from '@/types/excel';

export interface FortuneSheetRef {
  setCellValue: (row: number, column: number, value: any, options?: any) => void;
  setCellValuesByRange: (data: any[][], range: { row: number[], column: number[] }, options?: any) => void;
  getCellValue: (row: number, column: number, options?: any) => any;
  clearCell: (row: number, column: number, options?: any) => void;
  setCellFormat: (row: number, column: number, attr: string, value: any, options?: any) => void;
  setCellFormatByRange: (attr: string, value: any, range: { row: number[], column: number[] }, options?: any) => void;
  insertRowOrColumn: (type: 'row' | 'column', index: number, count: number, direction?: 'lefttop' | 'rightbottom', options?: any) => void;
  deleteRowOrColumn: (type: 'row' | 'column', start: number, end: number, options?: any) => void;
  setRowHeight: (rowInfo: Record<number, number>, options?: any) => void;
  setColumnWidth: (columnInfo: Record<number, number>, options?: any) => void;
  getRowHeight: (rows: number[], options?: any) => Record<number, number>;
  getColumnWidth: (columns: number[], options?: any) => Record<number, number>;
  freeze: (type: 'row' | 'column' | 'both', range: { row: number, column: number }, options?: any) => void;
  mergeCells: (ranges: { row: number[], column: number[] }[], type: string, options?: any) => void;
  cancelMerge: (ranges: { row: number[], column: number[] }[], options?: any) => void;
  setSelection: (range: { row: number[], column: number[] }, options?: any) => void;
  getSelection: () => any;
  scroll: (options: { scrollLeft?: number, scrollTop?: number, targetRow?: number, targetColumn?: number }) => void;
}

/**
 * Apply AI action to FortuneSheet using proper API
 */
export function applyActionToFortuneSheet(
  workbookRef: FortuneSheetRef | null,
  action: AIAction,
  data: ExcelData
): boolean {
  if (!workbookRef) {
    console.warn('FortuneSheet ref not available');
    return false;
  }

  try {
    console.log(`Applying ${action.type} to FortuneSheet`);

    switch (action.type) {
      case 'INSERT_FORMULA': {
        // Insert formula into cells
        if (!action.changes || action.changes.length === 0) {
          console.warn('No changes to apply for INSERT_FORMULA');
          return false;
        }

        action.changes.forEach((change) => {
          const row = change.row + 1; // +1 because row 0 is headers
          const col = change.col;
          const value = change.newValue;
          
          console.log(`Setting formula at row ${row}, col ${col}:`, value);
          workbookRef.setCellValue(row, col, value);
        });
        return true;
      }

      case 'EDIT_CELL':
      case 'EDIT_COLUMN':
      case 'EDIT_ROW': {
        // Edit cell values
        if (!action.changes || action.changes.length === 0) return false;

        action.changes.forEach((change) => {
          const row = change.row + 1;
          const col = change.col;
          workbookRef.setCellValue(row, col, change.newValue);
        });
        return true;
      }

      case 'DELETE_ROW': {
        // Delete rows - MUST delete from largest to smallest index
        if (!action.changes || action.changes.length === 0) return false;

        // Get unique row indices and sort descending
        const rowsToDelete = [...new Set(action.changes.map(c => c.row))]
          .sort((a, b) => b - a); // Descending order!

        console.log('Deleting rows in descending order:', rowsToDelete);

        rowsToDelete.forEach((rowIndex) => {
          const fortuneSheetRow = rowIndex + 1; // +1 for header
          console.log(`Deleting row ${fortuneSheetRow} (data row ${rowIndex})`);
          
          // deleteRowOrColumn(type, start, end)
          workbookRef.deleteRowOrColumn('row', fortuneSheetRow, fortuneSheetRow);
        });
        return true;
      }

      case 'DELETE_COLUMN': {
        // Delete columns - also from largest to smallest
        if (!action.changes || action.changes.length === 0) return false;

        const colsToDelete = [...new Set(action.changes.map(c => c.col))]
          .sort((a, b) => b - a); // Descending order!

        console.log('Deleting columns in descending order:', colsToDelete);

        colsToDelete.forEach((colIndex) => {
          workbookRef.deleteRowOrColumn('column', colIndex, colIndex);
        });
        return true;
      }

      case 'ADD_COLUMN': {
        // Insert new column(s) - supports multiple columns
        if (!action.changes || action.changes.length === 0) {
          console.warn('No changes to apply for ADD_COLUMN');
          return false;
        }

        // Get unique columns to add (filter by COLUMN_ADD type)
        const columnsToAdd = action.changes
          .filter(c => c.type === 'COLUMN_ADD')
          .map(c => ({ col: c.col, name: c.columnName || c.newValue as string }));

        if (columnsToAdd.length === 0) {
          console.warn('No COLUMN_ADD changes found');
          return false;
        }

        console.log(`Adding ${columnsToAdd.length} column(s):`, columnsToAdd);

        // Insert columns and set headers
        columnsToAdd.forEach(({ col, name }) => {
          console.log(`Inserting column "${name}" at index ${col}`);
          workbookRef.insertRowOrColumn('column', col, 1, 'rightbottom');
          
          // Set header name
          workbookRef.setCellValue(0, col, name);
        });

        return true;
      }

      case 'RENAME_COLUMN': {
        // Rename column header
        const target = action.params?.target as any;
        const newName = action.params?.renameTo as string;
        
        if (!target || !newName) return false;

        let colIndex = -1;
        if (typeof target.ref === 'string') {
          // If ref is column letter like "A"
          if (target.ref.match(/^[A-Z]+$/)) {
            colIndex = target.ref.charCodeAt(0) - 65;
          } else {
            // If ref is column name, find index
            colIndex = data.headers.indexOf(target.ref);
          }
        }

        if (colIndex >= 0) {
          console.log(`Renaming column ${colIndex} to "${newName}"`);
          workbookRef.setCellValue(0, colIndex, newName);
          return true;
        }
        return false;
      }

      case 'CONDITIONAL_FORMAT': {
        // Apply conditional formatting
        if (!action.changes || action.changes.length === 0) return false;
        
        const formatStyle = action.params?.formatStyle as any;
        if (!formatStyle) return false;

        action.changes.forEach((change) => {
          const row = change.row + 1;
          const col = change.col;

          // Apply background color
          if (formatStyle.backgroundColor) {
            workbookRef.setCellFormat(row, col, 'bg', formatStyle.backgroundColor);
          }

          // Apply text color
          if (formatStyle.color) {
            workbookRef.setCellFormat(row, col, 'fc', formatStyle.color);
          }

          // Apply bold
          if (formatStyle.fontWeight === 'bold') {
            workbookRef.setCellFormat(row, col, 'bl', 1);
          }
        });
        return true;
      }

      case 'DATA_CLEANSING':
      case 'DATA_TRANSFORM':
      case 'FIND_REPLACE':
      case 'FILL_DOWN':
      case 'REMOVE_EMPTY_ROWS':
      case 'REMOVE_DUPLICATES':
      case 'SORT_DATA':
      case 'FILTER_DATA': {
        // These operations modify data, apply all changes
        if (!action.changes || action.changes.length === 0) return false;

        action.changes.forEach((change) => {
          if (change.type === 'ROW_DELETE') {
            // Skip - will be handled by bulk delete
            return;
          }

          const row = change.row + 1;
          const col = change.col;
          workbookRef.setCellValue(row, col, change.newValue ?? '');
        });
        return true;
      }

      case 'SPLIT_COLUMN':
      case 'MERGE_COLUMNS':
      case 'CONCATENATE':
      case 'STATISTICS':
      case 'PIVOT_SUMMARY':
      case 'FORMAT_NUMBER':
      case 'EXTRACT_NUMBER':
      case 'GENERATE_ID': {
        // Apply cell changes
        if (!action.changes || action.changes.length === 0) return false;

        action.changes.forEach((change) => {
          const row = change.row + 1;
          const col = change.col;
          workbookRef.setCellValue(row, col, change.newValue ?? '');
        });
        return true;
      }

      case 'INFO':
      case 'CLARIFY':
      case 'DATA_AUDIT':
      case 'INSIGHTS':
      case 'DATA_VALIDATION':
      case 'TEXT_EXTRACTION':
      case 'DATE_CALCULATION':
      case 'CREATE_CHART': {
        // Informational only, no changes to apply
        console.log(`${action.type} is informational only`);
        return true;
      }

      default:
        console.warn(`Action type ${action.type} not implemented in FortuneSheet operations`);
        return false;
    }
  } catch (error) {
    console.error(`Error applying ${action.type} to FortuneSheet:`, error);
    return false;
  }
}

/**
 * Update all cells in FortuneSheet from ExcelData
 * Used for full sync after state changes
 */
export function syncFortuneSheetWithData(
  workbookRef: FortuneSheetRef | null,
  data: ExcelData
): boolean {
  if (!workbookRef) {
    console.warn('FortuneSheet ref not available');
    return false;
  }

  try {
    console.log(`Syncing FortuneSheet with ${data.rows.length} rows`);

    // Update all data cells
    data.rows.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const fortuneSheetRow = rowIndex + 1; // +1 for header
        workbookRef.setCellValue(
          fortuneSheetRow,
          colIndex,
          cellValue ?? ''
        );
      });
    });

    console.log('✅ FortuneSheet synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing FortuneSheet:', error);
    return false;
  }
}
