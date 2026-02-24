# Univer Sheet - Print & PDF Export

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

Univer Sheet Print menyediakan kemampuan untuk mencetak worksheet dan export ke PDF dengan konfigurasi yang lengkap.

### Fitur Utama
- **Print Dialog**: Dialog konfigurasi print yang user-friendly
- **Layout Configuration**: Paper size, orientation, margins, scale
- **Render Configuration**: Gridlines, alignment, header/footer
- **PDF Export**: Export worksheet ke PDF
- **Screenshot**: Capture worksheet atau range sebagai image
- **Print Preview**: Preview sebelum print

### Kapan Menggunakan
- Print worksheet untuk dokumentasi
- Export report ke PDF
- Generate screenshot untuk sharing
- Create printable forms
- Archive worksheet data

### Keuntungan
- Konfigurasi print yang lengkap
- Preview sebelum print
- Multiple export formats
- High-quality output
- Customizable layout


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/sheets-print @univerjs/sheets-print-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsPrintPlugin } from '@univerjs/sheets-print';
import { UniverSheetsPrintUIPlugin } from '@univerjs/sheets-print-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-print-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register print plugins
univerAPI.registerPlugin(UniverSheetsPrintPlugin);
univerAPI.registerPlugin(UniverSheetsPrintUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/sheets-print @univerjs/sheets-print-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsPrintPlugin } from '@univerjs/sheets-print';
import { UniverSheetsPrintUIPlugin } from '@univerjs/sheets-print-ui';

const univer = new Univer();

// Register print plugins
univer.registerPlugin(UniverSheetsPrintPlugin);
univer.registerPlugin(UniverSheetsPrintUIPlugin);
```


## API Reference

### Enums

#### PaperSize

```typescript
enum PaperSize {
  A3 = 'A3',
  A4 = 'A4',
  A5 = 'A5',
  LETTER = 'Letter',
  LEGAL = 'Legal',
  TABLOID = 'Tabloid',
}
```

#### PageOrientation

```typescript
enum PageOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}
```

#### ScaleType

```typescript
enum ScaleType {
  FIT_TO_PAGE = 'fitToPage',
  FIT_TO_WIDTH = 'fitToWidth',
  CUSTOM = 'custom',
}
```

### FWorkbook Methods

#### openPrintDialog()
Membuka dialog konfigurasi print.

```typescript
openPrintDialog(): void
```

**Example**:
```typescript
const workbook = univerAPI.getActiveWorkbook();
workbook.openPrintDialog();
```

#### closePrintDialog()
Menutup dialog print.

```typescript
closePrintDialog(): void
```

#### updatePrintConfig()
Update konfigurasi layout print.

```typescript
updatePrintConfig(config: IPrintLayoutConfig): Promise<boolean>
```

**Parameters**:
- `config`: `IPrintLayoutConfig` - Konfigurasi layout

**Returns**: `Promise<boolean>` - True jika berhasil

#### updatePrintRenderConfig()
Update konfigurasi rendering print.

```typescript
updatePrintRenderConfig(config: IPrintRenderConfig): Promise<boolean>
```

**Parameters**:
- `config`: `IPrintRenderConfig` - Konfigurasi rendering

**Returns**: `Promise<boolean>` - True jika berhasil

#### print()
Trigger print action.

```typescript
print(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil

#### saveScreenshotToClipboard()
Save screenshot worksheet ke clipboard.

```typescript
saveScreenshotToClipboard(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil


### FRange Methods

#### getScreenshot()
Get screenshot dari range sebagai image.

```typescript
getScreenshot(options?: IScreenshotOptions): Promise<Blob>
```

**Parameters**:
- `options`: `IScreenshotOptions` (optional) - Screenshot options

**Returns**: `Promise<Blob>` - Image blob

**Example**:
```typescript
const range = worksheet.getRange('A1:E20');
const imageBlob = await range.getScreenshot({
  format: 'png',
  quality: 0.9,
});
```

### Events

#### BeforeSheetPrintOpen
Triggered sebelum print dialog dibuka.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeSheetPrintOpen, (params) => {
  console.log('Before print dialog open:', params);
  // Return false to cancel
  return true;
});
```

#### SheetPrintOpen
Triggered setelah print dialog dibuka.

```typescript
univerAPI.addEvent(univerAPI.Event.SheetPrintOpen, (params) => {
  console.log('Print dialog opened:', params);
});
```

#### BeforeSheetPrintConfirm
Triggered sebelum print dikonfirmasi.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeSheetPrintConfirm, (params) => {
  console.log('Before print confirm:', params);
  // Return false to cancel
  return true;
});
```

#### SheetPrintConfirmed
Triggered setelah print dikonfirmasi.

```typescript
univerAPI.addEvent(univerAPI.Event.SheetPrintConfirmed, (params) => {
  console.log('Print confirmed:', params);
});
```

#### BeforeSheetPrintCanceled
Triggered sebelum print dibatalkan.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeSheetPrintCanceled, (params) => {
  console.log('Before print canceled:', params);
});
```

