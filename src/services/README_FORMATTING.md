# Formatting Service Documentation

## Overview

The Formatting Service provides comprehensive cell and range formatting capabilities for Univer Sheet integration. It supports number formatting, cell styling, border styling, and cell alignment with full validation and error handling.

## Features

- **Number Formatting**: Currency, percentage, date, time, and custom formats
- **Cell Styling**: Font colors, background colors, font properties, and text decorations
- **Border Styling**: Individual borders, outline, and all sides (API pending)
- **Cell Alignment**: Horizontal and vertical alignment with text wrap support
- **Clear Formatting**: Remove all formatting from ranges

## Installation

```typescript
import { createFormattingService } from './services/formattingService';
import type { FUniver } from './types/univer.types';

// Create service instance
const formattingService = createFormattingService(univerAPI, isReady);
```

## API Reference

### Number Formatting

#### `applyNumberFormat(range: string, format: NumberFormatOptions): Promise<boolean>`

Apply number formatting to a range of cells.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:A10")
- `format`: Number format options

**Format Options:**
```typescript
interface NumberFormatOptions {
  type: 'currency' | 'percentage' | 'date' | 'time' | 'custom';
  decimals?: number;           // Number of decimal places (default: 2)
  currencySymbol?: string;     // Currency symbol (default: '$')
  dateFormat?: string;         // Date format pattern (default: 'yyyy-mm-dd')
  customFormat?: string;       // Custom format string (required for 'custom' type)
}
```

**Examples:**

```typescript
// Currency format with default settings ($, 2 decimals)
await formattingService.applyNumberFormat('A1:A10', { 
  type: 'currency' 
});

// Currency with custom symbol and decimals
await formattingService.applyNumberFormat('A1:A10', { 
  type: 'currency',
  currencySymbol: '€',
  decimals: 3
});

// Percentage format
await formattingService.applyNumberFormat('B1:B10', { 
  type: 'percentage',
  decimals: 1
});

// Date format
await formattingService.applyNumberFormat('C1:C10', { 
  type: 'date',
  dateFormat: 'mm/dd/yyyy'
});

// Time format
await formattingService.applyNumberFormat('D1:D10', { 
  type: 'time'
});

// Custom format (scientific notation)
await formattingService.applyNumberFormat('E1:E10', { 
  type: 'custom',
  customFormat: '0.00E+00'
});
```

**Supported Date Formats:**
- `yyyy-mm-dd` - ISO format (2024-01-15)
- `mm/dd/yyyy` - US format (01/15/2024)
- `dd/mm/yyyy` - European format (15/01/2024)
- `dddd, mmmm dd, yyyy` - Long format (Monday, January 15, 2024)
- `mmm dd, yyyy` - Medium format (Jan 15, 2024)

### Cell Styling

#### `applyCellStyle(range: string, style: CellStyleOptions): Promise<boolean>`

Apply cell styling to a range of cells.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:A10")
- `style`: Cell style options

**Style Options:**
```typescript
interface CellStyleOptions {
  fontColor?: string;          // Hex color (e.g., '#FF0000')
  backgroundColor?: string;    // Hex color (e.g., '#FFFF00')
  fontFamily?: string;         // Font family name (e.g., 'Arial')
  fontSize?: number;           // Font size in points (e.g., 14)
  bold?: boolean;              // Bold text
  italic?: boolean;            // Italic text
  underline?: boolean;         // Underline text (API pending)
  strikethrough?: boolean;     // Strikethrough text (API pending)
}
```

**Examples:**

```typescript
// Apply font color and background
await formattingService.applyCellStyle('A1:A10', {
  fontColor: '#FF0000',
  backgroundColor: '#FFFF00'
});

// Apply font properties
await formattingService.applyCellStyle('B1:B10', {
  fontFamily: 'Arial',
  fontSize: 14,
  bold: true,
  italic: true
});

// Highlight cells
await formattingService.applyCellStyle('C1:C10', {
  backgroundColor: '#90EE90',
  bold: true
});

// Create header style
await formattingService.applyCellStyle('A1:Z1', {
  fontColor: '#FFFFFF',
  backgroundColor: '#4472C4',
  fontSize: 12,
  bold: true
});
```

