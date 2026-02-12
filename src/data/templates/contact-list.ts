import { ExcelTemplate } from "@/types/template";

export const contactListTemplate: ExcelTemplate = {
    id: "contact-001",
    name: "Contact List",
    description: "Organize contacts with complete information",
    category: "personal",
    icon: "Contact",
    tags: ["contacts", "address book", "crm"],
    headers: [
        "Name",
        "Company",
        "Position",
        "Email",
        "Phone",
        "Address",
        "City",
        "Category",
        "Notes"
    ],
    sampleData: [
        ["Ahmad Rizki", "Tech Solutions", "CEO", "ahmad@techsolutions.com", "081234567890", "Jl. Sudirman No. 123", "Jakarta", "Business", ""],
        ["Siti Nurhaliza", "Finance Corp", "CFO", "siti@financecorp.com", "081234567891", "Jl. Gatot Subroto 45", "Jakarta", "Business", ""],
        ["Budi Santoso", "Marketing Pro", "Director", "budi@marketingpro.com", "081234567892", "Jl. Thamrin 78", "Jakarta", "Business", ""],
        ["Dewi Lestari", "HR Solutions", "Manager", "dewi@hrsolutions.com", "081234567893", "Jl. Rasuna Said 90", "Jakarta", "Business", ""],
        ["Eko Prasetyo", "Dev Studio", "CTO", "eko@devstudio.com", "081234567894", "Jl. Kuningan 12", "Jakarta", "Business", ""],
        ["Fitri Handayani", "Freelancer", "Designer", "fitri@email.com", "081234567895", "Jl. Dago 56", "Bandung", "Personal", "Friend from college"],
        ["Gunawan Wijaya", "Sales Inc", "Sales Manager", "gunawan@salesinc.com", "081234567896", "Jl. Braga 34", "Bandung", "Business", ""],
        ["Hana Permata", "Creative Agency", "Art Director", "hana@creative.com", "081234567897", "Jl. Pemuda 23", "Surabaya", "Business", ""],
        ["Indra Kusuma", "Operations Co", "COO", "indra@operations.com", "081234567898", "Jl. Pahlawan 67", "Surabaya", "Business", ""],
        ["Julia Rahmawati", "Consultant", "HR Consultant", "julia@consultant.com", "081234567899", "Jl. Diponegoro 89", "Semarang", "Business", ""],
    ],
    styles: [
        {
            cellRef: "A1:I1",
            backgroundColor: "#f59e0b",
            fontColor: "#ffffff",
            fontWeight: "bold",
            textAlign: "center"
        }
    ]
};
