# Univer Core Features Documentation

## Overview

This directory contains comprehensive documentation for Univer Sheets core features. These documents cover the fundamental APIs and capabilities needed to work with Univer spreadsheets.

## Documentation Index

### General & API

- **[General API](./general-api.md)** - Core Facade API, commands, events, undo/redo, clipboard, custom formulas, and WebSocket
- **[Sheets API](./sheets-api.md)** - Workbook and worksheet operations, creation, deletion, activation, and management

### Data & Formulas

- **[Formula](./formula.md)** - Complete formula reference with 500+ built-in functions, custom formulas, and localization
- **[Number Format](./numfmt.md)** - Number formatting patterns, currency, percentages, dates, and locale settings

### Range & Selection

- **[Range & Selection](./range-selection.md)** - Range operations, cell data, selection management, and cell events
- **[Row & Column](./row-col.md)** - Insert, delete, hide, resize, and move rows and columns

### Styling & Display

- **[Default Style](./default-style.md)** - Worksheet, row, and column default styles
- **[Gridlines](./gridlines.md)** - Show/hide and customize gridline colors
- **[Freeze](./freeze.md)** - Freeze rows and columns for scrolling

### Data Operations

- **[Clipboard](./clipboard.md)** - Copy and paste operations with permission control
- **[Permission](./permission.md)** - Comprehensive permission control for workbooks, worksheets, and ranges

### Advanced Features

- **[Rich Text](./rich-text.md)** - Rich text formatting in cells
- **[Range Theme](./range-theme.md)** - Apply themes to ranges
- **[Defined Names](./defined-names.md)** - Named ranges and formulas
- **[Worker](./worker.md)** - Web Worker integration for performance

## Quick Start

### Basic Setup

```typescript
import { FUniver } from '@univerjs/core/facade'

const univerAPI = FUniver.newAPI(univer)
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
```

### Common Operations

```typescript
// Set cell value
const fRange = fWorksheet.getRange('A1')
fRange.setValue('Hello, Univer!')

// Set formula
fRange.setValue({ f: '=SUM(A1:A10)' })

// Apply formatting
fRange.setFontWeight('bold')
  .setFontSize(14)
  .setBackground('#4472C4')
  .setFontColor('#FFFFFF')

// Get values
const value = fRange.getValue()
const values = fWorksheet.getRange('A1:B10').getValues()
```

## Feature Categories

### Data Management
- Range operations
- Cell data and formulas
- Row and column operations
- Copy and paste

### Formatting
- Cell styles
- Number formats
- Default styles
- Rich text

### Layout
- Freeze panes
- Gridlines
- Row heights
- Column widths

### Security
- Permission control
- Protected ranges
- Collaborator management

### Advanced
- Custom formulas
- Events and commands
- Web Workers
- Defined names

## Best Practices

1. **Use Facade API** - Prefer Facade API over direct manipulation
2. **Batch operations** - Group multiple operations for better performance
3. **Dispose listeners** - Always clean up event listeners
4. **Formula format** - Always use leading `=` in formulas
5. **Permission control** - Implement appropriate access controls
6. **Error handling** - Wrap operations in try-catch blocks
7. **Validate data** - Check data before operations

## Common Patterns

### Create and Populate Worksheet

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.create('MySheet', 100, 26)

// Set headers
fWorksheet.getRange('A1:C1').setValues([['ID', 'Name', 'Status']])
  .setFontWeight('bold')

// Set data
fWorksheet.getRange('A2:C4').setValues([
  [1, 'John', 'Active'],
  [2, 'Jane', 'Inactive'],
  [3, 'Bob', 'Active'],
])

// Freeze header
fWorksheet.setFrozenRows(1)
```

### Apply Conditional Formatting

```typescript
const fRange = fWorksheet.getRange('C2:C4')
const values = fRange.getValues()

values.forEach((row, i) => {
  const cell = fWorksheet.getRange(i + 1, 2)
  if (row[0] === 'Active') {
    cell.setBackground('#90EE90')
  } else {
    cell.setBackground('#FFB6C1')
  }
})
```

### Listen to Cell Changes

```typescript
univerAPI.addEvent(univerAPI.Event.CellClicked, (params) => {
  const { worksheet, row, column } = params
  console.log('Cell clicked:', worksheet.getRange(row, column).getA1Notation())
})
```

## References

- [Univer Official Documentation](https://docs.univer.ai/)
- [Univer GitHub Repository](https://github.com/dream-num/univer)
- [Univer API Reference](https://reference.univer.ai/)

## Contributing

When adding new documentation:

1. Follow the existing structure and format
2. Include code examples
3. Add best practices section
4. Reference related documentation
5. Include source URL and last updated date

---

**Last Updated**: 2025-02-25
**Maintained by**: SheetLab AI Team
