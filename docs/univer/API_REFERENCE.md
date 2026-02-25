# Univer Sheet Integration - API Reference

## Overview

Complete API reference for the Univer Sheet integration in the chat-to-edit application. This document covers all hooks, services, components, and utilities available for working with Univer spreadsheets.

## Table of Contents

- [Hooks](#hooks)
  - [useUniver](#useuniver)
  - [useUniverCellOperations](#useunivercelloperations)
  - [useUniverEvents](#useuniverEvents)
  - [useUniverPerformance](#useuniverperformance)
  - [useChartManager](#usechartmanager)
  - [useAutoVersioning](#useautoversioning)
- [Services](#services)
  - [AI Service](#ai-service)
  - [MCP Service](#mcp-service)
  - [Storage Service](#storage-service)
  - [Formatting Service](#formatting-service)
  - [Chart Service](#chart-service)
  - [Sort & Filter Service](#sort--filter-service)
  - [Find & Replace Service](#find--replace-service)
  - [Data Validation Service](#data-validation-service)
  - [Conditional Formatting Service](#conditional-formatting-service)
  - [Collaboration Service](#collaboration-service)
  - [Import/Export Service](#importexport-service)
  - [Performance Service](#performance-service)
- [Components](#components)
  - [UniverSheet](#universheet)
  - [AIChat](#aichat)
  - [AICommandPanel](#aicommandpanel)
  - [SaveStatusIndicator](#savestatusindicator)
  - [VersionHistory](#versionhistory)
- [Types](#types)
- [Utilities](#utilities)

---

## Hooks

### useUniver

Main hook for accessing Univer instance and API.

**Import:**
```typescript
import { useUniver } from '@/hooks/useUniver';
```

**Usage:**
```typescript
const { univerAPI, univer, isReady } = useUniver(containerRef);
```

**Parameters:**
- `containerRef: RefObject<HTMLDivElement>` - Container element reference

**Returns:**
```typescript
{
  univerAPI: FUniver | null;        // Facade API instance
  univer: Univer | null;            // Core Univer instance
  isReady: boolean;                 // Initialization status
}
```

**Example:**
```typescript
function MySpreadsheet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { univerAPI, isReady } = useUniver(containerRef);

  useEffect(() => {
    if (isReady && univerAPI) {
      const workbook = univerAPI.getActiveWorkbook();
      console.log('Workbook ready:', workbook);
    }
  }, [isReady, univerAPI]);

  return <div ref={containerRef} style={{ height: '600px' }} />;
}
```

---

### useUniverCellOperations

Hook for cell-level operations (read, write, formulas).

**Import:**
```typescript
import { useUniverCellOperations } from '@/hooks/useUniverCellOperations';
```

**Usage:**
```typescript
const {
  getCellValue,
  setCellValue,
  getRangeValues,
  setRangeValues,
  setFormula,
  getFormula
} = useUniverCellOperations(univerAPI);
```

**Methods:**

#### getCellValue
```typescript
getCellValue(row: number, col: number): Promise<any>
```
Get value from a specific cell.

**Example:**
```typescript
const value = await getCellValue(0, 0); // Get A1
console.log('Cell A1:', value);
```

#### setCellValue
```typescript
setCellValue(row: number, col: number, value: any): Promise<void>
```
Set value in a specific cell.

**Example:**
```typescript
await setCellValue(0, 0, 'Hello World'); // Set A1
await setCellValue(1, 0, 42); // Set A2 to number
```

#### getRangeValues
```typescript
getRangeValues(range: string): Promise<any[][]>
```
Get values from a range of cells.

**Example:**
```typescript
const values = await getRangeValues('A1:C3');
// Returns: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']]
```

#### setRangeValues
```typescript
setRangeValues(range: string, values: any[][]): Promise<void>
```
Set values for a range of cells.

**Example:**
```typescript
await setRangeValues('A1:B2', [
  ['Name', 'Age'],
  ['John', 30]
]);
```

#### setFormula
```typescript
setFormula(row: number, col: number, formula: string): Promise<void>
```
Set formula in a cell.

**Example:**
```typescript
await setFormula(2, 0, '=SUM(A1:A2)'); // Set A3 to sum formula
```

#### getFormula
```typescript
getFormula(row: number, col: number): Promise<string | null>
```
Get formula from a cell.

**Example:**
```typescript
const formula = await getFormula(2, 0);
console.log('Formula:', formula); // "=SUM(A1:A2)"
```

---

### useUniverEvents

Hook for handling Univer events (selection changes, data changes).

**Import:**
```typescript
import { useUniverEvents } from '@/hooks/useUniverEvents';
```

**Usage:**
```typescript
useUniverEvents(univerAPI, {
  onSelectionChange: (selection) => console.log('Selection:', selection),
  onDataChange: (data) => console.log('Data changed:', data),
  onCommandExecuted: (command) => console.log('Command:', command)
});
```

**Options:**
```typescript
{
  onSelectionChange?: (selection: IRange) => void;
  onDataChange?: (data: IWorkbookData) => void;
  onCommandExecuted?: (command: ICommandInfo) => void;
}
```

**Example:**
```typescript
function SpreadsheetWithEvents() {
  const { univerAPI } = useUniver(containerRef);
  const [selection, setSelection] = useState<string>('');

  useUniverEvents(univerAPI, {
    onSelectionChange: (sel) => {
      setSelection(`${sel.startRow}:${sel.startColumn}`);
    }
  });

  return <div>Current selection: {selection}</div>;
}
```

---

### useUniverPerformance

Hook for monitoring performance metrics.

**Import:**
```typescript
import { useUniverPerformance } from '@/hooks/useUniverPerformance';
```

**Usage:**
```typescript
const { metrics, startTracking, stopTracking } = useUniverPerformance();
```

**Returns:**
```typescript
{
  metrics: PerformanceMetrics;
  startTracking: (operation: string) => void;
  stopTracking: (operation: string) => void;
}
```

**Example:**
```typescript
function PerformanceMonitor() {
  const { metrics, startTracking, stopTracking } = useUniverPerformance();

  const handleOperation = async () => {
    startTracking('cell-edit');
    await setCellValue(0, 0, 'New Value');
    stopTracking('cell-edit');
  };

  return (
    <div>
      <p>Load Time: {metrics.loadTime}ms</p>
      <p>Cell Edit: {metrics.cellEditTime}ms</p>
    </div>
  );
}
```

---

### useChartManager

Hook for creating and managing charts.

**Import:**
```typescript
import { useChartManager } from '@/hooks/useChartManager';
```

**Usage:**
```typescript
const { createChart, updateChart, deleteChart, charts } = useChartManager(univerAPI);
```

**Methods:**

#### createChart
```typescript
createChart(config: ChartConfig): Promise<string>
```
Create a new chart.

**Example:**
```typescript
const chartId = await createChart({
  type: 'line',
  dataRange: 'A1:B10',
  title: 'Sales Trend',
  xAxis: { title: 'Month' },
  yAxis: { title: 'Revenue' }
});
```

#### updateChart
```typescript
updateChart(chartId: string, config: Partial<ChartConfig>): Promise<void>
```
Update existing chart.

**Example:**
```typescript
await updateChart(chartId, {
  title: 'Updated Sales Trend',
  colors: ['#FF6384', '#36A2EB']
});
```

---

### useAutoVersioning

Hook for automatic version history tracking.

**Import:**
```typescript
import { useAutoVersioning } from '@/hooks/useAutoVersioning';
```

**Usage:**
```typescript
const { enabled, setEnabled, lastVersion } = useAutoVersioning(
  workbookId,
  univerAPI,
  { threshold: 10 }
);
```

**Options:**
```typescript
{
  threshold?: number;        // Number of changes before auto-save
  interval?: number;         // Time interval in ms
}
```

**Example:**
```typescript
function VersionedSpreadsheet() {
  const { enabled, setEnabled, lastVersion } = useAutoVersioning(
    'workbook-123',
    univerAPI
  );

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable Auto-Versioning
      </label>
      {lastVersion && <p>Last saved: {lastVersion.createdAt}</p>}
    </div>
  );
}
```

---

## Services

### AI Service

Service for AI-powered spreadsheet operations.

**Import:**
```typescript
import { aiService } from '@/services/aiService';
```

**Methods:**

#### processCommand
```typescript
processCommand(command: string, context: AIContext): Promise<AIResponse>
```
Process natural language command.

**Example:**
```typescript
const response = await aiService.processCommand(
  'Calculate sum of column A',
  {
    currentWorkbook: 'wb-123',
    currentWorksheet: 'sheet1',
    currentSelection: 'A1:A10'
  }
);

if (response.success) {
  console.log('Result:', response.message);
}
```

#### AI_readCell
```typescript
AI_readCell(cell: string): Promise<any>
```
Read cell value for AI.

**Example:**
```typescript
const value = await aiService.AI_readCell('A1');
```

#### AI_writeCell
```typescript
AI_writeCell(cell: string, value: any): Promise<void>
```
Write cell value from AI.

**Example:**
```typescript
await aiService.AI_writeCell('B1', 'AI Generated');
```

#### AI_analyzeData
```typescript
AI_analyzeData(range: string): Promise<DataAnalysis>
```
Analyze data range.

**Example:**
```typescript
const analysis = await aiService.AI_analyzeData('A1:A100');
console.log('Mean:', analysis.mean);
console.log('Median:', analysis.median);
console.log('Patterns:', analysis.patterns);
```

---

### MCP Service

Service for Model Context Protocol integration.

**Import:**
```typescript
import { mcpService } from '@/services/mcpService';
```

**Methods:**

#### connect
```typescript
connect(config: MCPConfig): Promise<void>
```
Connect to MCP server.

**Example:**
```typescript
await mcpService.connect({
  sessionId: 'session-123',
  ticketServerUrl: 'https://ticket.example.com',
  mcpServerUrl: 'https://mcp.example.com',
  apiKey: 'your-api-key'
});
```

#### executeTool
```typescript
executeTool(toolName: string, params: any): Promise<any>
```
Execute MCP tool.

**Example:**
```typescript
const result = await mcpService.executeTool('sheets_read_cell', {
  cell: 'A1'
});
```

---

### Storage Service

Service for data persistence with Supabase.

**Import:**
```typescript
import { storageService } from '@/services/storageService';
```

**Methods:**

#### saveWorkbook
```typescript
saveWorkbook(workbookId: string, data: IWorkbookData): Promise<void>
```
Save workbook to database.

**Example:**
```typescript
await storageService.saveWorkbook('wb-123', workbookData);
```

#### loadWorkbook
```typescript
loadWorkbook(workbookId: string): Promise<IWorkbookData>
```
Load workbook from database.

**Example:**
```typescript
const data = await storageService.loadWorkbook('wb-123');
```

#### enableAutoSave
```typescript
enableAutoSave(workbookId: string, interval: number): void
```
Enable auto-save with interval.

**Example:**
```typescript
storageService.enableAutoSave('wb-123', 5000); // Auto-save every 5 seconds
```

#### saveVersion
```typescript
saveVersion(workbookId: string, description: string): Promise<string>
```
Save version snapshot.

**Example:**
```typescript
const versionId = await storageService.saveVersion(
  'wb-123',
  'Before major changes'
);
```

#### getVersionHistory
```typescript
getVersionHistory(workbookId: string): Promise<Version[]>
```
Get version history.

**Example:**
```typescript
const versions = await storageService.getVersionHistory('wb-123');
versions.forEach(v => {
  console.log(`${v.createdAt}: ${v.description}`);
});
```

---

### Formatting Service

Service for cell formatting operations.

**Import:**
```typescript
import { formattingService } from '@/services/formattingService';
```

**Methods:**

#### applyNumberFormat
```typescript
applyNumberFormat(range: string, format: NumberFormat): Promise<void>
```
Apply number formatting.

**Example:**
```typescript
await formattingService.applyNumberFormat('B1:B10', {
  type: 'currency',
  currency: 'USD',
  decimals: 2
});
```

#### applyCellStyle
```typescript
applyCellStyle(range: string, style: CellStyle): Promise<void>
```
Apply cell styling.

**Example:**
```typescript
await formattingService.applyCellStyle('A1:A10', {
  backgroundColor: '#FF6384',
  fontColor: '#FFFFFF',
  bold: true,
  fontSize: 14
});
```

#### applyBorders
```typescript
applyBorders(range: string, borders: BorderConfig): Promise<void>
```
Apply borders.

**Example:**
```typescript
await formattingService.applyBorders('A1:C10', {
  top: { style: 'thin', color: '#000000' },
  bottom: { style: 'thick', color: '#000000' },
  left: { style: 'thin', color: '#000000' },
  right: { style: 'thin', color: '#000000' }
});
```

---

### Chart Service

Service for chart operations.

**Import:**
```typescript
import { chartService } from '@/services/chartService';
```

**Methods:**

#### createLineChart
```typescript
createLineChart(config: LineChartConfig): Promise<string>
```
Create line chart.

**Example:**
```typescript
const chartId = await chartService.createLineChart({
  dataRange: 'A1:B10',
  title: 'Sales Over Time',
  xAxisTitle: 'Month',
  yAxisTitle: 'Revenue',
  showLegend: true
});
```

#### createColumnChart
```typescript
createColumnChart(config: ColumnChartConfig): Promise<string>
```
Create column/bar chart.

**Example:**
```typescript
const chartId = await chartService.createColumnChart({
  dataRange: 'A1:B5',
  title: 'Product Comparison',
  orientation: 'vertical',
  colors: ['#FF6384', '#36A2EB', '#FFCE56']
});
```

#### createPieChart
```typescript
createPieChart(config: PieChartConfig): Promise<string>
```
Create pie chart.

**Example:**
```typescript
const chartId = await chartService.createPieChart({
  dataRange: 'A1:B5',
  title: 'Market Share',
  showPercentages: true,
  explodeSlice: 0 // Explode first slice
});
```

---

### Sort & Filter Service

Service for data sorting and filtering.

**Import:**
```typescript
import { sortFilterService } from '@/services/sortFilterService';
```

**Methods:**

#### sortData
```typescript
sortData(range: string, options: SortOptions): Promise<void>
```
Sort data range.

**Example:**
```typescript
await sortFilterService.sortData('A1:C10', {
  column: 0, // Sort by first column
  order: 'asc',
  hasHeader: true
});
```

#### filterData
```typescript
filterData(range: string, criteria: FilterCriteria): Promise<void>
```
Filter data range.

**Example:**
```typescript
await sortFilterService.filterData('A1:C10', {
  column: 1,
  operator: 'greaterThan',
  value: 100
});
```

---

### Find & Replace Service

Service for find and replace operations.

**Import:**
```typescript
import { findReplaceService } from '@/services/findReplaceService';
```

**Methods:**

#### findInRange
```typescript
findInRange(range: string, searchText: string, options?: FindOptions): Promise<CellLocation[]>
```
Find text in range.

**Example:**
```typescript
const matches = await findReplaceService.findInRange('A1:Z100', 'error', {
  caseSensitive: false,
  matchWholeCell: false
});

console.log(`Found ${matches.length} matches`);
```

#### replaceInRange
```typescript
replaceInRange(range: string, searchText: string, replaceText: string, options?: ReplaceOptions): Promise<number>
```
Replace text in range.

**Example:**
```typescript
const count = await findReplaceService.replaceInRange(
  'A1:Z100',
  'old value',
  'new value',
  { replaceAll: true }
);

console.log(`Replaced ${count} occurrences`);
```

---

### Data Validation Service

Service for data validation rules.

**Import:**
```typescript
import { dataValidationService } from '@/services/dataValidationService';
```

**Methods:**

#### addValidationRule
```typescript
addValidationRule(range: string, rule: ValidationRule): Promise<void>
```
Add validation rule.

**Example:**
```typescript
await dataValidationService.addValidationRule('B1:B10', {
  type: 'number',
  operator: 'between',
  min: 0,
  max: 100,
  errorMessage: 'Value must be between 0 and 100'
});
```

---

### Conditional Formatting Service

Service for conditional formatting.

**Import:**
```typescript
import { conditionalFormattingService } from '@/services/conditionalFormattingService';
```

**Methods:**

#### addRule
```typescript
addRule(range: string, rule: ConditionalFormattingRule): Promise<string>
```
Add conditional formatting rule.

**Example:**
```typescript
const ruleId = await conditionalFormattingService.addRule('A1:A10', {
  type: 'cellValue',
  operator: 'greaterThan',
  value: 50,
  format: {
    backgroundColor: '#90EE90',
    fontColor: '#006400'
  }
});
```

---

### Collaboration Service

Service for collaboration features.

**Import:**
```typescript
import { collaborationService } from '@/services/collaborationService';
```

**Methods:**

#### addComment
```typescript
addComment(cell: string, comment: CommentData): Promise<string>
```
Add comment to cell.

**Example:**
```typescript
const commentId = await collaborationService.addComment('A1', {
  text: 'Please review this value',
  author: 'John Doe',
  timestamp: new Date()
});
```

#### trackChange
```typescript
trackChange(change: ChangeRecord): Promise<void>
```
Track change for history.

**Example:**
```typescript
await collaborationService.trackChange({
  type: 'cell-edit',
  cell: 'A1',
  oldValue: 'old',
  newValue: 'new',
  user: 'user-123',
  timestamp: new Date()
});
```

---

### Import/Export Service

Service for importing and exporting data.

**Import:**
```typescript
import { importExportService } from '@/services/importExportService';
```

**Methods:**

#### importFromExcel
```typescript
importFromExcel(file: File): Promise<IWorkbookData>
```
Import from Excel file.

**Example:**
```typescript
const workbookData = await importExportService.importFromExcel(excelFile);
```

#### exportToExcel
```typescript
exportToExcel(data: IWorkbookData, filename: string): Promise<void>
```
Export to Excel file.

**Example:**
```typescript
await importExportService.exportToExcel(workbookData, 'report.xlsx');
```

#### importFromCSV
```typescript
importFromCSV(file: File): Promise<IWorkbookData>
```
Import from CSV file.

**Example:**
```typescript
const workbookData = await importExportService.importFromCSV(csvFile);
```

#### exportToCSV
```typescript
exportToCSV(data: IWorkbookData, filename: string): Promise<void>
```
Export to CSV file.

**Example:**
```typescript
await importExportService.exportToCSV(workbookData, 'data.csv');
```

---

### Performance Service

Service for performance monitoring.

**Import:**
```typescript
import { performanceService } from '@/services/performanceService';
```

**Methods:**

#### startMeasure
```typescript
startMeasure(operation: string): void
```
Start measuring operation.

**Example:**
```typescript
performanceService.startMeasure('load-workbook');
// ... perform operation
performanceService.endMeasure('load-workbook');
```

#### getMetrics
```typescript
getMetrics(): PerformanceMetrics
```
Get performance metrics.

**Example:**
```typescript
const metrics = performanceService.getMetrics();
console.log('Average load time:', metrics.averageLoadTime);
```

---

## Components

### UniverSheet

Main spreadsheet component.

**Import:**
```typescript
import { UniverSheet } from '@/components/univer/UniverSheet';
```

**Props:**
```typescript
interface UniverSheetProps {
  initialData?: IWorkbookData;
  onChange?: (data: IWorkbookData) => void;
  onSelectionChange?: (selection: IRange) => void;
  height?: string | number;
  width?: string | number;
  enableAI?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  readOnly?: boolean;
}
```

**Example:**
```typescript
<UniverSheet
  initialData={workbookData}
  onChange={(data) => console.log('Data changed:', data)}
  height="600px"
  enableAI={true}
  autoSave={true}
  autoSaveInterval={5000}
/>
```

---

### AIChat

AI chat interface component.

**Import:**
```typescript
import { AIChat } from '@/components/ai/AIChat';
```

**Props:**
```typescript
interface AIChatProps {
  univerAPI: FUniver;
  onCommandExecuted?: (command: string, result: any) => void;
}
```

**Example:**
```typescript
<AIChat
  univerAPI={univerAPI}
  onCommandExecuted={(cmd, result) => {
    console.log('Executed:', cmd, result);
  }}
/>
```

---

### AICommandPanel

AI command suggestions panel.

**Import:**
```typescript
import { AICommandPanel } from '@/components/ai/AICommandPanel';
```

**Props:**
```typescript
interface AICommandPanelProps {
  context: AIContext;
  onCommandSelect?: (command: string) => void;
}
```

**Example:**
```typescript
<AICommandPanel
  context={{
    currentSelection: 'A1:A10',
    recentOperations: []
  }}
  onCommandSelect={(cmd) => console.log('Selected:', cmd)}
/>
```

---

### SaveStatusIndicator

Save status indicator component.

**Import:**
```typescript
import { SaveStatusIndicator } from '@/components/univer/SaveStatusIndicator';
```

**Props:**
```typescript
interface SaveStatusIndicatorProps {
  status: 'saved' | 'saving' | 'error';
  lastSaved?: Date;
}
```

**Example:**
```typescript
<SaveStatusIndicator
  status="saved"
  lastSaved={new Date()}
/>
```

---

### VersionHistory

Version history viewer component.

**Import:**
```typescript
import { VersionHistory } from '@/components/univer/VersionHistory';
```

**Props:**
```typescript
interface VersionHistoryProps {
  workbookId: string;
  onRestore?: (versionId: string) => void;
}
```

**Example:**
```typescript
<VersionHistory
  workbookId="wb-123"
  onRestore={(versionId) => {
    console.log('Restoring version:', versionId);
  }}
/>
```

---

## Types

### Core Types

```typescript
// Workbook data structure
interface IWorkbookData {
  id: string;
  name: string;
  sheets: {
    [sheetId: string]: IWorksheetData;
  };
}

// Worksheet data structure
interface IWorksheetData {
  id: string;
  name: string;
  cellData: {
    [row: number]: {
      [col: number]: ICellData;
    };
  };
  rowData?: { [row: number]: IRowData };
  columnData?: { [col: number]: IColumnData };
}

// Cell data structure
interface ICellData {
  v?: any;           // value
  f?: string;        // formula
  s?: ICellStyle;    // style
  t?: CellValueType; // type
}

// Cell style
interface ICellStyle {
  bg?: { rgb: string };  // background
  fc?: { rgb: string };  // font color
  bl?: 0 | 1;            // bold
  it?: 0 | 1;            // italic
  fs?: number;           // font size
}
```

### AI Types

```typescript
// AI context
interface AIContext {
  currentWorkbook: string;
  currentWorksheet: string;
  currentSelection: string;
  recentOperations: Operation[];
}

// AI response
interface AIResponse {
  success: boolean;
  message: string;
  operations: Operation[];
  requiresConfirmation: boolean;
  error?: string;
}

// Command intent
type CommandIntent =
  | 'read_cell'
  | 'write_cell'
  | 'set_formula'
  | 'format_cells'
  | 'create_chart'
  | 'sort_data'
  | 'filter_data';
```

---

## Utilities

### Error Handling

```typescript
import { handleUniverError, UniverError } from '@/utils/errors';

try {
  await setCellValue(0, 0, 'value');
} catch (error) {
  handleUniverError(error);
}
```

### Data Conversion

```typescript
import { convertFortuneSheetToUniver } from '@/utils/univerSheetConversion';

const univerData = convertFortuneSheetToUniver(fortuneSheetData);
```

---

## Best Practices

1. **Always check if univerAPI is ready** before operations
2. **Use batch operations** for multiple cell updates
3. **Enable auto-save** for better UX
4. **Handle errors gracefully** with try-catch
5. **Use TypeScript types** for type safety
6. **Monitor performance** with performance service
7. **Test with property-based tests** for correctness

---

## Support

For issues or questions:
- Check [Univer Documentation](https://univer.ai/docs)
- Review [Integration Guide](./integration/README.md)
- See [Quick Start](./QUICK_START.md)
- Check [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated:** 2024
**Version:** 1.0.0
