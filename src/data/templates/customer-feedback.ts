import { ExcelTemplate } from "@/types/template";

export const customerFeedbackTemplate: ExcelTemplate = {
    id: "feedback-001",
    name: "Customer Feedback Log",
    description: "Track customer feedback, ratings, and follow-up actions",
    category: "sales",
    icon: "MessageCircle",
    tags: ["customer", "feedback", "satisfaction", "support"],
    headers: [
        "Feedback ID",
        "Date",
        "Customer Name",
        "Email",
        "Product/Service",
        "Rating (1-5)",
        "Category",
        "Feedback",
        "Assigned To",
        "Status",
        "Resolution"
    ],
    sampleData: [
        ["FB-001", "2024-01-10", "Sarah Wilson", "sarah@email.com", "Web App", 5, "Praise", "Excellent UI, very intuitive!", "Support Team", "Acknowledged", "Thanked customer"],
        ["FB-002", "2024-01-12", "Michael Brown", "mike@company.com", "Mobile App", 3, "Bug Report", "App crashes on login", "Dev Team", "In Progress", "Fix scheduled for v2.1"],
        ["FB-003", "2024-01-14", "Emily Davis", "emily@test.com", "Customer Service", 4, "Suggestion", "Would love chat support", "Product Team", "Under Review", "Evaluating options"],
        ["FB-004", "2024-01-15", "David Lee", "david@biz.com", "Billing", 2, "Complaint", "Overcharged last month", "Finance", "Resolved", "Refund processed"],
        ["FB-005", "2024-01-16", "Anna Martinez", "anna@client.com", "Web App", 5, "Praise", "Best tool in the market!", "Marketing", "Featured", "Used in testimonial"],
    ],
    styles: [
        {
            cellRef: "A1:K1",
            backgroundColor: "#059669",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
