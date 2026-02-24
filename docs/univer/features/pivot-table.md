# Univer Sheet - Pivot Table

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Univer Sheet Pivot Table menyediakan kemampuan untuk membuat dan mengelola pivot table yang powerful untuk analisis data.

### Fitur Utama
- **Data Aggregation**: Sum, Count, Average, Min, Max, dan lainnya
- **Field Management**: Row, Column, Value, dan Filter fields
- **Sorting & Filtering**: Sort dan filter data pivot
- **Drill Down**: Eksplorasi detail data
- **Dynamic Updates**: Update otomatis saat data berubah
- **Custom Calculations**: Formula kustom untuk agregasi

### Kapan Menggunakan
- Analisis data multidimensi
- Summarize data besar
- Cross-tabulation dan reporting
- Data exploration dan discovery
- Business intelligence dashboard

### Keuntungan
- Analisis data yang cepat dan efisien
- Flexible field arrangement
- Multiple aggregation methods
- Interactive drill-down
- Real-time data updates


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/sheets-pivot @univerjs-pro/sheets-pivot-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsPivotPlugin } from '@univerjs-pro/sheets-pivot';
import { UniverSheetsPivotUIPlugin } from '@univerjs-pro/sheets-pivot-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs-pro/sheets-pivot-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register pivot table plugins
univerAPI.registerPlugin(UniverSheetsPivotPlugin);
univerAPI.registerPlugin(UniverSheetsPivotUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/sheets-pivot @univerjs-pro/sheets-pivot-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsPivotPlugin } from '@univerjs-pro/sheets-pivot';
import { UniverSheetsPivotUIPlugin } from '@univerjs-pro/sheets-pivot-ui';

const univer = new Univer();

// Register pivot table plugins
univer.registerPlugin(UniverSheetsPivotPlugin);
univer.registerPlugin(UniverSheetsPivotUIPlugin);
```

### License Configuration

Pivot Table adalah fitur Pro yang memerlukan license:

```typescript
import { UniverSheetsPivotPlugin } from '@univerjs-pro/sheets-pivot';

