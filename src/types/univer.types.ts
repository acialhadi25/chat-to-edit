/**
 * Univer TypeScript Type Definitions
 * 
 * Comprehensive type definitions for Univer Sheet integration
 * Based on Univer v0.15.5 Facade API
 * 
 * @see https://reference.univer.ai/
 */

// ============================================================================
// Core Types
// ============================================================================

export interface IWorkbookData {
  id: string;
  name: string;
  sheets: {
    [sheetId: string]: IWorksheetData;
  };
  locale?: LocaleType;
  styles?: IStyleData;
  resources?: IResourceData[];
}

export enum LocaleType {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
  RU_RU = 'ru-RU',
  VI_VN = 'vi-VN',
  FR_FR = 'fr-FR',
  ES_ES = 'es-ES',
  PT_BR = 'pt-BR',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  IT_IT = 'it-IT',
  DE_DE = 'de-DE',
  FA_IR = 'fa-IR',
  TR_TR = 'tr-TR',
  TH_TH = 'th-TH',
  ID_ID = 'id-ID',
}

export interface IWorksheetData {
  id: string;
  name: string;
  cellData: {
    [row: number]: {
      [col: number]: ICellData;
    };
  };
  rowData?: {
    [row: number]: IRowData;
  };
  columnData?: {
    [col: number]: IColumnData;
  };
  mergeData?: IMergeData[];
  rowCount?: number;
  columnCount?: number;
  zoomRatio?: number;
  scrollTop?: number;
  scrollLeft?: number;
  defaultRowHeight?: number;
  defaultColumnWidth?: number;
  status?: WorksheetStatus;
  freeze?: IFreeze;
  showGridlines?: boolean;
  rightToLeft?: boolean;
}

export interface ICellData {
  v?: any;                    // value
  f?: string;                 // formula
  si?: string;                // style ID
  t?: CellValueType;          // type
  s?: ICellStyle;             // inline style
  p?: IDocumentData;          // rich text
  custom?: any;               // custom data
}

export interface ICellStyle {
  bg?: { rgb: string };       // background color
  fc?: { rgb: string };       // font color
  bl?: 0 | 1;                 // bold
  it?: 0 | 1;                 // italic
  ul?: { s: 0 | 1 };          // underline
  st?: { s: 0 | 1 };          // strikethrough
  fs?: number;                // font size
  ff?: string;                // font family
  ht?: 0 | 1 | 2;             // horizontal align (0=left, 1=center, 2=right)
  vt?: 0 | 1 | 2;             // vertical align (0=top, 1=middle, 2=bottom)
  tb?: 0 | 1 | 2;             // text wrap
  bd?: IBorderData;           // borders
}

export interface IBorderData {
  t?: IBorderStyle;           // top
  b?: IBorderStyle;           // bottom
  l?: IBorderStyle;           // left
  r?: IBorderStyle;           // right
}

export interface IBorderStyle {
  s: BorderStyleType;
  cl: { rgb: string };
}

export interface IRowData {
  h?: number;                 // height
  hd?: 0 | 1;                 // hidden
  ah?: number;                // auto height
}

export interface IColumnData {
  w?: number;                 // width
  hd?: 0 | 1;                 // hidden
}

export interface IMergeData {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface IFreeze {
  startRow: number;
  startColumn: number;
  xSplit?: number;
  ySplit?: number;
}

export interface IStyleData {
  [styleId: string]: ICellStyle;
}

export interface IResourceData {
  name: string;
  data: any;
}

export interface IDocumentData {
  id: string;
  body?: {
    dataStream: string;
    textRuns?: ITextRun[];
    paragraphs?: IParagraph[];
  };
  documentStyle?: any;
}

export interface ITextRun {
  st: number;
  ed: number;
  ts?: ITextStyle;
}

export interface ITextStyle {
  bl?: 0 | 1;                 // bold
  it?: 0 | 1;                 // italic
  ul?: { s: 0 | 1 };          // underline
  st?: { s: 0 | 1 };          // strikethrough
  fs?: number;                // font size
  ff?: string;                // font family
  cl?: { rgb: string };       // color
}

export interface IParagraph {
  startIndex: number;
  paragraphStyle?: any;
}

// ============================================================================
// Enums
// ============================================================================

export enum CellValueType {
  STRING = 1,
  NUMBER = 2,
  BOOLEAN = 3,
  FORCE_STRING = 4,
}

export enum BorderStyleType {
  NONE = 0,
  THIN = 1,
  MEDIUM = 2,
  THICK = 3,
  DASHED = 4,
  DOTTED = 5,
  DOUBLE = 6,
}

export enum WorksheetStatus {
  VISIBLE = 0,
  HIDDEN = 1,
  VERY_HIDDEN = 2,
}

export enum HorizontalAlign {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

export enum VerticalAlign {
  TOP = 0,
  MIDDLE = 1,
  BOTTOM = 2,
}

// ============================================================================
// Range Types
// ============================================================================

export interface IRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface IRangeData {
  range: IRange;
  values?: any[][];
  formulas?: string[][];
  styles?: ICellStyle[][];
}

// ============================================================================
// Event Types
// ============================================================================

export interface IEventParams {
  [key: string]: any;
}

export interface ILifeCycleEvent {
  stage: LifecycleStages;
}

export interface ICellClickEvent {
  row: number;
  col: number;
  workbook: string;
  worksheet: string;
}

export interface ISelectionChangeEvent {
  selections: IRange[];
  workbook: string;
  worksheet: string;
}

export interface ICommandExecutedEvent {
  id: string;
  type: string;
  params: any;
}

export enum LifecycleStages {
  Starting = 'Starting',
  Ready = 'Ready',
  Rendered = 'Rendered',
  Steady = 'Steady',
}

// ============================================================================
// Command Types
// ============================================================================

export interface ICommand {
  id: string;
  type: CommandType;
  params?: any;
}

export enum CommandType {
  MUTATION = 'mutation',
  OPERATION = 'operation',
}

// ============================================================================
// Facade API Types
// ============================================================================

export interface FUniver {
  // Workbook operations
  createWorkbook(data: Partial<IWorkbookData>): FWorkbook;
  getActiveWorkbook(): FWorkbook | null;
  getWorkbook(id: string): FWorkbook | null;
  disposeUnit(id: string): void;
  
