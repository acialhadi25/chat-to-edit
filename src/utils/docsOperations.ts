import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { DocsData, DocumentSection, DocumentAnalysis } from "@/types/docs";
import { renderAsync } from "docx-preview";

// Parse markdown to get sections (simple implementation)
export function parseDocumentSections(content: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = content.split("\n");
  let currentSection: Partial<DocumentSection> | null = null;
  let charIndex = 0;

  for (const line of lines) {
    const isSectionHeader = line.match(/^#{1,3}\s+/);

    if (isSectionHeader) {
      if (currentSection) {
        currentSection.endIndex = charIndex - 1;
        sections.push(currentSection as DocumentSection);
      }

      const title = line.replace(/^#+\s+/, "").trim();
      currentSection = {
        id: `section-${sections.length}`,
        title,
        content: "",
        startIndex: charIndex,
        endIndex: 0,
      };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }

    charIndex += line.length + 1; // +1 for newline
  }

  if (currentSection) {
    currentSection.endIndex = charIndex;
    sections.push(currentSection as DocumentSection);
  }

  return sections;
}

// Extract plain text from DOCX file
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from document");
  }
}

// Render DOCX using docx-preview for maximum fidelity
export async function renderDocxPreview(
  file: File, 
  bodyContainer: HTMLElement, 
  styleContainer?: HTMLElement
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    await renderAsync(arrayBuffer, bodyContainer, styleContainer || undefined, {
      className: "docx-preview-content",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      experimental: true,
      trimXmlDeclaration: true,
      useBase64URL: true,
      renderChanges: false,
      renderComments: false,
      debug: false,
    });

    console.log("Rendered DOCX preview using docx-preview library with full fidelity");
  } catch (error) {
    console.error("Error rendering DOCX preview:", error);
    throw new Error("Failed to render document preview");
  }
}

// Get HTML from DOCX file with enhanced Mammoth styleMap
export async function extractHtmlFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Ultra-comprehensive styleMap to capture all DOCX formatting elements
    const styleMap = [
      // ========== HEADINGS ==========
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
      "p[style-name='Title'] => h1:fresh",
      "p[style-name='Subtitle'] => h2:fresh",

      // ========== LISTS - NUMBERED ==========
      "p[style-name='List Number'] => ol > li",
      "p[style-name='List Number 1'] => ol > li",
      "p[style-name='List Number 2'] => ol > li",
      "p[style-name='List Number 3'] => ol > li",
      "p[style-name='List Number 4'] => ol > li",
      "p[style-name='List Number 5'] => ol > li",
      "p[style-name='List Paragraph'] => li",

      // ========== LISTS - BULLETED ==========
      "p[style-name='List Bullet'] => ul > li",
      "p[style-name='List Bullet 1'] => ul > li",
      "p[style-name='List Bullet 2'] => ul > li",
      "p[style-name='List Bullet 3'] => ul > li",
      "p[style-name='List Bullet 4'] => ul > li",
      "p[style-name='List Bullet 5'] => ul > li",

      // ========== TEXT FORMATTING ==========
      "b => strong",
      "i => em",
      "u => u",
      "strike => del",
      "sup => sup",
      "sub => sub",

      // ========== QUOTE/REFERENCE ==========
      "p[style-name='Quote'] => blockquote",
      "p[style-name='Intense Quote'] => blockquote",

      // ========== CODE ==========
      "p[style-name='Intense Reference'] => code",

      // ========== NORMAL/DEFAULT PARAGRAPH ==========
      "p => p:fresh",

      // ========== TABLES ==========
      "table => table",
      "tbody => tbody",
      "thead => thead",
      "tr => tr",
      "tc => td",
      "td => td",
      "th => th",

      // ========== SECTIONS AND DIVIDERS ==========
      "hr => hr",
    ];

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap,
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer: string) {
            const contentType = image.contentType || "image/png";
            return {
              src: `data:${contentType};base64,${imageBuffer}`,
              alt: "Document image",
              style: "max-width: 100%; height: auto; margin: 12px 0; border-radius: 3px; display: block;",
            };
          });
        }),
      }
    );

    let html = result.value;

    // Log warnings if any (style conversions that failed)
    if (result.messages && result.messages.length > 0) {
      console.log("Mammoth conversion messages:", result.messages);
    }

    // Wrap with wrapper div and apply comprehensive inline styling
    const wrappedHtml = `
      <div class="docx-wrapper" style="
        font-family: 'Calibri', 'Segoe UI', 'Arial', sans-serif;
        line-height: 1.5;
        color: #000;
        background: #fff;
        padding: 0;
        white-space: normal;
        overflow-wrap: break-word;
      ">
        ${html}
      </div>
    `;

    console.log("✓ Extracted HTML from DOCX with enhanced Mammoth styleMap");
    return wrappedHtml;
  } catch (error) {
    console.error("Error extracting HTML from DOCX:", error);
    throw new Error("Failed to extract HTML from document");
  }
}

