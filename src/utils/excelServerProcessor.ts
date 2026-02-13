import { supabase } from '@/integrations/supabase/client';

export interface ExcelMetadata {
  headers: string[];
  totalRows: number;
  totalSheets: number;
  sheetNames: string[];
  fileName: string;
}

export interface PaginatedExcelData extends ExcelMetadata {
  rows: (string | number | null)[][];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ProcessingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Parse Excel file on server and get metadata
 */
export async function parseExcelOnServer(file: File): Promise<ExcelMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke('process-excel', {
    body: formData,
    method: 'POST',
  });

  if (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }

  return data as ExcelMetadata;
}

/**
 * Get paginated data from Excel file
 */
export async function getPaginatedExcelData(
  file: File,
  page: number = 1,
  pageSize: number = 1000,
  sheetName?: string
): Promise<PaginatedExcelData> {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams({
    action: 'paginate',
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (sheetName) {
    params.append('sheet', sheetName);
  }

  const { data, error } = await supabase.functions.invoke(
    `process-excel?${params.toString()}`,
    {
      body: formData,
      method: 'POST',
    }
  );

  if (error) {
    throw new Error(`Failed to get paginated data: ${error.message}`);
  }

  return data as PaginatedExcelData;
}

/**
 * Load all Excel data with progress tracking
 */
export async function loadExcelWithProgress(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void,
  pageSize: number = 1000
): Promise<{ headers: string[]; rows: (string | number | null)[][] }> {
  // First, get metadata
  const metadata = await parseExcelOnServer(file);
  const totalPages = Math.ceil(metadata.totalRows / pageSize);

  const allRows: (string | number | null)[][] = [];
  let loadedRows = 0;

  // Load data page by page
  for (let page = 1; page <= totalPages; page++) {
    const result = await getPaginatedExcelData(file, page, pageSize);
    allRows.push(...result.rows);
    loadedRows += result.rows.length;

    if (onProgress) {
      onProgress({
        loaded: loadedRows,
        total: metadata.totalRows,
        percentage: (loadedRows / metadata.totalRows) * 100,
      });
    }
  }

  return {
    headers: metadata.headers,
    rows: allRows,
  };
}

/**
 * Check if file should be processed on server
 * Files larger than 100MB should use server-side processing
 */
export function shouldUseServerProcessing(file: File): boolean {
  const MAX_CLIENT_SIZE = 100 * 1024 * 1024; // 100MB
  return file.size > MAX_CLIENT_SIZE;
}

/**
 * Process Excel file with automatic client/server selection
 */
export async function processExcelFile(
  file: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ headers: string[]; rows: (string | number | null)[][] }> {
  if (shouldUseServerProcessing(file)) {
    console.log('Using server-side processing for large file');
    return loadExcelWithProgress(file, onProgress);
  } else {
    console.log('Using client-side processing for small file');
    // Fall back to client-side processing
    // This would use the existing client-side Excel parsing logic
    throw new Error('Client-side processing not implemented in this utility');
  }
}
