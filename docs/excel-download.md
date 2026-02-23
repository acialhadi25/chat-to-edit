# Excel Download Feature

## Overview

Fitur download Excel memungkinkan user untuk mengekspor spreadsheet dari preview FortuneSheet ke file Excel (.xlsx) dengan mempertahankan semua formatting, formula, dan styling yang ada.

## Teknologi yang Digunakan

- **ExcelJS**: Library untuk membuat dan memanipulasi file Excel
- **FortuneSheet**: Spreadsheet component untuk preview dan editing
- **React**: Framework untuk UI

## Arsitektur

### 1. Data Extraction (`ExcelPreview.tsx`)

Method `getData()` mengekstrak data dari FortuneSheet menggunakan API `getAllSheets()`:

```typescript
const sheets = workbookRef.current.getAllSheets();
const sheet = sheets[0];
```

#### Data yang Diekstrak:

1. **Formulas** - Dari `calcChain` dan cell data
   - `sheet.calcChain`: Array berisi referensi ke semua cell dengan formula
   - `cell.f`: Formula string (contoh: `=D2*E2`)

2. **Cell Styles** - Dari cell properties
   - `cell.bg`: Background color (contoh: `#00f00f`)
   - `cell.fc`: Font color
   - `cell.bl`: Bold (1 = bold, 0 = normal)

3. **Column Widths** - Dari sheet config
   - `sheet.config.columnlen`: Object dengan key = column index, value = width in pixels

4. **Header Styles** - Dari row 0
   - Disimpan dengan key `HEADER_{colIdx}`

#### Struktur Data yang Dikembalikan:

```typescript
{
  formulas: {
    'F1': '=D2*E2',
    'F2': '=D3*E3',
    // ...
  },
  cellStyles: {
    'HEADER_0': { bgcolor: '#f0ff0f', font: { bold: true } },
    'A1': { bgcolor: '#00f00f' },
    'B1': { bgcolor: '#00f00f' },
    // ...
  },
  columnWidths: {
    0: 120,  // pixels
    1: 150,
    // ...
  },
  values: []
}
```

### 2. Excel Generation (`ExcelDashboard.tsx`)

Method `handleDownload()` membuat file Excel menggunakan ExcelJS:

#### Step 1: Create Workbook

```typescript
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet(excelData.currentSheet || 'Sheet1');
```

#### Step 2: Define Border Style

```typescript
const thinBorder = {
  top: { style: 'thin' as const, color: { argb: 'FF000000' } },
  left: { style: 'thin' as const, color: { argb: 'FF000000' } },
  bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
  right: { style: 'thin' as const, color: { argb: 'FF000000' } }
};
```

**Note**: Warna border harus hitam (`FF000000`) agar terlihat jelas.

#### Step 3: Add Header Row

```typescript
const headerRow = worksheet.addRow(excelData.headers);
headerRow.eachCell((cell, colNumber) => {
  const headerStyleRef = `HEADER_${colNumber - 1}`;
  const headerStyle = cellStyles[headerStyleRef];
  
  if (headerStyle?.bgcolor) {
    const bgColor = 'FF' + headerStyle.bgcolor.replace('#', '');
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor }
    };
  }
  
  cell.font = { bold: true };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = thinBorder;
});
```

#### Step 4: Add Data Rows

```typescript
excelData.rows.forEach((row, rowIdx) => {
  const excelRow = worksheet.addRow(row);
  
  excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    // Apply border to ALL cells (including empty)
    cell.border = thinBorder;
    cell.alignment = { vertical: 'middle' };
    
    const cellRef = createCellRef(colNumber - 1, rowIdx);
    const style = cellStyles[cellRef];
    
    // Apply background color
    if (style?.bgcolor) {
      const bgColor = 'FF' + style.bgcolor.replace('#', '');
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
    }
    
    // Apply formula
    const formula = formulas[cellRef];
    if (formula) {
      const formulaStr = formula.startsWith('=') ? formula.substring(1) : formula;
      cell.value = { formula: formulaStr };
    }
  });
});
```

**Important**: `includeEmpty: true` memastikan border di-apply ke semua cell termasuk yang kosong.

#### Step 5: Set Column Widths

```typescript
excelData.headers.forEach((_, idx) => {
  let width = 15; // Default width in Excel units
  
  if (columnWidths[idx]) {
    width = columnWidths[idx] / 8; // Convert pixels to Excel units
  }
  
  worksheet.getColumn(idx + 1).width = width;
});
```

**Conversion**: FortuneSheet width (pixels) / 8 ≈ Excel width units

