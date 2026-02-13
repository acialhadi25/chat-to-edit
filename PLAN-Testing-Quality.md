# SheetLabAI - Quality & Testing Improvement Plan
**Status:** Milestone A-E Completed ✅ | **Next:** Testing & Quality Phase
**Created:** Feb 13, 2026 | **Target Completion:** 2-3 weeks

---

## Executive Summary

Setelah berhasil menyelesaikan Milestone A-E (Stability, Multi-Sheet, AI Quality, Templates, Usage Tracking), fokus sekarang beralih ke **pengujian komprehensif dan peningkatan kualitas** untuk memastikan semua tools (Excel Copilot, Merge, Split, Data Entry) berjalan dengan andal dan performant.

---

## Phase 1: Testing Infrastructure (Days 1-2)

**Goal:** Setup complete testing environment

### Tasks:
1. **Verify Vitest Configuration**
   - Pastikan `vitest.config.ts` sudah optimal
   - Setup test environment untuk React components
   - Configure coverage reporting (istanbul/v8)

2. **Install Testing Dependencies** (jika belum)
   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
   ```

3. **Create Test Utilities**
   - `src/test/setup.ts` - Test setup dan global mocks
   - `src/test/mocks/supabase.ts` - Mock Supabase client
   - `src/test/factories/excel.ts` - Factory untuk test data Excel
   - `src/test/fixtures/templates.ts` - Template fixtures untuk testing

4. **Configure Test Scripts**
   - `npm test` - Run all tests
   - `npm run test:watch` - Watch mode
   - `npm run test:coverage` - Dengan coverage report

---

## Phase 2: Unit Tests - Core Utilities (Days 3-5)

**Goal:** 80%+ coverage untuk utility functions

### Priority Files:

#### A. Excel Operations (`src/utils/excelOperations.ts`)
- [ ] `cloneExcelData` - Deep cloning correctness
- [ ] `getCellValue` - Edge cases (out of bounds, null)
- [ ] `setCellValue` - Value setting dengan undo tracking
- [ ] `setCellFormula` - Formula insertion dan calculation
- [ ] `addColumn` - Column insertion logic
- [ ] `deleteColumn` - Column deletion dengan formula adjustment
- [ ] `deleteRows` - Row deletion correctness
- [ ] `findReplace` - Regex dan literal replacement
- [ ] `sortData` - Ascending/descending sorting
- [ ] `filterData` - Filter operators (=, !=, >, <, dll)
- [ ] `removeDuplicates` - Duplicate detection logic
- [ ] `applyChanges` - Batch change application

#### B. Action Validation (`src/utils/actionValidation.ts`)
- [ ] Validasi untuk semua 37 ActionType
- [ ] Error message generation
- [ ] Edge cases: null, undefined, malformed data

#### C. JSON Parser (`src/utils/jsonParser.ts`)
- [ ] `parseAIResponse` - Valid JSON parsing
- [ ] Error handling untuk malformed JSON
- [ ] Extraction dari markdown code blocks

#### D. Cell Reference Utils
- [ ] `createCellRef` / `parseCellRef` - Bidirectional conversion
- [ ] `getColumnIndex` / `getColumnLetter` - A->0, 0->A
- [ ] `parseRowRefs` / `parseColumnRefs` - Range parsing

---

## Phase 3: Integration Tests - Hooks (Days 6-8)

**Goal:** Pastikan hooks berinteraksi dengan Supabase dengan benar

### Test dengan Mock Supabase:

#### A. `useFileHistory.ts`
- [ ] `saveFileRecord` - Insert dengan RPC atomic increment
- [ ] `getMonthlyUsage` - Retrieve usage data
- [ ] Error handling saat Supabase error

#### B. `useUsageTracking.ts`
- [ ] `logUsageEvent` - Semua event types
- [ ] `getMonthlyUsage` - Aggregasi data
- [ ] `checkQuota` - Quota limit checking
- [ ] `logFileUpload`, `logAIRequest`, `logActionApplied`

#### C. `useChatHistory.ts`
- [ ] `saveChatMessage` - Insert ke chat_history
- [ ] `getChatHistory` - Retrieve dengan pagination

#### D. `useUndoRedo.ts`
- [ ] State management (pushState, undo, redo)
- [ ] Description tracking
- [ ] History limit enforcement

---

## Phase 4: Component Tests - Critical UI (Days 9-11)

**Goal:** Pastikan UI critical path berfungsi

#### A. `ExcelUpload.tsx`
- [ ] File drop zone interaction
- [ ] File processing (XLSX parsing)
- [ ] Error display untuk invalid files
- [ ] Progress indicator (jika ada)

#### B. `ExcelPreview.tsx`
- [ ] Cell selection (single, range)
- [ ] Cell editing (value dan formula)
- [ ] Sheet switching (multi-sheet)
- [ ] Formula bar interaction
- [ ] Keyboard shortcuts (Ctrl+Z, Delete, etc)

#### C. `ChatInterface.tsx`
- [ ] Message sending
- [ ] Streaming response display
- [ ] Action preview rendering
- [ ] Quick option button clicks
- [ ] Apply/Reject action flow

#### D. `TemplateGallery.tsx`
- [ ] Template selection
- [ ] Category filtering
- [ ] Search functionality
- [ ] Template application

---

## Phase 5: Excel Copilot Quality Improvements (Days 12-14)

**Goal:** Tingkatkan reliability dan UX Excel Copilot

### A. AI Response Quality
- [ ] **Retry Logic** - Retry dengan exponential backoff untuk AI failures
- [ ] **Response Caching** - Cache responses untuk queries serupa
- [ ] **Better Error Messages** - User-friendly messages saat AI gagal
- [ ] **Prompt Engineering** - Refine prompts untuk hasil lebih konsisten

### B. Action Execution
- [ ] **Transaction Support** - All-or-nothing untuk multi-step actions
- [ ] **Rollback on Error** - Undo otomatis jika action gagal
- [ ] **Progress Indicator** - Loading state untuk long-running operations

### C. UX Improvements
- [ ] **Undo/Redo Enhancement** - Better visual feedback
- [ ] **Keyboard Shortcuts** - Full keyboard navigation
- [ ] **Context Menu** - Right-click menu untuk cell operations
- [ ] **Drag & Drop** - Drag untuk cell movement

### D. Formula Intelligence
- [ ] **Formula Suggestions** - Auto-suggest saat typing formula
- [ ] **Formula Validation** - Cek formula errors sebelum apply
- [ ] **Formula Documentation** - Tooltip untuk function descriptions

---

## Phase 6: Merge Excel Tool Enhancements (Days 15-16)

**Goal:** Improve Merge Excel functionality

### Current State Check:
- [ ] Review `MergeExcelDashboard.tsx` implementation
- [ ] Identify missing features vs requirements

### Enhancements:
- [ ] **Multi-File Upload** - Drag multiple files sekaligus
- [ ] **Sheet Selection** - Pilih specific sheets dari masing-masing file
- [ ] **Merge Strategy** - Options: append (vertikal), merge (horizontal), union
- [ ] **Conflict Resolution** - Handle duplicate columns
- [ ] **Preview Before Merge** - Lihat hasil sebelum apply
- [ ] **Column Mapping** - Map columns dengan nama berbeda
- [ ] **Progress Bar** - Show merge progress untuk large files
- [ ] **Cancel Operation** - Cancel long-running merge

---

## Phase 7: Split Excel Tool Enhancements (Days 17-18)

**Goal:** Improve Split Excel functionality

### Current State Check:
- [ ] Review `SplitExcelDashboard.tsx` implementation
- [ ] Identify missing features vs requirements

### Enhancements:
- [ ] **Split by Row Count** - Bagi menjadi N rows per file
- [ ] **Split by Sheet** - Export each sheet ke file terpisah
- [ ] **Split by Column** - Vertical split (pilih columns untuk masing-masing file)
- [ ] **Split by Value** - Split berdasarkan unique value di kolom tertentu
- [ ] **Batch Naming** - Pattern untuk output filenames
- [ ] **Download All** - ZIP download untuk multiple outputs
- [ ] **Preview First** - Lihat sample data sebelum split
- [ ] **Filter Before Split** - Apply filter kemudian split

---

## Phase 8: Data Entry Form Improvements (Days 19-20)

**Goal:** Enhance Data Entry Form generator

### Current State Check:
- [ ] Review `DataEntryDashboard.tsx` implementation
- [ ] Identify usability issues

### Enhancements:
- [ ] **Field Types** - Support: text, number, date, dropdown, checkbox
- [ ] **Validation Rules** - Required, min/max, regex pattern
- [ ] **Conditional Fields** - Show/hide fields berdasarkan value lain
- [ ] **Default Values** - Pre-fill defaults dari template
- [ ] **Bulk Entry** - Multiple entries dalam satu form (table-like)
- [ ] **QR Code Generation** - Generate QR untuk setiap entry
- [ ] **Export to Excel** - Download collected data sebagai Excel
- [ ] **Real-time Preview** - Live preview form saat design
- [ ] **Form Templates** - Preset form layouts

---

## Phase 9: Performance Optimization (Days 21-23)

**Goal:** Improve app responsiveness dan reduce bundle size

### A. Large File Handling
- [ ] **Virtual Scrolling** - Render hanya visible rows untuk large datasets
- [ ] **Pagination** - Page-based navigation untuk >1000 rows
- [ ] **Lazy Loading** - Load sheet data on-demand
- [ ] **Web Workers** - Move heavy operations ke worker thread

### B. Memoization
- [ ] Review `React.memo` usage di components
- [ ] Add `useMemo` untuk expensive calculations
- [ ] Optimize `useCallback` dependencies

### C. Bundle Optimization
- [ ] **Code Splitting** - Lazy load untuk tool pages
- [ ] **Tree Shaking** - Remove unused code
- [ ] **Dynamic Imports** - Load libraries on-demand

### D. Memory Management
- [ ] Review memory leaks di event listeners
- [ ] Cleanup subscriptions pada unmount
- [ ] Optimize undo/redo history size

---

## Phase 10: Final Integration Testing (Days 24-26)

**Goal:** End-to-end testing dan bug fixes

### Test Scenarios:

#### A. End-to-End Flows
1. **Excel Copilot Flow:**
   - Upload file → Chat dengan AI → Apply actions → Download result
   - Test dengan berbagai file sizes (small, medium, large)

2. **Merge Flow:**
   - Upload multiple files → Configure merge → Execute → Download

3. **Split Flow:**
   - Upload large file → Configure split → Execute → Download all

4. **Data Entry Flow:**
   - Design form → Share/Save → Collect entries → Export

#### B. Error Scenarios
- [ ] Network failure saat upload
- [ ] Invalid file format handling
- [ ] Supabase connection failure
- [ ] AI service downtime
- [ ] Browser compatibility issues

#### C. Edge Cases
- [ ] Empty files
- [ ] Files dengan 1 juta+ rows
- [ ] Files dengan 100+ sheets
- [ ] Special characters di cell values
- [ ] Corrupted Excel files

---

## Testing Checklist Summary

### Coverage Targets:
- [ ] **Unit Tests:** 80%+ coverage untuk utils
- [ ] **Integration:** All hooks dengan Supabase interactions
- [ ] **Component:** All critical UI components
- [ ] **E2E:** 4 main user flows

### Quality Metrics:
- [ ] **Lint:** 0 errors, <15 warnings
- [ ] **TypeScript:** Strict mode enabled, 0 errors
- [ ] **Performance:** <3s initial load, <100ms interaction response
- [ ] **Accessibility:** WCAG 2.1 AA compliance
- [ ] **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

---

## Success Criteria

1. ✅ **Zero Critical Bugs** - No data loss, no crashes
2. ✅ **Test Coverage** - 80%+ unit test coverage
3. ✅ **Performance** - App remains responsive dengan files up to 10MB
4. ✅ **User Experience** - Intuitive flows, clear error messages
5. ✅ **Documentation** - Updated docs dengan new features

---

## Next Steps (Post-Testing)

Setelah testing phase selesai:
- **Beta Testing** - Release ke limited users untuk feedback
- **Bug Fixing Sprint** - Address feedback dari beta
- **Performance Tuning** - Optimize berdasarkan metrics
- **Documentation** - Update user guides dengan new features
- **Marketing Prep** - Prepare launch materials

---

## Appendices

### A. Test File Naming Convention
- Unit: `[filename].test.ts`
- Component: `[ComponentName].test.tsx`
- Integration: `[feature].integration.test.ts`
- E2E: `[flow].e2e.test.ts`

### B. Testing Commands
```bash
# Run all tests
npm test

# Run dengan coverage
npm run test:coverage

# Run specific test file
npx vitest run src/utils/excelOperations.test.ts

# Watch mode
npx vitest --watch
```

### C. Mock Data Standards
- Gunakan fixtures untuk consistent test data
- Mock Supabase responses dengan data realistic
- Factory functions untuk generate variations
