import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * 
 * Features:
 * - Error tracking with stack traces
 * - Performance monitoring (Core Web Vitals)
 * - Session replay for debugging
 * - Custom metrics for Excel operations
 */
export function initSentry() {
  // Only initialize in production or if explicitly enabled
  const isProduction = import.meta.env.MODE === 'production';
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Skipping Sentry initialization.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    
    // Performance sampling rates
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
    
    // Session Replay sampling rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Filter out PII before sending to Sentry
    beforeSend(event) {
      // Remove user email and IP address
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove any potential PII from breadcrumb data
            const sanitized = { ...breadcrumb.data };
            delete sanitized.email;
            delete sanitized.password;
            delete sanitized.token;
            return { ...breadcrumb, data: sanitized };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignore common errors that don't need tracking
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // ResizeObserver loop errors (benign)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });
}

/**
 * Track custom Excel operation metrics
 * 
 * @param operation - Name of the Excel operation (e.g., 'sort', 'filter', 'merge')
 * @param duration - Duration in milliseconds
 * @param metadata - Additional metadata (rowCount, columnCount, etc.)
 */
export function trackExcelOperation(
  operation: string,
  duration: number,
  metadata?: {
    rowCount?: number;
    columnCount?: number;
    fileSize?: number;
    [key: string]: unknown;
  }
) {
  Sentry.captureMessage(`Excel Operation: ${operation}`, {
    level: 'info',
    tags: {
      operation,
      performance: duration < 1000 ? 'fast' : duration < 5000 ? 'medium' : 'slow',
    },
    extra: {
      duration,
      ...metadata,
    },
  });
}

/**
 * Track Core Web Vitals (LCP, FID, CLS)
 * 
 * This function sets up performance observers to track:
 * - Largest Contentful Paint (LCP): Loading performance
 * - First Input Delay (FID): Interactivity
 * - Cumulative Layout Shift (CLS): Visual stability
 */
export function trackWebVitals() {
  // Check if PerformanceObserver is supported
  if (typeof PerformanceObserver === 'undefined') {
    console.warn('PerformanceObserver not supported. Web Vitals tracking disabled.');
    return;
  }

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
      
      Sentry.captureMessage('Web Vital: LCP', {
        level: 'info',
        tags: {
          metric: 'lcp',
          rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
        },
        extra: {
          value: lcp,
          unit: 'ms',
        },
      });
    });
    
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.warn('Failed to observe LCP:', error);
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        
        Sentry.captureMessage('Web Vital: FID', {
          level: 'info',
          tags: {
            metric: 'fid',
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
          },
          extra: {
            value: fid,
            unit: 'ms',
          },
        });
      });
    });
    
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.warn('Failed to observe FID:', error);
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      });
      
      // Report CLS when page is hidden or unloaded
      if (document.visibilityState === 'hidden') {
        Sentry.captureMessage('Web Vital: CLS', {
          level: 'info',
          tags: {
            metric: 'cls',
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          },
          extra: {
            value: clsValue,
            unit: 'score',
          },
        });
      }
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    
    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        Sentry.captureMessage('Web Vital: CLS', {
          level: 'info',
          tags: {
            metric: 'cls',
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
          },
          extra: {
            value: clsValue,
            unit: 'score',
          },
        });
      }
    });
  } catch (error) {
    console.warn('Failed to observe CLS:', error);
  }
}

/**
 * Set user context for Sentry
 * 
 * @param userId - User ID (should not contain PII)
 * @param metadata - Additional user metadata (no PII)
 */
export function setUserContext(userId: string, metadata?: Record<string, unknown>) {
  Sentry.setUser({
    id: userId,
    ...metadata,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'ui', 'navigation', 'excel')
 * @param level - Severity level
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Type definitions for Web Vitals
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
