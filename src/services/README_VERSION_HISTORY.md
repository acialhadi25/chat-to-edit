# Version History System

Complete version history implementation for Univer workbooks with automatic and manual versioning capabilities.

## Overview

The version history system provides:
- **Manual Snapshots**: Create named versions at any time
- **Auto-Versioning**: Automatic snapshots based on edits and time
- **Version Restoration**: Restore any previous version
- **History Viewer**: UI component to browse and manage versions

## Components

### 1. VersionHistory Component

UI component for viewing and managing version history.

```tsx
import { VersionHistory } from '@/components/univer/VersionHistory';

<VersionHistory
  workbookId="workbook-123"
  onVersionRestore={(versionId) => {
    console.log('Version restored:', versionId);
  }}
/>
```

**Features:**
- List all versions with timestamps
- Create manual snapshots with descriptions
- Restore previous versions
- Relative time display (e.g., "2 hours ago")
- Error handling and loading states

### 2. useAutoVersioning Hook

Hook for automatic version creation based on user activity.

```tsx
import { useAutoVersioning } from '@/hooks/useAutoVersioning';

const { trackEdit, trackMajorOperation, createManualVersion } = useAutoVersioning({
  workbookId: 'workbook-123',
  enabled: true,
  editThreshold: 50, // Auto-version after 50 edits
  timeInterval: 10 * 60 * 1000, // Auto-version every 10 minutes
  getWorkbookData: async () => {
    // Return current workbook data
    return univerAPI.getWorkbookData();
  },
  onVersionCreated: (versionId) => {
    console.log('Auto-version created:', versionId);
  },
});

// Track regular edits
trackEdit();

// Track major operations (triggers immediate version)
trackMajorOperation('Delete rows');

// Create manual version
await createManualVersion('Before major refactor');
```

**Auto-Versioning Triggers:**
1. **Edit Threshold**: After N edits (default: 50)
2. **Time Interval**: Every X minutes if changes detected (default: 10 min)
3. **Major Operations**: Immediate version before destructive operations
4. **Before Close**: Final version when component unmounts

## Storage Service Methods

### saveVersion

Create a new version snapshot.

```typescript
const versionId = await storageService.saveVersion(
  'workbook-123',
  'Description of this version'
);
```

### getVersionHistory

Retrieve all versions for a workbook.

```typescript
const versions = await storageService.getVersionHistory('workbook-123');
// Returns: Version[]
```

### restoreVersion

Restore a specific version.

```typescript
const restoredData = await storageService.restoreVersion(
  'workbook-123',
  'version-id'
);
// Returns: IWorkbookData
```

## Database Schema

Versions are stored in the `workbook_history` table:

```sql
CREATE TABLE workbook_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workbook_id UUID NOT NULL REFERENCES workbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### Basic Version History

```tsx
import { VersionHistory } from '@/components/univer/VersionHistory';

