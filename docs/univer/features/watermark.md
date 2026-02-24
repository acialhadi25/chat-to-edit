# Univer Sheet - Watermark

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

Univer Sheet Watermark menyediakan kemampuan untuk menambahkan watermark teks atau gambar pada worksheet untuk proteksi dan branding.

### Fitur Utama
- **Text Watermark**: Watermark berbasis teks dengan kustomisasi font dan warna
- **Image Watermark**: Watermark berbasis gambar/logo
- **Customizable**: Opacity, rotation, size, position
- **Multiple Worksheets**: Apply watermark ke multiple sheets
- **Easy Management**: Add, update, remove watermark dengan mudah

### Kapan Menggunakan
- Proteksi dokumen dengan copyright notice
- Branding dengan logo perusahaan
- Menandai dokumen sebagai draft atau confidential
- Watermark untuk presentasi atau sharing
- Security dan authenticity marking

### Keuntungan
- Mudah diimplementasikan
- Kustomisasi penuh
- Tidak mengganggu konten
- Professional appearance
- Proteksi visual


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/sheets-watermark @univerjs/sheets-watermark-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsWatermarkPlugin } from '@univerjs/sheets-watermark';
import { UniverSheetsWatermarkUIPlugin } from '@univerjs/sheets-watermark-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-watermark-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register watermark plugins
univerAPI.registerPlugin(UniverSheetsWatermarkPlugin);
univerAPI.registerPlugin(UniverSheetsWatermarkUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/sheets-watermark @univerjs/sheets-watermark-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsWatermarkPlugin } from '@univerjs/sheets-watermark';
import { UniverSheetsWatermarkUIPlugin } from '@univerjs/sheets-watermark-ui';

const univer = new Univer();

// Register watermark plugins
univer.registerPlugin(UniverSheetsWatermarkPlugin);
univer.registerPlugin(UniverSheetsWatermarkUIPlugin);
```


## API Reference

### Enums

#### WatermarkType

```typescript
enum WatermarkType {
  TEXT = 'text',
  IMAGE = 'image',
}
```

### univerAPI Methods

#### addWatermark()
Menambahkan watermark ke worksheet.

```typescript
addWatermark(type: WatermarkType, settings: IWatermarkSettings): Promise<boolean>
```

**Parameters**:
- `type`: `WatermarkType` - Tipe watermark (TEXT atau IMAGE)
- `settings`: `IWatermarkSettings` - Konfigurasi watermark

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'CONFIDENTIAL',
  fontSize: 48,
  color: '#ff0000',
  opacity: 0.3,
  rotation: -45,
});
```

#### deleteWatermark()
Menghapus watermark dari worksheet.

```typescript
deleteWatermark(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
await univerAPI.deleteWatermark();
```

### Interfaces

#### IWatermarkSettings

```typescript
interface IWatermarkSettings {
  // For text watermark
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  
  // For image watermark
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  
  // Common settings
  opacity?: number;        // 0-1
  rotation?: number;       // Degrees
  position?: {
    x?: number;
    y?: number;
  };
  repeat?: boolean;        // Repeat pattern
  spacing?: {
    horizontal?: number;
    vertical?: number;
  };
}
```


## Contoh Penggunaan

### 1. Text Watermark Sederhana

```typescript
import { univerAPI } from '@univerjs/presets';
import { WatermarkType } from '@univerjs/sheets-watermark';

// Add simple text watermark
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'DRAFT',
  fontSize: 60,
  color: '#cccccc',
  opacity: 0.3,
  rotation: -45,
});
```

### 2. Confidential Watermark

```typescript
// Add confidential watermark
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'CONFIDENTIAL',
  fontSize: 48,
  fontFamily: 'Arial',
  color: '#ff0000',
  opacity: 0.25,
  rotation: -30,
  repeat: true,
  spacing: {
    horizontal: 200,
    vertical: 150,
  },
});
```

### 3. Company Logo Watermark

```typescript
// Add image watermark with company logo
await univerAPI.addWatermark(WatermarkType.IMAGE, {
  imageUrl: '/assets/company-logo.png',
  imageWidth: 200,
  imageHeight: 100,
  opacity: 0.15,
  position: {
    x: 100,
    y: 100,
  },
});
```

### 4. Repeating Pattern Watermark

```typescript
// Add repeating text pattern
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'INTERNAL USE ONLY',
  fontSize: 36,
  color: '#0066cc',
  opacity: 0.2,
  rotation: -45,
  repeat: true,
  spacing: {
    horizontal: 300,
    vertical: 200,
  },
});
```

### 5. Custom Position Watermark

```typescript
// Add watermark at specific position
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'SAMPLE',
  fontSize: 72,
  color: '#ff6600',
  opacity: 0.4,
  rotation: 0,
  position: {
    x: 500,
    y: 300,
  },
  repeat: false,
});
```

