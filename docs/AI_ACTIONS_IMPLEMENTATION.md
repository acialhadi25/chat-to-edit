# AI Actions Implementation for Univer Sheet

## Overview

Dokumen ini menjelaskan implementasi action-action AI yang telah diintegrasikan dengan Univer Sheet. Setiap perintah chat dari user dapat diterjemahkan ke dalam bentuk action yang berfungsi.

## Implemented Actions

### 1. EDIT_CELL ✅
**Status**: Fully Implemented

**Deskripsi**: Mengedit nilai single cell

**Parameters**:
- `target`: Cell reference (A1 notation, row/col, atau startRow/col)
- `value`: Nilai baru untuk cell

**Contoh**:
```typescript
{
  type: 'EDIT_CELL',
  target: { ref: 'A1' },
  params: { value: 'Hello World' }
}
```

**Implementasi**: Menggunakan `sheet.getRange(row, col).setValue(value)`

---

### 2. INSERT_FORMULA ✅
**Status**: Fully Implemented

**Deskripsi**: Memasukkan formula ke cell atau range

**Parameters**:
- `target`: Cell reference
- `formula`: Formula string (dengan atau tanpa leading `=`)

**Contoh**:
```typescript
{
  type: 'INSERT_FORMULA',
  target: { ref: 'D13' },
  params: { formula: '=SUM(D2:D12)' }
}
```

**Implementasi**: Menggunakan `sheet.getRange(row, col).setValue('=' + formula)`

---

### 3. EDIT_ROW ✅
**Status**: Fully Implemented

**Deskripsi**: Update seluruh row dengan nilai baru

**Parameters**:
- `target`: Row reference
- `rowData`: Array nilai untuk setiap kolom

**Contoh**:
```typescript
{
  type: 'EDIT_ROW',
  target: { ref: 'A5' },
  params: { rowData: ['John', 25, 'New York'] }
}
```

**Implementasi**: Loop through columns dan set value untuk setiap cell

---

### 4. DELETE_ROW ✅
**Status**: Fully Implemented

**Deskripsi**: Menghapus row dengan clear content

**Parameters**:
- `target`: Row reference
- `count`: Jumlah row yang akan dihapus (default: 1)

**Contoh**:
```typescript
{
  type: 'DELETE_ROW',
  target: { ref: 'A5' },
  params: { count: 2 }
}
```

**Implementasi**: Clear semua cell di row dengan `setValue(null)`

**Note**: Tidak menghapus row secara fisik, hanya clear content

---

### 5. EDIT_COLUMN ✅
**Status**: Fully Implemented

**Deskripsi**: Fill seluruh kolom dengan nilai

**Parameters**:
- `target`: Column reference
- `values`: Array nilai untuk setiap row

**Contoh**:
```typescript
{
  type: 'EDIT_COLUMN',
  target: { ref: 'A1' },
  params: { values: ['Value1', 'Value2', 'Value3'] }
}
```

**Implementasi**: Loop through rows dan set value untuk setiap cell di kolom

---

### 6. DATA_TRANSFORM ✅
**Status**: Fully Implemented

**Deskripsi**: Transform data (uppercase, lowercase, titlecase)

**Parameters**:
- `target`: Range reference (support A1:B10 notation)
- `transformType`: 'uppercase' | 'lowercase' | 'titlecase'

**Contoh**:
```typescript
{
  type: 'DATA_TRANSFORM',
  target: { ref: 'A2:A10' },
  params: { transformType: 'uppercase' }
}
```

**Implementasi**: Parse range, loop through cells, transform string values

---

### 7. FILL_DOWN ✅
**Status**: Fully Implemented

**Deskripsi**: Fill down nilai atau formula dari cell pertama

**Parameters**:
- `target`: Range reference (A1:A10)

**Contoh**:
```typescript
{
  type: 'FILL_DOWN',
  target: { ref: 'A1:A10' }
}
```

**Implementasi**: Get value dari first cell, copy ke semua cell di range

---

### 8. ADD_COLUMN ⏳
**Status**: Handled at Dashboard Level

**Deskripsi**: Menambah kolom baru

**Parameters**:
- `columnNames`: Array nama kolom atau single string
- `position`: 'start' | 'end' | number

**Note**: Action ini memerlukan modifikasi struktur data, sehingga di-handle di ExcelDashboard level, bukan di Univer Sheet level

---

### 9. DELETE_COLUMN ✅
**Status**: Implemented (Handled at Dashboard Level)

**Deskripsi**: Menghapus kolom dari spreadsheet

**Parameters**:
- `columnName`: Nama kolom yang akan dihapus
- `columnIndex`: Index kolom (0-based)

