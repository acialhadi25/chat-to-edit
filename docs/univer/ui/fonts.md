# Univer Sheet - Custom Font List

## Daftar Isi
- [Overview](#overview)
- [Konfigurasi](#konfigurasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Custom Font List memungkinkan Anda mendefinisikan font yang tersedia dalam dropdown menu font di Univer. Anda dapat menambahkan font custom, mengorganisir berdasarkan kategori, dan menambahkan font secara dinamis saat runtime.

### Fitur Utama
- ✅ Custom font list configuration
- ✅ Font categorization (sans-serif, serif, monospace, display, handwriting)
- ✅ Dynamic font registration via Facade API
- ✅ Internationalization support
- ✅ No font installation validation

### Font Configuration Interface

```typescript
interface IFontConfig {
  value: string        // Font identifier (CSS font-family value)
  label: string        // Display name (i18n key or direct value)
  category?: string    // Font category for UI grouping
}
```

### Font Categories
- `sans-serif`: Modern, clean fonts
- `serif`: Traditional fonts dengan serifs
- `monospace`: Fixed-width fonts
- `display`: Decorative fonts
- `handwriting`: Script/handwriting fonts

## Konfigurasi

### Preset Mode Configuration

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { createUniver } from '@univerjs/presets'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: [
        {
          value: 'Arial',
          label: 'Arial',
          category: 'sans-serif',
        },
        {
          value: 'Times New Roman',
          label: 'Times New Roman',
          category: 'serif',
        },
        {
          value: 'Courier New',
          label: 'Courier New',
          category: 'monospace',
        },
      ],
    }),
  ],
})
```

### Plugin Mode Configuration

```typescript
import { Univer } from '@univerjs/core'
import { UniverUIPlugin } from '@univerjs/ui'

const univer = new Univer()

univer.registerPlugin(UniverUIPlugin, {
  customFontFamily: [
    {
      value: 'Roboto',
      label: 'Roboto',
      category: 'sans-serif',
    },
    {
      value: 'Open Sans',
      label: 'Open Sans',
      category: 'sans-serif',
    },
  ],
})
```

## API Reference

### Dynamic Font Registration

#### `univerAPI.addFonts(fonts)`
Menambahkan fonts secara dinamis saat runtime.

**Parameters:**
- `fonts` (IFontConfig[]): Array of font configurations

**Returns:** `void`

**Example:**
```typescript
univerAPI.addFonts([
  {
    value: 'PingFang SC',
    label: 'PingFang SC',
    category: 'sans-serif',
  },
  {
    value: 'Helvetica Neue',
    label: 'Helvetica Neue',
    category: 'sans-serif',
  },
])
```

## Contoh Penggunaan

### 1. Basic Font Configuration

```typescript
const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: [
        { value: 'Arial', label: 'Arial' },
        { value: 'Verdana', label: 'Verdana' },
        { value: 'Georgia', label: 'Georgia' },
      ],
    }),
  ],
})
```

### 2. Fonts dengan Categories

```typescript
const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: [
        // Sans-serif fonts
        {
          value: 'Arial',
          label: 'Arial',
          category: 'sans-serif',
        },
        {
          value: 'Helvetica',
          label: 'Helvetica',
          category: 'sans-serif',
        },
        
        // Serif fonts
        {
          value: 'Times New Roman',
          label: 'Times New Roman',
          category: 'serif',
        },
        {
          value: 'Georgia',
          label: 'Georgia',
          category: 'serif',
        },
        
        // Monospace fonts
        {
          value: 'Courier New',
          label: 'Courier New',
          category: 'monospace',
        },
        {
          value: 'Consolas',
          label: 'Consolas',
          category: 'monospace',
        },
      ],
    }),
  ],
})
```

### 3. Dynamic Font Loading

```typescript
// Initial setup
const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: [
        { value: 'Arial', label: 'Arial' },
      ],
    }),
  ],
})

