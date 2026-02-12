import { ExcelTemplate } from "@/types/template";

export const budgetTemplate: ExcelTemplate = {
    id: "budget-001",
    name: "Monthly Budget Planner",
    description: "Track income, expenses, and savings with automatic calculations",
    category: "finance",
    icon: "DollarSign",
    tags: ["budget", "finance", "planning"],
    headers: [
        "Category",
        "Subcategory",
        "Budgeted",
        "Actual",
        "Difference",
        "% of Budget"
    ],
    sampleData: [
        ["INCOME", "Salary", 15000000, 15000000, null, null],
        ["INCOME", "Freelance", 5000000, 4500000, null, null],
        ["INCOME", "Investment", 2000000, 1800000, null, null],
        ["", "TOTAL INCOME", null, null, null, null],
        ["EXPENSES", "Rent", 4000000, 4000000, null, null],
        ["EXPENSES", "Utilities", 1000000, 950000, null, null],
        ["EXPENSES", "Groceries", 3000000, 3200000, null, null],
        ["EXPENSES", "Transportation", 1500000, 1400000, null, null],
        ["EXPENSES", "Entertainment", 1000000, 1200000, null, null],
        ["EXPENSES", "Healthcare", 500000, 450000, null, null],
        ["EXPENSES", "Education", 2000000, 2000000, null, null],
        ["EXPENSES", "Savings", 5000000, 5000000, null, null],
        ["", "TOTAL EXPENSES", null, null, null, null],
        ["", "NET INCOME", null, null, null, null],
    ],
    formulas: [
        {
            column: 4, // Difference
            formula: "=D{row}-C{row}",
            description: "Actual - Budgeted"
        },
        {
            column: 5, // % of Budget
            formula: "=IF(C{row}>0,D{row}/C{row}*100,0)",
            description: "Percentage of budgeted amount"
        }
    ],
    styles: [
        {
            cellRef: "A1:F1",
            backgroundColor: "#10b981",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
