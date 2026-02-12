import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFileHistory } from "@/hooks/useFileHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useDocsUndoRedo } from "@/hooks/useDocsUndoRedo";
import DocsUpload from "@/components/docs/DocsUpload";
import DocsEditor from "@/components/docs/DocsEditor";
import DocsChatInterface from "@/components/docs/DocsChatInterface";
import UndoRedoBar from "@/components/dashboard/UndoRedoBar";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { DocsData, ChatMessage, AIAction } from "@/types/docs";
import { useToast } from "@/hooks/use-toast";
import { cloneDocsData } from "@/utils/docsOperations";

const DocsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docsData, setDocsData] = useState<DocsData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);

  const { saveFileRecord } = useFileHistory();
  const { saveChatMessage } = useChatHistory();

  const {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCurrentDescription,
    getNextDescription,
  } = useDocsUndoRedo();

  // Keyboard shortcuts for undo/redo
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docsData, canUndo, canRedo]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setDocsData(previousState);
      toast({ title: "Undo", description: getCurrentDescription() || "Change reverted" });
    }
  }, [undo, getCurrentDescription, toast]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setDocsData(nextState);
      toast({ title: "Redo", description: getNextDescription() || "Change restored" });
    }
  }, [redo, getNextDescription, toast]);

  const handleDocumentLoad = useCallback(
    async (data: DocsData) => {
      setDocsData(data);
      setMessages([]);
      clearHistory();
      setChatOpen(true);

      const record = await saveFileRecord(data.fileName, 1, 1);
      if (record) {
        setFileHistoryId(record.id);
      }
    },
    [saveFileRecord, clearHistory]
  );

  const handleContentChange = useCallback((content: string) => {
    setDocsData((prev) => {
      if (!prev) return null;
      const before = cloneDocsData(prev);
      const after = {
        ...prev,
        content,
        htmlContent: undefined,
      };
      pushState(before, after, "Manual edit");
      return after;
    });
  }, [pushState]);

  const handleClearDocument = useCallback(() => {
    setDocsData(null);
    setMessages([]);
    setFileHistoryId(null);
    setChatOpen(false);
    clearHistory();
  }, [clearHistory]);

  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      saveChatMessage(message, fileHistoryId, undefined);
    },
    [fileHistoryId, saveChatMessage]
  );

  const handleApplyAction = useCallback(
    async (action: AIAction) => {
      if (!docsData) return;

      // Validate action before applying
      const { validateDocsAction, getValidationErrorMessage, logValidationResult } = await import("@/utils/actionValidation");
      const validation = validateDocsAction(action);

      if (!validation.isValid) {
        const errorMsg = getValidationErrorMessage(validation);
        logValidationResult(validation, "Docs Action");

        toast({
          title: "Invalid Action",
          description: errorMsg || "The AI response was in an unexpected format. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const beforeData = cloneDocsData(docsData);
        const newData = cloneDocsData(docsData);
        let description = "";

        switch (action.type) {
          case "WRITE": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Created new document";
            }
            break;
          }

          case "REWRITE": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Document rewritten";
            } else if (action.replacement && action.targetSection) {
              const sectionId = action.targetSection;
              const section = newData.sections.find((s) => s.id === sectionId);
              if (section) {
                newData.content = newData.content.replace(section.content, action.replacement);
                section.content = action.replacement;
                description = "Section rewritten";
              }
            }
            break;
          }

          case "GRAMMAR_CHECK": {
            if (action.replacement) {
              newData.content = action.replacement;
              description = "Grammar and spelling corrected";
            }
            break;
          }

          case "SUMMARIZE": {
            if (action.summary) {
              newData.content += `\n\n## Summary\n\n${action.summary}`;
              description = "Summary added to document";
            }
            break;
          }

          case "TRANSLATE": {
            if (action.fullDocument && action.language) {
              newData.content = action.fullDocument;
              description = `Translated to ${action.language}`;
            }
            break;
          }

          case "TONE_ADJUST": {
            if (action.fullDocument && action.tone) {
              newData.content = action.fullDocument;
              description = `Tone adjusted to ${action.tone}`;
            }
            break;
          }

          case "EXPAND": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = `Content expanded (Level ${action.expandLevel || 1})`;
            }
            break;
          }

          case "FORMAT": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = `Formatted as ${action.format || "text"}`;
            }
            break;
          }

          case "TEMPLATE": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = `${action.templateType || "Template"} created`;
            }
            break;
          }

          case "ANALYZE": {
            toast({
              title: "Document Analysis",
              description: action.summary || "Analysis complete",
            });
            return;
          }

          case "SIMPLIFY": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = `Document simplified for ${action.readingLevel || "simple"} reading`;
            }
            break;
          }

          case "PARAPHRASE": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Document paraphrased";
            }
            break;
          }

          case "ADD_HEADINGS": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Added headings and structure";
            }
            break;
          }

          case "BULLET_POINTS": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Converted to bullet points";
            }
            break;
          }

          case "NUMBERED_LIST": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Converted to numbered list";
            }
            break;
          }

          case "ADD_EXAMPLES": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = "Added examples to content";
            }
            break;
          }

          case "OUTLINE": {
            if (action.fullDocument) {
              newData.content = action.fullDocument;
              description = `Created ${action.outlineStyle || "detailed"} outline`;
            }
            break;
          }

          case "PROOFREAD": {
            if (action.replacement) {
              newData.content = action.replacement;
              const issueCount = action.grammarIssues?.length || 0;
              description = `Proofread complete: ${issueCount} issues fixed`;
            }
            break;
          }

          default:
            toast({
              title: "Not Implemented",
              description: `Action ${action.type} not yet implemented`,
            });
            return;
        }

        // Push to undo history
        pushState(beforeData, newData, description);
        setDocsData(newData);

        // Mark action as applied
        setMessages((prev) =>
          prev.map((msg) =>
            msg.action === action
              ? {
                  ...msg,
                  action: { ...action, status: "applied" },
                }
              : msg
          )
        );

        toast({
          title: "Success",
          description,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to apply action: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    },
    [docsData, toast, pushState]
  );

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {docsData && (
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
        {/* Editor/Upload Area */}
        <div className="flex flex-1 flex-col border-r border-border min-h-0 min-w-0 overflow-hidden">
          {!docsData ? (
            <DocsUpload onDocumentLoad={handleDocumentLoad} />
          ) : (
            <DocsEditor
              document={docsData}
              onContentChange={handleContentChange}
              onClear={handleClearDocument}
            />
          )}
        </div>

        {/* Mobile Chat Toggle Button */}
        {docsData && (
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
          {docsData && (
            <DocsChatInterface
              docsData={docsData}
              messages={messages}
              onNewMessage={handleNewMessage}
              onApplyAction={handleApplyAction}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}
        </div>

        {/* Chat Panel - Desktop Sidebar (Fixed) */}
        <div className="hidden lg:flex w-[320px] xl:w-[360px] flex-col flex-shrink-0 overflow-hidden">
          <DocsChatInterface
            docsData={docsData}
            messages={messages}
            onNewMessage={handleNewMessage}
            onApplyAction={handleApplyAction}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default DocsDashboard;
