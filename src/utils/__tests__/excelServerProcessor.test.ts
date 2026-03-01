// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseExcelOnServer,
  getPaginatedExcelData,
  loadExcelWithProgress,
  shouldUseServerProcessing,
  type ExcelMetadata,
  type PaginatedExcelData,
} from '../excelServerProcessor';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('excelServerProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseExcelOnServer', () => {
    it('should parse Excel file and return metadata', async () => {
      const mockMetadata: ExcelMetadata = {
        headers: ['Name', 'Age', 'City'],
        totalRows: 1000,
        totalSheets: 1,
        sheetNames: ['Sheet1'],
        fileName: 'test.xlsx',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockMetadata,
        error: null,
      });

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseExcelOnServer(file);

      expect(result).toEqual(mockMetadata);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'process-excel',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when parsing fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Parse failed'),
      });

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await expect(parseExcelOnServer(file)).rejects.toThrow('Failed to parse Excel file');
    });
  });

  describe('getPaginatedExcelData', () => {
    it('should get paginated data with default parameters', async () => {
      const mockData: PaginatedExcelData = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['John', 30, 'NYC'],
          ['Jane', 25, 'LA'],
        ],
        totalRows: 1000,
        totalSheets: 1,
        sheetNames: ['Sheet1'],
        fileName: 'test.xlsx',
        page: 1,
        pageSize: 1000,
        hasMore: false,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await getPaginatedExcelData(file);

      expect(result).toEqual(mockData);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('action=paginate'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include sheet name in request when provided', async () => {
      const mockData: PaginatedExcelData = {
        headers: ['Name'],
        rows: [['John']],
        totalRows: 1,
        totalSheets: 2,
        sheetNames: ['Sheet1', 'Sheet2'],
        fileName: 'test.xlsx',
        page: 1,
        pageSize: 1000,
        hasMore: false,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await getPaginatedExcelData(file, 1, 1000, 'Sheet2');

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('sheet=Sheet2'),
        expect.any(Object)
      );
    });
  });

  describe('loadExcelWithProgress', () => {
    it('should load all data with progress tracking', async () => {
      const mockMetadata: ExcelMetadata = {
        headers: ['Name', 'Age'],
        totalRows: 2500,
        totalSheets: 1,
        sheetNames: ['Sheet1'],
        fileName: 'test.xlsx',
      };

      const mockPage1: PaginatedExcelData = {
        ...mockMetadata,
        rows: Array(1000).fill(['John', 30]),
        page: 1,
        pageSize: 1000,
        hasMore: true,
      };

      const mockPage2: PaginatedExcelData = {
        ...mockMetadata,
        rows: Array(1000).fill(['Jane', 25]),
        page: 2,
        pageSize: 1000,
        hasMore: true,
      };

      const mockPage3: PaginatedExcelData = {
        ...mockMetadata,
        rows: Array(500).fill(['Bob', 35]),
        page: 3,
        pageSize: 1000,
        hasMore: false,
      };

      vi.mocked(supabase.functions.invoke)
        .mockResolvedValueOnce({ data: mockMetadata, error: null })
        .mockResolvedValueOnce({ data: mockPage1, error: null })
        .mockResolvedValueOnce({ data: mockPage2, error: null })
        .mockResolvedValueOnce({ data: mockPage3, error: null });

      const progressCallback = vi.fn();
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await loadExcelWithProgress(file, progressCallback);

      expect(result.headers).toEqual(['Name', 'Age']);
      expect(result.rows).toHaveLength(2500);
      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenLastCalledWith({
        loaded: 2500,
        total: 2500,
        percentage: 100,
      });
    });

    it('should work without progress callback', async () => {
      const mockMetadata: ExcelMetadata = {
        headers: ['Name'],
        totalRows: 100,
        totalSheets: 1,
        sheetNames: ['Sheet1'],
        fileName: 'test.xlsx',
      };

      const mockPage: PaginatedExcelData = {
        ...mockMetadata,
        rows: Array(100).fill(['John']),
        page: 1,
        pageSize: 1000,
        hasMore: false,
      };

      vi.mocked(supabase.functions.invoke)
        .mockResolvedValueOnce({ data: mockMetadata, error: null })
        .mockResolvedValueOnce({ data: mockPage, error: null });

      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await loadExcelWithProgress(file);

      expect(result.rows).toHaveLength(100);
    });
  });

  describe('shouldUseServerProcessing', () => {
    it('should return true for files larger than 100MB', () => {
      // Create a mock file with size property
      const largeFile = new File(['test'], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      // Override size property for testing
      Object.defineProperty(largeFile, 'size', { value: 101 * 1024 * 1024 });

      expect(shouldUseServerProcessing(largeFile)).toBe(true);
    });

    it('should return false for files smaller than 100MB', () => {
      const smallFile = new File(['test'], 'small.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      Object.defineProperty(smallFile, 'size', { value: 50 * 1024 * 1024 });

      expect(shouldUseServerProcessing(smallFile)).toBe(false);
    });

    it('should return false for files exactly 100MB', () => {
      const exactFile = new File(['test'], 'exact.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      Object.defineProperty(exactFile, 'size', { value: 100 * 1024 * 1024 });

      expect(shouldUseServerProcessing(exactFile)).toBe(false);
    });
  });
});
