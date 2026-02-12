import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { ChatMessage, AIAction, QuickOption, DocsData } from "@/types/docs";
import { useToast } from "@/hooks/use-toast";
import { streamChatDocs } from "@/utils/streamChatDocs";
import { parseAIResponse, logParseResult } from "@/utils/jsonParser";
import MarkdownContent from "@/components/dashboard/MarkdownContent";
import DocsPromptExamples from "./DocsPromptExamples";

interface DocsChatInterfaceProps {
  docsData: DocsData | null;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onApplyAction: (action: AIAction) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const DocsChatInterface = ({
  docsData,
  messages,
  onNewMessage,
  onApplyAction,
  isProcessing,
  setIsProcessing,
}: DocsChatInterfaceProps) => {
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

  const sendMessage = useCallback(
    async (messageText?: string) => {
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

      const context = docsData
        ? {
            fileName: docsData.fileName,
            title: docsData.metadata.title,
            wordCount: docsData.metadata.wordCount,
            content: docsData.content.slice(0, 5000), // Limit context to avoid token overflow
          }
        : null;

      const messageHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        let fullText = "";

        await streamChatDocs({
          messages: [...messageHistory, { role: "user", content: text }],
          docsContext: context,
          onDelta: (deltaText) => {
            fullText += deltaText;
            setStreamingContent(fullText);
          },
          onDone: (finalText) => {
            setIsStreaming(false);
            setIsProcessing(false);

            // Use robust JSON parser with fallback strategies
            const parseResult = parseAIResponse(finalText, finalText);
            logParseResult(parseResult, "Docs Chat");

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: parseResult.data?.content || finalText,
              action: parseResult.data?.action
                ? ({ ...parseResult.data.action, status: "pending" as const } as AIAction)
                : undefined,
              quickOptions: parseResult.data?.quickOptions?.map((opt: any) => ({ id: opt.id || crypto.randomUUID(), label: opt.label, value: opt.value, variant: opt.variant || "default" })) as QuickOption[] | undefined,
              timestamp: new Date(),
            };

            onNewMessage(assistantMessage);

            setStreamingContent("");
          },
          onError: async (error, status) => {
            setIsStreaming(false);
            setIsProcessing(false);

            // Import error mapper for better error handling
            const { mapAIError, formatErrorForToast } = await import("@/utils/errorMessages");
            const errorResponse = mapAIError(status, error, "Docs Chat");

            // Show error toast
            toast({
              ...formatErrorForToast(errorResponse),
            });

            // Log detailed error info for debugging
            console.error("Docs Chat Error Details:", {
              errorResponse,
              originalError: error,
              status,
              timestamp: new Date().toISOString(),
            });
          },
        });
      } catch (error) {
        setIsStreaming(false);
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    },
    [input, isProcessing, docsData, messages, onNewMessage, setIsProcessing, toast]
  );

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
              {docsData ? "Ready to help with your document" : "Upload a file to start"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-4 p-4">
          {messages.length === 0 && !isStreaming && (
            <DocsPromptExamples 
              onSelectPrompt={(prompt) => setInput(prompt)}
              fileName={docsData?.fileName}
            />
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div className={`max-w-[85%] flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  <MarkdownContent content={message.content} />
                </div>

                {message.action && message.action.status === "pending" && 
                  message.action.type !== "CLARIFY" && message.action.type !== "INFO" && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onApplyAction(message.action as AIAction)}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({ title: "Rejected", description: "Changes were not applied" })}
                      className="gap-1"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}

                {message.quickOptions && message.quickOptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.quickOptions.map((opt: QuickOption) => (
                      <Badge
                        key={opt.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => sendMessage(opt.value)}
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/50">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="max-w-[85%] rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
                {streamingContent ? (
                  <div className="whitespace-pre-wrap">
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
      <div className="border-t border-border bg-background p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask me to rewrite, summarize, translate, or improve your document..."
            className="resize-none"
            rows={3}
            disabled={isProcessing}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="self-end"
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
};

export default DocsChatInterface;
