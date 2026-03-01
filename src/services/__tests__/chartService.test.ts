// @ts-nocheck
/**
 * Tests for Chart Service
 * 
 * Tests chart creation, customization, and management functionality
 * Requirements: 4.1.1, 4.1.2, 4.1.3, 4.1.4, 4.1.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartService, ChartType, type ChartOptions, type ChartTheme } from '../chartService';
import type { FUniver, FWorkbook, FWorksheet } from '../../types/univer.types';

describe('ChartService', () => {
  let chartService: ChartService;
  let mockUniversAPI: FUniver;
  let mockWorkbook: FWorkbook;
  let mockWorksheet: FWorksheet;
  let mockChartBuilder: any;
  let mockChart: any;

  beforeEach(() => {
    // Mock chart
    mockChart = {
      getId: vi.fn(() => 'chart-1'),
      getType: vi.fn(() => ChartType.COLUMN),
      getTitle: vi.fn(() => 'Test Chart'),
      getDataRange: vi.fn(() => 'A1:B10'),
      getPosition: vi.fn(() => ({ x: 100, y: 100 })),
      getSize: vi.fn(() => ({ width: 600, height: 400 })),
    };

    // Mock chart builder
    mockChartBuilder = {
      setChartType: vi.fn().mockReturnThis(),
      setTitle: vi.fn().mockReturnThis(),
      setDataRange: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setTheme: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(mockChart),
    };

    // Mock worksheet
    mockWorksheet = {
      newChart: vi.fn(() => mockChartBuilder),
      insertChart: vi.fn().mockResolvedValue(true),
      updateChart: vi.fn().mockResolvedValue(true),
      removeChart: vi.fn().mockResolvedValue(true),
      getCharts: vi.fn(() => [mockChart]),
      registerChartTheme: vi.fn(),
      getLastRow: vi.fn(() => 10),
    } as any;

    // Mock workbook
    mockWorkbook = {
      getActiveSheet: vi.fn(() => mockWorksheet),
    } as any;

    // Mock univerAPI
    mockUniversAPI = {
      getActiveWorkbook: vi.fn(() => mockWorkbook),
    } as any;

    chartService = new ChartService(mockUniversAPI, true);
  });

  describe('Initialization', () => {
    it('should initialize with univerAPI and ready state', () => {
      expect(chartService).toBeDefined();
    });

    it('should update API instance', () => {
      const newAPI = {} as FUniver;
      chartService.updateAPI(newAPI, false);
      expect(chartService).toBeDefined();
    });
  });

  describe('Chart Creation', () => {
    it('should create a column chart successfully', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        title: 'Sales Data',
        dataRange: 'A1:B10',
        position: { x: 100, y: 100 },
        size: { width: 600, height: 400 },
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(true);
      expect(mockWorksheet.newChart).toHaveBeenCalled();
      expect(mockChartBuilder.setChartType).toHaveBeenCalledWith(ChartType.COLUMN);
      expect(mockChartBuilder.setTitle).toHaveBeenCalledWith('Sales Data');
      expect(mockChartBuilder.setDataRange).toHaveBeenCalledWith('A1:B10');
      expect(mockChartBuilder.setPosition).toHaveBeenCalledWith(100, 100);
      expect(mockChartBuilder.setSize).toHaveBeenCalledWith(600, 400);
      expect(mockChartBuilder.build).toHaveBeenCalled();
    });

    it('should create a line chart successfully', async () => {
      const success = await chartService.createLineChart('A1:B13', 'Trend Analysis');

      expect(success).toBe(true);
      expect(mockChartBuilder.setChartType).toHaveBeenCalledWith(ChartType.LINE);
      expect(mockChartBuilder.setTitle).toHaveBeenCalledWith('Trend Analysis');
      expect(mockChartBuilder.setDataRange).toHaveBeenCalledWith('A1:B13');
    });

    it('should create a bar chart successfully', async () => {
      const success = await chartService.createBarChart('A1:B8', 'Department Performance');

      expect(success).toBe(true);
      expect(mockChartBuilder.setChartType).toHaveBeenCalledWith(ChartType.BAR);
      expect(mockChartBuilder.setTitle).toHaveBeenCalledWith('Department Performance');
    });

    it('should create a pie chart successfully', async () => {
      const success = await chartService.createPieChart('A1:B6', 'Market Share');

      expect(success).toBe(true);
      expect(mockChartBuilder.setChartType).toHaveBeenCalledWith(ChartType.PIE);
      expect(mockChartBuilder.setTitle).toHaveBeenCalledWith('Market Share');
    });

    it('should use default position when not provided', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      await chartService.createChart(options);

      expect(mockChartBuilder.setPosition).toHaveBeenCalled();
      const positionCall = mockChartBuilder.setPosition.mock.calls[0];
      expect(positionCall[0]).toBeGreaterThanOrEqual(0);
      expect(positionCall[1]).toBeGreaterThanOrEqual(0);
    });

    it('should use default size when not provided', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      await chartService.createChart(options);

      expect(mockChartBuilder.setSize).toHaveBeenCalledWith(600, 400);
    });

    it('should apply custom theme when provided', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
        theme: 'corporate',
      };

      await chartService.createChart(options);

      expect(mockChartBuilder.setTheme).toHaveBeenCalledWith('corporate');
    });

    it('should not apply theme when not provided', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      await chartService.createChart(options);

      expect(mockChartBuilder.setTheme).not.toHaveBeenCalled();
    });

    it('should handle chart creation without title', async () => {
      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(true);
      expect(mockChartBuilder.setTitle).not.toHaveBeenCalled();
    });
  });

  describe('Chart Validation', () => {
    it('should reject chart without data range', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: '',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
      expect(mockWorksheet.newChart).not.toHaveBeenCalled();
    });

    it('should reject chart with invalid data range format', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'invalid-range',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
      expect(mockWorksheet.newChart).not.toHaveBeenCalled();
    });

    it('should accept valid data range formats', async () => {
      const validRanges = ['A1:B10', 'AA1:ZZ100', 'A1:A1'];

      for (const range of validRanges) {
        const options: ChartOptions = {
          type: ChartType.COLUMN,
          dataRange: range,
        };

        const success = await chartService.createChart(options);
        expect(success).toBe(true);
      }
    });

    it('should reject invalid chart type', async () => {
      const options: any = {
        type: 'invalid-type',
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });
  });

  describe('Chart Fallback', () => {
    it('should use insertChart fallback when newChart is not available', async () => {
      mockWorksheet.newChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        title: 'Sales Data',
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(true);
      expect(mockWorksheet.insertChart).toHaveBeenCalled();
    });

    it('should include legend in fallback', async () => {
      mockWorksheet.newChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
        legend: {
          show: true,
          position: 'bottom',
        },
      };

      await chartService.createChart(options);

      const chartInfo = mockWorksheet.insertChart.mock.calls[0][0];
      expect(chartInfo.legend).toEqual({
        show: true,
        position: 'bottom',
      });
    });

    it('should include axis configuration in fallback', async () => {
      mockWorksheet.newChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
        axis: {
          x: { title: 'Time' },
          y: { title: 'Value', min: 0, max: 100 },
        },
      };

      await chartService.createChart(options);

      const chartInfo = mockWorksheet.insertChart.mock.calls[0][0];
      expect(chartInfo.axis).toEqual({
        x: { title: 'Time' },
        y: { title: 'Value', min: 0, max: 100 },
      });
    });

    it('should fail when neither newChart nor insertChart are available', async () => {
      mockWorksheet.newChart = undefined as any;
      mockWorksheet.insertChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });
  });

  describe('Chart Update', () => {
    it('should update chart successfully', async () => {
      const options: ChartOptions = {
        type: ChartType.LINE,
        title: 'Updated Title',
        dataRange: 'A1:B20',
        position: { x: 200, y: 200 },
        size: { width: 800, height: 500 },
      };

      const success = await chartService.updateChart('chart-1', options);

      expect(success).toBe(true);
      expect(mockWorksheet.updateChart).toHaveBeenCalled();
    });

    it('should validate options before updating', async () => {
      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'invalid',
      };

      const success = await chartService.updateChart('chart-1', options);

      expect(success).toBe(false);
      expect(mockWorksheet.updateChart).not.toHaveBeenCalled();
    });

    it('should fail when updateChart method is not available', async () => {
      mockWorksheet.updateChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
      };

      const success = await chartService.updateChart('chart-1', options);

      expect(success).toBe(false);
    });
  });

  describe('Chart Removal', () => {
    it('should remove chart successfully', async () => {
      const success = await chartService.removeChart('chart-1');

      expect(success).toBe(true);
      expect(mockWorksheet.getCharts).toHaveBeenCalled();
      expect(mockWorksheet.removeChart).toHaveBeenCalledWith(mockChart);
    });

    it('should fail when chart is not found', async () => {
      mockWorksheet.getCharts = vi.fn(() => []);

      const success = await chartService.removeChart('non-existent');

      expect(success).toBe(false);
      expect(mockWorksheet.removeChart).not.toHaveBeenCalled();
    });

    it('should fail when removal methods are not available', async () => {
      mockWorksheet.getCharts = undefined as any;
      mockWorksheet.removeChart = undefined as any;

      const success = await chartService.removeChart('chart-1');

      expect(success).toBe(false);
    });

    it('should remove all charts successfully', async () => {
      const mockChart2 = { ...mockChart, getId: vi.fn(() => 'chart-2') };
      mockWorksheet.getCharts = vi.fn(() => [mockChart, mockChart2]);

      const success = await chartService.removeAllCharts();

      expect(success).toBe(true);
      expect(mockWorksheet.removeChart).toHaveBeenCalledTimes(2);
    });
  });

  describe('Chart Retrieval', () => {
    it('should get all charts', () => {
      const charts = chartService.getCharts();

      expect(charts).toHaveLength(1);
      expect(charts[0]).toEqual({
        id: 'chart-1',
        type: ChartType.COLUMN,
        title: 'Test Chart',
        dataRange: 'A1:B10',
        position: { x: 100, y: 100 },
        size: { width: 600, height: 400 },
      });
    });

    it('should return empty array when no charts exist', () => {
      mockWorksheet.getCharts = vi.fn(() => []);

      const charts = chartService.getCharts();

      expect(charts).toEqual([]);
    });

    it('should return empty array when getCharts is not available', () => {
      mockWorksheet.getCharts = undefined as any;

      const charts = chartService.getCharts();

      expect(charts).toEqual([]);
    });

    it('should handle charts with missing methods gracefully', () => {
      const incompleteChart = {
        getId: vi.fn(() => 'chart-1'),
      };
      mockWorksheet.getCharts = vi.fn(() => [incompleteChart]);

      const charts = chartService.getCharts();

      expect(charts).toHaveLength(1);
      expect(charts[0].id).toBe('chart-1');
      expect(charts[0].type).toBe(ChartType.COLUMN);
    });
  });

  describe('Chart Theme', () => {
    it('should register custom theme successfully', () => {
      const theme: ChartTheme = {
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c'],
        backgroundColor: '#ffffff',
        textColor: '#333333',
        gridColor: '#e0e0e0',
        font: {
          family: 'Arial',
          size: 12,
        },
      };

      const success = chartService.registerChartTheme('corporate', theme);

      expect(success).toBe(true);
      expect(mockWorksheet.registerChartTheme).toHaveBeenCalledWith('corporate', theme);
    });

    it('should fail when registerChartTheme is not available', () => {
      mockWorksheet.registerChartTheme = undefined as any;

      const theme: ChartTheme = {
        colors: ['#ff0000'],
      };

      const success = chartService.registerChartTheme('test', theme);

      expect(success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when Univer is not ready', async () => {
      chartService.updateAPI(null, false);

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });

    it('should handle errors when no active workbook', async () => {
      mockUniversAPI.getActiveWorkbook = vi.fn(() => null);

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });

    it('should handle errors when no active worksheet', async () => {
      mockWorkbook.getActiveSheet = vi.fn(() => null);

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });

    it('should handle chart builder errors', async () => {
      mockChartBuilder.build = vi.fn().mockRejectedValue(new Error('Build failed'));

      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(false);
    });

    it('should handle chart removal errors', async () => {
      mockWorksheet.removeChart = vi.fn().mockRejectedValue(new Error('Remove failed'));

      const success = await chartService.removeChart('chart-1');

      expect(success).toBe(false);
    });
  });

  describe('Chart Types', () => {
    it('should support all chart types', async () => {
      const chartTypes = [
        ChartType.LINE,
        ChartType.COLUMN,
        ChartType.BAR,
        ChartType.PIE,
        ChartType.AREA,
        ChartType.RADAR,
        ChartType.SCATTER,
      ];

      for (const type of chartTypes) {
        const options: ChartOptions = {
          type,
          dataRange: 'A1:B10',
        };

        const success = await chartService.createChart(options);
        expect(success).toBe(true);
        expect(mockChartBuilder.setChartType).toHaveBeenCalledWith(type);
      }
    });
  });

  describe('Chart Customization', () => {
    it('should create chart with legend configuration', async () => {
      mockWorksheet.newChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
        legend: {
          show: true,
          position: 'top',
        },
      };

      await chartService.createChart(options);

      const chartInfo = mockWorksheet.insertChart.mock.calls[0][0];
      expect(chartInfo.legend.show).toBe(true);
      expect(chartInfo.legend.position).toBe('top');
    });

    it('should create chart with custom colors', async () => {
      const options: ChartOptions = {
        type: ChartType.COLUMN,
        dataRange: 'A1:B10',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      };

      const success = await chartService.createChart(options);

      expect(success).toBe(true);
    });

    it('should create chart with axis configuration', async () => {
      mockWorksheet.newChart = undefined as any;

      const options: ChartOptions = {
        type: ChartType.LINE,
        dataRange: 'A1:B10',
        axis: {
          x: { title: 'Time (hours)' },
          y: { title: 'Temperature (°C)', min: 0, max: 100 },
        },
      };

      await chartService.createChart(options);

      const chartInfo = mockWorksheet.insertChart.mock.calls[0][0];
      expect(chartInfo.axis.x.title).toBe('Time (hours)');
      expect(chartInfo.axis.y.title).toBe('Temperature (°C)');
      expect(chartInfo.axis.y.min).toBe(0);
      expect(chartInfo.axis.y.max).toBe(100);
    });
  });
});
