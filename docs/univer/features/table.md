# Univer Sheet - Table (Tabel)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Fitur Table memungkinkan pengguna membuat dan mengelola tabel dalam spreadsheet untuk organisasi dan presentasi data yang lebih baik. Mendukung berbagai gaya tabel dan operasi, membantu pengguna memproses dan menganalisis informasi dengan cepat.

### Fitur Utama
- ✅ Insert dan manage tabel
- ✅ Custom table styles dan themes
- ✅ Filter data dalam tabel
- ✅ Update range, nama, dan properti tabel
- ✅ Event listeners untuk operasi tabel
- ✅ Support untuk berbagai tipe filter

### Kapan Menggunakan Table
- Mengorganisir data terstruktur
- Menerapkan filter pada dataset
- Membuat laporan dengan format konsisten
- Mengelola data dengan header kolom
- Styling data dengan tema tabel

## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/preset-sheets-table
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsTablePreset } from '@univerjs/preset-sheets-table'
import UniverPresetSheetsTableEnUS from '@univerjs/preset-sheets-table/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-table/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsTableEnUS
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsTablePreset()
  ],
})
```

### Plugin Mode

```bash
npm install @univerjs/sheets-table @univerjs/sheets-table-ui
```

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { UniverSheetsTablePlugin } from '@univerjs/sheets-table'
import { UniverSheetsTableUIPlugin } from '@univerjs/sheets-table-ui'
import SheetsTableUIEnUS from '@univerjs/sheets-table-ui/locale/en-US'

import '@univerjs/sheets-table-ui/lib/index.css'
import '@univerjs/sheets-table/facade'

const univer = new Univer({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(SheetsTableUIEnUS),
  },
})

univer.registerPlugin(UniverSheetsTablePlugin)
univer.registerPlugin(UniverSheetsTableUIPlugin)
```

## API Reference

### Insert Table

#### `FWorksheet.addTable(name, range, id, options)`
Insert tabel di worksheet.

**Parameters:**
- `name` (string): Nama tabel
- `range` (IRange): Range untuk tabel
- `id` (string): ID unik tabel
- `options` (object): Konfigurasi tabel
  - `tableStyleId` (string): ID style tabel
  - `columns` (array): Definisi kolom
  - `filters` (array): Filter untuk kolom

**Returns:** `Promise<boolean>` - Success status

### Get Table

#### `FWorkbook.getTableList()`
Mendapatkan semua tabel dalam workbook.

**Returns:** `ITableInfo[]` - Array informasi tabel

#### `FWorkbook.getTableInfo(id)`
Mendapatkan informasi tabel berdasarkan ID.

**Parameters:**
- `id` (string): ID tabel

**Returns:** `ITableInfo | null` - Informasi tabel

#### `FWorkbook.getTableInfoByName(name)`
Mendapatkan informasi tabel berdasarkan nama.

**Parameters:**
- `name` (string): Nama tabel

**Returns:** `ITableInfo | null` - Informasi tabel

#### `FWorksheet.getTableByCell(row, column)`
Mendapatkan tabel berdasarkan posisi cell.

**Parameters:**
- `row` (number): Row index
- `column` (number): Column index

**Returns:** `ITableInfo | null` - Informasi tabel

### Set Filter

#### `FWorksheet.setTableFilter(id, columnIndex, filter)`
Set filter untuk kolom tabel.

**Parameters:**
- `id` (string): ID tabel
- `columnIndex` (number): Index kolom
- `filter` (object): Konfigurasi filter
  - `filterType`: Tipe filter (condition, custom, etc)
  - `filterInfo`: Detail filter

**Returns:** `Promise<boolean>` - Success status

#### `FWorksheet.resetFilter(id, columnIndex)`
Reset filter untuk kolom tabel.

**Parameters:**
- `id` (string): ID tabel
- `columnIndex` (number): Index kolom

**Returns:** `Promise<boolean>` - Success status

### Modify/Delete Table

#### `FWorksheet.removeTable(id)`
Menghapus tabel dari worksheet.

**Parameters:**
- `id` (string): ID tabel

**Returns:** `Promise<boolean>` - Success status

#### `FWorksheet.setTableRange(id, range)`
Update range tabel.

**Parameters:**
- `id` (string): ID tabel
- `range` (IRange): Range baru

**Returns:** `Promise<boolean>` - Success status

#### `FWorksheet.setTableName(id, name)`
Update nama tabel.

**Parameters:**
- `id` (string): ID tabel
- `name` (string): Nama baru

**Returns:** `Promise<boolean>` - Success status

### Add Table Theme

#### `FWorksheet.addTableTheme(id, theme)`
Menambahkan custom theme untuk tabel.

**Parameters:**
- `id` (string): ID tabel
- `theme` (object): Konfigurasi theme
  - `name` (string): Nama theme
  - `headerRowStyle` (object): Style untuk header
  - `firstRowStyle` (object): Style untuk row pertama

**Returns:** `Promise<boolean>` - Success status

## Contoh Penggunaan

