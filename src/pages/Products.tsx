import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { FileSpreadsheet, Check } from "lucide-react";
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
];

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">Produk Kami</h1>
          <p className="text-lg text-muted-foreground">
            Excel copilot yang membantu kamu mengelola data spreadsheet lewat chat AI.
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
