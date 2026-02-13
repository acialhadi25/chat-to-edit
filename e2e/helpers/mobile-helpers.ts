import { Page, Locator } from '@playwright/test';

/**
 * Mobile test helper utilities
 */

export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

/**
 * Set viewport to mobile size
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize(VIEWPORTS.mobile);
}

/**
 * Set viewport to tablet size
 */
export async function setTabletViewport(page: Page) {
  await page.setViewportSize(VIEWPORTS.tablet);
}

/**
 * Set viewport to desktop size
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize(VIEWPORTS.desktop);
}

/**
 * Check if element meets minimum touch target size (iOS HIG: 44x44px)
 */
export async function checkTouchTargetSize(
  element: Locator,
  minWidth = 44,
  minHeight = 44
): Promise<{ width: number; height: number; meetsRequirement: boolean }> {
  const box = await element.boundingBox();
  
  if (!box) {
    throw new Error('Element not found or not visible');
  }
  
  return {
    width: box.width,
    height: box.height,
    meetsRequirement: box.width >= minWidth && box.height >= minHeight,
  };
}

/**
 * Simulate a swipe gesture
 */
export async function swipe(
  page: Page,
  element: Locator,
  direction: 'left' | 'right' | 'up' | 'down',
  distance = 100
) {
  const box = await element.boundingBox();
  
  if (!box) {
    throw new Error('Element not found for swipe');
  }
  
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  
  let endX = startX;
  let endY = startY;
  
  switch (direction) {
    case 'left':
      endX = startX - distance;
      break;
    case 'right':
      endX = startX + distance;
      break;
    case 'up':
      endY = startY - distance;
      break;
    case 'down':
      endY = startY + distance;
      break;
  }
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();
}

/**
 * Simulate a long press gesture
 */
export async function longPress(element: Locator, duration = 600) {
  await element.dispatchEvent('touchstart');
  await element.page().waitForTimeout(duration);
  await element.dispatchEvent('touchend');
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(element: Locator): Promise<boolean> {
  return await element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Wait for element to be in viewport
 */
export async function waitForElementInViewport(
  element: Locator,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await isInViewport(element)) {
      return;
    }
    await element.page().waitForTimeout(100);
  }
  
  throw new Error('Element did not enter viewport within timeout');
}

/**
 * Scroll element into view smoothly
 */
export async function scrollIntoView(element: Locator) {
  await element.evaluate((el) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await element.page().waitForTimeout(300); // Wait for scroll animation
}

/**
 * Get computed style property
 */
export async function getComputedStyle(
  element: Locator,
  property: string
): Promise<string> {
  return await element.evaluate(
    (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
    property
  );
}

/**
 * Check if element has safe area insets
 */
export async function hasSafeAreaInsets(element: Locator): Promise<boolean> {
  const paddingBottom = await getComputedStyle(element, 'padding-bottom');
  const paddingTop = await getComputedStyle(element, 'padding-top');
  
  // Check if padding includes env() or constant() for safe area
  return (
    paddingBottom.includes('env(') ||
    paddingBottom.includes('constant(') ||
    paddingTop.includes('env(') ||
    paddingTop.includes('constant(')
  );
}

/**
 * Simulate device orientation change
 */
export async function rotateDevice(page: Page) {
  const viewport = page.viewportSize();
  
  if (!viewport) {
    throw new Error('No viewport set');
  }
  
  // Swap width and height
  await page.setViewportSize({
    width: viewport.height,
    height: viewport.width,
  });
}

/**
 * Check if element is scrollable
 */
export async function isScrollable(element: Locator): Promise<{
  horizontal: boolean;
  vertical: boolean;
}> {
  return await element.evaluate((el) => {
    return {
      horizontal: el.scrollWidth > el.clientWidth,
      vertical: el.scrollHeight > el.clientHeight,
    };
  });
}

/**
 * Get distance between two elements
 */
export async function getDistanceBetweenElements(
  element1: Locator,
  element2: Locator
): Promise<number> {
  const box1 = await element1.boundingBox();
  const box2 = await element2.boundingBox();
  
  if (!box1 || !box2) {
    throw new Error('One or both elements not found');
  }
  
  // Calculate vertical distance
  if (box2.y > box1.y + box1.height) {
    return box2.y - (box1.y + box1.height);
  } else if (box1.y > box2.y + box2.height) {
    return box1.y - (box2.y + box2.height);
  }
  
  // Calculate horizontal distance
  if (box2.x > box1.x + box1.width) {
    return box2.x - (box1.x + box1.width);
  } else if (box1.x > box2.x + box2.width) {
    return box1.x - (box2.x + box2.width);
  }
  
  return 0; // Elements overlap
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, duration = 300) {
  await page.waitForTimeout(duration);
}

/**
 * Check if keyboard is visible (approximation)
 */
export async function isKeyboardVisible(page: Page): Promise<boolean> {
  // Check if viewport height has decreased (keyboard appeared)
  const viewport = page.viewportSize();
  const windowHeight = await page.evaluate(() => window.innerHeight);
  
  if (!viewport) {
    return false;
  }
  
  return windowHeight < viewport.height * 0.8;
}

/**
 * Navigate to a page and wait for it to be ready
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Additional buffer for animations
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  fullPage = false
) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage,
  });
}
