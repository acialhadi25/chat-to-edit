import { useState, useCallback, useRef } from 'react';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useFileHistory } from '@/hooks/useFileHistory';
import { useChatHistory } from '@/hooks/useChatHistory';
import ExcelUpload from '@/components/dashboard/ExcelUpload';
import ExcelPreview, { ExcelPreviewHandle } from '@/components/dashboard/ExcelPreview';
import ChatInterface, { ChatInterfaceHandle } from '@/components/dashboard/ChatInterface';
import UndoRedoBar from '@/components/dashboard/UndoRedoBar';
import TemplateGallery from '@/components/dashboard/TemplateGallery';
import CreateTemplateModal from '@/components/dashboard/CreateTemplateModal';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, FileSpreadsheet, Save, Wand2, Sparkles } from 'lucide-react';
import { ExcelTemplate } from '@/types/template';
import { ExcelData, ChatMessage, AIAction, DataChange, XSpreadsheetSheet } from '@/types/excel';
import { analyzeDataForCleansing } from '@/utils/excelOperations';
import { applyChanges } from '@/utils/applyChanges';
import { useToast } from '@/hooks/use-toast';
import { convertXlsxToExcelData } from '@/utils/xlsxConverter';
import { validateExcelAction, getValidationErrorMessage } from '@/utils/actionValidation';

const ExcelDashboard = () => {
  const { toast } = useToast();
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatRef = useRef<ChatInterfaceHandle>(null);
  const excelPreviewRef = useRef<ExcelPreviewHandle>(null);
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const spreadsheetDataRef = useRef<XSpreadsheetSheet[] | null>(null);

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
  } = useUndoRedo<ExcelData>();

  const handleFileUpload = useCallback(
    async (data: Omit<ExcelData, 'selectedCells' | 'pendingChanges'>) => {
      const fullData: ExcelData = { ...data, selectedCells: [], pendingChanges: [] };
      setExcelData(fullData);
      pushState(fullData, 'Initial state');
      setMessages([]);
      setChatOpen(true);
      const record = await saveFileRecord(data.fileName, data.rows.length, data.sheets.length);
      if (record) setFileHistoryId(record.id);
    },
    [pushState, saveFileRecord]
  );

  const handleClearFile = useCallback(() => {
    setExcelData(null);
    setMessages([]);
    clearHistory();
    setFileHistoryId(null);
    setChatOpen(false);
  }, [clearHistory]);

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

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) setExcelData(previousState);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) setExcelData(nextState);
  }, [redo]);

  const handleApplyAction = useCallback(
    async (action: AIAction) => {
      const currentData = excelData;
      if (!currentData) return;

      const validation = validateExcelAction(action);
      if (!validation.isValid) {
        toast({
          title: 'Invalid Action',
          description:
            getValidationErrorMessage(validation) || 'AI response had an unexpected format.',
          variant: 'destructive',
        });
        handleSetPendingChanges([]);
        return;
      }

      // Apply action directly to FortuneSheet via imperative API
      excelPreviewRef.current?.applyAction(action);

      // Get updated data from FortuneSheet
      const updatedSheetData = excelPreviewRef.current?.getData();
      
      // Also apply to React state for undo/redo
      const { data: newData, description } = applyChanges(currentData, action.changes || []);

      setExcelData(newData);
      pushState(newData, description);
      toast({ title: 'Action Applied!', description });

      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.action?.id === action.id) {
        handleUpdateMessageAction(lastMessage.id, { ...action, status: 'applied' });
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
    (): Record<string, unknown> | null => (excelData ? analyzeDataForCleansing(excelData) : null),
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
    pushState(fullData, `Template loaded: ${template.name}`);
    setMessages([]);
    setChatOpen(true);
    const record = await saveFileRecord(
      fullData.fileName,
      fullData.rows.length,
      fullData.sheets.length
    );
    if (record) setFileHistoryId(record.id);
  };

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
        <div className="flex flex-1 flex-col border-r border-border min-h-0 min-w-0">
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
                  <FileSpreadsheet className="h-4 w-4" /> Browse Templates
                </Button>
              </div>
              <ExcelUpload onFileUpload={handleFileUpload} />
            </div>
          ) : (
            <>
              <div className="p-2 border-b flex items-center gap-2 flex-wrap bg-card">
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
                  onClick={() => setShowCreateTemplate(true)}
                  className="h-8 gap-2"
                >
                  <Save className="h-3.5 w-3.5" /> Save as Template
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearFile} className="h-8 gap-2">
                  <X className="h-3.5 w-3.5" /> Start Over
                </Button>
              </div>
              <div className="flex-1 relative min-h-0">
                <ExcelPreview 
                  ref={excelPreviewRef}
                  data={excelData} 
                  onDataChange={handleSpreadsheetDataChange} 
                />
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
        {excelData && (
          <CreateTemplateModal
            open={showCreateTemplate}
            onOpenChange={setShowCreateTemplate}
            currentExcelData={excelData}
          />
        )}

        <div
          className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:static lg:flex w-full lg:w-[320px] xl:w-[360px] flex-col shrink-0 transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        >
          {excelData && (
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
            />
          )}
        </div>
        {excelData && (
          <Button
            onClick={() => setChatOpen(!chatOpen)}
            size="icon"
            className="fixed lg:hidden bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          >
            <MessageSquare />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExcelDashboard;
