import { useCallback, useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCcw, X, BookOpen } from "lucide-react";
import { DocsData } from "@/types/docs";
import { analyzeDocument, createDocxFromText, exportToPdf, renderDocxPreview } from "@/utils/docsOperations";
import { useToast } from "@/hooks/use-toast";
import MarkdownContent from "@/components/dashboard/MarkdownContent";

interface DocsEditorProps {
  document: DocsData;
  onContentChange: (content: string) => void;
  onClear: () => void;
}

const DocsEditor = ({ document: docData, onContentChange, onClear }: DocsEditorProps) => {
  const [content, setContent] = useState(docData.content);
  const [showPreview, setShowPreview] = useState(false);
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const styleContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-show preview when a DOCX file is loaded
  useEffect(() => {
    if (docData.docxFile && !showPreview) {
      setShowPreview(true);
    }
  }, [docData.docxFile]);

  // Render DOCX preview using docx-preview library with full fidelity
  useEffect(() => {
    if (showPreview && docData.docxFile && previewContainerRef.current) {
      setIsRenderingDocx(true);
      console.log("Rendering DOCX preview for:", docData.docxFile.name);

      (async () => {
        try {
          // Clear previous content
          if (previewContainerRef.current) {
            previewContainerRef.current.innerHTML = "";
          }
          if (styleContainerRef.current) {
            styleContainerRef.current.innerHTML = "";
          }

          // Import and render using docx-preview with maximum fidelity options
          const { renderAsync } = await import("docx-preview");
          const arrayBuffer = await docData.docxFile!.arrayBuffer();

          if (previewContainerRef.current) {
            await renderAsync(arrayBuffer, previewContainerRef.current, styleContainerRef.current || undefined, {
              className: "docx-preview-content",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              ignoreLastRenderedPageBreak: false,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
              renderChanges: false,
              renderComments: false,
              experimental: true,
              trimXmlDeclaration: true,
              useBase64URL: true,
              debug: false,
            });
            console.log("✓ DOCX preview rendered successfully with full fidelity");
          }
        } catch (error) {
          console.error("Error rendering DOCX preview:", error);
          toast({
            title: "Preview Error",
            description: "Failed to render DOCX preview. Falling back to text view.",
            variant: "destructive",
          });
          setShowPreview(false);
        } finally {
          setIsRenderingDocx(false);
        }
      })();
    }
  }, [showPreview, docData.docxFile, toast]);

  const analysis = analyzeDocument(content);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      // Clear HTML content when user edits in plain text mode
      // They will need to re-preview to see HTML
      onContentChange(newContent);
    },
    [onContentChange]
  );

  const handleDownloadDocx = useCallback(async () => {
    try {
      const bytes = await createDocxFromText(
        docData.metadata.title || "Document",
        content
      );
      const blob = new Blob([bytes as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${(docData.metadata.title || "document").replace(/\s+/g, "-")}.docx`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Document exported as DOCX",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export document",
        variant: "destructive",
      });
    }
  }, [content, docData, toast]);

  const handleDownloadPdf = useCallback(() => {
    try {
      exportToPdf(docData.metadata.title || "Document", content);
      toast({
        title: "Opening Print Dialog",
        description: "Save as PDF from your browser",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export as PDF",
        variant: "destructive",
      });
    }
  }, [content, docData, toast]);

  const handleDownloadMarkdown = useCallback(() => {
    try {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${(docData.metadata.title || "document").replace(/\s+/g, "-")}.md`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Document exported as Markdown",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export document",
        variant: "destructive",
      });
    }
  }, [content, docData, toast]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <h3 className="font-semibold text-foreground">
                {docData.metadata.title || "Untitled"}
              </h3>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline">{analysis.wordCount} words</Badge>
                <Badge variant="outline">{analysis.readingTimeMinutes} min read</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              title="Toggle preview"
            >
              <BookOpen className="h-4 w-4" />
            </Button>

            {/* Export Menu */}
            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadDocx}
                title="Export as DOCX"
              >
                <Download className="h-4 w-4 mr-1" />
                DOCX
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPdf}
                title="Export as PDF"
              >
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadMarkdown}
                title="Export as Markdown"
              >
                MD
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div className="flex-1 overflow-auto bg-gray-100 relative">
          {/* Hidden container for docx-preview styles - it injects CSS here */}
          <div ref={styleContainerRef} className="docx-style-container" />

          {/* 
            IMPORTANT: We do NOT override docx-preview's generated styles.
            docx-preview reads the actual OOXML styles from the .docx file and 
            generates precise CSS. Custom CSS overrides would break fidelity.
            We only add minimal wrapper styling for the page appearance.
          */}
          <style>{`
            /* Wrapper styling - mimics document viewer like Google Docs / MS Word Online */
            .docx-preview-wrapper {
              min-height: 100%;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              background: #e8eaed;
            }

            /* The docx-preview library's wrapper element */
            .docx-preview-wrapper .docx-wrapper {
              background: white !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 2px;
              max-width: 100%;
              margin: 0 auto;
            }

            /* Page sections within the wrapper */
            .docx-preview-wrapper .docx-wrapper > section.docx {
              box-shadow: none !important;
              margin-bottom: 10px;
            }

            /* Ensure images respect container width */
            .docx-preview-wrapper img {
              max-width: 100%;
              height: auto;
            }

            /* Print-friendly: hide wrapper shadow */
            @media print {
              .docx-preview-wrapper {
                padding: 0;
                background: white;
              }
              .docx-preview-wrapper .docx-wrapper {
                box-shadow: none;
              }
            }
          `}</style>

          {isRenderingDocx ? (
            <div className="flex items-center justify-center h-full min-h-96">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <p className="text-sm text-muted-foreground">Rendering document preview...</p>
              </div>
            </div>
          ) : docData.docxFile ? (
            <div ref={previewContainerRef} className="docx-preview-wrapper" />
          ) : docData.htmlContent ? (
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm my-5 rounded">
              <div
                className="docx-content prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: docData.htmlContent }}
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm my-5 rounded">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownContent content={content} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing or paste your document here..."
          className="flex-1 resize-none rounded-none border-0 text-base"
        />
      )}

      {/* Stats Footer */}
      <div className="border-t border-border bg-card px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>{analysis.paragraphCount} paragraphs</span>
          <span>{analysis.sentenceCount} sentences</span>
          <span>{analysis.uniqueWords} unique words</span>
        </div>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
};

export default DocsEditor;
