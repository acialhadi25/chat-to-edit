import { ExcelData, DataChange, getColumnIndex, getColumnLetter } from '@/types/excel';

// --- Immutable Operation Handlers ---
// These functions now return new arrays/objects instead of mutating the input data.

function applyCellUpdates(data: ExcelData, changes: DataChange[]): ExcelData {
  const newRows = [...data.rows];
  
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
  });
  
  return { ...data, rows: newRows };
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

  const newRows = data.rows.filter((_, index) => !indicesToDelete.has(index));

  // Update formulas to adjust row references after deletion
  const sortedDeletedRows = Array.from(indicesToDelete).sort((a, b) => a - b);
  const updatedRows = newRows.map((row, rowIndex) => {
    return row.map((cell) => {
      // Check if cell contains a formula
      if (typeof cell === 'string' && cell.startsWith('=')) {
        let updatedFormula = cell;
        
        // For each deleted row, adjust formula references
        sortedDeletedRows.forEach((deletedRowIndex) => {
          const deletedExcelRow = deletedRowIndex + 2; // +1 for header, +1 for Excel 1-based
          const currentExcelRow = rowIndex + 2; // Current row in Excel notation
          
          // If this row is after the deleted row, we need to adjust references
          if (rowIndex >= deletedRowIndex) {
            // Replace row references in formula
            // Match patterns like D6, E6, etc. (column letter + row number)
            updatedFormula = updatedFormula.replace(
              /([A-Z]+)(\d+)/g,
              (match, col, rowNum) => {
                const refRow = parseInt(rowNum);
                // If formula references a row after the deleted row, decrement it
                if (refRow > deletedExcelRow) {
                  return `${col}${refRow - 1}`;
                }
                return match;
              }
            );
          }
        });
        
        return updatedFormula;
      }
      return cell;
    });
  });

  return { ...data, rows: updatedRows };
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
