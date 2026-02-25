/**
 * Univer Worker
 * 
 * Web Worker for offloading heavy computations to background thread.
 * Handles formula calculations and other CPU-intensive operations.
 * 
 * Requirements: Technical Requirements 3
 * @see https://docs.univer.ai/guides/sheets/features/core/worker
 */

import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets';
import { UniverSheetsCoreWorkerPreset } from '@univerjs/preset-sheets-core/worker';
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US';

// Initialize Univer in worker thread
createUniver({
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
  },
  presets: [
    UniverSheetsCoreWorkerPreset(),
  ],
});

// Worker is now ready to handle formula calculations
console.log('[Univer Worker] Initialized and ready');
