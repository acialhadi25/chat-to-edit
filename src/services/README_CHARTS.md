# Chart Service - Implementation Guide

## Overview

Chart Service menyediakan kemampuan untuk membuat dan mengelola berbagai jenis grafik dalam Univer Sheet. Service ini mendukung 7 tipe grafik dengan customization penuh.

**Requirements**: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5  
**Documentation**: [Charts Documentation](../../docs/univer/features/charts.md)

## Features

### Supported Chart Types
- **Line Chart**: Untuk visualisasi tren dan data time-series
- **Column Chart**: Untuk perbandingan data antar kategori (vertikal)
- **Bar Chart**: Untuk perbandingan data antar kategori (horizontal)
- **Pie Chart**: Untuk menampilkan proporsi dan persentase
- **Area Chart**: Untuk menampilkan volume dan tren kumulatif
- **Radar Chart**: Untuk perbandingan multi-variabel
- **Scatter Chart**: Untuk analisis korelasi

### Key Capabilities
- ✅ Create charts with builder pattern
- ✅ Update existing charts
- ✅ Remove charts (single or all)
- ✅ Custom themes and styling
- ✅ Legend configuration
- ✅ Axis customization
- ✅ Dynamic positioning and sizing
- ✅ Data range validation

## Installation

Chart functionality requires the chart plugins to be installed:

```bash
npm install @univerjs/sheets-chart @univerjs/sheets-chart-ui
```

## Usage

### Basic Setup

```typescript
import { ChartService, ChartType } from './services/chartService';
import { useUniver } from './hooks/useUniver';

function MyComponent() {
  const { univerAPI, isReady } = useUniver();
  const chartService = new ChartService(univerAPI, isReady);

  // Use chartService methods...
}
```

### Using the Hook (Recommended)

```typescript
import { useChartManager } from './hooks/useChartManager';
import { ChartType } from './services/chartService';

function ChartPanel() {
  const { univerAPI, isReady } = useUniver();
  const chartService = new ChartService(univerAPI, isReady);
  
  const {
    charts,
    createChart,
    createColumnChart,
    removeChart,
    loading,
    error
  } = useChartManager({ chartService, autoRefresh: true });

  const handleCreateChart = async () => {
    await createColumnChart('A1:B10', 'Sales Data', {
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 }
    });
  };

  return (
    <div>
      <button onClick={handleCreateChart} disabled={loading}>
        Create Chart
      </button>
      {error && <div className="error">{error}</div>}
      <div>Total Charts: {charts.length}</div>
    </div>
  );
}
```

## API Reference

### ChartService Methods

#### createChart(options: ChartOptions): Promise<boolean>

Create a chart with full customization options.

```typescript
const success = await chartService.createChart({
  type: ChartType.COLUMN,
  title: 'Monthly Sales',
  dataRange: 'A1:B13',
  position: { x: 100, y: 100 },
  size: { width: 600, height: 400 },
  legend: {
    show: true,
    position: 'bottom'
  },
  axis: {
    x: { title: 'Month' },
    y: { title: 'Sales ($)', min: 0 }
  }
});
```

#### createLineChart(dataRange, title?, options?): Promise<boolean>

Convenience method for creating line charts.

```typescript
await chartService.createLineChart('A1:B13', 'Trend Analysis');
```

#### createColumnChart(dataRange, title?, options?): Promise<boolean>

Convenience method for creating column charts.

```typescript
await chartService.createColumnChart('A1:B10', 'Sales Data');
```

#### createBarChart(dataRange, title?, options?): Promise<boolean>

Convenience method for creating bar charts.

```typescript
await chartService.createBarChart('A1:B8', 'Department Performance');
```

#### createPieChart(dataRange, title?, options?): Promise<boolean>

Convenience method for creating pie charts.

```typescript
await chartService.createPieChart('A1:B6', 'Market Share');
```

#### updateChart(chartId, options): Promise<boolean>

Update an existing chart.

```typescript
await chartService.updateChart('chart-1', {
  type: ChartType.LINE,
  title: 'Updated Title',
  dataRange: 'A1:B20',
  position: { x: 200, y: 200 }
});
```

