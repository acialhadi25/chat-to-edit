# Error Handling System

Comprehensive error handling system for the Univer integration with centralized error types, logging, recovery strategies, and graceful degradation.

## Overview

The error handling system provides:

1. **Centralized Error Types** - Structured error classes with error codes
2. **Error Logging & Monitoring** - Comprehensive logging with database persistence
3. **Error Recovery** - Retry logic, fallback mechanisms, and circuit breakers
4. **Graceful Degradation** - Feature flags for disabling failing features

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Services, Components, Hooks)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Error Handling Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Error Types  │  │ Error Logger │  │   Recovery   │      │
│  │  & Codes     │  │ & Monitoring │  │  Strategies  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  (Supabase Database, Console Logging)                       │
└─────────────────────────────────────────────────────────────┘
```

## Error Types

### Error Categories

1. **User Input Errors (4xx)** - Validation errors, invalid references
2. **AI Command Errors (5xx)** - Command parsing, parameter errors
3. **System Errors (6xx)** - Database, network, initialization errors
4. **Permission Errors (7xx)** - Authentication, authorization errors
5. **Import/Export Errors (8xx)** - File format, size errors
6. **Chart Errors (9xx)** - Chart creation, update errors

### Error Classes

```typescript
// Base error class
class UniverError extends Error {
  code: ErrorCode;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
  originalError?: Error;
  timestamp: Date;
}

// Specialized error classes
class ValidationError extends UniverError
class AICommandError extends UniverError
class SystemError extends UniverError
class PermissionError extends UniverError
```

### Error Factory Functions

```typescript
// Validation errors
createValidationError.invalidCellReference('ZZZ999')
createValidationError.invalidFormula('SUM(A1:A10', 'missing )')
createValidationError.outOfBounds(1000, 1000, 100, 100)

// AI errors
createAIError.unrecognizedCommand('do magic')
createAIError.missingParameter('range', 'sort data')
createAIError.ambiguousCommand('sort', ['sort asc', 'sort desc'])

// System errors
createSystemError.databaseError('save workbook', error)
createSystemError.networkError('fetch data')
createSystemError.univerNotReady()

// Permission errors
createPermissionError.unauthorized()
createPermissionError.readOnlyViolation('delete row')
```

## Error Logging

### ErrorLogger Class

Singleton class for centralized error logging:

```typescript
import { logError, logWarning, logInfo } from '@/utils/errorLogger';

// Log an error
await logError(error, {
  userId: 'user-123',
  workbookId: 'wb-456',
  operation: 'saveWorkbook',
  additionalContext: { size: 1024 },
});

// Log a warning
await logWarning('Auto-save failed', {
  workbookId: 'wb-456',
  operation: 'autoSave',
});

// Log info
await logInfo('Workbook loaded successfully', {
  workbookId: 'wb-456',
  operation: 'loadWorkbook',
});
```

### Features

- **In-Memory Logs** - Keep last 1000 logs in memory
- **Database Persistence** - Log errors to Supabase for analysis
- **Console Logging** - Structured console output
- **Event Listeners** - Subscribe to error events
- **Statistics** - Get error counts by code and level

### Error Statistics

```typescript
import { getErrorStats, getRecentErrors } from '@/utils/errorLogger';

// Get statistics
const stats = getErrorStats();
console.log(stats.totalErrors);
console.log(stats.errorsByCode);
console.log(stats.errorsByLevel);

// Get recent errors
const recent = getRecentErrors(10);
```

## Error Recovery

### Retry Logic

Automatic retry with exponential backoff for transient errors:

```typescript
import { withRetry } from '@/utils/errorRecovery';

const result = await withRetry(
  () => saveToDatabase(data),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error);
    },
  }
);
```

**Default Retryable Errors:**
- `NETWORK_ERROR`
- `API_RATE_LIMIT`
- `DATABASE_ERROR`
- `MCP_CONNECTION_ERROR`
- `UNIVER_NOT_READY`

### Fallback Mechanisms

Provide fallback values or functions when operations fail:

```typescript
import { withFallback } from '@/utils/errorRecovery';