#### SheetPrintCanceled
Triggered setelah print dibatalkan.

```typescript
univerAPI.addEvent(univerAPI.Event.SheetPrintCanceled, (params) => {
  console.log('Print canceled:', params);
});
```


### Interfaces

#### IPrintLayoutConfig

```typescript
interface IPrintLayoutConfig {
  // Paper settings
  paperSize?: PaperSize;
  orientation?: PageOrientation;
  
  // Margins (in inches)
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  
  // Scale settings
  scaleType?: ScaleType;
  scale?: number; // Percentage (10-400)
  
  // Page settings
  fitToWidth?: number; // Number of pages wide
  fitToHeight?: number; // Number of pages tall
  
  // Header/Footer
  headerText?: string;
  footerText?: string;
  showPageNumbers?: boolean;
}
```

#### IPrintRenderConfig

```typescript
interface IPrintRenderConfig {
  // Grid and lines
  showGridlines?: boolean;
  showRowColumnHeaders?: boolean;
  
  // Content alignment
  horizontalCentered?: boolean;
  verticalCentered?: boolean;
  
  // Print area
  printArea?: string; // Range like "A1:E20"
  
  // Quality
  printQuality?: 'draft' | 'normal' | 'high';
  
  // Colors
  blackAndWhite?: boolean;
}
```

#### IScreenshotOptions

```typescript
interface IScreenshotOptions {
  // Image format
  format?: 'png' | 'jpeg' | 'webp';
  
  // Image quality (0-1)
  quality?: number;
  
  // Scale factor
  scale?: number;
  
  // Background
  backgroundColor?: string;
}
```


## Contoh Penggunaan

### 1. Open Print Dialog

```typescript
import { univerAPI } from '@univerjs/presets';

const workbook = univerAPI.getActiveWorkbook();

// Open print dialog
workbook.openPrintDialog();
```

### 2. Configure Print Layout

```typescript
import { PaperSize, PageOrientation, ScaleType } from '@univerjs/sheets-print';

// Configure A4 portrait with margins
await workbook.updatePrintConfig({
  paperSize: PaperSize.A4,
  orientation: PageOrientation.PORTRAIT,
  marginTop: 0.75,
  marginBottom: 0.75,
  marginLeft: 0.5,
  marginRight: 0.5,
  scaleType: ScaleType.FIT_TO_PAGE,
  showPageNumbers: true,
});
```

### 3. Configure Print Rendering

```typescript
// Configure rendering options
await workbook.updatePrintRenderConfig({
  showGridlines: true,
  showRowColumnHeaders: false,
  horizontalCentered: true,
  verticalCentered: false,
  printQuality: 'high',
  blackAndWhite: false,
});
```

### 4. Print Specific Range

```typescript
// Set print area
await workbook.updatePrintRenderConfig({
  printArea: 'A1:E20',
  showGridlines: false,
  horizontalCentered: true,
  verticalCentered: true,
});

// Print
await workbook.print();
```

### 5. Landscape Print dengan Custom Scale

```typescript
await workbook.updatePrintConfig({
  paperSize: PaperSize.A4,
  orientation: PageOrientation.LANDSCAPE,
  scaleType: ScaleType.CUSTOM,
  scale: 85, // 85% scale
  headerText: 'Sales Report',
  footerText: 'Page {page} of {pages}',
});

await workbook.print();
```

### 6. Fit to Width

```typescript
// Fit content to 1 page wide, any height
await workbook.updatePrintConfig({
  paperSize: PaperSize.A4,
  orientation: PageOrientation.PORTRAIT,
  scaleType: ScaleType.FIT_TO_WIDTH,
  fitToWidth: 1,
});

await workbook.print();
```

### 7. Save Screenshot to Clipboard

```typescript
// Save entire worksheet screenshot
const saved = await workbook.saveScreenshotToClipboard();

if (saved) {
  console.log('Screenshot saved to clipboard');
}
```

### 8. Get Range Screenshot as Blob

```typescript
const worksheet = workbook.getActiveSheet();
const range = worksheet.getRange('A1:E20');

// Get screenshot as PNG
const imageBlob = await range.getScreenshot({
  format: 'png',
  quality: 1.0,
  scale: 2, // 2x resolution
  backgroundColor: '#ffffff',
});

// Download image
const url = URL.createObjectURL(imageBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'worksheet-screenshot.png';
link.click();
URL.revokeObjectURL(url);
```

