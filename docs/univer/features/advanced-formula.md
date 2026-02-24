# Univer Sheet - Advanced Formula (Pro)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Univer Advanced Formula Engine adalah versi Pro dari formula engine yang menyediakan performa lebih tinggi dan fitur tambahan dibanding versi open-source.

### Fitur Utama
- **Enhanced Performance**: Kalkulasi formula lebih cepat
- **Web Worker Support**: Multi-threading untuk formula kompleks
- **Advanced Functions**: Fungsi tambahan yang tidak ada di versi open-source
- **Optimized Memory**: Penggunaan memory yang lebih efisien
- **Better Error Handling**: Error reporting yang lebih detail

### Perbedaan dengan Open-Source Version

| Feature | Open-Source | Pro (Advanced) |
|---------|-------------|----------------|
| Basic Functions | ✅ | ✅ |
| Performance | Standard | Optimized |
| Web Workers | ❌ | ✅ |
| Advanced Functions | Limited | Full |
| Memory Usage | Standard | Optimized |
| Support | Community | Priority |

### Kapan Menggunakan
- Aplikasi dengan formula kompleks
- Dataset besar yang memerlukan kalkulasi cepat
- Aplikasi yang memerlukan performa tinggi
- Ketika memerlukan advanced functions
- Production applications dengan SLA ketat


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/engine-formula
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register Pro formula engine
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
});
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/engine-formula
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';

const univer = new Univer();

// Register Pro formula engine
univer.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
});
```

### Configuration Options

```typescript
interface IProFormulaEngineConfig {
  license: string;
  enableWorker?: boolean;        // Enable web workers (default: true)
  workerCount?: number;           // Number of workers (default: 4)
  cacheSize?: number;             // Formula cache size (default: 1000)
  enableOptimization?: boolean;   // Enable optimizations (default: true)
}

univer.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: true,
  workerCount: 4,
  cacheSize: 2000,
  enableOptimization: true,
});
```

### License Configuration

```typescript
// Option 1: Direct license key
univer.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
});

// Option 2: License from environment
univer.registerPlugin(UniverProFormulaEnginePlugin, {
  license: process.env.UNIVER_PRO_LICENSE,
});

// Option 3: License from server
async function getLicense() {
  const response = await fetch('/api/univer-license');
  const { license } = await response.json();
  return license;
}

const license = await getLicense();
univer.registerPlugin(UniverProFormulaEnginePlugin, { license });
```


## API Reference

### Configuration Interface

```typescript
interface IProFormulaEngineConfig {
  // License key (required)
  license: string;
  
  // Enable web workers for parallel calculation
  enableWorker?: boolean;
  
  // Number of web workers (default: 4)
  workerCount?: number;
  
  // Formula result cache size (default: 1000)
  cacheSize?: number;
  
  // Enable performance optimizations (default: true)
  enableOptimization?: boolean;
  
  // Custom function timeout in ms (default: 5000)
  functionTimeout?: number;
}
```

### Performance Metrics

Pro Formula Engine menyediakan metrics untuk monitoring:

```typescript
// Get formula engine metrics
const metrics = univerAPI.getFormulaEngineMetrics();

interface IFormulaEngineMetrics {
  totalCalculations: number;
  averageCalculationTime: number;
  cacheHitRate: number;
  workerUtilization: number;
  memoryUsage: number;
}
```

### Advanced Functions

Pro version includes additional functions:

```typescript
// Financial functions
XIRR()      // Internal rate of return for irregular cash flows
XNPV()      // Net present value for irregular cash flows
MIRR()      // Modified internal rate of return

// Statistical functions
FORECAST.ETS()     // Exponential smoothing forecast
FORECAST.LINEAR()  // Linear forecast
PERCENTILE.EXC()   // Percentile (exclusive)
PERCENTILE.INC()   // Percentile (inclusive)

// Text functions
TEXTJOIN()   // Join text with delimiter
CONCAT()     // Concatenate ranges

// Lookup functions
XLOOKUP()    // Advanced lookup
FILTER()     // Filter range based on criteria
SORT()       // Sort range
UNIQUE()     // Get unique values
```


## Contoh Penggunaan

### 1. Basic Setup dengan Pro Engine

```typescript
import { createUniver } from '@univerjs/presets';
import { UniverProFormulaEnginePlugin } from '@univerjs-pro/engine-formula';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
});

