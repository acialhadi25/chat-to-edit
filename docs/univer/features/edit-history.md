# Univer Sheet - Edit History

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Edit History menyediakan version history dan kemampuan untuk restore previous versions dari worksheet.

### Fitur Utama
- **Version History**: Track semua perubahan worksheet
- **History Viewer**: UI untuk melihat history
- **Restore Versions**: Restore ke version sebelumnya
- **Server Integration**: Sync dengan server untuk persistence
- **Diff View**: Lihat perbedaan antar versions
- **Metadata**: Timestamp, user, dan change description

### Kapan Menggunakan
- Version control untuk spreadsheet
- Audit trail untuk changes
- Rollback ke previous state
- Compliance dan documentation
- Collaborative editing history
- Data recovery

### Keuntungan
- Data safety dan recovery
- Audit trail lengkap
- Easy rollback
- Collaboration transparency
- Compliance support
- Peace of mind


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs-pro/edit-history-viewer @univerjs-pro/edit-history-loader
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverEditHistoryViewerPlugin } from '@univerjs-pro/edit-history-viewer';
import { UniverEditHistoryLoaderPlugin } from '@univerjs-pro/edit-history-loader';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs-pro/edit-history-viewer/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register edit history plugins
univerAPI.registerPlugin(UniverEditHistoryViewerPlugin, {
  license: 'your-pro-license',
});

univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  univerContainerId: 'univer-container',
  historyListServerUrl: '/api/univer/history',
  license: 'your-pro-license',
});
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs-pro/edit-history-viewer @univerjs-pro/edit-history-loader
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverEditHistoryViewerPlugin } from '@univerjs-pro/edit-history-viewer';
import { UniverEditHistoryLoaderPlugin } from '@univerjs-pro/edit-history-loader';

const univer = new Univer();

// Register edit history plugins
univer.registerPlugin(UniverEditHistoryViewerPlugin, {
  license: 'your-pro-license',
});

univer.registerPlugin(UniverEditHistoryLoaderPlugin, {
  univerContainerId: 'univer-container',
  historyListServerUrl: '/api/univer/history',
  license: 'your-pro-license',
});
```

### Server Configuration

Edit History memerlukan server endpoint untuk menyimpan dan load history:

```typescript
// Server endpoint should return history list
// GET /api/univer/history?workbookId={id}
// Response format:
{
  histories: [
    {
      id: 'version-1',
      timestamp: 1234567890,
      user: 'user-123',
      description: 'Updated sales data',
      snapshot: { /* workbook data */ }
    }
  ]
}
```

## API Reference

### Configuration

```typescript
interface IEditHistoryLoaderConfig {
  // Container ID for Univer instance
  univerContainerId: string;
  
  // Server URL for history list
  historyListServerUrl: string;
  
  // Pro license
  license: string;
  
  // Optional: Custom headers for API requests
  headers?: Record<string, string>;
  
  // Optional: Max history items to load
  maxHistoryItems?: number;
}
```

### History Item Structure

```typescript
interface IHistoryItem {
  // Unique version ID
  id: string;
  
  // Timestamp
  timestamp: number;
  
  // User who made the change
  user: string;
  
  // Change description
  description?: string;
  
  // Workbook snapshot
  snapshot: IWorkbookData;
}
```


## Contoh Penggunaan

### 1. Basic Setup dengan Server

```typescript
import { createUniver } from '@univerjs/presets';
import { UniverEditHistoryLoaderPlugin } from '@univerjs-pro/edit-history-loader';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
});

