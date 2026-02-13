import { ExcelTemplate } from "@/types/template";
import { invoiceTemplate } from "./invoice";
import { inventoryTemplate } from "./inventory";
import { salesReportTemplate } from "./sales-report";
import { employeeDataTemplate } from "./employee-data";
import { budgetTemplate } from "./budget";
import { expenseTrackerTemplate } from "./expense-tracker";
import { projectTimelineTemplate } from "./project-timeline";
import { contactListTemplate } from "./contact-list";
import { attendanceSheetTemplate } from "./attendance-sheet";
import { productCatalogTemplate } from "./product-catalog";
import { purchaseOrderTemplate } from "./purchase-order";
import { taskTrackerTemplate } from "./task-tracker";
import { salesPipelineTemplate } from "./sales-pipeline";
import { meetingMinutesTemplate } from "./meeting-minutes";
import { customerFeedbackTemplate } from "./customer-feedback";

export const ALL_TEMPLATES: ExcelTemplate[] = [
    invoiceTemplate,
    salesReportTemplate,
    inventoryTemplate,
    productCatalogTemplate,
    purchaseOrderTemplate,
    employeeDataTemplate,
    attendanceSheetTemplate,
    budgetTemplate,
    expenseTrackerTemplate,
    projectTimelineTemplate,
    taskTrackerTemplate,
    contactListTemplate,
    salesPipelineTemplate,
    meetingMinutesTemplate,
    customerFeedbackTemplate,
];

export function getTemplateById(id: string): ExcelTemplate | undefined {
    return ALL_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ExcelTemplate["category"]): ExcelTemplate[] {
    return ALL_TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): ExcelTemplate[] {
    const lowerQuery = query.toLowerCase();
    return ALL_TEMPLATES.filter(
        (t) =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
}
