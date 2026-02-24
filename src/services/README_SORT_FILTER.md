# Sort and Filter Service Documentation

## Overview

The Sort and Filter Service provides comprehensive data sorting and filtering capabilities for Univer Sheet Integration. It supports single and multiple column sorting, complex filtering with multiple criteria, and filter state management.

**Requirements**: 4.2.1 (Data sorting), 4.2.2 (Data filtering)

## Features

### Sorting
- ✅ Single column sort (ascending/descending)
- ✅ Multiple column sort with priority
- ✅ Integration with Univer's native sort API
- ✅ Flexible configuration options

### Filtering
- ✅ 13 filter operators (equals, contains, greaterThan, etc.)
- ✅ Multiple criteria with AND/OR logic
- ✅ Filter state management
- ✅ Client-side filtering implementation

## Installation

```typescript
import { createSortFilterService } from './services/sortFilterService';
import type { FUniver } from './types/univer.types';

// Create service instance
const service = createSortFilterService(univerAPI, isReady);
```

## API Reference

### Sort Methods

#### `sortData(range, sortConfig)`

Sort data in a range by single or multiple columns.

**Parameters:**
- `range` (string): A1 notation range (e.g., "A2:D10")
- `sortConfig` (SortConfig | SortConfig[]): Sort configuration

**Returns:** `Promise<boolean>` - Success status

**Examples:**

```typescript
// Single column sort (ascending)
await service.sortData('A2:D10', { column: 0, ascending: true });

// Single column sort (descending)
await service.sortData('A2:D10', { column: 1, ascending: false });

// Multiple column sort
await service.sortData('A2:D10', [
  { column: 0, ascending: true },  // Primary sort
  { column: 2, ascending: false }  // Secondary sort
]);

// Using simple config with order
await service.sortData('A2:D10', { column: 0, order: 'asc' });
```

#### `sortByColumn(range, column, order)`

Convenience method to sort by a single column.

**Parameters:**
- `range` (string): A1 notation range
- `column` (number): Column index (0-based)
- `order` (SortOrder): 'asc' or 'desc' (default: 'asc')

**Returns:** `Promise<boolean>` - Success status

**Example:**

```typescript
// Sort by first column ascending
await service.sortByColumn('A2:D10', 0, 'asc');

// Sort by second column descending
await service.sortByColumn('A2:D10', 1, 'desc');
```

### Filter Methods

#### `filterData(range, filterConfig)`

Filter data in a range based on criteria.

**Parameters:**
- `range` (string): A1 notation range
- `filterConfig` (FilterConfig): Filter configuration with criteria and logic

**Returns:** `Promise<boolean>` - Success status

**Examples:**

```typescript
// Single criterion filter
await service.filterData('A2:D10', {
  criteria: [{ column: 0, operator: 'equals', value: 'Active' }]
});

// Multiple criteria with AND logic
await service.filterData('A2:D10', {
  criteria: [
    { column: 0, operator: 'equals', value: 'Active' },
    { column: 2, operator: 'greaterThan', value: 100 }
  ],
  logic: 'AND'
});

// Multiple criteria with OR logic
await service.filterData('A2:D10', {
  criteria: [
    { column: 1, operator: 'contains', value: 'test' },
    { column: 1, operator: 'startsWith', value: 'demo' }
  ],
  logic: 'OR'
});
```

#### `filterByColumn(range, column, operator, value)`

Convenience method to filter by a single criterion.

**Parameters:**
- `range` (string): A1 notation range
- `column` (number): Column index (0-based)
- `operator` (FilterOperator): Filter operator
- `value` (any): Filter value

**Returns:** `Promise<boolean>` - Success status

**Example:**

```typescript
// Filter by equals
await service.filterByColumn('A2:D10', 0, 'equals', 'Active');

// Filter by contains
await service.filterByColumn('A2:D10', 1, 'contains', 'test');

// Filter by greater than
await service.filterByColumn('A2:D10', 2, 'greaterThan', 100);
```

#### `clearFilter(range)`

Clear filter from a specific range.

**Parameters:**
- `range` (string): A1 notation range

**Returns:** `Promise<boolean>` - Success status

**Example:**

```typescript
await service.clearFilter('A2:D10');
```

#### `clearAllFilters()`

