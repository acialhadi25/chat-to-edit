import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Loader2, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { PDFData } from "@/types/pdf";
import { useToast } from "@/hooks/use-toast";

// Set up the worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfPreviewProps {
  data: PDFData;
  onClear: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

const PdfPreview = ({ data, onClear, onNextPage, onPrevPage }: PdfPreviewProps) => {
  const [pageCanvases, setPageCanvases] = useState<HTMLCanvasElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const currentFile = data.files.find((f) => f.id === data.currentFileId);

  useEffect(() => {
    if (!currentFile) return;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await currentFile.file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const canvases: HTMLCanvasElement[] = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            await page.render(renderContext).promise;
            canvases.push(canvas);
          }
        }

        setPageCanvases(canvases);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to load PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [currentFile, toast]);

  const handleDownloadCurrent = useCallback(async () => {
    if (!currentFile) return;

    try {
      const url = currentFile.url;
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Downloaded",
        description: `${currentFile.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  }, [currentFile, toast]);

  const handleNextPage = useCallback(() => {
    if (data.currentPageIndex < (currentFile?.pages || 0) - 1) {
      onNextPage?.();
    }
  }, [currentFile?.pages, data.currentPageIndex, onNextPage]);

  const handlePrevPage = useCallback(() => {
    if (data.currentPageIndex > 0) {
      onPrevPage?.();
    }
  }, [data.currentPageIndex, onPrevPage]);

  const currentPageCanvas = pageCanvases[data.currentPageIndex];

  // Copy canvas content to ref whenever page changes
  useLayoutEffect(() => {
    if (canvasRef.current && currentPageCanvas) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        // Set canvas dimensions
        canvasRef.current.width = currentPageCanvas.width;
        canvasRef.current.height = currentPageCanvas.height;
        // Draw the page canvas to the ref canvas
        ctx.drawImage(currentPageCanvas, 0, 0);
      }
    }
  }, [currentPageCanvas]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{currentFile?.name}</h3>
          <p className="text-xs text-muted-foreground">
            Page {data.currentPageIndex + 1} of {currentFile?.pages || 0}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={data.currentPageIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {data.currentPageIndex + 1} / {currentFile?.pages || 0}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={data.currentPageIndex >= (currentFile?.pages || 0) - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="border-l border-border mx-2 h-6" />
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(zoom + 0.2, 2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(zoom - 0.2, 0.8))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownloadCurrent}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Display */}
      <ScrollArea className="flex-1">
        <div className="flex items-center justify-center p-6 min-h-0">
          {currentPageCanvas ? (
            <div
              style={{
                transform: `scale(${zoom}) rotate(${data.rotation}deg)`,
                transformOrigin: "center",
                transition: "transform 0.2s ease-out",
              }}
            >
              <canvas
                ref={canvasRef}
                width={currentPageCanvas.width}
                height={currentPageCanvas.height}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to render page</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfPreview;
