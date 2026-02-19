# FortuneSheet - Correct API Usage

## Documentation Reference
https://ruilisi.github.io/fortune-sheet-docs/guide/api.html

## Key Discovery
FortuneSheet DOES have an API, but it's accessed through the Workbook `ref`, NOT `window.luckysheet`!

## Correct API Access

### Wrong Approach (What We Tried):
```typescript
const luckysheet = (window as any).luckysheet;  // ❌ TIDAK ADA!
luckysheet.setCellValue(row, col, value);
```

### Correct Approach:
```typescript
const workbookRef = useRef<any>(null);

// Access API through ref
workbookRef.current.setCellValue(row, col, value);  // ✅ BENAR!
```

## Available APIs (via ref)

### Cell Operations:
- `setCellValue(row, column, value, [options])` - Set single cell
- `setCellValuesByRange(data, range, [options])` - Set multiple cells
- `getCellValue(row, column, [options])` - Get cell value
- `clearCell(row, column, [options])` - Clear cell
- `setCellFormat(row, column, attr, value, [options])` - Set cell format
- `setCellFormatByRange(attr, value, range, [options])` - Set format for range

### Row/Column Operations:
- `insertRowOrColumn(type, index, count, direction, [options])`
- `deleteRowOrColumn(type, start, end, [options])`
- `setRowHeight(rowInfo, [options])`
- `setColumnWidth(columnInfo, [options])`
- `getRowHeight(rows, [options])`
- `getColumnWidth(columns, [options])`

### Selection:
- `getSelection()` - Get current selection
- `setSelection(range, [options])` - Set selection

### Sheet Operations:
- `getAllSheets()` - Get all sheets
- `getSheet(options)` - Get specific sheet
- `addSheet()` - Add new sheet
- `deleteSheet(options)` - Delete sheet
- `activateSheet(options)` - Switch to sheet

## Implementation

### ExcelPreview.tsx:
```typescript
const workbookRef = useRef<any>(null);

useEffect(() => {
  if (!workbookRef.current) return;

  console.log('Updating FortuneSheet via API');
  
  // Update all cells using setCellValue API
  data.rows.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      if (cellValue !== null && cellValue !== undefined) {
        workbookRef.current.setCellValue(
          rowIndex + 1,  // +1 because row 0 is headers
          colIndex, 
          cellValue
        );
      }
    });
  });
  
  console.log('✅ FortuneSheet updated successfully');
}, [data]);

return (
  <Workbook
    ref={workbookRef}
    data={fortuneSheetData}
    ...
  />
);
```

## Row Index Convention
- FortuneSheet uses 0-based indexing
- Row 0 = Headers
- Row 1 = First data row
- Our data.rows[0] = First data row
- So: `fortuneSheetRow = dataRowIndex + 1`

## Testing
1. Hard refresh: `Ctrl + F5`
2. Click Quick Action
3. Check console:
   - "Updating FortuneSheet via API, rows: 13"
   - "✅ FortuneSheet updated successfully via API"
4. Spreadsheet should show updated data immediately

## Benefits
- ✅ Uses official FortuneSheet API
- ✅ No need to remount component
- ✅ Preserves user selection and scroll position
- ✅ More performant than full remount
- ✅ Follows library design patterns

## Files Changed
- `src/components/dashboard/ExcelPreview.tsx` - Use workbookRef.current.setCellValue() API

## Status
✅ Implemented - Using correct FortuneSheet ref API
✅ No more window.luckysheet attempts
✅ Updates cells programmatically via setCellValue

## Lesson Learned
RTFM (Read The F***ing Manual)! The documentation clearly shows API is available via ref, not global window object. Always check official docs first before trying workarounds.
