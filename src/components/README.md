# Components Directory

This directory contains all React components used in the ChaTtoEdit application, organized by feature and responsibility.

## Structure

### `/ui/` - UI Components (shadcn/ui)

Reusable UI primitives based on Radix UI and styled with Tailwind CSS:

- **button.tsx** - Button component with variants
- **input.tsx** - Form input component
- **dialog.tsx** - Modal dialog component
- **dropdown-menu.tsx** - Dropdown menu component
- **toast.tsx** - Toast notification component
- And 40+ more UI components

These components follow the [shadcn/ui](https://ui.shadcn.com/) design system.

### `/dashboard/` - Dashboard Components

Main application dashboard and Excel-related components:

- **ExcelPreview.tsx** - Main Excel grid display with virtual scrolling
- **ChatInterface.tsx** - AI chat interface for natural language commands
- **ExcelUpload.tsx** - File upload component
- **FormulaBar.tsx** - Excel formula input bar
- **UndoRedoBar.tsx** - Undo/redo controls
- **QuickActionButtons.tsx** - Common action shortcuts
- **TemplateGallery.tsx** - Pre-built Excel templates
- **ChartPreview.tsx** - Data visualization component
- **MarkdownContent.tsx** - Markdown renderer for AI responses

### `/excel/` - Excel-Specific Components

Specialized Excel functionality components:

- **ResponsiveExcelGrid.tsx** - Mobile-optimized Excel grid with touch support
- **FreezePanesControl.tsx** - Freeze panes UI controls
- **FreezePanesExample.tsx** - Example/demo component for freeze panes

### `/landing/` - Landing Page Components

Marketing and landing page components:

- **Hero.tsx** - Hero section
- **Features.tsx** - Feature showcase
- **Pricing.tsx** - Pricing plans
- **Testimonials.tsx** - Customer testimonials
- **FAQ.tsx** - Frequently asked questions
- **Footer.tsx** - Site footer

### `/navigation/` - Navigation Components

Navigation and routing components:

- **MobileNavigation.tsx** - Mobile-optimized navigation menu

### `/chat/` - Chat Components

Chat-related components:

- **MobileChatDrawer.tsx** - Mobile chat drawer using Vaul

### Root Components

- **ErrorBoundary.tsx** - Error boundary for graceful error handling
- **ProtectedRoute.tsx** - Route guard for authenticated pages
- **NavLink.tsx** - Navigation link component

## Component Patterns

### Component Structure

```typescript
/**
 * Component description
 *
 * @param props - Component props
 * @returns JSX element
 */
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Props Interface

```typescript
interface ComponentProps {
  /** Description of prop1 */
  prop1: string;
  /** Description of prop2 */
  prop2?: number;
  /** Event handler */
  onEvent?: (data: EventData) => void;
}
```

## Key Components

### ExcelPreview

Main Excel grid component with features:

- Virtual scrolling for large datasets
- Cell selection and editing
- Formula bar integration
- Multi-sheet support
- Freeze panes
- Column resizing

```typescript
<ExcelPreview
  data={excelData}
  onCellChange={handleCellChange}
  selectedCells={selectedCells}
  onSelectionChange={handleSelectionChange}
/>
```

### ChatInterface

AI-powered chat interface:

- Natural language command input
- Streaming AI responses
- Action preview and application
- Chat history
- Search functionality

```typescript
<ChatInterface
  excelData={excelData}
  onApplyAction={handleApplyAction}
  fileHistoryId={fileHistoryId}
/>
```

### ResponsiveExcelGrid

Mobile-optimized Excel grid:

- Touch gesture support (pinch, pan)
- Responsive breakpoints
- Optimized row heights
- Virtual scrolling

```typescript
<ResponsiveExcelGrid
  data={excelData}
  onCellChange={handleCellChange}
  isMobile={isMobile}
/>
```

## Styling

Components use Tailwind CSS with the following conventions:

- **Utility-first**: Use Tailwind utility classes
- **Component variants**: Use `class-variance-authority` (cva) for variants
- **Responsive**: Mobile-first responsive design
- **Dark mode**: Support for dark mode via `next-themes`

### Example Styling

```typescript
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-input bg-background',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add aria-label where needed
- **Keyboard navigation**: Support Tab, Enter, Escape, Arrow keys
- **Focus indicators**: Visible focus states
- **Screen reader support**: Proper ARIA attributes

### Example Accessible Component

```typescript
<button
  aria-label="Upload Excel file"
  onClick={handleUpload}
  className="focus:ring-2 focus:ring-blue-500"
>
  <Upload className="h-4 w-4" />
  <span className="sr-only">Upload</span>
</button>
```

## Testing

Components have test files in `__tests__/` directories:

```bash
# Run all component tests
npm test src/components

# Run specific component test
npm test src/components/dashboard/__tests__/ChatInterface.test.tsx
```

### Testing Patterns

- Use `@testing-library/react` for component testing
- Test user interactions, not implementation details
- Use `renderWithProviders` helper for components with context
- Mock external dependencies (API calls, Supabase)

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcelPreview } from '../ExcelPreview';

describe('ExcelPreview', () => {
  it('should render Excel grid', () => {
    render(<ExcelPreview data={mockData} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('should handle cell click', async () => {
    const user = userEvent.setup();
    const onCellChange = vi.fn();

    render(<ExcelPreview data={mockData} onCellChange={onCellChange} />);

    const cell = screen.getByRole('gridcell', { name: /A1/i });
    await user.click(cell);

    expect(onCellChange).toHaveBeenCalled();
  });
});
```

## Performance

### Optimization Techniques

1. **Code Splitting**: Lazy load heavy components

   ```typescript
   const ChartPreview = lazy(() => import('./ChartPreview'));
   ```

2. **Memoization**: Use React.memo for expensive components

   ```typescript
   export const ExcelCell = memo(({ value, onChange }) => {
     // Component logic
   });
   ```

3. **Virtual Scrolling**: Use `@tanstack/react-virtual` for large lists

4. **Debouncing**: Debounce expensive operations
   ```typescript
   const debouncedSearch = useMemo(() => debounce(handleSearch, 300), []);
   ```

## Contributing

When creating new components:

1. Place in appropriate directory
2. Follow naming conventions (PascalCase)
3. Add TypeScript prop types
4. Add JSDoc comments
5. Ensure accessibility compliance
6. Write unit tests (60% coverage minimum)
7. Update this README if adding new categories
8. Use Tailwind CSS for styling
9. Support dark mode
10. Make responsive (mobile-first)
