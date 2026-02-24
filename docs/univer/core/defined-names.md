# Univer Sheet - Defined Names (Nama Terdefinisi)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Defined Names adalah fitur yang memungkinkan pengguna memberikan nama kustom pada cell, range cell, atau formula. Dengan penamaan, pengguna dapat mereferensikan data lebih intuitif, menyederhanakan formula, dan meningkatkan keterbacaan, maintainability, dan profesionalisme worksheet.

### Fitur Utama
- ✅ Assign custom names ke cells atau ranges
- ✅ Simplify complex formula references
- ✅ Workbook-level dan worksheet-level scope
- ✅ Name Manager untuk manage semua defined names
- ✅ Cross-worksheet usage
- ✅ Formula dan reference support

### Keuntungan Menggunakan Defined Names

1. **Improves Formula Readability**: Menggunakan `TotalSales` lebih jelas daripada `A1 + A2 + A3`
2. **Simplifies Complex References**: Define `SalesData` untuk `A1:A10`, gunakan langsung dalam formula
3. **Facilitates Unified Management**: Update defined name sekali, semua formula terupdate
4. **Better Maintenance**: Lebih mudah dipahami oleh user lain

### Kapan Menggunakan Defined Names
- Formula yang kompleks dan sering digunakan
- Range data yang sering direferensikan
- Konstanta yang digunakan di banyak tempat
- Cross-worksheet references
- Dashboard dan reporting

## Instalasi

Defined Names sudah termasuk dalam Univer Sheets Core, tidak perlu instalasi tambahan.

### Preset Mode

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { createUniver } from '@univerjs/presets'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset()
  ],
})
```

### Plugin Mode

```typescript
import { Univer } from '@univerjs/core'
import { UniverSheetsPlugin } from '@univerjs/sheets'

const univer = new Univer()
univer.registerPlugin(UniverSheetsPlugin)
```

## API Reference

### Create Defined Names

#### `univerAPI.newDefinedName()`
Membuat defined name builder.

**Returns:** `FDefinedNameBuilder` - Builder instance

#### `FDefinedNameBuilder` Methods

| Method | Description |
|--------|-------------|
| `build()` | Build defined name object |
| `setName(name)` | Set nama defined name |
| `setFormula(formula)` | Set formula untuk defined name |
| `setRef(ref)` | Set reference range |
| `setComment(comment)` | Set komentar |
| `setScopeToWorksheet(sheetId)` | Set scope ke worksheet tertentu |
| `setScopeToWorkbook()` | Set scope ke seluruh workbook |

#### `FWorkbook.insertDefinedNameBuilder(builder)`
Insert defined name ke workbook.

**Parameters:**
- `builder` (ISetDefinedNameMutationParam): Defined name builder

**Returns:** `boolean` - Success status

#### `FWorkbook.insertDefinedName(name, ref)`
Quick method untuk create defined name.

**Parameters:**
- `name` (string): Nama defined name
- `ref` (string): Reference string (e.g., 'Sheet1!$A$1')

**Returns:** `boolean` - Success status

#### `FWorksheet.insertDefinedName(name, ref)`
Create defined name dengan worksheet scope.

**Parameters:**
- `name` (string): Nama defined name
- `ref` (string): Reference string

**Returns:** `boolean` - Success status

### Get Defined Names

#### `FWorkbook.getDefinedName(name)`
Get defined name by name.

**Parameters:**
- `name` (string): Nama defined name

**Returns:** `FDefinedName | null` - Defined name instance

#### `FWorkbook.getDefinedNames()`
Get semua defined names dalam workbook.

**Returns:** `FDefinedName[]` - Array of defined names

#### `FWorksheet.getDefinedNames()`
Get semua defined names available untuk worksheet.

**Returns:** `FDefinedName[]` - Array of defined names

### Modify Defined Names

#### `FWorkbook.updateDefinedNameBuilder(param)`
Update defined name.

**Parameters:**
- `param` (ISetDefinedNameMutationParam): Updated defined name param

**Returns:** `boolean` - Success status

#### `FDefinedName` Methods

| Method | Description |
|--------|-------------|
| `setName(name)` | Update nama |
| `setRef(ref)` | Update reference |
| `setFormula(formula)` | Update formula |
| `setComment(comment)` | Update komentar |
| `getFormulaOrRefString()` | Get formula atau reference string |
| `toBuilder()` | Convert ke builder untuk update |
| `delete()` | Delete defined name |

### Delete Defined Names

#### `FWorkbook.deleteDefinedName(name)`
Delete defined name by name.

**Parameters:**
- `name` (string): Nama defined name

**Returns:** `boolean` - Success status

## Contoh Penggunaan

### 1. Create Simple Defined Name

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create defined name untuk cell A1
fWorkbook.insertDefinedName('MyDefinedName', 'Sheet1!$A$1')

// Gunakan dalam formula
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('B1')
fRange.setValue('=MyDefinedName * 2')
```

