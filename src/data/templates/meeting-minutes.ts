import { ExcelTemplate } from "@/types/template";

export const meetingMinutesTemplate: ExcelTemplate = {
    id: "meeting-001",
    name: "Meeting Minutes",
    description: "Track meeting agenda, attendees, action items and decisions",
    category: "business",
    icon: "Users",
    tags: ["meeting", "minutes", "agenda", "action-items"],
    headers: [
        "Meeting ID",
        "Date",
        "Topic",
        "Attendees",
        "Agenda Item",
        "Discussion",
        "Decision",
        "Action Item",
        "Owner",
        "Due Date",
        "Status"
    ],
    sampleData: [
        ["M-001", "2024-01-15", "Q1 Planning", "John, Maria, Budi", "Budget Allocation", "Marketing needs increase", "Approved 20% increase", "Prepare budget report", "Maria", "2024-01-22", "Pending"],
        ["M-001", "2024-01-15", "Q1 Planning", "John, Maria, Budi", "Product Roadmap", "Feature prioritization", "Focus on mobile app", "Update roadmap doc", "Budi", "2024-01-25", "In Progress"],
        ["M-001", "2024-01-15", "Q1 Planning", "John, Maria, Budi", "Team Expansion", "Hiring 3 developers", "Approved hiring", "Post job openings", "John", "2024-01-20", "Completed"],
        ["M-002", "2024-01-22", "Project Review", "Team Leads", "Website Progress", "On track for launch", "Launch date confirmed", "Final QA testing", "Dewi", "2024-02-01", "Pending"],
    ],
    styles: [
        {
            cellRef: "A1:K1",
            backgroundColor: "#0284c7",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
