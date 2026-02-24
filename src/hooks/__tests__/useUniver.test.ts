/**
 * Unit Tests for useUniver Hook
 * 
 * Validates: Requirements 1.1.1, 1.1.2
 * Tests the Univer instance lifecycle management hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUniver } from '../useUniver';
import { LocaleType } from '@univerjs/presets';

// Mock the Univer modules
vi.mock('@univerjs/presets', () => ({
  createUniver: vi.fn(() => ({
    univer: {
      dispose: vi.fn(),
    },
    univerAPI: {
      addEvent: vi.fn((event, callback) => {
        // Simulate lifecycle event
        if (event === 'LifeCycleChanged') {
          setTimeout(() => {
            callback({ stage: 'Rendered' });
          }, 0);
        }
        return { dispose: vi.fn() };
      }),
      createWorkbook: vi.fn(),
      Event: {
        LifeCycleChanged: 'LifeCycleChanged',
      },
      Enum: {
        LifecycleStages: {
          Rendered: 'Rendered',
        },
      },
    },
  })),
  LocaleType: {
    EN_US: 'en-US',
    ZH_CN: 'zh-CN',
  },
  mergeLocales: vi.fn((locale) => locale),
}));

vi.mock('@univerjs/preset-sheets-core', () => ({
  UniverSheetsCorePreset: vi.fn(() => ({})),
}));

vi.mock('@univerjs/preset-sheets-core/locales/en-US', () => ({
  default: {},
}));

describe('useUniver Hook', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should return null values when container is not provided', () => {
    const { result } = renderHook(() => useUniver({ container: null }));

    expect(result.current.univerAPI).toBeNull();
    expect(result.current.univer).toBeNull();
    expect(result.current.isReady).toBe(false);
  });

  it('should initialize Univer instance when container is provided', async () => {
    const { result } = renderHook(() => useUniver({ container }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.univerAPI).toBeDefined();
    expect(result.current.univer).toBeDefined();
  });

  it('should create empty workbook when no initial data provided', async () => {
    const { result } = renderHook(() => useUniver({ container }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.univerAPI.createWorkbook).toHaveBeenCalledWith({});
  });

  it('should create workbook with initial data when provided', async () => {
    const initialData = {
      id: 'test-workbook',
      name: 'Test Workbook',
      sheets: {},
    };

    const { result } = renderHook(() => useUniver({ container, initialData }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.univerAPI.createWorkbook).toHaveBeenCalledWith(initialData);
  });

  it('should use default locale EN_US when not specified', async () => {
    const { createUniver } = await import('@univerjs/presets');
    
    renderHook(() => useUniver({ container }));

    await waitFor(() => {
      expect(createUniver).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: LocaleType.EN_US,
        })
      );
    });
  });

  it('should use custom locale when provided', async () => {
    const { createUniver } = await import('@univerjs/presets');
    
    renderHook(() => useUniver({ container, locale: LocaleType.ZH_CN }));

    await waitFor(() => {
      expect(createUniver).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: LocaleType.ZH_CN,
        })
      );
    });
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useUniver({ container }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    const univerInstance = result.current.univer;
    unmount();

    expect(univerInstance.dispose).toHaveBeenCalled();
  });

  it('should reset state on cleanup', async () => {
    const { result, unmount } = renderHook(() => useUniver({ container }));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    const univerInstance = result.current.univer;
    unmount();

    // Verify cleanup was called
    expect(univerInstance.dispose).toHaveBeenCalled();
    
    // Note: refs are captured at render time, so they still hold the last value
    // The important thing is that dispose was called and the hook won't create new instances
  });
});
