import { ExcelTemplate } from "@/types/template";

export const inventoryTemplate: ExcelTemplate = {
    id: "inventory-001",
    name: "Inventory Tracker",
    description: "Track stock levels, reorder points, and inventory value",
    category: "inventory",
    icon: "Package",
    tags: ["inventory", "stock", "warehouse"],
    headers: [
        "SKU",
        "Product Name",
        "Category",
        "Current Stock",
        "Reorder Level",
        "Unit Cost",
        "Total Value",
        "Status"
    ],
    sampleData: [
        ["SKU001", "Laptop Dell XPS 13", "Electronics", 15, 5, 12000000, null, null],
        ["SKU002", "Mouse Logitech MX Master", "Accessories", 45, 10, 850000, null, null],
        ["SKU003", "Keyboard Mechanical RGB", "Accessories", 8, 15, 1200000, null, null],
        ["SKU004", "Monitor LG 27 inch", "Electronics", 12, 5, 3500000, null, null],
        ["SKU005", "Webcam Logitech C920", "Accessories", 25, 10, 1500000, null, null],
        ["SKU006", "Headset Sony WH-1000XM4", "Accessories", 18, 8, 4500000, null, null],
        ["SKU007", "USB Hub 7-Port", "Accessories", 30, 15, 250000, null, null],
        ["SKU008", "External SSD 1TB", "Storage", 20, 10, 1800000, null, null],
        ["SKU009", "Laptop Stand Aluminum", "Accessories", 12, 8, 450000, null, null],
        ["SKU010", "Cable Organizer Set", "Accessories", 50, 20, 150000, null, null],
    ],
    formulas: [
        {
            column: 6, // Total Value
            formula: "=D{row}*F{row}",
            description: "Current Stock × Unit Cost"
        },
        {
            column: 7, // Status
            formula: '=IF(D{row}<=E{row},"REORDER","OK")',
            description: "Stock status check"
        }
    ],
    styles: [
        {
            cellRef: "A1:H1",
            backgroundColor: "#0ea5e9",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
