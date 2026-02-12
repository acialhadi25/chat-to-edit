import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { FileSpreadsheet, FileText, FileType, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    icon: <FileSpreadsheet className="h-8 w-8" />,
    title: "Chat to Excel",
    description: "Edit spreadsheet dengan bantuan AI. Cukup chat untuk menambah formula, manipulasi data, formatting, dan lainnya.",
    color: "text-green-600",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    features: [
      "Insert formula otomatis (SUM, VLOOKUP, IF, dll)",
      "Hapus baris kosong & duplikat",
      "Find & replace data",
      "Sort & filter data",
      "Format angka (currency, percentage, scientific)",
      "Split & merge kolom",
      "Statistik (sum, average, median, std_dev)",
    ],
    link: "/dashboard/excel",
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Chat to PDF",
    description: "Kelola file PDF dengan mudah. Merge, split, extract halaman, tambah watermark, dan konversi — semua lewat chat.",
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    features: [
      "Merge beberapa PDF jadi satu",
      "Split PDF per halaman",
      "Extract halaman tertentu",
      "Hapus halaman yang tidak dibutuhkan",
      "Rotate halaman",
      "Tambah watermark teks",
      "Konversi ke gambar (PNG/JPG)",
    ],
    link: "/dashboard/pdf",
  },
  {
    icon: <FileType className="h-8 w-8" />,
    title: "Chat to Docs",
    description: "Asisten penulisan AI untuk dokumen. Tulis, rewrite, translate, summarize, dan improve dokumen dengan chat.",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    features: [
      "Tulis dokumen dari nol",
      "Rewrite & paraphrase konten",
      "Translate ke berbagai bahasa",
      "Summarize dokumen panjang",
      "Grammar check & proofread",
      "Ubah tone (formal, casual, professional)",
      "Expand & simplify konten",
    ],
    link: "/dashboard/docs",
  },
];

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">Produk Kami</h1>
          <p className="text-lg text-muted-foreground">
            Tiga tools AI yang powerful untuk mengelola dokumen Anda sehari-hari.
          </p>
        </div>

        <div className="space-y-16">
          {products.map((product, idx) => (
            <div
              key={product.title}
              className={`flex flex-col lg:flex-row gap-8 items-center ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${product.bg} ${product.color}`}>
                    {product.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{product.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <Button asChild className="gap-2">
                  <Link to={product.link}>Coba Sekarang →</Link>
                </Button>
              </div>
              <div className={`flex-1 rounded-2xl border ${product.border} ${product.bg} p-8`}>
                <h3 className="font-semibold text-foreground mb-4">Fitur Utama</h3>
                <ul className="space-y-3">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${product.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
