# Sorting - Univer Sheet

## Overview

Sorting functionality memungkinkan user untuk mengurutkan data dalam spreadsheet untuk organisasi dan analisis yang lebih baik. Mendukung berbagai metode sorting termasuk ascending, descending, dan custom sorting.

## Installation

### Preset Mode
```bash
npm install @univerjs/preset-sheets-sort
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { UniverSheetsSortPreset } from '@univerjs/preset-sheets-sort'
import UniverPresetSheetsSortEnUS from '@univerjs/preset-sheets-sort/locales/en-US'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsSortEnUS,
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsSortPreset(),
  ],
})
```

### Plugin Mode
```bash
npm install @univerjs/sheets-sort @univerjs/sheets-sort-ui
```

```typescript
import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort'
import { UniverSheetsSortUIPlugin } from '@univerjs/sheets-sort-ui'
import '@univerjs/sheets-sort-ui/lib/index.css'
import '@univerjs/sheets-sort/facade'

univer.registerPlugin(UniverSheetsSortPlugin)
univer.registerPlugin(UniverSheetsSortUIPlugin)
```

## Facade API

### Import (Plugin Mode Only)
```typescript
import '@univerjs/sheets-sort/facade'
```

## Worksheet Sorting

### Sort by Column

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Sort ascending berdasarkan kolom pertama (index 0)
fWorksheet.sort(0)

// Sort descending berdasarkan kolom pertama
fWorksheet.sort(0, false)
```

**Parameters**:
- `colIndex`: Column index (0-based)
- `asc`: Boolean, true untuk ascending (default), false untuk descending

## Range Sorting

### Basic Range Sort

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('D1:G10')

// Sort ascending berdasarkan kolom pertama dalam range
fRange.sort(0)

// Sort descending berdasarkan kolom pertama
fRange.sort({ column: 0, ascending: false })
```

### Multi-Column Sort

```typescript
const fRange = fWorksheet.getRange('D1:G10')

// Sort descending by column 0, then ascending by column 1
fRange.sort([
  { column: 0, ascending: false },
  { column: 1, ascending: true }
])

// Atau dengan shorthand (ascending by default)
fRange.sort([
  { column: 0, ascending: false },
  1 // Column 1, ascending
])
```

## Event Listeners

### SheetRangeSorted Event

Triggered setelah range sorting selesai.

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.SheetRangeSorted,
  (params) => {
    const { workbook, worksheet, range, sortColumn } = params
    console.log('Range sorted:', range, sortColumn)
  }
)

// Cleanup
disposable.dispose()
```

**Event Parameters**:
- `workbook`: Current workbook instance
- `worksheet`: Current worksheet instance
- `range`: Range yang di-sort
- `sortColumn`: Sort configuration yang digunakan

### SheetBeforeRangeSort Event

Triggered sebelum range sorting dimulai. Dapat digunakan untuk mencegah sorting.

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.SheetBeforeRangeSort,
  (params) => {
    const { workbook, worksheet, range, sortColumn } = params
    
    // Prevent sorting jika kondisi tertentu
    if (shouldPreventSort) {
      params.cancel = true
    }
  }
)

// Cleanup
disposable.dispose()
```

## Complete Examples

### Example 1: Sort Data Table

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Setup data
const data = [
  ['Name', 'Age', 'Score'],
  ['John', 25, 85],
  ['Alice', 30, 92],
  ['Bob', 22, 78],
  ['Charlie', 28, 88],
]

const fRange = fWorksheet.getRange('A1:C5')
fRange.setValues(data)

// Sort by Age (column 1) ascending
const dataRange = fWorksheet.getRange('A2:C5') // Exclude header
dataRange.sort(1) // Sort by column B (Age)
```

### Example 2: Multi-Level Sort

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Sort by Department (ascending), then by Salary (descending)
const dataRange = fWorksheet.getRange('A2:D100')
dataRange.sort([
  { column: 0, ascending: true },  // Department
  { column: 3, ascending: false }, // Salary
])
```

### Example 3: Sort with Validation

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Listen for sort events
const disposable = univerAPI.addEvent(
  univerAPI.Event.SheetBeforeRangeSort,
  (params) => {
    const { range } = params
    
    // Validate range size
    if (range.endRow - range.startRow > 1000) {
      console.warn('Sorting large dataset, this may take a while')
    }
    
    // Prevent sorting if data is protected
    if (isDataProtected(range)) {
      params.cancel = true
      alert('Cannot sort protected data')
    }
  }
)

