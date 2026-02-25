# AI Actions Full Integration Plan with Univer API

## Overview
Rencana lengkap untuk mengintegrasikan semua AI actions dengan Univer API, termasuk actions yang saat ini "handled at dashboard level".

## Current Status

### ✅ Fully Implemented (8/13)
1. EDIT_CELL - Edit single cell value
2. INSERT_FORMULA - Insert formula to cell
3. EDIT_ROW - Update entire row
4. DELETE_ROW - Clear row content
5. EDIT_COLUMN - Fill column with values
6. DATA_TRANSFORM - Transform text (uppercase/lowercase/titlecase)
7. FILL_DOWN - Fill down values/formulas
8. DELETE_COLUMN - Delete column (via data structure update)

### ⏳ Needs Implementation (5/13)
9. ADD_COLUMN - Add new column
10. GENERATE_DATA - Generate pattern-based data
11. REMOVE_EMPTY_ROWS - Remove empty rows
12. STATISTICS - Add summary statistics row
13. CONDITIONAL_FORMAT - Apply conditional formatting

## Implementation Strategy

### Phase 1: Structural Operations (ADD_COLUMN, REMOVE_EMPTY_ROWS)
These operations modify the data structure and require:
1. Update React state (headers, rows)
2. Recreate Univer workbook with new data
3. Maintain formulas and styles

**Approach**: Keep current dashboard-level handling but improve the flow

### Phase 2: Data Generation (GENERATE_DATA, STATISTICS)
These operations add new data:
1. Generate new rows based on patterns
2. Calculate statistics
3. Update both state and Univer

**Approach**: Generate data at dashboard level, then sync to Univer

### Phase 3: Formatting (CONDITIONAL_FORMAT)
This requires Univer's conditional formatting API:
1. Research Univer conditional formatting API
2. Implement rule-based formatting
3. Support multiple conditions

**Approach**: Use Univer's native conditional formatting if available

## Detailed Implementation Plan

### 1. ADD_COLUMN
**Current**: Handled at dashboard level
**Target**: Improve integration

**Steps**:
1. Generate change in `excelOperations.ts`
2. Apply change in `applyChanges.ts` to update headers and rows
3. Trigger workbook recreation in ExcelPreview
4. Preserve existing data and formulas

**Code Location**: 
- `src/utils/excelOperations.ts` (generateChangesFromAction)
- `src/utils/applyChanges.ts` (applyChanges)
- `src/components/dashboard/ExcelPreview.tsx` (useEffect for data changes)

### 2. REMOVE_EMPTY_ROWS
**Current**: Handled at dashboard level
**Target**: Full implementation

**Steps**:
1. Identify empty rows (all cells null/empty)
2. Generate DELETE_ROW changes for each empty row
3. Apply changes to remove rows from data structure
4. Update Univer workbook

**Implementation**:
```typescript
case 'REMOVE_EMPTY_ROWS': {
  const emptyRows: number[] = [];
  data.rows.forEach((row, idx) => {
    const isEmpty = row.every(cell => cell === null || cell === '' || cell === undefined);
    if (isEmpty) emptyRows.push(idx);
  });
  
  // Generate changes to delete empty rows
  emptyRows.forEach(rowIdx => {
    changes.push({
      type: 'ROW_DELETE',
      row: rowIdx
    });
  });
}
```

### 3. GENERATE_DATA
**Current**: Handled at dashboard level
**Target**: Full implementation

**Steps**:
1. Parse pattern from params (e.g., "1, 2, 3..." or "A, B, C...")
2. Generate new rows based on pattern
3. Add rows to data structure
4. Update Univer workbook

**Implementation**:
```typescript
case 'GENERATE_DATA': {
  const pattern = action.params?.pattern;
  const count = action.params?.count || 10;
  const startRow = action.params?.startRow || data.rows.length;
  
  // Generate data based on pattern
  const newRows = generateDataFromPattern(pattern, count);
  
  // Add to changes
  newRows.forEach((row, idx) => {
    changes.push({
      type: 'ROW_ADD',
      row: startRow + idx,
      rowData: row
    });
  });
}
```

### 4. STATISTICS
**Current**: Handled at dashboard level
**Target**: Full implementation

**Steps**:
1. Calculate statistics (SUM, AVG, MIN, MAX, COUNT)
2. Add summary row at bottom
3. Use formulas for dynamic updates

**Implementation**:
```typescript
case 'STATISTICS': {
  const columns = action.params?.columns || [];
  const summaryRow = data.rows.length;
  
  columns.forEach((col, idx) => {
    const colLetter = getColumnLetter(idx);
    const range = `${colLetter}2:${colLetter}${summaryRow}`;
    
    changes.push({
      type: 'CELL_UPDATE',
      row: summaryRow,
      col: idx,
      newValue: `=SUM(${range})`
    });
  });
}
```

### 5. CONDITIONAL_FORMAT
**Current**: Not implemented
**Target**: Full implementation with Univer API

**Research Needed**:
- Check Univer conditional formatting API
- Understand rule structure
- Test with different conditions

**Potential Implementation**:
```typescript
case 'CONDITIONAL_FORMAT': {
  const range = action.params?.range;
  const condition = action.params?.condition; // e.g., ">100"
  const format = action.params?.format; // e.g., { bgcolor: 'red' }
  
  // Use Univer conditional formatting API
  // TODO: Research exact API
}
```

## Testing Plan

### Test Cases for Each Action

1. **ADD_COLUMN**
   - Add column at start
   - Add column at end
   - Add column at specific position
   - Add multiple columns

2. **REMOVE_EMPTY_ROWS**
   - Remove single empty row
   - Remove multiple empty rows
   - Keep non-empty rows
   - Handle edge cases (all empty, none empty)

3. **GENERATE_DATA**
   - Numeric sequence (1, 2, 3...)
   - Alphabetic sequence (A, B, C...)
   - Date sequence
   - Custom pattern

4. **STATISTICS**
   - SUM for numeric columns
   - AVG, MIN, MAX
   - COUNT for all columns
   - Multiple statistics rows

5. **CONDITIONAL_FORMAT**
   - Greater than condition
   - Less than condition
   - Equal to condition
   - Between range
   - Text contains

## Implementation Priority

1. **High Priority** (Week 1)
   - REMOVE_EMPTY_ROWS (most requested)
   - STATISTICS (business value)

2. **Medium Priority** (Week 2)
   - GENERATE_DATA (useful for testing)
   - Improve ADD_COLUMN flow

3. **Low Priority** (Week 3)
   - CONDITIONAL_FORMAT (requires research)

## Success Criteria

- ✅ All 13 actions fully functional
- ✅ Actions work with Univer API directly where possible
- ✅ Data structure changes properly synced
- ✅ Formulas preserved during operations
- ✅ Undo/redo works for all actions
- ✅ Performance acceptable for large datasets
- ✅ Comprehensive test coverage

## Next Steps

1. Implement REMOVE_EMPTY_ROWS
2. Implement STATISTICS
3. Improve ADD_COLUMN integration
4. Implement GENERATE_DATA
5. Research and implement CONDITIONAL_FORMAT
6. Update documentation
7. Add comprehensive tests

---

**Created**: 2025-02-25
**Status**: Planning Phase