// Configure with server URL
univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  univerContainerId: 'univer-container',
  historyListServerUrl: '/api/univer/history',
  license: process.env.UNIVER_PRO_LICENSE,
});
```

### 2. Custom Headers untuk Authentication

```typescript
// Add authentication headers
univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  univerContainerId: 'univer-container',
  historyListServerUrl: '/api/univer/history',
  license: process.env.UNIVER_PRO_LICENSE,
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-User-ID': userId,
  },
});
```

### 3. Server Implementation Example (Node.js/Express)

```typescript
// Server endpoint example
app.get('/api/univer/history', async (req, res) => {
  const { workbookId } = req.query;
  
  // Fetch history from database
  const histories = await db.getWorkbookHistory(workbookId);
  
  res.json({
    histories: histories.map(h => ({
      id: h.id,
      timestamp: h.created_at,
      user: h.user_id,
      description: h.description,
      snapshot: JSON.parse(h.snapshot_data),
    })),
  });
});

// Save history endpoint
app.post('/api/univer/history', async (req, res) => {
  const { workbookId, snapshot, description } = req.body;
  
  await db.saveWorkbookHistory({
    workbook_id: workbookId,
    user_id: req.user.id,
    description,
    snapshot_data: JSON.stringify(snapshot),
    created_at: Date.now(),
  });
  
  res.json({ success: true });
});
```

### 4. Open History Viewer

```typescript
// Open history viewer UI
function HistoryButton() {
  const handleOpenHistory = () => {
    // History viewer opens automatically via UI plugin
    // Or trigger via command
    univerAPI.executeCommand('sheet.command.open-history-viewer');
  };

  return (
    <button onClick={handleOpenHistory}>
      View History
    </button>
  );
}
```

### 5. Programmatic History Save

```typescript
// Save current state to history
async function saveToHistory(description: string) {
  const workbook = univerAPI.getActiveWorkbook();
  const snapshot = workbook.getSnapshot();
  
  await fetch('/api/univer/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workbookId: workbook.getId(),
      snapshot,
      description,
    }),
  });
}

// Usage
await saveToHistory('Updated Q1 sales data');
```

### 6. Auto-Save History on Changes

```typescript
// Auto-save history periodically
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

