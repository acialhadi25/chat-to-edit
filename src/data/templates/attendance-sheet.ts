import { ExcelTemplate } from "@/types/template";

export const attendanceSheetTemplate: ExcelTemplate = {
    id: "attendance-001",
    name: "Attendance Sheet",
    description: "Track employee attendance and working hours",
    category: "hr",
    icon: "ClipboardCheck",
    tags: ["attendance", "timesheet", "hr"],
    headers: [
        "Employee ID",
        "Employee Name",
        "Date",
        "Check In",
        "Check Out",
        "Work Hours",
        "Status",
        "Notes"
    ],
    sampleData: [
        ["EMP001", "Ahmad Rizki", "2026-02-01", "08:00", "17:00", null, "Present", ""],
        ["EMP002", "Siti Nurhaliza", "2026-02-01", "08:15", "17:10", null, "Present", "Late 15 min"],
        ["EMP003", "Budi Santoso", "2026-02-01", "08:00", "17:00", null, "Present", ""],
        ["EMP004", "Dewi Lestari", "2026-02-01", "", "", null, "Sick Leave", "Medical certificate"],
        ["EMP005", "Eko Prasetyo", "2026-02-01", "08:05", "17:05", null, "Present", ""],
        ["EMP001", "Ahmad Rizki", "2026-02-02", "08:00", "17:00", null, "Present", ""],
        ["EMP002", "Siti Nurhaliza", "2026-02-02", "08:00", "17:00", null, "Present", ""],
        ["EMP003", "Budi Santoso", "2026-02-02", "", "", null, "Annual Leave", "Approved"],
        ["EMP004", "Dewi Lestari", "2026-02-02", "08:00", "17:00", null, "Present", ""],
        ["EMP005", "Eko Prasetyo", "2026-02-02", "08:00", "16:00", null, "Present", "Left early"],
    ],
    formulas: [
        {
            column: 5, // Work Hours
            formula: '=IF(AND(D{row}<>"",E{row}<>""),HOUR(E{row})-HOUR(D{row}),0)',
            description: "Calculate work hours"
        }
    ],
    styles: [
        {
            cellRef: "A1:H1",
            backgroundColor: "#8b5cf6",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
