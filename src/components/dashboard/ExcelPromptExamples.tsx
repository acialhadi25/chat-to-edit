import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Eraser,
  ArrowUpDown,
  Filter,
  Columns,
  Trash2,
  TextCursorInput,
  Merge,
  Split,
  Copy,
  FileSpreadsheet,
  Wand2,
  Search,
  Type,
  ArrowDownNarrowWide,
  ListFilter,
  ChevronDown
} from "lucide-react";

interface ExcelPromptExamplesProps {
  onSelectPrompt: (prompt: string) => void;
  fileName?: string;
}

const promptCategories = [
  {
    title: "📊 Formula & Calculations",
    icon: Calculator,
    color: "text-blue-500",
    prompts: [
      { label: "Create Total = Price × Quantity", value: "Create a new column 'Total' that calculates Price multiplied by Quantity" },
      { label: "Calculate SUM for column", value: "Add a SUM formula at the bottom of the Amount column" },
      { label: "Calculate AVERAGE", value: "Calculate the average of all values in the Price column" },
      { label: "Add percentage column", value: "Create a column that shows each row's value as a percentage of the total" },
      { label: "Calculate difference", value: "Add a column showing the difference between columns A and B" },
      { label: "Running total", value: "Create a cumulative sum column for the Sales data" },
      { label: "Calculate growth rate", value: "Create a column showing month-over-month growth percentage" },
      { label: "Min and Max values", value: "Add rows showing MIN and MAX values for each numeric column" },
      { label: "Weighted average", value: "Calculate weighted average of values based on weights" },
      { label: "Count with conditions", value: "Count how many values are above 100 or below 50" },
      { label: "Compound interest", value: "Calculate compound interest with principal, rate, and time" },
      { label: "Discount calculation", value: "Add a column showing final price after applying discount percentage" },
    ]
  },
  {
    title: "🧹 Data Cleaning",
    icon: Eraser,
    color: "text-green-500",
    prompts: [
      { label: "Remove empty rows", value: "Remove all empty rows from the data" },
      { label: "Clean extra spaces", value: "Trim extra whitespace from all cells" },
      { label: "Remove duplicates", value: "Remove duplicate rows from the data" },
      { label: "Fill empty cells", value: "Fill empty cells with the value above them" },
      { label: "Fix inconsistent formats", value: "Standardize all date formats to YYYY-MM-DD" },
      { label: "Remove special characters", value: "Remove special characters from the Name column" },
    ]
  },
  {
    title: "🔄 Find & Replace",
    icon: Search,
    color: "text-purple-500",
    prompts: [
      { label: "Replace text globally", value: "Replace all occurrences of 'N/A' with empty cells" },
      { label: "Replace in specific column", value: "Replace 'USD' with '$' in the Currency column" },
      { label: "Fix typos", value: "Replace 'Unknwon' with 'Unknown' in all columns" },
      { label: "Update status values", value: "Replace 'pending' with 'Pending' in Status column" },
    ]
  },
  {
    title: "↕️ Sort & Filter",
    icon: ArrowUpDown,
    color: "text-orange-500",
    prompts: [
      { label: "Sort A-Z by name", value: "Sort data by Name column alphabetically A-Z" },
      { label: "Sort by date (newest)", value: "Sort by Date column with newest first" },
      { label: "Sort by amount (highest)", value: "Sort by Amount column from highest to lowest" },
      { label: "Filter rows > value", value: "Keep only rows where Amount is greater than 1000" },
      { label: "Filter by text", value: "Keep only rows where Status contains 'Active'" },
      { label: "Filter empty values", value: "Remove rows where Email column is empty" },
      { label: "Multi-column sort", value: "Sort by Department (A-Z), then by Salary (highest to lowest)" },
      { label: "Filter date range", value: "Keep only rows where Date is between Jan 1 and Dec 31, 2023" },
      { label: "Complex filter", value: "Keep rows where Status='Active' AND Salary > 50000" },
      { label: "Filter with OR", value: "Keep rows where Status='Active' OR Status='Pending'" },
      { label: "Exclude filter", value: "Remove all rows where Category contains 'Archive' or 'Old'" },
      { label: "Top N records", value: "Show only the top 10 records by Sales amount" },
    ]
  },
  {
    title: "Aa Text Transform",
    icon: Type,
    color: "text-cyan-500",
    prompts: [
      { label: "UPPERCASE names", value: "Convert all values in Name column to uppercase" },
      { label: "lowercase emails", value: "Convert all Email values to lowercase" },
      { label: "Title Case names", value: "Convert Name column to Title Case (First Letter Capital)" },
      { label: "Capitalize first letter", value: "Capitalize the first letter of each cell in Description" },
    ]
  },
  {
    title: "📐 Column Operations",
    icon: Columns,
    color: "text-indigo-500",
    prompts: [
      { label: "Add new column", value: "Add a new column called 'Status' at the end" },
      { label: "Delete column", value: "Delete the Notes column" },
      { label: "Split column by delimiter", value: "Split the Full Name column into First Name and Last Name" },
      { label: "Merge columns", value: "Merge First Name and Last Name into Full Name with space separator" },
      { label: "Reorder columns", value: "Move the Email column to be after the Name column" },
      { label: "Rename column", value: "Rename column 'Amt' to 'Amount'" },
    ]
  },
  {
    title: "🗑️ Row Operations",
    icon: Trash2,
    color: "text-red-500",
    prompts: [
      { label: "Delete specific rows", value: "Delete rows 5, 10, and 15" },
      { label: "Delete rows by condition", value: "Delete all rows where Status is 'Cancelled'" },
      { label: "Keep only top N rows", value: "Keep only the first 100 rows" },
      { label: "Delete rows with errors", value: "Remove rows where any cell contains '#ERROR'" },
    ]
  },
  {
    title: "✨ Advanced Operations",
    icon: Wand2,
    color: "text-pink-500",
    prompts: [
      { label: "Conditional formatting data", value: "Highlight values greater than 1000 in the Amount column" },
      { label: "Extract numbers", value: "Extract only numbers from the Price column (remove currency symbols)" },
      { label: "Format as currency", value: "Format the Price column as USD currency ($X,XXX.XX)" },
      { label: "Generate unique IDs", value: "Create a unique ID column with format 'ID-001, ID-002, etc.'" },
      { label: "Calculate age from date", value: "Create an Age column calculated from the Birth Date column" },
      { label: "Concatenate with separator", value: "Create a full address by combining Street, City, and ZIP with comma separator" },
      { label: "Pivot table summary", value: "Create a summary showing Total Sales by Region and Month" },
      { label: "Vlookup reference", value: "Use VLOOKUP to match Product IDs with prices from reference table" },
      { label: "Data validation list", value: "Add data validation dropdown with predefined options for Status column" },
      { label: "Conditional row highlight", value: "Highlight rows where Revenue > Goal and Status='Completed'" },
      { label: "Text extraction", value: "Extract product names from cells that contain product IDs and names" },
      { label: "Month from date", value: "Create a Month column extracting month from Date column for grouping" },
    ]
  }
];

