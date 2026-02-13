# E2E Tests for ChaTtoEdit

This directory contains end-to-end (E2E) tests using Playwright, focusing on mobile UI integration testing.

## Test Coverage

### Mobile UI Integration Tests (`mobile-ui.spec.ts`)

Tests the following requirements:
- **Requirement 2.1.1**: Excel grid responsive behavior and smooth scrolling
- **Requirement 2.2.1**: Chat interface full-screen modal on mobile
- **Requirement 2.3.1**: Mobile navigation (hamburger menu, bottom nav, swipe gestures)

#### Test Suites:

1. **Responsive Breakpoints**
   - Mobile layout (<768px)
   - Tablet layout (768px-1024px)
   - Desktop layout (>1024px)
   - Orientation changes

2. **Touch Gestures**
   - Tap gestures on interactive elements
   - Long-press for cell editing
   - Swipe gestures for navigation
   - Pinch-to-zoom on Excel grid

3. **Touch Target Sizes**
   - Minimum 44x44px for all buttons (iOS HIG standard)
   - Adequate spacing between touch targets
   - Navigation items meet size requirements

4. **Mobile Navigation**
   - Hamburger menu open/close
   - Bottom navigation bar
   - Active item highlighting
   - Safe area insets for notched devices

5. **Excel Grid Responsiveness**
   - Horizontal and vertical scrolling
   - Cell size on mobile
   - Cell selection with touch

6. **Chat Interface**
   - Full-screen display on mobile
   - Input field visibility with keyboard
   - Accessible send button

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

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Debug Tests
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test e2e/mobile-ui.spec.ts
```

### Run Specific Test Suite
```bash
npx playwright test e2e/mobile-ui.spec.ts -g "Mobile Navigation"
```

## Test Devices

The tests run on the following device emulations:

- **Mobile Chrome**: Pixel 5 (393x851)
- **Mobile Safari**: iPhone 12 (390x844)
- **Tablet**: iPad Pro (1024x1366)
- **Desktop**: Chrome (1920x1080)

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports are generated in:
- `playwright-report/` - HTML report
- `test-results/` - JSON results and artifacts

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Single worker for stability
- Screenshot on failure
- Video recording on failure
- Trace on first retry

## Writing New Tests

When adding new mobile UI tests:

1. Use mobile viewport: `await page.setViewportSize({ width: 375, height: 667 })`
2. Test touch interactions: `await element.tap()`
3. Verify touch target sizes: minimum 44x44px
4. Test on multiple devices: Mobile Chrome, Mobile Safari, Tablet
5. Include accessibility checks where applicable

## Troubleshooting

### Tests Timing Out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connectivity

### Elements Not Found
- Add wait conditions: `await page.waitForLoadState('networkidle')`
- Use more specific selectors
- Check if element is in viewport

### Flaky Tests
- Add explicit waits: `await page.waitForTimeout(300)`
- Use `waitForSelector` instead of immediate assertions
- Increase retry count in CI

## Best Practices

1. **Always set viewport** for mobile tests
2. **Use semantic selectors** (role, aria-label) over CSS classes
3. **Test real user flows** not implementation details
4. **Keep tests independent** - each test should work in isolation
5. **Use page object pattern** for complex pages (future improvement)
6. **Add descriptive test names** that explain what is being tested
7. **Clean up after tests** if they create data

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement page object pattern
- [ ] Add performance metrics collection
- [ ] Test offline functionality
- [ ] Add more gesture combinations
- [ ] Test accessibility with screen readers
