import { Page, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E test helper utilities for ChaTtoEdit
 * Provides common functions for authentication, file operations, and waiting
 */

/**
 * Login helper function
 * Authenticates a user with email and password
 */
export async function login(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'testpassword123'
): Promise<void> {
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"], input[type="email"]', {
    state: 'visible',
  });

  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|excel|home)/, { timeout: 10000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button or user menu
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');

  if ((await logoutButton.count()) > 0) {
    await logoutButton.first().click();
  } else {
    // Try to find user menu first
    const userMenu = page.locator('[aria-label="User menu"], [aria-label="Account menu"]');
    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
    }
  }

  // Wait for redirect to login page
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

/**
 * File upload helper function
 * Uploads a file using the file input element
 */
export async function uploadFile(
  page: Page,
  filePath: string,
  inputSelector: string = 'input[type="file"]'
): Promise<void> {
  // Resolve the file path relative to the e2e directory
  const absolutePath = path.resolve(process.cwd(), filePath);

  // Wait for file input to be present
  await page.waitForSelector(inputSelector, { state: 'attached' });

  // Upload the file
  await page.setInputFiles(inputSelector, absolutePath);

  // Wait a bit for the upload to be processed
  await page.waitForTimeout(500);
}

/**
 * Upload Excel file helper
 * Specialized helper for uploading Excel files
 */
export async function uploadExcelFile(page: Page, fileName: string = 'sample.xlsx'): Promise<void> {
  const filePath = `e2e/fixtures/${fileName}`;
  await uploadFile(page, filePath);

  // Wait for Excel grid to appear
  await page.waitForSelector('[role="grid"], .excel-grid', {
    state: 'visible',
    timeout: 10000,
  });

  // Wait for data to be loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be visible and stable
 * Useful for elements that might animate or load dynamically
 */
export async function waitForStableElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });

  // Wait for element to stop moving (animations complete)
  await page.waitForTimeout(300);
}

/**
 * Wait for loading indicators to disappear
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '[data-loading="true"]',
    '.loading',
    '.spinner',
    '[role="progressbar"]',
    '.skeleton',
  ];

  for (const selector of loadingSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();

    if (count > 0) {
      await elements.first().waitFor({ state: 'hidden', timeout: 10000 });
    }
  }
}

/**
 * Wait for API request to complete
 */
export async function waitForAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Wait for toast/notification to appear
 */
export async function waitForToast(
  page: Page,
  message?: string,
  timeout: number = 5000
): Promise<void> {
  const toastSelector = '[role="status"], [role="alert"], .toast, .notification';

  await page.waitForSelector(toastSelector, { state: 'visible', timeout });

  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Wait for modal/dialog to open
 */
export async function waitForModal(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForSelector('[role="dialog"], [role="alertdialog"], .modal', {
    state: 'visible',
    timeout,
  });
}

/**
 * Close modal/dialog
 */
export async function closeModal(page: Page): Promise<void> {
  // Try different methods to close modal
  const closeButton = page.locator(
    'button[aria-label="Close"], button:has-text("Close"), [data-dismiss="modal"]'
  );

  if ((await closeButton.count()) > 0) {
    await closeButton.first().click();
  } else {
    // Try pressing Escape key
    await page.keyboard.press('Escape');
  }

  // Wait for modal to disappear
  await page.waitForSelector('[role="dialog"], [role="alertdialog"], .modal', {
    state: 'hidden',
    timeout: 3000,
  });
}

/**
 * Fill form field by label
 */
export async function fillFormField(page: Page, label: string, value: string): Promise<void> {
  const input = page.locator(`input:near(:text("${label}")), textarea:near(:text("${label}"))`);
  await input.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string, exact: boolean = false): Promise<void> {
  const button = page.locator(`button:has-text("${text}")`, { hasText: exact ? text : undefined });
  await button.click();
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, urlPattern?: string | RegExp): Promise<void> {
  if (urlPattern) {
    await page.waitForURL(urlPattern, { timeout: 10000 });
  }
  await page.waitForLoadState('networkidle');
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const count = await element.count();

  if (count === 0) {
    return false;
  }

  return await element.first().isVisible();
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // Wait for scroll animation
}

/**
 * Get text content of element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Wait for element count to match expected
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await page.locator(selector).count();
    if (count === expectedCount) {
      return;
    }
    await page.waitForTimeout(100);
  }

  throw new Error(
    `Expected ${expectedCount} elements matching "${selector}", but found ${await page.locator(selector).count()}`
  );
}

/**
 * Clear local storage and cookies
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Set local storage item
 */
export async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key, value }
  );
}

/**
 * Get local storage item
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);
}

/**
 * Wait for download to start
 */
export async function waitForDownload(
  page: Page,
  triggerAction: () => Promise<void>
): Promise<string> {
  const downloadPromise = page.waitForEvent('download');
  await triggerAction();
  const download = await downloadPromise;

  // Get the suggested filename
  return download.suggestedFilename();
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Retry action until it succeeds or timeout
 */
export async function retryUntilSuccess<T>(
  action: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Action failed after retries');
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  checkInterval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  throw new Error('Condition not met within timeout');
}
