// Document Action types that AI can perform
export type DocsActionType =
  | "WRITE"
  | "REWRITE"
  | "GRAMMAR_CHECK"
  | "SUMMARIZE"
  | "TRANSLATE"
  | "FORMAT"
  | "EXPAND"
  | "TONE_ADJUST"
  | "TEMPLATE"
  | "ANALYZE"
  | "SECTION_MOVE"
  | "SECTION_DELETE"
  | "CLARIFY"
  | "INFO"
  | "SIMPLIFY"
  | "PARAPHRASE"
  | "ADD_HEADINGS"
  | "BULLET_POINTS"
  | "NUMBERED_LIST"
  | "ADD_EXAMPLES"
  | "OUTLINE"
  | "PROOFREAD";

// Document section
export interface DocumentSection {
  id: string;
  title?: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

// AI Action for document operations
export interface AIAction {
  type: DocsActionType;
  targetSection?: string; // Section ID or section number
  replacement?: string; // For REWRITE, GRAMMAR_CHECK
  fullDocument?: string; // For WRITE, REWRITE entire document
  language?: string; // For TRANSLATE
  tone?: "formal" | "casual" | "professional" | "creative" | "academic" | "persuasive" | "conversational"; // For TONE_ADJUST
  format?: "list" | "table" | "heading" | "paragraph" | "bullet" | "numbered"; // For FORMAT
  templateType?: string; // For TEMPLATE
  expandLevel?: number; // 1-3 for EXPAND
  summary?: string; // For SUMMARIZE
  // New fields for extended functionality
  readingLevel?: "simple" | "moderate" | "advanced"; // For SIMPLIFY
  outlineStyle?: "detailed" | "brief"; // For OUTLINE
  listStyle?: "bullet" | "numbered" | "checklist"; // For list formatting
  grammarIssues?: { position: number; original: string; suggestion: string; type: string }[]; // For PROOFREAD
  status: "pending" | "applied" | "rejected";
}

// Document metadata
export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdAt?: Date;
  lastModified?: Date;
  wordCount?: number;
}

// Document state
export interface DocsData {
  id: string;
  fileName: string;
  content: string;
  markdown?: string; // Markdown representation
  htmlContent?: string; // HTML representation (for DOCX with formatting)
  docxFile?: File; // Original DOCX file for docx-preview rendering
  metadata: DocumentMetadata;
  sections: DocumentSection[];
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;
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
  actionType: DocsActionType;
  description: string;
  before: DocsData;
  after: DocsData;
}

// AI Response from edge function
export interface AIResponse {
  content: string;
  action?: {
    type: DocsActionType;
    replacement?: string;
    fullDocument?: string;
    language?: string;
    tone?: "formal" | "casual" | "professional" | "creative";
    format?: "list" | "table" | "heading" | "paragraph";
    templateType?: string;
    expandLevel?: number;
    summary?: string;
  };
  quickOptions?: QuickOption[];
}

// Document analysis
export interface DocumentAnalysis {
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTimeMinutes: number;
  keyThemes?: string[];
  averageSentenceLength?: number;
  uniqueWords?: number;
}
