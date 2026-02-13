# Excel Operations - Code Splitting

This directory contains Excel operations split by category for improved code splitting and bundle size optimization.

## Structure

### Basic Operations (`basicOperations.ts`)
Always loaded - core functionality needed immediately:
- `cloneExcelData` - Clone data for immutability
- `getCellValue` - Get cell value
- `setCellValue` - Set cell value
- `clearCells` - Clear cell range
- `applyChanges` - Apply pending changes

### Data Manipulation (`dataManipulation.ts`)
Lazy loaded - sorting, filtering, deduplication:
- `sortData` - Sort by column
- `filterData` - Filter by condition
- `removeDuplicates` - Remove duplicate rows
- `fillDown` - Fill down values

### Text Operations (`textOperations.ts`)
Lazy loaded - text manipulation:
- `findReplace` - Find and replace text
- `trimCells` - Trim whitespace
- `transformText` - Transform case
- `splitColumn` - Split by delimiter
- `mergeColumns` - Merge with separator

### Column Operations (`columnOperations.ts`)
Lazy loaded - column management:
- `addColumn` - Add new column
- `deleteColumn` - Delete column
- `renameColumn` - Rename column
- `copyColumn` - Copy column
- `deleteRows` - Delete rows
- `removeEmptyRows` - Remove empty rows

### Analysis Operations (`analysisOperations.ts`)
Lazy loaded - statistics and analysis:
- `calculateStatistics` - Calculate stats
- `createGroupSummary` - Group and aggregate
- `findCells` - Find matching cells
- `analyzeDataForCleansing` - Analyze data quality

## Usage

### Basic Operations (Always Available)
```typescript
import { getCellValue, setCellValue } from "@/utils/excel";

const value = getCellValue(data, 0, 0);
const { data: newData } = setCellValue(data, 0, 0, "New Value");
```

### Lazy Loaded Operations
```typescript
import { loadDataManipulation } from "@/utils/excel";

// Load when needed
const { sortData, filterData } = await loadDataManipulation();
const { data: sorted } = sortData(data, 0, "asc");
```

### With React
```typescript
import { loadTextOperations } from "@/utils/excel";
import { useState, useEffect } from "react";

function MyComponent() {
  const [textOps, setTextOps] = useState<TextOps | null>(null);
  
  useEffect(() => {
    loadTextOperations().then(setTextOps);
  }, []);
  
  const handleFindReplace = () => {
    if (textOps) {
      const { data: updated } = textOps.findReplace(data, "old", "new");
      setData(updated);
    }
  };
}
```

## Benefits

1. **Reduced Initial Bundle Size**: Basic operations are ~5KB, while specialized operations are loaded on demand
2. **Faster Initial Load**: Users get core functionality immediately
3. **Better Caching**: Separate chunks can be cached independently
4. **Improved Performance**: Only load what you need

## Migration from Old API

Old code:
```typescript
import { sortData, findReplace } from "@/utils/excelOperations";
```

New code:
```typescript
import { loadDataManipulation, loadTextOperations } from "@/utils/excel";

const { sortData } = await loadDataManipulation();
const { findReplace } = await loadTextOperations();
```

## Performance Metrics

- Basic operations: ~5KB (always loaded)
- Data manipulation: ~8KB (lazy loaded)
- Text operations: ~10KB (lazy loaded)
- Column operations: ~6KB (lazy loaded)
- Analysis operations: ~7KB (lazy loaded)

Total savings: ~31KB deferred until needed
