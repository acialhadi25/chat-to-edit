import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFileHistory } from "@/hooks/useFileHistory";
import { useChatHistory } from "@/hooks/useChatHistory";
import PdfUpload from "@/components/pdf/PdfUpload";
import PdfPreview from "@/components/pdf/PdfPreview";
import PdfGallery from "@/components/pdf/PdfGallery";
import PdfChatInterface from "@/components/pdf/PdfChatInterface";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { PDFData, ChatMessage, AIAction } from "@/types/pdf";
import {
  extractPages,
  mergePdfs,
  deletePages,
  rotatePages,
  addWatermark,
  getPdfInfo,
  extractTextFromPdf,
  convertPdfPageToImage,
  convertPdfToImages,
} from "@/utils/pdfOperations";
import { useToast } from "@/hooks/use-toast";

const PdfDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fileHistoryId, setFileHistoryId] = useState<string | null>(null);
  const [showUploadMore, setShowUploadMore] = useState(false);

  const { saveFileRecord } = useFileHistory();
  const { saveChatMessage } = useChatHistory();

  const handleFileUpload = useCallback(
    async (data: PDFData) => {
      // If we already have data, merge the new files
      if (pdfData) {
        const updatedData = {
          ...pdfData,
          files: pdfData.files.concat(data.files),
          currentFileId: pdfData.currentFileId, // Keep current selection
        };
        setPdfData(updatedData);
        setShowUploadMore(false);
      } else {
        // First upload
        setPdfData(data);
        setMessages([]);
        setChatOpen(true);

        const firstFile = data.files[0];
        if (firstFile) {
          const record = await saveFileRecord(firstFile.name, firstFile.pages, 1);
          if (record) {
            setFileHistoryId(record.id);
          }
        }
      }
    },
    [pdfData, saveFileRecord]
  );

  const handleClearFiles = useCallback(() => {
    setPdfData(null);
    setMessages([]);
    setFileHistoryId(null);
    setChatOpen(false);
  }, []);

  const handleSelectFile = useCallback((fileId: string) => {
    if (!pdfData) return;
    setPdfData({
      ...pdfData,
      currentFileId: fileId,
      currentPageIndex: 0,
    });
  }, [pdfData]);

  const handleRemoveFile = useCallback((fileId: string) => {
    if (!pdfData) return;

    const updatedFiles = pdfData.files.filter((f) => f.id !== fileId);

    if (updatedFiles.length === 0) {
      handleClearFiles();
      return;
    }

    const newCurrentFileId = pdfData.currentFileId === fileId
      ? updatedFiles[0].id
      : pdfData.currentFileId;

    setPdfData({
      ...pdfData,
      files: updatedFiles,
      currentFileId: newCurrentFileId,
      currentPageIndex: 0,
    });
  }, [pdfData, handleClearFiles]);

  const handleNextPage = useCallback(() => {
    if (!pdfData) return;
    const currentFile = pdfData.files.find((f) => f.id === pdfData.currentFileId);
    if (!currentFile) return;

    if (pdfData.currentPageIndex < currentFile.pages - 1) {
      setPdfData({
        ...pdfData,
        currentPageIndex: pdfData.currentPageIndex + 1,
      });
    }
  }, [pdfData]);

  const handlePrevPage = useCallback(() => {
    if (!pdfData) return;

    if (pdfData.currentPageIndex > 0) {
      setPdfData({
        ...pdfData,
        currentPageIndex: pdfData.currentPageIndex - 1,
      });
    }
  }, [pdfData]);

  const handleNewMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      saveChatMessage(message, fileHistoryId, undefined);
    },
    [fileHistoryId, saveChatMessage]
  );

  const handleApplyAction = useCallback(
    async (action: AIAction) => {
      if (!pdfData) return;

      // Validate action before applying
      const { validatePDFAction, getValidationErrorMessage, logValidationResult } = await import("@/utils/actionValidation");
      const validation = validatePDFAction(action);

      if (!validation.isValid) {
        const errorMsg = getValidationErrorMessage(validation);
        logValidationResult(validation, "PDF Action");

        toast({
          title: "Invalid Action",
          description: errorMsg || "The AI response was in an unexpected format. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (validation.warnings.length > 0) {
        logValidationResult(validation, "PDF Action");
      }

      setIsProcessing(true);

      try {
        const currentFile = pdfData.files.find((f) => f.id === pdfData.currentFileId);
        if (!currentFile) {
          toast({
            title: "Error",
            description: "No PDF selected",
            variant: "destructive",
          });
          return;
        }

        let resultBytes: Uint8Array | undefined;
        let description = "";

        switch (action.type) {
          case "EXTRACT_PAGES": {
            if (action.pages && action.pages.length > 0) {
              resultBytes = await extractPages(currentFile.file, action.pages);
              description = `Extracted pages: ${action.pages.join(", ")}`;
            }
            break;
          }

          case "DELETE_PAGES": {
            if (action.pages && action.pages.length > 0) {
              resultBytes = await deletePages(currentFile.file, action.pages);
              description = `Deleted pages: ${action.pages.join(", ")}`;
            }
            break;
          }

          case "ROTATE_PAGES": {
            if (action.pages && action.rotation !== undefined) {
              resultBytes = await rotatePages(
                currentFile.file,
                action.pages,
                action.rotation
              );
              description = `Rotated pages: ${action.pages.join(", ")} by ${action.rotation}°`;
            }
            break;
          }

          case "ADD_WATERMARK": {
            if (action.watermarkText) {
              resultBytes = await addWatermark(
                currentFile.file,
                action.watermarkText,
                action.pages
              );
              description = `Added watermark: "${action.watermarkText}"`;
            }
            break;
          }

          case "MERGE_FILES": {
            if (action.pageRanges && action.pageRanges.length > 0) {
              // Advanced merge with specific page ranges
              const pageRanges = action.pageRanges
                .map((range) => {
                  const match = range.fileRef.match(/File\s+([A-Z])/);
                  if (match) {
                    const fileIndex = match[1].charCodeAt(0) - 65; // A=0, B=1, etc.
                    return { file: fileIndex, pages: range.pages };
                  }
                  return undefined;
                })
                .filter((r) => r) as { file: number; pages: number[] }[];

              if (pageRanges.length > 0) {
                resultBytes = await mergePdfs(
                  pdfData.files.map((f) => f.file),
                  pageRanges
                );
                description = `Merged files with specific page ranges`;
              }
            } else if (action.fileRefs && action.fileRefs.length > 0) {
              // Simple merge of entire files
              const filesToMerge = action.fileRefs
                .map((ref) => {
                  const match = ref.match(/File\s+([A-Z])/);
                  if (match) {
                    const fileIndex = match[1].charCodeAt(0) - 65; // A=0, B=1, etc.
                    return pdfData.files[fileIndex];
                  }
                  return undefined;
                })
                .filter((f) => f) as typeof pdfData.files;

              if (filesToMerge.length > 0) {
                resultBytes = await mergePdfs(filesToMerge.map((f) => f.file));
                description = `Merged ${filesToMerge.length} files`;
              }
            }
            break;
          }

          case "PDF_INFO": {
            const info = await getPdfInfo(currentFile.file);
            toast({
              title: "PDF Information",
              description: `Pages: ${info.pages}, Size: ${(info.fileSize / 1024 / 1024).toFixed(2)}MB`,
            });
            break;
          }

          case "EXTRACT_ODD_PAGES": {
            const totalPages = currentFile.pages;
            const oddPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 1);
            resultBytes = await extractPages(currentFile.file, oddPages);
            description = `Extracted ${oddPages.length} odd pages`;
            break;
          }

          case "EXTRACT_EVEN_PAGES": {
            const totalPages2 = currentFile.pages;
            const evenPages = Array.from({ length: totalPages2 }, (_, i) => i + 1).filter(p => p % 2 === 0);
            resultBytes = await extractPages(currentFile.file, evenPages);
            description = `Extracted ${evenPages.length} even pages`;
            break;
          }

          case "REVERSE_PAGES": {
            const totalPages3 = currentFile.pages;
            const reversedOrder = Array.from({ length: totalPages3 }, (_, i) => totalPages3 - i);
            resultBytes = await extractPages(currentFile.file, reversedOrder);
            description = `Reversed page order (${totalPages3} pages)`;
            break;
          }

          case "KEEP_FIRST_N": {
            if (action.keepFirstN && action.keepFirstN > 0) {
              const pagesToKeep = Array.from({ length: Math.min(action.keepFirstN, currentFile.pages) }, (_, i) => i + 1);
              resultBytes = await extractPages(currentFile.file, pagesToKeep);
              description = `Kept first ${pagesToKeep.length} pages`;
            }
            break;
          }

          case "KEEP_LAST_N": {
            if (action.keepLastN && action.keepLastN > 0) {
              const start = Math.max(1, currentFile.pages - action.keepLastN + 1);
              const pagesToKeep = Array.from({ length: action.keepLastN }, (_, i) => start + i);
              resultBytes = await extractPages(currentFile.file, pagesToKeep);
              description = `Kept last ${pagesToKeep.length} pages`;
            }
            break;
          }

          case "SPLIT_PDF": {
            // Split into individual pages
            const splitResults = await import("@/utils/pdfOperations").then(m => m.splitPdf(currentFile.file));
            // Download each page
            splitResults.forEach((bytes, idx) => {
              const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${currentFile.name.replace(".pdf", "")}-page-${idx + 1}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            });
            toast({
              title: "Success",
              description: `Split into ${splitResults.length} individual pages`,
            });
            // Mark action as applied
            setMessages((prev) =>
              prev.map((msg) =>
                msg.action === action
                  ? { ...msg, action: { ...action, status: "applied" } }
                  : msg
              )
            );
            return; // Skip the normal download flow
          }

          case "CONVERT_TO_IMAGE": {
            // Convert PDF pages to images
            const { convertPdfToImages } = await import("@/utils/pdfOperations");
            const format = (action.outputFormat === "jpg" ? "jpg" : "png") as "png" | "jpg";
            const imagesToConvert = action.pages && action.pages.length > 0
              ? action.pages
              : Array.from({ length: currentFile.pages }, (_, i) => i + 1);

            try {
              const imageResults = await Promise.all(
                imagesToConvert.map((pageNum) =>
                  convertPdfToImages(
                    currentFile.file,
                    format,
                    2, // scale
                    0.95 // quality
                  ).then((results) => results.find((r) => r.page === pageNum))
                )
              );

              imageResults.forEach((imageData, idx) => {
                if (imageData?.url) {
                  const link = document.createElement("a");
                  link.href = imageData.url;
                  link.download = `${currentFile.name.replace(".pdf", "")}-page-${imagesToConvert[idx]}.${format}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              });

              toast({
                title: "Success",
                description: `Converted ${imageResults.filter((r) => r?.url).length} pages to ${format.toUpperCase()}`,
              });

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.action === action
                    ? { ...msg, action: { ...action, status: "applied" } }
                    : msg
                )
              );
            } catch (conversionError) {
              throw new Error(
                `Failed to convert to images: ${
                  conversionError instanceof Error ? conversionError.message : "Unknown error"
                }`
              );
            }
            return;
          }

          default:
            toast({
              title: "Not Implemented",
              description: `Action ${action.type} not yet implemented`,
            });
            return;
        }

        if (resultBytes) {
          // Create download link
          const blob = new Blob([new Uint8Array(resultBytes)], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${currentFile.name.replace(".pdf", "")}-modified.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "Success",
            description,
          });

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
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";

        // Log detailed error info for debugging
        console.error("PDF Action Error:", {
          message: errorMsg,
          action: action.type,
          timestamp: new Date().toISOString(),
          error,
        });

        // Show user-friendly error message
        toast({
          title: "Failed to apply action",
          description:
            errorMsg.includes("memory") || errorMsg.includes("large")
              ? "File is too large to process. Try a smaller file."
              : errorMsg.includes("encrypted")
              ? "PDF appears to be encrypted or password-protected."
              : errorMsg || "An error occurred while processing your PDF",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [pdfData, toast]
  );

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col border-r border-border min-h-0 min-w-0 overflow-hidden">
          {!pdfData ? (
            // Upload Area
            <PdfUpload onFileUpload={handleFileUpload} />
          ) : (
            // Gallery + Preview Split View
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Gallery Sidebar */}
              <div className="flex flex-1 flex-col min-h-0 lg:max-w-xs">
                <PdfGallery
                  files={pdfData.files}
                  currentFileId={pdfData.currentFileId}
                  onSelectFile={handleSelectFile}
                  onAddMore={() => setShowUploadMore(true)}
                  onRemoveFile={handleRemoveFile}
                />
              </div>

              {/* Preview Area */}
              <div className="flex flex-1 flex-col min-h-0">
                <PdfPreview
                  data={pdfData}
                  onClear={handleClearFiles}
                  onNextPage={handleNextPage}
                  onPrevPage={handlePrevPage}
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload More Modal Overlay */}
        {showUploadMore && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center lg:hidden">
            <div className="w-full max-w-xl mx-4">
              <div className="rounded-lg border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h2 className="font-semibold text-foreground">Add More PDFs</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowUploadMore(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <PdfUpload onFileUpload={handleFileUpload} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Chat Toggle Button */}
        {pdfData && (
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
          {pdfData && (
            <PdfChatInterface
              pdfData={pdfData}
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
          <PdfChatInterface
            pdfData={pdfData}
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

export default PdfDashboard;
