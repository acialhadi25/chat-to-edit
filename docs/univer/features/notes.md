# Univer Sheet - Annotations (Catatan)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Fitur Annotations memungkinkan pengguna menambahkan catatan dalam cell spreadsheet untuk merekam informasi tambahan atau memberikan konteks. Mendukung berbagai gaya catatan dan operasi, membantu pengguna lebih memahami dan berkolaborasi pada data.

### Fitur Utama
- ✅ Add/Update/Delete annotations
- ✅ Show/Hide annotations
- ✅ Custom annotation size
- ✅ Event listeners untuk operasi annotations
- ✅ Get annotations by range atau worksheet

### Perbedaan Notes vs Comments
- **Notes (Annotations)**: Catatan sederhana pada cell, tidak mendukung threading
- **Comments**: Sistem komentar lengkap dengan replies dan collaboration

## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/preset-sheets-note
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsNotePreset } from '@univerjs/preset-sheets-note'
import UniverPresetSheetsNoteEnUS from '@univerjs/preset-sheets-note/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-note/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsNoteEnUS
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsNotePreset()
  ],
})
```

### Plugin Mode

```bash
npm install @univerjs/sheets-note @univerjs/sheets-note-ui
```

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { UniverSheetsNotePlugin } from '@univerjs/sheets-note'
import { UniverSheetsNoteUIPlugin } from '@univerjs/sheets-note-ui'
import SheetsNoteUIEnUS from '@univerjs/sheets-note-ui/locale/en-US'

import '@univerjs/sheets-note-ui/lib/index.css'
import '@univerjs/sheets-note/facade'

const univer = new Univer({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(SheetsNoteUIEnUS),
  },
})

univer.registerPlugin(UniverSheetsNotePlugin)
univer.registerPlugin(UniverSheetsNoteUIPlugin)
```

## API Reference

### Get Annotations

#### `FWorksheet.getNotes()`
Mendapatkan semua annotations dalam worksheet.

**Returns:** `Array<{ row: number, col: number, note: string }>` - Array of note objects

#### `FRange.getNote()`
Mendapatkan annotation dari cell kiri-atas dalam range.

**Returns:** `string | null` - Note text atau null

### Add or Update Annotations

#### `FRange.createOrUpdateNote(options)`
Membuat atau update annotation pada cell kiri-atas dalam range.

**Parameters:**
- `options` (object): Konfigurasi note
  - `note` (string): Teks annotation
  - `width` (number): Lebar note popup
  - `height` (number): Tinggi note popup
  - `show` (boolean): Show/hide note popup

**Returns:** `boolean` - Success status

### Remove Annotations

#### `FRange.deleteNote()`
Menghapus annotation dari cell kiri-atas dalam range.

**Returns:** `boolean` - Success status

### Event Listeners

