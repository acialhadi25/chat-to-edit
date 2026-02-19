import { ExcelData, DataChange, AIAction } from '@/types/excel';

/**
 * Creates a deep copy of the Excel data to ensure immutability.
 * This is crucial for state management and undo/redo functionality.
 * FIX: This function is now robust against partially undefined data during initialization.
 */
export function cloneExcelData(data: ExcelData | null): ExcelData | null {
  if (!data) return null;

  return {
    fileName: data.fileName || '',
    currentSheet: data.currentSheet || 'Sheet1',
    sheets: Array.isArray(data.sheets) ? [...data.sheets] : [],
    headers: Array.isArray(data.headers) ? [...data.headers] : [],
    rows: Array.isArray(data.rows)
      ? data.rows.map((row) => (Array.isArray(row) ? [...row] : []))
      : [],
    columnWidths: Array.isArray(data.columnWidths) ? [...data.columnWidths] : [],
    selectedCells: Array.isArray(data.selectedCells) ? [...data.selectedCells] : [],
    pendingChanges: Array.isArray(data.pendingChanges) ? [...data.pendingChanges] : [],
    cellStyles: data.cellStyles ? JSON.parse(JSON.stringify(data.cellStyles)) : {},
    formulas: data.formulas ? JSON.parse(JSON.stringify(data.formulas)) : {},
  };
}

/**
 * Analyzes the current data for potential data cleansing operations.
 * This is a simplified example; a real implementation would be more complex.
 */
export function analyzeDataForCleansing(data: ExcelData): string[] {
  const issues: string[] = [];
  const nonEmptyRows = (data.rows || []).filter((row) =>
    row.some((cell) => cell !== null && cell !== '')
  );
  if ((data.rows || []).length > nonEmptyRows.length) {
    issues.push(`Found ${(data.rows || []).length - nonEmptyRows.length} empty rows.`);
  }

  let extraSpacesCount = 0;
  (data.rows || []).forEach((row) => {
    (row || []).forEach((cell) => {
      if (typeof cell === 'string' && cell.trim() !== cell) {
        extraSpacesCount++;
      }
    });
  });
  if (extraSpacesCount > 0) {
    issues.push(`Found ${extraSpacesCount} cells with leading/trailing spaces.`);
  }

  return issues;
}


/**
 * Generate DataChange array from AIAction
 * This function converts action params into actual cell changes
 */
