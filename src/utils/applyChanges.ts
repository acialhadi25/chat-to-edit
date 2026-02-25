import { ExcelData, DataChange, getColumnIndex, getColumnLetter } from '@/types/excel';

// --- Immutable Operation Handlers ---
// These functions now return new arrays/objects instead of mutating the input data.

function applyCellUpdates(data: ExcelData, changes: DataChange[]): ExcelData {
  const newRows = [...data.rows];
  const newFormulas = { ...data.formulas };
  
  changes.forEach((change) => {
    // Ensure row exists - add empty rows if needed
    while (newRows.length <= change.row) {
      // Create empty row with same number of columns as headers
      newRows.push(new Array(data.headers.length).fill(null));
    }
    
    // Ensure the row is an array
    if (!Array.isArray(newRows[change.row])) {
      newRows[change.row] = new Array(data.headers.length).fill(null);
    }
    
    // Now update the cell
    const newRow = [...newRows[change.row]];
    
    // Ensure row has enough columns
    while (newRow.length <= change.col) {
      newRow.push(null);
    }
    
    newRow[change.col] = change.newValue;
    newRows[change.row] = newRow;
    
    // If the value is a formula, also store it in formulas object
    if (typeof change.newValue === 'string' && change.newValue.startsWith('=')) {
      const cellRef = `${getColumnLetter(change.col)}${change.row + 2}`; // +2 because: +1 for header, +1 for 1-based Excel
      newFormulas[cellRef] = change.newValue;
    }
  });
  
  return { ...data, rows: newRows, formulas: newFormulas };
}

function applyRenameColumn(data: ExcelData, oldHeader: string, newHeader: string): ExcelData {
  const colIndex = data.headers.indexOf(oldHeader);
  if (colIndex === -1) return data;

  const newHeaders = data.headers.map((header, index) => (index === colIndex ? newHeader : header));
  return { ...data, headers: newHeaders };
}

function applyDeleteColumns(data: ExcelData, columns: string[]): ExcelData {
  const indicesToDelete = new Set(columns.map((c) => getColumnIndex(c)));
  if (indicesToDelete.size === 0) return data;

  const newHeaders = data.headers.filter((_, index) => !indicesToDelete.has(index));
  const newRows = data.rows.map((row) => row.filter((_, index) => !indicesToDelete.has(index)));

  return { ...data, headers: newHeaders, rows: newRows };
}

function applyDeleteRows(data: ExcelData, rows: number[]): ExcelData {
  const indicesToDelete = new Set(rows.map((r) => r - 1)); // Convert to 0-based index
  if (indicesToDelete.size === 0) return data;

  // Physically remove rows from the array
  const newRows = data.rows.filter((_, index) => !indicesToDelete.has(index));

  // Update formulas to adjust row references after deletion
  const sortedDeletedRows = Array.from(indicesToDelete).sort((a, b) => a - b);
  
  // Calculate how many rows were deleted before each position
  const getRowOffset = (originalRowIndex: number): number => {
    return sortedDeletedRows.filter(deletedIdx => deletedIdx < originalRowIndex).length;
  };

  const updatedRows = newRows.map((row, newRowIndex) => {
    return row.map((cell) => {
      // Check if cell contains a formula
      if (typeof cell === 'string' && cell.startsWith('=')) {
        let updatedFormula = cell;
        
        // Replace row references in formula
        // Match patterns like D6, E6, etc. (column letter + row number)
        updatedFormula = updatedFormula.replace(
          /([A-Z]+)(\d+)/g,
          (match, col, rowNum) => {
            const refRow = parseInt(rowNum);
            const refRowIndex = refRow - 2; // Convert to 0-based data row index (-1 for header, -1 for Excel 1-based)
            
            // If the referenced row was deleted, return #REF! error
            if (indicesToDelete.has(refRowIndex)) {
              return '#REF!';
            }
            
            // Calculate how many rows were deleted before this reference
            const offset = getRowOffset(refRowIndex);
            
            // Adjust the row number by subtracting the number of deleted rows before it
            if (offset > 0) {
              return `${col}${refRow - offset}`;
            }
            
            return match;
          }
        );
        
        return updatedFormula;
      }
      return cell;
    });
  });

  // Also update formulas in the formulas object if it exists
  const updatedFormulas: { [key: string]: string } = {};
  if (data.formulas) {
    Object.entries(data.formulas).forEach(([cellRef, formula]) => {
      // Parse cell reference (e.g., "D6" -> row 6, col D)
      const match = cellRef.match(/([A-Z]+)(\d+)/);
      if (!match) return;
      
      const [, col, rowStr] = match;
      const rowNum = parseInt(rowStr);
      const rowIndex = rowNum - 2; // Convert to 0-based data row index
      
      // Skip if this row was deleted
      if (indicesToDelete.has(rowIndex)) return;
      
      // Calculate new row number after deletions
      const offset = getRowOffset(rowIndex);
      const newRowNum = rowNum - offset;
      const newCellRef = `${col}${newRowNum}`;
      
      // Update formula references within the formula
      let updatedFormula = formula.replace(
        /([A-Z]+)(\d+)/g,
        (match, refCol, refRowStr) => {
          const refRow = parseInt(refRowStr);
          const refRowIndex = refRow - 2;
          
          if (indicesToDelete.has(refRowIndex)) {
            return '#REF!';
          }
          
          const refOffset = getRowOffset(refRowIndex);
          if (refOffset > 0) {
            return `${refCol}${refRow - refOffset}`;
          }
          
          return match;
        }
      );
      
      updatedFormulas[newCellRef] = updatedFormula;
    });
  }

  return { ...data, rows: updatedRows, formulas: updatedFormulas };
}

