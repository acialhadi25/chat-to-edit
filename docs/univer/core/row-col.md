# Univer Row & Column Operations Documentation

## Overview

This document covers comprehensive row and column operations in Univer Sheets, including insertion, deletion, hiding, resizing, and moving operations.

## Row Operations

### Insert Rows

#### Insert Row After Position

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Insert a row after the first row
sheet.insertRowAfter(0)
```

#### Insert Row Before Position

```typescript
// Insert a row before the first row
sheet.insertRowBefore(0)
```

#### Insert Multiple Rows at Location

```typescript
// Insert 3 rows at position 0, shifting all rows down
sheet.insertRows(0, 3)
```

#### Insert Multiple Rows After Position

```typescript
// Insert 5 rows after the first row
sheet.insertRowsAfter(0, 5)
```

#### Insert Multiple Rows Before Position

```typescript
// Insert 5 rows before the first row
sheet.insertRowsBefore(0, 5)
```

### Delete Rows

#### Delete Single Row

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Delete the first row (index 0)
sheet.deleteRow(0)
```

#### Delete Multiple Consecutive Rows

```typescript
// Delete first two rows
sheet.deleteRows(0, 2)
```

#### Delete Non-Consecutive Rows

```typescript
// Delete row 3 and rows 5-7
sheet.deleteRowsByPoints([2, [4, 6]])
```

### Move Rows

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Move rows 1-2 to position 5 (becomes rows 3-4)
const rowSpec = sheet.getRange('1:2')
sheet.moveRows(rowSpec, 5)
```

### Hide/Show Rows

#### Hide Single Row

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Hide first row
const range = sheet.getRange('1:1')
sheet.hideRow(range)
```

#### Hide Multiple Rows

```typescript
// Hide first 3 rows
sheet.hideRows(0, 3)
```

#### Unhide Single Row

```typescript
// Unhide first row
const range = sheet.getRange('1:1')
sheet.unhideRow(range)
```

#### Unhide Multiple Rows

```typescript
// Unhide first 3 rows
sheet.showRows(0, 3)
```

### Row Height

#### Set Single Row Height

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set first row to 200 pixels
sheet.setRowHeight(0, 200)
```

#### Set Multiple Row Heights

```typescript
// Set first 3 rows to 200 pixels
sheet.setRowHeights(0, 3, 200)
```

#### Force Row Height

```typescript
// Force first 3 rows to 5 pixels (even if content is taller)
sheet.setRowHeightsForced(0, 3, 5)
```

#### Auto Resize Rows

```typescript
// Auto-resize first 3 rows to fit content
sheet.autoResizeRows(0, 3)
```

### Row Custom Properties

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set custom properties for rows
sheet.setRowCustom({
  0: { color: 'red', priority: 1 },
  2: { size: 16, category: 'header' },
})
```

**Note**: Updating custom data overwrites existing data. Merge with existing data if needed.

## Column Operations

### Insert Columns

#### Insert Column After Position

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Insert column after first column
sheet.insertColumnAfter(0)
```

#### Insert Column Before Position

```typescript
// Insert column before first column
sheet.insertColumnBefore(0)
```

#### Insert Multiple Columns at Location

```typescript
// Insert 3 columns at position 0
sheet.insertColumns(0, 3)
```

#### Insert Multiple Columns After Position

```typescript
// Insert 2 columns after first column
sheet.insertColumnsAfter(0, 2)
```

#### Insert Multiple Columns Before Position

```typescript
// Insert 5 columns before first column
sheet.insertColumnsBefore(0, 5)
```

### Delete Columns

#### Delete Single Column

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Delete first column (index 0)
sheet.deleteColumn(0)
```

#### Delete Multiple Consecutive Columns

```typescript
// Delete first 2 columns
sheet.deleteColumns(0, 2)
```

#### Delete Non-Consecutive Columns

```typescript
// Delete column C and columns E-G
sheet.deleteColumnsByPoints([2, [4, 6]])
```

### Move Columns

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Move columns A-B to position 5 (becomes columns C-D)
const columnSpec = sheet.getRange('A:B')
sheet.moveColumns(columnSpec, 5)
```

### Hide/Show Columns

#### Hide Single Column

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Hide first column
const range = sheet.getRange('A:A')
sheet.hideColumn(range)
```

#### Hide Multiple Columns

```typescript
// Hide first 3 columns
sheet.hideColumns(0, 3)
```

#### Unhide Single Column

```typescript
// Unhide first column
const range = sheet.getRange('A:A')
sheet.unhideColumn(range)
```

#### Unhide Multiple Columns

```typescript
// Unhide first 3 columns
sheet.showColumns(0, 3)
```

### Column Width

#### Set Single Column Width

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set first column to 200 pixels
sheet.setColumnWidth(0, 200)
```

#### Set Multiple Column Widths

```typescript
// Set first 3 columns to 200 pixels
sheet.setColumnWidths(0, 3, 200)
```

#### Auto Resize Columns

```typescript
// Auto-resize columns A-C to fit content
sheet.autoResizeColumns(0, 3)
```

### Column Custom Properties

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set custom properties for columns
sheet.setColumnCustom({
  0: { color: 'red', dataType: 'id' },
  2: { size: 16, format: 'currency' },
})
```

**Note**: Updating custom data overwrites existing data. Merge with existing data if needed.

## Best Practices

1. **Use 0-based indexing** - Rows and columns start at index 0
2. **Batch operations** - Use methods that handle multiple rows/columns for better performance
3. **Auto-resize carefully** - Can be slow on large datasets
4. **Preserve custom data** - Merge with existing custom properties when updating
5. **Validate indices** - Check bounds before operations

## Common Patterns

### Insert Header Row

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Insert row at top
sheet.insertRowBefore(0)

// Set header values
const headerRange = sheet.getRange('A1:E1')
headerRange.setValues([['ID', 'Name', 'Email', 'Phone', 'Status']])
headerRange.setFontWeight('bold')
```

### Delete Empty Rows

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()
const maxRow = sheet.getMaxRows()
const rowsToDelete = []

for (let i = 0; i < maxRow; i++) {
  const range = sheet.getRange(i, 0, 1, sheet.getMaxColumns())
  const values = range.getValues()[0]
  const isEmpty = values.every(cell => !cell)
  
  if (isEmpty) {
    rowsToDelete.push(i)
  }
}

// Delete in reverse order to maintain indices
for (let i = rowsToDelete.length - 1; i >= 0; i--) {
  sheet.deleteRow(rowsToDelete[i])
}
```

### Auto-Resize All Columns

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()
const maxCol = sheet.getMaxColumns()

sheet.autoResizeColumns(0, maxCol)
```

### Freeze and Format Header

```typescript
const sheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze first row
sheet.setFrozenRows(1)

// Format header
const headerRange = sheet.getRange('1:1')
headerRange.setFontWeight('bold')
headerRange.setBackground('#4472C4')
headerRange.setFontColor('#FFFFFF')
```

## References

- [Univer Official Row & Column Docs](https://docs.univer.ai/guides/sheets/features/core/row-col)
- [Range & Selection Documentation](./range-selection.md)
- [Sheets API Documentation](./sheets-api.md)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/row-col
**Content rephrased for compliance with licensing restrictions**
