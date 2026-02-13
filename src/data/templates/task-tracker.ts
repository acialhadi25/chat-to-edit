import { ExcelTemplate } from "@/types/template";

export const taskTrackerTemplate: ExcelTemplate = {
    id: "task-001",
    name: "Project Task Tracker",
    description: "Track project tasks with status, priority, and deadline management",
    category: "business",
    icon: "CheckSquare",
    tags: ["project", "task", "management", "tracker"],
    headers: [
        "Task ID",
        "Task Name",
        "Assignee",
        "Priority",
        "Status",
        "Start Date",
        "Due Date",
        "Progress (%)",
        "Notes"
    ],
    sampleData: [
        ["T-001", "Website Design", "Ahmad", "High", "In Progress", "2024-01-15", "2024-02-01", 75, "Homepage mockup done"],
        ["T-002", "Backend API", "Budi", "High", "In Progress", "2024-01-10", "2024-02-15", 60, "Authentication complete"],
        ["T-003", "Database Setup", "Citra", "Medium", "Completed", "2024-01-05", "2024-01-20", 100, "Migration scripts ready"],
        ["T-004", "User Testing", "Dewi", "Medium", "Pending", "2024-02-10", "2024-02-28", 0, "Waiting for prototype"],
        ["T-005", "Documentation", "Eko", "Low", "In Progress", "2024-01-20", "2024-03-01", 30, "API docs started"],
        ["T-006", "Mobile App", "Fani", "High", "Pending", "2024-02-01", "2024-03-15", 0, "Requirements gathering"],
    ],
    styles: [
        {
            cellRef: "A1:I1",
            backgroundColor: "#7c3aed",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
