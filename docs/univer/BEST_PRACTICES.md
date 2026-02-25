# Univer Sheet Integration - Best Practices

## Overview

This document outlines best practices, patterns, and recommendations for working with the Univer Sheet integration to ensure optimal performance, maintainability, and user experience.

## Table of Contents

- [Architecture & Design](#architecture--design)
- [Performance](#performance)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Security](#security)
- [AI Integration](#ai-integration)
- [Data Management](#data-management)
- [Code Quality](#code-quality)
- [User Experience](#user-experience)

---

## Architecture & Design

### Component Structure

**✅ DO: Keep components focused and single-responsibility**

```typescript
// Good: Separate concerns
function SpreadsheetContainer() {
  return (
    <>
      <SpreadsheetToolbar />
      <UniverSheet />
      <SpreadsheetSidebar />
    </>
  );
}

// Bad: Everything in one component
function SpreadsheetEverything() {
  // 500 lines of mixed concerns
}
```

**✅ DO: Use custom hooks for reusable logic**

```typescript
// Good: Reusable hook
function useSpreadsheetData(workbookId: string) {
  const [data, setData] = useState<IWorkbookData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData(workbookId).then(setData).finally(() => setLoading(false));
  }, [workbookId]);
  
  return { data, loading };
}

// Usage
const { data, loading } = useSpreadsheetData('wb-123');
```

**✅ DO: Separate business logic from UI**

```typescript
// Good: Service layer
// services/spreadsheetService.ts
export const spreadsheetService = {
  async calculateTotals(range: string) {
    // Business logic here
  }
};

// Component uses service
function SpreadsheetComponent() {
  const handleCalculate = () => {
    spreadsheetService.calculateTotals('A1:A10');
  };
}
```

### State Management

**✅ DO: Use appropriate state management**

```typescript
// Local state for UI-only concerns
const [isOpen, setIsOpen] = useState(false);

// Context for shared state
const { univerAPI } = useUniver(containerRef);

// Server state for data
const { data } = useQuery('workbook', () => loadWorkbook(id));
```

**❌ DON'T: Store large data in React state**

```typescript
// Bad: Storing entire workbook in state
const [workbookData, setWorkbookData] = useState<IWorkbookData>(hugeData);

// Good: Let Univer manage the data
const { univerAPI } = useUniver(containerRef);
```

---

## Performance

### Initialization

**✅ DO: Check if univerAPI is ready before operations**

```typescript
function SpreadsheetComponent() {
  const { univerAPI, isReady } = useUniver(containerRef);

  useEffect(() => {
    if (!isReady || !univerAPI) return;
    
    // Safe to perform operations
    performOperations();
  }, [isReady, univerAPI]);
}
```

**✅ DO: Lazy load large datasets**

```typescript
// Good: Load data on demand
const loadData = async () => {
  const data = await storageService.loadWorkbook(id);
  return data;
};

// Bad: Load everything upfront
const allData = await loadAllWorkbooks(); // Slow!
```

### Batch Operations

**✅ DO: Use batch operations for multiple updates**

```typescript
// Good: Single batch operation
await setRangeValues('A1:A100', data);

// Bad: Multiple individual operations
for (let i = 0; i < 100; i++) {
  await setCellValue(i, 0, data[i]); // Slow!
}
```

**✅ DO: Debounce frequent operations**

```typescript
import { debounce } from 'lodash';

const debouncedSave = debounce(async (data) => {
  await storageService.saveWorkbook(id, data);
}, 1000);

// Usage
useEffect(() => {
  if (data) {
    debouncedSave(data);
  }
}, [data]);
```

### Memory Management

**✅ DO: Clean up resources**

```typescript
useEffect(() => {
  const subscription = univerAPI?.onDataChange((data) => {
    handleDataChange(data);
  });

  return () => {
    subscription?.dispose(); // Clean up
  };
}, [univerAPI]);
```

**✅ DO: Use memoization for expensive computations**

```typescript
const expensiveCalculation = useMemo(() => {
  return calculateComplexMetrics(data);
}, [data]);
```

### Rendering Optimization

**✅ DO: Use React.memo for pure components**

```typescript
const SpreadsheetToolbar = React.memo(({ onAction }) => {
  return <div>{/* toolbar content */}</div>;
});
```

**✅ DO: Avoid unnecessary re-renders**

```typescript
// Good: Stable callback reference
const handleChange = useCallback((data) => {
  console.log('Data changed:', data);
}, []);

// Bad: New function on every render
const handleChange = (data) => {
  console.log('Data changed:', data);
};
```

---

## Error Handling

### Graceful Degradation

**✅ DO: Handle errors gracefully**

```typescript
async function safeOperation() {
  try {
    await performOperation();
  } catch (error) {
    handleUniverError(error);
    // Show user-friendly message
    toast.error('Operation failed. Please try again.');
    // Log for debugging
    console.error('Operation error:', error);
  }
}
```

**✅ DO: Provide fallback UI**

```typescript
function SpreadsheetWithFallback() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div>
        <p>Failed to load spreadsheet</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return <UniverSheet />;
}
```

### Validation

**✅ DO: Validate input before operations**

```typescript
async function setCellValueSafe(row: number, col: number, value: any) {
  // Validate inputs
  if (row < 0 || col < 0) {
    throw new Error('Invalid cell coordinates');
  }
  
  if (value === undefined || value === null) {
    throw new Error('Invalid cell value');
  }

  await setCellValue(row, col, value);
}
```

**✅ DO: Validate formulas**

```typescript
function isValidFormula(formula: string): boolean {
  if (!formula.startsWith('=')) return false;
  
  // Check for common errors
  const invalidPatterns = [
    /\/{2,}/,  // Multiple slashes
    /\*{2,}/,  // Multiple asterisks
    /\({2,}/,  // Unmatched parentheses
  ];
  
  return !invalidPatterns.some(pattern => pattern.test(formula));
}
```

### Error Recovery

**✅ DO: Implement retry logic**

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const data = await retryOperation(() => loadWorkbook(id));
```

---

## Testing

### Unit Tests

**✅ DO: Test business logic separately**

```typescript
describe('spreadsheetService', () => {
  it('should calculate sum correctly', () => {
    const result = spreadsheetService.calculateSum([1, 2, 3, 4, 5]);
    expect(result).toBe(15);
  });

  it('should handle empty array', () => {
    const result = spreadsheetService.calculateSum([]);
    expect(result).toBe(0);
  });
});
```

**✅ DO: Mock external dependencies**

```typescript
jest.mock('@/services/storageService');

describe('SpreadsheetComponent', () => {
  it('should load data on mount', async () => {
    const mockData = { id: '1', name: 'Test' };
    (storageService.loadWorkbook as jest.Mock).mockResolvedValue(mockData);

    render(<SpreadsheetComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

### Property-Based Tests

**✅ DO: Use property-based testing for correctness**

```typescript
import fc from 'fast-check';

describe('Cell operations', () => {
  it('should preserve value type on round trip', () => {
    fc.assert(
      fc.property(fc.anything(), async (value) => {
        await setCellValue(0, 0, value);
        const retrieved = await getCellValue(0, 0);
        expect(retrieved).toEqual(value);
      })
    );
  });
});
```

### Integration Tests

**✅ DO: Test complete workflows**

```typescript
describe('Spreadsheet workflow', () => {
  it('should complete create-edit-save-load cycle', async () => {
    // Create
    const workbook = await createWorkbook('Test');
    
    // Edit
    await setCellValue(0, 0, 'Hello');
    
    // Save
    await saveWorkbook(workbook.id);
    
    // Load
    const loaded = await loadWorkbook(workbook.id);
    
    expect(loaded.sheets.sheet1.cellData[0][0].v).toBe('Hello');
  });
});
```

---

## Security

### Input Validation

**✅ DO: Sanitize user input**

```typescript
function sanitizeFormula(formula: string): string {
  // Remove potentially dangerous patterns
  return formula
    .replace(/javascript:/gi, '')
    .replace(/<script>/gi, '')
    .trim();
}
```

**✅ DO: Validate ranges**

```typescript
function isValidRange(range: string): boolean {
  const rangePattern = /^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/;
  return rangePattern.test(range);
}
```

### Authentication & Authorization

**✅ DO: Check permissions before operations**

```typescript
async function deleteWorkbook(id: string) {
  const user = await getCurrentUser();
  const workbook = await loadWorkbook(id);
  
  if (workbook.userId !== user.id) {
    throw new Error('Unauthorized');
  }
  
  await storageService.deleteWorkbook(id);
}
```

**✅ DO: Use Row Level Security**

```sql
-- Supabase RLS policy
CREATE POLICY "Users can only access their own workbooks"
  ON workbooks
  FOR ALL
  USING (auth.uid() = user_id);
```

### Data Protection

**✅ DO: Encrypt sensitive data**

```typescript
async function saveWorkbook(id: string, data: IWorkbookData) {
  // Encrypt sensitive fields
  const encrypted = {
    ...data,
    sensitiveData: await encrypt(data.sensitiveData)
  };
  
  await storageService.saveWorkbook(id, encrypted);
}
```

---

## AI Integration

### Context Management

**✅ DO: Provide relevant context to AI**

```typescript
const context: AIContext = {
  currentWorkbook: workbookId,
  currentWorksheet: activeSheet.id,
  currentSelection: selection,
  recentOperations: getRecentOperations(5),
  conversationHistory: getChatHistory(10)
};

await aiService.processCommand(command, context);
```

**✅ DO: Track AI operations**

```typescript
async function executeAICommand(command: string) {
  const startTime = Date.now();
  
  try {
    const result = await aiService.processCommand(command, context);
    
    // Log successful operation
    await storageService.logAIInteraction({
      command,
      result,
      success: true,
      executionTime: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    // Log failed operation
    await storageService.logAIInteraction({
      command,
      error: error.message,
      success: false,
      executionTime: Date.now() - startTime
    });
    
    throw error;
  }
}
```

### Confirmation Flow

**✅ DO: Confirm destructive operations**

```typescript
async function processAICommand(command: string) {
  const parsed = await commandParser.parse(command);
  
  if (parsed.requiresConfirmation) {
    const confirmed = await showConfirmDialog(
      `This will ${parsed.intent}. Continue?`
    );
    
    if (!confirmed) {
      return { cancelled: true };
    }
  }
  
  return await executeCommand(parsed);
}
```

### Error Messages

**✅ DO: Provide clear AI error messages**

```typescript
function formatAIError(error: Error): string {
  if (error.message.includes('invalid range')) {
    return 'I couldn\'t understand the cell range. Please use format like "A1:B10".';
  }
  
  if (error.message.includes('permission denied')) {
    return 'You don\'t have permission to perform this operation.';
  }
  
  return 'Something went wrong. Please try rephrasing your request.';
}
```

---

## Data Management

### Auto-Save

**✅ DO: Implement smart auto-save**

```typescript
function useAutoSave(workbookId: string, data: IWorkbookData) {
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(async () => {
      await storageService.saveWorkbook(workbookId, data);
      setIsDirty(false);
      setLastSaved(new Date());
    }, 5000); // 5 second debounce

    return () => clearTimeout(timer);
  }, [isDirty, data]);

  return { lastSaved, isDirty };
}
```

**✅ DO: Show save status to users**

```typescript
function SpreadsheetWithSaveStatus() {
  const { lastSaved, isDirty } = useAutoSave(workbookId, data);

  return (
    <>
      <SaveStatusIndicator
        status={isDirty ? 'saving' : 'saved'}
        lastSaved={lastSaved}
      />
      <UniverSheet />
    </>
  );
}
```

### Version History

**✅ DO: Auto-version on significant changes**

```typescript
function useAutoVersioning(workbookId: string) {
  const [changeCount, setChangeCount] = useState(0);
  const threshold = 10; // Save version every 10 changes

  useEffect(() => {
    if (changeCount >= threshold) {
      storageService.saveVersion(
        workbookId,
        `Auto-save after ${changeCount} changes`
      );
      setChangeCount(0);
    }
  }, [changeCount]);

  const trackChange = () => setChangeCount(prev => prev + 1);

  return { trackChange };
}
```

### Data Integrity

**✅ DO: Validate data before save**

```typescript
function validateWorkbookData(data: IWorkbookData): boolean {
  if (!data.id || !data.name) return false;
  if (!data.sheets || Object.keys(data.sheets).length === 0) return false;
  
  // Validate each sheet
  for (const sheet of Object.values(data.sheets)) {
    if (!sheet.id || !sheet.name) return false;
  }
  
  return true;
}

async function saveWorkbookSafe(id: string, data: IWorkbookData) {
  if (!validateWorkbookData(data)) {
    throw new Error('Invalid workbook data');
  }
  
  await storageService.saveWorkbook(id, data);
}
```

---

## Code Quality

### TypeScript

**✅ DO: Use strict TypeScript**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**✅ DO: Define proper types**

```typescript
// Good: Explicit types
interface SpreadsheetProps {
  workbookId: string;
  onSave: (data: IWorkbookData) => Promise<void>;
  readOnly?: boolean;
}

// Bad: Any types
interface SpreadsheetProps {
  workbookId: any;
  onSave: any;
  readOnly: any;
}
```

### Code Organization

**✅ DO: Follow consistent file structure**

```
src/
├── components/
│   ├── univer/
│   │   ├── UniverSheet.tsx
│   │   ├── UniverSheet.test.tsx
│   │   └── index.ts
├── hooks/
│   ├── useUniver.ts
│   ├── useUniver.test.ts
│   └── index.ts
├── services/
│   ├── aiService.ts
│   ├── aiService.test.ts
│   └── index.ts
```

**✅ DO: Use barrel exports**

```typescript
// hooks/index.ts
export { useUniver } from './useUniver';
export { useUniverCellOperations } from './useUniverCellOperations';
export { useUniverEvents } from './useUniverEvents';

// Usage
import { useUniver, useUniverCellOperations } from '@/hooks';
```

### Documentation

**✅ DO: Document complex logic**

```typescript
/**
 * Calculates the optimal chunk size for batch operations
 * based on available memory and data size.
 * 
 * @param dataSize - Total size of data in bytes
 * @param availableMemory - Available memory in bytes
 * @returns Optimal chunk size
 */
function calculateChunkSize(dataSize: number, availableMemory: number): number {
  // Implementation
}
```

---

## User Experience

### Loading States

**✅ DO: Show loading indicators**

```typescript
function SpreadsheetWithLoading() {
  const { data, loading } = useSpreadsheetData(workbookId);

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner />
        <p>Loading spreadsheet...</p>
      </div>
    );
  }

  return <UniverSheet initialData={data} />;
}
```

### Error Messages

**✅ DO: Show user-friendly errors**

```typescript
function SpreadsheetWithErrors() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
        <Button onClick={() => setError(null)}>Dismiss</Button>
      </Alert>
    );
  }

  return <UniverSheet />;
}
```

### Keyboard Shortcuts

**✅ DO: Implement keyboard shortcuts**

```typescript
function SpreadsheetWithShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return <UniverSheet />;
}
```

### Accessibility

**✅ DO: Make components accessible**

```typescript
function AccessibleSpreadsheet() {
  return (
    <div role="application" aria-label="Spreadsheet">
      <button
        aria-label="Save spreadsheet"
        onClick={handleSave}
      >
        Save
      </button>
      <UniverSheet />
    </div>
  );
}
```

---

## Common Pitfalls

### ❌ DON'T: Mutate state directly

```typescript
// Bad
data.sheets.sheet1.cellData[0][0].v = 'new value';

// Good
const newData = {
  ...data,
  sheets: {
    ...data.sheets,
    sheet1: {
      ...data.sheets.sheet1,
      cellData: {
        ...data.sheets.sheet1.cellData,
        0: {
          ...data.sheets.sheet1.cellData[0],
          0: { v: 'new value' }
        }
      }
    }
  }
};
```

### ❌ DON'T: Ignore async operations

```typescript
// Bad
setCellValue(0, 0, 'value'); // Missing await
console.log('Done'); // Runs before setCellValue completes

// Good
await setCellValue(0, 0, 'value');
console.log('Done'); // Runs after setCellValue completes
```

### ❌ DON'T: Create memory leaks

```typescript
// Bad
useEffect(() => {
  const interval = setInterval(() => {
    checkStatus();
  }, 1000);
  // Missing cleanup!
});

// Good
useEffect(() => {
  const interval = setInterval(() => {
    checkStatus();
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

---

## Checklist

Before deploying to production:

- [ ] All operations have error handling
- [ ] Loading states are shown to users
- [ ] Auto-save is enabled
- [ ] Performance metrics are monitored
- [ ] Tests cover critical paths
- [ ] TypeScript strict mode is enabled
- [ ] Security policies are in place
- [ ] Documentation is up to date
- [ ] Accessibility requirements are met
- [ ] Memory leaks are prevented

---

## Resources

- [API Reference](./API_REFERENCE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Migration Guide](../migration/fortunesheet-to-univer.md)
- [Univer Documentation](https://univer.ai/docs)

---

**Last Updated:** 2024
**Version:** 1.0.0