### 9. Print dengan Header dan Footer

```typescript
await workbook.updatePrintConfig({
  paperSize: PaperSize.LETTER,
  orientation: PageOrientation.PORTRAIT,
  headerText: 'Company Name - {date}',
  footerText: 'Page {page} of {pages}',
  showPageNumbers: true,
  marginTop: 1.0, // Extra margin for header
  marginBottom: 1.0, // Extra margin for footer
});

await workbook.print();
```

### 10. High Quality PDF Export

```typescript
// Configure for high quality
await workbook.updatePrintConfig({
  paperSize: PaperSize.A4,
  orientation: PageOrientation.PORTRAIT,
  scaleType: ScaleType.FIT_TO_PAGE,
});

await workbook.updatePrintRenderConfig({
  printQuality: 'high',
  showGridlines: false,
  horizontalCentered: true,
  verticalCentered: true,
  blackAndWhite: false,
});

// Print (will open browser print dialog for PDF save)
await workbook.print();
```


## Custom React Hooks

### usePrint

Hook untuk mengelola print functionality dalam komponen React.

```typescript
import { useState, useCallback } from 'react';
import { univerAPI } from '@univerjs/presets';
import {
  PaperSize,
  PageOrientation,
  ScaleType,
  IPrintLayoutConfig,
  IPrintRenderConfig,
} from '@univerjs/sheets-print';

interface UsePrintReturn {
  openDialog: () => void;
  closeDialog: () => void;
  configurePrint: (layout: IPrintLayoutConfig, render: IPrintRenderConfig) => Promise<boolean>;
  print: () => Promise<boolean>;
  saveScreenshot: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function usePrint(): UsePrintReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDialog = useCallback(() => {
    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');
      
      workbook.openPrintDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open print dialog';
      setError(message);
    }
  }, []);

  const closeDialog = useCallback(() => {
    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');
      
      workbook.closePrintDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close print dialog';
      setError(message);
    }
  }, []);

  const configurePrint = useCallback(async (
    layout: IPrintLayoutConfig,
    render: IPrintRenderConfig
  ) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const layoutSuccess = await workbook.updatePrintConfig(layout);
      const renderSuccess = await workbook.updatePrintRenderConfig(render);

      return layoutSuccess && renderSuccess;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to configure print';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const print = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const success = await workbook.print();
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to print';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveScreenshot = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const success = await workbook.saveScreenshotToClipboard();
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save screenshot';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    openDialog,
    closeDialog,
    configurePrint,
    print,
    saveScreenshot,
    loading,
    error,
  };
}
```

### Penggunaan Hook

```typescript
import React from 'react';
import { usePrint } from './hooks/usePrint';
import { PaperSize, PageOrientation, ScaleType } from '@univerjs/sheets-print';

export function PrintPanel() {
  const {
    openDialog,
    configurePrint,
    print,
    saveScreenshot,
    loading,
    error,
  } = usePrint();

  const handleQuickPrint = async () => {
    // Configure and print
    await configurePrint(
      {
        paperSize: PaperSize.A4,
        orientation: PageOrientation.PORTRAIT,
        scaleType: ScaleType.FIT_TO_PAGE,
      },
      {
        showGridlines: false,
        horizontalCentered: true,
        verticalCentered: true,
        printQuality: 'high',
      }
    );

    await print();
  };

  const handleSaveScreenshot = async () => {
    const saved = await saveScreenshot();
    if (saved) {
      alert('Screenshot saved to clipboard!');
    }
  };

  return (
    <div className="print-panel">
      <h3>Print Options</h3>
      
      {error && <div className="error">{error}</div>}
      
      <button onClick={openDialog} disabled={loading}>
        Open Print Dialog
      </button>
      
      <button onClick={handleQuickPrint} disabled={loading}>
        Quick Print (A4)
      </button>
      
      <button onClick={handleSaveScreenshot} disabled={loading}>
        Save Screenshot
      </button>
      
      {loading && <div>Processing...</div>}
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Set Appropriate Margins**
```typescript
// Good - Standard margins
await workbook.updatePrintConfig({
  marginTop: 0.75,
  marginBottom: 0.75,
  marginLeft: 0.5,
  marginRight: 0.5,
});
```

2. **Use Fit to Page untuk Consistency**
```typescript
// Good - Ensure content fits
await workbook.updatePrintConfig({
  scaleType: ScaleType.FIT_TO_PAGE,
  fitToWidth: 1,
  fitToHeight: 0, // Any height
});
```

3. **Configure Before Printing**
```typescript
// Good - Configure then print
await workbook.updatePrintConfig(layoutConfig);
await workbook.updatePrintRenderConfig(renderConfig);
await workbook.print();
```

4. **Use High Quality untuk PDF Export**
```typescript
// Good - High quality for PDF
await workbook.updatePrintRenderConfig({
  printQuality: 'high',
  blackAndWhite: false,
});
```

5. **Center Content untuk Better Appearance**
```typescript
// Good - Center for professional look
await workbook.updatePrintRenderConfig({
  horizontalCentered: true,
  verticalCentered: true,
});
```

### Don'ts ❌

1. **Jangan Print Tanpa Preview**
```typescript
// Bad - No preview
await workbook.print();

