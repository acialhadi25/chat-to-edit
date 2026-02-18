# Hooks Directory

This directory contains custom React hooks used throughout the ChaTtoEdit application.

## Available Hooks

### State Management Hooks

#### `useUndoRedo`

Manages undo/redo functionality for Excel data with a 50-entry history limit.

```typescript
const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo(initialData);

// Record a change
pushState(oldData, newData, 'edit', 'Updated cell A1');

// Undo/Redo
if (canUndo) {
  const previousData = undo();
}
```

**Features:**

- Maintains up to 50 history entries
- Clears redo history when new changes are made
- Provides descriptions for each state change

### Data Persistence Hooks

#### `useChatHistory`

Manages chat message persistence in Supabase.

```typescript
const { saveChatMessage, loadChatHistory } = useChatHistory();

// Save a message
await saveChatMessage({ role: 'user', content: 'Hello' }, fileHistoryId, '=SUM(A1:A10)');

// Load history
const messages = await loadChatHistory(fileHistoryId);
```

#### `useFileHistory`

Manages Excel file history and persistence.

```typescript
const { saveFileHistory, loadFileHistory, deleteFileHistory } = useFileHistory();

// Save file state
await saveFileHistory(excelData, 'My Spreadsheet');

// Load previous files
const files = await loadFileHistory();
```

### Authentication Hooks

#### `useAuth`

Provides authentication state and operations.

```typescript
const { user, session, signIn, signOut, signUp } = useAuth();

// Check if user is authenticated
if (user) {
  console.log('Logged in as:', user.email);
}

// Sign in
await signIn(email, password);

// Sign out
await signOut();
```

#### `useProfile`

Manages user profile data.

```typescript
const { profile, updateProfile, loading } = useProfile();

// Update profile
await updateProfile({ display_name: 'John Doe' });
```

### Performance Hooks

#### `useFormulaWorker`

Evaluates Excel formulas asynchronously using Web Workers.

```typescript
const { evaluateAsync } = useFormulaWorker();

// Evaluate formula without blocking UI
const result = await evaluateAsync('=SUM(A1:A10)', data);
```

**Benefits:**

- Non-blocking formula evaluation
- Automatic worker lifecycle management
- Fallback to main thread on error

### UI Hooks

#### `useMediaQuery`

Detects media query matches for responsive design.

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
```

#### `use-mobile`

Convenience hook for mobile detection.

```typescript
const isMobile = useMobile();

if (isMobile) {
  // Render mobile UI
}
```

#### `use-toast`

Manages toast notifications (from shadcn/ui).

```typescript
const { toast } = useToast();

toast({
  title: 'Success',
  description: 'File uploaded successfully',
});
```

### Business Logic Hooks

#### `useUsageLimit`

Tracks and enforces usage limits for subscription tiers.

```typescript
const { canPerformAction, incrementUsage, remainingActions } = useUsageLimit();

if (canPerformAction('excel_operation')) {
  // Perform operation
  await incrementUsage('excel_operation');
}
```

## Hook Patterns

### Custom Hook Guidelines

1. **Naming**: Always prefix with `use` (e.g., `useCustomHook`)
2. **Single Responsibility**: Each hook should have one clear purpose
3. **Composition**: Combine smaller hooks to build complex functionality
4. **Error Handling**: Always handle errors gracefully
5. **TypeScript**: Provide explicit return types

### Example Custom Hook Structure

```typescript
/**
 * Custom hook description
 *
 * @param param1 - Description of param1
 * @returns Object containing hook functions and state
 *
 * @example
 * const { data, loading, error } = useCustomHook(param1);
 */
export function useCustomHook(param1: string): UseCustomHookReturn {
  const [state, setState] = useState<StateType>(initialState);

  const doSomething = useCallback(() => {
    // Implementation
  }, [dependencies]);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return { state, doSomething };
}
```

## Testing

All hooks have corresponding test files in `__tests__/` directory:

```bash
# Run all hook tests
npm test src/hooks

# Run specific hook test
npm test src/hooks/__tests__/useUndoRedo.test.ts
```

### Testing Patterns

- Use `@testing-library/react-hooks` for hook testing
- Test all return values and side effects
- Mock external dependencies (Supabase, Web Workers)
- Test error scenarios

## Performance Considerations

- Use `useCallback` for function memoization
- Use `useMemo` for expensive computations
- Avoid unnecessary re-renders with proper dependencies
- Clean up side effects in `useEffect` return functions

## Contributing

When creating new hooks:

1. Follow naming conventions (`use` prefix)
2. Add comprehensive JSDoc comments
3. Write unit tests (70% coverage minimum)
4. Document in this README
5. Consider performance implications
6. Handle loading and error states
