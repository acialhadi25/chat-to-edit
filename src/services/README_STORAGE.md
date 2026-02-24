# Storage Service Documentation

## Overview

The Storage Service manages data persistence for Univer workbooks to Supabase database. It provides auto-save functionality, version history tracking, and AI interaction logging.

## Features

- ✅ Save/load workbooks to/from Supabase
- ✅ Auto-save with debouncing
- ✅ Version history tracking
- ✅ AI interaction logging
- ✅ Save status indicator with real-time updates
- ✅ Error handling and recovery

## Installation

The storage service is a singleton instance that can be imported directly:

```typescript
import { storageService } from '@/services/storageService';
```

## Basic Usage

### Save a Workbook

```typescript
import { storageService } from '@/services/storageService';
import type { IWorkbookData } from '@/types/univer.types';

const workbookData: IWorkbookData = {
  id: 'workbook-123',
  name: 'My Spreadsheet',
  sheets: {
    'sheet-1': {
      id: 'sheet-1',
      name: 'Sheet1',
      cellData: {
        0: {
          0: { v: 'Hello', t: 1 },
          1: { v: 100, t: 2 },
        },
      },
    },
  },
};

try {
  await storageService.saveWorkbook('workbook-123', workbookData);
  console.log('Workbook saved successfully');
} catch (error) {
  console.error('Failed to save workbook:', error);
}
```

### Load a Workbook

```typescript
try {
  const workbookData = await storageService.loadWorkbook('workbook-123');
  console.log('Workbook loaded:', workbookData);
} catch (error) {
  console.error('Failed to load workbook:', error);
}
```

### Enable Auto-Save

```typescript
// Enable auto-save every 5 seconds
storageService.enableAutoSave(
  'workbook-123',
  5000, // 5 seconds
  async () => {
    // Callback to get current workbook data
    return await getCurrentWorkbookData();
  }
);

// Disable auto-save when done
storageService.disableAutoSave();
```

### Monitor Save Status

```typescript
// Subscribe to status changes
const unsubscribe = storageService.onStatusChange((status) => {
  console.log('Save status:', status.status);
  console.log('Last saved:', status.lastSaved);
  console.log('Error:', status.error);
});

// Get current status
const currentStatus = storageService.getSaveStatus();

// Unsubscribe when done
unsubscribe();
```

## Version History

### Save a Version

```typescript
try {
  const versionId = await storageService.saveVersion(
    'workbook-123',
    'Added sales data for Q1'
  );
  console.log('Version saved:', versionId);
} catch (error) {
  console.error('Failed to save version:', error);
}
```

### Get Version History

```typescript
try {
  const versions = await storageService.getVersionHistory('workbook-123');
  versions.forEach((version) => {
    console.log(`Version ${version.id}: ${version.description}`);
    console.log(`Created at: ${version.created_at}`);
  });
} catch (error) {
  console.error('Failed to get version history:', error);
}
```

### Restore a Version

```typescript
try {
  const restoredData = await storageService.restoreVersion(
    'workbook-123',
    'version-456'
  );
  console.log('Version restored:', restoredData);
} catch (error) {
  console.error('Failed to restore version:', error);
}
```

## AI Interaction Logging

### Log an AI Interaction

```typescript
await storageService.logAIInteraction({
  workbook_id: 'workbook-123',
  user_id: 'user-456',
  command: 'Calculate sum of column A',
  intent: 'set_formula',
  parameters: {
    range: 'A1:A10',
    formula: '=SUM(A1:A10)',
  },
  result: {
    success: true,
    value: 550,
  },
  success: true,
  error: null,
  execution_time: 125,
});
```

### Get AI History

```typescript
try {
  const history = await storageService.getAIHistory('workbook-123');
  history.forEach((interaction) => {
    console.log(`Command: ${interaction.command}`);
    console.log(`Success: ${interaction.success}`);
    console.log(`Execution time: ${interaction.execution_time}ms`);
  });
} catch (error) {
  console.error('Failed to get AI history:', error);
}
```

## Save Status Indicator Component

The `SaveStatusIndicator` component provides visual feedback for save operations:

```tsx
import { SaveStatusIndicator } from '@/components/univer/SaveStatusIndicator';

function MyComponent() {
  return (
    <div>
      {/* Full indicator with last saved time */}
      <SaveStatusIndicator />

      {/* Compact mode (icon only) */}
      <SaveStatusIndicator compact={true} />

      {/* Custom auto-hide delay */}
      <SaveStatusIndicator autoHideDelay={5000} />

      {/* Hide last saved time */}
      <SaveStatusIndicator showLastSaved={false} />
    </div>
  );
}
```

