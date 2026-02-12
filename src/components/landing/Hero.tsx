import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  FileText,
  FileType,
  ArrowRight,
  Merge,
  Scissors,
  Droplets,
  FileOutput,
  RotateCw,
  Image,
  Calculator,
  Search,
  Trash2,
  SortAsc,
  Languages,
  BookOpen,
  Wand2,
  CheckCircle,
  PenTool,
  ListOrdered,
} from "lucide-react";

type ToolCategory = "all" | "excel" | "pdf" | "docs";

interface ToolCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: ToolCategory;
  link: string;
  color: string;
  bgColor: string;
  available: boolean;
}

const tools: ToolCard[] = [
  // Excel tools
  { icon: <Calculator className="h-6 w-6" />, title: "Formula & Kalkulasi", description: "Insert formula otomatis seperti SUM, VLOOKUP, IF", category: "excel", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <Trash2 className="h-6 w-6" />, title: "Bersihkan Data", description: "Hapus baris kosong, duplikat, dan trim spasi", category: "excel", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <Search className="h-6 w-6" />, title: "Find & Replace", description: "Cari dan ganti data di seluruh spreadsheet", category: "excel", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <SortAsc className="h-6 w-6" />, title: "Sort & Filter", description: "Urutkan dan filter data berdasarkan kolom", category: "excel", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  // PDF tools
  { icon: <Merge className="h-6 w-6" />, title: "Merge PDF", description: "Gabungkan beberapa file PDF jadi satu", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  { icon: <Scissors className="h-6 w-6" />, title: "Split PDF", description: "Pisahkan PDF menjadi beberapa file", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  { icon: <FileOutput className="h-6 w-6" />, title: "Extract Pages", description: "Ambil halaman tertentu dari PDF", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  { icon: <Droplets className="h-6 w-6" />, title: "Watermark", description: "Tambahkan watermark teks ke PDF", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  { icon: <RotateCw className="h-6 w-6" />, title: "Rotate Pages", description: "Putar halaman PDF 90°, 180°, 270°", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  { icon: <Image className="h-6 w-6" />, title: "PDF to Image", description: "Konversi halaman PDF ke PNG/JPG", category: "pdf", link: "/dashboard/pdf", color: "text-red-600", bgColor: "bg-red-500/10", available: true },
  // Docs tools
  { icon: <PenTool className="h-6 w-6" />, title: "Tulis & Rewrite", description: "Tulis atau tulis ulang dokumen dengan AI", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <Languages className="h-6 w-6" />, title: "Translate", description: "Terjemahkan dokumen ke berbagai bahasa", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <BookOpen className="h-6 w-6" />, title: "Summarize", description: "Ringkas dokumen panjang jadi poin utama", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <CheckCircle className="h-6 w-6" />, title: "Grammar Check", description: "Periksa dan perbaiki tata bahasa", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <Wand2 className="h-6 w-6" />, title: "Ubah Tone", description: "Ubah gaya: formal, kasual, profesional", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <ListOrdered className="h-6 w-6" />, title: "Format Dokumen", description: "Ubah ke list, tabel, heading, paragraf", category: "docs", link: "/dashboard/docs", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
];

const categoryConfig: Record<ToolCategory, { label: string; color: string }> = {
  all: { label: "Semua Tools", color: "bg-primary text-primary-foreground" },
  excel: { label: "Excel", color: "bg-green-600 text-white" },
  pdf: { label: "PDF", color: "bg-red-600 text-white" },
  docs: { label: "Docs", color: "bg-blue-600 text-white" },
};

const Hero = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("all");

  const filteredTools = activeCategory === "all" ? tools : tools.filter((t) => t.category === activeCategory);

  return (
    <section className="py-12 sm:py-20">
      <div className="container px-4">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
            Semua tools untuk edit dokumen
            <span className="block text-primary">dalam satu tempat</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Upload file, chat dengan AI, dan hasilnya siap. Gratis dan mudah digunakan.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(Object.keys(categoryConfig) as ToolCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? categoryConfig[cat].color
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {categoryConfig[cat].label}
            </button>
          ))}
        </div>

        {/* Tool Cards Grid */}
        <motion.div
          layout
          className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.title}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to={tool.link}
                className={`group flex flex-col items-center text-center rounded-xl border border-border/50 p-6 transition-all hover:shadow-lg hover:border-border hover:-translate-y-1 ${
                  tool.available ? "" : "opacity-60 pointer-events-none"
                }`}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${tool.bgColor} ${tool.color} transition-transform group-hover:scale-110`}>
                  {tool.icon}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{tool.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                {!tool.available && (
                  <Badge variant="secondary" className="mt-2 text-xs">Coming Soon</Badge>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button size="lg" asChild className="gap-2">
            <Link to="/register">
              Mulai Gratis Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
