// PDF Action types that AI can perform
export type PDFActionType =
  | "EXTRACT_PAGES"
  | "MERGE_FILES"
  | "SPLIT_PDF"
  | "SPLIT_AT_PAGE"
  | "SPLIT_EVERY_N"
  | "REORDER_PAGES"
  | "DELETE_PAGES"
  | "ROTATE_PAGES"
  | "ADD_WATERMARK"
  | "EXTRACT_TEXT"
  | "COMPRESS"
  | "CONVERT_TO_IMAGE"
  | "PDF_INFO"
  | "EXTRACT_ODD_PAGES"
  | "EXTRACT_EVEN_PAGES"
  | "REVERSE_PAGES"
  | "KEEP_FIRST_N"
  | "KEEP_LAST_N"
  | "CLARIFY"
  | "INFO";

// Target for PDF operations
export interface PDFTarget {
  type: "page" | "file" | "range";
  ref: string; // e.g., "1", "File A", "1-5"
}

// Individual page operation
export interface PageOperation {
  fileRef?: string; // e.g., "File A", "File B"
  pages: number[]; // 1-indexed page numbers
  operation?: "rotate" | "delete" | "extract";
  rotation?: 0 | 90 | 180 | 270;
}

// Page range specification for merging
export interface PageRange {
  fileRef: string; // e.g., "File A", "File B"
  pages: number[]; // 1-indexed page numbers
}

// AI Action attached to a message
export interface AIAction {
  type: PDFActionType;
  target?: PDFTarget;
  pages?: number[];
  fileRefs?: string[];
  pageRanges?: PageRange[]; // For advanced merge operations with specific page ranges
  rotation?: 0 | 90 | 180 | 270;
  watermarkText?: string;
  outputFormat?: "pdf" | "png" | "jpg";
  compressionLevel?: "low" | "medium" | "high";
  // New fields for extended functionality
  splitAtPage?: number;
  splitEveryN?: number;
  keepFirstN?: number;
  keepLastN?: number;
  watermarkPosition?: "center" | "top" | "bottom" | "diagonal";
  watermarkOpacity?: number;
  watermarkFontSize?: number;
  status: "pending" | "applied" | "rejected";
}

// PDF file data
export interface PDFFile {
  id: string;
  name: string;
  file: File;
  url: string;
  pages: number;
  fileSize: number;
  uploadedAt: Date;
}

// PDF document state
export interface PDFData {
  files: PDFFile[];
  currentFileId: string;
  currentPageIndex: number;
  rotation: number; // Current page rotation
  selectedPages: number[];
  pdfUrl?: string;
}

// Chat message structure
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AIAction;
  quickOptions?: QuickOption[];
  timestamp: Date;
}

// Quick option button for user to click
export interface QuickOption {
  id: string;
  label: string;
  value: string;
  variant: "default" | "success" | "destructive" | "outline";
  icon?: string;
  isApplyAction?: boolean;
}

// History entry for undo/redo
export interface EditHistory {
  id: string;
  timestamp: Date;
  actionType: PDFActionType;
  description: string;
  before: PDFData;
  after: PDFData;
}

// AI Response from edge function
export interface AIResponse {
  content: string;
  action?: {
    type: PDFActionType;
    target?: PDFTarget;
    pages?: number[];
    fileRefs?: string[];
    pageRanges?: PageRange[]; // For advanced merge operations
    rotation?: 0 | 90 | 180 | 270;
    watermarkText?: string;
    outputFormat?: "pdf" | "png" | "jpg";
    compressionLevel?: "low" | "medium" | "high";
  };
  quickOptions?: QuickOption[];
}

// PDF Info response
export interface PDFInfo {
  pages: number;
  fileSize: number;
  fileName: string;
  hasBookmarks?: boolean;
  creationDate?: Date;
  title?: string;
  author?: string;
}
