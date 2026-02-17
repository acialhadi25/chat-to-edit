import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useFileHistory } from "@/hooks/useFileHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { trackOperationSync } from "@/lib/performanceTracking";
import ExcelUpload from "@/components/dashboard/ExcelUpload";
import ExcelPreview from "@/components/dashboard/ExcelPreview";
import ChatInterface, { ChatInterfaceHandle } from "@/components/dashboard/ChatInterface";
import UndoRedoBar from "@/components/dashboard/UndoRedoBar";
import TemplateGallery from "@/components/dashboard/TemplateGallery";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, FileSpreadsheet } from "lucide-react";
import { ExcelTemplate } from "@/types/template";
import {
  ExcelData,
  ChatMessage,
  AIAction,
  DataChange,
  SheetData,
  createCellRef,
  getColumnIndex,
  getColumnLetter,
  parseRowRefs,
  parseColumnRefs,
  parseCellRef,
} from "@/types/excel";
import {
  applyChanges,
  applyFormulaToColumn,
  addColumn,
  deleteColumn,
  deleteRows,
  cloneExcelData,
  analyzeDataForCleansing,
  trimCells,
  findReplace,
  transformText,
  removeEmptyRows,
  setCellValue,
  setCellFormula,
  sortData,
  filterData,
  removeDuplicates,
  fillDown,
  splitColumn,
  mergeColumns,
  renameColumn,
  extractNumbers,
  formatNumbers,
  generateIds,
  calculateStatistics,
  concatenateColumns,
  createGroupSummary,
  addStatisticsRow,
  copyColumn,
  padSpareSpace,
  removeFormulas,
  clearCells,
  calculateDates,
  applyDataValidation,
  extractText,
} from "@/utils/excelOperations";
import { useToast } from "@/hooks/use-toast";

const ExcelDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cellSelectionMode, setCellSelectionMode] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState<DataChange[]>([]);
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const { saveFileRecord } = useFileHistory();
  const { saveChatMessage } = useChatHistory();

  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentDescription,
    getNextDescription,
    clearHistory,
  } = useUndoRedo(excelData);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Escape") {
        setCellSelectionMode(false);
        if (excelData) {
          setExcelData({
            ...excelData,
            selectedCells: [],
            pendingChanges: [],
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [excelData, canUndo, canRedo]);

  // Listen for external open-gallery events
  useEffect(() => {
    const handleOpenGallery = () => setShowTemplateGallery(true);
    window.addEventListener('open-template-gallery', handleOpenGallery);
    return () => window.removeEventListener('open-template-gallery', handleOpenGallery);
  }, []);

  const handleFileUpload = useCallback(async (data: Omit<ExcelData, "selectedCells" | "pendingChanges" | "formulas"> & { formulas?: Record<string, string> }) => {
    const uploadData = data as Omit<ExcelData, "selectedCells" | "pendingChanges" | "formulas"> & {
      formulas?: Record<string, string>;
      allSheets?: { [sheetName: string]: SheetData };
    };
    let fullData: ExcelData = {
      ...data,
      formulas: data.formulas || {},
      selectedCells: [],
      pendingChanges: [],
      allSheets: uploadData.allSheets,
    };
    const spareRows = 10;
    const spareCols = 10;
    fullData = padSpareSpace(fullData, spareRows, spareCols);
    if (fullData.allSheets) {
      const paddedAll: { [sheetName: string]: SheetData } = {};
      for (const [name, sheet] of Object.entries(fullData.allSheets)) {
        const headers = [...sheet.headers, ...Array(spareCols).fill("")];
        const rowsWithCols = sheet.rows.map((row) => [...row, ...Array(spareCols).fill(null)]);
        const finalRows = [...rowsWithCols];
        for (let i = 0; i < spareRows; i++) {
          finalRows.push(Array(headers.length).fill(null));
        }
        paddedAll[name] = { headers, rows: finalRows };
      }
      fullData = {
        ...fullData,
        headers: paddedAll[fullData.currentSheet]?.headers || fullData.headers,
        rows: paddedAll[fullData.currentSheet]?.rows || fullData.rows,
        allSheets: paddedAll,
      };
    }
    setExcelData(fullData);
    setMessages([]);
    clearHistory();
    setChatOpen(true);

    const record = await saveFileRecord(
      data.fileName,
      uploadData.allSheets ? Object.values(uploadData.allSheets)[0]?.rows.length ?? 0 : 0,
      data.sheets.length
    );
    if (record) {
      setFileHistoryId(record.id);
    }
  }, [clearHistory, saveFileRecord]);

  const handleAddRow = useCallback(() => {
    if (!excelData) return;
    const beforeData = cloneExcelData(excelData);
    const newData = cloneExcelData(excelData);
    const newRow = Array(newData.headers.length).fill(null);
    newData.rows.push(newRow);
    const newRowIndex = newData.rows.length - 1;
    pushState(beforeData, newData, "EDIT_ROW", `Added row ${newRowIndex + 2}`);
    setExcelData(newData);
    const cellRef = createCellRef(0, newRowIndex);
    setAppliedChanges([{ cellRef, before: null, after: null, type: "value" }]);
    setTimeout(() => setAppliedChanges([]), 1500);
    toast({ title: "Baris Ditambahkan", description: `Baris ${newRowIndex + 2} ditambahkan` });
  }, [excelData, pushState, toast]);

  const handleAddColumn = useCallback(() => {
    if (!excelData) return;
    const beforeData = cloneExcelData(excelData);
    let newData = cloneExcelData(excelData);
    const { data: withCol } = addColumn(newData, "");
    newData = withCol;
    const newColIndex = newData.headers.length - 1;
    pushState(beforeData, newData, "ADD_COLUMN", `Added column ${getColumnLetter(newColIndex)}`);
    setExcelData(newData);
    const cellRef = createCellRef(newColIndex, 0);
    setAppliedChanges([{ cellRef, before: null, after: null, type: "value" }]);
    setTimeout(() => setAppliedChanges([]), 1500);
    toast({ title: "Kolom Ditambahkan", description: `Kolom ${getColumnLetter(newColIndex)} ditambahkan` });
  }, [excelData, pushState, toast]);

  const handleClearFile = useCallback(() => {
    setExcelData(null);
    setMessages([]);
    clearHistory();
    setFileHistoryId(null);
    setChatOpen(false);
  }, [clearHistory]);

  const handleApplyTemplate = useCallback(async (template: ExcelTemplate) => {
    // Convert template to ExcelData format
    const excelDataFromTemplate: ExcelData = {
      fileName: `${template.name}.xlsx`,
      currentSheet: "Sheet1",
      sheets: ["Sheet1"],
      headers: template.headers,
      rows: template.sampleData,
      formulas: {},
      selectedCells: [],
      pendingChanges: [],
      cellStyles: {},
    };

    // Apply formulas if defined
    if (template.formulas) {
      template.formulas.forEach((formulaDef) => {
        template.sampleData.forEach((_, rowIndex) => {
          const actualRow = rowIndex + 2; // Excel rows: header=1, data starts at 2
          const formula = formulaDef.formula.replace(/\{row\}/g, String(actualRow));
          const cellRef = `${getColumnLetter(formulaDef.column)}${actualRow}`;
          excelDataFromTemplate.formulas[cellRef] = formula;
        });
      });
    }

    // Apply styles if defined (store for future export)
    if (template.styles) {
      template.styles.forEach((style) => {
        excelDataFromTemplate.cellStyles[style.cellRef] = {
          backgroundColor: style.backgroundColor,
          fontColor: style.fontColor,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          textAlign: style.textAlign,
          border: style.border,
        };
      });
    }

    // Pad with spare space
    const spareRows = 10;
    const spareCols = 10;
    const paddedData = padSpareSpace(excelDataFromTemplate, spareRows, spareCols);

    setExcelData(paddedData);
    setMessages([]);
    clearHistory();
    setChatOpen(true);

    // Save to file history
    const record = await saveFileRecord(
      template.name,
      template.sampleData.length,
      1
    );
    if (record) {
      setFileHistoryId(record.id);
    }

    toast({
      title: "Template Applied",
      description: `${template.name} loaded successfully`,
    });
  }, [clearHistory, saveFileRecord, toast]);

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    saveChatMessage(message, fileHistoryId, message.action?.formula);
  }, [fileHistoryId, saveChatMessage]);

  const handleUpdateMessageAction = useCallback((messageId: string, updatedAction: AIAction) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, action: updatedAction } : m));
  }, []);

  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [selectedCellRef, setSelectedCellRef] = useState("");
  const [excelDataAtEditStart, setExcelDataAtEditStart] = useState<ExcelData | null>(null);

  const handleFormulaBarChange = useCallback((newValue: string) => {
    setFormulaBarValue(newValue);
    if (!excelData || !selectedCellRef) return;

    // Set baseline for undo if this is the start of editing
    if (!excelDataAtEditStart) {
      setExcelDataAtEditStart(cloneExcelData(excelData));
    }

    const parsedRef = parseCellRef(selectedCellRef);
    if (!parsedRef) return;

    // Update the data in state but DON'T push to history yet
    setExcelData(prev => {
      if (!prev) return prev;
      const newData = cloneExcelData(prev);
      if (newValue.startsWith("=")) {
        const { data: withFormula } = setCellFormula(newData, parsedRef.col, parsedRef.row, newValue);
        return withFormula;
      } else {
        const parsedVal = isNaN(Number(newValue)) || newValue === "" ? newValue : Number(newValue);
        const { data: withValue } = setCellValue(newData, parsedRef.col, parsedRef.row, newValue === "" ? null : parsedVal);
        return withValue;
      }
    });
  }, [excelData, selectedCellRef, excelDataAtEditStart]);

  // Update formula bar value when selection changes
  useEffect(() => {
    if (excelData && excelData.selectedCells.length > 0) {
      const cellRef = excelData.selectedCells[0];
      setSelectedCellRef(cellRef);
      setExcelDataAtEditStart(null); // Reset edit baseline on new selection

      const formula = excelData.formulas[cellRef];
      if (formula) {
        setFormulaBarValue(formula);
      } else {
        const parsed = parseCellRef(cellRef);
        if (parsed) {
          const val = excelData.rows[parsed.row]?.[parsed.col];
          setFormulaBarValue(val !== null && val !== undefined ? String(val) : "");
        } else {
          setFormulaBarValue("");
        }
      }
    } else {
      setSelectedCellRef("");
      setFormulaBarValue("");
    }
  }, [excelData?.selectedCells, excelData?.rows, excelData?.formulas]);

  const handleCellSelect = useCallback((cellRefs: string[], isSelecting?: boolean) => {
    if (!excelData) return;
    setExcelData({
      ...excelData,
      selectedCells: cellRefs,
      isSelecting: isSelecting,
    });
  }, [excelData]);

  const handleCellEdit = useCallback((colIndex: number, rowIndex: number, newValue: string) => {
    if (!excelData) return;
    const beforeData = cloneExcelData(excelData);
    let newData = cloneExcelData(excelData);
    const cellRef = createCellRef(colIndex, rowIndex);

    if (newValue.startsWith("=")) {
      const { data: withFormula } = setCellFormula(newData, colIndex, rowIndex, newValue);
      newData = withFormula;
      pushState(beforeData, newData, "INSERT_FORMULA", `Set formula at ${cellRef}`);
    } else {
      const parsed = isNaN(Number(newValue)) || newValue === "" ? newValue : Number(newValue);
      const { data: withValue } = setCellValue(newData, colIndex, rowIndex, newValue === "" ? null : parsed);
      newData = withValue;
      pushState(beforeData, newData, "EDIT_CELL", `Edited cell ${cellRef}`);
    }
    setExcelData(newData);
  }, [excelData, pushState]);

  const handleFormulaCommit = useCallback(() => {
    if (!excelData || !selectedCellRef || !excelDataAtEditStart) {
      setExcelDataAtEditStart(null);
      return;
    }

    const newValue = formulaBarValue;
    const baseData = excelDataAtEditStart;
    const cellRef = selectedCellRef;

    // Only push to history if value actually changed from the START of editing
    const parsedRef = parseCellRef(cellRef)!;
    const originalValue = baseData.formulas[cellRef] || baseData.rows[parsedRef.row][parsedRef.col];

    if (String(originalValue) !== newValue) {
      const label = newValue.startsWith("=") ? "INSERT_FORMULA" : "EDIT_CELL";
      pushState(baseData, excelData, label, `Edited ${cellRef} via Formula Bar`);
    }

    setExcelDataAtEditStart(null);
  }, [excelData, selectedCellRef, excelDataAtEditStart, formulaBarValue, pushState]);

  const handleDeleteSelection = useCallback((mode: "clear" | "delete") => {
    if (!excelData || excelData.selectedCells.length === 0) return;

    const beforeData = cloneExcelData(excelData);
    let newData = cloneExcelData(excelData);
    let description = "";
    let affectedChanges: DataChange[] = [];

    // Determine what's selected
    const selectedRefs = excelData.selectedCells;
    const rowSet = new Set<number>();
    const colSet = new Set<number>();

    selectedRefs.forEach(ref => {
      const parsed = parseCellRef(ref);
      if (parsed) {
        rowSet.add(parsed.row);
        colSet.add(parsed.col);
      }
    });

    const isFullRowSelection = Array.from(rowSet).every(r =>
      Array.from({ length: excelData.headers.length }, (_, i) => createCellRef(i, r))
        .every(ref => selectedRefs.includes(ref))
    );

    const isFullColSelection = Array.from(colSet).every(c =>
      Array.from({ length: excelData.rows.length }, (_, i) => createCellRef(c, i))
        .every(ref => selectedRefs.includes(ref))
    );

    if (mode === "clear") {
      const { data: clearedData, changes } = clearCells(newData, selectedRefs);
      newData = clearedData;
      affectedChanges = changes;
      description = `Cleared ${selectedRefs.length} cells`;
    } else if (mode === "delete") {
      if (isFullRowSelection) {
        const rowIndices = Array.from(rowSet);
        const { data: deletedData, changes } = deleteRows(newData, rowIndices);
        newData = deletedData;
        affectedChanges = changes;
        description = `Deleted ${rowIndices.length} rows`;
      } else if (isFullColSelection) {
        const colIndices = Array.from(colSet).sort((a, b) => b - a);
        let currentData = newData;
        const allChanges: DataChange[] = [];

        for (const colIndex of colIndices) {
          const { data: nextData, changes } = deleteColumn(currentData, colIndex);
          currentData = nextData;
          allChanges.push(...changes);
        }

        newData = currentData;
        affectedChanges = allChanges;
        description = `Deleted ${colIndices.length} columns`;
      } else {
        // Fallback to clear if delete is not possible (e.g. partial selection)
        const { data: clearedData, changes } = clearCells(newData, selectedRefs);
        newData = clearedData;
        affectedChanges = changes;
        description = `Cleared ${selectedRefs.length} cells`;
      }
    }

    pushState(beforeData, newData, mode === "delete" ? "DELETE_ROW" : "EDIT_CELL", description);
    newData.selectedCells = [];
    setExcelData(newData);
    setAppliedChanges(affectedChanges);
    setTimeout(() => setAppliedChanges([]), 2000);
    toast({ title: mode === "clear" ? "Data Dihapus" : "Elemen Dihapus", description });
  }, [excelData, pushState, toast]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setExcelData(previousState);
      toast({ title: "Undo", description: getCurrentDescription() || "Change reverted" });
    }
  }, [undo, getCurrentDescription, toast]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setExcelData(nextState);
      toast({ title: "Redo", description: getNextDescription() || "Change restored" });
    }
  }, [redo, getNextDescription, toast]);

  const handleSheetChange = useCallback((sheetName: string) => {
    if (!excelData || !excelData.allSheets) return;
    const sheetData = excelData.allSheets[sheetName];
    if (!sheetData) return;
    setExcelData({
      ...excelData,
      currentSheet: sheetName,
      headers: sheetData.headers,
      rows: sheetData.rows,
      formulas: {},
      selectedCells: [],
      pendingChanges: [],
    });
    toast({ title: "Sheet Changed", description: `Showing "${sheetName}"` });
  }, [excelData, toast]);

  const handleApplyAction = useCallback(async (action: AIAction) => {
    if (!excelData) return;

    // Validate action before applying
    const { validateExcelAction, getValidationErrorMessage, logValidationResult } = await import("@/utils/actionValidation");
    const validation = validateExcelAction(action);

    if (!validation.isValid) {
      const errorMsg = getValidationErrorMessage(validation);
      logValidationResult(validation, "Excel Action");

      toast({
        title: "Invalid Action",
        description: errorMsg || "The AI response was in an unexpected format. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const beforeData = cloneExcelData(excelData);
    let newData = cloneExcelData(excelData);
    let description = "";
    const generatedChanges: DataChange[] = [];

    switch (action.type) {
      case "CREATE_CHART": {
        description = `Chart created: ${action.chartTitle || action.chartType}`;
        toast({
          title: "Chart Applied",
          description: `Visualisasi ${action.chartType} telah ditambahkan ke dashboard.`,
        });
        break;
      }
      case "CONDITIONAL_FORMAT": {
        if (action.target && action.conditionType && action.formatStyle) {
          const refs: string[] = [];
          if (action.target.type === "column") {
            const colIndex = getColumnIndex(action.target.ref);
            for (let r = 0; r < newData.rows.length; r++) {
              refs.push(createCellRef(colIndex, r));
            }
          } else if (action.target.type === "range") {
            const match = action.target.ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
            if (match) {
              const startCol = getColumnIndex(match[1]);
              const startRow = parseInt(match[2], 10) - 2;
              const endCol = getColumnIndex(match[3]);
              const endRow = parseInt(match[4], 10) - 2;
              for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                  refs.push(createCellRef(c, r));
                }
              }
            }
          } else if (action.target.type === "cell") {
            refs.push(action.target.ref);
          }

          let applyCount = 0;
          refs.forEach(ref => {
            const parsed = parseCellRef(ref);
            if (!parsed) return;
            const val = newData.rows[parsed.row][parsed.col];

            let match = false;
            const numVal = typeof val === "number" ? val : parseFloat(String(val));
            const condVal = action.conditionValues?.[0];
            const condNum = typeof condVal === "number" ? condVal : parseFloat(String(condVal));

            switch (action.conditionType) {
              case ">":
              case "greater_than": match = !isNaN(numVal) && !isNaN(condNum) && numVal > condNum; break;
              case "<":
              case "less_than": match = !isNaN(numVal) && !isNaN(condNum) && numVal < condNum; break;
              case ">=": match = !isNaN(numVal) && !isNaN(condNum) && numVal >= condNum; break;
              case "<=": match = !isNaN(numVal) && !isNaN(condNum) && numVal <= condNum; break;
              case "=":
              case "equal_to": match = String(val) === String(condVal); break;
              case "!=":
              case "not_equal": match = String(val) !== String(condVal); break;
              case "contains": match = String(val).toLowerCase().includes(String(condVal).toLowerCase()); break;
              case "not_contains": match = !String(val).toLowerCase().includes(String(condVal).toLowerCase()); break;
              case "empty": match = val === null || val === undefined || String(val).trim() === ""; break;
              case "not_empty": match = val !== null && val !== undefined && String(val).trim() !== ""; break;
              case "between": {
                const condVal2 = action.conditionValues?.[1];
                const condNum2 = typeof condVal2 === "number" ? condVal2 : parseFloat(String(condVal2));
                match = !isNaN(numVal) && !isNaN(condNum) && !isNaN(condNum2) && numVal >= condNum && numVal <= condNum2;
                break;
              }
            }

            if (match) {
              newData.cellStyles[ref] = { ...action.formatStyle };
              applyCount++;
            }
          });
          description = `Applied conditional formatting to ${applyCount} cells`;
        }
        break;
      }
      case "INSERT_FORMULA": {
        if (action.formula && action.target) {
          if (action.target.type === "cell") {
            const match = action.target.ref.match(/([A-Z]+)(\d+)/);
            if (match) {
              const colIndex = getColumnIndex(match[1]);
              const rowIndex = parseInt(match[2], 10) - 2;
              const interpolatedFormula = action.formula.replace(/\{row\}/g, String(rowIndex + 2));
              const { data: withFormula, change } = setCellFormula(newData, colIndex, rowIndex, interpolatedFormula);
              newData = withFormula;
              generatedChanges.push(change);
              description = `Insert formula at ${action.target.ref}`;
            }
          } else if (action.newColumnName && action.target.type === "column") {
            const { data: withNewCol } = addColumn(newData, action.newColumnName);
            newData = withNewCol;
            const colIndex = newData.headers.length - 1;
            const { data: withFormula, changes } = applyFormulaToColumn(newData, colIndex, action.formula);
            newData = withFormula;
            generatedChanges.push(...changes);
            description = `Insert formula to column ${action.newColumnName}`;
          } else if (action.target.type === "column") {
            const colIndex = getColumnIndex(action.target.ref);
            const { data: withFormula, changes } = applyFormulaToColumn(newData, colIndex, action.formula);
            newData = withFormula;
            generatedChanges.push(...changes);
            description = `Insert formula to column ${action.target.ref}`;
          } else if (action.target.type === "range") {
            const match = action.target.ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
            if (match) {
              const startCol = getColumnIndex(match[1]);
              const startRow = parseInt(match[2], 10) - 2;
              const endCol = getColumnIndex(match[3]);
              const endRow = parseInt(match[4], 10) - 2;
              for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                  const interpolatedFormula = action.formula.replace(/\{row\}/g, String(r + 2));
                  const { data: withFormula, change } = setCellFormula(newData, c, r, interpolatedFormula);
                  newData = withFormula;
                  generatedChanges.push(change);
                }
              }
              description = `Insert formula to range ${action.target.ref}`;
            }
          }
        } else if (action.formula && excelData.selectedCells.length > 0) {
          for (const ref of excelData.selectedCells) {
            const parsed = parseCellRef(ref);
            if (!parsed) continue;
            const interpolatedFormula = action.formula.replace(/\{row\}/g, String(parsed.row + 2));
            const { data: withFormula, change } = setCellFormula(newData, parsed.col, parsed.row, interpolatedFormula);
            newData = withFormula;
            generatedChanges.push(change);
          }
          description = `Insert formula to ${excelData.selectedCells.length} selected cells`;
        } else if (action.changes && action.changes.length > 0) {
          // Fallback to direct changes if provided (AI often does this for precision)
          newData = applyChanges(newData, action.changes);
          generatedChanges.push(...action.changes);
          description = `Insert formula: ${action.changes.length} cells updated`;
        }
        break;
      }
      case "REMOVE_FORMULA": {
        let targets: string[] = [];
        if (action.target?.type === "cell") {
          targets = [action.target.ref];
        } else if (action.target?.type === "range") {
          const match = action.target.ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
          if (match) {
            const startCol = getColumnIndex(match[1]);
            const startRow = parseInt(match[2], 10) - 2;
            const endCol = getColumnIndex(match[3]);
            const endRow = parseInt(match[4], 10) - 2;
            for (let r = startRow; r <= endRow; r++) {
              for (let c = startCol; c <= endCol; c++) {
                targets.push(createCellRef(c, r));
              }
            }
          }
        } else if (excelData.selectedCells.length > 0) {
          targets = excelData.selectedCells;
        }
        if (targets.length > 0) {
          const { data: withoutFormulas, changes } = removeFormulas(newData, targets);
          newData = withoutFormulas;
          generatedChanges.push(...changes);
          description = `Removed formulas from ${changes.length} cells`;
        }
        break;
      }
      case "EDIT_CELL":
      case "EDIT_COLUMN":
      case "EDIT_ROW": {
        if (action.changes && action.changes.length > 0) {
          newData = applyChanges(newData, action.changes);
          description = `${action.type}: ${action.changes.length} cells changed`;
        }
        break;
      }
      case "FIND_REPLACE": {
        if (action.findValue !== undefined) {
          let targetColumns: number[] | undefined;
          if (action.targetColumns) {
            targetColumns = action.targetColumns;
          } else if (action.target?.type === "column") {
            targetColumns = parseColumnRefs(action.target.ref);
          }
          const { data: replacedData, changes } = findReplace(newData, action.findValue, action.replaceValue || "", { columns: targetColumns, wholeCell: false });
          newData = replacedData;
          description = `Find/Replace: ${changes.length} cells changed`;
        } else if (action.changes && action.changes.length > 0) {
          newData = applyChanges(newData, action.changes);
          description = `Find/Replace: ${action.changes.length} cells changed`;
        }
        break;
      }
      case "DATA_CLEANSING": {
        let targetColumns: number[] | undefined;
        if (action.targetColumns) { targetColumns = action.targetColumns; } else if (action.target?.type === "column") { targetColumns = parseColumnRefs(action.target.ref); }
        const { data: cleanedData, changes } = trimCells(newData, targetColumns);
        newData = cleanedData;
        description = `Data Cleansing: ${changes.length} cells cleaned`;
        break;
      }
      case "DATA_TRANSFORM": {
        const transformType = action.transformType || "titlecase";
        let targetColumns: number[] | undefined;
        if (action.targetColumns) { targetColumns = action.targetColumns; } else if (action.target?.type === "column") { targetColumns = parseColumnRefs(action.target.ref); }
        const { data: transformedData, changes } = transformText(newData, transformType, targetColumns);
        newData = transformedData;
        description = `Transform: ${changes.length} cells changed to ${transformType}`;
        break;
      }
      case "REMOVE_EMPTY_ROWS": {
        const { data: withoutEmpty, removedRows } = trackOperationSync(
          'removeEmptyRows',
          () => removeEmptyRows(newData),
          { rowCount: newData.rows.length, columnCount: newData.headers.length }
        );
        newData = withoutEmpty;
        const rowsPreview = removedRows.slice(0, 5).join(", ");
        const moreRows = removedRows.length > 5 ? `... (+${removedRows.length - 5} more)` : "";
        description = removedRows.length > 0 ? `Removed ${removedRows.length} empty rows (row ${rowsPreview}${moreRows})` : "No empty rows found";
        break;
      }
      case "SORT_DATA": {
        if (action.sortColumn && action.sortDirection) {
          const colIndex = getColumnIndex(action.sortColumn);
          const { data: sortedData } = trackOperationSync(
            'sortData',
            () => sortData(newData, colIndex, action.sortDirection!),
            { rowCount: newData.rows.length, columnCount: newData.headers.length, sortDirection: action.sortDirection }
          );
          newData = sortedData;
          description = `Sorted by column ${action.sortColumn} (${action.sortDirection === "asc" ? "A-Z" : "Z-A"})`;
        }
        break;
      }
      case "REMOVE_DUPLICATES": {
        const { data: dedupedData, removedCount } = trackOperationSync(
          'removeDuplicates',
          () => removeDuplicates(newData),
          { rowCount: newData.rows.length, columnCount: newData.headers.length }
        );
        newData = dedupedData;
        description = `Removed ${removedCount} duplicate rows`;
        break;
      }
      case "FILTER_DATA": {
        if (action.filterOperator) {
          let colIndex: number;
          if (action.target?.type === "column") {
            colIndex = getColumnIndex(action.target.ref);
          } else if (action.target?.type === "range") {
            const colLetter = action.target.ref.match(/^([A-Z]+)/);
            colIndex = colLetter ? getColumnIndex(colLetter[1]) : 0;
          } else if (action.sortColumn) {
            colIndex = getColumnIndex(action.sortColumn);
          } else {
            colIndex = 0;
          }
          const { data: filteredData, removedCount } = trackOperationSync(
            'filterData',
            () => filterData(newData, colIndex, action.filterOperator!, action.filterValue),
            { rowCount: newData.rows.length, columnCount: newData.headers.length, operator: action.filterOperator }
          );
          newData = filteredData;
          description = `Filter: ${removedCount} rows removed`;
        }
        break;
      }
      case "FILL_DOWN": {
        if (action.target?.type === "column") {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: filledData, changes } = fillDown(newData, colIndex);
          newData = filledData;
          description = `Fill down ${changes.length} cells in column ${action.target.ref}`;
        }
        break;
      }
      case "DELETE_ROW": {
        if (action.target?.type === "row") {
          const rowIndices = parseRowRefs(action.target.ref);
          const { data: withoutRows } = deleteRows(newData, rowIndices);
          newData = withoutRows;
          description = `Deleted ${rowIndices.length} rows`;
        } else if (action.changes && action.changes.length > 0) {
          const rowSet = new Set<number>();
          action.changes.forEach(c => { const match = c.cellRef.match(/\d+/); if (match) rowSet.add(parseInt(match[0], 10) - 2); });
          const rowIndices = [...rowSet].filter(r => r >= 0);
          if (rowIndices.length > 0) {
            const { data: withoutRows } = deleteRows(newData, rowIndices);
            newData = withoutRows;
            description = `Deleted ${rowIndices.length} rows`;
          }
        }
        break;
      }
      case "DELETE_COLUMN": {
        if (action.target?.type === "column") {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: withoutCol } = deleteColumn(newData, colIndex);
          newData = withoutCol;
          description = `Deleted column ${action.target.ref}`;
        }
        break;
      }
      case "ADD_COLUMN": {
        if (action.newColumnName) {
          const { data: withNewCol } = addColumn(newData, action.newColumnName);
          newData = withNewCol;
          description = `Added column ${action.newColumnName}`;
        }
        break;
      }
      case "SPLIT_COLUMN": {
        if (action.target?.type === "column" && action.delimiter) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: splitData, newColumnNames } = trackOperationSync(
            'splitColumn',
            () => splitColumn(newData, colIndex, action.delimiter!, action.maxParts || 2),
            { rowCount: newData.rows.length, columnCount: newData.headers.length, delimiter: action.delimiter }
          );
          newData = splitData;
          description = `Split column ${action.target.ref} into ${newColumnNames.join(", ")}`;
        }
        break;
      }
      case "MERGE_COLUMNS": {
        if (action.mergeColumns && action.mergeColumns.length > 0) {
          const { data: mergedData } = trackOperationSync(
            'mergeColumns',
            () => mergeColumns(newData, action.mergeColumns!, action.separator || " ", action.newColumnName),
            { rowCount: newData.rows.length, columnCount: newData.headers.length, columnsToMerge: action.mergeColumns.length }
          );
          newData = mergedData;
          description = `Merged ${action.mergeColumns.length} columns into ${action.newColumnName || "new column"}`;
        }
        break;
      }
      case "RENAME_COLUMN": {
        if (action.target?.type === "column" && action.renameTo) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: renamedData, oldName } = renameColumn(newData, colIndex, action.renameTo);
          newData = renamedData;
          description = `Renamed column "${oldName}" to "${action.renameTo}"`;
        }
        break;
      }
      case "EXTRACT_NUMBER": {
        if (action.target?.type === "column") {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: extractedData, changes } = extractNumbers(newData, colIndex);
          newData = extractedData;
          description = `Extracted numbers from ${changes.length} cells in column ${action.target.ref}`;
        }
        break;
      }
      case "FORMAT_NUMBER": {
        if (action.target?.type === "column" && action.numberFormat) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: formattedData, changes } = formatNumbers(
            newData,
            colIndex,
            action.numberFormat,
            { symbol: action.currencySymbol || "$", decimals: 2 }
          );
          newData = formattedData;
          description = `Formatted ${changes.length} cells as ${action.numberFormat}`;
        }
        break;
      }
      case "GENERATE_ID": {
        const { data: withIds, changes } = generateIds(
          newData,
          action.idPrefix || "ID",
          action.idStartFrom || 1
        );
        newData = withIds;
        description = `Generated ${changes.length} unique IDs`;
        break;
      }
      case "DATE_CALCULATION": {
        if (action.target?.type === "column" && action.dateOperation) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: dateData, newColumnName } = calculateDates(
            newData,
            colIndex,
            action.dateOperation,
            typeof action.filterValue === 'number' ? action.filterValue : undefined
          );
          newData = dateData;
          description = `Calculated ${action.dateOperation} for column ${action.target.ref}`;
        }
        break;
      }
      case "DATA_VALIDATION": {
        if (action.target && action.validationType) {
          const refs: string[] = [];
          if (action.target.type === "column") {
            const colIndex = getColumnIndex(action.target.ref);
            for (let r = 0; r < newData.rows.length; r++) {
              refs.push(createCellRef(colIndex, r));
            }
          } else if (action.target.type === "range") {
            const match = action.target.ref.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
            if (match) {
              const startCol = getColumnIndex(match[1]);
              const startRow = parseInt(match[2], 10) - 2;
              const endCol = getColumnIndex(match[3]);
              const endRow = parseInt(match[4], 10) - 2;
              for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                  refs.push(createCellRef(c, r));
                }
              }
            }
          } else {
            refs.push(action.target.ref);
          }

          const { data: validatedData } = applyDataValidation(newData, refs, {
            type: action.validationType,
            values: action.validationOptions,
            criteria: action.validationCriteria
          });
          newData = validatedData;
          description = `Applied ${action.validationType} validation to ${refs.length} cells`;
        }
        break;
      }
      case "TEXT_EXTRACTION": {
        if (action.target?.type === "column" && action.extractionPattern) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: extractedData, newColumnName } = extractText(
            newData,
            colIndex,
            action.extractionPattern,
            action.extractionType || "regex"
          );
          newData = extractedData;
          description = `Extracted text from column ${action.target.ref} into ${newColumnName}`;
        }
        break;
      }
      case "CONCATENATE": {
        if (action.concatenateColumns && action.concatenateColumns.length > 0) {
          const { data: concatenatedData } = concatenateColumns(
            newData,
            action.concatenateColumns,
            action.concatenateSeparator || " ",
            action.newColumnName || "Combined"
          );
          newData = concatenatedData;
          description = `Created combined column "${action.newColumnName || "Combined"}"`;
        }
        break;
      }
      case "STATISTICS": {
        if (action.target?.type === "column" && action.statisticsType) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: withStats } = addStatisticsRow(newData, colIndex, action.statisticsType);
          newData = withStats;
          const lastRowIndex = newData.rows.length - 1;
          const endRowExcel = newData.rows.length;
          const op = action.statisticsType.toUpperCase();
          if (["SUM", "AVERAGE", "COUNT", "MIN", "MAX"].includes(op)) {
            const formula = `=${op}(${action.target.ref}2:${action.target.ref}${endRowExcel})`;
            const { data: withFormula, change } = setCellFormula(newData, colIndex, lastRowIndex, formula);
            newData = withFormula;
            generatedChanges.push(change);
            description = `Inserted ${op} formula at ${action.target.ref}${lastRowIndex + 2}`;
          } else {
            description = `Added ${action.statisticsType.toUpperCase()} for column ${action.target.ref}`;
          }
        }
        break;
      }
      case "PIVOT_SUMMARY": {
        if (action.groupByColumn !== undefined && action.aggregateColumn !== undefined) {
          const summary = createGroupSummary(
            newData,
            action.groupByColumn,
            action.aggregateColumn,
            action.statisticsType as "sum" | "average" | "count" | "min" | "max" || "sum"
          );

          // Add summary as new rows at the end of the sheet
          // Add 2 empty rows as separator
          newData.rows.push(new Array(newData.headers.length).fill(null));
          newData.rows.push(new Array(newData.headers.length).fill(null));

          const startRowIndex = newData.rows.length;
          const headerRow = new Array(newData.headers.length).fill(null);
          const groupHeader = newData.headers[action.groupByColumn];
          const aggHeader = newData.headers[action.aggregateColumn];
          const opName = (action.statisticsType || "sum").toUpperCase();

          headerRow[0] = `RINGKASAN: ${groupHeader}`;
          headerRow[1] = `${opName} DARI ${aggHeader}`;
          newData.rows.push(headerRow);

          // Apply styling to header row
          const headerRef1 = createCellRef(0, newData.rows.length - 1);
          const headerRef2 = createCellRef(1, newData.rows.length - 1);
          newData.cellStyles[headerRef1] = { fontWeight: "bold", backgroundColor: "#f3f4f6" };
          newData.cellStyles[headerRef2] = { fontWeight: "bold", backgroundColor: "#f3f4f6" };

          summary.forEach((s, idx) => {
            const summaryRow = new Array(newData.headers.length).fill(null);
            summaryRow[0] = s.groupName;
            summaryRow[1] = s.value;
            newData.rows.push(summaryRow);

            // Zebra striping for summary
            if (idx % 2 === 1) {
              const ref1 = createCellRef(0, newData.rows.length - 1);
              const ref2 = createCellRef(1, newData.rows.length - 1);
              newData.cellStyles[ref1] = { backgroundColor: "#f9fafb" };
              newData.cellStyles[ref2] = { backgroundColor: "#f9fafb" };
            }
          });

          description = `Ditambahkan ringkasan pivot untuk ${groupHeader}`;
          toast({
            title: "Ringkasan Pivot Diterapkan",
            description: `Tabel ringkasan telah ditambahkan di bagian bawah sheet.`,
          });
        }
        break;
      }
      case "COPY_COLUMN": {
        if (action.target?.type === "column") {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: copiedData } = copyColumn(newData, colIndex, action.newColumnName);
          newData = copiedData;
          description = `Copied column ${action.target.ref}`;
        }
        break;
      }
      case "DATA_AUDIT":
      case "INSIGHTS":
      case "INFO":
      case "CLARIFY":
        break;
      default:
        // Generic fallback for any other types
        break;
    }

    // Common cleanup for all handled actions
    newData.pendingChanges = [];
    newData.selectedCells = [];
    const allChanges: DataChange[] = [...(action.changes || []), ...generatedChanges];
    pushState(beforeData, newData, action.type, description);
    setExcelData(newData);

    // Sync allSheets with current sheet data after operation
    if (newData.allSheets && newData.currentSheet) {
      newData.allSheets[newData.currentSheet] = {
        headers: newData.headers,
        rows: newData.rows,
      };
    }
    setAppliedChanges(allChanges);
    setTimeout(() => setAppliedChanges([]), 3000);
    toast({ title: "Applied!", description });
  }, [excelData, pushState, toast]);

  const handleRunAudit = useCallback(() => {
    if (chatRef.current) {
      const technicalPrompt = `Lakukan audit kualitas data pada sheet ini. 
Cari outlier, inkonsistensi tipe, dan data yang hilang. 
Gunakan format JSON wajib berikut:
{
  "content": "Ringkasan temuan audit dalam bahasa Indonesia.",
  "action": {
    "type": "DATA_AUDIT",
    "auditReport": {
      "totalErrors": number,
      "outliers": [{ "cellRef": "A2", "value": "val", "reason": "outlier" }],
      "typeInconsistencies": [{ "cellRef": "B3", "expected": "number", "found": "string" }],
      "missingValues": [{ "cellRef": "C4", "column": "Nama" }],
      "suggestions": [
        { "id": "fix1", "description": "Hapus baris kosong", "action": { "type": "REMOVE_EMPTY_ROWS" } }
      ]
    }
  },
  "quickOptions": [
    {
      "id": "fix_all",
      "label": "Terapkan Perbaikan",
      "value": "Terapkan semua saran perbaikan",
      "variant": "success",
      "isApplyAction": true,
      "action": { "type": "REMOVE_EMPTY_ROWS" }
    }
  ]
} `;
      chatRef.current.sendMessage(technicalPrompt, "🔍 Melakukan Audit Kualitas Data...");
    }
  }, []);

  const handleRunInsights = useCallback(() => {
    if (chatRef.current) {
      const technicalPrompt = `Berikan wawasan bisnis dan analitik dari data ini. 
Analisis tren, soroti poin penting, dan temukan anomali. 
Gunakan format JSON wajib berikut:
{
  "content": "Deskripsi umum wawasan dalam bahasa Indonesia.",
  "action": {
    "type": "INSIGHTS",
    "insights": {
      "summary": "Ringkasan eksekutif",
      "highlights": [{ "text": "Poin penting", "type": "positive|negative|neutral" }],
      "trends": [{ "topic": "Penjualan", "direction": "up|down|stable", "description": "deskripsi" }],
      "anomalies": [{ "description": "anomali", "cellRefs": ["A1:B10"] }]
    }
  }
}`;
      chatRef.current.sendMessage(technicalPrompt, "📊 Menganalisis Wawasan Business...");
    }
  }, []);

  const handleSetPendingChanges = useCallback((changes: DataChange[]) => {
    if (!excelData) return;
    setExcelData({ ...excelData, pendingChanges: changes });
  }, [excelData]);

  const getDataAnalysis = useCallback(() => {
    if (!excelData) return null;
    return analyzeDataForCleansing(excelData);
  }, [excelData]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {excelData && (
        <UndoRedoBar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          undoDescription={getCurrentDescription()}
          redoDescription={getNextDescription()}
        />
      )}

      <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Preview/Upload Area */}
        <div className="flex flex-1 flex-col border-r border-border min-h-0 min-w-0 overflow-hidden">
          {!excelData ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Get Started</h2>
                <Button
                  onClick={() => setShowTemplateGallery(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Browse Templates
                </Button>
              </div>
              <ExcelUpload onFileUpload={handleFileUpload} />
            </div>
          ) : (
            <ExcelPreview
              data={excelData}
              onClear={handleClearFile}
              onCellSelect={handleCellSelect}
              onCellEdit={handleCellEdit}
              cellSelectionMode={cellSelectionMode}
              onSheetChange={handleSheetChange}
              appliedChanges={appliedChanges}
              onAddRow={handleAddRow}
              onAddColumn={handleAddColumn}
              onDeleteSelection={handleDeleteSelection}
              onRunAudit={handleRunAudit}
              onRunInsights={handleRunInsights}
              formulaBarValue={formulaBarValue}
              selectedCellRef={selectedCellRef}
              onFormulaBarChange={handleFormulaBarChange}
              onFormulaBarCommit={handleFormulaCommit}
            />
          )}
        </div>

        {/* Template Gallery Modal */}
        {showTemplateGallery && (
          <TemplateGallery
            onSelectTemplate={handleApplyTemplate}
            onClose={() => setShowTemplateGallery(false)}
          />
        )}

        {/* Mobile Chat Toggle Button */}
        {excelData && (
          <Button
            onClick={() => setChatOpen(!chatOpen)}
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg lg:hidden"
            style={{ bottom: "calc(1.5rem + max(0px, env(safe-area-inset-bottom)))" }}
          >
            {chatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </Button>
        )}

        {/* Chat Panel - Mobile Modal */}
        <div
          className={`
            fixed inset-0 z-40 bg-background lg:hidden
            flex w-full flex-col
            transition-transform duration-300 ease-in-out
            ${chatOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="AI Chat"
          aria-hidden={!chatOpen}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-medium text-foreground">AI Chat</span>
            <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {excelData && (
            <ChatInterface
              ref={chatRef}
              excelData={excelData}
              messages={messages}
              onNewMessage={handleNewMessage}
              onApplyAction={handleApplyAction}
              onSetPendingChanges={handleSetPendingChanges}
              onRequestCellSelection={() => setCellSelectionMode(true)}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              getDataAnalysis={getDataAnalysis}
              onUpdateAction={handleUpdateMessageAction}
            />
          )}
        </div>

        {/* Chat Panel - Desktop Sidebar (Fixed) */}
        <div className="hidden lg:flex w-[320px] xl:w-[360px] flex-col flex-shrink-0 overflow-hidden">
          <ChatInterface
            ref={chatRef}
            excelData={excelData}
            messages={messages}
            onNewMessage={handleNewMessage}
            onApplyAction={handleApplyAction}
            onSetPendingChanges={handleSetPendingChanges}
            onRequestCellSelection={() => setCellSelectionMode(true)}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            getDataAnalysis={getDataAnalysis}
            onUpdateAction={handleUpdateMessageAction}
          />
        </div>
      </div>
    </div>
  );
};

export default ExcelDashboard;
