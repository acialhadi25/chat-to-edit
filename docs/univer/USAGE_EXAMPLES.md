# Univer Sheet Integration - Usage Examples

## Overview

Practical examples demonstrating common use cases and patterns for working with Univer Sheet integration.

## Table of Contents

- [Basic Operations](#basic-operations)
- [AI Integration](#ai-integration)
- [Data Management](#data-management)
- [Formatting](#formatting)
- [Charts](#charts)
- [Advanced Features](#advanced-features)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)

---

## Basic Operations

### Creating a Simple Spreadsheet

```typescript
import { UniverSheet } from '@/components/univer/UniverSheet';

function SimpleSpreadsheet() {
  const initialData = {
    id: 'workbook-1',
    name: 'My Workbook',
    sheets: {
      sheet1: {
        id: 'sheet1',
        name: 'Sheet1',
        cellData: {
          0: {
            0: { v: 'Name' },
            1: { v: 'Age' },
            2: { v: 'City' }
          },
          1: {
            0: { v: 'John' },
            1: { v: 30 },
            2: { v: 'New York' }
          }
        }
      }
    }
  };

  return (
    <UniverSheet
      initialData={initialData}
      height="600px"
      width="100%"
    />
  );
}
```

### Reading and Writing Cells

```typescript
import { useUniver } from '@/hooks/useUniver';
import { useUniverCellOperations } from '@/hooks/useUniverCellOperations';

function CellOperationsExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { univerAPI, isReady } = useUniver(containerRef);
  const { getCellValue, setCellValue } = useUniverCellOperations(univerAPI);

  const handleReadCell = async () => {
    const value = await getCellValue(0, 0);
    console.log('Cell A1 value:', value);
  };

  const handleWriteCell = async () => {
    await setCellValue(0, 0, 'Hello World');
    console.log('Cell A1 updated');
  };

  return (
    <div>
      <button onClick={handleReadCell}>Read A1</button>
      <button onClick={handleWriteCell}>Write A1</button>
      <div ref={containerRef} style={{ height: '600px' }} />
    </div>
  );
}
```

### Working with Ranges

```typescript
function RangeOperationsExample() {
  const { univerAPI } = useUniver(containerRef);
  const { getRangeValues, setRangeValues } = useUniverCellOperations(univerAPI);

  const handleReadRange = async () => {
    const values = await getRangeValues('A1:C3');
    console.log('Range values:', values);
    // Output: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']]
  };

  const handleWriteRange = async () => {
    const data = [
      ['Product', 'Price', 'Quantity'],
      ['Apple', 1.50, 100],
      ['Banana', 0.75, 150],
      ['Orange', 2.00, 80]
    ];
    
    await setRangeValues('A1:C4', data);
    console.log('Range updated');
  };

  return (
    <div>
      <button onClick={handleReadRange}>Read Range</button>
      <button onClick={handleWriteRange}>Write Range</button>
    </div>
  );
}
```

### Using Formulas

```typescript
function FormulaExample() {
  const { univerAPI } = useUniver(containerRef);
  const { setFormula, setCellValue } = useUniverCellOperations(univerAPI);

  const setupSpreadsheet = async () => {
    // Set up data
    await setCellValue(0, 0, 'Item');
    await setCellValue(0, 1, 'Price');
    await setCellValue(0, 2, 'Quantity');
    await setCellValue(0, 3, 'Total');
    
    await setCellValue(1, 0, 'Apple');
    await setCellValue(1, 1, 1.50);
    await setCellValue(1, 2, 100);
    
    await setCellValue(2, 0, 'Banana');
    await setCellValue(2, 1, 0.75);
    await setCellValue(2, 2, 150);
    
    // Add formulas
    await setFormula(1, 3, '=B2*C2'); // Total for Apple
    await setFormula(2, 3, '=B3*C3'); // Total for Banana
    await setFormula(3, 3, '=SUM(D2:D3)'); // Grand total
    
    console.log('Spreadsheet with formulas ready');
  };

  return <button onClick={setupSpreadsheet}>Setup Spreadsheet</button>;
}
```

---

## AI Integration

### Basic AI Chat

```typescript
import { AIChat } from '@/components/ai/AIChat';

function SpreadsheetWithAI() {
  const { univerAPI } = useUniver(containerRef);
  const [chatOpen, setChatOpen] = useState(false);

  const handleCommandExecuted = (command: string, result: any) => {
    console.log('AI executed:', command);
    console.log('Result:', result);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div ref={containerRef} style={{ flex: 1, height: '600px' }} />
      
      {chatOpen && (
        <AIChat
          univerAPI={univerAPI}
          onCommandExecuted={handleCommandExecuted}
        />
      )}
      
      <button onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? 'Close' : 'Open'} AI Chat
      </button>
    </div>
  );
}
```

### AI Command Examples

```typescript
import { aiService } from '@/services/aiService';

function AICommandExamples() {
  const { univerAPI } = useUniver(containerRef);

  const examples = [
    {
      name: 'Calculate Sum',
      command: 'Calculate the sum of column A',
      execute: async () => {
        const response = await aiService.processCommand(
          'Calculate the sum of column A',
          {
            currentWorkbook: 'wb-1',
            currentWorksheet: 'sheet1',
            currentSelection: 'A1:A10'
          }
        );
        console.log('Sum result:', response);
      }
    },
    {
      name: 'Format as Currency',
      command: 'Format column B as currency',
      execute: async () => {
        const response = await aiService.processCommand(
          'Format column B as currency',
          {
            currentWorkbook: 'wb-1',
            currentWorksheet: 'sheet1',
            currentSelection: 'B1:B10'
          }
        );
        console.log('Format result:', response);
      }
    },
    {
      name: 'Create Chart',
      command: 'Create a line chart from columns A and B',
      execute: async () => {
        const response = await aiService.processCommand(
          'Create a line chart from columns A and B',
          {
            currentWorkbook: 'wb-1',
            currentWorksheet: 'sheet1',
            currentSelection: 'A1:B10'
          }
        );
        console.log('Chart created:', response);
      }
    }
  ];

  return (
    <div>
      <h3>AI Command Examples</h3>
      {examples.map((example, index) => (
        <div key={index}>
          <p>{example.command}</p>
          <button onClick={example.execute}>Execute</button>
        </div>
      ))}
    </div>
  );
}
```

### AI Data Analysis

```typescript
function AIDataAnalysis() {
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeData = async () => {
    const result = await aiService.AI_analyzeData('A1:A100');
    setAnalysis(result);
  };

  return (
    <div>
      <button onClick={analyzeData}>Analyze Data</button>
      
      {analysis && (
        <div>
          <h3>Analysis Results</h3>
          <p>Mean: {analysis.mean}</p>
          <p>Median: {analysis.median}</p>
          <p>Mode: {analysis.mode}</p>
          <p>Std Dev: {analysis.stdDev}</p>
          <p>Min: {analysis.min}</p>
          <p>Max: {analysis.max}</p>
          
          {analysis.patterns && (
            <div>
              <h4>Patterns Detected:</h4>
              <ul>
                {analysis.patterns.map((pattern: string, i: number) => (
                  <li key={i}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Data Management

### Auto-Save Implementation

```typescript
import { storageService } from '@/services/storageService';

function AutoSaveSpreadsheet() {
  const { univerAPI } = useUniver(containerRef);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const workbookId = 'wb-123';

  useEffect(() => {
    if (!univerAPI) return;

    // Enable auto-save every 5 seconds
    storageService.enableAutoSave(workbookId, 5000);

    // Listen for save events
    const handleSaving = () => setSaveStatus('saving');
    const handleSaved = () => setSaveStatus('saved');
    const handleError = () => setSaveStatus('error');

    // Cleanup
    return () => {
      storageService.disableAutoSave();
    };
  }, [univerAPI]);

  return (
    <div>
      <SaveStatusIndicator status={saveStatus} />
      <div ref={containerRef} style={{ height: '600px' }} />
    </div>
  );
}
```

### Version History

```typescript
import { VersionHistory } from '@/components/univer/VersionHistory';
import { storageService } from '@/services/storageService';

function VersionedSpreadsheet() {
  const workbookId = 'wb-123';
  const [showHistory, setShowHistory] = useState(false);

  const handleSaveVersion = async () => {
    const versionId = await storageService.saveVersion(
      workbookId,
      'Manual save before major changes'
    );
    console.log('Version saved:', versionId);
  };

  const handleRestore = async (versionId: string) => {
    const data = await storageService.restoreVersion(workbookId, versionId);
    console.log('Version restored:', data);
    setShowHistory(false);
  };

  return (
    <div>
      <button onClick={handleSaveVersion}>Save Version</button>
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? 'Hide' : 'Show'} History
      </button>
      
      {showHistory && (
        <VersionHistory
          workbookId={workbookId}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}
```

### Import/Export

```typescript
import { importExportService } from '@/services/importExportService';

function ImportExportExample() {
  const { univerAPI } = useUniver(containerRef);

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbookData = await importExportService.importFromExcel(file);
      console.log('Imported:', workbookData);
      // Load into Univer
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleExportExcel = async () => {
    const workbook = univerAPI?.getActiveWorkbook();
    const data = await workbook?.save();
    
    if (data) {
      await importExportService.exportToExcel(data, 'export.xlsx');
      console.log('Exported successfully');
    }
  };

  const handleExportCSV = async () => {
    const workbook = univerAPI?.getActiveWorkbook();
    const data = await workbook?.save();
    
    if (data) {
      await importExportService.exportToCSV(data, 'export.csv');
      console.log('Exported to CSV');
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={handleImportExcel} />
      <button onClick={handleExportExcel}>Export to Excel</button>
      <button onClick={handleExportCSV}>Export to CSV</button>
    </div>
  );
}
```

---

## Formatting

### Number Formatting

```typescript
import { formattingService } from '@/services/formattingService';

function NumberFormattingExample() {
  const formatAsCurrency = async () => {
    await formattingService.applyNumberFormat('B2:B10', {
      type: 'currency',
      currency: 'USD',
      decimals: 2
    });
  };

  const formatAsPercentage = async () => {
    await formattingService.applyNumberFormat('C2:C10', {
      type: 'percentage',
      decimals: 1
    });
  };

  const formatAsDate = async () => {
    await formattingService.applyNumberFormat('D2:D10', {
      type: 'date',
      format: 'MM/DD/YYYY'
    });
  };

  return (
    <div>
      <button onClick={formatAsCurrency}>Format as Currency</button>
      <button onClick={formatAsPercentage}>Format as Percentage</button>
      <button onClick={formatAsDate}>Format as Date</button>
    </div>
  );
}
```

### Cell Styling

```typescript
function CellStylingExample() {
  const applyHeaderStyle = async () => {
    await formattingService.applyCellStyle('A1:Z1', {
      backgroundColor: '#4A90E2',
      fontColor: '#FFFFFF',
      bold: true,
      fontSize: 14,
      horizontalAlign: 'center'
    });
  };

  const applyAlternatingRows = async () => {
    // Even rows
    await formattingService.applyCellStyle('A2:Z2', {
      backgroundColor: '#F5F5F5'
    });
    
    // Odd rows
    await formattingService.applyCellStyle('A3:Z3', {
      backgroundColor: '#FFFFFF'
    });
  };

  const applyBorders = async () => {
    await formattingService.applyBorders('A1:E10', {
      top: { style: 'thin', color: '#000000' },
      bottom: { style: 'thin', color: '#000000' },
      left: { style: 'thin', color: '#000000' },
      right: { style: 'thin', color: '#000000' }
    });
  };

  return (
    <div>
      <button onClick={applyHeaderStyle}>Style Header</button>
      <button onClick={applyAlternatingRows}>Alternating Rows</button>
      <button onClick={applyBorders}>Apply Borders</button>
    </div>
  );
}
```

### Conditional Formatting

```typescript
import { conditionalFormattingService } from '@/services/conditionalFormattingService';

function ConditionalFormattingExample() {
  const highlightHighValues = async () => {
    await conditionalFormattingService.addRule('B2:B10', {
      type: 'cellValue',
      operator: 'greaterThan',
      value: 100,
      format: {
        backgroundColor: '#90EE90',
        fontColor: '#006400',
        bold: true
      }
    });
  };

  const highlightLowValues = async () => {
    await conditionalFormattingService.addRule('B2:B10', {
      type: 'cellValue',
      operator: 'lessThan',
      value: 50,
      format: {
        backgroundColor: '#FFB6C1',
        fontColor: '#8B0000'
      }
    });
  };

  const colorScale = async () => {
    await conditionalFormattingService.addRule('C2:C10', {
      type: 'colorScale',
      minColor: '#FF0000',
      midColor: '#FFFF00',
      maxColor: '#00FF00'
    });
  };

  return (
    <div>
      <button onClick={highlightHighValues}>Highlight High Values</button>
      <button onClick={highlightLowValues}>Highlight Low Values</button>
      <button onClick={colorScale}>Apply Color Scale</button>
    </div>
  );
}
```

---

## Charts

### Creating Charts

```typescript
import { useChartManager } from '@/hooks/useChartManager';

function ChartExample() {
  const { univerAPI } = useUniver(containerRef);
  const { createChart, updateChart, deleteChart } = useChartManager(univerAPI);

  const createLineChart = async () => {
    const chartId = await createChart({
      type: 'line',
      dataRange: 'A1:B10',
      title: 'Sales Trend',
      xAxis: { title: 'Month' },
      yAxis: { title: 'Revenue' },
      showLegend: true,
      colors: ['#4A90E2']
    });
    console.log('Chart created:', chartId);
  };

  const createColumnChart = async () => {
    const chartId = await createChart({
      type: 'column',
      dataRange: 'A1:C5',
      title: 'Product Comparison',
      orientation: 'vertical',
      colors: ['#FF6384', '#36A2EB', '#FFCE56']
    });
    console.log('Chart created:', chartId);
  };

  const createPieChart = async () => {
    const chartId = await createChart({
      type: 'pie',
      dataRange: 'A1:B5',
      title: 'Market Share',
      showPercentages: true,
      explodeSlice: 0
    });
    console.log('Chart created:', chartId);
  };

  return (
    <div>
      <button onClick={createLineChart}>Create Line Chart</button>
      <button onClick={createColumnChart}>Create Column Chart</button>
      <button onClick={createPieChart}>Create Pie Chart</button>
    </div>
  );
}
```

---

## Advanced Features

### Sort and Filter

```typescript
import { sortFilterService } from '@/services/sortFilterService';

function SortFilterExample() {
  const sortByColumn = async () => {
    await sortFilterService.sortData('A1:C10', {
      column: 1, // Sort by second column
      order: 'desc',
      hasHeader: true
    });
  };

  const filterData = async () => {
    await sortFilterService.filterData('A1:C10', {
      column: 2,
      operator: 'greaterThan',
      value: 50
    });
  };

  const clearFilter = async () => {
    await sortFilterService.clearFilter('A1:C10');
  };

  return (
    <div>
      <button onClick={sortByColumn}>Sort by Column B</button>
      <button onClick={filterData}>Filter > 50</button>
      <button onClick={clearFilter}>Clear Filter</button>
    </div>
  );
}
```

### Find and Replace

```typescript
import { findReplaceService } from '@/services/findReplaceService';

function FindReplaceExample() {
  const [matches, setMatches] = useState<any[]>([]);

  const findText = async () => {
    const results = await findReplaceService.findInRange(
      'A1:Z100',
      'error',
      { caseSensitive: false }
    );
    setMatches(results);
    console.log(`Found ${results.length} matches`);
  };

  const replaceAll = async () => {
    const count = await findReplaceService.replaceInRange(
      'A1:Z100',
      'old value',
      'new value',
      { replaceAll: true }
    );
    console.log(`Replaced ${count} occurrences`);
  };

  return (
    <div>
      <button onClick={findText}>Find "error"</button>
      <button onClick={replaceAll}>Replace All</button>
      <p>Matches found: {matches.length}</p>
    </div>
  );
}
```

### Data Validation

```typescript
import { dataValidationService } from '@/services/dataValidationService';

function DataValidationExample() {
  const addNumberValidation = async () => {
    await dataValidationService.addValidationRule('B2:B10', {
      type: 'number',
      operator: 'between',
      min: 0,
      max: 100,
      errorMessage: 'Value must be between 0 and 100'
    });
  };

  const addListValidation = async () => {
    await dataValidationService.addValidationRule('C2:C10', {
      type: 'list',
      values: ['Active', 'Inactive', 'Pending'],
      errorMessage: 'Please select a valid status'
    });
  };

  const addDateValidation = async () => {
    await dataValidationService.addValidationRule('D2:D10', {
      type: 'date',
      operator: 'greaterThan',
      value: new Date('2024-01-01'),
      errorMessage: 'Date must be after 2024-01-01'
    });
  };

  return (
    <div>
      <button onClick={addNumberValidation}>Number Validation</button>
      <button onClick={addListValidation}>List Validation</button>
      <button onClick={addDateValidation}>Date Validation</button>
    </div>
  );
}
```

### Collaboration Features

```typescript
import { collaborationService } from '@/services/collaborationService';

function CollaborationExample() {
  const addComment = async () => {
    const commentId = await collaborationService.addComment('A1', {
      text: 'Please review this value',
      author: 'John Doe',
      timestamp: new Date()
    });
    console.log('Comment added:', commentId);
  };

  const trackChange = async () => {
    await collaborationService.trackChange({
      type: 'cell-edit',
      cell: 'A1',
      oldValue: 'old',
      newValue: 'new',
      user: 'user-123',
      timestamp: new Date()
    });
  };

  const getChangeHistory = async () => {
    const history = await collaborationService.getChangeHistory('wb-123');
    console.log('Change history:', history);
  };

  return (
    <div>
      <button onClick={addComment}>Add Comment</button>
      <button onClick={trackChange}>Track Change</button>
      <button onClick={getChangeHistory}>View History</button>
    </div>
  );
}
```

---

## Performance Optimization

### Lazy Loading

```typescript
function LazyLoadedSpreadsheet() {
  const [data, setData] = useState<IWorkbookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data asynchronously
    const loadData = async () => {
      setLoading(true);
      const workbookData = await storageService.loadWorkbook('wb-123');
      setData(workbookData);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading spreadsheet...</div>;
  }

  return <UniverSheet initialData={data} />;
}
```

### Batch Operations

```typescript
function BatchOperationsExample() {
  const { setRangeValues } = useUniverCellOperations(univerAPI);

  const updateMultipleCells = async () => {
    // Instead of multiple setCellValue calls
    // Use single setRangeValues for better performance
    
    const data = Array.from({ length: 100 }, (_, i) => [
      `Item ${i + 1}`,
      Math.random() * 100,
      Math.floor(Math.random() * 50)
    ]);

    await setRangeValues('A1:C100', data);
    console.log('100 rows updated in single operation');
  };

  return <button onClick={updateMultipleCells}>Batch Update</button>;
}
```

### Performance Monitoring

```typescript
import { useUniverPerformance } from '@/hooks/useUniverPerformance';

function PerformanceMonitoredSpreadsheet() {
  const { metrics, startTracking, stopTracking } = useUniverPerformance();

  const performOperation = async () => {
    startTracking('complex-operation');
    
    // Perform complex operation
    await setRangeValues('A1:Z100', generateData());
    
    stopTracking('complex-operation');
    
    console.log('Operation took:', metrics.complexOperationTime, 'ms');
  };

  return (
    <div>
      <button onClick={performOperation}>Perform Operation</button>
      <div>
        <p>Load Time: {metrics.loadTime}ms</p>
        <p>Cell Edit Time: {metrics.cellEditTime}ms</p>
        <p>Formula Calc Time: {metrics.formulaCalcTime}ms</p>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Graceful Error Handling

```typescript
import { handleUniverError, UniverError } from '@/utils/errors';

function ErrorHandlingExample() {
  const { setCellValue } = useUniverCellOperations(univerAPI);

  const safeSetCellValue = async (row: number, col: number, value: any) => {
    try {
      await setCellValue(row, col, value);
      console.log('Cell updated successfully');
    } catch (error) {
      handleUniverError(error);
      // Show user-friendly error message
      alert('Failed to update cell. Please try again.');
    }
  };

  return <button onClick={() => safeSetCellValue(0, 0, 'test')}>Update Cell</button>;
}
```

### Error Recovery

```typescript
import { recoverFromError } from '@/utils/errorRecovery';

function ErrorRecoveryExample() {
  const handleOperation = async () => {
    try {
      await performComplexOperation();
    } catch (error) {
      const recovered = await recoverFromError(error, {
        retry: true,
        maxRetries: 3,
        fallback: () => {
          console.log('Using fallback strategy');
        }
      });

      if (!recovered) {
        console.error('Recovery failed');
      }
    }
  };

  return <button onClick={handleOperation}>Perform Operation</button>;
}
```

---

## Complete Example: Sales Dashboard

```typescript
import { UniverSheet } from '@/components/univer/UniverSheet';
import { AIChat } from '@/components/ai/AIChat';
import { useChartManager } from '@/hooks/useChartManager';
import { formattingService } from '@/services/formattingService';

function SalesDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { univerAPI, isReady } = useUniver(containerRef);
  const { createChart } = useChartManager(univerAPI);
  const { setRangeValues } = useUniverCellOperations(univerAPI);

  useEffect(() => {
    if (!isReady) return;

    const setupDashboard = async () => {
      // Set up headers
      await setRangeValues('A1:E1', [
        ['Month', 'Revenue', 'Expenses', 'Profit', 'Growth %']
      ]);

      // Apply header formatting
      await formattingService.applyCellStyle('A1:E1', {
        backgroundColor: '#4A90E2',
        fontColor: '#FFFFFF',
        bold: true,
        horizontalAlign: 'center'
      });

      // Add sample data
      const data = [
        ['Jan', 50000, 30000, 20000, 0],
        ['Feb', 55000, 32000, 23000, 15],
        ['Mar', 60000, 35000, 25000, 8.7],
        ['Apr', 58000, 33000, 25000, 0],
        ['May', 65000, 36000, 29000, 16],
        ['Jun', 70000, 38000, 32000, 10.3]
      ];
      await setRangeValues('A2:E7', data);

      // Format currency columns
      await formattingService.applyNumberFormat('B2:D7', {
        type: 'currency',
        currency: 'USD',
        decimals: 0
      });

      // Format percentage column
      await formattingService.applyNumberFormat('E2:E7', {
        type: 'percentage',
        decimals: 1
      });

      // Create revenue chart
      await createChart({
        type: 'line',
        dataRange: 'A1:B7',
        title: 'Monthly Revenue',
        xAxis: { title: 'Month' },
        yAxis: { title: 'Revenue ($)' }
      });

      // Add conditional formatting for profit
      await conditionalFormattingService.addRule('D2:D7', {
        type: 'colorScale',
        minColor: '#FF0000',
        maxColor: '#00FF00'
      });
    };

    setupDashboard();
  }, [isReady]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <h1>Sales Dashboard</h1>
        <div ref={containerRef} style={{ height: 'calc(100% - 60px)' }} />
      </div>
      <AIChat univerAPI={univerAPI} />
    </div>
  );
}
```

---

## Support

For more examples and documentation:
- [API Reference](./API_REFERENCE.md)
- [Quick Start Guide](./QUICK_START.md)
- [Integration Guide](./integration/README.md)
- [Univer Documentation](https://univer.ai/docs)

---

**Last Updated:** 2024
**Version:** 1.0.0