// Create DOCX from text
export async function createDocxFromText(
  title: string,
  content: string
): Promise<Uint8Array> {
  // Split content by headings and paragraphs
  const paragraphs: Paragraph[] = [];

  // Add title as heading
  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
  }

  // Parse and add content
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.trim() === "") {
      // Empty paragraph for spacing
      paragraphs.push(new Paragraph({ text: "" }));
    } else if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#+\s+/, ""),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200, before: 200 },
        })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#+\s+/, ""),
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100, before: 100 },
        })
      );
    } else if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#+\s+/, ""),
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 100, before: 100 },
        })
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^[-*]\s+/, ""),
          bullet: { level: 0 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          text: line,
          spacing: { line: 240, lineRule: "auto" },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBuffer(doc) as Uint8Array;
}

// Export to PDF (using browser print API)
export function exportToPdf(title: string, content: string): void {
  const printWindow = window.open("", "", "height=600,width=800");
  if (printWindow) {
    printWindow.document.write("<html><head><title>" + title + "</title>");
    printWindow.document.write(
      "<style>body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }"
    );
    printWindow.document.write("h1 { font-size: 24px; margin-bottom: 10px; }");
    printWindow.document.write("h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; }");
    printWindow.document.write("h3 { font-size: 18px; margin-top: 15px; margin-bottom: 10px; }");
    printWindow.document.write("p { margin: 10px 0; }");
    printWindow.document.write("</style></head><body>");

    // Convert markdown-like formatting to HTML
    let htmlContent = content
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
      .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
      .replace(/\n/g, "<br/>");

    printWindow.document.write(`<h1>${title}</h1>`);
    printWindow.document.write(htmlContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// Calculate document statistics
export function analyzeDocument(content: string): DocumentAnalysis {
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Simple sentence counting (split by . ! ?)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Average reading speed is ~200 words per minute
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  // Calculate unique words
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;

  // Average sentence length
  const averageSentenceLength = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  return {
    wordCount,
    paragraphCount,
    sentenceCount,
    readingTimeMinutes,
    uniqueWords,
    averageSentenceLength,
  };
}

// Replace section content
export function replaceSection(
  content: string,
  sectionIndex: number,
  newContent: string
): string {
  const sections = parseDocumentSections(content);
  if (sectionIndex < 0 || sectionIndex >= sections.length) {
    return content;
  }

  const section = sections[sectionIndex];
  return content.substring(0, section.startIndex) + newContent + content.substring(section.endIndex);
}

// Delete section
export function deleteSection(content: string, sectionIndex: number): string {
  const sections = parseDocumentSections(content);
  if (sectionIndex < 0 || sectionIndex >= sections.length) {
    return content;
  }

  const section = sections[sectionIndex];
  return content.substring(0, section.startIndex) + content.substring(section.endIndex);
}

// Move section
export function moveSection(
  content: string,
  fromIndex: number,
  toIndex: number
): string {
  const sections = parseDocumentSections(content);
  if (
    fromIndex < 0 ||
    fromIndex >= sections.length ||
    toIndex < 0 ||
    toIndex >= sections.length
  ) {
    return content;
  }

  const fromSection = sections[fromIndex];
  const sectionContent = content.substring(fromSection.startIndex, fromSection.endIndex);

  // Remove from original position
  let result =
    content.substring(0, fromSection.startIndex) +
    content.substring(fromSection.endIndex);

  // Find new position (need to recalculate indices after deletion)
  const newSections = parseDocumentSections(result);
  if (toIndex >= newSections.length) {
    // Append to end
    result += "\n" + sectionContent;
  } else {
    const toSection = newSections[toIndex];
    result =
      result.substring(0, toSection.startIndex) +
      sectionContent +
      "\n" +
      result.substring(toSection.startIndex);
  }

  return result;
}

// Apply tone adjustment
export function adjustTone(
  content: string,
  tone: "formal" | "casual" | "professional" | "creative"
): string {
  // This is a simple implementation; AI will provide better suggestions
  const tonePatterns: Record<string, { from: RegExp; to: string }[]> = {
    formal: [
      { from: /hey\s+/gi, to: "Hello, " },
      { from: /gonna\b/gi, to: "going to" },
      { from: /wanna\b/gi, to: "want to" },
      { from: /dunno\b/gi, to: "do not know" },
    ],
    casual: [
      { from: /Hello,\s+/gi, to: "Hey " },
      { from: /\bgoing to\b/gi, to: "gonna" },
      { from: /\bwant to\b/gi, to: "wanna" },
    ],
    professional: [
      { from: /I think/gi, to: "It is believed" },
      { from: /\bu\b/gi, to: "you" },
      { from: /\br\b/gi, to: "are" },
    ],
    creative: [
      { from: /\.(?!\s*$)/g, to: "! " },
    ],
  };

  let result = content;
  const patterns = tonePatterns[tone] || [];

  for (const pattern of patterns) {
    result = result.replace(pattern.from, pattern.to);
  }

  return result;
}

// Simple spell check (returns suggestions)
export function checkGrammar(content: string): string[] {
  const issues: string[] = [];

  // Check for common issues
  const doubleSpaces = /  +/g;
  if (doubleSpaces.test(content)) {
    issues.push("Double spaces found - consider removing excess whitespace");
  }

  const missingCapitals = /[.!?]\s+[a-z]/;
  if (missingCapitals.test(content)) {
    issues.push("Some sentences might not be properly capitalized");
  }

  return issues;
}

// Clone document data for undo/redo
export function cloneDocsData(data: DocsData): DocsData {
  return {
    ...data,
    sections: data.sections.map((s) => ({ ...s })),
    metadata: { ...data.metadata },
  };
}