Clear all filters from all ranges.

**Returns:** `Promise<boolean>` - Success status

**Example:**

```typescript
await service.clearAllFilters();
```

### Filter State Methods

#### `getFilteredData(range)`

Get filtered data (rows that match the filter).

**Parameters:**
- `range` (string): A1 notation range

**Returns:** `any[][] | null` - Filtered data or null if no filter applied

**Example:**

```typescript
const filtered = service.getFilteredData('A2:D10');
console.log(`Filtered rows: ${filtered?.length}`);
```

#### `getFilterState(range)`

Get filter state for a range.

**Parameters:**
- `range` (string): A1 notation range

**Returns:** `FilterState | null` - Filter state or null

**Example:**

```typescript
const state = service.getFilterState('A2:D10');
if (state) {
  console.log(`Filter applied: ${state.filteredIndices.length} rows match`);
}
```

#### `hasFilter(range)`

Check if a range has an active filter.

**Parameters:**
- `range` (string): A1 notation range

**Returns:** `boolean` - True if filter is active

**Example:**

```typescript
if (service.hasFilter('A2:D10')) {
  console.log('Filter is active');
}
```

## Type Definitions

### SortConfig

```typescript
interface SortConfig {
  column: number;      // Column index (0-based)
  ascending: boolean;  // Sort direction
}

// Or use simple config
interface SimpleSortConfig {
  column: number;
  order?: 'asc' | 'desc';  // Default: 'asc'
}
```

### FilterConfig

```typescript
interface FilterConfig {
  criteria: FilterCriterion[];
  logic?: 'AND' | 'OR';  // Default: 'AND'
}

interface FilterCriterion {
  column: number;
  operator: FilterOperator;
  value: any;
  value2?: any;  // For 'between' operator
}
```

### FilterOperator

Available operators:
- `'equals'` - Exact match (case-insensitive for strings)
- `'notEquals'` - Not equal
- `'greaterThan'` - Greater than
- `'greaterThanOrEqual'` - Greater than or equal
- `'lessThan'` - Less than
- `'lessThanOrEqual'` - Less than or equal
- `'contains'` - Contains substring (case-insensitive)
- `'notContains'` - Does not contain substring
- `'startsWith'` - Starts with (case-insensitive)
- `'endsWith'` - Ends with (case-insensitive)
- `'isEmpty'` - Is null, undefined, or empty string
- `'isNotEmpty'` - Is not null, undefined, or empty string
- `'between'` - Between two values (requires value2)

## Usage Examples

### Example 1: Sort Employee Data

```typescript
// Sort employees by department (ascending), then by salary (descending)
await service.sortData('A2:D100', [
  { column: 0, ascending: true },  // Department
  { column: 3, ascending: false }  // Salary
]);
```

### Example 2: Filter Active Users

```typescript
// Filter for active users with score > 80
await service.filterData('A2:C50', {
  criteria: [
    { column: 0, operator: 'equals', value: 'Active' },
    { column: 2, operator: 'greaterThan', value: 80 }
  ],
  logic: 'AND'
});

// Get filtered results
const filtered = service.getFilteredData('A2:C50');
console.log(`Found ${filtered?.length} active users with score > 80`);
```

### Example 3: Complex Filter with OR Logic

```typescript
// Filter for emails containing 'test' OR names starting with 'Admin'
await service.filterData('A2:B100', {
  criteria: [
    { column: 1, operator: 'contains', value: 'test' },
    { column: 0, operator: 'startsWith', value: 'Admin' }
  ],
  logic: 'OR'
});
```

### Example 4: Filter by Date Range

```typescript
// Filter for dates between 2024-01-01 and 2024-12-31
await service.filterData('A2:C100', {
  criteria: [
    { 
      column: 2, 
      operator: 'between', 
      value: new Date('2024-01-01'), 
      value2: new Date('2024-12-31') 
    }
  ]
});
```

### Example 5: Clear Filters

```typescript
// Clear specific filter
await service.clearFilter('A2:D10');

// Or clear all filters
await service.clearAllFilters();
```

## Best Practices

### 1. Exclude Headers from Sort/Filter

