import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, Loader2, Files } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { SheetData } from "@/types/excel";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradeModal from "./UpgradeModal";

interface MultiExcelUploadProps {
  onFilesUpload: (files: { name: string; data: { [sheetName: string]: SheetData } }[]) => void;
}

const MultiExcelUpload = ({ onFilesUpload }: MultiExcelUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toast } = useToast();
  const { checkCanUpload } = useUsageLimit();

  const normalizeCell = (value: string | number | null | undefined): string | number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      return trimmed;
    }
    if (typeof value === "number") return value;
    return String(value);
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const processedFiles: { name: string; data: { [sheetName: string]: SheetData } }[] = [];

    try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheets = workbook.SheetNames;
        const allSheets: { [sheetName: string]: SheetData } = {};

        for (const sheetName of sheets) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(
            worksheet,
            {
              header: 1,
              defval: null,
            }
          );

          const headers = (jsonData[0] as (string | number | null)[] || []).map(h =>
            h === null ? "" : String(h).trim()
          );
          const rows = (jsonData.slice(1) || []) as (string | number | null)[][];

          const normalizedRows = rows.map(row => {
            const newRow = row.map(cell => normalizeCell(cell));
            while (newRow.length < headers.length) {
              newRow.push(null);
            }
            return newRow.slice(0, headers.length);
          });

          allSheets[sheetName] = { headers, rows: normalizedRows };
        }
        processedFiles.push({ name: file.name, data: allSheets });
      }

      onFilesUpload(processedFiles);
      toast({
        title: "Files uploaded successfully!",
        description: `${files.length} files processed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to process files",
        description: error.message || "Please ensure the Excel files are valid",
      });
      setSelectedFiles([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const { allowed } = checkCanUpload();
        if (!allowed) {
          setShowUpgrade(true);
          return;
        }
        const newFiles = [...selectedFiles, ...acceptedFiles];
        setSelectedFiles(newFiles);
        processFiles(newFiles);
      }
    },
    [selectedFiles, checkCanUpload]
  );

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    processFiles(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <div className="w-full max-w-2xl space-y-6">
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/50"
          } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Processing files...</p>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-2 text-lg font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop Excel files"}
              </p>
              <p className="text-sm text-muted-foreground">
                Upload multiple files to merge them together
              </p>
            </>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Files className="h-4 w-4" />
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MultiExcelUpload;
