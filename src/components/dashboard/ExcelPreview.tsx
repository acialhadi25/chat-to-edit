import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { FileSpreadsheet, Download, X, Sheet, MousePointer, Check, ChevronDown, Plus } from "lucide-react";
import { ExcelData, DataChange, getColumnLetter, createCellRef, getColumnIndex, parseCellRef } from "@/types/excel";
import { evaluateFormula } from "@/utils/formulaEvaluator";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
}: ExcelPreviewProps) => {
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showEmptyPlaceholders, setShowEmptyPlaceholders] = useState(false);
  const [dragStart, setDragStart] = useState<{ col: number; row: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [colDragStart, setColDragStart] = useState<number | null>(null);
  const [rowDragStart, setRowDragStart] = useState<number | null>(null);

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
        rowVirtualizer.scrollToIndex(target, { align: "center" });
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

  const handleCellMouseDown = useCallback((colIndex: number, rowIndex: number) => {
    setDragStart({ col: colIndex, row: rowIndex });
    setIsDragging(true);
    onCellSelect([createCellRef(colIndex, rowIndex)], true);
  }, [onCellSelect]);

  const handleCellMouseEnter = useCallback((colIndex: number, rowIndex: number) => {
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
  }, [dragStart, isDragging, onCellSelect]);

  const handleCellDoubleClick = useCallback(
    (colIndex: number, rowIndex: number) => {
      if (cellSelectionMode) return;
      const cellValue = data.rows[rowIndex]?.[colIndex];
      setEditingCell({ col: colIndex, row: rowIndex });
      setEditValue(cellValue !== null && cellValue !== undefined ? String(cellValue) : "");
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
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        // Move to next cell
        if (editingCell) {
          const nextCol = editingCell.col + 1;
          if (nextCol < data.headers.length) {
            const val = data.rows[editingCell.row]?.[nextCol];
            setEditingCell({ col: nextCol, row: editingCell.row });
            setEditValue(val !== null && val !== undefined ? String(val) : "");
          }
        }
      }
    },
    [commitEdit, cancelEdit, editingCell, data.headers.length, data.rows]
  );

  const handleColumnMouseDown = useCallback((colIndex: number) => {
    setColDragStart(colIndex);
    const selectedCells: string[] = [];
    for (let r = 0; r < data.rows.length; r++) {
      selectedCells.push(createCellRef(colIndex, r));
    }
    onCellSelect(selectedCells, true);
  }, [data.rows.length, onCellSelect]);

  const handleColumnMouseEnter = useCallback((colIndex: number) => {
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
  }, [colDragStart, data.rows.length, onCellSelect]);

  const handleRowMouseDown = useCallback((rowIndex: number) => {
    setRowDragStart(rowIndex);
    const selectedCells: string[] = [];
    for (let c = 0; c < data.headers.length; c++) {
      selectedCells.push(createCellRef(c, rowIndex));
    }
    onCellSelect(selectedCells, true);
  }, [data.headers.length, onCellSelect]);

  const handleRowMouseEnter = useCallback((rowIndex: number) => {
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
  }, [rowDragStart, data.headers.length, onCellSelect]);

  const handleDownload = (format: "xlsx" | "csv") => {
    try {
      const workbook = XLSX.utils.book_new();
      const wsData = [data.headers, ...data.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      Object.entries(data.formulas).forEach(([cellRef, formula]) => {
        worksheet[cellRef] = { t: "s", f: formula };
      });

      XLSX.utils.book_append_sheet(workbook, worksheet, data.currentSheet);

      const timestamp = new Date().toISOString().slice(0, 10);
      const ext = format === "csv" ? "csv" : "xlsx";
      const fileName = data.fileName.replace(
        /\.(xlsx|xls)$/i,
        `_edited_${timestamp}.${ext}`
      );

      if (format === "csv") {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        XLSX.writeFile(workbook, fileName);
      }

      toast({
        title: "Download successful!",
        description: `File ${fileName} has been downloaded`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "An error occurred while creating the file",
      });
    }
  };

  const formulaCount = Object.keys(data.formulas).length;
  const pendingCount = data.pendingChanges.length;
  const appliedCount = appliedChanges.length;

  const getCellClassName = (cellRef: string) => {
    const classes: string[] = ["transition-colors"];
    
    if (appliedCellSet.has(cellRef)) classes.push("cell-applied");
    if (pendingCellSet.has(cellRef)) classes.push("cell-pending");
    if (formulaCellSet.has(cellRef)) classes.push("cell-formula");
    if (selectedCellSet.has(cellRef)) classes.push("ring-2 ring-primary ring-inset bg-primary/10");
    if (cellSelectionMode) classes.push("cursor-pointer hover:bg-accent");
    
    return classes.join(" ");
  };

  const formatCellValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === "") {
      return showEmptyPlaceholders ? "(empty)" : "";
    }
    return String(value);
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString("en-US");
  };

  const renderCellContent = (cellRef: string, cellValue: string | number | null, colIndex: number, rowIndex: number) => {
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
      const displayValue = result !== null ? result : "#ERROR";
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <span className="text-xs font-mono text-primary bg-primary/10 px-1 rounded shrink-0">
                  fx
                </span>
                <span className="font-medium text-primary truncate">
                  {typeof displayValue === "number" 
                    ? formatNumber(displayValue) 
                    : displayValue}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs">
              {formula}
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

    return <span className="truncate block">{formatCellValue(cellValue)}</span>;
  };

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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{data.fileName}</h3>
            <p className="text-xs text-muted-foreground">
              {data.rows.length.toLocaleString()} rows • {data.headers.length} columns
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data.sheets.length > 1 && (
            <Select value={data.currentSheet} onValueChange={onSheetChange}>
              <SelectTrigger className="w-[140px]">
                <Sheet className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.sheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {appliedCount > 0 && (
            <Badge variant="default" className="gap-1 bg-success text-success-foreground">
              <Check className="h-3 w-3" />
              {appliedCount} applied
            </Badge>
          )}

          {pendingCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-warning/20 text-warning-foreground">
              {pendingCount} pending
            </Badge>
          )}

          {formulaCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              {formulaCount} formula
            </Badge>
          )}

          <div className="flex items-center gap-2 pl-2">
            <span className="text-xs text-muted-foreground">Tampilkan kosong</span>
            <Switch checked={showEmptyPlaceholders} onCheckedChange={setShowEmptyPlaceholders} />
          </div>

          {cellSelectionMode && (
            <Badge variant="default" className="gap-1 animate-pulse">
              <MousePointer className="h-3 w-3" />
              Select cells...
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload("xlsx")}>
                Download as .xlsx
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("csv")}>
                Download as .csv
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            size="sm"
            onClick={onAddRow}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Tambah Baris
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddColumn}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Tambah Kolom
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.confirm("Clear file and discard all changes?")) {
                onClear();
              }
            }}
            aria-label="Clear file and start over"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selection mode hint */}
      {cellSelectionMode && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm text-primary flex items-center gap-2">
          <MousePointer className="h-4 w-4" />
          <span>Click cell to select • Shift+click for range • Ctrl+click for multi-select • Esc to cancel</span>
        </div>
      )}

      {/* Virtualized Table */}
      <div ref={parentRef} className="flex-1 overflow-auto min-h-0 min-w-0">
        <div className="min-w-max">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex border-b border-border">
            <div className="w-14 shrink-0 border-r border-border text-center font-semibold bg-muted px-2 py-2 sticky left-0 z-20">
              <span className="text-xs text-muted-foreground">#</span>
            </div>
            {data.headers.map((header, index) => (
              <div
                key={index}
                onMouseDown={() => handleColumnMouseDown(index)}
                onMouseEnter={() => handleColumnMouseEnter(index)}
                className="min-w-[80px] sm:min-w-[100px] md:min-w-[120px] max-w-[150px] sm:max-w-[180px] md:max-w-[200px] w-[100px] sm:w-[130px] md:w-[150px] shrink-0 border-r border-border font-semibold bg-muted px-2 sm:px-4 py-2 cursor-pointer hover:bg-muted/80 group relative select-none"
                style={{ cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M12 5v14M19 12l-7 7-7-7\'/></svg>") 8 8, s-resize' }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/70 group-hover:text-primary transition-colors">
                    {getColumnLetter(index)}
                  </span>
                  <span className="truncate font-medium text-foreground text-xs sm:text-sm">
                    {header || "(empty)"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Virtualized rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const row = data.rows[rowIndex];

              return (
                <div
                  key={virtualRow.key}
                  className={`flex absolute w-full border-b border-border ${
                    rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div 
                    onMouseDown={() => handleRowMouseDown(rowIndex)}
                    onMouseEnter={() => handleRowMouseEnter(rowIndex)}
                    className="w-14 shrink-0 border-r border-border text-center text-xs text-muted-foreground font-mono bg-muted/50 sticky left-0 flex items-center justify-center cursor-pointer hover:bg-muted/80 hover:text-primary transition-colors select-none"
                    style={{ cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M5 12h14M12 5l7 7-7 7\'/></svg>") 8 8, e-resize' }}
                  >
                    {rowIndex + 2}
                  </div>
                  {data.headers.map((_, colIndex) => {
                    const cellRef = createCellRef(colIndex, rowIndex);
                    const cellValue = row[colIndex];

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
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCellDoubleClick(colIndex, rowIndex);
                          } else if (e.key === " ") {
                            e.preventDefault();
                            handleCellClick(colIndex, rowIndex, e as any);
                          }
                        }}
                        className={`min-w-[80px] sm:min-w-[100px] md:min-w-[120px] max-w-[150px] sm:max-w-[180px] md:max-w-[200px] w-[100px] sm:w-[130px] md:w-[150px] shrink-0 border-r border-border px-2 sm:px-4 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${getCellClassName(cellRef)}`}
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
