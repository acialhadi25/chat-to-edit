import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

const DemoDataBanner = () => {
  const { toast } = useToast();

  const generateDemoExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Data Penjualan - Sales scenarios
    const salesData = [
      ["No", "Nama", "Produk", "Harga", "Qty", "Total", "Status"],
      [1, "John Doe", "Laptop Gaming", 15000000, 2, "", "Lunas"],
      [2, "Jane Smith", "Mouse Wireless", 250000, 5, "", "Pending"],
      [3, "  Ahmad  ", "Keyboard Mechanical", 750000, 3, "", "pending"],
      [4, "", "", "", "", "", ""],
      [5, "Siti Rahma", "Monitor 27\"", 3500000, 1, "", "LUNAS"],
      [6, "Budi Santoso", "Laptop Kantor", 12000000, 0, "", "Belum Bayar"],
      [7, " Maria  ", "Webcam HD", 450000, 2, "", "lunas"],
      [8, "", "", "", "", "", ""],
      [9, "Andi Wijaya", "Headset Gaming", 850000, 4, "", "Pending"],
      [10, "Dewi Lestari", "SSD 1TB", 1200000, 1, "", "Lunas"],
      [11, "  Rudi Hartono ", "RAM 16GB", 900000, 2, "", "pending"],
      [12, "Lisa Permata", "Charger Laptop", 350000, 0, "", "Belum Bayar"],
    ];
    const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
    salesSheet["!cols"] = [
      { wch: 5 },  // No
      { wch: 18 }, // Nama
      { wch: 22 }, // Produk
      { wch: 12 }, // Harga
      { wch: 6 },  // Qty
      { wch: 14 }, // Total
      { wch: 14 }, // Status
    ];
    XLSX.utils.book_append_sheet(workbook, salesSheet, "Data Penjualan");

    // Sheet 2: Data Karyawan - Employee data with inconsistencies
    const employeeData = [
      ["ID", "Nama Lengkap", "Email", "Departemen", "Jabatan", "Gaji"],
      ["E001", "john doe", "john@company.com", "IT", "developer", 8000000],
      ["E002", "JANE SMITH", "jane@company.com", "Marketing", "MANAGER", 12000000],
      ["E003", "Ahmad Rizky", "ahmad@company.com", "it", "Developer", 8500000],
      ["E004", "  siti nurhaliza  ", "siti@company.com", "HR", "staff", 6000000],
      ["E001", "john doe", "john@company.com", "IT", "developer", 8000000],
      ["E005", "budi SANTOSO", "budi@company.com", "Finance", "Staff", 6500000],
      ["E006", "", "", "", "", ""],
      ["E007", "Maria  Clara", "maria@company.com", "marketing", "Staff", 6000000],
      ["E008", "AHMAD FAUZI", "fauzi@company.com", "IT", "senior developer", 10000000],
    ];
    const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
    employeeSheet["!cols"] = [
      { wch: 8 },  // ID
      { wch: 20 }, // Nama
      { wch: 24 }, // Email
      { wch: 12 }, // Departemen
      { wch: 18 }, // Jabatan
      { wch: 12 }, // Gaji
    ];
    XLSX.utils.book_append_sheet(workbook, employeeSheet, "Data Karyawan");

    // Sheet 3: Inventaris - Inventory with nulls and inconsistencies
    const inventoryData = [
      ["Kode", "Nama Barang", "Stok", "Harga Satuan", "Kategori", "Supplier"],
      ["SKU001", "Pensil 2B", 100, 2500, "ATK", "PT. Faber"],
      ["SKU002", "Buku Tulis", 0, 15000, "ATK", "CV. Gramedia"],
      ["SKU003", "", 50, 5000, "", ""],
      ["SKU004", "Penghapus", null, 3000, "ATK", "PT. Faber"],
      ["SKU005", "Spidol Hitam", 25, "", "Alat Tulis", "PT. Snowman"],
      ["SKU006", "Map Plastik", 0, 8000, "ATK", ""],
      ["SKU007", "", "", "", "", ""],
      ["SKU008", "Stapler", 15, 35000, "atk", "PT. MAX"],
      ["SKU009", "Kertas A4", 500, 55000, "ATK", "CV. Sinar Dunia"],
      ["SKU010", "Amplop", 0, 500, "atk", ""],
    ];
    const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryData);
    inventorySheet["!cols"] = [
      { wch: 10 }, // Kode
      { wch: 18 }, // Nama Barang
      { wch: 8 },  // Stok
      { wch: 14 }, // Harga Satuan
      { wch: 12 }, // Kategori
      { wch: 16 }, // Supplier
    ];
    XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventaris");

    // Download the file
    XLSX.writeFile(workbook, "ExcelAI-Demo-Data.xlsx");

    toast({
      title: "Demo file downloaded!",
      description: "File ExcelAI-Demo-Data.xlsx siap digunakan untuk testing",
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">Coba dengan Data Demo</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Download template Excel dengan berbagai skenario untuk testing fitur AI:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <FileSpreadsheet className="h-3 w-3" />
              Data Penjualan - Formula, spasi, baris kosong
            </li>
            <li className="flex items-center gap-2">
              <FileSpreadsheet className="h-3 w-3" />
              Data Karyawan - Duplikat, format tidak konsisten
            </li>
            <li className="flex items-center gap-2">
              <FileSpreadsheet className="h-3 w-3" />
              Inventaris - Nilai null, kategori kosong
            </li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={generateDemoExcel}
          >
            <Download className="h-4 w-4" />
            Download Demo Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoDataBanner;
