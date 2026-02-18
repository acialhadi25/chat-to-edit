import { useState, useEffect, useMemo, useCallback } from 'react';
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
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TemplateGallery from '@/components/dashboard/TemplateGallery';
import { ExcelTemplate } from '@/types/template';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  options?: string[]; // for select type
  required: boolean;
  placeholder?: string;
}

const DataEntryDashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    fileName: string;
    sheets: {
      name: string;
      headers: string[];
      data: any[][];
      formulas?: { col: string; formula: string }[];
    }[];
  } | null>(null);
  const { toast } = useToast();

  const presetPrompts = [
    { title: 'Laporan Penjualan Bulanan', desc: 'Produk, Harga, Terjual, Total (Formula)' },
    { title: 'Absensi Karyawan', desc: 'Nama, Tanggal, Jam Masuk, Jam Keluar, Durasi' },
    { title: 'Anggaran Proyek', desc: 'Item, Biaya Satuan, Qty, Subtotal (Formula)' },
    { title: 'Inventaris Gudang', desc: 'Kode, Barang, Stok Awal, Masuk, Keluar, Sisa (Formula)' },
    {
      title: 'Analisis Harga (Advanced)',
      desc: 'Pencarian Harga Produk menggunakan INDEX & MATCH',
    },
  ];

  const handleSmartGenerate = () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);

    // MOCK AI INTELLIGENCE
    setTimeout(() => {
      const p = prompt.toLowerCase();
      let fileName = 'Generasi_Excel_AI';
      const sheets: {
        name: string;
        headers: string[];
        data: any[][];
        formulas?: { col: string; formula: string }[];
      }[] = [];

      // Logic Deteksi Topik & Kolom
      if (p.includes('jual') || p.includes('sales') || p.includes('dagang')) {
        fileName = 'Laporan_Penjualan_Bulanan';
        const headers = [
          'No',
          'Tanggal',
          'Nama Pelanggan',
          'Produk',
          'Kategori',
          'Harga Satuan',
          'Jumlah',
          'Total Harga',
        ];
        const formulas = [{ col: 'H', formula: '=F{row}*G{row}' }];
        const sampleData = [
          [1, '2024-01-01', 'John Doe', 'Laptop Gaming', 'Elektronik', 15000000, 2, null],
          [2, '2024-01-02', 'Jane Smith', 'Mouse Wireless', 'Aksesoris', 250000, 5, null],
          [3, '2024-01-03', 'Ahmad Rizky', 'Keyboard Mech', 'Aksesoris', 750000, 3, null],
        ];
        sheets.push({ name: 'Sales Data', headers, data: sampleData, formulas });
      } else if (p.includes('absen') || p.includes('hadir') || p.includes('attend')) {
        fileName = 'Absensi_Januari_2024';
        const headers = ['No', 'Nama Karyawan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Total Jam'];
        const formulas = [{ col: 'F', formula: '=(E{row}-D{row})*24' }];
        const sampleData = [
          [1, 'Budi Santoso', '2024-01-01', 0.333333, 0.708333, null],
          [2, 'Siti Rahma', '2024-01-01', 0.340277, 0.715277, null],
        ];
        sheets.push({ name: 'Absensi', headers, data: sampleData, formulas });
      } else if (
        p.includes('stok') ||
        p.includes('barang') ||
        p.includes('gudang') ||
        p.includes('stok')
      ) {
        fileName = 'Inventaris_Gudang';
        const headers = [
          'Kode',
          'Nama Barang',
          'Kategori',
          'Stok Awal',
          'Masuk',
          'Keluar',
          'Sisa Stok',
        ];
        const formulas = [{ col: 'G', formula: '=D{row}+E{row}-F{row}' }];
        const sampleData = [
          ['SKU001', 'Kertas A4', 'ATK', 100, 50, 80, null],
          ['SKU002', 'Tinta Printer', 'ATK', 20, 10, 5, null],
        ];
        sheets.push({ name: 'Stok Gudang', headers, data: sampleData, formulas });
      } else if (
        p.includes('index') ||
        p.includes('match') ||
        p.includes('cari') ||
        p.includes('analisis')
      ) {
        fileName = 'Analisis_Harga_Produk';
        const headers = [
          'ID Produk',
          'Nama Produk',
          'Kategori',
          'Harga Modal',
          'Margin',
          'Harga Jual',
          '',
          'Cari ID:',
          'Hasil Pencarian Harga',
        ];
        const formulas = [
          { col: 'F', formula: '=D{row}*(1+E{row})' },
          {
            col: 'I',
            formula: `=IFERROR(INDEX(F2:F6, MATCH(H{row}, A2:A6, 0)), "Tidak Ditemukan")`,
          },
        ];
        const sampleData = [
          ['P001', 'Laptop Gaming', 'Elektronik', 12000000, 0.2, null, '', 'P002', null],
          ['P002', 'Mouse Wireless', 'Aksesoris', 150000, 0.5, null, '', 'P005', null],
          ['P003', 'Keyboard Mech', 'Aksesoris', 500000, 0.4, null, '', 'P001', null],
          ['P004', 'Monitor 24 Inch', 'Elektronik', 1800000, 0.25, null, '', 'X999', null],
          ['P005', 'Headset Bluetooth', 'Aksesoris', 350000, 0.45, null, '', '', null],
        ];
        sheets.push({ name: 'Database Harga', headers, data: sampleData, formulas });
      } else {
        fileName = 'Data_Excel_Custom';
        const words = prompt
          .split(/[,|\n]/)
          .map((s) => s.trim())
          .filter((s) => s);
        let headers: string[] = [];
        if (words.length > 0) {
          headers = words
            .map((w) =>
              w
                .replace(/^buat(kan)?/i, '')
                .replace(/kolom/i, '')
                .trim()
            )
            .filter(Boolean);
        }
        if (headers.length === 0) {
          headers = ['No', 'Item', 'Jumlah', 'Harga', 'Total'];
        } else if (!headers.includes('No')) {
          headers.unshift('No');
        }
        const sampleData = [
          [1, 'Contoh Data 1', 10, 5000, null],
          [2, 'Contoh Data 2', 5, 7500, null],
          [3, 'Contoh Data 3', 8, 12000, null],
        ];
        const formulas: { col: string; formula: string }[] = [];
        const lastColIdx = headers.length - 1;
        const lastColLetter = String.fromCharCode(65 + lastColIdx);
        if (
          headers.some(
            (h) => h.toLowerCase().includes('total') || h.toLowerCase().includes('jumlah')
          )
        ) {
          const prevCol1 = String.fromCharCode(65 + lastColIdx - 2);
          const prevCol2 = String.fromCharCode(65 + lastColIdx - 1);
          formulas.push({ col: lastColLetter, formula: `=${prevCol1}{row}*${prevCol2}{row}` });
        }
        sheets.push({ name: 'Sheet1', headers, data: sampleData, formulas });
      }
      setGeneratedPlan({ fileName, sheets });
      setIsAnalyzing(false);
      toast({ title: 'Excel Siap!', description: 'Formula aktif telah ditambahkan.' });
    }, 1500);
  };

  const handleSelectTemplate = (template: ExcelTemplate) => {
    setGeneratedPlan({
      fileName: template.name,
      sheets: [
        {
          name: 'Sheet1',
          headers: template.headers,
          data: template.sampleData,
          formulas:
            template.formulas?.map((f) => ({
              col: getColumnLetter(f.column),
              formula: f.formula,
            })) || [],
        },
      ],
    });
    setShowGallery(false);
    toast({ title: 'Template Digunakan', description: `${template.name} berhasil dimuat.` });
  };

  function getColumnLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  const downloadExcel = () => {
    if (!generatedPlan) return;
    try {
      const wb = XLSX.utils.book_new();
      generatedPlan.sheets.forEach((sheet) => {
        const wsData = [sheet.headers, ...sheet.data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        if (sheet.formulas) {
          sheet.formulas.forEach((f) => {
            sheet.data.forEach((_, i) => {
              const rowNum = i + 2;
              const cellAddr = `${f.col}${rowNum}`;
              if (!ws[cellAddr]) ws[cellAddr] = { t: 'n', v: 0 };
              ws[cellAddr].f = f.formula.replace(/\{row\}/g, String(rowNum));
            });
          });
        }
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });
      XLSX.writeFile(wb, `${generatedPlan.fileName}.xlsx`);
      toast({
        title: 'Download Berhasil',
        description: `${generatedPlan.fileName}.xlsx telah diunduh.`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Download Gagal',
        description: 'Terjadi kesalahan saat membuat file.',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-muted rounded-2xl mb-4">
          <Sparkles className="h-8 w-8 text-primary mr-2" />
          <span className="text-2xl font-bold text-foreground">AI Excel Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Apa yang ingin Anda buat hari ini?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Jelaskan kebutuhan Anda, AI akan membuatkan struktur Excel lengkap dengan rumus dan
          styling profesional.
        </p>
      </div>

      <Card className="border shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-1">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Buatkan tabel absen karyawan bulan Januari dengan kolom Nama, Tanggal, Masuk, Keluar..."
              className="min-h-[160px] border-0 focus-visible:ring-0 resize-none text-xl p-6 bg-transparent placeholder:text-muted-foreground/50 text-foreground"
            />
          </div>
          <div className="bg-muted/50 p-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Auto-Formula
                </span>
                <span className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Professional Style
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowGallery(true)}
                  className="h-12 border-primary/20 hover:bg-primary/5 transition-all rounded-xl font-medium flex-1 sm:flex-none"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
                  Browse Templates
                </Button>
                <Button
                  onClick={handleSmartGenerate}
                  disabled={isAnalyzing || !prompt}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-12 px-8 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full" />{' '}
                      Sedang Berpikir...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" /> Generate Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showGallery && (
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowGallery(false)}
        />
      )}

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
                        <TableHead key={i} className="font-bold text-foreground">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedPlan.sheets[0].data.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell: any, j: number) => (
                          <TableCell key={j} className="text-muted-foreground">
                            {cell}
                          </TableCell>
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
              <Button
                onClick={downloadExcel}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                <Download className="h-4 w-4 mr-2" /> Download File
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataEntryDashboard;