#### Step 6: Generate and Download

```typescript
const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], { 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
});
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = fileName;
link.click();
window.URL.revokeObjectURL(url);
```

## Formula Handling

### calcChain

FortuneSheet menyimpan referensi formula di `calcChain`:

```typescript
sheet.calcChain = [
  { r: 1, c: 5, id: 'sheet-id' },  // F1 (row 1, col 5)
  // ...
]
```

- `r`: Row index (0-based, row 0 = header)
- `c`: Column index (0-based)
- `id`: Sheet ID

### Formula Extraction

```typescript
if (sheet.calcChain && Array.isArray(sheet.calcChain)) {
  sheet.calcChain.forEach((calc: any) => {
    if (calc.r > 0) {  // Skip header
      const rowIdx = calc.r - 1;
      const colIdx = calc.c;
      const cellRef = createCellRef(colIdx, rowIdx);
      
      const cell = sheet.data[calc.r][calc.c];
      if (cell.f) {
        extractedData.formulas[cellRef] = cell.f;
      }
    }
  });
}
```

### Formula Auto-Adjustment

Excel secara otomatis menyesuaikan formula saat di-copy:
- Formula di F1: `=D2*E2`
- Saat di-copy ke F2: Otomatis menjadi `=D3*E3`
- Saat di-copy ke F3: Otomatis menjadi `=D4*E4`

Jadi kita hanya perlu menyimpan 1 formula di calcChain, Excel akan handle sisanya.

## Color Format

### FortuneSheet Format
- Format: `#RRGGBB` (contoh: `#00f00f`)
- 6 digit hexadecimal

### ExcelJS Format
- Format: `FFRRGGBB` (contoh: `FF00f00f`)
- 8 digit hexadecimal dengan alpha channel

### Conversion

```typescript
const bgColor = 'FF' + style.bgcolor.replace('#', '');
```

## Cell Reference Format

### createCellRef Function

```typescript
function createCellRef(col: number, row: number): string {
  const colLetter = String.fromCharCode(65 + col); // 0 = A, 1 = B, ...
  return `${colLetter}${row + 1}`; // row 0 = 1, row 1 = 2, ...
}
```

Examples:
- `createCellRef(0, 0)` → `A1`
- `createCellRef(5, 0)` → `F1`
- `createCellRef(5, 1)` → `F2`

## Debugging Workflow

### Step 1: Check FortuneSheet Data

Saat download, buka browser console dan cari log berikut:

```
getData: getAllSheets() returned: [...]
getData: Sheet keys: [...]
getData: Sheet.data: [...]
getData: Sheet.calcChain: [...]
```

Ini menunjukkan struktur data dari FortuneSheet.

### Step 2: Check Formula Extraction

Cari log dengan emoji ✅:

```
✅ Found formula from calcChain at F1: =D2*E2
✅ Found NEW formula at F2: =D3*E3
```

Jika tidak ada log ini, formula tidak ter-extract.

### Step 3: Check Extraction Summary

Cari log summary:

```
📊 Summary:
  - Formulas extracted: 12
  - Cell styles extracted: 24
  - Column widths extracted: 8
```

Jika `Formulas extracted: 0`, ada masalah di extraction.

### Step 4: Check Application Summary

Cari log di akhir:

```
📊 Application Summary:
  - Formulas applied: 12
  - Borders applied: 240
  - Cell styles applied: 24
```

Jika `Formulas applied: 0` tapi `Formulas extracted: 12`, ada masalah di application logic.

### Step 5: Verify Excel File

Buka file Excel yang di-download:
1. Click cell dengan formula (contoh: F2)
2. Check formula bar - harus menampilkan `=D2*E2`
3. Check cell value - harus menampilkan hasil kalkulasi
4. Check border - harus terlihat grid hitam
5. Check background color - harus sesuai dengan preview

## Common Issues and Solutions

### Formula Tidak Muncul di Excel

**Problem**: Formula tidak ter-export ke file Excel

**Diagnosis Steps**:
1. Buka browser console saat download
2. Cari log `getData: Extraction complete`
3. Check `Formulas extracted: X` - jika 0, formula tidak ter-extract dari FortuneSheet
4. Cari log dengan emoji ✅ yang menunjukkan formula ditemukan
5. Check `Formulas applied: X` - jika 0, formula tidak di-apply ke ExcelJS

**Possible Causes**:
1. **FortuneSheet tidak menyimpan formula** - Formula hanya ada di React state, tidak di FortuneSheet
2. **calcChain kosong** - FortuneSheet tidak populate calcChain
3. **cell.f property tidak ada** - Formula disimpan di format lain

