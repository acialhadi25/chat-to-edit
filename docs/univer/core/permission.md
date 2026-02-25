# Univer Permission Control Documentation

## Overview

Univer provides comprehensive permission control for workbooks, worksheets, and ranges. This enables restricting user operations like editing, viewing, copying, filtering, and more. When users attempt operations without permission, execution is halted and they receive permission prompts.

## Important Notes

- Univer provides extendable foundational capabilities, not customized features
- For persistence or organizational structures, implement custom storage and integration
- Custom plugins required for advanced permission management
- Permission information may appear empty without custom API integration

## Workbook Permissions

### Set Workbook Permission

```typescript
const fWorkbook = univerAPI.getActiveWorkbook()
const workbookPermission = fWorkbook.getWorkbookPermission()

// Set the workbook to be non-editable
await workbookPermission.setPoint(univerAPI.Enum.WorkbookPermissionPoint.Edit, false)
```

### Using Predefined Modes

```typescript
const workbookPermission = fWorkbook.getWorkbookPermission()

// Set to owner mode
await workbookPermission.setMode('owner')

// Set to editor mode
await workbookPermission.setMode('editor')

// Set to viewer mode
await workbookPermission.setMode('viewer')

// Set to commenter mode
await workbookPermission.setMode('commenter')
```

### Shortcut Methods

```typescript
// Set to read-only mode
await workbookPermission.setReadOnly()

// Set to editable mode
await workbookPermission.setEditable()
```

### Get Permission Status

```typescript
// Get specific permission point
const canPrint = workbookPermission.getPoint(univerAPI.Enum.WorkbookPermissionPoint.Print)

// Get all permission points
const snapshot = workbookPermission.getSnapshot()

// Check if editable
const canEdit = workbookPermission.canEdit()
```

### Subscribe to Permission Changes

```typescript
const unsubscribe = workbookPermission.subscribe((snapshot) => {
  console.log('Permission changed:', snapshot)
})

// Remove subscription
unsubscribe()
```

## Worksheet Permissions

### Get Worksheet Permission

```typescript
const fWorksheet = fWorkbook.getActiveSheet()
const worksheetPermission = fWorksheet.getWorksheetPermission()
```

### Worksheet Protection

```typescript
// Set worksheet protection
const permissionId = await worksheetPermission.protect({
  allowedUsers: ['user1', 'user2'],
  name: 'My Worksheet Protection',
})

// Check if protected
const isProtected = worksheetPermission.isProtected()

// Remove protection
if (isProtected) {
  await worksheetPermission.unprotect()
}
```

### Range Protection

```typescript
// Protect multiple ranges with different settings
const rules = await worksheetPermission.protectRanges([
  {
    ranges: [fWorksheet.getRange('A1:B2')],
    options: { 
      name: 'Protected Area 1', 
      allowEdit: false, 
      allowViewByOthers: true 
    },
  },
  {
    ranges: [fWorksheet.getRange('C3:D4')],
    options: { 
      name: 'Protected Area 2', 
      allowEdit: true, 
      allowViewByOthers: false, 
      allowedUsers: ['user1'] 
    },
  },
])

// Get all protection rules
const rules = await worksheetPermission.listRangeProtectionRules()

// Remove protection
await worksheetPermission.unprotectRules([rules[0].id])
```

### Set Worksheet Permission Points

```typescript
// Must create protection first
await worksheetPermission.protect()

// Set specific permission
await worksheetPermission.setPoint(
  univerAPI.Enum.WorksheetPermissionPoint.InsertRow, 
  false
)
```

### Using Predefined Modes

```typescript
await worksheetPermission.protect()

// Set to editable mode
await worksheetPermission.setMode('editable')

// Set to read-only mode
await worksheetPermission.setMode('readOnly')

// Set to filter/sort only mode
await worksheetPermission.setMode('filterOnly')

// Custom mode
await worksheetPermission.applyConfig({
  mode: 'readOnly',
  points: {
    [univerAPI.Enum.WorksheetPermissionPoint.InsertRow]: true,
    [univerAPI.Enum.WorksheetPermissionPoint.InsertColumn]: true,
  },
})
```