// --- Main applyChanges Function (Modified to use new immutable handlers) ---

export function applyChanges(
  data: ExcelData,
  changes: DataChange[]
): { data: ExcelData; description: string } {
  if (!changes || changes.length === 0) {
    return { data, description: 'No changes to apply.' };
  }

  let newData: ExcelData = data;

  const changesByType = changes.reduce(
    (acc, change) => {
      const type = change.type || 'CELL_UPDATE';
      if (!acc[type]) acc[type] = [];
      acc[type].push(change);
      return acc;
    },
    {} as Record<string, DataChange[]>
  );

  const descriptions: string[] = [];

  for (const [type, changeGroup] of Object.entries(changesByType)) {
    switch (type) {
      case 'COLUMN_ADD': {
        // Handle adding new columns (headers)
        const newHeaders = [...newData.headers];
        const newRows = newData.rows.map(row => [...row]);
        
        changeGroup.forEach((change: any) => {
          // Add header
          newHeaders[change.col] = change.newValue;
          // Ensure all rows have the new column (will be filled by CELL_UPDATE changes)
          newRows.forEach(row => {
            if (row.length <= change.col) {
              row[change.col] = null;
            }
          });
        });
        
        newData = { ...newData, headers: newHeaders, rows: newRows };
        descriptions.push(`Added ${changeGroup.length} column(s)`);
        break;
      }
      case 'CELL_UPDATE':
        newData = applyCellUpdates(newData, changeGroup);
        descriptions.push(`Updated ${changeGroup.length} cell(s)`);
        break;
      case 'COLUMN_RENAME': {
        // Assuming one rename action at a time for simplicity
        const { from, to } = changeGroup[0].params as { from: string; to: string };
        newData = applyRenameColumn(newData, from, to);
        descriptions.push(`Renamed column "${from}" to "${to}"`);
        break;
      }
      case 'COLUMN_DELETE': {
        const columns = [...new Set(changeGroup.map((c) => getColumnLetter(c.col)))].sort();
        newData = applyDeleteColumns(newData, columns);
        descriptions.push(`Deleted column(s): ${columns.join(', ')}`);
        break;
      }
      case 'DELETE_COLUMN': {
        // Handle DELETE_COLUMN action
        // The change object has col (index) and columnName (header name)
        const columnIndices = [...new Set(changeGroup.map((c: any) => c.col))];
        const columnNames = columnIndices.map(idx => newData.headers[idx]);
        
        // Delete columns by index
        const indicesToDelete = new Set(columnIndices);
        const newHeaders = newData.headers.filter((_, index) => !indicesToDelete.has(index));
        const newRows = newData.rows.map((row) => row.filter((_, index) => !indicesToDelete.has(index)));
        
        newData = { ...newData, headers: newHeaders, rows: newRows };
        descriptions.push(`Deleted column(s): ${columnNames.join(', ')}`);
        break;
      }
      case 'ROW_DELETE': {
        const rows = [...new Set(changeGroup.map((c) => c.row + 1))]; // Ensure row numbers are 1-based
        newData = applyDeleteRows(newData, rows);
        descriptions.push(`Deleted ${rows.length} row(s)`);
        break;
      }
      default:
        console.warn(`Unhandled change type: ${type}. Applying as cell updates.`);
        newData = applyCellUpdates(newData, changeGroup);
        descriptions.push(`Applied ${type} to ${changeGroup.length} item(s)`);
    }
  }

  // Clear pending changes as they have now been applied
  newData = { ...newData, pendingChanges: [] };

  return { data: newData, description: descriptions.join('; ') };
}
