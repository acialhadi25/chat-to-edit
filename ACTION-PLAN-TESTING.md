# Rencana Aksi: Pengujian & Peningkatan Kualitas SheetLab AI

**Tanggal Dibuat:** 13 Februari 2026  
**Status:** Testing Phase - Milestone F  
**Tujuan:** Mencapai 80%+ test coverage dan memastikan semua tools berfungsi andal

---

## Ringkasan Eksekutif

Berdasarkan analisis kode saat ini:
- **7 test files** sudah dibuat (5 utility tests passing)
- **151 tests** passing dengan 100% success rate
- **Critical gaps** di: Hooks (0 tests), Components (1 test failing), Pages (0 tests)
- **4 tools utama** perlu validasi: Excel Copilot, Merge, Split, Data Entry

---

## FASE 1: Hook Integration Tests (Prioritas Tinggi) 🔥

**Target:** 8 hooks tanpa test coverage
**Estimasi:** 2-3 hari

### A. useAuth.ts (Critical)
```typescript
// Tests yang perlu dibuat:
- [ ] signInWithPassword - sukses dan gagal
- [ ] signUp - validasi email, password strength
- [ ] signOut - cleanup state
- [ ] resetPassword - flow lengkap
- [ ] onAuthStateChange - listener management
- [ ] isLoading state management
```

### B. useFileHistory.ts (Critical)
```typescript
- [ ] saveFileRecord - RPC call dengan atomic increment
- [ ] getMonthlyUsage - data aggregation
- [ ] File record persistence
- [ ] Error handling saat Supabase gagal
- [ ] Concurrent upload handling
```

### C. useUsageTracking.ts (Critical)
```typescript
- [ ] logUsageEvent - semua event types
- [ ] logFileUpload - dengan metadata
- [ ] logAIRequest - dengan token count
- [ ] logActionApplied - dengan action type
- [ ] getMonthlyUsage - quota checking
- [ ] checkQuota - limit enforcement
```

### D. useUndoRedo.ts (High)
```typescript
- [ ] pushState - history management
- [ ] undo - state restoration
- [ ] redo - forward navigation
- [ ] canUndo/canRedo - boundary checking
- [ ] History limit enforcement (max 50)
- [ ] Description tracking
```

### E. useChatHistory.ts (High)
```typescript
- [ ] saveChatMessage - dengan action JSON
- [ ] getChatHistory - pagination
- [ ] deleteChatMessage - soft delete
- [ ] Real-time subscription
```

### F. Hooks Lainnya (Medium)
- [ ] useProfile.ts - profile CRUD
- [ ] useUsageLimit.ts - quota checking
- [ ] use-toast.ts - toast notifications
- [ ] use-mobile.tsx - responsive detection

---

## FASE 2: Component Tests - Critical UI 🔥

**Target:** 15+ komponen kritis
**Estimasi:** 3-4 hari

### A. ExcelUpload.tsx (Fix Existing + Expand)
**Status:** Tests ada tapi failing
```typescript
// Perbaiki test yang gagal:
- [ ] Mock XLSX library dengan benar
- [ ] Fix React component import issues
- [ ] Test file drop interaction
- [ ] Test drag & drop zone
- [ ] Test file type validation (xlsx, xls, csv)
- [ ] Test error display (invalid format, corrupted)
- [ ] Test loading state
- [ ] Test success callback
```

### B. ChatInterface.tsx (Critical)
```typescript
- [ ] Message input dan submit
- [ ] Streaming response display
- [ ] Action preview rendering
- [ ] Quick option button clicks
- [ ] Apply action flow
- [ ] Reject action flow
- [ ] Error message display
- [ ] Loading indicator saat AI processing
```

### C. ExcelPreview.tsx (Critical)
```typescript
- [ ] Cell selection (single, range, multi-range)
- [ ] Cell editing (value)
- [ ] Cell editing (formula)
- [ ] Sheet tab switching
- [ ] Formula bar interaction
- [ ] Keyboard shortcuts (Ctrl+Z, Delete, Enter)
- [ ] Scroll handling untuk large datasets
- [ ] Column resize
```

### D. ActionPreview.tsx (High)
```typescript
- [ ] Render berbagai action types
- [ ] Changes preview table
- [ ] Accept/Reject buttons
- [ ] Detailed view toggle
```

### E. Components Lainnya (Medium)
- [ ] TemplateGallery.tsx - selection, search
- [ ] DashboardSidebar.tsx - navigation
- [ ] FormulaBar.tsx - formula editing
- [ ] QuickActionButtons.tsx - button clicks
- [ ] UndoRedoBar.tsx - undo/redo UI
- [ ] ProtectedRoute.tsx - auth checking
- [ ] ErrorBoundary.tsx - error catching

---

## FASE 3: Excel Copilot - Quality Improvements 🎯

**Target:** Reliability & UX enhancement
**Estimasi:** 3-4 hari

