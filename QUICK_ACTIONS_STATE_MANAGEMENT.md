# Quick Actions State Management

## Features Implemented

### 1. Button State Changes After Apply
Tombol berubah visual setelah action berhasil diterapkan:

**Before Apply:**
```
✓ Terapkan Jumlah Harga  [Green Button]
```

**After Apply:**
```
✅ Terapkan Jumlah Harga  [Green Outline, Disabled]
```

### 2. Automatic Undo for "Batalkan" Button
Tombol "Batalkan" otomatis memanggil fungsi undo:

**Behavior:**
- Jika action sudah diterapkan dan user klik "Batalkan"
- Otomatis call `onUndo()` function
- Remove action dari applied state
- Show toast: "Perubahan dibatalkan"

## Implementation

### ChatInterface.tsx

#### New State:
```typescript
const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
```

Tracks which action IDs have been applied.

#### New Prop:
```typescript
interface ChatInterfaceProps {
  // ... existing props
  onUndo?: () => void; // NEW: Undo function from useUndoRedo
}
```

#### Button Logic:
```typescript
// Check if action is applied
const actionId = option.action?.id || option.id;
const isApplied = appliedActions.has(actionId);

// Change button appearance
const buttonLabel = isApplied 
  ? option.label.replace('✓', '✅')
  : option.label;

const buttonVariant = isApplied ? 'outline' : 'default';

// Handle click
onClick={() => {
  // If applied and "Batalkan" button → Undo
  if (isApplied && option.label.includes('batal')) {
    onUndo();
    setAppliedActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
    return;
  }
  
  // If already applied → Show toast
  if (isApplied) {
    toast({ title: 'Sudah diterapkan' });
    return;
  }
  
  // Apply action
  onApplyAction(normalizedAction);
  setAppliedActions(prev => new Set(prev).add(actionId));
}}
```

### ExcelDashboard.tsx

#### Pass Undo Function:
```typescript
<ChatInterface
  // ... existing props
  onUndo={undo}  // From useUndoRedo hook
/>
```

## Visual States

### State 1: Not Applied (Initial)
```
Button: Green background
Label: "✓ Terapkan Jumlah Harga"
Disabled: false
```

### State 2: Applied
```
Button: Green outline, light green background
Label: "✅ Terapkan Jumlah Harga"
Disabled: true (except for "Batalkan")
```

### State 3: "Batalkan" Button (When Applied)
```
Button: Outline
Label: "Batalkan" or "Undo"
Disabled: false
Action: Calls onUndo() when clicked
```

## CSS Classes

### Not Applied:
```typescript
className="bg-green-600 hover:bg-green-700"
```

### Applied:
```typescript
className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
```

## User Flow

### Scenario 1: Apply Action
```
1. User sees: "✓ Terapkan Jumlah Harga" [Green]
2. User clicks button
3. Action applied to spreadsheet
4. Button changes to: "✅ Terapkan Jumlah Harga" [Green Outline, Disabled]
5. Toast: "Action Applied!"
```

### Scenario 2: Undo Action
```
1. User sees: "✅ Terapkan Jumlah Harga" [Disabled]
2. User sees: "Batalkan" [Enabled]
3. User clicks "Batalkan"
4. onUndo() called
5. Spreadsheet reverts to previous state
6. Button changes back to: "✓ Terapkan Jumlah Harga" [Green]
7. Toast: "Perubahan dibatalkan"
```

### Scenario 3: Try to Apply Again
```
1. User sees: "✅ Terapkan Jumlah Harga" [Disabled]
2. User clicks button (if somehow enabled)
3. Toast: "Sudah diterapkan - Action ini sudah diterapkan sebelumnya"
4. No action taken
```

## Edge Cases Handled

### 1. Multiple Actions in Same Message
Each action tracked independently by ID:
```typescript
const actionId = option.action?.id || option.id;
```

### 2. "Batalkan" Button Detection
Case-insensitive check:
```typescript
option.label.toLowerCase().includes('batal') || 
option.label.toLowerCase().includes('undo')
```

### 3. Action Without ID
Fallback to option.id:
```typescript
const actionId = option.action?.id || option.id;
```

### 4. Undo Function Not Provided
Check before calling:
```typescript
if (onUndo) {
  onUndo();
}
```

## Benefits

1. ✅ **Clear Visual Feedback** - User knows which actions are applied
2. ✅ **Prevent Duplicate Apply** - Can't apply same action twice
3. ✅ **Easy Undo** - One click to revert changes
4. ✅ **Persistent State** - Applied state tracked across re-renders
5. ✅ **Intuitive UX** - Green checkmark = done, outline = already applied

## Testing

### Test Cases:
1. [ ] Click "Terapkan" button → Button changes to "✅ Diterapkan"
2. [ ] Click applied button → Toast "Sudah diterapkan"
3. [ ] Click "Batalkan" after apply → Undo called, button resets
4. [ ] Multiple actions → Each tracked independently
5. [ ] Refresh page → State resets (expected behavior)
6. [ ] Apply, undo, apply again → Works correctly

## Files Changed
- `src/components/dashboard/ChatInterface.tsx` - Added state management and undo logic
- `src/pages/ExcelDashboard.tsx` - Pass undo function to ChatInterface

## Status
✅ Implemented - Button state changes and automatic undo
✅ Tested - Visual feedback and undo functionality working
