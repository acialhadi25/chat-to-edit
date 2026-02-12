import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Check,
  Copy,
  X,
} from "lucide-react";
import {
  ChatMessage,
  ExcelData,
  AIAction,
  QuickOption,
  DataChange,
} from "@/types/excel";
import { useToast } from "@/hooks/use-toast";
import { streamChat } from "@/utils/streamChat";
import { parseAIResponse, logParseResult } from "@/utils/jsonParser";
import QuickActionButtons from "./QuickActionButtons";
import ActionPreview from "./ActionPreview";
import MarkdownContent from "./MarkdownContent";
import ExcelPromptExamples from "./ExcelPromptExamples";

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
}

const ChatInterface = ({
  excelData,
  messages,
  onNewMessage,
  onApplyAction,
  onSetPendingChanges,
  onRequestCellSelection,
  isProcessing,
  setIsProcessing,
  getDataAnalysis,
}: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    onNewMessage(userMessage);
    setInput("");
    setIsProcessing(true);
    setIsStreaming(true);
    setStreamingContent("");

    const dataAnalysis = getDataAnalysis();
    
    // Build unique values per column (top 10) so AI knows what data exists
    const uniqueValuesPerColumn: Record<string, string[]> = {};
    if (excelData) {
      excelData.headers.forEach((header, colIdx) => {
        const uniqueVals = new Set<string>();
        for (const row of excelData.rows) {
          const val = row[colIdx];
          if (val !== null && val !== undefined && String(val).trim() !== "") {
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
      { role: "user", content: text },
    ];

    await streamChat({
      messages: allMessages,
      excelContext: context,
      onDelta: (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      onDone: (fullText) => {
        setIsStreaming(false);
        setStreamingContent("");

        // Use robust JSON parser with fallback strategies
        const parseResult = parseAIResponse(fullText, fullText);
        logParseResult(parseResult, "Excel Chat");

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: parseResult.data?.content || fullText,
          action: parseResult.data?.action ? { ...parseResult.data.action, status: "pending" as const } as AIAction : undefined,
          quickOptions: parseResult.data?.quickOptions?.map((opt: any) => ({ id: opt.id || crypto.randomUUID(), label: opt.label, value: opt.value, variant: opt.variant || "default" })) as QuickOption[] | undefined,
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
        setStreamingContent("");
        setIsProcessing(false);

        // Import error mapper for better error handling
        const { mapAIError, formatErrorForToast } = await import("@/utils/errorMessages");
        const errorResponse = mapAIError(status, error, "Excel Chat");

        // Show error toast
        toast({
          ...formatErrorForToast(errorResponse),
        });

        // Log detailed error info for debugging
        console.error("Excel Chat Error Details:", {
          errorResponse,
          originalError: error,
          status,
          timestamp: new Date().toISOString(),
        });
      },
    });
  }, [input, isProcessing, excelData, messages, onNewMessage, onSetPendingChanges, setIsProcessing, getDataAnalysis, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickOption = (option: QuickOption) => {
    sendMessage(option.value);
  };

  const handleApplyAction = (action: AIAction) => {
    onApplyAction(action);
  };

  const handleRejectAction = () => {
    if (excelData) {
      onSetPendingChanges([]);
    }
    toast({
      title: "Rejected",
      description: "Changes were not applied",
    });
  };

  const copyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    toast({
      title: "Formula copied!",
      description: "Formula has been copied to clipboard",
    });
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {excelData ? "Ready to help edit your Excel" : "Upload a file to start"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && !isStreaming && (
            <ExcelPromptExamples 
              onSelectPrompt={(prompt) => setInput(prompt)}
              fileName={excelData?.fileName}
            />
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}

                {/* Show formula if present */}
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
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="block font-mono text-sm text-primary">
                      {message.action.formula}
                    </code>
                  </div>
                )}

                {/* Show action preview if pending */}
                {message.action && message.action.status === "pending" && message.action.changes && (
                  <ActionPreview
                    changes={message.action.changes.slice(0, 5)}
                    totalChanges={message.action.changes.length}
                  />
                )}

                {/* Quick action buttons */}
                {message.quickOptions && message.quickOptions.length > 0 && (
                  <QuickActionButtons
                    options={message.quickOptions}
                    onSelect={handleQuickOption}
                    action={message.action}
                    onApply={handleApplyAction}
                    onReject={handleRejectAction}
                    disabled={isProcessing}
                  />
                )}

                {/* Apply/Reject buttons for actions without quick options */}
                {message.action && 
                  message.action.status === "pending" && 
                  message.action.type !== "CLARIFY" &&
                  message.action.type !== "INFO" &&
                  (!message.quickOptions || message.quickOptions.length === 0) && (
                  <div className="mt-3 flex gap-2">
                     <Button
                       size="sm"
                       onClick={() => handleApplyAction(message.action!)}
                       className="gap-1"
                     >
                       <Check className="h-3 w-3" />
                       Apply
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={handleRejectAction}
                       className="gap-1"
                     >
                       <X className="h-3 w-3" />
                       Reject
                     </Button>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="max-w-[85%] rounded-xl bg-accent px-4 py-3 text-accent-foreground">
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

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            placeholder={
              excelData
                ? "Type a command... (e.g., 'remove empty rows')"
                : "Upload an Excel file first to start"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!excelData || isProcessing}
            className="max-h-[120px] min-h-[44px] resize-none"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || !excelData || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter to send • Shift+Enter new line • Ctrl+Z undo
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
