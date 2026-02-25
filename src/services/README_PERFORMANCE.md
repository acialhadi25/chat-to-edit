# Performance Optimization

This document describes the performance optimization features implemented for the Univer Sheet integration.

## Overview

The performance optimization system provides:
- **Web Workers** for offloading heavy computations
- **Caching** for frequently accessed data
- **Memoization** for expensive operations
- **Virtual Scrolling** for large datasets
- **Lazy Loading** for worksheets
- **Debouncing/Throttling** for event handlers

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Performance Layer                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Worker     │  │    Cache     │  │  Virtual     │ │
│  │   Thread     │  │   Service    │  │  Scrolling   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Memoization  │  │  Debounce/   │  │    Lazy      │ │
│  │              │  │  Throttle    │  │   Loading    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Performance Service

**Location**: `src/services/performanceService.ts`

Provides core performance utilities:

```typescript
import { performanceService, PerformanceService } from '@/services/performanceService';

// Cache operations
performanceService.set('key', value);
const cached = performanceService.get('key');
performanceService.clear();

// Metrics
const metrics = performanceService.getMetrics();
const hitRate = performanceService.getCacheHitRate();

// Static utilities
const debounced = PerformanceService.debounce(fn, 300);
const throttled = PerformanceService.throttle(fn, 100);
const memoized = PerformanceService.memoize(fn);
```

**Features**:
- LRU cache with TTL support
- Automatic eviction when cache is full
- Performance metrics tracking
- Debounce/throttle utilities
- Memoization helpers
- Batch processing
- Memory estimation

### 2. Web Worker

**Location**: `src/workers/univer.worker.ts`

Offloads heavy computations to background thread:

```typescript
// Worker is automatically initialized by useUniverPerformance
// Handles formula calculations in background
```

**Benefits**:
- Non-blocking UI
- Better responsiveness
- Utilizes multiple CPU cores
- Smooth scrolling during calculations

### 3. Performance Hooks

**Location**: `src/hooks/useUniverPerformance.ts`

#### useUniverPerformance

Main hook for performance features:

```typescript
const {
  isWorkerSupported,
  isWorkerEnabled,
  workerURL,
  cacheMetrics,
  clearCache,
  measurePerformance,
} = useUniverPerformance({
  enableWorker: true,
  enableCaching: true,
  cacheSize: 1000,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
});
```

#### useLazyWorksheet

Lazy load worksheets on demand:

```typescript
const { data, isLoading, error, load } = useLazyWorksheet(
  'sheet1',
  async () => {
    // Load worksheet data
    return await fetchWorksheet('sheet1');
  }
);

// Load when needed
useEffect(() => {
  load();
}, []);
```

#### useVirtualScrolling

Virtual scrolling for large datasets:

```typescript
const {
  visibleRange,
  handleScroll,
  totalHeight,
  offsetY,
} = useVirtualScrolling(
  totalRows,    // 10000
  rowHeight,    // 30
  containerHeight // 600
);

// Render only visible rows
const visibleRows = rows.slice(
  visibleRange.start,
  visibleRange.end
);
```

#### useDebouncedValue

Debounce value updates:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  // Only runs after 300ms of no changes
  performSearch(debouncedSearch);
}, [debouncedSearch]);
```

#### useThrottledCallback

Throttle callback execution:

```typescript
const handleScroll = useThrottledCallback(
  (event) => {
    // Handle scroll
  },
  100 // Max once per 100ms
);
```

#### useMemoizedComputation

Memoize expensive computations:

```typescript
const result = useMemoizedComputation(
  () => {
    // Expensive computation
    return calculateStatistics(data);
  },
  [data],
  'stats-cache-key' // Optional cache key
);
```

## Integration with Univer

### Enhanced useUniver Hook

The `useUniver` hook now supports worker integration:

```typescript
const {
  univerAPI,
  univer,
  isReady,
  getCellValue,
  setCellValue,
  // ... other operations
} = useUniver({
  container,
  initialData,
  enableWorker: true,    // Enable web worker
  enableCaching: true,   // Enable caching
});
```

### Enhanced Cell Operations

Cell operations now include caching:

```typescript
// getCellValue checks cache first
const value = getCellValue(0, 0);

// setCellValue invalidates cache
await setCellValue(0, 0, 'new value');

// getRangeValues caches large ranges
const values = getRangeValues('A1:Z100');
```

## Performance Metrics

### Cache Metrics

```typescript
const metrics = performanceService.getMetrics();

console.log({
  cacheHits: metrics.cacheHits,
  cacheMisses: metrics.cacheMisses,
  cacheSize: metrics.cacheSize,
  averageAccessTime: metrics.averageAccessTime,
  hitRate: performanceService.getCacheHitRate(),
});
```

### Performance Measurement

```typescript
const result = await PerformanceService.measureTime(
  'Load Workbook',
  async () => {
    return await loadWorkbook(id);
  }
);
// Logs: [Performance] Load Workbook: 123.45ms
```

## Best Practices

### 1. Enable Workers for Large Datasets

```typescript
const shouldUseWorker = dataSize > 1000;

