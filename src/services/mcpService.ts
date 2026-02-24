/**
 * MCP Service (Model Context Protocol)
 * 
 * Service for MCP protocol integration with Univer Sheet.
 * Handles WebSocket connection, session management, and MCP tool execution.
 * 
 * Requirements: 2.1, 2.2
 * Documentation: docs/univer/features/mcp.md
 */

import type { MCPConfig, MCPTool } from '../types/ai.types';

/**
 * MCP Service for Univer Sheet integration
 * 
 * Provides standardized AI-spreadsheet interaction through MCP protocol:
 * - WebSocket connection management
 * - Session management
 * - Tool execution
 * - Auto-reconnect functionality
 */
export class MCPService {
  private config: MCPConfig;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private sessionId: string;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private availableTools: MCPTool[] = [];

  constructor(config: MCPConfig) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
    this.sessionId = config.sessionId;
  }

  /**
   * Connect to MCP server
   * Establishes WebSocket connection and authenticates
   */
  async connect(): Promise<void> {
    try {
      // Get authentication ticket
      const ticket = await this.getAuthTicket();

      // Connect to WebSocket server
      const wsUrl = `${this.config.mcpServerUrl}?ticket=${ticket}&sessionId=${this.sessionId}`;
      this.ws = new WebSocket(wsUrl);

      // Setup event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);

      // Wait for connection
      await this.waitForConnection();
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Check if connected to MCP server
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reconnect to MCP server
   */
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting to MCP server (attempt ${this.reconnectAttempts})...`);

    try {
      await this.disconnect();
      await this.connect();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Reconnect failed:', error);
      
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Execute MCP tool
   * 
   * @param toolName - Name of the MCP tool to execute
   * @param params - Parameters for the tool
   * @returns Tool execution result
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const message = {
        type: 'tool_call',
        requestId,
        toolName,
        params,
      };

      // Setup response handler
      const responseHandler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        
        if (response.requestId === requestId) {
          this.ws?.removeEventListener('message', responseHandler);
          
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(response.error || 'Tool execution failed'));
          }
        }
      };

      this.ws?.addEventListener('message', responseHandler);

      // Send request
      this.ws?.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        this.ws?.removeEventListener('message', responseHandler);
        reject(new Error('Tool execution timeout'));
      }, 30000);
    });
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): MCPTool[] {
    return [...this.availableTools];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get authentication ticket from ticket server
   * @private
   */
  private async getAuthTicket(): Promise<string> {
    const response = await fetch(this.config.ticketServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get auth ticket: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ticket;
  }

  /**
   * Wait for WebSocket connection to open
   * @private
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const checkConnection = () => {
        if (this.connected) {
          clearTimeout(timeout);
          resolve();
        } else if (this.ws?.readyState === WebSocket.CLOSED) {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Handle WebSocket open event
   * @private
   */
  private handleOpen(): void {
    console.log('MCP WebSocket connected');
    this.connected = true;
    this.reconnectAttempts = 0;

    // Request available tools
    this.requestAvailableTools();
  }

  /**
   * Handle WebSocket close event
   * @private
   */
  private handleClose(event: CloseEvent): void {
    console.log('MCP WebSocket closed:', event.code, event.reason);
    this.connected = false;

    if (this.config.autoReconnect && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   * @private
   */
  private handleError(event: Event): void {
    console.error('MCP WebSocket error:', event);
  }

  /**
   * Handle WebSocket message event
   * @private
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'tools_list':
          this.availableTools = message.tools;
          console.log(`Received ${this.availableTools.length} MCP tools`);
          break;
        
        case 'tool_result':
          // Handled by executeTool promise
          break;
        
        case 'error':
          console.error('MCP error:', message.error);
          break;
        
        default:
          console.warn('Unknown MCP message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse MCP message:', error);
    }
  }

  /**
   * Request available tools from MCP server
   * @private
   */
  private requestAvailableTools(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'list_tools',
      requestId: this.generateRequestId(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Schedule reconnect attempt
   * @private
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    const interval = this.config.reconnectInterval || 5000;
    console.log(`Scheduling reconnect in ${interval}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnect();
    }, interval);
  }

  /**
   * Generate unique request ID
   * @private
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
