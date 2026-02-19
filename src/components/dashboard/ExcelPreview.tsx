import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileSpreadsheet,
  Download,
  X,
  Sheet,
  MousePointer,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  Wand2,
  Sparkles,
  Save,
  Merge,
  Split,
  Type,
} from 'lucide-react';
import {
  ExcelData,
  DataChange,
  getColumnLetter,
  createCellRef,
  getColumnIndex,
  parseCellRef,
} from '@/types/excel';
import { evaluateFormula } from '@/utils/formulaEvaluator';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';

import FormulaBar from '@/components/dashboard/FormulaBar';

interface ExcelPreviewProps {
  data: ExcelData;
  onClear: () => void;
  onCellSelect: (cellRefs: string[], isSelecting?: boolean) => void;
  onCellEdit?: (colIndex: number, rowIndex: number, newValue: string) => void;
  cellSelectionMode: boolean;
  onSheetChange: (sheetName: string) => void;
  appliedChanges?: DataChange[];
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onDeleteSelection?: (mode: 'clear' | 'delete') => void;
  onRunAudit?: () => void;
  onRunInsights?: () => void;
  onSaveAsTemplate?: () => void;
  formulaBarValue?: string;
  selectedCellRef?: string;
  onFormulaBarChange?: (value: string) => void;
  onFormulaBarCommit?: () => void;
  onMergeCells?: () => void;
  onUnmergeCells?: () => void;
  onToggleWrapText?: () => void;
  onSetColumnWidth?: (colIndex: number, width: number) => void;
  onSetRowHeight?: (rowIndex: number, height: number) => void;
}

const ROW_HEIGHT = 36;