### 2. Create Defined Name dengan Builder

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create dengan builder pattern
const definedNameBuilder = univerAPI.newDefinedName()
  .setName('TotalSales')
  .setRef('Sheet1!$A$1:$A$10')
  .setComment('Total sales data for Q1')
  .build()

fWorkbook.insertDefinedNameBuilder(definedNameBuilder)

// Gunakan dalam formula
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('B1').setValue('=SUM(TotalSales)')
```

### 3. Create Defined Name dengan Formula

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create defined name dengan formula
const builder = univerAPI.newDefinedName()
  .setName('TaxRate')
  .setFormula('=0.15')
  .setComment('Standard tax rate')
  .build()

fWorkbook.insertDefinedNameBuilder(builder)

// Gunakan dalam calculation
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('C1').setValue('=A1 * TaxRate')
```

### 4. Worksheet-Level Defined Name

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Create defined name hanya untuk worksheet ini
fWorksheet.insertDefinedName('LocalData', '$B$1:$B$10')

// Defined name ini hanya bisa digunakan di worksheet ini
fWorksheet.getRange('C1').setValue('=SUM(LocalData)')
```

### 5. Get dan Display Defined Names

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get semua defined names
const definedNames = fWorkbook.getDefinedNames()

console.log('Total defined names:', definedNames.length)

definedNames.forEach(name => {
  console.log('Name:', name.getName())
  console.log('Reference:', name.getFormulaOrRefString())
  console.log('Comment:', name.getComment())
})
```

### 6. Get Specific Defined Name

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get by name
const definedName = fWorkbook.getDefinedName('TotalSales')

if (definedName) {
  console.log('Found:', definedName.getFormulaOrRefString())
} else {
  console.log('Defined name not found')
}
```

### 7. Update Defined Name

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get existing defined name
const definedName = fWorkbook.getDefinedName('TotalSales')

if (definedName) {
  // Method 1: Direct update
  definedName.setName('TotalRevenue')
  definedName.setRef('Sheet1!$A$1:$A$20')
  
  // Method 2: Using builder
  const updatedParam = definedName.toBuilder()
    .setName('TotalRevenue')
    .setRef('Sheet1!$A$1:$A$20')
    .setComment('Updated to include all revenue')
    .build()
  
  fWorkbook.updateDefinedNameBuilder(updatedParam)
}
```

### 8. Delete Defined Name

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Method 1: Delete by name
fWorkbook.deleteDefinedName('TotalSales')

// Method 2: Delete using instance
const definedName = fWorkbook.getDefinedName('TotalRevenue')
if (definedName) {
  definedName.delete()
}
```

### 9. Complex Formula with Defined Names

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create multiple defined names
fWorkbook.insertDefinedName('Revenue', 'Sheet1!$A$1:$A$10')
fWorkbook.insertDefinedName('Costs', 'Sheet1!$B$1:$B$10')
fWorkbook.insertDefinedName('TaxRate', 'Sheet1!$C$1')

// Use in complex formula
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('D1').setValue(
  '=(SUM(Revenue) - SUM(Costs)) * (1 - TaxRate)'
)
```

