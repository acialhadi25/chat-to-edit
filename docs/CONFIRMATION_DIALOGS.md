# Confirmation Dialogs for Destructive Operations

## Overview

This document describes the confirmation dialog system implemented for AI Actions that perform destructive operations. The system ensures users are aware of and explicitly approve operations that permanently modify or delete data.

## Implementation Date

2025-02-25

## Requirements

- **Requirement 2.3.7**: AI Destructive Operation Confirmation - For any destructive operation (delete rows, clear data, replace all), the AI should request user confirmation before executing the operation
- **Property 31**: AI Destructive Operation Confirmation - For any destructive operation, the AI should request user confirmation before executing

## Destructive Operations

The following AI Actions are classified as destructive and require user confirmation:

### 1. DELETE_ROW
- **Description**: Permanently removes one or more rows from the spreadsheet
- **Impact**: Deletes all data in the affected rows
- **Confirmation Message**: "This will permanently delete N row(s) from your spreadsheet."

### 2. DELETE_COLUMN
- **Description**: Permanently removes a column and all its data
- **Impact**: Deletes the column header and all cell values in that column
- **Confirmation Message**: "This will permanently delete the '[Column Name]' column and all its data."

### 3. REMOVE_EMPTY_ROWS
- **Description**: Removes all rows that have no data in any cell
- **Impact**: Changes the data structure by removing empty rows
- **Confirmation Message**: "This will permanently remove all empty rows from your spreadsheet."

### 4. DATA_TRANSFORM (conditional)
- **Description**: Transforms text in a column (uppercase, lowercase, titlecase)
- **Impact**: Replaces original values with transformed values
- **Confirmation Required**: Only if more than 10 cells will be affected
- **Confirmation Message**: "This will transform all text in [Column] to [transform type]. Original values will be replaced."

## Architecture

### Components

#### 1. ConfirmationDialog Component
**Location**: `src/components/dashboard/ConfirmationDialog.tsx`

A reusable dialog component that displays confirmation prompts for destructive operations.

**Props**:
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Callback when dialog state changes
- `action: AIAction | null` - The action requiring confirmation
- `onConfirm: () => void` - Callback when user confirms
- `onCancel: () => void` - Callback when user cancels

**Features**:
- Action-specific titles and descriptions
- Warning messages for irreversible operations
- Red "Confirm" button to emphasize destructive nature
- Clear "Cancel" button for easy opt-out

#### 2. Action Confirmation Utilities
**Location**: `src/utils/actionConfirmation.ts`

Utility functions for determining if an action requires confirmation and calculating its impact.

**Functions**:

##### `requiresConfirmation(action: AIAction, data: ExcelData): boolean`
Determines if an action requires user confirmation.

**Logic**:
- `DELETE_ROW`: Always requires confirmation
- `DELETE_COLUMN`: Always requires confirmation
- `REMOVE_EMPTY_ROWS`: Always requires confirmation
- `DATA_TRANSFORM`: Requires confirmation if > 10 cells affected
- All other actions: No confirmation required

##### `getActionImpact(action: AIAction, data: ExcelData): ActionImpact`
Calculates the impact of a destructive action.

**Returns**:
```typescript
{
  type: string;
  affectedRows?: number;
  affectedColumns?: number;
  affectedCells?: number;
}
```

### Integration with ExcelDashboard

The confirmation system is integrated into the `ExcelDashboard` component's action execution flow:

1. **Action Submission**: When an AI Action is submitted via `handleApplyAction`
2. **Confirmation Check**: The system checks if the action requires confirmation using `requiresConfirmation()`
3. **Dialog Display**: If confirmation is required:
   - The action is stored in `pendingAction` state
   - The confirmation dialog is shown
   - Execution is paused
4. **User Decision**:
   - **Confirm**: Action is executed via `executeAction()`
   - **Cancel**: Action is marked as rejected, user is notified
5. **Execution**: If no confirmation is needed, action executes immediately

## User Experience

### Confirmation Flow

```
User requests destructive operation
         ↓
AI generates action
         ↓
System checks if confirmation required
         ↓
    [Requires?]
    /         \
  Yes          No
   ↓            ↓
Show dialog   Execute
   ↓
User decides
   ↓
[Confirm/Cancel]
   /         \
Confirm    Cancel
   ↓          ↓
Execute    Reject
```

### Dialog Appearance

The confirmation dialog features:
- **Clear Title**: Describes the operation (e.g., "Delete Row(s)")
- **Detailed Description**: Explains what will happen
- **Warning Message**: Highlights that the action cannot be undone (except via Undo)
- **Visual Emphasis**: Red confirm button to indicate destructive nature
- **Easy Cancellation**: Prominent cancel button

