import { ExcelTemplate } from '@/types/template';

export const quotationTemplate: ExcelTemplate = {
  id: 'business-003',
  name: 'Sales Quotation',
  description: 'Professional quotation template for client proposals',
  category: 'business',
  icon: 'FileCheck',
  tags: ['quotation', 'quote', 'proposal', 'pricing'],
  headers: [
    'No',
    'Item Description',
    'Specifications',
    'Quantity',
    'Unit',
    'Unit Price (IDR)',
    'Subtotal',
    'Discount (%)',
    'Amount',
  ],
  sampleData: [
    [1, 'Website Development', 'Responsive, 5 pages, CMS', 1, 'project', 25000000, null, 0, null],
    [
      2,
      'Mobile App Development',
      'iOS & Android, 10 screens',
      1,
      'project',
      50000000,
      null,
      5,
      null,
    ],
    [3, 'UI/UX Design', 'Complete design system', 1, 'project', 15000000, null, 0, null],
    [4, 'SEO Optimization', '6 months service', 6, 'month', 3000000, null, 10, null],
    [5, 'Content Writing', '20 articles', 20, 'article', 500000, null, 0, null],
    [6, 'Social Media Management', '3 months service', 3, 'month', 5000000, null, 5, null],
    ['', '', '', '', '', '', null, null, null],
    ['', '', '', '', '', 'SUBTOTAL', null, null, null],
    ['', '', '', '', '', 'DISCOUNT', null, null, null],
    ['', '', '', '', '', 'TAX (11%)', null, null, null],
    ['', '', '', '', '', 'TOTAL', null, null, null],
  ],
  formulas: [
    {
      column: 6, // Subtotal
      formula: '=D{row}*F{row}',
      description: 'Quantity × Unit Price',
    },
    {
      column: 8, // Amount
      formula: '=G{row}-(G{row}*H{row}/100)',
      description: 'Subtotal - Discount',
    },
  ],
  styles: [
    {
      cellRef: 'A1:I1',
      backgroundColor: '#3b82f6',
      fontColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  ],
};