// Register Pro formula engine
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: true,
  workerCount: 4,
});

// Use formulas as normal
const workbook = univerAPI.getActiveWorkbook();
const worksheet = workbook.getActiveSheet();

worksheet.getRange('A1').setValue('=SUM(B1:B100)');
```

### 2. Enable Web Workers untuk Performance

```typescript
// Configure with web workers
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: true,
  workerCount: 8, // More workers for heavy calculations
  cacheSize: 5000, // Larger cache
});

// Complex formulas will automatically use workers
worksheet.getRange('A1').setValue('=SUMPRODUCT((B1:B10000)*(C1:C10000))');
```

### 3. Using Advanced Functions - XLOOKUP

```typescript
// XLOOKUP - More powerful than VLOOKUP
worksheet.getRange('E2').setValue(
  '=XLOOKUP(D2, A:A, B:B, "Not Found", 0, 1)'
);

// Parameters:
// D2: lookup value
// A:A: lookup array
// B:B: return array
// "Not Found": if not found
// 0: exact match
// 1: search first to last
```

### 4. Using FILTER Function

```typescript
// Filter data based on criteria
worksheet.getRange('F1').setValue(
  '=FILTER(A1:C100, B1:B100>1000, "No results")'
);

// Returns all rows where column B > 1000
```

### 5. Using SORT Function

```typescript
// Sort range by column
worksheet.getRange('G1').setValue(
  '=SORT(A1:C100, 2, -1)'
);

// Parameters:
// A1:C100: range to sort
// 2: sort by column 2
// -1: descending order
```

### 6. Using UNIQUE Function

```typescript
// Get unique values from range
worksheet.getRange('H1').setValue(
  '=UNIQUE(A1:A100)'
);

// Returns unique values from A1:A100
```

### 7. Using TEXTJOIN

```typescript
// Join text with delimiter
worksheet.getRange('I1').setValue(
  '=TEXTJOIN(", ", TRUE, A1:A10)'
);

// Parameters:
// ", ": delimiter
// TRUE: ignore empty cells
// A1:A10: range to join
```

### 8. Financial Functions - XIRR

```typescript
// Calculate IRR for irregular cash flows
// Dates in A1:A10, Cash flows in B1:B10
worksheet.getRange('C1').setValue(
  '=XIRR(B1:B10, A1:A10)'
);
```

### 9. Monitor Performance Metrics

```typescript
// Get formula engine metrics
const metrics = univerAPI.getFormulaEngineMetrics();

console.log('Total calculations:', metrics.totalCalculations);
console.log('Average time:', metrics.averageCalculationTime, 'ms');
console.log('Cache hit rate:', metrics.cacheHitRate, '%');
console.log('Worker utilization:', metrics.workerUtilization, '%');
console.log('Memory usage:', metrics.memoryUsage, 'MB');
```

### 10. Complex Formula with Multiple Functions

```typescript
// Combine multiple advanced functions
worksheet.getRange('J1').setValue(
  '=SORT(FILTER(UNIQUE(A1:A1000), UNIQUE(A1:A1000)<>""), 1, 1)'
);

// Get unique non-empty values and sort them
```


## Best Practices

### Do's ✅

1. **Enable Web Workers untuk Dataset Besar**
```typescript
// Good - Enable workers for better performance
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: true,
  workerCount: navigator.hardwareConcurrency || 4,
});
```

2. **Optimize Cache Size Berdasarkan Usage**
```typescript
// Good - Adjust cache based on formula count
const estimatedFormulaCount = 5000;
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  cacheSize: Math.max(1000, estimatedFormulaCount * 0.5),
});
```

3. **Use Advanced Functions untuk Simplicity**
```typescript
// Good - Use XLOOKUP instead of complex VLOOKUP
=XLOOKUP(A2, Data!A:A, Data!B:B, "Not Found")

