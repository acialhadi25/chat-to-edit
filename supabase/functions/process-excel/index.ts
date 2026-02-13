import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedExcelData {
  headers: string[];
  totalRows: number;
  totalSheets: number;
  sheetNames: string[];
  fileName: string;
}

interface PaginatedData extends ParsedExcelData {
  rows: (string | number | null)[][];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "parse";

    // Handle different actions
    switch (action) {
      case "parse":
        return await handleParse(req);
      case "paginate":
        return await handlePaginate(req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Process Excel error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process Excel file",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Handle initial Excel file parsing
 * Supports chunked upload via multipart form data
 */
async function handleParse(req: Request): Promise<Response> {
  const contentType = req.headers.get("content-type") || "";
  
  let fileData: Uint8Array;
  let fileName = "uploaded.xlsx";

  // Handle chunked upload (multipart/form-data)
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    fileName = file.name;
    fileData = new Uint8Array(await file.arrayBuffer());
  } 
  // Handle direct binary upload
  else if (contentType.includes("application/octet-stream") || 
           contentType.includes("application/vnd.openxmlformats")) {
    fileData = new Uint8Array(await req.arrayBuffer());
    const urlFileName = new URL(req.url).searchParams.get("fileName");
    if (urlFileName) {
      fileName = urlFileName;
    }
  } 
  else {
    return new Response(
      JSON.stringify({ error: "Invalid content type. Use multipart/form-data or application/octet-stream" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse Excel file
  const workbook = XLSX.read(fileData, { type: "array" });
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });
  
  if (jsonData.length === 0) {
    return new Response(
      JSON.stringify({ error: "Excel file is empty" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract headers and data
  const headers = (jsonData[0] as (string | number)[]).map(h => String(h || ""));
  const totalRows = jsonData.length - 1; // Exclude header row

  const response: ParsedExcelData = {
    headers,
    totalRows,
    totalSheets: sheetNames.length,
    sheetNames,
    fileName,
  };

  return new Response(
    JSON.stringify(response),
    { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Handle paginated data retrieval
 * Returns a specific page of rows from the Excel file
 */
async function handlePaginate(req: Request): Promise<Response> {
  const contentType = req.headers.get("content-type") || "";
  const url = new URL(req.url);
  
  // Get pagination parameters
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "1000");
  const sheetName = url.searchParams.get("sheet");

  if (page < 1 || pageSize < 1 || pageSize > 10000) {
    return new Response(
      JSON.stringify({ error: "Invalid pagination parameters. Page must be >= 1, pageSize between 1-10000" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let fileData: Uint8Array;
  let fileName = "uploaded.xlsx";

  // Handle file upload (same as parse)
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    fileName = file.name;
    fileData = new Uint8Array(await file.arrayBuffer());
  } else if (contentType.includes("application/octet-stream") || 
             contentType.includes("application/vnd.openxmlformats")) {
    fileData = new Uint8Array(await req.arrayBuffer());
    const urlFileName = url.searchParams.get("fileName");
    if (urlFileName) {
      fileName = urlFileName;
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid content type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse Excel file
  const workbook = XLSX.read(fileData, { type: "array" });
  const sheetNames = workbook.SheetNames;
  const targetSheet = sheetName && sheetNames.includes(sheetName) 
    ? workbook.Sheets[sheetName]
    : workbook.Sheets[sheetNames[0]];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: null });
  
  if (jsonData.length === 0) {
    return new Response(
      JSON.stringify({ error: "Excel sheet is empty" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Extract headers and calculate pagination
  const headers = (jsonData[0] as (string | number)[]).map(h => String(h || ""));
  const dataRows = jsonData.slice(1) as (string | number | null)[][];
  const totalRows = dataRows.length;
  
  // Calculate page boundaries
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedRows = dataRows.slice(startIndex, endIndex);
  const hasMore = endIndex < totalRows;

  const response: PaginatedData = {
    headers,
    rows: paginatedRows,
    totalRows,
    totalSheets: sheetNames.length,
    sheetNames,
    fileName,
    page,
    pageSize,
    hasMore,
  };

  return new Response(
    JSON.stringify(response),
    { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