**Solution**:
```typescript
// Check if formula exists in FortuneSheet
const sheets = workbookRef.current.getAllSheets();
const sheet = sheets[0];
console.log('Sheet data:', sheet.data);
console.log('calcChain:', sheet.calcChain);

// If calcChain is empty, scan all cells
sheet.data.forEach((row, rowIdx) => {
  row.forEach((cell, colIdx) => {
    if (cell && cell.f) {
      console.log(`Formula at [${rowIdx}][${colIdx}]: ${cell.f}`);
    }
  });
});
```

### Grid/Border Tidak Muncul

**Problem**: Border tidak terlihat di Excel

**Diagnosis Steps**:
1. Check log `Borders applied: X` - harus > 0
2. Verify `includeEmpty: true` digunakan di `eachCell()`
3. Check border color - harus `FF000000` (hitam)

**Solution**: Pastikan border di-apply dengan `includeEmpty: true`:

```typescript
excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
  cell.border = thinBorder; // Apply to ALL cells including empty
});
```

### Cell Background Tidak Muncul

**Problem**: Background color tidak di-export

**Solution**: 
1. Pastikan extract dari `cell.bg` di FortuneSheet
2. Convert format dari `#RRGGBB` ke `FFRRGGBB`
3. Apply menggunakan `cell.fill` dengan pattern `solid`

### Column Width Tidak Sesuai

**Problem**: Lebar kolom berbeda dengan preview

**Solution**: Extract dari `sheet.config.columnlen` dan convert:

```typescript
const width = columnWidths[idx] / 8; // pixels to Excel units
worksheet.getColumn(idx + 1).width = width;
```

### Grid Tidak Muncul di Cell Kosong

**Problem**: Border hanya muncul di cell yang ada isinya

**Solution**: Gunakan `includeEmpty: true`:

```typescript
excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
  cell.border = thinBorder;
  // ...
});
```

## Testing

### Manual Testing Checklist

- [ ] Header background color sesuai dengan preview
- [ ] Cell background color (conditional formatting) sesuai
- [ ] Formula bekerja dan auto-adjust per row
- [ ] Border/grid terlihat di semua cell
- [ ] Column width sesuai dengan preview
- [ ] Font bold di header
- [ ] Text alignment sesuai

### Test Cases

1. **Basic Export**
   - Upload Excel file
   - Download tanpa modifikasi
   - Verify: Format sama dengan original

2. **With Formula**
   - Add formula menggunakan AI (contoh: "isi kolom Total dengan formula Harga × Qty")
   - Download
   - Verify: Formula bekerja di Excel

3. **With Conditional Formatting**
   - Apply conditional formatting (contoh: "beri warna hijau untuk status Lunas")
   - Download
   - Verify: Warna sesuai dengan preview

4. **With Multiple Rows**
   - Add 10+ rows dengan formula
   - Download
   - Verify: Semua formula auto-adjust dengan benar

## Performance Considerations

### Large Files

Untuk file dengan banyak rows (>1000):
- ExcelJS memproses secara synchronous
- Bisa menyebabkan UI freeze
- Consider: Add loading indicator

### Memory Usage

- ExcelJS membuat buffer di memory
- File besar (>10MB) bisa menyebabkan memory spike
- Consider: Implement streaming untuk file besar

## Future Improvements

1. **Multiple Sheets Support**
   - Currently hanya support 1 sheet
   - Add loop untuk export semua sheets

2. **Advanced Formatting**
   - Number format (currency, percentage, date)
   - Cell merge
   - Row height

3. **Charts and Images**
   - Export charts dari preview
   - Export embedded images

4. **Streaming Export**
   - Untuk file besar
   - Reduce memory usage

## References

- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [FortuneSheet API](https://ruilisi.github.io/fortune-sheet-docs/guide/api.html)
- [Excel File Format Specification](https://docs.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/)

## Related Files

- `src/pages/ExcelDashboard.tsx` - Download handler
- `src/components/dashboard/ExcelPreview.tsx` - Data extraction
- `src/types/excel.ts` - Type definitions
- `package.json` - ExcelJS dependency

## Changelog

### 2024-02-20
- ✅ Fixed border color (gray → black)
- ✅ Fixed column width extraction from FortuneSheet
- ✅ Fixed formula extraction using calcChain
- ✅ Fixed header style extraction
- ✅ Fixed border application to empty cells

### Initial Implementation
- ✅ Basic Excel export with ExcelJS
- ✅ Formula support
- ✅ Cell styling (background, font color, bold)
- ✅ Border/grid support
