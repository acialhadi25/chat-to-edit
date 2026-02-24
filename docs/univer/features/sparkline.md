# Univer Sheet - Sparkline

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Sparkline adalah mini charts yang ditampilkan dalam cell untuk visualisasi data trend secara compact dan inline.

### Fitur Utama
- **3 Tipe Sparkline**: Line, Column, Win/Loss
- **Inline Visualization**: Charts dalam cell
- **Compose/Uncompose**: Group dan ungroup sparklines
- **Customizable**: Colors, styles, dan options
- **Dynamic Updates**: Auto-update saat data berubah
- **Lightweight**: Minimal performance impact

### Kapan Menggunakan
- Visualisasi trend dalam tabel
- Dashboard dengan space terbatas
- Quick data insights
- Comparison antar rows
- Inline data visualization
- Compact reporting

### Keuntungan
- Space-efficient visualization
- Easy to understand trends
- No separate chart objects
- Automatic updates
- Multiple sparklines per sheet
- Professional appearance


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/sheets-sparkline @univerjs-pro/sheets-sparkline-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsSparklinePlugin } from '@univerjs-pro/sheets-sparkline';
import { UniverSheetsSparklineUIPlugin } from '@univerjs-pro/sheets-sparkline-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs-pro/sheets-sparkline-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register sparkline plugins
univerAPI.registerPlugin(UniverSheetsSparklinePlugin, {
  license: 'your-pro-license',
});
univerAPI.registerPlugin(UniverSheetsSparklineUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/sheets-sparkline @univerjs-pro/sheets-sparkline-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsSparklinePlugin } from '@univerjs-pro/sheets-sparkline';
import { UniverSheetsSparklineUIPlugin } from '@univerjs-pro/sheets-sparkline-ui';

const univer = new Univer();

// Register sparkline plugins
univer.registerPlugin(UniverSheetsSparklinePlugin, {
  license: 'your-pro-license',
});
univer.registerPlugin(UniverSheetsSparklineUIPlugin);
```


## API Reference

### Enums

#### SparklineType

```typescript
enum SparklineType {
  LINE = 'line',
  COLUMN = 'column',
  WIN_LOSS = 'winLoss',
}
```

### FWorksheet Methods

#### addSparkline()
Menambahkan sparkline ke worksheet.

```typescript
addSparkline(
  sourceRanges: string[],
  targetRanges: string[],
  type: SparklineType,
  options?: ISparklineOptions
): Promise<boolean>
```

**Parameters**:
- `sourceRanges`: `string[]` - Array of source data ranges
- `targetRanges`: `string[]` - Array of target cell ranges
- `type`: `SparklineType` - Tipe sparkline
- `options`: `ISparklineOptions` (optional) - Sparkline options

**Returns**: `Promise<boolean>` - True jika berhasil

#### composeSparkline()
Menggabungkan sparklines menjadi group.

```typescript
composeSparkline(ranges: string[]): Promise<boolean>
```

**Parameters**:
- `ranges`: `string[]` - Array of sparkline cell ranges

**Returns**: `Promise<boolean>` - True jika berhasil

#### unComposeSparkline()
Memisahkan sparkline group.

```typescript
unComposeSparkline(ranges: string[]): Promise<boolean>
```

**Parameters**:
- `ranges`: `string[]` - Array of sparkline cell ranges

**Returns**: `Promise<boolean>` - True jika berhasil

#### getSparklineByCell()
Mendapatkan sparkline dari cell.

```typescript
getSparklineByCell(row: number, col: number): ISparkline | null
```

**Parameters**:
- `row`: `number` - Row index
- `col`: `number` - Column index

**Returns**: `ISparkline | null` - Sparkline object atau null

#### getSparklineGroupByCell()
Mendapatkan sparkline group dari cell.

```typescript
getSparklineGroupByCell(row: number, col: number): ISparklineGroup | null
```

**Parameters**:
- `row`: `number` - Row index
- `col`: `number` - Column index

**Returns**: `ISparklineGroup | null` - Sparkline group atau null

### Events

#### SheetSparklineChanged
Triggered saat sparkline berubah.

```typescript
univerAPI.addEvent(
  univerAPI.Event.SheetSparklineChanged,
  (params) => {
    console.log('Sparkline changed:', params);
  }
);
```

### Interfaces

#### ISparklineOptions

```typescript
interface ISparklineOptions {
  // Line color
  lineColor?: string;
  
