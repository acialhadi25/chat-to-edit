# Univer Sheet - MCP Integration (Model Context Protocol)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

MCP (Model Context Protocol) Integration memungkinkan LLM (Large Language Models) untuk berinteraksi dengan Univer Sheet melalui 30+ spreadsheet tools yang terstandarisasi.

### Fitur Utama
- **30+ Spreadsheet Tools**: Comprehensive tools untuk operasi spreadsheet
- **LLM Integration**: Seamless integration dengan AI models
- **Session Management**: Manage multiple sessions
- **Real-time Sync**: Sinkronisasi real-time dengan LLM
- **Secure Communication**: WebSocket dengan authentication
- **API Key Management**: Secure API key handling

### Kapan Menggunakan
- AI-powered spreadsheet automation
- Natural language spreadsheet operations
- Intelligent data analysis
- Automated report generation
- Conversational data manipulation
- AI assistants untuk spreadsheet

### Keuntungan
- Natural language interface
- Powerful AI capabilities
- Standardized protocol
- Extensible architecture
- Real-time collaboration dengan AI
- Enhanced productivity


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/mcp @univerjs-pro/mcp-ui @univerjs-pro/sheets-mcp
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverMCPPlugin } from '@univerjs-pro/mcp';
import { UniverMCPUIPlugin } from '@univerjs-pro/mcp-ui';
import { UniverSheetsMCPPlugin } from '@univerjs-pro/sheets-mcp';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs-pro/mcp-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register MCP plugins
univerAPI.registerPlugin(UniverMCPPlugin, {
  sessionId: 'user-123-workbook-abc',
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: process.env.UNIVER_MCP_API_KEY,
});

univerAPI.registerPlugin(UniverMCPUIPlugin);
univerAPI.registerPlugin(UniverSheetsMCPPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/mcp @univerjs-pro/mcp-ui @univerjs-pro/sheets-mcp
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverMCPPlugin } from '@univerjs-pro/mcp';
import { UniverMCPUIPlugin } from '@univerjs-pro/mcp-ui';
import { UniverSheetsMCPPlugin } from '@univerjs-pro/sheets-mcp';

const univer = new Univer();

// Register MCP plugins with configuration
univer.registerPlugin(UniverMCPPlugin, {
  sessionId: 'unique-session-id',
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: 'your-api-key',
  license: 'your-pro-license',
});

univer.registerPlugin(UniverMCPUIPlugin);
univer.registerPlugin(UniverSheetsMCPPlugin);
```

### Configuration Options

```typescript
interface IMCPConfig {
  // Unique session identifier
  sessionId: string;
  
  // Ticket server URL for authentication
  ticketServerUrl: string;
  
  // WebSocket server URL for MCP communication
  mcpServerUrl: string;
  
  // API key for authentication
  apiKey: string;
  
  // Pro license key
  license: string;
  
  // Optional: Auto-reconnect on disconnect
  autoReconnect?: boolean;
  
  // Optional: Reconnect interval in ms
  reconnectInterval?: number;
  
  // Optional: Max reconnect attempts
  maxReconnectAttempts?: number;
}
```


## API Reference

### Available MCP Tools (30+ Tools)

MCP menyediakan 30+ tools untuk operasi spreadsheet yang dapat diakses oleh LLM:

#### Cell Operations
- `getCellValue` - Get value dari cell
- `setCellValue` - Set value ke cell
- `getCellFormula` - Get formula dari cell
- `setCellFormula` - Set formula ke cell
- `getCellStyle` - Get style dari cell
- `setCellStyle` - Set style ke cell

#### Range Operations
- `getRangeValues` - Get values dari range
- `setRangeValues` - Set values ke range
- `getRangeFormulas` - Get formulas dari range
- `setRangeFormulas` - Set formulas ke range
- `clearRange` - Clear range content
- `copyRange` - Copy range
- `moveRange` - Move range

#### Worksheet Operations
- `getWorksheets` - Get list worksheets
- `addWorksheet` - Add new worksheet
- `deleteWorksheet` - Delete worksheet
- `renameWorksheet` - Rename worksheet
- `getActiveWorksheet` - Get active worksheet
- `setActiveWorksheet` - Set active worksheet

#### Data Operations
- `sortRange` - Sort data in range
- `filterRange` - Filter data in range
- `findInRange` - Find text in range
- `replaceInRange` - Replace text in range

#### Formatting Operations
- `setNumberFormat` - Set number format
- `setBold` - Set bold formatting
- `setItalic` - Set italic formatting
- `setFontSize` - Set font size
- `setFontColor` - Set font color
- `setBackgroundColor` - Set background color

#### Advanced Operations
- `insertChart` - Insert chart
- `insertPivotTable` - Insert pivot table
- `addComment` - Add comment
- `addHyperlink` - Add hyperlink

### Session Management

```typescript
// Get current session ID
const sessionId = univerAPI.getMCPSessionId();