export function generateChangesFromAction(data: ExcelData, action: AIAction): DataChange[] {
  const changes: DataChange[] = [];

  try {
    // Helper to get target from either direct property or params
    const getTarget = () => (action.params?.target || action.params) as any;
    const getFormula = () => action.formula || (action.params?.formula as string);
    const getTransformType = () => action.params?.transformType as string;

    console.log('generateChangesFromAction called with:', {
      type: action.type,
      hasParams: !!action.params,
      params: action.params,
      formula: action.formula,
    });

    switch (action.type) {
      case 'INSERT_FORMULA': {
        // Parse target range
        const target = getTarget();
        if (!target || !target.ref) {
          console.warn('INSERT_FORMULA: No target.ref found');
          break;
        }

        const formula = getFormula();
        if (!formula) {
          console.warn('INSERT_FORMULA: No formula found');
          break;
        }

        console.log('INSERT_FORMULA processing:', { target, formula });

        // Parse range (e.g., "F2:F12" or "F" for entire column)
        const ref = target.ref as string;
        let startRow = 0;
        let endRow = data.rows.length - 1;
        let col = 0;

        if (ref.includes(':')) {
          // Range format: "F2:F12"
          const [start, end] = ref.split(':');
          const startMatch = start.match(/([A-Z]+)(\d+)/);
          const endMatch = end.match(/([A-Z]+)(\d+)/);
          
          if (startMatch && endMatch) {
            col = startMatch[1].charCodeAt(0) - 65; // A=0, B=1, etc
            startRow = parseInt(startMatch[2]) - 2; // -1 for header, -1 for 0-based
            endRow = parseInt(endMatch[2]) - 2;
          }
        } else if (ref.match(/^[A-Z]+$/)) {
          // Column format: "F"
          col = ref.charCodeAt(0) - 65;
          startRow = 0;
          endRow = data.rows.length - 1;
        } else if (ref.match(/^[A-Z]+\d+$/)) {
          // Single cell: "F2"
          const match = ref.match(/([A-Z]+)(\d+)/);
          if (match) {
            col = match[1].charCodeAt(0) - 65;
            startRow = parseInt(match[2]) - 2;
            endRow = startRow;
          }
        }

        console.log('Parsed range:', { col, startRow, endRow, totalRows: data.rows.length });

        // Generate changes for each row
        for (let row = startRow; row <= endRow; row++) {
          const actualRow = row + 2; // +1 for header, +1 for 1-based
          const formulaWithRow = formula.replace(/\{row\}/g, String(actualRow));
          
          // Get old value - if row doesn't exist yet, it's null
          const oldValue = row < data.rows.length ? data.rows[row][col] : null;
          
          changes.push({
            row,
            col,
            oldValue,
            newValue: formulaWithRow,
            type: 'CELL_UPDATE',
          });
        }

        console.log(`Generated ${changes.length} changes for INSERT_FORMULA`);
        break;
      }

      case 'DATA_TRANSFORM': {
        const target = getTarget();
        const transformType = getTransformType();
        
        if (!target || !transformType) {
          console.warn('DATA_TRANSFORM: Missing target or transformType');
          break;
        }

        const ref = target.ref as string;
        let col = 0;

        if (ref.match(/^[A-Z]+$/)) {
          col = ref.charCodeAt(0) - 65;
        }

        // Transform all cells in column
        data.rows.forEach((row, rowIndex) => {
          const oldValue = row[col];
          if (typeof oldValue === 'string') {
            let newValue = oldValue;
            
            switch (transformType) {
              case 'uppercase':
                newValue = oldValue.toUpperCase();
                break;
              case 'lowercase':
                newValue = oldValue.toLowerCase();
                break;
              case 'titlecase':
                newValue = oldValue.replace(/\w\S*/g, (txt) => 
                  txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
                break;
            }

            if (newValue !== oldValue) {
              changes.push({
                row: rowIndex,
                col,
                oldValue,
                newValue,
                type: 'CELL_UPDATE',
              });
            }
          }
        });

        console.log(`Generated ${changes.length} changes for DATA_TRANSFORM`);
        break;
      }

      case 'DELETE_ROW': {
        const target = getTarget();
        if (!target || !target.ref) break;

        // Parse row numbers (e.g., "5" or "5,7,10")
        const rowRefs = target.ref.split(',').map((r: string) => parseInt(r.trim()));
        
        rowRefs.forEach((excelRow: number) => {
          const rowIndex = excelRow - 2; // -1 for header, -1 for 0-based
          if (rowIndex >= 0 && rowIndex < data.rows.length) {
            data.rows[rowIndex].forEach((oldValue, colIndex) => {
              changes.push({
                row: rowIndex,
                col: colIndex,
                oldValue,
                newValue: null,
                type: 'ROW_DELETE',
              });
            });
          }
        });

        console.log(`Generated ${changes.length} changes for DELETE_ROW`);
        break;
      }

      case 'REMOVE_EMPTY_ROWS': {
        data.rows.forEach((row, rowIndex) => {
          const isEmpty = row.every(cell => cell === null || cell === '' || cell === undefined);
          if (isEmpty) {
            row.forEach((oldValue, colIndex) => {
              changes.push({
                row: rowIndex,
                col: colIndex,
                oldValue,
                newValue: null,
                type: 'ROW_DELETE',
              });
            });
          }
        });

        console.log(`Generated ${changes.length} changes for REMOVE_EMPTY_ROWS`);
        break;
      }

      case 'STATISTICS': {
        // Add a summary row at the end
        const summaryRow = data.rows.length;
        data.headers.forEach((header, colIndex) => {
          const columnValues = data.rows
            .map(row => row[colIndex])
            .filter(val => typeof val === 'number');

          if (columnValues.length > 0) {
            const sum = columnValues.reduce((a, b) => a + b, 0);
            changes.push({
              row: summaryRow,
              col: colIndex,
              oldValue: null,
              newValue: `SUM: ${sum}`,
              type: 'CELL_UPDATE',
            });
          }
        });

        console.log(`Generated ${changes.length} changes for STATISTICS`);
        break;
      }

      // Add more cases as needed
      default:
        console.warn(`generateChangesFromAction: ${action.type} not implemented`);
    }
  } catch (error) {
    console.error('Error generating changes from action:', error);
  }

  console.log(`Total changes generated: ${changes.length}`);
  return changes;
}
