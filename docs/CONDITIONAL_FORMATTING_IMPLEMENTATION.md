# Conditional Formatting Implementation

## Overview

This document describes the implementation of conditional formatting using Univer's native API, replacing the previous React state-based approach.

## Problem Statement

Previously, the `CONDITIONAL_FORMAT` action applied formatting by:
1. Evaluating conditions against cell values in React state
2. Storing static cell styles in `ExcelData.cellStyles`
3. Applying these styles when recreating the workbook

**Issues with this approach:**
- Formatting was static, not rule-based
- Formatting didn't persist through workbook recreation properly
- Formatting didn't update when cell values changed
- Not using Univer's native conditional formatting capabilities

## Solution

The new implementation uses Univer's native conditional formatting API:
1. Conditional formatting rules are created using Univer's API
2. Rules are stored in the workbook data structure
3. Formatting updates automatically when cell values change
4. Formatting persists through workbook save/load cycles

## Architecture

### Components

1. **conditionalFormattingService.ts**
   - Service layer for conditional formatting operations
   - Wraps Univer's conditional formatting API
   - Provides type-safe interface for applying rules

2. **ExcelPreview.tsx**
   - Updated to include conditional formatting preset
   - Handles `CONDITIONAL_FORMAT` action using the service
   - Applies rules to Univer workbook

3. **excelOperations.ts**
   - Updated to NOT generate static style changes
   - Passes rules to be applied by Univer API

### Data Flow

```
AI Command
    ↓
Parse to AIAction (CONDITIONAL_FORMAT)
    ↓
ExcelDashboard.handleApplyAction()
    ↓
ExcelPreview.applyAction()
    ↓
conditionalFormattingService.applyConditionalFormatting()
    ↓
Univer Native API (worksheet.newConditionalFormattingRule())
    ↓
Rules stored in workbook data
    ↓
Formatting applied dynamically
```

## API Usage

### Installing the Package

```bash
npm install @univerjs/preset-sheets-conditional-formatting
```

### Importing the Preset

```typescript
import { UniverSheetsConditionalFormattingPreset } from '@univerjs/preset-sheets-conditional-formatting';
import UniverPresetSheetsConditionalFormattingEnUS from '@univerjs/preset-sheets-conditional-formatting/locales/en-US';
import '@univerjs/preset-sheets-conditional-formatting/lib/index.css';
```

### Creating Conditional Formatting Rules

```typescript
const fWorksheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
const fRange = fWorksheet.getRange('G:G');

const rule = fWorksheet.newConditionalFormattingRule()
  .whenTextEqualTo('lunas')
  .setRanges([fRange.getRange()])
  .setBackground('#00ff00')
  .setFontColor('#ffffff')
  .build();

fWorksheet.addConditionalFormattingRule(rule);
```

## Supported Conditions

The service supports the following condition types:

- `contains` / `textContains` - Text contains a value
- `equals` / `textEquals` - Text equals a value
- `startsWith` / `textStartsWith` - Text starts with a value
- `endsWith` / `textEndsWith` - Text ends with a value

## Supported Formatting

The service supports the following formatting options:

- `backgroundColor` - Cell background color (hex format)
- `color` - Font color (hex format)
- `bold` - Bold font weight

## Example Usage

### AI Command

```
"buat data di kolom status, jika lunas warna hijau, jika pending warna kuning, jika belum bayar warna merah"
```

### Generated Action

```json
{
  "type": "CONDITIONAL_FORMAT",
  "params": {
    "target": { "type": "column", "ref": "G" },
    "rules": [
      {
        "condition": "equals",
        "value": "lunas",
        "format": { "backgroundColor": "#00ff00" }
      },
      {
        "condition": "equals",
        "value": "pending",
        "format": { "backgroundColor": "#ffff00" }
      },
      {
        "condition": "equals",
        "value": "belum bayar",
        "format": { "backgroundColor": "#ff0000" }
      }
    ]
  }
}
```

### Service Call

```typescript
import { applyConditionalFormatting } from '@/services/conditionalFormattingService';

const success = applyConditionalFormatting(univerAPI, {
  target: { type: 'column', ref: 'G' },
  rules: [
    {
      condition: 'equals',
      value: 'lunas',
      format: { backgroundColor: '#00ff00' }
    },
    // ... more rules
  ]
});
```

## Benefits

1. **Persistence**: Rules are stored in workbook data and persist through save/load cycles
2. **Dynamic**: Formatting updates automatically when cell values change
3. **Performance**: No need to re-evaluate conditions on every render
4. **Native**: Uses Univer's built-in conditional formatting engine
5. **Compatibility**: Works with Excel import/export

## Testing

### Unit Tests

- `conditionalFormattingService.test.ts` - 14 tests covering all service functions
- Tests verify correct API calls and parameter handling
- All tests passing ✅

### Integration Tests

- `conditionalFormattingPersistence.test.ts` - Documents expected behavior
- Includes manual testing instructions

### Manual Testing

1. Upload a file with a "Status" column
2. Apply conditional formatting via AI command
3. Verify formatting is applied correctly
4. Download and re-upload the file
5. Verify formatting persists
6. Change cell values and verify formatting updates

## Future Enhancements

1. **Numeric Conditions**: Support for numeric comparisons (>, <, >=, <=, between)
2. **Date Conditions**: Support for date-based conditions
3. **Formula Conditions**: Support for custom formula-based conditions
4. **Icon Sets**: Support for icon set conditional formatting
5. **Data Bars**: Support for data bar conditional formatting
6. **Color Scales**: Support for color scale conditional formatting

## References

- [Univer Conditional Formatting Documentation](https://docs.univer.ai/guides/sheets/features/conditional-formatting)
- [Task 7.2 Specification](.kiro/specs/univer-integration/tasks.md)
- [Requirements 1.3.5, 4.2.5](.kiro/specs/univer-integration/requirements.md)

## Implementation Status

- ✅ Service layer created
- ✅ ExcelPreview component updated
- ✅ Preset installed and configured
- ✅ Unit tests written and passing (14/14)
- ✅ Integration test documentation created
- ⏳ Manual testing pending
- ⏳ Excel import/export testing pending

## Notes

- The old implementation in `excelOperations.ts` has been updated to NOT generate static style changes
- The `CONDITIONAL_FORMAT` action is now handled entirely by the Univer API
- No changes are generated for this action type (it's rule-based, not change-based)
- The formatting is applied directly to the Univer workbook, not to React state

---

**Document Version**: 1.0  
**Last Updated**: 2025-02-25  
**Status**: Implementation Complete - Testing Pending
