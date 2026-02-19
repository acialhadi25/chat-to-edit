# Multi-Column ADD_COLUMN Fix

## Problem
When user clicked "✓ Tambah Kedua Kolom" button, the action failed with:
```
ADD_COLUMN: No column name found
Total changes generated: 0
No changes to apply
```

When clicking individual column buttons like "✓ Tambah Kolom Nomor Telepon", columns were added but named "New Column" instead of the actual column name.

## Root Causes

### Issue 1: Single-word regex pattern
The AI sent an action with:
- `type: "ADD_COLUMN"`
- `description: "Add Alamat and Nomor Telepon columns header only"`

But the ADD_COLUMN handler only extracted ONE column name, and the regex patterns only matched single words `(\w+)`:
- `/Add (\w+) column/i` - matches "Add Alamat column" ✅
- But fails on "Add Nomor Telepon column" ❌ (two words with space)

### Issue 2: FortuneSheet not reading column names from changes
The FortuneSheet ADD_COLUMN handler was looking for `action.params?.newColumnName` but the actual column names were in the `changes` array as `change.columnName`.

## Solutions

### Fix 1: Support multi-word column names in regex
Updated regex patterns in `src/utils/excelOperations.ts` to match multi-word column names:

```typescript
// OLD: /(\w+)\s+and\s+(\w+)\s+columns?/i
// NEW: /([A-Za-z\s]+?)\s+and\s+([A-Za-z\s]+?)\s+columns?/i

// OLD: /Add (\w+) column/i
// NEW: /Add\s+([A-Za-z\s]+?)\s+column/i
```

This now matches:
- "Alamat" ✅
- "Nomor Telepon" ✅
- "Status Pembayaran" ✅

### Fix 2: FortuneSheet reads column names from changes array
Updated FortuneSheet handler in `src/utils/fortuneSheetOperations.ts`:

```typescript
// OLD: Used action.params?.newColumnName (single column)
// NEW: Reads from action.changes array (supports multiple columns)

const columnsToAdd = action.changes
  .filter(c => c.type === 'COLUMN_ADD')
  .map(c => ({ col: c.col, name: c.columnName || c.newValue as string }));

columnsToAdd.forEach(({ col, name }) => {
  workbookRef.insertRowOrColumn('column', col, 1, 'rightbottom');
  workbookRef.setCellValue(0, col, name); // Use actual column name
});
```

## Behavior After Fix

### User Command: "buat kolom Alamat dan Nomor Telepon"
**Result**: Adds TWO column headers with correct names:
- Column H: "Alamat" ✅
- Column I: "Nomor Telepon" ✅

### User Command: "buat kolom Status Pembayaran"
**Result**: Adds ONE column header with correct name:
- "Status Pembayaran" ✅

### User Command: "buat kolom Alamat dan isi dengan data"
**Result**: Adds ONE column header WITH auto-filled address data (if pattern provided)

## Files Modified
- `chat-to-edit/src/utils/excelOperations.ts` - ADD_COLUMN handler (regex patterns)
- `chat-to-edit/src/utils/fortuneSheetOperations.ts` - ADD_COLUMN handler (read from changes array)

## Testing
1. Hard refresh browser: `Ctrl + F5`
2. Click "✓ Tambah Kedua Kolom" button
3. Should see both "Alamat" and "Nomor Telepon" columns added with correct names
4. Click "✓ Tambah Kolom Nomor Telepon" button
5. Should see "Nomor Telepon" column added (not "New Column")

## Related Issues
- TASK 7: AI Proactive Behavior (user wants headers only by default)
- TASK 8: Pattern-based generation (for when user explicitly requests data)
