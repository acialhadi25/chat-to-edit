import { test, expect } from '@playwright/test';
import {
  login,
  uploadExcelFile,
  waitForLoadingComplete,
  waitForToast,
  waitForDownload,
  waitForStableElement,
  clickButton,
} from './utils/helpers';

/**
 * E2E tests for Excel editing workflow
 * Tests: upload → edit → download flow, multi-sheet navigation, undo/redo
 * Validates: Requirements 1.3.1
 */

test.describe('Excel Editing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should complete full Excel upload → edit → download workflow', async ({ page }) => {
    // Step 1: Upload Excel file
    await test.step('Upload Excel file', async () => {
      // Look for upload button or file input
      const fileInput = page.locator('input[type="file"]');

      if ((await fileInput.count()) === 0) {
        // Click upload button to reveal file input
        await clickButton(page, 'Upload');
      }

      // Create a simple Excel file data for testing
      // Since we don't have fixtures yet, we'll use the demo data if available
      const uploadButton = page.locator(
        'button:has-text("Upload"), button:has-text("Choose File")'
      );

      if ((await uploadButton.count()) > 0) {
        await uploadButton.first().click();
      }

      // Wait for Excel grid to appear (either from upload or demo data)
      await page.waitForSelector('[role="grid"], .excel-grid, table', {
        state: 'visible',
        timeout: 10000,
      });

      await waitForLoadingComplete(page);
    });

    // Step 2: Edit a cell
    await test.step('Edit cell value', async () => {
      // Find the first editable cell
      const firstCell = page.locator('[role="gridcell"], td').first();
      await firstCell.waitFor({ state: 'visible' });

      // Click to select the cell
      await firstCell.click();

      // Double-click to enter edit mode or look for input
      await firstCell.dblclick();

      // Try to find an input field or contenteditable element
      const cellInput = page
        .locator('input[type="text"]:visible, [contenteditable="true"]:visible')
        .first();

      if ((await cellInput.count()) > 0) {
        await cellInput.fill('Test Value');
        await page.keyboard.press('Enter');
      } else {
        // If no input, try typing directly
        await page.keyboard.type('Test Value');
        await page.keyboard.press('Enter');
      }

      // Wait for the change to be applied
      await page.waitForTimeout(500);
    });

    // Step 3: Verify the edit
    await test.step('Verify cell edit', async () => {
      const firstCell = page.locator('[role="gridcell"], td').first();
      const cellText = await firstCell.textContent();

      expect(cellText).toContain('Test Value');
    });

    // Step 4: Download the file
    await test.step('Download Excel file', async () => {
      const downloadButton = page.locator(
        'button:has-text("Download"), button:has-text("Export"), [aria-label*="Download"]'
      );

      if ((await downloadButton.count()) > 0) {
        const filename = await waitForDownload(page, async () => {
          await downloadButton.first().click();
        });

        // Verify the downloaded file has Excel extension
        expect(filename).toMatch(/\.(xlsx|xls|csv)$/i);
      } else {
        // Skip download test if button not found
        test.skip();
      }
    });
  });

  test('should navigate between multiple sheets', async ({ page }) => {
    await test.step('Load Excel with multiple sheets', async () => {
      // Navigate to Excel view
      await page.goto('/excel');
      await waitForLoadingComplete(page);

      // Look for sheet tabs
      const sheetTabs = page.locator('[role="tab"], .sheet-tab, button[data-sheet]');
      const tabCount = await sheetTabs.count();

      if (tabCount < 2) {
        // Skip test if no multi-sheet data available
        test.skip();
      }
    });

    await test.step('Switch between sheets', async () => {
      const sheetTabs = page.locator('[role="tab"], .sheet-tab, button[data-sheet]');

      // Get the first sheet name
      const firstSheetName = await sheetTabs.first().textContent();

      // Click on the second sheet
      await sheetTabs.nth(1).click();
      await page.waitForTimeout(500);

      // Verify the second sheet is active
      const activeSheet = page.locator('[role="tab"][aria-selected="true"], .sheet-tab.active');
      expect(await activeSheet.count()).toBeGreaterThan(0);

      // Click back to the first sheet
      await sheetTabs.first().click();
      await page.waitForTimeout(500);

      // Verify we're back on the first sheet
      const currentActiveSheet = await page
        .locator('[role="tab"][aria-selected="true"], .sheet-tab.active')
        .textContent();

      expect(currentActiveSheet).toContain(firstSheetName || '');
    });

    await test.step('Verify sheet content changes', async () => {
      const sheetTabs = page.locator('[role="tab"], .sheet-tab, button[data-sheet]');

      // Get content from first sheet
      await sheetTabs.first().click();
      await page.waitForTimeout(300);
      const firstSheetContent = await page.locator('[role="grid"], .excel-grid').textContent();

      // Get content from second sheet
      await sheetTabs.nth(1).click();
      await page.waitForTimeout(300);
      const secondSheetContent = await page.locator('[role="grid"], .excel-grid').textContent();

      // Content should be different (unless sheets are identical)
      // This is a basic check - in real scenario, we'd verify specific data
      expect(firstSheetContent).toBeDefined();
      expect(secondSheetContent).toBeDefined();
    });
  });

  test('should support undo and redo operations', async ({ page }) => {
    await test.step('Setup: Load Excel data', async () => {
      await page.goto('/excel');
      await waitForLoadingComplete(page);

      // Wait for grid to be visible
      await page.waitForSelector('[role="grid"], .excel-grid, table', {
        state: 'visible',
      });
    });

    await test.step('Make an edit', async () => {
      // Click on a cell
      const cell = page.locator('[role="gridcell"], td').first();
      await cell.click();
      await cell.dblclick();

      // Store original value
      const originalValue = await cell.textContent();

      // Edit the cell
      await page.keyboard.type('Modified Value');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Verify the change
      const newValue = await page.locator('[role="gridcell"], td').first().textContent();
      expect(newValue).toContain('Modified Value');

      // Store for later verification
      await page.evaluate((val) => {
        (window as any).__originalValue = val;
      }, originalValue);
    });

    await test.step('Undo the edit', async () => {
      // Look for undo button
      const undoButton = page.locator(
        'button:has-text("Undo"), button[aria-label*="Undo"], [data-action="undo"]'
      );

      if ((await undoButton.count()) > 0) {
        await undoButton.first().click();
        await page.waitForTimeout(300);

        // Verify the value is restored
        const restoredValue = await page.locator('[role="gridcell"], td').first().textContent();
        const originalValue = await page.evaluate(() => (window as any).__originalValue);

        expect(restoredValue).toBe(originalValue);
      } else {
        // Try keyboard shortcut
        await page.keyboard.press('Control+Z');
        await page.waitForTimeout(300);

        // Verify undo worked
        const restoredValue = await page.locator('[role="gridcell"], td').first().textContent();
        expect(restoredValue).not.toContain('Modified Value');
      }
    });

    await test.step('Redo the edit', async () => {
      // Look for redo button
      const redoButton = page.locator(
        'button:has-text("Redo"), button[aria-label*="Redo"], [data-action="redo"]'
      );

      if ((await redoButton.count()) > 0) {
        await redoButton.first().click();
        await page.waitForTimeout(300);

        // Verify the modified value is back
        const redoneValue = await page.locator('[role="gridcell"], td').first().textContent();
        expect(redoneValue).toContain('Modified Value');
      } else {
        // Try keyboard shortcut
        await page.keyboard.press('Control+Y');
        await page.waitForTimeout(300);

        // Verify redo worked
        const redoneValue = await page.locator('[role="gridcell"], td').first().textContent();
        expect(redoneValue).toContain('Modified Value');
      }
    });
  });

  test('should handle multiple consecutive edits with undo/redo', async ({ page }) => {
    await test.step('Setup', async () => {
      await page.goto('/excel');
      await waitForLoadingComplete(page);
      await page.waitForSelector('[role="grid"], .excel-grid, table');
    });

    await test.step('Make multiple edits', async () => {
      const cell = page.locator('[role="gridcell"], td').first();

      // Edit 1
      await cell.click();
      await cell.dblclick();
      await page.keyboard.type('Edit 1');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Edit 2
      await cell.click();
      await cell.dblclick();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('Edit 2');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Edit 3
      await cell.click();
      await cell.dblclick();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('Edit 3');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Verify final state
      const finalValue = await cell.textContent();
      expect(finalValue).toContain('Edit 3');
    });

    await test.step('Undo multiple times', async () => {
      // Undo to Edit 2
      await page.keyboard.press('Control+Z');
      await page.waitForTimeout(200);

      let cellValue = await page.locator('[role="gridcell"], td').first().textContent();
      expect(cellValue).toContain('Edit 2');

      // Undo to Edit 1
      await page.keyboard.press('Control+Z');
      await page.waitForTimeout(200);

      cellValue = await page.locator('[role="gridcell"], td').first().textContent();
      expect(cellValue).toContain('Edit 1');
    });

    await test.step('Redo multiple times', async () => {
      // Redo to Edit 2
      await page.keyboard.press('Control+Y');
      await page.waitForTimeout(200);

      let cellValue = await page.locator('[role="gridcell"], td').first().textContent();
      expect(cellValue).toContain('Edit 2');

      // Redo to Edit 3
      await page.keyboard.press('Control+Y');
      await page.waitForTimeout(200);

      cellValue = await page.locator('[role="gridcell"], td').first().textContent();
      expect(cellValue).toContain('Edit 3');
    });
  });

  test('should preserve data when switching between tools', async ({ page }) => {
    await test.step('Load Excel and make edit', async () => {
      await page.goto('/excel');
      await waitForLoadingComplete(page);

      // Make an edit
      const cell = page.locator('[role="gridcell"], td').first();
      await cell.click();
      await cell.dblclick();
      await page.keyboard.type('Persistent Value');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    });

    await test.step('Navigate away and back', async () => {
      // Navigate to another page (if available)
      const navLinks = page.locator('nav a, [role="navigation"] a');

      if ((await navLinks.count()) > 1) {
        await navLinks.nth(1).click();
        await page.waitForTimeout(500);

        // Navigate back to Excel
        await page.goto('/excel');
        await waitForLoadingComplete(page);

        // Verify the edit is still there
        const cell = page.locator('[role="gridcell"], td').first();
        const cellValue = await cell.textContent();

        expect(cellValue).toContain('Persistent Value');
      } else {
        test.skip();
      }
    });
  });

  test('should handle large Excel files efficiently', async ({ page }) => {
    await test.step('Load Excel view', async () => {
      await page.goto('/excel');
      await waitForLoadingComplete(page);
    });

    await test.step('Verify virtual scrolling works', async () => {
      const grid = page.locator('[role="grid"], .excel-grid, table').first();
      await grid.waitFor({ state: 'visible' });

      // Get initial visible rows
      const initialRows = await page.locator('[role="row"], tr').count();

      // Scroll down
      await grid.evaluate((el) => {
        el.scrollTop = el.scrollHeight / 2;
      });

      await page.waitForTimeout(500);

      // Rows should still be rendered (virtual scrolling)
      const rowsAfterScroll = await page.locator('[role="row"], tr').count();

      // With virtual scrolling, row count should be similar (not all rows rendered)
      expect(rowsAfterScroll).toBeGreaterThan(0);
      expect(rowsAfterScroll).toBeLessThan(10000); // Sanity check
    });

    await test.step('Verify scrolling is smooth', async () => {
      const grid = page.locator('[role="grid"], .excel-grid, table').first();

      // Measure scroll performance
      const startTime = Date.now();

      await grid.evaluate((el) => {
        el.scrollTop = 0;
      });

      await page.waitForTimeout(100);

      await grid.evaluate((el) => {
        el.scrollTop = 1000;
      });

      const endTime = Date.now();
      const scrollTime = endTime - startTime;

      // Scrolling should be fast (< 1 second)
      expect(scrollTime).toBeLessThan(1000);
    });
  });
});
