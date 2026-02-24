# General API - Univer Sheet

## Overview

General API menyediakan fungsionalitas dasar yang berlaku untuk semua tipe dokumen Univer. API ini mencakup command system, event handling, clipboard operations, dan utilities.

## Command System

Univer menggunakan command system terpusat untuk semua operasi, memungkinkan fitur undo/redo dan collaboration.

### Listening to Commands

#### Before Command Execution
```typescript
const univerAPI = FUniver.newAPI(univer)

univerAPI.onBeforeCommandExecute((command) => {
  const { id, type, params } = command
  console.log('Command akan dieksekusi:', id)
  
  // Mencegah command dieksekusi
  // throw new Error('Editing is prohibited')
})
```

#### After Command Execution
```typescript
univerAPI.onCommandExecuted((command) => {
  const { id, type, params } = command
  console.log('Command telah dieksekusi:', id)
})
```

#### Cancel Listening
```typescript
const disposable = univerAPI.onBeforeCommandExecute((command) => {
  // Logic
})

// Hapus listener setelah tidak digunakan
setTimeout(() => {
  disposable.dispose()
}, 1000)
```

### Execute Commands

```typescript
// Set nilai cell menggunakan command
univerAPI.executeCommand('sheet.command.set-range-values', {
  value: { v: 'Hello, Univer!' },
  range: { startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
})
```

## Event System

Univer menyediakan event system komprehensif untuk mendengarkan perubahan dalam spreadsheet.

### Event Categories

#### Clipboard Events
- `BeforeClipboardChange` - Sebelum clipboard berubah
- `BeforeClipboardPaste` - Sebelum paste
- `ClipboardChanged` - Setelah clipboard berubah
- `ClipboardPasted` - Setelah paste

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeClipboardPaste, (params) => {
  const { text, html } = params
  // Cancel paste operation
  // params.cancel = true
})
```

#### Selection Events
- `SelectionChanged` - Selection berubah
- `SelectionMoveStart` - Selection mulai bergerak
- `SelectionMoveEnd` - Selection selesai bergerak
- `SelectionMoving` - Selection sedang bergerak

```typescript
univerAPI.addEvent(univerAPI.Event.SelectionChanged, (params) => {
  const { worksheet, workbook, selections } = params
  console.log('Selection changed:', selections)
})
```

#### Cell Events
- `CellClicked` - Cell diklik
- `CellHover` - Hover di cell
- `CellPointerDown` - Pointer down di cell
- `CellPointerUp` - Pointer up di cell
- `CellPointerMove` - Pointer bergerak di cell

```typescript
univerAPI.addEvent(univerAPI.Event.CellClicked, (params) => {
  const { worksheet, workbook, row, column } = params
  console.log(`Cell clicked at row ${row}, column ${column}`)
})
```

#### Sheet Events
- `SheetValueChanged` - Nilai sheet berubah
- `SheetZoomChanged` - Zoom level berubah
- `SheetSkeletonChanged` - Struktur sheet berubah
- `BeforeSheetEditStart` - Sebelum edit dimulai
- `SheetEditStarted` - Edit dimulai
- `BeforeSheetEditEnd` - Sebelum edit selesai
- `SheetEditEnded` - Edit selesai
- `SheetEditChanging` - Sedang edit
- `Scroll` - Sheet di-scroll

```typescript
univerAPI.addEvent(univerAPI.Event.SheetValueChanged, (params) => {
  const { worksheet, workbook } = params
  console.log('Sheet values changed')
})
```

### Canceling Event Listeners

```typescript
const disposable = univerAPI.addEvent(univerAPI.Event.SheetValueChanged, (params) => {
  // Handle value changes
})

// Hapus listener
disposable.dispose()
```

## Undo & Redo

```typescript
// Undo
await univerAPI.undo()