### 6. Remove Watermark

```typescript
// Remove existing watermark
const removed = await univerAPI.deleteWatermark();

if (removed) {
  console.log('Watermark removed successfully');
}
```

### 7. Update Watermark

```typescript
// Remove old watermark
await univerAPI.deleteWatermark();

// Add new watermark
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'UPDATED',
  fontSize: 50,
  color: '#00cc00',
  opacity: 0.3,
});
```

### 8. Diagonal Text Watermark

```typescript
// Add diagonal watermark across page
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'DO NOT COPY',
  fontSize: 54,
  fontFamily: 'Impact',
  color: '#cc0000',
  opacity: 0.25,
  rotation: -45,
  repeat: true,
  spacing: {
    horizontal: 250,
    vertical: 180,
  },
});
```

### 9. Subtle Logo Watermark

```typescript
// Add subtle centered logo
await univerAPI.addWatermark(WatermarkType.IMAGE, {
  imageUrl: '/assets/watermark-logo.png',
  imageWidth: 300,
  imageHeight: 150,
  opacity: 0.1,
  position: {
    x: 400,
    y: 250,
  },
  repeat: false,
});
```

### 10. Multi-line Text Watermark

```typescript
// Add multi-line watermark
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'PREVIEW ONLY\nNOT FOR DISTRIBUTION',
  fontSize: 40,
  color: '#666666',
  opacity: 0.3,
  rotation: -30,
  repeat: true,
  spacing: {
    horizontal: 350,
    vertical: 250,
  },
});
```


## Custom React Hooks

### useWatermark

Hook untuk mengelola watermark dalam komponen React.

```typescript
import { useState, useCallback } from 'react';
import { univerAPI } from '@univerjs/presets';
import { WatermarkType, IWatermarkSettings } from '@univerjs/sheets-watermark';

interface UseWatermarkReturn {
  hasWatermark: boolean;
  addWatermark: (type: WatermarkType, settings: IWatermarkSettings) => Promise<boolean>;
  removeWatermark: () => Promise<boolean>;
  updateWatermark: (type: WatermarkType, settings: IWatermarkSettings) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useWatermark(): UseWatermarkReturn {
  const [hasWatermark, setHasWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWatermark = useCallback(async (
    type: WatermarkType,
    settings: IWatermarkSettings
  ) => {
    setLoading(true);
    setError(null);

    try {
      const success = await univerAPI.addWatermark(type, settings);
      
      if (success) {
        setHasWatermark(true);
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add watermark';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeWatermark = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await univerAPI.deleteWatermark();
      
      if (success) {
        setHasWatermark(false);
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove watermark';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWatermark = useCallback(async (
    type: WatermarkType,
    settings: IWatermarkSettings
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Remove existing watermark
      await univerAPI.deleteWatermark();
      
      // Add new watermark
      const success = await univerAPI.addWatermark(type, settings);
      
      if (success) {
        setHasWatermark(true);
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update watermark';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hasWatermark,
    addWatermark,
    removeWatermark,
    updateWatermark,
    loading,
    error,
  };
}
```

### Penggunaan Hook

```typescript
import React, { useState } from 'react';
import { useWatermark } from './hooks/useWatermark';
import { WatermarkType } from '@univerjs/sheets-watermark';

export function WatermarkPanel() {
  const {
    hasWatermark,
    addWatermark,
    removeWatermark,
    updateWatermark,
    loading,
    error,
  } = useWatermark();

  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');

  const handleAddTextWatermark = async () => {
    await addWatermark(WatermarkType.TEXT, {
      text: watermarkText,
      fontSize: 48,
      color: '#ff0000',
      opacity: 0.3,
      rotation: -45,
      repeat: true,
    });
  };

  const handleAddLogoWatermark = async () => {
    await addWatermark(WatermarkType.IMAGE, {
      imageUrl: '/assets/logo.png',
      imageWidth: 200,
      imageHeight: 100,
      opacity: 0.15,
    });
  };

  const handleRemove = async () => {
    await removeWatermark();
  };

  return (
    <div className="watermark-panel">
      <h3>Watermark Manager</h3>
      
      {error && <div className="error">{error}</div>}
      
      <div className="controls">
        <input
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="Watermark text"
        />
        
        <button onClick={handleAddTextWatermark} disabled={loading}>
          Add Text Watermark
        </button>
        
        <button onClick={handleAddLogoWatermark} disabled={loading}>
          Add Logo Watermark
        </button>
        
        {hasWatermark && (
          <button onClick={handleRemove} disabled={loading}>
            Remove Watermark
          </button>
        )}
      </div>
      
      {loading && <div>Processing...</div>}
      
      <div className="status">
        Status: {hasWatermark ? 'Watermark Active' : 'No Watermark'}
      </div>
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Use Appropriate Opacity**
```typescript
// Good - Subtle but visible
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'CONFIDENTIAL',
  opacity: 0.2, // 20% opacity
});
```

2. **Choose Readable Font Sizes**
```typescript
// Good - Large enough to read
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'DRAFT',
  fontSize: 48, // Readable size
});
```

3. **Use Contrasting Colors**
```typescript
// Good - Visible against background
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'SAMPLE',
  color: '#666666', // Gray for light backgrounds
  opacity: 0.3,
});
```

4. **Optimize Image Size**
```typescript
// Good - Reasonable image dimensions
await univerAPI.addWatermark(WatermarkType.IMAGE, {
  imageUrl: '/logo.png',
  imageWidth: 200,  // Not too large
  imageHeight: 100,
  opacity: 0.15,
});
```

5. **Use Repeating Pattern untuk Coverage**
```typescript
// Good - Full coverage
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'INTERNAL',
  repeat: true,
  spacing: {
    horizontal: 300,
    vertical: 200,
  },
});
```

### Don'ts ❌

1. **Jangan Gunakan Opacity Terlalu Tinggi**
```typescript
// Bad - Blocks content
opacity: 0.8