// Perform sort
const dataRange = fWorksheet.getRange('A1:D100')
dataRange.sort(0)

// Cleanup
disposable.dispose()
```

### Example 4: Custom Sort with Hook

```typescript
import { useCallback } from 'react'

export const useUniverSort = (univerAPI: FUniver | null) => {
  const sortRange = useCallback(
    async (
      range: string,
      sortConfig: Array<{ column: number; ascending: boolean }>
    ) => {
      if (!univerAPI) return

      const workbook = univerAPI.getActiveWorkbook()
      const worksheet = workbook.getActiveSheet()
      const fRange = worksheet.getRange(range)

      try {
        fRange.sort(sortConfig)
        console.log('Sort completed successfully')
      } catch (error) {
        console.error('Sort failed:', error)
      }
    },
    [univerAPI]
  )

  return { sortRange }
}

// Usage
const { sortRange } = useUniverSort(univerAPI)

sortRange('A2:D100', [
  { column: 0, ascending: true },
  { column: 2, ascending: false },
])
```

## Best Practices

### 1. Exclude Headers

```typescript
// ❌ Bad: Sorting includes header
fWorksheet.getRange('A1:C10').sort(0)

// ✅ Good: Exclude header row
fWorksheet.getRange('A2:C10').sort(0)
```

### 2. Multi-Column Sort Order

```typescript
// ✅ Good: Clear sort priority
fRange.sort([
  { column: 0, ascending: true },  // Primary sort
  { column: 1, ascending: false }, // Secondary sort
  { column: 2, ascending: true },  // Tertiary sort
])
```

### 3. Event Cleanup

```typescript
// ✅ Good: Always cleanup event listeners
useEffect(() => {
  if (!univerAPI) return

  const disposable = univerAPI.addEvent(
    univerAPI.Event.SheetRangeSorted,
    handleSort
  )

  return () => {
    disposable.dispose()
  }
}, [univerAPI])
```

### 4. Error Handling

```typescript
// ✅ Good: Handle sort errors
try {
  fRange.sort(sortConfig)
} catch (error) {
  console.error('Sort failed:', error)
  // Show user-friendly error message
  showErrorNotification('Failed to sort data')
}
```

## Common Use Cases

### 1. Sort by Date

```typescript
// Assuming column C contains dates
const dataRange = fWorksheet.getRange('A2:D100')
dataRange.sort({ column: 2, ascending: false }) // Latest first
```

### 2. Sort by Multiple Criteria

```typescript
// Sort by Status (ascending), then by Priority (descending)
dataRange.sort([
  { column: 0, ascending: true },  // Status
  { column: 1, ascending: false }, // Priority
])
```

### 3. Sort with Custom Comparison

```typescript
// For complex sorting, you may need to:
// 1. Get data
// 2. Sort in JavaScript
// 3. Set back to sheet

const values = fRange.getValues()
const sorted = values.sort((a, b) => {
  // Custom comparison logic
  return customCompare(a, b)
})
fRange.setValues(sorted)
```

## Troubleshooting

### Issue 1: Sort Not Working
**Problem**: Sort tidak mengubah data

**Solution**: Pastikan range tidak protected
```typescript
const permission = fRange.getRangePermission()
if (permission.isProtected()) {
  console.error('Range is protected')
}
```

### Issue 2: Header Row Sorted
**Problem**: Header row ikut ter-sort

**Solution**: Exclude header row dari range
```typescript
// ✅ Correct
const dataRange = fWorksheet.getRange('A2:D100')
dataRange.sort(0)
```

### Issue 3: Multi-Column Sort Order
**Problem**: Sort order tidak sesuai harapan

**Solution**: Periksa column index (0-based)
```typescript
// Column A = 0, Column B = 1, Column C = 2, etc.
fRange.sort([
  { column: 0, ascending: true },  // Column A
  { column: 1, ascending: false }, // Column B
])
```

## API Reference

### FWorksheet.sort()
```typescript
sort(colIndex: number, asc?: boolean): void
```

### FRange.sort()
```typescript
sort(
  column: number | SortConfig | SortConfig[]
): void

interface SortConfig {
  column: number
  ascending: boolean
}
```

### Events
- `SheetRangeSorted` - After sort completed
- `SheetBeforeRangeSort` - Before sort starts (cancellable)

## Referensi

- [Facade API Reference](https://reference.univer.ai/)
- [Official Documentation](https://docs.univer.ai/guides/sheets/features/sort)
