# Univer Freeze Documentation

## Overview

Freeze functionality allows you to lock specific rows and columns in place while scrolling through the rest of the worksheet. This is useful for keeping headers or key data visible.

## Freeze Configuration

### IFreeze Interface

```typescript
interface IFreeze {
  /**
   * The number of frozen columns
   */
  xSplit: number
  /**
   * The number of frozen rows
   */
  ySplit: number
  /**
   * The starting row that can be scrolled (the starting row of the main view area)
   */
  startRow: number
  /**
   * The starting column that can be scrolled (the starting column of the main view area)
   */
  startColumn: number
}
```

### Configuration Example

To freeze column B and row 2:

```typescript
{
  "xSplit": 1,        // Freeze 1 column (column A)
  "ySplit": 1,        // Freeze 1 row (row 1)
  "startRow": 2,      // Scrollable area starts at row 3
  "startColumn": 2    // Scrollable area starts at column C
}
```

## Facade API Methods

### Set Freeze

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

worksheet.setFreeze({
  xSplit: 1,        // Freeze 1 column
  ySplit: 1,        // Freeze 1 row
  startRow: 2,      // Scrollable starts at row 3
  startColumn: 2,   // Scrollable starts at column C
})

console.log('Current freeze state:', worksheet.getFreeze())
```

### Set Frozen Columns

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze columns A-B
worksheet.setFrozenColumns(2)
```

### Set Frozen Rows

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze first 3 rows
worksheet.setFrozenRows(3)
```

### Get Freeze State

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get complete freeze configuration
const freezeState = worksheet.getFreeze()
console.log(freezeState)
```

### Get Frozen Columns

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const frozenColumns = worksheet.getFrozenColumns()
console.log('Frozen columns:', frozenColumns)
```

### Get Frozen Rows

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const frozenRows = worksheet.getFrozenRows()
console.log('Frozen rows:', frozenRows)
```

### Cancel Freeze

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Remove all freezes
worksheet.cancelFreeze()
```

## Common Use Cases

### Freeze Top Row (Header)

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze first row
worksheet.setFrozenRows(1)
```

### Freeze First Column

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze first column
worksheet.setFrozenColumns(1)
```

### Freeze Top Row and First Column

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

worksheet.setFreeze({
  xSplit: 1,
  ySplit: 1,
  startRow: 1,
  startColumn: 1,
})
```

### Freeze Multiple Rows and Columns

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze first 3 rows and first 2 columns
worksheet.setFreeze({
  xSplit: 2,
  ySplit: 3,
  startRow: 3,
  startColumn: 2,
})
```

## Best Practices

1. **Freeze headers** - Keep column headers visible when scrolling
2. **Freeze key columns** - Lock important identifier columns
3. **Check freeze state** - Verify freeze configuration before operations
4. **Clear when not needed** - Remove freezes to improve performance
5. **Consider user experience** - Don't freeze too many rows/columns

## Examples

### Dynamic Freeze Based on Data

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Freeze based on header detection
const hasHeader = true
if (hasHeader) {
  worksheet.setFrozenRows(1)
}
```

### Toggle Freeze

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const currentFreeze = worksheet.getFreeze()
if (currentFreeze && (currentFreeze.xSplit > 0 || currentFreeze.ySplit > 0)) {
  // Already frozen, cancel it
  worksheet.cancelFreeze()
} else {
  // Not frozen, freeze first row
  worksheet.setFrozenRows(1)
}
```

### Freeze with Validation

```typescript
const worksheet = univerAPI.getActiveWorkbook().getActiveSheet()

function freezeWithValidation(rows: number, columns: number) {
  const maxRow = worksheet.getMaxRows()
  const maxCol = worksheet.getMaxColumns()
  
  if (rows >= maxRow || columns >= maxCol) {
    console.error('Cannot freeze: exceeds worksheet dimensions')
    return
  }
  
  worksheet.setFreeze({
    xSplit: columns,
    ySplit: rows,
    startRow: rows,
    startColumn: columns,
  })
}

freezeWithValidation(1, 1)
```

## References

- [Univer Official Freeze Docs](https://docs.univer.ai/guides/sheets/features/core/freeze)
- [Sheets API Documentation](./sheets-api.md)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/freeze
**Content rephrased for compliance with licensing restrictions**
