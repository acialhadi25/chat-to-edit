/**
 * Chart Service for Univer Sheet Integration
 * 
 * Provides comprehensive chart capabilities including:
 * - Line charts for trend visualization
 * - Column/Bar charts for comparisons
 * - Pie charts for proportions
 * - Chart customization (colors, styles, legend)
 * - Dynamic chart updates
 * 
 * Requirements: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5
 * @see https://docs.univer.ai/guides/sheets/features/charts
 */

import type { FUniver, FWorksheet } from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export enum ChartType {
  LINE = 'line',
  COLUMN = 'column',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  SCATTER = 'scatter',
}

export interface ChartOptions {
  type: ChartType;
  title?: string;
  dataRange: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  theme?: string;
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  axis?: {
    x?: { title?: string; min?: number; max?: number };
    y?: { title?: string; min?: number; max?: number };
  };
  colors?: string[];
}

export interface ChartTheme {
  colors: string[];
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  font?: {
    family: string;
    size: number;
  };
}

export interface ChartInfo {
  id: string;
  type: ChartType;
  title: string;
  dataRange: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// ============================================================================
// Chart Service Class
// ============================================================================

export class ChartService {
  private univerAPI: FUniver | null;
  private isReady: boolean;

  constructor(univerAPI: FUniver | null, isReady: boolean) {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
  }

