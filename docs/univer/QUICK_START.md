# Quick Start - Univer Sheet Integration

## Ringkasan Dokumentasi

Saya telah membuat dokumentasi lengkap untuk integrasi Univer Sheet berdasarkan dokumentasi resmi. Berikut adalah struktur dokumentasi yang telah dibuat:

### 📚 Dokumentasi yang Telah Dibuat

1. **README.md** - Overview dan navigasi dokumentasi
2. **core/general-api.md** - Command system, events, clipboard, formulas
3. **core/sheets-api.md** - Workbook & worksheet management
4. **integration/README.md** - Panduan integrasi dengan project
5. **IMPLEMENTATION_PLAN.md** - Rencana implementasi detail
6. **QUICK_START.md** - Dokumen ini

### 🎯 Fitur Utama yang Didokumentasikan

#### Core Features
- ✅ Command System (execute, listen, cancel)
- ✅ Event System (40+ events)
- ✅ Workbook Management (create, get, delete)
- ✅ Worksheet Management (create, activate, copy, delete)
- ✅ Cell Operations (get, set, edit)
- ✅ Range & Selection
- ✅ Formula Engine
- ✅ Number Formatting
- ✅ Row & Column Operations
- ✅ Freeze Panes
- ✅ Permission Control

#### Advanced Features
- ✅ Data Filtering
- ✅ Data Validation
- ✅ Conditional Formatting
- ✅ Import/Export XLSX
- ✅ Collaboration (server-based)

## Langkah Implementasi

### Step 1: Baca Dokumentasi Core

Mulai dengan memahami konsep dasar:

```bash
# Baca dokumentasi ini secara berurutan:
1. docs/univer/README.md
2. docs/univer/core/general-api.md
3. docs/univer/core/sheets-api.md
```

**Key Concepts**:
- Command System: Semua operasi melalui command untuk undo/redo support
- Event System: 40+ events untuk monitoring perubahan
- Lifecycle: Tunggu `Steady` stage sebelum operasi kompleks

### Step 2: Review Current Implementation

```bash
# File yang perlu direview:
1. src/components/univer/UniverSheet.tsx
2. src/utils/univerSheetConversion.ts
3. src/pages/UniverTest.tsx
```

**Current State**:
- ✅ Basic setup working
- ✅ Data conversion utilities
- ⚠️ Need refactoring (too much logic in component)
- ⚠️ Limited event handling
- ⚠️ No custom formulas
- ⚠️ No permission management

### Step 3: Follow Integration Guide

```bash
# Baca panduan integrasi:
docs/univer/integration/README.md
```

**Recommended Approach**:
1. Create custom hooks (useUniverAPI, useUniverEvents, etc.)
2. Refactor UniverSheet component
3. Add type safety
4. Implement features incrementally

### Step 4: Implement Phase by Phase

Ikuti rencana implementasi:

```bash
# Baca rencana detail:
docs/univer/IMPLEMENTATION_PLAN.md
```

**Phases**:
1. **Week 1**: Architecture Refactoring
2. **Week 2**: Core Features Enhancement
3. **Week 3**: Advanced Features (Part 1)
4. **Week 4**: Advanced Features (Part 2) + Testing

## Quick Examples

### Example 1: Basic Usage

```typescript
import UniverSheet, { UniverSheetHandle } from '@/components/univer/UniverSheet'

function MyComponent() {
  const sheetRef = useRef<UniverSheetHandle>(null)

  const handleSave = async () => {
    const data = await sheetRef.current?.getWorkbookData()
    console.log('Workbook data:', data)
  }

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <UniverSheet
        ref={sheetRef}
        initialData={myData}
        onChange={(data) => console.log('Changed:', data)}
        height="600px"
      />
    </div>
  )
}
```

### Example 2: With Custom Events (After Refactoring)

```typescript
import { UniverSheet } from '@/components/univer/UniverSheet'

function MyComponent() {
  const handleCellChange = (event: CellChangeEvent) => {
    console.log('Cell changed:', event)
  }

  const handleSelectionChange = (event: SelectionChangeEvent) => {
    console.log('Selection changed:', event)
  }

  return (
    <UniverSheet
      initialData={myData}
      onCellChange={handleCellChange}
      onSelectionChange={handleSelectionChange}
    />
  )
}
```

### Example 3: With Custom Formulas (After Implementation)

```typescript
import { UniverSheet } from '@/components/univer/UniverSheet'
import { useUniverFormulas } from '@/components/univer/hooks/useUniverFormulas'

function MyComponent() {
  const { registerCustomFormulas } = useUniverFormulas()

  useEffect(() => {
    registerCustomFormulas([
      {
        name: 'MYSUM',
        fn: (...args) => args.reduce((a, b) => a + b, 0),
        description: 'My custom sum function',
      },
    ])
  }, [])

  return <UniverSheet initialData={myData} />
}
```

### Example 4: With Permission Control (After Implementation)

```typescript
import { UniverSheet } from '@/components/univer/UniverSheet'
import { useUniverPermissions } from '@/components/univer/hooks/useUniverPermissions'

function MyComponent() {
  const { setWorkbookReadOnly, protectRange } = useUniverPermissions()

  const handleProtect = async () => {
    // Set workbook to read-only
    await setWorkbookReadOnly()

    // Or protect specific range
    await protectRange('A1:B10', {
      allowEdit: false,
      allowViewByOthers: true,
    })
  }

  return (
    <div>
      <button onClick={handleProtect}>Protect</button>
      <UniverSheet initialData={myData} />
    </div>
  )
}
```

## Common Patterns

### Pattern 1: Wait for Lifecycle Ready