// Check connection status
const isConnected = univerAPI.isMCPConnected();

// Reconnect if disconnected
await univerAPI.reconnectMCP();

// Disconnect
await univerAPI.disconnectMCP();
```


## Contoh Penggunaan

### 1. Basic Setup

```typescript
import { createUniver } from '@univerjs/presets';
import { UniverMCPPlugin } from '@univerjs-pro/mcp';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
});

// Configure MCP
univerAPI.registerPlugin(UniverMCPPlugin, {
  sessionId: `session-${Date.now()}`,
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: process.env.UNIVER_MCP_API_KEY,
  license: process.env.UNIVER_PRO_LICENSE,
});
```

### 2. Check Connection Status

```typescript
// Check if MCP is connected
const isConnected = univerAPI.isMCPConnected();

if (isConnected) {
  console.log('MCP connected and ready');
} else {
  console.log('MCP not connected');
  await univerAPI.reconnectMCP();
}
```

### 3. Get Session Information

```typescript
// Get current session ID
const sessionId = univerAPI.getMCPSessionId();
console.log('Current session:', sessionId);

// Session ID format: user-{userId}-workbook-{workbookId}
```

### 4. Handle Connection Events

```typescript
// Listen to connection events
univerAPI.addEvent(univerAPI.Event.MCPConnected, () => {
  console.log('MCP connected');
});

univerAPI.addEvent(univerAPI.Event.MCPDisconnected, () => {
  console.log('MCP disconnected');
  // Auto-reconnect
  setTimeout(() => {
    univerAPI.reconnectMCP();
  }, 5000);
});

univerAPI.addEvent(univerAPI.Event.MCPError, (error) => {
  console.error('MCP error:', error);
});
```

### 5. LLM Integration Example

```typescript
// Example: AI assistant that can manipulate spreadsheet
async function handleAICommand(command: string) {
  // LLM processes command and calls appropriate MCP tools
  // Example commands:
  // - "Set A1 to 100"
  // - "Calculate sum of column A"
  // - "Create a chart from B1:B10"
  // - "Sort data by column A"
  
  // MCP handles the translation to actual operations
  console.log('AI command:', command);
}
```

### 6. Secure API Key Management

```typescript
// Store API key securely
const apiKey = await fetchAPIKeyFromSecureStorage();

univerAPI.registerPlugin(UniverMCPPlugin, {
  sessionId: generateSessionId(),
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: apiKey,
  license: process.env.UNIVER_PRO_LICENSE,
});
```

### 7. Auto-Reconnect Configuration

```typescript
// Configure auto-reconnect
univerAPI.registerPlugin(UniverMCPPlugin, {
  sessionId: 'session-123',
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: process.env.UNIVER_MCP_API_KEY,
  autoReconnect: true,
  reconnectInterval: 5000, // 5 seconds
  maxReconnectAttempts: 10,
});
```

### 8. Multiple Sessions

```typescript
// Create unique session per user/workbook
function createMCPSession(userId: string, workbookId: string) {
  const sessionId = `user-${userId}-workbook-${workbookId}`;
  
  univerAPI.registerPlugin(UniverMCPPlugin, {
    sessionId,
    ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
    mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
    apiKey: process.env.UNIVER_MCP_API_KEY,
  });
}
```

### 9. Disconnect on Cleanup

```typescript
// Cleanup on component unmount
useEffect(() => {
  return () => {
    univerAPI.disconnectMCP();
  };
}, []);
```

### 10. Error Handling

```typescript
// Comprehensive error handling
try {
  univerAPI.registerPlugin(UniverMCPPlugin, config);
  
  const isConnected = univerAPI.isMCPConnected();
  if (!isConnected) {
    throw new Error('Failed to connect to MCP');
  }
  
  console.log('MCP initialized successfully');
} catch (error) {
  console.error('MCP initialization error:', error);
  
  // Fallback: Use without MCP
  console.log('Running without MCP integration');
}
```


## Best Practices

### Do's ✅

1. **Use Unique Session IDs**
```typescript
// Good - Unique per user/workbook
const sessionId = `user-${userId}-workbook-${workbookId}-${Date.now()}`;
```

2. **Secure API Key Storage**
```typescript
// Good - Environment variables
apiKey: process.env.UNIVER_MCP_API_KEY

