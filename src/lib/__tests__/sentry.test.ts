import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import { 
  initSentry, 
  trackExcelOperation, 
  setUserContext, 
  clearUserContext,
  addBreadcrumb 
} from '../sentry';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('Sentry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
    import.meta.env.MODE = 'test';
  });

  describe('initSentry', () => {
    it('should initialize Sentry with correct configuration', () => {
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
          tracesSampleRate: 1.0, // 100% in non-production
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        })
      );
    });

    it('should not initialize Sentry if DSN is not configured', () => {
      import.meta.env.VITE_SENTRY_DSN = '';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sentry DSN not configured. Skipping Sentry initialization.'
      );

      consoleSpy.mockRestore();
    });

    it('should filter out PII in beforeSend', () => {
      initSentry();

      const initCall = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      const event = {
        user: {
          id: '123',
          email: 'test@example.com',
          ip_address: '192.168.1.1',
        },
        breadcrumbs: [
          {
            data: {
              email: 'test@example.com',
              password: 'secret',
              token: 'abc123',
              safeData: 'keep this',
            },
          },
        ],
      };

      const sanitized = beforeSend(event);

      expect(sanitized.user).toEqual({ id: '123' });
      expect(sanitized.breadcrumbs[0].data).toEqual({ safeData: 'keep this' });
    });
  });

  describe('trackExcelOperation', () => {
    it('should track Excel operation with correct metadata', () => {
      trackExcelOperation('sortData', 150, {
        rowCount: 100,
        columnCount: 5,
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Excel Operation: sortData',
        expect.objectContaining({
          level: 'info',
          tags: {
            operation: 'sortData',
            performance: 'fast',
          },
          extra: {
            duration: 150,
            rowCount: 100,
            columnCount: 5,
          },
        })
      );
    });

    it('should categorize performance correctly', () => {
      // Fast operation (< 1000ms)
      trackExcelOperation('fast', 500);
      expect((Sentry.captureMessage as ReturnType<typeof vi.fn>).mock.calls[0][1].tags.performance).toBe('fast');

      // Medium operation (1000-5000ms)
      trackExcelOperation('medium', 3000);
      expect((Sentry.captureMessage as ReturnType<typeof vi.fn>).mock.calls[1][1].tags.performance).toBe('medium');

      // Slow operation (> 5000ms)
      trackExcelOperation('slow', 6000);
      expect((Sentry.captureMessage as ReturnType<typeof vi.fn>).mock.calls[2][1].tags.performance).toBe('slow');
    });
  });

  describe('setUserContext', () => {
    it('should set user context without PII', () => {
      setUserContext('user-123', { plan: 'pro' });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        plan: 'pro',
      });
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with correct data', () => {
      addBreadcrumb('User clicked button', 'ui', 'info', { buttonId: 'submit' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User clicked button',
          category: 'ui',
          level: 'info',
          data: { buttonId: 'submit' },
        })
      );
    });
  });
});