// Instead of:
=IFERROR(VLOOKUP(A2, Data!A:B, 2, FALSE), "Not Found")
```

4. **Monitor Performance Metrics**
```typescript
// Good - Regular monitoring
setInterval(() => {
  const metrics = univerAPI.getFormulaEngineMetrics();
  if (metrics.averageCalculationTime > 100) {
    console.warn('Formula calculation slow:', metrics);
  }
}, 60000); // Check every minute
```

5. **Handle License Errors Gracefully**
```typescript
// Good - Proper error handling
try {
  univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
    license: licenseKey,
  });
} catch (error) {
  console.error('License error:', error);
  // Fallback to open-source engine
  univerAPI.registerPlugin(UniverFormulaEnginePlugin);
}
```

### Don'ts ❌

1. **Jangan Hardcode License Key**
```typescript
// Bad
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'abc123xyz',
});

// Good
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: process.env.UNIVER_PRO_LICENSE,
});
```

2. **Jangan Set Worker Count Terlalu Tinggi**
```typescript
// Bad - Too many workers
workerCount: 32

// Good - Based on CPU cores
workerCount: Math.min(navigator.hardwareConcurrency || 4, 8)
```

3. **Jangan Ignore Performance Degradation**
```typescript
// Bad - No monitoring
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, config);

// Good - Monitor and adjust
const metrics = univerAPI.getFormulaEngineMetrics();
if (metrics.cacheHitRate < 50) {
  // Increase cache size
}
```

4. **Jangan Mix Open-Source dan Pro Engines**
```typescript
// Bad - Conflicting engines
univerAPI.registerPlugin(UniverFormulaEnginePlugin);
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, config);

// Good - Use one engine
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, config);
```


## Troubleshooting

### License Error

**Gejala**: "Invalid license" atau "License required" error

**Solusi**:
```typescript
// 1. Verify license key
console.log('License:', process.env.UNIVER_PRO_LICENSE);

// 2. Check license validity
try {
  univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
    license: licenseKey,
  });
  console.log('License valid');
} catch (error) {
  console.error('License error:', error.message);
}

// 3. Contact Univer support for license issues
// https://univer.ai/contact
```

### Performance Tidak Meningkat

**Gejala**: Pro engine tidak lebih cepat dari open-source

**Solusi**:
```typescript
// 1. Ensure workers are enabled
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: true, // Must be true
  workerCount: 4,
});

// 2. Check if formulas are complex enough
// Simple formulas may not benefit from workers

// 3. Monitor metrics
const metrics = univerAPI.getFormulaEngineMetrics();
console.log('Worker utilization:', metrics.workerUtilization);
// Should be > 0 for complex calculations
```

### Advanced Functions Tidak Tersedia

**Gejala**: XLOOKUP, FILTER, dll tidak recognized

**Solusi**:
```typescript
// 1. Ensure Pro engine is registered
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
});

// 2. Check function name spelling
// Correct: =XLOOKUP(...)
// Wrong: =XLOOK(...)

// 3. Verify license includes advanced functions
// Some licenses may have limited features
```

### Memory Usage Tinggi

**Gejala**: High memory consumption

**Solusi**:
```typescript
// 1. Reduce cache size
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  cacheSize: 500, // Reduce from default 1000
});

// 2. Reduce worker count
workerCount: 2, // Reduce from default 4

// 3. Clear cache periodically
univerAPI.clearFormulaCache();
```

### Worker Errors

**Gejala**: Web worker errors in console

**Solusi**:
```typescript
// 1. Disable workers if problematic
univerAPI.registerPlugin(UniverProFormulaEnginePlugin, {
  license: 'your-license-key',
  enableWorker: false,
});

// 2. Check browser compatibility
if (!window.Worker) {
  console.warn('Web Workers not supported');
  // Workers will be automatically disabled
}

// 3. Check CORS issues
// Workers may fail if served from different origin
```

## Referensi

### Official Documentation
- [Univer Advanced Formula Guide](https://docs.univer.ai/guides/sheets/features/advanced-formula)
- [Facade API Reference](https://reference.univer.ai/)
- [Formula Functions Reference](https://docs.univer.ai/guides/sheets/features/core/formula)

### Related Documentation
- [Formula](../core/formula.md) - Basic formula usage
- [Worker](../core/worker.md) - Web workers configuration
- [General API](../core/general-api.md) - Core API reference

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [License Support](https://univer.ai/contact)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/engine-formula
**License**: Pro Feature (License Required)
