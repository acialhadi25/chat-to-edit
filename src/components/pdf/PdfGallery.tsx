import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, X, Plus } from "lucide-react";
import { PDFFile } from "@/types/pdf";
import { useToast } from "@/hooks/use-toast";

// Set up the worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfGalleryProps {
  files: PDFFile[];
  currentFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddMore: () => void;
  onRemoveFile: (fileId: string) => void;
}

interface FileThumbnail {
  fileId: string;
  imageData: string | null;
  isLoading: boolean;
}

const PdfGallery = ({
  files,
  currentFileId,
  onSelectFile,
  onAddMore,
  onRemoveFile,
}: PdfGalleryProps) => {
  const [thumbnails, setThumbnails] = useState<Map<string, FileThumbnail>>(new Map());
  const { toast } = useToast();

  // Generate thumbnail for a file
  const generateThumbnail = useCallback(async (file: PDFFile) => {
    setThumbnails((prev) => new Map(prev).set(file.id, { fileId: file.id, imageData: null, isLoading: true }));

    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdfDoc.getPage(1);

      // Render first page at lower resolution for thumbnail
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (context) {
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const imageData = canvas.toDataURL("image/png");

        setThumbnails((prev) =>
          new Map(prev).set(file.id, { fileId: file.id, imageData, isLoading: false })
        );
      }
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${file.name}:`, error);
      setThumbnails((prev) =>
        new Map(prev).set(file.id, { fileId: file.id, imageData: null, isLoading: false })
      );
    }
  }, []);

  // Generate thumbnails for all files
  useEffect(() => {
    files.forEach((file) => {
      if (!thumbnails.has(file.id)) {
        generateThumbnail(file);
      }
    });
  }, [files, thumbnails, generateThumbnail]);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No PDFs Uploaded</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload PDF files to get started</p>
        </div>
        <Button onClick={onAddMore} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Gallery Header */}
      <div className="border-b border-border bg-card p-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-semibold text-foreground">PDF Gallery</h3>
          <p className="text-xs text-muted-foreground">{files.length} file(s) uploaded</p>
        </div>
        <Button onClick={onAddMore} variant="outline" size="sm" className="gap-2">
          <Plus className="h-3 w-3" />
          Add More
        </Button>
      </div>

      {/* Gallery Grid */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {files.map((file) => {
            const thumbnail = thumbnails.get(file.id);
            const isSelected = currentFileId === file.id;

            return (
              <div
                key={file.id}
                className={`group relative cursor-pointer rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/20"
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                {/* Thumbnail Container */}
                <div className="aspect-[3/4] relative overflow-hidden rounded-t-md bg-muted">
                  {thumbnail?.isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : thumbnail?.imageData ? (
                    <img
                      src={thumbnail.imageData}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-3 border-t border-border">
                  <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                    {file.name.replace(".pdf", "")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.pages} pages • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove file"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>

                {/* Selection Badge */}
                {isSelected && (
                  <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    Viewing
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PdfGallery;
