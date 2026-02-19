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
  getDataAnalysis: () => Record<string, unknown> | null;
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
      onRejectAction,
      onSetPendingChanges,
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

        const context = {
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
              timestamp: new Date(),
            };

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
      <div className="flex h-full flex-col border-l border-border bg-card">
        <div className="border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Ready to help edit your Excel</p>
            </div>
          </div>
        </div>
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
                  {message.action &&
                    message.action.status === 'pending' &&
                    !['CLARIFY', 'INFO', 'DATA_AUDIT'].includes(message.action.type) && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onApplyAction(message.action!)}
                          disabled={isProcessing}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" /> Apply
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
        <div className="border-t p-3 shrink-0">
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
