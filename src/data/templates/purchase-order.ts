import { ExcelTemplate } from "@/types/template";

export const purchaseOrderTemplate: ExcelTemplate = {
    id: "po-001",
    name: "Purchase Order",
    description: "Professional purchase order form with item tracking and totals",
    category: "business",
    icon: "ShoppingCart",
    tags: ["purchase", "order", "procurement", "vendor"],
    headers: [
        "PO Number",
        "Item Code",
        "Description",
        "Vendor",
        "Quantity",
        "Unit Price",
        "Discount (%)",
        "Total"
    ],
    sampleData: [
        ["PO-2024-001", "ITM-001", "Laptop Dell XPS 15", "PT Teknologi Sejahtera", 5, 15000000, 5, null],
        ["PO-2024-001", "ITM-002", "Wireless Mouse Logitech", "PT Teknologi Sejahtera", 10, 250000, 0, null],
        ["PO-2024-001", "ITM-003", "Mechanical Keyboard", "PT Teknologi Sejahtera", 5, 1200000, 10, null],
        ["PO-2024-001", "ITM-004", "USB-C Hub", "PT Teknologi Sejahtera", 5, 450000, 0, null],
        ["", "", "", "", "", "Subtotal", "", null],
        ["", "", "", "", "", "Tax (11%)", "", null],
        ["", "", "", "", "", "Grand Total", "", null],
    ],
    formulas: [
        {
            column: 7, // Total column
            formula: "=E{row}*F{row}*(1-G{row}/100)",
            description: "Quantity × Unit Price × (1 - Discount%)"
        }
    ],
    styles: [
        {
            cellRef: "A1:H1",
            backgroundColor: "#0891b2",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
