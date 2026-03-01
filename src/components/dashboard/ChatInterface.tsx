// @ts-nocheck
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User, Sparkles, Check, Copy, X } from 'lucide-react';
import { ChatMessage, ExcelData, AIAction, DataChange } from '@/types/excel';
import { useToast } from '@/hooks/use-toast';
import { streamChat } from '@/utils/streamChat';
import { parseAIResponse, logParseResult } from '@/utils/jsonParser';
import MarkdownContent from './MarkdownContent';
import ExcelPromptExamples from './ExcelPromptExamples';

function getDisplayContent(text: string): string {
  if (!text) return '';
  const regex = /"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let lastMatch = '';
  let match;
  while ((match = regex.exec(text)) !== null) {
    lastMatch = match[1];
  }
  if (lastMatch) {
    try {
      return JSON.parse(`"${lastMatch}"`);
    } catch {
      return lastMatch;
    }
  }
  if (text.trim().startsWith('{')) return '';
  return text;
}

interface ChatInterfaceProps {
  excelData: ExcelData;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onApplyAction: (action: AIAction) => void;
  onRejectAction: (actionId: string) => void;
  onSetPendingChanges: (changes: DataChange[]) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  getDataAnalysis: () => string[] | null;
  onUpdateAction: (messageId: string, updatedAction: AIAction) => void;
  onUndo?: () => void; // NEW: Undo function
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
      onRejectAction,
      onSetPendingChanges,
      isProcessing,
      setIsProcessing,
      getDataAnalysis,
      onUpdateAction,
      onUndo,
    },
    ref
  ) => {
    const [input, setInput] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set()); // Track applied action IDs
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    const sendMessage = useCallback(
      async (messageText?: string, displayText?: string) => {
        const text = messageText || input.trim();
        if (!text || isProcessing) return;

        onNewMessage({
          id: crypto.randomUUID(),
          role: 'user',
          content: displayText || text,
          timestamp: new Date(),
        });
        setInput('');
        setIsProcessing(true);
        setIsStreaming(true);
        setStreamingContent('');

        const context: Record<string, unknown> = {
          fileName: excelData.fileName,
          headers: excelData.headers,
          sampleRows: excelData.rows.slice(0, 5),
          totalRows: excelData.rows.length,
          selectedCells: excelData.selectedCells,
          dataAnalysis: getDataAnalysis(),
        };
        const allMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: text },
        ];

        await streamChat({
          messages: allMessages,
          excelContext: context,
          onDelta: (chunk) => setStreamingContent((prev) => prev + chunk),
          onDone: async (fullText) => {
            setIsStreaming(false);
            setStreamingContent('');
            const parseResult = parseAIResponse(fullText, fullText);
            logParseResult(parseResult, 'Excel Chat');

            console.log('Parsed AI response:', parseResult.data);
            console.log('Quick options:', parseResult.data?.quickOptions);

            let finalAction = parseResult.data?.action;
            const messageContent = parseResult.data?.content || fullText;

            if (!finalAction || finalAction.type === 'INFO') {
              const { extractActionFromText, salvageActionFromResponse } =
                await import('@/utils/jsonParser');
              const extractedAction =
                extractActionFromText(fullText) || salvageActionFromResponse(fullText);
              if (extractedAction) finalAction = extractedAction;
            }

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: messageContent,
              action: finalAction
                ? { ...finalAction, id: finalAction.id || crypto.randomUUID(), status: 'pending' }
                : undefined,
              quickOptions: parseResult.data?.quickOptions || [],
              timestamp: new Date(),
            };

            console.log('Assistant message created:', assistantMessage);

            onNewMessage(assistantMessage);
            if (assistantMessage.action?.changes?.length) {
              onSetPendingChanges(assistantMessage.action.changes);
            }
            setIsProcessing(false);
          },
          onError: async (error, status) => {
            setIsStreaming(false);
            setStreamingContent('');
            setIsProcessing(false);
            const { mapAIError, formatErrorForToast } = await import('@/utils/errorMessages');
            toast({ ...formatErrorForToast(mapAIError(status, error, 'Excel Chat')) });
            onSetPendingChanges([]); // Clear highlights on error
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

    useImperativeHandle(ref, () => ({ sendMessage }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    return (
      <div className="flex h-full flex-col bg-card">
        <ScrollArea className="flex-1 min-h-0 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && !isStreaming && (
              <ExcelPromptExamples onSelectPrompt={setInput} fileName={excelData?.fileName} />
            )}
            {messages.map((message) => (
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
                  className={`rounded-xl px-4 py-3 break-words max-w-full ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}
                >
                  <MarkdownContent content={message.content} />
                  {message.action?.formula && (
                    <div className="mt-3 rounded-lg border bg-background p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Formula:</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(message.action!.formula!);
                            toast({ title: 'Formula Copied!' });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="block font-mono text-sm text-primary overflow-x-auto">
                        {message.action.formula}
                      </code>
                    </div>
                  )}
                  {message.action && message.action.status === 'pending' && (
                    <div className="mt-3 space-y-2">
                      {/* Show action description */}
                      {message.action.description && (
                        <div className="text-xs text-muted-foreground border-l-2 border-primary pl-2">
                          {message.action.description}
                        </div>
                      )}
                      
                      {/* Show action buttons ONLY if no quickOptions with isApplyAction */}
                      {!['CLARIFY', 'INFO', 'DATA_AUDIT', 'INSIGHTS'].includes(message.action.type) && 
                       !(message.quickOptions && message.quickOptions.some(opt => opt.isApplyAction)) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => onApplyAction(message.action!)}
                            disabled={isProcessing}
                            className="gap-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3" /> Apply Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRejectAction(message.action!.id!)}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Show changes preview if available */}
                      {message.action.changes && message.action.changes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {message.action.changes.length} change{message.action.changes.length > 1 ? 's' : ''} will be applied
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Options - Action buttons from AI suggestions */}
                  {message.quickOptions && message.quickOptions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Quick Actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {message.quickOptions.map((option) => {
                          // Check if this action has been applied
                          const actionId = option.action?.id || option.id;
                          const isApplied = appliedActions.has(actionId);
                          
                          // Determine button appearance based on state
                          const buttonLabel = isApplied 
                            ? (option.label.startsWith('✓') ? option.label.replace('✓', '✅') : `✅ ${option.label}`)
                            : option.label;
                          
                          const buttonVariant = isApplied 
                            ? 'outline' 
                            : (option.variant === 'success' ? 'default' : option.variant === 'destructive' ? 'destructive' : 'outline');
                          
                          return (
                            <Button
                              key={option.id}
                              size="sm"
                              variant={buttonVariant}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // If already applied and this is a "Batalkan" button, call undo
                                if (isApplied && (option.label.toLowerCase().includes('batal') || option.label.toLowerCase().includes('undo'))) {
                                  console.log('Undo action:', actionId);
                                  if (onUndo) {
                                    onUndo();
                                    setAppliedActions(prev => {
                                      const next = new Set(prev);
                                      next.delete(actionId);
                                      return next;
                                    });
                                    toast({ title: 'Perubahan dibatalkan', description: 'Action berhasil di-undo' });
                                  }
                                  return;
                                }
                                
                                // If already applied, don't apply again
                                if (isApplied && option.isApplyAction) {
                                  toast({ 
                                    title: 'Sudah diterapkan', 
                                    description: 'Action ini sudah diterapkan sebelumnya',
                                    variant: 'default'
                                  });
                                  return;
                                }
                                
                                console.log('Button clicked for option:', option.label);
                                
                                // Priority 1: Use action if exists
                                if (option.action) {
                                  // Normalize action structure
                                  const normalizedAction = {
                                    id: option.action.id || crypto.randomUUID(),
                                    type: option.action.type,
                                    status: 'pending' as const,
                                    description: option.action.description || '',
                                    formula: option.action.formula,
                                    changes: option.action.changes || [],
                                    params: {
                                      ...option.action.params,
                                      ...(option.action as any).target && { target: (option.action as any).target },
                                      ...(option.action as any).formula && { formula: (option.action as any).formula },
                                      ...(option.action as any).transformType && { transformType: (option.action as any).transformType },
                                      ...(option.action as any).sortColumn && { sortColumn: (option.action as any).sortColumn },
                                      ...(option.action as any).sortDirection && { sortDirection: (option.action as any).sortDirection },
                                    },
                                  };
                                  
                                  console.log('Applying action:', normalizedAction);
                                  onApplyAction(normalizedAction);
                                  
                                  // Mark as applied
                                  setAppliedActions(prev => new Set(prev).add(actionId));
                                }
                                // Priority 2: If isApplyAction is true but no action, use main message action
                                else if (option.isApplyAction && message.action) {
                                  console.log('Using main message action');
                                  onApplyAction(message.action);
                                  setAppliedActions(prev => new Set(prev).add(actionId));
                                }
                                // Priority 3: Send as message
                                else {
                                  console.log('No action found, sending message:', option.value);
                                  sendMessage(option.value, option.label);
                                }
                              }}
                              disabled={isProcessing || (isApplied && !option.label.toLowerCase().includes('batal'))}
                              className={
                                isApplied 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                                  : (option.variant === 'success' ? 'bg-green-600 hover:bg-green-700' : '')
                              }
                            >
                              {buttonLabel}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-xl bg-accent px-4 py-3 text-accent-foreground break-words">
                  <MarkdownContent content={getDisplayContent(streamingContent)} />
                  <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-3 shrink-0 bg-card">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="max-h-24 min-h-[44px] resize-none"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChatInterface.displayName = 'ChatInterface';
export default ChatInterface;