### A. AI Response Reliability
```typescript
// Implement:
- [ ] Retry logic dengan exponential backoff (3 retries)
- [ ] Circuit breaker untuk AI service failures
- [ ] Response validation sebelum parsing
- [ ] Better error messages untuk user
- [ ] Fallback responses saat AI gagal
```

### B. Action Execution Robustness
```typescript
// Implement:
- [ ] Transaction support (all-or-nothing)
- [ ] Rollback otomatis jika action gagal
- [ ] Progress indicator untuk long operations
- [ ] Cancel operation capability
- [ ] Partial success handling
```

### C. Formula Intelligence
```typescript
// Implement:
- [ ] Formula syntax validation
- [ ] Formula dependency detection
- [ ] Formula suggestion saat typing
- [ ] Formula error highlighting
- [ ] Auto-complete untuk Excel functions
```

### D. UX Enhancements
```typescript
// Implement:
- [ ] Better undo/redo visual feedback
- [ ] Keyboard shortcuts reference (Ctrl+?)
- [ ] Right-click context menu
- [ ] Cell drag & drop
- [ ] Multi-cell selection dengan Shift+Click
```

---

## FASE 4: Merge Excel Tool - Functional Validation 🛠️

**Target:** Pastikan fitur merge lengkap berfungsi
**Estimasi:** 2-3 hari

### A. Core Merge Functionality
```typescript
// Test dan fix:
- [ ] Multi-file upload (drag multiple)
- [ ] Sheet selection dari masing-masing file
- [ ] Append merge (vertical) - validasi
- [ ] Merge horizontal - conflict detection
- [ ] Union merge - duplicate handling
- [ ] Column mapping interface
- [ ] Preview before merge
```

### B. Edge Cases
```typescript
// Handle:
- [ ] Files dengan column names berbeda
- [ ] Files dengan different sheet structures
- [ ] Empty sheets handling
- [ ] Duplicate row detection
- [ ] Memory management untuk large files
```

### C. UX Improvements
```typescript
// Implement:
- [ ] Progress bar untuk merge operation
- [ ] Cancel long-running merge
- [ ] Reorder files sebelum merge
- [ ] Column rename dalam mapping
```

---

## FASE 5: Split Excel Tool - Functional Validation 🛠️

**Target:** Pastikan fitur split lengkap berfungsi
**Estimasi:** 2-3 hari

### A. Core Split Functionality
```typescript
// Test dan fix:
- [ ] Split by row count - pagination logic
- [ ] Split by sheet - export each sheet
- [ ] Split by column - vertical split
- [ ] Split by value - group by column
- [ ] Batch naming pattern
- [ ] ZIP download untuk multiple files
```

### B. Preview & Validation
```typescript
// Implement:
- [ ] Preview sample data sebelum split
- [ ] Row count estimation
- [ ] Output file size estimation
- [ ] Filter sebelum split
```

---

## FASE 6: Data Entry Form - Functional Validation 🛠️

**Target:** Form generator berfungsi lengkap
**Estimasi:** 2-3 hari

### A. Form Field Types
```typescript
// Validasi semua field types:
- [ ] Text input dengan validation
- [ ] Number input dengan min/max
- [ ] Date picker
- [ ] Dropdown/select
- [ ] Checkbox
- [ ] Radio buttons
```

### B. Form Features
```typescript
// Test:
- [ ] Validation rules (required, pattern)
- [ ] Conditional fields (show/hide)
- [ ] Default values
- [ ] Bulk entry mode
- [ ] QR code generation
- [ ] Export to Excel
```

---

## FASE 7: Integration & E2E Testing 🚀

**Target:** 4 critical user flows
**Estimasi:** 3-4 hari

### User Flow 1: Excel Copilot End-to-End
```typescript
Steps:
1. Upload file Excel (small, medium, large)
2. Chat dengan AI untuk analysis
3. Apply suggested actions
4. Verify changes di preview
5. Download hasil
6. Verify undo/redo berfungsi
```

### User Flow 2: Merge Excel
```typescript
Steps:
1. Upload 3+ files berbeda
2. Configure merge strategy
3. Map columns dengan nama berbeda
4. Preview hasil merge
5. Execute merge
6. Download merged file
```

### User Flow 3: Split Excel
```typescript
Steps:
1. Upload large file (1000+ rows)
2. Configure split by row count
3. Preview output structure
4. Execute split
5. Download ZIP dengan semua files
6. Verify each split file
```

### User Flow 4: Data Entry
```typescript
Steps:
1. Design form dengan berbagai field types
2. Set validation rules
3. Preview form
4. Submit test entries
5. Export data ke Excel
6. Verify data integrity
```

---

## FASE 8: Performance & Stress Testing ⚡

**Target:** App tetap responsive
**Estimasi:** 2 hari

### A. Large File Handling
```typescript
Test dengan:
- [ ] File 1MB (1000 rows)
- [ ] File 5MB (5000 rows)
- [ ] File 10MB (10000 rows)
- [ ] File dengan 50+ sheets
- [ ] File dengan 100+ columns
```

