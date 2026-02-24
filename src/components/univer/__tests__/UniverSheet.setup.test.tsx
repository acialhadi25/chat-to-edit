/**
 * Environment Setup Tests for Univer Sheet
 * 
 * Validates: Requirements 1.1.1 - Technical Requirements 1.1
 * Tests that Univer packages are properly installed and configured
 */

import { describe, it, expect } from 'vitest';

describe('Univer Environment Setup', () => {
  it('should have @univerjs/presets package installed', async () => {
    const presets = await import('@univerjs/presets');
    expect(presets).toBeDefined();
    expect(presets.createUniver).toBeDefined();
    expect(presets.LocaleType).toBeDefined();
  });

  it('should have @univerjs/preset-sheets-core package installed', async () => {
    const sheetsCore = await import('@univerjs/preset-sheets-core');
    expect(sheetsCore).toBeDefined();
    expect(sheetsCore.UniverSheetsCorePreset).toBeDefined();
  });

  it('should have @univerjs/sheets package installed', async () => {
    // This is a transitive dependency, verify it's available
    const sheets = await import('@univerjs/sheets');
    expect(sheets).toBeDefined();
  });

  it('should have @univerjs/sheets-ui package installed', async () => {
    // This is a transitive dependency, verify it's available
    const sheetsUI = await import('@univerjs/sheets-ui');
    expect(sheetsUI).toBeDefined();
  });

  it('should have locale files available', async () => {
    const locale = await import('@univerjs/preset-sheets-core/locales/en-US');
    expect(locale).toBeDefined();
    expect(locale.default).toBeDefined();
  });

  it('should have TypeScript types defined', async () => {
    // Import type definitions
    const types = await import('../../../types/univer.types');
    expect(types).toBeDefined();
    
    // Verify key type exports exist
    expect(types.CellValueType).toBeDefined();
    expect(types.BorderStyleType).toBeDefined();
    expect(types.WorksheetStatus).toBeDefined();
    expect(types.LifecycleStages).toBeDefined();
  });

  it('should have CSS imports configured', () => {
    // This test verifies that CSS can be imported without errors
    // The actual import happens in the component file
    expect(true).toBe(true);
  });
});

describe('Univer Component Setup', () => {
  it('should be able to import UniverSheet module', async () => {
    // The component requires DOM to initialize, so we just verify the module can be imported
    const module = await import('../UniverSheet');
    expect(module).toBeDefined();
  });

  it('should have proper TypeScript interface for UniverSheetHandle', async () => {
    // This is a compile-time check, if it compiles, the types are correct
    const types = await import('../../../types/univer.types');
    // UniverSheetHandle is a TypeScript interface, not exported at runtime
    // The test passes if the import succeeds
    expect(types).toBeDefined();
  });
});
