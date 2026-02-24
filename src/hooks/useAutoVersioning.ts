/**
 * Auto-Versioning Hook
 * 
 * Automatically creates version snapshots on significant changes.
 * 
 * Triggers:
 * - After N edits (configurable threshold)
 * - On major operations (delete rows/columns, clear data)
 * - Time-based (every X minutes if changes detected)
 * 
 * @see Requirements 3.2.4
 */

import { useEffect, useRef, useCallback } from 'react';
import { storageService } from '@/services/storageService';
import type { IWorkbookData } from '@/types/univer.types';

interface AutoVersioningOptions {
  workbookId: string;
  enabled?: boolean;
  editThreshold?: number; // Number of edits before auto-save
  timeInterval?: number; // Time in ms between auto-versions
  getWorkbookData: () => Promise<IWorkbookData>;
  onVersionCreated?: (versionId: string) => void;
}

interface ChangeTracker {
  editCount: number;
  lastVersionTime: number;
  hasChanges: boolean;
}

export const useAutoVersioning = ({
  workbookId,
  enabled = true,
  editThreshold = 50, // Auto-version after 50 edits
  timeInterval = 10 * 60 * 1000, // Auto-version every 10 minutes
  getWorkbookData,
  onVersionCreated,
}: AutoVersioningOptions) => {
  const trackerRef = useRef<ChangeTracker>({
    editCount: 0,
    lastVersionTime: Date.now(),
    hasChanges: false,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Create an auto-version snapshot
   */
  const createAutoVersion = useCallback(async (reason: string) => {
    if (!enabled) return;

    try {
      const versionId = await storageService.saveVersion(
        workbookId,
        `Auto-save: ${reason}`
      );
      
      // Reset tracker
      trackerRef.current = {
        editCount: 0,
        lastVersionTime: Date.now(),
        hasChanges: false,
      };

      onVersionCreated?.(versionId);
      console.log(`Auto-version created: ${reason}`);
    } catch (error) {
      console.error('Failed to create auto-version:', error);
    }
  }, [enabled, workbookId, onVersionCreated]);

  /**
   * Track an edit operation
   */
  const trackEdit = useCallback(() => {
    if (!enabled) return;

    const tracker = trackerRef.current;
    tracker.editCount++;
    tracker.hasChanges = true;

    // Check if we've reached the edit threshold
    if (tracker.editCount >= editThreshold) {
      createAutoVersion(`${editThreshold} edits reached`);
    }
  }, [enabled, editThreshold, createAutoVersion]);

  /**
   * Track a major operation (should trigger immediate version)
   */
  const trackMajorOperation = useCallback((operation: string) => {
    if (!enabled) return;

    createAutoVersion(`Before ${operation}`);
  }, [enabled, createAutoVersion]);

  /**
   * Check if time-based versioning is needed
   */
  const checkTimeBasedVersioning = useCallback(() => {
    if (!enabled) return;

    const tracker = trackerRef.current;
    const timeSinceLastVersion = Date.now() - tracker.lastVersionTime;

    // Create version if time interval passed and there are changes
    if (timeSinceLastVersion >= timeInterval && tracker.hasChanges) {
      createAutoVersion('Periodic auto-save');
    }
  }, [enabled, timeInterval, createAutoVersion]);

  /**
   * Setup time-based versioning interval
   */
  useEffect(() => {
    if (!enabled) return;

    // Check every minute if time-based versioning is needed
    timerRef.current = setInterval(checkTimeBasedVersioning, 60 * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, checkTimeBasedVersioning]);

  /**
   * Create version before unmount if there are unsaved changes
   */
  useEffect(() => {
    return () => {
      const tracker = trackerRef.current;
      if (enabled && tracker.hasChanges) {
        // Create final version on unmount
        storageService.saveVersion(workbookId, 'Auto-save: Before close')
          .catch(error => console.error('Failed to create final version:', error));
      }
    };
  }, [enabled, workbookId]);

  return {
    trackEdit,
    trackMajorOperation,
    createManualVersion: (description: string) => 
      storageService.saveVersion(workbookId, description),
  };
};
