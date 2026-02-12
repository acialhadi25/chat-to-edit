import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFData, PDFFile } from "@/types/pdf";
import { getPdfInfo } from "@/utils/pdfOperations";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

interface PdfUploadProps {
  onFileUpload: (data: PDFData) => void;
}

const PdfUpload = ({ onFileUpload }: PdfUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<PDFFile[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toast } = useToast();
  const { checkCanUpload } = useUsageLimit();

  const processPdfFile = useCallback(
    async (file: File) => {
      try {
        // Verify it's a PDF
        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid File",
            description: "Please upload a PDF file",
            variant: "destructive",
          });
          return null;
        }

        // Get PDF info
        const info = await getPdfInfo(file);

        const pdfFile: PDFFile = {
          id: crypto.randomUUID(),
          name: file.name,
          file,
          url: URL.createObjectURL(file),
          pages: info.pages,
          fileSize: file.size,
          uploadedAt: new Date(),
        };

        return pdfFile;
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const { allowed } = checkCanUpload();
      if (!allowed) {
        setShowUpgrade(true);
        return;
      }

      setIsProcessing(true);
      try {
        const processedFiles: PDFFile[] = [];

        for (const file of acceptedFiles) {
          const processed = await processPdfFile(file);
          if (processed) {
            processedFiles.push(processed);
          }
        }

        if (processedFiles.length > 0) {
          setUploadedFiles((prev) => [...prev, ...processedFiles]);

          const pdfData: PDFData = {
            files: [...uploadedFiles, ...processedFiles],
            currentFileId: processedFiles[0].id,
            currentPageIndex: 0,
            rotation: 0,
            selectedPages: [],
          };

          onFileUpload(pdfData);

          toast({
            title: "Success",
            description: `Loaded ${processedFiles.length} PDF file(s)`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process files",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileUpload, processPdfFile, uploadedFiles, toast, checkCanUpload]
  );

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      const hasFileInvalidType = errors.some((e: any) => e.code === "file-invalid-type");

      if (hasFileInvalidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF file. Only .pdf files are supported.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File rejected",
          description: `${file.name} could not be accepted. ${errors.map((e: any) => e.message).join(", ")}`,
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: isProcessing,
    maxSize: 50 * 1024 * 1024, // 50MB for PDFs
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (updated.length === 0) {
        setUploadedFiles([]);
      }
      return updated;
    });
  };

  return (
    <>
    <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {uploadedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={`rounded-lg sm:rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <input {...getInputProps()} />
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            {isDragActive ? (
              <p className="text-base sm:text-lg font-semibold text-primary">Drop PDFs here</p>
            ) : (
              <>
                <p className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Drag PDFs here or click to select
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  You can upload multiple PDF files at once
                </p>
              </>
            )}
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-xs sm:text-sm text-muted-foreground">Processing...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Loaded PDFs</h3>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 sm:p-4"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.pages} pages • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              {...getRootProps()}
              variant="outline"
              className="w-full text-sm"
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : "Add More PDFs"}
            </Button>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          <p>Ready to chat! Ask me to merge, split, extract pages, or perform other operations.</p>
        </div>
      )}
    </div>
    </>
  );
};

export default PdfUpload;
