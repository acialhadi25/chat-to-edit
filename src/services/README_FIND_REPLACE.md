# Find and Replace Service

## Overview

The Find and Replace Service provides comprehensive search and replace functionality for Univer spreadsheets, enabling users and AI to find and replace text, numbers, and formulas with various matching options.

## Features

- **Find Operations**
  - Find all occurrences in sheet or range
  - Find next/previous occurrence
  - Case-sensitive matching
  - Whole cell matching
  - Formula text matching

- **Replace Operations**
  - Replace all occurrences
  - Replace next occurrence
  - Replace in specific range
  - Preserve formatting during replacement

- **Search Options**
  - Match case
  - Match entire cell
  - Match formula text
  - Range-specific search

## Requirements

Implements Requirements 4.2.3 from the Univer Integration spec.

## Installation

The service is automatically available when using the Univer integration. No additional installation required.

## Usage

### Basic Find

```typescript
import { createFindReplaceService } from '@/services/findReplaceService';

// Create service instance
const findReplaceService = createFindReplaceService(univerAPI, true);

// Find all occurrences
const results = await findReplaceService.findAll('hello');
console.log(`Found ${results.length} matches`);

results.forEach(result => {
  console.log(`${result.address}: ${result.value}`);
});
```

### Find with Options

```typescript
// Case-sensitive search
const results = await findReplaceService.findAll('Hello', undefined, {
  matchCase: true
});

// Match entire cell only
const results = await findReplaceService.findAll('5', undefined, {
  matchEntireCell: true
});

// Search in formulas
const results = await findReplaceService.findAll('SUM', undefined, {
  matchFormula: true
});

// Combine options
const results = await findReplaceService.findAll('Test', undefined, {
  matchCase: true,
  matchEntireCell: true
});
```

### Find in Range

```typescript
// Find in specific range
const results = await findReplaceService.findInRange('test', 'A1:D10');

// With options
const results = await findReplaceService.findInRange('test', 'A1:D10', {
  matchCase: true
});
```

### Find Next/Previous

```typescript
// Find first occurrence
const first = await findReplaceService.findNext('hello');
console.log(first?.address); // A1

// Find next occurrence
const second = await findReplaceService.findNext('hello');
console.log(second?.address); // B2

// Find from end
const last = await findReplaceService.findPrevious('hello');
console.log(last?.address); // C3
```

### Replace All

```typescript
// Replace all in entire sheet
const result = await findReplaceService.replaceAll('old', 'new');
console.log(`Replaced ${result.count} occurrences`);

// Replace with options
const result = await findReplaceService.replaceAll('Old', 'New', undefined, {
  matchCase: true
});

// Replace in specific range
const result = await findReplaceService.replaceInRange('old', 'new', 'A1:D10');
```

### Replace Next

```typescript
// Replace next occurrence
const replaced = await findReplaceService.replaceNext('old', 'new');
if (replaced) {
  console.log(`Replaced at ${replaced.address}`);
}
```

## API Reference

### FindReplaceService

#### Constructor

```typescript
constructor(univerAPI: FUniver | null, isReady: boolean)
```

#### Methods

##### findAll()

Find all occurrences of search text.

```typescript
async findAll(
  searchText: string,
  range?: string,
  options?: FindOptions
): Promise<FindResult[]>
```

**Parameters:**
- `searchText`: Text to search for
- `range`: Optional A1 notation range (e.g., "A1:D10")
- `options`: Find options

**Returns:** Array of found cells

**Example:**
```typescript
const results = await service.findAll('hello', 'A1:D10', { matchCase: true });
```

##### findNext()

Find next occurrence of search text.

```typescript
async findNext(
  searchText: string,
  options?: FindOptions
): Promise<FindResult | null>
```

**Parameters:**
- `searchText`: Text to search for
- `options`: Find options

**Returns:** Next found cell or null

##### findPrevious()

Find previous occurrence of search text.

```typescript
async findPrevious(
  searchText: string,
  options?: FindOptions
): Promise<FindResult | null>
```

**Parameters:**
- `searchText`: Text to search for
- `options`: Find options

**Returns:** Previous found cell or null

##### findInRange()

Find in specific range (convenience method).

```typescript
async findInRange(
  searchText: string,
  range: string,
  options?: FindOptions
): Promise<FindResult[]>
```

##### replaceAll()

Replace all occurrences of search text.