### Example Dialogs

#### DELETE_ROW
```
Title: Delete Row(s)
Description: This will permanently delete 3 rows from your spreadsheet.
Warning: ⚠️ This action cannot be undone (except via Undo).
Buttons: [Cancel] [Confirm]
```

#### DATA_TRANSFORM
```
Title: Transform Data
Description: This will transform all text in column A to uppercase.
Warning: ⚠️ Original values will be replaced. This action cannot be undone (except via Undo).
Buttons: [Cancel] [Confirm]
```

## Testing

### Unit Tests

#### actionConfirmation.test.ts
Tests the confirmation logic:
- ✅ Correctly identifies actions requiring confirmation
- ✅ Correctly identifies actions NOT requiring confirmation
- ✅ Calculates impact for DELETE_ROW
- ✅ Calculates impact for DELETE_COLUMN
- ✅ Calculates impact for REMOVE_EMPTY_ROWS
- ✅ Calculates impact for DATA_TRANSFORM
- ✅ Handles DATA_TRANSFORM threshold (> 10 cells)

**Test Coverage**: 13 tests, all passing

#### ConfirmationDialog.test.tsx
Tests the dialog component:
- ✅ Renders DELETE_ROW confirmation
- ✅ Renders DELETE_COLUMN confirmation
- ✅ Renders REMOVE_EMPTY_ROWS confirmation
- ✅ Renders DATA_TRANSFORM confirmation
- ✅ Handles multiple row deletion
- ✅ Calls onConfirm when confirmed
- ✅ Calls onCancel when cancelled
- ✅ Doesn't render when closed
- ✅ Doesn't render when action is null
- ✅ Renders generic confirmation for unknown actions

**Test Coverage**: 10 tests, all passing

### Integration Testing

To test the confirmation flow manually:

1. **DELETE_ROW**:
   - Upload a spreadsheet
   - Ask AI: "Delete row 5"
   - Verify confirmation dialog appears
   - Click "Confirm" → Row should be deleted
   - Undo and try again, click "Cancel" → Row should remain

2. **DELETE_COLUMN**:
   - Ask AI: "Delete the Status column"
   - Verify confirmation dialog appears
   - Test both confirm and cancel paths

3. **REMOVE_EMPTY_ROWS**:
   - Create a spreadsheet with empty rows
   - Ask AI: "Remove empty rows"
   - Verify confirmation dialog appears

4. **DATA_TRANSFORM**:
   - Create a spreadsheet with > 10 text cells in a column
   - Ask AI: "Transform column A to uppercase"
   - Verify confirmation dialog appears
   - Create a spreadsheet with < 10 text cells
   - Ask AI: "Transform column B to uppercase"
   - Verify NO confirmation dialog (executes immediately)

## Security Considerations

1. **No Bypass**: Destructive operations cannot bypass confirmation
2. **Clear Communication**: Users are always informed of the impact
3. **Explicit Consent**: Users must explicitly click "Confirm"
4. **Undo Available**: All operations support undo/redo
5. **Action Logging**: All confirmations and cancellations are logged

## Future Enhancements

Potential improvements for future iterations:

1. **Preview Mode**: Show a preview of what will be deleted/changed
2. **Batch Confirmation**: Allow confirming multiple similar operations at once
3. **User Preferences**: Allow power users to disable confirmations for specific actions
4. **Confirmation History**: Track which operations users typically confirm/cancel
5. **Smart Thresholds**: Adjust confirmation thresholds based on user behavior
6. **Undo Reminder**: Remind users they can undo if they make a mistake

## Related Files

- `src/components/dashboard/ConfirmationDialog.tsx` - Dialog component
- `src/utils/actionConfirmation.ts` - Confirmation logic
- `src/pages/ExcelDashboard.tsx` - Integration point
- `src/utils/__tests__/actionConfirmation.test.ts` - Unit tests
- `src/components/dashboard/__tests__/ConfirmationDialog.test.tsx` - Component tests

## References

- [Design Document - Property 31](../.kiro/specs/univer-integration/design.md)
- [Requirements - 2.3.7](../.kiro/specs/univer-integration/requirements.md)
- [Tasks - 10.2](../.kiro/specs/univer-integration/tasks.md)
- [Error Handling Documentation](./AI_ACTIONS_ERROR_HANDLING.md)

---

**Document Version**: 1.0  
**Last Updated**: 2025-02-25  
**Status**: Complete  
**Test Coverage**: 23 tests, all passing
