import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackOperation, trackOperationSync } from '../performanceTracking';
import * as Sentry from '../sentry';

// Mock the sentry module
vi.mock('../sentry', () => ({
  trackExcelOperation: vi.fn(),
}));

describe('Performance Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackOperation', () => {
    it('should track successful async operation', async () => {
      const operation = vi.fn().mockResolvedValue('result');
      
      const result = await trackOperation('testOperation', operation, {
        testMetadata: 'value',
      });

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledOnce();
      expect(Sentry.trackExcelOperation).toHaveBeenCalledWith(
        'testOperation',
        expect.any(Number),
        { testMetadata: 'value' }
      );
    });

    it('should track failed async operation', async () => {
      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        trackOperation('testOperation', operation, { testMetadata: 'value' })
      ).rejects.toThrow('Test error');

      expect(Sentry.trackExcelOperation).toHaveBeenCalledWith(
        'testOperation_error',
        expect.any(Number),
        {
          testMetadata: 'value',
          error: 'Test error',
        }
      );
    });

    it('should handle non-Error exceptions', async () => {
      const operation = vi.fn().mockRejectedValue('string error');

      await expect(
        trackOperation('testOperation', operation)
      ).rejects.toBe('string error');

      expect(Sentry.trackExcelOperation).toHaveBeenCalledWith(
        'testOperation_error',
        expect.any(Number),
        { error: 'Unknown error' }
      );
    });
  });

  describe('trackOperationSync', () => {
    it('should track successful sync operation', () => {
      const operation = vi.fn().mockReturnValue('result');
      
      const result = trackOperationSync('testOperation', operation, {
        testMetadata: 'value',
      });

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalledOnce();
      expect(Sentry.trackExcelOperation).toHaveBeenCalledWith(
        'testOperation',
        expect.any(Number),
        { testMetadata: 'value' }
      );
    });

    it('should track failed sync operation', () => {
      const error = new Error('Test error');
      const operation = vi.fn().mockImplementation(() => {
        throw error;
      });

      expect(() =>
        trackOperationSync('testOperation', operation, { testMetadata: 'value' })
      ).toThrow('Test error');

      expect(Sentry.trackExcelOperation).toHaveBeenCalledWith(
        'testOperation_error',
        expect.any(Number),
        {
          testMetadata: 'value',
          error: 'Test error',
        }
      );
    });

    it('should measure operation duration', () => {
      const operation = vi.fn().mockImplementation(() => {
        // Simulate some work
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait for 10ms
        }
        return 'result';
      });

      trackOperationSync('testOperation', operation);

      const callArgs = (Sentry.trackExcelOperation as ReturnType<typeof vi.fn>).mock.calls[0];
      const duration = callArgs[1];
      
      // Duration should be at least 10ms (but allow some margin)
      expect(duration).toBeGreaterThanOrEqual(5);
    });
  });
});
