import { ExcelTemplate } from "@/types/template";

export const salesReportTemplate: ExcelTemplate = {
    id: "sales-001",
    name: "Monthly Sales Report",
    description: "Track sales performance by product, region, and salesperson",
    category: "sales",
    icon: "TrendingUp",
    tags: ["sales", "revenue", "performance"],
    headers: [
        "Date",
        "Product",
        "Region",
        "Salesperson",
        "Quantity",
        "Unit Price",
        "Revenue",
        "Commission (5%)"
    ],
    sampleData: [
        ["2026-02-01", "Product A", "Jakarta", "John Doe", 10, 500000, null, null],
        ["2026-02-02", "Product B", "Bandung", "Jane Smith", 15, 750000, null, null],
        ["2026-02-03", "Product A", "Surabaya", "Bob Wilson", 8, 500000, null, null],
        ["2026-02-04", "Product C", "Jakarta", "John Doe", 20, 300000, null, null],
        ["2026-02-05", "Product B", "Medan", "Alice Brown", 12, 750000, null, null],
        ["2026-02-06", "Product A", "Jakarta", "Jane Smith", 18, 500000, null, null],
        ["2026-02-07", "Product C", "Bandung", "Bob Wilson", 25, 300000, null, null],
        ["2026-02-08", "Product B", "Surabaya", "Alice Brown", 10, 750000, null, null],
        ["2026-02-09", "Product A", "Medan", "John Doe", 14, 500000, null, null],
        ["2026-02-10", "Product C", "Jakarta", "Jane Smith", 30, 300000, null, null],
    ],
    formulas: [
        {
            column: 6, // Revenue
            formula: "=E{row}*F{row}",
            description: "Quantity × Unit Price"
        },
        {
            column: 7, // Commission
            formula: "=G{row}*0.05",
            description: "5% of Revenue"
        }
    ],
    styles: [
        {
            cellRef: "A1:H1",
            backgroundColor: "#ef4444",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
