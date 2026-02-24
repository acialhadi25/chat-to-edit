# Univer Sheet - Web Workers

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Web Workers memungkinkan Univer menjalankan operasi komputasi berat (seperti formula calculation) di background thread terpisah, meningkatkan performa dan responsivitas aplikasi dengan memanfaatkan multi-threading.

### Fitur Utama
- ✅ Offload heavy computations ke worker thread
- ✅ Improve UI responsiveness
- ✅ Support untuk formula calculations
- ✅ Compatible dengan collaboration features
- ✅ Easy configuration dengan preset mode

### Kapan Menggunakan Workers
- Large datasets dengan banyak formula
- Complex formula calculations
- Real-time collaboration dengan banyak users
- Performance-critical applications
- Heavy data processing

### Keuntungan
- **Better Performance**: Komputasi tidak block main thread
- **Smooth UI**: User interface tetap responsive
- **Scalability**: Handle larger datasets
- **Multi-threading**: Leverage multiple CPU cores

## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/preset-sheets-core @univerjs/preset-sheets-filter
```

**Note**: Jika menggunakan SUBTOTAL formula yang dipengaruhi oleh hidden rows, perlu install `@univerjs/preset-sheets-filter`.

## Konfigurasi

### Basic Worker Setup

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: UniverPresetSheetsCoreEnUS,
  },
  presets: [
    UniverSheetsCorePreset({
      workerURL: new Worker(
        new URL('./worker.js', import.meta.url),
        { type: 'module' }
      ),
    }),
  ],
})

univerAPI.createWorkbook({ name: 'Test Sheet' })
```

### Worker File (worker.js)

```typescript
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
import { createUniver, LocaleType } from '@univerjs/presets'

createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: UniverPresetSheetsCoreEnUS,
  },
  presets: [
    UniverSheetsCoreWorkerPreset(),
  ],
})
```

### With Sheets Filter

Jika menggunakan SUBTOTAL formula:

**Main Thread:**
```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsFilterPreset } from '@univerjs/preset-sheets-filter'
import UniverPresetSheetsFilterEnUS from '@univerjs/preset-sheets-filter/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-filter/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsFilterEnUS,
    ),
  },
  presets: [
    UniverSheetsCorePreset({
      workerURL: new Worker(
        new URL('./worker.js', import.meta.url),
        { type: 'module' }
      ),
    }),
    UniverSheetsFilterPreset(),
  ],
})
```

**Worker Thread (worker.js):**
```typescript
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
import UniverPresetSheetsFilterEnUS from '@univerjs/preset-sheets-filter/locales/en-US'
import { UniverSheetsFilterWorkerPreset } from '@univerjs/preset-sheets-filter/worker'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsFilterEnUS,
    ),
  },
  presets: [
    UniverSheetsCoreWorkerPreset(),
    UniverSheetsFilterWorkerPreset(),
  ],
})
```

## Contoh Penggunaan

### 1. Basic Worker Setup dengan Vite

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
})
```

**main.tsx:**
```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { createUniver } from '@univerjs/presets'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
      ),
    }),
  ],
})
```

**worker.ts:**
```typescript
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
import { createUniver } from '@univerjs/presets'

