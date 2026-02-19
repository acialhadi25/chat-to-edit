# FortuneSheet Preview Update Fix

## Problem
Setelah Quick Action diterapkan:
- Data berhasil diupdate di React state
- Toast notification muncul: "Action Applied!"
- Tetapi perubahan tidak muncul di preview FortuneSheet

Log menunjukkan:
```
Action applied successfully: Updated 1 cell(s)
```

Tetapi spreadsheet tidak menampilkan perubahan.

## Root Cause
`ExcelPreview` component menghitung `fortuneSheetData` sekali saat render pertama:
```typescript
const fortuneSheetData = convertToFortuneSheetFormat(data);
```

Ketika `data` prop berubah (setelah action diterapkan), `fortuneSheetData` tidak di-recalculate karena:
1. Variabel dihitung di luar useEffect/useMemo
2. Component di-memo, jadi tidak re-render otomatis

Akibatnya, FortuneSheet tetap menampilkan data lama meskipun React state sudah berubah.

## Solution

### 1. Use useMemo untuk fortuneSheetData
Wrap `convertToFortuneSheetFormat` dengan `useMemo` agar recalculate saat data berubah:
```typescript
const fortuneSheetData = useMemo(() => convertToFortuneSheetFormat(data), [data]);
```

### 2. Add useEffect untuk Update FortuneSheet
Tambahkan effect yang listen ke perubahan `data` dan update FortuneSheet:
```typescript
useEffect(() => {
  if (!workbookRef.current) return;
  
  const luckysheet = (window as any).luckysheet;
  if (!luckysheet) return;

  console.log('Updating FortuneSheet with new data');
  
  try {
    const newSheetData = convertToFortuneSheetFormat(data);
    if (newSheetData && newSheetData[0]) {
      luckysheet.setSheetData(newSheetData[0]);
      luckysheet.refresh();
    }
  } catch (error) {
    console.error('Error updating FortuneSheet:', error);
  }
}, [data]);
```

### 3. Add useMemo Import
```typescript
import { useRef, memo, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
```

## How It Works

1. User clicks Quick Action button
2. `handleApplyAction` generates changes and updates React state via `setExcelData(newData)`
3. `ExcelPreview` receives new `data` prop
4. `useMemo` recalculates `fortuneSheetData` with new data
5. `useEffect` detects data change and calls:
   - `luckysheet.setSheetData()` - updates internal data
   - `luckysheet.refresh()` - triggers re-render of spreadsheet
6. User sees updated spreadsheet with new formula/values

## Files Changed
- `src/components/dashboard/ExcelPreview.tsx` - Added useMemo and useEffect for data synchronization

## Testing
1. Hard refresh: `Ctrl + F5`
2. Click Quick Action button (e.g., "✓ Terapkan Jumlah Harga")
3. Check console:
   - "Action applied successfully: Updated 1 cell(s)"
   - "Updating FortuneSheet with new data"
4. Verify spreadsheet preview shows the new formula/value immediately
5. For SUM formula in D14, you should see the formula result displayed

## Expected Behavior
- Click button → Data updates in React state → FortuneSheet refreshes → Preview shows changes
- No need to reload page or re-upload file
- Changes are immediately visible in the spreadsheet preview

## Status
✅ Fixed - FortuneSheet now syncs with React state changes via useMemo and useEffect