#### removeChart(chartId): Promise<boolean>

Remove a specific chart.

```typescript
await chartService.removeChart('chart-1');
```

#### removeAllCharts(): Promise<boolean>

Remove all charts from the worksheet.

```typescript
await chartService.removeAllCharts();
```

#### getCharts(): ChartInfo[]

Get information about all charts in the worksheet.

```typescript
const charts = chartService.getCharts();
console.log(`Total charts: ${charts.length}`);
```

#### registerChartTheme(name, theme): boolean

Register a custom theme for charts.

```typescript
chartService.registerChartTheme('corporate', {
  colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
  backgroundColor: '#ffffff',
  textColor: '#333333',
  gridColor: '#e0e0e0',
  font: {
    family: 'Arial',
    size: 12
  }
});
```

## Examples

### Example 1: Simple Column Chart

```typescript
// Create a basic column chart
await chartService.createColumnChart('A1:B10', 'Sales by Month');
```

### Example 2: Line Chart with Custom Styling

```typescript
await chartService.createChart({
  type: ChartType.LINE,
  title: 'Revenue Trend',
  dataRange: 'A1:C13',
  position: { x: 100, y: 50 },
  size: { width: 800, height: 450 },
  legend: {
    show: true,
    position: 'bottom'
  },
  axis: {
    x: { title: 'Month' },
    y: { title: 'Revenue ($)', min: 0 }
  }
});
```

### Example 3: Pie Chart for Proportions

```typescript
await chartService.createPieChart('A1:B6', 'Market Share', {
  position: { x: 200, y: 150 },
  size: { width: 500, height: 500 },
  legend: {
    show: true,
    position: 'right'
  }
});
```

### Example 4: Using Custom Theme

```typescript
// Register theme
chartService.registerChartTheme('brand', {
  colors: ['#007bff', '#28a745', '#ffc107', '#dc3545'],
  backgroundColor: '#ffffff',
  textColor: '#212529'
});

// Create chart with theme
await chartService.createChart({
  type: ChartType.BAR,
  title: 'Department Performance',
  dataRange: 'A1:B8',
  theme: 'brand',
  position: { x: 150, y: 100 },
  size: { width: 700, height: 400 }
});
```

### Example 5: Managing Multiple Charts

```typescript
// Get all charts
const charts = chartService.getCharts();

// Update first chart
if (charts.length > 0) {
  await chartService.updateChart(charts[0].id, {
    type: ChartType.LINE,
    title: 'Updated Chart',
    dataRange: 'A1:B20',
    position: charts[0].position,
    size: charts[0].size
  });
}

// Remove all charts
await chartService.removeAllCharts();
```

## Chart Options

### ChartOptions Interface

```typescript
interface ChartOptions {
  type: ChartType;                    // Required: Chart type
  dataRange: string;                  // Required: Data range (e.g., 'A1:B10')
  title?: string;                     // Optional: Chart title
  position?: { x: number; y: number }; // Optional: Position in pixels
  size?: { width: number; height: number }; // Optional: Size in pixels
  theme?: string;                     // Optional: Theme name
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  axis?: {
    x?: { title?: string; min?: number; max?: number };
    y?: { title?: string; min?: number; max?: number };
  };
  colors?: string[];                  // Optional: Custom colors
}
```

### ChartType Enum

```typescript
enum ChartType {
  LINE = 'line',
  COLUMN = 'column',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  SCATTER = 'scatter'
}
```

## Validation

The service automatically validates:

1. **Data Range Format**: Must match pattern `A1:B10`
2. **Chart Type**: Must be one of the supported types
3. **Required Fields**: `type` and `dataRange` are required
4. **Univer Availability**: Checks if Univer API is ready

## Error Handling

```typescript
try {
  const success = await chartService.createChart(options);
  if (!success) {
    console.error('Chart creation failed');
  }
} catch (error) {
  console.error('Error creating chart:', error);
}
```

Common errors:
- `Univer is not ready`: Wait for Univer to initialize
- `No active workbook`: Ensure a workbook is open
- `Invalid data range format`: Check range format (e.g., 'A1:B10')
- `Chart functionality not available`: Chart plugins not installed

