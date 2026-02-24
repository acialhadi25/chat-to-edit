# Univer Sheet - Zen Mode

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Referensi](#referensi)

## Overview

Univer Sheet Zen Mode menyediakan mode full-screen editing yang memungkinkan fokus penuh pada cell editing tanpa distraksi.

### Fitur Utama
- **Full-Screen Editing**: Edit cell dalam mode full-screen
- **Distraction-Free**: Sembunyikan UI elements untuk fokus maksimal
- **Auto-Save**: Otomatis save saat exit zen mode
- **Keyboard Shortcuts**: Shortcut untuk enter/exit zen mode
- **Rich Text Support**: Full rich text editing dalam zen mode

### Kapan Menggunakan
- Editing konten panjang dalam cell
- Fokus pada formula kompleks
- Writing documentation dalam cell
- Data entry yang memerlukan konsentrasi
- Editing tanpa distraksi UI

### Keuntungan
- Fokus maksimal pada editing
- Lebih banyak ruang untuk konten
- Better editing experience
- Keyboard-friendly
- Meningkatkan produktivitas


## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/presets
npm install @univerjs/sheets-zen-editor @univerjs/sheets-zen-editor-ui
```

```typescript
import { createUniver, defaultTheme } from '@univerjs/presets';
import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
import { UniverSheetsZenEditorUIPlugin } from '@univerjs/sheets-zen-editor-ui';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import '@univerjs/sheets-zen-editor-ui/lib/index.css';

const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  theme: defaultTheme,
  presets: [
    // ... other presets
  ],
});

// Register zen editor plugins
univerAPI.registerPlugin(UniverSheetsZenEditorPlugin);
univerAPI.registerPlugin(UniverSheetsZenEditorUIPlugin);
```

### Plugin Mode

```bash
npm install @univerjs/core @univerjs/design @univerjs/engine-render
npm install @univerjs/sheets @univerjs/sheets-ui
npm install @univerjs/sheets-zen-editor @univerjs/sheets-zen-editor-ui
```

```typescript
import { Univer } from '@univerjs/core';
import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
import { UniverSheetsZenEditorUIPlugin } from '@univerjs/sheets-zen-editor-ui';

const univer = new Univer();

// Register zen editor plugins
univer.registerPlugin(UniverSheetsZenEditorPlugin);
univer.registerPlugin(UniverSheetsZenEditorUIPlugin);
```


## API Reference

### FWorkbook Methods

#### startZenEditingAsync()
Memulai zen editing mode untuk cell yang aktif.

```typescript
startZenEditingAsync(): Promise<boolean>
```

**Returns**: `Promise<boolean>` - True jika berhasil masuk zen mode

**Example**:
```typescript
const workbook = univerAPI.getActiveWorkbook();
const started = await workbook.startZenEditingAsync();

if (started) {
  console.log('Entered zen mode');
}
```

#### endZenEditingAsync()
Keluar dari zen editing mode.

```typescript
endZenEditingAsync(save: boolean): Promise<boolean>
```

**Parameters**:
- `save`: `boolean` - True untuk save changes, false untuk discard

**Returns**: `Promise<boolean>` - True jika berhasil keluar zen mode

**Example**:
```typescript
// Save and exit
await workbook.endZenEditingAsync(true);

// Discard and exit
await workbook.endZenEditingAsync(false);
```

### Events

#### BeforeSheetEditStart
Triggered sebelum zen editing dimulai.

```typescript
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditStart,
  (params) => {
    console.log('Before zen edit start:', params);
    // Return false to cancel
    return true;
  }
);
```

#### SheetEditStarted
Triggered setelah zen editing dimulai.

```typescript
univerAPI.addEvent(
  univerAPI.Event.SheetEditStarted,
  (params) => {
    console.log('Zen edit started:', params);
  }
);
```

#### BeforeSheetEditEnd
Triggered sebelum zen editing berakhir.

```typescript
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditEnd,
  (params: { save: boolean }) => {
    console.log('Before zen edit end, save:', params.save);
    // Return false to cancel
    return true;
  }
);
```

#### SheetEditEnded
Triggered setelah zen editing berakhir.

```typescript
univerAPI.addEvent(
  univerAPI.Event.SheetEditEnded,
  (params: { save: boolean }) => {
    console.log('Zen edit ended, saved:', params.save);
  }
);
```


## Contoh Penggunaan

### 1. Start Zen Mode

```typescript
import { univerAPI } from '@univerjs/presets';

