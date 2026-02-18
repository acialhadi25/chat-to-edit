/**
 * Unit tests for useFormulaWorker hook
 *
 * Tests the Web Worker integration for asynchronous formula evaluation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormulaWorker } from '../useFormulaWorker';
import { createMockExcelData } from '@/test/utils/testHelpers';

describe('useFormulaWorker', () => {
  beforeEach(() => {
    // Mock Worker constructor
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    })) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize worker on mount', async () => {
      const { result } = renderHook(() => useFormulaWorker());

      expect(global.Worker).toHaveBeenCalledWith(expect.any(URL), { type: 'module' });

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should terminate worker on unmount', () => {
      const mockTerminate = vi.fn();
      (global.Worker as any).mockImplementation(() => ({
        postMessage: vi.fn(),
        terminate: mockTerminate,
        onmessage: null,
        onerror: null,
      }));

      const { unmount } = renderHook(() => useFormulaWorker());
      unmount();

      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  describe('evaluateAsync', () => {
    it('should evaluate a simple formula successfully', async () => {
      const mockPostMessage = vi.fn();
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        set onmessage(handler: (e: MessageEvent) => void) {
          messageHandler = handler;
        },
        get onmessage() {
          return messageHandler!;
        },
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData({
        rows: [[1, 2, 3]],
      });

      // Start evaluation
      const promise = result.current.evaluateAsync('=SUM(A1:C1)', data);

      // Wait for postMessage to be called
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalled();
      });

      // Simulate worker response
      const request = mockPostMessage.mock.calls[0][0];
      if (messageHandler) {
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'success',
            id: request.id,
            result: 6,
          },
        } as MessageEvent);
      }

      // Wait for promise to resolve
      const result_value = await promise;
      expect(result_value).toBe(6);
    });

    it('should handle formula evaluation errors', async () => {
      const mockPostMessage = vi.fn();
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        set onmessage(handler: (e: MessageEvent) => void) {
          messageHandler = handler;
        },
        get onmessage() {
          return messageHandler!;
        },
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData();

      // Start evaluation
      const promise = result.current.evaluateAsync('=INVALID()', data);

      // Wait for postMessage to be called
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalled();
      });

      // Simulate worker error response
      const request = mockPostMessage.mock.calls[0][0];
      if (messageHandler) {
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'error',
            id: request.id,
            error: 'Unknown function: INVALID',
          },
        } as MessageEvent);
      }

      // Wait for promise to reject
      await expect(promise).rejects.toThrow('Unknown function: INVALID');
    });

    it('should timeout long-running evaluations', async () => {
      const mockPostMessage = vi.fn();

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData();

      // Start evaluation with short timeout
      const promise = result.current.evaluateAsync('=SUM(A1:A10)', data, {
        timeout: 100,
      });

      // Don't send response - let it timeout
      await expect(promise).rejects.toThrow('Formula evaluation timed out after 100ms');
    });

    it('should handle multiple concurrent evaluations', async () => {
      const mockPostMessage = vi.fn();
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        set onmessage(handler: (e: MessageEvent) => void) {
          messageHandler = handler;
        },
        get onmessage() {
          return messageHandler!;
        },
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData({
        rows: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      });

      // Start multiple evaluations
      const promise1 = result.current.evaluateAsync('=SUM(A1:C1)', data);
      const promise2 = result.current.evaluateAsync('=SUM(A2:C2)', data);

      // Wait for both postMessage calls
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledTimes(2);
      });

      // Simulate worker responses in reverse order
      const request2 = mockPostMessage.mock.calls[1][0];
      const request1 = mockPostMessage.mock.calls[0][0];

      if (messageHandler) {
        // Respond to second request first
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'success',
            id: request2.id,
            result: 15,
          },
        } as MessageEvent);

        // Then respond to first request
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'success',
            id: request1.id,
            result: 6,
          },
        } as MessageEvent);
      }

      // Both promises should resolve correctly
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe(6);
      expect(result2).toBe(15);
    });

    it('should reject pending requests when worker is terminated', async () => {
      const mockPostMessage = vi.fn();
      const mockTerminate = vi.fn();

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: mockTerminate,
        onmessage: null,
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData();

      // Start evaluation
      const promise = result.current.evaluateAsync('=SUM(A1:A10)', data);

      // Terminate worker before response
      result.current.terminate();

      // Promise should reject
      await expect(promise).rejects.toThrow('Worker terminated manually');
      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle worker initialization errors', () => {
      // Mock Worker to throw error
      (global.Worker as any).mockImplementation(() => {
        throw new Error('Worker initialization failed');
      });

      const { result } = renderHook(() => useFormulaWorker());

      expect(result.current.isReady).toBe(false);
    });

    it('should reject evaluation when worker is not ready', async () => {
      // Mock Worker to throw error
      (global.Worker as any).mockImplementation(() => {
        throw new Error('Worker initialization failed');
      });

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData();

      await expect(result.current.evaluateAsync('=SUM(A1:A10)', data)).rejects.toThrow(
        'Worker not initialized'
      );
    });

    it('should handle worker onerror events', async () => {
      const mockPostMessage = vi.fn();
      let errorHandler: ((e: ErrorEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        onmessage: null,
        set onerror(handler: (e: ErrorEvent) => void) {
          errorHandler = handler;
        },
        get onerror() {
          return errorHandler!;
        },
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData();

      // Start evaluation
      const promise = result.current.evaluateAsync('=SUM(A1:A10)', data);

      // Trigger worker error
      if (errorHandler) {
        (errorHandler as (e: ErrorEvent) => void)(
          new ErrorEvent('error', {
            message: 'Worker crashed',
          })
        );
      }

      // Promise should reject
      await expect(promise).rejects.toThrow('Worker error: Worker crashed');
    });
  });

  describe('message protocol', () => {
    it('should send correct message format to worker', async () => {
      const mockPostMessage = vi.fn();
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        set onmessage(handler: (e: MessageEvent) => void) {
          messageHandler = handler;
        },
        get onmessage() {
          return messageHandler!;
        },
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());
      const data = createMockExcelData({
        rows: [[1, 2, 3]],
      });

      // Start evaluation
      const promise = result.current.evaluateAsync('=SUM(A1:C1)', data);

      // Wait for postMessage
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalled();
      });

      // Verify message format
      const message = mockPostMessage.mock.calls[0][0];
      expect(message).toMatchObject({
        type: 'evaluate',
        id: expect.stringMatching(/^req_\d+$/),
        formula: '=SUM(A1:C1)',
        data: expect.objectContaining({
          rows: [[1, 2, 3]],
        }),
      });

      // Resolve the promise to avoid unhandled rejection
      if (messageHandler) {
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'success',
            id: message.id,
            result: 6,
          },
        } as MessageEvent);
      }

      await promise;
    });
  });

  describe('cache operations', () => {
    it('should send invalidate message to worker', async () => {
      const mockPostMessage = vi.fn();

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Invalidate cache
      result.current.invalidateCache();

      // Verify invalidate message was sent
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'invalidate' });
    });

    it('should get cache statistics', async () => {
      const mockPostMessage = vi.fn();
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        set onmessage(handler: (e: MessageEvent) => void) {
          messageHandler = handler;
        },
        get onmessage() {
          return messageHandler!;
        },
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Request cache stats
      const promise = result.current.getCacheStats();

      // Wait for postMessage
      await waitFor(() => {
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'stats',
            id: expect.stringMatching(/^stats_\d+$/),
          })
        );
      });

      // Simulate worker response
      const request = mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1][0];
      if (messageHandler) {
        (messageHandler as (e: MessageEvent) => void)({
          data: {
            type: 'stats',
            id: request.id,
            stats: {
              size: 5,
              maxSize: 1000,
              hitRate: 0.75,
              dataVersion: 2,
            },
          },
        } as MessageEvent);
      }

      // Wait for promise to resolve
      const stats = await promise;
      expect(stats).toEqual({
        size: 5,
        maxSize: 1000,
        hitRate: 0.75,
        dataVersion: 2,
      });
    });

    it('should handle cache stats timeout', async () => {
      const mockPostMessage = vi.fn();

      (global.Worker as any).mockImplementation(() => ({
        postMessage: mockPostMessage,
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
      }));

      const { result } = renderHook(() => useFormulaWorker());

      // Wait for worker to be ready
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Request cache stats
      const promise = result.current.getCacheStats();

      // Don't send response - let it timeout
      await expect(promise).rejects.toThrow('Cache stats request timed out');
    });

    it('should not invalidate cache when worker is not ready', async () => {
      // Mock Worker to throw error
      (global.Worker as any).mockImplementation(() => {
        throw new Error('Worker initialization failed');
      });

      const { result } = renderHook(() => useFormulaWorker());

      // Try to invalidate cache
      result.current.invalidateCache();

      // Should not throw, just log warning
      expect(result.current.isReady).toBe(false);
    });

    it('should reject getCacheStats when worker is not ready', async () => {
      // Mock Worker to throw error
      (global.Worker as any).mockImplementation(() => {
        throw new Error('Worker initialization failed');
      });

      const { result } = renderHook(() => useFormulaWorker());

      // Try to get cache stats
      await expect(result.current.getCacheStats()).rejects.toThrow('Worker not initialized');
    });
  });
});