const ExcelPreview = ({
  data,
  onClear,
  onCellSelect,
  onCellEdit,
  cellSelectionMode,
  onSheetChange,
  appliedChanges = [],
  onAddRow,
  onAddColumn,
  onDeleteSelection,
  onRunAudit,
  onRunInsights,
  onSaveAsTemplate,
  formulaBarValue = '',
  selectedCellRef = '',
  onFormulaBarChange = () => {},
  onFormulaBarCommit = () => {},
  onMergeCells,
  onUnmergeCells,
  onToggleWrapText,
  onSetColumnWidth,
  onSetRowHeight,
}: ExcelPreviewProps) => {
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [colDragStart, setColDragStart] = useState<number | null>(null);
  const [rowDragStart, setRowDragStart] = useState<number | null>(null);
  const [colResizing, setColResizing] = useState<{ colIndex: number; startX: number } | null>(null);
  const [rowResizing, setRowResizing] = useState<{ rowIndex: number; startY: number } | null>(null);

  // Create sets for quick lookup
  const pendingCellSet = useMemo(() => {
    return new Set(data.pendingChanges.map((c) => c.cellRef));
  }, [data.pendingChanges]);

  const selectedCellSet = useMemo(() => {
    return new Set(data.selectedCells);
  }, [data.selectedCells]);

  const formulaCellSet = useMemo(() => {
    return new Set(Object.keys(data.formulas));
  }, [data.formulas]);

  const appliedCellSet = useMemo(() => {
    return new Set(appliedChanges.map((c) => c.cellRef));
  }, [appliedChanges]);

  const pendingChangeMap = useMemo(() => {
    const map = new Map<string, DataChange>();
    data.pendingChanges.forEach((c) => map.set(c.cellRef, c));
    return map;
  }, [data.pendingChanges]);

  // Helper to find which merge range a cell belongs to
  const getCellMergeInfo = useCallback(
    (col: number, row: number) => {
      if (!data.mergedCells || data.mergedCells.length === 0) {
        return null;
      }
      for (const merge of data.mergedCells) {
        if (col >= merge.startCol && col <= merge.endCol && row >= merge.startRow && row <= merge.endRow) {
          return {
            merge,
            isMasterCell: col === merge.startCol && row === merge.startRow,
            colSpan: merge.endCol - merge.startCol + 1,
            rowSpan: merge.endRow - merge.startRow + 1,
          };
        }
      }
      return null;
    },
    [data.mergedCells]
  );

  // Virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (appliedChanges.length > 0) {
      const rowIndices = appliedChanges
        .map((c) => parseCellRef(c.cellRef))
        .filter((p): p is { col: number; row: number; excelRow: number } => !!p)
        .map((p) => p.row);
      if (rowIndices.length > 0) {
        const target = Math.max(...rowIndices);
        rowVirtualizer.scrollToIndex(target, { align: 'center' });
      }
    }
  }, [appliedChanges, rowVirtualizer]);

  const handleCellClick = useCallback(
    (colIndex: number, rowIndex: number, e: React.MouseEvent) => {
      const cellRef = createCellRef(colIndex, rowIndex);
      const currentSelection = data.selectedCells;

      if (cellSelectionMode && e.shiftKey && currentSelection.length > 0) {
        const selectionStart = currentSelection[0];
        const startParts = selectionStart.match(/([A-Z]+)(\d+)/);
        const endParts = cellRef.match(/([A-Z]+)(\d+)/);
        if (startParts && endParts) {
          const startCol = getColumnIndex(startParts[1]);
          const startRow = parseInt(startParts[2], 10) - 2;
          const endCol = getColumnIndex(endParts[1]);
          const endRow = parseInt(endParts[2], 10) - 2;

          const minCol = Math.min(startCol, endCol);
          const maxCol = Math.max(startCol, endCol);
          const minRow = Math.min(startRow, endRow);
          const maxRow = Math.max(startRow, endRow);

          const selectedCells: string[] = [];
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              selectedCells.push(createCellRef(c, r));
            }
          }
          onCellSelect(selectedCells, false);
        }
      } else if (cellSelectionMode && (e.ctrlKey || e.metaKey)) {
        const newSelection = selectedCellSet.has(cellRef)
          ? data.selectedCells.filter((c) => c !== cellRef)
          : [...data.selectedCells, cellRef];
        onCellSelect(newSelection, false);
      } else {
        onCellSelect([cellRef], false);
      }
    },
    [cellSelectionMode, selectedCellSet, data.selectedCells, onCellSelect]
  );

  const handleCellMouseDown = useCallback(
    (colIndex: number, rowIndex: number) => {
      setDragStart({ col: colIndex, row: rowIndex });
      setIsDragging(true);
      onCellSelect([createCellRef(colIndex, rowIndex)], true);
    },
    [onCellSelect]
  );

  const handleCellMouseEnter = useCallback(
    (colIndex: number, rowIndex: number) => {
      if (!isDragging || !dragStart) return;
      const minCol = Math.min(dragStart.col, colIndex);
      const maxCol = Math.max(dragStart.col, colIndex);
      const minRow = Math.min(dragStart.row, rowIndex);
      const maxRow = Math.max(dragStart.row, rowIndex);
      const selected: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          selected.push(createCellRef(c, r));
        }
      }
      onCellSelect(selected, true);
    },
    [dragStart, isDragging, onCellSelect]
  );

  const handleCellDoubleClick = useCallback(
    (colIndex: number, rowIndex: number) => {
      if (cellSelectionMode) return;
      const cellValue = data.rows[rowIndex]?.[colIndex];
      setEditingCell({ col: colIndex, row: rowIndex });
      setEditValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : '');
    },
    [cellSelectionMode, data.rows]
  );

  const commitEdit = useCallback(() => {
    if (!editingCell || !onCellEdit) return;
    onCellEdit(editingCell.col, editingCell.row, editValue);
    setEditingCell(null);
  }, [editingCell, editValue, onCellEdit]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        // Move to next cell
        if (editingCell) {
          const nextCol = editingCell.col + 1;
          if (nextCol < data.headers.length) {
            const val = data.rows[editingCell.row]?.[nextCol];
            setEditingCell({ col: nextCol, row: editingCell.row });
            setEditValue(val !== null && val !== undefined ? String(val) : '');
          }
        }
      }
    },
    [commitEdit, cancelEdit, editingCell, data.headers.length, data.rows]
  );

  const handleColumnMouseDown = useCallback(
    (colIndex: number) => {
      setColDragStart(colIndex);
      const selectedCells: string[] = [];
      for (let r = 0; r < data.rows.length; r++) {
        selectedCells.push(createCellRef(colIndex, r));
      }
      onCellSelect(selectedCells, true);
    },
    [data.rows.length, onCellSelect]
  );

  const handleColumnMouseEnter = useCallback(
    (colIndex: number) => {
      if (colDragStart === null) return;
      const minCol = Math.min(colDragStart, colIndex);
      const maxCol = Math.max(colDragStart, colIndex);
      const selectedCells: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        for (let r = 0; r < data.rows.length; r++) {
          selectedCells.push(createCellRef(c, r));
        }
      }
      onCellSelect(selectedCells, true);
    },
    [colDragStart, data.rows.length, onCellSelect]
  );

  const handleRowMouseDown = useCallback(
    (rowIndex: number) => {
      setRowDragStart(rowIndex);
      const selectedCells: string[] = [];
      for (let c = 0; c < data.headers.length; c++) {
        selectedCells.push(createCellRef(c, rowIndex));
      }
      onCellSelect(selectedCells, true);
    },
    [data.headers.length, onCellSelect]
  );

  const handleRowMouseEnter = useCallback(
    (rowIndex: number) => {
      if (rowDragStart === null) return;
      const minRow = Math.min(rowDragStart, rowIndex);
      const maxRow = Math.max(rowDragStart, rowIndex);
      const selectedCells: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = 0; c < data.headers.length; c++) {
          selectedCells.push(createCellRef(c, r));
        }
      }
      onCellSelect(selectedCells, true);
    },
    [rowDragStart, data.headers.length, onCellSelect]
  );

  const handleDownload = (format: 'xlsx' | 'csv') => {
    try {
      const workbook = XLSX.utils.book_new();
      const wsData = [data.headers, ...data.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Apply formulas
      Object.entries(data.formulas).forEach(([cellRef, formula]) => {
        if (worksheet[cellRef]) {
          worksheet[cellRef].f = formula;
        } else {
          worksheet[cellRef] = { t: 's', v: '', f: formula };
        }
      });

      // Apply merged cells if present
      if (data.mergedCells && data.mergedCells.length > 0) {
        worksheet['!merges'] = data.mergedCells.map((merge) => ({
          s: { r: merge.startRow + 1, c: merge.startCol }, // +1 for header row
          e: { r: merge.endRow + 1, c: merge.endCol },
        }));
      }

      // Apply styles if format is xlsx
      if (format === 'xlsx') {
        const colorMap: Record<string, string> = {
          red: 'FF0000',
          green: '00FF00',
          blue: '0000FF',
          yellow: 'FFFF00',
          orange: 'FFA500',
          purple: '800080',
          pink: 'FFC0CB',
          black: '000000',
          white: 'FFFFFF',
          gray: '808080',
          lightgray: 'D3D3D3',
          darkgray: 'A9A9A9',
          success: '22C55E',
          warning: 'F59E0B',
          destructive: 'EF4444',
          primary: '0EA5E9',
        };

        const normalizeColor = (color: string) => {
          if (!color) return '000000';
          const lowerColor = color.toLowerCase();
          if (colorMap[lowerColor]) return colorMap[lowerColor];
          return color.startsWith('#') ? color.slice(1).toUpperCase() : color.toUpperCase();
        };

        Object.entries(data.cellStyles).forEach(([cellRef, style]) => {
          if (worksheet[cellRef]) {
            const xlsxStyle: any = {};

            if (style.backgroundColor) {
              xlsxStyle.fill = {
                fgColor: { rgb: normalizeColor(style.backgroundColor) },
              };
            }

            if (style.color || style.fontWeight) {
              xlsxStyle.font = {};
              if (style.color) {
                xlsxStyle.font.color = { rgb: normalizeColor(style.color) };
              }
              if (style.fontWeight === 'bold') {
                xlsxStyle.font.bold = true;
              }
            }

            worksheet[cellRef].s = xlsxStyle;
          }
        });
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, data.currentSheet);

      const timestamp = new Date().toISOString().slice(0, 10);
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const fileName = data.fileName.replace(/\.(xlsx|xls)$/i, `_edited_${timestamp}.${ext}`);

      if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Use xlsx-js-style to write the file instead of standard xlsx
        XLSXStyle.writeFile(workbook, fileName);
      }

      toast({
        title: 'Download successful!',
        description: `File ${fileName} has been downloaded with styles`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'An error occurred while creating the file',
      });
    }
  };

  const formulaCount = Object.keys(data.formulas).length;
  const pendingCount = data.pendingChanges.length;
  const appliedCount = appliedChanges.length;
  const selectedCount = data.selectedCells.length;

  const selectionInfo = useMemo(() => {
    if (selectedCount === 0) return null;

    const rowSet = new Set<number>();
    const colSet = new Set<number>();

    data.selectedCells.forEach((ref) => {
      const parsed = parseCellRef(ref);
      if (parsed) {
        rowSet.add(parsed.row);
        colSet.add(parsed.col);
      }
    });

    const isFullRow = Array.from(rowSet).every((r) =>
      Array.from({ length: data.headers.length }, (_, i) => createCellRef(i, r)).every((ref) =>
        data.selectedCells.includes(ref)
      )
    );

    const isFullCol = Array.from(colSet).every((c) =>
      Array.from({ length: data.rows.length }, (_, i) => createCellRef(c, i)).every((ref) =>
        data.selectedCells.includes(ref)
      )
    );

    if (isFullRow) return { type: 'row', count: rowSet.size };
    if (isFullCol) return { type: 'column', count: colSet.size };
    return { type: 'cell', count: selectedCount };
  }, [data.selectedCells, data.headers.length, data.rows.length, selectedCount]);

  const getCellClassName = (cellRef: string) => {
    const classes: string[] = ['transition-colors'];

    if (appliedCellSet.has(cellRef)) classes.push('cell-applied');
    if (pendingCellSet.has(cellRef)) classes.push('cell-pending');
    if (formulaCellSet.has(cellRef)) classes.push('cell-formula');
    if (selectedCellSet.has(cellRef)) classes.push('ring-2 ring-primary ring-inset bg-primary/10');
    if (cellSelectionMode) classes.push('cursor-pointer hover:bg-accent');

    return classes.join(' ');
  };

  const getCellStyle = (cellRef: string) => {
    const style = data.cellStyles[cellRef];
    if (!style) return {};

    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontWeight: style.fontWeight as any,
    };
  };

  const formatCellValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const renderCellContent = (
    cellRef: string,
    cellValue: string | number | null,
    colIndex: number,
    rowIndex: number
  ) => {
    // If editing this cell
    if (editingCell && editingCell.col === colIndex && editingCell.row === rowIndex) {
      return (
        <input
          ref={editInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={commitEdit}
          className="w-full h-full bg-background border-2 border-primary rounded px-1 text-sm outline-none"
        />
      );
    }

    const formula = data.formulas[cellRef];
    const pendingChange = pendingChangeMap.get(cellRef);
    const isApplied = appliedCellSet.has(cellRef);

    if (formula) {
      const result = evaluateFormula(formula, data);
      const hasError = result === null;
      const displayValue = result !== null ? result : '#ERROR';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1 cursor-help ${hasError ? 'bg-destructive/10' : ''}`}>
                <span className={`text-xs font-mono px-1 rounded shrink-0 ${
                  hasError
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {hasError ? '!' : 'fx'}
                </span>
                <span className={`font-medium truncate ${
                  hasError ? 'text-destructive font-bold' : 'text-primary'
                }`}>
                  {typeof displayValue === 'number' ? formatNumber(displayValue) : displayValue}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs max-w-xs">
              <div>{formula}</div>
              {hasError && <div className="mt-1 text-destructive">Formula evaluation failed</div>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (pendingChange) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="line-through text-xs text-muted-foreground">
            {formatCellValue(pendingChange.before)}
          </span>
          <span className="text-sm font-medium text-primary flex items-center gap-1">
            → {formatCellValue(pendingChange.after)}
          </span>
        </div>
      );
    }

    if (isApplied) {
      return (
        <span className="flex items-center gap-1 text-success">
          <Check className="h-3 w-3" />
          {formatCellValue(cellValue)}
        </span>
      );
    }

    const isWrapText = data.cellStyles[cellRef]?.wrapText;
    return (
      <span className={isWrapText ? 'block whitespace-normal' : 'truncate block'}>
        {formatCellValue(cellValue)}
      </span>
    );
  };

  // Handle column resize
  const handleColumnResizeStart = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setColResizing({ colIndex, startX: e.clientX });
    },
    []
  );

  const handleRowResizeStart = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setRowResizing({ rowIndex, startY: e.clientY });
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (colResizing) {
        const delta = e.clientX - colResizing.startX;
        const baseWidth = 100;
        const currentWidth = data.columnWidths?.[colResizing.colIndex] || baseWidth;
        const newWidth = currentWidth + delta;
        onSetColumnWidth?.(colResizing.colIndex, newWidth);
        // Update start position for continuous tracking
        setColResizing({ ...colResizing, startX: e.clientX });
      }

      if (rowResizing) {
        const delta = e.clientY - rowResizing.startY;
        const baseHeight = ROW_HEIGHT;
        const currentHeight = data.rowHeights?.[rowResizing.rowIndex] || baseHeight;
        const newHeight = currentHeight + delta;
        onSetRowHeight?.(rowResizing.rowIndex, newHeight);
        // Update start position for continuous tracking
        setRowResizing({ ...rowResizing, startY: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setColResizing(null);
      setRowResizing(null);
    };

    if (colResizing || rowResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [colResizing, rowResizing, onSetColumnWidth, onSetRowHeight, data.columnWidths, data.rowHeights]);

  const handleGlobalMouseUp = useCallback(() => {
    if (isDragging || colDragStart !== null || rowDragStart !== null) {
      onCellSelect(data.selectedCells, false);
      setIsDragging(false);
      setDragStart(null);
      setColDragStart(null);
      setRowDragStart(null);
    }
  }, [isDragging, colDragStart, rowDragStart, onCellSelect, data.selectedCells]);

  return (
    <div className="flex flex-1 flex-col min-h-0" onMouseUp={handleGlobalMouseUp}>
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-card">
        {/* Top: Metadata & Filename */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{data.fileName}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>
                  {data.rows.length.toLocaleString()} rows • {data.headers.length} columns
                </span>
                {formulaCount > 0 && <span>• {formulaCount} formulas</span>}
                {appliedCount > 0 && (
                  <span className="text-success font-medium">• {appliedCount} applied</span>
                )}
                {pendingCount > 0 && (
                  <span className="text-warning font-medium">• {pendingCount} pending</span>
                )}
              </p>
            </div>
          </div>

          {cellSelectionMode && (
            <Badge variant="default" className="gap-1 animate-pulse">
              <MousePointer className="h-3 w-3" />
              Select cells...
            </Badge>
          )}
        </div>

        <Separator className="bg-border/50" />

        {/* Middle: Level 1 (Management & AI) */}
        <div className="px-4 py-2 flex flex-wrap items-center gap-2">
          {data.sheets.length > 1 && (
            <Select value={data.currentSheet} onValueChange={onSheetChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Sheet className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.sheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet} className="text-xs">
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onRunAudit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRunAudit}
              className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary text-primary text-xs"
              aria-label="Run data audit to check for issues"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Audit Data
            </Button>
          )}

          {onRunInsights && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRunInsights}
              className="h-8 gap-2 border-indigo-500/20 hover:bg-indigo-500/5 hover:border-indigo-500 text-indigo-500 text-xs"
              aria-label="Generate insights from data"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Wawasan
            </Button>
          )}

          {onSaveAsTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveAsTemplate}
              className="h-8 gap-2 border-green-500/20 hover:bg-green-500/5 hover:border-green-500 text-green-600 text-xs"
              aria-label="Save current structure as template"
            >
              <Save className="h-3.5 w-3.5" />
              Save as Template
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-2 text-xs"
                aria-label="Download file options"
              >
                <Download className="h-3.5 w-3.5" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('xlsx')} className="text-xs">
                Download as .xlsx
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('csv')} className="text-xs">
                Download as .csv
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="bg-border" />

        {/* Bottom: Level 2 (Grid Operations) */}
        <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddRow}
              className="h-8 gap-1 text-xs"
              aria-label="Add new row to spreadsheet"
            >
              <Plus className="h-3 w-3" />
              Tambah Baris
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddColumn}
              className="h-8 gap-1 text-xs"
              aria-label="Add new column to spreadsheet"
            >
              <Plus className="h-3 w-3" />
              Tambah Kolom
            </Button>

            <Separator orientation="vertical" className="h-5" />

            {onMergeCells && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMergeCells}
                className="h-8 gap-1 text-xs border-blue-500/20 hover:bg-blue-500/5 hover:border-blue-500 text-blue-600"
                aria-label="Merge selected cells"
              >
                <Merge className="h-3.5 w-3.5" />
                Merge
              </Button>
            )}

            {onUnmergeCells && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnmergeCells}
                className="h-8 gap-1 text-xs border-blue-500/20 hover:bg-blue-500/5 hover:border-blue-500 text-blue-600"
                aria-label="Unmerge selected cells"
              >
                <Split className="h-3.5 w-3.5" />
                Unmerge
              </Button>
            )}

            {onToggleWrapText && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleWrapText}
                className="h-8 gap-1 text-xs border-amber-500/20 hover:bg-amber-500/5 hover:border-amber-500 text-amber-600"
                aria-label="Toggle text wrapping for selected cells"
              >
                <Type className="h-3.5 w-3.5" />
                Wrap Text
              </Button>
            )}

            {selectionInfo && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    aria-label={`Delete ${selectionInfo.count} selected ${selectionInfo.type}${selectionInfo.count > 1 ? 's' : ''}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {selectionInfo.type === 'cell' ? (
                    <DropdownMenuItem
                      onClick={() => onDeleteSelection?.('clear')}
                      className="text-xs"
                    >
                      Hapus isi {selectionInfo.count} cell
                    </DropdownMenuItem>
                  ) : selectionInfo.type === 'row' ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => onDeleteSelection?.('clear')}
                        className="text-xs"
                      >
                        Hapus isi {selectionInfo.count} baris
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteSelection?.('delete')}
                        className="text-destructive focus:text-destructive text-xs"
                      >
                        Hapus {selectionInfo.count} baris secara permanen
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => onDeleteSelection?.('clear')}
                        className="text-xs"
                      >
                        Hapus isi {selectionInfo.count} kolom
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteSelection?.('delete')}
                        className="text-destructive focus:text-destructive text-xs"
                      >
                        Hapus {selectionInfo.count} kolom secara permanen
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Clear file and discard all changes?')) {
                onClear();
              }
            }}
            className="h-8 gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive text-xs font-medium"
            aria-label="Clear file and start over"
          >
            <X className="h-3.5 w-3.5" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Selection mode hint */}
      {cellSelectionMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm text-primary flex items-center gap-2">
          <MousePointer className="h-4 w-4" />
          <span>
            Click cell to select • Shift+click for range • Ctrl+click for multi-select • Esc to
            cancel
          </span>
        </div>
      )}

      {/* Formula Bar - Positioned exactly above the table */}
      <FormulaBar
        selectedCell={selectedCellRef}
        value={formulaBarValue}
        onChange={onFormulaBarChange}
        onCommit={onFormulaBarCommit}
        disabled={cellSelectionMode}
      />

      {/* Virtualized Table */}
      <div ref={parentRef} className="flex-1 overflow-auto min-h-0 min-w-0">
        <div className="min-w-max">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex border-b border-border">
            <div className="w-14 shrink-0 border-r border-border text-center font-semibold bg-muted px-2 py-2 sticky left-0 z-20">
              <span className="text-xs text-muted-foreground">#</span>
            </div>
            {data.headers.map((header, index) => {
              const colWidth = data.columnWidths?.[index];
              return (
                <div
                  key={index}
                  onMouseDown={() => handleColumnMouseDown(index)}
                  onMouseEnter={() => handleColumnMouseEnter(index)}
                  className="min-w-[80px] sm:min-w-[100px] md:min-w-[120px] max-w-[150px] sm:max-w-[180px] md:max-w-[200px] w-[100px] sm:w-[130px] md:w-[150px] shrink-0 border-r border-border font-semibold bg-muted px-2 sm:px-4 py-2 cursor-pointer hover:bg-muted/80 group relative select-none"
                  style={{
                    ...(colWidth && {
                      width: `${colWidth}px`,
                      minWidth: `${colWidth}px`,
                      maxWidth: `${colWidth}px`,
                      flexBasis: `${colWidth}px`,
                    }),
                    cursor:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5v14M19 12l-7 7-7-7'/></svg>\") 8 8, s-resize",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/70 group-hover:text-primary transition-colors">
                      {getColumnLetter(index)}
                    </span>
                    <span className="truncate font-medium text-foreground text-xs sm:text-sm">
                      {header || '(empty)'}
                    </span>
                  </div>
                  {/* Column resize handle */}
                  <div
                    onMouseDown={(e) => handleColumnResizeStart(index, e)}
                    className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-primary/50 cursor-col-resize group-hover:w-1.5 transition-all"
                    style={{
                      cursor: 'col-resize',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Virtualized rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const row = data.rows[rowIndex];

              const rowHeight = data.rowHeights?.[rowIndex];
              return (
                <div
                  key={virtualRow.key}
                  className={`flex absolute w-full border-b border-border group relative ${
                    rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                  style={{
                    height: rowHeight ? `${rowHeight}px` : `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    onMouseDown={() => handleRowMouseDown(rowIndex)}
                    onMouseEnter={() => handleRowMouseEnter(rowIndex)}
                    className="w-14 shrink-0 border-r border-border text-center text-xs text-muted-foreground font-mono bg-muted/50 sticky left-0 flex items-center justify-center cursor-pointer hover:bg-muted/80 hover:text-primary transition-colors select-none relative"
                    style={{
                      cursor:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12h14M12 5l7 7-7 7'/></svg>\") 8 8, e-resize",
                    }}
                  >
                    {rowIndex + 2}
                    {/* Row resize handle */}
                    <div
                      onMouseDown={(e) => handleRowResizeStart(rowIndex, e)}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-transparent hover:bg-primary/50 cursor-row-resize group-hover:h-1.5 transition-all"
                      style={{
                        cursor: 'row-resize',
                      }}
                    />
                  </div>
                  {data.headers.map((_, colIndex) => {
                    const cellRef = createCellRef(colIndex, rowIndex);
                    const cellValue = row[colIndex];
                    const mergeInfo = getCellMergeInfo(colIndex, rowIndex);

                    // For non-master cells in merged range, render invisible placeholder with matching width
                    if (mergeInfo && !mergeInfo.isMasterCell) {
                      return (
                        <div
                          key={colIndex}
                          className="min-w-[80px] sm:min-w-[100px] md:min-w-[120px] max-w-[150px] sm:max-w-[180px] md:max-w-[200px] w-[100px] sm:w-[130px] md:w-[150px] shrink-0 border-r border-border"
                          style={{
                            visibility: 'hidden',
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    }

                    // For master cells with colspan, adjust the flex basis
                    const baseWidth = 100; // matches default w-[100px] in pixels
                    const mergedColSpan = mergeInfo?.colSpan || 1;
                    const totalWidthForMerged = baseWidth * mergedColSpan;

                    return (
                      <div
                        key={colIndex}
                        tabIndex={0}
                        role="gridcell"
                        onMouseDown={() => handleCellMouseDown(colIndex, rowIndex)}
                        onMouseEnter={() => handleCellMouseEnter(colIndex, rowIndex)}
                        onClick={(e) => handleCellClick(colIndex, rowIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(colIndex, rowIndex)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCellDoubleClick(colIndex, rowIndex);
                          } else if (e.key === ' ') {
                            e.preventDefault();
                            handleCellClick(colIndex, rowIndex, e as any);
                          }
                        }}
                        className={`shrink-0 border-r border-border px-2 sm:px-4 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${getCellClassName(cellRef)}`}
                        style={{
                          ...getCellStyle(cellRef),
                          ...(mergeInfo && mergeInfo.colSpan > 1 && {
                            width: `${totalWidthForMerged}px`,
                            minWidth: `${totalWidthForMerged}px`,
                            maxWidth: `${totalWidthForMerged}px`,
                            flexBasis: `${totalWidthForMerged}px`,
                          }),
                          // Apply default sizes if not merged
                          ...(!(mergeInfo && mergeInfo.colSpan > 1) && {
                            width: `${baseWidth}px`,
                            minWidth: '80px',
                            maxWidth: '150px',
                            flexBasis: `${baseWidth}px`,
                          }),
                          // Apply wrap text style if enabled
                          ...(data.cellStyles[cellRef]?.wrapText && {
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                          }),
                        }}
                      >
                        {renderCellContent(cellRef, cellValue, colIndex, rowIndex)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row count indicator */}
      <div className="border-t border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground">
        {data.rows.length.toLocaleString()} rows total • Double-click a cell to edit
      </div>
    </div>
  );
};

export default ExcelPreview;
