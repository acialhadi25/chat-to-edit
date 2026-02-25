# Univer Default Style Documentation

## Overview

Univer provides two levels of default styles that can be applied to worksheets, rows, and columns. These styles serve as fallback formatting when no specific cell style is defined.

## Style Levels

1. **Worksheet default style** - Applied to all cells in the worksheet
2. **Row/Column default style** - Applied to specific rows or columns

## Style Precedence

By default, column style takes precedence over row style. You can change this behavior during plugin registration:

```typescript
univer.registerPlugin(UniverSheetsPlugin, {
  isRowStylePrecedeColumnStyle: true,
})
```

## Setting Default Styles

### Via IWorksheetData Interface

```typescript
interface IWorksheetData {
  /**
   * Default style data of Worksheet
   */
  defaultStyle?: Nullable<IStyleData>
}

interface IRowData {
  /**
   * Style data
   */
  s?: Nullable<IStyleData>
}

interface IColumnData {
  /**
   * Style data
   */
  s?: Nullable<IStyleData>
}
```

### Via Facade API

#### Set Worksheet Default Style

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

const defaultStyle = {
  bg: {
    rgb: 'red',
  },
}

// Set default style for entire worksheet
fWorksheet.setDefaultStyle(defaultStyle)
```

#### Set Column Default Style

```typescript
const defaultColumnStyle = {
  bg: {
    rgb: 'blue',
  },
}

// Set default style for column D (index 3)
fWorksheet.setColumnDefaultStyle(3, defaultColumnStyle)

// Reset column D default style
fWorksheet.setColumnDefaultStyle(3, undefined)
```

#### Set Row Default Style

```typescript
const defaultRowStyle = {
  bg: {
    rgb: 'green',
  },
}

// Set default style for row 2 (index 1)
fWorksheet.setRowDefaultStyle(1, defaultRowStyle)
```

## Style Data Format

### IStyleData Interface

```typescript
interface IStyleData {
  // Background
  bg?: {
    rgb: string  // Color in hex format
  }
  
  // Font
  ff?: string    // Font family
  fs?: number    // Font size
  fc?: {         // Font color
    rgb: string
  }
  bl?: BooleanNumber  // Bold
  it?: BooleanNumber  // Italic
  ul?: {              // Underline
    s: BooleanNumber
  }
  st?: {              // Strikethrough
    s: BooleanNumber
  }
  
  // Alignment
  ht?: HorizontalAlign  // Horizontal alignment
  vt?: VerticalAlign    // Vertical alignment
  tb?: WrapStrategy     // Text wrap
  
  // Border
  bd?: {
    t?: IBorderData  // Top border
    b?: IBorderData  // Bottom border
    l?: IBorderData  // Left border
    r?: IBorderData  // Right border
  }
}
```

## Examples

### Complete Worksheet Style

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

const worksheetStyle = {
  bg: { rgb: '#f0f0f0' },
  ff: 'Arial',
  fs: 11,
  fc: { rgb: '#000000' },
}

fWorksheet.setDefaultStyle(worksheetStyle)
```

### Alternating Row Colors

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set alternating row colors
for (let i = 0; i < 100; i++) {
  const bgColor = i % 2 === 0 ? '#ffffff' : '#f5f5f5'
  fWorksheet.setRowDefaultStyle(i, {
    bg: { rgb: bgColor }
  })
}
```

### Column-Specific Formatting

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Format first column (index 0) as bold
fWorksheet.setColumnDefaultStyle(0, {
  bl: 1,  // Bold
  bg: { rgb: '#e0e0e0' }
})

// Format currency column (index 5)
fWorksheet.setColumnDefaultStyle(5, {
  ff: 'Courier New',
  fc: { rgb: '#006400' }
})
```

### Header Row Style

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Style first row as header
fWorksheet.setRowDefaultStyle(0, {
  bl: 1,              // Bold
  bg: { rgb: '#4472C4' },
  fc: { rgb: '#FFFFFF' },
  fs: 12,
})
```

## Best Practices

1. **Use worksheet defaults** for consistent base styling
2. **Apply row/column styles** for specific formatting needs
3. **Consider precedence** when using both row and column styles
4. **Reset styles** by passing `undefined` when no longer needed
5. **Performance** - Default styles are more efficient than individual cell styles

## Style Precedence Order

When multiple style levels are defined:

1. Cell-specific style (highest priority)
2. Column default style (if `isRowStylePrecedeColumnStyle` is false)
3. Row default style (if `isRowStylePrecedeColumnStyle` is true)
4. Worksheet default style (lowest priority)

## Common Use Cases

### Data Table with Header

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Worksheet base style
fWorksheet.setDefaultStyle({
  ff: 'Arial',
  fs: 10,
})

// Header row
fWorksheet.setRowDefaultStyle(0, {
  bl: 1,
  bg: { rgb: '#4472C4' },
  fc: { rgb: '#FFFFFF' },
})

// ID column (bold)
fWorksheet.setColumnDefaultStyle(0, {
  bl: 1,
})
```

### Financial Report

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Base style
fWorksheet.setDefaultStyle({
  ff: 'Calibri',
  fs: 11,
})

// Amount columns (right-aligned)
for (let col = 2; col < 6; col++) {
  fWorksheet.setColumnDefaultStyle(col, {
    ht: 3,  // Right align
    ff: 'Courier New',
  })
}
```

## References

- [Univer Official Default Style Docs](https://docs.univer.ai/guides/sheets/features/core/default-style)
- [Range & Selection Documentation](./range-selection.md)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/default-style
**Content rephrased for compliance with licensing restrictions**
