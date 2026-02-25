# Univer Gridlines Documentation

## Overview

Gridlines are visual elements in spreadsheets that help distinguish cells and organize data. Univer provides functionality to show/hide gridlines and customize their color.

## Gridlines Operations

### Toggle Gridlines Visibility

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Hide gridlines
fWorkSheet.setHiddenGridlines(true)

// Show gridlines
fWorkSheet.setHiddenGridlines(false)
```

### Get Gridlines Visibility Status

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Check if gridlines are hidden
if (fWorkSheet.hasHiddenGridLines()) {
  console.log('Gridlines are hidden')
} else {
  console.log('Gridlines are visible')
}
```

### Set Gridlines Color

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set gridlines color to red
fWorkSheet.setGridLinesColor('#ff0000')

// Get current gridlines color
console.log(fWorkSheet.getGridLinesColor()) // #ff0000
```

## Common Use Cases

### Clean Presentation Mode

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Hide gridlines for cleaner presentation
fWorkSheet.setHiddenGridlines(true)
```

### Custom Theme Colors

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set gridlines to match theme
fWorkSheet.setGridLinesColor('#e0e0e0')  // Light gray
```

### Toggle Gridlines

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Toggle gridlines visibility
const isHidden = fWorkSheet.hasHiddenGridLines()
fWorkSheet.setHiddenGridlines(!isHidden)
```

### Dark Mode Gridlines

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set dark gridlines for dark mode
fWorkSheet.setGridLinesColor('#404040')
```

## Best Practices

1. **Hide for presentations** - Remove gridlines for cleaner reports
2. **Use subtle colors** - Light gray works well for most themes
3. **Consider accessibility** - Ensure sufficient contrast
4. **Match theme** - Coordinate gridline color with overall design
5. **Test visibility** - Verify gridlines are visible with cell backgrounds

## Examples

### Professional Report Style

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Hide gridlines for professional look
fWorkSheet.setHiddenGridlines(true)

// Add borders to specific ranges instead
const headerRange = fWorkSheet.getRange('A1:E1')
headerRange.setBorder(true, true, true, true, false, false)
```

### Subtle Gridlines

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Show gridlines with subtle color
fWorkSheet.setHiddenGridlines(false)
fWorkSheet.setGridLinesColor('#f0f0f0')
```

### Conditional Gridlines

```typescript
const fWorkSheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Show/hide based on data density
const range = fWorkSheet.getRange('A1:Z100')
const values = range.getValues()
const hasData = values.some(row => row.some(cell => cell !== null))

if (hasData) {
  fWorkSheet.setHiddenGridlines(false)
} else {
  fWorkSheet.setHiddenGridlines(true)
}
```

## Color Format

Gridline colors accept standard color formats:

```typescript
// Hex format
fWorkSheet.setGridLinesColor('#ff0000')

// RGB format (as hex)
fWorkSheet.setGridLinesColor('#rgb(255, 0, 0)')

// Named colors (converted to hex)
fWorkSheet.setGridLinesColor('red')
```

## References

- [Univer Official Gridlines Docs](https://docs.univer.ai/guides/sheets/features/core/gridlines)
- [Sheets API Documentation](./sheets-api.md)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/gridlines
**Content rephrased for compliance with licensing restrictions**
