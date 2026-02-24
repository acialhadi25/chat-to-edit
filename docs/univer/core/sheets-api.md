# Sheets API - Workbook & Worksheet Management

## Overview

Sheets API menyediakan interface untuk mengelola workbook dan worksheet dalam Univer. API ini mencakup operasi CRUD untuk workbook dan worksheet, serta berbagai operasi manipulasi data.

## Workbook Operations

### Create Workbook

```typescript
import '@univerjs/sheets/facade'
import '@univerjs/sheets-ui/facade'

// Buat workbook baru
const fWorkbook = univerAPI.createWorkbook({ 
  id: 'Sheet1', 
  name: 'Sheet1' 
})

// Buat workbook tanpa set sebagai active
const fWorkbook2 = univerAPI.createWorkbook(
  { id: 'Sheet2', name: 'Sheet2' }, 
  { makeCurrent: false }
)

// Switch ke workbook setelah 3 detik
setTimeout(() => {
  univerAPI.setCurrent(fWorkbook2.getId())
}, 3000)
```

### Get Workbook

```typescript
// Get active workbook
const fWorkbook = univerAPI.getActiveWorkbook()

// Get workbook data (snapshot)
const snapshot = fWorkbook.save()
console.log(snapshot)
```

### Unload Workbook

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const unitId = fWorkbook?.getId()

if (unitId) {
  univerAPI.disposeUnit(unitId)
}
```

**Important**: Saat page/route di-destroy, gunakan `univer.dispose()` untuk cleanup, bukan `univerAPI.disposeUnit()`.

### Get Workbook ID

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const workbookId = fWorkbook?.getId()
```

## Worksheet Operations

### Get Worksheets

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get semua sheets
const sheets = fWorkbook.getSheets()

// Get active sheet
const fWorksheet = fWorkbook.getActiveSheet()

// Get worksheet data
const sheetSnapshot = fWorksheet.getSheet().getSnapshot()
```

### Create Worksheet

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Buat worksheet dengan 10 rows dan 10 columns
const newSheet = fWorkbook.create('Sheet2', 10, 10)

// Buat worksheet dengan data
const sheetData = {
  cellData: {
    0: {
      0: {
        v: 'Hello Univer!',
      },
    },
  },
}

const newSheetWithData = fWorkbook.create(
  'MyNewSheetWithData', 
  10, 
  10, 
  {
    index: 0, // Set sebagai sheet pertama
    sheet: sheetData,
  }
)
```

### Delete Worksheet

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Delete sheet kedua
const sheet = fWorkbook.getSheets()[1]
fWorkbook.deleteSheet(sheet)

// Atau delete by ID
// fWorkbook.deleteSheet(sheet.getSheetId())
```

### Activate Worksheet

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Activate sheet kedua
const sheet = fWorkbook.getSheets()[1]
fWorkbook.setActiveSheet(sheet)

// Atau by ID
// fWorkbook.setActiveSheet(sheet.getSheetId())

// Atau menggunakan method activate
// sheet.activate()
```

### Copy Worksheet

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const activeSheet = fWorkbook.getActiveSheet()

// Duplicate sheet
const duplicatedSheet = fWorkbook.duplicateSheet(activeSheet)
console.log(duplicatedSheet)
```

### Get Worksheet ID

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const sheetId = fWorksheet?.getSheetId()
```

### Set Row and Column Count

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Set row count ke 100000
fWorksheet.setRowCount(100000)

// Set column count ke 30
fWorksheet.setColumnCount(30)
```

### Refresh Worksheet

```typescript
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.refreshCanvas()
```

### Worksheet Zoom

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Set zoom ke 200%
fWorksheet.zoom(2)

// Get zoom ratio
const zoomRatio = fWorksheet.getZoom()
```

### Scroll to Cell

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Scroll ke cell D10
const fRange = fWorksheet.getRange('D10')
const row = fRange.getRow()
const column = fRange.getColumn()
fWorksheet.scrollToCell(row, column)

// Dengan animasi (1000ms)
fWorksheet.scrollToCell(row, column, 1000)

// Get scroll state
const scrollState = fWorksheet.getScrollState()
const { offsetX, offsetY, sheetViewStartColumn, sheetViewStartRow } = scrollState
```

## Cell Editing

### Start Editing

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
fWorkbook.startEditing()
```

