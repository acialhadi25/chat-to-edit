# Univer Sheet - Crosshair Highlighting

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Univer Sheet Crosshair Highlighting menyediakan fitur untuk highlight row dan column dari cell yang aktif, memudahkan navigasi dan fokus pada data.

### Fitur Utama
- **Row Highlighting**: Highlight seluruh row dari cell aktif
- **Column Highlighting**: Highlight seluruh column dari cell aktif
- **Color Customization**: Kustomisasi warna highlight
- **Toggle On/Off**: Enable/disable highlighting dengan mudah
- **Real-time Update**: Highlight berubah saat cell selection berubah

### Kapan Menggunakan
- Spreadsheet dengan banyak data
- Memudahkan tracking row/column
- Presentasi data
- Data entry yang memerlukan fokus
- Navigasi pada large datasets

### Keuntungan
- Meningkatkan readability
- Mengurangi error saat data entry
- Better user experience
- Mudah diimplementasikan
- Customizable appearance


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/sheets-crosshair-highlight @univerjs/sheets-crosshair-highlight-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsCrosshairHighlightPlugin } from '@univerjs/sheets-crosshair-highlight';
import { UniverSheetsCrosshairHighlightUIPlugin } from '@univerjs/sheets-crosshair-highlight-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-crosshair-highlight-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register crosshair highlight plugins
univerAPI.registerPlugin(UniverSheetsCrosshairHighlightPlugin);
univerAPI.registerPlugin(UniverSheetsCrosshairHighlightUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/sheets-crosshair-highlight @univerjs/sheets-crosshair-highlight-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsCrosshairHighlightPlugin } from '@univerjs/sheets-crosshair-highlight';
import { UniverSheetsCrosshairHighlightUIPlugin } from '@univerjs/sheets-crosshair-highlight-ui';

const univer = new Univer();

// Register crosshair highlight plugins
univer.registerPlugin(UniverSheetsCrosshairHighlightPlugin);
univer.registerPlugin(UniverSheetsCrosshairHighlightUIPlugin);
```

### Default Configuration

```typescript
// Configure with default settings
univerAPI.registerPlugin(UniverSheetsCrosshairHighlightPlugin, {
  enabled: true,
  color: 'rgba(0, 123, 255, 0.1)', // Light blue
});
```


## API Reference

### univerAPI Methods

#### setCrosshairHighlightEnabled()
Enable atau disable crosshair highlighting.

```typescript
setCrosshairHighlightEnabled(enabled: boolean): void
```

**Parameters**:
- `enabled`: `boolean` - True untuk enable, false untuk disable

**Example**:
```typescript
// Enable highlighting
univerAPI.setCrosshairHighlightEnabled(true);

// Disable highlighting
univerAPI.setCrosshairHighlightEnabled(false);
```

#### getCrosshairHighlightEnabled()
Mendapatkan status crosshair highlighting.

```typescript
getCrosshairHighlightEnabled(): boolean
```

**Returns**: `boolean` - True jika enabled

**Example**:
```typescript
const isEnabled = univerAPI.getCrosshairHighlightEnabled();
console.log('Crosshair highlight enabled:', isEnabled);
```

#### setCrosshairHighlightColor()
Set warna highlight.

```typescript
setCrosshairHighlightColor(color: string): void
```

**Parameters**:
- `color`: `string` - Warna dalam format CSS (hex, rgb, rgba)

**Example**:
```typescript
// Set blue highlight
univerAPI.setCrosshairHighlightColor('rgba(0, 123, 255, 0.1)');

