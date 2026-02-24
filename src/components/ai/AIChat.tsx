/**
 * AI Chat Component
 * 
 * Main chat interface for AI-powered spreadsheet operations.
 * Provides natural language interaction with Univer Sheet.
 * 
 * Requirements: 2.3.6, 2.3.7
 * Documentation: docs/univer/core/general-api.md
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { AICommandPanel } from './AICommandPanel';
import type { AIService } from '../../services/aiService';
import type { AIContext, AIResponse, Message } from '../../types/ai.types';

interface AIChatProps {
  aiService: AIService;
  context: AIContext;
  onContextUpdate?: (context: Partial<AIContext>) => void;
}

interface ChatMessage extends Message {
  response?: AIResponse;
  isConfirmationPending?: boolean;
}

/**
 * AI Chat Interface Component
 * 
 * Features:
 * - Natural language command input
 * - Message history display
 * - Command suggestions
 * - Confirmation flow for destructive operations
 * - Context awareness (selection, recent operations)
 */
export const AIChat: React.FC<AIChatProps> = ({
  aiService,
  context,
  onContextUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /**
   * Handle command submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Process command through AI service
      const response = await aiService.processCommand(userMessage.content, context);

      // Check if confirmation is required
      if (response.requiresConfirmation && response.success) {
        setPendingCommand(userMessage.content);
        
        const confirmMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This operation will ${response.message}. Do you want to proceed?`,
          timestamp: new Date(),
          response,
          isConfirmationPending: true,
        };
        
        setMessages(prev => [...prev, confirmMessage]);
      } else {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          response,
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // Update context with recent operation
        if (response.success && response.operations.length > 0) {
          onContextUpdate?.({
            recentOperations: [...context.recentOperations, ...response.operations].slice(-10),
            conversationHistory: [...context.conversationHistory, userMessage, assistantMessage].slice(-20),
          });
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
        response: {
          success: false,
          message: 'Failed to process command',
          operations: [],
          requiresConfirmation: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle confirmation (Yes/No)
   */
  const handleConfirmation = async (confirmed: boolean) => {
    if (!pendingCommand) return;

    setPendingCommand(null);
    setIsProcessing(true);

    if (confirmed) {
      try {
        // Re-execute command (confirmation already handled)
        const response = await aiService.processCommand(pendingCommand, context);

        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          response,
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // Update context
        if (response.success && response.operations.length > 0) {
          onContextUpdate?.({
            recentOperations: [...context.recentOperations, ...response.operations].slice(-10),
          });
        }
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      const cancelMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Operation cancelled.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, cancelMessage]);
    }

    setIsProcessing(false);
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask me to perform spreadsheet operations
        </p>
      </div>

      {/* Context Info */}
      {context.currentSelection && (
        <div className="flex-shrink-0 border-b p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            Current selection: <span className="font-mono font-medium">{context.currentSelection}</span>
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-4">No messages yet. Try asking me to:</p>
              <AICommandPanel
                onSuggestionClick={handleSuggestionClick}
                currentInput=""
              />
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Response status indicator */}
                {message.response && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {message.response.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className={message.response.success ? 'text-green-600' : 'text-destructive'}>
                      {message.response.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                )}

                {/* Confirmation buttons */}
                {message.isConfirmationPending && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmation(true)}
                      disabled={isProcessing}
                    >
                      Yes, proceed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirmation(false)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Command Suggestions */}
      {input && !isProcessing && (
        <div className="flex-shrink-0 border-t p-2">
          <AICommandPanel
            onSuggestionClick={handleSuggestionClick}
            currentInput={input}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command... (e.g., 'Set A1 to 100')"
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isProcessing}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isProcessing}
            className="self-end"
            aria-label="Send message"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
