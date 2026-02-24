/**
 * AI Chat Component Tests
 * 
 * Unit tests for AI chat interface functionality.
 * 
 * Requirements: 2.3.6, 2.3.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChat } from '../AIChat';
import { AIService } from '../../../services/aiService';
import type { AIContext, AIResponse } from '../../../types/ai.types';

// Mock AI Service
vi.mock('../../../services/aiService');

describe('AIChat Component', () => {
  let mockAIService: AIService;
  let mockContext: AIContext;
  let mockOnContextUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockContext = {
      currentWorkbook: 'test-workbook',
      currentWorksheet: 'Sheet1',
      currentSelection: 'A1:B10',
      recentOperations: [],
      conversationHistory: [],
    };

    mockOnContextUpdate = vi.fn();

    // Create mock AI service
    mockAIService = {
      processCommand: vi.fn(),
      updateContext: vi.fn(),
      getContext: vi.fn(() => mockContext),
    } as any;
  });

  it('should render chat interface', () => {
    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a command/i)).toBeInTheDocument();
  });

  it('should display current selection in context', () => {
    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    expect(screen.getByText(/Current selection:/i)).toBeInTheDocument();
    expect(screen.getByText('A1:B10')).toBeInTheDocument();
  });

  it('should handle command submission', async () => {
    const mockResponse: AIResponse = {
      success: true,
      message: 'Set A1 to 100',
      operations: [{
        type: 'set_value',
        target: 'A1',
        value: 100,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };

    (mockAIService.processCommand as any).mockResolvedValue(mockResponse);

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    // Type command
    fireEvent.change(input, { target: { value: 'Set A1 to 100' } });
    
    // Submit
    fireEvent.click(submitButton);

    // Wait for response
    await waitFor(() => {
      expect(mockAIService.processCommand).toHaveBeenCalledWith('Set A1 to 100', mockContext);
    });

    // Check message appears (both user and assistant messages)
    await waitFor(() => {
      const messages = screen.getAllByText('Set A1 to 100');
      expect(messages.length).toBeGreaterThanOrEqual(2); // User message + assistant response
    });
  });

  it('should show confirmation dialog for destructive operations', async () => {
    const mockResponse: AIResponse = {
      success: true,
      message: 'delete rows',
      operations: [],
      requiresConfirmation: true,
    };

    (mockAIService.processCommand as any).mockResolvedValue(mockResponse);

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Type destructive command
    fireEvent.change(input, { target: { value: 'Delete row 5' } });
    fireEvent.submit(input.closest('form')!);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Do you want to proceed/i)).toBeInTheDocument();
    });

    // Check for Yes/Cancel buttons
    expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should handle confirmation acceptance', async () => {
    const mockConfirmResponse: AIResponse = {
      success: true,
      message: 'delete rows',
      operations: [],
      requiresConfirmation: true,
    };

    const mockExecuteResponse: AIResponse = {
      success: true,
      message: 'Deleted row 5',
      operations: [{
        type: 'delete_row',
        target: '5',
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };

    (mockAIService.processCommand as any)
      .mockResolvedValueOnce(mockConfirmResponse)
      .mockResolvedValueOnce(mockExecuteResponse);

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Submit destructive command
    fireEvent.change(input, { target: { value: 'Delete row 5' } });
    fireEvent.submit(input.closest('form')!);

    // Wait for confirmation
    await waitFor(() => {
      expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
    });

    // Click Yes
    fireEvent.click(screen.getByText('Yes, proceed'));

    // Wait for execution
    await waitFor(() => {
      expect(mockAIService.processCommand).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle confirmation cancellation', async () => {
    const mockResponse: AIResponse = {
      success: true,
      message: 'delete rows',
      operations: [],
      requiresConfirmation: true,
    };

    (mockAIService.processCommand as any).mockResolvedValue(mockResponse);

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Submit destructive command
    fireEvent.change(input, { target: { value: 'Delete row 5' } });
    fireEvent.submit(input.closest('form')!);

    // Wait for confirmation
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Check for cancellation message
    await waitFor(() => {
      expect(screen.getByText('Operation cancelled.')).toBeInTheDocument();
    });

    // Should not execute command again
    expect(mockAIService.processCommand).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    (mockAIService.processCommand as any).mockRejectedValue(new Error('Network error'));

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Submit command
    fireEvent.change(input, { target: { value: 'Set A1 to 100' } });
    fireEvent.submit(input.closest('form')!);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  it('should update context after successful operation', async () => {
    const mockResponse: AIResponse = {
      success: true,
      message: 'Set A1 to 100',
      operations: [{
        type: 'set_value',
        target: 'A1',
        value: 100,
        timestamp: new Date(),
      }],
      requiresConfirmation: false,
    };

    (mockAIService.processCommand as any).mockResolvedValue(mockResponse);

    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Submit command
    fireEvent.change(input, { target: { value: 'Set A1 to 100' } });
    fireEvent.submit(input.closest('form')!);

    // Wait for context update
    await waitFor(() => {
      expect(mockOnContextUpdate).toHaveBeenCalled();
    });

    // Check that recent operations were updated
    const updateCall = mockOnContextUpdate.mock.calls[0][0];
    expect(updateCall.recentOperations).toHaveLength(1);
    expect(updateCall.recentOperations[0].type).toBe('set_value');
  });

  it('should support keyboard shortcuts', () => {
    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Type command
    fireEvent.change(input, { target: { value: 'Set A1 to 100' } });
    
    // Press Enter (should submit)
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(mockAIService.processCommand).toHaveBeenCalled();
  });

  it('should not submit on Shift+Enter', () => {
    render(
      <AIChat
        aiService={mockAIService}
        context={mockContext}
        onContextUpdate={mockOnContextUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/Type a command/i);
    
    // Type command
    fireEvent.change(input, { target: { value: 'Set A1 to 100' } });
    
    // Press Shift+Enter (should not submit)
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(mockAIService.processCommand).not.toHaveBeenCalled();
  });
});