createUniver({
  presets: [
    UniverSheetsCoreWorkerPreset(),
  ],
})
```

### 2. Worker dengan Collaboration

**Main Thread:**
```typescript
import { UniverSheetsAdvancedPreset } from '@univerjs/preset-sheets-advanced'
import UniverPresetSheetsAdvancedEnUS from '@univerjs/preset-sheets-advanced/locales/en-US'
import { UniverSheetsCollaborationPreset } from '@univerjs/preset-sheets-collaboration'
import UniverPresetSheetsCollaborationEnUS from '@univerjs/preset-sheets-collaboration/locales/en-US'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsDrawingPreset } from '@univerjs/preset-sheets-drawing'
import UniverPresetSheetsDrawingEnUS from '@univerjs/preset-sheets-drawing/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-drawing/lib/index.css'
import '@univerjs/preset-sheets-advanced/lib/index.css'
import '@univerjs/preset-sheets-collaboration/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsDrawingEnUS,
      UniverPresetSheetsAdvancedEnUS,
      UniverPresetSheetsCollaborationEnUS,
    ),
  },
  collaboration: true,
  presets: [
    UniverSheetsCorePreset({
      workerURL: new Worker(
        new URL('./worker.js', import.meta.url),
        { type: 'module' }
      ),
    }),
    UniverSheetsDrawingPreset({
      collaboration: true,
    }),
    UniverSheetsAdvancedPreset({
      useWorker: true,
      license: process.env.UNIVER_CLIENT_LICENSE || 'your license.txt',
    }),
    UniverSheetsCollaborationPreset({
      universerEndpoint: 'http://localhost:3010',
    }),
  ],
})
```

**Worker Thread:**
```typescript
import UniverPresetSheetsAdvancedEnUS from '@univerjs/preset-sheets-advanced/locales/en-US'
import { UniverSheetsAdvancedWorkerPreset } from '@univerjs/preset-sheets-advanced/worker'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsAdvancedEnUS,
    ),
  },
  presets: [
    UniverSheetsCoreWorkerPreset(),
    UniverSheetsAdvancedWorkerPreset({
      license: process.env.UNIVER_CLIENT_LICENSE || 'your license.txt',
    }),
  ],
})
```

### 3. Worker dengan Webpack

**webpack.config.js:**
```javascript
module.exports = {
  // ... other config
  module: {
    rules: [
      {
        test: /\.worker\.(js|ts)$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
}
```

**Usage:**
```typescript
import Worker from './worker.worker.ts'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: new Worker(),
    }),
  ],
})
```

### 4. Conditional Worker Loading

```typescript
// Check if workers are supported
const supportsWorkers = typeof Worker !== 'undefined'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: supportsWorkers
        ? new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
        : undefined,
    }),
  ],
})

if (supportsWorkers) {
  console.log('Workers enabled - better performance!')
} else {
  console.log('Workers not supported - running in main thread')
}
```

### 5. Worker dengan Environment Variables

```typescript
// Use environment variable untuk control worker usage
const USE_WORKERS = import.meta.env.VITE_USE_WORKERS === 'true'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: USE_WORKERS
        ? new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
        : undefined,
    }),
  ],
})
```

**.env:**
```
VITE_USE_WORKERS=true
```

## Best Practices

### 1. Always Use Workers for Production
```typescript
// ✅ Good - use workers in production
const isProduction = process.env.NODE_ENV === 'production'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: isProduction
        ? new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
        : undefined,
    }),
  ],
})
```

### 2. Match Presets Between Main and Worker
```typescript
// ✅ Good - same presets in both threads
// Main thread
presets: [
  UniverSheetsCorePreset({ workerURL: worker }),
  UniverSheetsFilterPreset(),
]

// Worker thread
presets: [
  UniverSheetsCoreWorkerPreset(),
  UniverSheetsFilterWorkerPreset(), // Match!
]
```

### 3. Use Module Workers
```typescript
// ✅ Good - use type: 'module'
workerURL: new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' } // Important!
)
```

### 4. Handle Worker Errors
```typescript
// ✅ Good - handle worker errors
const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' }
)

worker.onerror = (error) => {
  console.error('Worker error:', error)
  // Fallback to main thread
}

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: worker,
    }),
  ],
})
```

### 5. Optimize Worker Bundle
```typescript
// ✅ Good - only import what's needed in worker
// worker.ts
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
import { createUniver } from '@univerjs/presets'

// Don't import UI-related packages in worker
// ❌ import { UniverUIPlugin } from '@univerjs/ui'