## Best Practices

### ✅ Do's

1. **Validate Data Before Creating Charts**
```typescript
const range = worksheet.getRange('A1:B10');
const values = range.getValues();
if (values.length > 1) {
  await chartService.createChart(options);
}
```

2. **Use Convenience Methods**
```typescript
// Good - Clear and concise
await chartService.createColumnChart('A1:B10', 'Sales');

// Also good - Full control
await chartService.createChart({
  type: ChartType.COLUMN,
  dataRange: 'A1:B10',
  title: 'Sales'
});
```

3. **Handle Errors Properly**
```typescript
const success = await chartService.createChart(options);
if (!success) {
  // Show user-friendly error message
  showNotification('Failed to create chart');
}
```

4. **Use Custom Themes for Consistency**
```typescript
// Register once
chartService.registerChartTheme('brand', brandTheme);

// Use everywhere
await chartService.createChart({ ...options, theme: 'brand' });
```

5. **Clean Up Charts When Not Needed**
```typescript
// Remove old charts before creating new ones
await chartService.removeAllCharts();
await chartService.createChart(newOptions);
```

### ❌ Don'ts

1. **Don't Hardcode Positions**
```typescript
// Bad
.setPosition(100, 100)

// Good - Calculate based on content
const lastRow = worksheet.getLastRow();
const yPosition = (lastRow + 2) * 20;
```

2. **Don't Create Charts Without Validation**
```typescript
// Bad
await chartService.createChart({ type: ChartType.COLUMN, dataRange: 'A1:B100' });

// Good
if (isValidRange('A1:B100') && hasData('A1:B100')) {
  await chartService.createChart(options);
}
```

3. **Don't Ignore Return Values**
```typescript
// Bad
chartService.createChart(options);

// Good
const success = await chartService.createChart(options);
if (!success) {
  handleError();
}
```

## Testing

The service includes comprehensive tests covering:
- Chart creation (all types)
- Chart updates
- Chart removal
- Theme registration
- Error handling
- Validation
- Fallback mechanisms

Run tests:
```bash
npm test src/services/__tests__/chartService.test.ts
```

## Integration with AI Commands

Charts can be created via natural language commands:

```typescript
// User says: "Create a line chart from A1:B10"
// AI service will:
1. Parse command → { intent: 'create_chart', type: 'line', range: 'A1:B10' }
2. Call chartService.createLineChart('A1:B10')
3. Return success message
```

Supported AI commands:
- "Create [type] chart from [range]"
- "Chart [range] as [type]"
- "Make a [type] chart with data from [range]"

## Performance Considerations

1. **Limit Number of Charts**: Maximum 10-15 charts per worksheet
2. **Batch Operations**: Use delays between multiple chart creations
3. **Clean Up**: Remove unused charts to improve performance
4. **Data Size**: Large datasets (>1000 rows) may slow down rendering

## Troubleshooting

### Chart Not Appearing

**Solution**: Check if chart plugins are registered
```typescript
// Ensure plugins are installed and registered
import { UniverSheetsChartPlugin } from '@univerjs/sheets-chart';
import { UniverSheetsChartUIPlugin } from '@univerjs/sheets-chart-ui';
```

### Invalid Data Range Error

**Solution**: Validate range format
```typescript
const isValid = /^[A-Z]+\d+:[A-Z]+\d+$/.test('A1:B10'); // true
```

### Chart Update Fails

**Solution**: Ensure chart still exists
```typescript
const charts = chartService.getCharts();
const exists = charts.some(c => c.id === chartId);
if (exists) {
  await chartService.updateChart(chartId, options);
}
```

## Related Documentation

- [Charts Feature Documentation](../../docs/univer/features/charts.md)
- [Sheets API Documentation](../../docs/univer/core/sheets-api.md)
- [General API Documentation](../../docs/univer/core/general-api.md)

## Support

For issues or questions:
- Check [Univer Documentation](https://docs.univer.ai)
- Visit [GitHub Issues](https://github.com/dream-num/univer/issues)
- Join [Discord Community](https://discord.gg/univer)

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: ✅ Implemented and Tested
