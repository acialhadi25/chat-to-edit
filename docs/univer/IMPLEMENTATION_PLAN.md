# Rencana Implementasi Univer Sheet

## Executive Summary

Dokumen ini berisi rencana lengkap untuk mengintegrasikan fitur-fitur Univer Sheet yang telah didokumentasikan ke dalam project ini. Implementasi akan dilakukan secara bertahap dengan fokus pada stabilitas dan maintainability.

## Current State Analysis

### ✅ Yang Sudah Ada
1. **Basic Setup**
   - Univer Sheet Core Preset terintegrasi
   - Component wrapper (`UniverSheet.tsx`)
   - Basic data conversion utilities
   - Ref-based API access

2. **Data Conversion**
   - FortuneSheet ↔ Univer conversion
   - Excel Data ↔ Univer conversion
   - Basic cell data handling

### ⚠️ Yang Perlu Diperbaiki
1. **Architecture**
   - Terlalu banyak logic dalam satu component
   - Tidak ada separation of concerns
   - Event handling tidak terstruktur
   - Type safety kurang

2. **Features**
   - Event handling terbatas
   - Tidak ada custom formula support
   - Tidak ada permission management
   - Tidak ada data validation
   - Tidak ada conditional formatting

3. **Performance**
   - Tidak ada memoization
   - Re-render yang tidak perlu
   - Tidak ada lazy loading

## Implementation Phases

### Phase 1: Architecture Refactoring (Priority: HIGH)

#### 1.1 Create Hooks Structure
```
src/components/univer/hooks/
├── useUniverAPI.ts          # Core API initialization
├── useUniverEvents.ts       # Event handling
├── useUniverFormulas.ts     # Custom formulas
├── useUniverPermissions.ts  # Permission management
├── useUniverValidation.ts   # Data validation
└── useUniverFormatting.ts   # Conditional formatting
```

#### 1.2 Refactor UniverSheet Component
- Extract logic ke custom hooks
- Improve type safety
- Add proper error handling
- Implement proper cleanup

#### 1.3 Improve Type Definitions
```typescript
// src/types/univer.ts
import type { IWorkbookData, ICellData, IRange } from '@univerjs/core'

export interface UniverSheetConfig {
  locale?: string
  theme?: 'light' | 'dark'
  readonly?: boolean
  showToolbar?: boolean
  showFormulaBar?: boolean
}

export interface UniverSheetData extends IWorkbookData {
  // Extended properties
}

export interface CellChangeEvent {
  row: number
  col: number
  oldValue: any
  newValue: any
  worksheet: any
}

export interface SelectionChangeEvent {
  ranges: IRange[]
  worksheet: any
}
```

### Phase 2: Core Features Enhancement (Priority: HIGH)

#### 2.1 Event System
**File**: `src/components/univer/hooks/useUniverEvents.ts`

```typescript
export interface EventHandlers {
  // Cell events
  onCellChange?: (event: CellChangeEvent) => void
  onCellClick?: (event: CellClickEvent) => void
  onCellHover?: (event: CellHoverEvent) => void
  
  // Selection events
  onSelectionChange?: (event: SelectionChangeEvent) => void
  
  // Edit events
  onBeforeEdit?: (event: BeforeEditEvent) => boolean
  onEditStart?: (event: EditStartEvent) => void
  onEditEnd?: (event: EditEndEvent) => void
  
  // Sheet events
  onSheetChange?: (event: SheetChangeEvent) => void
  onSheetAdd?: (event: SheetAddEvent) => void
  onSheetDelete?: (event: SheetDeleteEvent) => void
  
  // Clipboard events
  onBeforePaste?: (event: BeforePasteEvent) => boolean
  onAfterPaste?: (event: AfterPasteEvent) => void
}
```

**Implementation Steps**:
1. ✅ Define event interfaces
2. ⏳ Implement event registration
3. ⏳ Add event cleanup
4. ⏳ Add event logging (dev mode)
5. ⏳ Write tests

#### 2.2 Custom Formulas
**File**: `src/components/univer/hooks/useUniverFormulas.ts`

**Built-in Custom Formulas**:
1. `CUSTOMSUM` - Enhanced sum with lambda support
2. `CUSTOMAVERAGE` - Average with filtering
3. `CUSTOMCOUNT` - Count with conditions
4. `CUSTOMIF` - Enhanced IF function

**Implementation Steps**:
1. ⏳ Create formula registry
2. ⏳ Implement built-in formulas
3. ⏳ Add formula validation
4. ⏳ Add internationalization
5. ⏳ Write tests

#### 2.3 Data Conversion Enhancement
**File**: `src/utils/univerSheetConversion.ts`

**Improvements**:
```typescript
export interface ConversionOptions {
  preserveFormulas?: boolean
  preserveStyles?: boolean
  preserveMerges?: boolean
  preserveValidation?: boolean
  preserveConditionalFormatting?: boolean
}

export interface ConversionResult {
  data: IWorkbookData
  warnings: string[]
  errors: string[]
}

export const convertToUniverFormat = (
  data: any,
  options: ConversionOptions = {}
): ConversionResult => {
  // Implementation with proper error handling
}
```

**Implementation Steps**:
1. ✅ Add type safety
2. ⏳ Add error handling
3. ⏳ Add validation
4. ⏳ Add warnings for unsupported features
5. ⏳ Write tests

### Phase 3: Advanced Features (Priority: MEDIUM)

#### 3.1 Permission Management
**File**: `src/components/univer/hooks/useUniverPermissions.ts`

**Features**:
- Workbook-level permissions
- Worksheet-level permissions
- Range-level permissions
- User-based access control