univer.registerPlugin(UniverSheetsPivotPlugin, {
  license: 'your-license-key',
});
```


## API Reference

### Enums

#### PivotFieldArea

```typescript
enum PivotFieldArea {
  ROW = 'row',
  COLUMN = 'column',
  VALUE = 'value',
  FILTER = 'filter',
}
```

#### SubtotalType

```typescript
enum SubtotalType {
  SUM = 'sum',
  COUNT = 'count',
  AVERAGE = 'average',
  MAX = 'max',
  MIN = 'min',
  PRODUCT = 'product',
  COUNT_NUMS = 'countNums',
  STDDEV = 'stddev',
  STDDEVP = 'stddevp',
  VAR = 'var',
  VARP = 'varp',
}
```

### FWorkbook Methods

#### addPivotTable()
Menambahkan pivot table baru.

```typescript
addPivotTable(
  sourceInfo: IPivotSourceInfo,
  positionType: PivotPositionType,
  anchorCellInfo: IAnchorCellInfo
): Promise<FPivotTable | null>
```

**Parameters**:
- `sourceInfo`: `IPivotSourceInfo` - Informasi sumber data
- `positionType`: `PivotPositionType` - Tipe posisi (NEW_SHEET | EXISTING_SHEET)
- `anchorCellInfo`: `IAnchorCellInfo` - Informasi cell anchor

**Returns**: `Promise<FPivotTable | null>` - Instance pivot table atau null

**Example**:
```typescript
const pivotTable = await workbook.addPivotTable(
  {
    unitId: workbook.getId(),
    subUnitId: worksheet.getSheetId(),
    range: 'A1:D100',
  },
  PivotPositionType.NEW_SHEET,
  { row: 0, col: 0 }
);
```

#### getPivotTableByCell()
Mendapatkan pivot table berdasarkan cell.

```typescript
getPivotTableByCell(
  unitId: string,
  subUnitId: string,
  row: number,
  col: number
): FPivotTable | null
```

**Parameters**:
- `unitId`: `string` - Workbook ID
- `subUnitId`: `string` - Worksheet ID
- `row`: `number` - Row index
- `col`: `number` - Column index

**Returns**: `FPivotTable | null` - Instance pivot table atau null


### FPivotTable Methods

#### addField()
Menambahkan field ke pivot table.

```typescript
addField(
  dataFieldIdOrIndex: string | number,
  fieldArea: PivotFieldArea,
  index?: number
): Promise<boolean>
```

**Parameters**:
- `dataFieldIdOrIndex`: `string | number` - Field ID atau index
- `fieldArea`: `PivotFieldArea` - Area field (ROW, COLUMN, VALUE, FILTER)
- `index`: `number` (optional) - Posisi insert

**Returns**: `Promise<boolean>` - True jika berhasil

#### removeField()
Menghapus field dari pivot table.

```typescript
removeField(fieldIds: string[]): Promise<boolean>
```

**Parameters**:
- `fieldIds`: `string[]` - Array field IDs yang akan dihapus

**Returns**: `Promise<boolean>` - True jika berhasil

#### setSubtotalType()
Set tipe subtotal untuk field.

```typescript
setSubtotalType(
  fieldId: string,
  subtotalType: SubtotalType
): Promise<boolean>
```

**Parameters**:
- `fieldId`: `string` - Field ID
- `subtotalType`: `SubtotalType` - Tipe subtotal

**Returns**: `Promise<boolean>` - True jika berhasil

#### setLabelSort()
Set sorting untuk field.

```typescript
setLabelSort(
  tableFieldId: string,
  info: ISortInfo
): Promise<boolean>
```

**Parameters**:
- `tableFieldId`: `string` - Field ID
- `info`: `ISortInfo` - Informasi sorting

**Returns**: `Promise<boolean>` - True jika berhasil

#### setValueFilter()
Set filter untuk value field.

```typescript
setValueFilter(
  fieldId: string,
  filterInfo: IFilterInfo
): Promise<boolean>
```

**Parameters**:
- `fieldId`: `string` - Field ID
- `filterInfo`: `IFilterInfo` - Informasi filter

**Returns**: `Promise<boolean>` - True jika berhasil

#### refresh()
Refresh pivot table data.

```typescript
refresh(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

#### remove()
Menghapus pivot table.

```typescript
remove(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil


### Events

#### BeforePivotTableAdd
Triggered sebelum pivot table ditambahkan.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforePivotTableAdd, (params) => {
  console.log('Before pivot table add:', params);
});
```

#### PivotTableAdded
Triggered setelah pivot table ditambahkan.

```typescript
univerAPI.addEvent(univerAPI.Event.PivotTableAdded, (params) => {
  console.log('Pivot table added:', params);
});
```

#### PivotTableRendered
Triggered setelah pivot table di-render.

```typescript
univerAPI.addEvent(univerAPI.Event.PivotTableRendered, (params) => {
  console.log('Pivot table rendered:', params);
});
```

#### PivotTableRemoved
Triggered setelah pivot table dihapus.

```typescript
univerAPI.addEvent(univerAPI.Event.PivotTableRemoved, (params) => {
  console.log('Pivot table removed:', params);
});
```

#### PivotTableFieldAdded
Triggered setelah field ditambahkan.

```typescript
univerAPI.addEvent(univerAPI.Event.PivotTableFieldAdded, (params) => {
  console.log('Field added:', params);
});
```

#### PivotTableFieldRemoved
Triggered setelah field dihapus.

```typescript
univerAPI.addEvent(univerAPI.Event.PivotTableFieldRemoved, (params) => {
  console.log('Field removed:', params);
});
```

### Interfaces

#### IPivotSourceInfo

```typescript
interface IPivotSourceInfo {
  unitId: string;
  subUnitId: string;
  range: string;
}
```

#### IAnchorCellInfo

```typescript
interface IAnchorCellInfo {
  row: number;
  col: number;
}
```

#### ISortInfo

```typescript
interface ISortInfo {
  order: 'asc' | 'desc';
  customList?: string[];
}
```

#### IFilterInfo

```typescript
interface IFilterInfo {
  type: 'value' | 'label' | 'date';
  condition: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: any;
}
```


## Contoh Penggunaan

### 1. Membuat Pivot Table Sederhana

```typescript
import { univerAPI } from '@univerjs/presets';
import { PivotPositionType, PivotFieldArea } from '@univerjs-pro/sheets-pivot';

const workbook = univerAPI.getActiveWorkbook();
const worksheet = workbook.getActiveSheet();

// Create pivot table
const pivotTable = await workbook.addPivotTable(
  {
    unitId: workbook.getId(),
    subUnitId: worksheet.getSheetId(),
    range: 'A1:D100', // Source data range
  },
  PivotPositionType.NEW_SHEET,
  { row: 0, col: 0 }
);

if (pivotTable) {
  console.log('Pivot table created successfully');
}
```

### 2. Menambahkan Row dan Column Fields

```typescript
// Add row field (e.g., Category)
await pivotTable.addField(
  'Category', // Field name or index
  PivotFieldArea.ROW,
  0 // Position
);

// Add column field (e.g., Region)
await pivotTable.addField(
  'Region',
  PivotFieldArea.COLUMN,
  0
);

// Add value field (e.g., Sales)
await pivotTable.addField(
  'Sales',
  PivotFieldArea.VALUE,
  0
);
```

### 3. Set Aggregation Method

```typescript
import { SubtotalType } from '@univerjs-pro/sheets-pivot';

// Set SUM for Sales field
await pivotTable.setSubtotalType('Sales', SubtotalType.SUM);

// Set AVERAGE for another field
await pivotTable.setSubtotalType('Price', SubtotalType.AVERAGE);

// Set COUNT
await pivotTable.setSubtotalType('Orders', SubtotalType.COUNT);
```

### 4. Apply Sorting

```typescript
// Sort row field ascending
await pivotTable.setLabelSort('Category', {
  order: 'asc',
});

// Sort descending
await pivotTable.setLabelSort('Region', {
  order: 'desc',
});

// Custom sort order
await pivotTable.setLabelSort('Month', {
  order: 'asc',
  customList: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
});
```

### 5. Apply Filters

```typescript
// Filter by value
await pivotTable.setValueFilter('Sales', {
  type: 'value',
  condition: 'greaterThan',
  value: 1000,
});

// Filter by label
await pivotTable.setValueFilter('Category', {
  type: 'label',
  condition: 'equals',
  value: 'Electronics',
});
```


### 6. Multiple Value Fields dengan Different Aggregations

```typescript
// Add multiple value fields
await pivotTable.addField('Sales', PivotFieldArea.VALUE, 0);
await pivotTable.addField('Quantity', PivotFieldArea.VALUE, 1);
await pivotTable.addField('Profit', PivotFieldArea.VALUE, 2);

// Set different aggregations
await pivotTable.setSubtotalType('Sales', SubtotalType.SUM);
await pivotTable.setSubtotalType('Quantity', SubtotalType.COUNT);
await pivotTable.setSubtotalType('Profit', SubtotalType.AVERAGE);
```

### 7. Add Filter Field

```typescript
// Add filter field (e.g., Year)
await pivotTable.addField('Year', PivotFieldArea.FILTER, 0);

// Apply filter
await pivotTable.setValueFilter('Year', {
  type: 'value',
  condition: 'equals',
  value: 2024,
});
```

### 8. Refresh Pivot Table

```typescript
// Refresh after source data changes
const refreshed = await pivotTable.refresh();

if (refreshed) {
  console.log('Pivot table refreshed successfully');
}
```

### 9. Remove Fields

```typescript
// Remove specific fields
await pivotTable.removeField(['OldField1', 'OldField2']);

// Get pivot table by cell and remove field
const pt = workbook.getPivotTableByCell(
  workbook.getId(),
  worksheet.getSheetId(),
  5,
  5
);

if (pt) {
  await pt.removeField(['FieldToRemove']);
}
```

### 10. Complete Sales Analysis Example

```typescript
// Source data: Date, Product, Region, Sales, Quantity
// Range: A1:E1000

const pivotTable = await workbook.addPivotTable(
  {
    unitId: workbook.getId(),
    subUnitId: worksheet.getSheetId(),
    range: 'A1:E1000',
  },
  PivotPositionType.NEW_SHEET,
  { row: 0, col: 0 }
);

if (pivotTable) {
  // Setup structure
  await pivotTable.addField('Product', PivotFieldArea.ROW, 0);
  await pivotTable.addField('Region', PivotFieldArea.COLUMN, 0);
  await pivotTable.addField('Date', PivotFieldArea.FILTER, 0);
  
  // Add value fields
  await pivotTable.addField('Sales', PivotFieldArea.VALUE, 0);
  await pivotTable.addField('Quantity', PivotFieldArea.VALUE, 1);
  
  // Set aggregations
  await pivotTable.setSubtotalType('Sales', SubtotalType.SUM);
  await pivotTable.setSubtotalType('Quantity', SubtotalType.COUNT);
  
  // Sort by product name
  await pivotTable.setLabelSort('Product', { order: 'asc' });
  
  // Filter for current year
  await pivotTable.setValueFilter('Date', {
    type: 'date',
    condition: 'greaterThan',
    value: new Date('2024-01-01'),
  });
  
  console.log('Sales analysis pivot table created');
}
```


## Custom React Hooks

### usePivotTable

Hook untuk mengelola pivot table dalam komponen React.

```typescript
import { useState, useCallback, useEffect } from 'react';
import { univerAPI } from '@univerjs/presets';
import {
  PivotPositionType,
  PivotFieldArea,
  SubtotalType,
} from '@univerjs-pro/sheets-pivot';

interface PivotTableConfig {
  sourceRange: string;
  positionType: PivotPositionType;
  anchorCell: { row: number; col: number };
}

interface UsePivotTableReturn {
  pivotTable: any | null;
  createPivotTable: (config: PivotTableConfig) => Promise<boolean>;
  addField: (fieldId: string, area: PivotFieldArea, index?: number) => Promise<boolean>;
  removeField: (fieldIds: string[]) => Promise<boolean>;
  setAggregation: (fieldId: string, type: SubtotalType) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  remove: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function usePivotTable(): UsePivotTableReturn {
  const [pivotTable, setPivotTable] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPivotTable = useCallback(async (config: PivotTableConfig) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const worksheet = workbook.getActiveSheet();
      if (!worksheet) throw new Error('No active worksheet');

      const pt = await workbook.addPivotTable(
        {
          unitId: workbook.getId(),
          subUnitId: worksheet.getSheetId(),
          range: config.sourceRange,
        },
        config.positionType,
        config.anchorCell
      );

      if (pt) {
        setPivotTable(pt);
        return true;
      }

      throw new Error('Failed to create pivot table');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pivot table';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addField = useCallback(async (
    fieldId: string,
    area: PivotFieldArea,
    index?: number
  ) => {
    if (!pivotTable) {
      setError('No pivot table available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await pivotTable.addField(fieldId, area, index);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add field';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pivotTable]);

  const removeField = useCallback(async (fieldIds: string[]) => {
    if (!pivotTable) {
      setError('No pivot table available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await pivotTable.removeField(fieldIds);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove field';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pivotTable]);

  const setAggregation = useCallback(async (
    fieldId: string,
    type: SubtotalType
  ) => {
    if (!pivotTable) {
      setError('No pivot table available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await pivotTable.setSubtotalType(fieldId, type);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set aggregation';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pivotTable]);

  const refresh = useCallback(async () => {
    if (!pivotTable) {
      setError('No pivot table available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await pivotTable.refresh();
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pivotTable]);

  const remove = useCallback(async () => {
    if (!pivotTable) {
      setError('No pivot table available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await pivotTable.remove();
      if (success) {
        setPivotTable(null);
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [pivotTable]);

  return {
    pivotTable,
    createPivotTable,
    addField,
    removeField,
    setAggregation,
    refresh,
    remove,
    loading,
    error,
  };
}
```


### Penggunaan Hook

```typescript
import React from 'react';
import { usePivotTable } from './hooks/usePivotTable';
import { PivotPositionType, PivotFieldArea, SubtotalType } from '@univerjs-pro/sheets-pivot';

export function PivotTablePanel() {
  const {
    pivotTable,
    createPivotTable,
    addField,
    setAggregation,
    refresh,
    remove,
    loading,
    error,
  } = usePivotTable();

  const handleCreatePivot = async () => {
    const success = await createPivotTable({
      sourceRange: 'A1:D100',
      positionType: PivotPositionType.NEW_SHEET,
      anchorCell: { row: 0, col: 0 },
    });

    if (success) {
      // Add fields
      await addField('Category', PivotFieldArea.ROW, 0);
      await addField('Region', PivotFieldArea.COLUMN, 0);
      await addField('Sales', PivotFieldArea.VALUE, 0);
      
      // Set aggregation
      await setAggregation('Sales', SubtotalType.SUM);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleRemove = async () => {
    await remove();
  };

  return (
    <div className="pivot-panel">
      <h3>Pivot Table Manager</h3>
      
      {error && <div className="error">{error}</div>}
      
      {!pivotTable ? (
        <button onClick={handleCreatePivot} disabled={loading}>
          Create Pivot Table
        </button>
      ) : (
        <div>
          <button onClick={handleRefresh} disabled={loading}>
            Refresh
          </button>
          <button onClick={handleRemove} disabled={loading}>
            Remove
          </button>
        </div>
      )}
      
      {loading && <div>Loading...</div>}
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Validate Source Data Range**
```typescript
// Good - Validate before creating pivot
const range = worksheet.getRange('A1:D100');
const values = range.getValues();

if (values.length > 1 && values[0].length > 0) {
  await workbook.addPivotTable(sourceInfo, positionType, anchorCell);
}
```

2. **Use Meaningful Field Names**
```typescript
// Good - Clear field names
await pivotTable.addField('ProductCategory', PivotFieldArea.ROW);
await pivotTable.addField('SalesRegion', PivotFieldArea.COLUMN);
await pivotTable.addField('TotalRevenue', PivotFieldArea.VALUE);
```

3. **Set Appropriate Aggregation Methods**
```typescript
// Good - Match aggregation to data type
await pivotTable.setSubtotalType('Revenue', SubtotalType.SUM);
await pivotTable.setSubtotalType('OrderCount', SubtotalType.COUNT);
await pivotTable.setSubtotalType('AveragePrice', SubtotalType.AVERAGE);
```

4. **Refresh After Source Data Changes**
```typescript
// Good - Refresh when data updates
const dataUpdated = await worksheet.setValues('A1:D100', newData);
if (dataUpdated) {
  await pivotTable.refresh();
}
```

5. **Handle Errors Properly**
```typescript
// Good - Comprehensive error handling
try {
  const pt = await workbook.addPivotTable(sourceInfo, positionType, anchorCell);
  if (!pt) {
    throw new Error('Pivot table creation returned null');
  }
} catch (error) {
  console.error('Pivot table error:', error);
  // Show user-friendly message
}
```

### Don'ts ❌

1. **Jangan Create Pivot Tanpa Validasi Data**
```typescript
// Bad - No validation
await workbook.addPivotTable(sourceInfo, positionType, anchorCell);

// Good - Validate first
const range = worksheet.getRange(sourceInfo.range);
if (range.getValues().length > 0) {
  await workbook.addPivotTable(sourceInfo, positionType, anchorCell);
}
```

2. **Jangan Hardcode Field Indices**
```typescript
// Bad - Magic numbers
await pivotTable.addField(0, PivotFieldArea.ROW);
await pivotTable.addField(1, PivotFieldArea.COLUMN);

// Good - Use field names
await pivotTable.addField('Category', PivotFieldArea.ROW);
await pivotTable.addField('Region', PivotFieldArea.COLUMN);
```

3. **Jangan Lupa Cleanup**
```typescript
// Bad - Memory leak
useEffect(() => {
  createPivotTable(config);
}, []);

// Good - Cleanup on unmount
useEffect(() => {
  createPivotTable(config);
  
  return () => {
    if (pivotTable) {
      pivotTable.remove();
    }
  };
}, []);
```

4. **Jangan Ignore Refresh Failures**
```typescript
// Bad
pivotTable.refresh();

// Good
const refreshed = await pivotTable.refresh();
if (!refreshed) {
  console.error('Failed to refresh pivot table');
  // Handle failure
}
```


## Troubleshooting

### Pivot Table Tidak Terbuat

**Gejala**: addPivotTable() return null

**Solusi**:
```typescript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverSheetsPivotPlugin);
univerAPI.registerPlugin(UniverSheetsPivotUIPlugin);

