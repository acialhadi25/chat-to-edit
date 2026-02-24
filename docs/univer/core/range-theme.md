# Univer Sheet - Range Theme (Tema Range)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Range Theme menyediakan preset tema dan kemampuan untuk customize tema untuk memperkaya tampilan tabel. Mirip dengan Excel Table styles, fitur ini memungkinkan styling konsisten untuk range data.

### Fitur Utama
- ✅ Preset themes (30+ built-in themes)
- ✅ Custom theme creation
- ✅ Row dan column styling
- ✅ Header styling
- ✅ Theme registration dan management
- ✅ Style priority system

### Built-in Themes
- Default theme (mirip Excel Table)
- Light themes (blue, grey, red, orange, yellow, green, azure, indigo, purple, magenta)
- Middle themes (same colors)
- Dark themes (same colors)

### Kapan Menggunakan Range Theme
- Styling tabel data
- Dashboard dan reports
- Data presentation
- Consistent formatting
- Quick styling tanpa manual formatting

## Instalasi

Range Theme sudah termasuk dalam Univer Sheets Core.

### Preset Mode

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import { createUniver } from '@univerjs/presets'

const { univerAPI } = createUniver({
  presets: [
    UniverSheetsCorePreset()
  ],
})
```

## API Reference

### Get Available Themes

#### `FWorkbook.getRegisteredRangeThemes()`
Get semua registered themes.

**Returns:** `string[]` - Array of theme names

### Apply Theme

#### `FRange.useThemeStyle(themeName)`
Apply theme ke range.

**Parameters:**
- `themeName` (string | undefined): Nama theme, undefined untuk clear

**Returns:** `boolean` - Success status

#### `FRange.getUsedThemeStyle()`
Get theme yang sedang digunakan.

**Returns:** `string | null` - Theme name atau null

#### `FRange.removeThemeStyle(themeName)`
Remove theme dari range.

**Parameters:**
- `themeName` (string): Nama theme

**Returns:** `boolean` - Success status

### Create Custom Theme

#### `FWorkbook.createRangeThemeStyle(name, options)`
Create custom theme.

**Parameters:**
- `name` (string): Theme name
- `options` (IRangeThemeStyleJSON): Theme configuration

**Returns:** `RangeThemeStyle` - Theme instance

#### `FWorkbook.registerRangeTheme(theme)`
Register custom theme.

**Parameters:**
- `theme` (RangeThemeStyle): Theme instance

**Returns:** `boolean` - Success status

#### `FWorkbook.unregisterRangeTheme(themeName)`
Unregister theme.

**Parameters:**
- `themeName` (string): Theme name

**Returns:** `boolean` - Success status

### RangeThemeStyle Properties

| Property | Description |
|----------|-------------|
| `name` | Theme name |
| `wholeStyle` | Style untuk entire range |
| `firstRowStyle` | Style untuk first row |
| `secondRowStyle` | Style untuk second row |
| `headerRowStyle` | Style untuk header row |
| `lastRowStyle` | Style untuk last row |
| `firstColumnStyle` | Style untuk first column |
| `secondColumnStyle` | Style untuk second column |
| `headerColumnStyle` | Style untuk header column |
| `lastColumnStyle` | Style untuk last column |

### Style Priority

Styles diterapkan dengan priority order:
```
lastRowStyle > headerRowStyle > lastColumnStyle > headerColumnStyle > 
secondRowStyle > firstRowStyle > secondColumnStyle > firstColumnStyle > wholeStyle
```

## Contoh Penggunaan

### 1. Get Available Themes

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get semua registered themes
const themes = fWorkbook.getRegisteredRangeThemes()

console.log('Available themes:', themes)
// Output: ['default', 'light-blue', 'light-grey', 'light-red', ...]
```

### 2. Apply Built-in Theme

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Apply default theme ke range A1:E20
const fRange = fWorksheet.getRange('A1:E20')
fRange.useThemeStyle('default')

console.log('Theme applied successfully')
```

### 3. Apply Different Themes

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Light blue theme
fWorksheet.getRange('A1:E10').useThemeStyle('light-blue')

// Dark red theme
fWorksheet.getRange('A12:E22').useThemeStyle('dark-red')

// Middle green theme
fWorksheet.getRange('A24:E34').useThemeStyle('middle-green')
```

### 4. Get Current Theme

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()
const fRange = fWorksheet.getRange('A1:E20')

// Apply theme
fRange.useThemeStyle('light-blue')

// Get current theme
const currentTheme = fRange.getUsedThemeStyle()
console.log('Current theme:', currentTheme) // 'light-blue'
```

### 5. Remove Theme

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()
const fRange = fWorksheet.getRange('A1:E20')

// Apply theme
fRange.useThemeStyle('default')

// Get current theme
const currentTheme = fRange.getUsedThemeStyle()

// Remove theme
if (currentTheme) {
  fRange.removeThemeStyle(currentTheme)
  // Or use undefined
  fRange.useThemeStyle(undefined)
}
```