// Set yellow highlight
univerAPI.setCrosshairHighlightColor('#ffff0033');
```

#### getCrosshairHighlightColor()
Mendapatkan warna highlight saat ini.

```typescript
getCrosshairHighlightColor(): string
```

**Returns**: `string` - Warna highlight

**Example**:
```typescript
const color = univerAPI.getCrosshairHighlightColor();
console.log('Current highlight color:', color);
```

### Events

#### CrosshairHighlightEnabledChanged
Triggered saat status highlighting berubah.

```typescript
univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightEnabledChanged,
  (params: { enabled: boolean }) => {
    console.log('Crosshair highlight enabled:', params.enabled);
  }
);
```

#### CrosshairHighlightColorChanged
Triggered saat warna highlight berubah.

```typescript
univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightColorChanged,
  (params: { color: string }) => {
    console.log('Crosshair highlight color:', params.color);
  }
);
```


## Contoh Penggunaan

### 1. Enable Crosshair Highlighting

```typescript
import { univerAPI } from '@univerjs/presets';

// Enable crosshair highlighting
univerAPI.setCrosshairHighlightEnabled(true);
```

### 2. Disable Crosshair Highlighting

```typescript
// Disable crosshair highlighting
univerAPI.setCrosshairHighlightEnabled(false);
```

### 3. Toggle Highlighting

```typescript
// Toggle on/off
const currentState = univerAPI.getCrosshairHighlightEnabled();
univerAPI.setCrosshairHighlightEnabled(!currentState);
```

### 4. Set Custom Color - Blue

```typescript
// Set light blue highlight
univerAPI.setCrosshairHighlightColor('rgba(0, 123, 255, 0.1)');
```

### 5. Set Custom Color - Yellow

```typescript
// Set light yellow highlight
univerAPI.setCrosshairHighlightColor('rgba(255, 255, 0, 0.15)');
```

### 6. Set Custom Color - Green

```typescript
// Set light green highlight
univerAPI.setCrosshairHighlightColor('rgba(0, 255, 0, 0.1)');
```

### 7. Check Current Status

```typescript
// Check if enabled
const isEnabled = univerAPI.getCrosshairHighlightEnabled();
const currentColor = univerAPI.getCrosshairHighlightColor();

console.log('Enabled:', isEnabled);
console.log('Color:', currentColor);
```

### 8. Listen to Status Changes

```typescript
// Listen to enable/disable events
univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightEnabledChanged,
  (params) => {
    console.log('Highlighting is now:', params.enabled ? 'ON' : 'OFF');
  }
);
```

### 9. Listen to Color Changes

```typescript
// Listen to color change events
univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightColorChanged,
  (params) => {
    console.log('New highlight color:', params.color);
  }
);
```

### 10. Complete Setup dengan Custom Settings

```typescript
// Enable with custom color
univerAPI.setCrosshairHighlightEnabled(true);
univerAPI.setCrosshairHighlightColor('rgba(255, 165, 0, 0.12)'); // Orange

// Add event listeners
univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightEnabledChanged,
  (params) => {
    console.log('Status changed:', params.enabled);
  }
);

univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightColorChanged,
  (params) => {
    console.log('Color changed:', params.color);
  }
);
```


## Custom React Hooks

### useCrosshairHighlight

Hook untuk mengelola crosshair highlighting dalam komponen React.

```typescript
import { useState, useCallback, useEffect } from 'react';
import { univerAPI } from '@univerjs/presets';

interface UseCrosshairHighlightReturn {
  enabled: boolean;
  color: string;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
  setColor: (color: string) => void;
}

export function useCrosshairHighlight(): UseCrosshairHighlightReturn {
  const [enabled, setEnabled] = useState(() => 
    univerAPI.getCrosshairHighlightEnabled()
  );
  const [color, setColorState] = useState(() => 
    univerAPI.getCrosshairHighlightColor()
  );

  useEffect(() => {
    // Listen to status changes
    const unsubscribeEnabled = univerAPI.addEvent(
      univerAPI.Event.CrosshairHighlightEnabledChanged,
      (params: { enabled: boolean }) => {
        setEnabled(params.enabled);
      }
    );

    // Listen to color changes
    const unsubscribeColor = univerAPI.addEvent(
      univerAPI.Event.CrosshairHighlightColorChanged,
      (params: { color: string }) => {
        setColorState(params.color);
      }
    );

    return () => {
      unsubscribeEnabled?.();
      unsubscribeColor?.();
    };
  }, []);

  const toggle = useCallback(() => {
    const newState = !enabled;
    univerAPI.setCrosshairHighlightEnabled(newState);
  }, [enabled]);

  const enable = useCallback(() => {
    univerAPI.setCrosshairHighlightEnabled(true);
  }, []);

  const disable = useCallback(() => {
    univerAPI.setCrosshairHighlightEnabled(false);
  }, []);

  const setColor = useCallback((newColor: string) => {
    univerAPI.setCrosshairHighlightColor(newColor);
  }, []);

  return {
    enabled,
    color,
    toggle,
    enable,
    disable,
    setColor,
  };
}
```

### Penggunaan Hook

```typescript
import React from 'react';
import { useCrosshairHighlight } from './hooks/useCrosshairHighlight';

