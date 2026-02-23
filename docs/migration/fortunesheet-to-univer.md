# Migration Guide: FortuneSheet to Univer Sheet

## Overview

Dokumen ini menjelaskan proses migrasi dari FortuneSheet ke Univer Sheet untuk meningkatkan performa dan fitur spreadsheet.

## Why Migrate?

### FortuneSheet Limitations
- ❌ Performance issues dengan large datasets
- ❌ Limited API documentation
- ❌ Kurang aktif maintenance
- ❌ Terbatas fitur enterprise

### Univer Sheet Benefits
- ✅ Better performance dan scalability
- ✅ Rich API dan documentation
- ✅ Active development dan community
- ✅ Enterprise-grade features
- ✅ Better TypeScript support

## Prerequisites

- Node.js >= 18
- NPM >= 7
- Vite (already configured)

## Installation Steps

### 1. Install Univer Packages

```bash
npm install @univerjs/presets @univerjs/preset-sheets-core
```

### 2. Update Dependencies

Remove FortuneSheet (optional, can keep for gradual migration):
```bash
npm uninstall @fortune-sheet/react
```

### 3. Import CSS

Add to `src/main.tsx`:
```typescript
import '@univerjs/preset-sheets-core/lib/index.css';
```

## Component Structure

### Old: FortuneSheet Component

```typescript
// src/components/dashboard/ExcelPreview.tsx
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

<Workbook
  ref={workbookRef}
  data={fortuneSheetData}
  onChange={(data) => onDataChange(data)}
/>
```

### New: Univer Sheet Component

```typescript
// src/components/univer/UniverSheet.tsx
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core';
import '@univerjs/preset-sheets-core/lib/index.css';

<UniverSheet
  ref={univerSheetRef}
  initialData={workbookData}
  onChange={(data) => onDataChange(data)}
/>
```

## API Mapping

### Data Format Conversion

#### FortuneSheet Format
```typescript
const fortuneSheetData = [
  {
    name: 'Sheet1',
    celldata: [
      { r: 0, c: 0, v: { v: 'Header', m: 'Header' } },
      { r: 1, c: 0, v: { v: 'Data', m: 'Data' } },
    ],
    config: {
      columnlen: { 0: 120 },
    },
  },
];
```

#### Univer Format
```typescript
const univerData = {
  sheets: {
    sheet1: {
      id: 'sheet1',
      name: 'Sheet1',
      cellData: {
        0: {
          0: { v: 'Header' },
        },
        1: {
          0: { v: 'Data' },
        },
      },
      columnData: {
        0: { width: 120 },
      },
    },
  },
};
```

### Method Mapping

| FortuneSheet | Univer Sheet | Notes |
|--------------|--------------|-------|
| `luckysheet.getAllSheets()` | `univerAPI.getActiveWorkbook().save()` | Get all data |
| `luckysheet.getCellValue(r, c)` | `univerAPI.getActiveWorkbook().getActiveSheet().getCellValue(r, c)` | Get cell value |
| `luckysheet.setCellValue(r, c, v)` | `univerAPI.getActiveWorkbook().getActiveSheet().setCellValue(r, c, v)` | Set cell value |
| `luckysheet.resize()` | Auto-handled by Univer | Resize |

## Migration Strategy

### Phase 1: Parallel Implementation (Recommended)

1. **Keep FortuneSheet** as default
2. **Add Univer Sheet** as experimental feature
3. **Add feature flag** to switch between implementations
4. **Test thoroughly** with both implementations

```typescript
// Feature flag
const USE_UNIVER = import.meta.env.VITE_USE_UNIVER === 'true';

// Conditional rendering
{USE_UNIVER ? (
  <UniverSheet ref={sheetRef} data={data} />
) : (
  <Workbook ref={workbookRef} data={data} />
)}
```

### Phase 2: Gradual Migration

1. **Migrate read-only views** first
2. **Migrate simple editing** features
3. **Migrate complex operations** (formulas, formatting)
4. **Migrate download/export** functionality

### Phase 3: Complete Switch

1. **Remove FortuneSheet** dependency
2. **Update all references**
3. **Clean up old code**
4. **Update documentation**

## File Changes Required

### 1. ExcelPreview Component

**File**: `src/components/dashboard/ExcelPreview.tsx`

**Changes**:
- Replace `Workbook` import with `UniverSheet`
- Update data format conversion
- Update API calls
- Update ref methods

### 2. ExcelDashboard Component

**File**: `src/pages/ExcelDashboard.tsx`

**Changes**:
- Update `excelPreviewRef` type
- Update `getData()` calls
- Update download logic

### 3. FortuneSheet Operations

**File**: `src/utils/fortuneSheetOperations.ts`