### 6. Create Simple Custom Theme

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create custom theme dengan second row style
const customTheme = fWorkbook.createRangeThemeStyle('MyTheme', {
  secondRowStyle: {
    bg: {
      rgb: 'rgb(214,231,241)',
    },
  },
})

// Register theme
fWorkbook.registerRangeTheme(customTheme)

// Use custom theme
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1:E20')
fRange.useThemeStyle('MyTheme')
```

### 7. Create Complex Custom Theme

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create theme dengan multiple styles
const complexTheme = fWorkbook.createRangeThemeStyle('CorporateTheme', {
  headerRowStyle: {
    bg: { rgb: '#2c3e50' },
    cl: { rgb: '#ffffff' },
    bl: 1, // bold
  },
  firstRowStyle: {
    bg: { rgb: '#ecf0f1' },
  },
  secondRowStyle: {
    bg: { rgb: '#ffffff' },
  },
  lastRowStyle: {
    bg: { rgb: '#3498db' },
    cl: { rgb: '#ffffff' },
  },
})

fWorkbook.registerRangeTheme(complexTheme)

// Apply theme
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('A1:E20').useThemeStyle('CorporateTheme')
```

### 8. Create Theme dengan RangeThemeStyle Class

```typescript
import { RangeThemeStyle } from '@univerjs/sheets'

const fWorkbook = univerAPI.getActiveWorkbook()

// Method 1: Create dengan constructor
const theme1 = new RangeThemeStyle('Theme1', {
  secondRowStyle: {
    bg: { rgb: 'rgb(214,231,241)' },
  },
})

// Method 2: Create dan set styles
const theme2 = new RangeThemeStyle('Theme2')
theme2.setSecondRowStyle({
  bg: { rgb: 'rgb(214,231,241)' },
})
theme2.setHeaderRowStyle({
  bg: { rgb: '#2c3e50' },
  cl: { rgb: '#ffffff' },
})

// Register themes
fWorkbook.registerRangeTheme(theme1)
fWorkbook.registerRangeTheme(theme2)
```

### 9. Unregister Custom Theme

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create dan register theme
const customTheme = fWorkbook.createRangeThemeStyle('TempTheme', {
  secondRowStyle: {
    bg: { rgb: '#f0f0f0' },
  },
})
fWorkbook.registerRangeTheme(customTheme)

// Use theme
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('A1:E10').useThemeStyle('TempTheme')

// Later, unregister theme
fWorkbook.unregisterRangeTheme('TempTheme')
```

### 10. Theme dengan Alternating Rows

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Create theme dengan alternating row colors
const alternatingTheme = fWorkbook.createRangeThemeStyle('AlternatingRows', {
  firstRowStyle: {
    bg: { rgb: '#ffffff' },
  },
  secondRowStyle: {
    bg: { rgb: '#f5f5f5' },
  },
  headerRowStyle: {
    bg: { rgb: '#4CAF50' },
    cl: { rgb: '#ffffff' },
    bl: 1,
  },
})

fWorkbook.registerRangeTheme(alternatingTheme)

// Apply to data range
const fWorksheet = fWorkbook.getActiveSheet()
fWorksheet.getRange('A1:E20').useThemeStyle('AlternatingRows')
```

## Custom React Hooks

### useRangeTheme Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

