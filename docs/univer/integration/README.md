# Panduan Integrasi Univer Sheet

## Overview

Dokumen ini menjelaskan bagaimana mengintegrasikan fitur-fitur Univer Sheet yang telah didokumentasikan ke dalam project ini.

## Status Integrasi Saat Ini

### ✅ Sudah Terimplementasi
- Basic Univer Sheet setup
- Workbook dan Worksheet management
- Cell value operations
- Basic styling

### 🔄 Perlu Penyesuaian
- Event handling yang lebih komprehensif
- Custom formula registration
- Permission management
- Data validation
- Conditional formatting
- Import/Export functionality

### ❌ Belum Terimplementasi
- Collaboration features
- Advanced filtering
- Pivot tables
- Charts

## Struktur File Project

```
src/
├── components/
│   └── univer/
│       ├── UniverSheet.tsx          # Main component
│       ├── UniverSheetConfig.ts     # Configuration
│       └── hooks/
│           ├── useUniverAPI.ts      # API hooks
│           ├── useUniverEvents.ts   # Event handling
│           └── useUniverFormulas.ts # Custom formulas
├── utils/
│   └── univerSheetConversion.ts     # Data conversion
└── types/
    └── univer.ts                    # Type definitions
```

## Rekomendasi Penyesuaian

### 1. Refactor UniverSheet Component

**File**: `src/components/univer/UniverSheet.tsx`

#### Masalah Saat Ini:
- Terlalu banyak logic dalam satu component
- Event handling tidak terstruktur
- Tidak ada separation of concerns

#### Solusi:
```typescript
// src/components/univer/UniverSheet.tsx
import { useUniverAPI } from './hooks/useUniverAPI'
import { useUniverEvents } from './hooks/useUniverEvents'
import { useUniverFormulas } from './hooks/useUniverFormulas'

export const UniverSheet: React.FC<UniverSheetProps> = (props) => {
  const { univerAPI, isReady } = useUniverAPI(props.config)
  const { setupEvents } = useUniverEvents(univerAPI)
  const { registerCustomFormulas } = useUniverFormulas(univerAPI)

  useEffect(() => {
    if (!isReady) return

    // Setup events
    const cleanup = setupEvents({
      onCellChange: props.onCellChange,
      onSelectionChange: props.onSelectionChange,
    })

    // Register custom formulas
    registerCustomFormulas()

    return cleanup
  }, [isReady])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
```

### 2. Create Custom Hooks

#### useUniverAPI Hook

**File**: `src/components/univer/hooks/useUniverAPI.ts`

```typescript
import { useState, useEffect, useRef } from 'react'
import { FUniver } from '@univerjs/core/facade'
import type { Univer } from '@univerjs/core'

export const useUniverAPI = (config: UniverConfig) => {
  const [univerAPI, setUniverAPI] = useState<FUniver | null>(null)
  const [isReady, setIsReady] = useState(false)
  const univerRef = useRef<Univer | null>(null)

  useEffect(() => {
    // Initialize Univer
    const univer = createUniver(config)
    univerRef.current = univer

    const api = FUniver.newAPI(univer)
    setUniverAPI(api)

    // Wait for lifecycle ready
    const disposable = api.addEvent(
      api.Event.LifeCycleChanged,
      ({ stage }) => {
        if (stage === api.Enum.LifecycleStages.Steady) {
          setIsReady(true)
          disposable.dispose()
        }
      }
    )

    return () => {
      univer.dispose()
    }
  }, [])

  return { univerAPI, isReady, univer: univerRef.current }
}
```

#### useUniverEvents Hook

**File**: `src/components/univer/hooks/useUniverEvents.ts`

```typescript
import { useCallback } from 'react'
import type { FUniver } from '@univerjs/core/facade'

interface EventHandlers {
  onCellChange?: (params: any) => void
  onSelectionChange?: (params: any) => void
  onBeforeEdit?: (params: any) => boolean
}

export const useUniverEvents = (univerAPI: FUniver | null) => {
  const setupEvents = useCallback((handlers: EventHandlers) => {
    if (!univerAPI) return () => {}

    const disposables: Array<{ dispose: () => void }> = []

    // Cell value changed
    if (handlers.onCellChange) {
      const d = univerAPI.addEvent(
        univerAPI.Event.SheetValueChanged,
        handlers.onCellChange
      )
      disposables.push(d)
    }

    // Selection changed
    if (handlers.onSelectionChange) {
      const d = univerAPI.addEvent(
        univerAPI.Event.SelectionChanged,
        handlers.onSelectionChange
      )
      disposables.push(d)
    }

    // Before edit
    if (handlers.onBeforeEdit) {
      const d = univerAPI.addEvent(
        univerAPI.Event.BeforeSheetEditStart,
        (params) => {
          const shouldAllow = handlers.onBeforeEdit!(params)
          if (!shouldAllow) {
            params.cancel = true
          }
        }
      )
      disposables.push(d)
    }

    // Cleanup function
    return () => {
      disposables.forEach(d => d.dispose())
    }
  }, [univerAPI])

  return { setupEvents }
}
```

