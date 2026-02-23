# Univer Sheet Installation Guide

## Prerequisites

Berdasarkan [dokumentasi resmi Univer](https://docs.univer.ai/guides/sheets/getting-started/installation):

- **Node.js**: >= 18
- **NPM**: >= 7 (npm@3 ~ npm@6 tidak akan install peerDependencies dengan benar)
- **Build Tool**: Vite, esbuild, atau Webpack 5 (bukan Webpack 4)

✅ **Project Status**: 
- Node: v20.19.5 ✅
- NPM: v11.6.0 ✅
- Build Tool: Vite ✅

## Installation Methods

Univer menyediakan 2 mode instalasi:

### 1. Preset Mode (Recommended - Easier)

**Advantages**:
- ✅ Tidak perlu import facade packages manual
- ✅ Tidak perlu perhatikan urutan registrasi plugin
- ✅ Lebih sedikit kode (< 20 lines)
- ✅ Facade API included otomatis

**Disadvantages**:
- ❌ Hanya support preset-level lazy loading
- ❌ Plugins dalam preset hanya bisa loaded synchronously

**Installation**:
```bash
npm install @univerjs/presets @univerjs/preset-sheets-core
```

**Usage**:
```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-sheets-core/lib/index.css'

const { univer, univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
  },
  presets: [
    UniverSheetsCorePreset({
      container: 'app',
    }),
  ],
})

univerAPI.createWorkbook({})
```

### 2. Plugin Mode (Advanced - More Control)

**Advantages**:
- ✅ Support on-demand lazy loading
- ✅ Lebih flexible control loading timing
- ✅ Bisa optimize performance dengan lazy load

**Disadvantages**:
- ❌ Perlu manual import facade packages
- ❌ Perlu perhatikan urutan registrasi plugin
- ❌ Lebih banyak kode (~50+ lines)

**Installation**:
```bash
npm install @univerjs/core @univerjs/design @univerjs/docs @univerjs/docs-ui \
  @univerjs/engine-formula @univerjs/engine-render @univerjs/sheets \
  @univerjs/sheets-formula @univerjs/sheets-formula-ui @univerjs/sheets-numfmt \
  @univerjs/sheets-numfmt-ui @univerjs/sheets-ui @univerjs/ui
```

## Our Choice: Preset Mode

Untuk project ini, kita akan menggunakan **Preset Mode** karena:

1. ✅ **Simplicity**: Lebih mudah setup dan maintain
2. ✅ **Facade API**: Included otomatis, tidak perlu import manual
3. ✅ **Less Code**: Lebih sedikit boilerplate code
4. ✅ **Good Enough**: Untuk use case kita, preset mode sudah cukup

## Installation Steps

### Step 1: Install Packages

```bash
cd chat-to-edit
npm install @univerjs/presets @univerjs/preset-sheets-core
```

### Step 2: Import CSS in main.tsx

Add to `src/main.tsx` (before other imports):

```typescript
// Univer Sheet CSS
import '@univerjs/preset-sheets-core/lib/index.css';
```

### Step 3: Verify Installation

Check `package.json`:

```json
{
  "dependencies": {
    "@univerjs/presets": "^0.x.x",
    "@univerjs/preset-sheets-core": "^0.x.x"
  }
}
```

### Step 4: Test Component

Create test page:

```typescript
// src/pages/UniverTest.tsx
import UniverSheet from '@/components/univer/UniverSheet';

export default function UniverTest() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Univer Sheet Test</h1>
      <UniverSheet height="600px" />
    </div>
  );
}
```

### Step 5: Add Route

Add to router:

```typescript
{
  path: '/univer-test',
  element: <UniverTest />,
}
```

### Step 6: Run Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:8080/univer-test`

## Important Notes

### 1. Consistent Dependency Versions

⚠️ **CRITICAL**: Semua dependencies harus punya version numbers yang konsisten!

```json
// ✅ GOOD
"@univerjs/presets": "^0.5.0",
"@univerjs/preset-sheets-core": "^0.5.0"

// ❌ BAD
"@univerjs/presets": "^0.5.0",
"@univerjs/preset-sheets-core": "^0.4.0"
```

### 2. Don't Mix Plugins and Presets

⚠️ Jika plugin sudah included di preset, jangan import plugin tersebut lagi!

```typescript
// ❌ BAD - UniverSheetsPlugin already in preset
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { UniverSheetsPlugin } from '@univerjs/sheets'

univer.registerPlugin(UniverSheetsPlugin) // Conflict!

// ✅ GOOD - Just use preset
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
```

### 3. CSS Import Order

⚠️ Order matters! Import CSS in this order:

```typescript
// 1. Design system
import '@univerjs/design/lib/index.css'

// 2. UI components
import '@univerjs/ui/lib/index.css'

// 3. Feature-specific CSS
import '@univerjs/sheets-ui/lib/index.css'
```

For preset mode, just import preset CSS:

```typescript
import '@univerjs/preset-sheets-core/lib/index.css'
```

### 4. Build Tool Compatibility

✅ **Supported**:
- Vite (our choice)
- esbuild
- Webpack 5

❌ **Not Supported**:
- Webpack 4 (needs additional config)

### 5. Package Manager Notes

- **npm**: Use npm@7+ (npm@3-6 won't install peerDependencies correctly)
- **pnpm**: Use pnpm@8+ (or configure `auto-install-peers=true` for pnpm@6-7)
- **yarn**: Need to manually install missing peerDependencies

## Internationalization (i18n)

Univer supports multiple languages:

- `zh-CN`: Simplified Chinese
- `en-US`: English (default)
- `zh-TW`: Traditional Chinese
- `ru-RU`: Russian
- `vi-VN`: Vietnamese
- `fa-IR`: Persian
- `fr-FR`: French
- `ja-JP`: Japanese
- `ko-KR`: Korean
- `es-ES`: Spanish
- `ca-ES`: Catalan
- `sk-SK`: Slovakian

### Change Language

```typescript
import UniverPresetSheetsCoreZhCN from '@univerjs/preset-sheets-core/locales/zh-CN'

const { univerAPI } = createUniver({
  locale: LocaleType.ZH_CN,
  locales: {
    [LocaleType.ZH_CN]: mergeLocales(UniverPresetSheetsCoreZhCN),
  },
  presets: [UniverSheetsCorePreset()],
})
```

### Custom Language Pack

```typescript
const { univerAPI } = createUniver({
  locale: 'id-ID',
  locales: {
    'id-ID': {
      shortcut: {
        undo: 'Batalkan',
        redo: 'Ulangi',
      },
      // ... more translations
    },
  },
  presets: [UniverSheetsCorePreset()],
})
```

## Facade API

Facade API adalah wrapper yang menyederhanakan penggunaan Univer.

### In Preset Mode

✅ **Automatic**: Facade API included otomatis!

```typescript
const { univerAPI } = createUniver({ /* ... */ })

// Use directly
univerAPI.createWorkbook({})
const workbook = univerAPI.getActiveWorkbook()
```

### In Plugin Mode

❌ **Manual**: Perlu import facade packages:

```typescript
import { FUniver } from '@univerjs/core/facade'
import '@univerjs/ui/facade'
import '@univerjs/sheets/facade'

const univerAPI = FUniver.newAPI(univer)
```

### Lifecycle Stages

⚠️ Some Facade APIs need specific lifecycle stages:

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.LifeCycleChanged,
  ({ stage }) => {
    if (stage === univerAPI.Enum.LifecycleStages.Rendered) {
      // Code to execute when rendered
    }
    if (stage === univerAPI.Enum.LifecycleStages.Steady) {
      // Code to execute when steady
    }
  }
)
```

### Async Operations

⚠️ Many Facade APIs are async (return Promise):

```typescript
// ❌ BAD - May get stale data
sheet.getRange(0, 0).setValue('Hello')
const value = sheet.getRange(0, 0).getValue() // May be old value

// ✅ GOOD - Wait for operation to complete
await sheet.getRange(0, 0).setValue('Hello')
const value = sheet.getRange(0, 0).getValue() // Correct value
```

## Mobile Support (Experimental)

Univer provides experimental mobile support:

### Desktop vs Mobile Plugins

| Desktop Plugin | Mobile Plugin | Package |
|----------------|---------------|---------|
| `UniverUIPlugin` | `UniverMobileUIPlugin` | `@univerjs/ui` |
| `UniverSheetsUIPlugin` | `UniverSheetsMobileUIPlugin` | `@univerjs/sheets-ui` |

### Switch to Mobile

```typescript
// Desktop
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
univer.registerPlugin(UniverSheetsUIPlugin)

// Mobile
import { UniverSheetsMobileUIPlugin } from '@univerjs/sheets-ui'
univer.registerPlugin(UniverSheetsMobileUIPlugin)
```

⚠️ **Notes**:
- Mobile support is experimental
- Desktop and mobile plugins cannot be used together
- Test thoroughly before production

## Alpha / Beta / Nightly Releases

For early access to new features:

```bash
# Alpha version
npm install @univerjs/presets@alpha

# Beta version
npm install @univerjs/presets@beta
```

⚠️ **Warning**: These versions may contain bugs or incomplete features. Avoid in production!

## Troubleshooting

### Issue 1: peerDependencies Not Installed

**Error**: `Cannot find module 'react'` or `Cannot find module 'rxjs'`

**Solution**: 
- npm: Upgrade to npm@7+
- pnpm: Upgrade to pnpm@8+ or add `auto-install-peers=true` to `.npmrc`
- yarn: Manually install missing dependencies

### Issue 2: CSS Not Loading

**Error**: Styles not applied, components look broken

**Solution**: Import CSS in `main.tsx`:
```typescript
import '@univerjs/preset-sheets-core/lib/index.css'
```

### Issue 3: Build Tool Not Supported

**Error**: `exports field not supported`

**Solution**: 
- Upgrade to Webpack 5 or use Vite
- Or manually change import paths to actual paths

### Issue 4: Plugin Conflicts

**Error**: `Plugin already registered` or functionality issues

**Solution**: Don't import plugins that are already in preset

## Next Steps

After installation:

1. ✅ Test basic rendering
2. ✅ Test data loading
3. ✅ Test data editing
4. ✅ Test formula calculation
5. ✅ Test Excel export
6. ✅ Performance testing

## Resources

- [Official Documentation](https://docs.univer.ai/)
- [GitHub Repository](https://github.com/dream-num/univer)
- [API Reference](https://docs.univer.ai/api/)
- [Examples](https://univer.ai/examples/)
- [Discord Community](https://discord.gg/univer)

## Support

If you encounter issues:

1. Check [official documentation](https://docs.univer.ai/)
2. Search [GitHub issues](https://github.com/dream-num/univer/issues)
3. Ask in [Discord](https://discord.gg/univer)
4. Create new issue if needed

## Changelog

### 2024-02-20
- ✅ Created installation guide based on official docs
- ✅ Documented preset mode vs plugin mode
- ✅ Added i18n support documentation
- ✅ Added Facade API documentation
- ✅ Added troubleshooting section
- ⏳ Pending: Actual package installation
- ⏳ Pending: Test component rendering