const workbook = univerAPI.getActiveWorkbook();

// Start zen editing
const started = await workbook.startZenEditingAsync();

if (started) {
  console.log('Zen mode activated');
}
```

### 2. Exit Zen Mode dengan Save

```typescript
// Save changes and exit
const exited = await workbook.endZenEditingAsync(true);

if (exited) {
  console.log('Changes saved');
}
```

### 3. Exit Zen Mode tanpa Save

```typescript
// Discard changes and exit
const exited = await workbook.endZenEditingAsync(false);

if (exited) {
  console.log('Changes discarded');
}
```

### 4. Zen Mode dengan Button

```typescript
function ZenModeButton() {
  const handleZenMode = async () => {
    const workbook = univerAPI.getActiveWorkbook();
    await workbook.startZenEditingAsync();
  };

  return (
    <button onClick={handleZenMode}>
      Enter Zen Mode
    </button>
  );
}
```

### 5. Listen to Zen Mode Events

```typescript
// Listen when zen mode starts
univerAPI.addEvent(
  univerAPI.Event.SheetEditStarted,
  () => {
    console.log('User entered zen mode');
    // Update UI state
  }
);

// Listen when zen mode ends
univerAPI.addEvent(
  univerAPI.Event.SheetEditEnded,
  (params) => {
    console.log('User exited zen mode');
    console.log('Changes saved:', params.save);
  }
);
```

### 6. Prevent Zen Mode Start

```typescript
// Prevent zen mode in certain conditions
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditStart,
  () => {
    const worksheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
    const range = worksheet?.getActiveRange();
    
    // Don't allow zen mode for formula cells
    if (range?.getFormula()) {
      console.log('Zen mode not allowed for formula cells');
      return false; // Cancel zen mode
    }
    
    return true; // Allow zen mode
  }
);
```

### 7. Confirm Before Discard

```typescript
// Confirm before discarding changes
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditEnd,
  (params) => {
    if (!params.save) {
      const confirmed = confirm('Discard changes?');
      return confirmed; // Cancel if user says no
    }
    return true;
  }
);
```

### 8. Auto-Save on Exit

```typescript
// Always save when exiting zen mode
async function exitZenMode() {
  const workbook = univerAPI.getActiveWorkbook();
  await workbook.endZenEditingAsync(true); // Always save
}
```

### 9. Keyboard Shortcut untuk Zen Mode

```typescript
// Add keyboard shortcut (e.g., Ctrl+Shift+Z)
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
    e.preventDefault();
    const workbook = univerAPI.getActiveWorkbook();
    await workbook.startZenEditingAsync();
  }
});
```

### 10. Complete Zen Mode Flow

```typescript
async function handleZenModeFlow() {
  const workbook = univerAPI.getActiveWorkbook();
  
  // Start zen mode
  const started = await workbook.startZenEditingAsync();
  
  if (!started) {
    console.error('Failed to start zen mode');
    return;
  }
  
  console.log('Zen mode started - edit your content');
  
  // User edits content...
  
  // Later, exit with save
  const exited = await workbook.endZenEditingAsync(true);
  
  if (exited) {
    console.log('Zen mode ended, changes saved');
  }
}
```


## Custom React Hooks

### useZenMode

Hook untuk mengelola zen mode dalam komponen React.

```typescript
import { useState, useCallback, useEffect } from 'react';
import { univerAPI } from '@univerjs/presets';

interface UseZenModeReturn {
  isZenMode: boolean;
  startZenMode: () => Promise<boolean>;
  endZenMode: (save: boolean) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useZenMode(): UseZenModeReturn {
  const [isZenMode, setIsZenMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to zen mode start
    const unsubscribeStart = univerAPI.addEvent(
      univerAPI.Event.SheetEditStarted,
      () => {
        setIsZenMode(true);
      }
    );

    // Listen to zen mode end
    const unsubscribeEnd = univerAPI.addEvent(
      univerAPI.Event.SheetEditEnded,
      () => {
        setIsZenMode(false);
      }
    );

    return () => {
      unsubscribeStart?.();
      unsubscribeEnd?.();
    };
  }, []);