#### useUniverFormulas Hook

**File**: `src/components/univer/hooks/useUniverFormulas.ts`

```typescript
import { useCallback } from 'react'
import type { FUniver } from '@univerjs/core/facade'

export const useUniverFormulas = (univerAPI: FUniver | null) => {
  const registerCustomFormulas = useCallback(() => {
    if (!univerAPI) return

    const formulaEngine = univerAPI.getFormula()

    // Register CUSTOMSUM formula
    formulaEngine.registerFunction(
      'CUSTOMSUM',
      (...variants) => {
        let sum = 0
        for (const variant of variants) {
          sum += Number(variant) || 0
        }
        return sum
      },
      {
        description: {
          functionName: 'CUSTOMSUM',
          description: 'Custom sum function',
          abstract: 'Adds numbers',
          functionParameter: [
            {
              name: 'number1',
              detail: 'First number',
              example: 'A1',
              require: 1,
              repeat: 0,
            },
          ],
        },
        locales: {
          enUS: {
            formulaCustom: {
              CUSTOMSUM: {
                description: 'Adds its arguments',
                abstract: 'Adds numbers',
                functionParameter: {
                  number1: {
                    name: 'number1',
                    detail: 'The first number to add',
                  },
                },
              },
            },
          },
        },
      }
    )
  }, [univerAPI])

  return { registerCustomFormulas }
}
```

### 3. Improve Data Conversion

**File**: `src/utils/univerSheetConversion.ts`

#### Tambahkan Type Safety

```typescript
import type { IWorkbookData, ICellData } from '@univerjs/core'

export interface ConversionOptions {
  preserveFormulas?: boolean
  preserveStyles?: boolean
  preserveMerges?: boolean
}

export const convertToUniverFormat = (
  data: any,
  options: ConversionOptions = {}
): IWorkbookData => {
  const {
    preserveFormulas = true,
    preserveStyles = true,
    preserveMerges = true,
  } = options

  // Implementation dengan type safety
  return {
    id: data.id || generateId(),
    name: data.name || 'Untitled',
    sheets: convertSheets(data.sheets, options),
  }
}

const convertSheets = (sheets: any, options: ConversionOptions) => {
  // Implementation
}

const convertCellData = (cell: any, options: ConversionOptions): ICellData => {
  const cellData: ICellData = {}

  // Value
  if (cell.v !== undefined) {
    cellData.v = cell.v
  }

  // Formula
  if (options.preserveFormulas && cell.f) {
    cellData.f = cell.f
  }

  // Style
  if (options.preserveStyles && cell.s) {
    cellData.s = cell.s
  }

  return cellData
}
```

### 4. Add Permission Management

**File**: `src/components/univer/hooks/useUniverPermissions.ts`

```typescript
import { useCallback } from 'react'
import type { FUniver } from '@univerjs/core/facade'

export const useUniverPermissions = (univerAPI: FUniver | null) => {
  const setWorkbookReadOnly = useCallback(async () => {
    if (!univerAPI) return

    const workbook = univerAPI.getActiveWorkbook()
    const permission = workbook.getWorkbookPermission()

    await permission.setReadOnly()
  }, [univerAPI])

  const setWorkbookEditable = useCallback(async () => {
    if (!univerAPI) return

    const workbook = univerAPI.getActiveWorkbook()
    const permission = workbook.getWorkbookPermission()

    await permission.setEditable()
  }, [univerAPI])

  const protectRange = useCallback(async (range: string, options: any) => {
    if (!univerAPI) return

    const workbook = univerAPI.getActiveWorkbook()
    const worksheet = workbook.getActiveSheet()
    const fRange = worksheet.getRange(range)
    const permission = fRange.getRangePermission()

    await permission.protect(options)
  }, [univerAPI])

  return {
    setWorkbookReadOnly,
    setWorkbookEditable,
    protectRange,
  }
}
```

### 5. Add Data Validation

**File**: `src/components/univer/hooks/useUniverValidation.ts`