  // Events
  addEvent(event: string, callback: (params: any) => void): IDisposable;
  
  // Enums
  Enum: {
    LifecycleStages: typeof LifecycleStages;
    CellValueType: typeof CellValueType;
    BorderStyleType: typeof BorderStyleType;
    WorksheetStatus: typeof WorksheetStatus;
    HorizontalAlign: typeof HorizontalAlign;
    VerticalAlign: typeof VerticalAlign;
  };
  
  // Events
  Event: {
    LifeCycleChanged: string;
    CellClicked: string;
    SelectionChanged: string;
    CommandExecuted: string;
    WorkbookCreated: string;
    WorkbookDisposed: string;
    WorksheetCreated: string;
    WorksheetActivated: string;
  };
}

export interface FWorkbook {
  // Properties
  getId(): string;
  getName(): string;
  
  // Worksheet operations
  getActiveSheet(): FWorksheet | null;
  getSheetByName(name: string): FWorksheet | null;
  getSheetBySheetId(id: string): FWorksheet | null;
  create(name: string, rows?: number, cols?: number): FWorksheet;
  
  // Data operations
  save(): IWorkbookData;
  
  // Lifecycle
  dispose(): void;
}

export interface FWorksheet {
  // Properties
  getSheetId(): string;
  getSheetName(): string;
  
  // Range operations
  getRange(row: number, col: number): FRange;
  getRange(startRow: number, startCol: number, numRows: number, numCols: number): FRange;
  getRange(a1Notation: string): FRange;
  
  // Cell operations
  getCellData(row: number, col: number): ICellData | null;
  
  // Row/Column operations
  getMaxRows(): number;
  getMaxColumns(): number;
  
  // Activation
  activate(): void;
}

export interface FRange {
  // Value operations
  getValue(): any;
  getValues(): any[][];
  setValue(value: any): Promise<boolean>;
  setValues(values: any[][]): Promise<boolean>;
  
  // Formula operations
  getFormula(): string;
  getFormulas(): string[][];
  setFormula(formula: string): Promise<boolean>;
  setFormulas(formulas: string[][]): Promise<boolean>;
  
  // Style operations
  setFontWeight(weight: 'bold' | 'normal'): Promise<boolean>;
  setFontStyle(style: 'italic' | 'normal'): Promise<boolean>;
  setFontSize(size: number): Promise<boolean>;
  setFontColor(color: string): Promise<boolean>;
  setBackgroundColor(color: string): Promise<boolean>;
  setHorizontalAlignment(alignment: 'left' | 'center' | 'right'): Promise<boolean>;
  setVerticalAlignment(alignment: 'top' | 'middle' | 'bottom'): Promise<boolean>;
  
  // Number format
  setNumberFormat(format: string): Promise<boolean>;
  
  // Sort operations
  sort(config: SortConfig | SortConfig[]): void;
  sort(columnIndex: number, ascending?: boolean): void;
  
  // Range info
  getRow(): number;
  getColumn(): number;
  getNumRows(): number;
  getNumColumns(): number;
}

// Sort configuration for FRange.sort()
export interface SortConfig {
  column: number;
  ascending: boolean;
}

export interface IDisposable {
  dispose(): void;
}

// ============================================================================
// Preset Types
// ============================================================================

export interface IUniverPresetConfig {
  locale?: string;
  locales?: Record<string, any>;
  presets?: any[];
}

export interface IUniverInstance {
  univer: any;
  univerAPI: FUniver;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface UniverSheetProps {
  initialData?: Partial<IWorkbookData>;
  onChange?: (data: IWorkbookData) => void;
  onSelectionChange?: (selection: IRange) => void;
  height?: string | number;
  width?: string | number;
  enableAI?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  readOnly?: boolean;
}

export interface UniverSheetHandle {
  getWorkbookData: () => Promise<IWorkbookData | null>;
  setWorkbookData: (data: Partial<IWorkbookData>) => Promise<void>;
  getActiveSheet: () => FWorksheet | null;
  getCellValue: (row: number, col: number) => any;
  setCellValue: (row: number, col: number, value: any) => Promise<void>;
  getRangeValues: (range: string) => any[][];
  setRangeValues: (range: string, values: any[][]) => Promise<void>;
  getFormula: (row: number, col: number) => string | null;
  setFormula: (row: number, col: number, formula: string) => Promise<void>;
  univerAPI: FUniver | null;
  univer: any;
}
