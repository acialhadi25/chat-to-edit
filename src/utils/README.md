# Utils Directory

This directory contains utility functions and helper modules used throughout the ChaTtoEdit application.

## Structure

### `/excel/` - Excel Operations

Core Excel manipulation functions organized by category:

- **basicOperations.ts** - Fundamental cell operations (get, set, clear, clone)
- **dataManipulation.ts** - Data transformation (sort, filter, deduplicate, fill)
- **textOperations.ts** - Text processing (find/replace, trim, transform, split/merge)
- **columnOperations.ts** - Column management (add, delete, rename, copy)
- **analysisOperations.ts** - Data analysis (statistics, grouping, search)

All operations follow immutable patterns and return new data objects.

### `/formulas/` - Formula Evaluation

Excel formula evaluation engine:

- **mathFormulas.ts** - Mathematical functions (SUM, AVERAGE, COUNT, etc.)
- **textFormulas.ts** - Text manipulation functions (CONCATENATE, LEFT, RIGHT, etc.)
- **logicalFormulas.ts** - Logical operations (IF, AND, OR, NOT)
- **dateFormulas.ts** - Date/time functions (NOW, TODAY, DATE, etc.)
- **lookupFormulas.ts** - Lookup and reference functions (VLOOKUP, INDEX, MATCH)
- **helpers.ts** - Shared formula utilities (cell reference parsing, range expansion)

### Other Utilities

- **excelOperations.ts** - Main entry point for Excel operations (legacy, being migrated to `/excel/`)
- **formulaEvaluator.ts** - Formula parsing and evaluation coordinator
- **formulaCache.ts** - LRU cache for formula results to improve performance
- **typeGuards.ts** - TypeScript type guards for runtime validation
- **excelServerProcessor.ts** - Client for server-side Excel processing

## Usage Examples

### Basic Cell Operations

```typescript
import { getCellValue, setCellValue, cloneExcelData } from '@/utils/excel/basicOperations';

// Get a cell value
const value = getCellValue(data, 0, 0); // Column 0, Row 0 (A1)

// Set a cell value
const { data: newData, change } = setCellValue(data, 0, 0, 'Hello');

// Clone data for immutability
const cloned = cloneExcelData(data);
```

### Data Manipulation

```typescript
import { sortData, filterData, removeDuplicates } from '@/utils/excel/dataManipulation';

// Sort by column
const sorted = sortData(data, 0, 'asc');

// Filter rows
const filtered = filterData(data, 0, 'contains', 'search term');

// Remove duplicate rows
const { data: unique, removedCount } = removeDuplicates(data);
```

### Formula Evaluation

```typescript
import { evaluateFormula } from '@/utils/formulaEvaluator';

// Evaluate a formula
const result = evaluateFormula('=SUM(A1:A10)', data);

// With caching
import { useFormulaWorker } from '@/hooks/useFormulaWorker';
const { evaluateAsync } = useFormulaWorker();
const result = await evaluateAsync('=SUM(A1:A10)', data);
```

## Design Principles

1. **Immutability** - All operations return new objects, never mutate input
2. **Type Safety** - Full TypeScript coverage with strict mode enabled
3. **Performance** - Lazy loading, code splitting, and caching where appropriate
4. **Testability** - Pure functions with comprehensive unit test coverage
5. **Error Handling** - Graceful error handling with user-friendly messages

## Testing

All utility functions have corresponding test files in `__tests__/` directories:

```bash
# Run all utility tests
npm test src/utils

# Run specific test file
npm test src/utils/excel/__tests__/basicOperations.test.ts
```

## Code Quality

- **Coverage Target**: 80% for utility functions
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with project configuration
- **Documentation**: JSDoc comments on all public functions

## Contributing

When adding new utility functions:

1. Place in appropriate category directory
2. Follow immutable patterns
3. Add comprehensive JSDoc comments
4. Write unit tests (80% coverage minimum)
5. Update this README if adding new categories
