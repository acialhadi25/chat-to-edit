# Web Workers

This directory contains Web Worker implementations for offloading computationally intensive tasks from the main thread.

## Formula Worker

**File:** `formulaWorker.ts`

The formula worker handles asynchronous formula evaluation to prevent UI blocking during complex calculations.

### Features

- Asynchronous formula evaluation
- Message passing protocol with request/response types
- Error handling and timeout support
- Concurrent evaluation support

### Usage

Use the `useFormulaWorker` hook to interact with the formula worker:

```typescript
import { useFormulaWorker } from '@/hooks/useFormulaWorker';

function MyComponent() {
  const { evaluateAsync, isReady } = useFormulaWorker();

  const handleCalculate = async () => {
    if (!isReady) return;

    try {
      const result = await evaluateAsync('=SUM(A1:A10)', excelData, {
        timeout: 5000 // optional, defaults to 5000ms
      });
      console.log('Result:', result);
    } catch (error) {
      console.error('Evaluation failed:', error);
    }
  };

  return (
    <button onClick={handleCalculate} disabled={!isReady}>
      Calculate
    </button>
  );
}
```

### Message Protocol

**Request:**
```typescript
{
  type: 'evaluate',
  id: string,        // Unique request ID
  formula: string,   // Formula to evaluate (e.g., "=SUM(A1:A10)")
  data: ExcelData    // Excel data context
}
```

**Success Response:**
```typescript
{
  type: 'success',
  id: string,                    // Matching request ID
  result: string | number | null // Evaluation result
}
```

**Error Response:**
```typescript
{
  type: 'error',
  id: string,   // Matching request ID
  error: string // Error message
}
```

### Error Handling

The worker handles the following error scenarios:

1. **Formula evaluation errors** - Invalid formulas, syntax errors, etc.
2. **Worker initialization errors** - Failed to create worker
3. **Timeout errors** - Long-running calculations that exceed timeout
4. **Worker termination** - Pending requests rejected when worker is terminated

### Performance Considerations

- The worker is initialized once per component mount
- Multiple concurrent evaluations are supported
- Each evaluation has a unique request ID for tracking
- Timeouts prevent indefinite blocking
- Worker is automatically terminated on component unmount

### Requirements

Implements requirement **3.2.1**: Asynchronous formula evaluation with Web Workers