// Redo
await univerAPI.redo()
```

## Clipboard Operations

### Copy & Paste

```typescript
univerAPI.addEvent(univerAPI.Event.CellClicked, async (params) => {
  const fWorkbook = univerAPI.getActiveWorkbook()
  const fWorksheet = fWorkbook.getActiveSheet()

  // Copy range A1:B2
  const fRange = fWorksheet.getRange('A1:B2')
  fRange.activate().setValues([
    [1, 2],
    [3, 4],
  ])
  await univerAPI.copy()

  // Paste ke C1:D2
  const fRange2 = fWorksheet.getRange('C1')
  fRange2.activate()
  await univerAPI.paste()
})
```

### Using Commands

```typescript
import { CopyCommand, PasteCommand } from '@univerjs/ui'

// Copy
univerAPI.executeCommand(CopyCommand.id)

// Paste
univerAPI.executeCommand(PasteCommand.id)
```

## Custom Formulas

### Register Custom Formula

```typescript
const formulaEngine = univerAPI.getFormula()

formulaEngine.registerFunction(
  'CUSTOMSUM',
  (...variants) => {
    let sum = 0
    const last = variants[variants.length - 1]

    if (last.isLambda && last.isLambda()) {
      variants.pop()
      const variantsList = variants.map(variant => 
        Array.isArray(variant) ? variant[0][0] : variant
      )
      sum += last.executeCustom(...variantsList).getValue()
    }

    for (const variant of variants) {
      sum += Number(variant) || 0
    }

    return sum
  },
  'Adds its arguments'
)

// Gunakan formula
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('A3').setValue({ f: '=CUSTOMSUM(A1,A2,LAMBDA(x,y,x*y))' })
```

### With Internationalization

```typescript
formulaEngine.registerFunction(
  'CUSTOMSUM',
  (...variants) => {
    // Implementation
  },
  {
    description: {
      functionName: 'CUSTOMSUM',
      description: 'formulaCustom.CUSTOMSUM.description',
      abstract: 'formulaCustom.CUSTOMSUM.abstract',
      functionParameter: [
        {
          name: 'formulaCustom.CUSTOMSUM.functionParameter.number1.name',
          detail: 'formulaCustom.CUSTOMSUM.functionParameter.number1.detail',
          example: 'A1:A20',
          require: 1,
          repeat: 0,
        },
      ],
    },
    locales: {
      zhCN: {
        formulaCustom: {
          CUSTOMSUM: {
            description: '将单个值、单元格引用或是区域相加',
            abstract: '求参数的和',
            functionParameter: {
              number1: {
                name: '数值1',
                detail: '要相加的第一个数字',
              },
            },
          },
        },
      },
      enUS: {
        formulaCustom: {
          CUSTOMSUM: {
            description: 'Adds its arguments',
            abstract: 'Adds its arguments',
            functionParameter: {
              number1: {
                name: 'number1',
                detail: 'The first number you want to add',
              },
            },
          },
        },
      },
    },
  }
)
```

### Unregister Formula

```typescript
const functionDisposable = formulaEngine.registerFunction({
  // config
})

// Unregister
functionDisposable.dispose()
```

## Enums & Utilities

### Enums

```typescript
console.log(univerAPI.Enum)
console.log(univerAPI.Enum.UniverInstanceType.UNIVER_SHEET)
console.log(univerAPI.Enum.LifecycleStages.Rendered)
```

### Utilities

```typescript
console.log(univerAPI.Util)
console.log(univerAPI.Util.tools.chatAtABC(10)) // Convert number to column letter
console.log(univerAPI.Util.tools.ABCatNum('K')) // Convert column letter to number
```

## Lifecycle Events

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.LifeCycleChanged, 
  ({ stage }) => {
    if (stage === univerAPI.Enum.LifecycleStages.Steady) {
      // Interface sudah fully rendered
      console.log('Univer is ready')
    }
  }
)
```

## Best Practices

1. **Selalu dispose listeners** yang tidak digunakan untuk mencegah memory leaks
2. **Gunakan lifecycle events** untuk operasi yang memerlukan interface fully rendered
3. **Prefer specific events** daripada general events untuk performa lebih baik
4. **Keep event handlers lightweight** untuk menjaga performa
5. **Use command system** untuk operasi yang perlu undo/redo support

## Referensi

- [Full Event List](https://reference.univer.ai/en-US/classes/FEventName#properties)
- [Command System](https://docs.univer.ai/guides/architecture/command-system)
- [Facade API](https://reference.univer.ai/)
