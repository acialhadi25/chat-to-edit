# Performance Tracking Guide

This guide explains how to use the performance tracking utilities to monitor Excel operations and track custom metrics with Sentry.

## Overview

The performance tracking system provides:
- Automatic tracking of Excel operation duration
- Error tracking with context
- Integration with Sentry for monitoring
- Support for both async and sync operations

## Basic Usage

### Tracking Async Operations

```typescript
import { trackOperation } from '@/lib/performanceTracking';
import { sortData } from '@/utils/excelOperations';

async function handleSort(data: ExcelData, column: number) {
  return trackOperation(
    'sortData',
    () => sortData(data, column, 'asc'),
    {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
    }
  );
}
```

### Tracking Sync Operations

```typescript
import { trackOperationSync } from '@/lib/performanceTracking';
import { removeEmptyRows } from '@/utils/excelOperations';

function handleRemoveEmpty(data: ExcelData) {
  return trackOperationSync(
    'removeEmptyRows',
    () => removeEmptyRows(data),
    {
      rowCount: data.rows.length,
    }
  );
}
```

## Direct Sentry Integration

### Track Custom Excel Operations

```typescript
import { trackExcelOperation } from '@/lib/sentry';

function processLargeFile(file: File) {
  const startTime = performance.now();
  
  try {
    // Your processing logic here
    const result = parseExcel(file);
    
    const duration = performance.now() - startTime;
    trackExcelOperation('parseExcel', duration, {
      fileSize: file.size,
      rowCount: result.rows.length,
      columnCount: result.headers.length,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackExcelOperation('parseExcel_error', duration, {
      fileSize: file.size,
      error: error.message,
    });
    throw error;
  }
}
```

### Add Breadcrumbs for Debugging

```typescript
import { addBreadcrumb } from '@/lib/sentry';

function handleUserAction(action: string, data: any) {
  addBreadcrumb(
    `User performed: ${action}`,
    'user-action',
    'info',
    { action, dataSize: data.rows.length }
  );
  
  // Perform the action
  performAction(action, data);
}
```

### Set User Context

```typescript
import { setUserContext, clearUserContext } from '@/lib/sentry';

// On login
function handleLogin(userId: string, plan: string) {
  setUserContext(userId, {
    plan,
    environment: import.meta.env.MODE,
  });
}

// On logout
function handleLogout() {
  clearUserContext();
}
```

## Performance Metrics

### Tracked Automatically

The following metrics are tracked automatically when Sentry is configured:

1. **Core Web Vitals**
   - LCP (Largest Contentful Paint): Loading performance
   - FID (First Input Delay): Interactivity
   - CLS (Cumulative Layout Shift): Visual stability

2. **Excel Operations**
   - Operation name and duration
   - Performance rating (fast/medium/slow)
   - Row and column counts
   - File sizes

### Performance Ratings

Operations are automatically categorized:
- **Fast**: < 1000ms
- **Medium**: 1000-5000ms
- **Slow**: > 5000ms

## Best Practices

### 1. Always Track Long-Running Operations

```typescript
// ✅ Good: Track operations that might be slow
trackOperation('complexCalculation', () => {
  return performComplexCalculation(largeDataset);
}, { datasetSize: largeDataset.length });

// ❌ Bad: Don't track trivial operations
trackOperation('getCellValue', () => getCellValue(data, 0, 0));
```

### 2. Include Relevant Metadata

```typescript
// ✅ Good: Include context that helps debugging
trackExcelOperation('mergeFiles', duration, {
  fileCount: files.length,
  totalRows: totalRows,
  totalColumns: totalColumns,
  mergeStrategy: 'append',
});

// ❌ Bad: Missing useful context
trackExcelOperation('mergeFiles', duration);
```

### 3. Track Errors with Context

```typescript
// ✅ Good: Track errors with operation context
try {
  await processFile(file);
} catch (error) {
  trackExcelOperation('processFile_error', duration, {
    fileSize: file.size,
    fileName: file.name,
    error: error.message,
  });
  throw error;
}
```

### 4. Use Breadcrumbs for User Flow

```typescript
// ✅ Good: Track user journey
addBreadcrumb('File uploaded', 'file', 'info', { size: file.size });
addBreadcrumb('Parsing started', 'excel', 'info');
addBreadcrumb('Parsing completed', 'excel', 'info', { rows: data.rows.length });
addBreadcrumb('User applied filter', 'user-action', 'info', { column: 'Status' });
```

## Configuration

### Environment Variables

```env
# Required for Sentry integration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Sampling Rates

Configured in `src/lib/sentry.ts`:

```typescript
{
  tracesSampleRate: 0.1,        // 10% of transactions in production
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
}
```

### PII Protection

The system automatically filters:
- User emails
- IP addresses
- Passwords
- Tokens
- Any field named `email`, `password`, or `token` in breadcrumbs

## Monitoring Dashboard

View your metrics in Sentry:
1. Go to your Sentry project dashboard
2. Navigate to **Performance** to see operation metrics
3. Check **Issues** for error tracking
4. View **Session Replay** for debugging

## Example: Complete Integration

```typescript
import { trackOperation } from '@/lib/performanceTracking';
import { addBreadcrumb, trackExcelOperation } from '@/lib/sentry';
import { sortData, filterData } from '@/utils/excelOperations';

async function handleComplexOperation(data: ExcelData) {
  // Add breadcrumb for debugging
  addBreadcrumb('Starting complex operation', 'excel', 'info', {
    rowCount: data.rows.length,
  });
  
  try {
    // Track sort operation
    const sorted = await trackOperation(
      'sortData',
      () => sortData(data, 0, 'asc'),
      { rowCount: data.rows.length }
    );
    
    addBreadcrumb('Sort completed', 'excel', 'info');
    
    // Track filter operation
    const filtered = await trackOperation(
      'filterData',
      () => filterData(sorted, 1, '>', 100),
      { rowCount: sorted.rows.length }
    );
    
    addBreadcrumb('Filter completed', 'excel', 'info', {
      resultRows: filtered.data.rows.length,
    });
    
    return filtered;
  } catch (error) {
    addBreadcrumb('Operation failed', 'excel', 'error', {
      error: error.message,
    });
    throw error;
  }
}
```

## Troubleshooting

### Sentry Not Tracking

1. Check that `VITE_SENTRY_DSN` is set in `.env`
2. Restart the dev server after adding the DSN
3. Check browser console for Sentry initialization messages
4. Verify DSN is correct in Sentry project settings

### Missing Metrics

1. Ensure operations are wrapped with `trackOperation` or `trackOperationSync`
2. Check that metadata is being passed correctly
3. Verify sampling rates in `sentry.ts` (increase for testing)

### PII Leaking

1. Review `beforeSend` function in `sentry.ts`
2. Add additional field names to filter list
3. Test with real data to ensure no PII is sent

## Testing

Run the Sentry integration tests:

```bash
npm test -- src/lib/__tests__/sentry.test.ts
```

This verifies:
- Sentry initialization
- PII filtering
- Excel operation tracking
- User context management
- Breadcrumb creation