// Never hardcode API keys in code
```

3. **Handle Connection Failures**
```typescript
// Good - Graceful degradation
if (!univerAPI.isMCPConnected()) {
  console.warn('MCP not available, using fallback');
  // Provide alternative functionality
}
```

4. **Implement Auto-Reconnect**
```typescript
// Good - Auto-reconnect on disconnect
univerAPI.addEvent(univerAPI.Event.MCPDisconnected, async () => {
  await univerAPI.reconnectMCP();
});
```

5. **Validate License**
```typescript
// Good - Check license before using
if (!isValidLicense()) {
  console.error('Invalid MCP license');
  return;
}
```

### Don'ts ❌

1. **Jangan Hardcode API Keys**
```typescript
// Bad
apiKey: 'abc123xyz'

// Good
apiKey: process.env.UNIVER_MCP_API_KEY
```

2. **Jangan Ignore Connection Errors**
```typescript
// Bad
univerAPI.registerPlugin(UniverMCPPlugin, config);

// Good
try {
  univerAPI.registerPlugin(UniverMCPPlugin, config);
} catch (error) {
  console.error('MCP error:', error);
}
```

3. **Jangan Reuse Session IDs**
```typescript
// Bad - Same session for all users
sessionId: 'shared-session'

// Good - Unique per user
sessionId: `user-${userId}-${Date.now()}`
```

4. **Jangan Lupa Disconnect**
```typescript
// Bad - No cleanup
// Memory leak

// Good - Cleanup on unmount
useEffect(() => {
  return () => univerAPI.disconnectMCP();
}, []);
```


## Troubleshooting

### Connection Failed

**Gejala**: MCP tidak connect

**Solusi**:
```typescript
// 1. Verify API key
console.log('API Key:', process.env.UNIVER_MCP_API_KEY ? 'Set' : 'Missing');

// 2. Check server URLs
console.log('Ticket Server:', config.ticketServerUrl);
console.log('MCP Server:', config.mcpServerUrl);

// 3. Test connection
const isConnected = univerAPI.isMCPConnected();
if (!isConnected) {
  await univerAPI.reconnectMCP();
}

// 4. Check network connectivity
// Ensure WebSocket connections are not blocked by firewall
```

### Invalid License Error

**Gejala**: "License required" atau "Invalid license"

**Solusi**:
```typescript
// MCP adalah Pro feature
univerAPI.registerPlugin(UniverMCPPlugin, {
  sessionId: 'session-123',
  ticketServerUrl: 'https://mcp.univer.ai/api/ticket',
  mcpServerUrl: 'wss://mcp.univer.ai/api/ws',
  apiKey: process.env.UNIVER_MCP_API_KEY,
  license: process.env.UNIVER_PRO_LICENSE, // Required
});

// Contact Univer for license: https://univer.ai/contact
```

### WebSocket Connection Timeout

**Gejala**: Connection timeout

**Solusi**:
```typescript
// 1. Check firewall/proxy settings
// Ensure WebSocket (wss://) is allowed

// 2. Increase timeout
univerAPI.registerPlugin(UniverMCPPlugin, {
  // ... config
  connectionTimeout: 30000, // 30 seconds
});

// 3. Use alternative server if available
mcpServerUrl: 'wss://mcp-backup.univer.ai/api/ws'
```

### Session ID Conflicts

**Gejala**: Multiple users sharing same session

**Solusi**:
```typescript
// Generate unique session IDs
function generateSessionId(userId: string, workbookId: string): string {
  return `user-${userId}-workbook-${workbookId}-${Date.now()}`;
}

const sessionId = generateSessionId(currentUserId, currentWorkbookId);
```

### API Rate Limiting

**Gejala**: Too many requests error

**Solusi**:
```typescript
// Implement rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // ms

async function rateLimitedRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  // Make request
}
```

## Referensi

### Official Documentation
- [Univer MCP Guide](https://docs.univer.ai/guides/sheets/features/mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Core API reference
- [Sheets API](../core/sheets-api.md) - Worksheet operations
- [UniScript](./uniscript.md) - Alternative scripting

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [MCP Examples](https://github.com/dream-num/univer/tree/main/examples/mcp)

### External Resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [LLM Integration Guide](https://docs.univer.ai/guides/integrations/llm)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/mcp, @univerjs-pro/mcp-ui, @univerjs-pro/sheets-mcp
**License**: Pro Feature (License Required)
**API Key**: Required for MCP server access
