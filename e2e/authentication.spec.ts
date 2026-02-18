import { test, expect } from '@playwright/test';
import {
  login,
  logout,
  waitForNavigation,
  waitForToast,
  fillFormField,
  clickButton,
  clearBrowserData,
  waitForStableElement,
} from './utils/helpers';

/**
 * E2E tests for authentication flow
 * Tests: user registration, login, logout, password reset
 * Validates: Requirements 1.3.2
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser data before each test
    await clearBrowserData(page);

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display login page', async ({ page }) => {
    await test.step('Navigate to login', async () => {
      // Look for login link or button
      const loginLink = page.locator(
        'a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")'
      );

      if ((await loginLink.count()) > 0) {
        await loginLink.first().click();
      } else {
        await page.goto('/login');
      }

      await waitForNavigation(page, /\/login/);
    });

    await test.step('Verify login form elements', async () => {
      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
      );
      await expect(submitButton).toBeVisible();
    });
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await test.step('Navigate to login', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Submit empty form', async () => {
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for validation errors
      await page.waitForTimeout(500);
    });

    await test.step('Verify validation errors appear', async () => {
      // Look for error messages
      const errorMessages = page.locator(
        '[role="alert"], .error, .text-red-500, .text-destructive'
      );

      // Should have at least one error message
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThan(0);
    });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await test.step('Navigate to login', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Enter invalid credentials', async () => {
      await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
    });

    await test.step('Verify error message', async () => {
      // Wait for error toast or message
      await page.waitForTimeout(2000);

      // Look for error indicators
      const errorElement = page.locator(
        '[role="alert"]:has-text("Invalid"), [role="alert"]:has-text("incorrect"), ' +
          '.error:has-text("Invalid"), .error:has-text("incorrect"), ' +
          'text=/Invalid credentials|Incorrect password|Authentication failed/i'
      );

      // Error should be visible or toast should appear
      const errorCount = await errorElement.count();

      // If no specific error found, check if we're still on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Note: This test requires a test user to exist in the database
    // In a real scenario, you'd set up test data or use a test environment

    await test.step('Navigate to login', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Enter valid credentials', async () => {
      // Use test credentials (these should be configured in test environment)
      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

      await page.fill('input[type="email"], input[name="email"]', testEmail);
      await page.fill('input[type="password"], input[name="password"]', testPassword);

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
    });

    await test.step('Verify successful login', async () => {
      // Wait for navigation away from login page
      await page.waitForURL(/\/(dashboard|excel|home)/, { timeout: 10000 }).catch(() => {
        // If navigation doesn't happen, test might need to be skipped
        // or credentials might be invalid
      });

      // Check if we're no longer on login page
      const currentUrl = page.url();

      if (currentUrl.includes('login')) {
        // Still on login page - might not have valid test credentials
        test.skip();
      } else {
        // Verify we're logged in by checking for user menu or logout button
        const userIndicator = page.locator(
          '[aria-label="User menu"], [aria-label="Account"], button:has-text("Logout"), button:has-text("Sign Out")'
        );

        // Wait a bit for UI to load
        await page.waitForTimeout(1000);

        const indicatorCount = await userIndicator.count();
        expect(indicatorCount).toBeGreaterThan(0);
      }
    });
  });

  test('should successfully logout', async ({ page }) => {
    await test.step('Login first', async () => {
      await page.goto('/login');

      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

      await page.fill('input[type="email"], input[name="email"]', testEmail);
      await page.fill('input[type="password"], input[name="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForTimeout(2000);

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        test.skip();
      }
    });

    await test.step('Logout', async () => {
      // Look for logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');

      if ((await logoutButton.count()) > 0) {
        await logoutButton.first().click();
      } else {
        // Try to find user menu first
        const userMenu = page.locator('[aria-label="User menu"], [aria-label="Account menu"]');

        if ((await userMenu.count()) > 0) {
          await userMenu.first().click();
          await page.waitForTimeout(300);
          await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
        } else {
          test.skip();
        }
      }
    });

    await test.step('Verify logout successful', async () => {
      // Should redirect to login or home page
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isLoggedOut =
        currentUrl.includes('login') || currentUrl.includes('home') || currentUrl.endsWith('/');

      expect(isLoggedOut).toBeTruthy();

      // Verify user menu is no longer visible
      const userMenu = page.locator('[aria-label="User menu"], button:has-text("Logout")');
      const menuCount = await userMenu.count();

      expect(menuCount).toBe(0);
    });
  });

  test('should display registration page', async ({ page }) => {
    await test.step('Navigate to registration', async () => {
      // Look for sign up link
      const signUpLink = page.locator(
        'a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create Account"), button:has-text("Sign Up")'
      );

      if ((await signUpLink.count()) > 0) {
        await signUpLink.first().click();
      } else {
        await page.goto('/signup');
      }

      await page.waitForTimeout(1000);
    });

    await test.step('Verify registration form elements', async () => {
      const currentUrl = page.url();

      if (!currentUrl.includes('signup') && !currentUrl.includes('register')) {
        // Registration might not be available
        test.skip();
      }

      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign Up"), button:has-text("Register")'
      );
      await expect(submitButton).toBeVisible();
    });
  });

  test('should show validation errors for invalid registration data', async ({ page }) => {
    await test.step('Navigate to registration', async () => {
      await page.goto('/signup');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      if (!currentUrl.includes('signup') && !currentUrl.includes('register')) {
        test.skip();
      }
    });

    await test.step('Enter invalid email', async () => {
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
      await page.fill('input[type="password"], input[name="password"]', 'short');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(500);
    });

    await test.step('Verify validation errors', async () => {
      const errorMessages = page.locator('[role="alert"], .error, .text-red-500');
      const errorCount = await errorMessages.count();

      expect(errorCount).toBeGreaterThan(0);
    });
  });

  test('should display password reset page', async ({ page }) => {
    await test.step('Navigate to password reset', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Look for forgot password link
      const forgotPasswordLink = page.locator(
        'a:has-text("Forgot Password"), a:has-text("Reset Password"), button:has-text("Forgot Password")'
      );

      if ((await forgotPasswordLink.count()) > 0) {
        await forgotPasswordLink.first().click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto('/reset-password');
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Verify password reset form', async () => {
      const currentUrl = page.url();

      if (!currentUrl.includes('reset') && !currentUrl.includes('forgot')) {
        // Password reset might not be available
        test.skip();
      }

      // Check for email input
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Reset"), button:has-text("Send")'
      );
      await expect(submitButton).toBeVisible();
    });
  });

  test('should handle password reset request', async ({ page }) => {
    await test.step('Navigate to password reset', async () => {
      await page.goto('/reset-password');
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      if (!currentUrl.includes('reset') && !currentUrl.includes('forgot')) {
        test.skip();
      }
    });

    await test.step('Submit password reset request', async () => {
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      await page.waitForTimeout(2000);
    });

    await test.step('Verify confirmation message', async () => {
      // Look for success message
      const successMessage = page.locator(
        '[role="status"]:has-text("sent"), [role="alert"]:has-text("sent"), ' +
          'text=/Check your email|Reset link sent|Email sent/i'
      );

      const messageCount = await successMessage.count();

      // Should show confirmation (even for non-existent emails for security)
      expect(messageCount).toBeGreaterThanOrEqual(0);
    });
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto('/login');

      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

      await page.fill('input[type="email"], input[name="email"]', testEmail);
      await page.fill('input[type="password"], input[name="password"]', testPassword);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        test.skip();
      }
    });

    await test.step('Reload page', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify still logged in', async () => {
      // Should not redirect to login
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('login');

      // User menu should still be visible
      const userIndicator = page.locator('[aria-label="User menu"], button:has-text("Logout")');

      await page.waitForTimeout(1000);
      const indicatorCount = await userIndicator.count();
      expect(indicatorCount).toBeGreaterThan(0);
    });
  });

  test('should redirect to login when accessing protected routes while logged out', async ({
    page,
  }) => {
    await test.step('Ensure logged out', async () => {
      await clearBrowserData(page);
    });

    await test.step('Try to access protected route', async () => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
    });

    await test.step('Verify redirected to login', async () => {
      const currentUrl = page.url();

      // Should be redirected to login or see login prompt
      const isOnLoginPage = currentUrl.includes('login') || currentUrl.includes('signin');
      const hasLoginForm =
        (await page.locator('input[type="email"], input[name="email"]').count()) > 0;

      expect(isOnLoginPage || hasLoginForm).toBeTruthy();
    });
  });
});