// Fallback value
const result = await withFallback(
  () => fetchUserPreferences(),
  { fallbackValue: defaultPreferences }
);

// Fallback function
const result = await withFallback(
  () => fetchFromAPI(),
  { fallbackFn: () => fetchFromCache() }
);
```

### Combined Retry + Fallback

```typescript
import { withRetryAndFallback } from '@/utils/errorRecovery';

const result = await withRetryAndFallback(
  () => saveToDatabase(data),
  { maxAttempts: 3, delayMs: 1000 },
  { fallbackValue: null }
);
```

### Circuit Breaker

Prevent cascading failures by opening circuit after threshold:

```typescript
import { CircuitBreaker } from '@/utils/errorRecovery';

const breaker = new CircuitBreaker('database', {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});

const result = await breaker.execute(() => queryDatabase());
```

**States:**
- `CLOSED` - Normal operation
- `OPEN` - Failing, reject immediately
- `HALF_OPEN` - Testing recovery

## Graceful Degradation

### Feature Flags

Disable failing features to maintain core functionality:

```typescript
import { featureFlags, withFeatureFlag } from '@/utils/errorRecovery';

// Check if feature is enabled
if (featureFlags.isEnabled('charts')) {
  createChart(data);
}

// Execute with feature flag
const result = await withFeatureFlag(
  'charts',
  () => createChart(data),
  null // fallback value
);

// Manually disable feature
featureFlags.disable('charts');
```

**Available Features:**
- `ai` - AI integration
- `mcp` - Model Context Protocol
- `charts` - Chart creation
- `collaboration` - Real-time collaboration
- `autoSave` - Auto-save functionality
- `versionHistory` - Version history
- `importExport` - Import/export features

## Service Integration

### AI Service

```typescript
// Enhanced with error handling
async processCommand(command: string): Promise<AIResponse> {
  try {
    // Validate input
    if (!command || command.trim().length === 0) {
      throw createAIError.invalidParameter('command', command, 'empty');
    }

    // Execute with retry
    const result = await withRetry(
      () => this.executeCommand(parsedCommand),
      { maxAttempts: 2, delayMs: 500 }
    );

    await logInfo('Command executed successfully', {
      operation: 'AIService.processCommand',
      details: { command },
    });

    return result;
  } catch (error) {
    await logError(error, {
      operation: 'AIService.processCommand',
      additionalContext: { command },
    });

    return {
      success: false,
      message: error.message,
      operations: [],
      requiresConfirmation: false,
      error: error.message,
    };
  }
}
```

### Storage Service

```typescript
// Enhanced with error handling
async saveWorkbook(workbookId: string, data: IWorkbookData): Promise<void> {
  try {
    // Validate inputs
    if (!workbookId || workbookId.trim().length === 0) {
      throw createValidationError.invalidWorksheet(workbookId);
    }

    // Save with retry
    await withRetry(
      () => database.save(workbookId, data),
      { maxAttempts: 3, delayMs: 1000 }
    );

    await logInfo('Workbook saved successfully', {
      workbookId,
      operation: 'StorageService.saveWorkbook',
    });
  } catch (error) {
    await logError(error, {
      workbookId,
      operation: 'StorageService.saveWorkbook',
    });
    throw error;
  }
}
```

## Error Response Format

### Success Response

```typescript
{
  success: true,
  data: any,
  message?: string
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: ErrorCode,
    message: string,
    details?: any,
    recoverable: boolean,
    suggestedAction?: string,
    timestamp: string
  }
}
```

## Testing

### Unit Tests

```typescript
// Test error creation
it('should create validation error', () => {
  const error = createValidationError.invalidCellReference('ZZZ999');
  expect(error.code).toBe(ErrorCode.INVALID_CELL_REFERENCE);
  expect(error.recoverable).toBe(true);
});