```typescript
async replaceAll(
  searchText: string,
  replaceText: string,
  range?: string,
  options?: FindOptions
): Promise<ReplaceResult>
```

**Parameters:**
- `searchText`: Text to search for
- `replaceText`: Text to replace with
- `range`: Optional A1 notation range
- `options`: Find options

**Returns:** Replace result with count and replaced cells

##### replaceNext()

Replace next occurrence of search text.

```typescript
async replaceNext(
  searchText: string,
  replaceText: string,
  options?: FindOptions
): Promise<FindResult | null>
```

##### replaceInRange()

Replace in specific range (convenience method).

```typescript
async replaceInRange(
  searchText: string,
  replaceText: string,
  range: string,
  options?: FindOptions
): Promise<ReplaceResult>
```

##### getCurrentState()

Get current search state.

```typescript
getCurrentState(): FindReplaceState | null
```

##### clearState()

Clear current search state.

```typescript
clearState(): void
```

##### getMatchCount()

Get match count from last search.

```typescript
getMatchCount(): number
```

## Type Definitions

### FindOptions

```typescript
interface FindOptions {
  matchCase?: boolean;        // Case-sensitive matching
  matchEntireCell?: boolean;  // Match entire cell value
  matchFormula?: boolean;     // Match formula text
}
```

### FindResult

```typescript
interface FindResult {
  cell: FRange;      // Cell range object
  row: number;       // Row index (0-based)
  column: number;    // Column index (0-based)
  value: any;        // Cell value
  address: string;   // A1 notation (e.g., "A1")
}
```

### ReplaceResult

```typescript
interface ReplaceResult {
  count: number;                // Number of replacements
  replacedCells: FindResult[];  // Array of replaced cells
}
```

### FindReplaceState

```typescript
interface FindReplaceState {
  searchText: string;
  options: FindOptions;
  matches: FindResult[];
  currentIndex: number;
}
```

## AI Integration

The Find and Replace Service integrates with the AI service to enable natural language find and replace commands.

### AI Command Examples

```typescript
// In commandParser.ts
{
  intent: 'find_replace',
  patterns: [
    /find\s+(.+)/i,
    /search\s+for\s+(.+)/i,
    /replace\s+(.+)\s+with\s+(.+)/i,
    /find\s+(.+)\s+and\s+replace\s+with\s+(.+)/i
  ]
}
```

### AI Service Integration

```typescript
// In aiService.ts
async AI_findReplace(
  searchText: string,
  replaceText?: string,
  options?: FindOptions
): Promise<AIResponse> {
  const findReplaceService = createFindReplaceService(this.univerAPI, this.isReady);
  
  if (replaceText) {
    // Replace operation
    const result = await findReplaceService.replaceAll(searchText, replaceText, undefined, options);
    return {
      success: true,
      message: `Replaced ${result.count} occurrences of "${searchText}" with "${replaceText}"`,
      data: result
    };
  } else {
    // Find operation
    const results = await findReplaceService.findAll(searchText, undefined, options);
    return {
      success: true,
      message: `Found ${results.length} occurrences of "${searchText}"`,
      data: results
    };
  }
}
```

## React Hook

Create a custom hook for easy integration in React components:

```typescript
// useUniverFindReplace.ts
import { useCallback } from 'react';
import { createFindReplaceService } from '@/services/findReplaceService';
import type { FindOptions, FindResult, ReplaceResult } from '@/services/findReplaceService';

export const useUniverFindReplace = (univerAPI: FUniver | null, isReady: boolean) => {
  const service = createFindReplaceService(univerAPI, isReady);

  const find = useCallback(
    async (searchText: string, range?: string, options?: FindOptions): Promise<FindResult[]> => {
      return service.findAll(searchText, range, options);
    },
    [service]
  );

  const replace = useCallback(
    async (
      searchText: string,
      replaceText: string,
      range?: string,
      options?: FindOptions
    ): Promise<ReplaceResult> => {
      return service.replaceAll(searchText, replaceText, range, options);
    },
    [service]
  );

  const findNext = useCallback(
    async (searchText: string, options?: FindOptions): Promise<FindResult | null> => {
      return service.findNext(searchText, options);
    },
    [service]
  );

  const replaceNext = useCallback(
    async (searchText: string, replaceText: string, options?: FindOptions): Promise<FindResult | null> => {
      return service.replaceNext(searchText, replaceText, options);
    },
    [service]
  );

  return {
    find,
    replace,
    findNext,
    replaceNext,
    getMatchCount: () => service.getMatchCount(),
    clearState: () => service.clearState()
  };
};
```

