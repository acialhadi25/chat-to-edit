# Column Resize Feature - Usage Guide

## Overview

The ResponsiveExcelGrid component now supports column resizing functionality, allowing users to adjust column widths by dragging resize handles on column headers.

## Features

- **Drag-to-resize**: Users can drag the right edge of column headers to resize columns
- **Minimum width**: Columns have a minimum width of 50px to ensure usability
- **Persistence**: Column widths can be persisted in the ExcelData state
- **Mobile-friendly**: Resize handles are hidden on mobile devices (touch interfaces)
- **Frozen columns**: Works seamlessly with frozen columns feature

## Implementation

### 1. ExcelData Type Extension

The `ExcelData` interface now includes an optional `columnWidths` property:

```typescript
interface ExcelData {
  // ... other properties
  columnWidths?: { [columnIndex: number]: number }; // Custom column widths in pixels
}
```

### 2. Component Props

The `ResponsiveExcelGrid` component accepts a new optional prop:

```typescript
interface ResponsiveExcelGridProps {
  // ... other props
  onColumnWidthChange?: (columnIndex: number, width: number) => void;
}
```

### 3. Usage Example

```typescript
import { useState } from 'react';
import { ResponsiveExcelGrid } from '@/components/excel/ResponsiveExcelGrid';
import { ExcelData } from '@/types/excel';

function ExcelEditor() {
  const [excelData, setExcelData] = useState<ExcelData>({
    fileName: 'example.xlsx',
    sheets: ['Sheet1'],
    currentSheet: 'Sheet1',
    headers: ['Name', 'Email', 'Phone', 'Address'],
    rows: [
      ['John Doe', 'john@example.com', '555-1234', '123 Main St'],
      ['Jane Smith', 'jane@example.com', '555-5678', '456 Oak Ave'],
    ],
    formulas: {},
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    // Optional: Set initial column widths
    columnWidths: {
      0: 150, // Name column
      1: 200, // Email column
      2: 120, // Phone column
      3: 250, // Address column
    },
  });

  const handleColumnWidthChange = (columnIndex: number, width: number) => {
    setExcelData(prev => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [columnIndex]: width,
      },
    }));
  };

  const handleCellChange = (col: number, row: number, value: string | number | null) => {
    setExcelData(prev => {
      const newRows = [...prev.rows];
      newRows[row] = [...newRows[row]];
      newRows[row][col] = value;
      return { ...prev, rows: newRows };
    });
  };

  return (
    <ResponsiveExcelGrid
      data={excelData}
      onCellChange={handleCellChange}
      onColumnWidthChange={handleColumnWidthChange}
      isMobile={false}
    />
  );
}
```

## User Interaction

### Desktop

1. **Hover over column header**: A resize handle appears on the right edge of the header
2. **Click and drag**: Click on the resize handle and drag left or right to adjust width
3. **Release**: Release the mouse button to apply the new width
4. **Visual feedback**: The resize handle highlights in blue when hovering or dragging

### Mobile

- Resize handles are automatically hidden on mobile devices
- Column widths remain fixed at the default mobile width (120px)
- This prevents accidental resizing on touch interfaces

## Persistence

To persist column widths across sessions:

```typescript
// Save to localStorage
const saveColumnWidths = (data: ExcelData) => {
  if (data.columnWidths) {
    localStorage.setItem(
      `columnWidths_${data.fileName}`,
      JSON.stringify(data.columnWidths)
    );
  }
};

// Load from localStorage
const loadColumnWidths = (fileName: string): { [key: number]: number } | undefined => {
  const saved = localStorage.getItem(`columnWidths_${fileName}`);
  return saved ? JSON.parse(saved) : undefined;
};

// Usage
const handleColumnWidthChange = (columnIndex: number, width: number) => {
  const updatedData = {
    ...excelData,
    columnWidths: {
      ...excelData.columnWidths,
      [columnIndex]: width,
    },
  };
  setExcelData(updatedData);
  saveColumnWidths(updatedData);
};
```

## Integration with Supabase

To persist column widths in Supabase:

```typescript
// Update the file_history table schema to include column_widths
// ALTER TABLE file_history ADD COLUMN column_widths JSONB;

const saveToSupabase = async (fileId: string, columnWidths: { [key: number]: number }) => {
  const { error } = await supabase
    .from('file_history')
    .update({ column_widths: columnWidths })
    .eq('id', fileId);
    
  if (error) {
    console.error('Error saving column widths:', error);
  }
};

const loadFromSupabase = async (fileId: string) => {
  const { data, error } = await supabase
    .from('file_history')
    .select('column_widths')
    .eq('id', fileId)
    .single();
    
  if (error) {
    console.error('Error loading column widths:', error);
    return undefined;
  }
  
  return data?.column_widths;
};
```

## Styling

The resize handle uses Tailwind CSS classes for styling:

```css
/* Default state */
.cursor-col-resize {
  cursor: col-resize;
  width: 4px;
}

/* Hover state */
.hover:bg-blue-500 {
  background-color: rgb(59 130 246);
}

/* Active/dragging state */
.bg-blue-500 {
  background-color: rgb(59 130 246);
}
```

## Accessibility

- **Keyboard support**: Currently resize is mouse-only. Future enhancement could add keyboard support (Arrow keys to resize)
- **Screen readers**: The resize handle is a visual affordance and doesn't require ARIA labels
- **Focus indicators**: The resize handle highlights on hover to indicate interactivity

## Performance Considerations

- **Virtual scrolling**: Column resize works seamlessly with virtual scrolling
- **Debouncing**: Consider debouncing the `onColumnWidthChange` callback if saving to a database
- **Memory**: Column widths are stored as a simple object, minimal memory overhead

## Limitations

- **Mobile**: Resize functionality is disabled on mobile devices
- **Minimum width**: Columns cannot be resized below 50px
- **Maximum width**: No maximum width enforced (consider adding if needed)
- **Batch resize**: Currently only one column can be resized at a time

## Future Enhancements

- [ ] Double-click to auto-fit column width to content
- [ ] Keyboard support for resizing (Alt + Arrow keys)
- [ ] Resize multiple columns at once
- [ ] Column width presets (narrow, medium, wide)
- [ ] Touch-friendly resize on tablets
- [ ] Undo/redo support for column resize operations

## Testing

The column resize feature includes comprehensive unit tests:

```bash
npm test -- ResponsiveExcelGrid.columnResize.test.tsx
```

Test coverage includes:
- ✅ Rendering resize handles on desktop
- ✅ Hiding resize handles on mobile
- ✅ Handling resize interactions
- ✅ Using custom column widths from data
- ✅ Enforcing minimum width
- ✅ Updating widths when data changes
- ✅ Working with frozen columns
- ✅ Handling resize state correctly

## Troubleshooting

### Resize handle not visible
- Ensure `isMobile={false}` is set
- Check that the component is rendering headers
- Verify CSS classes are not being overridden

### Column widths not persisting
- Ensure `onColumnWidthChange` callback is provided
- Verify the callback updates the parent state
- Check that `data.columnWidths` is being passed to the component

### Resize not working smoothly
- Check browser console for errors
- Ensure mouse events are not being blocked by other elements
- Verify z-index of resize handle is higher than other elements

## Related Features

- **Freeze Panes**: Column resize works with frozen columns
- **Virtual Scrolling**: Resize handles work with virtualized columns
- **Cell Selection**: Resizing doesn't interfere with cell selection
- **Touch Gestures**: Resize is disabled when touch gestures are enabled