  const startZenMode = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const success = await workbook.startZenEditingAsync();
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start zen mode';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const endZenMode = useCallback(async (save: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const workbook = univerAPI.getActiveWorkbook();
      if (!workbook) throw new Error('No active workbook');

      const success = await workbook.endZenEditingAsync(save);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end zen mode';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isZenMode,
    startZenMode,
    endZenMode,
    loading,
    error,
  };
}
```

### Penggunaan Hook

```typescript
import React from 'react';
import { useZenMode } from './hooks/useZenMode';

export function ZenModePanel() {
  const {
    isZenMode,
    startZenMode,
    endZenMode,
    loading,
    error,
  } = useZenMode();

  const handleStart = async () => {
    const started = await startZenMode();
    if (started) {
      console.log('Zen mode activated');
    }
  };

  const handleSaveAndExit = async () => {
    const exited = await endZenMode(true);
    if (exited) {
      console.log('Changes saved');
    }
  };

  const handleDiscardAndExit = async () => {
    const confirmed = confirm('Discard changes?');
    if (confirmed) {
      await endZenMode(false);
    }
  };

  return (
    <div className="zen-mode-panel">
      <h3>Zen Mode</h3>
      
      {error && <div className="error">{error}</div>}
      
      <div className="status">
        Status: {isZenMode ? 'Active' : 'Inactive'}
      </div>
      
      {!isZenMode ? (
        <button onClick={handleStart} disabled={loading}>
          Enter Zen Mode
        </button>
      ) : (
        <div className="zen-controls">
          <button onClick={handleSaveAndExit} disabled={loading}>
            Save & Exit
          </button>
          <button onClick={handleDiscardAndExit} disabled={loading}>
            Discard & Exit
          </button>
        </div>
      )}
      
      {loading && <div>Processing...</div>}
    </div>
  );
}
```


## Best Practices

### Do's ✅

1. **Provide Clear Entry Point**
```typescript
// Good - Clear button for zen mode
<button onClick={() => workbook.startZenEditingAsync()}>
  Edit in Full Screen
</button>
```

2. **Always Handle Save/Discard**
```typescript
// Good - Explicit save/discard
async function exitZenMode(shouldSave: boolean) {
  await workbook.endZenEditingAsync(shouldSave);
}
```

3. **Confirm Before Discard**
```typescript
// Good - Confirm discard
async function handleDiscard() {
  const confirmed = confirm('Discard changes?');
  if (confirmed) {
    await workbook.endZenEditingAsync(false);
  }
}
```

4. **Use Keyboard Shortcuts**
```typescript
// Good - Keyboard friendly
// Ctrl+Shift+Z to enter
// Esc to exit with save
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
    await workbook.startZenEditingAsync();
  }
});
```

5. **Listen to Events untuk UI Updates**
```typescript
// Good - Update UI state
univerAPI.addEvent(univerAPI.Event.SheetEditStarted, () => {
  setZenModeActive(true);
  hideToolbar();
});
```

### Don'ts ❌

1. **Jangan Force Exit tanpa Confirmation**
```typescript
// Bad - No confirmation
await workbook.endZenEditingAsync(false);

// Good - Confirm first
const confirmed = confirm('Discard changes?');
if (confirmed) {
  await workbook.endZenEditingAsync(false);
}
```

2. **Jangan Ignore Error Handling**
```typescript
// Bad - No error handling
workbook.startZenEditingAsync();

// Good - Handle errors
try {
  const started = await workbook.startZenEditingAsync();
  if (!started) {
    console.error('Failed to start zen mode');
  }
} catch (error) {
  console.error('Zen mode error:', error);
}
```

3. **Jangan Start Zen Mode untuk Empty Cells**
```typescript
// Bad - Allow zen mode for empty cells
await workbook.startZenEditingAsync();

