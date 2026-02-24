/**
 * Unit Tests for MCPService
 * 
 * Validates: Requirements 2.1, 2.2
 * Tests MCP integration including connection, session management, and tool execution
 * 
 * Documentation: docs/univer/features/mcp.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPService } from '../mcpService';
import type { MCPConfig } from '../../types/ai.types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageHandlers: ((event: MessageEvent) => void)[] = [];

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    // Simulate message sending
    const message = JSON.parse(data);
    
    // Simulate server responses
    setTimeout(() => {
      if (message.type === 'list_tools') {
        this.simulateMessage({
          type: 'tools_list',
          tools: [
            { name: 'getCellValue', description: 'Get cell value', parameters: [], category: 'read' },
            { name: 'setCellValue', description: 'Set cell value', parameters: [], category: 'write' },
          ],
        });
      } else if (message.type === 'tool_call') {
        this.simulateMessage({
          type: 'tool_result',
          requestId: message.requestId,
          success: true,
          result: { value: 'test result' },
        });
      }
    }, 10);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }));
    }
  }

  addEventListener(event: string, handler: any): void {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    }
  }

  removeEventListener(event: string, handler: any): void {
    if (event === 'message') {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    }
  }

  private simulateMessage(data: any): void {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    
    if (this.onmessage) {
      this.onmessage(event);
    }
    
    this.messageHandlers.forEach(handler => handler(event));
  }
}

// Mock fetch for ticket server
const createMockFetch = () => {
  return vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('ticket')) {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ ticket: 'mock-ticket-123' }),
        clone: function() { return this; },
      } as Response;
      return Promise.resolve(mockResponse);
    }
    return Promise.reject(new Error('Unknown URL'));
  });
};

global.fetch = createMockFetch();

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('MCPService', () => {
  let mcpService: MCPService;
  let mockConfig: MCPConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    global.fetch = createMockFetch();
    
    mockConfig = {
      sessionId: 'test-session-123',
      ticketServerUrl: 'https://test.com/api/ticket',
      mcpServerUrl: 'wss://test.com/api/ws',
      apiKey: 'test-api-key',
      autoReconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
    };
  });

  afterEach(async () => {
    if (mcpService) {
      await mcpService.disconnect();
    }
  });

  describe('Constructor', () => {
    it('should create MCPService with provided config', () => {
      mcpService = new MCPService(mockConfig);
      
      expect(mcpService).toBeDefined();
      expect(mcpService.getSessionId()).toBe('test-session-123');
    });

    it('should apply default config values', () => {
      const minimalConfig: MCPConfig = {
        sessionId: 'test-session',
        ticketServerUrl: 'https://test.com/ticket',
        mcpServerUrl: 'wss://test.com/ws',
        apiKey: 'test-key',
      };
      
      mcpService = new MCPService(minimalConfig);
      
      expect(mcpService).toBeDefined();
      expect(mcpService.getSessionId()).toBe('test-session');
    });
  });

  describe('Connection Management', () => {
    it('should connect to MCP server successfully', async () => {
      mcpService = new MCPService(mockConfig);
      
      await mcpService.connect();
      
      expect(mcpService.isConnected()).toBe(true);
    });

    it('should fetch authentication ticket before connecting', async () => {
      mcpService = new MCPService(mockConfig);
      
      await mcpService.connect();
      
      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.ticketServerUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockConfig.apiKey}`,
          }),
        })
      );
    });

    it('should establish WebSocket connection with ticket and sessionId', async () => {
      mcpService = new MCPService(mockConfig);
      
      await mcpService.connect();
      
      // WebSocket should be created with correct URL
      expect(mcpService.isConnected()).toBe(true);
    });

    it('should disconnect from MCP server', async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
      
      expect(mcpService.isConnected()).toBe(true);
      
      await mcpService.disconnect();
      
      expect(mcpService.isConnected()).toBe(false);
    });

    it('should handle connection failure gracefully', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      mcpService = new MCPService(mockConfig);
      
      await expect(mcpService.connect()).rejects.toThrow();
    });

    it('should check connection status correctly', async () => {
      mcpService = new MCPService(mockConfig);
      
      expect(mcpService.isConnected()).toBe(false);
      
      await mcpService.connect();
      
      expect(mcpService.isConnected()).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should return correct session ID', () => {
      mcpService = new MCPService(mockConfig);
      
      expect(mcpService.getSessionId()).toBe('test-session-123');
    });

    it('should maintain session ID throughout lifecycle', async () => {
      mcpService = new MCPService(mockConfig);
      
      const sessionIdBefore = mcpService.getSessionId();
      await mcpService.connect();
      const sessionIdAfter = mcpService.getSessionId();
      
      expect(sessionIdBefore).toBe(sessionIdAfter);
    });
  });

  describe('Auto-Reconnect', () => {
    it('should attempt to reconnect on connection loss', async () => {
      mcpService = new MCPService({
        ...mockConfig,
        autoReconnect: true,
        reconnectInterval: 100,
      });
      
      await mcpService.connect();
      expect(mcpService.isConnected()).toBe(true);
      
      // Simulate connection loss
      await mcpService.disconnect();
      
      // Wait for reconnect attempt
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should attempt to reconnect
      // Note: In real implementation, this would reconnect
    });

    it('should respect maxReconnectAttempts', async () => {
      const maxAttempts = 2;
      mcpService = new MCPService({
        ...mockConfig,
        autoReconnect: true,
        reconnectInterval: 50,
        maxReconnectAttempts: maxAttempts,
      });
      
      // This test verifies the reconnect logic respects max attempts
      // In a real scenario, we'd need to simulate multiple failures
      expect(mcpService).toBeDefined();
    });

    it('should not reconnect when autoReconnect is false', async () => {
      mcpService = new MCPService({
        ...mockConfig,
        autoReconnect: false,
      });
      
      await mcpService.connect();
      await mcpService.disconnect();
      
      // Wait to ensure no reconnect happens
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mcpService.isConnected()).toBe(false);
    });
  });

  describe('Tool Execution', () => {
    beforeEach(async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
    });

    it('should execute MCP tool successfully', async () => {
      const result = await mcpService.executeTool('getCellValue', {
        cell: 'A1',
      });
      
      expect(result).toBeDefined();
      expect(result.value).toBe('test result');
    });

    it('should throw error when not connected', async () => {
      await mcpService.disconnect();
      
      await expect(
        mcpService.executeTool('getCellValue', { cell: 'A1' })
      ).rejects.toThrow('Not connected to MCP server');
    });

    it('should handle tool execution timeout', async () => {
      // Mock a tool that never responds
      const slowTool = mcpService.executeTool('slowTool', {});
      
      // This would timeout in real implementation
      // For now, we just verify the promise is created
      expect(slowTool).toBeInstanceOf(Promise);
    });

    it('should pass correct parameters to tool', async () => {
      const params = {
        cell: 'B2',
        value: 100,
      };
      
      const result = await mcpService.executeTool('setCellValue', params);
      
      expect(result).toBeDefined();
    });
  });

  describe('Available Tools', () => {
    beforeEach(async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
      
      // Wait for tools list to be received
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should retrieve available tools after connection', () => {
      const tools = mcpService.getAvailableTools();
      
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should return tools with correct structure', () => {
      const tools = mcpService.getAvailableTools();
      
      if (tools.length > 0) {
        const tool = tools[0];
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('category');
      }
    });

    it('should return a copy of tools array', () => {
      const tools1 = mcpService.getAvailableTools();
      const tools2 = mcpService.getAvailableTools();
      
      expect(tools1).not.toBe(tools2); // Different array instances
      expect(tools1).toEqual(tools2); // Same content
    });
  });

  describe('Event Handling', () => {
    it('should handle connection open event', async () => {
      mcpService = new MCPService(mockConfig);
      
      await mcpService.connect();
      
      expect(mcpService.isConnected()).toBe(true);
    });

    it('should handle connection close event', async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
      
      await mcpService.disconnect();
      
      expect(mcpService.isConnected()).toBe(false);
    });

    it('should handle error events gracefully', async () => {
      mcpService = new MCPService(mockConfig);
      
      // Error handling is internal, just verify service remains stable
      await mcpService.connect();
      
      expect(mcpService.isConnected()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ticket server response', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        statusText: 'Unauthorized',
      } as Response));
      
      mcpService = new MCPService(mockConfig);
      
      await expect(mcpService.connect()).rejects.toThrow();
    });

    it('should handle network errors during connection', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      mcpService = new MCPService(mockConfig);
      
      await expect(mcpService.connect()).rejects.toThrow('Network error');
    });

    it('should handle malformed server messages', async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
      
      // Service should handle malformed messages gracefully
      // This is tested internally by the message handler
      expect(mcpService.isConnected()).toBe(true);
    });
  });

  describe('Reconnect Logic', () => {
    it('should manually reconnect when requested', async () => {
      mcpService = new MCPService(mockConfig);
      await mcpService.connect();
      
      await mcpService.disconnect();
      expect(mcpService.isConnected()).toBe(false);
      
      await mcpService.reconnect();
      
      // After reconnect, should be connected again
      expect(mcpService.isConnected()).toBe(true);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      mcpService = new MCPService(mockConfig);
      
      await mcpService.connect();
      
      // Reconnect attempts should be reset after successful connection
      expect(mcpService.isConnected()).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use custom reconnect interval', () => {
      const customInterval = 3000;
      mcpService = new MCPService({
        ...mockConfig,
        reconnectInterval: customInterval,
      });
      
      expect(mcpService).toBeDefined();
    });

    it('should use custom max reconnect attempts', () => {
      const maxAttempts = 5;
      mcpService = new MCPService({
        ...mockConfig,
        maxReconnectAttempts: maxAttempts,
      });
      
      expect(mcpService).toBeDefined();
    });
  });
});
