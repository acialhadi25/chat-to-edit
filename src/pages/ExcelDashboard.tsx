import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useFileHistory } from "@/hooks/useFileHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import ExcelUpload from "@/components/dashboard/ExcelUpload";
import ExcelPreview from "@/components/dashboard/ExcelPreview";
import ChatInterface from "@/components/dashboard/ChatInterface";
import UndoRedoBar from "@/components/dashboard/UndoRedoBar";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { 
   ExcelData, 
   ChatMessage, 
   AIAction, 
   DataChange, 
   SheetData,
   createCellRef,
   getColumnIndex,
   parseRowRefs,
   parseColumnRefs,
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
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  
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

  const handleFileUpload = useCallback(async (data: Omit<ExcelData, "selectedCells" | "pendingChanges" | "formulas"> & { formulas?: Record<string, string> }) => {
     const uploadData = data as Omit<ExcelData, "selectedCells" | "pendingChanges" | "formulas"> & { 
       formulas?: Record<string, string>;
       allSheets?: { [sheetName: string]: SheetData };
     };
     const fullData: ExcelData = {
      ...data,
      formulas: data.formulas || {},
      selectedCells: [],
      pendingChanges: [],
       allSheets: uploadData.allSheets,
    };
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

  const handleClearFile = useCallback(() => {
    setExcelData(null);
    setMessages([]);
    clearHistory();
    setFileHistoryId(null);
    setChatOpen(false);
  }, [clearHistory]);

  const handleNewMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
    saveChatMessage(message, fileHistoryId, message.action?.formula);
  }, [fileHistoryId, saveChatMessage]);

  const handleCellSelect = useCallback((cellRefs: string[]) => {
    if (!excelData) return;
    setExcelData({
      ...excelData,
      selectedCells: cellRefs,
    });
  }, [excelData]);

  const handleCellEdit = useCallback((colIndex: number, rowIndex: number, newValue: string) => {
    if (!excelData) return;
    const beforeData = cloneExcelData(excelData);
    const newData = cloneExcelData(excelData);
    const parsed = isNaN(Number(newValue)) ? newValue : Number(newValue);
    newData.rows[rowIndex][colIndex] = newValue === "" ? null : parsed;
    const cellRef = createCellRef(colIndex, rowIndex);
    pushState(beforeData, newData, "EDIT_CELL", `Edited cell ${cellRef}`);
    setExcelData(newData);
  }, [excelData, pushState]);

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

    switch (action.type) {
      case "INSERT_FORMULA": {
        if (action.formula && action.target) {
           if (action.target.type === "cell") {
             const match = action.target.ref.match(/([A-Z]+)(\d+)/);
             if (match) {
               const colIndex = getColumnIndex(match[1]);
               const rowIndex = parseInt(match[2], 10) - 2;
               const { data: withFormula } = setCellFormula(newData, colIndex, rowIndex, action.formula);
               newData = withFormula;
               description = `Insert formula at ${action.target.ref}`;
             }
           } else if (action.newColumnName && action.target.type === "column") {
            const { data: withNewCol } = addColumn(newData, action.newColumnName);
            newData = withNewCol;
            const colIndex = newData.headers.length - 1;
             const { data: withFormula } = applyFormulaToColumn(newData, colIndex, action.formula);
            newData = withFormula;
            description = `Insert formula to column ${action.newColumnName}`;
          } else if (action.target.type === "column") {
             const colIndex = getColumnIndex(action.target.ref);
             const { data: withFormula } = applyFormulaToColumn(newData, colIndex, action.formula);
            newData = withFormula;
            description = `Insert formula to column ${action.target.ref}`;
          }
        }
        break;
      }
      case "EDIT_CELL":
      case "EDIT_COLUMN": {
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
        const { data: withoutEmpty, removedRows } = removeEmptyRows(newData);
        newData = withoutEmpty;
        const rowsPreview = removedRows.slice(0, 5).join(", ");
        const moreRows = removedRows.length > 5 ? `... (+${removedRows.length - 5} more)` : "";
        description = removedRows.length > 0 ? `Removed ${removedRows.length} empty rows (row ${rowsPreview}${moreRows})` : "No empty rows found";
        break;
      }
      case "SORT_DATA": {
        if (action.sortColumn && action.sortDirection) {
          const colIndex = getColumnIndex(action.sortColumn);
          const { data: sortedData } = sortData(newData, colIndex, action.sortDirection);
          newData = sortedData;
          description = `Sorted by column ${action.sortColumn} (${action.sortDirection === "asc" ? "A-Z" : "Z-A"})`;
        }
        break;
      }
      case "REMOVE_DUPLICATES": {
        const { data: dedupedData, removedCount } = removeDuplicates(newData);
        newData = dedupedData;
        description = `Removed ${removedCount} duplicate rows`;
        break;
      }
      case "FILTER_DATA": {
        if (action.target?.type === "column" && action.filterOperator) {
          const colIndex = getColumnIndex(action.target.ref);
          const { data: filteredData, removedCount } = filterData(newData, colIndex, action.filterOperator, action.filterValue);
          newData = filteredData;
          description = `Filter column ${action.target.ref}: ${removedCount} rows removed`;
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
          const { data: splitData, newColumnNames } = splitColumn(newData, colIndex, action.delimiter, action.maxParts || 2);
          newData = splitData;
          description = `Split column ${action.target.ref} into ${newColumnNames.join(", ")}`;
        }
        break;
      }
      case "MERGE_COLUMNS": {
        if (action.mergeColumns && action.mergeColumns.length > 0) {
          const { data: mergedData } = mergeColumns(newData, action.mergeColumns, action.separator || " ", action.newColumnName);
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
          description = `Added ${action.statisticsType.toUpperCase()} for column ${action.target.ref}`;
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
          // Add summary as new rows (simple implementation)
          toast({
            title: "Pivot Summary",
            description: summary.slice(0, 5).map(s => `${s.groupName}: ${s.value}`).join(", ") + 
              (summary.length > 5 ? `... and ${summary.length - 5} more` : ""),
          });
          return; // Don't modify data, just show summary
        }
        break;
      }
      default:
        return;
    }

    newData.pendingChanges = [];
    newData.selectedCells = [];
    const allChanges: DataChange[] = action.changes || [];
    pushState(beforeData, newData, action.type, description);
    setExcelData(newData);
    setAppliedChanges(allChanges);
    setTimeout(() => setAppliedChanges([]), 3000);
    toast({ title: "Applied!", description });
  }, [excelData, pushState, toast]);

  const handleSetPendingChanges = useCallback((changes: DataChange[]) => {
    if (!excelData) return;
    setExcelData({ ...excelData, pendingChanges: changes });
  }, [excelData]);

  const getDataAnalysis = useCallback(() => {
    if (!excelData) return null;
    return analyzeDataForCleansing(excelData);
  }, [excelData]);

  return (
    <div className="flex flex-1 flex-col h-full">
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
            <ExcelUpload onFileUpload={handleFileUpload} />
          ) : (
            <ExcelPreview
              data={excelData}
              onClear={handleClearFile}
              onCellSelect={handleCellSelect}
              onCellEdit={handleCellEdit}
              cellSelectionMode={cellSelectionMode}
              onSheetChange={handleSheetChange}
              appliedChanges={appliedChanges}
            />
          )}
        </div>

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
              excelData={excelData}
              messages={messages}
              onNewMessage={handleNewMessage}
              onApplyAction={handleApplyAction}
              onSetPendingChanges={handleSetPendingChanges}
              onRequestCellSelection={() => setCellSelectionMode(true)}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              getDataAnalysis={getDataAnalysis}
            />
          )}
        </div>

        {/* Chat Panel - Desktop Sidebar (Fixed) */}
        <div className="hidden lg:flex w-[320px] xl:w-[360px] flex-col flex-shrink-0 overflow-hidden">
          <ChatInterface
            excelData={excelData}
            messages={messages}
            onNewMessage={handleNewMessage}
            onApplyAction={handleApplyAction}
            onSetPendingChanges={handleSetPendingChanges}
            onRequestCellSelection={() => setCellSelectionMode(true)}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            getDataAnalysis={getDataAnalysis}
          />
        </div>
      </div>
    </div>
  );
};

export default ExcelDashboard;