**Color Reference:**
- Red: `#FF0000`
- Green: `#00FF00`
- Blue: `#0000FF`
- Yellow: `#FFFF00`
- Orange: `#FFA500`
- Purple: `#800080`
- Black: `#000000`
- White: `#FFFFFF`
- Gray: `#808080`

### Border Styling

#### `applyBorderStyle(range: string, borders: BorderStyleOptions): Promise<boolean>`

Apply border styling to a range of cells.

**Note:** Border styling via Facade API is not yet available in Univer. This method will throw an error indicating the feature is pending.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:B10")
- `borders`: Border style options

**Border Options:**
```typescript
interface BorderStyleOptions {
  top?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
  right?: BorderStyle;
  all?: BorderStyle;           // Apply to all sides
  outline?: BorderStyle;       // Apply to outer edges only
  inside?: BorderStyle;        // Apply to inner borders only
}

interface BorderStyle {
  style: BorderStyleType;
  color: string;               // Hex color
}

enum BorderStyleType {
  NONE = 0,
  THIN = 1,
  MEDIUM = 2,
  THICK = 3,
  DASHED = 4,
  DOTTED = 5,
  DOUBLE = 6,
}
```

**Examples (for future use):**

```typescript
import { BorderStyleType } from './types/univer.types';

// Apply border to all sides
await formattingService.applyBorderStyle('A1:B10', {
  all: { style: BorderStyleType.THIN, color: '#000000' }
});

// Apply outline border
await formattingService.applyBorderStyle('A1:B10', {
  outline: { style: BorderStyleType.MEDIUM, color: '#FF0000' }
});

// Apply individual borders
await formattingService.applyBorderStyle('A1:B10', {
  top: { style: BorderStyleType.THICK, color: '#0000FF' },
  bottom: { style: BorderStyleType.THIN, color: '#00FF00' }
});

// Apply inside borders (for tables)
await formattingService.applyBorderStyle('A1:D10', {
  inside: { style: BorderStyleType.THIN, color: '#CCCCCC' }
});
```

### Cell Alignment

#### `applyCellAlignment(range: string, alignment: AlignmentOptions): Promise<boolean>`

Apply cell alignment to a range of cells.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:A10")
- `alignment`: Alignment options

**Alignment Options:**
```typescript
interface AlignmentOptions {
  horizontal?: 'left' | 'center' | 'right';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;          // Text wrap (API pending)
}
```

**Examples:**

```typescript
// Center align
await formattingService.applyCellAlignment('A1:A10', {
  horizontal: 'center',
  vertical: 'middle'
});

// Right align
await formattingService.applyCellAlignment('B1:B10', {
  horizontal: 'right'
});

// Top align
await formattingService.applyCellAlignment('C1:C10', {
  vertical: 'top'
});

// Center headers
await formattingService.applyCellAlignment('A1:Z1', {
  horizontal: 'center',
  vertical: 'middle'
});

// Wrap text (will show warning)
await formattingService.applyCellAlignment('D1:D10', {
  wrapText: true
});
```

### Clear Formatting

#### `clearFormatting(range: string): Promise<boolean>`

Remove all formatting from a range of cells, resetting to default styles.

**Parameters:**
- `range`: A1 notation range (e.g., "A1:B10")

