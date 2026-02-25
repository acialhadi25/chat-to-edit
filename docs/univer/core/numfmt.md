# Univer Number Format Documentation

## Overview

Number formatting controls how numbers display in cells, including decimal places, thousands separators, percentages, currency symbols, dates, and more. This makes data easier to read and understand.

**Note**: DBNum syntax is not supported.

## Setting Number Format

### Via Cell Data

```typescript
const data = {
  v: 123456.789,
  s: {
    n: {
      pattern: '#,##0.00',
    },
  },
}
```

### Via Facade API

```typescript
import '@univerjs/sheets-numfmt/facade'

const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Set number format for single cell
const fRange = fWorksheet.getRange('A1')
fRange.setValue(1234.567).setNumberFormat('#,##0.00')
console.log(fRange.getDisplayValue()) // 1,234.57
```

### Set Multiple Formats

```typescript
// Set number formats for range A1:B2
const fRange = fWorksheet.getRange('A1:B2')
fRange.setValues([
  [1234.567, 0.1234],
  [45658, 0.9876],
]).setNumberFormats([
  ['#,##0.00', '0.00%'],
  ['yyyy-MM-DD', ''],
])

console.log(fRange.getDisplayValues()) 
// [['1,234.57', '12.34%'], ['2025-01-01', 0.9876]]
```

## Getting Number Format

### Get Single Format

```typescript
const fRange = fWorksheet.getRange('A1:B2')

// Get format of top-left cell
const format = fRange.getNumberFormat()
```

### Get Multiple Formats

```typescript
// Get all formats in range
const formats = fRange.getNumberFormats()
```

## Text Format

### Prevent Auto-Conversion

By default, text starting with 0 and numbers convertible to dates are automatically formatted. To prevent this:

#### Method 1: Set Text Format

```typescript
import { DEFAULT_TEXT_FORMAT_EXCEL } from '@univerjs/engine-numfmt'

const data = {
  v: '012.0',
  s: {
    n: {
      pattern: DEFAULT_TEXT_FORMAT_EXCEL, // Text format
    },
  },
}

// Or via Facade API
fRange.setNumberFormat(DEFAULT_TEXT_FORMAT_EXCEL)
```

#### Method 2: Force Text with Single Quote

Add a single quote `'` before the number when entering.

### Disable Text Format Alert and Mark

```typescript
// Presets configuration
const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      disableTextFormatAlert: true,
      disableTextFormatMark: true,
    }),
  ],
})

// Plugin configuration
univer.registerPlugin(UniverSheetsNumfmtPlugin, {
  disableTextFormatAlert: true,
  disableTextFormatMark: true,
})
```

## Locale Settings

### Set Number Format Locale

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1')
fRange.setValue(1234.567).setNumberFormat('#,##0.00')

// Set locale to en_US
fWorkbook.setNumfmtLocal('en_US')
console.log(fRange.getDisplayValue()) // 1,234.57

// Set locale to de_DE
fWorkbook.setNumfmtLocal('de_DE')
console.log(fRange.getDisplayValue()) // 1.234,57
```

## Common Number Format Patterns

### General Formats

```typescript
// Integer
'#,##0'

// Two decimal places
'#,##0.00'

// Percentage
'0.00%'

// Currency
'$#,##0.00'
'€#,##0.00'

// Scientific notation
'0.00E+00'
```

### Date Formats

```typescript
// Date formats
'yyyy-MM-dd'        // 2025-02-25
'MM/dd/yyyy'        // 02/25/2025
'dd-MMM-yyyy'       // 25-Feb-2025
'MMMM d, yyyy'      // February 25, 2025

// Time formats
'hh:mm:ss'          // 14:30:45
'hh:mm AM/PM'       // 02:30 PM

// Date and time
'yyyy-MM-dd hh:mm:ss'
```

### Custom Formats

```typescript
// Positive, negative, zero, text
'#,##0.00;[Red]-#,##0.00;0.00;"@"'

// Conditional formatting
'[>1000]#,##0.00;[<=-1000]-#,##0.00;0.00'

// Hide zeros
'#,##0.00;-#,##0.00;'
```

## Format Code Reference

For detailed format code specifications, refer to:
[Microsoft Number Format Codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68)

## Examples

### Currency Formatting

```typescript
const fRange = fWorksheet.getRange('A1')
fRange.setValue(1234.56).setNumberFormat('$#,##0.00')
// Display: $1,234.56
```

### Percentage Formatting

```typescript
const fRange = fWorksheet.getRange('A1')
fRange.setValue(0.1234).setNumberFormat('0.00%')
// Display: 12.34%
```

### Date Formatting

```typescript
const fRange = fWorksheet.getRange('A1')
fRange.setValue(45658).setNumberFormat('yyyy-MM-dd')
// Display: 2025-01-01
```

### Custom Conditional Format

```typescript
const fRange = fWorksheet.getRange('A1')
fRange.setValue(1500).setNumberFormat('[>1000]"High: "#,##0;[<0]"Negative: "#,##0;"Zero"')
// Display: High: 1,500
```

## Best Practices

1. **Use appropriate formats** for data types (currency, percentage, date)
2. **Consider locale** when formatting numbers for international users
3. **Use text format** to preserve leading zeros or special number formats
4. **Test format patterns** before applying to large ranges
5. **Document custom formats** for team understanding

## References

- [Univer Official Number Format Docs](https://docs.univer.ai/guides/sheets/features/core/numfmt)
- [Microsoft Number Format Codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/numfmt
**Content rephrased for compliance with licensing restrictions**
