/**
 * Unit Tests for VersionHistory Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionHistory } from '../VersionHistory';
import { storageService } from '@/services/storageService';
import type { Version } from '@/services/storageService';

// Mock dependencies
vi.mock('@/services/storageService', () => ({
  storageService: {
    getVersionHistory: vi.fn(),
    saveVersion: vi.fn(),
    restoreVersion: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('VersionHistory', () => {
  const mockVersions: Version[] = [
    {
      id: 'version-1',
      workbook_id: 'workbook-123',
      user_id: 'user-123',
      snapshot: { id: 'workbook-123', name: 'Test', sheets: {} },
      description: 'First version',
      created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'version-2',
      workbook_id: 'workbook-123',
      user_id: 'user-123',
      snapshot: { id: 'workbook-123', name: 'Test', sheets: {} },
      description: 'Second version',
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render version history', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);

    render(<VersionHistory workbookId="workbook-123" />);

    await waitFor(() => {
      expect(screen.getByText('First version')).toBeInTheDocument();
      expect(screen.getByText('Second version')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(storageService.getVersionHistory).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<VersionHistory workbookId="workbook-123" />);

    expect(screen.getByText('Loading versions...')).toBeInTheDocument();
  });

  it('should show empty state when no versions', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue([]);

    render(<VersionHistory workbookId="workbook-123" />);

    await waitFor(() => {
      expect(screen.getByText('No versions yet')).toBeInTheDocument();
    });
  });

  it('should show error state on load failure', async () => {
    vi.mocked(storageService.getVersionHistory).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<VersionHistory workbookId="workbook-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should open create version dialog', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);

    render(<VersionHistory workbookId="workbook-123" />);

    const saveButton = await screen.findByRole('button', { name: /save version/i });
    fireEvent.click(saveButton);

    expect(screen.getByText('Create a snapshot of the current workbook state')).toBeInTheDocument();
  });

  it('should create new version', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);
    vi.mocked(storageService.saveVersion).mockResolvedValue('version-3');

    render(<VersionHistory workbookId="workbook-123" />);

    // Open dialog
    const saveButton = await screen.findByRole('button', { name: /save version/i });
    fireEvent.click(saveButton);

    // Enter description
    const input = screen.getByPlaceholderText('Enter version description...');
    fireEvent.change(input, { target: { value: 'New version' } });

    // Save
    const confirmButton = screen.getByRole('button', { name: /^save version$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(storageService.saveVersion).toHaveBeenCalledWith(
        'workbook-123',
        'New version'
      );
    });
  });

  it('should not create version with empty description', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);

    render(<VersionHistory workbookId="workbook-123" />);

    // Open dialog
    const saveButton = await screen.findByRole('button', { name: /save version/i });
    fireEvent.click(saveButton);

    // Try to save without description
    const confirmButton = screen.getByRole('button', { name: /^save version$/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should restore version', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);
    vi.mocked(storageService.restoreVersion).mockResolvedValue(mockVersions[0].snapshot);

    const onVersionRestore = vi.fn();
    render(<VersionHistory workbookId="workbook-123" onVersionRestore={onVersionRestore} />);

    await waitFor(() => {
      expect(screen.getByText('First version')).toBeInTheDocument();
    });

    // Click restore button
    const restoreButtons = screen.getAllByRole('button', { name: /restore/i });
    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(storageService.restoreVersion).toHaveBeenCalledWith(
        'workbook-123',
        'version-1'
      );
      expect(onVersionRestore).toHaveBeenCalledWith('version-1');
    });
  });

  it('should show relative timestamps', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);

    render(<VersionHistory workbookId="workbook-123" />);

    await waitFor(() => {
      expect(screen.getAllByText(/ago/).length).toBeGreaterThan(0);
    });
  });

  it('should handle restore error', async () => {
    vi.mocked(storageService.getVersionHistory).mockResolvedValue(mockVersions);
    vi.mocked(storageService.restoreVersion).mockRejectedValue(
      new Error('Restore failed')
    );

    render(<VersionHistory workbookId="workbook-123" />);

    await waitFor(() => {
      expect(screen.getByText('First version')).toBeInTheDocument();
    });

    // Click restore button
    const restoreButtons = screen.getAllByRole('button', { name: /restore/i });
    fireEvent.click(restoreButtons[0]);

    await waitFor(() => {
      expect(storageService.restoreVersion).toHaveBeenCalled();
    });
  });
});
