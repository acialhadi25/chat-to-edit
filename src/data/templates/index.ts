import { ExcelTemplate } from '@/types/template';
import { invoiceTemplate } from './invoice';
import { inventoryTemplate } from './inventory';
import { salesReportTemplate } from './sales-report';
import { employeeDataTemplate } from './employee-data';
import { budgetTemplate } from './budget';
import { expenseTrackerTemplate } from './expense-tracker';
import { projectTimelineTemplate } from './project-timeline';
import { contactListTemplate } from './contact-list';
import { attendanceSheetTemplate } from './attendance-sheet';
import { productCatalogTemplate } from './product-catalog';
import { customerFeedbackTemplate } from './customer-feedback';
import { profitLossTemplate } from './profit-loss';
import { payrollTemplate } from './payroll';
import { leaveTrackerTemplate } from './leave-tracker';
import { leadTrackerTemplate } from './lead-tracker';
import { marketingCampaignTemplate } from './marketing-campaign';
import { stockMovementTemplate } from './stock-movement';
import { purchaseOrderTemplate } from './purchase-order';
import { cashFlowTemplate } from './cash-flow';
import { quotationTemplate } from './quotation';
import { meetingMinutesTemplate } from './meeting-minutes';
import { assetRegisterTemplate } from './asset-register';
import { testComplexDataTemplate } from './test-complex-data';

export const ALL_TEMPLATES: ExcelTemplate[] = [
  invoiceTemplate,
  salesReportTemplate,
  inventoryTemplate,
  productCatalogTemplate,
  employeeDataTemplate,
  attendanceSheetTemplate,
  budgetTemplate,
  expenseTrackerTemplate,
  projectTimelineTemplate,
  contactListTemplate,
  customerFeedbackTemplate,
  profitLossTemplate,
  payrollTemplate,
  leaveTrackerTemplate,
  leadTrackerTemplate,
  marketingCampaignTemplate,
  stockMovementTemplate,
  purchaseOrderTemplate,
  cashFlowTemplate,
  quotationTemplate,
  meetingMinutesTemplate,
  assetRegisterTemplate,
  testComplexDataTemplate,
];

export function getTemplateById(id: string): ExcelTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ExcelTemplate['category']): ExcelTemplate[] {
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
