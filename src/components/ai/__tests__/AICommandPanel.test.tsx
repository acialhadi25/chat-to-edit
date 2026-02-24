/**
 * AI Command Panel Component Tests
 * 
 * Unit tests for command suggestion panel.
 * 
 * Requirements: 2.3.6, 2.3.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AICommandPanel } from '../AICommandPanel';

describe('AICommandPanel Component', () => {
  it('should render command suggestions', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Should show popular commands when no input (check for buttons)
    const setA1Button = screen.getAllByText('Set A1 to 100')[0];
    expect(setA1Button).toBeInTheDocument();
    
    const calculateButton = screen.getAllByText('Calculate sum of A1:A10 in A11')[0];
    expect(calculateButton).toBeInTheDocument();
  });

  it('should display command categories', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Check for category headers
    expect(screen.getByText('Read Operations')).toBeInTheDocument();
    expect(screen.getByText('Write Operations')).toBeInTheDocument();
    expect(screen.getByText('Formatting')).toBeInTheDocument();
    expect(screen.getByText('Data Operations')).toBeInTheDocument();
    expect(screen.getByText('Charts')).toBeInTheDocument();
  });

  it('should handle suggestion click', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Click on a suggestion button (first one with lightbulb icon)
    const suggestions = screen.getAllByText('Set A1 to 100');
    const suggestionButton = suggestions.find(el => el.closest('button'));
    fireEvent.click(suggestionButton!);

    expect(mockOnSuggestionClick).toHaveBeenCalledWith('Set A1 to 100');
  });

  it('should filter suggestions based on input', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="format"
      />
    );

    // Should show formatting-related commands
    const formatTexts = screen.getAllByText(/Format/i);
    expect(formatTexts.length).toBeGreaterThan(0);
    
    // Should show filtered count
    expect(screen.getByText(/matching commands/i)).toBeInTheDocument();
  });

  it('should show "no results" message for non-matching input', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="xyzabc123"
      />
    );

    expect(screen.getByText('No matching commands found')).toBeInTheDocument();
  });

  it('should mark destructive commands with caution badge', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="replace"
      />
    );

    // Find and replace is a destructive operation
    const cautionBadges = screen.getAllByText('Caution');
    expect(cautionBadges.length).toBeGreaterThan(0);
  });

  it('should show different suggestions for different inputs', () => {
    const mockOnSuggestionClick = vi.fn();

    const { rerender } = render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="chart"
      />
    );

    // Should show chart-related commands
    const chartTexts = screen.getAllByText(/chart/i);
    expect(chartTexts.length).toBeGreaterThan(0);

    // Change input
    rerender(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="sort"
      />
    );

    // Should show sort-related commands
    const sortTexts = screen.getAllByText(/Sort/i);
    expect(sortTexts.length).toBeGreaterThan(0);
  });

  it('should display command examples', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Check for example commands (in monospace font)
    const examples = screen.getAllByText(/A1/i);
    expect(examples.length).toBeGreaterThan(0);
  });

  it('should show top suggestions prominently', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Top suggestions should be buttons with lightbulb icon
    const topSuggestions = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Set A1') || 
      btn.textContent?.includes('Calculate sum')
    );
    
    expect(topSuggestions.length).toBeGreaterThan(0);
  });

  it('should handle empty input gracefully', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput=""
      />
    );

    // Should show default suggestions
    expect(screen.getByText('Read Operations')).toBeInTheDocument();
  });

  it('should filter across multiple categories', () => {
    const mockOnSuggestionClick = vi.fn();

    render(
      <AICommandPanel
        onSuggestionClick={mockOnSuggestionClick}
        currentInput="A1"
      />
    );

    // "A1" appears in multiple command examples
    const matchingCommands = screen.getAllByText(/A1/i);
    expect(matchingCommands.length).toBeGreaterThan(1);
  });
});