  // Column colors
  positiveColor?: string;
  negativeColor?: string;
  
  // Win/Loss colors
  winColor?: string;
  lossColor?: string;
  
  // Show markers (line sparkline)
  showMarkers?: boolean;
  
  // Show high/low points
  showHighPoint?: boolean;
  showLowPoint?: boolean;
  
  // Show first/last points
  showFirstPoint?: boolean;
  showLastPoint?: boolean;
  
  // Axis
  showAxis?: boolean;
  axisColor?: string;
}
```


## Contoh Penggunaan

### 1. Line Sparkline Sederhana

```typescript
import { univerAPI } from '@univerjs/presets';
import { SparklineType } from '@univerjs-pro/sheets-sparkline';

const workbook = univerAPI.getActiveWorkbook();
const worksheet = workbook.getActiveSheet();

// Add line sparkline
await worksheet.addSparkline(
  ['A1:A10'], // Source data
  ['B1'],     // Target cell
  SparklineType.LINE
);
```

### 2. Column Sparkline

```typescript
// Add column sparkline
await worksheet.addSparkline(
  ['A1:A10'],
  ['B1'],
  SparklineType.COLUMN,
  {
    positiveColor: '#4CAF50',
    negativeColor: '#F44336',
  }
);
```

### 3. Win/Loss Sparkline

```typescript
// Add win/loss sparkline
await worksheet.addSparkline(
  ['A1:A10'],
  ['B1'],
  SparklineType.WIN_LOSS,
  {
    winColor: '#4CAF50',
    lossColor: '#F44336',
  }
);
```

### 4. Line Sparkline dengan Markers

```typescript
// Line sparkline with markers
await worksheet.addSparkline(
  ['A1:A10'],
  ['B1'],
  SparklineType.LINE,
  {
    lineColor: '#2196F3',
    showMarkers: true,
    showHighPoint: true,
    showLowPoint: true,
    showFirstPoint: true,
    showLastPoint: true,
  }
);
```

### 5. Multiple Sparklines

```typescript
// Add sparklines for multiple rows
await worksheet.addSparkline(
  ['A1:E1', 'A2:E2', 'A3:E3'], // Multiple source ranges
  ['F1', 'F2', 'F3'],          // Multiple target cells
  SparklineType.LINE
);
```

### 6. Compose Sparkline Group

```typescript
// Create sparklines
await worksheet.addSparkline(
  ['A1:E1', 'A2:E2'],
  ['F1', 'F2'],
  SparklineType.LINE
);

// Compose into group
await worksheet.composeSparkline(['F1', 'F2']);
```

### 7. Uncompose Sparkline Group

```typescript
// Uncompose sparkline group
await worksheet.unComposeSparkline(['F1', 'F2']);
```

### 8. Get Sparkline Information

```typescript
// Get sparkline from cell
const sparkline = worksheet.getSparklineByCell(0, 5); // F1

if (sparkline) {
  console.log('Sparkline type:', sparkline.type);
  console.log('Source range:', sparkline.sourceRange);
}
```

### 9. Get Sparkline Group

```typescript
// Get sparkline group
const group = worksheet.getSparklineGroupByCell(0, 5);