### 10. Cross-Worksheet Defined Names

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create defined names dari berbagai sheets
const builder1 = univerAPI.newDefinedName()
  .setName('Sheet1Data')
  .setRef('Sheet1!$A$1:$A$10')
  .build()

const builder2 = univerAPI.newDefinedName()
  .setName('Sheet2Data')
  .setRef('Sheet2!$A$1:$A$10')
  .build()

fWorkbook.insertDefinedNameBuilder(builder1)
fWorkbook.insertDefinedNameBuilder(builder2)

// Gunakan di sheet manapun
const fWorksheet = fWorkbook.getSheetByName('Sheet3')
fWorksheet.getRange('A1').setValue('=SUM(Sheet1Data) + SUM(Sheet2Data)')
```

## Custom React Hooks

### useDefinedNames Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

interface DefinedNameInfo {
  name: string
  reference: string
  comment: string
  scope: 'workbook' | 'worksheet'
}

export function useDefinedNames() {
  const univerAPI = useFacadeAPI()
  const [definedNames, setDefinedNames] = useState<DefinedNameInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Load semua defined names
  const loadDefinedNames = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const names = fWorkbook.getDefinedNames()
    
    const nameInfos = names.map(name => ({
      name: name.getName(),
      reference: name.getFormulaOrRefString(),
      comment: name.getComment() || '',
      scope: name.getScope() === 'workbook' ? 'workbook' : 'worksheet'
    }))
    
    setDefinedNames(nameInfos)
  }, [univerAPI])

  // Create defined name
  const createDefinedName = useCallback((
    name: string,
    ref: string,
    comment?: string,
    scope: 'workbook' | 'worksheet' = 'workbook'
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      
      if (scope === 'workbook') {
        const builder = univerAPI.newDefinedName()
          .setName(name)
          .setRef(ref)
        
        if (comment) {
          builder.setComment(comment)
        }
        
        const success = fWorkbook.insertDefinedNameBuilder(builder.build())
        
        if (success) {
          loadDefinedNames()
        }
        
        return success
      } else {
        const fWorksheet = fWorkbook.getActiveSheet()
        const success = fWorksheet.insertDefinedName(name, ref)
        
        if (success) {
          loadDefinedNames()
        }
        
        return success
      }
    } catch (error) {
      console.error('Error creating defined name:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadDefinedNames])

  // Update defined name
  const updateDefinedName = useCallback((
    oldName: string,
    newName: string,
    newRef?: string,
    newComment?: string
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const definedName = fWorkbook.getDefinedName(oldName)
      
      if (!definedName) return false
      
      const builder = definedName.toBuilder()
        .setName(newName)
      
      if (newRef) {
        builder.setRef(newRef)
      }
      
      if (newComment) {
        builder.setComment(newComment)
      }
      
      const success = fWorkbook.updateDefinedNameBuilder(builder.build())
      
      if (success) {
        loadDefinedNames()
      }
      
      return success
    } catch (error) {
      console.error('Error updating defined name:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadDefinedNames])

  // Delete defined name
  const deleteDefinedName = useCallback((name: string) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const success = fWorkbook.deleteDefinedName(name)
      
      if (success) {
        loadDefinedNames()
      }
      
      return success
    } catch (error) {
      console.error('Error deleting defined name:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadDefinedNames])

  // Check if name exists
  const nameExists = useCallback((name: string) => {
    if (!univerAPI) return false

    const fWorkbook = univerAPI.getActiveWorkbook()
    const definedName = fWorkbook.getDefinedName(name)
    
    return definedName !== null
  }, [univerAPI])

  useEffect(() => {
    loadDefinedNames()
  }, [loadDefinedNames])

  return {
    definedNames,
    loading,
    createDefinedName,
    updateDefinedName,
    deleteDefinedName,
    nameExists,
    loadDefinedNames
  }
}
```

