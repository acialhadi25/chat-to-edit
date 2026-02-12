import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Scissors,
  Merge,
  RotateCw,
  Trash2,
  Droplets,
  Image,
  Lock,
  FileDown,
  FilePlus,
  Stamp,
  ZoomIn,
  Layers,
  SplitSquareVertical,
  FileOutput,
  BookOpenCheck,
  ChevronDown
} from "lucide-react";

interface PdfPromptExamplesProps {
  onSelectPrompt: (prompt: string) => void;
  hasFiles?: boolean;
  fileCount?: number;
  currentFileName?: string;
  currentFilePages?: number;
}

const promptCategories = [
  {
    title: "📄 Extract Pages",
    icon: Scissors,
    color: "text-blue-500",
    prompts: [
      { label: "Extract page 1", value: "Extract page 1 from this PDF" },
      { label: "Extract pages 1-5", value: "Extract pages 1 to 5 from this PDF" },
      { label: "Extract first half", value: "Extract the first half of all pages" },
      { label: "Extract last 3 pages", value: "Extract the last 3 pages" },
      { label: "Extract odd pages", value: "Extract only odd-numbered pages (1, 3, 5...)" },
      { label: "Extract even pages", value: "Extract only even-numbered pages (2, 4, 6...)" },
      { label: "Extract middle section", value: "Extract pages from the middle (25% to 75% of total)" },
      { label: "Extract specific set", value: "Extract pages 2, 5, 7, 12, and 15 only" },
      { label: "Extract by interval", value: "Extract every 3rd page (3, 6, 9, 12...)" },
      { label: "Extract front and back", value: "Extract first 3 pages and last 3 pages" },
      { label: "Extract except first", value: "Extract all pages except the first one" },
      { label: "Extract document section", value: "Extract pages 10-20 to create a document section" },
    ]
  },
  {
    title: "🗑️ Delete Pages",
    icon: Trash2,
    color: "text-red-500",
    prompts: [
      { label: "Delete page 1", value: "Delete page 1 from this PDF" },
      { label: "Delete pages 2-4", value: "Delete pages 2 to 4 from this PDF" },
      { label: "Delete last page", value: "Delete the last page" },
      { label: "Keep only first 5", value: "Keep only the first 5 pages, delete the rest" },
      { label: "Delete blank pages", value: "Remove all blank pages from this PDF" },
      { label: "Delete page 1 & last", value: "Delete the first and last pages" },
      { label: "Delete odd pages", value: "Delete all odd-numbered pages" },
      { label: "Delete even pages", value: "Delete all even-numbered pages" },
      { label: "Delete multiple", value: "Delete pages 3, 7, 11, and 15" },
      { label: "Keep only range", value: "Keep only pages 10-20, delete everything else" },
      { label: "Delete cover pages", value: "Remove first 2 pages and last 2 pages (cover/back)" },
      { label: "Delete by interval", value: "Delete every 5th page (5, 10, 15, 20...)" },
    ]
  },
  {
    title: "🔄 Rotate Pages",
    icon: RotateCw,
    color: "text-green-500",
    prompts: [
      { label: "Rotate 90° clockwise", value: "Rotate all pages 90 degrees clockwise" },
      { label: "Rotate 90° counter", value: "Rotate all pages 90 degrees counter-clockwise" },
      { label: "Rotate page 1 only", value: "Rotate only page 1 by 90 degrees" },
      { label: "Rotate 180°", value: "Rotate all pages 180 degrees (flip upside down)" },
      { label: "Rotate pages 2-5", value: "Rotate pages 2 to 5 by 90 degrees clockwise" },
      { label: "Fix landscape pages", value: "Rotate landscape pages to portrait orientation" },
      { label: "Rotate specific pages", value: "Rotate pages 3, 7, and 10 by 90 degrees clockwise" },
      { label: "Rotate except first", value: "Rotate all pages except page 1 by 90 degrees" },
      { label: "Multi-angle rotate", value: "Rotate pages 1-3 by 90°, pages 4-6 by 180°, pages 7+ by 270°" },
      { label: "Rotate and fix", value: "Rotate all odd pages 90° clockwise to correct orientation" },
    ]
  },
  {
    title: "📑 Merge PDFs",
    icon: Merge,
    color: "text-purple-500",
    prompts: [
      { label: "Merge all files", value: "Merge all uploaded PDF files into one" },
      { label: "Merge File A + B", value: "Merge File A and File B together" },
      { label: "Combine in order", value: "Combine all files in the order they were uploaded" },
      { label: "Merge B before A", value: "Merge File B before File A" },
      { label: "Merge specific pages", value: "Merge pages 3-4 from File A with pages 12-13 from File B" },
      { label: "Merge partial files", value: "Merge first 5 pages of File A and last 3 pages of File B" },
      { label: "Extract & merge", value: "Extract pages 1, 5, 10 from File A and merge with pages 2-4 from File B" },
      { label: "Alternating pages", value: "Merge File A and File B with alternating pages (A1, B1, A2, B2...)" },
      { label: "File B first", value: "Merge File B before File A in their entirety" },
      { label: "3-file merge", value: "Combine File A, File B, and File C in that order" },
      { label: "Custom order", value: "Merge as: first 10 pages of B, then all of A, then last 5 pages of B" },
      { label: "Skip pages merge", value: "Merge File A (skip page 1) with File B (skip pages 2-3)" },
    ]
  },
  {
    title: "✂️ Split PDF",
    icon: SplitSquareVertical,
    color: "text-orange-500",
    prompts: [
      { label: "Split each page", value: "Split this PDF into individual pages (one file per page)" },
      { label: "Split in half", value: "Split this PDF into two equal parts" },
      { label: "Split every 5 pages", value: "Split this PDF every 5 pages" },
      { label: "Split at page 10", value: "Split this PDF at page 10 into two files" },
      { label: "Split into 3 parts", value: "Split this PDF into 3 equal parts" },
      { label: "Split at custom page", value: "Split at page 15 to create a chapter split" },
      { label: "Split every 10 pages", value: "Create multiple files with 10 pages each" },
      { label: "Split into 4 parts", value: "Split this PDF equally into 4 documents" },
      { label: "Split chapters", value: "Split at pages 20, 40, 60 to create chapter files" },
      { label: "Keep vs delete split", value: "Split to separate pages 1-10 in one file and pages 11+ in another" },
    ]
  },
  {
    title: "💧 Watermark",
    icon: Droplets,
    color: "text-cyan-500",
    prompts: [
      { label: "Add DRAFT watermark", value: "Add 'DRAFT' watermark to all pages" },
      { label: "Add CONFIDENTIAL", value: "Add 'CONFIDENTIAL' watermark diagonally on all pages" },
      { label: "Add company name", value: "Add 'Company Name' watermark to all pages" },
      { label: "Watermark page 1 only", value: "Add 'SAMPLE' watermark only on page 1" },
      { label: "Add date watermark", value: "Add today's date as a watermark on all pages" },
      { label: "Add DO NOT COPY", value: "Add 'DO NOT COPY' watermark to all pages" },
      { label: "Selective watermark", value: "Add 'APPROVED' watermark only to pages 5-10" },
      { label: "Multiple watermarks", value: "Add 'CONFIDENTIAL' to odd pages and 'DRAFT' to even pages" },
      { label: "Custom watermark", value: "Add 'FOR INTERNAL USE ONLY' watermark to all pages" },
      { label: "Page number watermark", value: "Add page numbers (1, 2, 3...) as watermark to all pages" },
      { label: "Date & department", value: "Add 'Department Name - Date' watermark to all pages" },
    ]
  },
  {
    title: "🖼️ Convert to Image",
    icon: Image,
    color: "text-indigo-500",
    prompts: [
      { label: "Convert to PNG", value: "Convert this PDF to PNG images" },
      { label: "Convert to JPG", value: "Convert this PDF to JPG images" },
      { label: "Convert page 1 only", value: "Convert only page 1 to an image" },
      { label: "High quality export", value: "Export all pages as high quality images" },
      { label: "Thumbnail images", value: "Create thumbnail images for each page" },
      { label: "Specific pages to PNG", value: "Convert pages 1, 5, and 10 to PNG images" },
      { label: "First page preview", value: "Convert first page to high quality image for preview" },
      { label: "JPG archive", value: "Export all pages as JPG for easier sharing" },
      { label: "Low quality thumbnails", value: "Create small JPG thumbnails for all pages" },
      { label: "Last page export", value: "Convert the last page to PNG" },
    ]
  },
  {
    title: "📊 PDF Info & Analysis",
    icon: BookOpenCheck,
    color: "text-amber-500",
    prompts: [
      { label: "Get PDF info", value: "Show information about this PDF (pages, size, metadata)" },
      { label: "Count pages", value: "How many pages does this PDF have?" },
      { label: "Check file size", value: "What is the file size of this PDF?" },
      { label: "Show metadata", value: "Show the metadata of this PDF (author, creation date)" },
      { label: "Analyze document", value: "Analyze this PDF document structure" },
      { label: "Check all files", value: "Show information about all uploaded files (pages, sizes)" },
      { label: "Compare file sizes", value: "Compare the file sizes of all uploaded PDFs" },
      { label: "Total pages count", value: "How many total pages across all uploaded PDFs?" },
      { label: "Detailed analysis", value: "Provide a detailed analysis of this PDF's structure, layout, and content types" },
      { label: "Page dimensions", value: "What are the page dimensions (width x height) of this PDF?" },
    ]
  }
];

export const PdfPromptExamples = ({
  onSelectPrompt,
  hasFiles,
  fileCount,
  currentFileName,
  currentFilePages
}: PdfPromptExamplesProps) => {
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
        <FileText className="h-5 w-5 text-primary" />
      </div>
      
      <h4 className="mb-1 font-semibold text-foreground text-sm">
        PDF AI Assistant
      </h4>
      <p className="max-w-[280px] text-xs text-muted-foreground mb-1">
        {hasFiles 
          ? `Working with ${fileCount} file${fileCount && fileCount > 1 ? 's' : ''}`
          : "Upload PDF files to start"}
      </p>
      {hasFiles && currentFileName && (
        <p className="text-xs text-muted-foreground mb-2">
          📄 {currentFileName} ({currentFilePages} pages)
        </p>
      )}

      <div className="w-full space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
        {promptCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.title);
          const displayedPrompts = isExpanded ? category.prompts : category.prompts.slice(0, 2);
          const hasMore = category.prompts.length > 3;

          return (
            <Card
              key={category.title}
              className="p-2 bg-accent/30 border-border/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-2 flex-1">
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-sm font-medium text-foreground">
                    {category.title}
                  </span>
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

export default PdfPromptExamples;
