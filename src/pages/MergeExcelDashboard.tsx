import { useState } from "react";
import { Files, Download, Plus, AlertTriangle } from "lucide-react";
import MultiExcelUpload from "@/components/dashboard/MultiExcelUpload";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SheetData } from "@/types/excel";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  validateMergeOperation,
  checkDuplicateSheetNames,
  generateUniqueSheetName,
  sanitizeSheetName,
} from "@/utils/mergeValidation";

interface ProcessedFile {
  name: string;
  data: { [sheetName: string]: SheetData };
}

const MergeExcelDashboard = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleFilesUpload = (newFiles: ProcessedFile[]) => {
    setFiles(newFiles);
    
    // Validate both merge modes
    const sheetsValidation = validateMergeOperation(newFiles, "sheets");
    const singleValidation = validateMergeOperation(newFiles, "single");
    
    // Combine validation results
    const combinedValidation = {
      valid: sheetsValidation.valid && singleValidation.valid,
      errors: [...sheetsValidation.errors, ...singleValidation.errors],
      warnings: [...sheetsValidation.warnings, ...singleValidation.warnings],
    };
    
    setValidationResult(combinedValidation);
  };

  const handleMerge = (mode: "sheets" | "single") => {
    if (files.length === 0) return;

    // Validate before merge
    const validation = validateMergeOperation(files, mode);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Cannot merge files",
        description: validation.errors.join(". "),
      });
      return;
    }

    try {
      const newWorkbook = XLSX.utils.book_new();

      if (mode === "sheets") {
        // Check for duplicates and generate unique names
        const { duplicates } = checkDuplicateSheetNames(files);
        const usedNames: string[] = [];

        // Merge as separate sheets
        files.forEach((file) => {
          Object.entries(file.data).forEach(([sheetName, sheetData]) => {
            // Generate unique sheet name
            const baseName = `${file.name.replace(/\.[^/.]+$/, "")}_${sheetName}`;
            const finalName = generateUniqueSheetName(baseName, usedNames, 31);
            usedNames.push(finalName);
            
            const wsData = [sheetData.headers, ...sheetData.rows];
            const worksheet = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(newWorkbook, worksheet, finalName);
          });
        });

        if (duplicates.length > 0) {
          toast({
            title: "Duplicate sheet names detected",
            description: `${duplicates.length} sheets were renamed to avoid conflicts.`,
          });
        }
      } else {
        // Validate header compatibility for single mode
        const firstFile = files[0];
        const firstSheetName = Object.keys(firstFile.data)[0];
        const headers = firstFile.data[firstSheetName].headers;
        
        // Merge into a single sheet
        const combinedRows = files.flatMap(file => 
          Object.values(file.data).flatMap(sheet => sheet.rows)
        );

        const wsData = [headers, ...combinedRows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, "Merged Data");
      }

      XLSX.writeFile(newWorkbook, "merged_excel.xlsx");
      toast({
        title: "Success",
        description: "Excel files merged and downloaded successfully!",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        variant: "destructive",
        title: "Merge failed",
        description: message || "An error occurred during merging",
      });
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-1 flex-col items-center p-6 space-y-8 pb-20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Files className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Merge Excel</h1>
          <p className="mt-2 text-muted-foreground">
            Gabungkan beberapa file Excel menjadi satu file.
          </p>
        </div>

        <MultiExcelUpload onFilesUpload={handleFilesUpload} />

        {validationResult && validationResult.warnings.length > 0 && (
          <Alert variant="warning" className="max-w-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2">
                {validationResult.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Button 
              onClick={() => handleMerge("sheets")}
              disabled={validationResult?.valid === false}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Merge as Separate Sheets
            </Button>
            <Button 
              onClick={() => handleMerge("single")}
              disabled={validationResult?.valid === false}
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary/5"
            >
              <Download className="h-4 w-4" />
              Merge into One Sheet
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MergeExcelDashboard;