export function useRangeTheme() {
  const univerAPI = useFacadeAPI()
  const [themes, setThemes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load available themes
  const loadThemes = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const availableThemes = fWorkbook.getRegisteredRangeThemes()
    setThemes(availableThemes)
  }, [univerAPI])

  // Apply theme to range
  const applyTheme = useCallback((
    range: string,
    themeName: string
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(range)
      
      const success = fRange.useThemeStyle(themeName)
      return success
    } catch (error) {
      console.error('Error applying theme:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI])

  // Remove theme from range
  const removeTheme = useCallback((range: string) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(range)
      
      const success = fRange.useThemeStyle(undefined)
      return success
    } catch (error) {
      console.error('Error removing theme:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI])

  // Create custom theme
  const createCustomTheme = useCallback((
    name: string,
    options: any
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      
      const customTheme = fWorkbook.createRangeThemeStyle(name, options)
      const success = fWorkbook.registerRangeTheme(customTheme)
      
      if (success) {
        loadThemes()
      }
      
      return success
    } catch (error) {
      console.error('Error creating theme:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadThemes])

  // Get current theme of range
  const getCurrentTheme = useCallback((range: string) => {
    if (!univerAPI) return null

    const fWorkbook = univerAPI.getActiveWorkbook()
    const fWorksheet = fWorkbook.getActiveSheet()
    const fRange = fWorksheet.getRange(range)
    
    return fRange.getUsedThemeStyle()
  }, [univerAPI])

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  return {
    themes,
    loading,
    applyTheme,
    removeTheme,
    createCustomTheme,
    getCurrentTheme,
    loadThemes
  }
}
```

### Contoh Penggunaan Hook

```typescript
function ThemeSelector() {
  const {
    themes,
    loading,
    applyTheme,
    removeTheme,
    createCustomTheme,
    getCurrentTheme
  } = useRangeTheme()
  
  const [selectedRange, setSelectedRange] = useState('A1:E20')
  const [selectedTheme, setSelectedTheme] = useState('default')

  const handleApplyTheme = () => {
    const success = applyTheme(selectedRange, selectedTheme)
    if (success) {
      console.log('Theme applied!')
    }
  }

  const handleRemoveTheme = () => {
    const success = removeTheme(selectedRange)
    if (success) {
      console.log('Theme removed!')
    }
  }

  const handleCreateCustom = () => {
    const success = createCustomTheme('MyCustomTheme', {
      headerRowStyle: {
        bg: { rgb: '#4CAF50' },
        cl: { rgb: '#ffffff' },
      },
      secondRowStyle: {
        bg: { rgb: '#f5f5f5' },
      },
    })
    
    if (success) {
      console.log('Custom theme created!')
    }
  }

  return (
    <div>
      <input
        type="text"
        value={selectedRange}
        onChange={(e) => setSelectedRange(e.target.value)}
        placeholder="Range (e.g., A1:E20)"
      />
      
      <select
        value={selectedTheme}
        onChange={(e) => setSelectedTheme(e.target.value)}
      >
        {themes.map(theme => (
          <option key={theme} value={theme}>
            {theme}
          </option>
        ))}
      </select>
      
      <button onClick={handleApplyTheme} disabled={loading}>
        Apply Theme
      </button>
      
      <button onClick={handleRemoveTheme} disabled={loading}>
        Remove Theme
      </button>
      
      <button onClick={handleCreateCustom} disabled={loading}>
        Create Custom Theme
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Use Descriptive Theme Names
```typescript
// ❌ Bad
const theme = fWorkbook.createRangeThemeStyle('t1', options)

// ✅ Good
const theme = fWorkbook.createRangeThemeStyle('CorporateBlue', options)
```

### 2. Check Theme Existence
```typescript
// ✅ Good - check before registering
const fWorkbook = univerAPI.getActiveWorkbook()
const themes = fWorkbook.getRegisteredRangeThemes()

if (!themes.includes('MyTheme')) {
  const customTheme = fWorkbook.createRangeThemeStyle('MyTheme', options)
  fWorkbook.registerRangeTheme(customTheme)
}
```

### 3. Use Constants for Theme Names
```typescript
// ✅ Good
const THEMES = {
  CORPORATE: 'CorporateTheme',
  LIGHT: 'LightTheme',
  DARK: 'DarkTheme'
}

fWorkbook.createRangeThemeStyle(THEMES.CORPORATE, options)
```

### 4. Validate Range Before Applying
```typescript
// ✅ Good
try {
  const fRange = fWorksheet.getRange('A1:E20')
  if (fRange) {
    fRange.useThemeStyle('default')
  }
} catch (error) {
  console.error('Invalid range:', error)
}
```

### 5. Clean Up Unused Themes
```typescript
// ✅ Good - unregister when not needed
const tempThemes = ['TempTheme1', 'TempTheme2']

tempThemes.forEach(themeName => {
  fWorkbook.unregisterRangeTheme(themeName)
})
```

## Troubleshooting

### Theme tidak apply

**Penyebab:**
- Theme tidak registered
- Range tidak valid
- Theme name salah

**Solusi:**
```typescript
// Check if theme exists
const fWorkbook = univerAPI.getActiveWorkbook()
const themes = fWorkbook.getRegisteredRangeThemes()

if (!themes.includes('MyTheme')) {
  console.error('Theme not registered')
  // Register theme first
  const theme = fWorkbook.createRangeThemeStyle('MyTheme', options)
  fWorkbook.registerRangeTheme(theme)
}

// Apply theme
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1:E20')
fRange.useThemeStyle('MyTheme')
```

### Custom theme tidak muncul

**Penyebab:**
- Theme tidak di-register
- Theme name conflict
- Registration failed

**Solusi:**
```typescript
// Ensure unique name
const themeName = `CustomTheme_${Date.now()}`

const customTheme = fWorkbook.createRangeThemeStyle(themeName, {
  secondRowStyle: {
    bg: { rgb: '#f0f0f0' },
  },
})

const success = fWorkbook.registerRangeTheme(customTheme)

if (!success) {
  console.error('Failed to register theme')
} else {
  console.log('Theme registered successfully')
}
```

### Style tidak sesuai expected

**Penyebab:**
- Style priority
- Cell style override theme
- Wrong style property

**Solusi:**
```typescript
// Remember style priority order
// lastRowStyle > headerRowStyle > ... > wholeStyle

// Clear cell styles first if needed
const fRange = fWorksheet.getRange('A1:E20')
fRange.clearFormat()

// Then apply theme
fRange.useThemeStyle('MyTheme')
```

## Referensi

- [Official Range Theme Documentation](https://docs.univer.ai/guides/sheets/features/core/range-theme)
- [Facade API Reference](https://reference.univer.ai/)
- [Styling Guide](../ui/themes.md)

---

**Related Documentation:**
- [Themes](../ui/themes.md)
- [Conditional Formatting](../features/conditional-formatting.md)
- [Sheets API](./sheets-api.md)
