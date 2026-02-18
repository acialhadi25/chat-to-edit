import { ExcelTemplate } from '@/types/template';

export const cashFlowTemplate: ExcelTemplate = {
  id: 'finance-003',
  name: 'Cash Flow Statement',
  description: 'Track cash inflows and outflows for financial planning',
  category: 'finance',
  icon: 'TrendingUp',
  tags: ['cash flow', 'financial', 'liquidity', 'treasury'],
  headers: [
    'Date',
    'Description',
    'Category',
    'Cash In (IDR)',
    'Cash Out (IDR)',
    'Net Cash Flow',
    'Running Balance',
  ],
  sampleData: [
    ['2026-02-01', 'Opening Balance', 'Opening', 100000000, 0, null, null],
    ['2026-02-02', 'Sales Revenue', 'Operating', 50000000, 0, null, null],
    ['2026-02-03', 'Supplier Payment', 'Operating', 0, 20000000, null, null],
    ['2026-02-04', 'Salary Payment', 'Operating', 0, 30000000, null, null],
    ['2026-02-05', 'Customer Payment', 'Operating', 35000000, 0, null, null],
    ['2026-02-06', 'Rent Payment', 'Operating', 0, 10000000, null, null],
    ['2026-02-07', 'Equipment Purchase', 'Investing', 0, 15000000, null, null],
    ['2026-02-08', 'Loan Received', 'Financing', 50000000, 0, null, null],
    ['2026-02-09', 'Utilities Payment', 'Operating', 0, 3000000, null, null],
    ['2026-02-10', 'Service Revenue', 'Operating', 25000000, 0, null, null],
    ['2026-02-11', 'Marketing Expense', 'Operating', 0, 8000000, null, null],
    ['2026-02-12', 'Customer Payment', 'Operating', 40000000, 0, null, null],
  ],
  formulas: [
    {
      column: 5, // Net Cash Flow
      formula: '=D{row}-E{row}',
      description: 'Cash In - Cash Out',
    },
    {
      column: 6, // Running Balance
      formula: '=IF(ROW()=2,F{row},G{row-1}+F{row})',
      description: 'Previous Balance + Net Cash Flow',
    },
  ],
  styles: [
    {
      cellRef: 'A1:G1',
      backgroundColor: '#10b981',
      fontColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  ],
};