**Implementation Steps**:
1. ⏳ Implement workbook permissions
2. ⏳ Implement worksheet permissions
3. ⏳ Implement range protection
4. ⏳ Add permission UI
5. ⏳ Write tests

#### 3.2 Data Validation
**File**: `src/components/univer/hooks/useUniverValidation.ts`

**Validation Types**:
- Number validation (min/max, between)
- Text validation (length, pattern)
- Date validation (before/after, between)
- List validation (dropdown)
- Custom formula validation

**Implementation Steps**:
1. ⏳ Implement number validation
2. ⏳ Implement text validation
3. ⏳ Implement date validation
4. ⏳ Implement list validation
5. ⏳ Add validation UI
6. ⏳ Write tests

#### 3.3 Conditional Formatting
**File**: `src/components/univer/hooks/useUniverFormatting.ts`

**Format Types**:
- Cell value conditions
- Formula-based conditions
- Color scales
- Data bars
- Icon sets

**Implementation Steps**:
1. ⏳ Implement value-based formatting
2. ⏳ Implement formula-based formatting
3. ⏳ Implement color scales
4. ⏳ Implement data bars
5. ⏳ Add formatting UI
6. ⏳ Write tests

### Phase 4: Performance Optimization (Priority: MEDIUM)

#### 4.1 Component Optimization
- Implement React.memo
- Add useMemo for expensive calculations
- Add useCallback for event handlers
- Implement lazy loading

#### 4.2 Data Optimization
- Implement virtual scrolling (already in Univer)
- Add data caching
- Optimize re-renders
- Add debouncing for onChange events

#### 4.3 Bundle Optimization
- Code splitting
- Lazy load Univer components
- Tree shaking
- Minimize bundle size

### Phase 5: Testing & Documentation (Priority: HIGH)

#### 5.1 Unit Tests
```
src/components/univer/__tests__/
├── hooks/
│   ├── useUniverAPI.test.ts
│   ├── useUniverEvents.test.ts
│   ├── useUniverFormulas.test.ts
│   ├── useUniverPermissions.test.ts
│   └── useUniverValidation.test.ts
└── utils/
    └── univerSheetConversion.test.ts
```

#### 5.2 Integration Tests
```
src/components/univer/__tests__/
├── UniverSheet.integration.test.tsx
├── UniverSheet.events.test.tsx
└── UniverSheet.performance.test.tsx
```

#### 5.3 E2E Tests
```
e2e/
└── univer-sheet.spec.ts
```

#### 5.4 Documentation
- API documentation
- Usage examples
- Migration guide
- Best practices
- Troubleshooting guide

## Timeline

### Week 1: Architecture Refactoring
- Day 1-2: Create hooks structure
- Day 3-4: Refactor UniverSheet component
- Day 5: Improve type definitions
- Day 6-7: Testing & bug fixes

### Week 2: Core Features
- Day 1-2: Event system
- Day 3-4: Custom formulas
- Day 5-6: Data conversion enhancement
- Day 7: Testing & bug fixes

### Week 3: Advanced Features (Part 1)
- Day 1-2: Permission management
- Day 3-4: Data validation
- Day 5-7: Testing & bug fixes

### Week 4: Advanced Features (Part 2)
- Day 1-3: Conditional formatting
- Day 4-5: Performance optimization
- Day 6-7: Testing & documentation

## Success Criteria

### Phase 1 Success Criteria
- ✅ All logic extracted to custom hooks
- ✅ Component is < 200 lines
- ✅ Type safety score > 90%
- ✅ All tests passing
- ✅ No console errors/warnings

### Phase 2 Success Criteria
- ✅ All major events handled
- ✅ Custom formulas working
- ✅ Data conversion handles edge cases
- ✅ Test coverage > 80%

### Phase 3 Success Criteria
- ✅ Permission system working
- ✅ Data validation working
- ✅ Conditional formatting working
- ✅ Test coverage > 80%

### Phase 4 Success Criteria
- ✅ Bundle size < 500KB (gzipped)
- ✅ Initial render < 1s
- ✅ No unnecessary re-renders
- ✅ Lighthouse score > 90

### Phase 5 Success Criteria
- ✅ Test coverage > 85%
- ✅ All documentation complete
- ✅ Migration guide available
- ✅ Examples working

## Risk Management

### Technical Risks
1. **Breaking Changes in Univer**
   - Mitigation: Pin versions, monitor changelog
   
2. **Performance Issues**
   - Mitigation: Early performance testing, profiling
   
3. **Type Safety Issues**
   - Mitigation: Strict TypeScript config, comprehensive types

### Project Risks
1. **Timeline Delays**
   - Mitigation: Prioritize critical features, parallel work
   
2. **Resource Constraints**
   - Mitigation: Clear priorities, focus on MVP first

## Monitoring & Metrics

### Development Metrics
- Code coverage
- Type safety score
- Bundle size
- Build time

### Performance Metrics
- Initial render time
- Time to interactive
- Memory usage
- Re-render count

### Quality Metrics
- Bug count
- Test pass rate
- Code review feedback
- User feedback

## Next Steps

1. ✅ Review and approve implementation plan
2. ⏳ Set up project board with tasks
3. ⏳ Create feature branches
4. ⏳ Start Phase 1 implementation
5. ⏳ Daily standups for progress tracking

## Resources

### Documentation
- [Univer Official Docs](https://docs.univer.ai/)
- [Facade API Reference](https://reference.univer.ai/)
- [Project Documentation](./README.md)

### Tools
- TypeScript
- React Testing Library
- Jest
- Playwright (E2E)
- ESLint
- Prettier

### Team
- Developer: [Your Name]
- Reviewer: [Reviewer Name]
- QA: [QA Name]