### End Editing

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Commit changes
await fWorkbook.endEditingAsync(true)

// Cancel editing
await fWorkbook.endEditingAsync(false)
```

### Editing Events

```typescript
// Before edit start
univerAPI.addEvent(univerAPI.Event.BeforeSheetEditStart, (params) => {
  const { worksheet, workbook, row, column, eventType, keycode, isZenEditor } = params
  
  // Prevent editing
  // params.cancel = true
})

// Edit started
univerAPI.addEvent(univerAPI.Event.SheetEditStarted, (params) => {
  const { worksheet, workbook, row, column, eventType, keycode, isZenEditor } = params
  console.log('Edit started')
})

// Edit changing
univerAPI.addEvent(univerAPI.Event.SheetEditChanging, (params) => {
  const { worksheet, workbook, row, column, value, isZenEditor } = params
  console.log('Content changing:', value)
})

// Before edit end
univerAPI.addEvent(univerAPI.Event.BeforeSheetEditEnd, (params) => {
  const { worksheet, workbook, row, column, value, eventType, keycode, isZenEditor, isConfirm } = params
  
  // Cancel edit end
  // params.cancel = true
})

// Edit ended
univerAPI.addEvent(univerAPI.Event.SheetEditEnded, (params) => {
  const { worksheet, workbook, row, column, eventType, keycode, isZenEditor, isConfirm } = params
  console.log('Edit ended')
})
```

## Real-time Cell Editor Data

```typescript
// Get data dari cell editor secara real-time
univerAPI.onCommandExecuted((command) => {
  const { id } = command
  
  if (id === 'doc.command.insert-text' || id === 'doc.command.delete-text') {
    const doc = univerAPI.getActiveDocument()
    if (doc) {
      const snapshot = doc.getSnapshot()
      console.log(snapshot.body?.dataStream)
    }
  }
})
```

**Important**: Cell data disinkronkan ke snapshot saat cell editor kehilangan focus. Untuk mendapatkan data terbaru, pastikan cell sudah kehilangan focus atau panggil `endEditingAsync(true)`.

## Grid Lines

```typescript
const fWorksheet = fWorkbook.getActiveSheet()

// Set grid lines color
fWorksheet.setGridLinesColor('#FF0000')

// Get grid lines color
const color = fWorksheet.getGridLinesColor()
```

## Best Practices

1. **Lifecycle Management**: Gunakan lifecycle events untuk operasi yang memerlukan interface fully rendered
2. **Memory Management**: Selalu dispose workbook yang tidak digunakan
3. **Async Operations**: Gunakan `await` untuk operasi async seperti `endEditingAsync()`
4. **Event Cleanup**: Dispose event listeners yang tidak digunakan
5. **Batch Operations**: Untuk multiple operations, gunakan batch commands untuk performa lebih baik

## Common Patterns

### Create Workbook with Initial Data

```typescript
const workbookData = {
  id: 'workbook-1',
  name: 'My Workbook',
  sheets: {
    'sheet-1': {
      id: 'sheet-1',
      name: 'Sheet1',
      cellData: {
        0: {
          0: { v: 'Name' },
          1: { v: 'Age' },
          2: { v: 'City' },
        },
        1: {
          0: { v: 'John' },
          1: { v: 25 },
          2: { v: 'New York' },
        },
      },
    },
  },
}

const fWorkbook = univerAPI.createWorkbook(workbookData)
```

### Iterate Through All Sheets

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const sheets = fWorkbook.getSheets()

sheets.forEach((sheet, index) => {
  console.log(`Sheet ${index + 1}:`, sheet.getSheetName())
  
  // Get data range
  const dataRange = sheet.getDataRange()
  console.log('Data range:', dataRange.getA1Notation())
})
```

### Safe Sheet Operations

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
if (!fWorkbook) {
  console.error('No active workbook')
  return
}

const fWorksheet = fWorkbook.getActiveSheet()
if (!fWorksheet) {
  console.error('No active worksheet')
  return
}

// Perform operations
fWorksheet.getRange('A1').setValue('Safe operation')
```

## Referensi

- [FWorkbook API](https://reference.univer.ai/en-US/classes/FWorkbook)
- [FWorksheet API](https://reference.univer.ai/en-US/classes/FWorksheet)
- [Cell Data Configuration](https://docs.univer.ai/guides/sheets/getting-started/cell-data)