if (group) {
  console.log('Group members:', group.members.length);
}
```

### 10. Custom Styled Sparkline

```typescript
// Fully customized sparkline
await worksheet.addSparkline(
  ['A1:A12'],
  ['B1'],
  SparklineType.LINE,
  {
    lineColor: '#FF5722',
    showMarkers: true,
    showHighPoint: true,
    showLowPoint: true,
    showFirstPoint: true,
    showLastPoint: true,
    showAxis: true,
    axisColor: '#9E9E9E',
  }
);
```


## Best Practices

### Do's ✅

1. **Choose Appropriate Type**
```typescript
// Good - Line for trends
SparklineType.LINE

// Good - Column for comparisons
SparklineType.COLUMN

// Good - Win/Loss for binary data
SparklineType.WIN_LOSS
```

2. **Use Contrasting Colors**
```typescript
// Good - Clear distinction
{
  positiveColor: '#4CAF50', // Green
  negativeColor: '#F44336', // Red
}
```

3. **Group Related Sparklines**
```typescript
// Good - Group for consistency
await worksheet.composeSparkline(['F1', 'F2', 'F3']);
```

4. **Validate Source Data**
```typescript
// Good - Check data exists
const range = worksheet.getRange('A1:A10');
const values = range.getValues();

if (values.length > 0) {
  await worksheet.addSparkline(['A1:A10'], ['B1'], SparklineType.LINE);
}
```

### Don'ts ❌

1. **Jangan Gunakan Terlalu Banyak Markers**
```typescript
// Bad - Too cluttered
showMarkers: true,
showHighPoint: true,
showLowPoint: true,
showFirstPoint: true,
showLastPoint: true

// Good - Selective markers
showHighPoint: true,
showLowPoint: true
```

2. **Jangan Ignore Data Range Size**
```typescript
// Bad - Too few data points
['A1:A2'] // Only 2 points

// Good - Sufficient data
['A1:A10'] // 10 points
```

3. **Jangan Overlap Sparklines**
```typescript
// Bad - Same target cell
await worksheet.addSparkline(['A1:A10'], ['B1'], SparklineType.LINE);
await worksheet.addSparkline(['C1:C10'], ['B1'], SparklineType.COLUMN);

// Good - Different target cells
await worksheet.addSparkline(['A1:A10'], ['B1'], SparklineType.LINE);
await worksheet.addSparkline(['C1:C10'], ['D1'], SparklineType.COLUMN);
```

## Troubleshooting

### Sparkline Tidak Muncul

**Gejala**: Sparkline tidak terlihat

**Solusi**:
```typescript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverSheetsSparklinePlugin, {
  license: 'your-pro-license',
});
univerAPI.registerPlugin(UniverSheetsSparklineUIPlugin);

// 2. Verify source data
const range = worksheet.getRange('A1:A10');
console.log('Data:', range.getValues());

// 3. Check target cell is empty
const target = worksheet.getRange('B1');
console.log('Target value:', target.getValue());
```

### License Error

**Gejala**: "License required" error

**Solusi**:
```typescript
// Sparkline adalah Pro feature
univerAPI.registerPlugin(UniverSheetsSparklinePlugin, {
  license: process.env.UNIVER_PRO_LICENSE,
});
```

### Sparkline Tidak Update

**Gejala**: Sparkline tidak update saat data berubah

**Solusi**:
```typescript
// Sparklines should auto-update
// If not, try recreating:

// 1. Get existing sparkline
const sparkline = worksheet.getSparklineByCell(0, 1);

// 2. Remove and recreate
// (No direct remove API, overwrite cell)
worksheet.getRange('B1').setValue('');

// 3. Add new sparkline
await worksheet.addSparkline(['A1:A10'], ['B1'], SparklineType.LINE);
```

## Referensi

### Official Documentation
- [Univer Sparkline Guide](https://docs.univer.ai/guides/sheets/features/sparkline)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [Charts](./charts.md) - Full-size charts
- [Sheets API](../core/sheets-api.md) - Worksheet operations

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/sheets-sparkline, @univerjs-pro/sheets-sparkline-ui
**License**: Pro Feature (License Required)
