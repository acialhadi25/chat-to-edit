import { test, expect } from '@playwright/test';

/**
 * Setup Verification Test
 * 
 * This test verifies that Playwright is correctly configured
 * and can run basic mobile UI tests.
 */

test.describe('Playwright Setup Verification', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should support mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify viewport is set correctly
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
  });

  test('should support touch events', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find any tappable element
    const body = page.locator('body');
    
    // Verify tap works without errors
    await body.tap({ position: { x: 100, y: 100 } });
    
    // If we got here, touch events work
    expect(true).toBe(true);
  });

  test('should take screenshots on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    const screenshot = await page.screenshot();
    
    // Verify screenshot was taken
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });
});