### Usage in Component

```typescript
import { useUniverFindReplace } from '@/hooks/useUniverFindReplace';

function FindReplacePanel() {
  const { univerAPI, isReady } = useUniver();
  const { find, replace } = useUniverFindReplace(univerAPI, isReady);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [results, setResults] = useState<FindResult[]>([]);

  const handleFind = async () => {
    const found = await find(searchText);
    setResults(found);
  };

  const handleReplace = async () => {
    const result = await replace(searchText, replaceText);
    alert(`Replaced ${result.count} occurrences`);
  };

  return (
    <div>
      <input value={searchText} onChange={e => setSearchText(e.target.value)} />
      <input value={replaceText} onChange={e => setReplaceText(e.target.value)} />
      <button onClick={handleFind}>Find</button>
      <button onClick={handleReplace}>Replace All</button>
      <div>Found {results.length} matches</div>
    </div>
  );
}
```

## Error Handling

The service throws descriptive errors for invalid inputs:

```typescript
try {
  await service.findAll('test', 'invalid-range');
} catch (error) {
  console.error(error.message); // "Invalid range notation: invalid-range"
}

try {
  await service.findAll(null);
} catch (error) {
  console.error(error.message); // "Search text cannot be null or undefined"
}

try {
  await service.replaceAll('old', null);
} catch (error) {
  console.error(error.message); // "Replace text cannot be null or undefined"
}
```

## Best Practices

### 1. Always Use Async/Await

```typescript
// ✅ Good
const results = await service.findAll('search');

// ❌ Bad
service.findAll('search'); // Missing await
```

### 2. Check Results Before Replace

```typescript
// ✅ Good
const results = await service.findAll('old');
if (results.length > 0) {
  const confirm = window.confirm(`Replace ${results.length} occurrences?`);
  if (confirm) {
    await service.replaceAll('old', 'new');
  }
}
```

### 3. Handle Empty Results

```typescript
// ✅ Good
const results = await service.findAll('search');
if (results.length === 0) {
  console.log('No matches found');
  return;
}
```

### 4. Use Appropriate Options

```typescript
// ✅ Good: Use matchEntireCell for exact matches
const results = await service.findAll('5', undefined, {
  matchEntireCell: true
});

// ✅ Good: Use matchCase for case-sensitive search
const results = await service.findAll('Hello', undefined, {
  matchCase: true
});
```

### 5. Clear State When Done

```typescript
// ✅ Good
await service.findAll('search');
// ... use results ...
service.clearState(); // Clean up
```

## Performance Considerations

- **Large Datasets**: Finding in large sheets may take time. Consider showing a loading indicator.
- **Range Filtering**: When searching in a specific range, the service filters results client-side after Univer's search.
- **Replace Operations**: Replacing in a range requires individual cell updates, which may be slower than sheet-wide replacement.

## Testing

The service includes comprehensive tests covering:
- Find all matches
- Find next/previous
- Replace all
- Replace in range
- Case-sensitive matching
- Whole cell matching
- Formula matching
- Edge cases (empty strings, special characters, unicode)

Run tests:
```bash
npm test findReplaceService.test.ts
```

## Related Documentation

- [Univer Find & Replace Documentation](../../../docs/univer/features/find-replace.md)
- [Sort and Filter Service](./README_SORT_FILTER.md)
- [AI Service](./aiService.ts)
- [Command Parser](./commandParser.ts)

## Troubleshooting

### Issue: No matches found

**Solution**: Try without options first, then add options incrementally.

```typescript
// Start simple
const results = await service.findAll('search');

// If no results, check options
const results = await service.findAll('search', undefined, {
  matchCase: false,
  matchEntireCell: false
});
```

### Issue: Replace not working

**Solution**: Ensure await is used and check for errors.

```typescript
try {
  const result = await service.replaceAll('old', 'new');
  console.log(`Replaced ${result.count} occurrences`);
} catch (error) {
  console.error('Replace failed:', error);
}
```

### Issue: Range filtering not working

**Solution**: Verify range notation is correct (A1 notation).

```typescript
// ✅ Correct
await service.findInRange('test', 'A1:D10');

// ❌ Wrong
await service.findInRange('test', 'A1-D10'); // Invalid notation
```

## Version History

- **v1.0.0** (2024): Initial implementation with full find and replace support