// Good - Check if cell has content
const range = worksheet.getActiveRange();
if (range.getValue()) {
  await workbook.startZenEditingAsync();
}
```

4. **Jangan Lupa Cleanup Event Listeners**
```typescript
// Bad - Memory leak
univerAPI.addEvent(univerAPI.Event.SheetEditStarted, handler);

// Good - Cleanup
const unsubscribe = univerAPI.addEvent(
  univerAPI.Event.SheetEditStarted,
  handler
);

// Later
unsubscribe();
```


## Troubleshooting

### Zen Mode Tidak Start

**Gejala**: startZenEditingAsync() return false

**Solusi**:
```typescript
// 1. Pastikan plugin terdaftar
univerAPI.registerPlugin(UniverSheetsZenEditorPlugin);
univerAPI.registerPlugin(UniverSheetsZenEditorUIPlugin);

// 2. Pastikan ada cell yang aktif
const worksheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
const range = worksheet?.getActiveRange();

if (range) {
  const started = await workbook.startZenEditingAsync();
  console.log('Started:', started);
}

// 3. Check for event cancellation
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditStart,
  () => {
    console.log('Before start event');
    return true; // Must return true to allow
  }
);
```

### Changes Tidak Tersimpan

**Gejala**: Changes hilang setelah exit zen mode

**Solusi**:
```typescript
// Ensure save parameter is true
await workbook.endZenEditingAsync(true); // Save changes

// Verify with event
univerAPI.addEvent(
  univerAPI.Event.SheetEditEnded,
  (params) => {
    console.log('Saved:', params.save);
    if (!params.save) {
      console.warn('Changes were not saved!');
    }
  }
);
```

### Zen Mode Tidak Exit

**Gejala**: endZenEditingAsync() tidak keluar dari zen mode

**Solusi**:
```typescript
// 1. Check for event cancellation
univerAPI.addEvent(
  univerAPI.Event.BeforeSheetEditEnd,
  () => {
    console.log('Before end event');
    return true; // Must return true to allow
  }
);

// 2. Force exit if needed
try {
  await workbook.endZenEditingAsync(true);
} catch (error) {
  console.error('Failed to exit:', error);
  // Try again
  await workbook.endZenEditingAsync(false);
}
```

### Keyboard Shortcuts Tidak Bekerja

**Gejala**: Keyboard shortcut tidak trigger zen mode

**Solusi**:
```typescript
// Ensure event listener is properly attached
document.addEventListener('keydown', async (e) => {
  // Check exact key combination
  if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
    e.preventDefault(); // Prevent default behavior
    
    const workbook = univerAPI.getActiveWorkbook();
    if (workbook) {
      await workbook.startZenEditingAsync();
    }
  }
});

// For exit, use Escape key
document.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    const workbook = univerAPI.getActiveWorkbook();
    if (workbook) {
      await workbook.endZenEditingAsync(true);
    }
  }
});
```

### UI Tidak Update Saat Zen Mode

**Gejala**: UI state tidak sync dengan zen mode

**Solusi**:
```typescript
// Use events to update UI
let isZenMode = false;

univerAPI.addEvent(
  univerAPI.Event.SheetEditStarted,
  () => {
    isZenMode = true;
    updateUI(); // Update your UI
  }
);

univerAPI.addEvent(
  univerAPI.Event.SheetEditEnded,
  () => {
    isZenMode = false;
    updateUI(); // Update your UI
  }
);

function updateUI() {
  // Update buttons, toolbar, etc.
  console.log('Zen mode:', isZenMode);
}
```

## Referensi

### Official Documentation
- [Univer Zen Mode Guide](https://docs.univer.ai/guides/sheets/features/zen)
- [Facade API Reference](https://reference.univer.ai/)

### Related Documentation
- [General API](../core/general-api.md) - Command system dan events
- [Sheets API](../core/sheets-api.md) - Worksheet management
- [Rich Text](../core/rich-text.md) - Text formatting

### Community Resources
- [GitHub Repository](https://github.com/dream-num/univer)
- [Discord Community](https://discord.gg/univer)
- [GitHub Issues](https://github.com/dream-num/univer/issues)

---

**Last Updated**: 2024
**Univer Version**: Latest
**Plugin**: @univerjs/sheets-zen-editor, @univerjs/sheets-zen-editor-ui