Complete event type definitions dapat ditemukan di [Events](https://reference.univer.ai/).

| Event Name | Description |
|------------|-------------|
| `SheetNoteAdd` | Triggered setelah menambah annotation |
| `SheetNoteDelete` | Triggered setelah menghapus annotation |
| `SheetNoteUpdate` | Triggered setelah update annotation |
| `SheetNoteShow` | Triggered saat annotation ditampilkan |
| `SheetNoteHide` | Triggered saat annotation disembunyikan |
| `BeforeSheetNoteAdd` | Triggered sebelum menambah annotation |
| `BeforeSheetNoteDelete` | Triggered sebelum menghapus annotation |
| `BeforeSheetNoteUpdate` | Triggered sebelum update annotation |
| `BeforeSheetNoteShow` | Triggered sebelum show annotation |
| `BeforeSheetNoteHide` | Triggered sebelum hide annotation |

## Contoh Penggunaan

### 1. Add Annotation Sederhana

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('A1')

// Add annotation ke cell A1
fRange.createOrUpdateNote({
  note: 'This is an annotation',
  width: 160,
  height: 100,
  show: true
})
```

### 2. Get All Annotations

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Get semua annotations
const notes = fWorksheet.getNotes()

notes.forEach((item) => {
  const { row, col, note } = item
  const cellNotation = fWorksheet.getRange(row, col).getA1Notation()
  console.log(`Cell ${cellNotation} has note: ${note}`)
})
```

### 3. Get Annotation dari Range

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Get annotation dari cell kiri-atas range A1:D10
const fRange = fWorksheet.getRange('A1:D10')
const note = fRange.getNote()

if (note) {
  console.log('Note content:', note)
} else {
  console.log('No note found')
}
```

### 4. Update Existing Annotation

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()
const fRange = fWorksheet.getRange('B2')

// Update annotation
fRange.createOrUpdateNote({
  note: 'Updated annotation text',
  width: 200,
  height: 120,
  show: false // Hide popup
})
```

### 5. Delete Annotation

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Delete annotation dari cell C1
const fRange = fWorksheet.getRange('C1')
fRange.deleteNote()

// Delete first annotation in worksheet
const notes = fWorksheet.getNotes()
if (notes.length > 0) {
  const { row, col } = notes[0]
  fWorksheet.getRange(row, col).deleteNote()
}
```

### 6. Add Multiple Annotations

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Add annotations ke multiple cells
const cellsWithNotes = [
  { cell: 'A1', note: 'Header column' },
  { cell: 'B1', note: 'Price in USD' },
  { cell: 'C1', note: 'Quantity available' }
]

cellsWithNotes.forEach(({ cell, note }) => {
  fWorksheet.getRange(cell).createOrUpdateNote({
    note,
    width: 160,
    height: 80,
    show: false
  })
})
```

### 7. Event Listener - After Add

```typescript
// Listen untuk annotation add event
const disposable = univerAPI.addEvent(
  univerAPI.Event.SheetNoteAdd,
  (params) => {
    const { workbook, worksheet, row, col, note } = params
    console.log(`Note added at (${row}, ${col}): ${note}`)
  }
)

// Remove listener
// disposable.dispose()
```

### 8. Event Listener - Before Delete (Cancelable)

```typescript
// Listen dan cancel delete operation
const disposable = univerAPI.addEvent(
  univerAPI.Event.BeforeSheetNoteDelete,
  (params) => {
    const { workbook, worksheet, row, col, oldNote } = params
    
    // Confirm before delete
    const confirmed = confirm(`Delete note: "${oldNote}"?`)
    
    if (!confirmed) {
      // Cancel deletion
      params.cancel = true
    }
  }
)

// Remove listener
// disposable.dispose()
```

### 9. Show/Hide Annotations

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Show annotation
fWorksheet.getRange('A1').createOrUpdateNote({
  note: 'Important note',
  width: 160,
  height: 100,
  show: true // Show popup
})

// Hide annotation (note masih ada, hanya popup yang hidden)
setTimeout(() => {
  fWorksheet.getRange('A1').createOrUpdateNote({
    note: 'Important note',
    width: 160,
    height: 100,
    show: false // Hide popup
  })
}, 3000)
```

### 10. Bulk Delete Annotations

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Delete semua annotations dalam worksheet
const notes = fWorksheet.getNotes()

notes.forEach(({ row, col }) => {
  fWorksheet.getRange(row, col).deleteNote()
})

console.log(`Deleted ${notes.length} annotations`)
```

## Custom React Hooks

### useNoteManager Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

interface NoteInfo {
  row: number
  col: number
  note: string
  cellNotation: string
}

export function useNoteManager() {
  const univerAPI = useFacadeAPI()
  const [notes, setNotes] = useState<NoteInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Load semua notes
  const loadNotes = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const fWorksheet = fWorkbook.getActiveSheet()
    const noteList = fWorksheet.getNotes()
    
    const noteInfos = noteList.map(({ row, col, note }) => ({
      row,
      col,
      note,
      cellNotation: fWorksheet.getRange(row, col).getA1Notation()
    }))
    
    setNotes(noteInfos)
  }, [univerAPI])

  // Add or update note
  const addOrUpdateNote = useCallback((
    cell: string,
    noteText: string,
    options?: { width?: number; height?: number; show?: boolean }
  ) => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(cell)
      
      const success = fRange.createOrUpdateNote({
        note: noteText,
        width: options?.width || 160,
        height: options?.height || 100,
        show: options?.show ?? false
      })
      
      if (success) {
        loadNotes()
      }
      
      return success
    } catch (error) {
      console.error('Error adding note:', error)
      return false
    }
  }, [univerAPI, loadNotes])

  // Delete note
  const deleteNote = useCallback((cell: string) => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(cell)
      
      const success = fRange.deleteNote()
      
      if (success) {
        loadNotes()
      }
      
      return success
    } catch (error) {
      console.error('Error deleting note:', error)
      return false
    }
  }, [univerAPI, loadNotes])

  // Delete all notes
  const deleteAllNotes = useCallback(() => {
    if (!univerAPI) return false

    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const noteList = fWorksheet.getNotes()
      
      noteList.forEach(({ row, col }) => {
        fWorksheet.getRange(row, col).deleteNote()
      })
      
      loadNotes()
      return true
    } catch (error) {
      console.error('Error deleting all notes:', error)
      return false
    }
  }, [univerAPI, loadNotes])

  // Get note by cell
  const getNoteByCell = useCallback((cell: string) => {
    if (!univerAPI) return null

    const fWorkbook = univerAPI.getActiveWorkbook()
    const fWorksheet = fWorkbook.getActiveSheet()
    const fRange = fWorksheet.getRange(cell)
    
    return fRange.getNote()
  }, [univerAPI])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return {
    notes,
    loading,
    addOrUpdateNote,
    deleteNote,
    deleteAllNotes,
    getNoteByCell,
    loadNotes
  }
}
```

### Contoh Penggunaan Hook

```typescript
function NoteManager() {
  const {
    notes,
    loading,
    addOrUpdateNote,
    deleteNote,
    deleteAllNotes
  } = useNoteManager()
  
  const [selectedCell, setSelectedCell] = useState('A1')
  const [noteText, setNoteText] = useState('')

  const handleAddNote = () => {
    if (!noteText) return

    const success = addOrUpdateNote(selectedCell, noteText, {
      width: 200,
      height: 120,
      show: true
    })

    if (success) {
      setNoteText('')
      console.log('Note added!')
    }
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={selectedCell}
          onChange={(e) => setSelectedCell(e.target.value)}
          placeholder="Cell (e.g., A1)"
        />
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Note text"
        />
        <button onClick={handleAddNote} disabled={loading}>
          Add Note
        </button>
      </div>
      
      <div>
        <h3>Notes ({notes.length})</h3>
        <button onClick={deleteAllNotes} disabled={loading || notes.length === 0}>
          Delete All
        </button>
        
        {notes.map(({ cellNotation, note }) => (
          <div key={cellNotation}>
            <strong>{cellNotation}:</strong> {note}
            <button onClick={() => deleteNote(cellNotation)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Note Text Validation
```typescript
// ❌ Bad - no validation
fRange.createOrUpdateNote({ note: '' })

// ✅ Good - validate before adding
const noteText = userInput.trim()
if (noteText.length > 0 && noteText.length <= 1000) {
  fRange.createOrUpdateNote({
    note: noteText,
    width: 160,
    height: 100,
    show: false
  })
}
```

### 2. Consistent Note Sizes
```typescript
// ✅ Good - use constants
const NOTE_CONFIG = {
  DEFAULT_WIDTH: 160,
  DEFAULT_HEIGHT: 100,
  LARGE_WIDTH: 240,
  LARGE_HEIGHT: 150
}

fRange.createOrUpdateNote({
  note: text,
  width: NOTE_CONFIG.DEFAULT_WIDTH,
  height: NOTE_CONFIG.DEFAULT_HEIGHT,
  show: false
})
```

### 3. Error Handling
```typescript
// ✅ Good - handle errors
try {
  const success = fRange.createOrUpdateNote({
    note: noteText,
    width: 160,
    height: 100,
    show: false
  })
  
  if (!success) {
    console.error('Failed to add note')
  }
} catch (error) {
  console.error('Error adding note:', error)
}
```

### 4. Event Listener Cleanup
```typescript
// ✅ Good - cleanup listeners
useEffect(() => {
  const disposable = univerAPI.addEvent(
    univerAPI.Event.SheetNoteAdd,
    handleNoteAdd
  )
  
  return () => {
    disposable?.dispose()
  }
}, [univerAPI])
```

### 5. Batch Operations
```typescript
// ✅ Good - batch add notes
const notesToAdd = [
  { cell: 'A1', note: 'Header' },
  { cell: 'B1', note: 'Price' },
  { cell: 'C1', note: 'Quantity' }
]

notesToAdd.forEach(({ cell, note }) => {
  fWorksheet.getRange(cell).createOrUpdateNote({
    note,
    width: 160,
    height: 80,
    show: false
  })
})
```

## Troubleshooting

### Note tidak muncul

**Penyebab:**
- Cell reference salah
- Note text kosong
- Plugin tidak terinstall

**Solusi:**
```typescript
// Validate cell reference
try {
  const fRange = fWorksheet.getRange('A1')
  if (!fRange) {
    console.error('Invalid cell reference')
    return
  }
  
  // Validate note text
  const noteText = userInput.trim()
  if (!noteText) {
    console.error('Note text is empty')
    return
  }
  
  fRange.createOrUpdateNote({
    note: noteText,
    width: 160,
    height: 100,
    show: true
  })
} catch (error) {
  console.error('Error adding note:', error)
}
```

### Note tidak bisa dihapus

**Penyebab:**
- Cell tidak memiliki note
- Range reference salah

**Solusi:**
```typescript
// Check if note exists
const note = fRange.getNote()
if (!note) {
  console.log('No note to delete')
  return
}

// Delete note
const success = fRange.deleteNote()
if (!success) {
  console.error('Failed to delete note')
}
```

### Event listener tidak trigger

**Penyebab:**
- Event name salah
- Listener tidak diregister dengan benar
- Event sudah di-cancel

**Solusi:**
```typescript
// Use correct event name
const disposable = univerAPI.addEvent(
  univerAPI.Event.SheetNoteAdd, // Correct event name
  (params) => {
    console.log('Note added:', params)
  }
)

// Verify listener is registered
if (!disposable) {
  console.error('Failed to register event listener')
}
```

## Referensi

- [Official Notes Documentation](https://docs.univer.ai/guides/sheets/features/notes)
- [Facade API Reference](https://reference.univer.ai/)
- [Events Documentation](https://reference.univer.ai/)

---

**Related Documentation:**
- [Comments](./comments.md)
- [General API](../core/general-api.md)
- [Sheets API](../core/sheets-api.md)