// Load additional fonts dynamically
async function loadGoogleFonts() {
  // Load font from Google Fonts
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
  
  // Wait for font to load
  await document.fonts.ready
  
  // Register font in Univer
  univerAPI.addFonts([
    {
      value: 'Roboto',
      label: 'Roboto',
      category: 'sans-serif',
    },
  ])
}

loadGoogleFonts()
```

### 4. Chinese/Japanese Fonts

```typescript
univerAPI.addFonts([
  {
    value: 'PingFang SC',
    label: 'PingFang SC (简体中文)',
    category: 'sans-serif',
  },
  {
    value: 'Microsoft YaHei',
    label: 'Microsoft YaHei (微软雅黑)',
    category: 'sans-serif',
  },
  {
    value: 'Hiragino Sans',
    label: 'Hiragino Sans (日本語)',
    category: 'sans-serif',
  },
])
```

### 5. Web Fonts dengan @font-face

```typescript
// Define custom font
const style = document.createElement('style')
style.textContent = `
  @font-face {
    font-family: 'CustomFont';
    src: url('/fonts/CustomFont.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }
`
document.head.appendChild(style)

// Register in Univer
univerAPI.addFonts([
  {
    value: 'CustomFont',
    label: 'Custom Font',
    category: 'display',
  },
])
```

### 6. Conditional Font Loading

```typescript
// Load fonts based on user preference or system
const userLanguage = navigator.language

if (userLanguage.startsWith('zh')) {
  // Chinese fonts
  univerAPI.addFonts([
    { value: 'PingFang SC', label: 'PingFang SC' },
    { value: 'Microsoft YaHei', label: 'Microsoft YaHei' },
  ])
} else if (userLanguage.startsWith('ja')) {
  // Japanese fonts
  univerAPI.addFonts([
    { value: 'Hiragino Sans', label: 'Hiragino Sans' },
    { value: 'Yu Gothic', label: 'Yu Gothic' },
  ])
} else {
  // English fonts
  univerAPI.addFonts([
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
  ])
}
```

### 7. Font Fallback Configuration

```typescript
univerAPI.addFonts([
  {
    value: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    label: 'System UI',
    category: 'sans-serif',
  },
  {
    value: 'Georgia, "Times New Roman", Times, serif',
    label: 'Serif Stack',
    category: 'serif',
  },
  {
    value: '"Courier New", Courier, monospace',
    label: 'Monospace Stack',
    category: 'monospace',
  },
])
```

### 8. Check Font Availability

```typescript
async function isFontAvailable(fontName: string): Promise<boolean> {
  try {
    await document.fonts.load(`12px "${fontName}"`)
    const fonts = document.fonts.check(`12px "${fontName}"`)
    return fonts
  } catch {
    return false
  }
}

// Only add available fonts
const fontsToCheck = ['Arial', 'Helvetica', 'Custom Font']

for (const font of fontsToCheck) {
  const available = await isFontAvailable(font)
  if (available) {
    univerAPI.addFonts([
      { value: font, label: font, category: 'sans-serif' },
    ])
  }
}
```

### 9. Font dengan Internationalization

```typescript
// Using i18n keys
const { univerAPI } = createUniver({
  locale: LocaleType.ZH_CN,
  locales: {
    [LocaleType.ZH_CN]: {
      font: {
        arial: '宋体',
        helvetica: '黑体',
      },
    },
  },
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: [
        {
          value: 'Arial',
          label: 'font.arial', // Will use i18n key
          category: 'sans-serif',
        },
        {
          value: 'Helvetica',
          label: 'font.helvetica',
          category: 'sans-serif',
        },
      ],
    }),
  ],
})
```

### 10. Complete Font Setup

```typescript
const FONT_CONFIG = {
  SANS_SERIF: [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
  ],
  SERIF: [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Garamond', label: 'Garamond' },
  ],
  MONOSPACE: [
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Monaco', label: 'Monaco' },
  ],
}

