# Univer Sheet - Charts (Grafik)

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

Univer Sheet Charts menyediakan kemampuan untuk membuat dan mengelola berbagai jenis grafik dalam spreadsheet.

### Fitur Utama
- **7 Tipe Grafik**: Line, Column, Bar, Pie, Area, Radar, Scatter
- **Chart Builder Pattern**: API yang intuitif untuk membuat grafik
- **Theme Customization**: Kustomisasi warna dan style grafik
- **Dynamic Updates**: Update grafik secara real-time
- **Export Support**: Export grafik sebagai gambar

### Kapan Menggunakan
- Visualisasi data numerik
- Perbandingan data antar kategori
- Analisis tren dan pola
- Presentasi data yang lebih menarik
- Dashboard dan reporting

### Keuntungan
- API yang mudah digunakan dengan builder pattern
- Berbagai tipe grafik untuk kebutuhan berbeda
- Kustomisasi penuh terhadap tampilan grafik
- Performa tinggi untuk dataset besar
- Integrasi sempurna dengan Univer Sheet


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/sheets-chart @univerjs/sheets-chart-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsChartPlugin } from '@univerjs/sheets-chart';
import { UniverSheetsChartUIPlugin } from '@univerjs/sheets-chart-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-chart-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register chart plugins
univerAPI.registerPlugin(UniverSheetsChartPlugin);
univerAPI.registerPlugin(UniverSheetsChartUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/sheets-chart @univerjs/sheets-chart-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsChartPlugin } from '@univerjs/sheets-chart';
import { UniverSheetsChartUIPlugin } from '@univerjs/sheets-chart-ui';

const univer = new Univer();

// Register chart plugins
univer.registerPlugin(UniverSheetsChartPlugin);
univer.registerPlugin(UniverSheetsChartUIPlugin);
```


## API Reference

### Chart Types

```typescript
enum ChartType {
  LINE = 'line',
  COLUMN = 'column',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  SCATTER = 'scatter',
}
```

### FWorksheet Methods

#### newChart()
Membuat chart builder baru.

```typescript
newChart(): FChartBuilderBase
```

**Returns**: `FChartBuilderBase` - Chart builder instance

**Example**:
```typescript
const chartBuilder = worksheet.newChart();
```

#### insertChart()
Menyisipkan grafik ke worksheet.

```typescript
insertChart(chartInfo: IChartBuildOptions): Promise<boolean>
```

**Parameters**:
- `chartInfo`: `IChartBuildOptions` - Konfigurasi grafik

**Returns**: `Promise<boolean>` - True jika berhasil

**Example**:
```typescript
const success = await worksheet.insertChart({
  type: ChartType.COLUMN,
  title: 'Sales Data',
  dataRange: 'A1:B10',
  position: { x: 100, y: 100 },
});
```

#### updateChart()
Mengupdate grafik yang sudah ada.

```typescript
updateChart(chartInfo: IChartBuildOptions): Promise<boolean>
```

**Parameters**:
- `chartInfo`: `IChartBuildOptions` - Konfigurasi grafik baru

**Returns**: `Promise<boolean>` - True jika berhasil

#### removeChart()
Menghapus grafik dari worksheet.

```typescript
removeChart(chart: FChart): Promise<boolean>
```

**Parameters**:
- `chart`: `FChart` - Instance grafik yang akan dihapus

**Returns**: `Promise<boolean>` - True jika berhasil

#### getCharts()
Mendapatkan semua grafik di worksheet.

```typescript
getCharts(): FChart[]
```

**Returns**: `FChart[]` - Array dari semua grafik

#### registerChartTheme()
Mendaftarkan theme kustom untuk grafik.

```typescript
registerChartTheme(name: string, theme: IChartTheme): void
```

**Parameters**:
- `name`: `string` - Nama theme
- `theme`: `IChartTheme` - Konfigurasi theme


### FChartBuilderBase Methods

#### setChartType()
Set tipe grafik.

```typescript
setChartType(type: ChartType): FChartBuilderBase
```

#### setTitle()
Set judul grafik.

```typescript
setTitle(title: string): FChartBuilderBase
```

#### setDataRange()
Set range data untuk grafik.

```typescript
setDataRange(range: string): FChartBuilderBase
```

#### setPosition()
Set posisi grafik di worksheet.

```typescript
setPosition(x: number, y: number): FChartBuilderBase
```

#### setSize()
Set ukuran grafik.

```typescript
setSize(width: number, height: number): FChartBuilderBase
```

#### setTheme()
Set theme grafik.

```typescript
setTheme(themeName: string): FChartBuilderBase
```

#### build()
Build dan insert grafik ke worksheet.

```typescript
build(): Promise<FChart>
```

### Interfaces

#### IChartBuildOptions

```typescript
interface IChartBuildOptions {
  type: ChartType;
  title?: string;
  dataRange: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  theme?: string;
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  axis?: {
    x?: { title?: string; min?: number; max?: number };
    y?: { title?: string; min?: number; max?: number };
  };
  series?: IChartSeries[];
}
```

#### IChartSeries

```typescript
interface IChartSeries {
  name: string;
  data: number[];
  color?: string;
  type?: ChartType;
}
```

#### IChartTheme

```typescript
interface IChartTheme {
  colors: string[];
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  font?: {
    family: string;
    size: number;
  };
}
```


## Contoh Penggunaan

### 1. Membuat Column Chart Sederhana

```typescript
import { univerAPI } from '@univerjs/presets';