// 2. Pastikan license valid (Pro feature)
univer.registerPlugin(UniverSheetsPivotPlugin, {
  license: 'your-valid-license-key',
});

// 3. Validate source range
const range = worksheet.getRange('A1:D100');
const values = range.getValues();
console.log('Data rows:', values.length);

if (values.length > 1) {
  const pt = await workbook.addPivotTable(sourceInfo, positionType, anchorCell);
  console.log('Pivot table created:', pt !== null);
}
```

### Field Tidak Bisa Ditambahkan

**Gejala**: addField() return false

**Solusi**:
```typescript
// 1. Pastikan field name/index valid
const sourceRange = worksheet.getRange('A1:D1');
const headers = sourceRange.getValues()[0];
console.log('Available fields:', headers);

// 2. Use correct field identifier
if (headers.includes('Sales')) {
  await pivotTable.addField('Sales', PivotFieldArea.VALUE);
}

// 3. Check field area
// VALUE fields must be numeric
// ROW/COLUMN fields can be any type
```

### Aggregation Tidak Berubah

**Gejala**: setSubtotalType() tidak mengubah aggregation

**Solusi**:
```typescript
// 1. Pastikan field sudah ditambahkan sebagai VALUE
await pivotTable.addField('Sales', PivotFieldArea.VALUE);

