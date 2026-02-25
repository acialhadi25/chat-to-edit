# Univer General API Documentation

## Overview

In Univer, the Facade API available varies depending on the document type. This section introduces the general Facade API applicable to all document types.

```typescript
import { FUniver } from '@univerjs/core/facade'

const univerAPI = FUniver.newAPI(univer)
```

## Commands

The majority of operations in Univer are registered with the command system, and are triggered through the command system. This unified approach to operations enables Univer to readily implement features such as undo, redo, and collaboration, etc.

Commands can be simply understood as unique "events" within Univer.

### Listening Commands

Univer provides two ways to listen for commands:

- `onBeforeCommandExecute`: Executes custom logic before the command is executed
- `onCommandExecuted`: Executes custom logic after the command is executed

#### Before Execution

```typescript
const univerAPI = FUniver.newAPI(univer)

univerAPI.onBeforeCommandExecute((command) => {
  const { id, type, params } = command
  // Custom logic executed before the command is executed
})
```

To prevent command execution:

```typescript
univerAPI.onBeforeCommandExecute((command) => {
  throw new Error('Editing is prohibited')
})
```

#### After Execution

```typescript
univerAPI.onCommandExecuted((command) => {
  const { id, type, params } = command
  // Custom logic executed after the command is executed
})
```

#### Cancel Listening

```typescript
const disposable = univerAPI.onBeforeCommandExecute((command) => {
  // custom preprocessing logic
})

// Destroy the listener
setTimeout(() => {
  disposable.dispose()
}, 1000)
```

### Execute Commands

```typescript
// Execute the command
univerAPI.executeCommand('sheet.command.set-range-values', {
  value: { v: 'Hello, Univer!' },
  range: { startRow: 0, startColumn: 0, endRow: 0, endColumn: 0 },
})
```

## Events

Univer provides a comprehensive event system for listening to spreadsheet changes.

### Event Categories

Full event list: https://reference.univer.ai/en-US/classes/FEventName#properties

#### Clipboard Events
- `BeforeClipboardChange`
- `BeforeClipboardPaste`
- `ClipboardChanged`
- `ClipboardPasted`

#### Selection Events
- `SelectionChanged`
- `SelectionMoveStart`
- `SelectionMoveEnd`
- `SelectionMoving`

#### Cell Events
- `CellClicked`
- `CellHover`
- `CellPointerDown`
- `CellPointerUp`
- `CellPointerMove`

#### Sheet Events
- `SheetValueChanged`
- `SheetZoomChanged`
- `BeforeSheetEditStart`
- `SheetEditStarted`
- `BeforeSheetEditEnd`
- `SheetEditEnded`
- `SheetEditChanging`

### Using Events

```typescript
univerAPI.addEvent(univerAPI.Event.CellClicked, (params) => {
  const { worksheet, workbook, row, column } = params
  console.log(`Cell clicked at row ${row}, column ${column}`)
})
```

### Cancel Event Listeners

```typescript
const disposable = univerAPI.addEvent(univerAPI.Event.SheetValueChanged, (params) => {
  // Handle value changes
})

// Remove the listener
disposable.dispose()
```

## Undo/Redo

```typescript
await univerAPI.undo()
await univerAPI.redo()
```

## Clipboard Operations

```typescript
// Copy range A1:B2
const fRange = fWorksheet.getRange('A1:B2')
fRange.activate().setValues([
  [1, 2],
  [3, 4],
])
await univerAPI.copy()

// Paste to C1
const fRange2 = fWorksheet.getRange('C1')
fRange2.activate()
await univerAPI.paste()
```

Or using commands:

```typescript
import { CopyCommand, PasteCommand } from '@univerjs/ui'

univerAPI.executeCommand(CopyCommand.id)
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
    for (const variant of variants) {
      sum += Number(variant) || 0
    }
    return sum
  },
  'Adds its arguments',
)
```

### Using Formula in Cell

**IMPORTANT**: Formula format must include leading `=`

```typescript
const cellA3 = fWorksheet.getRange('A3')
cellA3.setValue({ f: '=CUSTOMSUM(A1,A2)' })
```

### Cell Data Format with Formula

```typescript
// Cell with formula
const cell = {
  f: '=SUM(A1:A10)',  // Formula (with leading =)
  v: ''                // Value (empty, let Univer calculate)
}

// Cell without formula
const cell = {
  v: 'Hello World'     // Just value
}
```

### Unregister Formula

```typescript
const functionDisposable = formulaEngine.registerFunction({
  // calculate
})

// Unregister
functionDisposable.dispose()
```

### Formula with Localization

```typescript
formulaEngine.registerFunction(
  'CUSTOMSUM',
  (...variants) => {
    let sum = 0
    for (const variant of variants) {
      sum += Number(variant) || 0
    }
    return sum
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
  },
)
```

## WebSocket

```typescript
const ws = univerAPI.createSocket('ws://your-websocket-url')

ws.open$.subscribe(() => {
  console.log('websocket opened')
  ws.send('hello')
})

ws.message$.subscribe((message) => {
  console.log('websocket message', message)
})

ws.close$.subscribe(() => {
  console.log('websocket closed')
})

ws.error$.subscribe((error) => {
  console.log('websocket error', error)
})
```

## Enums and Utilities

```typescript
// Enums
console.log(univerAPI.Enum.UniverInstanceType.UNIVER_SHEET)
console.log(univerAPI.Enum.LifecycleStages.Rendered)

// Utilities
console.log(univerAPI.Util.tools.chatAtABC(10))
console.log(univerAPI.Util.tools.ABCatNum('K'))
```

## Best Practices

1. **Always dispose listeners** when no longer needed to prevent memory leaks
2. **Use appropriate events** - prefer specific events over general ones
3. **Keep event handlers lightweight** to maintain performance
4. **Formula format**: Always include leading `=` in formula string
5. **Cell with formula**: Set `v` to empty string, let Univer calculate the result

## References

- [Univer Official Docs](https://docs.univer.ai/guides/sheets/features/core/general-api)
- [FUniver API Reference](https://reference.univer.ai/en-US/classes/FUniver)
- [Event Names Reference](https://reference.univer.ai/en-US/classes/FEventName)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/general-api
