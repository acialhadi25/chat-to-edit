import { ExcelTemplate } from "@/types/template";

export const testComplexDataTemplate: ExcelTemplate = {
    id: "test-001",
    name: "Complex Test Data",
    description: "Comprehensive test data with formulas, conditional formatting, and multiple scenarios for testing Excel operations",
    category: "testing",
    icon: "TestTube2",
    tags: ["testing", "complex", "formulas", "validation"],
    headers: [
        "No",
        "Nama",
        "Produk",
        "Harga",
        "Qty",
        "Total",
        "Status"
    ],
    sampleData: [
        [1, "John Doe", "Laptop Gaming", 15000000, 2, null, "Lunas"],
        [2, "Jane Smith", "Mouse Wireless", 250000, 5, null, "Pending"],
        [3, "Bob Wilson", "Keyboard Mechanical", 1500000, 3, null, "Belum Bayar"],
        [4, "Alice Brown", "Monitor 27 inch", 3500000, 1, null, "Lunas"],
        [5, "Charlie Davis", "Headset Gaming", 850000, 4, null, "Pending"],
        [6, "Diana Evans", "Webcam HD", 650000, 2, null, "Lunas"],
        [7, "Frank Miller", "SSD 1TB", 1800000, 3, null, "Belum Bayar"],
        [8, "Grace Lee", "RAM 16GB", 1200000, 4, null, "Lunas"],
        [9, "Henry Taylor", "Mousepad XL", 150000, 10, null, "Pending"],
        [10, "Ivy Chen", "USB Hub", 350000, 5, null, "Lunas"],
        [11, "Jack Wong", "Cable HDMI", 120000, 8, null, "Belum Bayar"],
        [12, "Kelly Park", "Cooling Pad", 280000, 3, null, "Lunas"],
    ],
    formulas: [
        {
            column: 5, // Total
            formula: "=D{row}*E{row}",
            description: "Harga × Qty"
        }
    ],
    conditionalFormatting: [
        {
            column: 6, // Status
            rules: [
                {
                    condition: "equals",
                    value: "Lunas",
                    style: {
                        backgroundColor: "#00f00f",
                        fontColor: "#000000"
                    }
                },
                {
                    condition: "equals",
                    value: "Pending",
                    style: {
                        backgroundColor: "#ffff00",
                        fontColor: "#000000"
                    }
                },
                {
                    condition: "equals",
                    value: "Belum Bayar",
                    style: {
                        backgroundColor: "#ff0000",
                        fontColor: "#ffffff"
                    }
                }
            ]
        }
    ],
    styles: [
        {
            cellRef: "A1:G1",
            backgroundColor: "#f0ff0f",
            fontColor: "#000000",
            fontWeight: "bold",
            textAlign: "center"
        }
    ],
    testScenarios: [
        {
            name: "Formula Calculation",
            description: "Test automatic formula calculation for Total column (Harga × Qty)",
            expectedBehavior: "Total should auto-calculate when Harga or Qty changes"
        },
        {
            name: "Conditional Formatting",
            description: "Test color coding based on Status column values",
            expectedBehavior: "Lunas=Green, Pending=Yellow, Belum Bayar=Red"
        },
        {
            name: "Row Operations",
            description: "Test adding, editing, and deleting rows",
            expectedBehavior: "Formulas should adjust row references automatically"
        },
        {
            name: "Column Operations",
            description: "Test adding, renaming, and deleting columns",
            expectedBehavior: "Data structure should remain consistent"
        },
        {
            name: "Data Validation",
            description: "Test data type validation and constraints",
            expectedBehavior: "Numeric columns should only accept numbers"
        },
        {
            name: "Excel Export",
            description: "Test exporting to Excel with all formatting preserved",
            expectedBehavior: "Downloaded file should match preview exactly"
        }
    ]
};