### Get Worksheet Permission Status

```typescript
// Get specific permission
const canInsertRow = worksheetPermission.getPoint(
  univerAPI.Enum.WorksheetPermissionPoint.InsertRow
)

// Get all permissions
const snapshot = worksheetPermission.getSnapshot()

// Check if editable
const canEdit = worksheetPermission.canEdit()

// Check if specific cell is editable
const canEditCell = worksheetPermission.canEditCell(row, col)

// Debug cell permission
const debugInfo = worksheetPermission.debugCellPermission(row, col)
```

## Range Permissions

### Get Range Permission

```typescript
const fRange = fWorksheet.getRange('A1:B2')
const rangePermission = fRange.getRangePermission()
```

### Set Range Protection

```typescript
// Protect range
const rule = await rangePermission.protect({
  name: 'My protected range',
  allowEdit: true,
  allowViewByOthers: false,
  allowedUsers: ['user1', 'user2'],
})

// Get protection rules
const rules = await rangePermission.listRules()

// Remove protection
await rangePermission.unprotect()
```

### Set Range Permission Points

```typescript
// Must create protection first
await rangePermission.protect({
  name: 'My protected range',
  allowEdit: true,
  allowViewByOthers: false,
  allowedUsers: ['user1', 'user2'],
})

// Set permission points
await rangePermission.setPoint(univerAPI.Enum.RangePermissionPoint.Edit, false)
await rangePermission.setPoint(univerAPI.Enum.RangePermissionPoint.View, true)
```

### Get Range Permission Status

```typescript
// Get specific permission
const canEdit = rangePermission.getPoint(univerAPI.Enum.RangePermissionPoint.Edit)

// Get all permissions
const snapshot = rangePermission.getSnapshot()

// Shortcut methods
const isProtected = rangePermission.isProtected()
const canEdit = rangePermission.canEdit()
const canView = rangePermission.canView()
const canDelete = rangePermission.canDelete()
```

## Permission Rule API

```typescript
const rules = await worksheetPermission.listRangeProtectionRules()
const rule = rules?.[0]

// Get rule ID
const ruleId = rule?.id

// Get rule ranges
const ranges = rule?.ranges

// Update rule ranges
await rule?.updateRanges([fWorksheet.getRange('A1:C3')])

// Remove rule
await rule?.remove()
```

## Protected Range Shadow Strategy

```typescript
// Set shadow strategy
univerAPI.setProtectedRangeShadowStrategy('non-editable')

// Get current strategy
console.log(univerAPI.getProtectedRangeShadowStrategy())

// Subscribe to strategy changes
const subscription = univerAPI.getProtectedRangeShadowStrategy$().subscribe((strategy) => {
  console.log('Strategy changed to:', strategy)
})

// Unsubscribe
subscription.unsubscribe()
```

## Collaborator Management

**Note**: Only available with collaborative editing and USIP service integration.

### Get Collaborators

```typescript
const collaborators = await workbookPermission.listCollaborators()
```

### Add Collaborators

```typescript
// Add multiple collaborators
await workbookPermission.setCollaborators([
  {
    user: { userID: 'user1', name: 'John Doe', avatar: 'https://...' },
    role: univerAPI.Enum.UnitRole.Editor,
  },
  {
    user: { userID: 'user2', name: 'Jane Smith', avatar: '' },
    role: univerAPI.Enum.UnitRole.Reader,
  },
])

// Add single collaborator
await workbookPermission.addCollaborator(
  { userID: 'user1', name: 'John Doe', avatar: 'https://...' },
  univerAPI.Enum.UnitRole.Editor,
)
```

### Update Collaborator

```typescript
await workbookPermission.updateCollaborator(
  { userID: 'user1', name: 'John Doe Updated', avatar: 'https://...' },
  univerAPI.Enum.UnitRole.Reader,
)
```

