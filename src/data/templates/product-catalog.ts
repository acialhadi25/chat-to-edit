import { ExcelTemplate } from "@/types/template";

export const productCatalogTemplate: ExcelTemplate = {
    id: "product-catalog-001",
    name: "Product Catalog",
    description: "Manage product information, pricing, and availability",
    category: "inventory",
    icon: "ShoppingBag",
    tags: ["product", "catalog", "ecommerce"],
    headers: [
        "Product ID",
        "Product Name",
        "Category",
        "Brand",
        "Cost Price",
        "Selling Price",
        "Profit Margin",
        "Stock",
        "Supplier"
    ],
    sampleData: [
        ["PRD001", "Laptop Dell XPS 13", "Electronics", "Dell", 12000000, 15000000, null, 15, "Tech Distributor"],
        ["PRD002", "iPhone 15 Pro", "Electronics", "Apple", 15000000, 18000000, null, 20, "Apple Store"],
        ["PRD003", "Samsung Galaxy S24", "Electronics", "Samsung", 10000000, 12500000, null, 25, "Samsung Official"],
        ["PRD004", "Sony WH-1000XM5", "Accessories", "Sony", 4000000, 5000000, null, 30, "Audio Supplier"],
        ["PRD005", "iPad Air", "Electronics", "Apple", 8000000, 10000000, null, 18, "Apple Store"],
        ["PRD006", "MacBook Pro 14", "Electronics", "Apple", 25000000, 30000000, null, 10, "Apple Store"],
        ["PRD007", "Logitech MX Master 3", "Accessories", "Logitech", 1200000, 1500000, null, 50, "Logitech Distributor"],
        ["PRD008", "Dell Monitor 27\"", "Electronics", "Dell", 3000000, 3800000, null, 22, "Tech Distributor"],
        ["PRD009", "Mechanical Keyboard", "Accessories", "Keychron", 1500000, 2000000, null, 35, "Keyboard Supplier"],
        ["PRD010", "Webcam Logitech C920", "Accessories", "Logitech", 1200000, 1600000, null, 28, "Logitech Distributor"],
    ],
    formulas: [
        {
            column: 6, // Profit Margin
            formula: "=((F{row}-E{row})/E{row})*100",
            description: "Profit margin percentage"
        }
    ],
    styles: [
        {
            cellRef: "A1:I1",
            backgroundColor: "#0ea5e9",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
