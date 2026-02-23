# Complex Test Data Template

## Overview

Template "Complex Test Data" adalah template khusus untuk pengujian fitur-fitur Excel AI dengan skenario yang kompleks. Template ini dirancang berdasarkan file `SheetCopilot_TestData.xlsx` yang memiliki 8 sheets dengan berbagai kasus penggunaan.

## Lokasi File

- **Template File**: `src/data/templates/test-complex-data.ts`
- **Type Definitions**: `src/types/template.ts`
- **Original Excel**: `SheetCopilot_TestData.xlsx` (8 sheets)

## Struktur Data

### Headers
```typescript
[
  "No",
  "Nama",
  "Produk",
  "Harga",
  "Qty",
  "Total",
  "Status"
]
```

### Sample Data (12 rows)

Data mencakup berbagai produk elektronik dengan harga, quantity, dan status pembayaran yang berbeda-beda.

## Fitur yang Diuji

### 1. Formula Calculation

**Column**: Total (F)
**Formula**: `=D{row}*E{row}` (Harga × Qty)

**Test Cases**:
- Formula auto-calculate saat data diinput
- Formula adjust row reference saat row ditambah/dihapus
- Formula tetap bekerja setelah export ke Excel

### 2. Conditional Formatting

**Column**: Status (G)

**Rules**:
| Status | Background Color | Font Color | Hex Code |
|--------|-----------------|------------|----------|
| Lunas | Green | Black | #00f00f |
| Pending | Yellow | Black | #ffff00 |
| Belum Bayar | Red | White | #ff0000 |

**Test Cases**:
- Warna berubah otomatis saat status diubah
- Conditional formatting preserved saat export
- Multiple conditions work correctly

### 3. Header Styling

**Style**:
- Background: Yellow-Green (#f0ff0f)
- Font: Bold, Black
- Alignment: Center

**Test Cases**:
- Header style preserved saat export
- Header tetap bold setelah edit
- Background color match dengan preview

## Test Scenarios

### Scenario 1: Formula Calculation
```
Action: Change Harga or Qty value
Expected: Total column auto-updates
Verify: Formula shows =D2*E2, =D3*E3, etc.
```

### Scenario 2: Conditional Formatting
```
Action: Change Status to "Lunas", "Pending", or "Belum Bayar"
Expected: Cell background changes to green, yellow, or red
Verify: Color matches preview exactly
```

### Scenario 3: Row Operations

#### Add Row
```
Action: Add new row at position 5
Expected: 
- Formula in Total column auto-generated
- Row numbers adjust (5 becomes 6, etc.)
- Conditional formatting applies to new row
```

#### Delete Row
```
Action: Delete row 3
Expected:
- Formula references adjust (=D4*E4 becomes =D3*E3)
- Row numbers re-sequence
- No broken formula references
```

#### Edit Row
```
Action: Edit row data (change Nama, Produk, Harga, Qty)
Expected:
- Total recalculates automatically
- Status conditional formatting still works
- No data corruption
```

### Scenario 4: Column Operations

#### Add Column
```
Action: Add new column "Diskon" after Qty
Expected:
- Formula references adjust (Total now uses new column positions)
- Header styling applies to new column
- Data structure remains consistent
```

#### Rename Column
```
Action: Rename "Status" to "Payment Status"
Expected:
- Conditional formatting still works
- Header text updates
- No formula breaks
```

#### Delete Column
```
Action: Delete "Produk" column
Expected:
- Data shifts left
- Formula still works with adjusted references
- No orphaned data
```

### Scenario 5: Excel Export

#### Export with Formulas
```
Action: Download Excel file
Expected:
- Formulas work in Excel (not just values)
- Formula shows =D2*E2 in formula bar
- Calculations update when values change
```

#### Export with Formatting
```
Action: Download Excel file
Expected:
- Header background is yellow-green
- Status cells have correct colors (green/yellow/red)
- Grid borders visible (black, thin)
- Column widths match preview
```

#### Export with Multiple Rows
```
Action: Add 50+ rows, then download
Expected:
- All formulas generated correctly
- All conditional formatting applied
- File size reasonable (<5MB)
- No performance issues
```

### Scenario 6: Data Validation

#### Numeric Validation
```
Action: Try to enter text in Harga or Qty column
Expected:
- Warning or auto-conversion to number
- Formula still calculates correctly
- No #VALUE! errors
```

#### Status Validation
```
Action: Enter invalid status (e.g., "Unknown")
Expected:
- No conditional formatting applied (default style)
- Cell remains editable
- No errors thrown
```

## Usage in Testing

### Manual Testing

1. **Load Template**
   ```
   - Open app
   - Click "Browse Templates"
   - Select "Complex Test Data"
   - Verify data loads correctly
   ```

2. **Test Each Scenario**
   - Follow test cases above
   - Document any failures
   - Take screenshots of issues

3. **Export and Verify**
   - Download Excel file
   - Open in Microsoft Excel
   - Verify all features work

### Automated Testing

```typescript
describe('Complex Test Data Template', () => {
  it('should load template with correct structure', () => {
    const template = getTemplateById('test-001');
    expect(template.headers).toHaveLength(7);
    expect(template.sampleData).toHaveLength(12);
  });

  it('should have formula for Total column', () => {
    const template = getTemplateById('test-001');
    const totalFormula = template.formulas?.find(f => f.column === 5);
    expect(totalFormula?.formula).toBe('=D{row}*E{row}');
  });

  it('should have conditional formatting for Status', () => {
    const template = getTemplateById('test-001');
    const statusFormatting = template.conditionalFormatting?.find(cf => cf.column === 6);
    expect(statusFormatting?.rules).toHaveLength(3);
  });
});
```

## Known Issues

### Issue 1: calcChain Only Shows First Formula
**Problem**: FortuneSheet's `calcChain` only contains reference to first formula cell
**Impact**: Other formula cells need to be detected from cell data directly
**Workaround**: Loop through all cells and check for `cell.f` property

### Issue 2: Border Color Too Light
**Problem**: Default border color (#D0D0D0) too light to see
**Solution**: Changed to black (#000000) for better visibility

### Issue 3: Column Width Not Preserved
**Problem**: Downloaded Excel has default column widths
**Solution**: Extract from `sheet.config.columnlen` and convert to Excel units

## Future Enhancements

1. **Multiple Sheets Support**
   - Add support for 8 sheets from original file
   - Test sheet switching and data persistence

2. **Advanced Formulas**
   - SUM, AVERAGE, COUNT functions
   - Nested formulas
   - Cross-sheet references

3. **Data Types**
   - Date formatting
   - Currency formatting
   - Percentage formatting

4. **Charts and Graphs**
   - Add sample chart data
   - Test chart export to Excel

5. **Pivot Tables**
   - Add pivot table template
   - Test pivot operations

## References

- Original File: `SheetCopilot_TestData.xlsx`
- Template Code: `src/data/templates/test-complex-data.ts`
- Type Definitions: `src/types/template.ts`
- Excel Download Docs: `docs/excel-download.md`

## Changelog

### 2024-02-20
- ✅ Created complex test data template
- ✅ Added conditional formatting support
- ✅ Added test scenarios documentation
- ✅ Added "testing" category to template types
- ✅ Integrated with template gallery