### 1. Insert Table Sederhana

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Insert tabel di range B2:F11
const fRange = fWorksheet.getRange('B2:F11')
const success = await fWorksheet.addTable(
  'sales-table',
  fRange.getRange(),
  'table-001',
  {
    tableStyleId: 'table-default-4'
  }
)

if (success) {
  console.log('Table created successfully')
}
```

### 2. Insert Table dengan Kolom Custom

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()
const fRange = fWorksheet.getRange('A1:E10')

const success = await fWorksheet.addTable(
  'product-table',
  fRange.getRange(),
  'table-002',
  {
    tableStyleId: 'table-default-4',
    columns: [
      { id: 'col-1', displayName: 'Product Name' },
      { id: 'col-2', displayName: 'Price' },
      { id: 'col-3', displayName: 'Quantity' },
      { id: 'col-4', displayName: 'Total' },
      { id: 'col-5', displayName: 'Status' }
    ]
  }
)
```

### 3. Insert Table dengan Filter

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()
const fRange = fWorksheet.getRange('B2:F11')

const success = await fWorksheet.addTable(
  'filtered-table',
  fRange.getRange(),
  'table-003',
  {
    tableStyleId: 'table-default-4',
    filters: [
      {
        filterType: univerAPI.Enum.TableColumnFilterTypeEnum.condition,
        filterInfo: {
          conditionType: univerAPI.Enum.TableConditionTypeEnum.Number,
          compareType: univerAPI.Enum.TableNumberCompareTypeEnum.GreaterThan,
          expectedValue: 2
        }
      }
    ]
  }
)
```

### 4. Get dan Display Table Info

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get semua tabel
const tables = fWorkbook.getTableList()
console.log('Total tables:', tables.length)

// Get tabel by ID
const tableInfo = fWorkbook.getTableInfo('table-001')
if (tableInfo) {
  console.log('Table name:', tableInfo.name)
  console.log('Table range:', tableInfo.range)
}

// Get tabel by name
const tableByName = fWorkbook.getTableInfoByName('sales-table')
console.log('Table found:', tableByName)
```

### 5. Set Filter pada Tabel

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Set filter untuk kolom kedua (index 1)
await fWorksheet.setTableFilter('table-001', 1, {
  filterType: univerAPI.Enum.TableColumnFilterTypeEnum.condition,
  filterInfo: {
    conditionType: univerAPI.Enum.TableConditionTypeEnum.Number,
    compareType: univerAPI.Enum.TableNumberCompareTypeEnum.GreaterThan,
    expectedValue: 10
  }
})

// Reset filter setelah 3 detik
setTimeout(async () => {
  await fWorksheet.resetFilter('table-001', 1)
}, 3000)
```

### 6. Update Table Range

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Update range tabel dari B2:F11 ke B2:F21
const newRange = fWorksheet.getRange('B2:F21')
await fWorksheet.setTableRange('table-001', newRange.getRange())

console.log('Table range updated')
```

### 7. Custom Table Theme

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Tambahkan custom theme
await fWorksheet.addTableTheme('table-001', {
  name: 'table-custom-blue',
  headerRowStyle: {
    bg: {
      rgb: '#145f82'
    }
  },
  firstRowStyle: {
    bg: {
      rgb: '#c0e4f5'
    }
  }
})
```

## Custom React Hooks

### useTableManager Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

interface TableInfo {
  id: string
  name: string
  range: any
  styleId: string
}

export function useTableManager() {
  const univerAPI = useFacadeAPI()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Load semua tabel
  const loadTables = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const tableList = fWorkbook.getTableList()
    setTables(tableList)
  }, [univerAPI])

  // Create tabel baru
  const createTable = useCallback(async (
    name: string,
    range: string,
    options?: any
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(range)
      
      const tableId = `table-${Date.now()}`
      const success = await fWorksheet.addTable(
        name,
        fRange.getRange(),
        tableId,
        {
          tableStyleId: 'table-default-4',
          ...options
        }
      )

      if (success) {
        loadTables()
      }

      return success
    } catch (error) {
      console.error('Error creating table:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadTables])

  // Delete tabel
  const deleteTable = useCallback(async (tableId: string) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      
      await fWorksheet.removeTable(tableId)
      loadTables()
      return true
    } catch (error) {
      console.error('Error deleting table:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadTables])

  // Set filter
  const setFilter = useCallback(async (
    tableId: string,
    columnIndex: number,
    filter: any
  ) => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      
      return await fWorksheet.setTableFilter(tableId, columnIndex, filter)
    } catch (error) {
      console.error('Error setting filter:', error)
      return false
    }
  }, [univerAPI])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  return {
    tables,
    loading,
    createTable,
    deleteTable,
    setFilter,
    loadTables
  }
}
```

### Contoh Penggunaan Hook