### Contoh Penggunaan Hook

```typescript
function DefinedNameManager() {
  const {
    definedNames,
    loading,
    createDefinedName,
    updateDefinedName,
    deleteDefinedName,
    nameExists
  } = useDefinedNames()
  
  const [name, setName] = useState('')
  const [reference, setReference] = useState('')
  const [comment, setComment] = useState('')

  const handleCreate = () => {
    if (!name || !reference) return

    if (nameExists(name)) {
      alert('Name already exists!')
      return
    }

    const success = createDefinedName(name, reference, comment)
    
    if (success) {
      setName('')
      setReference('')
      setComment('')
      console.log('Defined name created!')
    }
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g., TotalSales)"
        />
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Reference (e.g., Sheet1!$A$1:$A$10)"
        />
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional)"
        />
        <button onClick={handleCreate} disabled={loading}>
          Create Defined Name
        </button>
      </div>
      
      <div>
        <h3>Defined Names ({definedNames.length})</h3>
        {definedNames.map(dn => (
          <div key={dn.name}>
            <strong>{dn.name}</strong>: {dn.reference}
            {dn.comment && <span> - {dn.comment}</span>}
            <span> ({dn.scope})</span>
            <button onClick={() => deleteDefinedName(dn.name)}>
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

### 1. Naming Conventions
```typescript
// ❌ Bad - tidak deskriptif, sulit dipahami
fWorkbook.insertDefinedName('d1', 'Sheet1!$A$1')
fWorkbook.insertDefinedName('x', 'Sheet1!$B$1:$B$10')

// ✅ Good - deskriptif dan meaningful
fWorkbook.insertDefinedName('TotalRevenue', 'Sheet1!$A$1')
fWorkbook.insertDefinedName('MonthlySales', 'Sheet1!$B$1:$B$10')
fWorkbook.insertDefinedName('TaxRate', 'Sheet1!$C$1')
```

### 2. Use Constants
```typescript
// ✅ Good - define constants sebagai defined names
const DEFINED_NAMES = {
  TAX_RATE: 'TaxRate',
  TOTAL_SALES: 'TotalSales',
  DISCOUNT_RATE: 'DiscountRate'
}

fWorkbook.insertDefinedName(DEFINED_NAMES.TAX_RATE, 'Sheet1!$A$1')
```

### 3. Validate Names
```typescript
// ✅ Good - validate before creating
function isValidDefinedName(name: string): boolean {
  // Cannot start with number
  if (/^\d/.test(name)) return false
  
  // Cannot contain spaces or special characters
  if (/[^a-zA-Z0-9_]/.test(name)) return false
  
  // Cannot be empty
  if (name.length === 0) return false
  
  return true
}

const name = 'TotalSales'
if (isValidDefinedName(name)) {
  fWorkbook.insertDefinedName(name, 'Sheet1!$A$1')
}
```

### 4. Check Existence Before Creating
```typescript
// ✅ Good - check if name exists
const name = 'TotalSales'
const existing = fWorkbook.getDefinedName(name)

if (existing) {
  console.log('Name already exists, updating...')
  existing.setRef('Sheet1!$A$1:$A$20')
} else {
  fWorkbook.insertDefinedName(name, 'Sheet1!$A$1:$A$10')
}
```

### 5. Add Comments
```typescript
// ✅ Good - add descriptive comments
const builder = univerAPI.newDefinedName()
  .setName('QuarterlyRevenue')
  .setRef('Sheet1!$A$1:$A$4')
  .setComment('Q1-Q4 revenue data for 2024')
  .build()

fWorkbook.insertDefinedNameBuilder(builder)
```

### 6. Use Absolute References
```typescript
// ❌ Bad - relative reference
fWorkbook.insertDefinedName('Data', 'Sheet1!A1:A10')

