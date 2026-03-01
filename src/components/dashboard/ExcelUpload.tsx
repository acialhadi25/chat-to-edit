// @ts-nocheck
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { ExcelData, SheetData, MergeRange } from "@/types/excel";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradeModal from "./UpgradeModal";

interface ExcelUploadProps {
  onFileUpload: (data: Omit<ExcelData, "selectedCells" | "pendingChanges"> & { allSheets: { [sheetName: string]: SheetData } }) => void;
}

const ExcelUpload = ({ onFileUpload }: ExcelUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toast } = useToast();
  const { checkCanUpload } = useUsageLimit();

  // Helper to normalize cell values - trim strings, convert empty to null
  const normalizeCell = (value: string | number | null | undefined): string | number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      return trimmed; // Keep trimmed string
    }
    if (typeof value === "number") return value;
    return String(value);
  };

  const processExcelFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheets = workbook.SheetNames;

        // Parse ALL sheets with normalization
        const allSheets: { [sheetName: string]: SheetData } = {};
        const mergedCellsBySheet: { [sheetName: string]: MergeRange[] } = {};
        const cellStylesBySheet: { [sheetName: string]: { [cellRef: string]: any } } = {};

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

          // Normalize row lengths AND cell values
          const normalizedRows = rows.map(row => {
            const newRow = row.map(cell => normalizeCell(cell));
            while (newRow.length < headers.length) {
              newRow.push(null);
            }
            return newRow.slice(0, headers.length);
          });

          // Handle merged cells for this sheet
          const sheetMergedCells: MergeRange[] = [];
          if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
            worksheet['!merges'].forEach((merge: any) => {
              const startRow = merge.s.r - 1; // Adjust for header row
              const endRow = merge.e.r - 1;
              const startCol = merge.s.c;
              const endCol = merge.e.c;

              sheetMergedCells.push({
                startRow,
                endRow,
                startCol,
                endCol,
              });

              // Fill merged cells with the value from the first cell
              const firstCellValue = normalizedRows[startRow]?.[startCol];
              for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                  if (normalizedRows[r] && (r !== startRow || c !== startCol)) {
                    normalizedRows[r][c] = firstCellValue;
                  }
                }
              }
            });
          }

          // Extract cell styles/formatting
          const sheetStyles: { [cellRef: string]: any } = {};
          for (const cellAddress in worksheet) {
            if (cellAddress.startsWith('!')) continue; // Skip metadata
            const cell = worksheet[cellAddress];
            if (cell && cell.s) {
              // Extract style information
              const style: any = {};

              // Background color
              if (cell.s.fill && cell.s.fill.fgColor) {
                const fgColor = cell.s.fill.fgColor;
                let rgb = fgColor.rgb;
                
                // Handle theme colors (convert to actual RGB if needed)
                if (!rgb && fgColor.theme !== undefined) {
                  // Skip theme colors as they might be default/system colors
                  console.log(`Skipping theme color for ${cellAddress}:`, fgColor.theme);
                } else if (rgb) {
                  // Remove FF prefix if present (ARGB format)
                  let bgColor = rgb.startsWith('FF') ? rgb.slice(2) : rgb;
                  
                  // Skip black, very dark, or white backgrounds (likely defaults)
                  const isBlackish = bgColor.match(/^0{5}[0-9A-Fa-f]$/) || bgColor === '000000';
                  const isWhitish = bgColor.match(/^F{5}[0-9A-Fa-f]$/) || bgColor === 'FFFFFF';
                  
                  if (!isBlackish && !isWhitish) {
                    style.backgroundColor = `#${bgColor}`;
                    console.log(`Extracted background for ${cellAddress}: #${bgColor}`);
                  } else {
                    console.log(`Skipped background for ${cellAddress}: #${bgColor} (black/white)`);
                  }
                }
              }

              // Font color
              if (cell.s.font) {
                if (cell.s.font.color) {
                  const fontColorObj = cell.s.font.color;
                  let rgb = fontColorObj.rgb;
                  
                  if (!rgb && fontColorObj.theme !== undefined) {
                    // Skip theme colors
                    console.log(`Skipping font theme color for ${cellAddress}`);
                  } else if (rgb) {
                    const fontColor = rgb.startsWith('FF') ? rgb.slice(2) : rgb;
                    style.fontColor = `#${fontColor}`;
                  }
                }
                if (cell.s.font.bold) {
                  style.fontWeight = 'bold';
                }
                if (cell.s.font.sz) {
                  style.fontSize = cell.s.font.sz;
                }
              }

              // Alignment
              if (cell.s.alignment && cell.s.alignment.horizontal) {
                style.textAlign = cell.s.alignment.horizontal;
              }

              // Border
              if (cell.s.border) {
                style.border = true;
              }

              if (Object.keys(style).length > 0) {
                sheetStyles[cellAddress] = style;
              }
            }
          }

          mergedCellsBySheet[sheetName] = sheetMergedCells;
          cellStylesBySheet[sheetName] = sheetStyles;
          allSheets[sheetName] = { headers, rows: normalizedRows };
        }

        const firstSheet = sheets[0];
        if (!allSheets[firstSheet] || allSheets[firstSheet].headers.length === 0) {
          throw new Error("Excel file is empty");
        }

        const excelData = {
          fileName: file.name,
          sheets,
          currentSheet: firstSheet,
          headers: allSheets[firstSheet].headers,
          rows: allSheets[firstSheet].rows,
          formulas: {},
          selectedCells: [],
          pendingChanges: [],
          allSheets,
          mergedCells: mergedCellsBySheet[firstSheet]?.length > 0 ? mergedCellsBySheet[firstSheet] : undefined,
          cellStyles: cellStylesBySheet[firstSheet] || {},
        };

        onFileUpload(excelData);
        toast({
          title: "File uploaded successfully!",
          description: `${file.name} - ${allSheets[firstSheet].rows.length} rows, ${sheets.length} sheet(s)`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to process file",
          description: error.message || "Please ensure the Excel file is valid",
        });
        setSelectedFile(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileUpload, toast]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const { allowed, message } = checkCanUpload();
        if (!allowed) {
          setShowUpgrade(true);
          return;
        }
        setSelectedFile(file);
        processExcelFile(file);
      }
    },
    [processExcelFile, checkCanUpload]
  );

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

      // Check for specific rejection reasons
      const hasFileTooLarge = errors.some((e: any) => e.code === "file-too-large");
      const hasFileInvalidType = errors.some((e: any) => e.code === "file-invalid-type");
      const hasTooManyFiles = errors.some((e: any) => e.code === "too-many-files");

      if (hasFileTooLarge) {
        toast({
          title: "File too large",
          description: `${file.name} (${fileSizeMB}MB) exceeds the 10MB limit. Try uploading a smaller file.`,
          variant: "destructive",
        });
      } else if (hasFileInvalidType) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not supported. Only .xlsx and .xls files are allowed.`,
          variant: "destructive",
        });
      } else if (hasTooManyFiles) {
        toast({
          title: "Too many files",
          description: "Only one file can be uploaded at a time.",
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Upload Excel File
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Drag & drop an Excel file or click to browse
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 transition-all hover:bg-primary/10 group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Belum punya data untuk dites?</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gunakan template profesional kami untuk mencoba fitur AI Excel.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                onClick={() => {
                  // We'll expose this via a prop or handle it in the parent?
                  // Actually, the Gallery state is in ExcelDashboard. 
                  // Let's check how to trigger it.
                  (window as any).dispatchEvent(new CustomEvent('open-template-gallery'));
                }}
              >
                Browse Templates
              </Button>
            </div>
          </div>

          {selectedFile && !isProcessing ? (
            <div className="rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-accent flex-shrink-0">
                  <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="flex-shrink-0"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps({
                role: "button",
                tabIndex: 0,
                "aria-label": "Upload Excel file - drag and drop or click to select"
              })}
              className={`cursor-pointer rounded-lg sm:rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition-colors outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
                } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
            >
              <input {...getInputProps()} />

              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="mb-4 h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                  <p className="text-sm sm:text-base font-medium text-foreground">Processing file...</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-accent">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <p className="mb-2 text-base sm:text-lg font-medium text-foreground">
                    {isDragActive ? "Drop your file here" : "Drag & drop Excel file"}
                  </p>
                  <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <Button variant="outline" size="sm">
                    Browse Files
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Format: .xlsx, .xls • Max: 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExcelUpload;