**Contoh**:
```typescript
{
  type: 'DELETE_COLUMN',
  params: { columnName: 'No' }
}
```

**Implementasi**: 
- Generate change di `excelOperations.ts`
- Apply change di `applyChanges.ts` dengan `applyDeleteColumns()`
- Handled at dashboard level karena memerlukan data structure modification

---

### 10. GENERATE_DATA ⏳
**Status**: Handled at Dashboard Level

**Deskripsi**: Generate data berdasarkan pattern

**Note**: Action ini menambah rows baru, sehingga di-handle di ExcelDashboard level

---

### 10. REMOVE_EMPTY_ROWS ⏳
**Status**: Handled at Dashboard Level

**Deskripsi**: Hapus semua row yang kosong

**Note**: Action ini memerlukan re-indexing rows, sehingga di-handle di ExcelDashboard level

---

### 11. STATISTICS ⏳
**Status**: Handled at Dashboard Level

**Deskripsi**: Tambah summary row dengan statistik

**Note**: Action ini menambah row baru, sehingga di-handle di ExcelDashboard level

---

### 12. CONDITIONAL_FORMAT ⏳
**Status**: Not Yet Implemented

**Deskripsi**: Apply conditional formatting

**Note**: Memerlukan Univer conditional formatting API

---

## Helper Functions

### parseA1Notation(ref: string)
Convert A1 notation (e.g., "D13") ke row/col coordinates (0-based)

**Example**:
```typescript
parseA1Notation('D13') // { row: 12, col: 3 }
parseA1Notation('AA1') // { row: 0, col: 26 }
```

### getRowCol(target: any)
Extract row/col dari berbagai format target:
- A1 notation: `{ ref: 'D13' }`
- Row/col: `{ row: 12, col: 3 }`
- StartRow/col: `{ startRow: 12, col: 3 }`

## Usage Flow

1. User mengirim perintah chat (e.g., "Tambahkan formula SUM di D13")
2. AI menganalisis dan generate action object
3. ExcelDashboard menerima action dan call `excelPreviewRef.current.applyAction(action)`
4. ExcelPreview.applyAction() parse action dan execute di Univer Sheet
5. Perubahan langsung terlihat di UI

## Testing

Untuk test action, gunakan console:

```javascript
// Get reference to ExcelPreview
const preview = document.querySelector('[data-component="excel-preview"]');

// Test EDIT_CELL
preview.applyAction({
  type: 'EDIT_CELL',
  target: { ref: 'A1' },
  params: { value: 'Test' }
});

// Test INSERT_FORMULA
preview.applyAction({
  type: 'INSERT_FORMULA',
  target: { ref: 'D13' },
  params: { formula: '=SUM(D2:D12)' }
});
```

## Future Enhancements

1. **Physical Row Deletion**: Implement actual row deletion using Univer commands
2. **Column Operations**: Implement physical column addition/deletion
3. **Conditional Formatting**: Integrate Univer conditional formatting API
4. **Batch Operations**: Optimize multiple actions with batch processing
5. **Undo/Redo**: Leverage Univer's built-in undo/redo system
6. **Range Selection**: Support multi-range operations

## References

- [Univer Sheets API](../docs/univer/core/sheets-api.md)
- [Univer General API](../docs/univer/core/general-api.md)
- [Excel Operations](../src/utils/excelOperations.ts)
- [Excel Preview Component](../src/components/dashboard/ExcelPreview.tsx)

---

**Last Updated**: 2025-02-25
**Status**: 7/12 actions fully implemented, 4/12 handled at dashboard level, 1/12 pending


## Bug Fixes

### Race Condition in Cleanup (Fixed ✅)
**Issue**: Warning "Attempted to synchronously unmount a root while React was already rendering"

**Solution**: Use `setTimeout(() => univer.dispose(), 0)` to defer disposal and avoid race condition

### applyChanges Error (Fixed ✅)
**Issue**: TypeError "newRows[change.row] is not iterable"

**Solution**: 
- Check if row is array before spreading
- Ensure row has enough columns before update
- Add validation for row existence

---

## Updated Status Summary

**Fully Implemented**: 8/13 actions
- EDIT_CELL ✅
- INSERT_FORMULA ✅
- EDIT_ROW ✅
- DELETE_ROW ✅
- EDIT_COLUMN ✅
- DATA_TRANSFORM ✅
- FILL_DOWN ✅
- DELETE_COLUMN ✅

**Handled at Dashboard Level**: 4/13 actions
- ADD_COLUMN ⏳
- GENERATE_DATA ⏳
- REMOVE_EMPTY_ROWS ⏳
- STATISTICS ⏳

**Pending**: 1/13 actions
- CONDITIONAL_FORMAT ⏳