### B. Memory Management
```typescript
Monitor:
- [ ] Memory usage saat upload
- [ ] Memory saat large operations
- [ ] Undo/redo history memory
- [ ] Memory leaks di event listeners
```

### C. Performance Metrics
```typescript
Target:
- [ ] Initial load < 3 detik
- [ ] File upload < 5 detik (10MB)
- [ ] AI response < 10 detik
- [ ] Action apply < 2 detik
- [ ] Undo/redo < 500ms
```

---

## FASE 9: Error Handling & Edge Cases 🛡️

**Target:** Graceful degradation
**Estimasi:** 2 hari

### A. Network Failures
```typescript
Simulate:
- [ ] Upload timeout
- [ ] Supabase connection loss
- [ ] AI service unavailable
- [ ] Partial data loss recovery
```

### B. Invalid Inputs
```typescript
Handle:
- [ ] Corrupted Excel files
- [ ] Empty files
- [ ] Files dengan special characters
- [ ] Invalid formulas
- [ ] Circular references
```

### C. Security
```typescript
Validate:
- [ ] XSS prevention di cell values
- [ ] File type validation
- [ ] File size limits
- [ ] Rate limiting untuk AI calls
```

---

## FASE 10: Documentation & Monitoring 📝

**Target:** Complete documentation
**Estimasi:** 2 hari

### A. Technical Documentation
```typescript
- [ ] Test coverage report
- [ ] API documentation (Supabase functions)
- [ ] Component storybook (jika diperlukan)
- [ ] Architecture decision records (ADRs)
```

### B. User Documentation
```typescript
- [ ] User guide untuk Excel Copilot
- [ ] Tutorial untuk Merge/Split
- [ ] Data Entry form guide
- [ ] FAQ dan troubleshooting
```

### C. Monitoring Setup
```typescript
- [ ] Error tracking (Sentry integration)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] AI usage metrics
```

---

## Prioritas Implementasi (Rekomendasi)

### Minggu 1: Foundation
| Hari | Fokus | Output |
|------|-------|--------|
| 1 | Hook tests (useAuth, useFileHistory) | 2 hooks tested |
| 2 | Hook tests (useUsageTracking, useUndoRedo) | 2 hooks tested |
| 3 | Fix ExcelUpload tests + ChatInterface tests | Component tests passing |
| 4 | ExcelPreview tests | Critical UI covered |
| 5 | Excel Copilot quality fixes | AI reliability improved |

### Minggu 2: Tools Validation
| Hari | Fokus | Output |
|------|-------|--------|
| 6 | Merge Excel validation | Merge tool berfungsi 100% |
| 7 | Split Excel validation | Split tool berfungsi 100% |
| 8 | Data Entry validation | Form tool berfungsi 100% |
| 9 | E2E flow testing | 4 flows validated |
| 10 | Performance testing | Metrics documented |

### Minggu 3: Polish & Launch Prep
| Hari | Fokus | Output |
|------|-------|--------|
| 11 | Error handling & edge cases | Robust error handling |
| 12 | Documentation | User & technical docs |
| 13 | Bug fixes dari testing | Zero critical bugs |
| 14 | Final validation | Ready for beta |
| 15 | Beta release | User feedback collection |

---

## Metrics & KPIs

### Testing Metrics
- **Unit Test Coverage:** Target 80%+ (saat ini ~30%)
- **Integration Tests:** All hooks covered
- **Component Tests:** 15+ critical components
- **E2E Tests:** 4 main flows passing

### Quality Metrics
- **Lint Errors:** 0
- **TypeScript Errors:** 0
- **Test Pass Rate:** 100%
- **Critical Bugs:** 0

### Performance Metrics
- **Load Time:** < 3 detik
- **Time to Interactive:** < 5 detik
- **File Upload (10MB):** < 10 detik
- **AI Response:** < 15 detik

---

## Immediate Next Actions (Hari Ini)

1. **Setup test mocks untuk Supabase**
   ```bash
   touch src/test/mocks/supabase.ts
   ```

2. **Create test untuk useAuth hook**
   ```bash
   touch src/hooks/useAuth.test.ts
   ```

3. **Fix failing ExcelUpload.test.tsx**
   - Mock XLSX library
   - Fix component imports

4. **Run coverage report**
   ```bash
   npm run test:coverage
   ```

5. **Document test patterns**
   - Buat TESTING.md dengan patterns

---

## Resources Needed

### Waktu
- **3 minggu** untuk complete testing phase
- **1 developer** full-time
- **1 QA** untuk manual testing

### Tools
- Vitest (sudah ada)
- React Testing Library (sudah ada)
- Playwright untuk E2E (perlu install)
- Sentry untuk error tracking (optional)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase tests flaky | High | Mock semua Supabase calls |
| XLSX library mocking complex | Medium | Use spyOn untuk methods |
| Time constraints | Medium | Prioritize critical paths |
| Large file testing | Low | Gunakan fixtures, bukan real files |

---

**Catatan:** Rencana ini bersifat iterative. Setiap fase menghasilkan deliverables yang bisa di-test dan di-validate sebelum lanjut ke fase berikutnya.