## Integration with UniverSheet Component

```tsx
import { useEffect, useRef } from 'react';
import { storageService } from '@/services/storageService';
import { SaveStatusIndicator } from '@/components/univer/SaveStatusIndicator';
import type { UniverSheetHandle } from '@/types/univer.types';

function SpreadsheetEditor({ workbookId }: { workbookId: string }) {
  const univerRef = useRef<UniverSheetHandle>(null);

  useEffect(() => {
    // Load workbook on mount
    const loadWorkbook = async () => {
      try {
        const data = await storageService.loadWorkbook(workbookId);
        await univerRef.current?.setWorkbookData(data);
      } catch (error) {
        console.error('Failed to load workbook:', error);
      }
    };

    loadWorkbook();

    // Enable auto-save
    storageService.enableAutoSave(workbookId, 5000, async () => {
      const data = await univerRef.current?.getWorkbookData();
      if (!data) throw new Error('No workbook data');
      return data;
    });

    // Cleanup
    return () => {
      storageService.disableAutoSave();
    };
  }, [workbookId]);

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <h1>My Spreadsheet</h1>
        <SaveStatusIndicator />
      </div>
      <UniverSheet ref={univerRef} />
    </div>
  );
}
```

## Error Handling

The storage service provides comprehensive error handling:

```typescript
try {
  await storageService.saveWorkbook(workbookId, data);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('not authenticated')) {
      // Handle authentication error
      console.error('User not authenticated');
    } else if (error.message.includes('not found')) {
      // Handle not found error
      console.error('Workbook not found');
    } else {
      // Handle other errors
      console.error('Save failed:', error.message);
    }
  }
}
```

## Database Schema

The storage service uses the following Supabase tables:

### workbooks
- `id` (UUID) - Workbook identifier
- `user_id` (UUID) - User identifier
- `name` (TEXT) - Workbook name
- `data` (JSONB) - Complete workbook data
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### workbook_history
- `id` (UUID) - Version identifier
- `workbook_id` (UUID) - Workbook identifier
- `user_id` (UUID) - User identifier
- `snapshot` (JSONB) - Workbook snapshot
- `description` (TEXT) - Version description
- `created_at` (TIMESTAMP) - Version creation timestamp

### ai_spreadsheet_interactions
- `id` (UUID) - Interaction identifier
- `workbook_id` (UUID) - Workbook identifier
- `user_id` (UUID) - User identifier
- `command` (TEXT) - Natural language command
- `intent` (TEXT) - Parsed intent
- `parameters` (JSONB) - Command parameters
- `result` (JSONB) - Operation result
- `success` (BOOLEAN) - Success status
- `error` (TEXT) - Error message
- `execution_time` (INTEGER) - Execution time in milliseconds
- `created_at` (TIMESTAMP) - Interaction timestamp

## Requirements Validation

This implementation satisfies the following requirements:

- **3.2.1** - Auto-save setiap N seconds ✅
- **3.2.2** - Save to Supabase database ✅
- **3.2.3** - Load from Supabase database ✅
- **3.2.4** - Version history tracking ✅

## Testing

The storage service includes comprehensive unit tests:

```bash
npm test -- src/services/__tests__/storageService.test.ts
```

Test coverage includes:
- Save/load operations
- Auto-save functionality
- Version history
- AI interaction logging
- Save status updates
- Error handling

## Performance Considerations

1. **Debouncing**: Auto-save uses debouncing to avoid excessive database writes
2. **JSONB Storage**: Workbook data is stored as JSONB for efficient querying
3. **Indexes**: Database indexes on user_id and timestamps for fast queries
4. **Row Level Security**: RLS policies ensure users can only access their own data

## Security

- All operations require user authentication
- Row Level Security (RLS) policies enforce data isolation
- User can only access their own workbooks and history
- AI interaction logs are user-specific

## Troubleshooting

### Auto-save not working
- Ensure auto-save is enabled with `enableAutoSave()`
- Check that the callback function returns valid workbook data
- Verify user is authenticated

### Save status not updating
- Ensure you've subscribed to status changes with `onStatusChange()`
- Check that the listener is not unsubscribed prematurely

### Version restore fails
- Verify the version ID exists
- Ensure the version belongs to the current user
- Check that the workbook ID matches

## Related Documentation

- [Requirements Document](../../../.kiro/specs/univer-integration/requirements.md)
- [Design Document](../../../.kiro/specs/univer-integration/design.md)
- [Tasks Document](../../../.kiro/specs/univer-integration/tasks.md)
- [Database Schema](../../../supabase/migrations/README_UNIVER_SCHEMA.md)