**Default Values:**
- Font color: Black (#000000)
- Background color: White (#FFFFFF)
- Font weight: Normal
- Font style: Normal
- Font size: 11pt
- Horizontal alignment: Left
- Vertical alignment: Bottom
- Number format: General

**Example:**

```typescript
// Clear all formatting
await formattingService.clearFormatting('A1:B10');

// Clear entire sheet
await formattingService.clearFormatting('A1:Z1000');
```

### Service Management

#### `updateAPI(univerAPI: FUniver | null, isReady: boolean): void`

Update the Univer API instance and ready state.

**Parameters:**
- `univerAPI`: New Univer API instance or null
- `isReady`: Whether Univer is ready

**Example:**

```typescript
// Update when Univer becomes ready
formattingService.updateAPI(univerAPI, true);

// Update when Univer is disposed
formattingService.updateAPI(null, false);
```

## Usage Patterns

### Creating a Table Header

```typescript
// Apply header formatting
await formattingService.applyCellStyle('A1:E1', {
  fontColor: '#FFFFFF',
  backgroundColor: '#4472C4',
  fontSize: 12,
  bold: true
});

await formattingService.applyCellAlignment('A1:E1', {
  horizontal: 'center',
  vertical: 'middle'
});
```

### Formatting Financial Data

```typescript
// Format currency column
await formattingService.applyNumberFormat('B2:B100', {
  type: 'currency',
  currencySymbol: '$',
  decimals: 2
});

// Highlight negative values
await formattingService.applyCellStyle('B2:B100', {
  fontColor: '#FF0000'
});
```

### Creating a Report

```typescript
// Title
await formattingService.applyCellStyle('A1', {
  fontSize: 18,
  bold: true
});

await formattingService.applyCellAlignment('A1', {
  horizontal: 'center'
});

// Headers
await formattingService.applyCellStyle('A3:E3', {
  backgroundColor: '#D9E1F2',
  bold: true
});

// Data formatting
await formattingService.applyNumberFormat('B4:B100', {
  type: 'currency'
});

await formattingService.applyNumberFormat('C4:C100', {
  type: 'percentage',
  decimals: 1
});

await formattingService.applyNumberFormat('D4:D100', {
  type: 'date',
  dateFormat: 'mm/dd/yyyy'
});
```

### Conditional Highlighting

```typescript
// Highlight high values
await formattingService.applyCellStyle('A1:A10', {
  backgroundColor: '#90EE90',
  bold: true
});

// Highlight low values
await formattingService.applyCellStyle('A11:A20', {
  backgroundColor: '#FFB6C1'
});

// Highlight warnings
await formattingService.applyCellStyle('A21:A30', {
  backgroundColor: '#FFFF00',
  fontColor: '#FF0000',
  bold: true
});
```

## Error Handling

All methods throw errors for invalid inputs or operation failures:

```typescript
try {
  await formattingService.applyNumberFormat('A1:A10', {
    type: 'currency'
  });
} catch (error) {
  console.error('Formatting failed:', error.message);
  // Handle error appropriately
}
```

**Common Errors:**
- `Invalid range notation` - Range string is not valid A1 notation
- `Invalid color format` - Color is not in hex format (#RRGGBB)
- `Font size must be positive` - Font size is zero or negative
- `Custom format requires customFormat property` - Custom format type without format string
- `No active worksheet available` - No worksheet is currently active
- `Failed to apply...` - Operation failed in Univer API

## Best Practices

1. **Batch Operations**: Apply multiple formatting operations together when possible
2. **Validation**: Always validate user input before applying formatting
3. **Error Handling**: Wrap formatting calls in try-catch blocks
4. **Performance**: Use range operations instead of cell-by-cell formatting
5. **Color Consistency**: Use a consistent color palette across your application
6. **Accessibility**: Ensure sufficient color contrast for readability

## Limitations

### Current API Limitations

Some features are not yet available in Univer's Facade API:

- **Borders**: Border styling methods will throw an error
- **Text Wrap**: Text wrap option will show a warning
- **Underline/Strikethrough**: These decorations are converted but may not apply

These features will be supported when Univer's Facade API is updated.

### Workarounds

For features not yet in the Facade API, you can:

1. Use the underlying command system directly
2. Wait for Univer API updates
3. Use rich text formatting for text decorations

## Testing

The service includes comprehensive unit tests covering:

- All number format types (50+ tests)
- All cell style properties
- All alignment options
- Error handling and validation
- Edge cases and boundary conditions

Run tests:
```bash
npm test formattingService.test.ts
```

## Requirements Mapping

This service implements the following requirements:

- **1.3.1**: Number formatting (currency, percentage, date)
- **1.3.2**: Cell styling (colors, fonts, bold, italic)
- **1.3.3**: Border styling (pending API support)
- **1.3.4**: Cell alignment (horizontal, vertical, wrap text)

## See Also

- [Univer Sheets API Documentation](../../../docs/univer/core/sheets-api.md)
- [Univer Rich Text Documentation](../../../docs/univer/core/rich-text.md)
- [Type Definitions](../types/univer.types.ts)
- [Cell Operations Hook](../hooks/useUniverCellOperations.ts)

## Version History

- **v1.0.0** - Initial implementation with number formatting, cell styling, and alignment
- Pending: Border styling support when Facade API is updated

---

**Last Updated**: 2024
**Status**: Production Ready (with noted limitations)