**Changes**:
- Rename to `univerSheetOperations.ts`
- Update all API calls
- Update data format conversions

### 4. Vite Config

**File**: `vite.config.ts`

**Changes**:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Remove fortune-sheet chunk
        // 'fortune-sheet': ['@fortune-sheet/react'],
        
        // Add univer chunk
        'univer-sheet': ['@univerjs/presets', '@univerjs/preset-sheets-core'],
      },
    },
  },
}
```

## Data Conversion Utilities

### FortuneSheet to Univer

```typescript
export function convertFortuneSheetToUniver(fortuneData: any[]): any {
  const sheet = fortuneData[0];
  const univerSheet: any = {
    id: 'sheet1',
    name: sheet.name || 'Sheet1',
    cellData: {},
    columnData: {},
    rowData: {},
  };

  // Convert celldata
  if (sheet.celldata) {
    sheet.celldata.forEach((cell: any) => {
      if (!univerSheet.cellData[cell.r]) {
        univerSheet.cellData[cell.r] = {};
      }
      univerSheet.cellData[cell.r][cell.c] = {
        v: cell.v?.v,
        s: {
          bg: cell.v?.bg,
          fc: cell.v?.fc,
          bl: cell.v?.bl,
        },
        f: cell.v?.f,
      };
    });
  }

  // Convert column widths
  if (sheet.config?.columnlen) {
    Object.entries(sheet.config.columnlen).forEach(([col, width]) => {
      univerSheet.columnData[col] = { width };
    });
  }

  return {
    sheets: {
      sheet1: univerSheet,
    },
  };
}
```

### Univer to FortuneSheet

```typescript
export function convertUniverToFortuneSheet(univerData: any): any[] {
  const sheet = Object.values(univerData.sheets)[0] as any;
  const celldata: any[] = [];

  // Convert cellData
  Object.entries(sheet.cellData || {}).forEach(([row, cols]: [string, any]) => {
    Object.entries(cols).forEach(([col, cell]: [string, any]) => {
      celldata.push({
        r: parseInt(row),
        c: parseInt(col),
        v: {
          v: cell.v,
          m: String(cell.v),
          bg: cell.s?.bg,
          fc: cell.s?.fc,
          bl: cell.s?.bl,
          f: cell.f,
        },
      });
    });
  });

  return [
    {
      name: sheet.name || 'Sheet1',
      celldata,
      config: {
        columnlen: sheet.columnData || {},
      },
    },
  ];
}
```

## Testing Checklist

### Unit Tests
- [ ] Data format conversion
- [ ] API method calls
- [ ] Cell value get/set
- [ ] Formula calculation

### Integration Tests
- [ ] Load template
- [ ] Edit cells
- [ ] Add/delete rows
- [ ] Add/delete columns
- [ ] Apply formatting
- [ ] Download Excel

### E2E Tests
- [ ] Full workflow with Univer
- [ ] Compare output with FortuneSheet
- [ ] Performance benchmarks
- [ ] Memory usage

## Performance Comparison

### Metrics to Track

| Metric | FortuneSheet | Univer Sheet | Improvement |
|--------|--------------|--------------|-------------|
| Initial Load | TBD | TBD | TBD |
| Cell Edit | TBD | TBD | TBD |
| Formula Calc | TBD | TBD | TBD |
| Download | TBD | TBD | TBD |
| Memory Usage | TBD | TBD | TBD |

## Rollback Plan

If migration fails:

1. **Revert feature flag** to use FortuneSheet
2. **Keep Univer code** for future attempts
3. **Document issues** encountered
4. **Plan fixes** before retry

## Timeline

### Week 1: Setup & Basic Integration
- Install packages
- Create Univer component
- Add feature flag
- Basic rendering test

### Week 2: Data Conversion
- Implement conversion utilities
- Test with sample data
- Test with complex data

### Week 3: Feature Parity
- Implement all FortuneSheet features
- Test each feature
- Fix bugs

### Week 4: Testing & Optimization
- Performance testing
- Bug fixes
- Documentation

### Week 5: Production Release
- Remove feature flag
- Remove FortuneSheet
- Monitor production

## Resources

- [Univer Documentation](https://univer.ai/docs)
- [Univer GitHub](https://github.com/dream-num/univer)
- [Univer Examples](https://univer.ai/examples)
- [Migration Support](https://github.com/dream-num/univer/discussions)

## Support

For issues during migration:
- Check Univer documentation
- Search GitHub issues
- Ask in Univer Discord
- Create issue if needed

## Changelog

### 2024-02-20
- ✅ Created migration guide
- ✅ Created Univer Sheet component
- ✅ Documented API mapping
- ⏳ Pending: Install packages
- ⏳ Pending: Implement conversion utilities
- ⏳ Pending: Test basic functionality