const allFonts = [
  ...FONT_CONFIG.SANS_SERIF.map(f => ({ ...f, category: 'sans-serif' })),
  ...FONT_CONFIG.SERIF.map(f => ({ ...f, category: 'serif' })),
  ...FONT_CONFIG.MONOSPACE.map(f => ({ ...f, category: 'monospace' })),
]

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset({
      customFontFamily: allFonts,
    }),
  ],
})
```

## Best Practices

### 1. Use Font Stacks
```typescript
// ✅ Good - provide fallbacks
univerAPI.addFonts([
  {
    value: '"Segoe UI", Arial, sans-serif',
    label: 'Segoe UI',
    category: 'sans-serif',
  },
])
```

### 2. Categorize Fonts
```typescript
// ✅ Good - use categories for better UX
univerAPI.addFonts([
  { value: 'Arial', label: 'Arial', category: 'sans-serif' },
  { value: 'Georgia', label: 'Georgia', category: 'serif' },
  { value: 'Courier', label: 'Courier', category: 'monospace' },
])
```

### 3. Load Fonts Asynchronously
```typescript
// ✅ Good - don't block initialization
async function loadCustomFonts() {
  const fonts = await fetchFontsFromAPI()
  univerAPI.addFonts(fonts)
}

// Call after Univer is initialized
loadCustomFonts()
```

### 4. Validate Font Names
```typescript
// ✅ Good - validate before adding
function isValidFontName(name: string): boolean {
  return name.length > 0 && name.length < 100
}

const fontName = 'Arial'
if (isValidFontName(fontName)) {
  univerAPI.addFonts([{ value: fontName, label: fontName }])
}
```

### 5. Use Constants
```typescript
// ✅ Good
const FONTS = {
  ARIAL: { value: 'Arial', label: 'Arial', category: 'sans-serif' },
  GEORGIA: { value: 'Georgia', label: 'Georgia', category: 'serif' },
}

univerAPI.addFonts([FONTS.ARIAL, FONTS.GEORGIA])
```

## Troubleshooting

### Font tidak muncul di dropdown

**Penyebab:**
- Font tidak di-register
- Configuration salah
- Font value tidak valid

**Solusi:**
```typescript
// Verify font is registered
console.log('Registering font...')

univerAPI.addFonts([
  {
    value: 'Arial',
    label: 'Arial',
    category: 'sans-serif',
  },
])

console.log('Font registered')
```

### Font tidak render dengan benar

**Penyebab:**
- Font tidak installed di system
- Font file tidak loaded
- CSS font-family salah

**Solusi:**
```typescript
// Check if font is available
async function checkFont(fontName: string) {
  const available = await document.fonts.check(`12px "${fontName}"`)
  
  if (!available) {
    console.warn(`Font ${fontName} not available`)
    // Use fallback
    return 'Arial'
  }
  
  return fontName
}

const font = await checkFont('Custom Font')
univerAPI.addFonts([{ value: font, label: font }])
```

### Web font tidak load

**Penyebab:**
- Font URL salah
- CORS issue
- Font format tidak supported

**Solusi:**
```typescript
// Ensure font is loaded before registering
const fontFace = new FontFace(
  'CustomFont',
  'url(/fonts/CustomFont.woff2)'
)

try {
  await fontFace.load()
  document.fonts.add(fontFace)
  
  // Now register in Univer
  univerAPI.addFonts([
    { value: 'CustomFont', label: 'Custom Font' },
  ])
} catch (error) {
  console.error('Failed to load font:', error)
}
```

## Referensi

- [Official Fonts Documentation](https://docs.univer.ai/guides/sheets/ui/fonts)
- [CSS Fonts MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family)
- [Font Loading API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)

---

**Related Documentation:**
- [Themes](./themes.md)
- [UI Overview](./overview.md)
- [Rich Text](../core/rich-text.md)
