# E2E Tests for ChaTtoEdit

This directory contains end-to-end (E2E) tests using Playwright, covering critical user journeys and workflows.

## Test Coverage

### 1. Excel Editing Workflow (`excel-workflow.spec.ts`)

Tests the complete Excel editing experience:

- **Upload → Edit → Download flow**: Full workflow from file upload to download
- **Multi-sheet navigation**: Switching between sheets and verifying content
- **Undo/Redo operations**: Single and multiple consecutive edits
- **Data persistence**: Verifying data is preserved when switching tools
- **Virtual scrolling**: Performance with large datasets
- **Validates**: Requirements 1.3.1

### 2. Authentication Flow (`authentication.spec.ts`)

Tests user authentication and account management:

- **Login**: Valid/invalid credentials, validation errors
- **Logout**: Successful logout and session cleanup
- **Registration**: Sign up form and validation
- **Password reset**: Forgot password flow
- **Session persistence**: Authentication across page reloads
- **Protected routes**: Redirect to login when accessing protected pages
- **Validates**: Requirements 1.3.2

### 3. Chat Interaction (`chat-interaction.spec.ts`)

Tests AI chat functionality:

- **Sending messages**: User input and message display
- **Receiving AI responses**: Response rendering and formatting
- **Applying actions**: Executing AI-suggested operations
- **Chat history**: Message persistence and display
- **Typing indicators**: Loading states during AI processing
- **Special characters**: XSS prevention and safe rendering
- **Auto-scroll**: Automatic scrolling to latest messages
- **Validates**: Requirements 1.3.1

### 4. File History (`file-history.spec.ts`)

Tests file persistence and history management:

- **File persistence**: Saving files to local storage
- **Loading previous files**: Restoring files from history
- **Chat history persistence**: Preserving chat with file data
- **History list**: Displaying recent files with metadata
- **Delete operations**: Removing files from history
- **Data restoration**: Recovering data after page reload
- **Validates**: Requirements 1.3.3

### 5. Mobile UI Integration (`mobile-ui.spec.ts`)

Tests mobile responsiveness and touch interactions:

- **Responsive breakpoints**: Mobile, tablet, desktop layouts
- **Touch gestures**: Tap, long-press, swipe, pinch-to-zoom
- **Touch target sizes**: Minimum 44x44px (iOS HIG standard)
- **Mobile navigation**: Hamburger menu, bottom nav, swipe gestures
- **Excel grid responsiveness**: Scrolling and cell interaction
- **Chat interface**: Full-screen modal on mobile
- **Validates**: Requirements 2.1.1, 2.2.1, 2.3.1

## Running Tests

### Install Playwright Browsers

First time setup:

```bash
npx playwright install
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Only Mobile Tests

```bash
npm run test:e2e:mobile
```

### Run Specific Test File

```bash
npx playwright test e2e/excel-workflow.spec.ts
npx playwright test e2e/authentication.spec.ts
npx playwright test e2e/chat-interaction.spec.ts
npx playwright test e2e/file-history.spec.ts
npx playwright test e2e/mobile-ui.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### Run Specific Test Suite

```bash
npx playwright test e2e/excel-workflow.spec.ts -g "should complete full Excel upload"
```

## Test Devices

The tests run on the following device emulations:

- **Chromium**: Desktop Chrome (1920x1080)
- **Firefox**: Desktop Firefox (1920x1080)
- **WebKit**: Desktop Safari (1920x1080)
- **Mobile Chrome**: Pixel 5 (393x851)
- **Mobile Safari**: iPhone 12 (390x844)
- **Tablet**: iPad Pro (1024x1366)

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are generated in:

- `playwright-report/` - HTML report with screenshots and videos
- `test-results/` - JSON results and test artifacts

## CI/CD Integration

Tests are configured to run in CI with:

- **2 retries** on failure for stability
- **Single worker** for consistent results
- **Screenshot on failure** for debugging
- **Video recording on failure** for visual debugging
- **Trace on first retry** for detailed debugging
- **Artifact upload** for screenshots, videos, and traces

### CI Artifacts

When tests fail in CI, the following artifacts are uploaded:

- `playwright-report` - Full HTML report
- `playwright-screenshots` - Screenshots of failures
- `playwright-videos` - Video recordings of failed tests
- `playwright-traces` - Detailed execution traces
- `test-results` - JSON test results

