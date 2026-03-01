// @ts-nocheck
import { ExcelData, SheetData } from "@/types/excel";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import React, { ReactElement } from "react";

/**
 * Create mock Excel data for testing
 * @param options - Partial ExcelData to override defaults
 * @returns Complete ExcelData object with defaults
 */
export function createMockExcelData(
  options?: Partial<ExcelData>
): ExcelData {
  // Auto-generate headers based on the number of columns in the first row
  const firstRow = options?.rows?.[0] || [1, 2, 3];
  const numColumns = firstRow.length;
  const defaultHeaders = Array.from({ length: numColumns }, (_, i) => 
    String.fromCharCode(65 + i) // A, B, C, D, E, ...
  );

  return {
    fileName: options?.fileName || "test.xlsx",
    sheets: options?.sheets || ["Sheet1"],
    currentSheet: options?.currentSheet || "Sheet1",
    headers: options?.headers || defaultHeaders,
    rows: options?.rows || [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
    formulas: options?.formulas || {},
    selectedCells: options?.selectedCells || [],
    pendingChanges: options?.pendingChanges || [],
    cellStyles: options?.cellStyles || {},
    allSheets: options?.allSheets,
    ...options,
  };
}

/**
 * Create mock sheet data for multi-sheet testing
 */
export function createMockSheetData(
  options?: Partial<SheetData>
): SheetData {
  return {
    headers: options?.headers || ["A", "B", "C"],
    rows: options?.rows || [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ...options,
  };
}

/**
 * Create mock Excel data with multiple sheets
 */
export function createMockMultiSheetData(
  sheets: Record<string, Partial<SheetData>>
): ExcelData {
  const allSheets: Record<string, SheetData> = {};
  
  for (const [name, data] of Object.entries(sheets)) {
    allSheets[name] = createMockSheetData(data);
  }
  
  const firstSheetName = Object.keys(allSheets)[0];
  const firstSheet = Object.values(allSheets)[0];
  
  return createMockExcelData({
    fileName: "test-multi.xlsx",
    sheets: Object.keys(allSheets),
    currentSheet: firstSheetName,
    headers: firstSheet.headers,
    rows: firstSheet.rows,
    allSheets,
  });
}

/**
 * Render component with all necessary providers
 * @param ui - React element to render
 * @param options - Render options
 * @returns Render result with user event utilities
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create mock file for upload testing
 */
export function createMockFile(
  name: string = "test.xlsx",
  type: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  content: string = "test content"
): File {
  return new File([content], name, { type });
}

/**
 * Generate random Excel data for property-based testing
 */
export function generateRandomExcelData(
  rowCount: number = 10,
  colCount: number = 5
): ExcelData {
  const headers = Array.from({ length: colCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );
  
  const rows = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => {
      const rand = Math.random();
      if (rand < 0.3) return null;
      if (rand < 0.6) return Math.floor(Math.random() * 1000);
      return `text${Math.floor(Math.random() * 100)}`;
    })
  );
  
  return createMockExcelData({ headers, rows });
}

/**
 * Assert that two Excel data objects are equal
 */
export function assertExcelDataEqual(
  actual: ExcelData,
  expected: ExcelData,
  message?: string
) {
  expect(actual.headers, message).toEqual(expected.headers);
  expect(actual.rows, message).toEqual(expected.rows);
  expect(actual.formulas, message).toEqual(expected.formulas);
}

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  from: (_table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      then: (fn: any) => fn({ data: [], error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signOut: () => Promise.resolve({ error: null }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
};
