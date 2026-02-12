import { ExcelTemplate } from "@/types/template";

export const invoiceTemplate: ExcelTemplate = {
    id: "invoice-001",
    name: "Invoice Template",
    description: "Professional invoice template with automatic calculations",
    category: "business",
    icon: "FileText",
    tags: ["invoice", "billing", "payment"],
    headers: [
        "Item",
        "Description",
        "Quantity",
        "Unit Price",
        "Total",
        "Tax (%)",
        "Grand Total"
    ],
    sampleData: [
        ["Web Design", "Homepage redesign", 1, 5000000, null, 11, null],
        ["Logo Design", "Company logo creation", 1, 2000000, null, 11, null],
        ["Hosting", "Annual hosting fee", 12, 150000, null, 11, null],
        ["Domain", "Domain registration (.com)", 1, 200000, null, 11, null],
        ["", "", "", "", null, null, null],
        ["", "", "", "SUBTOTAL", null, null, null],
        ["", "", "", "TAX (11%)", null, null, null],
        ["", "", "", "TOTAL", null, null, null],
    ],
    formulas: [
        {
            column: 4, // Total column
            formula: "=C{row}*D{row}",
            description: "Quantity × Unit Price"
        },
        {
            column: 6, // Grand Total column
            formula: "=E{row}+(E{row}*F{row}/100)",
            description: "Total + Tax"
        }
    ],
    styles: [
        {
            cellRef: "A1:G1",
            backgroundColor: "#2563eb",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
