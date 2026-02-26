import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { AIAction } from '@/types/excel';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnOpenChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render DELETE_ROW confirmation dialog', () => {
    const action: AIAction = {
      id: '1',
      type: 'DELETE_ROW',
      description: 'Delete row 2',
      params: {
        target: { ref: '2' },
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Delete Row(s)')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete 1 row/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('should render DELETE_ROW confirmation for multiple rows', () => {
    const action: AIAction = {
      id: '1',
      type: 'DELETE_ROW',
      description: 'Delete rows 2, 3, 4',
      params: {
        target: { ref: '2,3,4' },
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/permanently delete 3 rows/i)).toBeInTheDocument();
  });

  it('should render DELETE_COLUMN confirmation dialog', () => {
    const action: AIAction = {
      id: '2',
      type: 'DELETE_COLUMN',
      description: 'Delete Status column',
      params: {
        columnName: 'Status',
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Delete Column')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete the "Status" column/i)).toBeInTheDocument();
  });

  it('should render REMOVE_EMPTY_ROWS confirmation dialog', () => {
    const action: AIAction = {
      id: '3',
      type: 'REMOVE_EMPTY_ROWS',
      description: 'Remove empty rows',
      params: {},
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Remove Empty Rows')).toBeInTheDocument();
    expect(screen.getByText(/permanently remove all empty rows/i)).toBeInTheDocument();
  });

  it('should render DATA_TRANSFORM confirmation dialog', () => {
    const action: AIAction = {
      id: '4',
      type: 'DATA_TRANSFORM',
      description: 'Transform column A to uppercase',
      params: {
        target: { ref: 'A' },
        transformType: 'uppercase',
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Transform Data')).toBeInTheDocument();
    expect(screen.getByText(/transform all text in A to uppercase/i)).toBeInTheDocument();
    expect(screen.getByText(/original values will be replaced/i)).toBeInTheDocument();
  });

  it('should call onConfirm when Confirm button is clicked', () => {
    const action: AIAction = {
      id: '1',
      type: 'DELETE_ROW',
      description: 'Delete row 2',
      params: {
        target: { ref: '2' },
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Cancel button is clicked', () => {
    const action: AIAction = {
      id: '1',
      type: 'DELETE_ROW',
      description: 'Delete row 2',
      params: {
        target: { ref: '2' },
      },
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not render when open is false', () => {
    const action: AIAction = {
      id: '1',
      type: 'DELETE_ROW',
      description: 'Delete row 2',
      params: {
        target: { ref: '2' },
      },
    };

    const { container } = render(
      <ConfirmationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // AlertDialog should not render content when closed
    expect(container.querySelector('[role="alertdialog"]')).not.toBeInTheDocument();
  });

  it('should not render when action is null', () => {
    const { container } = render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={null}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render generic confirmation for unknown action types', () => {
    const action: AIAction = {
      id: '5',
      type: 'UNKNOWN_ACTION' as any,
      description: 'Unknown action',
      params: {},
    };

    render(
      <ConfirmationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        action={action}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText(/execute this UNKNOWN_ACTION action/i)).toBeInTheDocument();
  });
});