### Remove Collaborators

```typescript
// Remove multiple
await workbookPermission.removeCollaborators(['user1', 'user2'])

// Remove single
await workbookPermission.removeCollaborator('user1')
```

## Permission Points Reference

### Workbook Permission Points

| API Enum | Description |
|----------|-------------|
| `WorkbookPermissionPoint.Edit` | Can edit |
| `WorkbookPermissionPoint.View` | Can view |
| `WorkbookPermissionPoint.Print` | Can print |
| `WorkbookPermissionPoint.Export` | Can export |
| `WorkbookPermissionPoint.Share` | Can share |
| `WorkbookPermissionPoint.CopyContent` | Can copy |
| `WorkbookPermissionPoint.DuplicateFile` | Can duplicate |
| `WorkbookPermissionPoint.Comment` | Can comment |
| `WorkbookPermissionPoint.ManageCollaborator` | Can manage collaborators |
| `WorkbookPermissionPoint.CreateSheet` | Can create worksheets |
| `WorkbookPermissionPoint.DeleteSheet` | Can delete worksheets |
| `WorkbookPermissionPoint.RenameSheet` | Can rename worksheets |
| `WorkbookPermissionPoint.MoveSheet` | Can move worksheets |
| `WorkbookPermissionPoint.HideSheet` | Can hide worksheets |
| `WorkbookPermissionPoint.CopySheet` | Can copy worksheets |
| `WorkbookPermissionPoint.ViewHistory` | Can view history |
| `WorkbookPermissionPoint.ManageHistory` | Can manage history |
| `WorkbookPermissionPoint.RecoverHistory` | Can recover history |
| `WorkbookPermissionPoint.CreateProtection` | Can create protection |
| `WorkbookPermissionPoint.InsertRow` | Can insert rows |
| `WorkbookPermissionPoint.InsertColumn` | Can insert columns |
| `WorkbookPermissionPoint.DeleteRow` | Can delete rows |
| `WorkbookPermissionPoint.DeleteColumn` | Can delete columns |

### Worksheet Permission Points

| API Enum | Description |
|----------|-------------|
| `WorksheetPermissionPoint.Edit` | Can edit |
| `WorksheetPermissionPoint.View` | Can view |
| `WorksheetPermissionPoint.Copy` | Can copy |
| `WorksheetPermissionPoint.SetCellValue` | Can edit cell values |
| `WorksheetPermissionPoint.SetCellStyle` | Can edit cell styles |
| `WorksheetPermissionPoint.SetRowStyle` | Can set row styles |
| `WorksheetPermissionPoint.SetColumnStyle` | Can set column styles |
| `WorksheetPermissionPoint.InsertRow` | Can insert rows |
| `WorksheetPermissionPoint.InsertColumn` | Can insert columns |
| `WorksheetPermissionPoint.DeleteRow` | Can delete rows |
| `WorksheetPermissionPoint.DeleteColumn` | Can delete columns |
| `WorksheetPermissionPoint.Sort` | Can sort |
| `WorksheetPermissionPoint.Filter` | Can filter |
| `WorksheetPermissionPoint.PivotTable` | Can use pivot tables |
| `WorksheetPermissionPoint.InsertHyperlink` | Can use hyperlinks |
| `WorksheetPermissionPoint.ManageCollaborator` | Can manage collaborators |
| `WorksheetPermissionPoint.DeleteProtection` | Can delete protection |

### Range Permission Points

| API Enum | Description |
|----------|-------------|
| `RangePermissionPoint.Edit` | Can edit protected ranges |
| `RangePermissionPoint.View` | Can view content of protected ranges |
| `RangePermissionPoint.Delete` | Can delete protected ranges |

## Hide Permission Dialog

```typescript
univerAPI.setPermissionDialogVisible(false)
```

## References

- [Univer Official Permission Docs](https://docs.univer.ai/guides/sheets/features/core/permission)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/permission
**Content rephrased for compliance with licensing restrictions**