createUniver({
  presets: [
    UniverSheetsCoreWorkerPreset(),
  ],
})
```

## Troubleshooting

### Worker tidak berjalan

**Penyebab:**
- Worker file tidak ditemukan
- Module type tidak di-set
- Build configuration salah

**Solusi:**
```typescript
// Check if worker is loaded
const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' }
)

worker.onmessage = (e) => {
  console.log('Worker message:', e.data)
}

worker.onerror = (error) => {
  console.error('Worker error:', error)
}

// Verify worker file exists
console.log('Worker URL:', new URL('./worker.js', import.meta.url).href)
```

### Formula tidak calculate di worker

**Penyebab:**
- Worker preset tidak match dengan main thread
- Formula engine tidak di-register di worker

**Solusi:**
```typescript
// Ensure presets match
// Main thread
presets: [
  UniverSheetsCorePreset({ workerURL: worker }),
]

// Worker thread - must match!
presets: [
  UniverSheetsCoreWorkerPreset(),
]
```

### Build error dengan bundler

**Penyebab:**
- Bundler tidak support worker syntax
- Worker loader tidak configured

**Solusi untuk Vite:**
```typescript
// vite.config.ts
export default defineConfig({
  worker: {
    format: 'es',
    plugins: [],
  },
})
```

**Solusi untuk Webpack:**
```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.worker\.(js|ts)$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
}
```

### Performance tidak improve

**Penyebab:**
- Dataset terlalu kecil
- Worker overhead lebih besar dari benefit
- Formula tidak complex enough

**Solusi:**
```typescript
// Use workers only for large datasets
const shouldUseWorker = (dataSize: number) => {
  // Only use worker if dataset is large enough
  return dataSize > 1000
}

const dataSize = workbookData.sheets[0].cellData.length

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      workerURL: shouldUseWorker(dataSize)
        ? new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
        : undefined,
    }),
  ],
})
```

### CORS error dengan worker

**Penyebab:**
- Worker file served dari different origin
- Security policy blocking worker

**Solusi:**
```typescript
// Ensure worker is served from same origin
// Use relative URL
workerURL: new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' }
)

// Or use blob URL as fallback
const workerCode = `
  import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker'
  import { createUniver } from '@univerjs/presets'
  
  createUniver({
    presets: [UniverSheetsCoreWorkerPreset()],
  })
`

const blob = new Blob([workerCode], { type: 'application/javascript' })
const workerURL = URL.createObjectURL(blob)

const worker = new Worker(workerURL, { type: 'module' })
```

## Performance Tips

### 1. Monitor Worker Performance
```typescript
// Measure worker performance
const startTime = performance.now()

// Perform operation
fWorksheet.getRange('A1').setValue('=SUM(A1:A1000)')

// Wait for calculation
setTimeout(() => {
  const endTime = performance.now()
  console.log(`Calculation took ${endTime - startTime}ms`)
}, 100)
```

### 2. Batch Operations
```typescript
// ✅ Good - batch operations
const updates = []
for (let i = 0; i < 1000; i++) {
  updates.push({ row: i, col: 0, value: i })
}

// Apply all at once
fWorksheet.setRangeValues(updates)
```

### 3. Use Worker for Heavy Formulas
```typescript
// Complex formulas benefit most from workers
const complexFormulas = [
  '=SUMPRODUCT((A1:A1000>100)*(B1:B1000<50))',
  '=VLOOKUP(A1,Sheet2!A:Z,10,FALSE)',
  '=ARRAYFORMULA(A1:A1000*B1:B1000)',
]

// These will run in worker thread
complexFormulas.forEach((formula, i) => {
  fWorksheet.getRange(i, 0).setValue(formula)
})
```

## Referensi

- [Official Worker Documentation](https://docs.univer.ai/guides/sheets/features/core/worker)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Vite Worker Documentation](https://vitejs.dev/guide/features.html#web-workers)

---

**Related Documentation:**
- [Formula](./formula.md)
- [General API](./general-api.md)
- [Performance Optimization](../integration/README.md)
