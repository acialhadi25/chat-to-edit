import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardEdit,
  Plus,
  Download,
  Trash2,
  Save,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Search,
  Table2,
  ArrowRight,
  FileSpreadsheet,
  Settings2,
  LayoutDashboard,
  Type,
  Hash,
  Calendar,
  ListOrdered,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  X,
  MessageSquare,
  Sparkles,
  Wand2,
  FileJson,
  ChevronUp,
  ChevronDown,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  options?: string[]; // for select type
  required: boolean;
  placeholder?: string;
}

const DataEntryDashboard = () => {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    fileName: string;
    sheets: { name: string; headers: string[]; data: any[][]; formulas?: { col: string; formula: string }[] }[];
  } | null>(null);
  const { toast } = useToast();

  const presetPrompts = [
    { title: "Laporan Penjualan Bulanan", desc: "Produk, Harga, Terjual, Total (Formula)" },
    { title: "Absensi Karyawan", desc: "Nama, Tanggal, Jam Masuk, Jam Keluar, Durasi" },
    { title: "Anggaran Proyek", desc: "Item, Biaya Satuan, Qty, Subtotal (Formula)" },
    { title: "Inventaris Gudang", desc: "Kode, Barang, Stok Awal, Masuk, Keluar, Sisa (Formula)" },
    { title: "Analisis Harga (Advanced)", desc: "Pencarian Harga Produk menggunakan INDEX & MATCH" },
  ];

  const handleSmartGenerate = () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);

    // MOCK AI INTELLIGENCE
    setTimeout(() => {
      const p = prompt.toLowerCase();
      let fileName = "Generasi_Excel_AI";
      let sheets: { name: string; headers: string[]; data: any[][]; formulas?: { col: string; formula: string }[] }[] = [];

      // Logic Deteksi Topik & Kolom
      if (p.includes("jual") || p.includes("sales") || p.includes("dagang")) {
        fileName = "Laporan_Penjualan_Bulanan";
        const headers = ["No", "Tanggal", "Nama Pelanggan", "Produk", "Kategori", "Harga Satuan", "Jumlah", "Total Harga"];
        // Formula: Total = Harga * Jumlah
        // Excel formulas must start with =
        const formulas = [{ col: "H", formula: "=F{row}*G{row}" }];

        const sampleData = [
          [1, "2024-02-01", "PT Sinar Jaya", "Laptop ASUS ROG", "Elektronik", 15000000, 2, null],
          [2, "2024-02-01", "CV Abadi Sentosa", "Mouse Logitech MX", "Aksesoris", 1500000, 5, null],
          [3, "2024-02-02", "Budi Santoso", "Monitor LG UltraWide", "Elektronik", 4500000, 1, null],
          [4, "2024-02-03", "Universitas Terbuka", "Proyektor Epson", "Elektronik", 8000000, 3, null],
          [5, "2024-02-04", "Ibu Ani", "Keyboard Mechanical", "Aksesoris", 750000, 2, null],
        ];

        sheets.push({ name: "Data Penjualan", headers, data: sampleData, formulas });

      } else if (p.includes("gaji") || p.includes("payroll") || p.includes("karyawan")) {
        fileName = "Slip_Gaji_Karyawan";
        const headers = ["ID", "Nama Karyawan", "Jabatan", "Gaji Pokok", "Tunjangan Makan", "Tunjangan Transport", "Lembur (Jam)", "Upah Lembur/Jam", "Total Lembur", "Potongan BPJS", "Pajak PPh21", "Gaji Bersih"];

        // Complex Formulas
        const formulas = [
          { col: "I", formula: "=G{row}*H{row}" }, // Total Lembur = Jam * Upah
          { col: "J", formula: "=D{row}*0.03" },   // BPJS 3%
          { col: "K", formula: "=(D{row}+E{row}+F{row}+I{row})*0.05" }, // Pajak 5% dari Bruto
          { col: "L", formula: "=D{row}+E{row}+F{row}+I{row}-J{row}-K{row}" } // Gaji Bersih
        ];

        const sampleData = [
          ["EMP001", "Ahmad Rizki", "Senior Developer", 15000000, 1000000, 500000, 10, 100000, null, null, null, null],
          ["EMP002", "Sarah Putri", "UI/UX Designer", 12000000, 1000000, 500000, 5, 80000, null, null, null, null],
          ["EMP003", "Dodi Setiawan", "QA Engineer", 10000000, 1000000, 500000, 2, 60000, null, null, null, null],
          ["EMP004", "Maya Indah", "HR Manager", 18000000, 1500000, 1000000, 0, 0, null, null, null, null],
        ];

        sheets.push({ name: "Payroll Feb 2024", headers, data: sampleData, formulas });

      } else if (p.includes("stok") || p.includes("inventaris") || p.includes("gudang")) {
        fileName = "Inventaris_Gudang_Elektronik";
        const headers = ["Kode Barang", "Nama Barang", "Kategori", "Lokasi Rak", "Stok Awal", "Barang Masuk", "Barang Keluar", "Stok Akhir", "Status Stok"];

        // Formulas with IF logic
        const formulas = [
          { col: "H", formula: "=E{row}+F{row}-G{row}" },
          { col: "I", formula: `=IF(H{row}<10, "Order Ulang", "Aman")` }
        ];

        const sampleData = [
          ["EL-001", "Resistor 100 Ohm", "Komponen", "A-01", 500, 200, 150, null, null],
          ["EL-002", "Kapasitor 10uF", "Komponen", "A-02", 200, 50, 180, null, null],
          ["EL-003", "Arduino Uno R3", "Microcontroller", "B-05", 50, 20, 10, null, null],
          ["EL-004", "Sensor Suhu DHT11", "Sensor", "C-01", 30, 0, 25, null, null],
          ["EL-005", "Kabel Jumper Male-Male", "Aksesoris", "D-10", 1000, 0, 200, null, null],
        ];

        sheets.push({ name: "Stok Gudang", headers, data: sampleData, formulas });

      } else if (p.includes("index") || p.includes("match") || p.includes("cari") || p.includes("analisis")) {
        fileName = "Analisis_Harga_Produk";
        const headers = ["ID Produk", "Nama Produk", "Kategori", "Harga Modal", "Margin", "Harga Jual", "", "Cari ID:", "Hasil Pencarian Harga"];

        // Formulas: Calculation + Lookup
        const formulas = [
          { col: "F", formula: "=D{row}*(1+E{row})" }, // Harga Jual = Modal * (1 + Margin)
          { col: "I", formula: `=IFERROR(INDEX(F2:F6, MATCH(H{row}, A2:A6, 0)), "Tidak Ditemukan")` } // INDEX MATCH Lookup
        ];

        const sampleData = [
          ["P001", "Laptop Gaming", "Elektronik", 12000000, 0.2, null, "", "P002", null],
          ["P002", "Mouse Wireless", "Aksesoris", 150000, 0.5, null, "", "P005", null],
          ["P003", "Keyboard Mech", "Aksesoris", 500000, 0.4, null, "", "P001", null],
          ["P004", "Monitor 24 Inch", "Elektronik", 1800000, 0.25, null, "", "X999", null],
          ["P005", "Headset Bluetooth", "Aksesoris", 350000, 0.45, null, "", "", null],
        ];

        sheets.push({ name: "Database Harga", headers, data: sampleData, formulas });

      } else {
        // Fallback / General Parsing
        fileName = "Data_Excel_Custom";
        const words = prompt.split(/[,|\n]/).map(s => s.trim()).filter(s => s);
        let headers: string[] = [];

        if (words.length > 0) {
          headers = words.map(w => w.replace(/^buat(kan)?/i, "").replace(/kolom/i, "").trim()).filter(Boolean);
        }

        if (headers.length === 0) {
          headers = ["No", "Item", "Jumlah", "Harga", "Total"];
        } else {
          // Ensure we have enough headers for a valid table
          if (!headers.includes("No")) headers.unshift("No");
        }

        const sampleData = [
          [1, "Contoh Data 1", 10, 5000, null],
          [2, "Contoh Data 2", 5, 7500, null],
          [3, "Contoh Data 3", 8, 12000, null],
        ];

        // Basic Auto-Sum detection
        const formulas: { col: string; formula: string }[] = [];
        const lastColIdx = headers.length - 1;
        const lastColLetter = String.fromCharCode(65 + lastColIdx); // A=0, B=1...

        if (headers.some(h => h.toLowerCase().includes("total") || h.toLowerCase().includes("jumlah"))) {
          // Simple assume multiplication of previous two columns if they look numeric
          // Or just a placeholder formula
          const prevCol1 = String.fromCharCode(65 + lastColIdx - 2);
          const prevCol2 = String.fromCharCode(65 + lastColIdx - 1);
          formulas.push({ col: lastColLetter, formula: `=${prevCol1}{row}*${prevCol2}{row}` });
        }

        sheets.push({ name: "Sheet1", headers, data: sampleData, formulas });
      }

      setGeneratedPlan({ fileName, sheets });
      setIsAnalyzing(false);
      toast({ title: "Excel Siap!", description: "Formula aktif telah ditambahkan." });

    }, 1500);
  };

  const downloadExcel = () => {
    if (!generatedPlan) return;

    try {
      const wb = XLSX.utils.book_new();

      generatedPlan.sheets.forEach(sheet => {
        const wsData = [sheet.headers, ...sheet.data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Apply Styles
        const range = XLSX.utils.decode_range(ws['!ref']!);

        // 1. Header Styles
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!ws[addr]) continue;
          ws[addr].s = {
            fill: { fgColor: { rgb: "4F46E5" } }, // Indigo
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            border: { bottom: { style: "medium", color: { rgb: "312E81" } } }
          };
        }

        // 2. Column Widths
        ws['!cols'] = sheet.headers.map(() => ({ wch: 15 }));

        // 3. Apply Formulas
        if (sheet.formulas) {
          sheet.formulas.forEach(f => {
            sheet.data.forEach((_, i) => {
              const rowNum = i + 2; // Header is 1
              const addr = `${f.col}${rowNum}`;

              // Ensure cell exists or create it
              if (!ws[addr]) ws[addr] = { t: 's', v: '' };

              // Set formula
              const finalFormula = f.formula.replace(/{row}/g, String(rowNum));
              ws[addr].f = finalFormula;
              delete ws[addr].v; // Remove value to force calculation
              ws[addr].t = 'n'; // Set type to number usually
            });
          });
        }

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      XLSXStyle.writeFile(wb, `${generatedPlan.fileName}.xlsx`);
      toast({ title: "Berhasil Download", description: `File ${generatedPlan.fileName} tersimpan.` });

    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Gagal Export", description: "Terjadi kesalahan sistem." });
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto w-full bg-background">
      <div className="mx-auto w-full max-w-5xl py-8 px-4 sm:px-6 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-muted rounded-2xl mb-4">
            <Sparkles className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold text-foreground">
              AI Excel Generator
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Apa yang ingin Anda buat hari ini?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Jelaskan kebutuhan Anda, AI akan membuatkan struktur Excel lengkap dengan rumus dan styling profesional dalam hitungan detik.
          </p>
        </div>

        {/* Input Card */}
        <Card className="border shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="p-1">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Buatkan tabel absen karyawan bulan Januari dengan kolom Nama, Tanggal, Masuk, Keluar, dan hitung Total Jam Kerja..."
                className="min-h-[160px] border-0 focus-visible:ring-0 resize-none text-xl p-6 bg-transparent placeholder:text-muted-foreground/50 text-foreground"
              />
            </div>
            <div className="bg-muted/50 p-4 flex items-center justify-between border-t border-border">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Auto-Formula</span>
                <span className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Professional Style</span>
              </div>
              <Button
                onClick={handleSmartGenerate}
                disabled={isAnalyzing || !prompt}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-12 px-8 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    Sedang Berpikir...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Excel
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        {!generatedPlan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetPrompts.map((preset, i) => (
              <button
                key={i}
                onClick={() => setPrompt(`Buatkan ${preset.title} dengan kolom ${preset.desc}`)}
                className="text-left p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="font-semibold text-foreground group-hover:text-primary flex items-center">
                  {preset.title}
                  <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">{preset.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Generated Result Preview */}
        {generatedPlan && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="border border-border shadow-md bg-card overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{generatedPlan.fileName}.xlsx</h3>
                    <p className="text-xs text-muted-foreground">Siap untuk diunduh</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  Ready
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        {generatedPlan.sheets[0].headers.map((h, i) => (
                          <TableHead key={i} className="font-bold text-foreground">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedPlan.sheets[0].data.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell: any, j: number) => (
                            <TableCell key={j} className="text-muted-foreground">{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-muted/50 flex justify-end gap-3 border-t border-border">
                <Button variant="ghost" onClick={() => setGeneratedPlan(null)}>
                  Buat Ulang
                </Button>
                <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
};

export default DataEntryDashboard;
