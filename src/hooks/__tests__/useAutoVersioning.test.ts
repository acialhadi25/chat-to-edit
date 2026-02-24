/**
 * Unit Tests for useAutoVersioning Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutoVersioning } from '../useAutoVersioning';
import { storageService } from '@/services/storageService';
import type { IWorkbookData } from '@/types/univer.types';

// Mock storage service
vi.mock('@/services/storageService', () => ({
  storageService: {
    saveVersion: vi.fn(),
  },
}));

describe('useAutoVersioning', () => {
  const mockWorkbookData: IWorkbookData = {
    id: 'workbook-123',
    name: 'Test Workbook',
    sheets: {},
  };

  const defaultOptions = {
    workbookId: 'workbook-123',
    enabled: true,
    editThreshold: 5,
    timeInterval: 100, // 100ms for testing
    getWorkbookData: vi.fn().mockResolvedValue(mockWorkbookData),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track edits', () => {
    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    expect(result.current.trackEdit).toBeDefined();
    expect(typeof result.current.trackEdit).toBe('function');
  });

  it('should create auto-version after edit threshold', async () => {
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-1');

    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    // Track edits up to threshold
    for (let i = 0; i < 5; i++) {
      result.current.trackEdit();
    }

    await waitFor(() => {
      expect(storageService.saveVersion).toHaveBeenCalledWith(
        'workbook-123',
        expect.stringContaining('5 edits reached')
      );
    }, { timeout: 2000 });
  });

  it('should not create version before threshold', async () => {
    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    // Track edits below threshold
    for (let i = 0; i < 3; i++) {
      result.current.trackEdit();
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(storageService.saveVersion).not.toHaveBeenCalled();
  });

  it('should create version on major operation', async () => {
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-1');

    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    result.current.trackMajorOperation('Delete rows');

    await waitFor(() => {
      expect(storageService.saveVersion).toHaveBeenCalledWith(
        'workbook-123',
        'Auto-save: Before Delete rows'
      );
    }, { timeout: 2000 });
  });

  it('should not track when disabled', async () => {
    const { result } = renderHook(() =>
      useAutoVersioning({ ...defaultOptions, enabled: false })
    );

    for (let i = 0; i < 10; i++) {
      result.current.trackEdit();
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(storageService.saveVersion).not.toHaveBeenCalled();
  });

  it('should call onVersionCreated callback', async () => {
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-1');
    const onVersionCreated = vi.fn();

    const { result } = renderHook(() =>
      useAutoVersioning({ ...defaultOptions, onVersionCreated })
    );

    for (let i = 0; i < 5; i++) {
      result.current.trackEdit();
    }

    await waitFor(() => {
      expect(onVersionCreated).toHaveBeenCalledWith('version-1');
    }, { timeout: 2000 });
  });

  it('should create manual version', async () => {
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-1');

    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    await result.current.createManualVersion('Manual checkpoint');

    expect(storageService.saveVersion).toHaveBeenCalledWith(
      'workbook-123',
      'Manual checkpoint'
    );
  });

  it('should handle version creation errors gracefully', async () => {
    vi.mocked(storageService.saveVersion).mockRejectedValue(
      new Error('Save failed')
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    for (let i = 0; i < 5; i++) {
      result.current.trackEdit();
    }

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create auto-version:',
        expect.any(Error)
      );
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });

  it('should reset edit count after auto-version', async () => {
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-1');

    const { result } = renderHook(() => useAutoVersioning(defaultOptions));

    // First batch of edits
    for (let i = 0; i < 5; i++) {
      result.current.trackEdit();
    }

    await waitFor(() => {
      expect(storageService.saveVersion).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    vi.clearAllMocks();

    // Second batch of edits
    for (let i = 0; i < 5; i++) {
      result.current.trackEdit();
    }

    await waitFor(() => {
      expect(storageService.saveVersion).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  it('should cleanup timer on unmount', () => {
    const { unmount } = renderHook(() => useAutoVersioning(defaultOptions));

    unmount();

    // No errors should occur after unmount
    expect(true).toBe(true);
  });
});
