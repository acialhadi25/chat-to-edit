/**
 * Unit Tests for SaveStatusIndicator Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SaveStatusIndicator } from '../SaveStatusIndicator';
import { storageService } from '@/services/storageService';

// Mock the storage service
vi.mock('@/services/storageService', () => ({
  storageService: {
    getSaveStatus: vi.fn(),
    onStatusChange: vi.fn(),
  },
}));

describe('SaveStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'idle',
      lastSaved: null,
      error: null,
    });
    vi.mocked(storageService.onStatusChange).mockReturnValue(() => {});
  });

  it('should not render when status is idle', () => {
    const { container } = render(<SaveStatusIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render saving status', () => {
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saving',
      lastSaved: null,
      error: null,
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should render saved status', () => {
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved: new Date(),
      error: null,
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should render error status', () => {
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'error',
      lastSaved: null,
      error: 'Database connection failed',
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should show last saved time', () => {
    const lastSaved = new Date(Date.now() - 120000); // 2 minutes ago
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved,
      error: null,
    });

    render(<SaveStatusIndicator showLastSaved={true} />);
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('should hide last saved time when disabled', () => {
    const lastSaved = new Date(Date.now() - 120000);
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved,
      error: null,
    });

    render(<SaveStatusIndicator showLastSaved={false} />);
    expect(screen.queryByText('2m ago')).not.toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved: new Date(),
      error: null,
    });

    const { container } = render(<SaveStatusIndicator compact={true} />);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should subscribe to status changes', () => {
    render(<SaveStatusIndicator />);
    expect(storageService.onStatusChange).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    vi.mocked(storageService.onStatusChange).mockReturnValue(unsubscribe);

    const { unmount } = render(<SaveStatusIndicator />);
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should become visible when status changes', () => {
    let statusCallback: ((status: any) => void) | null = null;

    vi.mocked(storageService.onStatusChange).mockImplementation((callback) => {
      statusCallback = callback;
      // Immediately trigger the callback to simulate status change
      callback({
        status: 'saved',
        lastSaved: new Date(),
        error: null,
      });
      return () => {};
    });

    const { container } = render(<SaveStatusIndicator autoHideDelay={1000} />);

    // Should be visible after status change
    expect(container.querySelector('.opacity-100')).toBeInTheDocument();
  });

  it('should format last saved time correctly', () => {
    // Test "just now"
    const justNow = new Date(Date.now() - 30000); // 30 seconds ago
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved: justNow,
      error: null,
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('should format minutes ago correctly', () => {
    const twoMinutesAgo = new Date(Date.now() - 120000);
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved: twoMinutesAgo,
      error: null,
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('should format hours ago correctly', () => {
    const twoHoursAgo = new Date(Date.now() - 7200000);
    vi.mocked(storageService.getSaveStatus).mockReturnValue({
      status: 'saved',
      lastSaved: twoHoursAgo,
      error: null,
    });

    render(<SaveStatusIndicator />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });
});
