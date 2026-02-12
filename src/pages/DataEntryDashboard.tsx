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
  const [mode, setMode] = useState<"ai" | "builder">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [fields, setFields] = useState<FormField[]>(() => {
    const saved = localStorage.getItem("form_builder_fields");
    return saved ? JSON.parse(saved) : [];
  });
  const [sheetName, setSheetName] = useState(() => {
    return localStorage.getItem("form_builder_sheet_name") || "Input_Form";
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const { toast } = useToast();

  // Missing state variables
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<FormField["type"]>("text");
  const [editFieldRequired, setEditFieldRequired] = useState(false);
  const [editFieldPlaceholder, setEditFieldPlaceholder] = useState("");
  const [editFieldOptions, setEditFieldOptions] = useState("");
  const [currentEntry, setCurrentEntry] = useState<any>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  // AI Parsing Logic
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan instruksi terlebih dahulu" });
      return;
    }

    setIsGenerating(true);

    // Simulating AI Processing (Rule-based parsing for demo)
    setTimeout(() => {
      const prompt = aiPrompt.toLowerCase();
      const detectedFields: FormField[] = [];

      // Basic keyword detection
      const keywords = [
        { key: "nama", label: "Nama Lengkap", type: "text" },
        { key: "umur", label: "Umur", type: "number" },
        { key: "usia", label: "Usia", type: "number" },
        { key: "alamat", label: "Alamat", type: "textarea" },
        { key: "tanggal", label: "Tanggal", type: "date" },
        { key: "email", label: "Email", type: "text" },
        { key: "telepon", label: "No. Telepon", type: "text" },
        { key: "gender", label: "Jenis Kelamin", type: "select", options: ["Laki-laki", "Perempuan"] },
        { key: "status", label: "Status", type: "select", options: ["Menikah", "Belum Menikah"] },
      ];

      keywords.forEach(k => {
        if (prompt.includes(k.key)) {
          detectedFields.push({
            id: Math.random().toString(36).substr(2, 9),
            label: k.label,
            type: k.type as any,
            required: true,
            placeholder: `Masukkan ${k.label.toLowerCase()}...`,
            options: k.options
          });
        }
      });

      // If no keywords found, split by comma or newline
      if (detectedFields.length === 0) {
        const customFields = aiPrompt.split(/[,|\n]/).map(s => s.trim()).filter(s => s);
        customFields.forEach(cf => {
          detectedFields.push({
            id: Math.random().toString(36).substr(2, 9),
            label: cf.charAt(0).toUpperCase() + cf.slice(1),
            type: "text",
            required: true,
            placeholder: `Masukkan ${cf}...`
          });
        });
      }

      setFields(detectedFields);
      setMode("builder");
      setIsGenerating(false);
      toast({ title: "Form Berhasil Dibuat", description: `Berhasil mendeteksi ${detectedFields.length} kolom.` });
    }, 1500);
  };

  const generateExcelFormFile = () => {
    if (fields.length === 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Buat form terlebih dahulu" });
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // SHEET 1: FORM
      const formRows = [
        ["DATA ENTRY FORM"],
        [""],
        ...fields.flatMap(f => [
          [f.label + (f.required ? " *" : "")],
          [""], // Space for input
          [""] // Separator
        ]),
        [""],
        ["SUBMIT DATA"]
      ];

      const wsForm = XLSX.utils.aoa_to_sheet(formRows);

      // Styling and Cell References logic
      // In a real VBA scenario, we would add macros here. 
      // For now, we provide the layout that is ready for data entry.

      // SHEET 2: DATABASE
      const headers = fields.map(f => f.label);
      const wsDb = XLSX.utils.aoa_to_sheet([headers]);

      XLSX.utils.book_append_sheet(wb, wsForm, "Form_Input");
      XLSX.utils.book_append_sheet(wb, wsDb, "Database");

      XLSX.writeFile(wb, `${sheetName}.xlsx`);

      toast({
        title: "Excel Berhasil Dibuat",
        description: "File berisi 2 Sheet (Form & Database) telah diunduh."
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Gagal membuat file Excel" });
    }
  };
  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      label: "Field Baru",
      type: "text",
      required: false,
      placeholder: "Ketik di sini..."
    };
    setFields([...fields, newField]);
    startEditingField(newField);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    if (direction === "up" && index > 0) {
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
    } else if (direction === "down" && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setFields(newFields);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const startEditingField = (field: FormField) => {
    setEditingFieldId(field.id);
    setEditFieldLabel(field.label);
    setEditFieldType(field.type);
    setEditFieldRequired(field.required);
    setEditFieldPlaceholder(field.placeholder || "");
    setEditFieldOptions(field.options?.join(", ") || "");
  };

  const saveFieldEdit = () => {
    if (!editingFieldId) return;

    setFields(fields.map(f => {
      if (f.id === editingFieldId) {
        return {
          ...f,
          label: editFieldLabel,
          type: editFieldType,
          required: editFieldRequired,
          placeholder: editFieldPlaceholder,
          options: editFieldType === "select" ? editFieldOptions.split(",").map(o => o.trim()).filter(o => o) : undefined
        };
      }
      return f;
    }));

    setEditingFieldId(null);
    toast({ title: "Field diperbarui" });
  };

  const handleEntrySubmit = () => {
    // Validation
    const newErrors: { [key: string]: boolean } = {};
    let firstError = "";

    fields.forEach(f => {
      if (f.required && (!currentEntry[f.id] || currentEntry[f.id].toString().trim() === "")) {
        newErrors[f.id] = true;
        if (!firstError) firstError = `${f.label} wajib diisi`;
      }
    });

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({ variant: "destructive", title: "Gagal", description: firstError });
      return;
    }

    setEntries([...entries, { ...currentEntry, _id: Date.now() }]);
    setCurrentEntry({});
    setFieldErrors({});
    toast({ title: "Data disimpan ke draf" });
  };

  const exportToExcel = () => {
    if (entries.length === 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Belum ada data untuk diekspor" });
      return;
    }

    try {
      const headers = fields.map(f => f.label);
      const data = entries.map(entry => fields.map(f => entry[f.id] || ""));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

      // Auto-width columns
      const colWidths = headers.map((h, i) => {
        let max = h.length;
        data.forEach(row => {
          const val = String(row[i] || "");
          if (val.length > max) max = val.length;
        });
        return { wch: max + 5 };
      });
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/[\[\]\*\?\/\\]/g, "_").substring(0, 31));
      XLSX.writeFile(wb, `${sheetName}.xlsx`);

      toast({ title: "Berhasil", description: `File Excel '${sheetName}.xlsx' telah diunduh.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat mengekspor Excel" });
    }
  };

  return (
    <ScrollArea className="h-full w-full bg-[#f0f2f5]">
      <div className="flex flex-col min-h-screen">
        {/* Header - VB Style Toolbar */}
        <div className="bg-[#2b579a] text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded">
              <ClipboardEdit className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Data Entry Form Builder</h1>
              <p className="text-xs text-blue-100 mt-1">Design once, input anywhere</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={mode === "ai" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("ai")}
              className={mode === "ai" ? "bg-white text-[#2b579a] hover:bg-white/90" : "text-white hover:bg-white/10"}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
            <Button
              variant={mode === "builder" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("builder")}
              className={mode === "builder" ? "bg-white text-[#2b579a] hover:bg-white/90" : "text-white hover:bg-white/10"}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Field Editor
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6">
          {mode === "ai" ? (
            <div className="max-w-4xl mx-auto space-y-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-blue-50 rounded-full text-[#2b579a] mb-2">
                  <Wand2 className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Apa yang ingin Anda buat hari ini?</h2>
                <p className="text-gray-500 text-lg">Jelaskan kolom apa saja yang Anda butuhkan dalam file Excel Anda.</p>
              </div>

              <Card className="border-[#2b579a]/20 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 bg-white">
                    <div className="relative">
                      <MessageSquare className="absolute top-4 left-4 h-5 w-5 text-gray-400" />
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Contoh: Buatkan form data karyawan yang berisi nama, umur, alamat, tanggal masuk, dan status pernikahan..."
                        className="w-full h-40 pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-[#2b579a] focus:ring-0 text-lg transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 flex items-center justify-between border-t">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white text-gray-500 border-gray-200">
                        Tips: Pisahkan dengan koma
                      </Badge>
                    </div>
                    <Button
                      onClick={handleAiGenerate}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="bg-[#2b579a] hover:bg-[#1e3e6d] px-8 h-12 text-lg font-bold shadow-lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Menganalisa...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Form
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Data Penjualan", desc: "Produk, Jumlah, Harga, Tanggal" },
                  { title: "Pendaftaran Event", desc: "Nama, Email, No HP, Ukuran Kaos" },
                  { title: "Inventaris Barang", desc: "Nama Barang, Kode, Stok, Lokasi" }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setAiPrompt(`Buatkan form ${item.title.toLowerCase()} dengan kolom: ${item.desc}`)}
                    className="p-4 bg-white border border-gray-100 rounded-xl text-left hover:border-[#2b579a] hover:shadow-md transition-all group"
                  >
                    <p className="font-bold text-[#2b579a] group-hover:underline">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "builder" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
              {/* Left Side: Field List (Toolbox Style) */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="border-[#2b579a]/20 shadow-sm overflow-hidden">
                  <div className="bg-[#f3f4f6] px-4 py-2 border-b flex items-center justify-between">
                    <span className="text-sm font-bold text-[#2b579a] flex items-center gap-2">
                      <ListOrdered className="h-4 w-4" />
                      Form Structure
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addField}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="p-2 space-y-1">
                        {fields.map((field, idx) => (
                          <div
                            key={field.id}
                            onClick={() => startEditingField(field)}
                            className={`
                              group flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all
                              ${editingFieldId === field.id ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 text-gray-400 hover:text-blue-500"
                                  disabled={idx === 0}
                                  onClick={(e) => { e.stopPropagation(); moveField(idx, "up"); }}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 text-gray-400 hover:text-blue-500"
                                  disabled={idx === fields.length - 1}
                                  onClick={(e) => { e.stopPropagation(); moveField(idx, "down"); }}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className={`p-1.5 rounded ${field.type === "number" ? "bg-orange-100 text-orange-600" : field.type === "date" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                                {field.type === "number" ? <Hash className="h-3.5 w-3.5" /> : field.type === "date" ? <Calendar className="h-3.5 w-3.5" /> : <Type className="h-3.5 w-3.5" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{field.label}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{field.type}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="bg-[#f3f4f6] border-t p-3">
                    <div className="w-full space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">Excel File Name</Label>
                      <Input
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        className="h-8 text-sm bg-white"
                        placeholder="Nama File Excel..."
                      />
                      <Button
                        onClick={generateExcelFormFile}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 mt-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Excel Form
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Right Side: Field Properties (Property Inspector Style) */}
              <div className="lg:col-span-8">
                {editingFieldId ? (
                  <Card className="border-[#2b579a]/20 shadow-lg animate-in fade-in slide-in-from-right-4">
                    <div className="bg-[#2b579a] text-white px-4 py-2 flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      <span className="text-sm font-bold">Field Properties</span>
                    </div>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500">Field Label</Label>
                          <Input
                            value={editFieldLabel}
                            onChange={(e) => setEditFieldLabel(e.target.value)}
                            placeholder="Contoh: Nama Lengkap"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500">Data Type</Label>
                          <Select value={editFieldType} onValueChange={(val: any) => setEditFieldType(val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Dropdown (Select)</SelectItem>
                              <SelectItem value="textarea">Textarea (Long Text)</SelectItem>
                              <SelectItem value="checkbox">Checkbox (Boolean)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500">Placeholder Text</Label>
                          <Input
                            value={editFieldPlaceholder}
                            onChange={(e) => setEditFieldPlaceholder(e.target.value)}
                            placeholder="Contoh: Masukkan nama..."
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Required Field</Label>
                            <p className="text-xs text-gray-500">Wajib diisi saat input data</p>
                          </div>
                          <Switch
                            checked={editFieldRequired}
                            onCheckedChange={setEditFieldRequired}
                          />
                        </div>
                      </div>

                      {editFieldType === "select" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-xs font-bold text-gray-500">Options (pisahkan dengan koma)</Label>
                          <Input
                            value={editFieldOptions}
                            onChange={(e) => setEditFieldOptions(e.target.value)}
                            placeholder="Opsi 1, Opsi 2, Opsi 3"
                          />
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setEditingFieldId(null)}>Cancel</Button>
                        <Button className="bg-[#2b579a] hover:bg-[#1e3e6d]" onClick={saveFieldEdit}>Update Field</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                      <Settings2 className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">Property Inspector</h3>
                    <p className="text-sm text-gray-400 max-w-xs mt-2">Pilih field di panel kiri untuk mulai mengatur label, tipe data, dan validasi.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ScrollArea>
  );
};

export default DataEntryDashboard;