const { univerAPI } = useUniver({
  container,
  enableWorker: shouldUseWorker,
});
```

### 2. Cache Frequently Accessed Data

```typescript
// Good - cache frequently read cells
const value = getCellValue(0, 0); // Cached

// Good - cache large ranges
const values = getRangeValues('A1:Z100'); // Cached if < 1MB
```

### 3. Use Virtual Scrolling for Large Tables

```typescript
// For tables with 1000+ rows
const { visibleRange, handleScroll } = useVirtualScrolling(
  totalRows,
  rowHeight,
  containerHeight
);

return (
  <div onScroll={handleScroll} style={{ height: containerHeight }}>
    <div style={{ height: totalHeight }}>
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {visibleRows.map(row => (
          <Row key={row.id} data={row} />
        ))}
      </div>
    </div>
  </div>
);
```

### 4. Debounce User Input

```typescript
// Good - debounce search
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// Good - throttle scroll handler
const handleScroll = useThrottledCallback(onScroll, 100);
```

### 5. Lazy Load Worksheets

```typescript
// Load worksheets only when needed
const { data, load } = useLazyWorksheet('sheet1', loadSheet);

useEffect(() => {
  if (isVisible) {
    load();
  }
}, [isVisible]);
```

### 6. Batch Operations

```typescript
// Good - batch cell updates
await PerformanceService.batch(
  cells,
  100, // Batch size
  async (batch) => {
    await updateCells(batch);
  }
);
```

### 7. Monitor Performance

```typescript
// Measure critical operations
const workbook = await PerformanceService.measureTime(
  'Load Workbook',
  () => loadWorkbook(id)
);

// Check cache effectiveness
const hitRate = performanceService.getCacheHitRate();
if (hitRate < 0.5) {
  console.warn('Low cache hit rate:', hitRate);
}
```

## Configuration

### Cache Configuration

```typescript
const service = new PerformanceService({
  maxSize: 1000,           // Max cache entries
  ttl: 5 * 60 * 1000,     // 5 minutes TTL
});
```

### Worker Configuration

```typescript
const { workerURL } = useUniverPerformance({
  enableWorker: true,
  enableCaching: true,
});

// Worker is automatically configured
```

## Performance Targets

Based on Technical Requirements 3:

| Metric | Target | Implementation |
|--------|--------|----------------|
| Load time | < 2 seconds | Worker + Lazy loading |
| Cell edit response | < 100ms | Memoization + Cache |
| Formula calculation | < 500ms | Web Worker |
| Auto-save interval | 5 seconds | Debouncing |
| Large dataset support | 10,000+ cells | Virtual scrolling |
| Smooth scrolling | 60 FPS | Virtual scrolling + Worker |

## Troubleshooting

### Worker Not Loading

```typescript
// Check if workers are supported
if (!PerformanceService.supportsWorkers()) {
  console.warn('Workers not supported in this browser');
}

// Check worker initialization
const { isWorkerEnabled } = useUniverPerformance();
console.log('Worker enabled:', isWorkerEnabled);
```

### Low Cache Hit Rate

```typescript
// Check cache metrics
const metrics = performanceService.getMetrics();
console.log('Hit rate:', performanceService.getCacheHitRate());

// Increase cache size
const service = new PerformanceService({
  maxSize: 2000, // Increase from 1000
});
```

### Memory Issues

```typescript
// Check memory usage
const size = PerformanceService.estimateMemoryUsage(data);
console.log('Data size:', size, 'bytes');

// Clear cache if needed
if (size > 10 * 1024 * 1024) { // 10MB
  performanceService.clear();
}
```

### Slow Rendering

```typescript
// Use virtual scrolling
const { visibleRange } = useVirtualScrolling(
  totalRows,
  rowHeight,
  containerHeight
);

// Render only visible items
const visibleItems = items.slice(
  visibleRange.start,
  visibleRange.end
);
```

## Testing

### Performance Service Tests

```bash
npm test src/services/__tests__/performanceService.test.ts
```

### Performance Hooks Tests

```bash
npm test src/hooks/__tests__/useUniverPerformance.test.ts
```

### Integration Tests

```bash
npm test src/__tests__/integration/
```

## References

- [Worker Documentation](../../../docs/univer/core/worker.md)
- [Univer Performance Guide](https://docs.univer.ai/guides/sheets/performance)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Virtual Scrolling Guide](https://web.dev/virtualize-long-lists-react-window/)

## Related Files

- `src/services/performanceService.ts` - Core performance utilities
- `src/workers/univer.worker.ts` - Web worker implementation
- `src/hooks/useUniverPerformance.ts` - Performance hooks
- `src/hooks/useUniver.ts` - Enhanced Univer hook
- `src/hooks/useUniverCellOperations.ts` - Enhanced cell operations

---

**Last Updated**: 2024
**Status**: Implemented
**Requirements**: Technical Requirements 3
