/**
 * Custom hook for managing keyboard shortcuts
 * Provides centralized keyboard navigation and shortcuts for the application
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * @param options - Configuration for keyboard shortcuts
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Common keyboard shortcuts for the application
 */
export const COMMON_SHORTCUTS = {
  UNDO: { key: 'z', ctrl: true, description: 'Undo last action' },
  REDO: { key: 'y', ctrl: true, description: 'Redo last action' },
  SAVE: { key: 's', ctrl: true, description: 'Save file' },
  FIND: { key: 'f', ctrl: true, description: 'Find in page' },
  ESCAPE: { key: 'Escape', description: 'Close modal or cancel action' },
  ENTER: { key: 'Enter', description: 'Confirm action' },
  TAB: { key: 'Tab', description: 'Navigate to next element' },
  SHIFT_TAB: { key: 'Tab', shift: true, description: 'Navigate to previous element' },
  ARROW_UP: { key: 'ArrowUp', description: 'Move up' },
  ARROW_DOWN: { key: 'ArrowDown', description: 'Move down' },
  ARROW_LEFT: { key: 'ArrowLeft', description: 'Move left' },
  ARROW_RIGHT: { key: 'ArrowRight', description: 'Move right' },
};

/**
 * Hook for managing focus trap in modals
 * Ensures keyboard navigation stays within the modal
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when modal opens
    firstElement?.focus();

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

/**
 * Hook for managing roving tabindex in a list
 * Allows arrow key navigation within a list of items
 */
export function useRovingTabIndex(
  containerRef: React.RefObject<HTMLElement>,
  itemSelector: string,
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let currentIndex = 0;

    const getItems = () => Array.from(container.querySelectorAll<HTMLElement>(itemSelector));

    const updateTabIndex = () => {
      const items = getItems();
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = getItems();
      if (items.length === 0) return;

      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

      if (event.key === nextKey) {
        event.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (event.key === prevKey) {
        event.preventDefault();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        currentIndex = 0;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        currentIndex = items.length - 1;
        updateTabIndex();
        items[currentIndex]?.focus();
      }
    };

    updateTabIndex();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector, orientation]);
}