```typescript
// ❌ Bad: Includes header row
await service.sortData('A1:C10', { column: 0, ascending: true });

// ✅ Good: Exclude header row
await service.sortData('A2:C10', { column: 0, ascending: true });
```

### 2. Use Multiple Column Sort for Complex Ordering

```typescript
// ✅ Good: Clear sort priority
await service.sortData('A2:D100', [
  { column: 0, ascending: true },  // Primary: Department
  { column: 1, ascending: true },  // Secondary: Name
  { column: 3, ascending: false }  // Tertiary: Salary
]);
```

### 3. Check Filter State Before Operations

```typescript
// ✅ Good: Check if filter exists
if (service.hasFilter('A2:D10')) {
  await service.clearFilter('A2:D10');
}

// Then apply new filter
await service.filterData('A2:D10', { /* config */ });
```

### 4. Handle Empty Results

```typescript
// ✅ Good: Handle null results
const filtered = service.getFilteredData('A2:D10');
if (filtered && filtered.length > 0) {
  console.log(`Found ${filtered.length} matching rows`);
} else {
  console.log('No matching rows found');
}
```

### 5. Use Appropriate Operators

```typescript
// ✅ Good: Use case-insensitive operators for text
await service.filterByColumn('A2:A100', 0, 'contains', 'test');

// ✅ Good: Use numeric operators for numbers
await service.filterByColumn('B2:B100', 1, 'greaterThan', 100);

// ✅ Good: Use between for ranges
await service.filterData('C2:C100', {
  criteria: [{ column: 2, operator: 'between', value: 10, value2: 50 }]
});
```

## Error Handling

The service throws errors for invalid inputs:

```typescript
try {
  await service.sortData('A2:D10', { column: 0, ascending: true });
} catch (error) {
  console.error('Sort failed:', error.message);
  // Handle error (show user notification, etc.)
}
```

Common errors:
- Invalid range notation
- Invalid column index (negative)
- Invalid operator
- Missing required values
- Univer not ready

## Limitations

### Filter Implementation

The current filter implementation is **client-side** because Univer's Facade API doesn't have native filter support yet. This means:

1. **Filter state is stored in memory** - Filters are tracked by the service but don't persist across page reloads
2. **Rows are not actually hidden** - The service identifies which rows match the filter but doesn't hide non-matching rows in the UI
3. **Use `getFilteredData()` to get results** - To work with filtered data, retrieve it using the `getFilteredData()` method

**Future Enhancement**: When Univer adds native filter support to the Facade API, this service can be updated to use row hiding/showing for a more integrated experience.

### Sort Implementation

Sorting uses Univer's native sort API and works as expected with full integration.

## Performance Considerations

- **Sorting**: Handled by Univer's native implementation, optimized for large datasets
- **Filtering**: Client-side evaluation, suitable for datasets up to ~10,000 rows
- **Filter State**: Stored in memory, minimal overhead

## Testing

The service includes comprehensive unit tests covering:
- ✅ 61 tests total
- ✅ Single and multiple column sorting
- ✅ All 13 filter operators
- ✅ AND/OR logic
- ✅ Filter state management
- ✅ Error handling
- ✅ Edge cases

Run tests:
```bash
npm test -- sortFilterService.test.ts
```

## Integration with Univer

### Sort Integration

Uses Univer's native sort API from `@univerjs/sheets-sort/facade`:

```typescript
// The service calls Univer's sort method
rangeObj.sort(sortConfig);
```

See [Sort Documentation](../../../docs/univer/features/sort.md) for more details.

### Filter Integration

Currently implements client-side filtering. When Univer adds native filter support, the service can be updated to use:

```typescript
// Future implementation (when available)
rangeObj.applyFilter(filterConfig);
```

## Related Documentation

- [Univer Sort Feature](../../../docs/univer/features/sort.md)
- [Formatting Service](./README_FORMATTING.md)
- [Storage Service](./README_STORAGE.md)
- [Type Definitions](../types/univer.types.ts)

## Support

For issues or questions:
1. Check the [Univer Documentation](https://docs.univer.ai)
2. Review test cases for usage examples
3. See [Integration Guide](../../../docs/univer/integration/README.md)

---

**Version**: 1.0  
**Last Updated**: 2024  
**Requirements**: 4.2.1, 4.2.2  
**Test Coverage**: 61 tests passing
