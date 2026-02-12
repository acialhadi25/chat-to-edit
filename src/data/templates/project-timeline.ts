import { ExcelTemplate } from "@/types/template";

export const projectTimelineTemplate: ExcelTemplate = {
    id: "project-001",
    name: "Project Timeline",
    description: "Track project tasks, deadlines, and progress",
    category: "business",
    icon: "Calendar",
    tags: ["project", "timeline", "tasks"],
    headers: [
        "Task ID",
        "Task Name",
        "Assigned To",
        "Start Date",
        "End Date",
        "Duration (Days)",
        "Status",
        "Progress (%)",
        "Priority"
    ],
    sampleData: [
        ["T001", "Project Planning", "John Doe", "2026-02-01", "2026-02-05", null, "Completed", 100, "High"],
        ["T002", "Requirements Gathering", "Jane Smith", "2026-02-06", "2026-02-12", null, "Completed", 100, "High"],
        ["T003", "Design Phase", "Bob Wilson", "2026-02-13", "2026-02-20", null, "In Progress", 60, "High"],
        ["T004", "Frontend Development", "Alice Brown", "2026-02-21", "2026-03-10", null, "Not Started", 0, "Medium"],
        ["T005", "Backend Development", "Charlie Davis", "2026-02-21", "2026-03-10", null, "Not Started", 0, "Medium"],
        ["T006", "Database Setup", "David Lee", "2026-02-15", "2026-02-18", null, "Completed", 100, "High"],
        ["T007", "Testing", "Eve Martinez", "2026-03-11", "2026-03-20", null, "Not Started", 0, "High"],
        ["T008", "Deployment", "Frank Garcia", "2026-03-21", "2026-03-25", null, "Not Started", 0, "Medium"],
        ["T009", "Documentation", "Grace Taylor", "2026-03-15", "2026-03-25", null, "Not Started", 0, "Low"],
        ["T010", "User Training", "Henry Anderson", "2026-03-26", "2026-03-30", null, "Not Started", 0, "Medium"],
    ],
    formulas: [
        {
            column: 5, // Duration
            formula: "=E{row}-D{row}",
            description: "End Date - Start Date"
        }
    ],
    styles: [
        {
            cellRef: "A1:I1",
            backgroundColor: "#2563eb",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
