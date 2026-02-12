import { ExcelTemplate } from "@/types/template";

export const employeeDataTemplate: ExcelTemplate = {
    id: "employee-001",
    name: "Employee Database",
    description: "Manage employee information, salary, and contact details",
    category: "hr",
    icon: "Users",
    tags: ["employee", "hr", "payroll"],
    headers: [
        "Employee ID",
        "Full Name",
        "Department",
        "Position",
        "Join Date",
        "Base Salary",
        "Allowance",
        "Total Salary",
        "Email",
        "Phone"
    ],
    sampleData: [
        ["EMP001", "Ahmad Rizki", "IT", "Software Engineer", "2024-01-15", 8000000, 2000000, null, "ahmad.rizki@company.com", "081234567890"],
        ["EMP002", "Siti Nurhaliza", "Finance", "Accountant", "2023-06-01", 7000000, 1500000, null, "siti.nur@company.com", "081234567891"],
        ["EMP003", "Budi Santoso", "Marketing", "Marketing Manager", "2022-03-10", 12000000, 3000000, null, "budi.santoso@company.com", "081234567892"],
        ["EMP004", "Dewi Lestari", "HR", "HR Specialist", "2024-02-20", 6500000, 1500000, null, "dewi.lestari@company.com", "081234567893"],
        ["EMP005", "Eko Prasetyo", "IT", "DevOps Engineer", "2023-09-05", 9000000, 2500000, null, "eko.prasetyo@company.com", "081234567894"],
        ["EMP006", "Fitri Handayani", "Finance", "Finance Manager", "2021-11-15", 15000000, 4000000, null, "fitri.handayani@company.com", "081234567895"],
        ["EMP007", "Gunawan Wijaya", "Marketing", "Sales Executive", "2024-01-10", 6000000, 1000000, null, "gunawan.wijaya@company.com", "081234567896"],
        ["EMP008", "Hana Permata", "IT", "UI/UX Designer", "2023-07-20", 7500000, 2000000, null, "hana.permata@company.com", "081234567897"],
        ["EMP009", "Indra Kusuma", "Operations", "Operations Manager", "2022-05-12", 11000000, 2500000, null, "indra.kusuma@company.com", "081234567898"],
        ["EMP010", "Julia Rahmawati", "HR", "Recruitment Specialist", "2024-03-01", 6500000, 1500000, null, "julia.rahmawati@company.com", "081234567899"],
    ],
    formulas: [
        {
            column: 7, // Total Salary
            formula: "=F{row}+G{row}",
            description: "Base Salary + Allowance"
        }
    ],
    styles: [
        {
            cellRef: "A1:J1",
            backgroundColor: "#8b5cf6",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