export const ExcelPromptExamples = ({ onSelectPrompt, fileName }: ExcelPromptExamplesProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex flex-col items-center justify-center py-3 px-3 text-center animate-in fade-in duration-500">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
      </div>
      
      <h4 className="mb-1 font-semibold text-foreground text-sm">
        {fileName ? `Ready to edit "${fileName}"` : "Excel AI Assistant"}
      </h4>
      <p className="max-w-[280px] text-xs text-muted-foreground mb-3">
        {fileName 
          ? "Tell me what to do. Click an example or type below:"
          : "Upload an Excel file to start"}
      </p>

      <div className="w-full space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
        {promptCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.title);
          const displayedPrompts = isExpanded ? category.prompts : category.prompts.slice(0, 2);
          const hasMore = category.prompts.length > 3;

          return (
            <Card key={category.title} className="p-2 bg-accent/30 border-border/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-2 flex-1">
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-sm font-medium text-foreground">{category.title}</span>
                  {hasMore && (
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      {displayedPrompts.length}/{category.prompts.length}
                    </span>
                  )}
                </div>
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(category.title)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displayedPrompts.map((prompt) => (
                  <Badge
                    key={prompt.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs py-1"
                    onClick={() => onSelectPrompt(prompt.value)}
                  >
                    {prompt.label}
                  </Badge>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        💡 Click any example or type your own command
      </p>
    </div>
  );
};

export default ExcelPromptExamples;