```typescript
import { useCallback } from 'react'
import type { FUniver } from '@univerjs/core/facade'

export const useUniverValidation = (univerAPI: FUniver | null) => {
  const addNumberValidation = useCallback((range: string, min: number, max: number) => {
    if (!univerAPI) return

    const workbook = univerAPI.getActiveWorkbook()
    const worksheet = workbook.getActiveSheet()
    const fRange = worksheet.getRange(range)

    const rule = univerAPI.newDataValidation()
      .requireNumberBetween(min, max)
      .setOptions({
        allowBlank: true,
        showErrorMessage: true,
        error: `Please enter a number between ${min} and ${max}`,
      })
      .build()

    fRange.setDataValidation(rule)
  }, [univerAPI])

  const addDropdownValidation = useCallback((range: string, values: string[]) => {
    if (!univerAPI) return

    const workbook = univerAPI.getActiveWorkbook()
    const worksheet = workbook.getActiveSheet()
    const fRange = worksheet.getRange(range)

    const rule = univerAPI.newDataValidation()
      .requireValueInList(values)
      .setOptions({
        allowBlank: false,
        showErrorMessage: true,
        error: 'Please select a value from the list',
      })
      .build()

    fRange.setDataValidation(rule)
  }, [univerAPI])

  return {
    addNumberValidation,
    addDropdownValidation,
  }
}
```

## Langkah-langkah Implementasi

### Phase 1: Refactoring (Week 1)
1. ✅ Buat struktur folder baru untuk hooks
2. ✅ Implement `useUniverAPI` hook
3. ✅ Implement `useUniverEvents` hook
4. ✅ Refactor `UniverSheet.tsx` component
5. ✅ Update type definitions

### Phase 2: Feature Enhancement (Week 2)
1. ⏳ Implement `useUniverFormulas` hook
2. ⏳ Implement `useUniverPermissions` hook
3. ⏳ Implement `useUniverValidation` hook
4. ⏳ Add conditional formatting support
5. ⏳ Improve data conversion utilities

### Phase 3: Advanced Features (Week 3)
1. ⏳ Add filter support
2. ⏳ Add import/export functionality
3. ⏳ Add collaboration features (if needed)
4. ⏳ Performance optimization
5. ⏳ Testing dan documentation

## Testing Strategy

### Unit Tests
```typescript
// src/components/univer/hooks/__tests__/useUniverAPI.test.ts
import { renderHook } from '@testing-library/react-hooks'
import { useUniverAPI } from '../useUniverAPI'

describe('useUniverAPI', () => {
  it('should initialize univerAPI', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useUniverAPI(mockConfig)
    )

    await waitForNextUpdate()

    expect(result.current.univerAPI).toBeDefined()
    expect(result.current.isReady).toBe(true)
  })
})
```

### Integration Tests
```typescript
// src/components/univer/__tests__/UniverSheet.integration.test.tsx
import { render, screen } from '@testing-library/react'
import { UniverSheet } from '../UniverSheet'

describe('UniverSheet Integration', () => {
  it('should render and handle cell changes', async () => {
    const onCellChange = jest.fn()
    
    render(
      <UniverSheet
        data={mockData}
        onCellChange={onCellChange}
      />
    )

    // Test implementation
  })
})
```

## Performance Optimization

### 1. Lazy Loading
```typescript
// Lazy load Univer components
const UniverSheet = lazy(() => import('./components/univer/UniverSheet'))

// Usage
<Suspense fallback={<Loading />}>
  <UniverSheet data={data} />
</Suspense>
```

### 2. Memoization
```typescript
const MemoizedUniverSheet = memo(UniverSheet, (prev, next) => {
  return prev.data === next.data && prev.config === next.config
})
```

### 3. Virtual Scrolling
- Univer sudah menggunakan virtual scrolling secara default
- Pastikan tidak ada re-render yang tidak perlu

## Monitoring & Debugging

### Add Logging
```typescript
// src/utils/univerLogger.ts
export const univerLogger = {
  logEvent: (eventName: string, params: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Univer Event] ${eventName}`, params)
    }
  },
  logError: (error: Error, context: string) => {
    console.error(`[Univer Error] ${context}`, error)
    // Send to error tracking service
  },
}
```

## Referensi

- [Dokumentasi Core API](../core/general-api.md)
- [Dokumentasi Sheets API](../core/sheets-api.md)
- [Dokumentasi Range & Selection](../core/range-selection.md)
- [Official Univer Docs](https://docs.univer.ai/)