// 2. Set aggregation setelah field ditambahkan
await pivotTable.setSubtotalType('Sales', SubtotalType.SUM);

// 3. Refresh pivot table
await pivotTable.refresh();
```

### Performance Issue dengan Data Besar

**Gejala**: Pivot table lambat dengan dataset besar

**Solusi**:
```typescript
// 1. Limit source data range
const MAX_ROWS = 10000;
const sourceRange = `A1:D${Math.min(lastRow, MAX_ROWS)}`;

// 2. Use filters to reduce data
await pivotTable.setValueFilter('Date', {
  type: 'date',
  condition: 'greaterThan',
  value: new Date('2024-01-01'),
});

// 3. Minimize field count
// Only add necessary fields
```

### Pivot Table Tidak Auto-Refresh

**Gejala**: Data berubah tapi pivot tidak update

**Solusi**:
```typescript
// Manual refresh required
const dataChanged = await worksheet.setValues('A1:D100', newData);

if (dataChanged) {
  const pt = workbook.getPivotTableByCell(
    workbook.getId(),
    worksheet.getSheetId(),
    0,
    0
  );
  
  if (pt) {
    await pt.refresh();
  }
}

// Or use event listener
univerAPI.addEvent(univerAPI.Event.CellValueChanged, async () => {
  if (pivotTable) {
    await pivotTable.refresh();
  }
});
```

### License Error

**Gejala**: "License required" error

**Solusi**:
```typescript
// Pivot Table adalah Pro feature
// Pastikan license valid

import { UniverSheetsPivotPlugin } from '@univerjs-pro/sheets-pivot';

univer.registerPlugin(UniverSheetsPivotPlugin, {
  license: 'your-license-key', // Get from Univer
});

// Verify license
console.log('License valid:', univer.isLicenseValid());
```

## Referensi

### Official Documentation
- [Univer Pivot Table Guide](https://docs.univer.ai/guides/sheets/features/pivot-table)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Command system dan events
- [Sheets API](../core/sheets-api.md) - Worksheet management
- [Filter](./filter.md) - Data filtering
- [Sort](./sort.md) - Data sorting

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/sheets-pivot, @univerjs-pro/sheets-pivot-ui
**License**: Pro Feature (License Required)