Access artifacts from the GitHub Actions run page.

## Test Utilities

### General Helpers (`utils/helpers.ts`)

- `login()` - Authenticate user
- `logout()` - Sign out user
- `uploadFile()` - Upload files via file input
- `uploadExcelFile()` - Specialized Excel file upload
- `waitForLoadingComplete()` - Wait for loading indicators
- `waitForToast()` - Wait for notifications
- `waitForModal()` - Wait for dialogs to open
- `waitForAPIRequest()` - Wait for specific API calls
- `fillFormField()` - Fill form inputs by label
- `clickButton()` - Click buttons by text
- `clearBrowserData()` - Clear cookies and storage
- `waitForDownload()` - Handle file downloads

### Mobile Helpers (`helpers/mobile-helpers.ts`)

- `setMobileViewport()` - Set mobile screen size
- `checkTouchTargetSize()` - Verify touch target dimensions
- `swipe()` - Simulate swipe gestures
- `longPress()` - Simulate long press
- `isInViewport()` - Check element visibility
- `scrollIntoView()` - Scroll to element
- `rotateDevice()` - Simulate orientation change
- `isScrollable()` - Check if element is scrollable

## Writing New Tests

When adding new E2E tests:

1. **Use semantic selectors**: Prefer `role`, `aria-label` over CSS classes
2. **Test real user flows**: Focus on user journeys, not implementation
3. **Keep tests independent**: Each test should work in isolation
4. **Add descriptive names**: Explain what is being tested
5. **Use test utilities**: Leverage existing helper functions
6. **Handle async properly**: Use proper wait strategies
7. **Test on multiple devices**: Include mobile and desktop
8. **Include accessibility**: Use accessible selectors

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login, waitForLoadingComplete } from './utils/helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
    await page.goto('/');
    await waitForLoadingComplete(page);
  });

  test('should do something', async ({ page }) => {
    await test.step('Step 1: Setup', async () => {
      // Arrange
    });

    await test.step('Step 2: Action', async () => {
      // Act
    });

    await test.step('Step 3: Verify', async () => {
      // Assert
      expect(something).toBeTruthy();
    });
  });
});
```

## Troubleshooting

### Tests Timing Out

- Increase timeout: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity
- Check for infinite loading states

### Elements Not Found

- Add wait conditions: `await page.waitForSelector()`
- Use more specific selectors
- Check if element is in viewport
- Verify element is not hidden by CSS

### Flaky Tests

- Add explicit waits: `await page.waitForTimeout(300)`
- Use `waitForSelector` with proper states
- Increase retry count in CI
- Check for race conditions
- Ensure proper cleanup between tests

### Authentication Issues

- Set test credentials in environment variables:
  - `TEST_USER_EMAIL`
  - `TEST_USER_PASSWORD`
- Ensure test user exists in test database
- Check Supabase configuration
- Verify RLS policies allow test operations

## Best Practices

1. **Always set viewport** for mobile tests
2. **Use semantic selectors** (role, aria-label) over CSS classes
3. **Test real user flows** not implementation details
4. **Keep tests independent** - each test should work in isolation
5. **Use page object pattern** for complex pages (future improvement)
6. **Add descriptive test names** that explain what is being tested
7. **Clean up after tests** if they create data
8. **Use test.step()** for better reporting and debugging
9. **Handle errors gracefully** with proper try-catch where needed
10. **Skip tests** when features are not available instead of failing

## Future Improvements

- [ ] Add visual regression testing with Percy or Chromatic
- [ ] Implement page object pattern for better maintainability
- [ ] Add performance metrics collection
- [ ] Test offline functionality with service workers
- [ ] Add more gesture combinations for mobile
- [ ] Test accessibility with screen readers (axe-playwright)
- [ ] Add API mocking for more reliable tests
- [ ] Implement parallel test execution optimization
- [ ] Add test data factories for consistent test data
- [ ] Create custom Playwright fixtures for common setups

## Environment Variables

Configure these environment variables for testing:

```bash
# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# API endpoints (if different from default)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# CI-specific
CI=true  # Automatically set in GitHub Actions
```

## Contributing

When contributing E2E tests:

1. Follow the existing test structure and patterns
2. Use the provided test utilities
3. Add tests for new features
4. Update this README with new test coverage
5. Ensure tests pass locally before submitting PR
6. Include test scenarios in PR description
7. Add comments for complex test logic

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
