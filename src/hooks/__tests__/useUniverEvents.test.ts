/**
 * Unit Tests for useUniverEvents Hook
 * 
 * Validates: Requirements 1.1.2, 1.1.3
 * Tests the Univer event handling hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUniverEvents } from '../useUniverEvents';

describe('useUniverEvents Hook', () => {
  let mockUniversAPI: any;
  let mockDisposable: any;

  beforeEach(() => {
    mockDisposable = { dispose: vi.fn() };
    mockUniversAPI = {
      addEvent: vi.fn(() => mockDisposable),
      getActiveWorkbook: vi.fn(() => ({
        save: vi.fn(() => ({ id: 'test', name: 'Test' })),
      })),
      Event: {
        CommandExecuted: 'CommandExecuted',
        SelectionChanged: 'SelectionChanged',
      },
    };
  });

  it('should not subscribe to events when univerAPI is null', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useUniverEvents({
        univerAPI: null,
        isReady: true,
        onChange,
      })
    );

    expect(mockUniversAPI.addEvent).not.toHaveBeenCalled();
  });

  it('should not subscribe to events when not ready', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: false,
        onChange,
      })
    );

    expect(mockUniversAPI.addEvent).not.toHaveBeenCalled();
  });

  it('should subscribe to CommandExecuted event when onChange provided', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onChange,
      })
    );

    expect(mockUniversAPI.addEvent).toHaveBeenCalledWith(
      'CommandExecuted',
      expect.any(Function)
    );
  });

  it('should call onChange with workbook data when command executed', () => {
    const onChange = vi.fn();
    let commandCallback: any;

    mockUniversAPI.addEvent.mockImplementation((event: string, callback: any) => {
      if (event === 'CommandExecuted') {
        commandCallback = callback;
      }
      return mockDisposable;
    });

    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onChange,
      })
    );

    // Simulate command execution
    commandCallback();

    expect(onChange).toHaveBeenCalledWith({ id: 'test', name: 'Test' });
  });

  it('should subscribe to SelectionChanged event when onSelectionChange provided', () => {
    const onSelectionChange = vi.fn();
    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onSelectionChange,
      })
    );

    expect(mockUniversAPI.addEvent).toHaveBeenCalledWith(
      'SelectionChanged',
      expect.any(Function)
    );
  });

  it('should call onSelectionChange with selection data', () => {
    const onSelectionChange = vi.fn();
    let selectionCallback: any;

    mockUniversAPI.addEvent.mockImplementation((event: string, callback: any) => {
      if (event === 'SelectionChanged') {
        selectionCallback = callback;
      }
      return mockDisposable;
    });

    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onSelectionChange,
      })
    );

    // Simulate selection change
    const mockSelection = {
      startRow: 0,
      endRow: 5,
      startColumn: 0,
      endColumn: 3,
    };
    selectionCallback({ selections: [mockSelection] });

    expect(onSelectionChange).toHaveBeenCalledWith(mockSelection);
  });

  it('should not call onSelectionChange when selections array is empty', () => {
    const onSelectionChange = vi.fn();
    let selectionCallback: any;

    mockUniversAPI.addEvent.mockImplementation((event: string, callback: any) => {
      if (event === 'SelectionChanged') {
        selectionCallback = callback;
      }
      return mockDisposable;
    });

    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onSelectionChange,
      })
    );

    // Simulate selection change with empty array
    selectionCallback({ selections: [] });

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should dispose event listeners on unmount', () => {
    const onChange = vi.fn();
    const { unmount } = renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onChange,
      })
    );

    unmount();

    expect(mockDisposable.dispose).toHaveBeenCalled();
  });

  it('should handle multiple event subscriptions', () => {
    const onChange = vi.fn();
    const onSelectionChange = vi.fn();

    renderHook(() =>
      useUniverEvents({
        univerAPI: mockUniversAPI,
        isReady: true,
        onChange,
        onSelectionChange,
      })
    );

    expect(mockUniversAPI.addEvent).toHaveBeenCalledTimes(2);
    expect(mockUniversAPI.addEvent).toHaveBeenCalledWith(
      'CommandExecuted',
      expect.any(Function)
    );
    expect(mockUniversAPI.addEvent).toHaveBeenCalledWith(
      'SelectionChanged',
      expect.any(Function)
    );
  });

  it('should update callback refs when callbacks change', () => {
    const onChange1 = vi.fn();
    const onChange2 = vi.fn();
    let commandCallback: any;

    mockUniversAPI.addEvent.mockImplementation((event: string, callback: any) => {
      if (event === 'CommandExecuted') {
        commandCallback = callback;
      }
      return mockDisposable;
    });

    const { rerender } = renderHook(
      ({ onChange }) =>
        useUniverEvents({
          univerAPI: mockUniversAPI,
          isReady: true,
          onChange,
        }),
      { initialProps: { onChange: onChange1 } }
    );

    // Trigger event with first callback
    commandCallback();
    expect(onChange1).toHaveBeenCalled();
    expect(onChange2).not.toHaveBeenCalled();

    // Update callback
    rerender({ onChange: onChange2 });

    // Trigger event with second callback
    commandCallback();
    expect(onChange2).toHaveBeenCalled();
  });
});
