# Univer Sheet - Comments (Komentar)

## Daftar Isi
- [Overview](#overview)
- [Instalasi](#instalasi)
- [API Reference](#api-reference)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Custom React Hooks](#custom-react-hooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Comments memungkinkan pengguna menambahkan komentar dan balasan dalam dokumen, memfasilitasi komunikasi dan kolaborasi antar anggota tim. Berbeda dengan Notes, Comments mendukung threading (replies) dan collaboration features.

### Fitur Utama
- ✅ Add/Update/Delete comments
- ✅ Reply to comments (threading)
- ✅ Resolve comments
- ✅ Rich text content support
- ✅ Collaboration support
- ✅ Event listeners untuk semua operasi
- ✅ Get comments by workbook, worksheet, atau range

### Perbedaan Comments vs Notes
- **Comments**: Sistem komentar lengkap dengan replies, resolve, dan collaboration
- **Notes**: Catatan sederhana pada cell tanpa threading

## Instalasi

### Preset Mode (Recommended)

```bash
npm install @univerjs/preset-sheets-thread-comment
```

```typescript
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { UniverSheetsThreadCommentPreset } from '@univerjs/preset-sheets-thread-comment'
import UniverPresetSheetsThreadCommentEnUS from '@univerjs/preset-sheets-thread-comment/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-thread-comment/lib/index.css'

const { univerAPI } = createUniver({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      UniverPresetSheetsCoreEnUS,
      UniverPresetSheetsThreadCommentEnUS
    ),
  },
  presets: [
    UniverSheetsCorePreset(),
    UniverSheetsThreadCommentPreset()
  ],
})
```

**Untuk Collaboration Feature:**
```typescript
UniverSheetsThreadCommentPreset({
  collaboration: true
})
```

### Plugin Mode

```bash
npm install @univerjs/thread-comment @univerjs/thread-comment-ui @univerjs/sheets-thread-comment @univerjs/sheets-thread-comment-ui
```

```typescript
import { LocaleType, mergeLocales, Univer } from '@univerjs/core'
import { UniverSheetsThreadCommentPlugin } from '@univerjs/sheets-thread-comment'
import { UniverSheetsThreadCommentUIPlugin } from '@univerjs/sheets-thread-comment-ui'
import SheetsThreadCommentUIEnUS from '@univerjs/sheets-thread-comment-ui/locale/en-US'
import { UniverThreadCommentPlugin } from '@univerjs/thread-comment'
import { UniverThreadCommentUIPlugin } from '@univerjs/thread-comment-ui'
import ThreadCommentUIEnUS from '@univerjs/thread-comment-ui/locale/en-US'

import '@univerjs/thread-comment-ui/lib/index.css'
import '@univerjs/sheets-thread-comment/facade'

const univer = new Univer({
  locale: LocaleType.En_US,
  locales: {
    [LocaleType.En_US]: mergeLocales(
      ThreadCommentUIEnUS,
      SheetsThreadCommentUIEnUS
    ),
  },
})

univer.registerPlugin(UniverThreadCommentPlugin)
univer.registerPlugin(UniverThreadCommentUIPlugin)
univer.registerPlugin(UniverSheetsThreadCommentPlugin)
univer.registerPlugin(UniverSheetsThreadCommentUIPlugin)
```

**Untuk Collaboration Feature:**
```bash
npm install @univerjs-pro/thread-comment-datasource
```

```typescript
import { UniverThreadCommentDataSourcePlugin } from '@univerjs-pro/thread-comment-datasource'

univer.registerPlugin(UniverThreadCommentDataSourcePlugin)
```

## API Reference

### Create Comment Builder

#### `univerAPI.newTheadComment()`
Membuat comment builder baru.

**Returns:** `FTheadCommentBuilder` - Comment builder instance

#### `FTheadCommentBuilder` Methods

| Method | Description |
|--------|-------------|
| `setContent(richText)` | Set konten comment (RichTextValue) |
| `setPersonId(id)` | Set person ID untuk comment |
| `setDateTime(date)` | Set tanggal dan waktu comment |
| `setId(id)` | Set ID comment |
| `setThreadId(id)` | Set thread ID comment |

### Get Comments

#### `FWorkbook.getComments()`
Get semua comments dalam workbook.

**Returns:** `FThreadComment[]` - Array of comments

#### `FWorksheet.getComments()`
Get semua comments dalam worksheet.

**Returns:** `FThreadComment[]` - Array of comments

#### `FRange.getComment()`
Get comment dari cell kiri-atas dalam range.

**Returns:** `FThreadComment | null` - Comment object

#### `FRange.getComments()`
Get semua comments dalam range.

**Returns:** `FThreadComment[]` - Array of comments

#### `FWorksheet.getCommentById(id)`
Get comment by ID.

**Parameters:**
- `id` (string): Comment ID

**Returns:** `FThreadComment | null` - Comment object

### Add Comment

#### `FRange.addCommentAsync(commentBuilder)`
Menambahkan comment ke cell kiri-atas dalam range.

**Parameters:**
- `commentBuilder` (FTheadCommentBuilder): Comment builder

**Returns:** `Promise<boolean>` - Success status

### Clear Comments

#### `FWorkbook.clearComments()`
Clear semua comments dalam workbook.

**Returns:** `Promise<boolean>` - Success status

#### `FWorksheet.clearComments()`
Clear semua comments dalam worksheet.

**Returns:** `Promise<boolean>` - Success status

#### `FRange.clearCommentAsync()`
Clear comment dari cell kiri-atas dalam range.

**Returns:** `Promise<boolean>` - Success status

#### `FRange.clearCommentsAsync()`
Clear semua comments dalam range.

**Returns:** `Promise<boolean>` - Success status

### FThreadComment Methods

| Method | Description |
|--------|-------------|
| `getIsRoot()` | Check apakah comment adalah root comment |
| `getCommentData()` | Get data comment |
| `getReplies()` | Get list replies untuk comment |
| `getRange()` | Get range comment |
| `getRichText()` | Get rich text content comment |
| `deleteAsync()` | Delete comment dan replies-nya |
| `updateAsync(richText)` | Update konten comment |
| `resolveAsync()` | Resolve comment |
| `replyAsync(commentBuilder)` | Reply ke comment |

### Event Listeners

Complete event type definitions dapat ditemukan di [Events](https://reference.univer.ai/).

| Event Name | Description |
|------------|-------------|
| `CommentAdded` | Triggered setelah comment ditambahkan |
| `BeforeCommentAdd` | Triggered sebelum comment ditambahkan |
| `CommentUpdated` | Triggered setelah comment diupdate |
| `BeforeCommentUpdate` | Triggered sebelum comment diupdate |
| `CommentDeleted` | Triggered setelah comment dihapus |
| `BeforeCommentDelete` | Triggered sebelum comment dihapus |
| `CommentResolved` | Triggered setelah status resolve berubah |
| `BeforeCommentResolve` | Triggered sebelum status resolve berubah |

## Contoh Penggunaan

### 1. Create dan Add Comment

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Create comment dengan rich text
const richText = univerAPI.newRichText().insertText('hello univer')
const commentBuilder = univerAPI.newTheadComment()
  .setContent(richText)

// Add comment ke cell A1
const cell = fWorksheet.getRange('A1')
const result = await cell.addCommentAsync(commentBuilder)

if (result) {
  console.log('Comment added successfully')
}
```

### 2. Create Comment dengan ID Custom

```typescript
const richText = univerAPI.newRichText().insertText('Important note')
const commentBuilder = univerAPI.newTheadComment()
  .setContent(richText)
  .setId('comment-001')
  .setPersonId('user-123')
  .setDateTime(new Date())

const cell = fWorksheet.getRange('B2')
await cell.addCommentAsync(commentBuilder)
```

### 3. Get All Comments

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()

// Get semua comments dalam workbook
const allComments = fWorkbook.getComments()
console.log('Total comments:', allComments.length)

// Get comments dalam active worksheet
const fWorksheet = fWorkbook.getActiveSheet()
const worksheetComments = fWorksheet.getComments()
console.log('Worksheet comments:', worksheetComments.length)

// Get comments dalam range
const fRange = fWorksheet.getRange('A1:B2')
const rangeComments = fRange.getComments()
console.log('Range comments:', rangeComments.length)
```

### 4. Get Comment by ID

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get comment by ID
const comment = fWorksheet.getCommentById('comment-001')

if (comment) {
  console.log('Comment found:', comment.getRichText().toPlainText())
  console.log('Is root:', comment.getIsRoot())
  console.log('Range:', comment.getRange().getA1Notation())
}
```

### 5. Reply to Comment

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get comment
const comment = fWorksheet.getCommentById('comment-001')

if (comment && comment.getIsRoot()) {
  // Create reply
  const replyText = univerAPI.newRichText().insertText('I agree with this!')
  const reply = univerAPI.newTheadComment().setContent(replyText)
  
  // Add reply
  await comment.replyAsync(reply)
  console.log('Reply added')
}
```

### 6. Get Replies

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get all comments
const comments = fWorksheet.getComments()

comments.forEach((comment) => {
  if (comment.getIsRoot()) {
    const replies = comment.getReplies()
    
    console.log('Comment:', comment.getRichText().toPlainText())
    console.log('Replies:', replies.length)
    
    replies.forEach((reply) => {
      console.log('  - Reply:', reply.getRichText().toPlainText())
    })
  }
})
```

### 7. Update Comment

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get comment by ID
const comment = fWorksheet.getCommentById('comment-001')

if (comment) {
  // Update content
  const newRichText = univerAPI.newRichText().insertText('Updated comment text')
  await comment.updateAsync(newRichText)
  
  console.log('Comment updated')
}
```

### 8. Resolve Comment

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Get comment
const comment = fWorksheet.getCommentById('comment-001')

if (comment) {
  // Resolve comment
  await comment.resolveAsync()
  console.log('Comment resolved')
}
```

### 9. Delete Comment

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Delete comment by ID
const comment = fWorksheet.getCommentById('comment-001')
if (comment) {
  await comment.deleteAsync()
  console.log('Comment deleted')
}

// Clear all comments in range
const fRange = fWorksheet.getRange('A1:B2')
await fRange.clearCommentsAsync()
```

### 10. Complete Workflow Example

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const fWorksheet = fWorkbook.getActiveSheet()

// Create dan add comment
const richText = univerAPI.newRichText().insertText('hello univer')
const commentBuilder = univerAPI.newTheadComment()
  .setContent(richText)
  .setId('mock-comment-id')

const cell = fWorksheet.getRange('A1')
await cell.addCommentAsync(commentBuilder)

// Update dan reply setelah 3 detik
setTimeout(async () => {
  const comment = fWorksheet.getCommentById('mock-comment-id')
  
  // Update comment
  const newRichText = univerAPI.newRichText().insertText('Hello Univer AI')
  await comment.updateAsync(newRichText)
  
  // Add reply
  const replyText = univerAPI.newRichText().insertText('Hello Univer AI! GO! GO! GO!')
  const reply = univerAPI.newTheadComment().setContent(replyText)
  await comment.replyAsync(reply)
}, 3000)

// Resolve dan delete setelah 6 detik
setTimeout(async () => {
  const comment = fWorksheet.getCommentById('mock-comment-id')
  await comment.resolveAsync()
  await comment.deleteAsync()
}, 6000)
```

### 11. Event Listener - Comment Added

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.CommentAdded,
  (params) => {
    const { comment, workbook, worksheet, row, col } = params
    console.log(`Comment added at (${row}, ${col})`)
  }
)

// Remove listener
// disposable.dispose()
```

### 12. Event Listener - Before Comment Add (Cancelable)

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.BeforeCommentAdd,
  (params) => {
    const { comment, workbook, worksheet, row, col } = params
    
    // Validate comment content
    const content = comment.getRichText().toPlainText()
    if (content.length < 5) {
      console.log('Comment too short, canceling')
      params.cancel = true
    }
  }
)

// Remove listener
// disposable.dispose()
```

### 13. Event Listener - Comment Resolved

```typescript
const disposable = univerAPI.addEvent(
  univerAPI.Event.CommentResolved,
  (params) => {
    const { comment, row, col, resolved, workbook, worksheet } = params
    
    if (resolved) {
      console.log(`Comment at (${row}, ${col}) resolved`)
    } else {
      console.log(`Comment at (${row}, ${col}) unresolved`)
    }
  }
)

// Remove listener
// disposable.dispose()
```

## Custom React Hooks

### useCommentManager Hook

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useFacadeAPI } from './useFacadeAPI'

interface CommentInfo {
  id: string
  content: string
  row: number
  col: number
  cellNotation: string
  isRoot: boolean
  replyCount: number
}

export function useCommentManager() {
  const univerAPI = useFacadeAPI()
  const [comments, setComments] = useState<CommentInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Load semua comments
  const loadComments = useCallback(() => {
    if (!univerAPI) return

    const fWorkbook = univerAPI.getActiveWorkbook()
    const fWorksheet = fWorkbook.getActiveSheet()
    const commentList = fWorksheet.getComments()
    
    const commentInfos = commentList.map(comment => {
      const range = comment.getRange()
      return {
        id: comment.getCommentData().id,
        content: comment.getRichText().toPlainText(),
        row: range.getRow(),
        col: range.getColumn(),
        cellNotation: range.getA1Notation(),
        isRoot: comment.getIsRoot(),
        replyCount: comment.getIsRoot() ? comment.getReplies().length : 0
      }
    })
    
    setComments(commentInfos)
  }, [univerAPI])

  // Add comment
  const addComment = useCallback(async (
    cell: string,
    content: string
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const fRange = fWorksheet.getRange(cell)
      
      const richText = univerAPI.newRichText().insertText(content)
      const commentBuilder = univerAPI.newTheadComment()
        .setContent(richText)
        .setId(`comment-${Date.now()}`)
      
      const success = await fRange.addCommentAsync(commentBuilder)
      
      if (success) {
        loadComments()
      }
      
      return success
    } catch (error) {
      console.error('Error adding comment:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadComments])

  // Reply to comment
  const replyToComment = useCallback(async (
    commentId: string,
    replyContent: string
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const comment = fWorksheet.getCommentById(commentId)
      
      if (!comment) return false
      
      const replyText = univerAPI.newRichText().insertText(replyContent)
      const reply = univerAPI.newTheadComment().setContent(replyText)
      
      await comment.replyAsync(reply)
      loadComments()
      return true
    } catch (error) {
      console.error('Error replying to comment:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadComments])

  // Update comment
  const updateComment = useCallback(async (
    commentId: string,
    newContent: string
  ) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const comment = fWorksheet.getCommentById(commentId)
      
      if (!comment) return false
      
      const newRichText = univerAPI.newRichText().insertText(newContent)
      await comment.updateAsync(newRichText)
      
      loadComments()
      return true
    } catch (error) {
      console.error('Error updating comment:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadComments])

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const comment = fWorksheet.getCommentById(commentId)
      
      if (!comment) return false
      
      await comment.deleteAsync()
      loadComments()
      return true
    } catch (error) {
      console.error('Error deleting comment:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadComments])

  // Resolve comment
  const resolveComment = useCallback(async (commentId: string) => {
    if (!univerAPI) return false

    setLoading(true)
    try {
      const fWorkbook = univerAPI.getActiveWorkbook()
      const fWorksheet = fWorkbook.getActiveSheet()
      const comment = fWorksheet.getCommentById(commentId)
      
      if (!comment) return false
      
      await comment.resolveAsync()
      loadComments()
      return true
    } catch (error) {
      console.error('Error resolving comment:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [univerAPI, loadComments])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  return {
    comments,
    loading,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
    loadComments
  }
}
```

### Contoh Penggunaan Hook

```typescript
function CommentPanel() {
  const {
    comments,
    loading,
    addComment,
    replyToComment,
    deleteComment,
    resolveComment
  } = useCommentManager()
  
  const [selectedCell, setSelectedCell] = useState('A1')
  const [commentText, setCommentText] = useState('')

  const handleAddComment = async () => {
    if (!commentText) return

    const success = await addComment(selectedCell, commentText)
    
    if (success) {
      setCommentText('')
      console.log('Comment added!')
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
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Comment text"
        />
        <button onClick={handleAddComment} disabled={loading}>
          Add Comment
        </button>
      </div>
      
      <div>
        <h3>Comments ({comments.length})</h3>
        {comments.map(comment => (
          <div key={comment.id}>
            <strong>{comment.cellNotation}:</strong> {comment.content}
            {comment.isRoot && (
              <span> ({comment.replyCount} replies)</span>
            )}
            <button onClick={() => resolveComment(comment.id)}>
              Resolve
            </button>
            <button onClick={() => deleteComment(comment.id)}>
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

### 1. Comment Content Validation
```typescript
// ❌ Bad - no validation
await cell.addCommentAsync(commentBuilder)

// ✅ Good - validate content
const content = commentText.trim()
if (content.length > 0 && content.length <= 5000) {
  const richText = univerAPI.newRichText().insertText(content)
  const commentBuilder = univerAPI.newTheadComment().setContent(richText)
  await cell.addCommentAsync(commentBuilder)
}
```

### 2. Use Unique IDs
```typescript
// ✅ Good - generate unique IDs
const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const commentBuilder = univerAPI.newTheadComment()
  .setContent(richText)
  .setId(commentId)
```

### 3. Error Handling
```typescript
// ✅ Good - handle errors
try {
  const success = await cell.addCommentAsync(commentBuilder)
  
  if (!success) {
    console.error('Failed to add comment')
  }
} catch (error) {
  console.error('Error adding comment:', error)
}
```

### 4. Event Listener Cleanup
```typescript
// ✅ Good - cleanup listeners
useEffect(() => {
  const disposables = [
    univerAPI.addEvent(univerAPI.Event.CommentAdded, handleCommentAdded),
    univerAPI.addEvent(univerAPI.Event.CommentDeleted, handleCommentDeleted)
  ]
  
  return () => {
    disposables.forEach(d => d?.dispose())
  }
}, [univerAPI])
```

### 5. Check Root Before Reply
```typescript
// ✅ Good - validate before reply
const comment = fWorksheet.getCommentById(commentId)

if (comment && comment.getIsRoot()) {
  const reply = univerAPI.newTheadComment().setContent(replyText)
  await comment.replyAsync(reply)
} else {
  console.error('Cannot reply to non-root comment')
}
```

## Troubleshooting

### Comment tidak muncul

**Penyebab:**
- Cell reference salah
- Comment content kosong
- Plugin tidak terinstall

**Solusi:**
```typescript
// Validate cell and content
try {
  const fRange = fWorksheet.getRange('A1')
  if (!fRange) {
    console.error('Invalid cell reference')
    return
  }
  
  const content = commentText.trim()
  if (!content) {
    console.error('Comment content is empty')
    return
  }
  
  const richText = univerAPI.newRichText().insertText(content)
  const commentBuilder = univerAPI.newTheadComment().setContent(richText)
  
  await fRange.addCommentAsync(commentBuilder)
} catch (error) {
  console.error('Error adding comment:', error)
}
```

### Reply tidak bisa ditambahkan

**Penyebab:**
- Comment bukan root comment
- Comment ID tidak ditemukan

**Solusi:**
```typescript
// Validate comment exists and is root
const comment = fWorksheet.getCommentById(commentId)

if (!comment) {
  console.error('Comment not found')
  return
}

if (!comment.getIsRoot()) {
  console.error('Cannot reply to non-root comment')
  return
}

// Add reply
const reply = univerAPI.newTheadComment().setContent(replyText)
await comment.replyAsync(reply)
```

### Event listener tidak trigger

**Penyebab:**
- Event name salah
- Listener tidak diregister dengan benar

**Solusi:**
```typescript
// Use correct event name
const disposable = univerAPI.addEvent(
  univerAPI.Event.CommentAdded, // Correct event name
  (params) => {
    console.log('Comment added:', params)
  }
)

// Verify listener is registered
if (!disposable) {
  console.error('Failed to register event listener')
}
```

## Referensi

- [Official Comments Documentation](https://docs.univer.ai/guides/sheets/features/comments)
- [Facade API Reference](https://reference.univer.ai/)
- [Events Documentation](https://reference.univer.ai/)

---

**Related Documentation:**
- [Notes](./notes.md)
- [Collaboration](./collaboration.md)
- [Rich Text](../core/rich-text.md)
