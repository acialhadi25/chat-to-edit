import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../ChatInterface';
import { ChatMessage, ExcelData } from '@/types/excel';

// Mock scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/utils/streamChat', () => ({
  streamChat: vi.fn(),
}));

vi.mock('@/utils/jsonParser', () => ({
  parseAIResponse: vi.fn((text) => ({ data: { content: text } })),
  logParseResult: vi.fn(),
}));

const mockExcelData: ExcelData = {
  fileName: 'test.xlsx',
  headers: ['Name', 'Age', 'City'],
  rows: [
    ['Alice', 25, 'New York'],
    ['Bob', 30, 'Los Angeles'],
  ],
  formulas: {},
  selectedCells: [],
  pendingChanges: [],
  cellStyles: {},
  sheets: [],
  activeSheetIndex: 0,
};

const createMockMessages = (): ChatMessage[] => [
  {
    id: '1',
    role: 'user',
    content: 'Show me the data',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Here is your data with 2 rows',
    timestamp: new Date(),
  },
  {
    id: '3',
    role: 'user',
    content: 'Filter by age greater than 25',
    timestamp: new Date(),
  },
  {
    id: '4',
    role: 'assistant',
    content: 'I will filter the data by age > 25',
    timestamp: new Date(),
  },
  {
    id: '5',
    role: 'user',
    content: 'Sort by name',
    timestamp: new Date(),
  },
  {
    id: '6',
    role: 'assistant',
    content: 'Sorting the data by name column',
    timestamp: new Date(),
  },
];

describe('ChatInterface - Search Functionality', () => {
  const defaultProps = {
    excelData: mockExcelData,
    messages: createMockMessages(),
    onNewMessage: vi.fn(),
    onApplyAction: vi.fn(),
    onSetPendingChanges: vi.fn(),
    onRequestCellSelection: vi.fn(),
    isProcessing: false,
    setIsProcessing: vi.fn(),
    getDataAnalysis: vi.fn(() => null),
    onUpdateAction: vi.fn(),
  };

  it('should render search input', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter messages based on search query', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Initially all messages should be visible
    expect(screen.getByText('Show me the data')).toBeInTheDocument();
    expect(screen.getByText('Sort by name')).toBeInTheDocument();
    
    // Search for "filter"
    await user.type(searchInput, 'filter');
    
    // Should show messages containing "filter" using function matcher
    await waitFor(() => {
      const messages = screen.getAllByText((content, element) => {
        return element?.textContent?.toLowerCase().includes('filter') || false;
      });
      expect(messages.length).toBeGreaterThan(0);
    });
    
    // Should not show messages without "filter"
    expect(screen.queryByText('Show me the data')).not.toBeInTheDocument();
    expect(screen.queryByText('Sort by name')).not.toBeInTheDocument();
  });

  it('should be case-insensitive when searching', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Search with uppercase
    await user.type(searchInput, 'FILTER');
    
    // Should still find messages with lowercase "filter" using function matcher
    await waitFor(() => {
      const messages = screen.getAllByText((content, element) => {
        return element?.textContent?.toLowerCase().includes('filter') || false;
      });
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should show message count when searching', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    await user.type(searchInput, 'data');
    
    // Should show count of filtered messages
    await waitFor(() => {
      // The count text is in a <p> element, so we can query for it specifically
      const countElements = screen.getAllByText((content, element) => {
        return element?.tagName === 'P' && element?.textContent?.match(/Found \d+ of 6 messages/i) !== null;
      });
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  it('should show "no results" message when no matches found', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    await user.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.getByText(/No messages found matching "nonexistent"/i)).toBeInTheDocument();
    });
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Type search query
    await user.type(searchInput, 'filter');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('filter');
    });
    
    // Click clear button
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    
    // Search should be cleared
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
    
    // All messages should be visible again
    expect(screen.getByText('Show me the data')).toBeInTheDocument();
    expect(screen.getByText('Sort by name')).toBeInTheDocument();
  });

  it('should highlight search terms in results', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    await user.type(searchInput, 'data');
    
    await waitFor(() => {
      // Check if mark elements exist (highlighted text)
      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  it('should show all messages when search is empty', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Type and then clear
    await user.type(searchInput, 'filter');
    await user.clear(searchInput);
    
    // All messages should be visible
    await waitFor(() => {
      expect(screen.getByText('Show me the data')).toBeInTheDocument();
      expect(screen.getByText('Filter by age greater than 25')).toBeInTheDocument();
      expect(screen.getByText('Sort by name')).toBeInTheDocument();
    });
  });

  it('should not show clear button when search is empty', () => {
    render(<ChatInterface {...defaultProps} />);
    
    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should show clear button when search has text', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    await user.type(searchInput, 'test');
    
    await waitFor(() => {
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });
  });

  it('should search in both user and assistant messages', async () => {
    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    await user.type(searchInput, 'age');
    
    await waitFor(() => {
      // Check that messages containing "age" are present using a function matcher
      const messages = screen.getAllByText((content, element) => {
        return element?.textContent?.toLowerCase().includes('age') || false;
      });
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should handle special characters in search query', async () => {
    const messagesWithSpecialChars: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Calculate sum(A1:A10)',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'The formula is =SUM(A1:A10)',
        timestamp: new Date(),
      },
    ];

    const user = userEvent.setup();
    render(<ChatInterface {...defaultProps} messages={messagesWithSpecialChars} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Search with special characters
    await user.type(searchInput, 'A1:A10');
    
    await waitFor(() => {
      // Use a function matcher to find text containing the search term
      const messages = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('A1:A10') || false;
      });
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should maintain search state when new messages arrive', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search chat history...');
    
    // Set search query
    await user.type(searchInput, 'filter');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('filter');
    });
    
    // Add new message
    const newMessages = [
      ...createMockMessages(),
      {
        id: '7',
        role: 'user' as const,
        content: 'New message',
        timestamp: new Date(),
      },
    ];
    
    rerender(<ChatInterface {...defaultProps} messages={newMessages} />);
    
    // Search query should still be there
    expect(searchInput).toHaveValue('filter');
    
    // Should still show filtered results - use function matcher
    await waitFor(() => {
      const messages = screen.getAllByText((content, element) => {
        return element?.textContent?.toLowerCase().includes('filter') || false;
      });
      expect(messages.length).toBeGreaterThan(0);
    });
    
    // New message should not be visible
    expect(screen.queryByText('New message')).not.toBeInTheDocument();
  });
});
