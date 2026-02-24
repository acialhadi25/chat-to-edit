/**
 * useChartManager Hook
 * 
 * React hook for managing charts in Univer Sheet.
 * Provides methods to create, update, remove, and list charts.
 * 
 * Requirements: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5
 * @see https://docs.univer.ai/guides/sheets/features/charts
 */

import { useState, useCallback, useEffect } from 'react';
import { ChartService, ChartType, type ChartOptions, type ChartInfo, type ChartTheme } from '../services/chartService';

export interface UseChartManagerOptions {
  chartService: ChartService | null;
  autoRefresh?: boolean;
}

export interface UseChartManagerReturn {
  charts: ChartInfo[];
  createChart: (options: ChartOptions) => Promise<boolean>;
  createLineChart: (dataRange: string, title?: string, options?: Partial<ChartOptions>) => Promise<boolean>;
  createColumnChart: (dataRange: string, title?: string, options?: Partial<ChartOptions>) => Promise<boolean>;
  createBarChart: (dataRange: string, title?: string, options?: Partial<ChartOptions>) => Promise<boolean>;
  createPieChart: (dataRange: string, title?: string, options?: Partial<ChartOptions>) => Promise<boolean>;
  updateChart: (chartId: string, options: ChartOptions) => Promise<boolean>;
  removeChart: (chartId: string) => Promise<boolean>;
  removeAllCharts: () => Promise<boolean>;
  registerTheme: (name: string, theme: ChartTheme) => boolean;
  refreshCharts: () => void;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing charts in Univer Sheet
 * 
 * @param options - Hook configuration options
 * @returns Chart management methods and state
 * 
 * @example
 * ```typescript
 * const { charts, createChart, removeChart, loading, error } = useChartManager({
 *   chartService: myChartService,
 *   autoRefresh: true
 * });
 * 
 * // Create a column chart
 * await createChart({
 *   type: ChartType.COLUMN,
 *   title: 'Sales Data',
 *   dataRange: 'A1:B10',
 *   position: { x: 100, y: 100 },
 *   size: { width: 600, height: 400 }
 * });
 * ```
 */
export function useChartManager(options: UseChartManagerOptions): UseChartManagerReturn {
  const { chartService, autoRefresh = true } = options;
  
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh the list of charts
   */
  const refreshCharts = useCallback(() => {
    if (!chartService) {
      setCharts([]);
      return;
    }

    try {
      const allCharts = chartService.getCharts();
      setCharts(allCharts);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh charts';
      setError(message);
      console.error('Failed to refresh charts:', err);
    }
  }, [chartService]);

  /**
   * Create a chart with the given options
   */
  const createChart = useCallback(async (chartOptions: ChartOptions): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.createChart(chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create chart';
      setError(message);
      console.error('Failed to create chart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Create a line chart
   */
  const createLineChart = useCallback(async (
    dataRange: string,
    title?: string,
    chartOptions?: Partial<ChartOptions>
  ): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.createLineChart(dataRange, title, chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create line chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Create a column chart
   */
  const createColumnChart = useCallback(async (
    dataRange: string,
    title?: string,
    chartOptions?: Partial<ChartOptions>
  ): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.createColumnChart(dataRange, title, chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create column chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Create a bar chart
   */
  const createBarChart = useCallback(async (
    dataRange: string,
    title?: string,
    chartOptions?: Partial<ChartOptions>
  ): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.createBarChart(dataRange, title, chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bar chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Create a pie chart
   */
  const createPieChart = useCallback(async (
    dataRange: string,
    title?: string,
    chartOptions?: Partial<ChartOptions>
  ): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.createPieChart(dataRange, title, chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pie chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Update an existing chart
   */
  const updateChart = useCallback(async (
    chartId: string,
    chartOptions: ChartOptions
  ): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.updateChart(chartId, chartOptions);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Remove a chart by ID
   */
  const removeChart = useCallback(async (chartId: string): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.removeChart(chartId);
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove chart';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Remove all charts
   */
  const removeAllCharts = useCallback(async (): Promise<boolean> => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await chartService.removeAllCharts();
      
      if (success && autoRefresh) {
        refreshCharts();
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove all charts';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [chartService, autoRefresh, refreshCharts]);

  /**
   * Register a custom chart theme
   */
  const registerTheme = useCallback((name: string, theme: ChartTheme): boolean => {
    if (!chartService) {
      setError('Chart service not available');
      return false;
    }

    try {
      const success = chartService.registerChartTheme(name, theme);
      if (!success) {
        setError('Failed to register chart theme');
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register theme';
      setError(message);
      return false;
    }
  }, [chartService]);

  // Auto-refresh charts on mount and when chartService changes
  useEffect(() => {
    if (autoRefresh) {
      refreshCharts();
    }
  }, [autoRefresh, refreshCharts]);

  return {
    charts,
    createChart,
    createLineChart,
    createColumnChart,
    createBarChart,
    createPieChart,
    updateChart,
    removeChart,
    removeAllCharts,
    registerTheme,
    refreshCharts,
    loading,
    error,
  };
}