// Good - Subtle
opacity: 0.2
```

2. **Jangan Gunakan Font Terlalu Kecil**
```typescript
// Bad - Too small to read
fontSize: 12

// Good - Readable
fontSize: 48
```

3. **Jangan Gunakan Image Terlalu Besar**
```typescript
// Bad - Performance issue
imageWidth: 2000,
imageHeight: 1500

// Good - Optimized
imageWidth: 200,
imageHeight: 100
```

4. **Jangan Lupa Remove Sebelum Update**
```typescript
// Bad - May cause conflicts
await univerAPI.addWatermark(type, newSettings);

// Good - Clean update
await univerAPI.deleteWatermark();
await univerAPI.addWatermark(type, newSettings);
```


## Troubleshooting

### Watermark Tidak Muncul

**Gejala**: Watermark tidak terlihat setelah ditambahkan

**Solusi**:
```typescript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverSheetsWatermarkPlugin);
univerAPI.registerPlugin(UniverSheetsWatermarkUIPlugin);

// 2. Cek opacity tidak terlalu rendah
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'TEST',
  opacity: 0.3, // Minimal 0.2 untuk visibility
});

// 3. Verify settings
console.log('Watermark added');
```

### Image Watermark Tidak Load

**Gejala**: Image watermark tidak muncul

**Solusi**:
```typescript
// 1. Pastikan URL valid dan accessible
const imageUrl = '/assets/logo.png';

// Test image load
const img = new Image();
img.onload = async () => {
  await univerAPI.addWatermark(WatermarkType.IMAGE, {
    imageUrl,
    imageWidth: 200,
    imageHeight: 100,
    opacity: 0.2,
  });
};
img.onerror = () => {
  console.error('Failed to load image:', imageUrl);
};
img.src = imageUrl;

// 2. Check CORS if loading from external URL
// 3. Use base64 encoded image as alternative
```

### Watermark Terlalu Gelap

**Gejala**: Watermark menghalangi konten

**Solusi**:
```typescript
// Reduce opacity
await univerAPI.deleteWatermark();
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'CONFIDENTIAL',
  opacity: 0.15, // Lower opacity
  color: '#cccccc', // Lighter color
});
```

### Performance Issue dengan Repeating Pattern

**Gejala**: Aplikasi lambat dengan watermark repeating

**Solusi**:
```typescript
// 1. Increase spacing
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'DRAFT',
  repeat: true,
  spacing: {
    horizontal: 400, // Larger spacing
    vertical: 300,
  },
});

// 2. Use single watermark instead
await univerAPI.addWatermark(WatermarkType.TEXT, {
  text: 'DRAFT',
  repeat: false,
  position: { x: 300, y: 200 },
});
```

### Watermark Tidak Terhapus

**Gejala**: deleteWatermark() tidak menghapus watermark

**Solusi**:
```typescript
// Ensure proper async handling
const removed = await univerAPI.deleteWatermark();

if (!removed) {
  console.error('Failed to remove watermark');
  // Try again
  await univerAPI.deleteWatermark();
}

// Verify removal
console.log('Watermark removed');
```

## Referensi

### Official Documentation
- [Univer Watermark Guide](https://docs.univer.ai/guides/sheets/features/watermark)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Command system dan events
- [Sheets API](../core/sheets-api.md) - Worksheet management

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs/sheets-watermark, @univerjs/sheets-watermark-ui
