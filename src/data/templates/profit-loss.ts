import { ExcelTemplate } from '@/types/template';

export const profitLossTemplate: ExcelTemplate = {
  id: 'finance-002',
  name: 'Profit & Loss Statement',
  description: 'Monthly P&L statement with automatic calculations',
  category: 'finance',
  icon: 'DollarSign',
  tags: ['profit', 'loss', 'income statement', 'financial'],
  headers: ['Category', 'Description', 'Amount (IDR)', '% of Revenue'],
  sampleData: [
    ['REVENUE', '', '', ''],
    ['Sales Revenue', 'Product sales', 150000000, null],
    ['Service Revenue', 'Consulting services', 50000000, null],
    ['Other Income', 'Interest & misc', 5000000, null],
    ['TOTAL REVENUE', '', null, ''],
    ['', '', '', ''],
    ['COST OF GOODS SOLD', '', '', ''],
    ['Materials', 'Raw materials', 40000000, null],
    ['Labor', 'Direct labor costs', 25000000, null],
    ['TOTAL COGS', '', null, ''],
    ['', '', '', ''],
    ['GROSS PROFIT', '', null, ''],
    ['', '', '', ''],
    ['OPERATING EXPENSES', '', '', ''],
    ['Salaries', 'Employee salaries', 30000000, null],
    ['Rent', 'Office rent', 10000000, null],
    ['Utilities', 'Electricity, water, internet', 3000000, null],
    ['Marketing', 'Advertising & promotion', 8000000, null],
    ['TOTAL OPERATING EXPENSES', '', null, ''],
    ['', '', '', ''],
    ['NET PROFIT', '', null, ''],
  ],
  formulas: [
    {
      column: 2, // Amount for TOTAL REVENUE
      formula: '=SUM(C2:C4)',
      description: 'Sum of all revenue',
    },
    {
      column: 2, // Amount for TOTAL COGS
      formula: '=SUM(C8:C9)',
      description: 'Sum of COGS',
    },
    {
      column: 2, // Amount for GROSS PROFIT
      formula: '=C5-C10',
      description: 'Revenue - COGS',
    },
    {
      column: 2, // Amount for TOTAL OPERATING EXPENSES
      formula: '=SUM(C15:C18)',
      description: 'Sum of operating expenses',
    },
    {
      column: 2, // Amount for NET PROFIT
      formula: '=C12-C19',
      description: 'Gross Profit - Operating Expenses',
    },
    {
      column: 3, // % of Revenue
      formula: '=IF(C{row}<>"",C{row}/$C$5*100,"")',
      description: 'Percentage of total revenue',
    },
  ],
  styles: [
    {
      cellRef: 'A1:D1',
      backgroundColor: '#10b981',
      fontColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  ],
};
