import { ExcelTemplate } from "@/types/template";

export const expenseTrackerTemplate: ExcelTemplate = {
    id: "expense-001",
    name: "Expense Tracker",
    description: "Daily expense tracking with category analysis",
    category: "finance",
    icon: "Receipt",
    tags: ["expense", "spending", "tracking"],
    headers: [
        "Date",
        "Category",
        "Description",
        "Amount",
        "Payment Method",
        "Vendor",
        "Notes"
    ],
    sampleData: [
        ["2026-02-01", "Food", "Lunch at restaurant", 75000, "Cash", "Warung Makan", ""],
        ["2026-02-01", "Transportation", "Grab to office", 35000, "E-Wallet", "Grab", ""],
        ["2026-02-02", "Shopping", "Groceries", 250000, "Debit Card", "Supermarket", "Weekly shopping"],
        ["2026-02-02", "Utilities", "Electricity bill", 450000, "Bank Transfer", "PLN", ""],
        ["2026-02-03", "Food", "Coffee", 45000, "E-Wallet", "Starbucks", ""],
        ["2026-02-03", "Entertainment", "Movie tickets", 100000, "Credit Card", "Cinema XXI", ""],
        ["2026-02-04", "Transportation", "Fuel", 200000, "Cash", "Pertamina", ""],
        ["2026-02-04", "Food", "Dinner", 150000, "Credit Card", "Restaurant", ""],
        ["2026-02-05", "Healthcare", "Medicine", 85000, "Cash", "Pharmacy", ""],
        ["2026-02-05", "Food", "Breakfast", 50000, "E-Wallet", "Cafe", ""],
    ],
    styles: [
        {
            cellRef: "A1:G1",
            backgroundColor: "#10b981",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
