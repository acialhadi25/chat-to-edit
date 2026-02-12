import { PDFDocument, PDFPage, degrees, rgb } from "pdf-lib";

// Extract specific pages from a PDF
export async function extractPages(
  pdfFile: File,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  // Sort and deduplicate page numbers (1-indexed)
  const sorted = [...new Set(pageNumbers)]
    .sort((a, b) => a - b)
    .filter((p) => p > 0 && p <= pdfDoc.getPageCount());

  for (const pageNum of sorted) {
    const pages = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
    pages.forEach((page) => newPdf.addPage(page));
  }

  return await newPdf.save();
}

// Merge multiple PDFs
export async function mergePdfs(
  files: File[],
  pageRanges?: { file: number; pages: number[] }[]
): Promise<Uint8Array> {
  const newPdf = await PDFDocument.create();

  if (pageRanges && pageRanges.length > 0) {
    // Merge specific page ranges
    for (const range of pageRanges) {
      const file = files[range.file];
      if (!file) continue;

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const sorted = [...new Set(range.pages)]
        .sort((a, b) => a - b)
        .filter((p) => p > 0 && p <= pdfDoc.getPageCount());

      for (const pageNum of sorted) {
        const pages = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
        pages.forEach((page) => newPdf.addPage(page));
      }
    }
  } else {
    // Merge entire files
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
      const pages = await newPdf.copyPages(pdfDoc, pageIndices);
      pages.forEach((page) => newPdf.addPage(page));
    }
  }

  return await newPdf.save();
}

// Split PDF into individual pages
export async function splitPdf(pdfFile: File): Promise<Uint8Array[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();

  const results: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, [i]);
    pages.forEach((page) => newPdf.addPage(page));
    const bytes = await newPdf.save();
    results.push(bytes);
  }

  return results;
}

// Split PDF at specific page
export async function splitPdfAtPage(
  pdfFile: File,
  pageNumber: number
): Promise<[Uint8Array, Uint8Array]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  if (pageNumber < 1 || pageNumber > totalPages) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }

  // First part: pages 1 to pageNumber
  const pdf1 = await PDFDocument.create();
  const part1Pages = await pdf1.copyPages(pdfDoc, Array.from({ length: pageNumber - 1 }, (_, i) => i));
  part1Pages.forEach((page) => pdf1.addPage(page));

  // Second part: pages pageNumber+1 to end
  const pdf2 = await PDFDocument.create();
  const part2Pages = await pdf2.copyPages(
    pdfDoc,
    Array.from({ length: totalPages - pageNumber }, (_, i) => pageNumber + i)
  );
  part2Pages.forEach((page) => pdf2.addPage(page));

  return [await pdf1.save(), await pdf2.save()];
}

// Reorder pages
export async function reorderPages(
  pdfFile: File,
  newOrder: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Create new PDF with reordered pages
  const newPdf = await PDFDocument.create();

  for (const pageNum of newOrder) {
    if (pageNum > 0 && pageNum <= pdfDoc.getPageCount()) {
      const pages = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
      pages.forEach((page) => newPdf.addPage(page));
    }
  }

  return await newPdf.save();
}

// Delete specific pages
export async function deletePages(
  pdfFile: File,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => !pageNumbers.includes(p)
  );

  const newPdf = await PDFDocument.create();

  for (const pageNum of pagesToKeep) {
    const pages = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
    pages.forEach((page) => newPdf.addPage(page));
  }

  return await newPdf.save();
}

// Rotate pages
export async function rotatePages(
  pdfFile: File,
  pageNumbers: number[],
  rotation: 0 | 90 | 180 | 270
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const pageSet = new Set(pageNumbers);
  const allPages = pdfDoc.getPages();

  allPages.forEach((page, index) => {
    if (pageSet.has(index + 1)) {
      const currentRotation = page.getRotation().angle || 0;
      const newRotation = ((currentRotation + rotation) % 360) as 0 | 90 | 180 | 270;
      page.setRotation(degrees(newRotation));
    }
  });

  return await pdfDoc.save();
}

// Add watermark to pages
export async function addWatermark(
  pdfFile: File,
  text: string,
  pageNumbers?: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const allPages = pdfDoc.getPages();

  const pagesToMark = pageNumbers
    ? new Set(pageNumbers)
    : new Set(Array.from({ length: allPages.length }, (_, i) => i + 1));

  allPages.forEach((page, index) => {
    if (pagesToMark.has(index + 1)) {
      const { width, height } = page.getSize();

      // Add semi-transparent diagonal watermark
      page.drawText(text, {
        x: width / 2 - 100,
        y: height / 2,
        size: 48,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: degrees(-45),
      });
    }
  });

  return await pdfDoc.save();
}

// Extract text from PDF pages using pdfjs-dist
export async function extractTextFromPdf(
  pdfFile: File,
  pageNumbers?: number[]
): Promise<{ page: number; text: string }[]> {
  try {
    // Import pdfjs worker
    const pdfjsLib = await import("pdfjs-dist");

    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const results: { page: number; text: string }[] = [];

    // Determine which pages to extract
    const pagesToExtract = pageNumbers
      ? pageNumbers.filter((p) => p > 0 && p <= pdf.numPages)
      : Array.from({ length: pdf.numPages }, (_, i) => i + 1);

    // Extract text from each page
    for (const pageNum of pagesToExtract) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items into a string
        const text = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        results.push({
          page: pageNum,
          text: text || `[Page ${pageNum} - No readable text]`,
        });
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        results.push({
          page: pageNum,
          text: `[Page ${pageNum} - Text extraction failed]`,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return [
      {
        page: 1,
        text: "Failed to extract text from PDF. The file may be encrypted or in an unsupported format.",
      },
    ];
  }
}

// Get PDF information
export async function getPdfInfo(pdfFile: File) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  return {
    pages: pdfDoc.getPageCount(),
    fileSize: pdfFile.size,
    fileName: pdfFile.name,
    title: pdfDoc.getTitle() || undefined,
    author: pdfDoc.getAuthor() || undefined,
  };
}

// Compress PDF (basic - removes unused objects)
export async function compressPdf(pdfFile: File): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // pdf-lib doesn't have built-in compression
  // Return the PDF as-is (compression would require specialized libraries)
  return await pdfDoc.save();
}

// Convert PDF pages to images (PNG/JPG format)
export async function convertPdfPageToImage(
  pdfFile: File,
  pageNumber: number,
  scale: number = 2,
  format: "png" | "jpg" = "png",
  quality: number = 0.95
): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to image data URL
    const imageUrl = canvas.toDataURL(
      `image/${format}`,
      format === "jpg" ? quality : undefined
    );

    // Clean up
    canvas.remove();
    return imageUrl;
  } catch (error) {
    console.error("PDF to image conversion error:", error);
    throw new Error(
      `Failed to convert page ${pageNumber} to image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Convert all PDF pages to images
export async function convertPdfToImages(
  pdfFile: File,
  format: "png" | "jpg" = "png",
  scale: number = 2,
  quality: number = 0.95
): Promise<Array<{ page: number; url: string }>> {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const results: Array<{ page: number; url: string }> = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const url = await convertPdfPageToImage(
          pdfFile,
          pageNum,
          scale,
          format,
          quality
        );
        results.push({ page: pageNum, url });
      } catch (pageError) {
        console.warn(`Failed to convert page ${pageNum} to image:`, pageError);
        results.push({
          page: pageNum,
          url: "", // Placeholder for failed conversion
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Batch PDF to images conversion error:", error);
    throw new Error(
      `Failed to convert PDF to images: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
