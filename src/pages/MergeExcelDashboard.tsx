import { useState } from "react";
import { Files, Download, Plus } from "lucide-react";
import MultiExcelUpload from "@/components/dashboard/MultiExcelUpload";
import { Button } from "@/components/ui/button";
import { SheetData } from "@/types/excel";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProcessedFile {
  name: string;
  data: { [sheetName: string]: SheetData };
}

const MergeExcelDashboard = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const { toast } = useToast();

  const handleMerge = (mode: "sheets" | "single") => {
    if (files.length === 0) return;

    try {
      const newWorkbook = XLSX.utils.book_new();

      if (mode === "sheets") {
        // Merge as separate sheets
        files.forEach((file) => {
          Object.entries(file.data).forEach(([sheetName, sheetData]) => {
            // Avoid duplicate sheet names
            let finalName = `${file.name.replace(/\.[^/.]+$/, "")}_${sheetName}`;
            if (finalName.length > 31) finalName = finalName.substring(0, 31);
            
            const wsData = [sheetData.headers, ...sheetData.rows];
            const worksheet = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(newWorkbook, worksheet, finalName);
          });
        });
      } else {
        // Merge into a single sheet (assuming same headers)
        const firstFile = files[0];
        const firstSheetName = Object.keys(firstFile.data)[0];
        const headers = firstFile.data[firstSheetName].headers;
        
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Merge failed",
        description: error.message || "An error occurred during merging",
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

        <MultiExcelUpload onFilesUpload={setFiles} />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center mt-6">
            <Button 
              onClick={() => handleMerge("sheets")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Merge as Separate Sheets
            </Button>
            <Button 
              onClick={() => handleMerge("single")}
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