const workbook = univerAPI.getActiveWorkbook();
const worksheet = workbook.getActiveSheet();

// Membuat column chart
const chart = await worksheet.newChart()
  .setChartType(ChartType.COLUMN)
  .setTitle('Monthly Sales')
  .setDataRange('A1:B13')
  .setPosition(300, 50)
  .setSize(600, 400)
  .build();

console.log('Chart created:', chart.getId());
```

### 2. Membuat Line Chart dengan Multiple Series

```typescript
// Data: Month, Product A, Product B, Product C
// A1:D13

const chart = await worksheet.newChart()
  .setChartType(ChartType.LINE)
  .setTitle('Product Sales Comparison')
  .setDataRange('A1:D13')
  .setPosition(100, 100)
  .setSize(800, 500)
  .build();
```

### 3. Membuat Pie Chart

```typescript
// Data: Category, Value
// A1:B6

const chart = await worksheet.newChart()
  .setChartType(ChartType.PIE)
  .setTitle('Market Share')
  .setDataRange('A1:B6')
  .setPosition(200, 150)
  .setSize(500, 500)
  .build();
```

### 4. Membuat Bar Chart dengan Custom Theme

```typescript
// Register custom theme
worksheet.registerChartTheme('corporate', {
  colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
  backgroundColor: '#ffffff',
  textColor: '#333333',
  gridColor: '#e0e0e0',
  font: {
    family: 'Arial',
    size: 12,
  },
});

// Create bar chart with custom theme
const chart = await worksheet.newChart()
  .setChartType(ChartType.BAR)
  .setTitle('Department Performance')
  .setDataRange('A1:B8')
  .setTheme('corporate')
  .setPosition(150, 100)
  .setSize(700, 400)
  .build();
```

### 5. Membuat Area Chart dengan Legend

```typescript
const chartInfo: IChartBuildOptions = {
  type: ChartType.AREA,
  title: 'Revenue Trend',
  dataRange: 'A1:C13',
  position: { x: 100, y: 50 },
  size: { width: 800, height: 450 },
  legend: {
    show: true,
    position: 'bottom',
  },
};

const success = await worksheet.insertChart(chartInfo);
```


### 6. Membuat Scatter Chart

```typescript
const chart = await worksheet.newChart()
  .setChartType(ChartType.SCATTER)
  .setTitle('Correlation Analysis')
  .setDataRange('A1:B50')
  .setPosition(200, 100)
  .setSize(600, 600)
  .build();
```

### 7. Membuat Radar Chart

```typescript
const chart = await worksheet.newChart()
  .setChartType(ChartType.RADAR)
  .setTitle('Skills Assessment')
  .setDataRange('A1:B7')
  .setPosition(250, 150)
  .setSize(500, 500)
  .build();
```

### 8. Update Chart Data Range

```typescript
const charts = worksheet.getCharts();
const firstChart = charts[0];

if (firstChart) {
  const updated = await worksheet.updateChart({
    type: firstChart.getType(),
    title: firstChart.getTitle(),
    dataRange: 'A1:B20', // New data range
    position: firstChart.getPosition(),
    size: firstChart.getSize(),
  });
  
  console.log('Chart updated:', updated);
}
```

### 9. Remove Chart

```typescript
const charts = worksheet.getCharts();

// Remove first chart
if (charts.length > 0) {
  const removed = await worksheet.removeChart(charts[0]);
  console.log('Chart removed:', removed);
}

// Remove all charts
for (const chart of charts) {
  await worksheet.removeChart(chart);
}
```

### 10. Chart dengan Custom Axis Configuration

```typescript
const chartInfo: IChartBuildOptions = {
  type: ChartType.LINE,
  title: 'Temperature Trend',
  dataRange: 'A1:B25',
  position: { x: 100, y: 100 },
  size: { width: 800, height: 400 },
  axis: {
    x: {
      title: 'Time (hours)',
    },
    y: {
      title: 'Temperature (°C)',
      min: 0,
      max: 100,
    },
  },
  legend: {
    show: true,
    position: 'top',
  },
};

