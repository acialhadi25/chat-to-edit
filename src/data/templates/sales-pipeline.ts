import { ExcelTemplate } from "@/types/template";

export const salesPipelineTemplate: ExcelTemplate = {
    id: "pipeline-001",
    name: "Sales Pipeline Tracker",
    description: "Track leads through your sales funnel with value and probability",
    category: "sales",
    icon: "TrendingUp",
    tags: ["sales", "pipeline", "crm", "leads"],
    headers: [
        "Lead ID",
        "Company Name",
        "Contact Person",
        "Email",
        "Stage",
        "Deal Value",
        "Probability (%)",
        "Expected Close",
        "Weighted Value"
    ],
    sampleData: [
        ["L-001", "PT Maju Jaya", "John Smith", "john@majujaya.com", "Proposal", 500000000, 60, "2024-03-15", null],
        ["L-002", "CV Sukses Abadi", "Maria Garcia", "maria@sukses.co.id", "Negotiation", 250000000, 80, "2024-02-28", null],
        ["L-003", "PT Digital Nusantara", "Budi Santoso", "budi@digital.com", "Discovery", 1000000000, 30, "2024-04-30", null],
        ["L-004", "Startup Innovate", "Lisa Chen", "lisa@innovate.id", "Closed Won", 150000000, 100, "2024-01-30", null],
        ["L-005", "PT Global Tech", "Ahmad Rizky", "ahmad@global.id", "Qualified", 750000000, 40, "2024-05-15", null],
        ["", "", "", "", "TOTAL PIPELINE", null, null, "", null],
    ],
    formulas: [
        {
            column: 8, // Weighted Value
            formula: "=F{row}*G{row}/100",
            description: "Deal Value × Probability"
        }
    ],
    styles: [
        {
            cellRef: "A1:I1",
            backgroundColor: "#dc2626",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
