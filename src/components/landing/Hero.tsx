import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Files,
  Scissors,
  ClipboardEdit,
  ArrowRight,
  Calculator,
  Search,
  Trash2,
  SortAsc,
  LayoutGrid,
  BarChart3,
  TableProperties,
  Database,
  FileDown,
  FileUp,
  Settings2,
} from "lucide-react";

type ToolCategory = "all" | "chat" | "manage" | "entry";

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
  // Chat to Excel tools
  { icon: <Calculator className="h-6 w-6" />, title: "Formula & Kalkulasi", description: "Insert formula otomatis seperti SUM, VLOOKUP, IF", category: "chat", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <Trash2 className="h-6 w-6" />, title: "Bersihkan Data", description: "Hapus baris kosong, duplikat, dan trim spasi", category: "chat", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <BarChart3 className="h-6 w-6" />, title: "Visualisasi AI", description: "Buat grafik dan chart otomatis dari data Anda", category: "chat", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  { icon: <SortAsc className="h-6 w-6" />, title: "Sort & Filter", description: "Urutkan dan filter data berdasarkan kolom", category: "chat", link: "/dashboard/excel", color: "text-green-600", bgColor: "bg-green-500/10", available: true },
  
  // Merge Excel tools
  { icon: <Files className="h-6 w-6" />, title: "Merge Multiple Files", description: "Gabungkan banyak file Excel jadi satu", category: "manage", link: "/dashboard/merge", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <TableProperties className="h-6 w-6" />, title: "Combine Sheets", description: "Gabungkan antar sheet dalam satu file", category: "manage", link: "/dashboard/merge", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  { icon: <Database className="h-6 w-6" />, title: "Data Consolidation", description: "Konsolidasi data dari berbagai sumber", category: "manage", link: "/dashboard/merge", color: "text-blue-600", bgColor: "bg-blue-500/10", available: true },
  
  // Split Excel tools
  { icon: <Scissors className="h-6 w-6" />, title: "Split by Column", description: "Pecah sheet berdasarkan nilai kolom", category: "manage", link: "/dashboard/split", color: "text-orange-600", bgColor: "bg-orange-500/10", available: true },
  { icon: <FileDown className="h-6 w-6" />, title: "Export to Multiple", description: "Ekspor hasil split ke banyak file", category: "manage", link: "/dashboard/split", color: "text-orange-600", bgColor: "bg-orange-500/10", available: true },
  { icon: <Settings2 className="h-6 w-6" />, title: "Custom Split Rules", description: "Atur aturan pemecahan data Anda", category: "manage", link: "/dashboard/split", color: "text-orange-600", bgColor: "bg-orange-500/10", available: true },
  
  // Data Entry tools
  { icon: <ClipboardEdit className="h-6 w-6" />, title: "Form Interface", description: "Input data lewat UI formulir yang bersih", category: "entry", link: "/dashboard/data-entry", color: "text-purple-600", bgColor: "bg-purple-500/10", available: true },
  { icon: <FileUp className="h-6 w-6" />, title: "Batch Entry", description: "Input data dalam jumlah besar dengan cepat", category: "entry", link: "/dashboard/data-entry", color: "text-purple-600", bgColor: "bg-purple-500/10", available: true },
];

const categoryConfig: Record<ToolCategory, { label: string; color: string }> = {
  all: { label: "Semua Tools", color: "bg-primary text-primary-foreground" },
  chat: { label: "Chat to Excel", color: "bg-green-600 text-white" },
  manage: { label: "Manage & Split", color: "bg-blue-600 text-white" },
  entry: { label: "Data Entry", color: "bg-purple-600 text-white" },
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
            Kelola data Excel Anda
            <span className="block text-primary">dengan kekuatan AI</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Satu platform untuk semua kebutuhan Excel: Chat, Merge, Split, dan Data Entry.
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