const success = await worksheet.insertChart(chartInfo);
```


## Custom React Hooks

### useChartManager

Hook untuk mengelola grafik dalam komponen React.

```typescript
import { useState, useCallback } from 'react';
import { univerAPI } from '@univerjs/presets';
import { ChartType, IChartBuildOptions } from '@univerjs/sheets-chart';

interface UseChartManagerReturn {
  charts: any[];
  createChart: (options: IChartBuildOptions) => Promise<boolean>;
  updateChart: (chartId: string, options: IChartBuildOptions) => Promise<boolean>;
  removeChart: (chartId: string) => Promise<boolean>;
  refreshCharts: () => void;
  loading: boolean;
  error: string | null;
}

export function useChartManager(): UseChartManagerReturn {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCharts = useCallback(() => {
    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) return;

      const worksheet = workbook.getActiveSheet();
      if (!worksheet) return;

      const allCharts = worksheet.getCharts();
      setCharts(allCharts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh charts');
    }
  }, []);

  const createChart = useCallback(async (options: IChartBuildOptions) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const worksheet = workbook.getActiveSheet();
      if (!worksheet) throw new Error('No active worksheet');

      const success = await worksheet.insertChart(options);
      
      if (success) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshCharts]);

  const updateChart = useCallback(async (
    chartId: string,
    options: IChartBuildOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const worksheet = workbook.getActiveSheet();
      if (!worksheet) throw new Error('No active worksheet');

      const success = await worksheet.updateChart(options);
      
      if (success) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshCharts]);

  const removeChart = useCallback(async (chartId: string) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const worksheet = workbook.getActiveSheet();
      if (!worksheet) throw new Error('No active worksheet');

      const allCharts = worksheet.getCharts();
      const chart = allCharts.find(c => c.getId() === chartId);
      
      if (!chart) throw new Error('Chart not found');

      const success = await worksheet.removeChart(chart);
      
      if (success) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshCharts]);

  return {
    charts,
    createChart,
    updateChart,
    removeChart,
    refreshCharts,
    loading,
    error,
  };
}
```

### Penggunaan Hook

```typescript
import React from 'react';
import { useChartManager } from './hooks/useChartManager';
import { ChartType } from '@univerjs/sheets-chart';