function WorkbookEditor({ workbookId }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowHistory(true)}>
        View History
      </Button>

      {showHistory && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent>
            <VersionHistory
              workbookId={workbookId}
              onVersionRestore={(versionId) => {
                // Reload workbook after restore
                loadWorkbook(workbookId);
                setShowHistory(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
```

### Auto-Versioning Integration

```tsx
import { useAutoVersioning } from '@/hooks/useAutoVersioning';
import { useUniver } from '@/hooks/useUniver';

function UniverSheet({ workbookId }) {
  const { univerAPI } = useUniver();
  
  const { trackEdit, trackMajorOperation } = useAutoVersioning({
    workbookId,
    enabled: true,
    editThreshold: 50,
    timeInterval: 10 * 60 * 1000,
    getWorkbookData: async () => {
      return univerAPI.getWorkbookData();
    },
  });

  // Track edits
  useEffect(() => {
    const handleCellEdit = () => {
      trackEdit();
    };

    univerAPI.onCellValueChange(handleCellEdit);
    return () => univerAPI.offCellValueChange(handleCellEdit);
  }, [univerAPI, trackEdit]);

  // Track major operations
  const handleDeleteRows = async () => {
    trackMajorOperation('Delete rows');
    await univerAPI.deleteRows(startRow, count);
  };

  return <div>...</div>;
}
```

### Manual Version Creation

```tsx
import { storageService } from '@/services/storageService';

async function createCheckpoint(workbookId: string) {
  try {
    const versionId = await storageService.saveVersion(
      workbookId,
      'Checkpoint before major changes'
    );
    
    toast({
      title: 'Checkpoint created',
      description: 'You can restore this version later',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to create checkpoint',
      variant: 'destructive',
    });
  }
}
```

## Configuration

### Edit Threshold

Number of edits before auto-version is created:

```typescript
editThreshold: 50 // Default: 50 edits
```

**Recommendations:**
- Small documents: 25-50 edits
- Medium documents: 50-100 edits
- Large documents: 100-200 edits

### Time Interval

Time between periodic auto-versions:

```typescript
timeInterval: 10 * 60 * 1000 // Default: 10 minutes
```

**Recommendations:**
- Active editing: 5-10 minutes
- Occasional edits: 15-30 minutes
- Collaborative editing: 5 minutes

## Best Practices

### 1. Version Descriptions

Use clear, descriptive names for manual versions:

```typescript
// Good
await storageService.saveVersion(workbookId, 'Before Q4 data import');
await storageService.saveVersion(workbookId, 'Final version for review');

// Bad
await storageService.saveVersion(workbookId, 'Version 1');
await storageService.saveVersion(workbookId, 'Test');
```

### 2. Major Operations

Always create versions before destructive operations:

```typescript
// Before deleting data
trackMajorOperation('Clear worksheet');
await univerAPI.clearWorksheet();

// Before bulk changes
trackMajorOperation('Import CSV data');
await importCSV(data);
```

### 3. Performance

Limit version history size by:
- Setting appropriate edit thresholds
- Cleaning up old versions periodically
- Using time-based versioning wisely

### 4. User Experience

- Show version count in UI
- Display last version time
- Provide quick restore option
- Confirm before restoring

## Error Handling

All version operations include error handling:

```typescript
try {
  await storageService.saveVersion(workbookId, description);
} catch (error) {
  if (error.message.includes('not authenticated')) {
    // Handle authentication error
  } else if (error.message.includes('not found')) {
    // Handle missing workbook
  } else {
    // Handle general error
  }
}
```

## Testing

### Unit Tests

```bash
# Test version history component
npm test src/components/univer/__tests__/VersionHistory.test.tsx

# Test auto-versioning hook
npm test src/hooks/__tests__/useAutoVersioning.test.ts

# Test storage service
npm test src/services/__tests__/storageService.test.ts
```

### Test Coverage

- ✅ Version creation (manual and auto)
- ✅ Version listing
- ✅ Version restoration
- ✅ Edit tracking
- ✅ Time-based versioning
- ✅ Major operation tracking
- ✅ Error handling
- ✅ UI interactions

## Requirements Satisfied

- ✅ **3.2.4**: Version history tracking
  - Save version snapshots
  - List version history
  - Restore previous versions
  - Auto-versioning on significant changes

## Future Enhancements

1. **Version Comparison**: Show diff between versions
2. **Version Branching**: Create branches from versions
3. **Version Merging**: Merge changes from different versions
4. **Version Comments**: Add comments to versions
5. **Version Tags**: Tag important versions
6. **Version Search**: Search versions by description or date
7. **Version Cleanup**: Automatic cleanup of old versions
8. **Version Export**: Export specific versions

## Related Documentation

- [Storage Service](./README_STORAGE.md)
- [Univer API](../../docs/univer/core/sheets-api.md)
- [Database Schema](../../supabase/migrations/README_UNIVER_SCHEMA.md)