```typescript
function TableManager() {
  const { tables, loading, createTable, deleteTable, setFilter } = useTableManager()

  const handleCreateTable = async () => {
    const success = await createTable('New Table', 'A1:E10', {
      columns: [
        { id: 'col-1', displayName: 'Column 1' },
        { id: 'col-2', displayName: 'Column 2' }
      ]
    })

    if (success) {
      console.log('Table created!')
    }
  }

  return (
    <div>
      <button onClick={handleCreateTable} disabled={loading}>
        Create Table
      </button>
      
      <div>
        <h3>Tables ({tables.length})</h3>
        {tables.map(table => (
          <div key={table.id}>
            <span>{table.name}</span>
            <button onClick={() => deleteTable(table.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Table Naming
```typescript
// ❌ Bad - nama tidak deskriptif
await fWorksheet.addTable('t1', range, 'id1')

// ✅ Good - nama deskriptif
await fWorksheet.addTable('sales-2024-q1', range, 'sales-2024-q1-001')
```

### 2. Table ID Management
```typescript
// ✅ Good - gunakan ID unik
const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

await fWorksheet.addTable('sales-table', range, tableId, options)
```

### 3. Error Handling
```typescript
// ✅ Good - handle errors
try {
  const success = await fWorksheet.addTable(name, range, id, options)
  
  if (!success) {
    console.error('Failed to create table')
    return
  }
  
  // Proceed with success
} catch (error) {
  console.error('Error creating table:', error)
}
```

### 4. Filter Management
```typescript
// ✅ Good - validate before setting filter
const tableInfo = fWorkbook.getTableInfo(tableId)

if (tableInfo && tableInfo.columns.length > columnIndex) {
  await fWorksheet.setTableFilter(tableId, columnIndex, filter)
}
```

### 5. Theme Consistency
```typescript
// ✅ Good - gunakan theme constants
const TABLE_THEMES = {
  DEFAULT: 'table-default-4',
  BLUE: 'table-custom-blue',
  GREEN: 'table-custom-green'
}

await fWorksheet.addTable(name, range, id, {
  tableStyleId: TABLE_THEMES.DEFAULT
})
```

## Troubleshooting

### Table tidak muncul setelah insert

**Penyebab:**
- Range tidak valid
- ID tabel sudah digunakan
- Style ID tidak ada

**Solusi:**
```typescript
// Validate range
const fRange = fWorksheet.getRange('B2:F11')
if (!fRange) {
  console.error('Invalid range')
  return
}

// Check if table ID exists
const existing = fWorkbook.getTableInfo(tableId)
if (existing) {
  console.error('Table ID already exists')
  return
}

// Use valid style ID
const success = await fWorksheet.addTable(name, range, tableId, {
  tableStyleId: 'table-default-4' // Use default style
})
```

### Filter tidak bekerja

**Penyebab:**
- Column index salah
- Filter type tidak sesuai dengan data
- Filter info tidak lengkap

**Solusi:**
```typescript
// Validate column index
const tableInfo = fWorkbook.getTableInfo(tableId)
if (!tableInfo || columnIndex >= tableInfo.columns.length) {
  console.error('Invalid column index')
  return
}

// Use correct filter type
await fWorksheet.setTableFilter(tableId, columnIndex, {
  filterType: univerAPI.Enum.TableColumnFilterTypeEnum.condition,
  filterInfo: {
    conditionType: univerAPI.Enum.TableConditionTypeEnum.Number,
    compareType: univerAPI.Enum.TableNumberCompareTypeEnum.GreaterThan,
    expectedValue: 10
  }
})
```

### Table range tidak bisa diupdate

**Penyebab:**
- Range baru overlap dengan tabel lain
- Range baru lebih kecil dari data
- Range format salah

**Solusi:**
```typescript
// Validate new range
const newRange = fWorksheet.getRange('B2:F21')
if (!newRange) {
  console.error('Invalid new range')
  return
}

// Check for overlaps
const cellTable = fWorksheet.getTableByCell(
  newRange.getRow(),
  newRange.getColumn()
)

if (cellTable && cellTable.id !== tableId) {
  console.error('Range overlaps with another table')
  return
}

// Update range
await fWorksheet.setTableRange(tableId, newRange.getRange())
```

### Custom theme tidak apply

**Penyebab:**
- Theme name sudah digunakan
- Style object tidak valid
- RGB color format salah

**Solusi:**
```typescript
// Use unique theme name
const themeName = `table-custom-${Date.now()}`

// Validate style object
await fWorksheet.addTableTheme(tableId, {
  name: themeName,
  headerRowStyle: {
    bg: {
      rgb: '#145f82' // Valid hex color
    }
  },
  firstRowStyle: {
    bg: {
      rgb: '#c0e4f5'
    }
  }
})
```

## Referensi

- [Official Table Documentation](https://docs.univer.ai/guides/sheets/features/table)
- [Facade API Reference](https://reference.univer.ai/)
- [Table Examples](https://github.com/dream-num/univer/tree/dev/examples)

---

**Related Documentation:**
- [Filter](./filter.md)
- [Sort](./sort.md)
- [Data Validation](./data-validation.md)
- [Conditional Formatting](./conditional-formatting.md)