  /**
   * Update the univerAPI instance
   */
  updateAPI(univerAPI: FUniver | null, isReady: boolean): void {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get the active worksheet with validation
   */
  private getActiveWorksheet(): FWorksheet | null {
    if (!this.univerAPI || !this.isReady) {
      console.warn('Univer is not ready');
      return null;
    }

    const workbook = this.univerAPI.getActiveWorkbook();
    if (!workbook) {
      console.warn('No active workbook');
      return null;
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      console.warn('No active worksheet');
      return null;
    }

    return worksheet;
  }

  /**
   * Validate data range format
   */
  private isValidRange(range: string): boolean {
    const rangePattern = /^[A-Z]+\d+:[A-Z]+\d+$/;
    return rangePattern.test(range);
  }

  /**
   * Validate chart options
   */
  private validateChartOptions(options: ChartOptions): { valid: boolean; error?: string } {
    if (!options.dataRange) {
      return { valid: false, error: 'Data range is required' };
    }

    if (!this.isValidRange(options.dataRange)) {
      return { valid: false, error: 'Invalid data range format. Expected format: A1:B10' };
    }

    if (!Object.values(ChartType).includes(options.type)) {
      return { valid: false, error: 'Invalid chart type' };
    }

    return { valid: true };
  }

  /**
   * Get default position for new chart
   */
  private getDefaultPosition(worksheet: FWorksheet): { x: number; y: number } {
    try {
      // Try to get last row to position chart below data
      const lastRow = worksheet.getLastRow?.() || 0;
      const yPosition = (lastRow + 2) * 20;
      return { x: 50, y: Math.max(yPosition, 100) };
    } catch {
      return { x: 50, y: 100 };
    }
  }

  // ==========================================================================
  // Public Chart Methods
  // ==========================================================================

  /**
   * Create a new chart
   * 
   * @param options - Chart configuration options
   * @returns Promise<boolean> - True if chart was created successfully
   * 
   * @example
   * ```typescript
   * const success = await chartService.createChart({
   *   type: ChartType.COLUMN,
   *   title: 'Monthly Sales',
   *   dataRange: 'A1:B13',
   *   position: { x: 100, y: 100 },
   *   size: { width: 600, height: 400 }
   * });
   * ```
   */
  async createChart(options: ChartOptions): Promise<boolean> {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return false;

    // Validate options
    const validation = this.validateChartOptions(options);
    if (!validation.valid) {
      console.error('Chart validation failed:', validation.error);
      return false;
    }

    try {
      // Check if worksheet has newChart method
      if (typeof worksheet.newChart !== 'function') {
        console.warn('Chart functionality not available - using insertChart fallback');
        return await this.createChartFallback(worksheet, options);
      }

      // Use builder pattern
      const builder = worksheet.newChart();
      
      builder.setChartType(options.type);
      
      if (options.title) {
        builder.setTitle(options.title);
      }
      
      builder.setDataRange(options.dataRange);
      
      const position = options.position || this.getDefaultPosition(worksheet);
      builder.setPosition(position.x, position.y);
      
      if (options.size) {
        builder.setSize(options.size.width, options.size.height);
      } else {
        builder.setSize(600, 400); // Default size
      }
      
      if (options.theme) {
        builder.setTheme(options.theme);
      }

      await builder.build();
      return true;
    } catch (error) {
      console.error('Failed to create chart:', error);
      return false;
    }
  }

  /**
   * Fallback method using insertChart
   */
  private async createChartFallback(worksheet: FWorksheet, options: ChartOptions): Promise<boolean> {
    try {
      if (typeof worksheet.insertChart !== 'function') {
        console.error('Neither newChart nor insertChart methods are available');
        return false;
      }

      const chartInfo: any = {
        type: options.type,
        title: options.title,
        dataRange: options.dataRange,
        position: options.position || this.getDefaultPosition(worksheet),
        size: options.size || { width: 600, height: 400 },
      };

      if (options.legend) {
        chartInfo.legend = options.legend;
      }

      if (options.axis) {
        chartInfo.axis = options.axis;
      }

      if (options.theme) {
        chartInfo.theme = options.theme;
      }

      const success = await worksheet.insertChart(chartInfo);
      return success;
    } catch (error) {
      console.error('Fallback chart creation failed:', error);
      return false;
    }
  }

  /**
   * Create a line chart
   * 
   * @param dataRange - Data range (e.g., 'A1:B13')
   * @param title - Chart title
   * @param options - Additional options
   * @returns Promise<boolean>
   */
  async createLineChart(
    dataRange: string,
    title?: string,
    options?: Partial<ChartOptions>
  ): Promise<boolean> {
    return this.createChart({
      type: ChartType.LINE,
      dataRange,
      title,
      ...options,
    });
  }

  /**
   * Create a column chart
   * 
   * @param dataRange - Data range (e.g., 'A1:B13')
   * @param title - Chart title
   * @param options - Additional options
   * @returns Promise<boolean>
   */
  async createColumnChart(
    dataRange: string,
    title?: string,
    options?: Partial<ChartOptions>
  ): Promise<boolean> {
    return this.createChart({
      type: ChartType.COLUMN,
      dataRange,
      title,
      ...options,
    });
  }

  /**
   * Create a bar chart
   * 
   * @param dataRange - Data range (e.g., 'A1:B13')
   * @param title - Chart title
   * @param options - Additional options
   * @returns Promise<boolean>
   */
  async createBarChart(
    dataRange: string,
    title?: string,
    options?: Partial<ChartOptions>
  ): Promise<boolean> {
    return this.createChart({
      type: ChartType.BAR,
      dataRange,
      title,
      ...options,
    });
  }

  /**
   * Create a pie chart
   * 
   * @param dataRange - Data range (e.g., 'A1:B6')
   * @param title - Chart title
   * @param options - Additional options
   * @returns Promise<boolean>
   */
  async createPieChart(
    dataRange: string,
    title?: string,
    options?: Partial<ChartOptions>
  ): Promise<boolean> {
    return this.createChart({
      type: ChartType.PIE,
      dataRange,
      title,
      ...options,
    });
  }

  /**
   * Update an existing chart
   * 
   * @param chartId - Chart ID to update
   * @param options - New chart options
   * @returns Promise<boolean>
   */
  async updateChart(chartId: string, options: ChartOptions): Promise<boolean> {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return false;

    try {
      if (typeof worksheet.updateChart !== 'function') {
        console.error('updateChart method not available');
        return false;
      }

      const validation = this.validateChartOptions(options);
      if (!validation.valid) {
        console.error('Chart validation failed:', validation.error);
        return false;
      }

      const chartInfo: any = {
        type: options.type,
        title: options.title,
        dataRange: options.dataRange,
        position: options.position,
        size: options.size,
      };

      if (options.legend) {
        chartInfo.legend = options.legend;
      }

      if (options.axis) {
        chartInfo.axis = options.axis;
      }

      const success = await worksheet.updateChart(chartInfo);
      return success;
    } catch (error) {
      console.error('Failed to update chart:', error);
      return false;
    }
  }

  /**
   * Remove a chart
   * 
   * @param chartId - Chart ID to remove
   * @returns Promise<boolean>
   */
  async removeChart(chartId: string): Promise<boolean> {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return false;

    try {
      if (typeof worksheet.getCharts !== 'function' || typeof worksheet.removeChart !== 'function') {
        console.error('Chart removal methods not available');
        return false;
      }

      const charts = worksheet.getCharts();
      const chart = charts.find((c: any) => c.getId() === chartId);

      if (!chart) {
        console.error('Chart not found:', chartId);
        return false;
      }

      const success = await worksheet.removeChart(chart);
      return success;
    } catch (error) {
      console.error('Failed to remove chart:', error);
      return false;
    }
  }

  /**
   * Get all charts in the active worksheet
   * 
   * @returns ChartInfo[] - Array of chart information
   */
  getCharts(): ChartInfo[] {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return [];

    try {
      if (typeof worksheet.getCharts !== 'function') {
        console.warn('getCharts method not available');
        return [];
      }

      const charts = worksheet.getCharts();
      
      return charts.map((chart: any) => ({
        id: chart.getId?.() || '',
        type: chart.getType?.() || ChartType.COLUMN,
        title: chart.getTitle?.() || '',
        dataRange: chart.getDataRange?.() || '',
        position: chart.getPosition?.() || { x: 0, y: 0 },
        size: chart.getSize?.() || { width: 600, height: 400 },
      }));
    } catch (error) {
      console.error('Failed to get charts:', error);
      return [];
    }
  }

  /**
   * Register a custom chart theme
   * 
   * @param name - Theme name
   * @param theme - Theme configuration
   * @returns boolean - True if theme was registered successfully
   */
  registerChartTheme(name: string, theme: ChartTheme): boolean {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return false;

    try {
      if (typeof worksheet.registerChartTheme !== 'function') {
        console.warn('registerChartTheme method not available');
        return false;
      }

      worksheet.registerChartTheme(name, theme);
      return true;
    } catch (error) {
      console.error('Failed to register chart theme:', error);
      return false;
    }
  }

  /**
   * Remove all charts from the active worksheet
   * 
   * @returns Promise<boolean>
   */
  async removeAllCharts(): Promise<boolean> {
    const worksheet = this.getActiveWorksheet();
    if (!worksheet) return false;

    try {
      if (typeof worksheet.getCharts !== 'function' || typeof worksheet.removeChart !== 'function') {
        console.error('Chart methods not available');
        return false;
      }

      const charts = worksheet.getCharts();
      
      for (const chart of charts) {
        await worksheet.removeChart(chart);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove all charts:', error);
      return false;
    }
  }
}

/**
 * Create a chart service instance
 */
export function createChartService(univerAPI: FUniver | null, isReady: boolean): ChartService {
  return new ChartService(univerAPI, isReady);
}
