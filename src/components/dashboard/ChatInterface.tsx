import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Check,
  Copy,
  X,
  MousePointer2,
  Search,
  XCircle,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ChatMessage,
  ExcelData,
  AIAction,
  QuickOption,
  DataChange,
  getColumnIndex,
} from '@/types/excel';
import { useToast } from '@/hooks/use-toast';
import { streamChat } from '@/utils/streamChat';
import { parseAIResponse, logParseResult } from '@/utils/jsonParser';
import QuickActionButtons from './QuickActionButtons';
import ActionPreview from './ActionPreview';
import ChartPreview from './ChartPreview';
import DataSummaryPreview from './DataSummaryPreview';
import ConditionalFormatPreview from './ConditionalFormatPreview';
import AuditReport from './AuditReport';
import InsightSummary from './InsightSummary';
import MarkdownContent from './MarkdownContent';
import ExcelPromptExamples from './ExcelPromptExamples';

interface ChatInterfaceProps {
  excelData: ExcelData | null;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onApplyAction: (action: AIAction) => void;
  onSetPendingChanges: (changes: DataChange[]) => void;
  onRequestCellSelection: () => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  getDataAnalysis: () => {
    emptyRows: number[];
    cellsWithExtraSpaces: { cellRef: string; value: string }[];
    duplicateRows: number[][];
    totalCells: number;
    emptyCells: number;
  } | null;
  onUpdateAction: (messageId: string, updatedAction: AIAction) => void;
}

