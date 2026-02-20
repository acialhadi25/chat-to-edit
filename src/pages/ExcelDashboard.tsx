import { useState, useCallback, useRef, lazy, Suspense, useEffect } from 'react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useFileHistory } from '@/hooks/useFileHistory';
import { useChatHistory } from '@/hooks/useChatHistory';
import { usePersistentExcelState } from '@/hooks/usePersistentExcelState';
import ExcelUpload from '@/components/dashboard/ExcelUpload';
import ChatInterface, { ChatInterfaceHandle } from '@/components/dashboard/ChatInterface';
import TemplateGallery from '@/components/dashboard/TemplateGallery';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { MessageSquare, X, FileSpreadsheet, Wand2, Sparkles, Download, Loader2 } from 'lucide-react';
import { ExcelTemplate } from '@/types/template';
import { ExcelData, ChatMessage, AIAction, DataChange, XSpreadsheetSheet, createCellRef } from '@/types/excel';
import { analyzeDataForCleansing } from '@/utils/excelOperations';
import { applyChanges } from '@/utils/applyChanges';
import { useToast } from '@/hooks/use-toast';
import { validateExcelAction, getValidationErrorMessage } from '@/utils/actionValidation';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { ExcelPreviewHandle } from '@/components/dashboard/ExcelPreview';

// Lazy load ExcelPreview to reduce initial bundle size
const ExcelPreview = lazy(() => import('@/components/dashboard/ExcelPreview'));

// Loading fallback for ExcelPreview
const ExcelPreviewLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
      <p className="text-sm text-muted-foreground">Loading spreadsheet...</p>
    </div>
  </div>
);

