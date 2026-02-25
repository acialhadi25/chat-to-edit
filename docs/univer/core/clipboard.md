# Univer Clipboard Documentation

## Overview

Univer uses the Clipboard API to implement copy and paste functionality, supporting operations between external applications and Univer, as well as within Univer Sheets.

## Browser Compatibility

**Firefox Note**: Firefox does not support `clipboard.readText()`. In Firefox, Univer can only retrieve clipboard content from paste events, thus only supporting keyboard shortcut pasting.

**Security Requirement**: Due to modern browser security policies, the Clipboard API can only be used in secure contexts (HTTPS).

## Supported Operations

### Copy & Paste Scenarios

- Copying from external applications to Univer
- Copying from Univer to external applications
- Copying and pasting between Univer Sheets

### Selective Paste Options

- Paste values only
- Paste formats only
- Paste column widths only
- Paste content excluding borders only
- Paste formulas only

## Permission Control

### Disable Copy Functionality

You can disable copy functionality for users in a workbook or specific sheets through permission control.

```typescript
const workbookPermission = univerAPI.getActiveWorkbook()?.getWorkbookPermission()
const WorkbookCopyPermission = univerAPI.Enum.WorkbookPermissionPoint.CopyContent

if (workbookPermission) {
  workbookPermission.setPoint(WorkbookCopyPermission, false)
}
```

## Clipboard Events

### BeforeClipboardChange

Triggered before clipboard content changes. Use to monitor or modify clipboard content.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeClipboardChange, (params) => {
  const { text, html } = params
  console.log('Clipboard content:', text, html)
  
  // Cancel clipboard change if needed
  // params.cancel = true
})
```

### BeforeClipboardPaste

Triggered before content is pasted. Use to monitor or modify content before pasting.

```typescript
univerAPI.addEvent(univerAPI.Event.BeforeClipboardPaste, (params) => {
  const { text, html } = params
  console.log('Content to paste:', text, html)
  
  // Cancel paste operation if needed
  // params.cancel = true
})
```

### ClipboardChanged

Triggered after clipboard content has changed.

```typescript
univerAPI.addEvent(univerAPI.Event.ClipboardChanged, (params) => {
  const { text, html } = params
  console.log('New clipboard content:', text, html)
})
```

### ClipboardPasted

Triggered after content has been pasted.

```typescript
univerAPI.addEvent(univerAPI.Event.ClipboardPasted, (params) => {
  const { text, html } = params
  console.log('Pasted content:', text, html)
})
```

## Programmatic Copy & Paste

### Copy Range

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Copy range A1:B2
const fRange = fWorksheet.getRange('A1:B2')
fRange.activate().setValues([
  [1, 2],
  [3, 4],
])
await univerAPI.copy()
```

### Paste to Range

```typescript
// Paste to C1
const fRange2 = fWorksheet.getRange('C1')
fRange2.activate()
await univerAPI.paste()
```

### Using Commands

```typescript
import { CopyCommand, PasteCommand } from '@univerjs/ui'

univerAPI.executeCommand(CopyCommand.id)
univerAPI.executeCommand(PasteCommand.id)
```

## Best Practices

1. **Use HTTPS** - Clipboard API requires secure context
2. **Handle Firefox** - Provide keyboard shortcut instructions for Firefox users
3. **Validate clipboard data** - Check content before pasting
4. **Use permission control** - Restrict copy/paste when needed for security
5. **Listen to events** - Monitor clipboard operations for audit or validation

## Security Considerations

- Clipboard operations require user interaction in most browsers
- Some browsers may prompt users for clipboard access permission
- Always validate and sanitize clipboard content before processing
- Use permission control to restrict sensitive data copying

## References

- [Univer Official Clipboard Docs](https://docs.univer.ai/guides/sheets/features/core/clipboard)
- [Permission Control Documentation](./permission.md)
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/clipboard
**Content rephrased for compliance with licensing restrictions**