// Test error conversion
it('should convert to error response', () => {
  const error = createValidationError.invalidFormula('INVALID');
  const response = toErrorResponse(error);
  expect(response.success).toBe(false);
  expect(response.error.code).toBe(ErrorCode.INVALID_FORMULA);
});
```

### Recovery Tests

```typescript
// Test retry logic
it('should retry on transient error', async () => {
  const operation = vi.fn()
    .mockRejectedValueOnce(createSystemError.networkError('test'))
    .mockResolvedValue('success');

  const result = await withRetry(operation, {
    maxAttempts: 3,
    delayMs: 10,
  });

  expect(result).toBe('success');
  expect(operation).toHaveBeenCalledTimes(2);
});

// Test circuit breaker
it('should open circuit after threshold failures', async () => {
  const breaker = new CircuitBreaker('test', { failureThreshold: 3 });
  const operation = vi.fn().mockRejectedValue(new Error('test'));

  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(operation);
    } catch {
      // Expected
    }
  }

  expect(breaker.getState()).toBe('open');
});
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// ❌ Bad
throw new Error('Invalid cell reference');

// ✅ Good
throw createValidationError.invalidCellReference('ZZZ999');
```

### 2. Log Errors with Context

```typescript
// ❌ Bad
console.error('Error:', error);

// ✅ Good
await logError(error, {
  userId,
  workbookId,
  operation: 'saveWorkbook',
  additionalContext: { size: data.length },
});
```

### 3. Use Retry for Transient Errors

```typescript
// ❌ Bad
try {
  await saveToDatabase(data);
} catch (error) {
  throw error;
}

// ✅ Good
await withRetry(
  () => saveToDatabase(data),
  { maxAttempts: 3, delayMs: 1000 }
);
```

### 4. Provide Fallbacks

```typescript
// ❌ Bad
const preferences = await fetchUserPreferences();

// ✅ Good
const preferences = await withFallback(
  () => fetchUserPreferences(),
  { fallbackValue: defaultPreferences }
);
```

### 5. Use Circuit Breakers for External Services

```typescript
// ❌ Bad
const data = await externalAPI.fetch();

// ✅ Good
const breaker = new CircuitBreaker('external-api', {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});
const data = await breaker.execute(() => externalAPI.fetch());
```

## Monitoring & Debugging

### View Error Statistics

```typescript
import { getErrorStats } from '@/utils/errorLogger';

const stats = getErrorStats();
console.log('Total errors:', stats.totalErrors);
console.log('Errors by code:', stats.errorsByCode);
console.log('Recent errors:', stats.recentErrors);
```

### Subscribe to Errors

```typescript
import { subscribeToErrors } from '@/utils/errorLogger';

const unsubscribe = subscribeToErrors((entry) => {
  console.log('Error occurred:', entry);
  // Send to monitoring service
  sendToMonitoring(entry);
});

// Later: unsubscribe()
```

### Check Feature Status

```typescript
import { featureFlags } from '@/utils/errorRecovery';

const flags = featureFlags.getAll();
console.log('Feature flags:', flags);
```

## Database Schema

Error logs are persisted to Supabase:

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP NOT NULL,
  level TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  stack TEXT,
  user_id UUID REFERENCES auth.users(id),
  workbook_id UUID,
  context JSONB,
  recoverable BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_code ON error_logs(code);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
```

## Files

- `src/utils/errors.ts` - Error types, codes, and factory functions
- `src/utils/errorLogger.ts` - Logging and monitoring utilities
- `src/utils/errorRecovery.ts` - Retry, fallback, circuit breaker, feature flags
- `src/utils/__tests__/errors.test.ts` - Error handling tests
- `src/utils/__tests__/errorRecovery.test.ts` - Recovery strategy tests

## Requirements

Validates **Technical Requirements 4 - Security Requirements**:
- ✅ Error handling and logging
- ✅ Graceful degradation
- ✅ Input validation for AI commands

---

**Last Updated**: 2024
**Status**: Implemented and Tested