const ExcelDashboard = () => {
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  
  // Use persistent state hook instead of regular useState
  const {
    excelData,
    setExcelData,
    messages,
    setMessages,
    fileHistoryId,
    setFileHistoryId,
    resetState,
    isRestored,
  } = usePersistentExcelState();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const excelPreviewRef = useRef<ExcelPreviewHandle>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const spreadsheetDataRef = useRef<XSpreadsheetSheet[] | null>(null);

  const { saveFileRecord } = useFileHistory();
  const { saveChatMessage } = useChatHistory();

  const {
    undo,
    redo,
    canUndo,
    canRedo,
    pushState,
    clearHistory,
  } = useUndoRedo(null);



  // Trigger FortuneSheet resize when sidebar state changes (left sidebar)
  useEffect(() => {
    if (!excelData) return;
    
    const triggerResize = () => {
      const luckysheet = (window as any).luckysheet;
      if (luckysheet && luckysheet.resize) {
        luckysheet.resize();
      }
      window.dispatchEvent(new Event('resize'));
    };

    requestAnimationFrame(() => {
      triggerResize();
      setTimeout(triggerResize, 10);
      setTimeout(triggerResize, 30);
      setTimeout(triggerResize, 60);
      setTimeout(triggerResize, 100);
      setTimeout(triggerResize, 150);
      setTimeout(triggerResize, 250);
    });
  }, [sidebarState, excelData]);

  // Trigger FortuneSheet resize when chatOpen changes (right sidebar)
  useEffect(() => {
    if (!excelData) return;
    
    const triggerResize = () => {
      const luckysheet = (window as any).luckysheet;
      if (luckysheet && luckysheet.resize) {
        luckysheet.resize();
      }
      window.dispatchEvent(new Event('resize'));
    };

    requestAnimationFrame(() => {
      triggerResize();
      setTimeout(triggerResize, 10);
      setTimeout(triggerResize, 30);
      setTimeout(triggerResize, 60);
      setTimeout(triggerResize, 100);
      setTimeout(triggerResize, 150);
      setTimeout(triggerResize, 250);
      setTimeout(triggerResize, 400);
    });
  }, [chatOpen, excelData]);

  const handleFileUpload = useCallback(
    async (data: Omit<ExcelData, 'selectedCells' | 'pendingChanges'>) => {
      const fullData: ExcelData = { ...data, selectedCells: [], pendingChanges: [] };
      setExcelData(fullData);
      pushState(fullData, fullData, 'INFO', 'Initial state');
      setMessages([]);
      // Keep chat open after upload
      const record = await saveFileRecord(data.fileName, data.rows.length, data.sheets.length);
      if (record) setFileHistoryId(record.id);
    },
    [pushState, saveFileRecord]
  );

  const handleClearFile = useCallback(() => {
    resetState(); // Clear persisted state from localStorage
    clearHistory();
    setChatOpen(false);
    
    toast({
      title: "File cleared",
      description: "Your Excel file and chat history have been cleared.",
    });
  }, [resetState, clearHistory, toast]);

  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      if (message.role === 'user' || (message.role === 'assistant' && message.action)) {
        saveChatMessage(message, fileHistoryId, message.action?.formula);
      }
    },
    [fileHistoryId, saveChatMessage]
  );

  const handleUpdateMessageAction = useCallback((messageId: string, updatedAction: AIAction) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, action: updatedAction } : m))
    );
  }, []);

  const handleSpreadsheetDataChange = useCallback((data: XSpreadsheetSheet[]) => {
    spreadsheetDataRef.current = data;
  }, []);

  const handleSetPendingChanges = useCallback((changes: DataChange[]) => {
    setExcelData((prev) => (prev ? { ...prev, pendingChanges: changes } : null));
  }, []);

  const handleApplyAction = useCallback(
    async (action: AIAction) => {
      console.log('handleApplyAction called with:', action);
      console.log('Action type:', action.type);
      console.log('Action params:', action.params);
      console.log('Action root level keys:', Object.keys(action));
      
      const currentData = excelData;
      if (!currentData) {
        console.error('No excel data available');
        return;
      }

      const validation = validateExcelAction(action);
      if (!validation.isValid) {
        console.error('Action validation failed:', validation);
        console.error('Validation errors:', validation.errors);
        console.error('Full action object:', JSON.stringify(action, null, 2));
        toast({
          title: 'Invalid Action',
          description:
            getValidationErrorMessage(validation) || 'AI response had an unexpected format.',
          variant: 'destructive',
        });
        handleSetPendingChanges([]);
        return;
      }

      console.log('Action validated, generating changes...');

      // Generate changes if not present
      let actionWithChanges = action;
      if (!action.changes || action.changes.length === 0) {
        // Import generateChanges dynamically
        const { generateChangesFromAction } = await import('@/utils/excelOperations');
        const generatedChanges = generateChangesFromAction(currentData, action);
        console.log('Generated changes:', generatedChanges);
        actionWithChanges = { ...action, changes: generatedChanges };
      } else {
        console.log('Using existing changes:', action.changes);
      }

      if (!actionWithChanges.changes || actionWithChanges.changes.length === 0) {
        console.warn('No changes to apply');
        toast({
          title: 'No Changes',
          description: 'This action does not produce any changes.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Applying action to FortuneSheet via API...');
      // Apply action to FortuneSheet using proper API
      const applied = excelPreviewRef.current?.applyAction(actionWithChanges);
      
      if (applied) {
        console.log('✅ Action applied to FortuneSheet successfully');
      } else {
        console.warn('⚠️ Action not fully applied to FortuneSheet, will sync via state');
      }

      console.log('Applying changes to React state...');
      // Also apply to React state for undo/redo and persistence
      const { data: newData, description } = applyChanges(currentData, actionWithChanges.changes || []);

      setExcelData(newData);
      pushState(currentData, newData, 'EDIT_CELL', description);
      
      console.log('Action applied successfully:', description);
      toast({ title: 'Action Applied!', description });

      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.action?.id === action.id) {
        handleUpdateMessageAction(lastMessage.id, { ...actionWithChanges, status: 'applied' });
      }

      handleSetPendingChanges([]);
    },
    [excelData, messages, pushState, toast, handleUpdateMessageAction, handleSetPendingChanges]
  );

  const handleRejectAction = (actionId: string) => {
    const messageToUpdate = messages.find((m) => m.action?.id === actionId);
    if (messageToUpdate && messageToUpdate.action) {
      handleUpdateMessageAction(messageToUpdate.id, {
        ...messageToUpdate.action,
        status: 'rejected',
      });
    }
    handleSetPendingChanges([]);
  };

  const handleRunAudit = useCallback(
    () => chatRef.current?.sendMessage('Run a data quality audit on the current sheet.'),
    []
  );
  const handleRunInsights = useCallback(
    () => chatRef.current?.sendMessage('Generate business insights from this data.'),
    []
  );
  const getDataAnalysis = useCallback(
    (): string[] | null => (excelData ? analyzeDataForCleansing(excelData) : null),
    [excelData]
  );

  const handleApplyTemplate = async (template: ExcelTemplate) => {
    const excelDataFromTemplate: ExcelData = {
      fileName: `${template.name}.xlsx`,
      currentSheet: 'Sheet1',
      sheets: ['Sheet1'],
      headers: template.headers,
      rows: template.sampleData,
      formulas: {},
      selectedCells: [],
      pendingChanges: [],
      cellStyles: {},
    };
    const fullData: ExcelData = { ...excelDataFromTemplate, selectedCells: [], pendingChanges: [] };
    setExcelData(fullData);
    pushState(fullData, fullData, 'INFO', `Template loaded: ${template.name}`);
    setMessages([]);
    // Keep chat open
    const record = await saveFileRecord(
      fullData.fileName,
      fullData.rows.length,
      fullData.sheets.length
    );
    if (record) setFileHistoryId(record.id);
  };

  const handleDownload = useCallback(async () => {
    if (!excelData) return;

    try {
      console.log('Starting Excel download...');
      
      // Get current data from FortuneSheet using API
      const fortuneSheetData = excelPreviewRef.current?.getData();
      console.log('FortuneSheet data:', fortuneSheetData);
      
      // Extract formulas and styles from FortuneSheet OR use excelData as fallback
      let formulas: { [key: string]: string } = {};
      let cellStyles: { [key: string]: any } = {};
      
      if (fortuneSheetData && typeof fortuneSheetData === 'object' && 'formulas' in fortuneSheetData) {
        console.log('Using extracted FortuneSheet data');
        formulas = fortuneSheetData.formulas || {};
        cellStyles = fortuneSheetData.cellStyles || {};
      } else {
        console.log('FortuneSheet data not available, using excelData fallback');
        formulas = { ...excelData.formulas };
        cellStyles = { ...excelData.cellStyles };
      }
      
      console.log('Extracted formulas:', formulas);
      console.log('Extracted cellStyles:', cellStyles);
      
      // Create workbook with ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(excelData.currentSheet || 'Sheet1');
      
      // Define border style
      const thinBorder = {
        top: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } }
      };
      
      // Add headers with styling
      const headerRow = worksheet.addRow(excelData.headers);
      headerRow.eachCell((cell, colNumber) => {
        // Check if header has custom style from FortuneSheet
        const headerStyleRef = `HEADER_${colNumber - 1}`;
        const headerStyle = cellStyles[headerStyleRef];
        
        if (headerStyle?.bgcolor) {
          const bgColor = 'FF' + headerStyle.bgcolor.replace('#', '');
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
        } else {
          // Default header style
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8E8E8' }
          };
        }
        
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder;
      });
      
      console.log('Header row added with styling');
      
      // Add data rows
      excelData.rows.forEach((row, rowIdx) => {
        const excelRow = worksheet.addRow(row);
        
        // Apply styling to each cell
        excelRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          // Apply border
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle' };
          
          // Apply conditional formatting colors
          const cellRef = createCellRef(colNumber - 1, rowIdx);
          const style = cellStyles[cellRef];
          
          if (style?.bgcolor) {
            const bgColor = 'FF' + style.bgcolor.replace('#', '');
            console.log(`Applying bgcolor to ${cellRef}: ${bgColor}`);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor }
            };
          }
          
          if (style?.color) {
            const textColor = 'FF' + style.color.replace('#', '');
            console.log(`Applying text color to ${cellRef}: ${textColor}`);
            cell.font = {
              color: { argb: textColor }
            };
          }
          
          if (style?.font?.bold) {
            cell.font = { ...cell.font, bold: true };
          }
          
          // Apply formula
          const formula = formulas[cellRef];
          if (formula) {
            const formulaStr = formula.startsWith('=') ? formula.substring(1) : formula;
            console.log(`Applying formula to ${cellRef}: ${formulaStr}`);
            cell.value = { formula: formulaStr };
          }
        });
      });
      
      console.log('All rows added with styling');
      
      // Set column widths
      if (excelData.columnWidths) {
        excelData.headers.forEach((_, idx) => {
          const width = (excelData.columnWidths?.[idx] || 120) / 10;
          worksheet.getColumn(idx + 1).width = width;
        });
      }
      
      // Generate filename
      const fileName = excelData.fileName.replace(/\.[^/.]+$/, '') + '_modified.xlsx';
      
      console.log('Writing Excel file...');
      
      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      console.log('Excel file downloaded successfully');
      
      toast({
        title: 'Download Successful!',
        description: `${fileName} has been downloaded.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'An error occurred while creating the file.',
      });
    }
  }, [excelData, toast]);

  return (
    <div className={`grid h-full w-full overflow-hidden ${chatOpen && excelData ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'}`}>
      <div className="flex flex-col min-h-0 overflow-hidden">
        {!excelData ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden lg:flex" />
                <h2 className="text-lg font-semibold">Get Started</h2>
              </div>
              <Button
                onClick={() => setShowTemplateGallery(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Browse Templates
              </Button>
            </div>
            <ExcelUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <>
            <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-card">
              <SidebarTrigger className="hidden lg:flex" />
              <Button variant="outline" size="sm" onClick={handleRunAudit} className="h-8 gap-2">
                <Wand2 className="h-3.5 w-3.5" /> Audit Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunInsights}
                className="h-8 gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" /> Insights
              </Button>
              <div className="flex-grow" />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChatOpen(!chatOpen)} 
                className="h-8 gap-2"
              >
                <MessageSquare className="h-3.5 w-3.5" /> {chatOpen ? 'Hide' : 'Show'} Chat
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleDownload} 
                className="h-8 gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearFile} className="h-8 gap-2">
                <X className="h-3.5 w-3.5" /> Start Over
              </Button>
            </div>
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <Suspense fallback={<ExcelPreviewLoader />}>
                <ExcelPreview 
                  ref={excelPreviewRef}
                  data={excelData} 
                  onDataChange={handleSpreadsheetDataChange} 
                />
              </Suspense>
            </div>
          </>
        )}
      </div>

      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={(template) => {
            handleApplyTemplate(template);
            setShowTemplateGallery(false);
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* Chat Sidebar - Collapsible like left sidebar */}
      {excelData && chatOpen && (
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col border-l border-border bg-card shrink-0 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Ready to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatInterface
              ref={chatRef}
              excelData={excelData}
              messages={messages}
              onNewMessage={handleNewMessage}
              onApplyAction={handleApplyAction}
              onRejectAction={handleRejectAction}
              onSetPendingChanges={handleSetPendingChanges}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              getDataAnalysis={getDataAnalysis}
              onUpdateAction={handleUpdateMessageAction}
              onUndo={undo}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelDashboard;
