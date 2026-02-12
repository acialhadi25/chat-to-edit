import { useState } from "react";
import { Scissors, Download, FileJson, FileStack } from "lucide-react";
import ExcelUpload from "@/components/dashboard/ExcelUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExcelData, SheetData } from "@/types/excel";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const SplitExcelDashboard = () => {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [rowsPerFile, setRowsPerFile] = useState<number>(100);
  const { toast } = useToast();

  const handleFileUpload = (data: any) => {
    setExcelData(data);
  };

  const splitBySheets = () => {
    if (!excelData) return;

    try {
      Object.entries(excelData.allSheets).forEach(([sheetName, sheetData]) => {
        const newWorkbook = XLSX.utils.book_new();
        const wsData = [sheetData.headers, ...sheetData.rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
        XLSX.writeFile(newWorkbook, `${excelData.fileName.replace(/\.[^/.]+$/, "")}_${sheetName}.xlsx`);
      });

      toast({
        title: "Success",
        description: `Split into ${excelData.sheets.length} files (one per sheet).`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Split failed",
        description: error.message || "An error occurred while splitting by sheets",
      });
    }
  };

  const splitByRows = () => {
    if (!excelData || !excelData.currentSheet) return;

    try {
      const currentSheetData = excelData.allSheets[excelData.currentSheet];
      const { headers, rows } = currentSheetData;
      const totalRows = rows.length;
      const numFiles = Math.ceil(totalRows / rowsPerFile);

      for (let i = 0; i < numFiles; i++) {
        const start = i * rowsPerFile;
        const end = Math.min(start + rowsPerFile, totalRows);
        const chunkRows = rows.slice(start, end);

        const newWorkbook = XLSX.utils.book_new();
        const wsData = [headers, ...chunkRows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, "Split Data");
        XLSX.writeFile(newWorkbook, `${excelData.fileName.replace(/\.[^/.]+$/, "")}_part_${i + 1}.xlsx`);
      }

      toast({
        title: "Success",
        description: `Split into ${numFiles} files based on ${rowsPerFile} rows per file.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Split failed",
        description: error.message || "An error occurred while splitting by rows",
      });
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-1 flex-col items-center p-6 space-y-8 pb-20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Scissors className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Split Worksheet</h1>
          <p className="mt-2 text-muted-foreground">
            Pecah worksheet besar menjadi beberapa bagian atau file terpisah.
          </p>
        </div>

        {!excelData ? (
          <ExcelUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="w-full max-w-2xl space-y-8">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <FileJson className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{excelData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {excelData.sheets.length} sheets, {excelData.rows.length} rows in current sheet
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setExcelData(null)}
                >
                  Ganti File
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <FileStack className="h-4 w-4 text-primary" />
                    Split by Sheet
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Simpan setiap sheet dalam file ini sebagai file Excel terpisah.
                  </p>
                  <Button 
                    onClick={splitBySheets} 
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    Split Sheets
                  </Button>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Scissors className="h-4 w-4 text-primary" />
                    Split by Rows
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rows" className="text-xs">Baris per file</Label>
                    <Input
                      id="rows"
                      type="number"
                      value={rowsPerFile}
                      onChange={(e) => setRowsPerFile(parseInt(e.target.value) || 1)}
                      className="h-8"
                    />
                  </div>
                  <Button 
                    onClick={splitByRows} 
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Split by Rows
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default SplitExcelDashboard;
