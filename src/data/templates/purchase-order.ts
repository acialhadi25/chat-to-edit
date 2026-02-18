import { ExcelTemplate } from '@/types/template';

export const purchaseOrderTemplate: ExcelTemplate = {
  id: 'inventory-003',
  name: 'Purchase Order',
  description: 'Create and manage purchase orders for suppliers',
  category: 'inventory',
  icon: 'ShoppingCart',
  tags: ['purchase', 'order', 'procurement', 'supplier'],
  headers: [
    'Item No',
    'Product Code',
    'Description',
    'Quantity',
    'Unit',
    'Unit Price (IDR)',
    'Subtotal',
    'Discount (%)',
    'Tax (%)',
    'Total',
  ],
  sampleData: [
    [1, 'PRD001', 'Laptop Dell XPS 13', 10, 'pcs', 15000000, null, 5, 11, null],
    [2, 'PRD002', 'Mouse Logitech MX Master', 50, 'pcs', 1200000, null, 10, 11, null],
    [3, 'PRD003', 'Keyboard Mechanical RGB', 30, 'pcs', 1500000, null, 5, 11, null],
    [4, 'PRD004', 'Monitor LG 27" 4K', 20, 'pcs', 5000000, null, 8, 11, null],
    [5, 'PRD005', 'Webcam Logitech C920', 25, 'pcs', 1800000, null, 5, 11, null],
    ['', '', '', '', '', '', null, null, null, null],
    ['', '', '', '', '', 'SUBTOTAL', null, null, null, null],
    ['', '', '', '', '', 'DISCOUNT', null, null, null, null],
    ['', '', '', '', '', 'TAX', null, null, null, null],
    ['', '', '', '', '', 'GRAND TOTAL', null, null, null, null],
  ],
  formulas: [
    {
      column: 6, // Subtotal
      formula: '=D{row}*F{row}',
      description: 'Quantity × Unit Price',
    },
    {
      column: 9, // Total
      formula: '=G{row}-(G{row}*H{row}/100)+(G{row}*I{row}/100)',
      description: 'Subtotal - Discount + Tax',
    },
  ],
  styles: [
    {
      cellRef: 'A1:J1',
      backgroundColor: '#06b6d4',
      fontColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  ],
};
