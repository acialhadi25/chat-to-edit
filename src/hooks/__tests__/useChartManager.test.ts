/**
 * Tests for useChartManager Hook
 * 
 * Tests chart management hook functionality
 * Requirements: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartManager } from '../useChartManager';
import { ChartService, ChartType, type ChartOptions, type ChartTheme } from '../../services/chartService';

describe('useChartManager', () => {
  let mockChartService: ChartService;

  beforeEach(() => {
    mockChartService = {
      createChart: vi.fn().mockResolvedValue(true),
      createLineChart: vi.fn().mockResolvedValue(true),
      createColumnChart: vi.fn().mockResolvedValue(true),
      createBarChart: vi.fn().mockResolvedValue(true),
      createPieChart: vi.fn().mockResolvedValue(true),
      updateChart: vi.fn().mockResolvedValue(true),
      removeChart: vi.fn().mockResolvedValue(true),
      removeAllCharts: vi.fn().mockResolvedValue(true),
      getCharts: vi.fn(() => [
        {
          id: 'chart-1',
          type: ChartType.COLUMN,
          title: 'Test Chart',
          dataRange: 'A1:B10',
          position: { x: 100, y: 100 },
          size: { width: 600, height: 400 },
        },
      ]),
      registerChartTheme: vi.fn().mockReturnValue(true),
      updateAPI: vi.fn(),
    } as any;
  });

  describe('Initialization', () => {
    it('should initialize with empty charts when no service', () => {
      const { result } = renderHook(() => useChartManager({ chartService: null }));

      expect(result.current.charts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load charts on mount with autoRefresh', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: true })
      );

      await waitFor(() => {
        expect(result.current.charts).toHaveLength(1);
      });

      expect(mockChartService.getCharts).toHaveBeenCalled();
    });

    it('should not load charts on mount without autoRefresh', () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: false })
      );

      expect(result.current.charts).toEqual([]);
      expect(mockChartService.getCharts).not.toHaveBeenCalled();
    });
  });

  describe('Chart Creation', () => {
    it('should create a chart successfully', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        title: 'Sales Data',
        dataRange: 'A1:B10',
      };

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createChart(options);
      });

      expect(success).toBe(true);
      expect(mockChartService.createChart).toHaveBeenCalledWith(options);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should create a line chart', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createLineChart('A1:B13', 'Trend Analysis');
      });

      expect(success).toBe(true);
      expect(mockChartService.createLineChart).toHaveBeenCalledWith(
        'A1:B13',
        'Trend Analysis',
        undefined
      );
    });

    it('should create a column chart', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createColumnChart('A1:B10', 'Sales');
      });

      expect(success).toBe(true);
      expect(mockChartService.createColumnChart).toHaveBeenCalled();
    });

    it('should create a bar chart', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createBarChart('A1:B8', 'Performance');
      });

      expect(success).toBe(true);
      expect(mockChartService.createBarChart).toHaveBeenCalled();
    });

    it('should create a pie chart', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createPieChart('A1:B6', 'Market Share');
      });

      expect(success).toBe(true);
      expect(mockChartService.createPieChart).toHaveBeenCalled();
    });

    it('should handle chart creation failure', async () => {
      mockChartService.createChart = vi.fn().mockResolvedValue(false);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      let success: boolean = true;
      await act(async () => {
        success = await result.current.createChart(options);
      });

      expect(success).toBe(false);
    });

    it('should handle chart creation error', async () => {
      mockChartService.createChart = vi.fn().mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      let success: boolean = true;
      await act(async () => {
        success = await result.current.createChart(options);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Creation failed');
    });

    it('should fail when chart service is not available', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: null })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      let success: boolean = true;
      await act(async () => {
        success = await result.current.createChart(options);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Chart service not available');
    });
  });

  describe('Chart Update', () => {
    it('should update a chart successfully', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.LINE,
        title: 'Updated Title',
        dataRange: 'A1:B20',
      };

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updateChart('chart-1', options);
      });

      expect(success).toBe(true);
      expect(mockChartService.updateChart).toHaveBeenCalledWith('chart-1', options);
    });

    it('should handle update failure', async () => {
      mockChartService.updateChart = vi.fn().mockResolvedValue(false);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
      };

      let success: boolean = true;
      await act(async () => {
        success = await result.current.updateChart('chart-1', options);
      });

      expect(success).toBe(false);
    });
  });

  describe('Chart Removal', () => {
    it('should remove a chart successfully', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.removeChart('chart-1');
      });

      expect(success).toBe(true);
      expect(mockChartService.removeChart).toHaveBeenCalledWith('chart-1');
    });

    it('should remove all charts successfully', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.removeAllCharts();
      });

      expect(success).toBe(true);
      expect(mockChartService.removeAllCharts).toHaveBeenCalled();
    });

    it('should handle removal failure', async () => {
      mockChartService.removeChart = vi.fn().mockResolvedValue(false);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      let success: boolean = true;
      await act(async () => {
        success = await result.current.removeChart('chart-1');
      });

      expect(success).toBe(false);
    });
  });

  describe('Chart Theme', () => {
    it('should register a custom theme successfully', () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const theme: ChartTheme = {
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        backgroundColor: '#ffffff',
        textColor: '#000000',
      };

      let success: boolean = false;
      act(() => {
        success = result.current.registerTheme('custom', theme);
      });

      expect(success).toBe(true);
      expect(mockChartService.registerChartTheme).toHaveBeenCalledWith('custom', theme);
    });

    it('should handle theme registration failure', () => {
      mockChartService.registerChartTheme = vi.fn().mockReturnValue(false);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const theme: ChartTheme = {
        colors: ['#ff0000'],
      };

      let success: boolean = true;
      act(() => {
        success = result.current.registerTheme('custom', theme);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to register chart theme');
    });
  });

  describe('Chart Refresh', () => {
    it('should refresh charts manually', () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: false })
      );

      act(() => {
        result.current.refreshCharts();
      });

      expect(mockChartService.getCharts).toHaveBeenCalled();
      expect(result.current.charts).toHaveLength(1);
    });

    it('should handle refresh errors', () => {
      mockChartService.getCharts = vi.fn(() => {
        throw new Error('Refresh failed');
      });

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: false })
      );

      act(() => {
        result.current.refreshCharts();
      });

      expect(result.current.error).toBe('Refresh failed');
    });

    it('should auto-refresh after chart creation', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: true })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const initialCallCount = (mockChartService.getCharts as any).mock.calls.length;

      await act(async () => {
        await result.current.createChart(options);
      });

      expect((mockChartService.getCharts as any).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should not auto-refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService, autoRefresh: false })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      await act(async () => {
        await result.current.createChart(options);
      });

      expect(mockChartService.getCharts).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should set loading state during chart creation', async () => {
      let resolveCreate: (value: boolean) => void;
      const createPromise = new Promise<boolean>((resolve) => {
        resolveCreate = resolve;
      });
      mockChartService.createChart = vi.fn(() => createPromise);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      act(() => {
        result.current.createChart(options);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        resolveCreate!(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error on successful operation', async () => {
      mockChartService.createChart = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(true);

      const { result } = renderHook(() => 
        useChartManager({ chartService: mockChartService })
      );

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      // First call - should fail
      await act(async () => {
        await result.current.createChart(options);
      });

      expect(result.current.error).toBe('First error');

      // Second call - should succeed and clear error
      await act(async () => {
        await result.current.createChart(options);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