export function CrosshairPanel() {
  const {
    enabled,
    color,
    toggle,
    setColor,
  } = useCrosshairHighlight();

  const predefinedColors = [
    { name: 'Blue', value: 'rgba(0, 123, 255, 0.1)' },
    { name: 'Yellow', value: 'rgba(255, 255, 0, 0.15)' },
    { name: 'Green', value: 'rgba(0, 255, 0, 0.1)' },
    { name: 'Orange', value: 'rgba(255, 165, 0, 0.12)' },
    { name: 'Purple', value: 'rgba(128, 0, 128, 0.1)' },
  ];

  return (
    <div className="crosshair-panel">
      <h3>Crosshair Highlighting</h3>
      
      <div className="status">
        Status: {enabled ? 'Enabled' : 'Disabled'}
      </div>
      
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Highlighting
      </button>
      
      {enabled && (
        <div className="color-picker">
          <h4>Select Color:</h4>
          {predefinedColors.map(({ name, value }) => (
            <button
              key={name}
              onClick={() => setColor(value)}
              className={color === value ? 'active' : ''}
              style={{ backgroundColor: value }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      
      <div className="current-color">
        Current Color: <span style={{ backgroundColor: color }}>{color}</span>
      </div>
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Use Subtle Colors**
```typescript
// Good - Subtle, doesn't distract
univerAPI.setCrosshairHighlightColor('rgba(0, 123, 255, 0.1)');
```

2. **Enable untuk Large Datasets**
```typescript
// Good - Helpful for navigation
if (dataRowCount > 50) {
  univerAPI.setCrosshairHighlightEnabled(true);
}
```

3. **Provide Toggle Control**
```typescript
// Good - Let users control
function ToggleButton() {
  const toggle = () => {
    const current = univerAPI.getCrosshairHighlightEnabled();
    univerAPI.setCrosshairHighlightEnabled(!current);
  };
  return <button onClick={toggle}>Toggle Highlight</button>;
}
```

4. **Use Appropriate Opacity**
```typescript
// Good - Visible but not overwhelming
// rgba(r, g, b, 0.1) - 10% opacity
// rgba(r, g, b, 0.15) - 15% opacity
univerAPI.setCrosshairHighlightColor('rgba(0, 255, 0, 0.12)');
```

5. **Match Theme Colors**
```typescript
// Good - Consistent with app theme
const themeColor = getThemePrimaryColor();
const highlightColor = `${themeColor}1a`; // Add alpha
univerAPI.setCrosshairHighlightColor(highlightColor);
```

### Don'ts ❌

1. **Jangan Gunakan Warna Terlalu Terang**
```typescript
// Bad - Too bright, distracting
univerAPI.setCrosshairHighlightColor('rgba(255, 0, 0, 0.5)');

// Good - Subtle
univerAPI.setCrosshairHighlightColor('rgba(255, 0, 0, 0.1)');
```

2. **Jangan Force Enable untuk Small Datasets**
```typescript
// Bad - Unnecessary for small data
if (dataRowCount < 10) {
  univerAPI.setCrosshairHighlightEnabled(true); // Not needed
}

// Good - Only for large datasets
if (dataRowCount > 50) {
  univerAPI.setCrosshairHighlightEnabled(true);
}
```

3. **Jangan Ignore User Preferences**
```typescript
// Bad - Always enabled
univerAPI.setCrosshairHighlightEnabled(true);

// Good - Check user preference
const userPreference = getUserPreference('crosshairHighlight');
univerAPI.setCrosshairHighlightEnabled(userPreference);
```

4. **Jangan Gunakan Opacity Terlalu Tinggi**
```typescript
// Bad - Blocks content
univerAPI.setCrosshairHighlightColor('rgba(0, 0, 255, 0.6)');

// Good - Subtle overlay
univerAPI.setCrosshairHighlightColor('rgba(0, 0, 255, 0.1)');
```


## Troubleshooting

### Highlighting Tidak Muncul

**Gejala**: Crosshair highlight tidak terlihat

**Solusi**:
```typescript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverSheetsCrosshairHighlightPlugin);
univerAPI.registerPlugin(UniverSheetsCrosshairHighlightUIPlugin);

// 2. Pastikan enabled
univerAPI.setCrosshairHighlightEnabled(true);

// 3. Cek warna tidak terlalu transparan
univerAPI.setCrosshairHighlightColor('rgba(0, 123, 255, 0.15)');

// 4. Verify status
console.log('Enabled:', univerAPI.getCrosshairHighlightEnabled());
console.log('Color:', univerAPI.getCrosshairHighlightColor());
```

### Warna Tidak Berubah

**Gejala**: setColor tidak mengubah warna

**Solusi**:
```typescript
// Ensure valid color format
const validColors = [
  'rgba(255, 0, 0, 0.1)',     // RGBA
  '#ff000033',                 // Hex with alpha
  'rgb(255, 0, 0)',           // RGB (no alpha)
];

// Set color
univerAPI.setCrosshairHighlightColor(validColors[0]);

// Verify change
setTimeout(() => {
  const newColor = univerAPI.getCrosshairHighlightColor();
  console.log('New color:', newColor);
}, 100);
```

### Event Listener Tidak Triggered

**Gejala**: Event listener tidak dipanggil

**Solusi**:
```typescript
// Ensure proper event registration
const unsubscribe = univerAPI.addEvent(
  univerAPI.Event.CrosshairHighlightEnabledChanged,
  (params) => {
    console.log('Event triggered:', params);
  }
);

// Test by toggling
univerAPI.setCrosshairHighlightEnabled(false);
univerAPI.setCrosshairHighlightEnabled(true);

// Cleanup when done
// unsubscribe();
```

### Performance Issue

**Gejala**: Aplikasi lambat dengan highlighting enabled

**Solusi**:
```typescript
// 1. Use lighter color (lower opacity)
univerAPI.setCrosshairHighlightColor('rgba(0, 123, 255, 0.05)');

// 2. Disable for very large datasets
const MAX_ROWS_FOR_HIGHLIGHT = 1000;
if (dataRowCount > MAX_ROWS_FOR_HIGHLIGHT) {
  univerAPI.setCrosshairHighlightEnabled(false);
}

// 3. Let users control
// Provide toggle button for users to disable if needed
```

### Highlight Tidak Sync dengan Selection

**Gejala**: Highlight tidak update saat cell selection berubah

**Solusi**:
```typescript
// This should work automatically
// If not, try:

// 1. Disable and re-enable
univerAPI.setCrosshairHighlightEnabled(false);
setTimeout(() => {
  univerAPI.setCrosshairHighlightEnabled(true);
}, 100);

// 2. Check for plugin conflicts
// Ensure no other plugins interfere with selection

// 3. Verify Univer version
console.log('Univer version:', univerAPI.getVersion());
```

## Referensi

### Official Documentation
- [Univer Crosshair Highlighting Guide](https://docs.univer.ai/guides/sheets/features/crosshair-highlighting)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Command system dan events
- [Sheets API](../core/sheets-api.md) - Worksheet management
- [Range Selection](../core/range-selection.md) - Selection handling

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs/sheets-crosshair-highlight, @univerjs/sheets-crosshair-highlight-ui