export interface ChatInterfaceHandle {
  sendMessage: (text: string, displayText?: string) => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
  (
    {
      excelData,
      messages,
      onNewMessage,
      onApplyAction,
      onSetPendingChanges,
      onRequestCellSelection,
      isProcessing,
      setIsProcessing,
      getDataAnalysis,
      onUpdateAction,
    },
    ref
  ) => {
    const [input, setInput] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [autoInputSelection, setAutoInputSelection] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const wasSelectingRef = useRef<boolean>(false);
    const lastSelectedCellsRef = useRef<string[]>([]);

    useEffect(() => {
      if (!excelData) return;
      const isSelecting = !!excelData.isSelecting;
      const sel = excelData.selectedCells;

      const selectionFinished = wasSelectingRef.current && !isSelecting;
      const selectionChangedWhileIdle =
        !isSelecting && JSON.stringify(sel) !== JSON.stringify(lastSelectedCellsRef.current);

      if (
        autoInputSelection &&
        (selectionFinished || selectionChangedWhileIdle) &&
        sel.length > 0
      ) {
        const toIndex = (ref: string) => {
          const m = ref.match(/^([A-Z]+)(\d+)$/i);
          if (!m) return null;
          return {
            col: getColumnIndex(m[1].toUpperCase()),
            row: parseInt(m[2], 10) - 2,
            excelRow: parseInt(m[2], 10),
          };
        };
        const indices = sel.map(toIndex).filter(Boolean) as {
          col: number;
          row: number;
          excelRow: number;
        }[];
        if (indices.length > 0) {
          const minCol = Math.min(...indices.map((i) => i.col));
          const maxCol = Math.max(...indices.map((i) => i.col));
          const minRow = Math.min(...indices.map((i) => i.row));
          const maxRow = Math.max(...indices.map((i) => i.row));

          const getLetter = (col: number) => {
            let letter = '';
            let n = col;
            while (n >= 0) {
              letter = String.fromCharCode(65 + (n % 26)) + letter;
              n = Math.floor(n / 26) - 1;
            }
            return letter;
          };

          const startLetter = getLetter(minCol);
          const endLetter = getLetter(maxCol);
          const rangeRef = `${startLetter}${minRow + 2}:${endLetter}${maxRow + 2}`;
          const refToInsert = sel.length === 1 ? `${startLetter}${minRow + 2}` : rangeRef;
          setInput((prev) => (prev.trim() ? `${prev} ${refToInsert}` : refToInsert));
        }
      }

      wasSelectingRef.current = isSelecting;
      lastSelectedCellsRef.current = sel;
    }, [excelData, autoInputSelection]);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, streamingContent]);

    const sendMessage = useCallback(
      async (messageText?: string, displayText?: string) => {
        const text = messageText || input.trim();
        const visibleText = displayText || text;
        if (!text || isProcessing) return;

        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: visibleText,
          timestamp: new Date(),
        };

        onNewMessage(userMessage);
        setInput('');
        setIsProcessing(true);
        setIsStreaming(true);
        setStreamingContent('');

        const dataAnalysis = getDataAnalysis();
        const uniqueValuesPerColumn: Record<string, string[]> = {};
        if (excelData) {
          excelData.headers.forEach((header, colIdx) => {
            const uniqueVals = new Set<string>();
            for (const row of excelData.rows) {
              const val = row[colIdx];
              if (val !== null && val !== undefined && String(val).trim() !== '') {
                uniqueVals.add(String(val));
                if (uniqueVals.size >= 10) break;
              }
            }
            if (uniqueVals.size > 0 && uniqueVals.size <= 50) {
              uniqueValuesPerColumn[header] = Array.from(uniqueVals);
            }
          });
        }

        const context = excelData
          ? {
              fileName: excelData.fileName,
              headers: excelData.headers,
              sampleRows: excelData.rows.slice(0, 10),
              totalRows: excelData.rows.length,
              existingFormulas: excelData.formulas,
              selectedCells: excelData.selectedCells,
              dataAnalysis,
              uniqueValuesPerColumn,
            }
          : null;

        const allMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: text },
        ];

        await streamChat({
          messages: allMessages,
          excelContext: context,
          onDelta: (chunk) => setStreamingContent((prev) => prev + chunk),
          onDone: (fullText) => {
            setIsStreaming(false);
            setStreamingContent('');
            const parseResult = parseAIResponse(fullText, fullText);
            logParseResult(parseResult, 'Excel Chat');

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: parseResult.data?.content || fullText,
              action: parseResult.data?.action
                ? ({ ...parseResult.data.action, status: 'pending' as const } as AIAction)
                : undefined,
              quickOptions: parseResult.data?.quickOptions?.map((opt: any) => ({
                id: opt.id || crypto.randomUUID(),
                label: opt.label,
                value: opt.value,
                variant: opt.variant || 'default',
                action: opt.action,
                isApplyAction: opt.isApplyAction,
              })) as QuickOption[] | undefined,
              timestamp: new Date(),
            };

            onNewMessage(assistantMessage);
            if (parseResult.data?.action?.changes && parseResult.data.action.changes.length > 0) {
              onSetPendingChanges(parseResult.data.action.changes);
            }
            setIsProcessing(false);
          },
          onError: async (error, status) => {
            setIsStreaming(false);
            setStreamingContent('');
            setIsProcessing(false);
            const { mapAIError, formatErrorForToast } = await import('@/utils/errorMessages');
            const errorResponse = mapAIError(status, error, 'Excel Chat');
            toast({ ...formatErrorForToast(errorResponse) });
          },
        });
      },
      [
        input,
        isProcessing,
        excelData,
        messages,
        onNewMessage,
        onSetPendingChanges,
        setIsProcessing,
        getDataAnalysis,
        toast,
      ]
    );

    // Expose sendMessage to parent
    useImperativeHandle(ref, () => ({
      sendMessage: (text: string, displayText?: string) => {
        sendMessage(text, displayText);
      },
    }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    const handleQuickOption = (option: QuickOption) => {
      // If the option has its own action, use it
      if (option.action) {
        onApplyAction(option.action);

        // Track that this specific option has been applied
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.action) {
          const currentIds = lastMsg.action.appliedActionIds || [];
          if (!currentIds.includes(option.id)) {
            onUpdateAction(lastMsg.id, {
              ...lastMsg.action,
              appliedActionIds: [...currentIds, option.id],
            });
          }
        }
        return;
      }

      // SMART FALLBACK: If this looks like an "Apply" button and we have a pending root action
      // Many AIs put the action at the root but label the button "Terapkan" or "Apply"
      const lastMsg = messages[messages.length - 1];
      const isApplyLabel =
        option.label.toLowerCase().includes('terapkan') ||
        option.label.toLowerCase().includes('apply') ||
        option.isApplyAction;

      if (lastMsg?.action?.status === 'pending' && isApplyLabel) {
        onApplyAction(lastMsg.action);

        // Track as applied
        const currentIds = lastMsg.action.appliedActionIds || [];
        if (!currentIds.includes(option.id)) {
          onUpdateAction(lastMsg.id, {
            ...lastMsg.action,
            appliedActionIds: [...currentIds, option.id],
          });
        }
        return;
      }

      // Default: just send the message
      sendMessage(option.value);
    };

    const handleApplyAction = (action: AIAction) => {
      onApplyAction(action);
    };

    const handleRejectAction = () => {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.action) {
        onUpdateAction(lastMsg.id, {
          ...lastMsg.action,
          status: 'rejected',
        });
      }
    };

    const copyFormula = (formula: string) => {
      navigator.clipboard.writeText(formula);
      toast({ title: 'Formula copied!', description: 'Formula has been copied to clipboard' });
    };

    // Filter messages based on search query
    const filteredMessages = searchQuery.trim()
      ? messages.filter((message) =>
          message.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    // Helper function to highlight search terms in text
    const highlightSearchTerm = (text: string, query: string) => {
      if (!query.trim()) return text;

      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return parts
        .map((part, index) => {
          if (regex.test(part)) {
            return `<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">${part}</mark>`;
          }
          return part;
        })
        .join('');
    };

    return (
      <div className="flex h-full flex-col border-l border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {excelData ? 'Ready to help edit your Excel' : 'Upload a file to start'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MousePointer2 className="h-4 w-4 text-primary" />
            <Label htmlFor="auto-selection" className="text-xs font-medium cursor-pointer">
              Auto-input selection
            </Label>
          </div>
          <Switch
            id="auto-selection"
            checked={autoInputSelection}
            onCheckedChange={setAutoInputSelection}
          />
        </div>

        {/* Search input */}
        <div className="px-4 py-2 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-1">
              Found {filteredMessages.length} of {messages.length} messages
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 px-4">
          <div className="space-y-4 py-4">
            {filteredMessages.length === 0 && !isStreaming && searchQuery && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No messages found matching "{searchQuery}"
                </p>
              </div>
            )}

            {filteredMessages.length === 0 && !isStreaming && !searchQuery && (
              <ExcelPromptExamples
                onSelectPrompt={(prompt) => setInput(prompt)}
                fileName={excelData?.fileName}
              />
            )}

            {filteredMessages.map((message, idx) => {
              // Find the original index for proper handling of last message
              const originalIdx = messages.findIndex((m) => m.id === message.id);
              const isLastMessage = originalIdx === messages.length - 1;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  <div
                    className={`chat-bubble rounded-xl px-4 py-3 break-words overflow-wrap-anywhere whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.role === 'assistant' ? (
                      searchQuery ? (
                        <div
                          className="text-sm prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(message.content, searchQuery),
                          }}
                        />
                      ) : (
                        <MarkdownContent content={message.content} />
                      )
                    ) : searchQuery ? (
                      <div
                        className="whitespace-pre-wrap text-sm"
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(message.content, searchQuery),
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    )}

                    {message.action?.formula && (
                      <div className="mt-3 rounded-lg border border-border bg-background p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Formula:
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyFormula(message.action!.formula!)}
                            aria-label="Copy formula to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <code className="block font-mono text-sm text-primary overflow-x-auto max-w-full whitespace-pre-wrap break-words">
                          {message.action.formula}
                        </code>
                      </div>
                    )}

                    {message.action &&
                      message.action.status === 'pending' &&
                      message.action.changes && (
                        <ActionPreview
                          changes={message.action.changes.slice(0, 5)}
                          totalChanges={message.action.changes.length}
                        />
                      )}

                    {message.action?.type === 'CREATE_CHART' && excelData && (
                      <ChartPreview
                        data={excelData}
                        action={message.action}
                        onUpdate={(updatedAction) => onUpdateAction(message.id, updatedAction)}
                      />
                    )}

                    {(message.action?.type === 'STATISTICS' ||
                      message.action?.type === 'PIVOT_SUMMARY') &&
                      excelData && <DataSummaryPreview data={excelData} action={message.action} />}

                    {message.action?.type === 'CONDITIONAL_FORMAT' && (
                      <ConditionalFormatPreview action={message.action} />
                    )}

                    {/* Specialized Audit/Insight Previews */}
                    {message.action?.type === 'DATA_AUDIT' && message.action.auditReport && (
                      <div className="mt-4">
                        <AuditReport
                          report={message.action.auditReport}
                          appliedActionIds={message.action.appliedActionIds || []}
                          onApplySuggestion={(action, actionId) => {
                            onApplyAction(action);
                            const currentIds = message.action?.appliedActionIds || [];
                            if (actionId && !currentIds.includes(actionId)) {
                              onUpdateAction(message.id, {
                                ...message.action!,
                                appliedActionIds: [...currentIds, actionId],
                              });
                            }
                          }}
                        />
                      </div>
                    )}

                    {message.action?.type === 'INSIGHTS' && message.action.insights && (
                      <div className="mt-4">
                        <InsightSummary
                          insights={message.action.insights}
                          onCellFocus={(cellRefs) => onRequestCellSelection()}
                        />
                      </div>
                    )}

                    {/* Quick action buttons for the LAST message only */}
                    {isLastMessage && message.quickOptions && message.quickOptions.length > 0 && (
                      <div className="mt-4">
                        <QuickActionButtons
                          options={message.quickOptions}
                          appliedActionIds={message.action?.appliedActionIds || []}
                          onOptionClick={(text, action, actionId) => {
                            const option = message.quickOptions?.find((o) => o.id === actionId);
                            if (option) {
                              handleQuickOption(option);
                            } else {
                              sendMessage(text);
                            }
                          }}
                        />
                      </div>
                    )}

                    {message.action &&
                      message.action.status === 'pending' &&
                      message.action.type !== 'CLARIFY' &&
                      message.action.type !== 'INFO' &&
                      message.action.type !== 'DATA_AUDIT' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplyAction(message.action!)}
                            className="gap-1"
                            aria-label="Apply suggested action to spreadsheet"
                          >
                            <Check className="h-3 w-3" /> Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRejectAction}
                            className="gap-1"
                            aria-label="Reject suggested action"
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div
                  className="chat-bubble rounded-xl bg-accent px-4 py-3 text-accent-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap"
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {streamingContent ? (
                    <div className="text-sm whitespace-pre-wrap">
                      <MarkdownContent content={streamingContent} />
                      <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder={excelData ? 'Type a command...' : 'Upload an Excel file first'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!excelData || isProcessing}
              className="max-h-[120px] min-h-[44px] resize-none"
              rows={1}
              aria-label="Chat message input"
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || !excelData || isProcessing}
              aria-label={isProcessing ? 'Sending message...' : 'Send message'}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