```typescript
const univerAPI = FUniver.newAPI(univer)

const disposable = univerAPI.addEvent(
  univerAPI.Event.LifeCycleChanged,
  ({ stage }) => {
    if (stage === univerAPI.Enum.LifecycleStages.Steady) {
      // Now safe to perform operations
      const workbook = univerAPI.getActiveWorkbook()
      // ...
      disposable.dispose()
    }
  }
)
```

### Pattern 2: Event Cleanup

```typescript
useEffect(() => {
  if (!univerAPI) return

  const disposables: Array<{ dispose: () => void }> = []

  // Register events
  disposables.push(
    univerAPI.addEvent(univerAPI.Event.CellClicked, handleCellClick)
  )
  disposables.push(
    univerAPI.addEvent(univerAPI.Event.SelectionChanged, handleSelectionChange)
  )

  // Cleanup
  return () => {
    disposables.forEach(d => d.dispose())
  }
}, [univerAPI])
```

### Pattern 3: Safe Operations

```typescript
const setCellValue = async (row: number, col: number, value: any) => {
  const workbook = univerAPI?.getActiveWorkbook()
  if (!workbook) {
    console.error('No active workbook')
    return
  }

  const worksheet = workbook.getActiveSheet()
  if (!worksheet) {
    console.error('No active worksheet')
    return
  }

  try {
    await worksheet.getRange(row, col).setValue(value)
  } catch (error) {
    console.error('Failed to set cell value:', error)
  }
}
```

## Best Practices

### 1. Lifecycle Management
```typescript
// ❌ Bad: Immediate operation
const workbook = univerAPI.createWorkbook(data)
workbook.getActiveSheet().getRange('A1').setValue('Hello')

// ✅ Good: Wait for lifecycle
univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, ({ stage }) => {
  if (stage === univerAPI.Enum.LifecycleStages.Steady) {
    const workbook = univerAPI.createWorkbook(data)
    workbook.getActiveSheet().getRange('A1').setValue('Hello')
  }
})
```

### 2. Event Cleanup
```typescript
// ❌ Bad: No cleanup
univerAPI.addEvent(univerAPI.Event.CellClicked, handleClick)

// ✅ Good: Proper cleanup
const disposable = univerAPI.addEvent(univerAPI.Event.CellClicked, handleClick)
// Later...
disposable.dispose()
```

### 3. Error Handling
```typescript
// ❌ Bad: No error handling
const value = worksheet.getRange('A1').getValue()

// ✅ Good: With error handling
try {
  const value = worksheet.getRange('A1').getValue()
  console.log('Value:', value)
} catch (error) {
  console.error('Failed to get cell value:', error)
}
```

### 4. Type Safety
```typescript
// ❌ Bad: No types
const handleCellChange = (params: any) => {
  console.log(params.row, params.col)
}

// ✅ Good: With types
interface CellChangeEvent {
  row: number
  col: number
  oldValue: any
  newValue: any
}

const handleCellChange = (params: CellChangeEvent) => {
  console.log(params.row, params.col)
}
```

## Troubleshooting

### Issue 1: Operations Not Working
**Problem**: Operations like `setValue()` not working

**Solution**: Wait for lifecycle to be ready
```typescript
univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, ({ stage }) => {
  if (stage === univerAPI.Enum.LifecycleStages.Steady) {
    // Now operations will work
  }
})
```

### Issue 2: Memory Leaks
**Problem**: Memory usage increasing over time

**Solution**: Dispose listeners and instances
```typescript
// Dispose event listeners
disposable.dispose()

// Dispose workbook
univerAPI.disposeUnit(unitId)

// Dispose univer instance
univer.dispose()
```

### Issue 3: Type Errors
**Problem**: TypeScript errors with Univer types

**Solution**: Import correct types
```typescript
import type { IWorkbookData, ICellData, IRange } from '@univerjs/core'
import type { FUniver } from '@univerjs/core/facade'
```

## Next Steps

1. ✅ **Baca dokumentasi lengkap** di `docs/univer/`
2. ⏳ **Review current implementation** di `src/components/univer/`
3. ⏳ **Follow integration guide** di `docs/univer/integration/README.md`
4. ⏳ **Implement phase 1** (Architecture Refactoring)
5. ⏳ **Test dan iterate**

## Resources

### Documentation
- [Main README](./README.md)
- [General API](./core/general-api.md)
- [Sheets API](./core/sheets-api.md)
- [Integration Guide](./integration/README.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)

### Official Resources
- [Univer Docs](https://docs.univer.ai/)
- [Facade API Reference](https://reference.univer.ai/)
- [GitHub](https://github.com/dream-num/univer)

### Support
- [GitHub Issues](https://github.com/dream-num/univer/issues)
- [Discord Community](https://discord.gg/univer)

## Checklist

### Documentation Review
- [ ] Baca README.md
- [ ] Baca core/general-api.md
- [ ] Baca core/sheets-api.md
- [ ] Baca integration/README.md
- [ ] Baca IMPLEMENTATION_PLAN.md

### Current Code Review
- [ ] Review UniverSheet.tsx
- [ ] Review univerSheetConversion.ts
- [ ] Review UniverTest.tsx
- [ ] Identify improvement areas

### Implementation
- [ ] Create hooks structure
- [ ] Implement useUniverAPI
- [ ] Implement useUniverEvents
- [ ] Refactor UniverSheet component
- [ ] Add type definitions
- [ ] Write tests

### Testing
- [ ] Unit tests for hooks
- [ ] Integration tests for component
- [ ] E2E tests for workflows
- [ ] Performance testing

### Documentation
- [ ] Update API documentation
- [ ] Add usage examples
- [ ] Create migration guide
- [ ] Document best practices

---

**Status**: Dokumentasi lengkap telah dibuat. Siap untuk implementasi.

**Last Updated**: 2024