// ✅ Good - absolute reference
fWorkbook.insertDefinedName('Data', 'Sheet1!$A$1:$A$10')
```

### 7. Scope Management
```typescript
// ✅ Good - use appropriate scope
// Workbook-level untuk data yang digunakan di banyak sheets
fWorkbook.insertDefinedName('GlobalTaxRate', 'Config!$A$1')

// Worksheet-level untuk data lokal
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.insertDefinedName('LocalData', '$B$1:$B$10')
```

## Troubleshooting

### Defined name tidak bisa dibuat

**Penyebab:**
- Nama tidak valid (dimulai dengan angka, mengandung spasi)
- Nama sudah digunakan
- Reference format salah

**Solusi:**
```typescript
// Validate name
function validateDefinedName(name: string, ref: string) {
  // Check name format
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    console.error('Invalid name format')
    return false
  }
  
  // Check if exists
  const fWorkbook = univerAPI.getActiveWorkbook()
  if (fWorkbook.getDefinedName(name)) {
    console.error('Name already exists')
    return false
  }
  
  // Check reference format
  if (!ref.includes('!')) {
    console.error('Invalid reference format')
    return false
  }
  
  return true
}

if (validateDefinedName('TotalSales', 'Sheet1!$A$1')) {
  fWorkbook.insertDefinedName('TotalSales', 'Sheet1!$A$1')
}
```

### Formula dengan defined name tidak bekerja

**Penyebab:**
- Defined name tidak ada
- Scope salah (worksheet vs workbook)
- Reference tidak valid

**Solusi:**
```typescript
// Check if defined name exists
const fWorkbook = univerAPI.getActiveWorkbook()
const definedName = fWorkbook.getDefinedName('TotalSales')

if (!definedName) {
  console.error('Defined name not found')
  // Create it
  fWorkbook.insertDefinedName('TotalSales', 'Sheet1!$A$1:$A$10')
}

// Verify reference
console.log('Reference:', definedName.getFormulaOrRefString())

// Use in formula
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('B1').setValue('=SUM(TotalSales)')
```

### Update defined name tidak berhasil

**Penyebab:**
- Defined name tidak ditemukan
- New name sudah digunakan
- Builder tidak di-build

**Solusi:**
```typescript
// Validate before update
const fWorkbook = univerAPI.getActiveWorkbook()
const definedName = fWorkbook.getDefinedName('OldName')

if (!definedName) {
  console.error('Defined name not found')
  return
}

// Check if new name exists
const newNameExists = fWorkbook.getDefinedName('NewName')
if (newNameExists) {
  console.error('New name already exists')
  return
}

// Update with builder
const updatedParam = definedName.toBuilder()
  .setName('NewName')
  .setRef('Sheet1!$A$1:$A$20')
  .build() // Don't forget to build!

fWorkbook.updateDefinedNameBuilder(updatedParam)
```

### Circular reference error

**Penyebab:**
- Defined name mereferensikan dirinya sendiri
- Chain of references yang circular

**Solusi:**
```typescript
// ❌ Bad - circular reference
fWorkbook.insertDefinedName('A', 'Sheet1!$B$1')
fWorkbook.insertDefinedName('B', 'Sheet1!$A$1')
// Formula: =A akan error karena A → B → A

// ✅ Good - avoid circular references
fWorkbook.insertDefinedName('BaseValue', 'Sheet1!$A$1')
fWorkbook.insertDefinedName('CalculatedValue', 'Sheet1!$B$1')
// Formula: =BaseValue * 2 di B1 tidak circular
```

## Referensi

- [Official Defined Names Documentation](https://docs.univer.ai/guides/sheets/features/core/defined-names)
- [Facade API Reference](https://reference.univer.ai/)
- [Formula Documentation](./formula.md)

---

**Related Documentation:**
- [Formula](./formula.md)
- [Sheets API](./sheets-api.md)
- [General API](./general-api.md)
