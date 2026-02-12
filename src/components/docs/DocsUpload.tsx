import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DocsData } from "@/types/docs";
import { extractTextFromDocx, extractHtmlFromDocx, analyzeDocument } from "@/utils/docsOperations";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

interface DocsUploadProps {
  onDocumentLoad: (data: DocsData) => void;
}

const DocsUpload = ({ onDocumentLoad }: DocsUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toast } = useToast();
  const { checkCanUpload } = useUsageLimit();

  const processFile = useCallback(
    async (file: File) => {
      try {
        let content = "";
        let htmlContent: string | undefined = undefined;

        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          // DOCX file - extract both text and HTML
          console.log("Processing DOCX file:", file.name);
          content = await extractTextFromDocx(file);
          console.log("Extracted text length:", content.length);

          try {
            htmlContent = await extractHtmlFromDocx(file);
            console.log("Extracted HTML length:", htmlContent?.length);
            console.log("HTML preview:", htmlContent?.substring(0, 300));
          } catch (htmlError) {
            console.warn("Failed to extract HTML from DOCX, using text only:", htmlError);
            // Fallback: set htmlContent to text-based HTML
            htmlContent = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
          }
        } else if (file.type === "text/plain" || file.type === "text/markdown") {
          // TXT or MD file
          content = await file.text();
        } else {
          toast({
            title: "Invalid File Type",
            description: "Please upload .docx, .txt, or .md files",
            variant: "destructive",
          });
          return null;
        }

        const analysis = analyzeDocument(content);

        const docsData: DocsData = {
          id: crypto.randomUUID(),
          fileName: file.name,
          content,
          htmlContent, // Store HTML if available
          docxFile: file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? file : undefined, // Store original DOCX file for docx-preview
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ""),
            wordCount: analysis.wordCount,
          },
          sections: [],
        };

        return docsData;
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        const file = acceptedFiles[0]; // Only take first file
        const processed = await processFile(file);

        if (processed) {
          onDocumentLoad(processed);
          toast({
            title: "Success",
            description: `Loaded ${file.name}`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process file",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [onDocumentLoad, processFile, toast, checkCanUpload]
  );

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      const hasFileInvalidType = errors.some((e: any) => e.code === "file-invalid-type");
      const hasTooManyFiles = errors.some((e: any) => e.code === "too-many-files");

      if (hasTooManyFiles) {
        toast({
          title: "Too many files",
          description: "Only one document can be uploaded at a time.",
          variant: "destructive",
        });
      } else if (hasFileInvalidType) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not supported. Please upload .docx, .txt, or .md files.`,
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
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    multiple: false,
    disabled: isProcessing,
    maxSize: 20 * 1024 * 1024, // 20MB for documents
  });

  const handleCreateNew = useCallback(() => {
    const docsData: DocsData = {
      id: crypto.randomUUID(),
      fileName: "Untitled Document",
      content: "",
      metadata: {
        title: "Untitled Document",
      },
      sections: [],
    };

    onDocumentLoad(docsData);
  }, [onDocumentLoad]);

  if (documentContent) {
    return null; // Document loaded, don't show upload
  }

  return (
    <>
    <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
        {/* Create New Button */}
        <Button onClick={handleCreateNew} className="w-full gap-2 h-10 sm:h-12 text-sm sm:text-base">
          <Plus className="h-4 w-4" />
          Create New Document
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Upload Area */}
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
            <p className="text-base sm:text-lg font-semibold text-primary">Drop your document here</p>
          ) : (
            <>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-2">
                Upload a Document
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Drag and drop your .docx, .txt, or .md file here
              </p>
              <p className="text-xs text-muted-foreground">
                Or click to select a file
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
      </div>

      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p>Start writing, rewriting, translating, or formatting your documents with AI assistance.</p>
      </div>
    </div>
    </>
  );
};

export default DocsUpload;