// Good - Open dialog for preview
workbook.openPrintDialog();
```

2. **Jangan Hardcode Print Area**
```typescript
// Bad - Hardcoded range
printArea: 'A1:Z100'

// Good - Calculate dynamically
const lastRow = worksheet.getLastRow();
const lastCol = worksheet.getLastColumn();
printArea: `A1:${String.fromCharCode(65 + lastCol)}${lastRow}`
```

3. **Jangan Ignore Scale Limits**
```typescript
// Bad - Invalid scale
scale: 500 // Max is 400

// Good - Within limits
scale: Math.min(Math.max(scale, 10), 400)
```

4. **Jangan Print dengan Gridlines untuk Professional Output**
```typescript
// Bad - Gridlines in final print
showGridlines: true

// Good - Clean output
showGridlines: false
```


## Troubleshooting

### Print Dialog Tidak Muncul

**Gejala**: openPrintDialog() tidak menampilkan dialog

**Solusi**:
```typescript
// 1. Pastikan plugin UI terdaftar
univerAPI.registerPlugin(UniverSheetsPrintPlugin);
univerAPI.registerPlugin(UniverSheetsPrintUIPlugin); // Required for UI

// 2. Pastikan ada workbook aktif
const workbook = univerAPI.getActiveWorkbook();
if (workbook) {
  workbook.openPrintDialog();
} else {
  console.error('No active workbook');
}

// 3. Check browser popup blocker
// Print dialog may be blocked by popup blocker
```

### Screenshot Tidak Tersimpan

**Gejala**: saveScreenshotToClipboard() return false

**Solusi**:
```typescript
// 1. Check clipboard permissions
navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
  if (result.state === 'granted') {
    workbook.saveScreenshotToClipboard();
  } else {
    console.error('Clipboard permission denied');
  }
});

// 2. Use alternative method
const worksheet = workbook.getActiveSheet();
const range = worksheet.getRange('A1:Z100');
const blob = await range.getScreenshot();

// Download instead of clipboard
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'screenshot.png';
link.click();
```

### Print Quality Rendah

**Gejala**: Printed output has low quality

**Solusi**:
```typescript
// 1. Set high quality
await workbook.updatePrintRenderConfig({
  printQuality: 'high',
});

// 2. Use higher scale for screenshots
const blob = await range.getScreenshot({
  format: 'png',
  quality: 1.0,
  scale: 2, // 2x resolution
});

// 3. Avoid scaling down
await workbook.updatePrintConfig({
  scaleType: ScaleType.FIT_TO_PAGE,
  // Don't use scale < 100 if possible
});
```

### Content Terpotong Saat Print

**Gejala**: Content cut off in print

**Solusi**:
```typescript
// 1. Use fit to width
await workbook.updatePrintConfig({
  scaleType: ScaleType.FIT_TO_WIDTH,
  fitToWidth: 1,
});

// 2. Adjust margins
await workbook.updatePrintConfig({
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.5,
  marginRight: 0.5,
});

// 3. Set specific print area
const lastRow = worksheet.getLastRow();
const lastCol = worksheet.getLastColumn();
await workbook.updatePrintRenderConfig({
  printArea: `A1:${String.fromCharCode(65 + lastCol)}${lastRow}`,
});
```

### Header/Footer Tidak Muncul

**Gejala**: Header/footer text not showing

**Solusi**:
```typescript
// 1. Ensure sufficient margins
await workbook.updatePrintConfig({
  marginTop: 1.0, // At least 1 inch for header
  marginBottom: 1.0, // At least 1 inch for footer
  headerText: 'My Header',
  footerText: 'Page {page}',
  showPageNumbers: true,
});

// 2. Use supported placeholders
// {page} - current page number
// {pages} - total pages
// {date} - current date
// {time} - current time
```

## Referensi

### Official Documentation
- [Univer Print Guide](https://docs.univer.ai/guides/sheets/features/print)
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
**Plugin**: @univerjs/sheets-print, @univerjs/sheets-print-ui