univerAPI.addEvent(univerAPI.Event.CellValueChanged, async () => {
  const now = Date.now();
  
  if (now - lastSaveTime > SAVE_INTERVAL) {
    await saveToHistory('Auto-save');
    lastSaveTime = now;
  }
});
```

### 7. Restore from History

```typescript
// Restore specific version
async function restoreVersion(versionId: string) {
  const response = await fetch(`/api/univer/history/${versionId}`);
  const { snapshot } = await response.json();
  
  const workbook = univerAPI.getActiveWorkbook();
  await workbook.loadSnapshot(snapshot);
  
  console.log('Version restored');
}
```

### 8. History List Component

```typescript
function HistoryList() {
  const [histories, setHistories] = useState<IHistoryItem[]>([]);

  useEffect(() => {
    loadHistories();
  }, []);

  const loadHistories = async () => {
    const workbook = univerAPI.getActiveWorkbook();
    const response = await fetch(
      `/api/univer/history?workbookId=${workbook.getId()}`
    );
    const { histories } = await response.json();
    setHistories(histories);
  };

  const handleRestore = async (versionId: string) => {
    if (confirm('Restore this version?')) {
      await restoreVersion(versionId);
    }
  };

  return (
    <div className="history-list">
      <h3>Version History</h3>
      {histories.map(history => (
        <div key={history.id} className="history-item">
          <div className="timestamp">
            {new Date(history.timestamp).toLocaleString()}
          </div>
          <div className="user">{history.user}</div>
          <div className="description">{history.description}</div>
          <button onClick={() => handleRestore(history.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 9. Limit History Items

```typescript
// Configure max history items
univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  univerContainerId: 'univer-container',
  historyListServerUrl: '/api/univer/history',
  license: process.env.UNIVER_PRO_LICENSE,
  maxHistoryItems: 50, // Keep last 50 versions
});
```

### 10. History with Descriptions

```typescript
// Save with meaningful descriptions
async function saveWithDescription() {
  const description = prompt('Describe this change:');
  
  if (description) {
    await saveToHistory(description);
    console.log('History saved:', description);
  }
}

// Trigger on significant changes
univerAPI.addEvent(univerAPI.Event.WorksheetAdded, () => {
  saveToHistory('Added new worksheet');
});
```


## Best Practices

### Do's ✅

1. **Implement Server-Side Storage**
```typescript
// Good - Persistent storage
historyListServerUrl: '/api/univer/history'

// Store in database for reliability
```

2. **Add Meaningful Descriptions**
```typescript
// Good - Clear descriptions
await saveToHistory('Updated Q1 sales figures');
await saveToHistory('Fixed formula in column D');
```

3. **Limit History Size**
```typescript
// Good - Prevent unlimited growth
maxHistoryItems: 100

// Or implement server-side cleanup
```

4. **Secure History Access**
```typescript
// Good - Authentication
headers: {
  'Authorization': `Bearer ${token}`,
}
```

5. **Confirm Before Restore**
```typescript
// Good - Prevent accidental restore
if (confirm('Restore this version? Current changes will be lost.')) {
  await restoreVersion(versionId);
}
```

### Don'ts ❌

1. **Jangan Store History Client-Side Only**
```typescript
// Bad - Lost on page refresh
localStorage.setItem('history', JSON.stringify(snapshot));

// Good - Server-side storage
await fetch('/api/univer/history', { method: 'POST', ... });
```

2. **Jangan Save Too Frequently**
```typescript
// Bad - Too many versions
univerAPI.addEvent(univerAPI.Event.CellValueChanged, saveToHistory);

// Good - Throttle saves
const throttledSave = throttle(saveToHistory, 5 * 60 * 1000);
```

3. **Jangan Ignore Storage Limits**
```typescript
// Bad - Unlimited history
// Can cause storage issues

// Good - Implement cleanup
maxHistoryItems: 50
```

4. **Jangan Expose Sensitive Data**
```typescript
// Bad - No access control
app.get('/api/univer/history', (req, res) => {
  // Returns all histories
});

// Good - Check permissions
app.get('/api/univer/history', authenticate, authorize, (req, res) => {
  // Returns only user's histories
});
```

## Troubleshooting

### History Tidak Load

**Gejala**: History viewer empty

**Solusi**:
```typescript
// 1. Verify server URL
console.log('History URL:', config.historyListServerUrl);

// 2. Check server response
const response = await fetch('/api/univer/history?workbookId=123');
console.log('Response:', await response.json());

// 3. Verify license
univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  license: process.env.UNIVER_PRO_LICENSE,
  // ...
});
```

### Restore Tidak Bekerja

**Gejala**: Restore tidak mengubah workbook

**Solusi**:
```typescript
// Ensure snapshot format is correct
const snapshot = {
  id: 'workbook-id',
  name: 'Workbook Name',
  sheets: [/* worksheet data */],
  // ... other workbook data
};

await workbook.loadSnapshot(snapshot);
```

### Server Error 401/403

**Gejala**: Authentication error

**Solusi**:
```typescript
// Add proper authentication
univerAPI.registerPlugin(UniverEditHistoryLoaderPlugin, {
  historyListServerUrl: '/api/univer/history',
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`,
  },
  license: process.env.UNIVER_PRO_LICENSE,
});
```

### Performance Issues

**Gejala**: Slow history loading

**Solusi**:
```typescript
// 1. Limit history items
maxHistoryItems: 50

// 2. Implement pagination on server
app.get('/api/univer/history', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  // Return paginated results
});

// 3. Lazy load snapshots
// Only load snapshot when restoring, not in list
```

## Referensi

### Official Documentation
- [Univer Edit History Guide](https://docs.univer.ai/guides/sheets/features/edit-history)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Core API reference
- [Sheets API](../core/sheets-api.md) - Worksheet operations
- [Collaboration](./collaboration.md) - Real-time collaboration

### Server Implementation
- [Node.js Example](https://github.com/dream-num/univer/tree/main/examples/edit-history-server)
- [Database Schema](https://docs.univer.ai/guides/server/database-schema)

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs-pro/edit-history-viewer, @univerjs-pro/edit-history-loader
**License**: Pro Feature (License Required)
**Server**: Required for persistence