export function ChartPanel() {
  const {
    charts,
    createChart,
    removeChart,
    refreshCharts,
    loading,
    error,
  } = useChartManager();

  const handleCreateColumnChart = async () => {
    await createChart({
      type: ChartType.COLUMN,
      title: 'Sales Data',
      dataRange: 'A1:B10',
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
    });
  };

  const handleRemoveChart = async (chartId: string) => {
    await removeChart(chartId);
  };

  return (
    <div className="chart-panel">
      <h3>Charts ({charts.length})</h3>
      
      {error && <div className="error">{error}</div>}
      
      <button onClick={handleCreateColumnChart} disabled={loading}>
        Create Column Chart
      </button>
      
      <button onClick={refreshCharts} disabled={loading}>
        Refresh
      </button>

      <div className="chart-list">
        {charts.map(chart => (
          <div key={chart.getId()} className="chart-item">
            <span>{chart.getTitle()}</span>
            <button onClick={() => handleRemoveChart(chart.getId())}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Gunakan Builder Pattern untuk Readability**
```typescript
// Good
const chart = await worksheet.newChart()
  .setChartType(ChartType.LINE)
  .setTitle('Sales Trend')
  .setDataRange('A1:B12')
  .setPosition(100, 100)
  .build();
```

2. **Validasi Data Range Sebelum Membuat Chart**
```typescript
const range = worksheet.getRange('A1:B10');
const values = range.getValues();

if (values.length > 1) {
  await worksheet.newChart()
    .setDataRange('A1:B10')
    .build();
}
```

3. **Gunakan Custom Theme untuk Konsistensi**
```typescript
// Register theme once
worksheet.registerChartTheme('brand', {
  colors: ['#007bff', '#28a745', '#ffc107'],
  backgroundColor: '#ffffff',
  textColor: '#212529',
});

// Use in multiple charts
chart1.setTheme('brand');
chart2.setTheme('brand');
```

4. **Handle Errors dengan Proper Try-Catch**
```typescript
try {
  const success = await worksheet.insertChart(chartInfo);
  if (!success) {
    console.error('Failed to create chart');
  }
} catch (error) {
  console.error('Chart creation error:', error);
}
```

5. **Cleanup Charts Saat Tidak Diperlukan**
```typescript
// Remove old charts before creating new ones
const oldCharts = worksheet.getCharts();
for (const chart of oldCharts) {
  await worksheet.removeChart(chart);
}
```

### Don'ts ❌

1. **Jangan Hardcode Posisi Chart**
```typescript
// Bad
.setPosition(100, 100)

// Good - Calculate based on content
const lastRow = worksheet.getLastRow();
const yPosition = (lastRow + 2) * 20;
.setPosition(50, yPosition)
```

2. **Jangan Buat Chart Tanpa Data Validation**
```typescript
// Bad
await worksheet.newChart()
  .setDataRange('A1:B100')
  .build();

// Good
const range = worksheet.getRange('A1:B100');
if (range.getValues().length > 0) {
  await worksheet.newChart()
    .setDataRange('A1:B100')
    .build();
}
```

3. **Jangan Ignore Chart Update Failures**
```typescript
// Bad
worksheet.updateChart(chartInfo);

// Good
const success = await worksheet.updateChart(chartInfo);
if (!success) {
  console.error('Failed to update chart');
  // Handle failure
}
```

4. **Jangan Buat Terlalu Banyak Chart Sekaligus**
```typescript
// Bad - Performance issue
for (let i = 0; i < 50; i++) {
  await worksheet.newChart().build();
}

// Good - Batch with delay
for (let i = 0; i < 50; i++) {
  await worksheet.newChart().build();
  await new Promise(resolve => setTimeout(resolve, 100));
}
```


## Troubleshooting

### Chart Tidak Muncul

**Gejala**: Chart tidak terlihat setelah dibuat

**Solusi**:
```typescript
// 1. Pastikan plugin sudah terdaftar
univerAPI.registerPlugin(UniverSheetsChartPlugin);
univerAPI.registerPlugin(UniverSheetsChartUIPlugin);

// 2. Cek posisi chart
const chart = await worksheet.newChart()
  .setPosition(100, 100) // Pastikan visible
  .setSize(600, 400)     // Pastikan ukuran cukup
  .build();

// 3. Verify chart was created
const charts = worksheet.getCharts();
console.log('Total charts:', charts.length);
```

### Data Range Invalid

**Gejala**: Error saat set data range

**Solusi**:
```typescript
// Validate range format
function isValidRange(range: string): boolean {
  const rangePattern = /^[A-Z]+\d+:[A-Z]+\d+$/;
  return rangePattern.test(range);
}

if (isValidRange('A1:B10')) {
  await worksheet.newChart()
    .setDataRange('A1:B10')
    .build();
}
```

### Chart Theme Tidak Apply

**Gejala**: Custom theme tidak terlihat

**Solusi**:
```typescript
// 1. Register theme sebelum digunakan
worksheet.registerChartTheme('myTheme', {
  colors: ['#ff0000', '#00ff00'],
  backgroundColor: '#ffffff',
  textColor: '#000000',
});

// 2. Gunakan nama theme yang benar
const chart = await worksheet.newChart()
  .setTheme('myTheme') // Harus sama dengan nama saat register
  .build();
```

### Performance Issue dengan Banyak Chart

**Gejala**: Aplikasi lambat saat banyak chart

**Solusi**:
```typescript
// 1. Limit jumlah chart
const MAX_CHARTS = 10;
const charts = worksheet.getCharts();

if (charts.length >= MAX_CHARTS) {
  await worksheet.removeChart(charts[0]); // Remove oldest
}

// 2. Use lazy loading
async function createChartsLazy(chartConfigs: IChartBuildOptions[]) {
  for (const config of chartConfigs) {
    await worksheet.insertChart(config);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Chart Update Tidak Berhasil

**Gejala**: updateChart() return false

**Solusi**:
```typescript
// Pastikan chart masih ada
const charts = worksheet.getCharts();
const chartExists = charts.some(c => c.getId() === targetChartId);

if (chartExists) {
  const success = await worksheet.updateChart({
    type: ChartType.LINE,
    title: 'Updated Title',
    dataRange: 'A1:B20',
    // Include all required fields
  });
  
  if (!success) {
    console.error('Update failed - check chart configuration');
  }
}
```

### Memory Leak dengan Chart

**Gejala**: Memory usage terus meningkat

**Solusi**:
```typescript
// Cleanup charts saat component unmount
useEffect(() => {
  return () => {
    const charts = worksheet.getCharts();
    charts.forEach(chart => {
      worksheet.removeChart(chart);
    });
  };
}, []);
```

## Referensi

### Official Documentation
- [Univer Charts Guide](https://docs.univer.ai/guides/sheets/features/charts)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Command system dan events
- [Sheets API](../core/sheets-api.md) - Worksheet management
- [Images](./images.md) - Floating objects

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs/sheets-chart, @univerjs/sheets-chart-ui
