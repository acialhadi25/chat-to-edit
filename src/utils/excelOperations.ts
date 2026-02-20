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
      case 'GENERATE_DATA': {
        // Handle pattern-based data generation
        // Try multiple locations for target and patterns (for backward compatibility)
        const target = (action as any).target || action.params?.target;
        const patterns = (action as any).patterns || action.params?.patterns;
        
        if (!target || !patterns) {
          console.warn('GENERATE_DATA: Missing target or patterns');
          console.warn('Available keys:', Object.keys(action));
          console.warn('Params:', action.params);
          
          // Try to extract from description as last resort
          if (action.description && data.headers.length > 0) {
            console.log('GENERATE_DATA: Attempting to extract from description:', action.description);
            
            // Check if this is a "fill data to row X" command - support multiple patterns
            const rowMatch = action.description.match(/(?:hingga|to|until|sampai)\s+(?:baris|row)\s+(\d+)/i) ||
                            action.description.match(/(?:isi|fill)\s+(?:data\s+)?(?:hingga|to|until|sampai)\s+(?:baris|row)\s+(\d+)/i) ||
                            action.description.match(/rows?\s+\d+-(\d+)/i) ||  // "rows 14-17" or "row 14-17"
                            action.description.match(/baris\s+\d+-(\d+)/i) ||  // "baris 14-17"
                            action.description.match(/row\s+(\d+)/i) ||
                            action.description.match(/baris\s+(\d+)/i);
            
            if (rowMatch) {
              const targetRow = parseInt(rowMatch[1]);
              const currentRows = data.rows.length;
              
              console.log(`GENERATE_DATA: Detected fill to row ${targetRow}, current rows: ${currentRows}`);
              
              if (targetRow > currentRows) {
                console.log(`GENERATE_DATA: Will generate data from row ${currentRows + 1} to ${targetRow}`);
                
                // Generate patterns for ALL columns based on existing data
                const generatedPatterns: any = {};
                
                data.headers.forEach((header, colIndex) => {
                  const colLetter = String.fromCharCode(65 + colIndex);
                  const lowerHeader = header.toLowerCase();
                  
                  // Analyze existing data to determine pattern
                  const existingValues = data.rows.map(row => row[colIndex]).filter(v => v !== null && v !== '');
                  
                  if (lowerHeader.includes('no') && colIndex === 0) {
                    // First column with "No" - likely sequence
                    generatedPatterns[colLetter] = { type: 'sequence', start: currentRows + 1, increment: 1 };
                  } else if (lowerHeader.includes('nama') || lowerHeader.includes('name')) {
                    generatedPatterns[colLetter] = { type: 'names', style: 'indonesian' };
                  } else if (lowerHeader.includes('produk') || lowerHeader.includes('product')) {
                    generatedPatterns[colLetter] = { type: 'products' };
                  } else if (lowerHeader.includes('harga') || lowerHeader.includes('price') || lowerHeader.includes('total')) {
                    generatedPatterns[colLetter] = { type: 'numbers', min: 100000, max: 10000000 };
                  } else if (lowerHeader.includes('qty') || lowerHeader.includes('jumlah') || lowerHeader.includes('quantity')) {
                    generatedPatterns[colLetter] = { type: 'numbers', min: 1, max: 100 };
                  } else if (lowerHeader.includes('status')) {
                    generatedPatterns[colLetter] = { type: 'status', values: ['Active', 'Pending', 'Completed', 'Lunas', 'Belum Lunas'] };
                  } else if (lowerHeader.includes('alamat') || lowerHeader.includes('address')) {
                    generatedPatterns[colLetter] = { type: 'addresses' };
                  } else if (lowerHeader.includes('telepon') || lowerHeader.includes('phone') || lowerHeader.includes('hp')) {
                    generatedPatterns[colLetter] = { type: 'phone' };
                  } else if (lowerHeader.includes('email')) {
                    generatedPatterns[colLetter] = { type: 'email' };
                  } else if (existingValues.length > 0) {
                    // Use existing values as pattern
                    generatedPatterns[colLetter] = { type: 'text', values: existingValues.slice(0, 5) };
                  } else {
                    // Default pattern
                    generatedPatterns[colLetter] = { type: 'text', values: [`${header} ${currentRows + 1}`] };
                  }
                });
                
                console.log('GENERATE_DATA: Generated patterns for all columns:', generatedPatterns);
                
                // Generate data for new rows
                for (let row = currentRows; row < targetRow; row++) {
                  Object.entries(generatedPatterns).forEach(([colLetter, pattern]: [string, any]) => {
                    const col = colLetter.charCodeAt(0) - 65;
                    let value: any = null;
                    const rowOffset = row - currentRows;
                    
                    switch (pattern.type) {
                      case 'sequence':
                        value = (pattern.start || 1) + rowOffset * (pattern.increment || 1);
                        break;
                      case 'names':
                        const names = pattern.style === 'indonesian' 
                          ? ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indra', 'Joko']
                          : ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson', 'Charlie Brown'];
                        value = names[rowOffset % names.length];
                        break;
                      case 'products':
                        const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Printer', 'Scanner', 'Webcam', 'Headset'];
                        value = products[rowOffset % products.length];
                        break;
                      case 'numbers':
                        const min = pattern.min || 0;
                        const max = pattern.max || 1000000;
                        value = Math.floor(Math.random() * (max - min + 1)) + min;
                        break;
                      case 'status':
                        const values = pattern.values || ['Active', 'Pending', 'Completed'];
                        value = values[rowOffset % values.length];
                        break;
                      case 'addresses':
                        const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro'];
                        const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
                        const street = streets[rowOffset % streets.length];
                        const city = cities[rowOffset % cities.length];
                        const number = 10 + rowOffset * 10;
                        value = `${street} No. ${number}, ${city}`;
                        break;
                      case 'phone':
                        value = `0812345678${String(rowOffset).padStart(2, '0')}`;
                        break;
                      case 'email':
                        value = `user${row + 1}@example.com`;
                        break;
                      case 'text':
                        const textValues = pattern.values || ['Value'];
                        value = textValues[rowOffset % textValues.length];
                        break;
                    }
                    
                    changes.push({
                      row,
                      col,
                      oldValue: null,
                      newValue: value,
                      type: 'CELL_UPDATE',
                    });
                  });
                }
                
                console.log(`Generated ${changes.length} changes for GENERATE_DATA (fill to row ${targetRow})`);
                break;
              } else {
                console.warn(`GENERATE_DATA: Target row ${targetRow} is not greater than current rows ${currentRows}`);
              }
            } else {
              console.log('GENERATE_DATA: No row number pattern found in description');
            }
            
            // Try to find column references in description
            const colMatch = action.description.match(/Alamat|Nomor Telepon|Status|Email/gi);
            if (colMatch && colMatch.length > 0) {
              console.log('GENERATE_DATA: Found column references:', colMatch);
              
              // Create patterns for found columns
              const generatedPatterns: any = {};
              colMatch.forEach(colName => {
                const lowerName = colName.toLowerCase();
                const colIndex = data.headers.findIndex(h => 
                  h.toLowerCase().includes(lowerName)
                );
                
                if (colIndex >= 0) {
                  const colLetter = String.fromCharCode(65 + colIndex);
                  
                  if (lowerName.includes('alamat') || lowerName.includes('address')) {
                    generatedPatterns[colLetter] = { type: 'addresses' };
                  } else if (lowerName.includes('telepon') || lowerName.includes('phone')) {
                    generatedPatterns[colLetter] = { type: 'phone' };
                  } else if (lowerName.includes('email')) {
                    generatedPatterns[colLetter] = { type: 'email' };
                  } else if (lowerName.includes('status')) {
                    generatedPatterns[colLetter] = { type: 'status', values: ['Active', 'Pending', 'Completed'] };
                  }
                }
              });
              
              if (Object.keys(generatedPatterns).length > 0) {
                console.log('GENERATE_DATA: Generated patterns:', generatedPatterns);
                
                // Generate data for all rows
                const startRow = 0;
                const endRow = data.rows.length - 1;
                
                for (let row = startRow; row <= endRow; row++) {
                  Object.entries(generatedPatterns).forEach(([colLetter, pattern]: [string, any]) => {
                    const col = colLetter.charCodeAt(0) - 65;
                    let value: any = null;
                    
                    switch (pattern.type) {
                      case 'addresses':
                        const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro'];
                        const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
                        const street = streets[row % streets.length];
                        const city = cities[row % cities.length];
                        const number = 10 + row * 10;
                        value = `${street} No. ${number}, ${city}`;
                        break;
                      case 'phone':
                        value = `0812345678${String(row).padStart(2, '0')}`;
                        break;
                      case 'email':
                        value = `user${row + 1}@example.com`;
                        break;
                      case 'status':
                        const values = pattern.values || ['Active', 'Pending', 'Completed'];
                        value = values[row % values.length];
                        break;
                    }
                    
                    changes.push({
                      row,
                      col,
                      oldValue: row < data.rows.length ? data.rows[row][col] : null,
                      newValue: value,
                      type: 'CELL_UPDATE',
                    });
                  });
                }
                
                console.log(`Generated ${changes.length} changes for GENERATE_DATA (from description)`);
                break;
              }
            }
          }
          
          console.error('GENERATE_DATA: Could not generate data - no target/patterns found');
          break;
        }

        console.log(`GENERATE_DATA: Generating data for range ${target.ref}`);

        // Parse range (e.g., "11:20")
        const [startRow, endRow] = target.ref.split(':').map((r: string) => parseInt(r) - 2); // Convert to 0-based
        
        // Generate data for each row and column
        for (let row = startRow; row <= endRow; row++) {
          Object.entries(patterns).forEach(([colLetter, pattern]: [string, any]) => {
            const col = colLetter.charCodeAt(0) - 65; // A=0, B=1, etc
            const rowNum = row + 2; // Convert back to 1-based for display
            
            let value: any = null;
            
            switch (pattern.type) {
              case 'sequence':
                value = (pattern.start || 1) + (row - startRow) * (pattern.increment || 1);
                break;
              case 'names':
                const names = pattern.style === 'indonesian' 
                  ? ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indra', 'Joko']
                  : ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt', 'Fiona Gallagher', 'George Miller', 'Hannah Montana'];
                value = names[(row - startRow) % names.length];
                break;
              case 'products':
                const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Printer', 'Scanner', 'Webcam', 'Headset', 'Speaker', 'Microphone'];
                value = products[(row - startRow) % products.length];
                break;
              case 'numbers':
                const min = pattern.min || 0;
                const max = pattern.max || 1000000;
                value = Math.floor(Math.random() * (max - min + 1)) + min;
                break;
              case 'status':
                const statusValues = pattern.values || ['Active', 'Pending', 'Completed'];
                value = statusValues[(row - startRow) % statusValues.length];
                break;
              case 'addresses':
                const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro', 'Jl. Malioboro', 'Jl. Asia Afrika', 'Jl. Pemuda', 'Jl. Veteran', 'Jl. Pahlawan'];
                const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta'];
                const street = streets[(row - startRow) % streets.length];
                const city = cities[(row - startRow) % cities.length];
                const number = 10 + (row - startRow) * 10;
                value = `${street} No. ${number}, ${city}`;
                break;
              case 'text':
                const textValues = pattern.values || ['Value 1', 'Value 2', 'Value 3'];
                value = textValues[(row - startRow) % textValues.length];
                break;
            }
            
            changes.push({
              row,
              col,
              oldValue: row < data.rows.length ? data.rows[row][col] : null,
              newValue: value,
              type: 'CELL_UPDATE',
            });
          });
        }
        
        console.log(`Generated ${changes.length} changes for GENERATE_DATA`);
        break;
      }

      case 'ADD_COLUMN_WITH_DATA': {
        // Handle adding columns with pattern-based data
        // FIRST: Check if changes array is already provided
        if (action.changes && action.changes.length > 0) {
          console.log('ADD_COLUMN_WITH_DATA: Using provided changes array directly');
          return action.changes.map(change => ({
            row: typeof change.row === 'number' ? change.row : parseInt(change.cellRef?.match(/\d+/)?.[0] || '0') - 2,
            col: typeof change.col === 'number' ? change.col : (change.cellRef ? change.cellRef.charCodeAt(0) - 65 : 0),
            oldValue: change.before || null,
            newValue: change.after,
            type: (change.type as any) || 'CELL_UPDATE',
            columnName: change.columnName,
          }));
        }
        
        // Try multiple locations for columns data
        let columns = (action as any).columns ||  // Root level (preferred)
                     action.params?.columns ||     // In params
                     (action.params as any)?.action?.columns; // Nested in params.action
        
        if (!columns || !Array.isArray(columns)) {
          console.warn('ADD_COLUMN_WITH_DATA: Missing columns array and no changes provided');
          console.warn('Tried locations: root.columns, params.columns, params.action.columns, action.changes');
          console.warn('Available keys:', Object.keys(action));
          console.warn('Description:', action.description);
          
          // Last resort: try to extract from description and create columns with smart defaults
          if (action.description) {
            // Try to extract multiple column names (supports multi-word names)
            const multiMatch = action.description.match(/Add\s+([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)\s+columns?/i) ||
                              action.description.match(/Tambah\s+([A-Za-z\s]+?)\s+dan\s+([A-Za-z\s]+?)\s+kolom/i) ||
                              action.description.match(/([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)\s+columns?/i) ||
                              action.description.match(/([A-Za-z\s]+?)\s+dan\s+([A-Za-z\s]+?)\s+kolom/i);
            
            if (multiMatch) {
              const col1 = multiMatch[1].trim();
              const col2 = multiMatch[2].trim();
              console.log(`ADD_COLUMN_WITH_DATA: Extracted column names from description: "${col1}", "${col2}"`);
              
              // Create smart patterns based on column names
              const getPatternForColumn = (name: string) => {
                const lowerName = name.toLowerCase();
                if (lowerName.includes('alamat') || lowerName.includes('address')) {
                  return { type: 'addresses' };
                } else if (lowerName.includes('telepon') || lowerName.includes('phone') || lowerName.includes('hp')) {
                  return { type: 'phone' };
                } else if (lowerName.includes('email')) {
                  return { type: 'email' };
                } else if (lowerName.includes('status')) {
                  return { type: 'status', values: ['Active', 'Pending', 'Completed'] };
                } else {
                  return { type: 'text', values: ['Sample Data'] };
                }
              };
              
              columns = [
                { name: col1, pattern: getPatternForColumn(col1) },
                { name: col2, pattern: getPatternForColumn(col2) }
              ];
              
              console.log('ADD_COLUMN_WITH_DATA: Created columns with smart patterns:', columns);
            }
          }
          
          if (!columns) {
            console.error('ADD_COLUMN_WITH_DATA: Could not extract column information');
            break;
          }
        }

        console.log(`ADD_COLUMN_WITH_DATA: Found ${columns.length} columns to add`);

        const startCol = data.headers.length; // Start after existing columns
        
        columns.forEach((columnDef: any, colOffset: number) => {
          const col = startCol + colOffset;
          const pattern = columnDef.pattern;
          
          // Add header - use special type 'COLUMN_ADD' to signal header addition
          changes.push({
            row: 0, // Will be handled specially
            col,
            oldValue: null,
            newValue: columnDef.name,
            type: 'COLUMN_ADD',
            columnName: columnDef.name, // Store column name for header update
          });
          
          // Add data for each row
          for (let row = 0; row < data.rows.length; row++) {
            let value: any = null;
            
            switch (pattern.type) {
              case 'status':
              case 'text':
                const values = pattern.values || ['Value'];
                value = values[row % values.length];
                break;
              case 'addresses':
                const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro'];
                const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
                const street = streets[row % streets.length];
                const city = cities[row % cities.length];
                const number = 10 + row * 10;
                value = `${street} No. ${number}, ${city}`;
                break;
              case 'phone':
                value = `0812345678${String(row).padStart(2, '0')}`;
                break;
              case 'email':
                value = `user${row + 1}@example.com`;
                break;
              case 'numbers':
                const min = pattern.min || 0;
                const max = pattern.max || 1000000;
                value = Math.floor(Math.random() * (max - min + 1)) + min;
                break;
            }
            
            changes.push({
              row,
              col,
              oldValue: null,
              newValue: value,
              type: 'CELL_UPDATE',
            });
          }
        });
        
        console.log(`Generated ${changes.length} changes for ADD_COLUMN_WITH_DATA`);
        break;
      }

      case 'EDIT_ROW': {
        // Handle row editing - can be single row or range
        const target = getTarget();
        if (!target || !target.ref) {
          console.warn('EDIT_ROW: No target.ref found');
          break;
        }

        console.log('EDIT_ROW: Full action object:', JSON.stringify(action, null, 2));
        console.log('EDIT_ROW: Params:', action.params);
        console.log('EDIT_ROW: Target:', target);

        // If changes are already provided in action, use them directly
        if (action.changes && action.changes.length > 0) {
          console.log('EDIT_ROW: Using provided changes array');
          return action.changes.map(change => ({
            row: typeof change.row === 'number' ? change.row : parseInt(change.cellRef.match(/\d+/)?.[0] || '0') - 2,
            col: typeof change.col === 'number' ? change.col : change.cellRef.charCodeAt(0) - 65,
            oldValue: change.before,
            newValue: change.after,
            type: 'CELL_UPDATE' as const,
          }));
        }

        // Try to extract row data from params
        const rowData = action.params?.rowData || (action as any).rowData;
        console.log('EDIT_ROW: rowData:', rowData);
        
        // If no rowData, try to parse from description
        let parsedRowData = rowData;
        if (!parsedRowData && action.description) {
          console.log('EDIT_ROW: Attempting to parse from description:', action.description);
          
          // Parse description like "Isi baris 8 dengan mock data: No=8, Nama=Budi Sant... Harga=500000, Qty=2, Total=1000000, Status=Lunas"
          const dataMatch = action.description.match(/:\s*(.+)$/);
          if (dataMatch) {
            const dataStr = dataMatch[1];
            parsedRowData = {};
            
            // Split by comma and parse key=value pairs
            const pairs = dataStr.split(',').map(s => s.trim());
            for (const pair of pairs) {
              const [key, ...valueParts] = pair.split('=');
              if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                // Try to parse as number if possible
                const numValue = parseFloat(value);
                parsedRowData[key.trim()] = isNaN(numValue) ? value : numValue;
              }
            }
            
            console.log('EDIT_ROW: Parsed rowData from description:', parsedRowData);
          }
        }
        
        if (parsedRowData && typeof parsedRowData === 'object') {
          console.log('EDIT_ROW: Extracting from rowData:', parsedRowData);
          
          // Parse row number from target.ref (e.g., "8" or "row8")
          const rowMatch = target.ref.match(/\d+/);
          if (!rowMatch) {
            console.warn('EDIT_ROW: Could not parse row number from target.ref:', target.ref);
            break;
          }
          
          const rowIndex = parseInt(rowMatch[0]) - 2; // -1 for header, -1 for 0-based
          console.log('EDIT_ROW: rowIndex:', rowIndex, 'from target.ref:', target.ref);
          
          // Generate changes for each column in rowData
          Object.entries(parsedRowData).forEach(([key, value]) => {
            console.log(`EDIT_ROW: Processing key="${key}", value="${value}"`);
            
            // Try to find column index by header name
            const colIndex = data.headers.findIndex(h => 
              h.toLowerCase() === key.toLowerCase() ||
              h.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(h.toLowerCase())
            );
            
            console.log(`EDIT_ROW: Column "${key}" mapped to index ${colIndex}`);
            
            if (colIndex >= 0) {
              const oldValue = rowIndex < data.rows.length ? data.rows[rowIndex][colIndex] : null;
              
              // Skip if value is a formula placeholder
              if (typeof value === 'string' && value.startsWith('=') && value.includes('{row}')) {
                // This should be handled by INSERT_FORMULA instead
                console.log(`EDIT_ROW: Skipping formula for column ${colIndex}: ${value}`);
                return;
              }
              
              changes.push({
                row: rowIndex,
                col: colIndex,
                oldValue,
                newValue: value,
                type: 'CELL_UPDATE',
              });
              
              console.log(`EDIT_ROW: Added change for row ${rowIndex}, col ${colIndex}: ${oldValue} -> ${value}`);
            } else {
              console.warn(`EDIT_ROW: Could not find column for key: ${key}`);
            }
          });
          
          console.log(`Generated ${changes.length} changes for EDIT_ROW`);
          break;
        }

        console.log('EDIT_ROW processing: No rowData found in params');
        break;
      }

      case 'ADD_COLUMN': {
        // Handle adding new column(s) - supports multiple columns
        let columnNames: string[] = [];
        
        // Try to get column name(s) from params
        const singleColumnName = action.params?.newColumnName || (action as any).newColumnName;
        if (singleColumnName) {
          columnNames = [singleColumnName];
        }
        
        // Try to extract from description if not provided
        if (columnNames.length === 0 && action.description) {
          // Try to extract multiple columns first (supports multi-word column names)
          const multiMatch = action.description.match(/Add\s+([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)\s+columns?/i) ||
                            action.description.match(/Tambah\s+([A-Za-z\s]+?)\s+dan\s+([A-Za-z\s]+?)\s+kolom/i);
          
          if (multiMatch) {
            columnNames = [multiMatch[1].trim(), multiMatch[2].trim()];
            console.log(`ADD_COLUMN: Extracted multiple column names from description:`, columnNames);
          } else {
            // Try single column patterns (supports multi-word column names)
            const patterns = [
              /Add\s+([A-Za-z\s]+?)\s+column/i,           // "Add Nomor Telepon column"
              /Tambah\s+kolom\s+([A-Za-z\s]+?)(?:\s+header)?$/i,  // "Tambah kolom Nomor Telepon"
              /kolom\s+([A-Za-z\s]+?)(?:\s+header)?$/i,   // "kolom Nomor Telepon"
            ];
            
            for (const pattern of patterns) {
              const match = action.description.match(pattern);
              if (match) {
                columnNames = [match[1].trim()];
                console.log(`ADD_COLUMN: Extracted single column name from description: "${match[1].trim()}"`);
                break;
              }
            }
          }
        }
        
        const pattern = action.params?.pattern;
        const autoFill = action.params?.autoFill;
        
        console.log('ADD_COLUMN:', { columnNames, hasPattern: !!pattern, autoFill, description: action.description });
        
        // If changes are already provided in action, use them directly
        if (action.changes && action.changes.length > 0) {
          console.log('ADD_COLUMN: Using provided changes array');
          return action.changes.map(change => ({
            row: typeof change.row === 'number' ? change.row : parseInt(change.cellRef.match(/\d+/)?.[0] || '0') - 2,
            col: typeof change.col === 'number' ? change.col : change.cellRef.charCodeAt(0) - 65,
            oldValue: change.before,
            newValue: change.after,
            type: 'CELL_UPDATE' as const,
          }));
        }

        // If no column names found, can't proceed
        if (columnNames.length === 0) {
          console.warn('ADD_COLUMN: No column names found in newColumnName, params, or description');
          console.warn('Description was:', action.description);
          break;
        }

        // Add headers for all new columns
        columnNames.forEach((columnName, index) => {
          const col = data.headers.length + index; // New column index
          changes.push({
            row: 0,
            col,
            oldValue: null,
            newValue: columnName,
            type: 'COLUMN_ADD',
            columnName: columnName,
          });
          
          console.log(`ADD_COLUMN: Added header for column "${columnName}" at index ${col}`);

          // If pattern is provided and autoFill is true, generate data
          if (pattern && autoFill) {
            console.log(`ADD_COLUMN: Auto-filling data for column "${columnName}" with pattern`);
            
            // Generate data for each row based on pattern
            for (let row = 0; row < data.rows.length; row++) {
              let value: any = null;
              
              switch (pattern.type) {
                case 'status':
                case 'text':
                  const values = pattern.values || ['Value'];
                  value = values[row % values.length];
                  break;
                case 'addresses':
                  const streets = ['Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro'];
                  const cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
                  const street = streets[row % streets.length];
                  const city = cities[row % cities.length];
                  const number = 10 + row * 10;
                  value = `${street} No. ${number}, ${city}`;
                  break;
                case 'phone':
                  value = `0812345678${String(row).padStart(2, '0')}`;
                  break;
                case 'email':
                  value = `user${row + 1}@example.com`;
                  break;
                case 'numbers':
                  const min = pattern.min || 0;
                  const max = pattern.max || 1000000;
                  value = Math.floor(Math.random() * (max - min + 1)) + min;
                  break;
              }
              
              changes.push({
                row,
                col,
                oldValue: null,
                newValue: value,
                type: 'CELL_UPDATE',
              });
            }
            
            console.log(`Generated ${data.rows.length} data cells for column "${columnName}"`);
          }
        });

        console.log(`ADD_COLUMN: Total changes generated: ${changes.length}`);
        break;
      }

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
          
          console.log(`Row ${row}: Formula before replace: "${formula}", after replace: "${formulaWithRow}"`);
          
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
